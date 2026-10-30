import json
from pathlib import Path
from pydantic.json_schema import models_json_schema
from app.contracts import AnalyzeRequest, AnalyzeResponse

_, schema = models_json_schema([(AnalyzeRequest, "validation"), (AnalyzeResponse, "validation")])
schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"
target = Path(__file__).resolve().parents[2] / "shared/contracts/analyze-v1.schema.json"
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(schema, indent=2) + "\n")
