from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)
API_URL = "https://api.unsplash.com/photos/random"


async def fetch_unsplash_images(query: str, page: int, per_page: int) -> list[dict]:
    _ = page
    api_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not api_key:
        logger.warning("UNSPLASH_ACCESS_KEY missing; skipping Unsplash source.")
        return []

    params = {
        "count": per_page,
        "query": query or "art",
        "client_id": api_key,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(API_URL, params=params)
            response.raise_for_status()
            payload = response.json()

        records = payload if isinstance(payload, list) else [payload]
        images: list[dict] = []
        for item in records:
            urls = item.get("urls") or {}
            image_url = urls.get("regular")
            if not image_url:
                continue
            user = item.get("user") or {}
            description = item.get("description")
            title = item.get("title") or description or item.get("alt_description") or "Untitled"
            images.append(
                {
                    "id": f"unsplash:{item.get('id')}",
                    "title": title,
                    "image_url": image_url,
                    "thumbnail_url": urls.get("thumb") or image_url,
                    "artist": user.get("name"),
                    "date": item.get("created_at"),
                    "source_name": "Unsplash",
                    "source_url": item.get("links", {}).get("html") or "https://unsplash.com",
                    "tags": [tag.get("title") for tag in (item.get("tags") or []) if tag.get("title")],
                    "description": description,
                }
            )
        return images
    except Exception:
        return []
