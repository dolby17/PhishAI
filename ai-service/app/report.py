"""Grounded report details. No trained features, rules, thresholds or predictions change."""
import numpy as np

from app.features import FEATURE_NAMES, parse_url

LABELS = dict(zip(FEATURE_NAMES, (
    "URL length", "Hostname length", "Path length", "Query length", "Fragment length",
    "Hostname dots", "Hostname hyphens", "Hostname digits", "URL digits", "At signs",
    "Percent escapes", "Slashes", "Query parameters", "IP hostname", "User information",
    "Internationalized hostname", "HTTPS scheme", "Nondefault port", "Account-related terms", "Character entropy",
), strict=True))

DETAILS = {
    "IP_HOST": ("An IP address replaces a recognizable domain name. Legitimate services can also use IP addresses.", "Verify the address with the service through an independent channel."),
    "USERINFO": ("Text before @ is user information, not the destination hostname. It can make the destination easy to misread.", "Read the actual hostname after @. Do not trust a brand name appearing before it."),
    "IDNA_HOST": ("The hostname uses internationalized encoding. This is normal for many languages, but similar-looking characters can confuse readers.", "Compare the exact hostname with the organization's independently verified address."),
    "MANY_HOST_LABELS": ("Many hostname labels can obscure which domain controls the destination. Subdomains alone do not establish ownership.", "Check the registrable domain carefully rather than trusting a familiar word in a subdomain."),
    "LONG_URL": ("A long URL can conceal important destination details. Long links are also common in legitimate applications.", "Verify the hostname and avoid relying on a familiar word buried in the path."),
    "LONG_HOST": ("A long hostname can be difficult to inspect and may contain misleading words. Length is a weak signal on its own.", "Compare the full hostname against an independently verified address."),
    "ACCOUNT_TERMS": ("Several account-related terms appear in the URL. Such terms occur in both legitimate sign-in pages and phishing links.", "For account actions, open the known official application or type its verified address yourself."),
    "MANY_ESCAPES": ("Percent encoding can make URL text harder to read. Encoding is also used legitimately.", "Avoid entering sensitive information until the destination has been independently verified."),
    "UNUSUAL_PORT": ("The URL specifies a nondefault port. Development and internal services can use these ports legitimately.", "Confirm that this port is expected for the service you intended to use."),
}


def explain_forest(bundle, vector, score):
    result = {"status": "unavailable" if score is None else "unsupported", "method": "tree_path_score_change",
              "baseline": None, "contributions": [],
              "note": "No model explanation is available for this result."}
    if score is None or bundle is None:
        return result
    model = bundle["model"]
    if not hasattr(model, "estimators_") or not all(hasattr(estimator, "tree_") for estimator in model.estimators_):
        return result
    # sklearn predicts with float32 inputs. Follow the same branches at thresholds.
    values = np.asarray(vector, dtype=np.float32)
    baseline = 0.0
    contributions = np.zeros(len(FEATURE_NAMES), dtype=float)
    try:
        for estimator in model.estimators_:
            tree = estimator.tree_
            def positive(node):
                distribution = tree.value[node][0]
                return float(distribution[1] / distribution.sum())
            node = 0
            baseline += positive(node)
            while tree.children_left[node] != tree.children_right[node]:
                feature = int(tree.feature[node])
                child = int(tree.children_left[node] if values[feature] <= tree.threshold[node] else tree.children_right[node])
                contributions[feature] += positive(child) - positive(node)
                node = child
        baseline /= len(model.estimators_)
        contributions /= len(model.estimators_)
        if abs(baseline + float(contributions.sum()) - score) > 1e-7:
            return result
        return {"status": "available", "method": "tree_path_score_change", "baseline": baseline,
                "contributions": sorted([
                    {"feature": name, "label": LABELS[name], "observed": float(vector[index]), "contribution": float(contributions[index])}
                    for index, name in enumerate(FEATURE_NAMES)
                ], key=lambda item: abs(item["contribution"]), reverse=True),
                "note": "Path-based contributions describe this forest's score for this input. Positive values raise the score; negative values lower it. Baseline plus all contributions reconstructs the model score. This is not a causal explanation or calibrated probability; correlated features and split order affect attribution."}
    except (IndexError, ValueError, TypeError, AttributeError):
        return result


def build_report(raw, features, rules, store, model_score, verdict):
    parts, hostname, is_ip = parse_url(raw)
    recommendations = ["A low score is not proof of safety. Verify important links through a trusted, independent source."]
    if verdict in ("high", "review"):
        recommendations.insert(0, "Avoid entering passwords, payment information or recovery codes through this link until verified.")
    recommendations.append("If you already entered sensitive information, use the official service to change affected credentials and contact its support.")
    return {
        "version": "report-1.0.0",
        "input": {"scheme": parts.scheme.lower(), "hostname": hostname, "hostType": "ip" if is_ip else "domain",
                  "urlLength": int(features["url_length"]), "pathLength": int(features["path_length"]),
                  "queryLength": int(features["query_length"]), "hasUserinfo": bool(features["has_userinfo"])},
        "indicators": [{"code": reason["code"], "explanation": DETAILS[reason["code"]][0], "recommendation": DETAILS[reason["code"]][1]}
                       for reason in rules["reasons"]],
        "modelExplanation": explain_forest(getattr(store, "bundle", None), [features[name] for name in FEATURE_NAMES], model_score),
        "recommendations": recommendations,
    }
