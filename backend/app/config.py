import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:password123@localhost:5432/lenny_assistant"
    )
    FALLBACK_DATABASE_URL: str = "sqlite+aiosqlite:///./lenny_assistant.db"

    # LLM Settings
    DEFAULT_PROVIDER: str = "ollama"  # "ollama" | "claude"

    # Ollama Local Settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    OLLAMA_TIMEOUT_SECONDS: float = 300.0

    # Anthropic Cloud Settings
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

    # OpenAI Cloud Settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # RAG Settings
    SIMILARITY_THRESHOLD: float = 0.14
    TOP_K_RETRIEVAL: int = 3

@lru_cache()
def get_settings() -> Settings:
    return Settings()
