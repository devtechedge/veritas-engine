"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Play, RotateCw, Terminal, CheckCircle2, FileText, 
  Layers, Sliders, ShieldAlert, BookOpen, ExternalLink, Activity,
  Copy, Download, Award, Database
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
      // 2. Heading 2
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={`${i}-${j}`} className="text-sm font-bold text-emerald-400 mb-3 mt-5 tracking-wider uppercase">
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
        <p key={`${i}-${j}`} className="mb-4 leading-relaxed text-xs text-slate-300">
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
    setActiveNode("plannerNode");
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
              }
            } else if (eventType === "agent_error") {
              addLog("error", payload.error);
            } else if (eventType === "agent_end") {
              addLog("system", "Engine cycle optimized and execution safe.");
              setActiveNode(null);
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

  // Helper utility to copy briefs to clipboard
  const copyBriefToClipboard = () => {
    if (!document) return;
    navigator.clipboard.writeText(document);
  };

  // Helper utility to export brief as an actual local .md file download
  const exportAsMarkdown = () => {
    if (!document) return;
    const blob = new Blob([document], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `veritas_report_${query.replace(/\s+/g, "_").toLowerCase() || "brief"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Dynamic console color mappings
  const getLogStyle = (node: string, msg: string) => {
    const lowerMsg = msg.toLowerCase();
    if (node === "system") return "text-slate-500 font-medium";
    if (node === "error" || lowerMsg.includes("failed") || lowerMsg.includes("exception")) return "text-rose-400 font-semibold";
    if (lowerMsg.startsWith("planner")) return "text-cyan-400";
    if (lowerMsg.startsWith("searcher")) return "text-purple-400";
    if (lowerMsg.startsWith("critic")) return "text-emerald-400";
    if (lowerMsg.startsWith("synthesizer")) return "text-amber-400";
    return "text-slate-300";
  };

  // Graph state mappings
  const getNodeClasses = (nodeId: string) => {
    const isActive = activeNode === nodeId;
    const isCompleted = executionSteps.includes(nodeId);

    if (isActive) {
      return "border-emerald-500 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse text-white";
    }
    if (isCompleted) {
      return "border-emerald-500/80 bg-slate-900/40 text-emerald-400";
    }
    return "border-slate-800/80 bg-slate-950/40 text-slate-500 select-none";
  };

  // Radial progress ring score metrics
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = score !== null ? circumference - (circumference * score) / 10 : circumference;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* SaaS Glassmorphic Header Bar */}
      <header className="border-b border-slate-900/60 bg-slate-950/80 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="h-9 w-9 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/30">
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-md font-semibold tracking-wider font-mono text-white">
                VERITAS ENGINE
              </span>
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 uppercase">
                v1.1 Active
              </span>
            </div>
            <p className="text-2xs text-slate-500 font-mono">Self-Correcting Autonomous Architecture</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center space-x-3 text-xs select-none">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Vercel Serverless Runtime
          </span>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-6 xl:p-8 max-w-[1600px] mx-auto w-full overflow-hidden">
        
        {/* Left Hand: Controls & Agent Status Graph (5 Columns) */}
        <section className="xl:col-span-5 flex flex-col space-y-6">
          
          {/* Query Inputs Panel */}
          <div className="backdrop-blur-md bg-slate-950/80 border border-slate-800/50 shadow-2xl rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2 font-mono">
              <Sliders className="h-4 w-4 text-emerald-400" /> Orchestration Panel
            </h2>
            <form onSubmit={triggerSearch} className="space-y-4">
              <div className="space-y-2">
                <label className="text-2xs text-slate-500 font-mono">Inquiry Target</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., Next.js Edge Execution Performance Limits"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 rounded-lg px-4 py-3 text-xs text-slate-200 placeholder-slate-600 outline-none transition duration-200 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 select-none">
                <div className="flex justify-between text-2xs font-mono text-slate-500">
                  <span>Self-Correction Iteration Depth</span>
                  <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
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
                  className="w-full accent-emerald-500 cursor-pointer bg-slate-900 h-1.5 rounded-lg appearance-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs font-mono flex items-center justify-center space-x-2 shadow-lg transition duration-200 cursor-pointer"
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
          <div className="backdrop-blur-md bg-slate-950/80 border border-slate-800/50 shadow-2xl rounded-xl p-5 flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2 mb-6 font-mono">
                <Activity className="h-4 w-4 text-emerald-400" /> Graph Visualizer
              </h2>
              
              <div className="space-y-4 relative select-none">
                <div className="absolute left-[29px] top-6 bottom-6 w-0.5 border-l border-dashed border-slate-800 z-0" />
                {[
                  { id: "plannerNode", label: "Planner Agent", desc: "Formulates objective blueprints" },
                  { id: "searchNode", label: "Retrieval Cluster", desc: "Concurrent multi-query search protocols" },
                  { id: "criticNode", label: "Critic Quality Auditor", desc: "Automated verification & feedback loops" },
                  { id: "synthesizerNode", label: "Synthesis Engine", desc: "Compiles briefs into structured Markdown" },
                ].map((step, idx) => {
                  const isActive = activeNode === step.id;
                  const isCompleted = executionSteps.includes(step.id);
                  
                  return (
                    <div key={step.id} className="relative z-10">
                      <div className={`flex items-center space-x-4 p-3 rounded-lg border transition duration-200 ${getNodeClasses(step.id)}`}>
                        <div
                          className={`h-8 w-8 rounded-full border flex items-center justify-center text-xs font-mono font-bold shrink-0 transition duration-200 ${
                            isActive
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                              : isCompleted
                              ? "bg-slate-900 border-slate-800 text-slate-400"
                              : "bg-slate-950 border-slate-900 text-slate-600"
                          }`}
                        >
                          {isActive ? (
                            <RotateCw className="h-4 w-4 animate-spin text-emerald-400" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-fade-in" />
                          ) : (
                            <span className="text-2xs">0{idx + 1}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold tracking-wide font-mono">
                            {step.label}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{step.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Loop Status Bar */}
            {score !== null && (
              <div className="mt-6 border border-slate-800/85 bg-slate-950/60 rounded-xl p-3 flex items-center justify-between font-mono select-none">
                <span className="text-2xs text-slate-500">Critic Score Outcome:</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    score >= 8
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/30"
                      : "bg-amber-950/40 text-amber-400 border-amber-800/30"
                  }`}
                >
                  {score} / 10
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Right Hand: Terminal & Knowledge Brief Display Tabs (7 Columns) */}
        <section className="xl:col-span-7 flex flex-col space-y-6">
          
          {/* Live System Terminal */}
          <div className="bg-slate-950 border border-slate-800/50 shadow-2xl rounded-xl p-4 h-64 flex flex-col font-mono text-[11px]">
            <div className="flex items-center justify-between border-b border-slate-900/60 pb-3 mb-4 select-none">
              <span className="text-slate-400 flex items-center gap-2 font-bold tracking-wider">
                <Terminal className="h-4 w-4 text-emerald-400" /> LIVE LOGSTREAM TELEMETRY
              </span>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold text-slate-500">SYS: READY</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="text-slate-650 h-full flex items-center justify-center select-none italic text-slate-600">
                  Systems idle. Enter query and submit to trace routing events.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`flex items-start space-x-2 leading-relaxed border-b border-slate-900/40 last:border-0 pb-1 last:pb-0 ${getLogStyle(log.node, log.message)}`}>
                    <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className="font-bold uppercase shrink-0 tracking-wide">
                      {log.node}:
                    </span>
                    <span className="break-words">{log.message}</span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Interactive Knowledge Dashboard Panel */}
          <div className="backdrop-blur-md bg-slate-950/80 border border-slate-800/50 shadow-2xl rounded-xl flex-1 flex flex-col overflow-hidden min-h-[450px]">
            
            {/* Sliding Tab Header */}
            <div className="flex p-1 bg-slate-950 border border-slate-800/60 rounded-lg max-w-sm mt-4 ml-4 select-none">
              <button
                onClick={() => setActiveTab("brief")}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold font-mono text-center transition-all duration-300 rounded-md flex items-center justify-center gap-1.5 ${
                  activeTab === "brief" 
                    ? "bg-slate-900 border border-slate-800 text-white shadow-md" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Synthesized Brief
              </button>
              <button
                onClick={() => setActiveTab("critic")}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold font-mono text-center transition-all duration-300 rounded-md flex items-center justify-center gap-1.5 ${
                  activeTab === "critic" 
                    ? "bg-slate-900 border border-slate-800 text-white shadow-md" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Quality Audit
              </button>
              <button
                onClick={() => setActiveTab("sources")}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold font-mono text-center transition-all duration-300 rounded-md flex items-center justify-center gap-1.5 ${
                  activeTab === "sources" 
                    ? "bg-slate-900 border border-slate-800 text-white shadow-md" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Source Matrix
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-6 overflow-y-auto max-h-[500px]">
              {activeTab === "brief" && (
                document ? (
                  <div className="flex-1 flex flex-col gap-4">
                    {/* Header Utility Bar */}
                    <div className="flex items-center justify-between border-b border-slate-900/60 pb-3 select-none">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-emerald-400" />
                        <span className="text-2xs font-mono text-slate-400 uppercase tracking-wider">Research brief</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <button
                          onClick={copyBriefToClipboard}
                          className="px-2.5 py-1 text-3xs border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white rounded flex items-center gap-1.5 transition-all"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copy Brief</span>
                        </button>
                        <button
                          onClick={exportAsMarkdown}
                          className="px-2.5 py-1 text-3xs border border-emerald-800/40 bg-emerald-950/10 hover:bg-emerald-950/30 text-emerald-400 hover:text-emerald-300 rounded flex items-center gap-1.5 transition-all"
                        >
                          <Download className="h-3 w-3" />
                          <span>Export .md</span>
                        </button>
                      </div>
                    </div>
                    <div className="markdown-body space-y-4 leading-relaxed text-slate-300 custom-scrollbar">
                      {renderMarkdown(document)}
                    </div>
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
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Circle Score progress ring */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center border border-slate-800/60 bg-slate-950/30 rounded-xl p-4 select-none">
                      <div className="relative flex items-center justify-center">
                        <svg className="h-24 w-24 transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            className="stroke-slate-900 fill-none"
                            strokeWidth="6"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            className="stroke-emerald-500 fill-none transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            strokeWidth="6"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute font-mono text-lg font-bold text-white">{score}<span className="text-slate-500 text-xs">/10</span></span>
                      </div>
                      <div className="text-center mt-3 font-mono">
                        <h4 className="text-2xs font-semibold text-slate-300 uppercase tracking-wider">Quality Audit Score</h4>
                        <p className="text-3xs text-slate-500 mt-0.5">Automated validation criteria</p>
                      </div>
                    </div>

                    {/* Commentary Layout */}
                    <div className="md:col-span-8 flex flex-col gap-3">
                      <div className="flex items-center gap-2 border-b border-slate-900/60 pb-2 select-none">
                        <Award className="h-4 w-4 text-emerald-400" />
                        <span className="text-2xs font-mono text-slate-400 uppercase tracking-wider">Auditor Notes & Gap Rectifications</span>
                      </div>
                      <div className="flex-1 text-xs text-slate-300 leading-relaxed font-mono max-h-[300px] overflow-y-auto pr-2 custom-scrollbar bg-slate-950/20 p-3 rounded-lg border border-slate-900">
                        {feedback || "Evaluator has not left notes on current payload."}
                      </div>
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
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-900/60 pb-2 select-none">
                      <Database className="h-4 w-4 text-emerald-400" />
                      <span className="text-2xs font-mono text-slate-400 uppercase tracking-wider">Fact-checked mapping data index metrics</span>
                    </div>
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar font-mono">
                      {[
                        { id: 1, host: "wikipedia.org", type: "Consensus Reference", trust: "High" },
                        { id: 2, host: "github.com/engine-telemetry", type: "Developer Specification", trust: "High" },
                        { id: 3, host: "ieee.org/publications", type: "Academic Standard Matrix", trust: "Verified" }
                      ].map((src) => (
                        <div key={src.id} className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex justify-between items-center text-xs hover:border-slate-700 transition-colors">
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