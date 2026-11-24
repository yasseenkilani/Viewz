# Viewz: open items (keep updated)

## Waiting on the boss
- [ ] Approve the privacy page (`pages/privacy.html`). Confirm the [bracketed] retention periods, hosting providers and reply time. Have a lawyer read it. It is `noindex` until approved; remove `<!--NOINDEX-->` to publish it to search.
- [ ] Role emails: the site shows `dev@viewz.me` for now. When the real addresses exist, replace in `main.js`, `pages/privacy.html` (and any mailto text).
- [ ] The first real job: video, area and details. The home page screening room and "Behind the film" currently use the studio concept film and room study from the review site (`media/studio-*`, `media/study-*`), labelled studio concept. Swap in the real film, floor-plan pins (`data-start` seconds in `pages/index.html`) and the camera route in `studio.js` (`positions`, `targets`) when the real job is ready.
- [ ] Business WhatsApp number -> `CONFIG.WHATSAPP` in `main.js` (digits only, e.g. 9715XXXXXXXX).
- [ ] Deploy (Render or Cloudflare) on **viewz.me**. When done, boss tells Claude to take over.
- [ ] Once the domain is live: absolute `og:image`, `canonical` and `og:url`, `twitter:card`, image width/height.
- [ ] Price list for the payment page.
- [ ] Real favicon / logo files if the placeholder is not final.

## Claude, after the boss hands over accounts
- [ ] Build the backend from `BACKEND-SPEC.md` (quote, verify, checkout, Stripe webhook, WhatsApp Business API). Sandbox first.
- [ ] Set `CONFIG.API`, CORS to the site origin only, `_headers` for the chosen host (Render uses a different format), connect-src for the API origin.
- [ ] Cloudflare Turnstile bot check; shared-store rate limits.
- [ ] Remove `index.src.html` from the deploy.
- [ ] Re-run the audit (`AUDIT.md`) against the deployed site.

## Merged home (25 Nov)
- [ ] Confirm the studio concept film and room study are OK to show publicly (they came from viewz-studio-review).
- [ ] Share links use the page's own address (`?room=living&t=5`), so they start working once viewz.me is live.
- [ ] Old `samples.html` is now a "moved" stub (noindex). Delete it, or add a redirect rule on the host.
- [ ] Dead code to remove later: `.sample`/`data-play` handlers in `main.js`, `media/films.json`, old hero/vsband CSS in `styles.css`.
