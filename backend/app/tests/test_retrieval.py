import pytest
from app.database import init_db, get_session_factory
from app.rag.retriever import TranscriptRetriever

@pytest.mark.asyncio
async def test_retrieval_elena_verna_plg():
    await init_db()
    session_factory = get_session_factory()
    async with session_factory() as session:
        retriever = TranscriptRetriever(session)
        chunks = await retriever.retrieve_relevant_chunks(
            query="What does Elena Verna say about B2B product-led growth vs sales-led growth?",
            top_k=3,
            similarity_threshold=0.20
        )
        assert len(chunks) > 0
        top_chunk = chunks[0]
        assert "Elena Verna" in top_chunk["guest"]
        assert "PLG" in top_chunk["topic"] or "B2B" in top_chunk["text"]

@pytest.mark.asyncio
async def test_retrieval_shreyas_doshi_pm():
    await init_db()
    session_factory = get_session_factory()
    async with session_factory() as session:
        retriever = TranscriptRetriever(session)
        chunks = await retriever.retrieve_relevant_chunks(
            query="Shreyas Doshi LNO framework for product managers",
            top_k=3,
            similarity_threshold=0.20
        )
        assert len(chunks) > 0
        assert any("Shreyas" in c["guest"] for c in chunks)

@pytest.mark.asyncio
async def test_out_of_scope_rejection():
    await init_db()
    session_factory = get_session_factory()
    async with session_factory() as session:
        retriever = TranscriptRetriever(session)
        # Completely unrelated domain question
        chunks = await retriever.retrieve_relevant_chunks(
            query="What is the nuclear payload capacity of a Boeing B-52 Stratofortress aircraft?",
            top_k=3,
            similarity_threshold=0.20
        )
        # Should be empty because cosine similarity to podcast growth transcripts is below 0.20
        assert len(chunks) == 0

