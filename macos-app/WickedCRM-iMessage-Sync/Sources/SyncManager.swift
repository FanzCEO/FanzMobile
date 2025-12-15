import Foundation
import SQLite3
import Combine

@MainActor
class SyncManager: ObservableObject {
    static let shared = SyncManager()

    @Published var isSyncing = false
    @Published var lastSyncTime: Date?
    @Published var syncStatus: String = "Ready"
    @Published var messagesSynced: Int = 0
    @Published var isConnected = false
    @Published var errorMessage: String?

    private var syncTimer: Timer?
    private var lastMessageRowId: Int64 = 0

    // Settings
    @Published var serverURL: String {
        didSet { UserDefaults.standard.set(serverURL, forKey: "serverURL") }
    }
    @Published var apiKey: String {
        didSet { UserDefaults.standard.set(apiKey, forKey: "apiKey") }
    }
    @Published var syncInterval: TimeInterval {
        didSet { UserDefaults.standard.set(syncInterval, forKey: "syncInterval") }
    }
    @Published var autoSyncEnabled: Bool {
        didSet { UserDefaults.standard.set(autoSyncEnabled, forKey: "autoSyncEnabled") }
    }

    private init() {
        self.serverURL = UserDefaults.standard.string(forKey: "serverURL") ?? "http://localhost:8000"
        self.apiKey = UserDefaults.standard.string(forKey: "apiKey") ?? ""
        self.syncInterval = UserDefaults.standard.double(forKey: "syncInterval").nonZeroOr(30.0)
        self.autoSyncEnabled = UserDefaults.standard.bool(forKey: "autoSyncEnabled")
        self.lastMessageRowId = Int64(UserDefaults.standard.integer(forKey: "lastMessageRowId"))
    }

    // MARK: - Auto Sync

    func startAutoSync() {
        stopAutoSync()
        syncTimer = Timer.scheduledTimer(withTimeInterval: syncInterval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.syncNewMessages()
            }
        }
        Task {
            await syncNewMessages()
        }
    }

    func stopAutoSync() {
        syncTimer?.invalidate()
        syncTimer = nil
    }

    // MARK: - Sync Operations

    func syncNewMessages() async {
        guard !isSyncing else { return }
        guard !serverURL.isEmpty else {
            errorMessage = "Server URL not configured"
            return
        }

        isSyncing = true
        syncStatus = "Syncing..."
        errorMessage = nil

        do {
            let messages = try readNewMessages()

            if messages.isEmpty {
                syncStatus = "No new messages"
            } else {
                var synced = 0
                for message in messages {
                    do {
                        try await sendToServer(message)
                        synced += 1
                        lastMessageRowId = max(lastMessageRowId, message.rowId)
                        UserDefaults.standard.set(Int(lastMessageRowId), forKey: "lastMessageRowId")
                    } catch {
                        print("Failed to sync message: \(error)")
                    }
                }
                messagesSynced += synced
                syncStatus = "Synced \(synced) messages"
            }

            lastSyncTime = Date()
            isConnected = true
        } catch {
            syncStatus = "Sync failed"
            errorMessage = error.localizedDescription
            isConnected = false
        }

        isSyncing = false
    }

    func testConnection() async -> Bool {
        guard let url = URL(string: "\(serverURL)/health") else { return false }

        do {
            let (_, response) = try await URLSession.shared.data(from: url)
            if let httpResponse = response as? HTTPURLResponse {
                isConnected = httpResponse.statusCode == 200
                return isConnected
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isConnected = false
        return false
    }

    // MARK: - iMessage Database

    private func readNewMessages() throws -> [IMessage] {
        let dbPath = "\(NSHomeDirectory())/Library/Messages/chat.db"

        guard FileManager.default.fileExists(atPath: dbPath) else {
            throw SyncError.databaseNotFound
        }

        var db: OpaquePointer?
        guard sqlite3_open_v2(dbPath, &db, SQLITE_OPEN_READONLY, nil) == SQLITE_OK else {
            throw SyncError.databaseOpenFailed
        }
        defer { sqlite3_close(db) }

        let query = """
            SELECT
                m.ROWID,
                m.text,
                m.is_from_me,
                m.date,
                m.service,
                h.id as handle_id
            FROM message m
            LEFT JOIN handle h ON m.handle_id = h.ROWID
            WHERE m.ROWID > ?
            ORDER BY m.ROWID ASC
            LIMIT 100
        """

        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, query, -1, &stmt, nil) == SQLITE_OK else {
            throw SyncError.queryFailed
        }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_int64(stmt, 1, lastMessageRowId)

        var messages: [IMessage] = []

        while sqlite3_step(stmt) == SQLITE_ROW {
            let rowId = sqlite3_column_int64(stmt, 0)
            let text = sqlite3_column_text(stmt, 1).map { String(cString: $0) } ?? ""
            let isFromMe = sqlite3_column_int(stmt, 2) == 1
            let date = sqlite3_column_int64(stmt, 3)
            let service = sqlite3_column_text(stmt, 4).map { String(cString: $0) } ?? "iMessage"
            let handleId = sqlite3_column_text(stmt, 5).map { String(cString: $0) } ?? ""

            // Convert Apple timestamp to Unix timestamp
            let unixTimestamp = Double(date) / 1_000_000_000.0 + 978307200.0

            messages.append(IMessage(
                rowId: rowId,
                text: text,
                isFromMe: isFromMe,
                timestamp: Date(timeIntervalSince1970: unixTimestamp),
                service: service,
                handleId: handleId
            ))
        }

        return messages
    }

    // MARK: - API

    private func sendToServer(_ message: IMessage) async throws {
        guard let url = URL(string: "\(serverURL)/api/messages/sync") else {
            throw SyncError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if !apiKey.isEmpty {
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        }

        let payload: [String: Any] = [
            "body": message.text,
            "channel": message.service.lowercased(),
            "direction": message.isFromMe ? "outbound" : "inbound",
            "external_id": "imessage_\(message.rowId)",
            "contact_phone": message.handleId,
            "received_at": ISO8601DateFormatter().string(from: message.timestamp)
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw SyncError.serverError
        }
    }

    // MARK: - Data Management

    func deleteAllData() async throws {
        guard let url = URL(string: "\(serverURL)/api/user/data") else {
            throw SyncError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        if !apiKey.isEmpty {
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        }

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw SyncError.serverError
        }

        // Reset local state
        lastMessageRowId = 0
        messagesSynced = 0
        UserDefaults.standard.set(0, forKey: "lastMessageRowId")
    }

    func resetSyncState() {
        lastMessageRowId = 0
        messagesSynced = 0
        UserDefaults.standard.set(0, forKey: "lastMessageRowId")
        syncStatus = "Reset complete"
    }
}

// MARK: - Models

struct IMessage {
    let rowId: Int64
    let text: String
    let isFromMe: Bool
    let timestamp: Date
    let service: String
    let handleId: String
}

enum SyncError: LocalizedError {
    case databaseNotFound
    case databaseOpenFailed
    case queryFailed
    case invalidURL
    case serverError

    var errorDescription: String? {
        switch self {
        case .databaseNotFound:
            return "iMessage database not found. Make sure Full Disk Access is enabled."
        case .databaseOpenFailed:
            return "Failed to open iMessage database."
        case .queryFailed:
            return "Failed to query messages."
        case .invalidURL:
            return "Invalid server URL."
        case .serverError:
            return "Server returned an error."
        }
    }
}

// MARK: - Extensions

extension Double {
    func nonZeroOr(_ defaultValue: Double) -> Double {
        return self == 0 ? defaultValue : self
    }
}
