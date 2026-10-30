# PhishAi Research Paper Draft

> **Working manuscript scaffold.** Replace bracketed instructions with verified project details. This draft deliberately contains no invented results, references, similarity score, or novelty claims. Keep this file editable throughout the project. Do not submit it until it has been reviewed by the supervisor and the institution's required checks have been completed.

> **Presentation evidence note.** The supplied PhishAI deck reports 96% accuracy, 4% false-positive rate, and about 3 seconds response time, but does not provide the dataset, split, model configuration, confusion matrix, or timing method needed to reproduce these figures. Treat them as unverified presentation claims, not as study results. The deck's threat-context numbers and summaries of references [1]–[13] also require source verification before use.

## Front matter

### Title

**PhishAi: Design and Evaluation of a Production-Oriented, Explainable Platform for Phishing and Scam Triage**

Revise the title to match the system actually implemented and the study actually completed. Do not imply validated performance or novelty in the title unless the evidence supports it.

### Authors and affiliation

- Author(s): [Full names, in the order approved by all contributors]
- Department / institution: [Insert]
- Supervisor: [Insert if the venue/institution requests it]
- Contact author and email: [Insert if required]
- Version / date: [Insert]

### Abstract — complete after evaluation

**Background:** [Describe the bounded phishing/scam triage problem and cite sources.]  
**Objective:** [State the research question(s).]  
**Methods:** [State data source/version, sample counts, split method, feature sets, baselines, and evaluation metrics.]  
**Results:** [Insert only measured results from the held-out evaluation, with counts and uncertainty where appropriate.]  
**Conclusion:** [State what the evidence supports and the main limitations.]

**Keywords:** phishing detection; URL analysis; hybrid detection; threat intelligence; explainable AI; cybersecurity

---

## 1. Introduction

People encounter suspicious website URLs through email, SMS, messaging applications, and social media. A URL may be new or absent from a reputation list. Rule-based and statistical systems each have limitations, and users may need an explanation in addition to a label. PhishAi's defined study scope is URL-first; message-text classification is a possible later extension, not an assumed implemented feature. Support each background claim with a verified source.

### 1.1 Problem statement

[Define the precise input types, users, threat model, and detection task studied by this project. Avoid broad claims about all phishing or scams.]

### 1.2 Aim and objectives

The aim of PhishAi is to build and evaluate a production-oriented application that analyzes submitted website URL strings through separate machine-learning and cybersecurity-rule/intelligence paths, combines available evidence using a validated decision policy, returns a risk verdict with grounded reasons, and records authorized users' scan history. This describes the engineering objective; report only the release status and capabilities actually achieved.

Objectives:

1. [Confirm the implemented URL analysis objective.]
2. [Describe the implemented URL-feature models and their training provenance.]
3. [Describe the local rules and any approved domain/TLS/reputation intelligence.]
4. [Describe the validated fusion, explanation, and safe URL-handling behavior.]
5. [Describe the comparative evaluation and reproducibility objective.]

### 1.3 Research questions

- **RQ1:** On the defined held-out URL dataset, how do the simple baseline and selected URL-feature models compare?
- **RQ2:** Does validated hybrid fusion improve on ML-only and rules/intelligence-only outputs under the same protocol?
- **RQ3:** What false-positive, false-negative, and response-latency trade-offs are observed for the tested configurations?
- **RQ4:** Do the displayed explanations correspond to rules or model inputs used by the implemented system?

Retain only questions the collected data and completed experiments can answer. Do not claim user understanding or improved decisions without an appropriate user study.

### 1.4 Contributions

List only verified contributions. Possible categories to consider include:

- An implemented architecture with a documented no-fetch URL analysis boundary.
- A reproducible dataset preprocessing and evaluation pipeline.
- A comparison of explicitly defined URL ML-only, rules/intelligence-only, and hybrid baselines.
- Reason codes tied to implemented rules or model features.

For each contribution, state whether it is an engineering artifact, an empirical finding, or a hypothesis. Implementation alone does not establish research novelty.

## 2. Related work

Organize this section by approach (for example, URL reputation, URL lexical models, page/DOM analysis, and hybrid systems). Compare studies using their data, labels, split strategy, metrics, and limitations. Do not compare scores across incompatible datasets as if they were a direct benchmark.

### 2.1 Literature search method

- Databases / search engines: [Insert]
- Search date and date range: [Insert]
- Search terms: [Insert exact terms]
- Inclusion and exclusion criteria: [Insert]
- Citation-chasing process: [Insert]
- Source verification method: [Publisher/DOI/official dataset documentation/etc.]

### 2.2 Related work comparison matrix

| Verified source | Task and input | Dataset / labels | Method and split | Metrics | Limitations relevant to PhishAi |
|---|---|---|---|---|---|
| [Citation] | [Fill] | [Fill] | [Fill] | [Fill] | [Fill] |
| [Citation] | [Fill] | [Fill] | [Fill] | [Fill] | [Fill] |
| [Citation] | [Fill] | [Fill] | [Fill] | [Fill] | [Fill] |

The supplied presentation lists candidate papers numbered [1]–[13]. Verify each citation against the publisher or DOI record and inspect the source before using its metadata or reported metrics. Treat the deck's summaries as leads, not source evidence.

### 2.3 Evidence-based research gap

[Write a narrow gap only after completing the review. Example structure: “The reviewed studies use [specific difference]; this project therefore evaluates [bounded question] using [defined common protocol].” Cite the studies supporting the comparison. Avoid “no one has ever done this,” “first,” or “unique” unless a defensible systematic review supports such language.] 

## 3. Technical approach and system design

### 3.1 Scope and intended use

PhishAi is being developed as a production-oriented URL phishing detection application and as a resume portfolio project. This is a design goal, not a release-status claim: identify the actual environment as development, demo, staging, or production, and claim production readiness only if the documented release gate has been met for that environment. A low-risk output means only that PhishAi did not find strong risk signals; it is not proof that a URL or destination is safe. State the implemented URL inputs and exclusions here. Email/message classification and browser extensions are future work unless separately implemented and evaluated.

### 3.2 Architecture

```text
React + Vite browser client
        | HTTPS / JSON
        v
Node.js + Express public API
        |-- MongoDB persistence
        `-- internal Python + FastAPI inference service
                |-- URL-feature ML model
                |-- local security rules
                |-- optional reviewed enrichment adapters
                `-- validated weighted fusion + explanation
```

Describe only components that exist in the final implementation. Explain that the browser communicates with Express and the model service is internal. Add a final architecture figure and caption here: [Insert figure and source/creation note.]

### 3.3 End-to-end data flow

1. [Describe submission and client-side feedback.]
2. [Describe Express validation, request limits, authentication, and request ID.] 
3. [Describe the internal inference request and timeout.] 
4. [Describe feature extraction, rule/model prediction, and grounded reason codes.] 
5. [Describe persistence and response rendering.] 
6. [Describe owner-scoped history and failure behavior.] 

Add a final data-flow figure here: [Insert figure and caption.]

### 3.4 Safety, privacy, and threat boundaries

For the MVP, URL analysis operates on the supplied string and does not fetch, resolve, redirect through, or download from the submitted destination. Direct TLS handshakes and DNS/domain-age lookups are also network operations and must remain disabled until a separately reviewed design is approved. Threat-intelligence lookups can disclose submitted URLs to providers; document consent, terms, retention, and data flow before enabling them. Describe actual request limits, escaping, logging, access control, dependency/secrets review, deployment boundary, monitoring, backup/restore, and provider behavior. Do not describe an unperformed audit as completed or claim that the application is flawless or unhackable.

### 3.5 Finalized and validated technical decisions

Complete this table only after implementation and review. Mark each decision proposed, implemented, or validated and link to evidence.

| Decision | Final choice | Status | Validation evidence / artifact |
|---|---|---|---|
| Frontend/API/database/model service | [Fill] | [Proposed / Implemented / Validated] | [Fill] |
| URL handling boundary | [Fill] | [Status] | [Fill] |
| Dataset and label mapping | [Fill] | [Status] | [Fill] |
| Model and baseline | [Fill] | [Status] | [Fill] |
| Train/validation/test strategy | [Fill] | [Status] | [Fill] |
| Score and explanation contract | [Fill] | [Status] | [Fill] |
| Deployment environment and production-readiness gate | [Fill] | [Proposed / Implemented / Validated] | [Fill review scope, date, and residual risks] |

## 4. Methodology

### 4.1 Data sources and permissions

| Dataset/source | Version/date | License/terms | Labels and mapping | Samples by class | Exclusions |
|---|---|---|---|---|---|
| [Fill after selection] | [Fill] | [Verify and cite] | [Fill] | [Fill] | [Fill] |

Document provenance, collection dates, label meaning, permitted use, consent/ethics review if relevant, and any sensitive content exclusions. Do not include raw/private samples in the paper without authorization.

### 4.2 Preprocessing and leakage control

Describe normalization, exact/near-duplicate removal, grouping (such as by registrable domain, campaign, or data source), missing data, language handling, split seed, and any temporal boundaries. Explain why the chosen split is appropriate. Keep the test data isolated from model and threshold selection.

### 4.3 Features, rules, and models

Describe the actual feature schema and its version. For URL strings, report the lexical/structural features actually used and state that each is an indicator rather than proof. Describe the model configurations and deterministic cybersecurity rules separately. List TLS, WHOIS/domain-age, and threat-feed inputs only if actually integrated; distinguish local, external, stale, and unavailable evidence.

| Experiment | Inputs/features | Baseline/model | Threshold selection | Version |
|---|---|---|---|---|
| Simple URL baseline | URL lexical/structural | [Fill] | [Fill] | [Fill] |
| Local rules/intelligence only | [Exact implemented rules and approved evidence] | [Fill] | [Fill] | [Fill] |
| Random Forest | URL features | [Fill] | [Fill] | [Fill] |
| XGBoost (if implemented) | URL features | [Fill] | [Fill] | [Fill] |
| DNN (optional, if justified and implemented) | URL features | [Fill] | [Fill] | [Fill] |
| Validated hybrid fusion | Same eligible samples as comparison arms | [Fill] | [Fill] | [Fill] |

### 4.4 Evaluation protocol

Specify training, validation, and test partitions, class counts, model selection, fusion-weight/threshold selection, and random seeds. Report confusion matrix, accuracy, class-level precision/recall/F1, macro-F1, FPR, false-negative rate, and PR-AUC where appropriate. Measure latency on named hardware and report the timing method and p50/p95; identify whether external lookups are included. Explain calibration if probabilities/confidence are displayed. Accuracy alone is not sufficient when classes are imbalanced. Include an ablation comparing ML-only, rules/intelligence-only, and hybrid outputs on the same eligible set.

### 4.5 Software and security validation

List the checks actually performed: unit, API, integration, authorization/ownership, failure behavior, input limits, output escaping, log review, no-fetch verification, dependency/secret/container scans, deployment review, backup/restore, and monitoring as applicable. Include environment and software versions when known. Distinguish automated tests, manual checks, and independent/formal review. Record unresolved findings and review scope; no set of checks proves the absence of all vulnerabilities.

## 5. Implementation

Describe implemented components and material deviations from the proposed design. Link each requirement to evidence in the project assessment matrix.

### 5.1 Implementation completion

Use only the supervisor-approved in-scope feature list as the denominator:

`Implementation completion (%) = implemented approved requirements / total approved in-scope requirements × 100`

- Approved in-scope requirements (denominator): [N]
- Implemented requirements (numerator): [N]
- Completion: [Calculate from the values above]
- Deferred requirements and reasons: [List]
- Evidence location: [Repository commit, demo, or assessment matrix]

This is feature completion, not code coverage. Do not enter a percentage until the requirement list and counts are verified.

### 5.2 Reproducibility

Provide setup steps, environment variables, commands, model artifact/version, dataset manifest location, and evaluation command. Never publish secrets or restricted datasets. [Insert verified instructions or link to repository README.]

## 6. Results

> Replace all placeholders with outputs generated from the final code and documented data. Do not estimate or fabricate metrics.

### 6.1 Dataset and split summary

| Partition | Benign / non-scam count | Phishing / scam count | Total | Group/time boundary |
|---|---:|---:|---:|---|
| Train | [ ] | [ ] | [ ] | [ ] |
| Validation | [ ] | [ ] | [ ] | [ ] |
| Test | [ ] | [ ] | [ ] | [ ] |

### 6.2 Model performance

| System/baseline | Test precision by class | Test recall by class | Test F1 by class | Macro-F1 | PR-AUC (if appropriate) |
|---|---|---|---|---|---|
| Simple URL baseline | [Measured] | [Measured] | [Measured] | [Measured] | [Measured / N/A with reason] |
| Rules/intelligence-only | [Measured] | [Measured] | [Measured] | [Measured] | [Measured / N/A with reason] |
| Random Forest | [Measured] | [Measured] | [Measured] | [Measured] | [Measured / N/A with reason] |
| XGBoost, if implemented | [Measured] | [Measured] | [Measured] | [Measured] | [Measured / N/A with reason] |
| DNN, if justified and implemented | [Measured] | [Measured] | [Measured] | [Measured] | [Measured / N/A with reason] |
| Validated hybrid fusion | [Measured] | [Measured] | [Measured] | [Measured] | [Measured / N/A with reason] |

Additional measured values: accuracy [ ], FPR [ ], false-negative rate [ ], response latency p50/p95 [ ], hardware/environment [ ], optional lookups included [yes/no]. Do not copy the presentation's 96% accuracy, 4% FPR, or ~3-second value unless the final experiment reproduces them under a documented protocol.

### 6.3 Confusion matrix and error analysis

[Insert the measured confusion matrix and clearly define positive/negative classes. Discuss representative false positives and false negatives without exposing private or harmful content.]

### 6.4 System validation results

| Check | Method | Result | Evidence / issue |
|---|---|---|---|
| URL is not fetched in MVP | [Fill] | [Pass / Fail / Not run] | [Fill] |
| Invalid/oversized input rejected | [Fill] | [Fill] | [Fill] |
| API/model timeout behavior | [Fill] | [Fill] | [Fill] |
| Scan ownership enforced | [Fill] | [Fill] | [Fill] |
| Untrusted output safely displayed | [Fill] | [Fill] | [Fill] |
| Optional provider evidence missing/stale | [Fill] | [Fill] | [Fill] |
| Response latency and measurement conditions | [Fill] | [Fill] | [Fill] |
| Security/dependency review and unresolved findings | [Fill] | [Fill] | [Fill] |
| Deployment release gate for named environment | [Fill] | [Development / Demo / Staging / Production; not run] | [Fill evidence and residual risks] |

## 7. Discussion

Interpret the measured results in relation to each research question and the verified related work. Discuss whether the hybrid improved on the defined ML-only and rules/intelligence-only baselines only if the ablation supports that comparison. Explain false positives, false negatives, data leakage controls, dataset limitations, distribution shift, calibration, latency, provider availability, and the limits of explanations. Separate measured findings from possible explanations.

### 7.1 Limitations and threats to validity

[Discuss dataset representativeness, labels, collection period, duplicates, split design, source artifacts, sample size, thresholds, missing data, implementation gaps, and external validity.]

### 7.2 Ethical, safety, and privacy considerations

[Discuss user consent, privacy and data minimization, dataset licenses, bias/language coverage, safe wording, user reliance, retention/deletion, misuse, no-fetch design, SSRF boundary, and responsible disclosure. Report only reviews actually completed.]

### 7.3 Environmental sustainability

[Describe actual model/compute choices and efficient development measures. If energy/carbon was not measured, say so; do not invent an environmental impact estimate. Discuss reuse, modest models, and avoiding unnecessary services where applicable.]

### 7.4 Project management, cost, resources, and scalability

| Item | Actual or estimate | Basis/source/date | Assumption / limitation |
|---|---:|---|---|
| Hardware / compute | [Fill] | [Fill] | [Fill] |
| Software / hosting | [Fill] | [Fill] | [Fill] |
| Dataset / external services | [Fill] | [Fill] | [Fill] |
| Student labor / schedule | [Fill] | [Fill] | [Fill] |

Separate actual expenditure from estimates and future projections. Discuss scalability based on measured load tests if available; otherwise describe the proposed scaling considerations (API capacity, database indexes, retention, monitoring, model-serving capacity) as untested future work.

## 8. Conclusion and future work

[Summarize what was built and measured, answer only the research questions supported by evidence, and state the main limits. Do not claim guaranteed detection, flaw-free security, production readiness, novelty, or patentability without the required evidence and review. State the actual release environment and readiness status.]

Future work: [List feasible next steps such as stronger grouped/temporal datasets, additional languages, improved calibration, controlled user evaluation after ethics approval, or carefully reviewed threat-intelligence integration.]

## 9. References

Add only sources that have been read and verified. Follow the target venue or institution's citation style. Verify each title, author, year, DOI/URL, dataset claim, and access date where applicable.

1. [Verified reference; replace placeholder.]
2. [Verified reference; replace placeholder.]
3. [Verified reference; replace placeholder.]

## 10. Quality and similarity-report record

- Supervisor review status/date: [Pending / Complete; fill]
- Citation and bibliography check: [Pending / Complete; evidence]
- Grammar, formatting, and consistency review: [Pending / Complete; evidence]
- Institution-approved similarity/plagiarism service: [Name or Pending]
- Report date and genuine result: [Enter only from the actual report]
- Report file/location: [Restricted location or institution submission system]
- Required AI-use disclosure: [Follow institution/venue policy; record actual disclosure]

The similarity report is one review artifact, not proof of originality or misconduct. Do not alter text to evade detection and do not create a substitute score.

## 11. Submission readiness

### Research paper route

- [ ] Supervisor and all coauthors approved the manuscript and author order.
- [ ] Target venue and current author instructions verified.
- [ ] Ethics approval/consent requirements checked and documented where applicable.
- [ ] Dataset, code, and third-party material permissions verified.
- [ ] Every claim, citation, figure, metric, and table checked against its source or generated evidence.
- [ ] Actual similarity report and AI-use disclosure handled under institutional policy.
- [ ] Final formatting, accessibility, reproducibility, and supplementary materials reviewed.
- [ ] Submission approved by the responsible authors/supervisor.

### Patent exploration route (if selected with supervisor)

- [ ] Specific technical mechanism and proposed difference are documented.
- [ ] Patent and non-patent prior-art searches are logged with databases, queries, dates, and relevant claims.
- [ ] Inventorship and ownership are reviewed by the university technology-transfer office or qualified professional.
- [ ] Disclosure timing is discussed before public presentation, repository publication, or paper submission.
- [ ] No claim of patentability or novelty is made without qualified review.

Preparing this checklist does not mean that a paper has been submitted, accepted, or that an invention is patentable. Do not submit externally until the supervisor and relevant institution approve.

## Appendix A. Seven-point project assessment evidence matrix

| Assessment area | Artifact / evidence | Status | Owner / reviewer |
|---|---|---|---|
| 1. Implementation (minimum 70% of agreed scope) | [Requirement denominator, traceability matrix, demo] | [ ] | [ ] |
| 2. Results analysis, discussion, and validation | [Evaluation outputs, validation evidence, error analysis] | [ ] | [ ] |
| 3. Presentation | [Slides, diagrams, demo script, Q&A notes] | [ ] | [ ] |
| 4. Management, cost/resources, finance, scalability | [Schedule, role log, dated costs/assumptions, scale analysis] | [ ] | [ ] |
| 5. Ethical, environmental, sustainability, safety | [Ethics and safety review, data manifest, sustainability note] | [ ] | [ ] |
| 6. Paper draft, quality, plagiarism report | [This draft, verified citations, genuine institutional report] | [ ] | [ ] |
| 7. Paper/patent readiness, technical communication | [Readiness checklist, prior-art log if applicable, demo] | [ ] | [ ] |

## Appendix B. Presentation outline

1. Title, team, supervisor, and project name.
2. Problem, intended users, and bounded project scope.
3. Research questions and related-work evidence.
4. Architecture and safe end-to-end flow.
5. Implemented features and measured completion against approved scope.
6. Dataset, models, evaluation protocol, and measured results.
7. Error analysis, security/privacy, ethics, and sustainability.
8. Cost/resource assumptions, scalability, limitations, and future work.
9. Live demo with harmless or permitted examples.
10. Verified contributions and questions.

## Appendix C. Project-management and resource record

| Milestone/task | Planned date | Actual date | Owner | Status | Evidence / blocker |
|---|---|---|---|---|---|
| [Fill] | [ ] | [ ] | [ ] | [ ] | [ ] |
| [Fill] | [ ] | [ ] | [ ] | [ ] | [ ] |

List real equipment, software, services, datasets, estimated effort, actual spend, and resource constraints. State the source/date for price estimates and label future projections as assumptions.
