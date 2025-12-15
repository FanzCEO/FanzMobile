import SwiftUI

struct MenuBarView: View {
    @EnvironmentObject var syncManager: SyncManager
    @State private var showingDeleteConfirmation = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: "message.badge.circle.fill")
                    .font(.title2)
                    .foregroundColor(.accentColor)
                Text("WickedCRM Sync")
                    .font(.headline)
                Spacer()
                Circle()
                    .fill(syncManager.isConnected ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
            }
            .padding(.bottom, 4)

            Divider()

            // Status
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Status:")
                        .foregroundColor(.secondary)
                    Text(syncManager.syncStatus)
                        .fontWeight(.medium)
                }

                if let lastSync = syncManager.lastSyncTime {
                    HStack {
                        Text("Last sync:")
                            .foregroundColor(.secondary)
                        Text(lastSync, style: .relative)
                    }
                }

                HStack {
                    Text("Messages synced:")
                        .foregroundColor(.secondary)
                    Text("\(syncManager.messagesSynced)")
                        .fontWeight(.medium)
                }
            }
            .font(.caption)

            if let error = syncManager.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(6)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(4)
            }

            Divider()

            // Actions
            Button(action: {
                Task {
                    await syncManager.syncNewMessages()
                }
            }) {
                HStack {
                    Image(systemName: "arrow.triangle.2.circlepath")
                    Text("Sync Now")
                }
            }
            .disabled(syncManager.isSyncing)

            Toggle(isOn: $syncManager.autoSyncEnabled) {
                HStack {
                    Image(systemName: "clock.arrow.circlepath")
                    Text("Auto Sync")
                }
            }
            .onChange(of: syncManager.autoSyncEnabled) { enabled in
                if enabled {
                    syncManager.startAutoSync()
                } else {
                    syncManager.stopAutoSync()
                }
            }

            Divider()

            // Data Management
            Button(action: { showingDeleteConfirmation = true }) {
                HStack {
                    Image(systemName: "trash")
                    Text("Delete My Data")
                }
                .foregroundColor(.red)
            }

            Divider()

            // Footer
            HStack {
                Button("Settings...") {
                    NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil)
                }
                Spacer()
                Button("Quit") {
                    NSApplication.shared.terminate(nil)
                }
            }
            .buttonStyle(.plain)
            .font(.caption)
        }
        .padding()
        .frame(width: 280)
        .alert("Delete All Data?", isPresented: $showingDeleteConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                Task {
                    try? await syncManager.deleteAllData()
                }
            }
        } message: {
            Text("This will permanently delete all your synced messages from WickedCRM servers. This cannot be undone.")
        }
    }
}
