# Historical evaluation results

Selected deployment was frozen on validation before test evaluation. Final test: 1,653 eligible rows; phishing is positive. Thresholds are frozen per method.

| Method | Accuracy | Macro-F1 | FPR | FNR | Average precision |
| --- | ---: | ---: | ---: | ---: | ---: |
| dummy | 0.5281 | 0.3456 | 0.0000 | 1.0000 | 0.4719 |
| hybrid | 0.7943 | 0.7943 | 0.2589 | 0.1462 | 0.8976 |
| logistic | 0.7604 | 0.7491 | 0.0790 | 0.4192 | 0.8489 |
| random_forest | 0.7943 | 0.7943 | 0.2589 | 0.1462 | 0.8969 |
| rules | 0.5281 | 0.3456 | 0.0000 | 1.0000 | 0.5563 |

Random Forest remains the deployment choice. The rule baseline predicts no high-risk positives on this test partition at its predeclared 0.55 threshold; its low false-positive rate comes with complete loss of phishing recall. The hybrid did not meet the minimum validation gain. These negative findings are retained. No rule/threshold changes were made using final-test results.

Confusion matrix for deployment: `[[647,226],[114,666]]` (actual rows and predicted columns: legitimate, phishing). Per-class metrics and hash/feature-only error examples are in [final-evaluation.json](../ai-service/artifacts/final-evaluation.json). Independent rerun produced identical method metrics and model version.

This is an old single-corpus grouped holdout. Source/campaign leakage across domains and stale labels can remain. FPR is substantial. No confidence intervals, contemporary validation, calibration, or user study were performed. Further model/rule development needs a new untouched confirmatory holdout. Timing measurements concern only named local operations, not real-world protection.
