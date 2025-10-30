# FanzMobile Deployment Guide

Complete guide for deploying FanzMobile to various platforms and distribution channels.

## Table of Contents
- [Prerequisites](#prerequisites)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Android Deployment](#android-deployment)
- [iOS Deployment](#ios-deployment)
- [CodePush OTA Updates](#codepush-ota-updates)
- [Firebase App Distribution](#firebase-app-distribution)
- [Production Release](#production-release)

## Prerequisites

### Required Accounts & Tools
- **GitHub** account with repository access
- **Firebase** project configured
- **Apple Developer** account ($99/year)
- **Google Play Console** account ($25 one-time)
- **Microsoft App Center** account (for CodePush)

### Required Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

#### Android Secrets
```bash
ANDROID_SIGNING_KEY          # Base64 encoded keystore file
ANDROID_KEY_ALIAS            # Key alias
ANDROID_KEYSTORE_PASSWORD    # Keystore password
ANDROID_KEY_PASSWORD         # Key password
FIREBASE_ANDROID_APP_ID      # Firebase App ID for Android
```

#### iOS Secrets
```bash
IOS_CERTIFICATE_P12          # Base64 encoded .p12 certificate
IOS_CERTIFICATE_PASSWORD     # Certificate password
IOS_PROVISIONING_PROFILE     # Base64 encoded provisioning profile
FIREBASE_IOS_APP_ID          # Firebase App ID for iOS
APPSTORE_ISSUER_ID           # App Store Connect API Issuer ID
APPSTORE_API_KEY_ID          # App Store Connect API Key ID
APPSTORE_API_PRIVATE_KEY     # App Store Connect API Private Key
```

#### Shared Secrets
```bash
FIREBASE_SERVICE_ACCOUNT     # Firebase service account JSON
CODEPUSH_KEY_IOS             # CodePush deployment key for iOS
CODEPUSH_KEY_ANDROID         # CodePush deployment key for Android
```

---

## GitHub Actions CI/CD

### Automated Workflows

#### 1. CI Workflow (`.github/workflows/ci.yml`)
**Trigger**: Every push and PR to `main` or `develop`

**What it does**:
- Runs ESLint
- TypeScript type checking
- Unit tests with coverage
- Uploads coverage to Codecov

```bash
# Manual trigger
gh workflow run ci.yml
```

#### 2. Android Build (`.github/workflows/build-android.yml`)
**Trigger**:
- Push to `main` or `release/*` branches
- Tags starting with `v*`
- Manual workflow dispatch

**What it does**:
- Builds Release APK
- Builds App Bundle (AAB) for Play Store
- Signs APK
- Uploads artifacts
- Deploys to Firebase App Distribution

```bash
# Manual trigger (release build)
gh workflow run build-android.yml -f build_type=release

# Manual trigger (debug build)
gh workflow run build-android.yml -f build_type=debug
```

**Artifacts**:
- APK: `fanz-mobile-android-apk` (14 days retention)
- AAB: `fanz-mobile-android-aab` (30 days retention)

#### 3. iOS Build (`.github/workflows/build-ios.yml`)
**Trigger**:
- Push to `main` or `release/*` branches
- Tags starting with `v*`
- Manual workflow dispatch

**What it does**:
- Installs CocoaPods dependencies
- Builds Release IPA
- Signs with provisioning profile
- Uploads to Firebase App Distribution
- Uploads to TestFlight (on tags)

```bash
# Manual trigger (release build)
gh workflow run build-ios.yml -f build_type=release

# Manual trigger (debug build)
gh workflow run build-ios.yml -f build_type=debug
```

**Artifacts**:
- IPA: `fanz-mobile-ios-ipa` (14 days retention)

---

## Android Deployment

### 1. Generate Signing Key (First Time Only)

```bash
# Generate keystore
keytool -genkey -v -keystore fanz-mobile.keystore \
  -alias fanz-mobile-key \
  -keyalg RSA -keysize 2048 -validity 10000

# Convert to base64 for GitHub secret
base64 -i fanz-mobile.keystore | pbcopy
```

### 2. Configure Gradle Signing

Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('FANZ_UPLOAD_STORE_FILE')) {
                storeFile file(FANZ_UPLOAD_STORE_FILE)
                storePassword FANZ_UPLOAD_STORE_PASSWORD
                keyAlias FANZ_UPLOAD_KEY_ALIAS
                keyPassword FANZ_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

### 3. Local Build

```bash
# Debug APK
cd android && ./gradlew assembleDebug

# Release APK
cd android && ./gradlew assembleRelease

# Release AAB (for Play Store)
cd android && ./gradlew bundleRelease
```

**Output Locations**:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### 4. Google Play Console Deployment

1. Go to [Google Play Console](https://play.google.com/console)
2. Create app (first time) or select existing
3. Navigate to: **Production** > **Create new release**
4. Upload AAB file
5. Add release notes
6. Review and rollout

**Note**: First release requires manual upload. Subsequent releases can use Google Play API.

---

## iOS Deployment

### 1. Code Signing Setup

#### Generate Certificates (First Time)
```bash
# Create Certificate Signing Request (CSR)
# Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority

# Create Distribution Certificate in Apple Developer Portal
# https://developer.apple.com/account/resources/certificates/list

# Export as .p12
# Keychain Access > My Certificates > Right-click > Export

# Convert to base64
base64 -i Certificates.p12 | pbcopy
```

#### Generate Provisioning Profile
1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/profiles/list)
2. Create App Store provisioning profile
3. Download and convert to base64:
```bash
base64 -i FanzMobile_AppStore.mobileprovision | pbcopy
```

### 2. Create exportOptions.plist

Create `ios/exportOptions.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>manual</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>com.fanz.mobile</key>
        <string>YOUR_PROVISIONING_PROFILE_NAME</string>
    </dict>
</dict>
</plist>
```

### 3. Local Build

```bash
# Install dependencies
cd ios && pod install && cd ..

# Build archive
cd ios
xcodebuild -workspace FanzMobile.xcworkspace \
  -scheme FanzMobile \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath FanzMobile.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath FanzMobile.xcarchive \
  -exportOptionsPlist exportOptions.plist \
  -exportPath ./build \
  -allowProvisioningUpdates
```

**Output**: `ios/build/FanzMobile.ipa`

### 4. TestFlight / App Store Deployment

#### Option 1: Xcode (Manual)
1. Open `ios/FanzMobile.xcworkspace` in Xcode
2. Product > Archive
3. Window > Organizer > Distribute App
4. Select "App Store Connect"
5. Upload and submit

#### Option 2: Command Line
```bash
# Upload to TestFlight
xcrun altool --upload-app \
  --type ios \
  --file build/FanzMobile.ipa \
  --username "your@email.com" \
  --password "@keychain:APPLE_APP_SPECIFIC_PASSWORD"
```

#### Option 3: Automated (GitHub Actions)
- Push a tag: `git tag v1.0.0 && git push origin v1.0.0`
- Workflow automatically uploads to TestFlight

---

## CodePush OTA Updates

### Setup

1. **Install App Center CLI**:
```bash
npm install -g appcenter-cli
appcenter login
```

2. **Create Apps**:
```bash
appcenter apps create -d FanzMobile-iOS -o iOS -p React-Native
appcenter apps create -d FanzMobile-Android -o Android -p React-Native
```

3. **Add Deployment Keys to GitHub Secrets**:
```bash
# Get deployment keys
appcenter codepush deployment list -a YourOrg/FanzMobile-iOS -k
appcenter codepush deployment list -a YourOrg/FanzMobile-Android -k

# Add to .env
CODEPUSH_KEY_IOS=<production-key>
CODEPUSH_KEY_ANDROID=<production-key>
```

### Deploy Updates

```bash
# iOS
appcenter codepush release-react \
  -a YourOrg/FanzMobile-iOS \
  -d Production \
  -t "1.0.0" \
  --description "Bug fixes and improvements"

# Android
appcenter codepush release-react \
  -a YourOrg/FanzMobile-Android \
  -d Production \
  -t "1.0.0" \
  --description "Bug fixes and improvements"
```

### Rollback

```bash
# Rollback to previous version
appcenter codepush rollback -a YourOrg/FanzMobile-iOS Production
appcenter codepush rollback -a YourOrg/FanzMobile-Android Production
```

---

## Firebase App Distribution

### Setup

1. **Create Firebase Project**: https://console.firebase.google.com
2. **Add iOS and Android apps**
3. **Download service account key**:
   - Project Settings > Service Accounts
   - Generate New Private Key
   - Convert to base64 and add to GitHub secrets

### Manual Distribution

```bash
# Install Firebase CLI
npm install -g firebase-tools
firebase login

# Deploy Android
firebase appdistribution:distribute \
  android/app/build/outputs/apk/release/app-release.apk \
  --app FIREBASE_ANDROID_APP_ID \
  --groups testers \
  --release-notes "Beta build v1.0.0"

# Deploy iOS
firebase appdistribution:distribute \
  ios/build/FanzMobile.ipa \
  --app FIREBASE_IOS_APP_ID \
  --groups testers \
  --release-notes "Beta build v1.0.0"
```

### Automated (via GitHub Actions)

Builds on `main` branch automatically deploy to Firebase App Distribution.

---

## Production Release

### Pre-Release Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Version numbers updated (`package.json`, iOS, Android)
- [ ] Release notes prepared
- [ ] Beta testing completed
- [ ] Screenshots and store assets ready
- [ ] Privacy policy and terms updated

### Version Bump

```bash
# Update package.json
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.1 -> 1.1.0
npm version major  # 1.1.0 -> 2.0.0

# Update iOS version (in Xcode or edit Info.plist)
# CFBundleShortVersionString: 1.0.0
# CFBundleVersion: 1

# Update Android version (android/app/build.gradle)
# versionCode: 1
# versionName: "1.0.0"
```

### Release Process

1. **Create release branch**:
```bash
git checkout -b release/v1.0.0
git push origin release/v1.0.0
```

2. **GitHub Actions builds automatically** for release branches

3. **Download artifacts** from GitHub Actions

4. **Submit to stores**:
   - Android: Upload AAB to Google Play Console
   - iOS: Upload IPA to App Store Connect via Transporter

5. **Create GitHub release**:
```bash
gh release create v1.0.0 \
  --title "FanzMobile v1.0.0" \
  --notes "Release notes here" \
  android-release.apk \
  ios-release.ipa
```

6. **Tag and merge**:
```bash
git tag v1.0.0
git push origin v1.0.0
git checkout main
git merge release/v1.0.0
git push origin main
```

---

## Monitoring & Rollout

### Staged Rollout

**Google Play**:
- Start with 10% of users
- Monitor crash rates and reviews
- Gradually increase to 50%, then 100%

**iOS**:
- TestFlight beta (internal testers)
- TestFlight beta (external testers)
- Phased Release (7-day automatic rollout)

### Monitoring

- **Firebase Crashlytics**: Real-time crash reports
- **Firebase Analytics**: User behavior and retention
- **App Store Connect**: Downloads, ratings, reviews
- **Google Play Console**: Crashes, ANRs, ratings

---

## Troubleshooting

### Common Issues

**Android build fails**:
```bash
cd android && ./gradlew clean
cd ..
```

**iOS build fails**:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

**CodePush not working**:
- Check deployment keys in `.env`
- Verify target version matches
- Check network connectivity

**Signing errors**:
- Verify certificates are not expired
- Check provisioning profile includes correct devices
- Ensure keystore passwords are correct

---

## Support

- **GitHub Issues**: https://github.com/FanzCEO/FanzMobile/issues
- **Documentation**: https://docs.fanz.app
- **Discord**: https://discord.gg/fanz
- **Email**: dev@fanz.app
