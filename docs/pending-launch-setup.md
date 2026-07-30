# Pending Launch Setup

Purpose: durable checklist for setup work that is important before launch but not part of the core app code path yet
Source of truth for: pending domain, auth branding, DNS, and production email-sending decisions
Update when: a domain is purchased, DNS ownership changes, Supabase Auth branding changes, or Resend/Supabase email delivery is finalized
Last reviewed: 2026-07-08

## Summary

Keep the app running on `https://onzait.vercel.app` while testing. Before launch, buy a real domain, connect it to Vercel, configure branded auth redirects, and verify a sending domain in Resend.

Custom branded domains are paid. A previous availability check showed `onzait.com` as available for about `$11.25 USD/year`, but domain availability and pricing can change, so recheck before purchase.

## Pending Auth Branding

Google account selection currently shows the Supabase project callback domain (`wuaiwcppoefmprzoupaf.supabase.co`) in the "Go to..." line because Supabase Auth owns the OAuth callback URL.

Before launch, review whether auth should use branded OAuth presentation:

- set the Google OAuth consent screen app name and branding to `Onzait`
- consider a branded Supabase Auth custom domain such as `auth.onzait.com`
- if a custom auth domain is enabled, add its Supabase callback URL to the Google OAuth client redirect URIs, for example `https://auth.onzait.com/auth/v1/callback`
- keep the existing Supabase project callback URI configured until the custom domain flow has been tested end to end

## Custom Paid Domain

Recommended domain path:

1. Buy `onzait.com` if it is still available.
2. If `onzait.com` is not available, compare `onzait.app` and other close brand-safe options.
3. Prefer Vercel Domains for the simplest setup because web hosting is already on Vercel.
4. If buying through another registrar, keep DNS managed somewhere clear and durable, such as Cloudflare, Vercel, Namecheap, or GoDaddy.
5. Add the production web domain to Vercel.
6. Add both the root and `www` variants if needed:
   - `onzait.com`
   - `www.onzait.com`
7. After Vercel verifies the domain, update app and auth URLs:
   - `EXPO_PUBLIC_SITE_URL`
   - `SITE_URL`
   - Supabase Auth `Site URL`
   - Supabase Auth redirect URLs
8. Update Google Maps key restrictions for the new domain:
   - add the production domain and `www` variant to the `EXPO_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` web referrers
   - keep `https://onzait.vercel.app/*` during testing and cutover if the Vercel URL still needs to work
   - confirm the key remains restricted to Maps JavaScript API only

## Email Sending Domain

You do not need to create a real inbox for `no-reply@...` just to send transactional email. Resend can send from a verified domain or subdomain once DNS is configured. A real inbox is only needed if people should reply and someone should receive those replies.

Recommended sender options:

- `Onzait <no-reply@onzait.com>` for a simple root-domain sender
- `Onzait <no-reply@auth.onzait.com>` if auth/product email should be separated on a subdomain

Setup steps:

1. Add the chosen domain or subdomain in Resend.
2. Add the DNS records Resend provides.
3. Include SPF/DKIM records from Resend and add DMARC if it is not already configured.
4. Wait for Resend domain verification.
5. Update Supabase Edge Function secrets:
   - `EMAIL_FROM`
   - `EMAIL_REPLY_TO` if replies should go somewhere real
   - `SITE_URL`
   - `SEND_EMAIL_HOOK_SECRET` for the signed Supabase Auth Send Email Hook
6. Deploy or redeploy email-related Supabase Edge Functions after changing secrets.
7. Send Spanish and English welcome, invitation, confirmation, and recovery
   emails to confirm sender, CTA URLs, HTML language, and reply behavior.

Supabase Auth emails and product emails are configured in different places:

- Product emails use the `welcome-to-onzait` and `project-collaboration` Edge Functions plus Resend.
- Current signup confirmation/resend and password recovery emails use the signed
  `auth-send-email` hook plus Resend.
- Before enabling that hook, disable unused Auth email flows and hosted security
  notifications, configure the signing secret, and prove signed staging
  delivery in both languages.

## DNS Ownership Notes

When the domain is purchased, record where DNS is managed. Examples:

- Vercel Domains
- Cloudflare
- Namecheap
- GoDaddy
- another registrar

DNS location matters because all later email/auth setup depends on adding records in the correct place.
