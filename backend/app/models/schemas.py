from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class CitationSource(BaseModel):
    episode: str
    guest: str
    topic: Optional[str] = None
    timestamp: Optional[str] = None
    text: str
    score: float

class SessionCreate(BaseModel):
    title: Optional[str] = "New Growth Session"

class SessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    sources: Optional[List[CitationSource]] = None
    provider: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    session_id: str
    message: str
    provider: Optional[str] = None  # "ollama" | "claude"
    mode: Optional[str] = "default"  # "default" | "ship30"

class ArtifactResponse(BaseModel):
    id: str
    message_id: Optional[str] = None
    artifact_type: str
    title: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class HealthStatus(BaseModel):
    status: str
    database: str
    vector_index_count: int
    ollama_status: str
    ollama_model: str
    cloud_provider: str
