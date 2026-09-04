# UI / UX Design Specification
## The Lenny Growth Assistant

### 1. Design Philosophy & Aesthetic Principles
The Lenny Growth Assistant interface follows modern, high-craft design standards inspired by Claude Artifacts and Linear:
1. **High Information Density with Clarity:** Clean typography (Inter / Outfit / SF Pro), generous white space, and clear structural hierarchy.
2. **Side-by-Side Dual Pane Canvas:** Eliminates modal cognitive friction by placing interactive artifacts beside the chat thread.
3. **Transparent System Status:** Immediate micro-feedback during RAG retrieval (`"Searching 200+ hours of podcast archives..."`), streaming tokens, and citation pill highlights.
4. **Curated Color System:** Modern deep obsidian dark theme with emerald and indigo accents (`#0f172a`, `#1e293b`, `#10b981`, `#6366f1`).

---

### 2. Information Architecture & Key Layout Components

```
┌───────────────────────────────┬────────────────────────────────────────┬────────────────────────────────────────┐
│ Sidebar (Sessions)            │ Chat Pane (Conversation)               │ Artifact Canvas (Drawer)               │
├───────────────────────────────┼────────────────────────────────────────┼────────────────────────────────────────┤
│ [ + New Chat ]                │ ── Model Selector: [Ollama 3.2 ▾]      │ Artifact: PLG Calculator [HTML]       │
│                               │ ── Ship 30 Mode:   [ OFF / ON ]        │ [ Preview ]  [ Code ]  [ Copy ]  [ ✕ ] │
│ Recent Threads:               │                                        │                                        │
│ • Elena Verna on PLG Loops    │ User:                                  │ ┌────────────────────────────────────┐ │
│ • Brian Chesky Founder Mode   │ "How to build B2B viral loops?"        │ │                                    │ │
│ • Shreyas Doshi Great PMs     │                                        │ │  [ Interactive Calculator ]        │ │
│                               │ Assistant:                             │ │  Monthly Signups: [ 10,000 ]       │ │
│                               │ According to Elena Verna [Ep: Elena].. │ │  Viral Coefficient: [ 1.2 ]        │ │
│                               │                                        │ │  Net Growth: +120%                 │ │
│                               │ ┌────────────────────────────────────┐ │ │                                    │ │
│                               │ │ 📄 Generated HTML Artifact         │ │ └────────────────────────────────────┘ │
│                               │ │ [ View Interactive Tool ➜ ]        │ │                                        │
│                               │ └────────────────────────────────────┘ │                                        │
│                               │                                        │                                        │
│                               │ [ Type a question or request...    ]   │                                        │
└───────────────────────────────┴────────────────────────────────────────┴────────────────────────────────────────┘
```

---

### 3. Component Details & Interactions

#### 3.1 Model Switcher
* Located in the top header.
* Allows instantaneous switching between **Local Ollama (`llama3.2:3b`)** and **Cloud Claude 3.5**.
* Features a visual badge indicating model execution locality (e.g., green dot for `Local Ollama: Offline Ready`, purple spark for `Claude 3.5 Sonnet`).

#### 3.2 "Ship 30 for 30" Mode Toggle
* Quick-action switch above the prompt bar.
* When active, visually badges the composer with `Ship 30 for 30 Engine Active` and formats subsequent outputs into a 1,250-word, high-skimmability essay with bold anchor words and clear takeaways.

#### 3.3 Source Citation Pills
* Every grounded claim links to an expandable source pill:
  * Guest name, episode title, and topic.
  * Relevance similarity score badge (e.g. `94% match`).
  * Clicking reveals the verbatim transcript excerpt used to generate the answer.

#### 3.4 The Artifact Canvas
* Smooth slide-in transition from the right edge when an artifact is detected.
* Collapsible on small screens or dismissible via close `✕`.
* Tabs:
  * **Live Preview:** Sandboxed execution inside isolated iframe.
  * **Source Code:** Syntax-highlighted code with line numbers.
  * **One-Click Copy:** Copies complete code or Markdown directly to clipboard.

---

### 4. Accessibility & Responsive Heuristics
* **Keyboard Navigation:** Full Tab, Enter, and Escape support (Escape closes the Artifact Viewer; `Cmd/Ctrl + K` starts a new chat).
* **Color Contrast:** Contrast ratios $\ge 4.5:1$ adhering to WCAG 2.1 AA across text, badges, and interactive controls.
* **Responsive Breakpoints:**
  * Desktop ($> 1200\text{px}$): Permanent split-screen canvas.
  * Tablet ($768\text{px} - 1200\text{px}$): 60/40 proportional split with toggle drawer.
  * Mobile ($< 768\text{px}$): Tabbed toggle between Chat and Artifact view.
