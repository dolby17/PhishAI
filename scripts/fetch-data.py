"""Download only the reviewed publisher file, never any URL inside it."""
import hashlib
import urllib.request
from pathlib import Path

URL = "https://data.mendeley.com/public-files/datasets/c2gw7fy2j4/files/575316f4-ee1d-453e-a04f-7b950915b61b/file_downloaded"
EXPECTED = "21093e2902e5441c86a6daf95e86e7c332046e477fdf109a579d7bd81e586d6c"
target = Path(__file__).resolve().parents[1] / "data/raw/dataset_B_05_2020.csv"
target.parent.mkdir(parents=True, exist_ok=True)
if not target.exists():
    with urllib.request.urlopen(URL, timeout=60) as response:
        content = response.read(5_000_001)
    if len(content) > 5_000_000 or hashlib.sha256(content).hexdigest() != EXPECTED:
        raise RuntimeError("Publisher file size/digest mismatch.")
    target.write_bytes(content)
if hashlib.sha256(target.read_bytes()).hexdigest() != EXPECTED:
    raise RuntimeError("Existing dataset digest mismatch.")
print(f"Verified {target.name}: {EXPECTED}")
