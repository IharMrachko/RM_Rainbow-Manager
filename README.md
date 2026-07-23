# RM_RAINBOW_MANAGER

Monorepo: **Vue web** (корень) + **Ionic/Angular mobile** (`apps/mobile`).

## Vue web (как раньше)

```
npm install
npm run serve
```

### Demo & Test Login

- **Email:** `test@gmail.com`
- **Password:** `123456`

[RM_RAINBOW_MANAGER Demo](https://iharmrachko.github.io/RM_Rainbow-Manager)

## Mobile (Angular + Ionic)

```
npm run mobile:serve
# или
cd apps/mobile && npm install && npm start
```

Документация: [`apps/mobile/README.md`](apps/mobile/README.md)

Прототип подбора стоковых образов по палитре: экран **Stock Looks** (`/tabs/stock-looks`) в мобильном приложении. Опционально: `pexelsApiKey` в `apps/mobile/src/environments/environment.ts`. Выдача заточена под одежду/объект и более высокое разрешение превью; фильтры white/gray/black не используются. Есть режим свободного текстового поиска без палитры с color picker; источники: Pexels и Unsplash.

Общие типы/константы: `packages/shared`

