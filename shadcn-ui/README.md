# CRM Escort AI - Web Dashboard

> AI-powered CRM dashboard for managing conversations, contacts, and meetings automatically.

## 🎯 Features

- **Dashboard** - AI Orb centerpiece with real-time stats and activity
- **Messages** - Multi-channel inbox with AI extraction highlights
- **Contacts** - Smart contact management with tags and importance scoring
- **Calendar** - Event scheduling with calendar sync
- **Workflows** - Automation rules and message templates
- **Integrations** - Connect Twilio, Google Calendar, Outlook, and more
- **Settings** - Profile, API keys, notifications, and security

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Backend API running (see backend documentation)

### Installation

```bash
# Install dependencies
pnpm install

# Create environment file
cp .env.example .env

# Update .env with your backend API URL
# VITE_API_BASE_URL=http://localhost:8000

# Start development server
pnpm run dev
```

The dashboard will be available at `http://localhost:5173`

### Build for Production

```bash
pnpm run build
```

## 🎨 Design System

**Theme**: Neon Intelligence (Futuristic AI OS)

- **Colors**: Deep void backgrounds with neon blue, violet, cyan, and pink accents
- **Typography**: Inter for UI, JetBrains Mono for code
- **Components**: Glass morphism cards, gradient buttons, animated AI orb
- **Animations**: Smooth transitions, pulsing effects, hover states

## 🔌 Backend Integration

This frontend connects to the FastAPI backend. Make sure the backend is running and accessible at the URL specified in `.env`.

### API Endpoints Used

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /messages` - Fetch messages
- `POST /messages/manual` - Create manual message
- `GET /contacts` - Fetch contacts
- `POST /contacts` - Create contact
- `GET /events` - Fetch events
- `POST /events` - Create event
- `GET /integrations` - Fetch integrations

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # Sidebar, TopBar, AppLayout
│   ├── dashboard/       # AIOrb, StatsCard
│   └── ui/              # shadcn/ui components
├── pages/               # Route pages
├── lib/
│   ├── api/            # API client and services
│   ├── hooks/          # Custom React hooks
│   └── utils/          # Utility functions
└── types/              # TypeScript type definitions
```

## 🔐 Authentication

The app uses JWT token authentication:

1. User logs in via `/login`
2. Access token stored in localStorage
3. Token automatically added to API requests
4. Auto-redirect to login on 401 errors

## 🛠️ Technology Stack

- **Framework**: React 18 + TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand + React Query
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Build Tool**: Vite

## 📝 Development Notes

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation item in `src/components/layout/Sidebar.tsx`

### API Integration

1. Define types in `src/types/`
2. Create API service in `src/lib/api/`
3. Use React Query hooks in components

### Styling

- Use Tailwind utility classes
- Custom utilities: `.glass-panel`, `.gradient-primary`, `.neon-glow-*`
- Follow the design system in `todo.md`

## 🐛 Troubleshooting

### Backend Connection Issues

- Verify backend is running at the URL in `.env`
- Check CORS settings in backend
- Ensure API endpoints match backend routes

### iOS Device Debugging

- Use your Mac's LAN IP (not `localhost`) in `.env` so the phone can reach the backend.
- After changing `.env` or `Info.plist`, run `pnpm run build && npx cap sync ios` before rebuilding in Xcode.
- The iOS project now includes ATS exceptions for the dev IP; switch back to HTTPS before submitting to the App Store.

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📄 License

Proprietary - FANZ Unlimited Network

## 🙋 Support

For issues or questions, contact dev@fanz.network