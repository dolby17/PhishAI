# Project log

30 October 2026: inspected the document-only workspace and original GitHub repository (`dolby17/PhishAI`, one initial README commit). Preserved all supplied planning/manuscript documents and existing history. User supplied author identity Veer Pratap Shekhar `<shekharveer17@gmail.com>` and authorized commit/push after working verification.

Implemented review-scope React UI, Express orchestration/accounts, Mongo-backed sessions, FastAPI rules/model service, shared contract and fixtures, offline dataset preparation/training/evaluation, startup configuration, and evidence documentation. Development used Codex assistance under the user's direction. Commit author attribution should not be described as independent proof that every line was manually written by the project owner.

Environment: CachyOS Linux x86-64, approximately 15 GiB available total RAM as reported by `free`, Node 26.12.1, npm 12.2.1, project Python 3.11.9. Docker/gh/mongod commands were absent. GPU was not inspected or used. Dependencies live in the workspace; no system-wide install was performed.

Dataset acquired from original publisher, verified SHA256 and labels. Extracted only lexical features. Frozen domain-grouped split, model/threshold selection, and separate final evaluation. Kept ML-only selection after hybrid fell below validation gain criterion. Reported substantial FPR rather than reusing presentation claims.

Verification encountered sandbox restrictions on ASGI socket-pair operations; a controlled rerun with local socket access demonstrated the cause. Scanner tests retain connection/DNS traps. See `verification.md` for actual final check outputs and remaining limitations.

After review: record supervisor feedback, accepted scope and final deadline; implement private minimized history/dashboard with owner checks and concrete retention/deletion; acquire a new untouched holdout for further model iteration; finish broader security/deployment and academic evidence.
