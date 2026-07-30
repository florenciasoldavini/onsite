# Product Email Flow

Purpose: document and verify Onzait's current transactional email paths
Source of truth for: localized product and Auth email boundaries, Edge Function secrets, and rollout
Update when: product email providers, function names, secrets, or invocation rules change
Last reviewed: 2026-07-29

## Language Contract

Current transactional emails support `es` and `en` with bundled Deno-safe
i18next resources. Missing or invalid language input resolves to Spanish and a
missing Spanish key falls back to English. Builders return localized
`{ subject, html }`, preserve user-authored values, set `<html lang>`, and
format dates as `es-AR` or `en-US` in UTC with the time zone stated.

## Current Example

The first product email example is `welcome-to-onzait`.

Flow:

1. App code calls `sendWelcomeToOnzaitEmail` with the active app language from `features/auth/services/welcome-email.service.ts`.
2. The service calls `invokeWelcomeToOnzaitEmail` from `features/auth/repositories/welcome-email.repository.ts`.
3. The repository invokes the Supabase Edge Function `welcome-to-onzait`.
4. The Edge Function validates the signed-in user with Supabase Auth.
5. The Edge Function uses its service-role Supabase client to reserve `public.users.welcome_email_sent_at` only when the marker is still empty.
6. Only the request that successfully reserves the marker renders the localized Onzait-styled React Email template to HTML and sends it through Resend.

The client does not send a recipient email address. The function chooses the recipient from the authenticated user's `public.users` row.
The client also does not write the sent marker; that belongs to the Edge Function so repeated app launches cannot repeatedly send the same product email.

## Project Invitation Email

`project-collaboration` sends project invitation emails through the same Resend
configuration. The database first creates or rotates a hash-only invitation and
returns its delivery version. The Edge Function then sends with an idempotency
key containing the invitation ID and delivery version and records `sent` or
`failed` without deleting a failed invitation.

Invitation links use `/invitations/accept#token=…`; the raw token is never
stored and is not placed in an HTTP path or query string. Resends rotate the
token, restart the seven-day expiry, enforce a 60-second cooldown, and share a
20-email rolling 24-hour actor cap with new invitations.

The invitation form requires a recipient language and defaults it to the
sender's current UI language. `project_invitations.language_code` persists the
validated choice, and every resend reuses it. Role names are localized from
stable role codes.

## Supabase Auth Send Email Hook

`auth-send-email` implements the signed Supabase Send Email Hook for current
signup confirmation/resend and password recovery actions. The app adds `lang`
to the trusted redirect URL. The hook uses that parameter only to render the
email and constructs the verification URL from signed hook fields and the token
hash.

The function verifies Standard Webhooks signatures before parsing, uses the
webhook delivery identifier as the Resend idempotency key where available, and
limits the provider request to four seconds. JWT verification is disabled for
this function because the signed webhook is authoritative.

## Failure Contract

The function returns application-owned error codes and product wording. Public
responses must never include environment-variable names, provider names, raw
provider bodies, database details, or exception messages.

Configuration, database, and delivery diagnostics stay in trusted Edge Function
logs. If rendering or delivery fails after the function reserves
`welcome_email_sent_at`, it conditionally clears that exact reservation so a
later app session can retry without overwriting a newer successful delivery.

## Trigger Rule

The welcome email should trigger after the user's email is verified and the app has created or loaded their `public.users` profile. In practice, `features/auth/providers/auth-provider.tsx` calls the email service when a signed-in user is hydrated and `welcome_email_sent_at` is empty.

The email is intentionally not sent at raw signup time because email/password users may still be unverified. The marker keeps the email once-per-user across future logins, page refreshes, and app launches.

## Function Files

- `supabase/functions/welcome-to-onzait/index.ts`
- `supabase/functions/welcome-to-onzait/errors.ts`
- `supabase/functions/_shared/email/welcome-to-onzait.tsx`
- `supabase/functions/project-collaboration/index.ts`
- `supabase/functions/_shared/email/project-invitation.tsx`
- `supabase/functions/auth-send-email/index.ts`
- `supabase/functions/_shared/email/auth-email.tsx`
- `supabase/functions/_shared/email/localization.ts`
- `supabase/functions/_shared/email/i18n/`
- `supabase/functions/_shared/cors.ts`

## Template Development

React Email is installed as a dev dependency and templates live in:

```txt
supabase/functions/_shared/email
```

Preview templates locally with:

```sh
npm run email:dev
```

## Required Secrets

For local function testing:

```sh
supabase functions serve welcome-to-onzait --env-file .env.local
```

For production, add these in Supabase Edge Function secrets:

```txt
RESEND_API_KEY
EMAIL_FROM
EMAIL_REPLY_TO
SITE_URL
SEND_EMAIL_HOOK_SECRET
```

`RESEND_API_KEY` is required. Supabase provides `SUPABASE_URL` and server-side API key variables to deployed Edge Functions. The shared auth helper accepts named/current publishable-key variables and the legacy `SUPABASE_ANON_KEY` fallback; privileged email state updates continue to use `SUPABASE_SERVICE_ROLE_KEY`. The other values have development fallbacks, but should be set before production.

## Deployment Checklist

Apply the database marker migration:

```sh
npx supabase db push
```

Add or update the Edge Function secrets in the Supabase dashboard or with the Supabase CLI:

```sh
npx supabase secrets set RESEND_API_KEY="..."
npx supabase secrets set EMAIL_FROM="Onzait <onboarding@resend.dev>"
npx supabase secrets set SITE_URL="https://onzait.vercel.app"
```

Apply `20260729193000_add_project_invitation_language.sql` before deploying the
updated collaboration function. Deploy the email functions before activating
the hosted Auth hook:

```sh
npx supabase functions deploy welcome-to-onzait --use-api
npx supabase functions deploy project-collaboration --use-api
npx supabase functions deploy auth-send-email --no-verify-jwt --use-api
```

Before activating the Auth hook, configure `SEND_EMAIL_HOOK_SECRET`, confirm
hosted Auth security notifications and unused Auth email flows are disabled,
and prove signed staging delivery for confirmation and recovery in both
languages. Magic link, Auth invite, email change, reauthentication, and
security-notification templates remain deferred.

After deployment, test welcome delivery with a verified user whose
`public.users.welcome_email_sent_at` value is empty, plus invitation creation
and resend in both languages.

## Sender Defaults

Until a sending domain is verified, the function falls back to:

```txt
Onzait <onboarding@resend.dev>
```

After a domain is verified, use a sender like:

```txt
Onzait <no-reply@auth.onzait.com>
```

The pending domain, DNS, and branded sender checklist lives in [docs/pending-launch-setup.md](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/docs/pending-launch-setup.md:1).

## Test Invocation

From app code, call:

```ts
await sendWelcomeToOnzaitEmail({ language: "es", name: "Flor" });
```

The user must be signed in. Supabase will include the current session JWT when invoking the Edge Function.
