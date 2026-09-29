# AGENTS.md

Standing operating contract for coding agents working in this repository.

1. Read `PRODUCT_SPEC.md` first. It is the authority for locked product decisions.
2. Read `PROJECT_STATE.md` second. It is the current implementation checkpoint.
3. Inspect the live repository and recent commits before changing code.
4. Treat the live code as implementation truth.
5. Never guess when project records conflict, are incomplete, or do not match the code. Surface the discrepancy and resolve only what is necessary.
6. Preserve already tested and locked behavior unless the task explicitly changes it.
7. Prefer small, testable, deployable increments over large speculative builds.
8. Do not overbuild beyond documented V1 scope.
9. Keep business/domain logic separate from UI code where practical.
10. Run available build/tests after meaningful code changes; where automated tests do not exist, document the required live/manual verification.
11. Use meaningful commit messages.
12. After substantial work, update `PROJECT_STATE.md` with what changed, testing status, known issues, and the exact next step.
13. Update `PRODUCT_SPEC.md` only when an actual product decision changes.
14. Do not use conversation memory as the sole authority when repository documentation or code is available.
15. Never expose or commit secrets. Public client keys may remain client-side only when intentionally public; service/secret keys remain server-side.
16. Database work: treat `supabase/schema.sql` as the verified baseline. Put every future schema/policy/function/trigger change in a dated file under `supabase/migrations/`; apply it deliberately to Supabase and update the baseline only after production is verified. Never make undocumented dashboard-only schema changes.
17. When handing code to the project owner manually, provide complete replacement files rather than snippets unless there is a compelling reason not to.

Keep this file focused on operating discipline. Product requirements belong in `PRODUCT_SPEC.md`; implementation status belongs in `PROJECT_STATE.md`.
