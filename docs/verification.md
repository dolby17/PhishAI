# Verification record — 30 October 2026

| Check | Actual result |
| --- | --- |
| `npm run build` | Passed client TypeScript/Vite bundle and server TypeScript compilation |
| Clean temporary `npm ci --ignore-scripts --no-audit` + `npm run build` | Passed from lockfile in an independent temporary directory |
| `npm test` | 11 passed, 0 failed; real temporary MongoDB, mocked inference only for orchestration failure cases |
| `cd ai-service && ../.venv/bin/python -m pytest -q` | 34 passed; one upstream Starlette/httpx deprecation warning |
| Independent `scripts/reproduce.py` experiment | Same model version, split memberships, deployment choice, and all final method metrics |
| Real `scripts/smoke.py` HTTP flow | Passed built HTML/assets, registration, authenticated real model/rules, malformed/oversized errors, isolated anonymous session, logout and login |
| Stop all demo services, restart, `scripts/smoke.py --resume` | Passed login to the previously created account and full real-inference flow after restart |
| `npm audit` | 0 known advisories reported across checked JavaScript dependencies |
| `pip-audit -r ai-service/requirements.lock --no-deps --disable-pip` | 40 pinned Python packages checked; 0 known advisories reported |
| Staged diff whitespace check, excluding preserved manuscript | Passed; original manuscript retains its pre-existing Markdown line-ending spaces |
| Browser walkthrough/screenshots | Unavailable: browser access host failed both inventory and open attempts |
| Docker Compose startup | Not run: Docker is not installed |

Scanner fixtures cover HTTP/HTTPS, malformed schemes/ports/IDNA, whitespace/controls, IPv4/IPv6, Unicode/punycode, userinfo, fragment/query, excessive length, and all nine rule triggers. Tests block scanner `getaddrinfo`, connection creation and socket connect calls while evaluating valid and invalid fixtures. Source review found only `urllib.parse` in URL analysis, not destination I/O. Data acquisition uses a separate fixed publisher URL. Static checks and tests are evidence within this scope, not proof that arbitrary future code cannot use the network.

Server checks cover password hashing/salts, generic login failure, session rotation, expiry, logout invalidation, cookie attributes, CSRF/origin rejection, protected scanning, request bounds, upstream invalid schema/request-ID mismatch/timeout/error/oversized response, per-user limits, account attempt limits, and absence of scan persistence. Live HTTP checks additionally exercise the compiled production entry point and actual FastAPI model, catching and resolving a compiled-path startup bug.

The ASGI harness stalled under sandbox socket restrictions; a controlled run with local socket access passed. Final evaluation validated code/artifact/split freeze hashes before opening test results. Independent reproduction did not change the published artifact or holdout.

[HTTP evidence](evidence/http-smoke.json) records ten warm synthetic requests, concurrency one, zero failures, p50 16.40 ms and nearest-rank p95 27.93 ms on this host. This includes Express, Mongo session lookup, internal HTTP and scanner computation; it excludes browser rendering, concurrent load and destination I/O (none occurs). [Model-only timings](../ai-service/artifacts/final-evaluation.json) use a separate documented scope. These are local measurements, not production latency promises.

Remaining validation: actual visual/accessibility walkthrough on desktop/mobile, fresh Docker startup and container-boundary checks, public-deployment release controls, larger load/failure testing, and broader contemporary model evaluation. R7/R8 remain unimplemented; R5/R9/R10 retain explicit limitations in the requirement register. Known-advisory scans do not constitute a formal security audit.
