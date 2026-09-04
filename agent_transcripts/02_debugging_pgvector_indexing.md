# Agent Transcript 02: Debugging Pgvector Indexing & Cosine Distance

### Objective
Implement the RAG retrieval engine, chunking strategy for Lenny's podcast episodes, and cosine similarity queries using `pgvector`.

### Issue Encountered
During vector search formulation, using Euclidean distance (`<->`) returned inconsistent rank ordering for transcript segments of varying token lengths. Shorter transcript chunks were occasionally favored over longer, higher-signal discussions on growth tactics.

### Root Cause
Transcripts chunks vary from 450 to 800 tokens. Euclidean distance is sensitive to embedding magnitude, whereas Cosine distance normalizes for magnitude and compares semantic directional similarity.

### Correction Applied
1. Changed index definition from `vector_l2_ops` to `vector_cosine_ops`:
   ```sql
   CREATE INDEX idx_transcript_chunks_embedding 
   ON transcript_chunks 
   USING hnsw (embedding vector_cosine_ops);
   ```
2. Adjusted query statement to compute cosine similarity:
   ```sql
   SELECT episode_title, guest_name, chunk_text, timestamp_ref,
          1 - (embedding <=> :vector::vector) AS similarity_score
   FROM transcript_chunks
   WHERE 1 - (embedding <=> :vector::vector) >= :threshold
   ORDER BY similarity_score DESC
   LIMIT :limit;
   ```
3. Set a strict similarity threshold of $0.55$. Queries with scores below the threshold return empty retrieval sets, triggering the system's out-of-scope fallback (*"I do not have sufficient information in Lenny's podcast archive to answer this"*).
