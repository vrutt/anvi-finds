from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.utils.base_model import CustomBaseModel


class Collection(CustomBaseModel):
    __tablename__ = "collections"

    parent_id = Column(UUID(as_uuid=False), ForeignKey("collections.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(160), nullable=False)
    slug = Column(String(180), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(2048), nullable=True)
    children = relationship("Collection", cascade="all, delete-orphan", lazy="noload")
    products = relationship("Product", cascade="all, delete-orphan", lazy="noload")


class Product(CustomBaseModel):
    __tablename__ = "products"

    collection_id = Column(UUID(as_uuid=False), ForeignKey("collections.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(2048), nullable=False)
    url = Column(String(2048), nullable=False)
    title = Column(String(240), nullable=False)
    description = Column(Text, nullable=True)
    shop = Column(String(40), nullable=True)
    category = Column(String(120), nullable=True, index=True)
