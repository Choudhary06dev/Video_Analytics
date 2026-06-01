"""Initial migration updated with JSON scenario storage

Revision ID: 92df4d5f676a
Revises: 
Create Date: 2026-04-22 10:28:20.403442

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import sqlmodel

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
    op.execute(sa.text("ALTER TABLE camera ADD COLUMN IF NOT EXISTS scenario_configs JSONB DEFAULT '{}'::jsonb"))
    op.execute(sa.text("ALTER TABLE detectionevent ADD COLUMN IF NOT EXISTS image_base64 TEXT"))
    op.execute(sa.text("ALTER TABLE detectionevent ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE"))
    
    # Drop the redundant junction table if it exists
    op.execute(sa.text("DROP TABLE IF EXISTS camerascenarioassignment CASCADE"))

    # Add WhatsApp fields to user table
    op.execute(sa.text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR"))
    op.execute(sa.text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS whatsapp_alerts_enabled BOOLEAN DEFAULT FALSE"))

    # Global notification channel switches
    op.execute(sa.text("ALTER TABLE systemsetting ADD COLUMN IF NOT EXISTS email_alerts_enabled BOOLEAN DEFAULT TRUE"))
    op.execute(sa.text("ALTER TABLE systemsetting ADD COLUMN IF NOT EXISTS whatsapp_alerts_enabled BOOLEAN DEFAULT TRUE"))

    # 3. Create BlacklistPerson table
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS blacklistperson (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR NOT NULL,
            reason VARCHAR NOT NULL,
            severity VARCHAR NOT NULL DEFAULT 'HIGH',
            image_preview VARCHAR,
            notes VARCHAR,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """))


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(sa.text("DROP TABLE IF EXISTS blacklistperson"))
