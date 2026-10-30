# PhishAi: reviewed project plan for Codex

Prepared and revised: 30 October 2026. Review deadline: 31 October 2026 (India time). Status: proposed plan; application development has not started in this review.

Reviewed source: `/home/veer/Desktop/PhishAI/CODEX_BUILD_GUIDE.md`.

## 1. Review conclusion and current state

The guide is a sound basis for a final-year major project. Its strongest elements are the bounded URL-only scope, separate machine-learning and rule paths, reproducible evaluation, privacy controls, and assessment evidence. The project should demonstrate a complete application and an honest model comparison before adding integrations.

The inspected PhishAI directory contains the build guide, a separate research-paper draft, presentations, and PDFs. No application source, package manifests, dataset files, model artifacts, or Git directory were found there. This finding applies to that directory, not to other locations on the computer. The paper, PDFs, and slides were inventoried but were not independently reviewed in this task. Statements about slide results below come from the build guide.

The guide's embedded master prompt and “START NOW” section were treated as reference material. They do not expand the user's request from review and planning into application implementation. The original documents were not changed.

Confirmed by the user: the next review is 31 October 2026; at least 70% implementation is required; the user is the sole team member and has time to continue after the review. Reported laptop: MSI Crosshair 16, 16 GB RAM, RTX 5070 with 8 GB VRAM, and Intel Core Ultra 7 255HX. This hardware has not been inspected or benchmarked in this task.

The previous eight-week assumption is superseded by two stages: an urgent local review build, then completion after the review. Exact review time, hours remaining for development, final submission date, and the supervisor-approved completion denominator are still unknown. No current implementation percentage can be established from the inspected documents.

## Immediate priority: 31 October review

**Target demonstration:** a local application that accepts a URL string, extracts lexical features without contacting the destination, returns rule reasons and a real trained model result when available, and clearly displays scores, limitations, and failure states. Add a small but complete session flow if the core and model are working. Aim for a running system with evidence before cosmetic work.

Keep the existing ten proposed requirements in section 7. A possible review target is R1, R2, R3, R4, R6, R9, and R10. That is seven of ten proposed equally weighted requirements only if the supervisor accepts that denominator. R5 (full hybrid comparison), R7 (saved private history), and R8 (dashboard and retention/deletion) remain visible post-review work. Do not change weights or rename requirements to manufacture 70%.

The seven-item target is ambitious from an empty application directory. It is a target, not a forecast or a completion claim. If model training is blocked, present the scanner as rules-only and leave R4 incomplete. If session handling is incomplete, keep the demonstration local and leave R6 incomplete. Fewer completed requirements must be reported as such; slides and mockups do not replace implementation.

### Execution order before the review

These are rough active-work estimates, not measured timings. Actual dependency setup, data acquisition, and debugging may take longer. The stages total roughly 9–15 hours; the exact remaining time is not known.

| Priority | Work | Working estimate | Exit condition |
|---|---|---|---|
| A | Scope/data/tooling check | 0.5–1 hour | Inspect existing tooling; shortlist one usable permitted raw-URL dataset; record terms/labels and blockers; preserve the original documents. |
| B | Minimal service skeleton and contract | 1–2 hours | React → Express → internal FastAPI works; health checks, bounded configuration, and isolated Compose services work. |
| C | Useful rules-only scanner | 2–3 hours | URL validation, shared Python features, deterministic reasons, real form/result/error states, and no-destination-network checks. |
| D | Small real training and inference run | 2–4 hours | Permitted data manifest, duplicate/group checks, frozen splits, bounded simple-baseline/Random-Forest comparison, versioned artifact, and measured outputs. No fabricated data or metrics. |
| E | Minimal complete accounts | 2–3 hours | Registration/login/logout, password hashing, sessions, CSRF defense, expiry, and protected scan access work. No saved URL history yet. |
| F | Stabilize and capture evidence | 1–2 hours | Actual checks, restart rehearsal, architecture diagram, implementation matrix, screenshots, short demo script, and visible limitations. |

Dataset suitability is checked before substantial UI work because a missing permitted dataset can block the AI requirement. Reuse the same Python feature code in rules, training, and inference. If data is unavailable, continue the rules-only slice while leaving trained inference explicitly unavailable.

Do not sacrifice verification stage F to add another feature. Reserve the final available work block for restart rehearsal and a reliable demo. Freeze feature development before that block. Avoid cloud hosting, paid services, live threat feeds, neural-network setup, and elaborate visual effects before the review.

### Laptop and resource plan

- Start with bounded CPU-based scikit-learn experiments; the initial pipeline does not require GPU/CUDA setup. Do not add GPU dependencies solely because the laptop has a GPU.
- Treat 16 GB system RAM as the main resource budget: train one experiment at a time, cap parallel workers, bound Random Forest size/search, and avoid retaining multiple full dataset copies.
- Start with a documented representative development subset if the full dataset exceeds memory/time. Report its actual size and selection method; do not imply it represents the whole dataset. Apply deduplication/grouping correctly and keep the final holdout isolated.
- Do not assume the current Codex environment is the laptop's installed environment. Inspect actual OS, Python/Node/Docker availability, and memory before choosing commands or installation steps.
- After training, unload the training process and run the application alone for the review. Record the hardware actually used for any timing claims.

### Review evidence to prepare

1. A clean-start local demo with harmless synthetic input, clearly identified as synthetic; never use it as model-performance evidence.
2. A requirement matrix showing implemented, validated, partial, and pending items with links to actual code/check outputs. Keep supervisor approval of the denominator explicit.
3. The data manifest, real model artifact/version, split details, and whatever evaluation has actually completed. Mark preliminary findings and all missing measurements.
4. One architecture diagram and a short explanation of URL-string analysis versus external intelligence, which remains disabled.
5. A concise five-minute demo: problem and scope, architecture, valid input, malformed input, result/reasons/limitations, actual implementation progress, and post-review tasks. Show session flow only if it works.
6. Backup screenshots and a local recording if time allows; label them as recordings. Do not substitute mock screens for unfinished behavior.

The full manuscript, genuine similarity report, advanced fusion, and production-readiness evidence can be completed after the review unless the supervisor explicitly requires them tomorrow.

## 2. Changes to make before implementation

| Finding in the guide | Recommended resolution |
|---|---|
| Model/ensemble selection is sometimes described as depending on held-out evaluation, while the final test set must remain untouched. | Select model family, parameters, fusion policy, and thresholds using training/validation only. Freeze the candidates and intended deployment choice before final test evaluation. Report test comparisons without choosing a new winner from them. |
| A versioned inference contract appears after the first end-to-end slice in the incremental prompts. | Define a minimal versioned rules-only contract before the first scan. Extend it compatibly when the trained model is added. |
| Scan persistence is requested before authentication/history is implemented. | Keep the early local scan stateless. Add authenticated scan persistence together with ownership controls. Final public scan routes require authentication. |
| No concrete dataset is selected. | Make data suitability the first review-build gate. Require usable raw URL strings, documented labels and terms, and enough host/domain information for meaningful splitting. A dataset of precomputed page/network features alone does not match a lexical-only scanner. |
| Fusion is a target architecture but may not improve performance. | Implement and evaluate a small fusion candidate. Deploy the validation-selected approach; if fusion does not improve the declared trade-off, keep the simpler approach and report the negative finding. |
| URL parsing behavior is underspecified. | Freeze a shared parsing policy and fixtures before training: schemes, size bounds, Unicode/IDNA, IP literals, userinfo, ports, fragments, and malformed input. Use the same Python feature extractor for training and inference. |
| Authentication guidance lacks complete session lifecycle routes. | Add session status, logout, expiry, and a documented CSRF defense. Specify secure deployed cookies and an explicit local-development configuration. SameSite alone should not be the entire CSRF design. |
| “No fetch” is stated without a concrete proof method. | Review network call sites and run scanner checks with destination-network access blocked or trapped. Check helpers for hidden network access, including public-suffix data updates. Do not make submitted text clickable or enable link previews. |
| Minimal storage is a goal, but retention/deletion behavior is not chosen. | Define stored fields, retention duration, deletion behavior, and logging policy before adding persistence. Show reasons and timestamps in history without storing the full original URL by default. |
| A 20–25-page paper is described as following an international standard. | Treat this as a proposed institutional manuscript length. Follow the supervisor's required format; a conference submission may require a different page limit/template. Do not pad the paper to meet an assumed universal standard. |
| Extensive production and patent goals could delay the review demo. | Target a documented demo release first. Keep operational production gates and submission readiness separate from core completion. |

## 3. Project scope

**Working description:** PhishAi is an explainable phishing-risk screening application using URL-string features, classical machine learning, and local security rules.

**Core user journey:** Sign in → submit one URL string → receive a clearly explained result → inspect private scan history and summary → delete saved history according to the documented policy.

**Required delivery:**

- React/Vite interface with accessible forms, results, loading/error states, history, and summary.
- Express application API with sessions, validation, rate limits, owner checks, and minimal persistence.
- Internal FastAPI scanner with one shared feature extractor and independently visible model/rule outputs.
- A local rule baseline, a simple learned baseline such as logistic regression, and Random Forest comparison. Include a trivial classifier as an evaluation sanity check.
- A reproducible training/evaluation pipeline and a measured rules-only/ML-only/hybrid comparison.
- Docker Compose, setup instructions, focused verification, model card, and assessment evidence.

**Deferred:** XGBoost unless time/data justify it, neural networks, email/message analysis, browser extension, live reputation feeds, WHOIS, TLS probing, page inspection, SOAR, and public third-party API access.

**Fixed boundary:** The scanner must not resolve, visit, fetch, render, redirect through, download from, or execute submitted destinations. No external LLM or reputation service is needed for the core project. Optional external evidence is explicitly unavailable while disabled.

## 4. Architecture and implementation defaults

```text
React + Vite
      |
      | application API; session cookie
      v
Express ----------------------> MongoDB
      |
      | internal versioned JSON contract
      v
FastAPI
  |-- shared lexical feature extractor
  |-- local rule engine
  |-- trained URL-feature model
  `-- evaluated decision policy and grounded reasons
```

The browser communicates with Express only for application data. During development the Vite server serves the interface and proxies API calls. MongoDB and FastAPI have no published public ports in the normal Compose configuration. Use an isolated runtime network for inference and database communication where practical; training-data acquisition is a separate offline preparation step.

Use TypeScript for client and server as a proposed default; Python for feature extraction, training, and inference. Verify supported compatible runtime/dependency versions when scaffolding, then lock them. Avoid extra infrastructure unless it resolves a measured need.

Define `shared/contracts/analyze-v1.schema.json` and matching fixtures early. Python models and Express validation must agree with those fixtures. The contract should identify request/schema version, analysis status/mode, verdict, score and score type, model/rule/feature versions, separate branch results, evidence availability, and reason codes. Invalid input and unavailable analysis are operational states, not benign classifications.

Start with bounded HTTP/HTTPS inputs. Record exact limits in the contract rather than scattering constants across services. Explicitly handle credentials/userinfo and reject or flag according to the frozen policy. Do not silently change a URL in ways that destroy useful features. Use a pinned offline public-suffix snapshot if grouping by registrable domain; record its version and avoid runtime list downloads. Handle IP literals and unusual hostnames explicitly.

Start with readable rules linked to exact observations. A rule reason explains that rule; it must not be presented as an explanation of an unrelated model prediction. Avoid HTTPS/TLD-based safety guarantees. Keep risk scores distinct from calibrated probabilities.

## 5. Full milestone roadmap and post-review sequence

Use the urgent execution order above before 31 October. The roadmap below describes the full project; it does not assume these milestones are already complete or prescribe an eight-week delay. Continue after the review in this dependency order, adjusting dates to the final submission deadline. Documentation, research reading, and evidence collection continue throughout.

| Target | Deliverable | Completion evidence |
|---|---|---|
| M0: before review | Freeze proposed requirements, inspect tooling, check permitted data, write parsing policy, threat boundaries, and initial contract. | Requirement IDs, open-decision log, dataset suitability check, and a file-level implementation plan. No unsupported implementation claims. |
| M1: before review | Minimal React/Express/FastAPI/Compose skeleton; MongoDB configured without scan persistence. | Clean local startup, health/readiness behavior, placeholder configuration, and verified service boundaries. |
| M2: before review | Stateless local URL form → Express validation → FastAPI rules → result view. | Deterministic reason fixtures; invalid/oversized/Unicode/IP/scheme cases; visible errors; evidence of no destination-network activity. |
| M3: review target | Dataset manifest, frozen splits, shared features, bounded simple-baseline and Random-Forest training; integrate a selected model. | Provenance and label map, overlap checks, real model artifact, validation-based selection, training/inference parity, explicit missing-model behavior. |
| M4: review target | Minimal complete accounts and authenticated scans; persist only what session handling requires. | Registration/login/logout, password handling, CSRF/session/expiry checks, clear local/demo release label. |
| M5: after review | Minimal saved scan metadata, owner-scoped history, deletion/retention, and dashboard. | Two-user isolation, owner-filtered queries/aggregation, pagination, minimal stored records, documented retention. |
| M6: after review | More thorough comparison, hybrid candidate, UI improvements, frozen confirmatory evaluation and error analysis. | Branch comparison, recorded selection protocol, confusion matrices, measured latency, and visible limitations. Avoid reusing previously inspected tests as an untouched holdout. |
| M7: after review | Focused security/failure review, fixes, reproducible demo/staging deployment and operating notes. | Findings and resolutions, checks actually run, configuration review, release gate and remaining risks. |
| M8: after review | Complete research paper, assessment matrix, editable slides, resource/cost note, ethics, and submission-readiness package. | All seven assessment areas linked to actual artifacts; genuine results/citations only; genuine similarity-report status. |

**First running checkpoint:** Finish M2 before adding further UI polish. If that is the only completed slice by the review, explicitly state that ML and accounts are pending; do not label it 70% of the full project.

**After the review:** Record supervisor feedback and accepted scope first, then finish core gaps and M5 before expanding experiments. The final submission date determines the calendar; no post-review deadline has been assumed.

## 6. Data and evaluation protocol

1. Shortlist datasets from original publishers; verify terms, label definitions, dates, raw URL availability, and eligibility before downloading. No dataset has been selected or approved by this review.
2. Record file digests, source/version, exclusions, class counts, and label mapping. Do not assume every non-phishing label means legitimate; document multiclass inclusion/exclusion.
3. Resolve duplicate labels and cluster exact/near duplicates using a documented deterministic policy. Avoid altering query/path data in a way that hides class-relevant differences.
4. Prefer a trustworthy temporal holdout when it matches the research question; otherwise split by registrable-domain groups. State what group/source leakage remains. A proposed train/validation/test ratio is approximately 70/15/15, subject to viable group and class counts; it is unrelated to the assessment's 70% feature-completion target.
5. Learn preprocessing, feature selection, model parameters, thresholds, and fusion weights using training/validation only. Use training-fold pipelines for fitted transformations. Keep the test partition isolated.
6. Select using a declared primary metric and an explicit false-positive/false-negative trade-off. Agree the operating trade-off before tuning. Do not retrofit a target to make the results look better.
7. Freeze model family, feature/rule versions, thresholds, fusion settings, intended deployment policy, and evaluation code before opening final test results. If a later change uses test findings to improve the model, label that test exploratory and obtain a new untouched holdout for confirmatory evaluation.
8. Evaluate the predeclared methods on the same eligible test examples: local rules, simple learned baseline, Random Forest, and frozen hybrid candidate. Record failures, exclusions, and analysis coverage. Do not silently remove difficult samples or count unavailable analysis as benign.
9. Report class counts, confusion matrices, precision/recall/F1 by class, macro-F1, accuracy, FPR, false-negative rate, and PR-AUC where score outputs make it meaningful. Define the positive class and metric conventions. Include representative error analysis and group-aware uncertainty estimates if feasible.
10. Measure inference-only and end-to-end latency separately, recording hardware, dataset/input set, request count, concurrency, cold/warm behavior, failures, and p50/p95. The guide's 96%, 4%, and roughly three-second figures are unverified claims, not targets to reproduce by tuning the test set.

The recommendation to isolate test data and fit preprocessing only on training data follows scikit-learn's [common pitfalls guidance](https://scikit-learn.org/stable/common_pitfalls.html). Its [cross-validation documentation](https://scikit-learn.org/stable/modules/cross_validation.html) describes separate validation and group-aware evaluation. Domain grouping and the proposed split ratio here are project design choices, not guarantees of real-world generalization.

## 7. Proposed acceptance register

These ten requirements are a starting proposal for supervisor agreement, not an approved assessment denominator. Track implementation and validation separately. Do not split easy tasks into extra requirements to inflate completion.

| ID | Requirement | Evidence needed |
|---|---|---|
| R1 | Validate URL-only submissions consistently. | Contract and boundary fixtures. |
| R2 | Analyze URL strings without destination-network access. | Runtime network-boundary checks and reviewed call paths. |
| R3 | Produce deterministic local rule results with grounded reasons. | Rule specification and feature/reason checks. |
| R4 | Train and serve a reproducible URL-feature model with version metadata. | Manifest, frozen splits, training outputs, feature parity. |
| R5 | Compare branch outputs and the hybrid candidate under one protocol. | Validation-selection log and frozen final evaluation. |
| R6 | Support registration, login, logout, and session lifecycle. | Functional and session-security checks. |
| R7 | Save minimized records and enforce owner-scoped history/detail access. | Database schema, two-user authorization checks, pagination checks. |
| R8 | Provide a private dashboard summary and history deletion/retention behavior. | Owner-filtered aggregation and deletion/retention evidence. |
| R9 | Provide accessible results with honest scores, errors, and unavailable states. | UI review and integration/failure checks. |
| R10 | Start a documented local demo reproducibly with isolated internal services. | Fresh-start instructions, configuration examples, health/boundary checks. |

Only if these ten equally weighted items are approved would seven implemented items represent 70%. Aim to complete and validate the whole agreed core. Record partial or blocked requirements explicitly; do not imply a partial requirement is fully complete. Keep the seven academic assessment areas in a separate evidence matrix linked to these requirements.

## 8. First implementation slice and likely files

The next implementation milestone should be M1 only: a minimal service skeleton. No model training, account features, scan persistence, or external integrations belong in this first change.

Proposed files, to be adjusted after actual tooling inspection:

```text
README.md
.gitignore
.env.example
docker-compose.yml
client/package.json
client/vite.config.ts
client/tsconfig.json
client/index.html
client/src/main.tsx
client/src/App.tsx
client/Dockerfile
server/package.json
server/tsconfig.json
server/src/app.ts
server/src/index.ts
server/src/config.ts
server/test/health.test.ts
server/Dockerfile
ai-service/pyproject.toml
ai-service/app/main.py
ai-service/tests/test_health.py
ai-service/Dockerfile
shared/contracts/analyze-v1.schema.json
docs/requirements.md
docs/architecture.md
docs/threat-model.md
docs/assessment-evidence.md
docs/decisions.md
```

Include lockfiles and build configuration required by the chosen tools. Avoid placeholder controllers/services that have no working responsibility.

M1 passes when the local interface can display application health through Express, internal health checks succeed, MongoDB and FastAPI are not publicly published, configuration contains no real secrets, and startup instructions match a real run. In skeleton mode, missing model artifacts should be explicit; a running process is not equivalent to model readiness. Report only checks actually executed.

M2 then adds the first useful product slice: form → Express validation → internal rules-only analysis → visible reasons. This early route is local/stateless; it must not become a public anonymous scanning service by accident. Authentication and persistence are introduced together before external exposure.

## 9. Evidence and final-year deliverables

Maintain these as behavior is implemented rather than generating unsupported reports at the end:

- `docs/requirements.md` and `docs/assessment-evidence.md`: approved scope, owner/status, and links to real evidence for all seven assessment areas.
- `docs/architecture.md`, `docs/api-contract.md`, and `docs/threat-model.md`: actual service/data boundaries, schemas, session/CSRF controls, no-fetch proof, privacy/retention, and known risks.
- `docs/data-manifest.md`, `docs/model-card.md`, and evaluation outputs: provenance, training instructions, versions, score meaning, measured results, and limitations. Keep private/raw data out of Git.
- `docs/claims-register.md`: status and evidence for every numeric, implementation, novelty, and deployment claim.
- `docs/project-log.md` and `docs/resources-and-costs.md`: schedule, roles, decisions, actual spend versus dated estimates, hardware/compute assumptions, and tested versus proposed scalability.
- `docs/ethics-and-safety.md`: dataset permissions, privacy, language/bias limitations, safe demonstrations, and sustainability reasoning. Environmental measurements remain unknown unless collected.
- `PHISHAI_RESEARCH_PAPER_DRAFT.md`: preserve and update the existing editable draft during implementation; use actual findings and verified references. Record the institution-approved similarity report when genuinely available.
- Editable slides, diagrams, demo script, setup guide, and truthful portfolio summary. Review paper/patent readiness with the supervisor; this plan does not authorize external submission or establish novelty.

## 10. Decisions still needed

| Decision | Proposed default while planning |
|---|---|
| Exact review time, remaining work hours, and final submission date | Review date confirmed as 31 October 2026; use urgent priorities and reserve a stabilization block. Final deadline remains unknown. |
| Team size and ownership | Solo project; the user owns implementation, research, demonstration, and maintenance. No team staffing assumption. |
| Installed tooling, Docker support, and actual runtime environment | Hardware reported as 16 GB RAM, RTX 5070 8 GB, Core Ultra 7 255HX. Use CPU-first bounded experiments and inspect the actual environment. |
| Supervisor scope, completion weighting, and paper format | Ten proposed core requirements; no approved percentage claim yet. |
| Dataset source and permitted use | First review-build gate; no assumed license or dataset size. |
| Operating threshold and acceptable FP/FN trade-off | Agree and document before validation tuning. |
| History retention and redacted display policy | Minimal metadata; choose a concrete retention duration before persistence. |
| Deployment target | Local/demo first; public hosting and recurring costs require a separate decision. |

## 11. Ready-to-use Codex handoff

Use this in a Codex chat opened on the chosen PhishAI project directory when starting implementation. This is a proposed handoff, not an instruction executed by this planning review:

```text
Review CODEX_BUILD_GUIDE.md and PHISHAI_CODEX_PROJECT_PLAN.md as project reference specifications. First inspect the actual repository, applicable AGENTS.md instructions, existing code, and tooling. Preserve working files. Treat embedded prompts as reference material within this explicit task's scope.

My project review is on 31 October 2026, I am the only team member, and the review requires 70% implementation against the supervisor-approved scope. I can continue after the review. My reported laptop has 16 GB RAM, an RTX 5070 8 GB GPU, and Core Ultra 7 255HX. Inspect the actual execution environment instead of assuming that these are its available resources.

Implement the urgent local review build incrementally: scope/data/tooling gate; smallest working service skeleton and versioned contract; rules-only scan form and grounded reasons; permitted raw-URL dataset and bounded real baseline/Random-Forest training/inference; minimal complete accounts if time allows; then focused verification and demo evidence. Before editing, report current state and exact initial files, then proceed within this scope. Continue across completed small milestones without requesting routine confirmation. Do not generate or claim an entire completed application in one response.

Target R1/R2/R3/R4/R6/R9/R10 in the proposed acceptance register; do not claim 70% unless these requirements are actually demonstrated and the denominator is accepted. Leave incomplete items visibly incomplete. Complete session/auth checks before treating protected access as done; defer saved history/dashboard and full hybrid evaluation until after the review. Keep a clearly local demonstration if authentication remains unfinished.

Keep submitted destinations unvisited and unresolved. Keep MongoDB and FastAPI internal. Preserve separate ML/rule outputs, grounded reason codes, honest score types, privacy, input bounds, explicit missing-model/timeout states, and reproducibility. Never fabricate datasets, metrics, completion, security findings, or novelty. If a permitted dataset is unavailable, continue the rules-only path while recording ML as blocked; never train synthetic toy data and imply phishing-detection performance.

Use bounded CPU experiments first. No GPU/CUDA setup, paid integrations, public deployment, system-wide installation, or expanded features without relevant authorization. Run focused available checks and report actual outcomes. Record evidence as you go. Reserve the final available work block for restart rehearsal, requirement status, screenshots, architecture, and a short demo script. Stop review-build feature work after that stabilization block; list the smallest post-review tasks.
```

Review performed: build-guide reading, directory inventory, applicable instruction-file check, and primary-source evaluation guidance. Application tests were not run because this task created a plan, not an application.
