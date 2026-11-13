import re
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.collection.models import Collection, Product
from app.modules.collection.repository import CollectionRepository
from app.modules.collection.schemas import CollectionCreate, ProductCreate


class CollectionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CollectionRepository(db)

    async def create_collection(self, data: CollectionCreate) -> Collection:
        parent_id = str(data.parent_id) if data.parent_id else None
        if parent_id and not await self.repo.by_id(parent_id):
            raise ValueError("Parent collection was not found")
        base = re.sub(r"[^a-z0-9]+", "-", data.name.lower()).strip("-") or "collection"
        slug = base
        suffix = 2
        while await self.repo.by_slug(slug):
            slug = f"{base}-{suffix}"
            suffix += 1
        item = Collection(name=data.name, slug=slug, parent_id=parent_id, description=data.description,
                          image_url=str(data.image_url) if data.image_url else None)
        self.db.add(item)
        await self.db.flush()
        return item

    async def create_product(self, data: ProductCreate) -> Product:
        collection = await self.repo.by_id(str(data.collection_id))
        if not collection:
            raise ValueError("Collection was not found")
        item = Product(collection_id=str(data.collection_id), image_url=str(data.image_url), url=str(data.url),
                       title=data.title, description=data.description, shop=data.shop, category=data.category)
        self.db.add(item)
        await self.db.flush()
        return item

    async def collection_tree(self, item: Collection) -> Collection:
        item.children = await self.repo.list(str(item.id))
        for child in item.children:
            await self.collection_tree(child)
        item.products, _ = await self.repo.products(str(item.id), None, None, 0, 100)
        return item
