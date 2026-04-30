from urllib.parse import quote_plus
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseModel):
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "123")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    DB_NAME: str = os.getenv("DB_NAME", "video_analytics")

    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    CAMERA_SOURCE: str = os.getenv("CAMERA_SOURCE", "0")
    LOG_INTERVAL_SECONDS: float = float(os.getenv("LOG_INTERVAL_SECONDS", "3.0"))
    AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", "http://localhost:8001")

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.DB_USER}:{quote_plus(self.DB_PASSWORD)}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()
