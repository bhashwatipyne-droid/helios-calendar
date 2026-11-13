# Helios Mutual Fund — Personalised Calendar 2026

Next.js (App Router) site where distributors log in, upload a photo into the 2026 calendar and download a print-ready PNG.

## Flow

1. `/` — Login (ARN or 10-digit mobile + reCAPTCHA). Sets an httpOnly session cookie.
2. `/calendar` — Upload a photo into the frame → "Processing" → Download. Shows the success popup.
   "Preview sample" renders a sample calendar. `/calendar` redirects to `/` when not logged in.

## Output

- Page: 526.68 × 670.68 pt (7 × 9 in trim + 0.1575 in bleed), from `Helios_Calender_Digital_V2.ai`
- Download: **2195 × 2795 px PNG at 300 dpi**
- Photo slot: 238.24 × 190.83 pt (5:4) → ask users for at least ~1000 × 800 px

All layout numbers live in `lib/calendar.ts` (one place for both the on-screen preview and the PNG export).

## Setup

```bash
npm install
cp .env.example .env.local   # optional: add reCAPTCHA keys
npm run dev
```

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA v2 (checkbox) site key |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA secret, verified in `/api/login` |

Without these, a placeholder "I'm not a robot" checkbox is shown and no captcha check is done — fine for testing, **not for production**.

## Still to wire up

- **Distributor check** — `app/api/login/route.ts` accepts any correctly formatted ARN/mobile (see `TODO`).
- **Background removal** — the "Processing" step is a timed placeholder (`components/CalendarScreen.tsx`).
- **Print dispatch** — the final calendar is only downloaded; uploading it for the printed copy is a `TODO`.

## Project structure

```
app/            layout, login page, /calendar page, /api/login
components/     LoginArt, LoginForm, Recaptcha, CalendarArt, CalendarScreen, Modals
lib/            calendar.ts (layout + PNG export), auth.ts
public/         logo, frame, doodles, Poppins fonts
middleware.ts   protects /calendar
```
