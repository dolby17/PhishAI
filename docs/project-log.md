# Project log

30 October 2026: inspected the document-only workspace and original GitHub repository (`dolby17/PhishAI`, one initial README commit). Preserved all supplied planning/manuscript documents and existing history. User supplied author identity Veer Pratap Shekhar `<shekharveer17@gmail.com>` and authorized commit/push after working verification.

Implemented review-scope React UI, Express orchestration/accounts, Mongo-backed sessions, FastAPI rules/model service, shared contract and fixtures, offline dataset preparation/training/evaluation, startup configuration, and evidence documentation. Development used Codex assistance under the user's direction. Commit author attribution should not be described as independent proof that every line was manually written by the project owner.

Environment: CachyOS Linux x86-64, approximately 15 GiB available total RAM as reported by `free`, Node 26.12.1, npm 12.2.1, project Python 3.11.9. Docker/gh/mongod commands were absent. GPU was not inspected or used. Dependencies live in the workspace; no system-wide install was performed.

Dataset acquired from original publisher, verified SHA256 and labels. Extracted only lexical features. Frozen domain-grouped split, model/threshold selection, and separate final evaluation. Kept ML-only selection after hybrid fell below validation gain criterion. Reported substantial FPR rather than reusing presentation claims.

Verification encountered sandbox restrictions on ASGI socket-pair operations; a controlled rerun with local socket access demonstrated the cause. Scanner tests retain connection/DNS traps. See `verification.md` for actual final check outputs and remaining limitations.

After review: record supervisor feedback, accepted scope and final deadline; implement private minimized history/dashboard with owner checks and concrete retention/deletion; acquire a new untouched holdout for further model iteration; finish broader security/deployment and academic evidence.


30 October 2026 — User requested completion to at least 70% for tomorrow, a simpler subtle UI and better functions. User selected white/muted blue and explicitly authorized local headless Firefox tests after the browser connector was unavailable. Added private minimized history, dashboard counts, owner-scoped deletion and 30-day retention, grounded detailed rule explanations, actual Random Forest path contributions, JSON download and print layout. Preserved the original model artifact, feature/rule/training code and decision threshold. Service checks: 37 Python and 16 Express/Mongo checks passed. Live HTTP proof covered real inference, explanation reconstruction, two-user isolation, pagination, privacy and deletion. Full restart preserved an account and saved report. A temporary automatic approval-review timeout on restart succeeded on its one allowed retry.

The proposed ten original requirements retain their meanings. Seven core/backend items now have working code and focused evidence. Browser evidence may validate R9 additionally; Docker and broader research remain separate. No institutional denominator approval, production readiness, or model-accuracy improvement is claimed.

Final browser proof: installed Firefox 159 with checksum-verified Mozilla geckodriver 0.37.1 passed 24 named checks at 1366×900 and 375×812. Captured and inspected five real screenshots. R9 now joins the seven validated core/backend requirements, giving 8/10 proposed requirements (80% only under the explicitly provisional equal-weight assumption). R5/R10 remain partial; institutional scope approval is pending. Unused large test bundles were abandoned; browser checks require no additional Node/Python package.

An independently created `output/research/` package appeared during this work. Its files were preserved, not reviewed, and not staged in the application implementation commit. Academic packaging status here refers only to the evidence inspected in this task.
