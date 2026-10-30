import json
import socket
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator

from app.features import FEATURE_NAMES, InvalidURL, extract_features, feature_vector
from app.main import app
from app.model import ModelStore
from app.rules import analyze_rules

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = json.loads((ROOT / "shared/contracts/url-fixtures.json").read_text())


@pytest.mark.parametrize("fixture", FIXTURES, ids=lambda f: f["name"])
def test_shared_url_policy(fixture):
    if not fixture["valid"]:
        with pytest.raises(InvalidURL):
            extract_features(fixture["url"])
        return
    features = extract_features(fixture["url"])
    assert [reason["code"] for reason in analyze_rules(features)["reasons"]] == fixture["reasons"]


def test_boundaries_and_training_inference_parity():
    prefix = "https://example.com/"
    assert extract_features(prefix + "a" * (4096 - len(prefix)))["url_length"] == 4096
    with pytest.raises(InvalidURL):
        extract_features(prefix + "a" * (4097 - len(prefix)))
    for fixture in FIXTURES:
        if fixture["valid"]:
            features = extract_features(fixture["url"])
            assert feature_vector(fixture["url"]) == [features[name] for name in FEATURE_NAMES]


def test_analyze_has_no_destination_network(monkeypatch):
    def denied(*_args, **_kwargs):
        pytest.fail("Scanner attempted destination network access")
    monkeypatch.setattr(socket, "getaddrinfo", denied)
    monkeypatch.setattr(socket, "create_connection", denied)
    monkeypatch.setattr(socket.socket, "connect", denied)
    monkeypatch.setattr(socket.socket, "connect_ex", denied)
    schema = json.loads((ROOT / "shared/contracts/analyze-v1.schema.json").read_text())
    validator = Draft202012Validator({**schema, "$ref": "#/$defs/AnalyzeResponse"})
    with TestClient(app) as client:
        for fixture in FIXTURES:
            response = client.post("/internal/v1/analyze", json={"schemaVersion": "1.0", "requestId": "test-17", "url": fixture["url"]})
            if fixture["valid"]:
                assert response.status_code == 200
                body = response.json()
                validator.validate(body)
                assert body["evidence"]["destinationContacted"] is False
                assert fixture["url"] not in response.text
            else:
                assert response.status_code == 422


def test_missing_model_is_explicit(tmp_path):
    with TestClient(app) as client:
        app.state.model = ModelStore(tmp_path)
        response = client.post("/internal/v1/analyze", json={"schemaVersion": "1.0", "requestId": "fallback", "url": "https://example.com/"})
        body = response.json()
        assert body["status"] == "partial"
        assert body["mode"] == "rules_only"
        assert body["model"]["score"] is None
        assert body["model"]["status"] == "unavailable"


def test_invalid_artifact_and_model_failure(tmp_path):
    (tmp_path / "model.joblib").write_bytes(b"invalid")
    (tmp_path / "model-metadata.json").write_text('{"artifactSha256":"wrong"}')
    assert ModelStore(tmp_path).status == "invalid"
    with TestClient(app) as client:
        class Broken:
            def predict(self, _vector):
                raise RuntimeError("unavailable")
        app.state.model = Broken()
        response = client.post("/internal/v1/analyze", json={"schemaVersion": "1.0", "requestId": "failure", "url": "https://example.com/"})
        assert response.status_code == 503
        assert "verdict" not in response.json()


def test_contract_errors_never_echo_input():
    with TestClient(app) as client:
        response = client.post("/internal/v1/analyze", json={"schemaVersion": "bad", "requestId": "test", "url": "https://secret:password@example.com/"})
        assert response.status_code == 422
        assert "password" not in response.text
