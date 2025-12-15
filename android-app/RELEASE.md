# WickedCRM SMS - Google Play Release Guide

## Pre-Release Checklist

### 1. Generate Release Keystore
```bash
cd /Users/wyattcole/Downloads/WickedCRM/workspace/android-app

# Generate keystore (SAVE THE PASSWORD - you'll need it forever!)
keytool -genkey -v -keystore wickedcrm-release.keystore \
  -alias wickedcrm \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### 2. Configure Signing
Create `local.properties` in the android-app directory:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
RELEASE_STORE_FILE=../wickedcrm-release.keystore
RELEASE_STORE_PASSWORD=your_keystore_password
RELEASE_KEY_ALIAS=wickedcrm
RELEASE_KEY_PASSWORD=your_key_password
```

### 3. Build Release Bundle
```bash
# Build AAB for Google Play
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab
```

### 4. Test Release Build
```bash
# Build APK for testing
./gradlew assembleRelease

# Install on device
adb install app/build/outputs/apk/release/app-release.apk
```

## Google Play Console Setup

### Step 1: Create App
1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
   - App name: **WickedCRM SMS**
   - Default language: English (US)
   - App or game: App
   - Free or paid: Free

### Step 2: Store Listing
1. **Short description** (80 chars): Use `store-listing/short-description.txt`
2. **Full description** (4000 chars): Use `store-listing/full-description.txt`
3. **App icon**: 512x512 PNG (create from ic_launcher_foreground.xml)
4. **Feature graphic**: 1024x500 PNG
5. **Screenshots**:
   - Phone: 2-8 screenshots
   - Tablet: Optional but recommended

### Step 3: App Content
1. **Privacy Policy**: Host `privacy-policy.html` and provide URL
2. **App access**: All functionality available without login
3. **Ads**: No ads
4. **Content rating**: Complete questionnaire (likely "Everyone")
5. **Target audience**: 18+ (due to CRM business features)
6. **News apps**: No
7. **COVID-19 apps**: No
8. **Data safety**: Complete based on privacy policy

### Step 4: SMS Permission Declaration (CRITICAL!)

Google requires special approval for SMS apps. In Play Console:

1. Go to **Policy > App content > Sensitive permissions**
2. Select **SMS/Call Log permissions**
3. Fill the declaration form:
   - **Permission type**: Default SMS handler
   - **Core functionality**: Use text from `sms-declaration.md`
4. Upload a **video demo** showing:
   - Setting app as default SMS
   - Sending a message
   - Receiving a message
   - Viewing conversations

### Step 5: Release

1. **Create release**:
   - Go to Production > Create new release
   - Upload `app-release.aab`
   - Add release notes

2. **Roll out**:
   - Start with staged rollout (10%)
   - Monitor for crashes
   - Increase to 100%

## Release Notes Template

```
Version 1.0.0

🚀 Initial Release

• Full SMS/MMS messaging
• Spam protection with automatic blocking
• AI-powered message insights
• Contact verification
• Cloud sync to WickedCRM (optional)
• Material You design
• Dark mode support
```

## Important URLs to Prepare

1. **Privacy Policy**: https://your-domain.com/privacy
2. **Support Email**: support@wickedcrm.com
3. **Website**: https://wickedcrm.com

## Post-Launch

1. Monitor Play Console for:
   - Crash reports (Android Vitals)
   - User reviews
   - Installation stats

2. Respond to reviews within 24 hours

3. Plan updates:
   - Bug fixes within 1 week
   - Feature updates monthly

## Common Rejection Reasons (Avoid These!)

1. ❌ SMS permission without being default handler
2. ❌ Missing privacy policy
3. ❌ Unclear permission usage
4. ❌ Missing SMS declaration video
5. ❌ App crashes on launch

## File Checklist

- [ ] `wickedcrm-release.keystore` - Generated and backed up
- [ ] `local.properties` - Configured with signing info
- [ ] `app-release.aab` - Built and tested
- [ ] `privacy-policy.html` - Hosted online
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone + tablet)
- [ ] Demo video for SMS declaration
