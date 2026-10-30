# Threat boundary and remaining risks

Assets: account password hashes, session identifiers/CSRF tokens, user-submitted URL text, model artifacts, and validity of assessment claims. Treat submissions and dataset strings as untrusted text.

| Threat | Implemented control | Limit |
| --- | --- | --- |
| SSRF / harmful destination contact | URL-string features only; fixed inference endpoint; socket/DNS traps during scanner checks; Compose internal network | Native loopback mode is not process network isolation |
| XSS / clickable malicious links | React text escaping; no submitted URL hyperlinks/previews; Helmet CSP | No formal browser security audit |
| Session theft / fixation | HttpOnly SameSite=Strict cookies; session rotation; absolute 8-hour expiry; Mongo session store; logout destruction | Secure cookies require HTTPS and explicit deployed config |
| CSRF | Exact Origin plus 256-bit session token on every mutation | Developer must use the configured origin exactly |
| Credential attacks | Scrypt N=32768/r=8/p=1 with random salt; bounded password length; generic login failure; attempt limits | No MFA, recovery, email verification, breached-password check, or distributed limit store |
| Input/resource abuse | 32 KiB body; 4,096-code-point URL; API/user limits; bounded training workers; inference timeout/response limit | No production load or denial-of-service certification |
| Data leakage | Account/session data plus minimized owner-scoped reports; no stored URLs/hostnames/path/query/userinfo text or raw-URL logs; no third-party frontend assets | URLs can be visible in browser memory and user-controlled tools |
| Artifact poisoning | Trusted local model; SHA256 check; feature/rule version checks | Joblib is executable serialization; digest is integrity metadata, not a signature |
| Mongo compromise | Loopback native process or internal Compose service; no public database port | Demo Mongo has no credentials; public deployment requires separate configuration |

Account records currently have no automated account-deletion flow. Sessions expire at 8 hours; Mongo TTL removes expired session documents asynchronously. Saved report records contain owner ID, timestamps, numeric evidence, verdicts/scores, fixed explanations, versions and limitations. Every list/detail/summary query filters by owner and excludes expired records. Individual and bulk deletion require the same Origin/CSRF checks as scanning. Records expire after 30 days; Mongo TTL cleanup is asynchronous, so application filters hide expired records immediately. Hostnames are omitted from history and JSON exports. Account deletion and storage/backups erasure remain separate future controls. Do not expose this demo publicly. Public deployment and production claims need TLS, database authentication, backups/restores, monitoring, dependency maintenance, and a separate scoped release review.
