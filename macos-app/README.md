# WickedCRM iMessage Sync - macOS

Sync iMessages from your Mac to WickedCRM backend with AI processing.

## Features

- **iMessage Sync**: Reads from local Messages database
- **Real-time Monitoring**: Polls for new messages every 5 seconds
- **Two-way Sync**: Send messages from WickedCRM via AppleScript
- **SMS Support**: Works with SMS if iPhone is linked

## Requirements

- macOS 10.15+
- Python 3.9+
- Full Disk Access permission
- Messages app with iMessage/SMS set up

## Installation

```bash
# Install dependencies
pip3 install requests watchdog

# Run the sync service
python3 imessage_sync.py
```

## Grant Full Disk Access

The app needs to read `~/Library/Messages/chat.db`:

1. Open System Preferences > Security & Privacy
2. Go to Privacy > Full Disk Access
3. Click the lock and enter password
4. Add Terminal (or your Python app)

## Usage

```bash
# Start sync service
python3 imessage_sync.py

# Test database access
python3 imessage_sync.py --test

# Send a message
python3 imessage_sync.py --send "+1234567890" "Hello!"

# Custom backend URL
python3 imessage_sync.py --url http://your-server.com:8000
```

## Configuration

Set environment variables:

```bash
export WICKEDCRM_URL="http://localhost:8000"
export WICKEDCRM_API_KEY="your-api-key"
```

## How It Works

1. **Reads Messages Database**
   - Connects to `~/Library/Messages/chat.db` (SQLite)
   - Queries for new messages since last sync

2. **Syncs to Backend**
   - POSTs each message to `/api/messages/sync`
   - Backend triggers AI processing

3. **Sends Outgoing Messages**
   - Polls `/api/messages/outgoing` for pending messages
   - Uses AppleScript to send via Messages app

## API Endpoints Used

- `POST /api/messages/sync` - Sync incoming messages
- `GET /api/messages/outgoing` - Get messages to send
- `POST /api/messages/{id}/sent` - Mark message as sent

## Running as Launch Agent

Create `~/Library/LaunchAgents/com.wickedcrm.imessage-sync.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.wickedcrm.imessage-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/path/to/imessage_sync.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>WICKEDCRM_URL</key>
        <string>http://localhost:8000</string>
    </dict>
</dict>
</plist>
```

Then load it:

```bash
launchctl load ~/Library/LaunchAgents/com.wickedcrm.imessage-sync.plist
```

## License

Proprietary - WickedCRM
