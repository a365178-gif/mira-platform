# Supabase Schema

## What this migration establishes

`migrations/20261118010000_create_core_schema.sql` creates the first MIRA
database schema:

- `profiles`: non-auth profile fields, created automatically when an
  `auth.users` row is created. Exact date of birth and identity-document data
  are intentionally not stored.
- `age_verifications`: verification attempts and their status. The server may
  record a trusted provider result or an authorized manual review. Provider
  references and reviewer identity are not readable by client roles. Only one
  pending request per user is allowed; completed attempts remain as history.
- `exploration_sessions`: one pairwise exploration flow with canonical member
  ordering, a stage number, and an overall state.
- `exploration_responses`: each participant's private `interested` or `pass`
  decision; clients can read only their own response.
- `matches`: created transactionally once both participants have expressed
  interest.

The follow-up migration `20261118020000_create_member_privacy_and_avatars.sql`
adds `member_private_details` for gender and dating preferences. It removes the
old `profiles.gender` client grant and copies existing values into the private
table. Email remains in Supabase Auth; exact birth dates are never stored.
Member avatars use the private `member-avatars` Storage bucket, restricted to
the owning user's folder and a 5 MB image limit.

## Age verification and access rules

1. A signed-in adult requests verification by inserting a `pending` row with
   method `provider` or `manual`.
2. A trusted server-side provider callback or moderator workflow records the
   result. Clients cannot update verification results or set a profile to
   `active`.
3. A profile can become `active` only when there is a current verified adult
   result. Expired results stop discovery access even if a background job has
   not yet changed the stored status.
4. The database stores only the adult decision and minimal audit metadata. It
   does not store birth dates, government-ID numbers, document images, or
   selfies. Raw evidence must remain with the verification provider or an
   explicitly designed, encrypted, short-retention review system.

RLS is enabled on all public tables. Client grants are column-limited;
verification writes and profile activation are server-owned. Discovery RPCs
require an active, verified adult profile. Never expose a Supabase `service_role`
key to an app client.

## Three-stage exploration

The initial, agreed flow is:

1. **Explore:** `start_exploration(candidate_id)` creates or returns a session
   between two discoverable adult profiles (`stage = 1`).
2. **Express interest:** `record_exploration_response(session_id, decision)`
   records a participant's `interested` or `pass` response (`stage = 2`).
3. **Mutual match:** when both participants choose `interested`, the same
   transaction advances the session to `stage = 3`, marks it `matched`, and
   creates one `matches` row. A `pass` closes that exploration as `passed`.

The row lock on the session serializes concurrent responses. Clients cannot
write sessions, responses, or matches directly; they use the RPCs. Messaging,
ranking/recommendation algorithms, blocking/reporting, and rematch policy are
intentionally outside this schema phase.

## Web member account setup

The web app uses Supabase Auth email/password with the official
`@supabase/ssr` cookie integration. Copy `apps/web/.env.example` to
`apps/web/.env.local`, then set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. These values are public project
configuration, not service-role secrets. Never place a secret/service-role key
in a `NEXT_PUBLIC_*` variable.

The local Supabase config requires email confirmation. For hosted projects,
enable email confirmation, set the Auth password minimum to 12 characters, and
add the deployed `/auth/callback` URL to the Auth redirect allow list. Apply both migrations
before testing sign-up and member profile updates. Registration checks the
entered birthday in the browser and does not send or persist it. This check is
not a trusted age verification: profiles remain in `draft` until an authorized
provider or reviewer records an adult verification. The existing database
activation guard and exploration RPCs enforce that requirement. A trusted
verification provider and its callback/review workflow are not configured by
this repository, so production discovery remains unavailable until they are
implemented.

The member profile page reads the signed-in user's email from Auth and only
queries that user's profile/private details. The email is not copied to public
tables. Avatar files stay in a private Storage bucket; RLS limits reads and
writes to the authenticated owner. No service-role key is used by the web app.

## Local workflow

Install the Supabase CLI and Docker, then run:

```sh
supabase start
supabase db reset
pnpm test
supabase stop
```

The migration behavior is tested against an in-memory PostgreSQL engine by
`tests/schema.test.ts`; running the local reset additionally verifies the
Supabase migration environment. The repository includes a local Supabase config.
Before connecting any app, configure environment-specific Supabase URL and
publishable key outside source control, then add a server-side provider callback
and an authorized review workflow. Do not commit provider secrets or
service-role credentials.
