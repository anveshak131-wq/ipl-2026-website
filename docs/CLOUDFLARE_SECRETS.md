# Cloudflare secrets (no keys in git)

API keys and tokens must **not** appear in `wrangler.toml`, `.env.local`, or committed files. Use Cloudflare **encrypted** environment variables (Pages secrets) or local `.dev.vars` (gitignored).

## Rotate exposed OpenWeather key

If `OPENWEATHER_API_KEY` was ever committed:

1. Sign in at [OpenWeather API keys](https://home.openweathermap.org/api_keys).
2. **Regenerate** or delete the leaked key and create a **new** key.
3. Store the new value only in Cloudflare (and local `.dev.vars`), never in the repo.

## Production / preview (Cloudflare Pages)

Project name: `ipl-2026-website` (see `wrangler.toml`).

### Dashboard

1. Cloudflare Dashboard → **Workers & Pages** → **ipl-2026-website** → **Settings** → **Environment variables**.
2. Add **Encrypted** variable:
   - Name: `OPENWEATHER_API_KEY`
   - Value: your new OpenWeather key
3. Apply to **Production** (and **Preview** if you use preview deployments).

### CLI

```bash
npx wrangler pages secret put OPENWEATHER_API_KEY --project-name=ipl-2026-website
```

Enter the new key when prompted. Repeat for preview if needed:

```bash
npx wrangler pages secret put OPENWEATHER_API_KEY --project-name=ipl-2026-website --env preview
```

List secrets (names only):

```bash
npx wrangler pages secret list --project-name=ipl-2026-website
```

## Local development

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars and set OPENWEATHER_API_KEY=...
npm run dev:wrangler
```

For Next.js-only dev (`npm run dev`), use `.env.local` (copy from `.env.local.example`). Both files are gitignored.

## Other secrets (same pattern)

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | Admin Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Admin Google OAuth |
| `ADMIN_SESSION_SECRET` | Admin session signing |
| `ADMIN_TOTP_SECRET_BASE32` | Optional admin 2FA |
| `RESEND_API_KEY` / email keys | Transactional email |
| `WEATHER_API_KEY` | Optional [WeatherAPI.com](https://www.weatherapi.com/) (different from OpenWeather) |

Use `wrangler pages secret put <NAME> --project-name=ipl-2026-website` for each.

## What stays in `wrangler.toml`

Only **non-secret** configuration, for example:

- `ENVIRONMENT`
- `ADMIN_ALLOWED_EMAILS` (allowlist, not a credential)
- `ADMIN_LEGACY_LOGIN_ENABLED`, `ADMIN_LEGACY_SETUP_ENABLED`, or `ADMIN_LEGACY_AUTH_ENABLED` only for a temporary controlled production fallback. Leave unset to keep legacy password login/setup disabled.
- KV namespace bindings
- Cron triggers

## Code references

OpenWeather is read as `env.OPENWEATHER_API_KEY` in:

- `functions/api/weather/[venueId].js`
- `functions/cron/weather-update.js`
- `functions/api/weather-forecast.js` (falls back to `WEATHER_API_KEY` for migration)
