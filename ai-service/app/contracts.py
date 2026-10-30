from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class AnalyzeRequest(StrictModel):
    schemaVersion: Literal["1.0"]
    requestId: str = Field(min_length=1, max_length=80, pattern=r"^[a-zA-Z0-9-]+$")
    url: str = Field(min_length=1, max_length=4096)


class Reason(StrictModel):
    code: str
    feature: str
    observed: float
    weight: int
    message: str


class RuleResult(StrictModel):
    version: str
    score: float = Field(ge=0, le=1)
    scoreType: Literal["heuristic"]
    reasons: list[Reason]


class ModelResult(StrictModel):
    status: Literal["available", "unavailable"]
    version: str | None
    score: float | None = Field(default=None, ge=0, le=1)
    scoreType: Literal["uncalibrated_model_score"]


class Evidence(StrictModel):
    external: Literal["disabled"]
    destinationContacted: Literal[False]


class InputSummary(StrictModel):
    scheme: str
    hostname: str | None
    hostType: Literal["domain", "ip"]
    urlLength: int
    pathLength: int
    queryLength: int
    hasUserinfo: bool


class IndicatorDetail(StrictModel):
    code: str
    explanation: str
    recommendation: str


class Contribution(StrictModel):
    feature: str
    label: str
    observed: float
    contribution: float


class ModelExplanation(StrictModel):
    status: Literal["available", "unavailable", "unsupported"]
    method: Literal["tree_path_score_change"]
    baseline: float | None = Field(default=None, ge=0, le=1)
    contributions: list[Contribution]
    note: str


class AnalysisReport(StrictModel):
    version: Literal["report-1.0.0"]
    input: InputSummary
    indicators: list[IndicatorDetail]
    modelExplanation: ModelExplanation
    recommendations: list[str]


class AnalyzeResponse(StrictModel):
    schemaVersion: Literal["1.0"]
    requestId: str
    status: Literal["complete", "partial"]
    mode: Literal["rules_only", "ml", "hybrid"]
    verdict: Literal["low", "review", "high"]
    score: float = Field(ge=0, le=1)
    scoreType: Literal["heuristic", "uncalibrated_model_score", "decision_score"]
    threshold: float = Field(ge=0, le=1)
    featureVersion: str
    rules: RuleResult
    model: ModelResult
    evidence: Evidence
    limitations: list[str]
    report: AnalysisReport | None = None
