# Review acceptance register

Scope source: `PHISHAI_CODEX_PROJECT_PLAN.md`, 30 October 2026. Proposed ten requirements retain their original IDs and meanings. Supervisor weighting/denominator is not confirmed. The provisional equal-weight count below must not be described as institution-approved completion.

| ID | Requirement | Current implementation | Validation |
| --- | --- | --- | --- |
| R1 | Consistent bounded URL validation | Implemented and validated | Shared parsing fixtures, schema, boundary checks |
| R2 | URL-string analysis without destination access | Implemented and validated | Scanner socket/DNS traps; source call-site review |
| R3 | Deterministic rules and grounded reasons | Implemented and validated | Nine specified rules; fixture assertions |
| R4 | Reproducible trained model with versions | Implemented and validated | Dataset SHA256, offline PSL, frozen split/selection, served artifact |
| R5 | Compare branches and hybrid under one protocol | Partial | One historical-corpus comparison completed; broader evaluation, uncertainty, and new confirmatory holdout remain |
| R6 | Registration/login/logout/session lifecycle | Implemented and validated | Real Mongo session/security tests; actual HTTP login/logout; persisted-account restart check |
| R7 | Minimized owner-scoped saved history/detail | Implemented and validated | Real Mongo tests plus full-stack HTTP: privacy, two-user isolation, bounded pagination, detail access |
| R8 | Private summary and history deletion/retention | Implemented and validated | Owner-filtered counts, individual/bulk deletion, CSRF, 30-day TTL and immediate expiry filtering |
| R9 | Accessible results, scores/errors/unavailable states | Implemented and validated in focused checks | Real Firefox desktop/mobile walkthrough, keyboard/labels/focus, invalid input, reports/downloads; service checks cover missing/unavailable analysis; no formal WCAG audit |
| R10 | Reproducible documented startup and isolated services | Partial | Clean build and native restart rehearsed; Compose supplied but Docker/container boundaries unverified |

Implementation and validation are tracked separately. User expanded the urgent review build to include history, dashboard/retention and detailed reports. Production operations, external enrichment, extension and final academic packaging remain outside this build. Do not count a partial item as complete. Only the explicitly labeled provisional equal-weight count below is supported; institution-approved completion remains unconfirmed.

Validated backend/core requirements: **R1, R2, R3, R4, R6, R7, R8 = 7 of the original 10**. This supports a provisional **70%** at equal weighting; it is not a model-accuracy percentage or institutional approval. R9 now also has focused real-browser proof. **8/10 original requirements are implemented and validated (provisionally 80% at equal weighting), exceeding the requested 70% review target.** R5 and R10 remain partial. This is not institution-approved completion; requirement definitions and weights have not changed.
