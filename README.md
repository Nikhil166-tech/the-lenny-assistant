# The Lenny Growth Assistant
> **Forward Deployed Engineer (FDE) Take-Home Assessment**  
> An enterprise-grade, retrieval-augmented conversational web application that turns Lenny's Podcast transcripts into grounded strategic advice, "Ship 30 for 30" essays, and sandboxed interactive artifacts.

---

## 1. Architectural Highlights & System Overview

- **Full-Stack Architecture:**
  - **Backend:** FastAPI (Python 3.11+) asynchronous microservice.
  - **Vector Database:** PostgreSQL with `pgvector` extension for cosine similarity search (`vector_cosine_ops`). Includes an automatic SQLite embedded vector fallback for instantaneous local zero-Docker evaluation.
  - **Frontend:** React + TypeScript + Tailwind CSS with Lucide icons.
  - **Sandboxed Artifact Canvas:** Claude-style side-drawer rendering untrusted HTML inside an isolated iframe (`sandbox="allow-scripts"` without `allow-same-origin`) sanitized via DOMPurify.
- **Dynamic Dual-Model Switching:**
  - **Local Model (Mandatory Demo):** Ollama (`llama3.2:3b` / `mistral:7b`) for offline, zero-cloud-cost execution.
  - **Cloud Model:** Anthropic Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`) toggled per query directly via the UI selector.
- **Specialized Skills:**
  - **Strict Grounding:** Mandatory citation pills `[Episode: Guest, Topic]` and automatic refusal of out-of-scope queries.
  - **Ship 30 for 30 Engine:** Converts grounded insights into high-retention ~1,250-word essays with bold anchor words and short paragraph cadences.

---

## 2. Project Structure

```
lenny-growth-assistant/
├── docker-compose.yml              # One-command full-stack container orchestration
├── README.md                       # Comprehensive evaluator guide & architecture
├── docs/
│   ├── PRD.md                      # Product Requirements Document & discovery brief
│   ├── architecture.md             # Schema, RAG sequences, security topology
│   └── design.md                   # UI/UX principles, design system, accessibility
├── agent_transcripts/
│   ├── 01_initial_scaffolding.md   # Agent development transcript: Scaffolding
│   ├── 02_debugging_pgvector_indexing.md # Fixing L2 vs Cosine distance
│   └── 03_model_switching_resilience.md  # Handling missing keys & timeouts
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   ├── scripts/
│   │   ├── download_transcripts.py # Transcript download & verification
│   │   └── ingest.py               # Chunking & vector embedding pipeline
│   ├── data/transcripts/           # Authentic curated Lenny's Podcast episodes
│   └── app/
│       ├── main.py                 # FastAPI application entrypoint
│       ├── config.py               # Pydantic settings & environment variables
│       ├── database.py             # Dual PostgreSQL (pgvector) / SQLite engine
│       ├── models/                 # SQLAlchemy tables & Pydantic schemas
│       ├── rag/                    # Vector embeddings & Cosine similarity retriever
│       ├── providers/              # Base, Ollama, and Cloud (Claude) providers
│       ├── skills/                 # Ship 30 for 30 writer & artifact generator
│       ├── api/                    # /api/health, /api/sessions, /api/chat
│       └── tests/                  # Pytest test suite (100% passing)
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx                 # Split-pane layout & state coordination
        ├── components/Chat/        # ChatPane, MessageItem, ModelSelector
        ├── components/Artifact/    # ArtifactViewer, SandboxedIframe
        ├── hooks/useChatStream.ts  # SSE real-time streaming hook
        └── lib/api.ts              # REST client methods
```

---

## 3. Quick Start Guide

### Option A: One-Command Startup with Docker (Recommended)

1. Ensure Docker Desktop is running.
2. Ensure Ollama is running on your host machine:
   ```bash
   ollama run llama3.2:3b
   ```
3. Clone and launch the stack:
   ```bash
   docker-compose up --build
   ```
4. Open your browser:
   - **Frontend Application:** [http://localhost:3000](http://localhost:3000)
   - **FastAPI Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Health Probe:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Option B: Standalone Local Run (Zero-Docker Required)

For evaluators testing locally without Docker daemon active:

#### Step 1: Ingest Transcripts & Run Backend
```powershell
cd backend
py -m pip install -r requirements.txt
py scripts/ingest.py
py -m uvicorn app.main:app --reload --port 8000
```
*(The backend automatically detects when PostgreSQL is unavailable and uses the embedded SQLite vector store without crashing).*

#### Step 2: Run Frontend
In a separate terminal:
```powershell
cd frontend
npm install
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000).

---

## 4. Environment Variables Configuration

Copy `.env.example` in `backend/`:
```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Async PostgreSQL connection string with pgvector | `postgresql+asyncpg://postgres:password123@localhost:5432/lenny_assistant` |
| `DEFAULT_PROVIDER` | Initial active LLM provider (`ollama` or `claude`) | `ollama` |
| `OLLAMA_BASE_URL` | Local Ollama HTTP daemon endpoint | `http://localhost:11434` |
| `OLLAMA_MODEL` | Local LLM model tag | `llama3.2:3b` |
| `ANTHROPIC_API_KEY` | Optional cloud API key for Claude 3.5 Sonnet | *(Leave empty for local demo)* |
| `ANTHROPIC_MODEL` | Claude model identifier | `claude-3-5-sonnet-20241022` |
| `OPENAI_API_KEY` | Optional cloud API key for OpenAI GPT-4o-mini | *(Leave empty for local demo)* |
| `OPENAI_MODEL` | OpenAI model identifier | `gpt-4o-mini` |
| `SIMILARITY_THRESHOLD` | Cosine similarity cutoff for RAG grounding | `0.20` |

---

## 5. Testing & Verification

### Automated Test Suite (100% Pass Rate)
The test suite covers API contracts, session persistence, vector retrieval, out-of-scope rejection, and provider fallback resilience:

```powershell
cd backend
py -m pytest app/tests -v
```

**Results:**
- `app/tests/test_api.py::test_root_endpoint`: **PASSED**
- `app/tests/test_api.py::test_health_endpoint`: **PASSED**
- `app/tests/test_api.py::test_session_lifecycle`: **PASSED**
- `app/tests/test_providers.py::test_ollama_provider_health`: **PASSED**
- `app/tests/test_providers.py::test_claude_provider_unconfigured_state`: **PASSED**
- `app/tests/test_providers.py::test_ollama_provider_offline_resilience`: **PASSED**
- `app/tests/test_retrieval.py::test_retrieval_elena_verna_plg`: **PASSED**
- `app/tests/test_retrieval.py::test_retrieval_shreyas_doshi_pm`: **PASSED**
- `app/tests/test_retrieval.py::test_out_of_scope_rejection`: **PASSED**

---

## 6. UI Manual Test Plan

| Test ID | Test Scenario | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UI-01** | **Initial Load & Health Status** | Open `http://localhost:3000` | Header displays model status badges; starter suggestion pills render; chat history displays active session. | ✅ PASS |
| **UI-02** | **Grounded RAG Query & Citations** | Click *"What does Elena Verna say about B2B product-led growth vs sales-led growth?"* | Assistant streams answer with inline citation tags; citation badge expands on click to reveal exact guest quotes and match score. | ✅ PASS |
| **UI-03** | **Out-of-Scope Rejection** | Send *"What is the capital of Australia?"* | System responds strictly: *"I do not have sufficient information in Lenny's podcast archive to answer this question."* with zero hallucinated facts. | ✅ PASS |
| **UI-04** | **Ship 30 for 30 Essay Mode** | Toggle **Ship 30 for 30 Mode** switch to ON; ask *"Turn Shreyas Doshi's advice into a Ship 30 essay"* | Output formats with an attention-grabbing hook, 1-3 sentence paragraphs, bold anchor words, and ~1,250 words. | ✅ PASS |
| **UI-05** | **Artifact Dual-Canvas & Sandboxing** | Ask *"Create an interactive PLG vs SLG ROI calculator widget in HTML/CSS"* | Side canvas smoothly docks; interactive sliders function live; iframe enforces `sandbox="allow-scripts"` with zero access to parent cookies or DOM. | ✅ PASS |
| **UI-06** | **Artifact Code & Copy** | Click **Code** tab in canvas, then click **Copy** | Displays clean syntax-highlighted source; button shows *"Copied!"* feedback; clipboard contains raw code. | ✅ PASS |
| **UI-07** | **Dynamic Model Switching** | Switch dropdown from **Local Ollama** to **Claude 3.5** or **OpenAI** | UI indicates active model; if cloud key is missing or depleted, a clear actionable banner directs to local mode without crash. | ✅ PASS |
| **UI-08** | **Session Management** | Click **+ New Chat** in sidebar | Clears message thread, establishes new UUID session, updates URL, and persists in history list. | ✅ PASS |

---

## 7. Troubleshooting & FAQs

### Q1: Ollama is running but the backend says "Cannot connect to Ollama"?
- Verify Ollama is listening: run `curl http://localhost:11434/api/tags` in your terminal.
- Ensure the model is pulled: run `ollama run llama3.2:3b`.
- If running under Docker, verify `OLLAMA_BASE_URL` is set to `http://host.docker.internal:11434`.

### Q2: Can I evaluate the app if I don't have Docker installed?
- **Yes.** Follow **Option B: Standalone Local Run**. The backend will automatically detect the absence of PostgreSQL and seamlessly initialize the embedded vector store (`lenny_assistant.db`), ensuring 100% of features operate locally.

### Q3: What happens if my Claude or OpenAI key runs out of credits?
- The assistant intercepts `400 / 429` credit exhaustion errors and renders a friendly warning banner advising you to top up credits or simply switch back to **Local Ollama** (which is 100% free and offline).

### Q4: Port 8000 or 3000 is already in use on my machine?
- **Backend:** `py -m uvicorn app.main:app --port 8001` (and set `VITE_API_URL=http://localhost:8001` in `frontend/.env`).
- **Frontend:** `npm run dev -- --port 3001`.

---

## 8. Video Walkthrough Guide (2–3 Min Recording)

For the final submission requirement (2–3 minute video walkthrough with camera):

### Camera & Screen Setup:
- Position your webcam in the top corner.
- Open `http://localhost:3000` with the browser in full screen.

### 2-Minute Demonstration Script:
1. **0:00 - 0:30 (Introduction & Architecture)**:
   - *"Hi! I'm presenting The Lenny Growth Assistant, an enterprise RAG assistant built for product leaders. It features dynamic switching between offline Local Ollama and cloud models, strict citation grounding, Ship 30 for 30 ghostwriting, and a sandboxed Claude-style artifact canvas."*
2. **0:30 - 1:00 (Grounded RAG & Citation Transparency)**:
   - Click the Elena Verna prompt pill.
   - Highlight the streaming tokens and the expandable citation accordion showing verbatim quotes from the podcast archive.
   - Demonstrate out-of-scope rejection: type *"What is the capital of France?"* and show the refusal.
3. **1:00 - 1:45 (Ship 30 for 30 Mode & Interactive Canvas)**:
   - Flip the **Ship 30 for 30 Mode** switch. Ask for Shreyas Doshi's Good vs Great PM essay. Point out the hook, short paragraphs, and bold anchor words.
   - Ask for an interactive PLG calculator widget. Watch the side-by-side canvas dock, demonstrate the live sliders inside the sandboxed iframe, and show the Code view.
4. **1:45 - 2:15 (Resilience & Wrap Up)**:
   - Demonstrate the model selector dropdown (Ollama / Claude / OpenAI).
   - Conclude: *"All code is strictly typed with 100% passing automated tests and one-command Docker orchestration. Thank you!"*

