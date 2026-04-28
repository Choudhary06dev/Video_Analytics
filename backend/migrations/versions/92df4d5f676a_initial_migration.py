"""Initial migration updated with JSON scenario storage

Revision ID: 92df4d5f676a
Revises: 
Create Date: 2026-04-22 10:28:20.403442

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '92df4d5f676a'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Standard foreign keys from previous state
    try:
        op.create_foreign_key(None, 'rolemodulepermission', 'role', ['role_id'], ['id'])
        op.create_foreign_key(None, 'rolemodulepermission', 'modulepermission', ['module_permission_id'], ['id'])
    except:
        pass

    # 2. Schema Fixes (Added for JSON scenario storage)
    # Add column if not exists
    op.execute(sa.text("ALTER TABLE camera ADD COLUMN IF NOT EXISTS enabled_scenario_ids JSONB DEFAULT '[]'::jsonb"))
    
    # Drop the redundant junction table if it exists
    op.execute(sa.text("DROP TABLE IF EXISTS camerascenarioassignment CASCADE"))


def downgrade() -> None:
    """Downgrade schema."""
    pass
