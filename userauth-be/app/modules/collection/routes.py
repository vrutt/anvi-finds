from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_async_db
from app.modules.collection.repository import CollectionRepository
from app.modules.collection.schemas import (CollectionCreate, CollectionListSuccessResponse, CollectionSuccessResponse,
    ProductCreate, ProductPageSuccessResponse, ProductSuccessResponse)
from app.modules.collection.models import Product
from app.modules.collection.service import CollectionService
from app.modules.user.schemas import RoleType
from app.security.dependencies import RequireRoles
from app.modules.user.models import User

router = APIRouter()
Db = Annotated[AsyncSession, Depends(get_async_db, scope="function")]
Admin = Annotated[User, Depends(RequireRoles(RoleType.Admin))]


@router.get("/collections", response_model=CollectionListSuccessResponse)
async def list_collections(db: Db, parent_id: str | None = None):
    service = CollectionService(db)
    rows = await service.repo.list(parent_id)
    for item in rows:
        await service.collection_tree(item)
    return {"success": True, "message": "Collections loaded", "data": rows}


@router.get("/collections/{slug}", response_model=CollectionSuccessResponse)
async def get_collection(slug: str, db: Db):
    item = await CollectionRepository(db).by_slug(slug)
    if not item:
        raise HTTPException(status_code=404, detail="Collection was not found")
    return {"success": True, "message": "Collection loaded", "data": await CollectionService(db).collection_tree(item)}


@router.get("/collections/{slug}/products", response_model=ProductPageSuccessResponse)
async def list_products(slug: str, db: Db, category: str | None = None, shop: str | None = None,
                        page: int = Query(1, ge=1), page_size: int = Query(12, ge=1, le=60)):
    collection = await CollectionRepository(db).by_slug(slug)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection was not found")
    rows, total = await CollectionRepository(db).products(str(collection.id), category, shop, (page-1)*page_size, page_size)
    return {"success": True, "message": "Products loaded", "data": {"items": rows, "total": total, "page": page, "page_size": page_size}}


@router.get("/products/{product_id}", response_model=ProductSuccessResponse)
async def get_product(product_id: UUID, db: Db):
    product = await db.get(Product, str(product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Product was not found")
    return {"success": True, "message": "Product loaded", "data": product}


@router.post("/collections", response_model=CollectionSuccessResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(data: CollectionCreate, db: Db, admin: Admin):
    del admin
    try:
        item = await CollectionService(db).create_collection(data)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return {"success": True, "message": "Collection created", "data": item}


@router.post("/products", response_model=ProductSuccessResponse, status_code=status.HTTP_201_CREATED)
async def create_product(data: ProductCreate, db: Db, admin: Admin):
    del admin
    try:
        item = await CollectionService(db).create_product(data)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return {"success": True, "message": "Product created", "data": item}
