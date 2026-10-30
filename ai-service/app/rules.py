"""Heuristic observations explain this rule branch only, never model causality."""
RULE_VERSION = "rules-1.0.0"
RULES = (
    ("IP_HOST", "is_ip", lambda x: x == 1, 30, "The hostname is an IP literal."),
    ("USERINFO", "has_userinfo", lambda x: x == 1, 35, "The URL contains user information before the hostname."),
    ("IDNA_HOST", "is_punycode", lambda x: x == 1, 15, "The hostname uses internationalized domain encoding."),
    ("MANY_HOST_LABELS", "host_dots", lambda x: x >= 4, 15, "The hostname has at least five labels."),
    ("LONG_URL", "url_length", lambda x: x > 150, 20, "The URL is longer than 150 characters."),
    ("LONG_HOST", "host_length", lambda x: x > 60, 10, "The hostname is longer than 60 characters."),
    ("ACCOUNT_TERMS", "keyword_count", lambda x: x >= 2, 15, "The URL contains at least two account-related terms."),
    ("MANY_ESCAPES", "percent_count", lambda x: x >= 4, 10, "The URL contains at least four percent escapes."),
    ("UNUSUAL_PORT", "nonstandard_port", lambda x: x == 1, 10, "The port differs from the scheme's default."),
)


def analyze_rules(features: dict[str, float]) -> dict:
    reasons = [
        {"code": code, "feature": key, "observed": features[key], "weight": weight, "message": message}
        for code, key, condition, weight, message in RULES if condition(features[key])
    ]
    return {"version": RULE_VERSION, "score": min(100, sum(r["weight"] for r in reasons)) / 100,
            "scoreType": "heuristic", "reasons": reasons}
