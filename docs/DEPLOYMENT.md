# CRM Escort - Deployment & Development Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Docker Setup](#docker-setup)
- [Production Deployment](#production-deployment)
- [Mobile Development](#mobile-development)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **macOS**, **Linux**, or **Windows with WSL2**
- **Docker** 24+ and **Docker Compose** 2+
- **Python** 3.11+
- **Node.js** 18+ (for mobile development)
- **Xcode** 15+ (for iOS development)
- **Android Studio** (for Android development)

### API Keys & Services
You'll need accounts and API keys for:
- **OpenAI** (for AI extraction)
- **Twilio** (for SMS)
- **Google Cloud** (for Calendar OAuth)
- **Microsoft Azure** (optional, for Outlook Calendar)

---

## Local Development Setup

### 1. Clone & Environment Setup

```bash
cd ~/Downloads/crm-escort-ai
cp .env.example .env
# Edit .env with your actual keys
```

### 2. Start Database Services

```bash
docker-compose up -d postgres redis
```

Wait for services to be healthy:
```bash
docker-compose ps
```

### 3. Initialize Database

```bash
# The schema will auto-initialize on first run via docker-entrypoint-initdb.d
# Or manually run:
docker exec -i crm-escort-postgres psql -U crm_user -d crm_escort < backend/schema.sql
```

### 4. Backend Setup (Python)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 5. Run Backend

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`  
API docs at: `http://localhost:8000/docs`

### 6. Run Background Worker

In a new terminal:
```bash
cd backend
source venv/bin/activate
python -m app.workers.worker
```

---

## Docker Setup

### Full Stack with Docker Compose

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Backend API** on port 8000
- **Worker** (background jobs)

### Useful Docker Commands

```bash
# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f worker

# Restart specific service
docker-compose restart backend

# Access database
docker exec -it crm-escort-postgres psql -U crm_user -d crm_escort

# Access Redis CLI
docker exec -it crm-escort-redis redis-cli
```

---

## Production Deployment

### Option 1: Cloud VPS (DigitalOcean, Linode, etc.)

#### 1. Server Setup
```bash
# On your server
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose git -y
sudo usermod -aG docker $USER
```

#### 2. Clone & Configure
```bash
git clone <your-repo-url> crm-escort-ai
cd crm-escort-ai
cp .env.example .env
nano .env  # Fill in production values
```

#### 3. SSL with Nginx & Certbot
```bash
sudo apt install nginx certbot python3-certbot-nginx -y

# Create nginx config
sudo nano /etc/nginx/sites-available/crm-escort
```

Nginx config:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and get SSL:
```bash
sudo ln -s /etc/nginx/sites-available/crm-escort /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d api.yourdomain.com
```

#### 4. Run with Docker Compose
```bash
docker-compose up -d
docker-compose logs -f
```

### Option 2: AWS / GCP / Azure

See specific deployment guides for:
- **AWS ECS** + RDS + ElastiCache
- **GCP Cloud Run** + Cloud SQL + Memorystore
- **Azure Container Instances** + Azure Database for PostgreSQL

---

## Mobile Development

### iOS Setup

#### Prerequisites
- macOS with Xcode 15+
- CocoaPods or Swift Package Manager
- Apple Developer Account (for device testing)

#### Steps
```bash
cd mobile/ios
# Instructions will be in mobile/ios/README.md
open CRMEscort.xcodeproj
```

Key files to configure:
- `Config.swift` - Update API base URL
- `Info.plist` - Add required permissions
- Signing & Capabilities - Configure your team

### Android Setup

#### Prerequisites
- Android Studio Hedgehog+
- Android SDK 29+ (Android 10+)
- JDK 17+

#### Steps
```bash
cd mobile/android
# Instructions will be in mobile/android/README.md
./gradlew assembleDebug
```

Key files to configure:
- `local.properties` - Set SDK path
- `app/src/main/res/values/strings.xml` - Update API URL
- `AndroidManifest.xml` - Add required permissions

---

## Integrations Setup

### Twilio SMS

1. Sign up at [twilio.com](https://twilio.com)
2. Get a phone number
3. Set webhook URL in Twilio console:
   ```
   https://your-api-domain.com/messages/sms/webhook
   ```
4. Add credentials to `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxx
   TWILIO_FROM_NUMBER=+1234567890
   ```

### Google Calendar OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **Google Calendar API**
4. Create OAuth 2.0 credentials
5. Add redirect URI: `https://your-api-domain.com/auth/google/callback`
6. Add to `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### RM Chat Integration

If RM (Rent.Men) provides an official API:
1. Contact RM support for API access
2. Get API key/credentials
3. Add to `.env`:
   ```
   RM_CHAT_API_KEY=your-key
   ```

If no API available, use:
- **Email notifications** → parse and ingest
- **Share/forward** → manual ingestion via app
- **Notification forwarding** → bridge service

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection
docker exec -it crm-escort-postgres psql -U crm_user -d crm_escort -c "SELECT 1;"
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
docker exec -it crm-escort-redis redis-cli ping
# Should return: PONG
```

### Backend Not Starting

```bash
# Check environment variables
cat .env | grep -v "^#"

# Check Python dependencies
pip list | grep fastapi

# Run with debug mode
uvicorn app.main:app --reload --log-level debug
```

### Worker Not Processing Jobs

```bash
# Check Redis queue
docker exec -it crm-escort-redis redis-cli
> KEYS *
> LLEN rq:queue:default

# Check worker logs
docker-compose logs -f worker

# Manually enqueue a test job
python scripts/test_worker.py
```

### AI Extraction Failing

```bash
# Check OpenAI API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check logs for specific errors
docker-compose logs worker | grep "ai_extraction"
```

### Twilio Webhook Not Receiving

1. Check webhook URL is publicly accessible:
   ```bash
   curl -X POST https://your-api-domain.com/messages/sms/webhook \
     -d "From=+1234567890&Body=test&MessageSid=test123"
   ```

2. Check Twilio webhook logs in console
3. Verify phone number mapping exists

### Rate Limiting Issues

Adjust in `.env`:
```
RATE_LIMIT_PER_MINUTE=120  # Increase if needed
```

---

## Performance Optimization

### Database
- Enable connection pooling
- Add indexes for frequently queried fields
- Use `EXPLAIN ANALYZE` for slow queries

### Redis
- Monitor memory usage
- Set appropriate `maxmemory-policy`
- Use Redis Insight for debugging

### AI Processing
- Batch multiple messages for extraction
- Cache common extraction patterns
- Use faster models for simple tasks (gpt-4.1-mini)

### Mobile Apps
- Implement aggressive caching
- Use pagination for all lists
- Compress API responses (gzip)
- Use CDN for static assets

---

## Monitoring & Logging

### Application Logs
```bash
# Backend logs
docker-compose logs -f backend | grep ERROR

# Worker logs
docker-compose logs -f worker

# All services
docker-compose logs -f
```

### Database Monitoring
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;
```

### Redis Monitoring
```bash
docker exec -it crm-escort-redis redis-cli INFO stats
docker exec -it crm-escort-redis redis-cli MONITOR
```

---

## Backup & Restore

### Database Backup
```bash
# Backup
docker exec crm-escort-postgres pg_dump -U crm_user crm_escort > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i crm-escort-postgres psql -U crm_user crm_escort < backup_20250126.sql
```

### Redis Backup
```bash
# Redis automatically saves to /data
# Copy backup file
docker cp crm-escort-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS (TLS 1.3)
- [ ] Restrict CORS origins in production
- [ ] Enable rate limiting
- [ ] Regular dependency updates
- [ ] Database encrypted at rest
- [ ] Secrets in environment variables (never in code)
- [ ] Regular backups (automated)
- [ ] Monitor for suspicious activity
- [ ] 2FA for admin accounts
- [ ] Regular security audits

---

## Support & Resources

- **API Documentation**: `http://localhost:8000/docs`
- **Database Schema**: `backend/schema.sql`
- **Design System**: `design/figma-pack/DESIGN_SYSTEM.md`
- **GitHub Issues**: `<your-repo-url>/issues`
- **Email Support**: dev@fanz.network

---

**Last Updated**: November 2025  
**Version**: 1.0
