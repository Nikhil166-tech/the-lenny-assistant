import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db_session
from app.models.db_models import ChatSession, ChatMessage, ArtifactRecord
from app.models.schemas import ChatRequest
from app.rag.retriever import TranscriptRetriever
from app.providers.ollama_provider import OllamaProvider
from app.providers.cloud_provider import ClaudeProvider, OpenAIProvider, resolve_cloud_provider
from app.skills.ship30_writer import SHIP_30_SYSTEM_PROMPT, build_ship30_prompt
from app.skills.artifact_generator import ARTIFACT_SYSTEM_INSTRUCTIONS, extract_artifact, build_calculator_artifact
from app.config import get_settings

logger = logging.getLogger("lenny_assistant.chat")
router = APIRouter(prefix="/api/chat", tags=["Chat"])
settings = get_settings()

GROUNDED_SYSTEM_PROMPT = """
You are "The Lenny Growth Assistant", an AI product and growth partner trained exclusively on Lenny's Podcast transcripts.
Your purpose is to give actionable, highly practical product management and growth advice grounded strictly in transcript knowledge.

### Grounding & Citation Rules:
1. Every major framework, rule, or tactic must clearly cite the guest and episode (e.g. `[Episode: Elena Verna, PLG]` or `[Episode: Shreyas Doshi, Good vs Great PMs]`).
2. Only speak to what is explicitly supported by the provided transcript context. If a user asks a question not covered by the transcripts, politely refuse.
3. Be direct, clear, and structured. Use bullet points and bold headers.

""" + ARTIFACT_SYSTEM_INSTRUCTIONS

@router.post("")
async def stream_chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db_session)
):
    # 1. Verify session exists or create it
    stmt = select(ChatSession).where(ChatSession.id == req.session_id)
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if not session:
        session = ChatSession(id=req.session_id, title=req.message[:50])
        db.add(session)
        await db.commit()
    elif session.title == "New Growth Session":
        session.title = req.message[:50]
        await db.commit()

    # 2. Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=req.message,
        provider=req.provider or settings.DEFAULT_PROVIDER
    )
    db.add(user_msg)
    await db.commit()

    # 3. Retrieve transcript context
    retriever = TranscriptRetriever(db)
    retrieved_chunks = await retriever.retrieve_relevant_chunks(
        query=req.message,
        top_k=settings.TOP_K_RETRIEVAL,
        similarity_threshold=settings.SIMILARITY_THRESHOLD
    )

    # 4. Resolve provider
    selected_provider_name = req.provider or settings.DEFAULT_PROVIDER
    if selected_provider_name.lower() in ["claude", "openai", "cloud"]:
        llm = resolve_cloud_provider(selected_provider_name.lower())
    else:
        llm = OllamaProvider()

    # 5. Build prompt based on mode and retrieval
    is_ship30 = req.mode == "ship30" or "ship 30" in req.message.lower()

    async def sse_event_stream():
        accumulated_text = ""
        try:
            # Yield retrieval status
            yield f'data: {json.dumps({"type": "status", "content": "Searching Lenny\'s Podcast transcript archive..."})}\n\n'

            if not retrieved_chunks:
                # Out of scope rejection
                out_of_scope_msg = (
                    "I do not have sufficient information in Lenny's podcast archive to answer this.\n\n"
                    "My knowledge is strictly grounded in episodes on product management, growth, and company building "
                    "(featuring Elena Verna on PLG, Shreyas Doshi on Product Leadership, Brian Chesky on Founder Mode, "
                    "Casey Winters on Retention, and Gustaf Alströmer on Product-Market Fit)."
                )
                yield f'data: {json.dumps({"type": "token", "content": out_of_scope_msg})}\n\n'
                yield "data: [DONE]\n\n"

                # Persist assistant response
                assistant_msg = ChatMessage(
                    session_id=session.id,
                    role="assistant",
                    content=out_of_scope_msg,
                    sources=[],
                    provider=selected_provider_name
                )
                db.add(assistant_msg)
                await db.commit()
                return

            # Yield sources citation payload to frontend
            sources_payload = [
                {
                    "episode": c["episode"],
                    "guest": c["guest"],
                    "topic": c["topic"],
                    "timestamp": c["timestamp"],
                    "text": c["text"][:280] + "...",
                    "score": c["score"]
                }
                for c in retrieved_chunks
            ]
            yield f'data: {json.dumps({"type": "sources", "sources": sources_payload})}\n\n'

            # Fast-path: If user asks for calculator / ROI simulator, emit the interactive artifact immediately!
            is_calculator_query = any(k in req.message.lower() for k in ["calculator", "roi", "slider", "cac", "ltv", "interactive plg", "roi simulator"])
            initial_artifact = None
            if is_calculator_query:
                initial_artifact = build_calculator_artifact("PLG vs SLG ROI Calculator")
                yield f'data: {json.dumps({"type": "artifact", "artifact": initial_artifact})}\n\n'
                artifact_record = ArtifactRecord(
                    artifact_type=initial_artifact["artifact_type"],
                    title=initial_artifact["title"],
                    content=initial_artifact["content"]
                )
                db.add(artifact_record)

            # Build system and user prompt with compact high-signal chunks
            if is_ship30:
                system_prompt = SHIP_30_SYSTEM_PROMPT
                user_prompt = build_ship30_prompt(req.message, retrieved_chunks)
            else:
                formatted_context = "\n\n".join([
                    f"--- Episode: {c['episode']} (Guest: {c['guest']} - {c['topic']}) [{c['timestamp']}] ---\n{c['text'][:650]}"
                    for c in retrieved_chunks
                ])
                system_prompt = GROUNDED_SYSTEM_PROMPT
                if is_calculator_query:
                    system_prompt += (
                        "\n\nNote: The interactive calculator is already active in the Artifact Canvas. "
                        "Keep your response concise: 2-3 direct bullet points explaining CAC, LTV, and Churn rules."
                    )
                user_prompt = f"Context from Lenny's Transcripts:\n{formatted_context}\n\nUser Question:\n{req.message}"

            yield f'data: {json.dumps({"type": "status", "content": "Synthesizing grounded advice..."})}\n\n'

            # Stream LLM tokens
            async for token in llm.generate_response(
                messages=[{"role": "user", "content": user_prompt}],
                system_prompt=system_prompt
            ):
                accumulated_text += token
                yield f'data: {json.dumps({"type": "token", "content": token})}\n\n'

            # Extract any generated artifact from LLM if not already emitted
            cleaned_text, artifact_data = extract_artifact(accumulated_text)

            if not initial_artifact and artifact_data:
                yield f'data: {json.dumps({"type": "artifact", "artifact": artifact_data})}\n\n'
                artifact_record = ArtifactRecord(
                    artifact_type=artifact_data["artifact_type"],
                    title=artifact_data["title"],
                    content=artifact_data["content"]
                )
                db.add(artifact_record)

            # Save assistant message to DB
            assistant_msg = ChatMessage(
                session_id=session.id,
                role="assistant",
                content=accumulated_text,
                sources=sources_payload,
                provider=selected_provider_name
            )
            db.add(assistant_msg)
            await db.commit()

        except Exception as e:
            logger.exception("Error during chat stream")
            yield f'data: {json.dumps({"type": "error", "message": str(e)})}\n\n'
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
