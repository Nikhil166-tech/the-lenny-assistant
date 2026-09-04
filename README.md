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
| `SIMILARITY_THRESHOLD` | Cosine similarity cutoff for RAG grounding | `0.20` |

---

## 5. Testing & Verification

Run the automated backend test suite (covering API contracts, vector retrieval, out-of-scope rejection, and provider resilience):

```powershell
cd backend
py -m pytest app/tests -v
```

### Test Suite Output:
- `test_root_endpoint`: **PASSED**
- `test_health_endpoint`: **PASSED**
- `test_session_lifecycle`: **PASSED**
- `test_ollama_provider_health`: **PASSED**
- `test_claude_provider_unconfigured_state`: **PASSED**
- `test_ollama_provider_offline_resilience`: **PASSED**
- `test_retrieval_elena_verna_plg`: **PASSED**
- `test_retrieval_shreyas_doshi_pm`: **PASSED**
- `test_out_of_scope_rejection`: **PASSED**

---

## 6. Demonstration & Evaluator Walkthrough

1. **Verify Local Ollama Execution:**
   - In the top bar, ensure **Local Ollama** is selected.
   - Click the prompt pill: *"What does Elena Verna say about B2B product-led growth vs sales-led growth?"*
   - Verify the citation badge expands to reveal verbatim quotes from Elena Verna.
2. **Test Out-of-Scope Rejection:**
   - Ask an unrelated query: *"What is the capital of France?"* or *"How to build an internal combustion engine?"*
   - Verify the assistant strictly refuses: *"I do not have sufficient information in Lenny's podcast archive to answer this."*
3. **Execute Ship 30 for 30 Mode:**
   - Click the **Ship 30 for 30 Mode** toggle switch (turns ON).
   - Enter: *"Turn Shreyas Doshi's advice on Good vs Great Product Managers into a Ship 30 for 30 essay."*
   - Review the generated essay: headline hook, ~1,250 words, short paragraphs, bold anchor words, and concrete takeaways.
4. **Generate & Preview Interactive Artifacts:**
   - Enter: *"Create an interactive PLG vs SLG ROI calculator widget in HTML/CSS with sliders."*
   - Observe the Claude-style side canvas slide in.
   - Test the sliders and live calculations inside the sandboxed iframe.
   - Toggle between **Live Preview** and **Code** tabs or copy the code.
5. **Toggle Cloud Model (Claude 3.5 Sonnet):**
   - Click **Claude 3.5** in the model selector.
   - When an `ANTHROPIC_API_KEY` is provided, live Claude streaming initiates with sub-second latency.
