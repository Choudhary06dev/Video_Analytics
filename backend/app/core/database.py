from sqlmodel import create_engine, Session, SQLModel
from sqlalchemy.pool import QueuePool
from app.core.config import settings

# Production-grade connection pool configuration:
# - pool_size: Number of persistent connections maintained in the pool
# - max_overflow: Extra connections allowed beyond pool_size under peak load
# - pool_recycle: Recycle connections older than 30 minutes (prevents stale TCP timeouts)
# - pool_pre_ping: Validates connection health before use (auto-heals dropped connections)
# - pool_timeout: Max seconds to wait for an available connection before raising an error
engine = create_engine(
    settings.database_url,
    echo=False,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=10,
    pool_recycle=1800,
    pool_pre_ping=True,
    pool_timeout=30,
)


def init_db():
    """Initializes the database tables."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Yields a database session."""
    with Session(engine) as session:
        yield session
