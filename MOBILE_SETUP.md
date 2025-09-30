# GRIMZ Mobile Setup

## 📱 Capacitor Mobile App Setup

GRIMZ ist jetzt als native Mobile App für iOS und Android konfiguriert!

### 🚀 Quick Start

```bash
# Development Server starten
npm run dev

# App für Mobile bauen
npm run build

# Mit nativen Plattformen synchronisieren
npx cap sync

# iOS App öffnen (macOS + Xcode erforderlich)
npx cap run ios

# Android App öffnen (Android Studio erforderlich)
npx cap run android
```

### 📋 Voraussetzungen

#### Für iOS:
- macOS mit Xcode
- iOS Simulator oder echtes iOS-Gerät
- CocoaPods: `sudo gem install cocoapods`

#### Für Android:
- Android Studio
- Android SDK
- Android Emulator oder echtes Android-Gerät

### 🔧 Mobile Features

#### ✅ Implementiert:
- **Haptic Feedback**: Vibration bei Aufnahme, Erfolg, Fehlern
- **Status Bar**: Dunkle Status Bar für bessere UX
- **Splash Screen**: Professioneller Startbildschirm
- **Touch Gestures**: Doppeltippen, Wischen, Long Press
- **Mobile-optimierte UI**: Responsive Design für alle Bildschirmgrößen
- **PWA Support**: Installierbar als Web App

#### 📱 Mobile-spezifische Verbesserungen:
- **Viewport Fit**: Unterstützt Notch und Safe Areas
- **Zoom Prevention**: Verhindert ungewolltes Zoomen
- **Touch Optimization**: Optimiert für Touch-Bedienung
- **Performance**: Optimiert für Mobile-Geräte

### 🎨 App Icons & Splash Screens

- **Icon**: `/public/icon.svg` (1024x1024)
- **Splash**: `/public/splash.svg` (2048x2048)
- **Manifest**: `/public/manifest.json` (PWA Support)

### 🔄 Development Workflow

1. **Code ändern** in `src/`
2. **Build**: `npm run build`
3. **Sync**: `npx cap sync`
4. **Test**: `npx cap run ios/android`

### 📦 Build für App Stores

#### iOS (App Store):
```bash
npm run cap:build:ios
# Öffnet Xcode für finalen Build
```

#### Android (Google Play):
```bash
npm run cap:build:android
# Öffnet Android Studio für finalen Build
```

### 🐛 Troubleshooting

#### iOS:
- **CocoaPods Fehler**: `cd ios && pod install`
- **Xcode Fehler**: Projekt in Xcode öffnen und neu bauen

#### Android:
- **Gradle Fehler**: `cd android && ./gradlew clean`
- **SDK Fehler**: Android SDK in Android Studio aktualisieren

### 📱 Testing

#### Web (Development):
- `npm run dev` → http://localhost:3002
- PWA Test: Chrome DevTools → Application → Manifest

#### Native (Production):
- iOS: Xcode Simulator oder echtes Gerät
- Android: Android Studio Emulator oder echtes Gerät

### 🎯 Nächste Schritte

1. **App Store Vorbereitung**: Icons, Screenshots, Store-Listing
2. **Performance Testing**: Auf verschiedenen Geräten testen
3. **Store Upload**: iOS App Store + Google Play Store

---

**GRIMZ** ist bereit für die App Stores! 🚀
