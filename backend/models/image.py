from pydantic import BaseModel, Field


class Image(BaseModel):
    id: str
    title: str
    source_name: str
    source_url: str
    image_url: str
    thumbnail_url: str
    artist: str | None = None
    date: str | None = None
    tags: list[str] = Field(default_factory=list)
    category: str | None = None
    description: str | None = None
    width: int | None = None
    height: int | None = None
    click_count: int = 0
