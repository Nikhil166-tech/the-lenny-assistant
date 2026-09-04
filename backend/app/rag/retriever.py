import json
import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.db_models import TranscriptChunk
from app.rag.embeddings import get_embedding, cosine_similarity
from app.config import get_settings

logger = logging.getLogger("lenny_assistant.retriever")
settings = get_settings()

class TranscriptRetriever:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def retrieve_relevant_chunks(
        self,
        query: str,
        top_k: int = 4,
        similarity_threshold: float = 0.40
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top K transcript chunks relevant to the user query.
        Returns empty list if top score is below similarity_threshold.
        """
        query_vector = await get_embedding(query)

        # Retrieve all transcript chunks from DB
        stmt = select(TranscriptChunk)
        result = await self.session.execute(stmt)
        chunks = result.scalars().all()

        if not chunks:
            logger.warning("No transcript chunks present in database. Run ingest script.")
            return []

        scored_chunks = []
        for chunk in chunks:
            try:
                emb = json.loads(chunk.embedding_json)
                score = cosine_similarity(query_vector, emb)
                if score >= similarity_threshold:
                    scored_chunks.append({
                        "id": chunk.id,
                        "episode": chunk.episode_title,
                        "guest": chunk.guest_name,
                        "topic": chunk.topic or "Growth & Product Management",
                        "timestamp": chunk.timestamp_ref or "N/A",
                        "text": chunk.chunk_text,
                        "score": round(score, 4)
                    })
            except Exception as e:
                logger.error(f"Error computing similarity for chunk {chunk.id}: {e}")

        # Sort descending by similarity score
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]
