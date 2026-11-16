"""Move discovery metadata to collections and support image reels.

Revision ID: c8e41af2970b
Revises: d2f8a9c71b4e
"""
from alembic import op
import sqlalchemy as sa

revision = "c8e41af2970b"
down_revision = "d2f8a9c71b4e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("collections", sa.Column("image_urls", sa.JSON(), nullable=True))
    op.add_column("collections", sa.Column("reel_number", sa.Integer(), nullable=True))
    op.add_column("collections", sa.Column("shop", sa.String(length=40), nullable=True))
    op.add_column("collections", sa.Column("category", sa.String(length=120), nullable=True))
    op.create_index("ix_collections_reel_number", "collections", ["reel_number"])
    op.create_index("ix_collections_shop", "collections", ["shop"])
    op.create_index("ix_collections_category", "collections", ["category"])

    bind = op.get_bind()
    collections = sa.table(
        "collections",
        sa.column("id", sa.String()),
        sa.column("image_url", sa.String()),
        sa.column("image_urls", sa.JSON()),
        sa.column("shop", sa.String()),
        sa.column("category", sa.String()),
    )
    products = sa.table(
        "products",
        sa.column("collection_id", sa.String()),
        sa.column("shop", sa.String()),
        sa.column("category", sa.String()),
        sa.column("created_at", sa.DateTime()),
    )
    metadata_by_collection = {}
    for row in bind.execute(sa.select(products).order_by(products.c.created_at.desc())):
        metadata_by_collection.setdefault(row.collection_id, (row.shop, row.category))
    for row in bind.execute(sa.select(collections.c.id, collections.c.image_url)):
        images = [row.image_url] if row.image_url else []
        shop, category = metadata_by_collection.get(row.id, (None, None))
        bind.execute(
            collections.update().where(collections.c.id == row.id).values(
                image_urls=images, shop=shop, category=category
            )
        )

    op.alter_column("collections", "image_urls", nullable=False)
    op.drop_column("collections", "image_url")
    op.drop_index("ix_products_category", table_name="products")
    op.drop_column("products", "shop")
    op.drop_column("products", "category")


def downgrade() -> None:
    op.add_column("collections", sa.Column("image_url", sa.String(length=2048), nullable=True))
    op.add_column("products", sa.Column("shop", sa.String(length=40), nullable=True))
    op.add_column("products", sa.Column("category", sa.String(length=120), nullable=True))
    bind = op.get_bind()
    collections = sa.table(
        "collections",
        sa.column("id", sa.String()),
        sa.column("image_urls", sa.JSON()),
        sa.column("image_url", sa.String()),
        sa.column("shop", sa.String()),
        sa.column("category", sa.String()),
    )
    for row in bind.execute(sa.select(collections)):
        images = row.image_urls or []
        bind.execute(collections.update().where(collections.c.id == row.id).values(image_url=images[0] if images else None))
    products = sa.table(
        "products",
        sa.column("collection_id", sa.String()),
        sa.column("shop", sa.String()),
        sa.column("category", sa.String()),
    )
    for row in bind.execute(sa.select(collections.c.id, collections.c.shop, collections.c.category)):
        bind.execute(
            products.update().where(products.c.collection_id == row.id).values(shop=row.shop, category=row.category)
        )
    op.drop_index("ix_collections_category", table_name="collections")
    op.drop_index("ix_collections_shop", table_name="collections")
    op.drop_index("ix_collections_reel_number", table_name="collections")
    op.drop_column("collections", "image_urls")
    op.drop_column("collections", "reel_number")
    op.drop_column("collections", "shop")
    op.drop_column("collections", "category")
