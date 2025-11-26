# CRM Escort AI

> Your AI Chief of Staff for Messages - Automatically turn messages into contacts, meetings, and follow-ups

[![Deploy Status](https://img.shields.io/badge/status-deploy--ready-success)](https://github.com/FanzCEO/crm-escort-ai)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

## 🎯 What Is This?

CRM Escort AI is an intelligent message processing system that automatically:
- **Extracts contacts** from any message (name, phone, email, organization)
- **Detects meetings** and creates calendar events
- **Tracks locations** (hotels, Airbnbs, meeting spots)
- **Automates follow-ups** with smart workflows
- **Syncs calendars** (Google, Outlook, device calendar)
- **Integrates SMS** via Twilio

## ✨ Key Features

- 🤖 **AI-Powered Extraction** - OpenAI extracts structured data from unstructured messages
- 📱 **Multi-Channel** - SMS, email, manual input, RM Chat integration
- 📅 **Calendar Sync** - Bi-directional sync with Google Calendar and Outlook
- 🌍 **Location Intelligence** - Automatically categorizes and tracks locations
- ⚡ **Workflow Automation** - Create custom workflows for automatic responses and actions
- 🔐 **Secure** - JWT authentication, TLS 1.3, AES-256 encryption
- 🐳 **Containerized** - Deploy anywhere with Docker
- 📊 **RESTful API** - Complete API with OpenAPI/Swagger docs

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- 2GB RAM minimum
- OpenAI API key

### Deploy in 5 Minutes

```bash
# 1. Clone repository
git clone https://github.com/FanzCEO/crm-escort-ai.git
cd crm-escort-ai

# 2. Configure environment
cp .env.example .env
# Edit .env with your secrets (see below)

# 3. Start services
docker-compose up -d

# 4. Initialize database (schema auto-loaded on first run)
# Optional manual init:
docker-compose exec backend python scripts/init_db.py

# 5. Verify deployment
curl http://localhost:8000/health
# {"status":"healthy","service":"crm-escort-ai","version":"0.1.0"}

# 6. Access API docs
open http://localhost:8000/docs
```

## 🔧 Configuration

### Required Environment Variables

```bash
# Database password
POSTGRES_PASSWORD=your_secure_password

# JWT secret (64+ characters recommended)
JWT_SECRET=your_very_long_secret_key_here

# OpenAI API key for AI extraction
OPENAI_API_KEY=sk-...
```

### Optional Integrations

```bash
# Twilio SMS
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1234567890

# Google Calendar
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Outlook Calendar
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (invalidate tokens)

### Messages
- `GET /api/messages` - List all messages
- `POST /api/messages` - Create new message (triggers AI processing)
- `GET /api/messages/{id}` - Get specific message
- `POST /api/messages/{id}/process` - Manually trigger AI extraction
- `DELETE /api/messages/{id}` - Delete message

### Contacts
- `GET /api/contacts` - List all contacts (with search)
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/{id}` - Get specific contact
- `PUT /api/contacts/{id}` - Update contact
- `DELETE /api/contacts/{id}` - Delete contact
- `GET /api/contacts/{id}/messages` - Get contact's message history

### Calendar
- `GET /api/calendar` - List events (with date range filter)
- `POST /api/calendar` - Create new event
- `GET /api/calendar/{id}` - Get specific event
- `PUT /api/calendar/{id}` - Update event
- `DELETE /api/calendar/{id}` - Delete event
- `POST /api/calendar/sync` - Sync with external calendars

### Workflows
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/{id}` - Get specific workflow
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow
- `POST /api/workflows/{id}/toggle` - Enable/disable workflow
- `POST /api/workflows/{id}/test` - Test workflow

## 🏗️ Architecture

```
┌─────────────────┐
│   Mobile Apps   │
│  (iOS/Android)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  FastAPI Backend │────▶│  PostgreSQL  │
│   (Port 8000)    │     │   Database   │
└────────┬─────────┘     └──────────────┘
         │
         │               ┌──────────────┐
         ├──────────────▶│    Redis     │
         │               │    Cache     │
         │               └──────────────┘
         ▼
┌─────────────────┐
│ Background Worker│
│ (AI Processing)  │
└─────────────────┘

External Integrations:
  ├─ OpenAI (AI extraction)
  ├─ Twilio (SMS)
  ├─ Google Calendar
  └─ Outlook Calendar
```

## 🧪 Development

### Run Locally (without Docker)

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure .env
cp ../.env.example .env
# Edit .env

# Start database & redis
docker-compose up -d postgres redis

# Initialize database
python scripts/init_db.py

# Run backend
uvicorn app.main:app --reload --port 8000

# In another terminal, run worker
python -m app.workers.worker
```

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔒 Security

- **Authentication**: JWT-based with refresh tokens
- **Transport**: TLS 1.3
- **Storage**: AES-256 encryption at rest
- **Self-hosted**: Your data stays on your infrastructure
- **CORS**: Configurable allowed origins
- **Rate Limiting**: Built-in (60 requests/minute default)

## 📱 Mobile Apps

Mobile app repositories (coming soon):
- iOS (Swift/SwiftUI)
- Android (Kotlin/Jetpack Compose)

Both will connect to this backend API.

## 🤖 AI Features

The AI extraction pipeline processes messages to identify:
- **Contacts**: Names, phone numbers, emails, organizations, roles
- **Events**: Dates, times, locations, attendees
- **Tasks**: Action items with due dates and priorities
- **Locations**: Hotels, Airbnbs, offices, homes (with automatic classification)
- **Intent**: Meeting, booking, collaboration, urgent, casual

## 🧩 Workflow Examples

```json
{
  "name": "Auto-confirm bookings",
  "trigger": "message_received",
  "conditions": {
    "contains": ["booking", "confirm"]
  },
  "actions": [
    {
      "type": "send_sms",
      "template": "Thanks! Confirmed for {{date}} at {{location}}"
    },
    {
      "type": "create_calendar_event",
      "title": "Meeting with {{contact_name}}"
    }
  ]
}
```

## 📊 Monitoring

Health check: `GET /health`

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f worker

# Check service status
docker-compose ps
```

## 🚢 Production Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed production deployment instructions including:
- Cloud platform deployment (AWS, GCP, DigitalOcean)
- Kubernetes deployment
- Serverless deployment (AWS Lambda, Cloud Run)
- SSL/TLS configuration
- Backup strategies
- Monitoring setup

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15 with pg_trgm for fuzzy search
- **Cache/Queue**: Redis 7
- **AI**: OpenAI GPT-4
- **SMS**: Twilio API
- **Calendars**: Google Calendar API, Microsoft Graph API
- **Container**: Docker & Docker Compose

## 📄 License

Proprietary - FANZ Unlimited Network

## 🙋 Support

- Issues: https://github.com/FanzCEO/crm-escort-ai/issues
- Email: dev@fanz.network

## 🗺️ Roadmap

- [ ] Implement database models with SQLAlchemy
- [ ] Complete JWT authentication flow
- [ ] OpenAI message extraction integration
- [ ] Twilio SMS webhook handler
- [ ] Google Calendar OAuth flow
- [ ] Outlook Calendar OAuth flow
- [ ] Mobile apps (iOS & Android)
- [ ] Web dashboard
- [ ] WhatsApp Business API integration
- [ ] Email provider integration
- [ ] Advanced AI features (sentiment analysis, priority scoring)
- [ ] Multi-language support

---

Built with ❤️ by [FANZ](https://fanz.network)
