import re
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.collection.models import Collection, Product
from app.modules.collection.repository import CollectionRepository
from app.modules.collection.schemas import CollectionCreate, CollectionUpdate, ProductCreate, ProductUpdate


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
                          image_urls=[str(url) for url in data.image_urls], reel_number=data.reel_number,
                          shop=data.shop, category=data.category)
        self.db.add(item)
        await self.db.flush()
        return item

    async def create_product(self, data: ProductCreate) -> Product:
        collection = await self.repo.by_id(str(data.collection_id))
        if not collection:
            raise ValueError("Collection was not found")
        item = Product(collection_id=str(data.collection_id), image_url=str(data.image_url), url=str(data.url),
                       title=data.title, description=data.description)
        self.db.add(item)
        await self.db.flush()
        return item

    async def update_collection(self, item: Collection, data: CollectionUpdate) -> Collection:
        changes = data.model_dump(exclude_unset=True)
        if "name" in changes:
            name = (changes["name"] or "").strip()
            if not name:
                raise ValueError("Name cannot be blank")
            changes["name"] = name
            base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "collection"
            slug, suffix = base, 2
            while (other := await self.repo.by_slug(slug)) and other.id != item.id:
                slug = f"{base}-{suffix}"
                suffix += 1
            changes["slug"] = slug
        if "parent_id" in changes:
            parent_id = str(changes["parent_id"]) if changes["parent_id"] else None
            if parent_id == item.id:
                raise ValueError("A collection cannot be its own parent")
            parent = await self.repo.by_id(parent_id) if parent_id else None
            if parent_id and parent is None:
                raise ValueError("Parent collection was not found")
            ancestor = parent
            while ancestor:
                if ancestor.id == item.id:
                    raise ValueError("A collection cannot be moved inside one of its descendants")
                ancestor = await self.repo.by_id(str(ancestor.parent_id)) if ancestor.parent_id else None
            changes["parent_id"] = parent_id
        if "image_urls" in changes:
            changes["image_urls"] = [str(url) for url in (changes["image_urls"] or [])]
        for key in ("description", "image_urls", "shop", "category"):
            if key in changes and changes[key] == "":
                changes[key] = None
        for key, value in changes.items():
            setattr(item, key, value)
        await self.db.flush()
        return item

    async def update_product(self, item: Product, data: ProductUpdate) -> Product:
        changes = data.model_dump(exclude_unset=True)
        for field in ("image_url", "url", "title"):
            if field in changes and changes[field] is None:
                raise ValueError(f"{field.replace('_', ' ').capitalize()} cannot be blank")
        if "collection_id" in changes:
            collection_id = str(changes["collection_id"]) if changes["collection_id"] else None
            if not collection_id or not await self.repo.by_id(collection_id):
                raise ValueError("Collection was not found")
            changes["collection_id"] = collection_id
        for key in ("image_url", "url"):
            if key in changes and changes[key] is not None:
                changes[key] = str(changes[key])
        if "title" in changes:
            changes["title"] = (changes["title"] or "").strip()
            if not changes["title"]:
                raise ValueError("Title cannot be blank")
        for key in ("description",):
            if key in changes and changes[key] == "":
                changes[key] = None
        for key, value in changes.items():
            setattr(item, key, value)
        await self.db.flush()
        return item

    async def collection_tree(self, item: Collection) -> Collection:
        item.children = await self.repo.list_collections(str(item.id))
        for child in item.children:
            await self.collection_tree(child)
        item.products, _ = await self.repo.products(str(item.id), 0, 100)
        return item
