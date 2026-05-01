from __future__ import annotations

import asyncio
import os
import random
from typing import Awaitable, Callable

from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel

from cache.store import ImageCache
from models.image import Image
from services.harvard import fetch_harvard_images
from services.met import fetch_met_images
from services.rijksmuseum import fetch_rijksmuseum_images
from services.unsplash import fetch_unsplash_images

load_dotenv()

router = APIRouter()
cache = ImageCache()

SourceFetcher = Callable[[str, int, int], Awaitable[list[Image | dict]]]
SOURCE_FETCHERS: dict[str, SourceFetcher] = {
    "met": fetch_met_images,
    "rijksmuseum": fetch_rijksmuseum_images,
    "unsplash": fetch_unsplash_images,
    "harvard": fetch_harvard_images,
}


def _parse_sources(sources: str) -> list[str]:
    if sources == "all":
        return list(SOURCE_FETCHERS.keys())
    parsed = [source.strip().lower() for source in sources.split(",")]
    selected = [source for source in parsed if source in SOURCE_FETCHERS]
    return selected or list(SOURCE_FETCHERS.keys())


def _to_image(item: Image | dict) -> Image | None:
    if isinstance(item, Image):
        return item
    if not isinstance(item, dict):
        return None

    image_url = item.get("image_url")
    if not image_url:
        return None
    source_name = item.get("source_name") or "Unknown"
    image_id = item.get("id") or f"{source_name.lower()}:{image_url}"
    return Image(
        id=str(image_id),
        title=str(item.get("title") or "Untitled"),
        source_name=str(source_name),
        source_url=str(item.get("source_url") or ""),
        image_url=str(image_url),
        thumbnail_url=str(item.get("thumbnail_url") or image_url),
        artist=item.get("artist"),
        date=item.get("date"),
        tags=[str(tag) for tag in (item.get("tags") or [])],
        category=item.get("category"),
        description=item.get("description"),
        width=item.get("width"),
        height=item.get("height"),
    )


def _dedupe_by_image_url(images: list[Image]) -> list[Image]:
    deduped: dict[str, Image] = {}
    for image in images:
        if image.image_url not in deduped:
            deduped[image.image_url] = image
    output = list(deduped.values())
    random.shuffle(output)
    return output


class ClickPayload(BaseModel):
    query: str | None = None


@router.get("/images")
async def get_images(
    q: str = "art",
    page: int = 0,
    per_page: int = 16,
    sources: str = "all",
    category: str | None = None,
) -> dict[str, object]:
    selected_sources = _parse_sources(sources)
    cache_key = f"{q}:{page}:{sources}"

    cached = cache.get(cache_key)
    if cached is not None:
        images = cached
        if category:
            category_lower = category.lower()
            images = [
                img
                for img in images
                if category_lower in [tag.lower() for tag in img.tags]
                or (img.category and category_lower in img.category.lower())
            ]
        return {
            "images": [image.model_dump() for image in images[:per_page]],
            "total": len(images),
            "page": page,
            "sources_used": selected_sources,
        }

    tasks = [
        SOURCE_FETCHERS[source](q, page, per_page)
        for source in selected_sources
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    merged: list[Image] = []
    for result in results:
        if isinstance(result, Exception):
            continue
        for raw_item in result:
            image = _to_image(raw_item)
            if image is not None:
                merged.append(image)

    hydrated: list[Image] = []
    for image in merged:
        click_count = cache.get_click_count(image.id)
        if hasattr(image, "model_copy"):
            hydrated.append(image.model_copy(update={"click_count": click_count}))
        else:
            hydrated.append(image.copy(update={"click_count": click_count}))

    if category:
        category_lower = category.lower()
        hydrated = [
            img
            for img in hydrated
            if category_lower in [tag.lower() for tag in img.tags]
            or (img.category and category_lower in img.category.lower())
        ]

    ordered = _dedupe_by_image_url(hydrated)
    limited = ordered[:per_page]
    cache.set(cache_key, limited)

    return {
        "images": [image.model_dump() for image in limited],
        "total": len(ordered),
        "page": page,
        "sources_used": selected_sources,
    }


@router.post("/images/{image_id}/click")
async def record_image_click(image_id: str, payload: ClickPayload | None = None) -> dict:
    _ = payload.query if payload else None
    cache.record_click(image_id)
    return {"success": True, "click_count": cache.get_click_count(image_id)}


@router.get("/images/sources")
async def get_sources() -> dict:
    keyed_sources = {
        "met": True,
        "rijksmuseum": True,
        "unsplash": bool(os.getenv("UNSPLASH_ACCESS_KEY")),
        "harvard": bool(os.getenv("HARVARD_API_KEY")),
    }
    return {
        "sources": [
            {"name": name, "configured": configured}
            for name, configured in keyed_sources.items()
        ]
    }


@router.get("/health")
async def health() -> dict:
    source_status = {
        "met": True,
        "rijksmuseum": True,
        "unsplash": bool(os.getenv("UNSPLASH_ACCESS_KEY")),
        "harvard": bool(os.getenv("HARVARD_API_KEY")),
    }
    return {"status": "ok", "sources": source_status}
