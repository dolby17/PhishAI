"""Re-run the frozen experiment in a new local directory without overwriting evidence."""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
runtime = root / ".runtime"
runtime.mkdir(exist_ok=True)
experiment = Path(tempfile.mkdtemp(prefix="reproduce-", dir=runtime))
for folder in ("app", "training"):
    shutil.copytree(root / "ai-service" / folder, experiment / "ai-service" / folder, ignore=shutil.ignore_patterns("__pycache__"))
(experiment / "data/raw").mkdir(parents=True)
shutil.copy2(root / "data/raw/dataset_B_05_2020.csv", experiment / "data/raw/dataset_B_05_2020.csv")
env = {**os.environ, "OPENBLAS_NUM_THREADS": "2", "OMP_NUM_THREADS": "2"}
for command in ("train", "evaluate"):
    subprocess.run([sys.executable, "-m", "training.pipeline", command], cwd=experiment / "ai-service", env=env, check=True)
print(f"Independent reproduction saved in {experiment / 'ai-service/artifacts'}")
