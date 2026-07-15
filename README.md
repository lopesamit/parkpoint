# ParkPoint

Community-driven street parking. Drivers report open spots as they see them; other drivers search any address and only see spots reported **within the last hour** — then get one-tap directions.

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router) + React 18 + TypeScript
- [Tailwind CSS](https://tailwindcss.com) with a custom design system
- MongoDB (native driver)
- Google Maps JavaScript API (Maps, Places, Geocoding)
- Stateless HMAC-signed session cookies (verified in Edge middleware)

## Getting started

1. **Install dependencies** (Node 18.17+ required):

   ```bash
   npm install
   ```

2. **Configure environment variables.** Copy the example file and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Description |
   | --- | --- |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps key with Maps JavaScript, Places, and Geocoding APIs enabled. Restrict by HTTP referrer. |
   | `MONGODB_URI` | MongoDB connection string (e.g. MongoDB Atlas). |
   | `AUTH_SECRET` | Session signing secret. Generate with `openssl rand -hex 32`. |
   | `RESEND_API_KEY` | *(Optional)* [Resend](https://resend.com) key for password reset emails. Without it, reset links are logged to the server console. |
   | `EMAIL_FROM` | *(Optional)* From address for outgoing email. |

3. **Run the dev server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Recommended MongoDB indexes

Run once against your database (`data`):

```js
db.users.createIndex({ email: 1 }, { unique: true });
db.reported_parking.createIndex({ timestamp: -1 });
db.reported_parking.createIndex({ "coordinates.lat": 1, "coordinates.lng": 1 });
// Optional: auto-delete reports after 24 hours
db.reported_parking.createIndex({ timestamp: 1 }, { expireAfterSeconds: 86400 });
// Password reset tokens: fast lookup + auto-cleanup at expiry
db.password_reset_tokens.createIndex({ tokenHash: 1 });
db.password_reset_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

## How it works

- **Report** — a signed-in user drops a report (address + spot count) at their current location or any typed address.
- **Search** — searches return only `active` reports from the last 60 minutes within a 0.5 mile radius, sorted by freshness then distance.
- **Navigate** — each result links to Google Maps turn-by-turn directions.

## Architecture notes

- **Auth** — email/password with bcrypt hashing. Sessions are stateless HMAC-SHA256-signed tokens in an `httpOnly` cookie, verified both in Edge middleware (route gating) and in API routes. Parking APIs require a valid session.
- **Password reset** — single-use tokens (random 32 bytes, stored as SHA-256 hashes) that expire after 1 hour. The forgot-password endpoint returns the same response whether or not the email exists, preventing account enumeration.
- **Routes** — `/` (landing), `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/dashboard` (map app). API routes live under `/app/api`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Deployment

Deploys cleanly to [Vercel](https://vercel.com). Set the three environment variables in your project settings and pair it with MongoDB Atlas.
