# FanzMobile

> Official React Native mobile application for the FANZ Ecosystem - Connecting creators and fans on iOS and Android

## Overview

FanzMobile is the official native mobile application for the FANZ platform, providing creators and fans with a seamless mobile experience for content creation, streaming, social interaction, and Web3 integrations. Built with React Native for cross-platform compatibility.

## Features

### Core Functionality
- **User Authentication** - Firebase Auth with biometric support
- **Content Feed** - Personalized content discovery with pull-to-refresh
- **Live Streaming** - WebRTC-based live video streaming
- **Video/Photo Upload** - Native media picker with cropping
- **Push Notifications** - Real-time engagement notifications
- **In-App Purchases** - Subscription and tip management
- **Web3 Integration** - Wallet connectivity and NFT support
- **Social Features** - Comments, likes, shares, DMs
- **Analytics** - Firebase Analytics and Crashlytics

### Security & Compliance
- Biometric authentication (Face ID/Touch ID)
- Secure keychain storage
- Content age verification (18+ Adult Content)
- 2257 compliance framework
- End-to-end encrypted messaging

### Performance
- Fast Image loading with caching
- Skeleton loaders for better UX
- Code Push for OTA updates
- Optimized bundle size
- Offline mode support

## Tech Stack

- **Framework**: React Native 0.76.3
- **State Management**: Redux Toolkit + Redux Persist
- **Navigation**: React Navigation 6
- **Backend**: Firebase (Auth, Firestore, Storage, Analytics)
- **Video**: React Native Video, WebRTC
- **Web3**: WalletConnect, Web3Auth, Ethers.js
- **UI Components**: React Native Paper, Lottie
- **Forms**: React Hook Form + Yup validation
- **Testing**: Jest, Detox, React Native Testing Library

## Prerequisites

```bash
# Node.js 22+ and npm 10+
node -v  # v22.x.x
npm -v   # 10.x.x

# iOS Development (macOS only)
xcode-select --install
sudo gem install cocoapods

# Android Development
# Install Android Studio with SDK 34+
# Set ANDROID_HOME environment variable
```

## Installation

```bash
# Clone the repository
git clone https://github.com/FanzCEO/FanzMobile.git
cd FanzMobile

# Install dependencies
npm install

# iOS only - Install pods
cd ios && pod install && cd ..

# Copy environment variables
cp .env.example .env
# Edit .env with your Firebase and API keys
```

## Configuration

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Add iOS and Android apps to your project
3. Download `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)
4. Place files in `ios/` and `android/app/` directories

### Environment Variables

Create a `.env` file with the following:

```bash
# API Configuration
API_BASE_URL=https://api.fanz.app
API_KEY=your_api_key_here

# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id

# Web3
WALLET_CONNECT_PROJECT_ID=your_wallet_connect_id
WEB3AUTH_CLIENT_ID=your_web3auth_client_id

# CodePush (Optional)
CODEPUSH_KEY_IOS=your_codepush_ios_key
CODEPUSH_KEY_ANDROID=your_codepush_android_key
```

## Running the App

### Development

```bash
# Start Metro bundler
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android

# Run on specific device
npm run ios -- --device "Joshua's iPhone"
npm run android -- --deviceId=emulator-5554
```

### Production Builds

```bash
# iOS Release Build
npm run build:ios

# Android Release Build (APK)
npm run build:android

# Android App Bundle (AAB) for Play Store
cd android && ./gradlew bundleRelease
```

## Project Structure

```
FanzMobile/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # App screens/pages
│   ├── navigation/       # Navigation configuration
│   ├── redux/            # Redux store, slices, actions
│   ├── services/         # API clients, Firebase services
│   ├── utils/            # Helper functions, constants
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── assets/           # Images, fonts, animations
├── ios/                  # iOS native code
├── android/              # Android native code
├── __tests__/            # Unit and integration tests
├── e2e/                  # End-to-end Detox tests
└── docs/                 # Additional documentation
```

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests (iOS)
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug

# Run E2E tests (Android)
detox build --configuration android.emu.debug
detox test --configuration android.emu.debug
```

## Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Type check
npm run type-check
```

## Deployment

### iOS App Store

1. Ensure you have an Apple Developer account
2. Update version in `ios/FanzMobile/Info.plist`
3. Run `npm run build:ios`
4. Upload to App Store Connect via Xcode or Transporter
5. Submit for review

### Google Play Store

1. Generate a signing key (first time only)
2. Update version in `android/app/build.gradle`
3. Run `npm run build:android`
4. Upload APK/AAB to Google Play Console
5. Submit for review

### CodePush OTA Updates

```bash
# Release CodePush update (iOS)
appcenter codepush release-react -a YourOrg/FanzMobile-iOS -d Production

# Release CodePush update (Android)
appcenter codepush release-react -a YourOrg/FanzMobile-Android -d Production
```

## Troubleshooting

### Common Issues

**Metro bundler won't start:**
```bash
npm start -- --reset-cache
```

**iOS build fails:**
```bash
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

**Android build fails:**
```bash
cd android && ./gradlew clean && cd ..
```

**Detox tests failing:**
```bash
detox clean-framework-cache && detox build-framework-cache
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## License

PROPRIETARY - © 2025 FANZ Group Holdings. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Support

- **Documentation**: https://docs.fanz.app
- **Issues**: https://github.com/FanzCEO/FanzMobile/issues
- **Discord**: https://discord.gg/fanz
- **Email**: support@fanz.app

## Acknowledgments

- React Native team for the amazing framework
- Firebase team for backend services
- All open-source contributors

---

Made with ❤️ by the FANZ Development Team
