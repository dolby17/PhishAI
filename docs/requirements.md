# Review acceptance register

Scope source: `PHISHAI_CODEX_PROJECT_PLAN.md`, 30 October 2026. Proposed ten requirements retain their original IDs and meanings. Supervisor weighting/denominator is not confirmed; no 70% claim is made.

| ID | Requirement | Current implementation | Validation |
| --- | --- | --- | --- |
| R1 | Consistent bounded URL validation | Implemented | Shared parsing fixtures, schema, boundary checks |
| R2 | URL-string analysis without destination access | Implemented | Scanner socket/DNS traps; source call-site review |
| R3 | Deterministic rules and grounded reasons | Implemented | Nine specified rules; fixture assertions |
| R4 | Reproducible trained model with versions | Implemented | Dataset SHA256, offline PSL, frozen split/selection, served artifact |
| R5 | Compare branches and hybrid under one protocol | Partial | One historical-corpus comparison completed; broader evaluation, uncertainty, and new confirmatory holdout remain |
| R6 | Registration/login/logout/session lifecycle | Implemented | Real Mongo session/security tests; actual HTTP login/logout; persisted-account restart check |
| R7 | Minimized owner-scoped saved history/detail | Pending | No scan records are stored |
| R8 | Private summary and history deletion/retention | Pending | No dashboard/history exists |
| R9 | Accessible results, scores/errors/unavailable states | Implemented; browser validation pending | Typed UI, labels, live errors/loading, grounded branches; visual/accessibility walkthrough unavailable |
| R10 | Reproducible documented startup and isolated services | Partial | Clean build and native restart rehearsed; Compose supplied but Docker/container boundaries unverified |

Implementation and validation are tracked separately. Saved history, dashboard/retention, production operations, external enrichment, extension, and final academic packaging are outside this urgent review build. Do not count a partial item as complete or infer a percentage from this table.
