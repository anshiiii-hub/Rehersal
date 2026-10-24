"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AudioLines,
  Plus,
  LayoutGrid,
  ChartNoAxesCombined,
  ArrowUpRight,
  ArrowRight,
  Mic,
  BookOpen,
  ChevronDown,
  Search,
  Settings2,
  Square,
  Upload,
} from "lucide-react";
import { starters } from "@/lib/templates";
import { Config } from "@/lib/schemas";
import { api, authHeaders } from "./api";
export type Agent = {
  id: string;
  name: string;
  config: Config;
  remoteId: string | null;
  published: boolean;
  _count?: { sessions: number };
};
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <AudioLines className="brandmark" size={30} />
          rehearsal<span className="coral">.</span>
        </Link>
        <div className="workspace">
          <span className="avatar">S</span>
          <div>
            My workspace
            <br />
            <small>Personal workspace</small>
          </div>
          <ChevronDown size={13} />
        </div>
        <nav className="nav">
          <Link
            href="/new"
            className={path === "/" || path === "/new" ? "active" : ""}
          >
            <Plus size={17} />
            Create an agent
          </Link>
          <Link href="/agents" className={path === "/agents" ? "active" : ""}>
            <LayoutGrid size={17} />
            My agents
          </Link>
          <Link
            href="/dashboard"
            className={path.startsWith("/dashboard") ? "active" : ""}
          >
            <ChartNoAxesCombined size={17} />
            Overview
          </Link>
          <a href="/guide">
            <BookOpen size={17} />
            Quick start guide
          </a>
        </nav>
        <div className="sidebottom">
          <div className="tip">
            <b>✧ A little practice. A big difference.</b>
            <small>
              Build characters that challenge you, before the real conversation
              does.
            </small>
            <Link
              href="/new"
              style={{ display: "block", marginTop: 12, fontSize: 11 }}
            >
              Explore role-play <span>↗</span>
            </Link>
          </div>
          <button
            className="profile"
            onClick={() => {
              const token = window.prompt(
                "Owner access token (stored for this browser session only)",
              );
              if (token !== null) {
                sessionStorage.setItem("rehearsal-token", token);
                window.location.reload();
              }
            }}
          >
            <span className="avatar">S</span>
            <span>
              Studio workspace
              <br />
              <small>Owner settings ⚙</small>
            </span>
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>
            Workspace{" "}
            <span style={{ padding: "0 12px", color: "#56505f" }}>/</span>{" "}
            {path === "/dashboard"
              ? "Overview"
              : path.startsWith("/agents/")
                ? "Agent workspace"
                : path === "/agents"
                  ? "My agents"
                  : path.startsWith("/sessions/")
                    ? "Session reflection"
                    : path === "/guide"
                      ? "Quick start guide"
                      : "Create an agent"}
          </span>
          <span className="badge">
            <span className="dot" /> Powered by ElevenLabs
          </span>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
export function Toast({ message }: { message: string }) {
  return message ? (
    <div role="status" className="toast">
      {message}
    </div>
  ) : null;
}
export default function Studio() {
  const path = usePathname(),
    router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]),
    [prompt, setPrompt] = useState(""),
    [language, setLanguage] = useState("en"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [live, setLive] = useState(false),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState(""),
    [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null);
  useEffect(() => {
    api("/api/agents")
      .then((d) => {
        setAgents(d.agents);
        setLive(d.live);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    return () => stream.current?.getTracks().forEach((t) => t.stop());
  }, []);
  async function create() {
    setBusy(true);
    setError("");
    try {
      const a = await api("/api/agents", "POST", { prompt, language });
      router.push(`/agents/${a.id}/test`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function transcribe(file: Blob) {
    setBusy(true);
    try {
      const f = new FormData();
      f.set("file", file, "description.webm");
      const r = await fetch("/api/scribe", {
        method: "POST",
        headers: authHeaders(),
        body: f,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setPrompt(d.text.slice(0, 1000));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function mic() {
    if (!live) {
      setError(
        "Add ELEVENLABS_API_KEY to enable Scribe dictation. You can type your description in offline mode.",
      );
      return;
    }
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const r = new MediaRecorder(stream.current);
      recorder.current = r;
      const chunks: BlobPart[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.current?.getTracks().forEach((t) => t.stop());
        transcribe(new Blob(chunks, { type: r.mimeType }));
      };
      r.start();
      setRecording(true);
    } catch {
      setError(
        "Microphone access was denied or is unavailable. You can type your description instead.",
      );
    }
  }
  const listing = path === "/agents";
  return (
    <Shell>
      <div className="heading">
        <div>
          <div className="eyebrow">
            YOUR NEXT GREAT CONVERSATION STARTS HERE
          </div>
          <h1>
            {listing
              ? "Your cast of characters."
              : "What will you bring to life?"}
          </h1>
          <p className="muted">
            {listing
              ? "A little personality. A world of possibilities."
              : "Describe an idea. Give it a voice. See where the conversation goes."}
          </p>
        </div>
        <span className="badge">✧ Built for real conversations</span>
      </div>
      {!live && !loading && (
        <div className="notice">
          Offline demo workspace · Explore the full builder with local
          templates. Add API keys to enable live voice and AI compilation.
        </div>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {!listing && (
        <>
          <div className="builder">
            <div className="flex">
              <span style={{ color: "#c2a2ff" }}>✧</span>
              <b>Every voice starts with an idea</b>
            </div>
            <textarea
              aria-label="Describe your agent"
              maxLength={1000}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="An empathetic patient who’s keeping a secret. A receptionist who never misses a beat. What’s your idea?"
            />
            <div className="builderfoot">
              <div className="flex">
                <button
                  aria-label={
                    recording ? "Stop recording" : "Dictate description"
                  }
                  className="btn"
                  onClick={mic}
                >
                  {recording ? <Square size={15} /> : <Mic size={15} />}
                </button>
                <select
                  aria-label="Agent language"
                  style={{ width: 105, padding: "9px" }}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                </select>
                <small>{prompt.length}/1000</small>
              </div>
              <button
                className="btn primary"
                disabled={busy || prompt.trim().length < 10}
                onClick={create}
              >
                {busy ? "Bringing it to life…" : "Create my agent"}{" "}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
          <div className="sectionhead">
            <h3>A starting point for every possibility</h3>
            <small>Pick a starter. Make it yours.</small>
          </div>
          <div className="grid">
            {starters.map((s, i) => (
              <button
                key={s.title}
                className={`card starter ${i === 0 ? "featured" : ""}`}
                onClick={() => {
                  setPrompt(s.prompt);
                  document.querySelector("textarea")?.focus();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <div className="cardicon">{s.icon}</div>
                {i === 0 && <span className="tag">THE REHEARSAL SPECIAL</span>}
                <h3>
                  {s.title}{" "}
                  <span style={{ float: "right", color: "#766c85" }}>↗</span>
                </h3>
                <p>{s.description}</p>
              </button>
            ))}
          </div>
          <div className="flex" style={{ marginTop: 17, flexWrap: "wrap" }}>
            <small>Try an idea:</small>
            {[
              "A patient with a secret",
              "A tough landlord",
              "A strict viva examiner",
              "A bilingual receptionist",
            ].map((p, i) => (
              <button
                className="badge"
                key={p}
                onClick={() =>
                  setPrompt(
                    [
                      starters[0].prompt,
                      starters[4].prompt,
                      "Create a strict viva examiner who challenges assumptions.",
                      starters[2].prompt,
                    ][i],
                  )
                }
              >
                {p} ↗
              </button>
            ))}
          </div>
        </>
      )}
      <div className="sectionhead">
        <h2>
          {listing ? "All agents" : "Your rehearsal room"}{" "}
          <small style={{ fontSize: 12, marginLeft: 8 }}>
            {agents.length} agents
          </small>
        </h2>
        {!listing && (
          <Link href="/agents" className="muted" style={{ fontSize: 12 }}>
            View all agents ↗
          </Link>
        )}
      </div>
      {listing && (
        <div className="flex" style={{ marginBottom: 20 }}>
          <Search size={17} />
          <input
            aria-label="Search agents"
            placeholder="Search your agents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link href="/new" className="btn primary">
            <Plus size={15} />
            Create
          </Link>
        </div>
      )}
      {loading ? (
        <div className="empty">Opening your workspace…</div>
      ) : agents.length === 0 ? (
        <div className="panel empty">
          Your stage is ready. Describe your first agent above, or run npm run
          seed to meet the demo cast.
        </div>
      ) : (
        <div className="grid">
          {agents
            .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
            .slice(0, listing ? 100 : 3)
            .map((a) => (
              <Link
                key={a.id}
                href={`/agents/${a.id}/test`}
                className="card agentcard"
              >
                <div
                  className="flex"
                  style={{ justifyContent: "space-between" }}
                >
                  <div className="agentavatar">
                    {a.config.kind === "roleplay" ? "◉" : "✧"}
                  </div>
                  <span className="badge">
                    {a.config.kind === "roleplay" ? "Role-play" : "Assistant"}
                  </span>
                </div>
                <h3>{a.name}</h3>
                <p>{a.config.persona.slice(0, 100)}</p>
                <div className="cardfooter">
                  <span>
                    <span
                      className="dot"
                      style={{ display: "inline-block", marginRight: 6 }}
                    />
                    {a.remoteId ? "Voice ready" : "Demo agent"}
                  </span>
                  <span>
                    {a.config.languages
                      .map((l) => (l === "hi" ? "हिन्दी" : "English"))
                      .join(" + ")}{" "}
                    ↗
                  </span>
                </div>
              </Link>
            ))}
        </div>
      )}
      <div className="footer">
        <span>Made for the conversations that matter.</span>
        <span>Write. Test. Refine. Take the stage.</span>
      </div>
    </Shell>
  );
}
