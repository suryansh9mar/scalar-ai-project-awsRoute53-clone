"""Application configuration."""
from pathlib import Path

from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Runtime settings, overridable via environment variables."""

    app_name: str = "Route53 Clone API"
    database_url: str = f"sqlite:///{BASE_DIR / 'route53.db'}"
    # Comma-separated list of allowed CORS origins for the frontend.
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    # Seed a demo user + sample data on first startup.
    seed_on_startup: bool = True

    class Config:
        env_file = ".env"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
