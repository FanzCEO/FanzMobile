import SwiftUI

@main
struct WickedCRMApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var syncManager = SyncManager.shared

    var body: some Scene {
        MenuBarExtra {
            MenuBarView()
                .environmentObject(syncManager)
        } label: {
            Image(systemName: syncManager.isSyncing ? "arrow.triangle.2.circlepath" : "message.badge.circle")
        }
        .menuBarExtraStyle(.window)

        Settings {
            SettingsView()
                .environmentObject(syncManager)
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Start sync on launch if configured
        if UserDefaults.standard.bool(forKey: "autoSyncEnabled") {
            SyncManager.shared.startAutoSync()
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        SyncManager.shared.stopAutoSync()
    }
}
