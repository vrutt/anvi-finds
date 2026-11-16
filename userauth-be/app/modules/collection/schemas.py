from datetime import datetime, timezone
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.utils.base_schema import RequestSchema, SuccessResponse


class CollectionCreate(RequestSchema):
    name: str = Field(min_length=1, max_length=160)
    parent_id: UUID | None = None
    description: str | None = Field(default=None, max_length=10000)
    image_urls: list[HttpUrl] = Field(default_factory=list, max_length=3)
    reel_number: int | None = Field(default=None, ge=0)
    shop: str | None = Field(default=None, max_length=40)
    category: str | None = Field(default=None, max_length=120)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Name cannot be blank")
        return value.strip()


class ProductCreate(RequestSchema):
    collection_id: UUID
    image_url: HttpUrl
    url: HttpUrl
    title: str = Field(min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=10000)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Title cannot be blank")
        return value.strip()


class CollectionUpdate(RequestSchema):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    parent_id: UUID | None = None
    description: str | None = Field(default=None, max_length=10000)
    image_urls: list[HttpUrl] | None = Field(default=None, max_length=3)
    reel_number: int | None = Field(default=None, ge=0)
    shop: str | None = Field(default=None, max_length=40)
    category: str | None = Field(default=None, max_length=120)


class ProductUpdate(RequestSchema):
    collection_id: UUID | None = None
    image_url: HttpUrl | None = None
    url: HttpUrl | None = None
    title: str | None = Field(default=None, min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=10000)


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    collection_id: UUID
    image_url: str
    url: str
    title: str
    description: str | None
    created_at: datetime

    @field_validator("created_at")
    @classmethod
    def utc_created_at(cls, value: datetime) -> datetime:
        return (value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value).astimezone(timezone.utc)


class CollectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    parent_id: UUID | None
    name: str
    slug: str
    description: str | None
    image_urls: list[str]
    reel_number: int | None
    shop: str | None
    category: str | None
    created_at: datetime
    children: list["CollectionResponse"] = Field(default_factory=list)
    products: list[ProductResponse] = Field(default_factory=list)

    @field_validator("created_at")
    @classmethod
    def utc_created_at(cls, value: datetime) -> datetime:
        return (value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value).astimezone(timezone.utc)


class CollectionListSuccessResponse(SuccessResponse[list[CollectionResponse]]):
    pass


class CollectionSuccessResponse(SuccessResponse[CollectionResponse]):
    pass


class ProductListSuccessResponse(SuccessResponse[list[ProductResponse]]):
    pass


class ProductSuccessResponse(SuccessResponse[ProductResponse]):
    pass


class ProductPage(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int


class ProductPageSuccessResponse(SuccessResponse[ProductPage]):
    pass
