# Viewz

Website for Viewz: AI walkthrough videos of Dubai property, built from a listing link, the developer's floor plan and the listing photos.

## Layout
- `pages/*.html` are the page sources. `build.py` builds them into the top-level `*.html` files (shared header, footer and shell). Edit `pages/`, then run `python3 build.py`.
- `main.js` front-end behaviour. Settings live in `CONFIG` at the top: `API` (backend URL) and `WHATSAPP` (business number). Both empty until launch.
- `styles.css`, `img/`, `media/` (sample film goes here, listed in `media/films.json`), `favicon.svg`, `logo.svg`.
- `_headers` security headers in Cloudflare Pages format (Render needs its own format).
- `BACKEND-SPEC.md` the backend to build (quote, WhatsApp verify, Stripe checkout, webhook).
- `AUDIT.md` audit history. `TODO.md` open items and who owns them.
- `plan.py`, `plan.json`, `plan.base.json`, `flow*.py`, `wp.json` the floor-plan route graphics used on the home and samples pages.

## Run locally
`python3 build.py && python3 -m http.server 8000` then open http://localhost:8000

## Rules
- No secrets in this repo. Keys (Stripe, WhatsApp) live in the host's environment settings.
- Private repo. Videos are AI-generated and labelled as such.
