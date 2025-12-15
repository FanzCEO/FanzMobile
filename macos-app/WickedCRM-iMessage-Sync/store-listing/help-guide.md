# WickedCRM iMessage Sync - Quick Help Guide

## Getting Started

### Step 1: Grant Full Disk Access
The app needs to read your iMessage database.

1. Open **System Settings** → **Privacy & Security** → **Full Disk Access**
2. Click the **+** button
3. Navigate to Applications and select **WickedCRM iMessage Sync**
4. Restart the app

### Step 2: Configure Your Server
1. Click the WickedCRM icon in your menu bar
2. Click **Settings...**
3. Enter your WickedCRM server URL (e.g., `https://api.wickedcrm.com`)
4. Enter your API key (if required)
5. Click **Test Connection** to verify

### Step 3: Start Syncing
- Click **Sync Now** to sync immediately
- Enable **Auto Sync** to sync automatically every 30 seconds

---

## Common Tasks

### Sync Messages Manually
Click the menu bar icon → **Sync Now**

### Enable/Disable Auto Sync
Click the menu bar icon → Toggle **Auto Sync**

### Change Sync Interval
1. Click **Settings...**
2. Select your preferred interval from the dropdown
3. Changes apply immediately

### View Sync Status
The menu bar icon shows:
- 📬 Ready to sync
- 🔄 Sync in progress
- 🟢 Connected (green dot)
- 🔴 Disconnected (red dot)

---

## Troubleshooting

### "iMessage database not found"
- Ensure Full Disk Access is enabled
- Restart the app after granting permission
- Make sure Messages app has been used at least once

### "Connection failed"
- Check your server URL is correct
- Verify your API key is valid
- Make sure you have internet connectivity
- Test connection in Settings

### Messages not syncing
1. Check the sync status in the menu bar
2. Try clicking **Sync Now**
3. Check for error messages
4. Verify Full Disk Access permission

### High CPU usage
- Increase the sync interval in Settings
- Disable auto-sync when not needed

---

## Privacy & Data

### Delete Synced Data
1. Click the menu bar icon
2. Click **Delete My Data**
3. Confirm deletion
4. All data on WickedCRM servers is permanently deleted

### Reset Sync State
If you want to re-sync all messages:
1. Open **Settings...**
2. Click **Reset Sync State**
3. Next sync will include all historical messages

### Stop All Syncing
- Disable Auto Sync
- Quit the app from the menu bar

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Settings | ⌘ + , |
| Quit App | ⌘ + Q |

---

## FAQ

**Q: Does this sync all my messages?**
A: Yes, both sent and received iMessages and SMS are synced.

**Q: Can I choose which conversations to sync?**
A: Currently, all conversations are synced. Contact filtering coming soon.

**Q: Where is my data stored?**
A: Data is stored on your configured WickedCRM server. We don't store data elsewhere.

**Q: Will this drain my battery?**
A: The app is designed to be lightweight. Increase sync interval if concerned.

**Q: Does it work with group chats?**
A: Yes, group messages are synced with all participants.

---

## Contact Support
- Email: support@wickedcrm.com
- Website: https://wickedcrm.com/support
