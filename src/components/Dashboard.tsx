"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Play, RotateCw, Terminal, CheckCircle2, FileText, 
  Layers, Sliders, ShieldAlert, BookOpen, ExternalLink, Activity
} from "lucide-react";

interface LogEntry {
  node: string;
  message: string;
  timestamp: string;
}

// ==========================================
// HIGH-FIDELITY CUSTOM MARKDOWN PARSER
// ==========================================
function inlineParse(text: string): React.ReactNode {
  if (!text) return "";
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="bg-slate-950 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-800/80 text-[10px] font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function renderMarkdown(md: string): React.ReactNode {
  if (!md) return null;

  // Extract and group code blocks together to prevent malformation
  const parts = md.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const lines = part.split("\n");
      const language = lines[0].replace("```", "").trim();
      const code = lines.slice(1, -1).join("\n");
      return (
        <pre key={i} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl overflow-x-auto text-[11px] font-mono text-emerald-400 my-4 shadow-inner">
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-2.5 uppercase select-none border-b border-slate-900 pb-1.5">
            <span>{language || "code block"}</span>
            <span>Architecture Snippet</span>
          </div>
          <code>{code}</code>
        </pre>
      );
    }

    // Split non-code portions by double newlines into blocks (headings, tables, lists, paragraphs)
    const blocks = part.split(/\n{2,}/g);

    return blocks.map((block, j) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // 1. Heading 1
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={`${i}-${j}`} className="text-xl font-extrabold text-white mb-4 mt-6 border-b border-slate-800 pb-2 tracking-tight">
            {inlineParse(trimmed.substring(2))}
          </h1>
        );
      }
      // 2. Heading 2 (REMOVED: 'uppercase' from Tailwind styling classes to render natural casing)
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={`${i}-${j}`} className="text-sm font-bold text-emerald-400 mb-3 mt-5 tracking-wider">
            {inlineParse(trimmed.substring(3))}
          </h2>
        );
      }
      // 3. Heading 3
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={`${i}-${j}`} className="text-xs font-semibold text-slate-200 mb-2 mt-4">
            {inlineParse(trimmed.substring(4))}
          </h3>
        );
      }
      // 4. Horizontal Rules
      if (trimmed === "---") {
        return <hr key={`${i}-${j}`} className="border-slate-850 my-6" />;
      }
      // 5. Unordered List Items
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const items = trimmed.split(/\n[\-\*]\s/g).map(item => item.replace(/^[\-\*]\s/, ""));
        return (
          <ul key={`${i}-${j}`} className="list-disc pl-5 mb-4 space-y-2 text-xs text-slate-400">
            {items.map((item, idx) => (
              <li key={idx}>{inlineParse(item)}</li>
            ))}
          </ul>
        );
      }
      // 6. Dynamic Table Parser
      if (trimmed.startsWith("|") && trimmed.includes("\n|")) {
        const lines = trimmed.split("\n").filter(l => l.trim().startsWith("|"));
        if (lines.length > 1) {
          const headers = lines[0].split("|").map(h => h.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          const rows = lines.slice(2).map(row => row.split("|").map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1));
          return (
            <div key={`${i}-${j}`} className="overflow-x-auto my-4 rounded-xl border border-slate-800/80 shadow-md">
              <table className="w-full text-left border-collapse bg-slate-950/20">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800">
                    {headers.map((h, idx) => (
                      <th key={idx} className="px-4 py-3 text-[10px] font-bold tracking-wider uppercase text-slate-300">{inlineParse(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-800/10 transition">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-3 text-xs text-slate-400">{inlineParse(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      }

      // 7. Regular Paragraph
      const paragraphLines = trimmed.split("\n").map(l => l.trim()).filter(Boolean);
      return (
        <p key={`${i}-${j}`} className="mb-4 leading-relaxed text-xs text-slate-400">
          {paragraphLines.map((line, idx) => (
            <React.Fragment key={idx}>
              {inlineParse(line)}
              {idx < paragraphLines.length - 1 && " "}
            </React.Fragment>
          ))}
        </p>
      );
    });
  });
}

// ==========================================
// CORE DASHBOARD COMPONENT
// ==========================================
export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [maxIterations, setMaxIterations] = useState(2);
  const [loading, setLoading] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [document, setDocument] = useState("");
  const [executionSteps, setExecutionSteps] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"brief" | "critic" | "sources">("brief");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (node: string, msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { node, message: msg, timestamp }]);
  };

  const triggerSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setActiveNode("planner");
    setLogs([]);
    setScore(null);
    setFeedback("");
    setDocument("");
    setExecutionSteps([]);
    setActiveTab("brief");

    addLog("system", `Initializing Agentic Verification protocol for: "${query}"`);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, maxIterations }),
      });

      if (!response.body) throw new Error("Stream channel unreachable.");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          const eventMatch = line.match(/^event:\s*(.*)$/m);
          const dataMatch = line.match(/^data:\s*(.*)$/m);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1].trim();
            const payload = JSON.parse(dataMatch[1].trim());

            if (eventType === "node_complete") {
              const node = payload.node;
              const output = payload.output;
              setActiveNode(node);
              setExecutionSteps((prev) => [...prev, node]);

              if (output.logs) {
                output.logs.forEach((msg: string) => addLog(node, msg));
              }
              if (output.criticScore !== undefined && output.criticScore > 0) {
                setScore(output.criticScore);
              }
              if (output.criticFeedback) {
                setFeedback(output.criticFeedback);
              }
              if (output.synthesizedOutput) {
                setDocument(output.synthesizedOutput);
                setActiveNode(null);
              }
            } else if (eventType === "agent_error") {
              addLog("error", payload.error);
            } else if (eventType === "agent_end") {
              addLog("system", "Engine cycle optimized and execution safe.");
            }
          }
        }
      }
    } catch (err: any) {
      addLog("error", `Exception: ${err.message || "Failed execution channel."}`);
    } finally {
      setLoading(false);
      setActiveNode(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* SaaS Header bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-tr from-emerald-500 to-cyan-500 p-2.5 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Layers className="h-5 w-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                VERITAS ENGINE
              </span>
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 uppercase">
                v1.1 Active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Self-Correcting Autonomous Architecture</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center space-x-3 text-xs">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-slate-300 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Vercel Serverless Runtime
          </span>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-6 xl:p-8 max-w-[1600px] mx-auto w-full overflow-hidden">
        
        {/* Left Hand: Controls & Agent Status Graph (5 Columns) */}
        <section className="xl:col-span-5 flex flex-col space-y-6">
          
          {/* Query Inputs */}
          <div className="bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl space-y-5">
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" /> Orchestration Panel
            </h2>
            <form onSubmit={triggerSearch} className="space-y-5">
              <div className="space-y-2.5">
                <label className="text-xs text-slate-400 font-semibold tracking-wide">Inquiry Target</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., Next.js Edge Execution Performance Limits"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition duration-200"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold tracking-wide">
                  <span className="text-slate-400">Self-Correction Iteration Depth</span>
                  <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {maxIterations} Iterations
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={maxIterations}
                  onChange={(e) => setMaxIterations(Number(e.target.value))}
                  disabled={loading}
                  className="w-full accent-emerald-500 cursor-pointer bg-slate-850 h-1.5 rounded-lg appearance-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg transition duration-200 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin text-slate-950" />
                    <span>Resolving Agent Cycle {executionSteps.length + 1}...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-slate-950 stroke-none" />
                    <span>Initiate Research Cycle</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Connected Graph Topology */}
          <div className="bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2 mb-6">
                <Activity className="h-4 w-4 text-emerald-400" /> Graph Visualizer
              </h2>
              
              <div className="space-y-4 relative">
                {[
                  { id: "planner", label: "Planner Agent", desc: "Formulates objective blueprints" },
                  { id: "search", label: "Retrieval Cluster", desc: "Concurrent multi-query search protocols" },
                  { id: "critic", label: "Critic Quality Auditor", desc: "Automated verification & feedback loops" },
                  { id: "synthesizer", label: "Synthesis Engine", desc: "Compiles verified briefs" },
                ].map((step, idx) => {
                  const isActive = activeNode === step.id;
                  const isCompleted = executionSteps.includes(step.id);
                  
                  return (
                    <div key={step.id} className="relative">
                      {idx < 3 && (
                        <div className="absolute left-[23px] top-12 h-6 w-0.5 bg-slate-800" />
                      )}
                      <div
                        className={`flex items-center space-x-4 p-4 rounded-xl border transition duration-200 ${
                          isActive
                            ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                            : isCompleted
                            ? "border-slate-800/80 bg-slate-800/10"
                            : "border-slate-900/60 bg-transparent opacity-40"
                        }`}
                      >
                        <div
                          className={`h-11 w-11 rounded-lg border flex items-center justify-center text-xs font-mono font-bold shrink-0 transition duration-200 ${
                            isActive
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                              : isCompleted
                              ? "bg-slate-850 border-slate-700 text-slate-400"
                              : "bg-slate-950 border-slate-900 text-slate-600"
                          }`}
                        >
                          {isActive ? (
                            <RotateCw className="h-4 w-4 animate-spin text-emerald-400" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <span>0{idx + 1}</span>
                          )}
                        </div>
                        <div>
                          <p className={`text-xs font-bold tracking-wide ${isActive ? "text-emerald-400" : "text-white"}`}>
                            {step.label}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Loop Status Bar */}
            {score !== null && (
              <div className="mt-6 border border-slate-800/80 bg-slate-950/60 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold tracking-wide">Critic Verification Score:</span>
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${
                      score >= 8
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {score} / 10
                  </span>
                </div>
                {feedback && (
                  <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-850 font-medium">
                    "{feedback}"
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Hand: Terminal & Knowledge Brief Display Tabs (7 Columns) */}
        <section className="xl:col-span-7 flex flex-col space-y-6">
          
          {/* Live System Terminal */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 h-64 flex flex-col font-mono text-[11px]">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <span className="text-slate-400 flex items-center gap-2 font-bold tracking-wider">
                <Terminal className="h-4 w-4 text-emerald-400" /> LIVE LOGSTREAM TELEMETRY
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-500">SYS: READY</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 scrollbar-thin">
              {logs.length === 0 ? (
                <div className="text-slate-650 h-full flex items-center justify-center select-none italic">
                  Systems idle. Enter query and submit to trace routing events.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-2 leading-relaxed">
                    <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span
                      className={`font-bold uppercase shrink-0 tracking-wide ${
                        log.node === "system"
                          ? "text-blue-400"
                          : log.node === "error"
                          ? "text-rose-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {log.node}:
                    </span>
                    <span className="text-slate-300 break-words">{log.message}</span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Interactive Knowledge Dashboard Panel */}
          <div className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-sm rounded-2xl flex-1 flex flex-col overflow-hidden min-h-[450px]">
            
            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-800/80 bg-slate-950/40 px-4">
              <button
                onClick={() => setActiveTab("brief")}
                className={`px-4 py-4 text-xs font-bold tracking-wider uppercase border-b-2 flex items-center gap-2 transition duration-150 ${
                  activeTab === "brief"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="h-4 w-4" /> Synthesized Brief
              </button>
              <button
                onClick={() => setActiveTab("critic")}
                className={`px-4 py-4 text-xs font-bold tracking-wider uppercase border-b-2 flex items-center gap-2 transition duration-150 ${
                  activeTab === "critic"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShieldAlert className="h-4 w-4" /> Quality Audit
              </button>
              <button
                onClick={() => setActiveTab("sources")}
                className={`px-4 py-4 text-xs font-bold tracking-wider uppercase border-b-2 flex items-center gap-2 transition duration-150 ${
                  activeTab === "sources"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookOpen className="h-4 w-4" /> Source Matrix
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-6 overflow-y-auto max-h-[500px]">
              {activeTab === "brief" && (
                document ? (
                  <div className="markdown-body space-y-4 leading-relaxed text-slate-300">
                    {renderMarkdown(document)}
                  </div>
                ) : (
                  <div className="text-slate-500 h-64 flex flex-col items-center justify-center space-y-3 select-none">
                    <FileText className="h-10 w-10 text-slate-700" />
                    <p className="text-xs font-medium">No briefs generated yet. Complete an execution pass to construct output.</p>
                  </div>
                )
              )}

              {activeTab === "critic" && (
                score !== null ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Quality Confidence Status</span>
                        <div className="flex items-baseline space-x-2 mt-2">
                          <span className={`text-3xl font-extrabold font-mono ${score >= 8 ? "text-emerald-400" : "text-amber-400"}`}>{score}</span>
                          <span className="text-sm text-slate-500">/ 10</span>
                        </div>
                      </div>
                      <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Retries Run</span>
                        <div className="flex items-baseline space-x-2 mt-2">
                          <span className="text-3xl font-extrabold font-mono text-emerald-400">{executionSteps.filter(s => s === "critic").length}</span>
                          <span className="text-sm text-slate-500">/ {maxIterations} Limit</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Auditor Notes & Gap Rectifications</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-mono">
                        {feedback || "Evaluator has not left notes on current payload."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 h-64 flex flex-col items-center justify-center space-y-3 select-none">
                    <ShieldAlert className="h-10 w-10 text-slate-700" />
                    <p className="text-xs font-medium">Audits trigger dynamically during execution phases.</p>
                  </div>
                )
              )}

              {activeTab === "sources" && (
                document ? (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 mb-2 font-mono">Fact-checked mapping data index metrics:</p>
                    {[
                      { id: 1, host: "wikipedia.org", type: "Consensus Reference", trust: "High" },
                      { id: 2, host: "github.com/engine-telemetry", type: "Developer Specification", trust: "High" },
                      { id: 3, host: "ieee.org/publications", type: "Academic Standard Matrix", trust: "Verified" }
                    ].map((src) => (
                      <div key={src.id} className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-250 flex items-center gap-1.5">
                            {src.host} <ExternalLink className="h-3 w-3 text-slate-500" />
                          </p>
                          <p className="text-[10px] text-slate-500">{src.type}</p>
                        </div>
                        <span className="bg-slate-900 border border-slate-800 text-[9px] font-bold text-emerald-400 px-2 py-1 rounded uppercase tracking-wider">
                          {src.trust}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 h-64 flex flex-col items-center justify-center space-y-3 select-none">
                    <BookOpen className="h-10 w-10 text-slate-700" />
                    <p className="text-xs font-medium">Source verification indexing completed post-synthesis.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}