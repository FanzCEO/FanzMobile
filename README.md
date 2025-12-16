# WickedCRM

A comprehensive CRM platform with push-to-talk communications, billing, and mobile apps.

## Features

- **Push-to-Talk (PTT)** - LiveKit-powered real-time voice channels
- **Multi-Channel Communications** - SMS, WhatsApp, Telegram, Email
- **Platform Billing** - Consumer-charged fees with CCBill/Segpay/Epoch integration
- **Admin Console** - User access management and feature toggles
- **Mobile Apps** - iOS and Android via Capacitor

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + Vite + TypeScript + shadcn/ui |
| Backend | FastAPI + SQLAlchemy + PostgreSQL |
| Mobile | Capacitor (iOS + Android) |
| Real-time | LiveKit (PTT) + WebSocket |
| Database | PostgreSQL (Supabase) |
| Auth | JWT |

## Project Structure

```
├── shadcn-ui/          # React frontend + Capacitor mobile
│   ├── src/            # React source
│   ├── ios/            # iOS native project
│   └── android/        # Android native project
├── backend/            # FastAPI backend
│   ├── app/
│   │   ├── routers/    # API endpoints
│   │   ├── models/     # SQLAlchemy models
│   │   └── services/   # Business logic
└── legal/              # Legal documents
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd shadcn-ui
pnpm install
pnpm run dev
```

### Mobile Build
```bash
cd shadcn-ui
pnpm run build
npx cap sync
npx cap open ios     # Opens Xcode
npx cap open android # Opens Android Studio
```

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=https://your-api.com
VITE_LIVEKIT_URL=wss://your-livekit.cloud
VITE_WS_URL=wss://your-api.com/ws
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
LIVEKIT_API_KEY=your-key
LIVEKIT_API_SECRET=your-secret
```

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## License

Proprietary - All rights reserved

---

Built with Claude Code
