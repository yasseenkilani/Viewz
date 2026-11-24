# Viewz back-end spec (build when accounts exist)

Front ends are done and wait on `CONFIG.API` and `CONFIG.WHATSAPP` at the top of `main.js`.

## Endpoints
| Call | What it does |
|---|---|
| `POST /quote` {link,name,email?,phone,consent,elapsed} | Validate everything again on the server. Store the quote. Send a 6-digit code by WhatsApp template. Reply {id,needsCode:true}. |
| `POST /verify` {id,code} | Check the code (5 tries max, expires in 10 min). Marks the number verified, tells the team a quote is waiting. |
| `GET /quote/:id` | Returns only listing, delivery, formats, price, currency, status. Id is a long random token, not a counter. |
| `POST /checkout` {id} | Creates a Stripe Checkout Session using the price stored on OUR side. Returns {url} (checkout.stripe.com). |
| `POST /stripe/webhook` | Verifies Stripe's signature. On `checkout.session.completed` and `checkout.session.async_payment_succeeded` (when payment_status is paid) mark paid, send receipt message, start the job. Idempotent. |

## Security rules
- Server re-validates every field. Client checks are for convenience only.
- Rate limits in a shared store (not in memory): quote 5/hour per IP and per phone, verify 10 per 15 min, plus a bot check (Cloudflare Turnstile) on /quote.
- WhatsApp: first message is an approved template, sent only after the consent box was ticked. Log the consent (time, text shown).
- CORS: only the real site origin. No wildcards. No cookies needed.
- Never log phone numbers, codes or card data. Errors to users are generic.
- Secrets only in host environment variables. Nothing in the repo or front end.
- Data: keep only link, name, phone, optional email, price, status. Set a retention period (to decide) and a delete-on-request path.

## Stripe rules
- Hosted Checkout Sessions. Never build our own card form. Do not set `payment_method_types`; let Stripe choose (cards, Apple Pay).
- Currency AED. Price comes from our database, never from the browser.
- Use `StripeClient`, a restricted key (`rk_`), a sandbox first, then live.
- Fulfilment happens in the webhook, never on a success page.
- Add `integration_identifier` on session create.

## Needed from the boss
Stripe account (sandbox first), Meta WhatsApp Business account and number, Cloudflare/Render account, the price list, the privacy policy wording and retention period.


## Quote status values (front end depends on these)
`GET /quote/:id` status is one of `open`, `pending`, `unpaid` (payable), `paid`, `expired`, `cancelled`. The pay page only enables payment for open, pending or unpaid, and needs a price above zero.
The form's honeypot field is `hp_x7` (backend should also discard any request that includes it).
