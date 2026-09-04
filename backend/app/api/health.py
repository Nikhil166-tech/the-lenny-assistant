from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db_session, using_fallback
from app.models.db_models import TranscriptChunk
from app.models.schemas import HealthStatus
from app.providers.ollama_provider import OllamaProvider
from app.providers.cloud_provider import ClaudeProvider, OpenAIProvider
from app.config import get_settings

router = APIRouter(prefix="/api/health", tags=["Health"])
settings = get_settings()

@router.get("", response_model=HealthStatus)
async def get_health_status(db: AsyncSession = Depends(get_db_session)):
    # 1. Database & vector chunk count
    db_status = "PostgreSQL (pgvector ready)" if not using_fallback else "SQLite (embedded vector store)"
    chunk_count = 0
    try:
        result = await db.execute(select(func.count(TranscriptChunk.id)))
        chunk_count = result.scalar() or 0
    except Exception:
        db_status = "error"

    # 2. Ollama probe
    ollama = OllamaProvider()
    ollama_info = await ollama.check_health()
    ollama_status = ollama_info.get("status", "unknown")

    # 3. Cloud probe
    openai_prov = OpenAIProvider()
    openai_info = await openai_prov.check_health()
    
    claude = ClaudeProvider()
    claude_info = await claude.check_health()
    
    if openai_info.get("status") == "ready":
        cloud_status = f"OpenAI ({settings.OPENAI_MODEL})"
    elif claude_info.get("status") == "ready":
        cloud_status = "Anthropic (ready)"
    else:
        cloud_status = "unconfigured"

    return HealthStatus(
        status="healthy",
        database=db_status,
        vector_index_count=chunk_count,
        ollama_status=ollama_status,
        ollama_model=settings.OLLAMA_MODEL,
        cloud_provider=cloud_status
    )
