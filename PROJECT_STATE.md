# Project Experiment — Project State

Last updated: 2026-10-08  
Repository: `SRYProjects/Project-Experiment`  
Default branch: `main`  
Production: `https://projectmeaningful.app`

This file is the implementation checkpoint. The live repository/code is the implementation source of truth.

## Project identity — do not confuse projects
- **This project:** Project Experiment — repository `SRYProjects/Project-Experiment` — lightweight public experiment deployed at `projectmeaningful.app`.
- **Separate project:** TMP App (The Meaningful Project app) — a larger, complex application with its own files, repository, requirements, and implementation state.
- Never inspect, modify, or import TMP App material when working on Project Experiment unless the user explicitly directs a cross-project task.
- The former repository name `SRYProjects/Project-Meaningful` is obsolete for this project.

## Operating rule — every future conversation
At the start of every future conversation for this project:
1. Confirm the repository is `SRYProjects/Project-Experiment`; do not substitute TMP App or the obsolete `Project-Meaningful` repository name.
2. Read `PRODUCT_SPEC.md`.
3. Read `PROJECT_STATE.md`.
4. Inspect the current repository and recent commits.
5. Treat the live code as implementation truth.
6. Continue from the documented exact next step unless newer testing or code indicates otherwise.

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

### Database source of truth
- `supabase/schema.sql` is the verified baseline of the live Supabase `public` schema as inspected on 2026-09-29.
- It records the current enums, tables, generated/identity columns, constraints, indexes, functions, triggers, RLS policies, and effective API-role privileges.
- It is a **fresh-project baseline**, not a script to rerun against production.
- Future database changes must be committed as dated SQL files under `supabase/migrations/` and applied deliberately to Supabase. Do not make undocumented dashboard-only schema changes.
- Supabase-managed schemas such as `auth` are external platform infrastructure and are intentionally not duplicated in the repository.

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
- “View My Action” now reloads the public feed and targets the newly published entry by returned action ID.

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
- public `GET /api/actions` returns published Meaningful Actions newest-first with username, category, action text, timestamp, and Example status, without exposing `user_id` or email;
- homepage Meaningful Actions feed successfully loads and displays live published entries from that endpoint;
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
- Homepage Meaningful Actions feed, styling, category filter, and exact case-insensitive username search are implemented. The Community area now uses a normal 1280px maximum reading width; the desktop Action feed is 760px high with shorter responsive heights, and links to the full archive. Production verification is required.
- Dedicated Meaningful Actions archive is implemented with server-side category/username filtering and paginated Load More behavior; production verification is still required.
- Discoveries submission, moderation, homepage public feed, exact case-insensitive username-filtered archive, and paginated Load More behavior are implemented in code. The 2026-10-06 dialog/Turnstile lifecycle fix requires production verification.
- Homepage now uses a distinctive abstract hero, a larger dark blue/green/gold project-activity band, a normally proportioned Community section with a compact right rail, and one consolidated **Follow The Meaningful Project** section beneath the Community columns. Production visual verification is required.
- Your Record is implemented in code as a private authenticated modal with published-action count, distinct published-action days, newest-first action history, and visible Pending/Rejected states. Production verification is required.
- Registration Turnstile.
- Per-account/per-IP rate limits, search throttling, and finalized auth-email limits.
- Reserved username enforcement.
- Admin review/removal UI and MFA/allowlist completion as applicable.
- Demo content is now implemented: 15 fictional Example participant handles, 55 Example actions, and 15 Example discoveries. Production feed/search/archive verification is required.
- Account deletion/export UX and Privacy/Terms.
- Final project launch date / dynamic Day N; until launch is set, the interface now says **Not launched** rather than showing a false Day 1.
- Future full-application update opt-in persistence/consent mechanism; the current UI explains the option but deliberately does not collect consent yet.
- Accessibility/polish pass.

## Known risks / technical debt
- Current moderation does not auto-reject; non-`safe` and moderation errors become pending.
- Audit log append-only protection currently depends on application/RLS boundaries; privileged/direct database access can bypass RLS. Stronger DB-level protection may be warranted before admin tooling.
- Reserved usernames are not yet enforced.
- Username-change policy is unresolved.
- Example content now uses dedicated `demo_username` fields on actions/discoveries rather than fake auth/profile rows; real rows remain auth-backed. The identity constraints must be preserved in future schema work.
- Turnstile is on Meaningful Action submission but not registration.
- Rate limiting is not yet implemented.
- Current Supabase table grants are broad for API roles; RLS is the operative row-access boundary. Preserve and audit RLS carefully whenever schema/policies change.
- Security-definer/helper functions currently have EXECUTE granted to the standard API roles. Their definitions were captured exactly from production; privilege tightening can be considered separately rather than silently changing the verified baseline.
- “View My Action” targeting is implemented by returned action ID and feed card `data-action-id`, but the targeting behavior still requires production verification.

## Recent meaningful repository work
Current repository inspection confirms the live implementation contains:
- `public/index.html`: Sacrifice category and published/pending dialog states.
- `public/styles.css`: dialog action/secondary-button styling.
- `public/app.js`: post-submission states, backdrop close, Share Another Action, View My Action scroll behavior.
- `src/index.js`: Sacrifice server allowlist plus authenticated Turnstile/moderation/database submission pipeline.
- `wrangler.jsonc`: static assets, Worker API routing, Workers AI binding, Supabase URL.
- `supabase/schema.sql`: verified baseline of the live public database schema.
- `src/index.js`: Discoveries GET/POST API, server validation, Turnstile action verification, Workers AI moderation, Supabase insert, username filtering, and pagination.
- `public/index.html` + `public/app.js`: Discoveries submission dialog, 280-character limit, dedicated Turnstile widget lifecycle, published/pending states, public feed, and View My Discovery targeting.
- `public/discoveries.html` + `public/discoveries.js`: dedicated Discoveries archive with exact username search and Load More pagination.
- JavaScript syntax/static checks passed for the Worker, homepage app, and Discoveries archive after these changes.
- `public/index.html` + `public/styles.css`: substantial homepage redesign completed on 2026-10-05. The redesign preserves all existing interaction IDs/JS hooks; integrity check found no duplicate IDs and no missing DOM selectors.
- The new Explore Project Meaningful area intentionally stages Articles, Book, Videos, and Follow the Project without fabricating external URLs. Real resource links remain to be connected when verified/provided.
- Readability/community refinement completed: supporting type increased across the homepage; Meaningful Action cards now include category icons and color-coded category cues; community panels gained warmer card treatment and low-opacity blue/green background arcs derived from the Project Meaningful visual language.
- Brand accent direction now uses the supplied Project Meaningful palette selectively: blue `#0066cc`, green `#519d2d`, and restrained gold `#e8b007`.
- Community emphasis refinement completed: the overall site palette is lighter; Actions/Discoveries panels are larger; homepage feeds are now 460px high; action text/meta sizes were increased; each Action category now has its own distinct color/icon cue.
- Discoveries now have card icons with rotating visual tones and exact case-insensitive homepage username search with Clear behavior matching the Actions pattern.
- The header, hero, activity strip, and Project architecture section were lightened so the community streams carry the strongest visual emphasis.
- 2026-10-05 design correction: the washed-out hero direction was rejected. The hero is again dark, dramatic, and white-on-dark, now using a full-width abstract background instead of the separate geometric side graphic.
- Community stream header icons were removed; entry-level category/discovery icons remain.
- Actions/Discoveries containers widened to a 1680px maximum presentation width while preserving the currently approved card treatment.
- Added an explicit **Log an Action** button inside the Actions window and changed the Discoveries in-window CTA to **Log a Discovery**.
- Rebuilt the project activity area as a clearer stats band with an explanatory lead-in and more prominent values.
- 2026-10-05 community refinement: primary blue CTAs now have rounded corners; the former muted "The Idea Is Simple" section is now a vibrant blue/green **Join Project Meaningful** invitation with three explicit participation benefits and a working **Join the Experiment** button.
- The community section background is now white/open; outer stream-panel borders, heavy shadows, and rounded "window" containers were removed so the individual Action/Discovery entries provide the visual structure.
- Actions/Discoveries presentation width increased again to a 1720px maximum with more whitespace between the two streams and a subtle divider only where useful.
- The decision remains to avoid the word **Subscribe** until explicit update-consent persistence exists; joining the experiment and subscribing to future communications are separate actions.
- Final 2026-10-05 visual consolidation before conversation handoff:
  - **Join Project Meaningful** now follows the approved partner-inspired treatment: substantially larger headline/body type, numbered participation benefits, gold circular benefit icons, and a prominent pill-shaped Join the Experiment CTA.
  - The project-activity band directly under the hero was strengthened: the far-left statement is restored to a clearly larger display size, the band is taller/more pronounced, statistic values are larger, and each metric has a visible gold icon treatment.
  - **Explore Project Meaningful** was rebuilt into the same dark/high-contrast brand family as the hero, with blue/gold emphasis, gold-outlined resource cards, and visual resource cues.
  - The final **Project Meaningful** architecture section was also rebuilt as a dark green/navy companion section, with higher-contrast typography and visual cues for Book / Experiment / Application / Community.
  - Existing Actions/Discoveries card design and behavior were intentionally preserved.
- The supplied Meaningful logos and book artwork were reviewed. They are intentionally not forced into the current homepage layout yet; the Book artwork is reserved for the real Book resource destination, and the logo assets remain available for later brand integration if the production review shows they improve rather than clutter the site.
- 2026-10-06 homepage continuation review: the final 2026-10-05 visual consolidation was re-inspected in current `main`. Code-level checks confirmed the approved dark hero, pronounced activity band, partner-inspired Join block, open community treatment, dark Explore section, dark Project architecture section, responsive rules, unique DOM IDs, and intact JavaScript hooks. A rendered production visual check could not be performed from the available network tools because `projectmeaningful.app` was not reachable from this environment; this remains a manual/live verification item rather than a code defect.
- 2026-10-06 **Your Record** build completed and committed to `main`:
  - replaced the placeholder nav alert with a private authenticated modal;
  - added summary metrics for total published Meaningful Actions and distinct Eastern-Time days with a published action;
  - added newest-first private action history including pending content that is not public, with explicit Published / Pending / Rejected status treatment;
  - added a direct **Log an Action** continuation CTA;
  - added authenticated `GET /api/record` in the Worker, verifying the bearer token through Supabase Auth before querying only the authenticated user's non-demo actions;
  - no database migration was required.
- Your Record validation after the build: homepage JavaScript syntax **passed**; Worker JavaScript syntax **passed**; duplicate HTML IDs **none**; JavaScript-referenced DOM IDs missing **none**; CSS brace balance **passed**; live Supabase project status **ACTIVE_HEALTHY**; read-only aggregate query confirmed the fields and Eastern-Time date semantics used by the record summary.
- 2026-10-06 design refinement requested after live review:
  - rebuilt the project-activity strip under the hero as a larger dark navy/green brand band with stronger white type and gold statistic cues;
  - changed the Join card CTA from **Join the Experiment** to **Share Something Meaningful**;
  - enlarged Action category/text fields and Discovery text fields, including field/label typography and touch target size;
  - expanded desktop community feed height to 1480px so the two side-by-side streams can expose roughly 25–30 entries collectively before internal scrolling; tablet/mobile use shorter responsive heights;
  - fixed the Discovery dialog lifecycle so the modal opens before Turnstile initialization and added retry handling if the verification script has not loaded yet;
  - merged **Go Deeper** and **One Project. Four Parts.** into one **Follow The Meaningful Project** section containing Articles, one Book entry, Videos, The Application, and Project Updates; the Experiment and duplicate Community architecture cards are no longer repeated.
- Example-content infrastructure and seeding completed:
  - migration `supabase/migrations/20261006170000_demo_content_support.sql` committed and applied to production Supabase as migration version `20261006170315`;
  - actions/discoveries now support either a real authenticated `user_id` or a lowercase fictional `demo_username`, enforced by database identity constraints;
  - seeded **15** fictional Example handles, **55** Example actions, and **15** Example discoveries;
  - public Worker feed/search mapping now supports Example usernames while preserving existing real-profile behavior;
  - every Example remains `is_demo = true`, visibly renders with the existing **Example** label, and remains excluded from `project_stats()`.
- Validation after this refinement:
  - homepage JS syntax **passed**;
  - Worker JS syntax **passed**;
  - duplicate HTML IDs **none**;
  - JavaScript-referenced DOM IDs missing **none**;
  - CSS brace balance **passed**;
  - live database verification found 55 demo actions / 15 demo discoveries / 15 fictional handles and zero real rows missing authenticated user IDs;
  - live `project_stats()` returned real-only totals (6 real published actions, 1 action today, 1 real participant at verification time), confirming Example rows do not inflate statistics;
  - Supabase security/performance advisors were run after the migration. They surfaced the repository's already-known SECURITY DEFINER / RLS performance warnings and no demo-identity-specific finding.
- 2026-10-06 Community-only layout refinement:
  - Meaningful Actions left column was intentionally left unchanged;
  - Discoveries remains in the right column but its homepage feed is reduced to 560px on desktop (440px on mobile);
  - the existing **STAY CONNECTED / Follow The Meaningful Project** block was moved from below the Community section into the right column directly beneath Discoveries;
  - Follow content/copy and existing interaction IDs were preserved; its cards were compacted only enough to fit the right rail;
  - no JavaScript behavior was changed.
- Static verification after this move: duplicate IDs **none**; JavaScript-referenced DOM IDs missing **none**; one Actions section, one Discoveries section, one Follow section; Action feed global 1480px height preserved; CSS brace balance **passed**.
- 2026-10-06 Community proportion/right-rail redesign supersedes the immediately preceding Community layout:
  - reduced the Community content width from 1720px to a **1280px maximum**;
  - changed desktop proportions to a primary Action column and a substantially narrower right rail;
  - reduced the desktop Action feed from **1480px to 760px** and the Discoveries feed to **330px**, with responsive reductions on smaller screens;
  - rebuilt the right rail as compact stacked **Project Activity**, **Your Record**, and **Discoveries** cards, using the supplied concept for hierarchy rather than literal replication;
  - Project Activity mirrors the existing real statistics; **Your Record** reuses the existing private authenticated flow;
  - moved **Follow The Meaningful Project** beneath the two Community columns as a compact five-part ecosystem section;
  - Meaningful Actions content, filters, cards, and submission behavior were not redesigned.
- Static validation after this redesign: homepage JS syntax **passed**; duplicate IDs **none**; JavaScript-referenced DOM IDs missing **none**; Community 1280px constraint **present**; Action 760px feed **present**; right-rail Activity/Record/Discoveries cards **present**; Follow section occurs once beneath the columns; CSS brace balance **passed**.
- 2026-10-06 Follow-section refinement:
  - **Follow The Meaningful Project** is now a separate standalone section outside **The Community in Motion**;
  - the same five areas remain in the same order with existing copy/behavior preserved;
  - the former connected/divided resource rectangle was replaced with five independent dark cards separated by visible gaps, following the supplied reference as design inspiration rather than literal replication;
  - responsive behavior keeps the cards at five across on wide screens, two across at intermediate widths, and one per row on narrow screens;
  - no Community, Action, Discovery, Record, or backend behavior was changed.
- Static validation after the Follow change: homepage JS syntax **passed**; duplicate IDs **none**; JavaScript-referenced DOM IDs missing **none**; one standalone Follow section; five resource cards; separated-card gap **present**; shared grid border removed in the standalone override; CSS brace balance **passed**.
- 2026-10-06 design-balance correction based on live screenshot review:
  - reduced logged Meaningful Action body copy to normal reading scale (`.96rem`, sans-serif) and tightened card padding/meta sizing;
  - aligned the Community heading's right-side explanatory text to the actual right rail by matching the Community heading grid to the live two-column proportions;
  - increased visual separation inside **The Community in Motion** with a cool light section field, a distinct white Action panel, blue-tinted Project Activity card, green-tinted Your Record card, and warm-neutral Discoveries card;
  - replaced faint feed scrollbars with clearly visible but restrained track/thumb styling for both Actions and Discoveries;
  - redesigned **One deliberate action at a time** as a light contrast band with a deep blue/green introduction block, differentiated stat cells, and a coherent SVG icon-tile system replacing improvised glyphs;
  - recolored the standalone **Follow The Meaningful Project** section to a restrained light editorial palette with navy/teal typography and individually accented icons, removing the harsh dark blue/gold treatment;
  - no submission/auth/database behavior changed.
- Static validation after this pass: homepage JS syntax **passed**; duplicate IDs **none**; JavaScript-referenced DOM IDs missing **none**; four SVG activity icons **present**; Action copy-size override **present**; Community heading/right-rail grid alignment **present**; visible scrollbar styling **present**; Community contrast treatments **present**; Follow palette override **present**; CSS brace balance **passed**.
- 2026-10-06 refinement from live visual review:
  - changed **Join Project Meaningful** to a warm sand/ivory card so it separates clearly from the surrounding blue/green **The Idea Is Simple** section;
  - removed the numeric labels from the three Join benefits; icons now carry the sequence visually;
  - strengthened differentiation in the Community right rail: Project Activity uses a cool blue-gray treatment, Your Record uses a warm tan/stone treatment, and Discoveries uses a warm neutral treatment with a strong teal top accent;
  - emphasized **What people noticed** with stronger heading hierarchy, border accent, and shadow while preserving its existing controls/behavior;
  - equalized the desktop Community columns by stretching both sides to the same grid row height and allowing the Action/Discovery feeds to flex within their columns;
  - changed the standalone **Follow The Meaningful Project** field from mint/green to a warm light stone/tan background with slightly stronger section contrast;
  - removed the numeric labels from all five Follow cards; their icons now provide sufficient visual identification;
  - no JavaScript, auth, submission, moderation, or database behavior changed.
- Static validation after this refinement: homepage JS syntax **passed**; duplicate IDs **none**; JavaScript-referenced DOM IDs missing **none**; Join numbers **removed**; Follow numbers **removed**; equal-height desktop Community rule **present**; Discovery emphasis **present**; right-rail contrast trio **present**; warm Follow section **present**; CSS brace balance **passed**.
- 2026-10-08 top-section/community-feed correction:
  - kept the Hero, **One deliberate action at a time**, and **The Idea Is Simple** as three distinct sections but unified them into one coordinated deep navy/teal palette so they read as one site rather than patched-together components;
  - removed all four Project Activity icons;
  - centered the four Project Activity values/labels and materially increased the value size; **Not launched** remains scaled to fit cleanly;
  - restored fixed-height, always-scrollable homepage windows for Meaningful Actions and Discoveries with the existing visible scrollbar treatment;
  - homepage rendering is now capped at the first **20 filtered Actions** and first **20 filtered Discoveries**, while the dedicated archives remain the full browsing surfaces;
  - the full public datasets are still loaded before client filtering, so homepage category/username filtering continues to search the loaded dataset rather than only the visible 20;
  - no submission, authentication, moderation, database, or archive behavior changed.
- Static validation after this correction: homepage JS syntax **passed**; duplicate IDs **none**; JavaScript-referenced DOM IDs missing **none**; activity icons **removed**; centered/enlarged stat values **present**; coordinated top palette **present**; Actions fixed scroll **present**; Discoveries fixed scroll **present**; homepage Action cap **20**; homepage Discovery cap **20**; CSS brace balance **passed**.
- 2026-10-08 researched site-wide palette redesign:
  - replaced the accumulated mix of bright blue, green, mint, dark blue, and gold treatments with one controlled editorial palette: **deep slate navy (#183042), muted teal (#2f6f68), warm ivory/paper (#f7f4ee / #fffdf9), warm stone (#eee9df), and restrained brass (#b58a3a)**;
  - research basis: use one anchor hue, a neutral base, restrained accent color, and planned tints/shades rather than competing unrelated hues; maintain WCAG-readable foreground/background contrast;
  - updated root color tokens and applied the system across header/navigation, primary buttons, hero, Project Activity, The Idea Is Simple, Join card, Community field, Actions panel, right-rail cards, scrollbars, Follow section, inputs/dialogs, archives, and footer;
  - retained category-specific Action colors because those colors carry real scanning/category information rather than decorative page theming;
  - restored desktop Community baseline alignment: the left Actions panel stretches to the same row height as the complete right rail, and its feed flexes within the panel while remaining scrollable and capped at 20 rendered homepage items;
  - no JavaScript behavior, auth, moderation, data model, or archive behavior changed in this palette pass.
- Static validation after this palette pass: homepage JS syntax **passed**; duplicate IDs **none**; JavaScript-referenced DOM IDs missing **none**; new palette variables **present**; desktop Community alignment rule **present**; Actions remains scrollable; 20-item homepage caps **retained**; site-wide section palette overrides **present**; CSS brace balance **passed**.

The repository's current files and the live Supabase schema exports were inspected directly before this state file was updated.

## Deployment status
Production is served at **projectmeaningful.app** through the existing GitHub → Cloudflare deployment. The 2026-10-06 refinement commits are on `main`; rendered production verification after Cloudflare picks them up is the next required step.

## Database handoff checkpoint
- The original live Supabase public-schema baseline was captured on 2026-09-29.
- On 2026-10-06 migration `20261006170315 demo_content_support` was applied deliberately to production and verified.
- `supabase/schema.sql` has been refreshed to reflect the verified post-migration schema; the dated migration remains the history of the change.
- Example content is data, not a real-participation statistic: 55 demo actions and 15 demo discoveries are `is_demo = true` and excluded by `project_stats()`.

## Exact next step
**Production-review the 2026-10-08 site-wide palette redesign and Community alignment on `projectmeaningful.app`.**

Verify:
- the site now reads as one coherent editorial system built around deep slate navy, muted teal, warm ivory/stone, and restrained brass;
- no section reintroduces the former bright-blue / mint-green patchwork feeling;
- text and controls remain clearly legible against their backgrounds;
- the Actions panel bottom aligns with the bottom of the complete right rail on desktop;
- Actions remains scrollable and capped at 20 rendered homepage items;
- Discoveries remains scrollable and capped at 20 rendered homepage items;
- category colors still scan clearly without overpowering the site palette.

Do not introduce additional colors unless they serve real information or state.

## Short remaining roadmap
1. Production-verify the 2026-10-06 design/Example-content refinement plus Your Record.
2. Connect verified resource destinations for Articles / Book / Videos / social when available.
3. Registration abuse protection + rate limiting/search throttling/reserved usernames.
4. Admin review/removal workflow.
5. Account deletion/export, Privacy/Terms, launch-day logic.
6. Accessibility, responsive/polish, final launch testing.

## End-of-session protocol
After every substantial build session:
1. Commit working code with a meaningful commit message.
2. Update `PROJECT_STATE.md`.
3. Record what changed.
4. Record testing status.
5. Record known issues.
6. Record the exact next step.
7. Update `PRODUCT_SPEC.md` only when a genuine product decision changes.
