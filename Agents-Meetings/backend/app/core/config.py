"""
Application configuration
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Multilingual Meeting Platform"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/meeting_platform"
    )

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_IN: int = 3600 * 24 * 7  # 7 days

    # LiveKit
    LIVEKIT_URL: str = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
    LIVEKIT_WS_URL: str = os.getenv("LIVEKIT_WS_URL", os.getenv("LIVEKIT_URL", "ws://localhost:7880"))
    LIVEKIT_API_KEY: str = os.getenv("LIVEKIT_API_KEY", "")
    LIVEKIT_API_SECRET: str = os.getenv("LIVEKIT_API_SECRET", "")

    # Langfuse
    LANGFUSE_HOST: str = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")
    LANGFUSE_PUBLIC_KEY: str = os.getenv("LANGFUSE_PUBLIC_KEY", "")
    LANGFUSE_SECRET_KEY: str = os.getenv("LANGFUSE_SECRET_KEY", "")
    LANGFUSE_ENABLED: bool = os.getenv("LANGFUSE_ENABLED", "true").lower() == "true"

    # CORS - stored as string, will be parsed in main.py
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001"
    )

    # Supported languages - stored as string, will be parsed where used
    SUPPORTED_LANGUAGES: str = os.getenv(
        "SUPPORTED_LANGUAGES",
        "en,es,fr,de,ja,zh"
    )

    # Avatar
    DEFAULT_AVATAR_PROVIDER: str = os.getenv("DEFAULT_AVATAR_PROVIDER", "bithuman")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

