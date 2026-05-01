from __future__ import annotations

import time

from models.image import Image


class ImageCache:
    def __init__(self) -> None:
        self._cache: dict[str, list[Image]] = {}
        self._clicks: dict[str, int] = {}
        self._ttl = 3600
        self._timestamps: dict[str, float] = {}

    def is_expired(self, key: str) -> bool:
        ts = self._timestamps.get(key)
        if ts is None:
            return True
        return (time.time() - ts) > self._ttl

    def get(self, key: str) -> list[Image] | None:
        if key not in self._cache or self.is_expired(key):
            self._cache.pop(key, None)
            self._timestamps.pop(key, None)
            return None

        images = self._cache[key]
        hydrated: list[Image] = []
        for image in images:
            click_count = self.get_click_count(image.id)
            if hasattr(image, "model_copy"):
                hydrated.append(image.model_copy(update={"click_count": click_count}))
            else:
                hydrated.append(image.copy(update={"click_count": click_count}))
        return hydrated

    def set(self, key: str, images: list[Image]) -> None:
        self._cache[key] = images
        self._timestamps[key] = time.time()

    def record_click(self, image_id: str) -> None:
        self._clicks[image_id] = self._clicks.get(image_id, 0) + 1

    def get_click_count(self, image_id: str) -> int:
        return self._clicks.get(image_id, 0)
