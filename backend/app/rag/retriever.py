import json
import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.db_models import TranscriptChunk
from app.rag.embeddings import get_embedding, cosine_similarity, tokenize
from app.config import get_settings

logger = logging.getLogger("lenny_assistant.retriever")
settings = get_settings()

PROMPT_NOISE_WORDS = {
    "create", "interactive", "calculator", "sliders", "make", "build",
    "turn", "give", "write", "generate", "show", "code", "widget",
    "tool", "canvas", "roi", "please", "can", "you", "help", "me",
    "mock", "app", "dashboard", "component"
}

class TranscriptRetriever:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def retrieve_relevant_chunks(
        self,
        query: str,
        top_k: int = 5,
        similarity_threshold: float = 0.14
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top K transcript chunks relevant to the user query using hybrid retrieval.
        Combines vector semantic similarity with lexical keyword overlap.
        Returns empty list if top score is below similarity_threshold.
        """
        all_tokens = tokenize(query)
        content_tokens = [t for t in all_tokens if t not in PROMPT_NOISE_WORDS]
        cleaned_query = " ".join(content_tokens) if content_tokens else query

        query_vector = await get_embedding(cleaned_query)
        q_token_set = set(content_tokens) if content_tokens else set(all_tokens)

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
                cos_score = cosine_similarity(query_vector, emb)

                # Lexical overlap with metadata & text
                doc_text = f"{chunk.guest_name} {chunk.topic} {chunk.chunk_text}"
                doc_tokens = set(tokenize(doc_text))
                overlap_ratio = len(q_token_set.intersection(doc_tokens)) / max(len(q_token_set), 1)

                # Hybrid score: balances semantic matching with exact keyword hits
                final_score = 0.45 * cos_score + 0.55 * overlap_ratio

                if final_score >= similarity_threshold:
                    scored_chunks.append({
                        "id": chunk.id,
                        "episode": chunk.episode_title,
                        "guest": chunk.guest_name,
                        "topic": chunk.topic or "Growth & Product Management",
                        "timestamp": chunk.timestamp_ref or "N/A",
                        "text": chunk.chunk_text,
                        "score": round(final_score, 4)
                    })
            except Exception as e:
                logger.error(f"Error computing similarity for chunk {chunk.id}: {e}")

        # Sort descending by similarity score
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]
