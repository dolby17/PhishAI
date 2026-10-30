import hashlib
import json
from pathlib import Path

import joblib

from app.features import FEATURE_NAMES, FEATURE_VERSION
from app.rules import RULE_VERSION

ARTIFACT_DIR = Path(__file__).resolve().parents[1] / "artifacts"


class ModelStore:
    def __init__(self, directory: Path = ARTIFACT_DIR):
        self.bundle = None
        self.status = "missing"
        path, metadata = directory / "model.joblib", directory / "model-metadata.json"
        if not path.exists() or not metadata.exists():
            return
        try:
            meta = json.loads(metadata.read_text())
            if hashlib.sha256(path.read_bytes()).hexdigest() != meta["artifactSha256"]:
                raise ValueError("Artifact digest mismatch")
            # Load only a trusted, locally trained artifact. Joblib can execute Python code.
            bundle = joblib.load(path)
            if (bundle["featureVersion"] != FEATURE_VERSION or bundle["ruleVersion"] != RULE_VERSION
                    or bundle["featureNames"] != list(FEATURE_NAMES)):
                raise ValueError("Feature or rule version mismatch")
            self.bundle = bundle
            self.status = "ready"
        except Exception:
            self.status = "invalid"

    def predict(self, vector: list[float]) -> float | None:
        if self.bundle is None:
            return None
        return float(self.bundle["model"].predict_proba([vector])[0][1])
