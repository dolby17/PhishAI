# Verification record — 30 October 2026

| Check | Actual result |
| --- | --- |
| `npm run build` | Passed client TypeScript/Vite bundle and server TypeScript compilation |
| Clean temporary `npm ci --ignore-scripts --no-audit` + `npm run build` | Passed from lockfile in an independent temporary directory |
| `npm test` | 16 passed, 0 failed; real temporary MongoDB, mocked inference only for orchestration failure cases |
| `cd ai-service && ../.venv/bin/python -m pytest -q` | 37 passed; one upstream Starlette/httpx deprecation warning |
| Independent `scripts/reproduce.py` experiment | Same model version, split memberships, deployment choice, and all final method metrics |
| Real `scripts/smoke.py` HTTP flow | Passed built HTML/assets, registration, authenticated real model/rules, malformed/oversized errors, isolated anonymous session, logout and login |
| Stop all demo services, restart, `scripts/smoke.py --resume` | Passed login to the previously created account, opening its pre-restart saved report, real inference, dashboard/history and deletion flows |
| `npm audit` | 0 known advisories reported across checked JavaScript dependencies |
| `pip-audit -r ai-service/requirements.lock --no-deps --disable-pip` | 40 pinned Python packages checked; 0 known advisories reported |
| Staged diff whitespace check, excluding preserved manuscript | Passed; original manuscript retains its pre-existing Markdown line-ending spaces |
| Browser walkthrough/screenshots | Passed approved native headless Firefox 159 via Mozilla WebDriver 0.37.1: 24 named checks, desktop 1366×900 and mobile 375×812; five real screenshots |
| Docker Compose startup | Not run: Docker is not installed |

Scanner fixtures cover HTTP/HTTPS, malformed schemes/ports/IDNA, whitespace/controls, IPv4/IPv6, Unicode/punycode, userinfo, fragment/query, excessive length, and all nine rule triggers. Tests block scanner `getaddrinfo`, connection creation and socket connect calls while evaluating valid and invalid fixtures. Source review found only `urllib.parse` in URL analysis, not destination I/O. Data acquisition uses a separate fixed publisher URL. Static checks and tests are evidence within this scope, not proof that arbitrary future code cannot use the network.

Server checks cover password hashing/salts, generic login failure, session rotation, expiry, logout invalidation, cookie attributes, CSRF/origin rejection, protected scanning, request bounds, upstream invalid schema/request-ID mismatch/timeout/error/oversized response, per-user limits, account attempt limits, owner-scoped minimized scan persistence, pagination bounds, dashboard counts, single/bulk deletion, CSRF/origin on deletion, TTL-index configuration and immediate logical expiry filtering. Live HTTP checks additionally exercise the compiled production entry point and actual FastAPI model, catching and resolving a compiled-path startup bug.

The ASGI harness stalled under sandbox socket restrictions; a controlled run with local socket access passed. Final evaluation validated code/artifact/split freeze hashes before opening test results. Independent reproduction did not change the published artifact or holdout.

[HTTP evidence](evidence/http-smoke.json) records ten warm synthetic requests, concurrency one, zero failures, p50 23.62 ms and nearest-rank p95 24.67 ms on this host. This includes Express, Mongo session lookup, internal HTTP, scanner computation/explanations and minimized report persistence; it excludes browser rendering, concurrent load and destination I/O (none occurs). [Model-only timings](../ai-service/artifacts/final-evaluation.json) use a separate documented scope. These are local measurements, not production latency promises.

Remaining validation: formal accessibility audit, additional browsers/devices, actual system print dialog/PDF output, fresh Docker startup and container-boundary checks, public-deployment release controls, larger load/failure testing, and broader contemporary model evaluation. R7/R8/R9 are implemented and validated in the documented scope. R5 and R10 remain partial. Known-advisory scans do not constitute a formal security audit.

Detailed report checks verify that all model contributions reconstruct the existing classifier score, rule details correspond to real triggered rules, raw credentials/query/fragment text is never returned, and stored/exported hostname values are omitted. The original trained artifact, features/rules/training code and threshold hashes still match the published selection freeze. A focused cavecrew diff review reported no actionable findings; this is not a formal security audit.


## Actual browser evidence

The browser connector was unavailable. With explicit user approval, `npm run test:browser` used installed Firefox 159 in a fresh temporary profile through the standard WebDriver/BiDi APIs and a checksum-verified Mozilla geckodriver. Separate Playwright/Selenium bundle downloads were abandoned; unused packages were removed and node_modules restored from the unchanged lockfile. No extra browser package is needed to reproduce the checked path.

[Browser results](evidence/browser-check.json) cover the real application: registration/confirmation, sign-in/out, invalid input without a verdict, actual model inference, rule details, model contribution table, private saved reports/dashboard, delete confirmation/cancellation, a fresh minimized JSON download with all contributions, result focus, keyboard skip link, and mobile layout. No uncaught JavaScript error or external application request was observed. Inline data fonts are local bytes and are not counted as external network access. Printing expanded content was checked; the native system print dialog and generated PDF remain unverified.

Actual screenshots: [desktop](evidence/ui-desktop.png), [detailed report](evidence/ui-report-desktop.png), [mobile scanner](evidence/ui-mobile.png), [mobile history](evidence/ui-history-mobile.png), [mobile report](evidence/ui-report-mobile.png). Screens contain synthetic review accounts and reserved-domain inputs. They were visually inspected; no mock screen substitutes for a missing feature.
