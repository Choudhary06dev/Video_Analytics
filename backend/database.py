from sqlmodel import create_engine, Session, SQLModel
import os
from urllib.parse import quote_plus

# Database configuration
DB_USER = "postgres"
DB_PASSWORD = quote_plus("Amjad@186699") # URL encode to handle '@' in password
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "video_analytics"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create engine
# For PostgreSQL, we don't need connect_args={"check_same_thread": False}
engine = create_engine(DATABASE_URL, echo=False)

def init_db():
    """Initializes the database tables."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Yields a database session."""
    with Session(engine) as session:
        yield session
