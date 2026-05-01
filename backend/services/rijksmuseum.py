from __future__ import annotations

import httpx

PAINTINGS_URL = "https://data.rijksmuseum.nl/search/collection"


def _extract_items(payload: dict) -> list[dict]:
    if isinstance(payload.get("results"), list):
        return payload.get("results") or []
    if isinstance(payload.get("items"), list):
        return payload.get("items") or []
    if isinstance(payload.get("artObjects"), list):
        return payload.get("artObjects") or []
    graph = payload.get("@graph")
    if isinstance(graph, list):
        return graph
    return []


def _extract_image_url(item: dict) -> str | None:
    candidate = item.get("image") or item.get("image_url") or item.get("thumbnail")
    if isinstance(candidate, dict):
        return candidate.get("url") or candidate.get("@id")
    if isinstance(candidate, list) and candidate:
        first = candidate[0]
        if isinstance(first, dict):
            return first.get("url") or first.get("@id")
        if isinstance(first, str):
            return first
    if isinstance(candidate, str):
        return candidate
    return None


def _extract_artist(item: dict) -> str | None:
    maker = item.get("maker") or item.get("artist") or item.get("principalOrFirstMaker")
    if isinstance(maker, dict):
        return maker.get("name") or maker.get("label")
    if isinstance(maker, list) and maker:
        first = maker[0]
        if isinstance(first, dict):
            return first.get("name") or first.get("label")
        if isinstance(first, str):
            return first
    if isinstance(maker, str):
        return maker
    return None


async def _fetch_payload(client: httpx.AsyncClient, query: str, with_type: bool) -> dict | None:
    params = {
        "q": query or "art",
        "format": "json",
    }
    if with_type:
        params["type"] = "painting"
    try:
        response = await client.get(PAINTINGS_URL, params=params)
        response.raise_for_status()
        return response.json()
    except Exception:
        return None


async def fetch_rijksmuseum_images(query: str, page: int, per_page: int) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = await _fetch_payload(client, query, with_type=True)
            if payload is None:
                payload = await _fetch_payload(client, query, with_type=False)
            if payload is None:
                return []

        items = _extract_items(payload)
        start = max(0, page) * per_page
        end = start + per_page
        selected = items[start:end]

        images: list[dict] = []
        for item in selected:
            image_url = _extract_image_url(item)
            if not image_url:
                continue
            record_id = item.get("id") or item.get("@id") or item.get("objectNumber") or image_url
            title = item.get("title") or item.get("name") or "Untitled"
            source_url = item.get("url") or item.get("@id") or "https://www.rijksmuseum.nl"
            images.append(
                {
                    "id": f"rijksmuseum:{record_id}",
                    "title": title,
                    "image_url": image_url,
                    "thumbnail_url": image_url,
                    "artist": _extract_artist(item),
                    "date": item.get("date") or item.get("objectDate"),
                    "source_name": "Rijksmuseum",
                    "source_url": source_url,
                    "tags": [],
                    "description": item.get("description"),
                }
            )
        return images
    except Exception:
        return []
