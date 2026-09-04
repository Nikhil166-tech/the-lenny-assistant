import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
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
