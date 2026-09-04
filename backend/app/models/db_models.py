import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Float, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False, default="New Growth Session")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # "user" | "assistant" | "system"
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)  # List of dicts with citations
    provider = Column(String(50), nullable=True)  # "ollama" | "claude"
    created_at = Column(DateTime, default=utc_now)

    session = relationship("ChatSession", back_populates="messages")
    artifacts = relationship("ArtifactRecord", back_populates="message", cascade="all, delete-orphan")

class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    episode_title = Column(String(255), nullable=False)
    guest_name = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=True)
    timestamp_ref = Column(String(50), nullable=True)
    chunk_text = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    embedding_json = Column(Text, nullable=False)  # Stored as JSON string vector for cross-db compatibility

class ArtifactRecord(Base):
    __tablename__ = "artifacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    message_id = Column(String(36), ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=True)
    artifact_type = Column(String(50), nullable=False)  # "html" | "markdown" | "svg"
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    message = relationship("ChatMessage", back_populates="artifacts")
