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
2. Hero / primary participation invitation
3. Project activity
4. Brief experiment premise
5. Community activity: Meaningful Actions + Discoveries as complementary live streams
6. Explore Project Meaningful: Articles, Book, Videos, and project/future-application updates
7. The larger Project Meaningful architecture: Book, Experiment, Application, Community
8. Footer

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
- Homepage feed is fixed-height and independently scrollable with a visible scrollbar. Keep the homepage stream compact rather than stretching short 140-character entries across excessive vertical space.
- On wider screens, once Discoveries are fully implemented, present Meaningful Actions and Discoveries as complementary side-by-side public streams; stack them on smaller screens.
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
- Explicit Sign Out.
- Reserved/admin/system impersonation usernames must be prevented before launch.

## Privacy boundaries
- Meaningful Actions and Discoveries are intentionally public once published.
- Email and account identity data remain private.
- No public Meaningful Gap; that concept was removed from V1 because it is too sensitive.
- No user-uploaded images in V1.
- Account deletion defaults to deleting the user and associated submissions. If anonymization is ever offered, it must be an explicit choice.
- Provide a simple export/request mechanism and disclose deletion behavior in Privacy/Terms.

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
- Day 1 is based on a fixed launch date. Before the public launch date is set, the interface must show **Not launched** rather than fabricate a day count.
- Do not fabricate activity counts.

## Demo content
Planned launch seeding: approximately 15 fictional composite participants, 50–60 demo actions, and a smaller set of discoveries. Every demo item must be visibly labeled **Example** and excluded from real counts. Demo identities must not impersonate real people.

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

Current implementation intentionally treats explicit AI `safe` as published and anything else/error as pending; it does not yet auto-reject because the current model’s unsafe result is too broad to equate safely with “clearly prohibited.”

## Abuse controls
V1 requires:
- verified email;
- Cloudflare Turnstile on registration/public submissions;
- per-account and per-IP rate limiting;
- search throttling;
- auth-provider and application-level auth email rate limits.

Exact thresholds remain to be set.

## Admin
Private admin access requires Supabase account + explicit allowlist/role + MFA. Admin actions should be auditable. Audit log is intended to be append-only at the database/application level.

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

Meaningful Action stores user ID, category, action text, timestamp, demo/real flag, moderation status, and moderation timestamp as applicable.

Discovery stores user ID, text, timestamp, demo/real flag, and moderation status.

RLS is part of the database security model. Public statistics are exposed through a database function and exclude demo/unpublished content.

## Visual direction
- Serious, editorial, distinctive; not “wellness,” but also not a sterile database interface.
- The public site should feel like a living community project with intellectual substance behind it.
- Dark/abstract/moody hero direction suggesting deliberate choice versus autopilot; geometric/structured visual language is preferred over generic gradients or stock imagery.
- Avoid mountains, meditation, stock wellness imagery, aspirational lifestyle clichés, featured-member/social-status hierarchy, and unnecessary animation.
- Public streams should feel live through real timestamps/content, compact entry density, and clear hierarchy rather than gimmicks.
- Meaningful Actions and Discoveries remain the living center of the homepage; on wider screens they sit side-by-side and stack responsively on smaller screens.
- Include an **Explore Project Meaningful** resource area for Articles, the Book, Videos, and project/social/application updates. Do not invent external destinations; connect real links only when verified/provided.
- The Book, Experiment, Application, and Community should read as one coherent project architecture rather than an appended footer block.
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
- Exact abuse/rate-limit thresholds.
- Final reserved-username list and username-change policy.
- Exact account export UX.
- Final demo identities/content.
- Whether/when current moderation will support automatic rejection distinct from pending.
- Detailed Privacy/Terms copy.
