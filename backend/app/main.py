import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func
from app.database import init_db, get_session_factory
from app.models.db_models import TranscriptChunk
from app.api import sessions, chat, health

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("lenny_assistant")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting The Lenny Growth Assistant API...")
    await init_db()

    # Automatically check and seed transcripts on clean cloud deployments
    try:
        session_factory = get_session_factory()
        if session_factory:
            async with session_factory() as session:
                res = await session.execute(select(func.count(TranscriptChunk.id)))
                count = res.scalar() or 0
                if count == 0:
                    logger.info("No transcript chunks found in database. Running auto-seeding ingestion...")
                    try:
                        from scripts.ingest import run_ingestion
                        await run_ingestion()
                    except Exception as ie:
                        logger.warning(f"Auto-ingestion encountered an error: {ie}")
                else:
                    logger.info(f"Verified {count} transcript chunks loaded in database.")
    except Exception as e:
        logger.warning(f"Transcript verification check skipped: {e}")

    yield
    logger.info("Shutting down The Lenny Growth Assistant API...")

app = FastAPI(
    title="The Lenny Growth Assistant API",
    description="Enterprise-grade RAG and Agent backend for Lenny's Podcast transcripts",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health.router)
app.include_router(sessions.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {
        "app": "The Lenny Growth Assistant",
        "status": "operational",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }
