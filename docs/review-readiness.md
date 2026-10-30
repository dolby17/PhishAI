# Tomorrow's review: working demonstration

Project owner: Veer Pratap Shekhar. Review date from the supplied plan: 31 October 2026.

## Demonstrated core

The original proposed acceptance register has ten requirements. R1, R2, R3, R4, R6, R7 and R8 have implemented code and focused test evidence: **7/10, provisionally 70% if equally weighted**. This is a requirement count, not code coverage, model accuracy, or supervisor approval. Focused real-browser checks also validate R9, bringing the total to **8/10 (provisionally 80%)**, above the requested 70% target. Requirement definitions and weights are unchanged.

Working features: bounded URL-only validation; no-destination-network lexical analysis; nine grounded rules; real reproducible trained Random Forest; registration/login/logout/expiry and CSRF; private minimized scan history/detail with pagination; owner-filtered dashboard; individual/bulk deletion and 30-day retention. The revised white/muted-blue interface adds detailed rule reasoning, local model score contributions, next steps, JSON export and a print layout.

Evidence: [verification](verification.md), [requirements](requirements.md), [historical results](results.md), [HTTP rehearsal](evidence/http-smoke.json), and browser evidence/screenshots when generated. Original training features, rules, model artifact and threshold remain frozen and unchanged.

## Rehearse in five minutes

1. Run `npm run demo` and open `http://127.0.0.1:3000`.
2. Create a demonstration account or sign in. No email is sent.
3. Use the synthetic **Several indicators** example. Explain that it is reserved-domain test input, not evidence of model performance.
4. Show model versus rule score, actual rule observations, model contribution directions, next steps and coverage limits. Download JSON; show that saved reports omit hostname and URL text.
5. Open **Your scans**, review dashboard counts, open a saved detail and show deletion confirmation. Do not delete any report you wish to retain.
6. Submit an unsupported scheme to show an error without a safety verdict. Sign out to demonstrate protected access.
7. Show the real historical comparison and its substantial false-positive rate. Present the acceptance count and pending work honestly.

## Remaining work

Confirm supervisor scope/weights and final deadline. Complete Docker startup/isolation proof, broader contemporary model evaluation with a new untouched holdout, public-deployment release controls, editable slides and updated manuscript/citations, and a genuine institution-approved similarity report. Browser results must state their actual tested viewports and scope; no formal accessibility/security audit is claimed.
