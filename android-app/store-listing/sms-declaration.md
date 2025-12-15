# Google Play SMS/Call Log Policy Declaration

## App Name
WickedCRM SMS

## Core Functionality Declaration

### Why does your app need SMS permissions?

WickedCRM SMS is a **default SMS replacement application** that provides users with an alternative messaging experience. The app requires SMS permissions because:

1. **Primary Function**: The app's core functionality is to serve as the user's default SMS/MMS messaging application, replacing the stock messaging app.

2. **SMS Permissions Used**:
   - `RECEIVE_SMS` - To receive incoming text messages
   - `SEND_SMS` - To send text messages on behalf of the user
   - `READ_SMS` - To display existing conversations
   - `RECEIVE_MMS` - To receive multimedia messages
   - `RECEIVE_WAP_PUSH` - Required for MMS functionality

3. **User-Initiated Actions**: All SMS operations are initiated by the user:
   - Reading their own messages
   - Composing and sending new messages
   - Responding to incoming messages

### Additional Features

- **Spam Protection**: Phone numbers (not message content) are checked against spam databases
- **AI Insights**: Optional local/cloud processing to extract meeting times and tasks
- **Cloud Sync**: Optional backup to user's WickedCRM account

### Data Handling

- Message content is NEVER shared with third parties
- Messages remain in the standard Android SMS database
- Cloud sync is optional and user-controlled
- All data transmission is encrypted

## Compliance Checklist

- [x] App is a default SMS handler
- [x] SMS permissions are essential to core functionality
- [x] Clear privacy policy explaining data usage
- [x] User consent obtained before any data sync
- [x] No unauthorized data collection
- [x] No premium SMS sending without explicit consent

## Permission Justification

| Permission | Justification |
|------------|---------------|
| RECEIVE_SMS | Receive incoming messages as default SMS app |
| SEND_SMS | Send messages composed by user |
| READ_SMS | Display user's conversation history |
| RECEIVE_MMS | Receive picture/multimedia messages |
| RECEIVE_WAP_PUSH | Required for MMS delivery |
| READ_CONTACTS | Show contact names in conversations |
| INTERNET | Spam checking, optional cloud sync |

## Declaration Form Responses

**Q: Is your app a default SMS, Phone, or Assistant handler?**
A: Yes - Default SMS handler

**Q: Describe the core functionality requiring these permissions:**
A: WickedCRM SMS is a full SMS replacement app that allows users to send, receive, and manage their text messages with additional features like spam protection and AI-powered message insights.

**Q: Will you access SMS for any purpose other than the declared functionality?**
A: No. SMS data is only used for displaying conversations, sending user-composed messages, and optional user-initiated cloud backup.
