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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))

    CAMERA_SOURCE: str = os.getenv("CAMERA_SOURCE", "0")
    LOG_INTERVAL_SECONDS: float = float(os.getenv("LOG_INTERVAL_SECONDS", "3.0"))
    AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", "http://localhost:8001")

    # SMTP Email Notification Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str | None = os.getenv("SMTP_USER", None)
    SMTP_PASSWORD: str | None = os.getenv("SMTP_PASSWORD", None)
    SMTP_SENDER: str | None = os.getenv("SMTP_SENDER", None)  # Falls back to SMTP_USER
    ALERT_RECEIVER_EMAIL: str | None = os.getenv("ALERT_RECEIVER_EMAIL", None)
    ALERT_NOTIFY_SEVERITIES: str = os.getenv("ALERT_NOTIFY_SEVERITIES", "Critical,High")
    ALERT_NOTIFY_ROLES: str = os.getenv("ALERT_NOTIFY_ROLES", "super_admin,admin")

    @property
    def alert_notify_severities_list(self) -> list[str]:
        return [s.strip() for s in self.ALERT_NOTIFY_SEVERITIES.split(",") if s.strip()]

    @property
    def alert_notify_roles_list(self) -> list[str]:
        return [r.strip() for r in self.ALERT_NOTIFY_ROLES.split(",") if r.strip()]

    @property
    def cors_origins(self) -> list[str]:
        origins = os.getenv("CORS_ORIGINS")
        if origins:
            return [o.strip() for o in origins.split(",")]
        return [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]


    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.DB_USER}:{quote_plus(self.DB_PASSWORD)}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()
