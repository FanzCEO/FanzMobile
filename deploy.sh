#!/bin/bash
# FanzMobile Deployment Script
# Cloud Drive for Media Processing, Compliance & AI Automation

set -e

SERVER="server.fanzgroupholdings.com"
DEPLOY_PATH="/opt/fanzmobile"
NGINX_CONF="/etc/nginx/conf.d/mobile.fanz.website.conf"

echo "=========================================="
echo "FanzMobile Deployment"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Deploy nginx configuration
echo -e "\n${YELLOW}[1/5] Deploying nginx configuration...${NC}"
scp ./nginx/mobile.fanz.website.conf root@${SERVER}:${NGINX_CONF}
ssh root@${SERVER} "nginx -t && systemctl reload nginx"
echo -e "${GREEN}✓ Nginx configuration deployed${NC}"

# Step 2: Deploy application code
echo -e "\n${YELLOW}[2/5] Syncing application files...${NC}"
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'coverage' \
    ./ root@${SERVER}:${DEPLOY_PATH}/
echo -e "${GREEN}✓ Files synced${NC}"

# Step 3: Install dependencies and build
echo -e "\n${YELLOW}[3/5] Installing dependencies and building...${NC}"
ssh root@${SERVER} "cd ${DEPLOY_PATH} && npm install --legacy-peer-deps && npm run build"
echo -e "${GREEN}✓ Build complete${NC}"

# Step 4: Update PM2 with new port
echo -e "\n${YELLOW}[4/5] Updating PM2 configuration...${NC}"
ssh root@${SERVER} "pm2 delete fanzmobile 2>/dev/null || true"
ssh root@${SERVER} "cd ${DEPLOY_PATH} && pm2 start ecosystem.config.cjs --env production"
ssh root@${SERVER} "pm2 save"
echo -e "${GREEN}✓ PM2 updated - now running on port 3102${NC}"

# Step 5: Verify deployment
echo -e "\n${YELLOW}[5/5] Verifying deployment...${NC}"
sleep 5
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://mobile.fanz.website/health || echo "000")
if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed (HTTP $HEALTH)${NC}"
else
    echo -e "${RED}✗ Health check returned HTTP $HEALTH${NC}"
    echo "  Check logs: ssh root@${SERVER} 'pm2 logs fanzmobile --lines 50'"
fi

echo -e "\n${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "FanzMobile is now running at: https://mobile.fanz.website"
echo ""
echo "Commands:"
echo "  View logs:    ssh root@${SERVER} 'pm2 logs fanzmobile'"
echo "  Restart:      ssh root@${SERVER} 'pm2 restart fanzmobile'"
echo "  Status:       ssh root@${SERVER} 'pm2 status'"
