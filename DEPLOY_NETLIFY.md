# Deploying to Netlify

Quick steps to deploy this Vite React app to Netlify and connect a domain purchased from Papaki.

1) Prepare the site on Netlify
- Go to https://app.netlify.com and create a new site from Git.
- Connect the repository `sea-nautiq-journey` and choose the branch you want to publish.
- Build command: `npm run build`
- Publish directory: `dist`

2) Environment variables (important)
- Do NOT commit secrets to the repo. In Netlify site settings → Build & deploy → Environment, add the following keys as needed:
  - `VITE_API_BASE_URL` — full URL to your API (e.g. `https://api.yoursite.com`)
  - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if you use Supabase client calls in the browser
  - Any other `VITE_` prefixed vars you rely on
    - Backend / function secrets for server-side Netlify Functions (set under Site → Settings → Build & deploy → Environment):
      - `SUPABASE_URL` — Supabase project URL
      - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service_role key (keep secret)
      - `STRIPE_SECRET_KEY` — Stripe secret key used by create-checkout
      - `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret (used by webhook function)
      - `RESEND_API_KEY` — optional Resend API key for transactional emails
      - `APP_BASE_URL` — production base URL (e.g., https://www.yoursite.com)
      - `STRIPE_ALLOW_PLATFORM_FALLBACK` — optional flag (true/false)
      - `STRIPE_PENDING_HOLD_MINUTES` — optional pending hold minutes (default 5)

3) Single-page app routing
- The repository already contains `netlify.toml` and `public/_redirects` to route all paths to `index.html` for the SPA.

4) Domains bought on Papaki
Option A — Let Netlify manage DNS (recommended):
  1. In Netlify, go to Domain settings → Add custom domain → enter your domain.
  2. When offered, choose "Netlify DNS" and add the nameservers Netlify shows in Papaki's domain panel.
  3. In Papaki at your domain's DNS settings, replace the current nameservers with the Netlify nameservers provided.
  4. Wait for DNS propagation (usually a few minutes, up to 24 hours).

Option B — Keep Papaki DNS and add records (if you prefer not to change nameservers):
  1. In Netlify, add the domain to your site and Netlify will show the records you need.
  2. In Papaki DNS editor, add the records Netlify lists. Typical setup is:
     - `www` CNAME -> `<your-site>.netlify.app`
     - root/A or ALIAS records -> Netlify's A records (Netlify will provide the current IPs) or use an ALIAS/ANAME if Papaki supports it.
  3. Save changes and wait for propagation.

Notes
- If you host any server-side endpoints (like `server/index.mjs`) you'll need to host them separately (Heroku, Fly, Render, Supabase Edge Functions, or convert to Netlify Functions). This repo's Express server is not automatically packaged for Netlify Functions.
- After setup, do a test build locally with `npm run build` and then `npm run preview` to sanity-check the production build.

Commands to test locally
```powershell
npm ci
npm run build
npm run preview
```

If you want, I can add optional Netlify Function wrappers for your Stripe endpoints or prepare a separate serverless migration plan.
