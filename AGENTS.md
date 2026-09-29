# AGENTS.md

Standing operating contract for coding agents working in this repository.

**Repository identity:** This contract applies to **`SRYProjects/Project-Experiment`**, the lightweight public Project Meaningful experiment. It does **not** apply to the separate complex **TMP App (The Meaningful Project app)** project. Do not use TMP App files, requirements, repository state, or conversation context as authority here unless the user explicitly requests a cross-project task. The former repository name `SRYProjects/Project-Meaningful` is obsolete.

1. Confirm you are operating in `SRYProjects/Project-Experiment`, not TMP App and not the obsolete `SRYProjects/Project-Meaningful` name.
2. Read `PRODUCT_SPEC.md` first. It is the authority for locked product decisions.
3. Read `PROJECT_STATE.md` second. It is the current implementation checkpoint.
4. Inspect the live repository and recent commits before changing code.
5. Treat the live code as implementation truth.
6. Never guess when project records conflict, are incomplete, or do not match the code. Surface the discrepancy and resolve only what is necessary.
7. Preserve already tested and locked behavior unless the task explicitly changes it.
8. Prefer small, testable, deployable increments over large speculative builds.
9. Do not overbuild beyond documented V1 scope.
10. Keep business/domain logic separate from UI code where practical.
11. Run available build/tests after meaningful code changes; where automated tests do not exist, document the required live/manual verification.
12. Use meaningful commit messages.
13. After substantial work, update `PROJECT_STATE.md` with what changed, testing status, known issues, and the exact next step.
14. Update `PRODUCT_SPEC.md` only when an actual product decision changes.
15. Do not use conversation memory as the sole authority when repository documentation or code is available.
16. Never expose or commit secrets. Public client keys may remain client-side only when intentionally public; service/secret keys remain server-side.
17. Database work: treat `supabase/schema.sql` as the verified baseline. Put every future schema/policy/function/trigger change in a dated file under `supabase/migrations/`; apply it deliberately to Supabase and update the baseline only after production is verified. Never make undocumented dashboard-only schema changes.
18. When handing code to the project owner manually, provide complete replacement files rather than snippets unless there is a compelling reason not to.

Keep this file focused on operating discipline. Product requirements belong in `PRODUCT_SPEC.md`; implementation status belongs in `PROJECT_STATE.md`.
