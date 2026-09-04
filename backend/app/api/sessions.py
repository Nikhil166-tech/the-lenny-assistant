from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.database import get_db_session
from app.models.db_models import ChatSession, ChatMessage
from app.models.schemas import SessionCreate, SessionResponse, MessageResponse

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

@router.post("", response_model=SessionResponse)
async def create_session(
    payload: SessionCreate,
    db: AsyncSession = Depends(get_db_session)
):
    session = ChatSession(title=payload.title or "New Growth Session")
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

@router.get("", response_model=List[SessionResponse])
async def list_sessions(
    limit: int = 50,
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(ChatSession).order_by(desc(ChatSession.updated_at)).limit(limit)
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    return sessions

@router.get("/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at)
    result = await db.execute(stmt)
    messages = result.scalars().all()
    return messages

@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(ChatSession).where(ChatSession.id == session_id)
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()
    return {"status": "deleted", "id": session_id}
