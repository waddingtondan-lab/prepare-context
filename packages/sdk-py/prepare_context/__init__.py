"""Prepare Context Python SDK — HTTP client for scrub + compress API."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Mapping, MutableMapping, Optional, Sequence, Union

DEFAULT_BASE_URL = "https://prepare.plaintools.vip"

PrepareMode = str  # "tool" | "history" | "docs"


def prepare_context(
    raw: str,
    budget_tokens: int,
    mode: PrepareMode = "tool",
    *,
    schema: Optional[Union[Mapping[str, Any], Sequence[str]]] = None,
    keep: Optional[Sequence[str]] = None,
    target_model: str = "generic",
    base_url: str = DEFAULT_BASE_URL,
    timeout: float = 60.0,
) -> dict[str, Any]:
    """Call POST /v1/prepare and return the savings-receipt response.

    For local demos, pass base_url="http://127.0.0.1:8787".
    Production branding host: https://prepare.plaintools.vip
    """
    body: MutableMapping[str, Any] = {
        "raw": raw,
        "budget_tokens": budget_tokens,
        "mode": mode,
        "target_model": target_model,
    }
    if schema is not None:
        body["schema"] = schema
    if keep is not None:
        body["keep"] = list(keep)

    url = base_url.rstrip("/") + "/v1/prepare"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"prepare_context HTTP {e.code}: {detail}") from e


__all__ = ["prepare_context", "DEFAULT_BASE_URL"]
