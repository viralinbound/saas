# SuperShowroom ✦ By Viral Inbound

Managed e-commerce SaaS platform — marketing site + merchant console + hosted storefronts.

## Run locally

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open **http://localhost:3000**

### Demo account

| Field | Value |
|-------|-------|
| Email | `demo@supershowroom.com` |
| Password | `demo123` |
| Demo store URL | `http://localhost:3000/s/green-basket` |

## What works now

### Marketing site (your UI design)
- `/` — Home
- `/pricing` — Plans
- `/templates` — 6 industry themes
- `/features`, `/about`
- `/signup`, `/login`

### Merchant console (App UI)
- `/onboarding` — 4-step store setup (name → URL slug → theme → plan)
- `/app` — Dashboard
- `/app/catalog` — Add products
- `/app/orders` — Manage orders
- `/app/settings` — **Publish / Unpublish** store + theme
- `/app/billing` — Plan + 2% fee tracking

### Buyer storefront
- `/s/{store-slug}` — Live store (only when published)
- Cart + checkout (COD / UPI / Card)
- Orders appear in merchant console

## Store URL model

| Environment | URL pattern |
|-------------|-------------|
| Local | `http://localhost:3000/s/green-basket` |
| Production | `https://green-basket.supershowroom.com` |

Merchants self-publish from **Settings → Publish store**.

## Tech stack

- **Next.js 15** (App Router)
- **Prisma + SQLite** (local DB)
- **iron-session** (auth)
- Your existing **styles.css** design system

## Legacy static files

Original HTML prototypes remain in the repo root (`index.html`, `SuperShowroom App.dc.html`, etc.) for reference.

---

© 2026 SuperShowroom by Viral Inbound
