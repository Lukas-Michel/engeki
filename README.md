# Engeki

Movie and TV tracking app built with Expo Router, native tabs, TMDB, Clerk, and Convex.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root. You can start from `.env.example`.

```bash
EXPO_PUBLIC_TMDB_ACCESS_TOKEN=your_tmdb_v4_read_access_token
EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_v3_api_key_optional_fallback
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
EXPO_PUBLIC_CONVEX_URL=your_convex_deployment_url
EXPO_PUBLIC_CONVEX_SITE_URL=your_convex_http_actions_url
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-frontend-api-url
CONVEX_DEPLOYMENT=your_convex_deployment_name
CONVEX_DEPLOY_KEY=your_convex_deploy_key
```

Notes:

- `EXPO_PUBLIC_*` values are embedded in the client bundle. Do not put private server secrets there.
- TMDB client calls use `EXPO_PUBLIC_TMDB_ACCESS_TOKEN` first, then `EXPO_PUBLIC_TMDB_API_KEY` if no access token is set.
- Clerk auth activates only after `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is present.
- Convex connects after `EXPO_PUBLIC_CONVEX_URL` is present. When Clerk is also configured, the app uses Convex's Clerk auth provider.
- Set `CLERK_JWT_ISSUER_DOMAIN` on each Convex deployment so the backend can validate Clerk tokens.
- `npx convex dev --once --env-file .env.local` can add `CONVEX_DEPLOYMENT` and `EXPO_PUBLIC_CONVEX_SITE_URL` automatically.

## Run

```bash
npm run ios
npm run android
```

For web preview:

```bash
npm run web
```

## Verification

```bash
npx tsc --noEmit
npm run lint
npx expo export --platform ios
npx expo export --platform android
npx expo export --platform web
```
