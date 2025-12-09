# CRM Escort AI - Web Dashboard Development Plan

## Design Guidelines

### Design References (Primary Inspiration)
- **Linear.app**: Clean, fast, keyboard-first workflow
- **Vercel Dashboard**: Modern SaaS aesthetic with smooth animations
- **Notion**: Intuitive data organization and views
- **Style**: Neon Intelligence + Dark Mode + Futuristic AI OS (2035 aesthetic)

### Color Palette
- Primary Background: #0A0A0E (Deep Void)
- Secondary Background: #151519 (Charcoal Panel)
- Card Background: #1A1A1F (Glass Panel with 5% opacity overlay)
- Accent Blue: #2D6FFF (Neon Blue - primary actions)
- Accent Violet: #A45CFF (Neon Violet - AI features)
- Accent Cyan: #33E6FF (Neon Cyan - notifications)
- Accent Pink: #FF4D9E (Neon Pink - urgent/important)
- Text Primary: #FFFFFF (White)
- Text Secondary: #8B8B9A (Muted Gray)
- Text Tertiary: #5A5A66 (Dim Gray)
- Success: #00FF88 (Neon Green)
- Warning: #FFB800 (Neon Amber)
- Error: #FF3366 (Neon Red)

### Typography
- Heading1: Inter font-weight 700 (32px) - Dashboard titles
- Heading2: Inter font-weight 600 (24px) - Section headers
- Heading3: Inter font-weight 600 (18px) - Card titles
- Body/Normal: Inter font-weight 400 (14px) - Main content
- Body/Emphasis: Inter font-weight 600 (14px) - Labels, highlights
- Caption: Inter font-weight 400 (12px) - Metadata, timestamps
- Code/Mono: JetBrains Mono font-weight 400 (13px) - API keys, IDs

### Key Component Styles
- **AI Orb**: 160x160px circular gradient (Blue→Violet→Cyan), pulsing animation, 5 states (idle, listening, processing, success, error)
- **Glass Cards**: backdrop-blur-xl, border 1px rgba(255,255,255,0.1), shadow-2xl with colored glow
- **Buttons Primary**: Gradient background (Blue→Violet), white text, 8px rounded, hover: brightness 110%, active: scale 98%
- **Buttons Secondary**: Transparent with border, hover: background rgba(255,255,255,0.05)
- **Message Bubbles**: Left (received) - gray bg, Right (sent) - gradient bg, AI highlights in yellow
- **Contact Avatars**: 40px circle with holographic border, gradient ring on hover
- **Status Badges**: Pill-shaped, 6px rounded, uppercase text, colored backgrounds
- **Input Fields**: Dark bg with bottom border, focus: neon glow effect

### Layout & Spacing
- Sidebar: 280px fixed width, collapsible to 80px (icon-only)
- Main content: Max-width 1400px, centered with 24px padding
- Card spacing: 16px gaps in grid layouts
- Section padding: 32px vertical, 24px horizontal
- Grid system: 12-column responsive grid

### Animations & Interactions
- Page transitions: 200ms ease-out fade + slide
- Card hover: Lift 4px with colored shadow, 160ms ease
- Button hover: 120ms ease scale + brightness
- AI Orb: Continuous 3s rotation + 2s pulse
- Loading states: Skeleton shimmer with gradient sweep
- Notifications: Slide in from top-right, 300ms spring

### Images to Generate
1. **ai-orb-idle.png** - Central AI orb in idle state, blue-violet gradient sphere with subtle glow (Style: 3d, holographic, transparent background)
2. **dashboard-hero-bg.jpg** - Abstract neural network pattern background, dark with neon accents (Style: photorealistic, dark mood, tech aesthetic)
3. **empty-state-messages.svg** - Illustration for empty inbox, minimalist line art with neon accent (Style: vector-style, clean lines)
4. **empty-state-contacts.svg** - Illustration for no contacts yet, person icon with connection nodes (Style: vector-style, clean lines)
5. **empty-state-calendar.svg** - Illustration for no events, calendar icon with sparkles (Style: vector-style, clean lines)
6. **integration-twilio.png** - Twilio logo/icon for integrations page (Style: vector-style, transparent background)
7. **integration-google-calendar.png** - Google Calendar icon for integrations (Style: vector-style, transparent background)
8. **integration-outlook.png** - Outlook icon for integrations (Style: vector-style, transparent background)

---

## Development Tasks

### Phase 1: Project Setup & Core Infrastructure
1. **Environment Setup**
   - Copy backend schema files to /workspace/shadcn-ui/docs for reference
   - Install additional dependencies: @tanstack/react-query, date-fns, recharts, lucide-react
   - Configure API client with axios for backend communication
   - Set up environment variables for API_BASE_URL

2. **Generate All Images**
   - Create all 8 images using ImageCreator.generate_image following design guidelines
   - Save to public/assets/images/ directory

3. **Layout & Navigation**
   - Create AppLayout component with collapsible sidebar
   - Build Sidebar component with navigation items (Dashboard, Messages, Contacts, Calendar, Workflows, Integrations, Settings)
   - Add TopBar component with search, notifications, user menu
   - Implement responsive mobile drawer navigation

### Phase 2: Authentication & API Integration
4. **Auth System**
   - Create login page with email/password form
   - Build registration page
   - Implement JWT token management (localStorage + refresh logic)
   - Add protected route wrapper component
   - Create auth context for global state

5. **API Client Layer**
   - Build axios instance with interceptors for auth tokens
   - Create API service modules: authApi, messagesApi, contactsApi, eventsApi, integrationsApi
   - Implement error handling and retry logic
   - Add React Query hooks for data fetching

### Phase 3: Core Features - Dashboard & Messages
6. **Dashboard Homepage**
   - AI Orb component with 5 animated states
   - Stats cards: total messages, contacts, upcoming meetings, active workflows
   - Recent messages preview list
   - Upcoming events timeline
   - Quick action buttons

7. **Messages Inbox**
   - Message list with infinite scroll
   - Multi-channel filters (SMS, RM Chat, email, manual)
   - AI extraction highlights display (contacts, dates, locations in colored badges)
   - Message detail panel with full conversation thread
   - Manual message composer
   - Real-time updates with polling or WebSocket

### Phase 4: Contacts & Calendar
8. **Contacts Management**
   - Contact list with search and filters
   - Contact cards with avatar, tags, importance score
   - Contact detail view with interaction history
   - Location tracking display (hotels, Airbnbs, meetup spots)
   - Add/edit contact form
   - Bulk actions (tag, delete, export)

9. **Calendar View**
   - Month/week/day view toggle
   - Event cards with color coding by status
   - Drag-and-drop rescheduling
   - Event detail modal with contact info and location
   - Create/edit event form
   - Sync status indicators (Google Calendar, Outlook)

### Phase 5: Automation & Integrations
10. **Workflows & Automation**
    - Workflow list with enabled/disabled toggle
    - Visual workflow builder (trigger → conditions → actions)
    - Message template manager
    - Template editor with variable placeholders
    - Workflow execution history/logs

11. **Integrations Hub**
    - Integration cards for Twilio, Google Calendar, Outlook, RM Chat
    - OAuth connection flow for Google/Microsoft
    - API key input for Twilio
    - Connection status indicators
    - Disconnect/reconnect actions
    - Integration settings and permissions

### Phase 6: Settings & Polish
12. **Settings & Profile**
    - User profile editor (name, email, password change)
    - Notification preferences
    - API keys display (masked with copy button)
    - Audit log viewer with filters
    - Theme customization options
    - Data export functionality

13. **Final Polish**
    - Add loading skeletons for all data fetching
    - Implement error boundaries and fallback UI
    - Add empty states with illustrations
    - Toast notifications for actions
    - Keyboard shortcuts (Cmd+K for search, etc.)
    - Responsive design testing and fixes
    - Performance optimization (code splitting, lazy loading)

### Phase 7: Testing & Deployment
14. **Quality Assurance**
    - Test all CRUD operations
    - Verify API integration with backend
    - Test OAuth flows
    - Cross-browser compatibility
    - Mobile responsiveness check
    - Accessibility audit (ARIA labels, keyboard navigation)

15. **Build & Deploy**
    - Run pnpm run lint
    - Fix all linting errors
    - Run pnpm run build
    - Test production build locally
    - Prepare deployment documentation

---

## Technical Stack
- **Framework**: React 18 + TypeScript
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS with custom theme
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion (optional for advanced animations)

## API Endpoints (Backend Reference)
- POST /auth/register - User registration
- POST /auth/login - User login
- GET /messages - List messages
- POST /messages/manual - Create manual message
- GET /contacts - List contacts
- POST /contacts - Create contact
- GET /events - List events
- POST /events - Create event
- GET /workflows - List workflows
- GET /integrations - List integrations
- POST /integrations/connect - Connect integration

## File Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   ├── dashboard/
│   │   ├── AIOrb.tsx
│   │   ├── StatsCard.tsx
│   │   └── RecentMessages.tsx
│   ├── messages/
│   │   ├── MessageList.tsx
│   │   ├── MessageItem.tsx
│   │   └── MessageComposer.tsx
│   ├── contacts/
│   │   ├── ContactList.tsx
│   │   ├── ContactCard.tsx
│   │   └── ContactDetail.tsx
│   ├── calendar/
│   │   ├── CalendarView.tsx
│   │   ├── EventCard.tsx
│   │   └── EventModal.tsx
│   ├── workflows/
│   │   ├── WorkflowList.tsx
│   │   └── WorkflowBuilder.tsx
│   ├── integrations/
│   │   ├── IntegrationCard.tsx
│   │   └── OAuthCallback.tsx
│   └── settings/
│       ├── ProfileSettings.tsx
│       └── AuditLog.tsx
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Messages.tsx
│   ├── Contacts.tsx
│   ├── Calendar.tsx
│   ├── Workflows.tsx
│   ├── Integrations.tsx
│   └── Settings.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── messages.ts
│   │   ├── contacts.ts
│   │   ├── events.ts
│   │   └── integrations.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useMessages.ts
│   │   └── useContacts.ts
│   └── utils/
│       ├── date.ts
│       └── format.ts
└── types/
    ├── auth.ts
    ├── message.ts
    ├── contact.ts
    └── event.ts
```

## Success Criteria
- ✅ All 7 main features implemented and functional
- ✅ Responsive design works on desktop, tablet, mobile
- ✅ API integration with backend successful
- ✅ OAuth flows working for Google/Microsoft
- ✅ AI extraction results displayed correctly
- ✅ Real-time updates for new messages
- ✅ Futuristic neon design fully implemented
- ✅ No console errors or warnings
- ✅ Build passes without errors
- ✅ Performance: Initial load < 3s, interactions < 100ms