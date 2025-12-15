import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var syncManager: SyncManager
    @State private var testingConnection = false
    @State private var connectionTestResult: Bool?

    var body: some View {
        TabView {
            GeneralSettingsView()
                .tabItem {
                    Label("General", systemImage: "gear")
                }
                .environmentObject(syncManager)

            ConnectionSettingsView(
                testingConnection: $testingConnection,
                connectionTestResult: $connectionTestResult
            )
            .tabItem {
                Label("Connection", systemImage: "network")
            }
            .environmentObject(syncManager)

            PrivacySettingsView()
                .tabItem {
                    Label("Privacy", systemImage: "hand.raised")
                }
                .environmentObject(syncManager)

            AboutView()
                .tabItem {
                    Label("About", systemImage: "info.circle")
                }
        }
        .frame(width: 450, height: 300)
    }
}

struct GeneralSettingsView: View {
    @EnvironmentObject var syncManager: SyncManager

    let syncIntervals: [(String, TimeInterval)] = [
        ("10 seconds", 10),
        ("30 seconds", 30),
        ("1 minute", 60),
        ("5 minutes", 300),
        ("15 minutes", 900)
    ]

    var body: some View {
        Form {
            Toggle("Start sync on launch", isOn: $syncManager.autoSyncEnabled)

            Picker("Sync interval", selection: $syncManager.syncInterval) {
                ForEach(syncIntervals, id: \.1) { name, interval in
                    Text(name).tag(interval)
                }
            }

            Section {
                HStack {
                    Text("Messages synced this session:")
                    Spacer()
                    Text("\(syncManager.messagesSynced)")
                        .fontWeight(.medium)
                }

                Button("Reset Sync State") {
                    syncManager.resetSyncState()
                }
                .help("Reset will re-sync all messages from the beginning")
            }
        }
        .padding()
    }
}

struct ConnectionSettingsView: View {
    @EnvironmentObject var syncManager: SyncManager
    @Binding var testingConnection: Bool
    @Binding var connectionTestResult: Bool?

    var body: some View {
        Form {
            TextField("Server URL", text: $syncManager.serverURL)
                .textFieldStyle(.roundedBorder)

            SecureField("API Key (optional)", text: $syncManager.apiKey)
                .textFieldStyle(.roundedBorder)

            HStack {
                Button("Test Connection") {
                    testingConnection = true
                    connectionTestResult = nil
                    Task {
                        connectionTestResult = await syncManager.testConnection()
                        testingConnection = false
                    }
                }
                .disabled(testingConnection)

                if testingConnection {
                    ProgressView()
                        .scaleEffect(0.5)
                } else if let result = connectionTestResult {
                    Image(systemName: result ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .foregroundColor(result ? .green : .red)
                    Text(result ? "Connected" : "Failed")
                        .foregroundColor(result ? .green : .red)
                }
            }

            if let error = syncManager.errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
        }
        .padding()
    }
}

struct PrivacySettingsView: View {
    @EnvironmentObject var syncManager: SyncManager
    @State private var showingDeleteConfirmation = false
    @State private var isDeleting = false

    var body: some View {
        Form {
            Section {
                Text("WickedCRM syncs your iMessages to help you manage conversations. Your data is encrypted and stored securely.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Section("Data Management") {
                Button(action: { showingDeleteConfirmation = true }) {
                    HStack {
                        Image(systemName: "trash")
                        Text("Delete All Synced Data")
                    }
                    .foregroundColor(.red)
                }
                .disabled(isDeleting)

                Text("This will permanently delete all messages synced to WickedCRM servers.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Section {
                Link("View Privacy Policy", destination: URL(string: "https://wickedcrm.com/privacy")!)
            }
        }
        .padding()
        .alert("Delete All Data?", isPresented: $showingDeleteConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Delete Everything", role: .destructive) {
                isDeleting = true
                Task {
                    try? await syncManager.deleteAllData()
                    isDeleting = false
                }
            }
        } message: {
            Text("This will permanently delete all your synced messages from WickedCRM servers. This action cannot be undone.")
        }
    }
}

struct AboutView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "message.badge.circle.fill")
                .font(.system(size: 64))
                .foregroundColor(.accentColor)

            Text("WickedCRM iMessage Sync")
                .font(.title2)
                .fontWeight(.bold)

            Text("Version 1.0.0")
                .foregroundColor(.secondary)

            Text("Syncs your iMessages to WickedCRM for AI-powered message management and CRM integration.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)

            Spacer()

            Text("© 2024 FANZ Group Holdings LLC")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}
