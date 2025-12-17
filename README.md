# CRM Escort - AI Chief of Staff for Messages

> Your AI assistant that turns messages into contacts, meetings, and follow-ups — automatically.

## 🎯 Core Features

- **Smart Message Parsing**: AI extracts contacts, meetings, tasks, and locations from any message
- **Auto-Contacts**: Every conversation becomes a searchable contact with full history
- **Location Intelligence**: Tracks cities, hotels, Airbnbs, and meetup spots automatically
- **Calendar Sync**: Events pushed to Google Calendar, Outlook, or device calendar
- **Workflow Engine**: Automated responses, confirmations, and follow-ups
- **Multi-Channel**: SMS (Twilio), RM Chat integration, email, manual input
- **Futuristic UI**: Neon Intelligence design system with AI Orb interface

## 🏗️ Architecture

### Backend (FastAPI + PostgreSQL)
- API server with JWT auth
- AI extraction pipeline (OpenAI/compatible)
- Message ingestion from multiple channels
- Calendar & contact sync services
- Workflow automation engine

### Mobile Apps
- **iOS**: Swift/SwiftUI native app
- **Android**: Kotlin/Jetpack Compose native app
- Both connect to backend API

### Integrations
- Twilio (SMS)
- Google Calendar
- Outlook Calendar
- Device calendar/contacts
- RM Chat (via supported channels)

## 📁 Project Structure

```
crm-escort-ai/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── routers/
│   │   ├── services/
│   │   └── workers/
│   ├── requirements.txt
│   └── Dockerfile
├── mobile/
│   ├── ios/             # Swift/SwiftUI app
│   └── android/         # Kotlin/Compose app
├── design/
│   ├── figma-pack/      # Complete design system
│   └── assets/
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── WORKFLOWS.md
└── docker-compose.yml
```

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configure your secrets
uvicorn app.main:app --reload
```

### Database Setup
```bash
docker-compose up -d postgres redis
python scripts/init_db.py
```

### Mobile Development
See `mobile/ios/README.md` and `mobile/android/README.md`

## 🎨 Design System

**Theme**: Neon Intelligence (Futuristic 2035 AI OS)

- Deep void backgrounds (#0A0A0E)
- Neon gradients (Blue #2D6FFF, Violet #A45CFF, Cyan #33E6FF)
- Glass morphism UI panels
- AI Orb centerpiece with pulsing states
- Holographic contact avatars

See `design/figma-pack/` for complete component library.

## 🔐 Security & Privacy

- JWT authentication with refresh tokens
- TLS 1.3 for all transport
- AES-256 encryption at rest
- Self-hosted: your data stays on your infrastructure
- Optional on-device AI for extra privacy

## 📱 Platform Support

- iOS 15+
- Android 10+ (API 29+)
- Web dashboard (future)

## 🔌 Integrations

### Current
- Twilio SMS
- Google Calendar OAuth
- Microsoft Outlook Calendar
- Device calendar (native APIs)

### Planned
- WhatsApp Business API
- RM Chat (Rent.Men) - via official API/partner access
- Email providers (Gmail, Outlook)
- Slack notifications

## 🤖 AI Features

- Contact extraction (name, phone, organization, role)
- Meeting detection (date, time, location, participants)
- Task/follow-up detection (due dates, priorities)
- Location classification (home, hotel, Airbnb, office)
- Intent analysis (booking, collab, urgent, casual)
- Smart templates with context variables
- Workflow automation

## 📄 License

Proprietary - FANZ Unlimited Network

## 🙋 Support

For issues or questions, contact dev@fanz.network
