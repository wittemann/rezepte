# 0011 – Custom domain for production

**Status:** Open (blocked on: choosing the domain)

## Context

The Vercel production URL is https://rezepte-rust.vercel.app. `rezepte.vercel.app` belongs to someone else, so Vercel added a random suffix. The URL works but is neither memorable nor ours. The project owner wants the app on their own domain later.

## Decision

- **For now:** production stays on `rezepte-rust.vercel.app`. No action needed
- **Later:** production moves to a custom domain (for example a subdomain of a domain the project owner has). The `vercel.app` URL then redirects to it

## TODO

- [ ] Choose the domain or subdomain
- [ ] Add it in Vercel (project `rezepte` → Settings → Domains) and set the DNS record Vercel asks for (a CNAME for a subdomain). Vercel issues the HTTPS certificate
- [ ] Make it the primary production domain and redirect `rezepte-rust.vercel.app` to it
- [ ] Update the production URL in [06-deployment](../specs/06-deployment.md) and set this ADR to Accepted

## Consequences

- **Still free:** custom domains are included in Vercel Hobby. Only the domain itself may cost money, at the registrar
- **Public like today:** deployment protection is `all_except_custom_domains`, so the custom domain is reachable without a Vercel login, like the current production URL. The app's own login protects it ([04-auth](../specs/04-auth.md))
- **One new login:** the session cookie is bound to the host name, so after the switch both of us log in once on the new domain
- **Image URLs:** the image proxy ([ADR 0005](0005-image-handling.md)) uses relative paths, so nothing breaks; the CDN cache just fills again for the new host

## To accept

The domain is chosen and live, and the TODO list above is done.
