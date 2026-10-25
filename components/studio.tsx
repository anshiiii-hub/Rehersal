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
  Moon,
  Sun,
  X,
  Check,
  LockKeyhole,
  RotateCcw,
  SlidersHorizontal,
  Heart,
  Coffee,
  MessageCircle,
  GraduationCap,
  CalendarDays,
  Headphones,
  Handshake,
  Wallet,
  CheckCircle2,
  Circle,
  PencilLine,
  Bookmark,
} from "lucide-react";
import { usePreferences } from "./preferences";
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
  const { preferences, update } = usePreferences();
  const [settings, setSettings] = useState(false),
    [connectionOpen, setConnectionOpen] = useState(false),
    [connectionError, setConnectionError] = useState(""),
    [connecting, setConnecting] = useState(false),
    [draft, setDraft] = useState(preferences),
    [token, setToken] = useState("");
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!settings) return;
    const previous = document.activeElement as HTMLElement | null;
    if (connectionOpen) {
      dialog.current
        ?.querySelector<HTMLInputElement>(
          ".connection-settings input[type='password']",
        )
        ?.focus();
    } else {
      dialog.current?.querySelector<HTMLInputElement>("input")?.focus();
    }
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettings(false);
      if (e.key === "Tab") {
        const nodes = dialog.current?.querySelectorAll<HTMLElement>(
          "button,input,select",
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("keydown", close);
      previous?.focus();
    };
  }, [settings, connectionOpen]);
  function openSettings(showConnection = false) {
    setConnectionError("");
    setDraft(preferences);
    setToken(sessionStorage.getItem("rehearsal-token") || "");
    setConnectionOpen(showConnection);
    setSettings(true);
  }
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ openConnection?: boolean }>;
      openSettings(customEvent.detail?.openConnection ?? false);
    };
    window.addEventListener("rehearsal-open-settings", handleOpen);
    return () =>
      window.removeEventListener("rehearsal-open-settings", handleOpen);
  }, [preferences]);
  const initial = preferences.name ? preferences.name[0].toUpperCase() : "R";
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <AudioLines size={29} />
          rehearsal<span className="coral">.</span>
        </Link>
        <button className="workspace" onClick={() => openSettings()}>
          <span className="avatar">{initial}</span>
          <span className="workspace-copy">
            {preferences.workspace}
            <small>Personal workspace</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="nav-label">YOUR STUDIO</div>
        <nav className="nav">
          <Link
            href="/new"
            className={path === "/" || path === "/new" ? "active" : ""}
          >
            <Plus size={18} />
            Create new
          </Link>
          <Link href="/agents" className={path === "/agents" ? "active" : ""}>
            <LayoutGrid size={17} />
            My characters
          </Link>
          <Link
            href="/dashboard"
            className={
              path === "/dashboard" || path.startsWith("/sessions/")
                ? "active"
                : ""
            }
          >
            <ChartNoAxesCombined size={17} />
            Activity
          </Link>
          <Link href="/guide" className={path === "/guide" ? "active" : ""}>
            <BookOpen size={17} />
            Quick start
          </Link>
        </nav>
        <div className="sidebottom">
          <div className="tip">
            <span className="handwritten">GOOD TO KNOW</span>
            <p>
              Try. Tweak. Try again.
              <br />
              That’s the whole idea.
            </p>
            <Link href="/new">
              Meet your next character <ArrowUpRight size={13} />
            </Link>
          </div>
          <button
            className="theme-toggle"
            onClick={() =>
              update({
                ...preferences,
                theme: preferences.theme === "paper" ? "night" : "paper",
              })
            }
          >
            {preferences.theme === "paper" ? (
              <Moon size={15} />
            ) : (
              <Sun size={15} />
            )}{" "}
            {preferences.theme === "paper"
              ? "Switch to evening mode"
              : "Switch to daylight"}
          </button>
          <button className="profile" onClick={() => openSettings()}>
            <span className="avatar">{initial}</span>
            <span>
              {preferences.name || "Your profile"}
              <small>
                {preferences.name ? "Your personal studio" : "Make it yours"}
              </small>
            </span>
            <Settings2 size={15} />
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span className="breadcrumb">
            {preferences.workspace}
            <span>/</span>
            {path === "/dashboard"
              ? "Activity"
              : path.startsWith("/sessions/")
                ? "A moment to reflect"
                : path.startsWith("/agents/")
                  ? "Character workshop"
                  : path === "/agents"
                    ? "My characters"
                    : path === "/guide"
                      ? "Getting started"
                      : "A fresh page"}
          </span>
          <button
            className="top-profile"
            onClick={() => openSettings()}
            aria-label="Personalize your studio"
          >
            <span className="avatar">{initial}</span>
          </button>
        </header>
        <div className="content">{children}</div>
      </main>
      {settings && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSettings(false);
          }}
        >
          <div
            ref={dialog}
            className="personalize-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="personalize-title"
          >
            <button
              className="dialog-close"
              onClick={() => setSettings(false)}
              aria-label="Close settings"
            >
              <X size={20} />
            </button>
            <span className="eyebrow">A SPACE THAT FEELS LIKE YOU</span>
            <h2 id="personalize-title">Make it yours.</h2>
            <p className="muted">Your name. Your studio. Your style.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const cleanToken = token.trim();
                const changed =
                  cleanToken !==
                  (sessionStorage.getItem("rehearsal-token") || "");
                setConnecting(true);
                setConnectionError("");
                try {
                  if (changed || connectionOpen) {
                    const response = await fetch("/api/owner", {
                      method: "POST",
                      headers: cleanToken
                        ? { Authorization: `Bearer ${cleanToken}` }
                        : {},
                    });
                    if (!response.ok) {
                      throw new Error(
                        response.status === 401
                          ? "That token was not accepted. Enter the owner access token configured for this deployment."
                          : "Could not verify owner access. Please try again.",
                      );
                    }
                    sessionStorage.setItem("rehearsal-token", cleanToken);
                  }
                  update(draft);
                  setSettings(false);
                  if (changed || connectionOpen) window.location.reload();
                } catch (error) {
                  setConnectionError((error as Error).message);
                  setConnectionOpen(true);
                } finally {
                  setConnecting(false);
                }
              }}
            >
              <label className="field">
                <span>What should we call you?</span>
                <input
                  value={draft.name}
                  maxLength={35}
                  placeholder="Your first name"
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Your studio’s name</span>
                <input
                  required
                  value={draft.workspace}
                  maxLength={45}
                  onChange={(e) =>
                    setDraft({ ...draft, workspace: e.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Make yourself comfortable</span>
                <select
                  value={draft.theme}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      theme: e.target.value as "paper" | "night",
                    })
                  }
                >
                  <option value="paper">Light · lavender</option>
                  <option value="night">Evening · soft charcoal</option>
                </select>
              </label>
              <details
                className="connection-settings"
                open={connectionOpen}
                onToggle={(e) => setConnectionOpen(e.currentTarget.open)}
              >
                <summary>Owner connection settings</summary>
                <label className="field">
                  <span>Owner access token</span>
                  <input
                    type="password"
                    autoComplete="off"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </label>
                <small>
                  Only needed if your server has an owner token configured. Kept
                  in this browser session.
                </small>
              </details>
              {connectionError && (
                <p role="alert" className="notice error">
                  {connectionError}
                </p>
              )}
              <p className="privacy-inline">
                <LockKeyhole size={12} />
                Your name, theme, and drafts stay in this browser.
              </p>
              <button
                className="btn primary"
                type="submit"
                disabled={connecting}
              >
                {connecting
                  ? "Checking access…"
                  : connectionOpen
                    ? "Connect to studio"
                    : "Make it mine"}{" "}
                <Check size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
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
    [recording, setRecording] = useState(false),
    [mode, setMode] = useState<"roleplay" | "assistant">("roleplay"),
    [difficulty, setDifficulty] = useState<"Friendly" | "Tough" | "Brutal">(
      "Tough",
    ),
    [selected, setSelected] = useState<number | null>(null),
    [draftReady, setDraftReady] = useState(false),
    [savedDraft, setSavedDraft] = useState(false),
    [kindFilter, setKindFilter] = useState("all"),
    [hint, setHint] = useState(""),
    [showTips, setShowTips] = useState(false);
  const { preferences } = usePreferences();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("rehearsal-draft") || "null");
      if (d) {
        setPrompt(typeof d.prompt === "string" ? d.prompt.slice(0, 1000) : "");
        setLanguage(d.language === "hi" ? "hi" : "en");
        setMode(d.mode === "assistant" ? "assistant" : "roleplay");
        setDifficulty(
          ["Friendly", "Tough", "Brutal"].includes(d.difficulty)
            ? d.difficulty
            : "Tough",
        );
        setSelected(
          Number.isInteger(d.selected) && d.selected >= -1 && d.selected < 6
            ? d.selected
            : null,
        );
        setSavedDraft(!!d.prompt);
      }
    } catch {}
    setDraftReady(true);
  }, []);
  useEffect(() => {
    if (!draftReady) return;
    const timer = setTimeout(() => {
      localStorage.setItem(
        "rehearsal-draft",
        JSON.stringify({ prompt, language, mode, difficulty, selected }),
      );
      setSavedDraft(!!prompt);
    }, 450);
    return () => clearTimeout(timer);
  }, [prompt, language, mode, difficulty, selected, draftReady]);
  function choose(i: number) {
    setSelected(i);
    setMode(starters[i].kind as "roleplay" | "assistant");
    setPrompt(starters[i].prompt);
    setHint("A starting point, not a script. Change anything you like.");
    promptRef.current?.focus();
  }
  function reset() {
    setPrompt("");
    setSelected(null);
    setHint("A clean page. What’s on your mind?");
    setSavedDraft(false);
    promptRef.current?.focus();
  }
  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) &&
      (kindFilter === "all" || a.config.kind === kindFilter),
  );
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
      const a = await api("/api/agents", "POST", {
        prompt,
        language,
        difficulty,
        kind: mode,
      });
      localStorage.removeItem("rehearsal-draft");
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
  const cards =
    mode === "roleplay"
      ? [
          {
            i: 0,
            name: "The secretive patient",
            tag: "Ask the right questions",
            color: "peach",
            face: 0,
          },
          {
            i: 4,
            name: "The stubborn landlord",
            tag: "Find your negotiating voice",
            color: "lilac",
            face: 1,
          },
          {
            i: -1,
            name: "The viva examiner",
            tag: "Think on your feet",
            color: "mint",
            face: 2,
          },
        ]
      : [
          {
            i: 2,
            name: "The receptionist",
            tag: "A friendly first hello",
            color: "peach",
            face: 0,
          },
          {
            i: 3,
            name: "The problem solver",
            tag: "Make someone’s day easier",
            color: "lilac",
            face: 1,
          },
          {
            i: 1,
            name: "The connector",
            tag: "Turn interest into a lead",
            color: "mint",
            face: 2,
          },
          {
            i: 5,
            name: "The gentle reminder",
            tag: "Handle payment conversations",
            color: "peach",
            face: 0,
          },
        ];
  return (
    <Shell>
      <div className="play-heading">
        <div>
          <p className="hello-note">
            {preferences.name
              ? `Hey ${preferences.name} 👋`
              : "YOUR VOICE. YOUR RULES."}
          </p>
          <h1>
            {listing ? (
              <>
                Meet your <span>crew.</span>
              </>
            ) : (
              <>
                Big personalities.
                <br />
                <span>Zero pressure.</span>
              </>
            )}
          </h1>
          <p>
            {listing
              ? "Pick a character. Pick up the conversation."
              : "Make a voice character. Talk it out. Try again."}
          </p>
        </div>
        <div className="hero-sticker" aria-hidden="true">
          <AudioLines size={35} />
          <span>
            LET’S
            <br />
            TALK!
          </span>
          <i>✦</i>
        </div>
      </div>
      {error && (
        <div
          className="notice error"
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <span>{error}</span>
            {error.includes("Owner access required") && (
              <span
                style={{
                  display: "block",
                  fontSize: "0.85em",
                  marginTop: "3px",
                  opacity: 0.9,
                }}
              >
                Connect with your owner access token to open this studio.
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {error.includes("Owner access required") && (
              <button
                type="button"
                className="btn secondary"
                style={{
                  padding: "4px 10px",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("rehearsal-open-settings", {
                      detail: { openConnection: true },
                    }),
                  )
                }
              >
                Enter Token
              </button>
            )}
            <button onClick={() => setError("")} aria-label="Dismiss error">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      {!listing && (
        <>
          <div
            className="play-mode"
            role="group"
            aria-label="Type of voice agent"
          >
            <button
              aria-pressed={mode === "roleplay"}
              className={mode === "roleplay" ? "selected" : ""}
              onClick={() => {
                setMode("roleplay");
                setSelected(null);
              }}
            >
              <GraduationCap size={17} />
              Practice partners
            </button>
            <button
              aria-pressed={mode === "assistant"}
              className={mode === "assistant" ? "selected" : ""}
              onClick={() => {
                setMode("assistant");
                setSelected(null);
              }}
            >
              <Headphones size={17} />
              Helpful assistants
            </button>
          </div>
          <div className="cast-heading">
            <h2>Pick a personality</h2>
            <small>Or dream up your own below ↓</small>
          </div>
          <div className="cast-grid">
            {cards.map((c) => (
              <button
                key={c.name}
                className={`cast-card ${c.color} ${selected === c.i ? "picked" : ""}`}
                aria-pressed={selected === c.i}
                onClick={() => {
                  if (c.i < 0) {
                    setSelected(-1);
                    setPrompt(
                      "Create a strict viva examiner who challenges assumptions and asks follow-up questions.",
                    );
                    promptRef.current?.focus();
                  } else choose(c.i);
                }}
              >
                <div className="cast-top">
                  <span className="cast-tag">
                    {c.i === 0
                      ? "A LITTLE MYSTERY"
                      : c.i === 4
                        ? "HARD TO CONVINCE"
                        : c.i === -1
                          ? "NO EASY QUESTIONS"
                          : "HERE TO HELP"}
                  </span>
                  <span className="cast-plus">
                    {selected === c.i ? (
                      <Check size={17} />
                    ) : (
                      <Plus size={17} />
                    )}
                  </span>
                </div>
                <CharacterFace variant={c.face} />
                <div className="cast-bottom">
                  <div>
                    <h3>{c.name}</h3>
                    <p>{c.tag}</p>
                  </div>
                  <ArrowUpRight size={20} />
                </div>
              </button>
            ))}
          </div>
          <section
            className="prompt-studio"
            aria-label="Create a voice character"
          >
            <div className="prompt-heading">
              <div>
                <span className="mini-spark">✦</span>
                <h2>
                  {selected !== null
                    ? "Make it yours."
                    : "Got someone else in mind?"}
                </h2>
              </div>
              <span className="draft-status" aria-live="polite">
                {savedDraft ? (
                  <>
                    <Check size={12} />
                    Draft saved
                  </>
                ) : (
                  "Start with an idea"
                )}
              </span>
            </div>
            <label className="sr-only" htmlFor="character-brief">
              Describe your character
            </label>
            <textarea
              id="character-brief"
              ref={promptRef}
              maxLength={1000}
              rows={3}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setHint("");
              }}
              placeholder={
                mode === "roleplay"
                  ? "A patient who’s hiding something. A landlord who won’t budge. Who would you like to talk to?"
                  : "A receptionist for my dental clinic who speaks English and Hindi…"
              }
            />
            <div className="prompt-tools">
              <div className="flex">
                <button
                  className={`mic-button ${recording ? "recording" : ""}`}
                  aria-label={
                    recording ? "Stop recording" : "Dictate description"
                  }
                  onClick={mic}
                >
                  {recording ? <Square size={15} /> : <Mic size={16} />}
                  <span>{recording ? "Listening…" : "Use your voice"}</span>
                </button>
                <select
                  aria-label="Agent language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>
              <small>{prompt.length}/1000</small>
            </div>
            <details className="tune-options">
              <summary>
                <SlidersHorizontal size={14} />
                Fine-tune <ChevronDown size={13} />
              </summary>
              <div className="tune-body">
                {mode === "roleplay" && (
                  <div className="challenge-row">
                    <b>Challenge level</b>
                    <div
                      className="challenge-switch"
                      role="group"
                      aria-label="Challenge level"
                    >
                      {(["Friendly", "Tough", "Brutal"] as const).map((d) => (
                        <button
                          key={d}
                          aria-pressed={difficulty === d}
                          className={difficulty === d ? "selected" : ""}
                          onClick={() => setDifficulty(d)}
                        >
                          {d === "Friendly"
                            ? "Easygoing"
                            : d === "Tough"
                              ? "Push me"
                              : "Bring it on"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  className="text-button"
                  onClick={() => setShowTips(!showTips)}
                  aria-expanded={showTips}
                >
                  {showTips ? "Hide writing tips" : "Help me write a brief"}
                </button>
                {showTips && (
                  <p className="writing-tips">
                    Who are they? What do they want? What would you like to
                    practice? That’s enough to start.
                  </p>
                )}
                {prompt && (
                  <button className="text-button" onClick={reset}>
                    <RotateCcw size={12} />
                    Clear draft
                  </button>
                )}
              </div>
            </details>
            <div className="launch-row">
              <span>
                <LockKeyhole size={12} />
                Only you can see this.
              </span>
              <button
                className="btn primary create-button"
                disabled={busy || prompt.trim().length < 10}
                onClick={create}
              >
                {busy ? (
                  <>
                    <span className="loading-dot" />
                    Creating…
                  </>
                ) : (
                  <>
                    Bring them to life
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
            {!live && !loading && (
              <p className="demo-note">
                <span className="status-dot" />
                Demo mode · Live voice needs an ElevenLabs connection.
                <Link href="/guide">Setup ↗</Link>
              </p>
            )}
          </section>
        </>
      )}
      <div className="sectionhead recent-heading">
        <h2>{listing ? "My characters" : "Back for another round?"}</h2>
        {!listing && (
          <Link href="/agents" className="text-button">
            See everyone <ArrowRight size={15} />
          </Link>
        )}
      </div>
      {listing && (
        <div className="library-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              aria-label="Search agents"
              placeholder="Find a character…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div
            className="library-filters"
            role="group"
            aria-label="Filter characters"
          >
            {[
              ["all", "Everyone"],
              ["roleplay", "Practice"],
              ["assistant", "Assistants"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={kindFilter === value}
                className={kindFilter === value ? "selected" : ""}
                onClick={() => setKindFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <Link href="/new" className="btn primary">
            <Plus size={15} />
            Create new
          </Link>
        </div>
      )}
      {loading ? (
        <div className="character-skeletons" aria-label="Loading characters">
          {[0, 1, 2].map((i) => (
            <div key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel empty">
          <MessageCircle size={30} />
          <h3>
            {agents.length
              ? "No matches. Try another name."
              : "Your crew starts here."}
          </h3>
          {agents.length > 0 && (
            <button
              className="btn"
              onClick={() => {
                setSearch("");
                setKindFilter("all");
              }}
            >
              Show everyone
            </button>
          )}
        </div>
      ) : (
        <div className="grid">
          {filtered.slice(0, listing ? 100 : 3).map((a, i) => (
            <Link
              key={a.id}
              href={`/agents/${a.id}/test`}
              className="card agentcard playful-agent"
            >
              <div
                className={`agent-face-strip ${["peach", "lilac", "mint"][i % 3]}`}
              >
                <CharacterFace variant={i % 3} />
                <span>
                  {a.config.kind === "roleplay"
                    ? "Practice partner"
                    : "Assistant"}
                </span>
              </div>
              <div className="agent-info">
                <h3>
                  {a.name.split(" · ")[0]}
                  <ArrowUpRight size={17} />
                </h3>
                <small>
                  {a.name.split(" · ")[1] || "Your voice character"}
                </small>
                <p>
                  “{a.config.welcome_message.slice(0, 90)}
                  {a.config.welcome_message.length > 90 ? "…" : ""}”
                </p>
                <div className="cardfooter">
                  <span>
                    {a._count?.sessions
                      ? `${a._count.sessions} ${a._count.sessions === 1 ? "chat" : "chats"}`
                      : "Say hello"}
                  </span>
                  <span>
                    <span className="status-dot" />
                    {a.remoteId ? "Voice ready" : "Demo"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="footer">
        <span>Made for a little trial & error.</span>
        <span>Powered by ElevenLabs</span>
      </div>
    </Shell>
  );
}
function CharacterFace({ variant = 0 }: { variant?: number }) {
  return (
    <svg
      className={`character-face face-${variant}`}
      viewBox="0 0 220 150"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="111"
        cy="139"
        rx="65"
        ry="7"
        fill="currentColor"
        opacity=".09"
      />
      {variant === 0 ? (
        <>
          <path
            d="M58 80C41 30 81 13 107 27C139 3 185 38 165 79C194 122 148 144 112 129C72 150 31 119 58 80Z"
            fill="#F7A96E"
          />
          <path
            d="M80 72L94 78L80 83M141 72L127 78L141 83"
            stroke="#322849"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M96 103Q111 93 126 103"
            stroke="#322849"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <ellipse cx="72" cy="94" rx="10" ry="5" fill="#ED7B59" />
          <ellipse cx="149" cy="94" rx="10" ry="5" fill="#ED7B59" />
        </>
      ) : variant === 1 ? (
        <>
          <rect
            x="53"
            y="27"
            width="116"
            height="108"
            rx="37"
            transform="rotate(-8 53 27)"
            fill="#9A77DC"
          />
          <path
            d="M75 64L92 69M126 65L143 60"
            stroke="#322849"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="86" cy="81" r="5" fill="#322849" />
          <circle cx="134" cy="78" r="5" fill="#322849" />
          <path
            d="M99 109L122 105"
            stroke="#322849"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="M50 40L58 20L69 36M156 30L168 16L175 37" fill="#B99AEF" />
        </>
      ) : (
        <>
          <path
            d="M61 129C32 95 55 55 79 54C68 18 119 5 136 39C174 23 200 73 169 94C184 129 137 152 113 130C93 144 71 141 61 129Z"
            fill="#72BA9B"
          />
          <circle cx="87" cy="78" r="17" stroke="#283C3B" strokeWidth="4" />
          <circle cx="137" cy="78" r="17" stroke="#283C3B" strokeWidth="4" />
          <path
            d="M104 78H120M69 73L53 69M155 73L170 68"
            stroke="#283C3B"
            strokeWidth="4"
          />
          <circle cx="88" cy="78" r="4" fill="#283C3B" />
          <circle cx="136" cy="78" r="4" fill="#283C3B" />
          <path
            d="M102 107Q112 117 125 105"
            stroke="#283C3B"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      <path
        className="face-star"
        d="M191 26L194 35L203 38L194 41L191 50L188 41L179 38L188 35Z"
        fill="currentColor"
      />
      <circle cx="28" cy="100" r="4" fill="currentColor" opacity=".3" />
    </svg>
  );
}
