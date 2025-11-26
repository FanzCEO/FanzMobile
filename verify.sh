#!/bin/bash
# Quick verification script for CRM Escort AI deployment

set -e

echo "🔍 CRM Escort AI - Deployment Verification"
echo "==========================================="
echo ""

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed: $(docker --version)"
else
    echo "❌ Docker not found - please install Docker first"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose is installed: $(docker-compose --version)"
else
    echo "❌ Docker Compose not found - please install Docker Compose first"
    exit 1
fi

# Check .env file
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check for required variables
    if grep -q "POSTGRES_PASSWORD=" .env && ! grep -q "POSTGRES_PASSWORD=your_secure" .env; then
        echo "✅ POSTGRES_PASSWORD is configured"
    else
        echo "⚠️  POSTGRES_PASSWORD needs to be configured in .env"
    fi
    
    if grep -q "JWT_SECRET=" .env && ! grep -q "JWT_SECRET=your_jwt" .env; then
        echo "✅ JWT_SECRET is configured"
    else
        echo "⚠️  JWT_SECRET needs to be configured in .env"
    fi
    
    if grep -q "OPENAI_API_KEY=" .env && ! grep -q "OPENAI_API_KEY=sk-your" .env; then
        echo "✅ OPENAI_API_KEY is configured"
    else
        echo "⚠️  OPENAI_API_KEY needs to be configured in .env"
    fi
else
    echo "⚠️  .env file not found - copy .env.example to .env and configure"
fi

# Check project files
echo ""
echo "📦 Checking project files..."
files=("backend/Dockerfile" "backend/requirements.txt" "backend/schema.sql" "docker-compose.yml" "backend/app/main.py")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file not found"
    fi
done

# Check routers
echo ""
echo "🔌 Checking API routers..."
routers=("auth" "messages" "contacts" "calendar" "workflows")

for router in "${routers[@]}"; do
    if [ -f "backend/app/routers/${router}.py" ]; then
        echo "✅ ${router}.py"
    else
        echo "❌ ${router}.py not found"
    fi
done

echo ""
echo "==========================================="
echo "✨ Verification complete!"
echo ""
echo "To deploy:"
echo "  1. Configure .env if not done already"
echo "  2. Run: docker-compose up -d"
echo "  3. Check: curl http://localhost:8000/health"
echo ""
