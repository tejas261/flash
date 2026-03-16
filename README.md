# Flash QR Ordering

Full-stack MVP QR food ordering app for self-service restaurants.

Stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style component setup
- Prisma
- PostgreSQL
- Redis
- SSE
- Razorpay test mode

## Features

- Public QR menu by restaurant slug: `/r/[slug]`
- Cart and checkout
- Razorpay order initialization and payment verification
- Order creation only after successful payment verification
- Sequential restaurant token numbers
- Admin login and protected dashboard
- Admin menu management for categories and items
- Kitchen dashboard for live orders
- Customer live order tracking
- Ready notification using browser notifications
- Ready tokens display screen: `/display/[slug]`
- Sample restaurant seed and QR generation

## Demo credentials

After seeding:

- Admin email: `owner@flash.demo`
- Admin password: `flash-admin-123`
- Demo restaurant slug: `demo-bistro`

You can override admin credentials with `ADMIN_EMAIL` and `ADMIN_PASSWORD` before running the seed.

## Environment variables

Copy `.env.example` to `.env` and set the values:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: direct PostgreSQL connection string for Prisma migrations
- `REDIS_URL`: Redis connection string
- `APP_URL`: app base URL used for server-side links
- `NEXT_PUBLIC_APP_URL`: public app URL used in QR generation
- `AUTH_SECRET`: long random string for admin session security
- `RAZORPAY_KEY_ID`: Razorpay test key ID
- `RAZORPAY_KEY_SECRET`: Razorpay test key secret
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: same test key ID exposed to the browser
- `ADMIN_EMAIL`: seeded admin email
- `ADMIN_PASSWORD`: seeded admin password

## Local setup

1. Install dependencies.

```bash
npm install
```

2. Generate the Prisma client.

```bash
npm run prisma:generate
```

3. Apply the schema to Postgres.

```bash
npm run prisma:push
```

If you prefer migration files during development:

```bash
npm run prisma:migrate
```

4. Seed the sample restaurant and admin user.

```bash
npm run db:seed
```

5. Generate the sample QR asset.

```bash
npm run qr:generate
```

6. Start the app.

```bash
npm run dev
```

## Sample URLs

- Home: `/`
- Public menu: `/r/demo-bistro`
- Admin login: `/admin/login`
- Admin orders: `/admin/orders`
- Admin menu: `/admin/menu`
- Ready token board: `/display/demo-bistro`
- Dynamic QR SVG: `/api/restaurants/demo-bistro/qr`

## Razorpay test mode setup

1. Create a Razorpay account and switch to test mode.
2. Copy the test key ID and secret into `.env`.
3. Use Razorpay test cards or UPI flows during checkout.
4. The app creates the restaurant order only after it verifies the Razorpay signature from the client checkout success callback.

## Redis and realtime

Realtime updates use Redis pub/sub plus SSE:

- Customer tracking subscribes to `/api/orders/[orderId]/events`
- Admin orders and display screens subscribe to `/api/restaurants/[slug]/orders/events`

Redis is required for live updates across instances. On a single local instance, keep Redis running before testing realtime flows.

## Project structure

```text
app/
  admin/                      Admin pages
  api/                        Checkout, payment, QR, SSE endpoints
  display/[slug]/             Ready token board
  r/[slug]/                   Public ordering pages
components/
  app/                        App-level UI modules
  ui/                         Reusable shadcn-style primitives
lib/
  actions/                    Server actions
  auth.ts                     Admin session management
  checkout.ts                 Checkout and order creation logic
  db.ts                       Prisma client
  order-events.ts             Redis channel helpers
  queries.ts                  Shared data reads
  redis.ts                    Redis clients
prisma/
  schema.prisma               Database schema
  seed.ts                     Sample seed
scripts/
  generate-sample-qr.ts       Writes `public/sample-demo-bistro-qr.svg`
```

## Ordering flow

1. Guest scans the QR and opens `/r/demo-bistro`.
2. Guest adds items to the cart and enters name/phone.
3. Client creates a checkout session and a Razorpay order.
4. Razorpay completes payment in test mode.
5. Backend verifies the Razorpay signature.
6. Backend creates the restaurant order inside a Prisma transaction.
7. A sequential token number is generated from `DailyTokenCounter`.
8. Redis publishes the order event.
9. Kitchen/admin screens refresh live.
10. Guest tracks status on `/r/[slug]/order/[orderId]`.
11. When the kitchen marks the order `READY`, the tracking page can show a browser notification.

## Admin flow

- Sign in at `/admin/login`
- Manage menu categories and items at `/admin/menu`
- Watch incoming orders and update statuses at `/admin/orders`
- Use `/admin/display` to preview the public ready-token screen

## Database notes

Key models:

- `Restaurant`
- `AdminUser`
- `AdminSession`
- `Category`
- `MenuItem`
- `CheckoutSession`
- `Order`
- `OrderItem`
- `OrderStatusEvent`
- `DailyTokenCounter`

## Deployment on Vercel

### Recommended managed services

- Postgres: Neon, Supabase, Railway, Render, or any hosted PostgreSQL
- Redis: Upstash Redis or Redis Cloud

### Steps

1. Push this repository to GitHub.
2. Create a new Vercel project from the repository.
3. Add all environment variables from `.env.example` in the Vercel project settings.
4. Provision a managed Postgres database and set both `DATABASE_URL` and `DIRECT_URL`.
5. Provision Redis and set `REDIS_URL`.
6. Set `APP_URL` and `NEXT_PUBLIC_APP_URL` to the production domain.
7. Set Razorpay production project variables to test-mode credentials for MVP testing.
8. Deploy.

### Prisma on Vercel

Use one of these approaches:

- Run `npx prisma migrate deploy` in a CI step before or during deployment.
- Or use `prisma db push` for fast MVP iteration if you are not maintaining migration history yet.

Recommended build settings:

- Install command: `npm install`
- Build command: `npm run prisma:generate && npm run build`

If you use migration files in CI:

- Build command: `npm run prisma:generate && npx prisma migrate deploy && npm run build`

## Manual smoke test checklist

1. Seed the app and sign in to `/admin/login`.
2. Open `/r/demo-bistro` and place a test order with Razorpay.
3. Confirm redirect to the order tracking page and verify token generation.
4. Open `/admin/orders` in a second tab and update the order status.
5. Confirm the customer page updates live.
6. Mark the order `READY` and confirm the ready-token screen updates.
7. Allow browser notifications on the customer page and confirm the ready notification appears.

## Notes

- This MVP intentionally excludes delivery, table mapping, loyalty, analytics, marketplace features, and mobile apps.
- SSE is simpler than WebSockets for this scope and is enough for customer tracking, kitchen refresh, and ready-token screens.
- The repository includes complete source files for the MVP, not placeholder snippets.
