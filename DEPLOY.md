# 🚀 Deployment Guide - CRM Escort AI

## ✅ Deploy-Ready Status

The project is now **deploy-ready** with:
- ✅ FastAPI backend with all core routers
- ✅ Dockerfile for containerization
- ✅ Docker Compose orchestration
- ✅ Background worker stub
- ✅ Database schema and init script
- ✅ Health check endpoints
- ✅ Environment configuration

## Quick Deploy with Docker Compose

### 1. Clone the Repository
```bash
git clone https://github.com/FanzCEO/crm-escort-ai.git
cd crm-escort-ai
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and fill in your secrets:
# - POSTGRES_PASSWORD
# - JWT_SECRET
# - OPENAI_API_KEY
# - TWILIO credentials
# - Google/Outlook OAuth credentials
```

### 3. Start Services
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- FastAPI backend (port 8000)
- Background worker

### 4. Initialize Database
```bash
docker-compose exec backend python scripts/init_db.py
```

### 5. Verify Deployment
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","service":"crm-escort-ai","version":"0.1.0"}

# API docs available at:
open http://localhost:8000/docs
```

## Production Deployment

### Option 1: Cloud Platform (DigitalOcean, AWS, GCP)

1. **Provision a VM** (2GB RAM minimum)
2. **Install Docker & Docker Compose**
3. **Clone repo and configure .env**
4. **Run docker-compose up -d**
5. **Set up reverse proxy (nginx) with SSL**

### Option 2: Kubernetes

Use the provided Docker images:
```bash
docker build -t fanzcrm/backend:latest ./backend
docker push fanzcrm/backend:latest
```

Then deploy with your K8s manifests.

### Option 3: Serverless (AWS Lambda, Google Cloud Run)

The FastAPI app is compatible with:
- AWS Lambda (via Mangum adapter)
- Google Cloud Run (native container support)
- Azure Container Instances

## Environment Variables

Required:
- `POSTGRES_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing key (32+ characters)
- `OPENAI_API_KEY` - OpenAI API key for AI features

Optional:
- `TWILIO_ACCOUNT_SID` - For SMS integration
- `TWILIO_AUTH_TOKEN`
- `GOOGLE_CLIENT_ID` - For Google Calendar
- `GOOGLE_CLIENT_SECRET`
- `OUTLOOK_CLIENT_ID` - For Outlook Calendar
- `OUTLOOK_CLIENT_SECRET`

## Health Checks

- **API Health**: `GET /health`
- **Database**: Check via postgres container
- **Redis**: Check via redis container

## Monitoring

Add to your monitoring stack:
- Health check endpoint: `/health`
- Application logs: `docker-compose logs -f backend`
- Worker logs: `docker-compose logs -f worker`

## Scaling

**Horizontal Scaling:**
```bash
docker-compose up -d --scale backend=3 --scale worker=2
```

**Add Load Balancer:**
Use nginx or cloud load balancer to distribute traffic across backend instances.

## Security Checklist

- [ ] Change default database password
- [ ] Generate secure JWT secret (32+ characters)
- [ ] Enable TLS/SSL (use Let's Encrypt)
- [ ] Set up firewall rules
- [ ] Configure CORS origins for production
- [ ] Enable rate limiting
- [ ] Set up log aggregation
- [ ] Configure backup strategy

## Troubleshooting

**Backend won't start:**
```bash
docker-compose logs backend
# Check for missing environment variables
```

**Database connection fails:**
```bash
docker-compose exec postgres psql -U crm_user -d crm_escort
# Verify database is accessible
```

**Worker not processing:**
```bash
docker-compose logs worker
# Check Redis connection
```

## Next Steps

After deployment:
1. Implement database models and queries
2. Add JWT authentication logic
3. Integrate OpenAI for message extraction
4. Set up Twilio webhook for SMS
5. Implement calendar sync with Google/Outlook
6. Build mobile apps (iOS/Android)

## Support

For issues: https://github.com/FanzCEO/crm-escort-ai/issues
