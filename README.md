# Helios Mutual Fund — Personalised Calendar 2027

Next.js (App Router) site where distributors log in, upload a photo into the 2027 calendar and download a print-ready JPEG.

## Flow

1. `/` — Login (ARN or 10-digit mobile + reCAPTCHA). Sets an httpOnly session cookie.
2. `/calendar` — Upload a photo into the frame → "Processing" → Download. Shows the success popup.
   "Preview sample" renders a sample calendar. `/calendar` redirects to `/` when not logged in.

## Output

- Page: 526.68 × 670.68 pt (7 × 9 in trim + 0.1575 in bleed), from `Helios_Calender_Digital_V2.ai`
- Download: **2195 × 2796 px JPEG (quality 95) at 300 dpi**
- Photo slot: 238.24 × 190.83 pt (5:4) → ask users for at least ~1000 × 800 px

All layout numbers live in `lib/calendar.ts` (one place for both the on-screen preview and the JPEG export).

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
| `ADMIN_PASSWORD` | Password for `/admin` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 credentials for presigned uploads |

Without these, a placeholder "I'm not a robot" checkbox is shown and no captcha check is done — fine for testing, **not for production**.

## Still to wire up

- **Distributor check** — `app/api/login/route.ts` accepts any correctly formatted ARN/mobile (see `TODO`).
- **Background removal** — the "Processing" step is a timed placeholder (`components/CalendarScreen.tsx`).

## Privacy & storage

The user's **original photo never leaves their device** — it is read, cropped, previewed and drawn into the calendar in the browser.
After the calendar is generated, only the **finished print JPEG** (2195 × 2796 px, quality 95, ~1–2 MB) is saved to Cloudflare R2 (bucket `helios-calendars`) as `calendars/<year>/<ARN or mobile>.jpg`.
One fixed key per distributor, so re-downloading overwrites the file instead of adding new ones.
Uploads use short-lived presigned URLs issued by `/api/upload-urls` (needs the login cookie).

### Admin / printer export

`/admin` (password = `ADMIN_PASSWORD`) lists every stored calendar and downloads the JPEGs in zip batches of 50.
The R2 bucket's CORS rule must allow `PUT` and `GET` from the site's origins (`https://heliosamc.thefinpedia.com`, `https://helios-calendar-six.vercel.app`) with headers `*`.

## Project structure

```
app/            layout, login page, /calendar page, /api/login
components/     LoginArt, LoginForm, Recaptcha, CalendarArt, CalendarScreen, Modals
lib/            calendar.ts (layout + export), auth.ts
public/         logo, frame, doodles, Poppins fonts
middleware.ts   protects /calendar
```
