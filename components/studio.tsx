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
    [draft, setDraft] = useState(preferences),
    [token, setToken] = useState("");
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!settings) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLInputElement>("input")?.focus();
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
  }, [settings]);
  function openSettings() {
    setDraft(preferences);
    setToken(sessionStorage.getItem("rehearsal-token") || "");
    setSettings(true);
  }
  const initial = preferences.name ? preferences.name[0].toUpperCase() : "R";
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <AudioLines size={29} />
          rehearsal<span className="coral">.</span>
        </Link>
        <button className="workspace" onClick={openSettings}>
          <span className="avatar">{initial}</span>
          <span className="workspace-copy">
            {preferences.workspace}
            <small>Your space to try things</small>
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
            Make something new
          </Link>
          <Link href="/agents" className={path === "/agents" ? "active" : ""}>
            <LayoutGrid size={17} />
            Your characters
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
            Practice journal
          </Link>
          <Link href="/guide" className={path === "/guide" ? "active" : ""}>
            <BookOpen size={17} />A little guidance
          </Link>
        </nav>
        <div className="sidebottom">
          <div className="tip">
            <span className="handwritten">a note to self</span>
            <p>
              You don’t need the perfect words.
              <br />
              Just a place to start.
            </p>
            <Link href="/new">
              Try a conversation <ArrowUpRight size={13} />
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
          <button className="profile" onClick={openSettings}>
            <span className="avatar">{initial}</span>
            <span>
              {preferences.name || "Make this space yours"}
              <small>
                {preferences.name
                  ? "Your personal studio"
                  : "Add your name & preferences"}
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
              ? "Practice journal"
              : path.startsWith("/sessions/")
                ? "A moment to reflect"
                : path.startsWith("/agents/")
                  ? "Character workshop"
                  : path === "/agents"
                    ? "Your characters"
                    : path === "/guide"
                      ? "Getting started"
                      : "A fresh page"}
          </span>
          <button
            className="top-profile"
            onClick={openSettings}
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
            <h2 id="personalize-title">Pull up a chair.</h2>
            <p className="muted">
              A few small touches to make this studio your own.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update(draft);
                const changed =
                  token !== (sessionStorage.getItem("rehearsal-token") || "");
                sessionStorage.setItem("rehearsal-token", token);
                setSettings(false);
                if (changed) window.location.reload();
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
                  <option value="paper">Daylight · warm paper</option>
                  <option value="night">Evening · soft charcoal</option>
                </select>
              </label>
              <details className="connection-settings">
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
              <p className="privacy-inline">
                <LockKeyhole size={12} />
                Your name, theme, and drafts stay in this browser.
              </p>
              <button className="btn primary" type="submit">
                Make it mine <Check size={15} />
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
          Number.isInteger(d.selected) && d.selected >= 0 && d.selected < 6
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
  const scenarioIcons = [
    GraduationCap,
    MessageCircle,
    CalendarDays,
    Headphones,
    Handshake,
    Wallet,
  ];
  const scenarioNotes = [
    "A patient with something to hide",
    "A first hello that opens doors",
    "A receptionist with a warm welcome",
    "Someone who makes things simpler",
    "A landlord who won’t budge",
    "A sensitive conversation, handled well",
  ];
  const visibleStarters = starters
    .map((s, i) => ({ ...s, index: i }))
    .filter((s) => s.kind === mode);
  return (
    <Shell>
      <div className="studio-heading">
        <div>
          <div className="date-note">
            <span className="little-sun">✳</span>
            {preferences.name
              ? `Good to see you, ${preferences.name}.`
              : "Come in. Make yourself comfortable."}
          </div>
          <h1>
            {listing ? (
              <>
                People to meet.
                <br />
                <em>Conversations to try.</em>
              </>
            ) : (
              <>
                Big conversations.
                <br />
                <em>A little rehearsal first.</em>
              </>
            )}
          </h1>
          <p className="intro-copy">
            {listing
              ? "Pick up where you left off, or make room for someone new."
              : "For the words you wish you’d said. And the ones you’re about to.\nBuild a voice character, try a conversation, find your footing."}
          </p>
        </div>
        <div className="notebook-sketch" aria-hidden="true">
          <div className="sketch-bubble one">Can we try that again?</div>
          <div className="sketch-bubble two">Of course. Take your time.</div>
          <span className="sketch-star">✳</span>
          <span className="handwritten">that’s what this space is for ↗</span>
        </div>
      </div>
      {!preferences.name && (
        <button
          className="personal-nudge"
          onClick={() =>
            document.querySelector<HTMLButtonElement>(".top-profile")?.click()
          }
        >
          This can be your corner of the internet.{" "}
          <span>
            Add your name <ArrowUpRight size={13} />
          </span>
        </button>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {!listing && (
        <>
          <div className="workbench">
            <section className="brief-editor" aria-label="Build your character">
              <div className="section-kicker">
                <span className="number-stamp">01</span> WHAT WOULD YOU LIKE TO
                TRY?
                <span className="draft-status" aria-live="polite">
                  {savedDraft ? (
                    <>
                      <Check size={12} />
                      Draft saved
                    </>
                  ) : (
                    "Your first draft"
                  )}
                </span>
              </div>
              <div
                className="mode-switch"
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
                  Practice a conversation
                  <small>A character who challenges you</small>
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
                  Build a helpful assistant
                  <small>A voice that gets things done</small>
                </button>
              </div>
              <div className="brief-label">
                <label htmlFor="character-brief">
                  {selected !== null
                    ? `Your take on ${starters[selected].title.toLowerCase()}`
                    : "Tell us who you have in mind."}
                </label>
                <button
                  onClick={() => setShowTips(!showTips)}
                  aria-expanded={showTips}
                  className="text-button"
                >
                  {showTips ? "Hide a little help" : "Need a little help?"}{" "}
                  <ChevronDown size={13} />
                </button>
              </div>
              {showTips && (
                <div className="writing-tips">
                  <b>Think of three things:</b>
                  <span>
                    Who are they? What’s the situation? What should a good
                    conversation achieve?
                  </span>
                  <span>
                    For example: “A patient who’s nervous about opening up. Help
                    me practice asking the right questions.”
                  </span>
                </div>
              )}
              <textarea
                id="character-brief"
                ref={promptRef}
                maxLength={1000}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setHint("");
                }}
                placeholder={
                  mode === "roleplay"
                    ? "“A patient who says everything is fine… but isn’t. I want to practice getting them to open up.”"
                    : "“A friendly receptionist for my dental clinic. Help callers find a good appointment time, in English or Hindi.”"
                }
                rows={5}
              />
              <div className="writing-meta">
                <span aria-live="polite">
                  {recording
                    ? "Listening. Say it in your own words…"
                    : hint ||
                      "Messy ideas welcome. You can fine-tune everything later."}
                </span>
                <span>{prompt.length}/1000</span>
              </div>
              <div className="brief-options">
                <div className="flex">
                  <button
                    className={`mic-button ${recording ? "recording" : ""}`}
                    aria-label={
                      recording ? "Stop recording" : "Dictate description"
                    }
                    onClick={mic}
                  >
                    {recording ? <Square size={14} /> : <Mic size={15} />}
                    <span>
                      {recording ? "Stop recording" : "Say it instead"}
                    </span>
                  </button>
                  <select
                    aria-label="Agent language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी · Hindi</option>
                  </select>
                </div>
                {prompt && (
                  <button className="text-button" onClick={reset}>
                    <RotateCcw size={12} />
                    Start fresh
                  </button>
                )}
              </div>
              {mode === "roleplay" && (
                <div className="challenge-row">
                  <div>
                    <b>A little push, or a real challenge?</b>
                    <small>You’re in charge of how tough this gets.</small>
                  </div>
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
                          ? "Gentle"
                          : d === "Tough"
                            ? "Stretch me"
                            : "Bring it on"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="create-row">
                <span>
                  <LockKeyhole size={12} />
                  Private until you choose to share.
                </span>
                <button
                  className="btn primary create-button"
                  disabled={busy || prompt.trim().length < 10}
                  onClick={create}
                >
                  {busy ? (
                    <>
                      <span className="loading-dot" />
                      Setting the scene…
                    </>
                  ) : (
                    <>
                      Let’s meet your{" "}
                      {mode === "roleplay" ? "character" : "assistant"}
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
              {!live && !loading && (
                <div className="demo-note">
                  <span className="status-dot" />
                  <span>
                    You’re in the demo studio. Create and explore freely; live
                    voice needs a connected ElevenLabs account.
                  </span>
                  <Link href="/guide">How it works ↗</Link>
                </div>
              )}
            </section>
            <aside className="brief-preview">
              <span className="handwritten">
                a peek at your next conversation
              </span>
              <div className={`character-portrait portrait-${selected ?? 0}`}>
                <span>
                  {mode === "assistant" ? (
                    <Headphones size={45} strokeWidth={1} />
                  ) : (
                    <MessageCircle size={45} strokeWidth={1} />
                  )}
                </span>
                <i className="portrait-spark">✳</i>
              </div>
              <span className="preview-type">
                {mode === "roleplay"
                  ? "YOUR PRACTICE PARTNER"
                  : "YOUR NEXT TEAMMATE"}
              </span>
              <h2>
                {selected !== null
                  ? [
                      "The reluctant patient",
                      "The first hello",
                      "The friendly receptionist",
                      "The patient problem-solver",
                      "The stubborn landlord",
                      "The thoughtful reminder",
                    ][selected]
                  : mode === "roleplay"
                    ? "A character with\na point of view."
                    : "A helpful voice,\nwith a human touch."}
              </h2>
              <p>
                {selected !== null
                  ? scenarioNotes[selected]
                  : mode === "roleplay"
                    ? "Someone to practice with, before it’s the real thing. No awkwardness. No pressure to get it right."
                    : "A little less waiting. A little more care. Start with the way you’d want to be spoken to."}
              </p>
              <div className="preview-detail">
                <span>Language</span>
                <b>{language === "hi" ? "Hindi + English" : "English"}</b>
              </div>
              <div className="preview-detail">
                <span>{mode === "roleplay" ? "The energy" : "The role"}</span>
                <b>
                  {mode === "roleplay"
                    ? difficulty === "Friendly"
                      ? "Patient & encouraging"
                      : difficulty === "Tough"
                        ? "A healthy challenge"
                        : "Keeps you on your toes"
                    : "Here to help"}
                </b>
              </div>
              <div className="preview-checklist">
                <span>
                  <CheckCircle2 size={14} />A voice you can talk to
                </span>
                <span>
                  <CheckCircle2 size={14} />
                  {mode === "roleplay"
                    ? "Private character notes & scoring"
                    : "Clear goals & conversation steps"}
                </span>
                <span>
                  <CheckCircle2 size={14} />
                  Room to change your mind
                </span>
              </div>
              <div className="preview-note">
                <PencilLine size={16} />
                <span>
                  {prompt.length >= 10
                    ? "Your brief is ready for a first take."
                    : "A sentence or two is enough to start."}
                </span>
              </div>
            </aside>
          </div>
          <div className="sectionhead scenario-heading">
            <div>
              <span className="eyebrow">BORROW AN IDEA</span>
              <h2>Sometimes a starting point helps.</h2>
            </div>
            <span className="muted">Pick one. Give it your own spin.</span>
          </div>
          <div className="scenario-grid">
            {visibleStarters.map((s) => {
              const Icon = scenarioIcons[s.index];
              return (
                <button
                  key={s.title}
                  className={`scenario-card ${selected === s.index ? "chosen" : ""}`}
                  aria-pressed={selected === s.index}
                  onClick={() => choose(s.index)}
                >
                  <div className={`scenario-icon scenario-icon-${s.index}`}>
                    <Icon size={23} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3>
                      {s.title === "Role-play Trainer"
                        ? "The reluctant patient"
                        : s.title === "Negotiation"
                          ? "The stubborn landlord"
                          : s.title}
                    </h3>
                    <p>{scenarioNotes[s.index]}</p>
                  </div>
                  <span className="scenario-arrow">
                    {selected === s.index ? (
                      <Check size={17} />
                    ) : (
                      <ArrowUpRight size={17} />
                    )}
                  </span>
                </button>
              );
            })}
            {mode === "roleplay" && (
              <button
                className="scenario-card"
                onClick={() => {
                  setSelected(null);
                  setPrompt(
                    "Create a strict viva examiner who challenges assumptions and asks follow-up questions.",
                  );
                  setDifficulty("Tough");
                  setHint(
                    "Make it your subject: add what you’re preparing for.",
                  );
                  promptRef.current?.focus();
                }}
              >
                <div className="scenario-icon scenario-icon-3">
                  <BookOpen size={23} strokeWidth={1.5} />
                </div>
                <div>
                  <h3>The viva examiner</h3>
                  <p>“Interesting. Now tell me why.”</p>
                </div>
                <ArrowUpRight size={17} />
              </button>
            )}
          </div>
        </>
      )}
      <div className="sectionhead recent-heading">
        <div>
          <span className="eyebrow">
            {listing ? "YOUR PEOPLE" : "PICK UP WHERE YOU LEFT OFF"}
          </span>
          <h2>
            {listing
              ? "Your characters & assistants"
              : "Still here when you need them."}
          </h2>
        </div>
        {!listing && (
          <Link className="text-button" href="/agents">
            Visit your characters <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {listing && (
        <div className="library-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              aria-label="Search agents"
              placeholder="Find someone by name…"
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
              ["roleplay", "Practice partners"],
              ["assistant", "Assistants"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={kindFilter === value ? "selected" : ""}
                aria-pressed={kindFilter === value}
                onClick={() => setKindFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <Link href="/new" className="btn primary">
            <Plus size={15} />
            Someone new
          </Link>
        </div>
      )}
      {loading ? (
        <div
          className="character-skeletons"
          aria-label="Loading your characters"
        >
          {[0, 1, 2].map((i) => (
            <div key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel empty">
          <Coffee size={26} />
          <h3>
            {agents.length
              ? "No one by that name here."
              : "A fresh studio. A good place to start."}
          </h3>
          <p>
            {agents.length
              ? "Try another name or change the filter."
              : "Choose a starting point above, or describe someone you’d like to talk to."}
          </p>
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
              className="card agentcard human-agent"
            >
              <div className="flex" style={{ justifyContent: "space-between" }}>
                <div className={`small-portrait small-portrait-${i % 3}`}>
                  {a.name.split(" · ")[0].slice(0, 2)}
                </div>
                <span className="agent-kind">
                  {a.config.kind === "roleplay"
                    ? "Practice partner"
                    : "Helpful assistant"}
                </span>
              </div>
              <h3>
                {a.name.split(" · ")[0]}
                <ArrowUpRight size={17} />
              </h3>
              <span className="character-subtitle">
                {a.name.split(" · ")[1] || a.config.kind}
              </span>
              <p className="character-quote">
                “{a.config.welcome_message.slice(0, 120)}
                {a.config.welcome_message.length > 120 ? "…" : ""}”
              </p>
              <div className="cardfooter">
                <span>
                  {a._count?.sessions
                    ? `${a._count.sessions} conversation${a._count.sessions === 1 ? "" : "s"} together`
                    : "Your first conversation is waiting"}
                </span>
                <span className="agent-availability">
                  <span className="status-dot" />
                  {a.remoteId ? "Voice ready" : "Demo"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="footer">
        <span>
          <Heart size={12} />A little practice goes a long way.
        </span>
        <span>Your pace. Your words. Your rehearsal.</span>
      </div>
    </Shell>
  );
}
