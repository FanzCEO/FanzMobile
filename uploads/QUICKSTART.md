# CRM Escort - Quick Start (5 Minutes)

## 🚀 Get Running in 5 Minutes

### 1. Prerequisites Check
```bash
docker --version   # Need 24+
python3 --version  # Need 3.11+
```

### 2. Set Up Environment
```bash
cd ~/Downloads/crm-escort-ai
cp .env.example .env
```

Edit `.env` and add at minimum:
```bash
OPENAI_API_KEY=sk-your-key-here
JWT_SECRET=your-random-32-char-secret-here
POSTGRES_PASSWORD=your-db-password
```

### 3. Start Everything
```bash
docker-compose up -d
```

### 4. Check Status
```bash
docker-compose ps
```

All services should show "healthy" or "running".

### 5. Test the API
```bash
# Check health
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs
```

---

## ✅ What You Now Have

- **Backend API** running on http://localhost:8000
- **PostgreSQL** with schema initialized
- **Redis** for background jobs
- **Worker** processing AI tasks
- **API Docs** at http://localhost:8000/docs

---

## 🧪 Test the AI Pipeline

### Create a Test User (via API docs at /docs)

1. Go to http://localhost:8000/docs
2. Expand **POST /auth/register**
3. Click "Try it out"
4. Use this JSON:
```json
{
  "email": "test@example.com",
  "password": "test123",
  "full_name": "Test User"
}
```
5. Click "Execute"
6. Save the `access_token` from response

### Send a Test Message

1. Expand **POST /messages/manual**
2. Click "Try it out"
3. Add Authorization header: `Bearer your-access-token`
4. Use this JSON:
```json
{
  "body": "Hey it's Mike, let's meet at my hotel in Atlanta tomorrow at 3pm",
  "channel": "sms"
}
```
5. Click "Execute"

### Check AI Extraction

Wait 5-10 seconds, then:

1. Expand **GET /messages**
2. Execute with your token
3. You should see the message with AI extraction in `ai_result`:
   - Meeting detected
   - Contact name extracted
   - Time and location parsed

---

## 📱 Next Steps

### For Backend Development
- [ ] Read `docs/DEPLOYMENT.md` for full setup
- [ ] Explore `backend/schema.sql` for data model
- [ ] Check `backend/app/` for code structure

### For Mobile Development
- [ ] iOS: Open `mobile/ios/README.md`
- [ ] Android: Open `mobile/android/README.md`

### For Design/UI
- [ ] Open `design/figma-pack/DESIGN_SYSTEM.md`
- [ ] Import color/typography tokens into Figma
- [ ] Build component library

### Set Up Integrations
- [ ] Twilio SMS (see DEPLOYMENT.md)
- [ ] Google Calendar OAuth
- [ ] RM Chat (if available)

---

## 🛑 Common Issues

### "Connection refused" to database
```bash
docker-compose up -d postgres
docker-compose logs postgres
```

### "OpenAI API Error"
Check your `.env` has valid `OPENAI_API_KEY`

### Worker not processing
```bash
docker-compose logs worker
# Check Redis is running:
docker-compose ps redis
```

---

## 📚 Full Documentation

- **Main README**: `README.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **Database Schema**: `backend/schema.sql`
- **Design System**: `design/figma-pack/DESIGN_SYSTEM.md`
- **API Docs**: http://localhost:8000/docs (when running)

---

## 🎯 Key Features to Explore

1. **Smart Message Parsing** - Send messages, get AI extraction
2. **Auto-Contacts** - Contacts automatically created from messages
3. **Meeting Detection** - AI finds meetings in conversations
4. **Location Intelligence** - Tracks cities, hotels, meetup spots
5. **Workflow Automation** - Auto-responses and follow-ups
6. **Multi-Channel** - SMS, RM Chat, email, manual input

---

## 💬 Need Help?

- Check `docs/DEPLOYMENT.md` troubleshooting section
- Review API docs at http://localhost:8000/docs
- Contact: dev@fanz.network

---

**Ready to build?** Start with the backend, then move to mobile apps! 🚀
