from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.collection.models import Collection, Product


class CollectionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def by_id(self, collection_id: str) -> Collection | None:
        return await self.db.get(Collection, collection_id)

    async def by_slug(self, slug: str) -> Collection | None:
        return await self.db.scalar(select(Collection).where(Collection.slug == slug))

    async def list_collections(
        self,
        parent_id: str | None = None,
        reel_number: int | None = None,
        category: str | None = None,
        shop: str | None = None,
        search: str | None = None,
    ) -> list[Collection]:
        query = select(Collection).where(Collection.parent_id == parent_id)
        if reel_number is not None:
            query = query.where(Collection.reel_number == reel_number)
        if category:
            query = query.where(Collection.category == category)
        if shop:
            query = query.where(Collection.shop == shop)
        if search:
            query = query.where(Collection.name.ilike(f"%{search}%"))
        return list(await self.db.scalars(query.order_by(Collection.created_at.desc())))

    async def products(
        self, collection_id: str, offset: int, limit: int
    ) -> tuple[list[Product], int]:
        query = select(Product).where(Product.collection_id == collection_id)
        count = select(func.count()).select_from(Product).where(Product.collection_id == collection_id)
        total = await self.db.scalar(count) or 0
        rows = await self.db.scalars(query.order_by(Product.created_at.desc()).offset(offset).limit(limit))
        return list(rows), total
