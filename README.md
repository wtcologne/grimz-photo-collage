# GRIMZ - Photo Collage App

Eine moderne, professionelle Photo-Collage App, die mit Capacitor für iOS und Android entwickelt wurde.

## 🚀 Features

- **📸 Live Camera**: Automatischer Kamera-Start beim App-Start
- **🎨 Collage-Formate**: 2 oder 3 horizontale Streifen
- **🎭 Filter**: Verschiedene Bildfilter für die fertige Collage
- **💧 Watermark**: GRIMZ-Logo wird automatisch hinzugefügt
- **📱 Mobile-First**: Optimiert für Smartphones und Tablets
- **🎯 Touch-Gesten**: Doppeltippen zum Aufnehmen, Swipe-Navigation
- **⚡ Haptic Feedback**: Vibrationen für bessere User Experience

## 🛠️ Tech Stack

- **Frontend**: TypeScript, Vite, CSS3
- **Mobile**: Capacitor (iOS/Android)
- **Build**: Vite + TypeScript
- **Deployment**: Vercel (Web), App Stores (Mobile)

## 📦 Installation

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Production Build
npm run build

# Preview Production Build
npm run preview
```

## 📱 Mobile Development

```bash
# iOS Platform hinzufügen
npm run cap:add:ios

# Android Platform hinzufügen
npm run cap:add:android

# Capacitor sync
npm run cap:sync

# iOS in Xcode öffnen
npm run cap:run:ios

# Android in Android Studio öffnen
npm run cap:run:android
```

## 🎨 Collage-Formate

- **2x1**: 2 horizontale Streifen
- **3x1**: 3 horizontale Streifen

## 🎭 Filter

- **Original**: Kein Filter
- **Vintage**: Retro-Look
- **Black & White**: Schwarz-Weiß
- **Sepia**: Sepia-Ton
- **Cool**: Kühle Töne
- **Warm**: Warme Töne

## 🚀 Deployment

### Web (Vercel)
1. Repository auf GitHub erstellen
2. Vercel mit GitHub verbinden
3. Automatisches Deployment bei Push

### Mobile (App Stores)
1. iOS: Xcode → Archive → App Store Connect
2. Android: Android Studio → Build → Generate Signed Bundle

## 📄 Lizenz

© 2024 GRIMZ. Alle Rechte vorbehalten.

## 🚀 Live Demo

**Web-Version**: [https://grimz-photo-collage.vercel.app](https://grimz-photo-collage.vercel.app)

## 🤝 Contributing

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Changes committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📞 Support

Bei Fragen oder Problemen, erstelle ein Issue auf GitHub.