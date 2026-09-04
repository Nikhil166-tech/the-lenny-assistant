import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from app.config import get_settings
from app.models.db_models import Base

logger = logging.getLogger("lenny_assistant.database")
settings = get_settings()

# Primary async engine
engine = None
async_session_factory = None
using_fallback = False

async def init_db():
    global engine, async_session_factory, using_fallback
    primary_url = settings.DATABASE_URL
    fallback_url = settings.FALLBACK_DATABASE_URL

    # Attempt connecting to primary PostgreSQL
    try:
        test_engine = create_async_engine(
            primary_url,
            echo=False,
            pool_pre_ping=True,
            connect_args={"timeout": 2.0} if "asyncpg" in primary_url else {}
        )
        async with test_engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        engine = test_engine
        logger.info(f"Connected successfully to PostgreSQL database: {primary_url.split('@')[-1]}")
    except Exception as e:
        logger.warning(f"Failed connecting to primary database ({e}). Falling back to SQLite: {fallback_url}")
        using_fallback = True
        engine = create_async_engine(fallback_url, echo=False)

    async_session_factory = async_sessionmaker(
        bind=engine,
        expire_on_commit=False,
        autoflush=False
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialized successfully.")

def get_session_factory():
    global async_session_factory
    return async_session_factory


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    if async_session_factory is None:
        await init_db()
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
