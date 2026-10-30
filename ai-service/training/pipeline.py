"""Offline training and a separate, frozen final-evaluation command."""
import argparse
import csv
import hashlib
import importlib.metadata
import json
import platform
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import tldextract
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, average_precision_score, classification_report, confusion_matrix, f1_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from app.features import FEATURE_NAMES, FEATURE_VERSION, InvalidURL, extract_features, parse_url
from app.rules import RULE_VERSION, analyze_rules

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "ai-service/artifacts"
DATA_SHA = "21093e2902e5441c86a6daf95e86e7c332046e477fdf109a579d7bd81e586d6c"
LABELS = {"legitimate": 0, "phishing": 1}
SEED = 17
THRESHOLDS = [0.3, 0.4, 0.5, 0.6, 0.7]
PSL = tldextract.TLDExtract(suffix_list_urls=(), cache_dir=None, include_psl_private_domains=True)
PROTOCOL = {
    "seed": SEED, "primaryMetric": "macro_f1", "thresholdGrid": THRESHOLDS,
    "tieBreak": "lower false-positive rate, then threshold closest to 0.5",
    "tradeoff": "Equal class importance via macro-F1; no operational FPR guarantee or supervisor approval yet.",
    "hybridWeights": [0.5, 0.75], "minimumHybridGain": 0.005,
    "split": "SHA256(phishai-17|registrable-domain), first 8 hex digits modulo 100; <70 train, <85 validation, else test",
    "dedup": "IDNA lowercase host + nondefault port + exact path/query; ignore scheme, userinfo, fragment; conflicting clusters excluded",
    "rf": {"n_estimators": 120, "max_depth": 16, "min_samples_leaf": 2, "n_jobs": 2, "random_state": SEED},
    "logistic": {"C": 1.0, "max_iter": 1500, "random_state": SEED},
}


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def write(name: str, value):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(value, indent=2, sort_keys=True, allow_nan=False) + "\n")


def metrics(y, scores, threshold):
    predicted = (np.asarray(scores) >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, predicted, labels=[0, 1]).ravel()
    return {"accuracy": float(accuracy_score(y, predicted)), "macro_f1": float(f1_score(y, predicted, average="macro", zero_division=0)),
            "fpr": float(fp / (fp + tn)) if fp + tn else None,
            "fnr": float(fn / (fn + tp)) if fn + tp else None,
            "pr_auc_average_precision": float(average_precision_score(y, scores)),
            "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
            "per_class": classification_report(y, predicted, labels=[0, 1], target_names=["legitimate", "phishing"], output_dict=True, zero_division=0)}


def choose_threshold(y, scores):
    results = [(threshold, metrics(y, scores, threshold)) for threshold in THRESHOLDS]
    return max(results, key=lambda pair: (pair[1]["macro_f1"], -pair[1]["fpr"], -abs(pair[0] - 0.5)))


def prepare(path: Path):
    if digest(path.read_bytes()) != DATA_SHA:
        raise ValueError("Dataset digest differs from the reviewed publisher version.")
    clusters, invalid, unknown = {}, 0, 0
    with path.open(newline="") as source:
        for row in csv.DictReader(source):
            if row["status"] not in LABELS:
                unknown += 1
                continue
            raw, label = row["url"], LABELS[row["status"]]
            try:
                parts, host, is_ip = parse_url(raw)
                features = extract_features(raw)
            except InvalidURL:
                invalid += 1
                continue
            port = parts.port
            identity = host + (f":{port}" if port and port != (443 if parts.scheme.lower() == "https" else 80) else "") + (parts.path or "/") + ("?" + parts.query if parts.query else "")
            group = host if is_ip else (PSL(host).top_domain_under_public_suffix or host)
            cluster = clusters.setdefault(identity, {"url": raw, "labels": set(), "group": group, "features": features})
            cluster["labels"].add(label)
    rows, conflicts = [], 0
    for identity, row in sorted(clusters.items()):
        if len(row["labels"]) != 1:
            conflicts += 1
            continue
        bucket = int(digest((f"phishai-{SEED}|" + row["group"]).encode())[:8], 16) % 100
        split = "train" if bucket < 70 else "validation" if bucket < 85 else "test"
        rows.append({"url": row["url"], "label": next(iter(row["labels"])), "group": row["group"], "split": split,
                     "identitySha256": digest(identity.encode()), "features": row["features"]})
    splits = {name: [row for row in rows if row["split"] == name] for name in ("train", "validation", "test")}
    groups = {name: {row["group"] for row in part} for name, part in splits.items()}
    assert not (groups["train"] & groups["test"] or groups["validation"] & groups["test"] or groups["train"] & groups["validation"])
    assert all(set(row["label"] for row in part) == {0, 1} for part in splits.values())
    snapshot = Path(tldextract.__file__).parent / ".tld_set_snapshot"
    manifest = {"source": "https://data.mendeley.com/datasets/c2gw7fy2j4/3", "doi": "10.17632/c2gw7fy2j4.3",
                "authors": ["Abdelhakim Hannousse", "Salima Yahiouche"], "license": "CC BY 4.0",
                "dataSha256": DATA_SHA, "labelMap": LABELS, "originalRows": 11430,
                "invalidExcluded": invalid, "unknownLabelExcluded": unknown, "conflictingClustersExcluded": conflicts,
                "duplicateRowsCollapsed": 11430 - invalid - unknown - len(clusters),
                "eligibleRows": len(rows), "pslVersion": importlib.metadata.version("tldextract"),
                "pslSnapshotSha256": digest(snapshot.read_bytes()), "privateSuffixesIncluded": True,
                "splits": {name: {"rows": len(part), "groups": len(groups[name]), "classCounts": dict(Counter(row["label"] for row in part)),
                    "membershipSha256": digest("\n".join(row["identitySha256"] for row in part).encode())} for name, part in splits.items()},
                "groupOverlap": 0, "policy": PROTOCOL, "featureVersion": FEATURE_VERSION, "ruleVersion": RULE_VERSION}
    write("data-manifest.json", manifest)
    write("splits.json", rows)
    return splits, manifest


def arrays(rows):
    return np.array([[row["features"][name] for name in FEATURE_NAMES] for row in rows]), np.array([row["label"] for row in rows])


def train(path: Path):
    if (OUT / "final-evaluation.json").exists():
        raise RuntimeError("Final test already inspected. Use a new experiment directory/holdout; do not overwrite it.")
    splits, manifest = prepare(path)
    x_train, y_train = arrays(splits["train"])
    x_val, y_val = arrays(splits["validation"])
    models = {
        "dummy": DummyClassifier(strategy="prior"),
        "logistic": make_pipeline(StandardScaler(), LogisticRegression(**PROTOCOL["logistic"])),
        "random_forest": RandomForestClassifier(**PROTOCOL["rf"]),
    }
    scores, validation, thresholds = {}, {}, {}
    for name, model in models.items():
        model.fit(x_train, y_train)
        scores[name] = model.predict_proba(x_val)[:, 1]
        thresholds[name], validation[name] = choose_threshold(y_val, scores[name])
        joblib.dump(model, OUT / f"{name}.joblib", compress=3)
    selected = max(("logistic", "random_forest"), key=lambda name: (validation[name]["macro_f1"], -validation[name]["fpr"], name == "logistic"))
    rules = np.array([analyze_rules(row["features"])["score"] for row in splits["validation"]])
    validation["rules"] = metrics(y_val, rules, 0.55)
    best_hybrid = None
    for weight in PROTOCOL["hybridWeights"]:
        score = weight * scores[selected] + (1 - weight) * rules
        threshold, result = choose_threshold(y_val, score)
        validation[f"hybrid_{weight}"] = result
        candidate = {"weight": weight, "threshold": threshold, "metrics": result}
        if best_hybrid is None or result["macro_f1"] > best_hybrid["metrics"]["macro_f1"]:
            best_hybrid = candidate
    deploy_hybrid = best_hybrid["metrics"]["macro_f1"] >= validation[selected]["macro_f1"] + PROTOCOL["minimumHybridGain"]
    policy = {"mode": "hybrid" if deploy_hybrid else "ml", "threshold": best_hybrid["threshold"] if deploy_hybrid else thresholds[selected],
              "mlWeight": best_hybrid["weight"] if deploy_hybrid else 1.0}
    version = "url-" + digest(json.dumps({"manifest": manifest, "protocol": PROTOCOL}, sort_keys=True).encode())[:12]
    bundle = {"model": models[selected], "policy": policy, "version": version, "featureVersion": FEATURE_VERSION,
              "ruleVersion": RULE_VERSION, "featureNames": list(FEATURE_NAMES)}
    joblib.dump(bundle, OUT / "model.joblib", compress=3)
    artifact_sha = digest((OUT / "model.joblib").read_bytes())
    write("model-metadata.json", {"version": version, "artifactSha256": artifact_sha, "selectedModel": selected, "policy": policy,
          "featureVersion": FEATURE_VERSION, "ruleVersion": RULE_VERSION, "featureNames": list(FEATURE_NAMES)})
    freeze = {"frozenAt": datetime.now(timezone.utc).isoformat(), "version": version, "selectedModel": selected,
              "policy": policy, "thresholds": thresholds, "hybrid": best_hybrid, "protocol": PROTOCOL,
              "validation": validation, "artifactSha256": artifact_sha,
              "codeSha256": {str(p.relative_to(ROOT)): digest(p.read_bytes()) for p in [Path(__file__), ROOT / "ai-service/app/features.py", ROOT / "ai-service/app/rules.py"]},
              "candidateSha256": {name: digest((OUT / f"{name}.joblib").read_bytes()) for name in models},
              "splitsSha256": digest((OUT / "splits.json").read_bytes()),
              "environment": {"python": platform.python_version(), "platform": platform.platform(),
                              "packages": {name: importlib.metadata.version(name) for name in ("scikit-learn", "numpy", "joblib", "tldextract")}}}
    write("selection-freeze.json", freeze)
    write("validation-results.json", {"selectedModel": selected, "deploymentPolicy": policy, "methods": validation})
    print(json.dumps({"eligibleRows": manifest["eligibleRows"], "splits": manifest["splits"], "selectedModel": selected, "policy": policy}))


def evaluate():
    target = OUT / "final-evaluation.json"
    if target.exists():
        raise RuntimeError("Final test has already been opened; existing report preserved.")
    freeze_bytes = (OUT / "selection-freeze.json").read_bytes()
    freeze = json.loads(freeze_bytes)
    for filename, expected in freeze["codeSha256"].items():
        if digest((ROOT / filename).read_bytes()) != expected:
            raise RuntimeError("Frozen evaluation code changed.")
    for name, expected in freeze["candidateSha256"].items():
        if digest((OUT / f"{name}.joblib").read_bytes()) != expected:
            raise RuntimeError("Frozen candidate changed.")
    if digest((OUT / "splits.json").read_bytes()) != freeze["splitsSha256"]:
        raise RuntimeError("Frozen split changed.")
    if digest((OUT / "model.joblib").read_bytes()) != freeze["artifactSha256"]:
        raise RuntimeError("Deployment artifact changed.")
    rows = [row for row in json.loads((OUT / "splits.json").read_text()) if row["split"] == "test"]
    x, y = arrays(rows)
    scores = {name: joblib.load(OUT / f"{name}.joblib").predict_proba(x)[:, 1] for name in freeze["candidateSha256"]}
    scores["rules"] = np.array([analyze_rules(row["features"])["score"] for row in rows])
    scores["hybrid"] = freeze["hybrid"]["weight"] * scores[freeze["selectedModel"]] + (1 - freeze["hybrid"]["weight"]) * scores["rules"]
    thresholds = {**freeze["thresholds"], "rules": 0.55, "hybrid": freeze["hybrid"]["threshold"]}
    results = {name: metrics(y, score, thresholds[name]) for name, score in scores.items()}
    deployed = "hybrid" if freeze["policy"]["mode"] == "hybrid" else freeze["selectedModel"]
    predicted = (scores[deployed] >= freeze["policy"]["threshold"]).astype(int)
    # Error examples contain hashes/features only, not actionable malicious URLs.
    errors = [{"inputSha256": digest(row["url"].encode()), "actual": int(y[i]), "predicted": int(predicted[i]),
               "score": float(scores[deployed][i]), "features": row["features"]}
              for i, row in enumerate(rows) if y[i] != predicted[i]][:20]
    model = joblib.load(OUT / "model.joblib")["model"]
    cold_start = time.perf_counter()
    model.predict_proba(x[:1])
    cold_ms = (time.perf_counter() - cold_start) * 1000
    durations = []
    for vector in x[:100]:
        start = time.perf_counter(); model.predict_proba([vector]); durations.append((time.perf_counter() - start) * 1000)
    report = {"evaluatedAt": datetime.now(timezone.utc).isoformat(), "selectionFreezeSha256": digest(freeze_bytes),
              "version": freeze["version"], "intendedDeployment": deployed, "deploymentChangedAfterTest": False,
              "testRows": len(rows), "testClassCounts": dict(Counter(map(int, y))), "coverage": 1.0,
              "thresholds": thresholds, "methods": results, "errors": errors,
              "inferenceLatency": {"scope": "model.predict_proba only; excludes features, HTTP, load time", "concurrency": 1,
                   "requests": len(durations), "firstPredictionMs": cold_ms, "p50Ms": float(np.percentile(durations, 50)),
                   "p95Ms": float(np.percentile(durations, 95)), "platform": platform.platform(), "processor": platform.processor()},
              "limitations": ["Single historical May 2020 corpus; no contemporary or cross-source generalization established.",
                   "Publisher labels are not independently reverified. Source and campaign leakage can remain across domains.",
                   "No confidence intervals or user study. Eligibility exclusions apply before split; coverage is eligible-test coverage only."]}
    write("final-evaluation.json", report)
    print(json.dumps({"intendedDeployment": deployed, "testRows": len(rows), "metrics": results[deployed]}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["train", "evaluate"])
    parser.add_argument("--data", type=Path, default=ROOT / "data/raw/dataset_B_05_2020.csv")
    args = parser.parse_args()
    train(args.data) if args.command == "train" else evaluate()
