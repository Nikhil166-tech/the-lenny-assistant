"""
Transcript Ingestion Pipeline
Loads transcripts from backend/data/transcripts/, chunks them semantically,
computes vector embeddings, and indexes them in the database.
"""
import os
import sys
import re
import json
import asyncio
import logging
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select, delete
from app.database import init_db, get_session_factory
from app.models.db_models import TranscriptChunk
from app.rag.embeddings import compute_text_embedding

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingest")

TRANSCRIPTS_DIR = backend_dir / "data" / "transcripts"

def parse_metadata(content: str):
    title_match = re.search(r"^#\s*Episode:\s*(.+)$", content, re.MULTILINE)
    guest_match = re.search(r"^\*\*Guest:\*\*\s*(.+)$", content, re.MULTILINE)
    topic_match = re.search(r"^\*\*Topic:\*\*\s*(.+)$", content, re.MULTILINE)

    title = title_match.group(1).strip() if title_match else "Lenny's Podcast"
    guest = guest_match.group(1).strip() if guest_match else "Guest Expert"
    topic = topic_match.group(1).strip() if topic_match else "Product & Growth"
    return title, guest, topic

def chunk_transcript(content: str, title: str, guest: str, default_topic: str):
    chunks = []
    # Split by segments (### Segment ...)
    sections = re.split(r"(?=###\s+)", content)

    for sec in sections:
        sec = sec.strip()
        if not sec or sec.startswith("# Episode:"):
            continue

        # Extract timestamp or sub-topic
        header_match = re.search(r"^###\s*(.+?)(?:\[(\d{2}:\d{2}:\d{2})\])?$", sec, re.MULTILINE)
        if header_match:
            subtopic = header_match.group(1).strip()
            timestamp = header_match.group(2) or "00:00:00"
        else:
            subtopic = default_topic
            timestamp = "00:00:00"

        # Remove header from body
        body = re.sub(r"^###\s*.+?\n", "", sec).strip()
        if len(body) < 80:
            continue

        # If body is long, break into sub-chunks of ~500-800 words
        paragraphs = body.split("\n\n")
        current_chunk = []
        current_word_count = 0

        for p in paragraphs:
            p = p.strip()
            words = len(p.split())
            if current_word_count + words > 600 and current_chunk:
                chunk_str = "\n\n".join(current_chunk)
                chunks.append({
                    "episode": title,
                    "guest": guest,
                    "topic": subtopic,
                    "timestamp": timestamp,
                    "text": chunk_str,
                    "words": current_word_count
                })
                current_chunk = [p]
                current_word_count = words
            else:
                current_chunk.append(p)
                current_word_count += words

        if current_chunk:
            chunk_str = "\n\n".join(current_chunk)
            chunks.append({
                "episode": title,
                "guest": guest,
                "topic": subtopic,
                "timestamp": timestamp,
                "text": chunk_str,
                "words": current_word_count
            })

    return chunks

async def run_ingestion():
    logger.info("Initializing database for transcript ingestion...")
    await init_db()

    transcript_files = list(TRANSCRIPTS_DIR.glob("*.md"))
    logger.info(f"Found {len(transcript_files)} transcript files in {TRANSCRIPTS_DIR}")

    total_chunks = 0
    session_factory = get_session_factory()
    async with session_factory() as session:
        # Clear existing chunks for clean re-indexing
        await session.execute(delete(TranscriptChunk))
        await session.commit()

        for file_path in transcript_files:
            content = file_path.read_text(encoding="utf-8")
            title, guest, topic = parse_metadata(content)
            chunks = chunk_transcript(content, title, guest, topic)
            logger.info(f"Processing '{file_path.name}' -> {len(chunks)} chunks (Guest: {guest})")

            for c in chunks:
                indexing_text = f"{c['episode']} {c['guest']} {c['topic']}\n{c['text']}"
                emb = compute_text_embedding(indexing_text)
                db_chunk = TranscriptChunk(
                    episode_title=c["episode"],
                    guest_name=c["guest"],
                    topic=c["topic"],
                    timestamp_ref=c["timestamp"],
                    chunk_text=c["text"],
                    token_count=c["words"],
                    embedding_json=json.dumps(emb)
                )
                session.add(db_chunk)
                total_chunks += 1

        await session.commit()
    logger.info(f"✅ Successfully ingested {total_chunks} transcript chunks across {len(transcript_files)} episodes.")

if __name__ == "__main__":
    asyncio.run(run_ingestion())
