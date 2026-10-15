# Project Experiment — Product Specification

Status: Canonical V1 product decisions for the **Project Experiment** repository and public experiment. Update only when an actual product decision changes.

## Project identity
This repository is **`SRYProjects/Project-Experiment`**. It contains the lightweight public Project Meaningful experiment at `projectmeaningful.app`. It is **not** the separate, complex **TMP App (The Meaningful Project app)** project. Never use TMP App files, repository state, or requirements as implementation authority for this repository.

## Purpose
Project Meaningful is a lightweight public experiment built around one question:

**Are you living according to what you say matters?**

The core behavior is simple: a participant deliberately does something meaningful, records the action, and can observe what happens when other people do the same. This site is the public experiment and public face of the larger Project Meaningful ecosystem; it is not the future full-featured Meaningful application.

## Target user
People willing to deliberately act on something they consider meaningful and briefly record what they did. Participation must remain low-friction; the product should not feel like wellness, productivity, gamification, or a conventional social network.

## Core experience
Conceptual flow: **Question → Participation → Evidence → Personal Record → Discovery → The Meaningful Project.**

Homepage order:
1. Header
2. Hero / primary participation invitation with integrated Project Activity
3. Community activity: Meaningful Actions on the left and a personal-first right rail with **Your Record** access above Discoveries; on desktop the rail stretches to the same visual endpoint as the Actions column
4. Brief experiment premise + **Share Something Meaningful** participation invitation
5. **Follow The Meaningful Project** as its own standalone section
6. Footer

Primary action: **Share Your Meaningful Action**.

## V1 scope

### Public experiment
- Hero question: **Are you living according to what you say matters?**
- Meaningful Actions public stream.
- Discoveries public stream.
- Project activity counts based on real published participation.
- Dedicated archives for Actions and Discoveries are part of V1.
- About/context section connecting the Book, Experiment, future Application, and Community.

### Meaningful Actions
- Authenticated participant submits one specific action.
- Maximum 140 characters, enforced client- and server-side.
- Categories: Family, Relationships, Health, Work, Learning, Creativity, Service, Faith, Responsibility, Sacrifice, Other.
- Public feed: newest first; username, category, action, date/time.
- Homepage feeds are fixed-height and independently scrollable with clearly visible scrollbars. After filtering, render at most **20 Actions** and **20 Discoveries** on the homepage; use the dedicated archives for deeper browsing.
- On wider screens, Meaningful Actions is the primary left column. The narrower right rail is personal-first: an expanded **Your Record** card provides access to the participant's record plus direct Action/Discovery entry points, followed by Discoveries. Project Activity is not repeated there because it already lives in the hero. The right rail and Actions column share the same bottom alignment; Discoveries expands to use the available rail height so real entries are visibly present rather than compressed. Stack the layout on smaller screens.
- Category filtering.
- Username search is exact and case-insensitive.
- Clear “No results found” state.
- Published content only is public.

### Discoveries
- Short participant observations about what they discovered by deliberately doing meaningful things.
- Maximum 280 characters, enforced client- and server-side.
- No minimum number of prior actions required.
- Independent observation; no required link to a specific action in V1.
- Public feed plus dedicated archive.

### Your Record
Private authenticated history containing:
- total published actions;
- number of days on which the participant recorded a published action;
- chronological action history;
- pending submissions clearly marked **Pending**.

Pending content is visible to its author, not public, and excluded from public counts.

## Identity and authentication
- Email is the private account identity and is never displayed publicly.
- Participant chooses a unique public username.
- Username uniqueness is case-insensitive.
- Current format: 3–30 characters; letters, numbers, underscore.
- No public profiles.
- Supabase passwordless email magic-link/OTP authentication.
- Returning sign-in must not create a new account.
- Auth responses must not reveal whether an email is registered.
- Sessions persist on the same browser/device; a new browser/device requires authentication.
- Expired sessions must prompt reauthentication rather than fail silently.
- Signed-out visitors see a persistent **Sign In** control in the top navigation; authenticated participants instead see **Your Record** and **Sign Out**.
- Username-format and username-availability errors in the new-participant flow appear directly beneath the username field.
- Profile creation after a magic-link callback must tolerate duplicate session events without ending a successful session.
- Explicit Sign Out.
- Reserved/admin/system impersonation usernames must be prevented before launch.

## Privacy boundaries
- Meaningful Actions and Discoveries are intentionally public once published.
- Email and account identity data remain private.
- No public Meaningful Gap; that concept was removed from V1 because it is too sensitive.
- No user-uploaded images in V1.
- Account deletion deletes the authentication account, profile, and associated Meaningful Actions/Discoveries. If anonymization of participant content is ever offered instead, it must be an explicit choice.
- Signed-in participants can download a **JSON data export** from Your Record containing account information, Actions, Discoveries, timestamps, and moderation status.
- Privacy and Terms are public pages operated under **Meaningful Ventures, Inc.**; contact email: **pr@meaningfulventuresinc.com**.
- If an administrator deletes their account, moderation audit events are retained but the administrator account identifier is removed from those audit events.
- Short-lived keyed-hash abuse-prevention records may persist for approximately two days and are disclosed in Privacy.
- Contact form messages are sent to Meaningful Ventures, Inc. through Resend. The form collects name, reply email, topic, and message; it uses Turnstile and HMAC-hashed rate limiting and does not create a Project Meaningful account.

## Retention / return mechanism
**Your Record is the return mechanism.** V1 does not use streaks or gamification.

## Project activity
Display actual:
- total real published actions;
- real published actions today;
- real participants;
- days since experiment launch.

Definitions:
- Real participant = verified registered user with at least one published Meaningful Action.
- Registered user with zero published actions does not count.
- Unverified users do not count.
- Demo content is excluded from real counts.
- Project day/today uses **America/New_York (Eastern Time)**.
- The experiment day counter is anchored to **September 27, 2026**, the first day the live experiment accepted a real participant. Display elapsed time as **N Days** using Eastern Time and count the start date as Day 1.
- Do not fabricate activity counts.

## Demo content
V1 seeded demo content uses **15 fictional composite participant handles, 55 demo actions, and 15 demo discoveries**. Demo content is excluded from real counts and must not impersonate real people. The homepage Actions and Discoveries preview windows do **not** display an **Example** badge; archive/deeper views may retain explicit demo labeling.

Demo content must not require fake authentication accounts. Real submissions remain tied to an authenticated profile; demo rows use a dedicated fictional demo username and no authenticated user ID.

## Content integrity and moderation
All user content is plain text.
- Server validates input independently of client validation.
- Reject HTML/executable or prohibited markup, URLs, and obvious link patterns.
- Escape output.
- Apply the same validation regardless of request path.

Moderation states:
1. **published** — approved and public;
2. **rejected** — clearly prohibited and not public;
3. **pending** — ambiguous/problematic and awaiting admin review.

V1 automated moderation is pre-publication only. Continuous retroactive automated rescanning is not required. Admin must be able to remove published content manually.

Automatic publication uses a two-stage moderation policy:
1. deterministic civility screening sends obvious profanity to `pending`;
2. Cloudflare Llama Guard supplies a generic safety signal;
3. the Project Meaningful-specific classifier makes the final contextual publication decision.

The Project Meaningful classifier holds content for clear publication concerns such as abusive content, safety concerns, private identifying information, or spam/promotion. It must **not** hold an entry merely because it is brief, ordinary, personal, emotional, imperfectly worded, controversial, or because its significance is not obvious to the model. **Meaningfulness is defined by the participant.**

A moderation-model/service error or malformed final classifier response still fails closed to `pending`. V1 does **not** automatically assign `rejected`; rejection remains an administrator decision.

## Abuse controls
V1 requires:
- verified email;
- Cloudflare Turnstile on new-participant registration and public submissions;
- reserved username enforcement at both the Worker and database boundary;
- HMAC-hashed rate-limit identifiers so raw IP addresses/email addresses are not stored in the rate-limit table;
- Worker-enforced rate limits:
  - authentication: **8 requests per IP / 15 minutes**;
  - authentication: **3 requests per email / 15 minutes**;
  - submissions: **12 per account / hour**;
  - submissions: **40 per account / day**;
  - submissions: **30 per IP / hour**;
  - exact-username search: **30 per IP / minute**;
  - contact form: **5 messages per IP / hour**;
  - contact form: **5 messages per email / day**;
- Supabase Auth's own provider limits remain an additional upstream boundary;
- rate-limit records are retained for at most approximately two days and then removed opportunistically.

These are V1 operating thresholds. Tune them from production evidence rather than loosening them preemptively.

Application data access is Worker-first: browser roles do not receive direct table privileges for profiles, actions, discoveries, admin allowlists, audit logs, reserved usernames, or rate-limit state. The intentionally public `project_stats()` aggregate RPC remains callable by the browser because it exposes only approved real-participation totals.

## Admin
Private moderation lives at `/admin.html` and is not linked from public navigation. Access requires:
- a valid Supabase account;
- explicit membership in `admin_users`;
- **AAL2** session assurance through Supabase TOTP MFA.

The admin workflow can review pending Meaningful Actions/Discoveries, publish or reject pending content, and remove already-published content by changing it to rejected. Demo content is excluded. Moderation changes are written to `admin_audit_log`, which is append-only through database triggers. All moderation reads/writes occur through the Worker service boundary.

The Admin dashboard also includes a **Participants view** available only after the same allowlist + AAL2 checks. It shows confirmed participant profiles newest-first with public username, private email, join time, Action count, Discovery count, and admin status. Email addresses are never exposed publicly.

When a participant completes account creation and their profile is first created, the Worker may send a non-blocking **new participant notification** to **pr@meaningfulventuresinc.com** through Resend. The notification is informational only and must never determine whether account creation succeeds. It includes username, private email, and join timestamp. The Worker requires a server-side `RESEND_API_KEY`; the sender address must be on a Resend-verified domain.

## Explicit exclusions
V1 does **not** include:
- comments;
- likes/reactions;
- followers/following;
- leaderboards;
- public profiles;
- social graph;
- streaks/gamification;
- public Meaningful Gap;
- user-uploaded images;
- long-form posting;
- a paywall;
- the future full Meaningful application.

## Technical architecture
Keep V1 simple and inexpensive:
- GitHub: source/version control.
- Cloudflare: DNS, custom domain, Workers deployment, static assets, Turnstile, Workers AI.
- Supabase: PostgreSQL, Auth, sessions, RLS.
- Resend: transactional authentication email through Supabase Custom SMTP.
- Front end: static HTML/CSS/JavaScript.
- Worker API: server-side authentication checks, validation, Turnstile verification, moderation, privileged database operations.
- No secret keys in client code.

Production domain: **projectmeaningful.app**.

## Data / persistence
Established database entities:
- profiles;
- meaningful_actions;
- discoveries;
- admin_users;
- admin_audit_log;
- action_category enum;
- moderation_status enum.

Meaningful Action stores either an authenticated user ID (real content) or a fictional demo username (Example content), plus category, action text, timestamp, demo/real flag, moderation status, and moderation timestamp as applicable.

Discovery stores either an authenticated user ID (real content) or a fictional demo username (Example content), plus text, timestamp, demo/real flag, and moderation status.

RLS is part of the database security model. Public statistics are exposed through a database function and exclude demo/unpublished content.

## Visual direction
- Serious, editorial, distinctive; not “wellness,” but also not a sterile database interface.
- The public site should feel like a living community project with intellectual substance behind it.
- Dark/abstract/moody hero direction suggesting deliberate choice versus autopilot; geometric/structured visual language is preferred over generic gradients or stock imagery. The hero may borrow the compact integrated-stat composition from the approved partner concept while retaining the Project Meaningful palette.
- Avoid mountains, meditation, stock wellness imagery, aspirational lifestyle clichés, featured-member/social-status hierarchy, and unnecessary animation.
- Public streams should feel live through real timestamps/content, compact entry density, clear hierarchy, and inviting visual personality rather than gimmicks.
- Meaningful Actions is the primary visual anchor of the Community area; Discoveries remains prominent but intentionally more compact inside the right rail. Use readable type, normal reading widths, and responsive stacking on smaller screens.
- Do not place decorative icons beside the Actions/Discoveries section headings unless they communicate real information. Keep iconography inside individual logged entries, where it aids scanning.
- Each community stream must contain an obvious in-window participation control. The Actions area explicitly communicates **Browse / Find / Contribute** and uses **Add Your Action**; Discoveries retains a clear **Log a Discovery** action.
- The hero should use a full-width abstract/background treatment rather than a separate decorative object beside the question.
- Project activity statistics should be clearly readable and number-led, with no decorative stat icons, centered figures, and larger values than labels. On the homepage they are integrated into the lower hero rather than presented as a separate full-width strip.
- The Community section opens with an explicit invitation to join the experiment and discover what happens over time through repeated intentional action. Do not label this as a subscription until the application actually stores explicit consent.
- The community area should feel open rather than boxed: individual entries provide the primary card/border structure; the Actions and Discoveries stream containers themselves should recede.
- Use a warm ivory/stone community field with restrained teal/navy accents so the live content feels active and central without looking clinical or fragmented.
- Primary participation buttons use Project Meaningful blue `#0066cc` with modest rounded corners rather than sharp rectangles.
- Meaningful Actions should use distinct category icon/color cues so category is legible at a glance without replacing the actual category filter.
- Discoveries should have their own visual icon treatment and support exact case-insensitive username search on the homepage as Actions do.
- The authoritative site palette is **Project Meaningful blue-led**, anchored on `#0066cc`. Use deep navy for depth, `#0066cc` as the primary action/brand anchor, a stronger **steel blue-gray** family for section differentiation, white for content surfaces, and restrained complementary gold only where emphasis helps. Current core values: deep navy `#0b2540`, ink `#102f4f`, primary blue `#0066cc`, dark blue `#004f9f`, steel blue-gray `#d6e0e8`, and restrained gold `#d89a2b`.
- **Follow The Meaningful Project** is a separate standalone section after **The Idea Is Simple**. A prominent **Join the Experiment** button sits under the section introduction and opens the existing participant-signup flow; it is deliberately **not** a subscription control because explicit update-consent storage is not implemented. The six-card resource grid contains Articles, The Book, Videos, the future Application, Project Updates, and **The Vision**. On wider screens, the six cards form a balanced 3×2 grid; at smaller sizes they collapse responsively.
- **Articles** links to the verified The Meaningful Project Substack profile.
- **The Book** links to a dedicated editorial book page using the approved cover design in a CSS book mockup. The page explains the incidental/verasa distinction, daily practice, and ownership/return framing without implying that the book is currently for sale; interest is directed to Substack or Contact.
- **Videos** displays **Coming soon.** until a verified destination exists.
- **The Vision** links to a dedicated public-facing page explaining the larger ecosystem—IDEAL, Meaningful daily practice, application, community, books/content, courses, speaking/gatherings, and organizational application—without publishing internal go-to-market mechanics as site copy.
- A persistent **Contact** destination is available from primary/public navigation. The contact form is Turnstile-protected, rate-limited, and delivers messages to the operator through Resend.
- The Project Meaningful green mark is used as the site favicon.
- Do not invent external destinations; connect real links only when verified/provided.
- Responsive and accessible implementation is required.

## Larger/commercial direction
The public experiment is one part of the larger Project Meaningful ecosystem: the Book, public Experiment, future deeper Application, and Community. V1 is free/public and is not the full commercial application.

The experiment should invite interested participants to opt in to occasional information about the future full Meaningful application, but participation in the experiment must never subscribe them automatically. Until a consent-storage mechanism and appropriate disclosure are implemented, the site may explain the future opt-in but must not pretend to collect it.

## Revisions / rejected directions
Later decisions supersede earlier proposals:
- **Meaningful Gap:** removed from public V1 for privacy reasons.
- **Streaks / 7-day badge / return-tomorrow gamification:** rejected; Your Record is the retention mechanism.
- **Discovery gating until day 7:** rejected; participants may submit Discoveries from day 1.
- **Dedicated public profiles/social features:** rejected.
- **Fake/impressive activity counts:** rejected; show real counts.
- **Scores/competitive mechanics:** not part of this experiment.

## Unresolved / not yet locked
Do not infer answers to these:
- Final production launch date used to calculate “Day N.”
- Username-change policy.
- Whether/when current moderation will support automatic rejection distinct from pending.
