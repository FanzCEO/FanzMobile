# FANZ Mobile - Deployment Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd workspace/shadcn-ui
pnpm install
```

### 2. Configure Environment
Create a `.env` file in the project root with:

```env
# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://mcayxybcgxhfttvwmhgm.supabase.co
# Or use custom domain:
# VITE_SUPABASE_URL=https://db.fanz.website
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jYXl4eWJjZ3hoZnR0dndtaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjc3MjEsImV4cCI6MjA3NzYwMzcyMX0.EBFJ8_9Z_jPrjntg9JBFFbuGuJaN1zKxoXlGk4Jln-s

# Payment Processors
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx
VITE_PAYPAL_CLIENT_ID=xxx

# Social OAuth (for cross-posting)
VITE_TWITTER_CLIENT_ID=xxx
VITE_REDDIT_CLIENT_ID=xxx
VITE_INSTAGRAM_APP_ID=xxx
VITE_TIKTOK_CLIENT_KEY=xxx

# App Config
VITE_APP_URL=https://mobile.fanz.website
VITE_API_URL=https://api.fanz.website
```

### 3. Build for Production
```bash
pnpm build
```

The build output will be in the `dist/` folder.

---

## 📱 App Store Deployment

### Option 1: PWABuilder (Recommended)

1. **Visit**: https://www.pwabuilder.com
2. **Enter URL**: `https://mobile.fanz.website`
3. **Generate packages** for:
   - **iOS**: Xcode project with WKWebView wrapper
   - **Android**: Trusted Web Activity (TWA) APK
   - **Windows**: MSIX package

### Option 2: Manual Setup

#### iOS (Apple App Store)

1. **Requirements**:
   - Apple Developer Account ($99/year)
   - Mac with Xcode installed
   - App Store Connect access

2. **Steps**:
   ```bash
   # Install Capacitor
   npm install @capacitor/core @capacitor/ios
   npx cap init "FANZ Mobile" "com.fanz.mobile"
   npx cap add ios
   
   # Build and sync
   pnpm build
   npx cap sync ios
   
   # Open in Xcode
   npx cap open ios
   ```

3. **In Xcode**:
   - Set signing team
   - Configure capabilities (Push, Background)
   - Archive and upload to App Store Connect

#### Android (Google Play)

1. **Requirements**:
   - Google Play Developer Account ($25 one-time)
   - Java JDK installed

2. **Steps**:
   ```bash
   # Install Capacitor
   npm install @capacitor/core @capacitor/android
   npx cap add android
   
   # Build and sync
   pnpm build
   npx cap sync android
   
   # Open in Android Studio
   npx cap open android
   ```

3. **In Android Studio**:
   - Generate signed APK/AAB
   - Upload to Google Play Console

---

## 🔌 API Credentials Setup

### Supabase
- **URL**: `https://mcayxybcgxhfttvwmhgm.supabase.co`
- **Custom Domain**: `https://db.fanz.website`
- **Anon Key**: Already configured in .env example above
- **Database Connection** (for backend only):
  ```
  DATABASE_URL=postgres://postgres:xxx@db.mcayxybcgxhfttvwmhgm.supabase.co:6543/postgres?pgbouncer=true
  DIRECT_URL=postgres://postgres:xxx@db.mcayxybcgxhfttvwmhgm.supabase.co:5432/postgres
  ```

### Stripe
1. Visit https://dashboard.stripe.com/apikeys
2. Copy Publishable key (starts with `pk_`)
3. Add to `.env` as `VITE_STRIPE_PUBLIC_KEY`

### PayPal
1. Visit https://developer.paypal.com/dashboard/applications
2. Create app and get Client ID
3. Add to `.env` as `VITE_PAYPAL_CLIENT_ID`

### Twitter/X OAuth
1. Visit https://developer.twitter.com/en/portal/dashboard
2. Create project and get Client ID
3. Add callback URL: `https://mobile.fanz.website/auth/twitter/callback`

### Reddit OAuth
1. Visit https://www.reddit.com/prefs/apps
2. Create "web app" and get Client ID
3. Add redirect URI: `https://mobile.fanz.website/auth/reddit/callback`

### Instagram/Meta
1. Visit https://developers.facebook.com/apps
2. Create app with Instagram Basic Display
3. Add callback: `https://mobile.fanz.website/auth/instagram/callback`

### TikTok
1. Visit https://developers.tiktok.com
2. Create app and get Client Key
3. Add redirect: `https://mobile.fanz.website/auth/tiktok/callback`

### VerifyMy (Age Verification)
1. Contact VerifyMy for API access
2. Add key to backend environment

---

## 📊 Platform URLs

| Platform | URL | Status |
|----------|-----|--------|
| BoyFanz | https://boyfanz.fmd.solutions | ✅ Active |
| GirlFanz | https://girlfanz.fmd.solutions | ✅ Active |
| PupFanz | https://pupfanz.fmd.solutions | ✅ Active |
| BearFanz | https://bearfanz.fmd.solutions | ✅ Active |
| CougarFanz | https://cougarfanz.fmd.solutions | ✅ Active |
| FanzDash | https://fanzdash.fmd.solutions | ✅ Active |
| FanzDiscreet | https://dlbroz.fmd.solutions | ✅ Active |
| FanzUncut | https://fanzuncut.fmd.solutions | ✅ Active |
| FemmeFanz | https://femmefanz.fmd.solutions | ✅ Active |
| GayFanz | https://gayfanz.fmd.solutions | ✅ Active |
| Guyz | https://guyz.fmd.solutions | ✅ Active |
| SouthernFanz | https://southernfanz.fmd.solutions | ✅ Active |
| TabooFanz | https://taboofanz.fmd.solutions | ✅ Active |
| TransFanz | https://transfanz.fmd.solutions | ✅ Active |

---

## 🔒 Security Checklist

- [ ] All API keys in environment variables (not in code)
- [ ] HTTPS enforced on all endpoints
- [ ] Content Security Policy headers configured
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all forms
- [ ] CORS properly configured
- [ ] Service worker uses network-first for sensitive data

---

## 📁 File Structure

```
workspace/shadcn-ui/
├── src/
│   ├── components/     # UI components
│   ├── hooks/          # React hooks (including useSupabase.ts)
│   ├── lib/            # Utilities and Supabase client
│   ├── pages/          # Page components
│   └── config/         # Environment config
├── public/
│   ├── manifest.json   # PWA manifest
│   ├── offline.html    # Offline fallback page
│   └── icons/          # App icons (need to add)
├── pwabuilder-sw.js    # Service worker
├── pwabuilder.json     # PWABuilder config
└── index.html          # Entry point
```

---

## 🧪 Testing

### Local Development
```bash
pnpm dev
```
Visit http://localhost:5173

### PWA Testing
1. Build: `pnpm build`
2. Preview: `pnpm preview`
3. Open Chrome DevTools → Application → Service Workers

### Lighthouse Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit for PWA, Performance, Accessibility

---

## 🆘 Troubleshooting

### Service Worker Not Registering
- Ensure HTTPS is enabled
- Check browser console for errors
- Clear cache and reload

### Supabase Connection Issues
- Verify VITE_SUPABASE_URL is correct
- Check anon key is valid
- Ensure RLS policies allow access

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

---

## 📞 Support

- Documentation: https://docs.fanz.website
- Support: support@fanz.website
- Status: https://status.fanz.website

