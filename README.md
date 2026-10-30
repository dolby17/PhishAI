# PhishAI

Explainable phishing-risk screening from URL strings. A local review build with React, Express, MongoDB, and FastAPI. Project owner: **Veer Pratap Shekhar**.

The scanner never resolves or visits submitted destinations. It reports separate heuristic and trained-model scores. A low result does not establish safety. Scores are not calibrated probabilities.

## Start the local demo

Prerequisites: Node.js 24 or newer, Python 3.11, and internet access for initial dependency installation and MongoDB binary download. The native launcher targets Linux x86-64 with OpenSSL 3; other platforms should use Docker Compose. No global packages or GPU setup are required.

```bash
npm ci
python3.11 -m venv .venv
.venv/bin/python -m pip install -r ai-service/requirements.lock
npm run build
npm run demo
```

Open **http://127.0.0.1:3000**. Create an account using an email-shaped identifier and a password of 12–128 characters. Email verification and password recovery are not implemented; no emails are sent. Use demonstration credentials, not an existing password. A trained model is included with metadata and a verified digest. Missing/invalid artifacts produce an explicit rules-only result.

The demo launcher starts a real MongoDB 8.0.16 process through `mongodb-memory-server`, a loopback-only FastAPI process, and Express serving the built UI. It stores local account/session data and a random session secret in ignored `.runtime/`. MongoDB binaries are cached in ignored `.tools/`. Accounts survive restarts. Press Ctrl+C to stop all services. Remove `.runtime/` only when you intentionally want to erase demo accounts and sessions. Submitted URLs and results are not persisted.

On this development machine Python 3.11 is available at `/home/veer/.pyenv/versions/3.11.9/bin/python`. The system `python3` has no pip; use the 3.11 interpreter to create the virtual environment.

## Docker Compose

```bash
cp .env.example .env
# Replace SESSION_SECRET in .env with this command's random output:
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
docker compose up --build
```

The application binds `127.0.0.1:3000`. MongoDB and FastAPI have no published ports and share an internal runtime network. Docker was unavailable in the build environment: configuration was reviewed but container startup is not yet validated. This is a local demo configuration, with HTTP cookies and an isolated database without authentication. Public deployment requires a separate release review, TLS, secure cookies, authenticated database access, and operational controls.

## Development and checks

Use the built demo for the verified setup. For Vite development, start MongoDB and FastAPI separately, export the values from `.env.example` with `APP_ORIGIN=http://127.0.0.1:5173`, then run `npm run dev:server` and `npm run dev:client` in separate terminals. Vite proxies application requests to Express. The normal demo launcher fixes its origin to port 3000, so authenticated Vite mutations require the separately configured API.

```bash
npm run check
cd ai-service
../.venv/bin/python -m pytest -q
cd ..
```

Integration tests start a real temporary MongoDB process. A restricted execution environment must allow local socket binding and the ASGI test harness's socket-pair operations. Tests trap scanner DNS/connection attempts; network-enabled dataset acquisition is a separate preparation operation.

## Data and reproducibility

The reviewed research CSV is by Hannousse and Yahiouche: [Web page phishing detection, Mendeley Data V3](https://data.mendeley.com/datasets/c2gw7fy2j4/3), DOI `10.17632/c2gw7fy2j4.3`, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Only its raw `url` and `status` columns are used. All supplied precomputed features are discarded. Raw data and split membership stay out of Git. The derived model and aggregate results include attribution in [the data manifest](docs/data-manifest.md).

```bash
.venv/bin/python scripts/fetch-data.py
.venv/bin/python scripts/reproduce.py
```

Reproduction creates a separate ignored experiment directory and runs training then frozen evaluation. It does not overwrite the published holdout or deployment artifact. Do not tune against the included final-test report: further development requires a new untouched confirmatory holdout.

Current historical grouped-test result: 79.43% accuracy, macro-F1 0.7943, FPR 25.89%, phishing recall 85.38% on 1,653 eligible URLs. These are preliminary single-corpus results, not contemporary protection claims. See [model card](docs/model-card.md) and machine-readable [evaluation](ai-service/artifacts/final-evaluation.json).

## Review scope

See [requirements and status](docs/requirements.md), [verification evidence](docs/verification.md), [architecture](docs/architecture.md), and [five-minute demo](docs/demo-script.md). Saved history, dashboard, retention/deletion, broader evaluation, and final academic packaging remain post-review work. No percentage completion is claimed without supervisor agreement on scope.

Git author is configured locally as Veer Pratap Shekhar `<shekharveer17@gmail.com>`. This build used Codex assistance; commit metadata records project attribution, not independent proof of manual authorship. Original planning documents and manuscript remain preserved.
