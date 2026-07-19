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

## Firebase

Copy keys into `src/environments/environment.ts` (same values as Vue `VUE_APP_FIREBASE_*`):

```ts
firebase: {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
  measurementId: '...',
}
```

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
