"""Exercise the running local stack with synthetic inputs; never visit submitted URLs."""
import http.cookiejar
import json
import re
import secrets
import statistics
import sys
import os
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "http://127.0.0.1:3000"
ROOT = Path(__file__).resolve().parents[1]
RESUME = "--resume" in sys.argv
PROBE = ROOT / ".runtime/restart-probe.json"


class BrowserSession:
    def __init__(self):
        self.cookies = http.cookiejar.CookieJar()
        self.client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))
        self.csrf = None

    def call(self, route, body=None, method=None):
        headers = {"Origin": BASE}
        if self.csrf:
            headers["X-CSRF-Token"] = self.csrf
        data = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(body).encode()
        req = urllib.request.Request(BASE + route, data=data, headers=headers, method=method or ("POST" if data is not None else "GET"))
        try:
            response = self.client.open(req, timeout=10)
        except urllib.error.HTTPError as exc:
            response = exc
        raw = response.read()
        try:
            value = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            value = raw.decode()
        return response.status, value, response.headers


user = BrowserSession()
status, health, _ = user.call("/health")
assert status == 200 and health["model"] == "ready", health
status, html, _ = user.call("/")
assert status == 200 and "PhishAi" in html
for asset in re.findall(r'(?:src|href)="(/assets/[^\"]+)"', html):
    assert user.call(asset)[0] == 200
status, current, headers = user.call("/api/v1/auth/session")
assert status == 200 and current["user"] is None
assert "HttpOnly" in headers["Set-Cookie"] and "SameSite=Strict" in headers["Set-Cookie"]
user.csrf = current["csrfToken"]
assert user.call("/api/v1/scans", {"url": "https://example.com/"})[0] == 401
if RESUME:
    probe = json.loads(PROBE.read_text())
    email, password = probe["email"], probe["password"]
else:
    email = "smoke-" + secrets.token_hex(5) + "@example.test"
    password = secrets.token_urlsafe(24)
status, created, _ = user.call("/api/v1/auth/login" if RESUME else "/api/v1/auth/register", {"email": email, "password": password})
assert status == (200 if RESUME else 201), created
user.csrf = created["csrfToken"]
status, first, _ = user.call("/api/v1/scans", {"url": "https://example.com/docs"})
assert status == 200 and first["model"]["status"] == "available" and first["mode"] == "ml", first
assert first["evidence"]["destinationContacted"] is False
status, second, _ = user.call("/api/v1/scans", {"url": "http://review@example.test:8080/account/login/verify"})
assert status == 200 and len(second["rules"]["reasons"]) == 3
assert second["rules"]["score"] == 0.6
for raw in ["javascript:alert(1)", "https://example.test:0/", "https://bad_label.example/", "https://example.test/" + "x" * 4096]:
    status, invalid, _ = user.call("/api/v1/scans", {"url": raw})
    assert status == 400 and "verdict" not in invalid
durations = []
for _ in range(10):
    started = time.perf_counter()
    assert user.call("/api/v1/scans", {"url": "https://example.com/docs"})[0] == 200
    durations.append((time.perf_counter() - started) * 1000)
other = BrowserSession()
_, other_session, _ = other.call("/api/v1/auth/session")
assert other_session["user"] is None
assert other_session["csrfToken"] != user.csrf
assert user.call("/api/v1/auth/logout", method="POST")[0] == 204
_, anonymous, _ = user.call("/api/v1/auth/session")
assert anonymous["user"] is None
user.csrf = anonymous["csrfToken"]
status, signed_in, _ = user.call("/api/v1/auth/login", {"email": email, "password": password})
assert status == 200
user.csrf = signed_in["csrfToken"]
assert user.call("/api/v1/auth/logout", method="POST")[0] == 204
ordered = sorted(durations)
report = {"checkedAt": datetime.now(timezone.utc).isoformat(), "health": health,
          "passed": ["built HTML/assets", "persisted account login after restart" if RESUME else "Mongo-backed registration", "separate anonymous session", "authenticated real inference",
                     "grounded rule observations", "malformed and oversized URL errors", "logout", "login after logout"],
          "endToEndLatency": {"input": "synthetic https://example.com/docs", "scope": "warm HTTP Express + session MongoDB + FastAPI features/model/rules; excludes browser rendering",
              "requests": 10, "concurrency": 1, "failures": 0, "p50Ms": statistics.median(durations), "p95MsNearestRank": ordered[9]},
          "restartPersistence": RESUME,
          "browserVisualReview": "not run: browser host unavailable"}
if RESUME:
    PROBE.unlink()
else:
    PROBE.parent.mkdir(exist_ok=True)
    with os.fdopen(os.open(PROBE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "w") as handle:
        json.dump({"email": email, "password": password}, handle)
target = ROOT / "docs/evidence/http-smoke.json"
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
