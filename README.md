# Veritas-Engine

An autonomous, self-correcting multi-agent research engine engineered to run serverless on Next.js and LangGraph.js. Veritas-Engine uses structured cyclic feedback loops to execute real-time web searches, audit compiled facts, and synthesize comprehensive, structured research briefs.

## 🛠️ Tech Stack
- **Framework:** Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- **Agent Orchestration:** LangGraph.js & LangChain.js (using modern `Annotation.Root` schemas)
- **Primary LLM:** Google Gemini API (`gemini-1.5-flash` via `@langchain/google-genai`)
- **Fallback LLM:** OpenAI API (`gpt-4o-mini` via `@langchain/openai`)
- **Search Engine:** Tavily Search API
- **Streaming:** Server-Sent Events (SSE) stream utility

---

## 📐 Core Architecture & State Graph Topology

Veritas-Engine models its research workflow as a Directed Acyclic Graph (DAG) using LangGraph.js. Rather than generating reports linearly, the system engages in iterative correction:

[Start] ──> [Planner Node]
│
▼
[Retrieval Node] (Parallel Tavily Searches)
│
▼
[Critic Quality Auditor]
│
▼
< Routing Edge (Score >= 8?) >
/
(No, Score < 8) (Yes, or Max Iterations)
/
▼ ▼
[Planner Node] (Refinement) [Synthesizer Node] ──> [Export/Markdown UI]

1. **Planner Node:** Decodes the user's research request and formulates optimized search query strategies, incorporating previous cycle critiques.
2. **Retrieval Node:** Conducts parallel web-scraping queries using Tavily's search APIs.
3. **Critic Quality Auditor:** Evaluates gathered facts against user intent, grades the research quality on a 1–10 scale, and provides critical feedback.
4. **Routing Edges:** Directs the state. If the grade is $< 8$ and execution depth has not exceeded limits, it loops back to the Planner. If the grade is $\ge 8$, it routes to the Synthesizer.
5. **Synthesizer Node:** Aggregates and organizes validated facts into highly structured Markdown documents.

---

## 🎨 Custom Zero-Dependency Markdown Renderer
To ensure compatibility with Vercel serverless functions and prevent React hydration desynchronization, Veritas-Engine bypasses heavy parser libraries (like `react-markdown`). 

Instead, it implements a lightweight, customized block-level parser inside `src/components/Dashboard.tsx` that translates block elements (Headers, Metrics Tables, Bold text, Lists, and Code Blocks) directly into React Virtual DOM nodes.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x or later)
- Gemini API Key
- Tavily API Key

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/devtechedge/veritas-engine.git
   cd veritas-engine

npm install

GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
OPENAI_API_KEY=your_openai_api_key_here # Optional Fallback

npm run dev

Open http://localhost:3000 in your browser to interact with the dashboard.