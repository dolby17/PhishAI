"""Shared, deterministic URL-string parsing. This module must never use the network."""
import ipaddress
import math
import re
from collections import Counter
from urllib.parse import urlsplit

import idna

FEATURE_VERSION = "lexical-1.0.0"
MAX_URL_LENGTH = 4096
KEYWORDS = ("login", "verify", "account", "secure", "update", "password", "wallet", "signin")
FEATURE_NAMES = (
    "url_length", "host_length", "path_length", "query_length", "fragment_length",
    "host_dots", "host_hyphens", "host_digits", "url_digits", "at_count",
    "percent_count", "slash_count", "query_parameters", "is_ip", "has_userinfo",
    "is_punycode", "is_https", "nonstandard_port", "keyword_count", "url_entropy",
)


class InvalidURL(ValueError):
    pass


def parse_url(raw: str):
    if not isinstance(raw, str) or not 1 <= len(raw) <= MAX_URL_LENGTH:
        raise InvalidURL("Use 1–4096 characters.")
    if any(c.isspace() or ord(c) < 32 or ord(c) == 127 for c in raw) or "\\" in raw:
        raise InvalidURL("Whitespace, controls, and backslashes are not allowed.")
    if re.search(r"%(?![0-9a-fA-F]{2})", raw):
        raise InvalidURL("Percent escapes must contain two hexadecimal digits.")
    try:
        parts = urlsplit(raw)
        if parts.scheme.lower() not in ("http", "https") or not parts.netloc or not parts.hostname:
            raise InvalidURL("Enter an absolute HTTP or HTTPS URL with a hostname.")
        host = parts.hostname.rstrip(".")
        port = parts.port
        if parts.netloc.endswith(":") or port == 0 or "%" in host:
            raise InvalidURL("Invalid hostname or port.")
        try:
            ipaddress.ip_address(host)
            ascii_host, is_ip = host.lower(), True
        except ValueError:
            ascii_host = idna.encode(host, uts46=True, std3_rules=True).decode("ascii").lower()
            if "." not in ascii_host or ascii_host.rsplit(".", 1)[1].isdigit():
                raise InvalidURL("Use a fully qualified hostname or an IP literal.")
            is_ip = False
        if len(ascii_host) > 253:
            raise InvalidURL("Hostname is too long.")
        return parts, ascii_host, is_ip
    except (ValueError, idna.IDNAError) as exc:
        raise InvalidURL("Malformed hostname, address, or port.") from exc


def extract_features(raw: str) -> dict[str, float]:
    parts, host, is_ip = parse_url(raw)
    counts = Counter(raw)
    entropy = -sum((n / len(raw)) * math.log2(n / len(raw)) for n in counts.values())
    values = (
        len(raw), len(host), len(parts.path), len(parts.query), len(parts.fragment),
        host.count("."), host.count("-"), sum(c.isdigit() for c in host),
        sum(c.isdigit() for c in raw), raw.count("@"), raw.count("%"), raw.count("/"),
        len(parts.query.split("&")) if parts.query else 0, int(is_ip),
        int(parts.username is not None), int(any(x.startswith("xn--") for x in host.split("."))),
        int(parts.scheme.lower() == "https"),
        int(parts.port is not None and parts.port != (443 if parts.scheme.lower() == "https" else 80)),
        sum(word in raw.lower() for word in KEYWORDS), entropy,
    )
    return dict(zip(FEATURE_NAMES, map(float, values), strict=True))


def feature_vector(raw: str) -> list[float]:
    values = extract_features(raw)
    return [values[name] for name in FEATURE_NAMES]
