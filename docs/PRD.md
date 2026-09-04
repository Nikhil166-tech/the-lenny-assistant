# Product Requirements Document (PRD)
## The Lenny Growth Assistant
**Role:** Forward Deployed Engineer Assessment  
**Author:** AI Forward Deployed Engineer  
**Date:** September 2026  
**Status:** Approved for Implementation  

---

### 1. Executive Summary
"The Lenny Growth Assistant" is an enterprise-grade conversational AI application that extracts tactical product management and growth wisdom from Lenny's Podcast transcripts. Product managers, founders, and growth practitioners often spend hours scouring podcasts and newsletters for frameworks. The Lenny Growth Assistant allows them to query this knowledge base interactively, receive answers strictly grounded in actual episode conversations with verified citations, convert strategies into publication-ready "Ship 30 for 30" essays, and render custom interactive artifacts (such as calculators, frameworks, and PRD templates) within a secure sandboxed canvas.

---

### 2. User Persona & Problem Statement

#### 2.1 Target Persona
* **Primary Persona:** Senior Product Managers, Growth Leads, and Early-Stage Founders.
* **Context:** Operating under tight deadlines, formulating growth loops, pricing models, retention hypotheses, and product roadmaps.
* **Needs:** Concrete operational advice and tested heuristics from seasoned operators (e.g., Brian Chesky, Elena Verna, Shreyas Doshi, Gustaf Alstromer, Casey Winters) rather than generic LLM hallucinations.

#### 2.2 Core Problem
1. **High Friction in Audio Content:** Listening through 200+ hours of podcast audio to find specific advice on B2B product-led growth or user activation is inefficient.
2. **Hallucination & Lack of Attribution:** Standard LLMs invent frameworks or attribute philosophies to the wrong leaders.
3. **Actionability Gap:** Converting conversational insights into structured essays or interactive tools requires significant manual formatting.

---

### 3. Product Goals & Measurable Success Metrics

| Metric | Target | Operational Measurement |
| :--- | :--- | :--- |
| **Grounding Citation Accuracy** | $\ge 95\%$ | All factual claims must carry verified `[Episode: Guest, Topic]` citations. |
| **Out-of-Scope Rejection** | $100\%$ | Strict refusal (*"I do not have sufficient information in Lenny's podcast archive to answer this"*) when query similarity $< 0.55$. |
| **Local Inference First-Token Latency** | $< 3.5$ seconds | Streaming response start time when running local Ollama (`llama3.2:3b`). |
| **Cloud Model First-Token Latency** | $< 1.2$ seconds | Streaming response start time when toggled to Claude 3.5 Sonnet. |
| **Artifact Security Rating** | Zero XSS / Zero Leakage | Zero access to parent window storage/cookies via `sandbox="allow-scripts"` (without `allow-same-origin`) + DOMPurify. |
| **Ship 30 for 30 Heuristic Compliance** | $100\%$ | Adherence to word count (~1,250 words), headline hook, short 1-3 sentence paragraphs, and bold anchor words. |

---

### 4. Assumptions & Scope Choices

#### 4.1 Assumptions
1. **Local Evaluation Environment:** The evaluator must be able to run the entire demo offline/locally with zero paid API key dependency using Ollama as the local engine.
2. **Flexible Cloud Fallback:** When a user later supplies an Anthropic Claude or OpenAI key, the application should dynamically enable cloud streaming without requiring server restarts or code edits.
3. **Zero-Friction Startup:** If PostgreSQL with pgvector is not immediately available or Docker is inactive on the host machine, the backend provides an embedded vector retrieval fallback so testing never fails.

#### 4.2 In-Scope
* Dynamic multi-provider routing (Local Ollama vs. Cloud Claude).
* Vector-based RAG pipeline over Lenny's Podcast transcripts with cosine similarity.
* "Ship 30 for 30" specialized ghostwriting skill.
* Side-by-side Claude-style Artifact Viewer for Markdown and HTML/CSS/JS snippets.
* Sandboxed iframe isolation preventing parent DOM/cookie access.
* Persistent chat sessions with history and metadata in PostgreSQL / async DB.
* Single-command deployment via Docker Compose.

#### 4.3 Out-of-Scope (Phase 1)
* Real-time audio transcription of live YouTube streams (pre-ingested transcripts are used).
* Multi-user team workspace authentication (single-tenant / local evaluation focus).
* Voice input/speech-to-text synthesis.

---

### 5. Functional Requirements & Key User Flows

#### Flow 1: Grounded Q&A with Strict Attribution
1. User enters a growth query: *"What are Elena Verna's rules for B2B product-led growth?"*
2. System computes query embedding and performs vector similarity search against podcast chunks.
3. If relevant chunks exist above threshold, assistant synthesizes a response citing specific episodes and guests.
4. If question is outside Lenny's podcast archive (e.g., *"What is the capital of France?"*), assistant declines politely.

#### Flow 2: Ship 30 for 30 Ghostwriting Skill
1. User activates the "Ship 30 for 30" toggle or requests an essay: *"Turn Shreyas Doshi's advice on Good vs Great PMs into a Ship 30 for 30 essay."*
2. Dedicated skill template structures output:
   * Gripping hook (first 2-3 lines).
   * ~1,250 words total.
   * High skimmability (1-3 sentences per paragraph, bold anchor words).
   * Actionable checklist / framework conclusion.

#### Flow 3: Artifact Generation & Sandboxed Preview
1. User asks: *"Create an interactive ROI calculator for PLG vs SLG in HTML/CSS."*
2. Assistant streams an `<artifact type="html" title="PLG vs SLG ROI Calculator">` block.
3. Frontend detects artifact tag, docks the Artifact Viewer side-by-side with chat, sanitizes markup with DOMPurify, and mounts it in an isolated iframe.
4. User can toggle between **Live Preview** and **Source Code**, or copy code directly.

---

### 6. Risks, Trade-offs, and Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Local Model Reasoning Limitations** | Local 3B/8B models might stray from complex system instructions. | Explicit few-shot system prompt formatting and rigid RAG context grounding. |
| **Untrusted Artifact Execution** | Malicious HTML/JS injection could hijack browser storage. | Set `sandbox="allow-scripts"` (strictly omit `allow-same-origin`) and run `DOMPurify.sanitize`. |
| **Database Connection Failures** | Docker daemon not started on user's machine during review. | Auto-detecting resilience layer: attempts PostgreSQL/pgvector; falls back to embedded vector store. |
| **Model Cold-Start Latency** | Ollama first token delay on non-GPU systems. | Asynchronous SSE status messages (`"Retrieving transcripts..."`, `"Synthesizing response..."`) to maintain user feedback. |
