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

    async def list(self, parent_id: str | None = None) -> list[Collection]:
        return list(await self.db.scalars(select(Collection).where(Collection.parent_id == parent_id).order_by(Collection.created_at.desc())))

    async def products(self, collection_id: str, category: str | None, shop: str | None, offset: int, limit: int) -> tuple[list[Product], int]:
        query = select(Product).where(Product.collection_id == collection_id)
        count = select(func.count()).select_from(Product).where(Product.collection_id == collection_id)
        if category:
            query, count = query.where(Product.category == category), count.where(Product.category == category)
        if shop:
            query, count = query.where(Product.shop == shop), count.where(Product.shop == shop)
        total = await self.db.scalar(count) or 0
        rows = await self.db.scalars(query.order_by(Product.created_at.desc()).offset(offset).limit(limit))
        return list(rows), total
