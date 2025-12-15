# WickedCRM SMS - Android SMS Replacement App

A complete SMS replacement app for Android that syncs all messages to WickedCRM backend with AI-powered features.

## Features

- **Full SMS Replacement**: Set as default SMS app to receive all messages
- **Auto Sync**: Automatically syncs all incoming/outgoing SMS to WickedCRM
- **Spam Detection**: Mr. Number-style spam filtering via verification API
- **AI Processing**: Extracts contacts, meetings, locations, tasks from messages
- **Background Service**: Syncs even when app is closed
- **Material You Design**: Modern Jetpack Compose UI

## Requirements

- Android 8.0 (API 26) or higher
- WickedCRM backend running

## Setup

1. **Configure Backend URL**

   Open the app and go to Settings to set your WickedCRM backend URL.

   Default: `http://10.0.2.2:8000` (localhost for emulator)

2. **Grant Permissions**

   The app needs these permissions:
   - SMS (read, send, receive)
   - Contacts
   - Phone state
   - Network

3. **Set as Default SMS App**

   When prompted, set WickedCRM SMS as your default messaging app.

## Building

```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install on connected device
./gradlew installDebug
```

## Architecture

```
com.wickedcrm.sms/
├── MainActivity.kt           # Main entry point
├── ComposeSmsActivity.kt     # New message composer
├── WickedSmsApp.kt          # Application class
├── data/
│   ├── api/
│   │   └── WickedCrmApi.kt  # Retrofit API interface
│   ├── model/
│   │   └── Models.kt        # Data models
│   └── repository/
│       └── MessageRepository.kt  # Data layer
├── receivers/
│   ├── SmsReceiver.kt       # Incoming SMS
│   ├── SmsDeliverReceiver.kt
│   ├── MmsReceiver.kt       # MMS handling
│   ├── MmsDeliverReceiver.kt
│   └── BootReceiver.kt      # Start on boot
├── services/
│   ├── SyncService.kt       # Background sync
│   └── HeadlessSmsService.kt
└── ui/
    ├── screens/
    │   └── MainScreen.kt    # Conversation list & chat
    └── theme/
        ├── Theme.kt
        └── Type.kt
```

## API Endpoints Used

- `POST /api/messages/sync` - Sync incoming messages
- `GET /api/messages/outgoing` - Get messages to send
- `POST /api/messages/{id}/sent` - Mark message as sent
- `POST /api/verification/screen` - Screen incoming calls/messages
- `POST /api/verification/block` - Block numbers
- `POST /api/verification/report-spam` - Report spam

## License

Proprietary - WickedCRM
