from __future__ import annotations

import asyncio
import random

import httpx

from models.image import Image

SEARCH_URL = "https://collectionapi.metmuseum.org/public/collection/v1/search"
OBJECT_URL = "https://collectionapi.metmuseum.org/public/collection/v1/objects/{object_id}"
TIMEOUT_SECONDS = 10.0


def _map_met_object(obj: dict) -> Image | None:
    image_url = obj.get("primaryImage") or ""
    if not image_url:
        return None
    tags = [tag.get("term", "") for tag in (obj.get("tags") or []) if tag.get("term")]
    object_id = obj.get("objectID")
    return Image(
        id=f"met:{object_id}",
        title=obj.get("title") or "Untitled",
        source_name="The MET",
        source_url=f"https://www.metmuseum.org/art/collection/search/{object_id}",
        image_url=image_url,
        thumbnail_url=obj.get("primaryImageSmall") or image_url,
        artist=obj.get("artistDisplayName") or None,
        date=obj.get("objectDate") or None,
        tags=tags,
        category=obj.get("department") or None,
        description=obj.get("creditLine") or None,
        width=obj.get("primaryImageWidth"),
        height=obj.get("primaryImageHeight"),
    )


async def _fetch_object(client: httpx.AsyncClient, object_id: int) -> Image | None:
    try:
        response = await client.get(OBJECT_URL.format(object_id=object_id))
        response.raise_for_status()
        return _map_met_object(response.json())
    except Exception:
        return None


async def fetch_met_images(query: str, page: int, per_page: int) -> list[Image]:
    params = {
        "q": query or "art",
        "hasImages": "true",
        "isPublicDomain": "true",
    }
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.get(SEARCH_URL, params=params)
            response.raise_for_status()
            object_ids: list[int] = response.json().get("objectIDs") or []
            if not object_ids:
                return []

            random.shuffle(object_ids)
            start = max(0, page) * per_page
            end = start + (per_page * 4)
            selected_ids = object_ids[start:end]
            if not selected_ids:
                return []

            tasks = [_fetch_object(client, object_id) for object_id in selected_ids]
            objects = await asyncio.gather(*tasks, return_exceptions=True)

            images: list[Image] = []
            for item in objects:
                if isinstance(item, Exception) or item is None:
                    continue
                images.append(item)
            return images[:per_page]
    except Exception:
        return []
