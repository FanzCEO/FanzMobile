# WickedCRM Admin & Developer Guide

## Quick Reference

**Production URL:** https://rent.fanz.website
**Backend Process:** `crm-escort-ai` (PM2)
**Server:** root@rent.fanz.website

---

## Project Structure

```
workspace/
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── routers/        # API endpoints (27 files)
│   │   ├── models/         # Database models (5 files)
│   │   ├── services/       # Business logic
│   │   └── config.py       # Settings/env vars
│   ├── schema.sql          # Database schema
│   └── requirements.txt    # Python dependencies
│
├── shadcn-ui/              # React/Vite frontend
│   ├── src/
│   │   ├── pages/          # 26 page components
│   │   ├── components/     # UI components
│   │   ├── lib/            # API clients, hooks
│   │   └── types/          # TypeScript types
│   └── dist/               # Built production files
│
├── docs/                   # Documentation
├── design/                 # Design system specs
└── android-app/            # Capacitor mobile app
```

---

## Environment Variables (Production)

### Core Database & Auth
| Variable | Description |
|----------|-------------|
| `DB_URL` | PostgreSQL connection string |
| `SUPABASE_DB_URL` | Supabase database URL |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `SESSION_SECRET` | Session encryption key |
| `ADMIN_API_KEY` | Admin panel access key |

### AI Providers
| Variable | Description | Used For |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | AI chat, content generation |
| `GROQ_API_KEY` | Groq API key | Fast LLM inference |
| `ANTHROPIC_API_KEY` | Anthropic/Claude API | AI features |
| `GOOGLE_AI_API_KEY` | Google AI/Gemini | Multimodal AI |
| `HUGGINGFACE_API_KEY` | HuggingFace | Creative models |

### Communications
| Variable | Description | Used For |
|----------|-------------|----------|
| `TWILIO_ACCOUNT_SID` | Twilio account ID | SMS/Voice |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | SMS/Voice |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | Outbound SMS/calls |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | Telegram messaging |
| `SENDGRID_API_KEY` | SendGrid API key | Email sending |

### LiveKit (PTT/Voice)
| Variable | Description |
|----------|-------------|
| `LIVEKIT_URL` | `wss://wickedcrm-asme6nkk.livekit.cloud` |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret |

### Payments (Crypto)
| Variable | Description |
|----------|-------------|
| `TRIPLEA_CLIENT_ID` | TripleA crypto payments |
| `TRIPLEA_API_KEY` | TripleA API key |
| `NOWPAYMENTS_API_KEY` | NOWPayments crypto |
| `BANKFUL_API_KEY` | Bankful payments |

### WhatsApp (Not Yet Configured)
| Variable | Description |
|----------|-------------|
| `META_APP_ID` | Meta/Facebook App ID |
| `META_APP_SECRET` | Meta App Secret |
| `WHATSAPP_REDIRECT_URI` | OAuth callback URL |

---

## API Endpoints (Backend Routers)

### Authentication (`/api/auth`)
- `POST /login` - Email/password login
- `POST /signup` - Register new user
- `GET /me` - Get current user
- `POST /logout` - Logout

### Contacts (`/api/contacts`)
- `GET /` - List contacts
- `POST /` - Create contact
- `GET /{id}` - Get contact
- `PUT /{id}` - Update contact
- `DELETE /{id}` - Delete contact

### Messages (`/api/messages`)
- `GET /` - List messages
- `POST /` - Send message
- `GET /threads` - Get message threads

### Calendar (`/api/calendar`)
- `GET /events` - List events
- `POST /events` - Create event
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event

### Communications (`/api/comms`)
- `POST /sms` - Send SMS (Twilio/Telnyx)
- `POST /call` - Initiate call
- `POST /email` - Send email
- `GET /status` - Provider status

### Integrations (`/api/integrations`)
- `GET /status` - All integrations status
- `POST /telegram/configure` - Setup Telegram
- `POST /twilio/configure` - Setup Twilio
- `POST /whatsapp/auth-url` - WhatsApp OAuth
- `POST /{provider}/send` - Send via provider

### LiveKit/PTT (`/api/livekit`)
- `GET /config` - LiveKit configuration
- `POST /token` - Generate room token
- `GET /status` - Connection status

### AI (`/api/ai`)
- `GET /health` - AI service status
- `GET /companions` - List AI personalities
- `POST /chat` - Chat with AI
- `POST /draft-message` - Generate message draft
- `POST /content-suggestions` - Get content ideas

### Admin (`/api/admin`) - Requires admin auth
- `GET /metrics` - System metrics
- `GET /users` - List all users
- `PATCH /users/{id}` - Update user
- `GET /stats` - System statistics
- `GET /features` - Feature toggles
- `POST /features` - Update features
- `GET /theme` - Theme settings
- `PUT /theme` - Update theme

### Cart & Billing (`/api/cart`, `/api/billing`)
- `GET /cart` - Get cart items
- `POST /cart/add` - Add to cart
- `POST /checkout` - Process checkout
- `GET /billing/plans` - Subscription plans

### Credits (`/api/credits`)
- `GET /balance` - Get credit balance
- `POST /purchase` - Buy credits
- `POST /use` - Use credits

### Memberships (`/api/memberships`)
- `GET /` - List memberships
- `POST /` - Create membership
- `GET /subscribers` - List subscribers

### Settings (`/api/settings`)
- `GET /` - Get user settings (masked)
- `PUT /` - Update settings
- `POST /api-keys` - Save API keys
- `DELETE /api-keys/{key}` - Remove API key

---

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Main dashboard |
| Login | `/login` | User login |
| Register | `/register` | User signup |
| Contacts | `/contacts` | Contact management |
| Messages | `/messages` | Messaging inbox |
| Calendar | `/calendar` | Event calendar |
| Communications | `/communications` | SMS/Call/Email/PTT |
| AI Assistant | `/ai` | AI chat & tools |
| Integrations | `/integrations` | Provider setup |
| Settings | `/settings` | User settings/API keys |
| Admin | `/admin` | Admin panel |
| Cart | `/cart` | Shopping cart |
| Checkout | `/checkout` | Payment processing |
| Memberships | `/memberships` | Subscription tiers |
| Dispatch | `/dispatch` | Dispatch board |
| Workflows | `/workflows` | Automation rules |
| Billing | `/billing` | Billing history |
| Credits | `/credits` | Credit balance |

---

## Database Models

### User (`users`)
- id, email, password_hash, full_name
- role, comped, active_subscription, subscription_plan
- created_at, updated_at

### Contact (`contacts`)
- id, user_id, name, email, phone
- tags (JSONB), notes, source
- created_at, updated_at

### UserSettings (`user_settings`)
- user_id (primary key)
- openai_key, anthropic_key, groq_key, google_key
- twilio_account_sid, twilio_auth_token, twilio_phone_number
- telegram_bot_token, telnyx_api_key
- (all API keys stored encrypted)

### Payments Models (`payments.py`)
- Plan, Subscription, Transaction
- Payout, WebhookEvent, UserAccess
- AdminUser, FeatureToggle
- ThreadEvent, PaymentProviderConfig

---

## Deployment Commands

### Deploy Backend Changes
```bash
# Sync specific file
rsync -avz backend/app/routers/file.py root@rent.fanz.website:/var/www/crm-escort-ai/backend/app/routers/

# Sync entire backend
rsync -avz backend/app/ root@rent.fanz.website:/var/www/crm-escort-ai/backend/app/

# Restart backend
ssh root@rent.fanz.website "pm2 restart crm-escort-ai"
```

### Deploy Frontend Changes
```bash
# Build frontend
VITE_API_BASE_URL=https://rent.fanz.website \
VITE_LIVEKIT_URL=wss://wickedcrm-asme6nkk.livekit.cloud \
npm run build

# Deploy to server
rsync -avz --delete dist/ root@rent.fanz.website:/var/www/crm-escort-ai/frontend/
```

### Full Deployment
```bash
# Backend + Frontend + Restart
rsync -avz backend/app/ root@rent.fanz.website:/var/www/crm-escort-ai/backend/app/ && \
VITE_API_BASE_URL=https://rent.fanz.website VITE_LIVEKIT_URL=wss://wickedcrm-asme6nkk.livekit.cloud npm run build && \
rsync -avz --delete dist/ root@rent.fanz.website:/var/www/crm-escort-ai/frontend/ && \
ssh root@rent.fanz.website "pm2 restart crm-escort-ai"
```

---

## Server Management

### Check Process Status
```bash
ssh root@rent.fanz.website "pm2 status crm-escort-ai"
```

### View Logs
```bash
ssh root@rent.fanz.website "pm2 logs crm-escort-ai --lines 100"
```

### Restart Backend
```bash
ssh root@rent.fanz.website "pm2 restart crm-escort-ai"
```

### Check Environment Variables
```bash
ssh root@rent.fanz.website "cat /var/www/crm-escort-ai/backend/.env"
```

### Edit Environment Variables
```bash
ssh root@rent.fanz.website "nano /var/www/crm-escort-ai/backend/.env"
# Then restart: pm2 restart crm-escort-ai
```

---

## Admin Access

### Admin Panel
1. Go to https://rent.fanz.website/admin
2. Requires admin email or API key

### Authorized Admin Emails
- admin@wickedcrm.com
- wyatt@fanz.website
- wyattxxxcole@gmail.com

### Admin API Key
Use header: `X-Admin-Key: {ADMIN_API_KEY}`

---

## Common Fixes

### API Keys Not Saving
- Check JWT token contains user_id (`sub` claim)
- Verify user_settings table has all columns
- Check backend logs for errors

### WhatsApp Not Working
- Need META_APP_ID and META_APP_SECRET in .env
- Create app at developers.facebook.com
- Add OAuth redirect URI

### PTT Not Working
- LiveKit must be configured (check /api/livekit/status)
- Only works on web (not mobile yet)
- Check browser microphone permissions

### SMS Not Sending
- Configure Twilio in Settings page
- Or set env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

---

## Testing Endpoints

### Test Health
```bash
curl https://rent.fanz.website/api/ai/health
curl https://rent.fanz.website/api/livekit/status
curl https://rent.fanz.website/api/integrations/status
```

### Test Auth
```bash
# Login
curl -X POST https://rent.fanz.website/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

### Test with Auth Token
```bash
TOKEN="your-jwt-token"
curl https://rent.fanz.website/api/contacts \
  -H "Authorization: Bearer $TOKEN"
```

---

## Related FANZ Platforms

WickedCRM is part of the FANZ ecosystem:
- **FanzDash** (dash.fanz.website) - Central command center
- **BoyFanz, GirlFanz, etc.** - Niche platforms
- All share authentication and can be integrated

---

## Support

- **Issues**: Report at https://github.com/anthropics/claude-code/issues
- **Email**: dev@fanz.network
- **Docs**: This guide + PROJECT_SUMMARY.md

---

*Last Updated: December 2025*
