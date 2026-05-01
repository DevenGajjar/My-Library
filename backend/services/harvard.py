from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)
API_URL = "https://api.harvardartmuseums.org/object"


async def fetch_harvard_images(query: str, page: int, per_page: int) -> list[dict]:
    api_key = os.getenv("HARVARD_API_KEY")
    if not api_key:
        logger.warning("HARVARD_API_KEY missing; skipping Harvard source.")
        return []

    params = {
        "apikey": api_key,
        "keyword": query or "art",
        "hasimage": 1,
        "size": per_page,
        "page": max(1, page + 1),
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(API_URL, params=params)
            response.raise_for_status()
            records = response.json().get("records") or []

        images: list[dict] = []
        for record in records:
            primary_image = record.get("primaryimageurl")
            if not primary_image:
                continue
            people = record.get("people") or []
            preview_images = record.get("images") or []
            thumbnail_url = (
                (preview_images[0].get("baseimageurl") if preview_images and preview_images[0] else None)
                or primary_image
            )
            artist = people[0].get("displayname") if people else None
            images.append(
                {
                    "id": f"harvard:{record.get('id')}",
                    "title": record.get("title") or "Untitled",
                    "image_url": primary_image,
                    "thumbnail_url": thumbnail_url,
                    "artist": artist,
                    "date": record.get("dated"),
                    "source_name": "Harvard Art Museums",
                    "source_url": record.get("url") or "https://harvardartmuseums.org",
                    "tags": [],
                    "category": record.get("division"),
                    "description": record.get("description"),
                }
            )
        return images
    except Exception:
        return []
