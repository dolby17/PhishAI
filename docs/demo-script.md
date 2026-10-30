# Five-minute review demonstration

1. **0:00–0:45 — Scope.** Explain URL-string screening and the no-fetch boundary. Show the architecture. State local demo status and that external intelligence is disabled.
2. **0:45–1:30 — Accounts.** Register a demonstration account, sign out, and sign back in. Explain server sessions, CSRF, and no saved URL history.
3. **1:30–2:30 — Functional scan.** Use `https://example.com/docs`, identified as a synthetic reserved-domain input. Show final score, separate rule/model branches, versions, and limitations. Try the synthetic multiple-signals example; explain that rule reasons are not model explanations.
4. **2:30–3:00 — Failure behavior.** Submit malformed text or an unsupported scheme. Show the validation error without a safety verdict. Explain model-unavailable rules-only mode from verification evidence; do not remove an artifact live unless rehearsed.
5. **3:00–4:15 — Research evidence.** Show the publisher/terms, grouped split sizes and zero domain overlap, validation-selection freeze, and final historical comparison. Report FPR and FNR as well as accuracy. Do not claim contemporary protection or calibrations.
6. **4:15–5:00 — Progress.** Show the requirement matrix and actual checks. State history/dashboard, broader evaluation, Docker rehearsal and final academic deliverables that remain. Ask supervisor to confirm scope/weights and final deadline after the demo.

Rehearse from `npm run demo` after `npm run build`. Keep a local copy of generated evidence and actual screenshots if available. Do not substitute mocked screens for missing features or label this 70% without agreed scope. Preserve original manuscript claims as draft until independently checked.
