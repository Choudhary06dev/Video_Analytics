from sqlmodel import create_engine, Session, SQLModel
from config import settings

# Create engine using centralized settings
engine = create_engine(settings.database_url, echo=False)

def init_db():
    """Initializes the database tables."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Yields a database session."""
    with Session(engine) as session:
        yield session
