# helios-calendar-store (Cloudflare Worker + R2)

Keeps only the **final calendar PNG** per distributor (`calendars/<year>/<ARN-or-mobile>.png`, latest overwrites).
Original photos are never uploaded.

## One-time setup
1. Cloudflare dashboard → R2 → enable R2 (needs a payment method; the free tier covers 10 GB).
2. `cd worker && npx wrangler r2 bucket create helios-calendars`
3. `npx wrangler secret put UPLOAD_SECRET`   (any long random string)
4. `npx wrangler deploy`  → note the `*.workers.dev` URL
5. In Vercel add: `UPLOAD_SECRET` (same value) and `NEXT_PUBLIC_UPLOAD_URL` (the Worker URL), then redeploy.
