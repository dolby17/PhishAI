from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.contracts import AnalyzeRequest, AnalyzeResponse
from app.features import FEATURE_NAMES, FEATURE_VERSION, InvalidURL, extract_features
from app.model import ModelStore
from app.rules import analyze_rules
from app.report import build_report


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = ModelStore()
    yield


app = FastAPI(title="PhishAi internal scanner", version="1.0", lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_error(_request: Request, _exc: RequestValidationError):
    # Pydantic's default error body can echo credentials from submitted URL strings.
    return JSONResponse(status_code=422, content={"error": {"code": "INVALID_REQUEST", "message": "Invalid analysis request."}})


@app.get("/health")
def health():
    store = app.state.model
    return {"status": "ok", "rules": "ready", "model": store.status}


@app.post("/internal/v1/analyze", response_model=AnalyzeResponse)
def analyze(body: AnalyzeRequest):
    try:
        features = extract_features(body.url)
    except InvalidURL as exc:
        return JSONResponse(status_code=422, content={"error": {"code": "INVALID_URL", "message": str(exc)}})
    rules = analyze_rules(features)
    store = app.state.model
    try:
        ml_score = store.predict([features[name] for name in FEATURE_NAMES])
    except Exception:
        return JSONResponse(status_code=503, content={"error": {"code": "MODEL_FAILURE", "message": "Model inference unavailable."}})
    mode, score, threshold, score_type = "rules_only", rules["score"], 0.55, "heuristic"
    version = None
    if ml_score is not None:
        policy = store.bundle["policy"]
        mode, threshold, version = policy["mode"], policy["threshold"], store.bundle["version"]
        score = ml_score if mode == "ml" else policy["mlWeight"] * ml_score + (1 - policy["mlWeight"]) * rules["score"]
        score_type = "uncalibrated_model_score" if mode == "ml" else "decision_score"
    verdict = "high" if score >= threshold else ("review" if mode == "rules_only" and score >= 0.25 else "low")
    return {
        "schemaVersion": "1.0", "requestId": body.requestId,
        "status": "complete" if ml_score is not None else "partial", "mode": mode,
        "verdict": verdict, "score": score, "scoreType": score_type, "threshold": threshold,
        "featureVersion": FEATURE_VERSION, "rules": rules,
        "model": {"status": "available" if ml_score is not None else "unavailable", "version": version,
                  "score": ml_score, "scoreType": "uncalibrated_model_score"},
        "evidence": {"external": "disabled", "destinationContacted": False},
        "limitations": [
            "Low risk is not proof of safety. URL strings alone cannot establish a site's intent.",
            "Rule observations explain the heuristic branch, not the model's prediction.",
            "Scores are not calibrated probabilities. No DNS, page, TLS, or reputation checks run.",
        ] + (["Model artifact unavailable; this result uses rules only."] if ml_score is None else []),
        "report": build_report(body.url, features, rules, store, ml_score, verdict),
    }
