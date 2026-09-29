# Project Meaningful — Project State

Last updated: 2026-09-29  
Repository: `SRYProjects/Project-Meaningful`  
Default branch: `main`  
Production: `https://projectmeaningful.app`

This file is the implementation checkpoint. The live repository/code is the implementation source of truth.

## Operating rule — every future conversation
At the start of every future conversation for this project:
1. Read `PRODUCT_SPEC.md`.
2. Read `PROJECT_STATE.md`.
3. Inspect the current repository and recent commits.
4. Treat the live code as implementation truth.
5. Continue from the documented exact next step unless newer testing or code indicates otherwise.

Never guess when history, documentation, and code conflict. Preserve tested behavior unless a newer product decision explicitly changes it.

## Current architecture
- Static front end: `public/index.html`, `public/styles.css`, `public/app.js`.
- Cloudflare Worker/API: `src/index.js`.
- Deployment configuration: `wrangler.jsonc`.
- Supabase: Auth + PostgreSQL + RLS + project statistics function.
- Resend: Supabase Custom SMTP for passwordless auth.
- Cloudflare Turnstile: action-submission verification.
- Cloudflare Workers AI: Llama Guard moderation.
- GitHub → Cloudflare deployment is active.

Runtime configuration includes Supabase URL plus server-side Supabase and Turnstile secrets and Workers AI binding. Secrets must never be placed in client code or documentation.

## Built
### Site shell
- Homepage hero, experiment introduction, project activity area, Meaningful Actions placeholder, Discoveries placeholder, Project Meaningful section, footer.
- Responsive CSS.
- Action and authentication dialogs.

### Authentication
- Supabase passwordless magic-link/OTP flow.
- New participant: email + public username.
- Returning sign-in uses `shouldCreateUser: false`.
- Persistent browser session.
- Sign Out.
- Generic returning-user response prevents email enumeration.
- Profile creation after authentication.

### Meaningful Action submission
End-to-end pipeline exists:
1. authenticated browser submits category/text + Turnstile token;
2. Worker verifies bearer session with Supabase;
3. Worker validates category, 1–140 chars, markup/link prohibition;
4. Worker verifies Turnstile hostname/action;
5. Workers AI moderates;
6. explicit `safe` → `published`; anything else/error → `pending`;
7. Worker inserts into Supabase;
8. published submission refreshes project statistics.

Categories currently supported end-to-end include **Sacrifice**.

### Post-submission UX
- Published state: “Your Meaningful Action has been published.”
- Buttons: **View My Action**, **Share Another Action**.
- Pending state has pending-review confirmation and no public-view action.
- Dialog can close via X, Escape, or backdrop click.
- “View My Action” currently scrolls to the Meaningful Actions section; it cannot show/highlight the actual item until the public feed is built.

### Database established
Known schema includes:
- `profiles`
- `meaningful_actions`
- `discoveries`
- `admin_users`
- `admin_audit_log`
- `action_category`
- `moderation_status`
- `project_stats()`

`Sacrifice` has been added to the action category enum.

## Tested and confirmed working
Live production testing has confirmed:
- custom domain loads;
- Supabase/Resend magic-link authentication works end-to-end;
- a separate/private browser session requires its own authentication context;
- authenticated sessions persist in the browser that receives the login;
- Meaningful Action submission works through Turnstile, Worker validation/moderation, and Supabase insertion;
- normal submissions have published successfully;
- project statistics update after published submissions;
- Sacrifice category submits successfully;
- post-publication confirmation works;
- Share Another Action returns a fresh form;
- backdrop click closes the dialog;
- View My Action closes the dialog and scrolls to the Meaningful Actions section.

Recent live test examples included Work (“Finished proposal for new clients”) and Sacrifice (“Instead of wasting time, I went for a walk”).

## Currently unfinished
- Public Meaningful Actions feed: currently an empty placeholder.
- Meaningful Actions category filter and exact case-insensitive username search.
- Dedicated Meaningful Actions archive.
- Discoveries submission, moderation, public feed, and archive.
- Your Record; nav currently shows a placeholder alert.
- Registration Turnstile.
- Per-account/per-IP rate limits, search throttling, and finalized auth-email limits.
- Reserved username enforcement.
- Admin review/removal UI and MFA/allowlist completion as applicable.
- Demo content.
- Account deletion/export UX and Privacy/Terms.
- Final project launch date / dynamic Day N.
- Accessibility/polish pass.

## Known risks / technical debt
- Current moderation does not auto-reject; non-`safe` and moderation errors become pending.
- Audit log append-only protection currently depends on application/RLS boundaries; privileged/direct database access can bypass RLS. Stronger DB-level protection may be warranted before admin tooling.
- Reserved usernames are not yet enforced.
- Username-change policy is unresolved.
- Demo profiles may require special handling because profiles are tied to auth users.
- `is_demo` exists at content level and may also be represented elsewhere; normalize only if needed.
- Turnstile is on Meaningful Action submission but not registration.
- Rate limiting is not yet implemented.
- “View My Action” cannot identify/highlight the submitted item until the feed exists.

## Recent meaningful repository work
Current repository inspection confirms the live implementation contains:
- `public/index.html`: Sacrifice category and published/pending dialog states.
- `public/styles.css`: dialog action/secondary-button styling.
- `public/app.js`: post-submission states, backdrop close, Share Another Action, View My Action scroll behavior.
- `src/index.js`: Sacrifice server allowlist plus authenticated Turnstile/moderation/database submission pipeline.
- `wrangler.jsonc`: static assets, Worker API routing, Workers AI binding, Supabase URL.

The repository's current files were inspected directly before this state file was created.

## Deployment status
Production deployment is live at **projectmeaningful.app**. The latest code changes above were reported deployed successfully and then exercised on the live site.

## Exact next step
**Build the public Meaningful Actions feed, starting with the server/data endpoint in `src/index.js`.**

Required feed behavior:
- published entries only;
- newest first;
- public username;
- category;
- action text;
- date/time;
- Example label for demo content;
- demo content excluded from real statistics;
- category filtering;
- exact, case-insensitive username search;
- clear no-results state;
- fixed-height independently scrollable homepage feed;
- after the feed exists, make **View My Action** target the newly submitted entry rather than merely scroll to the section.

Build this in small deployable increments and test before proceeding.

## Short remaining roadmap
1. Public Meaningful Actions endpoint/feed/search/filter + View My Action targeting.
2. Dedicated Meaningful Actions archive.
3. Discoveries submission/moderation/feed/archive.
4. Your Record.
5. Registration abuse protection + rate limiting/search throttling/reserved usernames.
6. Admin review/removal workflow.
7. Demo content.
8. Account deletion/export, Privacy/Terms, launch-day logic.
9. Accessibility, responsive/polish, final launch testing.

## End-of-session protocol
After every substantial build session:
1. Commit working code with a meaningful commit message.
2. Update `PROJECT_STATE.md`.
3. Record what changed.
4. Record testing status.
5. Record known issues.
6. Record the exact next step.
7. Update `PRODUCT_SPEC.md` only when a genuine product decision changes.
