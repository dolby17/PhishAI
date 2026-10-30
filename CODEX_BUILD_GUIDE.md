# PhishAi — Codex Build Guide

## AI-powered phishing and scam detection project

**Purpose:** Give Codex a practical, staged specification for building PhishAi as a production-oriented final-year major project and resume portfolio product. Target professional engineering and secure deployment practices, while tying the actual release status to evidence and review.

**Project rule:** Build a small, reproducible system whose behavior can be explained and evaluated. Never invent dataset results, model metrics, literature findings, patent novelty, or security audit claims.

---

## 1. Product definition

PhishAi is URL-first: a user submits a suspicious website URL through the web application and receives a phishing-risk verdict, a score with defined semantics, and reasons linked to model features or security indicators. Signed-in users can review their own scan history and dashboard summary. The project aims for production-oriented code quality, security, reproducibility, and maintainability so it can serve as a strong portfolio project. Pasted email/message classification is a possible later extension; the presentation's primary detection workflow is website URL analysis.

The product helps users inspect suspicious links. A low-risk result means only that PhishAi did not find strong risk signals. It does not prove that a destination is safe.

### Project objectives

1. Build a working web application with a React frontend, Express API, MongoDB persistence, and an internal Python inference service.
2. Analyze submitted URL strings without opening destinations, rendering pages, or executing submitted content.
3. Establish transparent local-rule and URL-feature machine-learning baselines.
4. Return understandable reasons and make uncertainty and unavailable evidence visible.
5. Evaluate the system using documented, leakage-aware data splits and report measured results only.
6. Produce reproducible engineering and research artifacts: setup instructions, architecture, threat model, dataset manifest, model card, evaluation report, paper outline, and prior-art search log.

### Research questions to validate

- How do a simple URL baseline, URL-feature ML, and their hybrid perform under the same documented evaluation protocol?
- Does adding approved cybersecurity-intelligence evidence improve the measured result over ML-only and rule-only baselines?
- What are the false-positive/false-negative trade-offs and response latency when the included analysis layers are enabled?
- Do displayed explanations correspond to actual rules or model inputs? Do not claim that explanations improve user decisions without an appropriate user study.

These are hypotheses and questions, not claimed findings.

---

## 2. Scope and sequencing

### Required MVP

- URL-only lexical/structural analysis and deterministic rule indicators. Do not visit the destination in the MVP.
- Reproducible URL-feature model comparisons: start with a transparent simple baseline and Random Forest; evaluate XGBoost if the chosen dataset and compute permit it. A deep neural network is an optional experiment, not a requirement. Do not select or call an ensemble “best” until the held-out evaluation supports that result.
- A distinct cybersecurity-intelligence path in the design. Start with local, deterministic rules. Add WHOIS/domain age, SSL/TLS certificate, and reputation-feed adapters only after separate privacy, SSRF, provider-terms, cost, timeout, and operational review. Keep these adapters off or marked unavailable when not configured.
- A transparent weighted decision/fusion layer only after weights and thresholds are tuned on validation data and assessed against ML-only and rules/intelligence-only baselines.
- Versioned Express-to-FastAPI request/response contract.
- Scan result view with label, score semantics, grounded reasons, and limitations.
- MongoDB scan history, owner-scoped access, and a basic dashboard. Store the minimum data required; do not retain raw content by default.
- Docker Compose for local development, `.env.example`, setup guide, focused tests, and research/evaluation documentation.

### Defer until the MVP works

- Direct TLS/domain lookups, live WHOIS/domain-age checks, threat-intelligence feeds, and any external reputation service. Add only with an explicit requirement, permitted provider terms, privacy/SSRF review, cost/latency budget, and a documented unavailable/failure mode.
- Browser extension, standalone API access, SOAR integration, pasted-message classification, page/DOM inspection, and automated URL fetching. Treat these as later product extensions; the MVP is a URL scanning web application.

### Out of scope for the student MVP

- Visiting, resolving, redirecting through, downloading from, or executing a user-submitted URL.
- Crawling or taking screenshots of suspicious pages; inspecting page DOM, redirects, forms, or content; parsing arbitrary email attachments.
- Training a large transformer from scratch.
- Claims of guaranteed protection, flawless security, zero-day detection, or universal accuracy.

### Production-readiness objective

Design toward a deployable, maintainable application, but separate that goal from verified release status. A passing checklist cannot prove software has no vulnerabilities. Do not call PhishAi production-ready or flaw-free until the release gate below is met for a specified deployment environment, and always state residual risks. Keep the first deployment controlled and appropriately scoped; public production use also needs an accountable maintainer, monitoring, backup/restore, patching, incident response, privacy review, and operational support. If those are not in place, label the deployment development, demo, or staging.

### Alignment with the supplied presentation

Treat the PowerPoint as a description of the intended product and research direction. It does not prove that the features, metrics, or integrations have been implemented or independently validated. Keep a claims register with status (`proposed`, `implemented`, `measured`, `verified source`, or `omit`) and attach evidence before using any claim in a report or demo.

| Presentation item | How Codex should handle it |
|---|---|
| URL-first hybrid detection: ML path + cybersecurity-intelligence/rules path + weighted decision + explanation | Use as the target architecture. Implement the lexical/rule and ML paths first; enable fusion only after validation and ablation. |
| Random Forest, XGBoost, deep neural networks; “best-performing ensemble” | Compare feasible URL-feature models. RF is a reasonable first model; XGBoost and a DNN are optional based on permitted data and compute. Do not claim an ensemble is best or deploy it before actual evaluation. |
| SSL/TLS checks, WHOIS/domain age, threat feeds, and 50+ rules | Treat as specified or planned components, not completed facts. Use documented, tested rules; do not pad a rule count. Keep live lookups off until privacy, provider terms, SSRF controls, cost, and latency are reviewed. |
| Browser extension, API, and SOAR integration | Web application is MVP. List other integrations as future work unless actually implemented and evaluated. |
| `96%` accuracy, `4%` false-positive rate, and about `3 s` response time | The slides label these as reported but unverified and omit the dataset/split/model details and timing procedure. Do not present them as PhishAi results unless reproducible evidence validates them. |
| “Millions” of training signals and `91%`, `1.4M`, `$10B` threat-context figures | Do not repeat without an identified dataset or verified, appropriately scoped sources. The slides do not provide enough provenance for these statements. |
| Literature citations `[1]–[13]` in the slides | Treat as candidate references only. Verify each bibliographic record and inspect the source before citing it or repeating its reported result. The cited metrics use different datasets/protocols and are not direct comparisons. |

The paper scaffold has a place to record the final implemented architecture and actual validation. Keep unverified slide figures out of the results section.

---

## 3. System architecture

```text
Browser: React + Vite
        | HTTPS/JSON; authenticated session
        v
Public application API: Node.js + Express
        |-- MongoDB: users, minimal scan results, version metadata
        `-- Internal API: Python + FastAPI inference service
             (reachable only inside the local Compose network)
                  |-- URL feature model (RF; compare XGBoost if feasible)
                  |-- local cybersecurity rules
                  |-- optional, policy-reviewed intelligence adapters
                  `-- separate outputs + validated risk fusion/explanation
```

The browser talks only to Express. It must not access MongoDB or FastAPI directly. Express owns authentication, authorization, request validation, rate limits, persistence, and the public API contract. FastAPI coordinates the URL-feature model, local rules, optional approved enrichment, and validated fusion. MongoDB stores the minimum record needed for history and evaluation provenance. The presentation's two analysis paths should remain logically distinct so the team can compare ML-only, rules/intelligence-only, and hybrid results.

Use one repository with clear service boundaries:

```text
client/                 React + Vite application
server/                 Express API
  src/routes/
  src/controllers/
  src/services/
  src/models/
  src/middleware/
ai-service/              FastAPI application and ML code
  app/api/
  app/features/
  app/models/
  training/
shared/                  Optional shared schemas or documented contract
docs/                    Architecture, threat model, research log, model card
data/                    Local datasets; ignored by version control by default
docker-compose.yml
.env.example
README.md
```

Codex should first inspect the existing repository and adapt this layout instead of overwriting working code. Keep dependencies and infrastructure minimal; add a library only when it solves a specific requirement.

---

## 4. End-to-end scan flow

1. The user submits one bounded URL string through the web application. Browser extension and SOAR/API integrations are later extensions.
2. React sends a typed JSON request to Express. Client-side checks improve usability but are not a security boundary.
3. Express applies body and field size limits, validates URL schema, authenticates the user when accounts are enabled, rate-limits the request, and creates a request ID.
4. Express sends a narrow, versioned request to FastAPI with a short timeout. It never fetches the URL.
5. FastAPI parses the URL without contacting its destination, then runs URL-feature inference and local rules. Separately, it may call only explicitly approved reputation/domain adapters that are disabled by default. No direct TLS handshake, DNS lookup, redirect, or page fetch is permitted in the MVP.
6. FastAPI keeps model and rule outputs separate, applies the documented fusion policy only when its inputs are available, and returns each branch and final result with source/version/status metadata. Express validates the response, stores a minimized record, and returns an explicit response DTO.
7. React displays the result and says that a low-risk result is not proof of safety. The result also shows unavailable evidence rather than treating it as clean.
8. History and dashboard queries always filter by the authenticated owner.

### Failure behavior

- Malformed or oversized input: reject with a stable validation error before analysis.
- FastAPI timeout or missing model artifact: report temporary/unavailable analysis, or a clearly labelled rules-only result if that fallback was deliberately implemented. Never silently return safe.
- Optional reputation/domain intelligence unavailable: show `unknown`/`unavailable`; exclude missing evidence from fusion. Never interpret lookup failure as clean.
- Conflicting evidence: use a documented review/suspicious outcome rather than false certainty.
- Retries: use a request ID or idempotency behavior to avoid accidental duplicate records.

---

## 5. Analysis and machine-learning plan

### URL analysis

Parse and inspect the submitted string only. Candidate features include total URL and hostname length, dots/subdomain count, IP-literal use, userinfo, hyphens/digits, unusual delimiters, path/query lengths, punycode marker, scheme, and documented keyword indicators. Treat all features as weak indicators. HTTPS does not establish trust; TLD alone must never determine a verdict. Do not perform DNS or network lookups in the MVP.

### Baselines and fusion

1. Implement a documented local URL-rule baseline with stable reason codes and checks for each rule. Do not target “50+ rules” by adding weak or untested indicators; report the actual reviewed rule count.
2. Train an offline URL-feature baseline on a documented, permitted dataset. Compare a simple baseline with Random Forest. Evaluate XGBoost if compute, dependencies, and data allow. A DNN is optional and should be justified by data size and a meaningful comparison.
3. Keep the model path and cybersecurity-intelligence/rules path separate in the response and evaluation. Start external enrichment disabled. Add adapters for SSL/TLS/domain-age/reputation only after provider terms, consent/privacy, SSRF, cost, and latency review; external absence is `unknown`.
4. Compare ML-only, local rules/intelligence-only, and hybrid fusion using an ablation study on the same held-out examples. Tune fusion weights and thresholds on validation data only, then freeze them before test evaluation.
5. Keep model score, heuristic score, external reputation, and final risk score distinct. Use “probability” or “confidence” only when its meaning and calibration are defined; otherwise call it a decision/risk score.
6. Measure response latency on named hardware and report p50/p95 (and lookups included or excluded). The deck's approximately 3-second figure is a target/claim to validate, not a guaranteed response time.

Text/email/message classification, webpage/DOM inspection, and browser extensions can be future extensions after the URL-first product is validated. Do not include these in the evaluation scope unless implemented and separately evidenced.

### Data discipline

- Record dataset source, version/date, license or terms, label meaning/mapping, preprocessing, exclusions, and sample counts.
- Deduplicate exact and near-duplicate samples before splitting. Group by domain, campaign, or source when feasible; use a chronological holdout when timestamps are trustworthy.
- Keep the final test partition untouched during model and threshold selection.
- Check class imbalance, language, missingness, source artifacts, and leakage.
- Keep raw datasets out of Git unless redistribution is explicitly allowed. Never gather training examples by unsafe browsing from the application.

### Score and explanation contract

Every response must identify `scoreType` (for example `heuristic`, `decision_score`, or calibrated probability), model/rule version, and evidence availability. Each reason must map to a computed feature or applied rule. Do not invent post-hoc explanations or imply causation from feature attribution.

---

## 6. API and persistence design

All public application routes are under `/api/v1`. Document validation, auth requirements, response shapes, and error codes. Never return database documents wholesale.

### Suggested public routes

| Route | Purpose | Access and constraints |
|---|---|---|
| `POST /api/v1/auth/register` | Create an account | Rate limited; validate; hash password; avoid leaking account status |
| `POST /api/v1/auth/login` | Start a session | Rate limited; generic errors; documented session strategy |
| `POST /api/v1/scans` | Submit URL for analysis | Authenticated; bounded body; URL validation; per-user limits |
| `GET /api/v1/scans` | List scan history | Authenticated; paginated; owner filter is mandatory |
| `GET /api/v1/scans/:id` | Read a scan | Authenticated; verify ownership |
| `GET /api/v1/dashboard/summary` | Aggregate the user's scans | Authenticated; owner-scoped aggregation |
| `GET /health` | Liveness/readiness | Minimal operational status; no secrets or internal details |

### Internal inference contract

`POST /internal/v1/analyze` receives a schema version, bounded URL input, and request ID. Its response keeps the ML output, local rule/intelligence output, any external evidence status, and final fused result distinct. Include model/rule/feature versions, score type, reason codes, and source timestamps/status for optional enrichment. Validate the response in Express as well as the request in FastAPI. The AI service is internal-only in Compose and has explicit connection timeouts.

### Suggested MongoDB collections

- `users`: normalized email, password hash, role/status, creation time. Unique index on normalized email. Never log credentials.
- `scans`: owner ID, type, timestamp, status, label, score and score type, reason codes, model/rule versions, evidence status, retention timestamp, and optionally a redacted input or keyed hash. Avoid raw submitted content by default.
- `modelRuns` (optional): model version, dataset manifest hash, training date, artifact digest, and measured evaluation summary. Never store fabricated metrics.

### Authentication and API hygiene

Prefer a server-managed `Secure`, `HttpOnly`, `SameSite` session cookie for a browser-only application when feasible. If JWT is required by the approved course design, document expiry, storage, refresh, and revocation behavior; do not store long-lived tokens in local storage. Use maintained password hashing, security headers, CORS allowlisting, consistent error DTOs, pagination limits, and structured logs that omit raw content, secrets, passwords, and tokens.

### Production-oriented security engineering

Treat security as a design and release requirement, not a final cosmetic pass. Maintain a threat model and security requirements; use supported runtime versions and reviewed dependencies; add automated formatting, linting, type/schema checks, focused tests, dependency and secret scanning, and container/image checks where tooling permits. Review authentication, authorization, session/CSRF behavior, injection, XSS, CORS, rate limits, request limits, error disclosure, the SSRF boundary, secrets, logging, data retention, and service-to-service access. Run containers with least privilege and keep databases and the model service off the public network. Use TLS for deployed traffic, secure deployment secrets, least-privilege database access, backups with restore checks, privacy-aware security monitoring, and a documented update/incident process. Record findings and remediation evidence; a scan with no findings is not proof that no flaws exist.

### Release gate for a production-readiness claim

Before describing a specific release as production-ready, document its target environment and threat model; complete code review and focused security review; resolve or explicitly accept security findings; run functional, integration, authorization, abuse/input-boundary, and failure-mode checks; verify backups/restores and monitoring; review deployment configuration and secret handling; and assign ongoing ownership for patching and incident response. Obtain independent security review before exposing sensitive or high-risk deployment surfaces where feasible. Report the scope/date of each review and residual risks. Never promise a flaw-free application.

---

## 7. Security and privacy requirements

These requirements apply to every milestone:

- Treat URLs, text, model output, and threat-feed fields as untrusted input.
- In the MVP, do not visit, resolve, redirect through, download from, or render submitted destinations. Parsing a URL string does not require network access.
- Escape all user-controlled output and never inject submitted URLs, provider responses, or explanations into the DOM as trusted markup.
- Apply request and field size limits in each service boundary; validate type and schema; rate-limit public endpoints.
- Keep secrets in environment configuration, provide `.env.example` with placeholders only, and exclude local secrets/data/artifacts as appropriate.
- Do not log submitted content, credentials, tokens, or secrets. Minimize persistence and document retention/deletion behavior.
- Do not send raw private content to external services unless the user has explicitly consented, the purpose and terms permit it, and the integration has been reviewed.
- Treat missing or stale threat intelligence as unknown, not benign.
- Use least-privilege database credentials and internal service networking.
- If controlled URL fetching is ever proposed, stop before implementing it and present a separate design for isolated egress-restricted workers, IP range blocking, DNS rebinding, redirects, byte/time limits, and connection-time validation. It is outside this MVP.

---

## 8. Build milestones and definition of done

Work one milestone at a time. Do not generate the whole application in one pass.

| Phase | Deliverable | Definition of done |
|---|---|---|
| 0. Inspect and scope | Repository assessment, requirements, architecture and threat model | Existing instructions/code reviewed; MVP decisions and data plan recorded; file-level plan approved before broad edits |
| 1. Service skeleton | React, Express, FastAPI, Compose, config examples | Services start locally; health checks work; no secrets committed; API boundaries documented |
| 2. URL vertical slice | URL form, Express validation, lexical rules, result view | Valid/invalid inputs behave clearly; deterministic reasons shown; no submitted URL network activity |
| 3. URL dataset and model baseline | Dataset manifest and reproducible URL-feature training/evaluation script | Permitted data and label map documented; duplicate/leakage checks recorded; baseline and feasible RF/XGBoost comparisons reproducible |
| 4. Inference and fusion integration | Versioned FastAPI contract, separate analysis branches, validated fusion, Express orchestration | Contract validated end-to-end; branch outputs remain inspectable; model/provider failure is visible; fusion is evaluated and score semantics are explicit |
| 5. Accounts and persistence | Auth, MongoDB schemas, scan history | Password handling documented; ownership tests pass; only minimal fields stored |
| 6. Dashboard and UX | Accessible URL scan form, results, history and summary | Loading/error states work; result disclaimer is visible; untrusted content is escaped |
| 7. Security and evaluation | Threat-model checks, code/dependency review, model evaluation, error review | Findings, checks actually run, measured results, and residual limitations are recorded; no unsupported claims |
| 8. Deployment and portfolio readiness | Deployment configuration, operational notes, release gate, portfolio README/demo, evidence-based resume summary | Release status is accurately labelled (development/demo/staging/production); checks and residual risks match the target environment; resume claims match implemented and measured work |
| 9. Research package and demo | Model card, diagrams, separate paper draft, prior-art log, presentation, demo script | Claims are sourced, implemented, or measured; unknowns are marked; presentation evidence matches the build |
| 10. Final assessment package | Progress evidence, results discussion, finance/resources/scalability, ethics/sustainability, submission readiness | All seven assessment areas below have named artifacts and verifiable evidence; no invented costs, metrics, similarity scores, or novelty claims |

Codex should keep each phase reviewable: small focused changes, current docs, and a summary of files changed, checks actually run, observed outcomes, limitations, and next smallest step.

### Final assessment alignment

Use the following seven areas as the project acceptance and reporting checklist. Maintain a traceability table in `docs/assessment-evidence.md` linking each requirement to implementation, evidence, owner, and status. Mark work `planned`, `in progress`, `implemented`, or `validated`; do not mark it validated until the relevant evidence exists.

1. **Implementation (minimum 70%).** Agree with the supervisor on the denominator: the approved, in-scope functional requirements in the requirements list. Track each requirement and demonstrate that at least 70% of that agreed scope is implemented. This is a feature-completion target, not code coverage or a claim that 70% of code is finished. Identify deferred requirements and why. Evidence: traceability matrix, working end-to-end demo, source repository, run instructions, and checks actually completed.
2. **Results analysis, discussion, and validation.** Show functional and security validation for implemented features, plus ML results from documented held-out URL data. Include split method, class counts, confusion matrix, per-class precision/recall/F1, macro-F1, suitable PR-AUC, FPR, false-negative rate, error examples, latency method, score meaning, limitations, and ML-only/rules-only/hybrid ablation where supported. Separate measured results from interpretation; no fabricated numbers. Evidence: reproducible evaluation outputs, test/check logs, error analysis, and results discussion.
3. **Presentation.** Prepare a concise slide deck, architecture/data-flow diagrams, and a timed demo. Explain the problem, technical approach, live working features, measured results, limitations, and contribution. Demonstrate with harmless synthetic inputs or permitted examples; never open a live malicious link. Evidence: editable slides, demo script, screenshots from the implemented system, and anticipated questions.
4. **Project management, cost/resource optimization, finance, and scalability.** Keep a milestone schedule, task/role log, risks, and change history. Inventory hardware, software, datasets, APIs, storage, and labor assumptions. Record actual spend and cite dated prices for any estimates; label projections and assumptions. Prefer free/local development, modest classical models, reusable permitted artifacts, and bounded compute. Discuss what must change to support more users (service capacity, database indexes, retention, monitoring, and model updates); distinguish tested scale from a proposed scale plan. Evidence: project plan, resource/cost table, optimization choices, and scalability note.
5. **Ethical, environmental, sustainability, and safety considerations.** Address data consent, dataset licenses, privacy/minimization, bias/language coverage, accessible risk wording, human review, retention/deletion, and misuse. Explain the no-fetch URL design and SSRF boundary. Prefer energy-efficient classical models and reusable/open tools where suitable; report actual compute or environmental measurements only if collected. Include safe demo practices and responsible disclosure. Evidence: ethics and safety checklist, dataset manifest, threat model, and sustainability paragraph.
6. **Research paper draft, quality, and plagiarism report.** Maintain the separate editable `PHISHAI_RESEARCH_PAPER_DRAFT.md`. Use verified citations and actual implementation/evaluation evidence. Run spelling, formatting, citation, and consistency reviews. Obtain any similarity/plagiarism report through an institution-approved service and attach its genuine output or record its status, date, and tool. Never invent a score, call similarity percentage proof of plagiarism/originality, or rewrite text to evade detection. Follow supervisor/institution rules for AI assistance and disclosure. Evidence: revised draft, reference checks, review checklist, and genuine report when available.
7. **Research paper or patent submission readiness and technical communication.** Choose the route with the supervisor. For a paper, verify venue scope, author approval, ethics, data/code permissions, references, formatting, and all claims before submission. For a possible patent, document a prior-art search and consult the university technology-transfer office or qualified professional about inventorship, disclosure timing, and jurisdiction; do not publicly disclose a potentially protectable detail before that review. Submission readiness is not acceptance or patentability. Communicate the work through clear diagrams, a concise abstract, a reproducible demo, and answers that distinguish what was built, measured, and hypothesized.

The technical approach is “finalized and validated” only after the chosen architecture, data, threat boundaries, model contract, and evaluation protocol are documented and the implementation evidence supports them. Until then, describe them as the current proposed/approved approach and keep deviations visible.

### Cross-cutting engineering goals

8. **Production-oriented, resume-ready product.** Build toward maintainable, deployable quality: documented setup and architecture, clear ownership, reproducible training/evaluation, secure configuration, useful demo, version control, and truthful portfolio evidence. Describe PhishAi as production-ready only if the release gate is met for the stated environment. A portfolio entry should list implemented features and measured outcomes only.
9. **Reproducible, explainable project.** Preserve the data manifest, feature/model/rule versions, training instructions, evaluation protocol, actual results, limitations, and change history so another reviewer can reproduce the behavior. Keep explanations tied to real rules or model inputs.
10. **Cybersecurity validation without false guarantees.** Make the web application difficult to misuse by implementing layered controls, threat modeling, focused security verification, code/dependency review, least privilege, and release management. No development process can guarantee there are no flaws. Never write “unhackable,” “100% secure,” or equivalent; state review scope and residual risks.

---

## 9. Verification and evaluation plan

### Software verification

- Unit checks: URL parsing, malformed values, Unicode/punycode, feature extraction, rule reasons, thresholds, and input limits.
- API checks: schema validation, authentication failures, ownership checks, pagination, rate limits, and body limits.
- Integration checks: Express-to-FastAPI contract, persistence, timeout behavior, missing-model behavior, and degraded responses.
- Security checks: no URL fetching in MVP, escaped output, no raw content/secrets in logs, CORS, session/token behavior, retention, and dependency review.
- UI checks: keyboard use, labels, clear validation/loading errors, responsive layout, and truthful risk wording.

Run focused checks for implemented behavior when the user or project instructions request verification. State exactly which commands were run and their actual outcomes. Never imply a check passed if it was not run.

### ML evaluation

Record the dataset version, source, class counts, label mapping, preprocessing, deduplication, split method, grouping/date boundaries, seed, model, and threshold. Report confusion matrix, per-class precision/recall/F1, macro-F1, and PR-AUC where appropriate. Accuracy alone is inadequate under class imbalance. If probabilities are displayed, check calibration and state the population to which they apply.

Discuss false negatives, false positives, distribution shift, dataset bias, source leakage, label ambiguity, and operational limits. Do not compare numbers across incompatible datasets as if they were a fair head-to-head result.

---

## 10. Research paper and patent guidance

### Paper outline

1. Introduction: bounded problem, motivation, research questions, and contributions supported by the work.
2. Related work: thematic comparison of verified papers, methods, datasets, and limits.
3. System design: components, data flow, threat model, and safe handling.
4. Methodology: provenance, label mapping, preprocessing, features, baselines, splits, metrics, and reproducibility.
5. Results: actual measured results, class counts, uncertainty where feasible, and error analysis.
6. Discussion: interpretation, generalization, privacy and security tradeoffs, and limitations.
7. Conclusion and future work: what the evidence supports and what remains untested.
8. References and appendices: verified sources, dataset details, parameters, and supplemental results.
9. Research Paper must be around 20-25 pages, Properly aligned with international standard which follows in research.

### Originality and patent

AI phishing detection and generic combinations of known components are not automatically novel or patentable. Search patent and non-patent literature, record databases, queries, dates, document families, and relevant claims, and have a qualified university or patent professional review any filing decision. Check disclosure timing before public demos or publication if protection is being considered. Do not claim “first,” “unique,” or patentable based only on a project idea. Distinguish concrete engineering work from demonstrated research findings.

---

## 11. Copy-paste master prompt

```text
You are my senior full-stack, cybersecurity, and applied machine-learning engineering partner. Help me build PhishAi, a production-oriented final-year major project and resume portfolio product, in the current repository.

GOAL
Build PhishAi as a reproducible, production-oriented, URL-first phishing detection application. Analyze submitted URL strings with a URL-feature ML path and a distinct cybersecurity rules/intelligence path, then return a risk verdict with grounded reasons and score semantics. Aim for professional deployment, maintainability, and security so the project is credible in a resume. A low-risk result is not proof of safety. Do not claim that the software is flawless, unhackable, or production-ready until the release gate is met for a specified environment; document residual risks. Deliver evidence for all seven assessment areas and three cross-cutting goals in the guide, including the agreed 70% feature-completion target, technical-approach validation, results analysis, presentation, project/resource/finance/scalability analysis, ethics/sustainability/safety, a separate editable research paper draft with genuine similarity-report status, and paper-or-patent readiness.

PREFERRED STACK
- Frontend: React + Vite.
- Public API: Node.js + Express.
- Database: MongoDB + Mongoose.
- Internal inference API: Python + FastAPI + scikit-learn + joblib.
- Local orchestration: Docker Compose. Add Nginx or other services only when justified.
- Keep the browser connected only to Express; keep FastAPI internal.

MVP
- URL-first web application with URL-string analysis. Never fetch, resolve, redirect through, download, render, or execute submitted destinations in the MVP.
- Transparent local URL rules plus a reproducible URL-feature model. Start with a simple baseline and Random Forest; compare XGBoost if feasible; use DNN only as a justified optional experiment.
- Keep ML and cybersecurity evidence paths separate, then evaluate a documented weighted fusion using ML-only/rules-only/hybrid ablation.
- Keep SSL/TLS, WHOIS/domain-age, and reputation feeds disabled until separately reviewed for provider terms, privacy, SSRF, cost, timeout, and operations. Missing inputs are unknown, never clean.
- Versioned Express/FastAPI contract, visible timeout/error behavior, grounded reasons, scan history, owner-scoped access, and basic dashboard. Browser extensions, SOAR, page/DOM analysis, and text scans are future extensions.
- Document data provenance, label mapping, split method, metrics, latency protocol, score semantics, model/rule versions, and limitations.

SECURITY AND PRIVACY
- Treat all input and returned explanations as untrusted. Apply strict request/field size limits, schema validation, rate limiting, security headers, output escaping, and safe error handling.
- Do not make network requests to user-submitted URLs in the MVP.
- Do not send private input to an external reputation or AI service unless I explicitly configure it after reviewing terms, privacy, credentials, and timeouts. Missing intelligence is unknown, never clean.
- Store the minimum data required; avoid raw content by default; document retention and deletion.
- Never commit secrets, private messages, or datasets without redistribution rights.
- If URL fetching is proposed, stop and explain the SSRF, DNS-rebinding, redirect, IP filtering, and isolation requirements. Do not implement fetching as part of the MVP.
- Treat direct TLS/domain probing as network access to an untrusted destination; do not add it without an isolated, reviewed design. External threat-intelligence lookups can disclose submitted URLs, so require explicit product/privacy review and approved provider terms.

ML AND RESEARCH INTEGRITY
- Use a documented permitted URL dataset, stable label mapping, deduplication, and grouped/time-aware splits where feasible. Keep a held-out test set.
- Compare model families and baselines actually implemented (for example simple baseline, Random Forest, optional XGBoost/DNN); do not claim a “best ensemble” before measured comparison.
- Run an ablation of ML-only, rules/intelligence-only, and hybrid paths on the same eligible test samples. Evaluate accuracy, precision, recall, F1, FPR, false negatives, and latency; report unavailable evidence and exclusions.
- Tune thresholds only on training/validation data. If an output is not calibrated, call it a decision score, not a probability.
- Report actual class counts, confusion matrix, per-class precision/recall/F1, macro-F1, suitable PR-AUC, and measured latency. The deck's 96% accuracy, 4% FPR, and ~3-second figures are unverified until backed by raw evaluation evidence. Do not fabricate metrics, references, prior-art findings, or user-study results.
- Treat originality as a hypothesis until a literature and prior-art review supports a carefully bounded claim. Do not claim “first,” “zero-day,” or patentability without evidence and qualified review. Make any production-readiness statement only after the documented release gate is met for the named environment.
- Keep an assessment-evidence matrix for the seven criteria in the guide. Do not claim 70% implementation until the approved scope denominator and implemented requirements are recorded. Do not invent costs, scaling results, environmental measurements, or plagiarism/similarity scores.
- Maintain `PHISHAI_RESEARCH_PAPER_DRAFT.md` as a separate editable manuscript scaffold. Keep placeholders for unknown results and citations. Do not submit a paper or patent application; prepare a readiness checklist for supervisor review.
- Treat “production-ready” as a release-gated status, not an aspiration or marketing phrase. Apply the production-oriented security practices and release gate in the guide. Record actual findings and residual risks; never promise zero vulnerabilities or claim the system cannot be hacked.

ENGINEERING WORKFLOW
- First inspect repository files, existing instructions, code, and available tooling. Do not overwrite files blindly.
- Before substantial changes, report current state, missing decisions, risks, a short milestone plan, and exact files likely to change. Begin with the smallest vertical slice.
- Implement one milestone at a time. Keep modules focused, contracts explicit, errors consistent, configuration in environment variables, and dependencies minimal.
- For each milestone, add or update focused checks when appropriate, run only the checks you can actually run, and report their real outcomes. Do not say tests passed unless they were run.
- Keep README, `.env.example`, architecture, API contract, threat model, data manifest, and model card current as behavior changes.
- After a milestone, summarize changed files, checks run and results, limitations, and the next smallest step. Ask before adding paid external services or expanding scope materially.

START NOW
Inspect the repository and all applicable project instructions. Do not generate the entire application in one response. Return: (1) current state, (2) risks and unresolved decisions, (3) a milestone plan, and (4) the smallest first implementation slice. Confirm that submitted URLs will not be fetched.
```

---

## 12. Incremental prompts for Codex

Use one prompt at a time after reviewing the previous milestone.

### Prompt 1 — Repository inspection and plan

```text
Inspect the repository, applicable instructions, existing code, and run setup. Summarize the current stack and entry points, gaps, risks, and unresolved decisions. Propose a small milestone plan with files likely to change. Do not edit files yet. Confirm that submitted URLs will not be fetched in the MVP.
```

### Prompt 2 — Service skeleton

```text
Implement only the agreed service skeleton for the client, Express API, FastAPI service, and Docker Compose. Add health endpoints, `.env.example`, ignore rules for secrets/local datasets, and concise local startup documentation. Keep the AI service internal. Do not implement scans yet. Add focused checks for health and service boundaries and report only checks actually run.
```

### Prompt 3 — URL rules vertical slice

```text
Implement URL input validation and lexical feature extraction without DNS or HTTP. Return deterministic reason codes and a clearly labelled heuristic result. Connect the smallest frontend form to Express and display the result. Cover malformed input, IP literals, Unicode/punycode, schemes, and excessive length. Inspect the code path to verify the submitted URL is never fetched; do not add network behavior.
```

### Prompt 4 — URL dataset and model baselines

```text
Add a training/evaluation pipeline for a documented phishing/legitimate URL dataset that we are permitted to use. Add a manifest format, explicit label mapping, deduplication, and a grouped or temporal split where feasible. Compare a simple baseline and Random Forest; evaluate XGBoost if feasible. Treat a DNN as optional and justify it with data size and compute. Keep raw data out of version control unless redistribution is permitted. Do not claim the presentation's “millions” of samples unless the chosen dataset proves that scale. Do not invent data or metrics. Report the actual split, model configurations, and limitations.
```

### Prompt 5 — FastAPI inference contract

```text
Implement the versioned Pydantic request/response for the internal AI service. Load the selected URL-feature model once at startup; expose health and model-info endpoints; compute the separately reported model output and local rule output; return model/rule/feature versions, score types, evidence status, and reason codes grounded in actual features. Keep any external enrichment adapter disabled and unconfigured until its separate privacy, SSRF, terms, cost, and timeout review is approved. Handle invalid requests and missing artifacts explicitly. Add contract checks and document the schema.
```

### Prompt 6 — Express orchestration

```text
Implement `POST /api/v1/scans` for URL input with schema and size validation, request ID, rate limit, FastAPI timeout, response validation, and explicit unavailable behavior. Have FastAPI apply its documented weighted fusion policy only after weights/thresholds are tuned on validation data. Preserve model-only, rules/intelligence-only, and fused outputs for evaluation. Express persists only minimal scan metadata. Never silently map an error or missing threat intelligence to safe. Add focused route and integration checks.
```

### Prompt 7 — Authentication and history

```text
Add account creation/login using a maintained password hashing library and a clearly documented session strategy. Implement paginated owner-scoped scan history and dashboard summaries. Add authorization checks proving one user cannot read another user's scans. Do not log secrets or submitted content. Document retention/deletion behavior.
```

### Prompt 8 — Results and dashboard UI

```text
Build the accessible URL scan form, loading/error states, result view with clear score semantics and grounded reasons, scan history, and basic dashboard. Mark optional reputation/domain evidence as unknown when unavailable. State that a low-risk output is not a safety guarantee. Escape untrusted strings. Keep the browser extension out of this milestone unless explicitly approved.
```

### Prompt 9 — Security and failure review

```text
Review the implemented system against its threat model: URL fetch/SSRF, request limits, injection/XSS, auth and ownership, rate limits, CORS, secrets, logs, retention, service timeouts, and dependency risks. Fix concrete issues in scope and report evidence and remaining limitations. Do not claim a formal security audit.
```

### Prompt 10 — Research packaging

```text
Prepare a model card, reproducibility instructions, architecture and data-flow diagrams, actual evaluation tables from generated outputs, error-analysis template, paper outline, and prior-art search log template. Mark unknowns and placeholders. Do not add unsupported novelty, performance, or patentability claims. Verify references and dataset terms before citing them.
```

### Prompt 11 — Assessment, presentation, and submission readiness

```text
Use the seven assessment areas and three cross-cutting goals in CODEX_BUILD_GUIDE.md to prepare an evidence matrix and final-project package. Calculate implementation completion only from the supervisor-approved in-scope requirements; show the denominator and evidence for each implemented item. Prepare a results discussion from actual outputs, an editable presentation outline and demo script, a project schedule and resource/cost/scalability analysis with assumptions and sources, and ethics/environment/sustainability/safety notes. Review the production-readiness release gate for the specified environment and state residual risks; never claim flaw-free or unhackable software. Update PHISHAI_RESEARCH_PAPER_DRAFT.md with verified implementation details and measured results only. Prepare an evidence-based resume/portfolio summary that lists implemented features, actual tools, and measured outcomes only. Add a paper-or-patent readiness checklist for supervisor review. Do not invent metrics, financial figures, similarity/plagiarism scores, references, or novelty. Do not submit anything externally.
```

---

## 13. Demo checklist

For a short project demonstration:

1. Explain the architecture and no-fetch rule.
2. Submit a harmless synthetic example or an approved sample from a permitted dataset, and identify its source/label.
3. Show the category, score meaning, observed reasons, and limitation notice.
4. Show the distinct URL-feature ML and rules/intelligence paths, and identify any external evidence that is enabled or unavailable.
5. Show history/dashboard and demonstrate owner-scoped access.
6. Present the real evaluation split, measured metrics, latency method, and an example false positive and false negative. Clearly separate local URL signals from optional external intelligence.

Do not put live malicious links into a demo browser. Do not claim that a synthetic example establishes model performance.

---

## 14. Reference starting points

Verify current versions, terms, and applicability when implementing or writing the report:

- OWASP Foundation, [Server Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).
- NIST, [Artificial Intelligence Risk Management Framework (AI RMF 1.0)](https://doi.org/10.6028/NIST.AI.100-1).
- scikit-learn, [Model evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html).
- Google for Developers, [Safe Browsing API reference](https://developers.google.com/safe-browsing/reference/rest); review current product terms and intended use before integration.
- MITRE, [CWE-918: Server-Side Request Forgery](https://cwe.mitre.org/data/definitions/918.html).

For the literature survey, add verified peer-reviewed phishing/scam-detection studies and original dataset documentation. Check university research ethics and patent-disclosure requirements before collecting participant data or publicly disclosing a potentially protectable invention.
