# PhishAI URL-feature model

Purpose: an explainable local student demonstration of URL-string screening, not a production blocking engine or proof that a destination is safe. Owner: Veer Pratap Shekhar. Data and license: [data manifest](data-manifest.md).

Inputs: 20 numeric lexical features from `lexical-1.0.0`; exact order is embedded in model metadata. Methods: prior-only dummy, standardized logistic regression, Random Forest (120 trees, depth ≤16, minimum leaf size 2, two workers), rules, and a small weighted hybrid. Fit preprocessing/model on training only. Primary validation metric: macro-F1; ties prefer lower FPR then threshold nearest 0.5. This equal-class trade-off is a documented engineering default awaiting supervisor review, not an agreed operational risk budget.

Threshold grid: 0.3/0.4/0.5/0.6/0.7. Hybrid weights: 0.5/0.75 ML contribution; require ≥0.005 validation macro-F1 gain to add fusion. Validation selected Random Forest with threshold 0.4 and ML-only deployment. Do not select a new model based on the included final-test comparison. Frozen protocol/code/artifact/split digests and validation scores are in [selection freeze](../ai-service/artifacts/selection-freeze.json).

Historical eligible test: 1,653 rows (873 legitimate, 780 phishing). Selected Random Forest measured accuracy 0.794313, macro-F1 0.794286, phishing precision 0.746637, phishing recall 0.853846, FPR 0.258877, and FNR 0.146154. Confusion matrix `[[647,226],[114,666]]`, rows actual legitimate/phishing and columns predicted legitimate/phishing. PR-AUC is reported as average precision, not trapezoidal integration. [Final evaluation](../ai-service/artifacts/final-evaluation.json) includes all predeclared methods, latency scope, and hashed error examples.

Model branch output is an uncalibrated classifier score in [0,1], never a claimed probability of real-world harm. Rule explanations describe their observed features; they are not feature attributions for Random Forest. Absent model: explicit rules-only partial coverage. Inference exception: unavailable error without a verdict. Optional external intelligence is disabled.

Limitations: one old corpus, unverified publisher labels, possible source/campaign leakage across domains, no prospective evaluation, no confidence intervals, no formal fairness or usability study, no DNS/page/reputation evidence, no guarantee against ordinary-looking malicious URLs. FPR is substantial. Any change informed by final-test errors requires a new untouched confirmatory holdout before making new final claims.

Only load this project's trusted artifact. Joblib can execute Python during deserialization. The stored SHA256 detects changes relative to the committed metadata; it is not cryptographic proof of provenance.
