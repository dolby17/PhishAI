# Decision log

| Date | Decision | Rationale / remaining approval |
| --- | --- | --- |
| 2026-10-30 | Follow urgent local review slice through scanner/model/accounts, then stabilize | User requested implementation from reviewed plan |
| 2026-10-30 | Node 24 container target, current local Node 26; Python 3.11 environment | Avoid GPU and incompatible system Python/pip setup |
| 2026-10-30 | Mendeley c2gw7fy2j4 V3, CC BY 4.0, lexical columns only | Original publisher provenance, usable raw URLs, modest memory needs |
| 2026-10-30 | Fixed parsing/rule versions and offline PSL/domain groups | Same features for training and inference, reduced domain leakage |
| 2026-10-30 | Primary selection macro-F1 with lower-FPR tie-break | Equal class importance default; operational trade-off needs supervisor agreement |
| 2026-10-30 | Keep ML-only deployment selected on validation | Hybrid improvement did not meet predeclared 0.005 gain |
| 2026-10-30 | No saved URL/history in urgent slice | Introduce ownership, retention, and deletion together after review |
| 2026-10-30 | Mongo-backed server sessions, explicit CSRF plus Origin | Complete browser session lifecycle and no localStorage tokens |
| 2026-10-30 | Native demo launcher alongside Compose | Docker not installed; real project-local MongoDB permits a runnable demo |
| 2026-10-30 | Preserve remote initial commit and author future changes as Veer Pratap Shekhar | Explicit user identity and remote supplied; commit only after checks |

Open: exact review time, final submission deadline, supervisor scope/weights, acceptable FP/FN trade-off, final manuscript format, future history retention, and public deployment decision. None blocks the local stateless review slice.
