# Rainbow Manager Mobile (Ionic + Angular)

Mobile app for Rainbow Manager. The Vue web app stays at the repository root; this app lives in `apps/mobile`.

## Run

```bash
# from repo root
npm run mobile:serve

# or
cd apps/mobile
npm start
```

## Firebase (do not commit real keys)

1. Copy Vue root `.env.local` values (`VUE_APP_FIREBASE_*`) into:
   - `src/environments/environment.ts`
   - `src/environments/environment.prod.ts`
2. Download `google-services.json` from Firebase Console → Project settings → Your apps (Android) and place it at:
   - `android/app/google-services.json`
   - Template: `android/app/google-services.json.example`

These credential files are gitignored. Never commit real API keys.

## Capacitor

```bash
cd apps/mobile
npm run build
npx cap add android
npx cap sync
npx cap open android
```

## Shared package

`packages/shared` — Firebase path constants and shared types (`@rainbow/shared`).
