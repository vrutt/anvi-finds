"""Create collection catalog tables.

Revision ID: d2f8a9c71b4e
Revises: ba2ba87210bd
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d2f8a9c71b4e"
down_revision = "ba2ba87210bd"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "collections",
        sa.Column("parent_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("slug", sa.String(180), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(2048), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["parent_id"], ["collections.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_collections_parent_id", "collections", ["parent_id"])
    op.create_index("ix_collections_slug", "collections", ["slug"])
    op.create_table(
        "products",
        sa.Column("collection_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("image_url", sa.String(2048), nullable=False),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("title", sa.String(240), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("shop", sa.String(40), nullable=True),
        sa.Column("category", sa.String(120), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["collection_id"], ["collections.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_products_collection_id", "products", ["collection_id"])
    op.create_index("ix_products_category", "products", ["category"])
    op.create_index("ix_products_id", "products", ["id"], unique=True)
    op.create_index("ix_collections_id", "collections", ["id"], unique=True)


def downgrade() -> None:
    op.drop_table("products")
    op.drop_table("collections")
