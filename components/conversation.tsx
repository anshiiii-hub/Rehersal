"use client";
import { useState, useRef, useEffect } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic, PhoneOff, Save, Send, AudioLines } from "lucide-react";
import { api } from "./api";
import { Turn } from "@/lib/schemas";
function ConversationInner({
  id,
  name,
  welcome,
  publicMode = false,
}: {
  id: string;
  name: string;
  welcome: string;
  publicMode?: boolean;
}) {
  const [turns, setTurns] = useState<Turn[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [remoteId, setRemoteId] = useState<string>(),
    [started, setStarted] = useState(false),
    [saved, setSaved] = useState(false),
    [input, setInput] = useState(""),
    [demo, setDemo] = useState(false),
    [latency, setLatency] = useState<number | null>(null),
    [level, setLevel] = useState(0);
  const start = useRef(0),
    lastUser = useRef(0),
    first = useRef(false),
    duration = useRef(0);
  const conversation = useConversation({
    onConnect: ({ conversationId }) => {
      setRemoteId(conversationId);
      setStarted(true);
      setBusy(false);
    },
    onMessage: (message) => {
      const m = message as { message: string; source?: string; role?: string };
      const role = m.role === "user" || m.source === "user" ? "user" : "agent";
      if (!m.message) return;
      setTurns((t) => [...t, { role, message: m.message }]);
      if (role === "user") lastUser.current = Date.now();
      else if (!first.current) {
        setLatency(Date.now() - start.current);
        first.current = true;
      } else if (lastUser.current) {
        setLatency(Date.now() - lastUser.current);
        lastUser.current = 0;
      }
    },
    onError: () => {
      setError(
        "Voice connection interrupted. Check your network and try again.",
      );
      setStarted(false);
      setBusy(false);
    },
    onDisconnect: () => {
      duration.current = Math.round((Date.now() - start.current) / 1000);
      setStarted(false);
      setBusy(false);
    },
  });
  useEffect(() => {
    if (!started) {
      setLevel(0);
      return;
    }
    const timer = setInterval(() => {
      setLevel(
        Math.max(conversation.getInputVolume(), conversation.getOutputVolume()),
      );
    }, 100);
    return () => clearInterval(timer);
  }, [started, conversation.getInputVolume, conversation.getOutputVolume]);
  async function connect() {
    setError("");
    setBusy(true);
    try {
      const d = await api(
        publicMode ? `/api/public/${id}` : `/api/agents/${id}/signed-url`,
        "POST",
      );
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setTurns([]);
      setSaved(false);
      setDemo(false);
      first.current = false;
      start.current = Date.now();
      await conversation.startSession({
        signedUrl: d.signed_url,
        connectionType: "websocket",
      });
    } catch (e) {
      setError(
        (e as Error).name === "NotAllowedError"
          ? "Microphone permission was denied. Allow microphone access in your browser settings."
          : (e as Error).message,
      );
      setBusy(false);
    }
  }
  async function end() {
    await conversation.endSession();
    duration.current = Math.round((Date.now() - start.current) / 1000);
    setStarted(false);
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const s = await api("/api/sessions", "POST", {
        agentId: id,
        remoteId: demo ? undefined : remoteId,
        transcript: turns,
        duration: duration.current,
        simulated: demo,
      });
      setSaved(true);
      if (!publicMode) window.location.href = `/sessions/${s.id}`;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function preview() {
    setTurns([{ role: "agent", message: welcome }]);
    setDemo(true);
    setRemoteId(undefined);
    setSaved(false);
    start.current = Date.now();
  }
  function demoReply() {
    if (!input.trim()) return;
    setTurns((t) => [
      ...t,
      { role: "user", message: input },
      {
        role: "agent",
        message:
          "[Scripted demo response] Could you tell me a little more about what you mean?",
      },
    ]);
    setInput("");
    duration.current = Math.round((Date.now() - start.current) / 1000);
  }
  return (
    <div className="split">
      <div className="panel center">
        <span className="badge">AI voice simulation</span>
        <div className="orb">
          <div
            className={`orbinner ${conversation.isSpeaking ? "speaking" : ""}`}
          >
            <AudioLines size={43} />
          </div>
        </div>
        <div
          aria-label="Live audio level"
          style={{
            display: "flex",
            height: 28,
            gap: 4,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {Array.from({ length: 17 }, (_, i) => (
            <span
              key={i}
              style={{
                width: 3,
                borderRadius: 3,
                background: "#b699ff",
                height:
                  3 +
                  Math.min(1, level) *
                    24 *
                    (0.4 + 0.6 * Math.abs(Math.sin(i * 1.8))),
                transition: "height 100ms",
              }}
            />
          ))}
        </div>
        <h2>{name}</h2>
        <p className="muted">
          {started
            ? conversation.isSpeaking
              ? "Speaking · you can interrupt"
              : "Listening · take your time"
            : "Your next conversation is one click away."}
        </p>
        <div className="flex" style={{ justifyContent: "center" }}>
          {started ? (
            <button className="btn" onClick={end}>
              <PhoneOff size={16} />
              End conversation
            </button>
          ) : (
            <button className="btn primary" disabled={busy} onClick={connect}>
              <Mic size={16} />
              {busy ? "Connecting…" : "Start conversation"}
            </button>
          )}
        </div>
        <p>
          <small>
            {latency !== null
              ? `Observed response latency: ${latency} ms`
              : "Interruptions enabled · silence timeout 30s"}
          </small>
        </p>
        {!publicMode && !started && (
          <button
            className="muted"
            style={{ fontSize: 11, textDecoration: "underline" }}
            onClick={preview}
          >
            Try the scripted text demo
          </button>
        )}
        <p style={{ fontSize: 11, color: "#81798d" }}>
          You’re speaking with an AI. Transcripts are stored when you save a
          session. Avoid personal or sensitive information.
        </p>
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
      </div>
      <div className="panel">
        <div className="flex" style={{ justifyContent: "space-between" }}>
          <h3>Live transcript</h3>
          <span className="badge">
            {demo ? "SCRIPTED DEMO" : started ? "LIVE" : "READY"}
          </span>
        </div>
        <div className="transcript">
          {turns.length === 0 ? (
            <div className="empty">
              <AudioLines style={{ margin: "20px auto", opacity: 0.4 }} />
              <p>The conversation unfolds here.</p>
              <small>Make space for a little discovery.</small>
            </div>
          ) : (
            turns.map((t, i) => (
              <div className={`turn ${t.role}`} key={i}>
                <small>
                  {t.role === "user" ? "You" : name.split(" · ")[0]}
                </small>
                <p>{t.message}</p>
              </div>
            ))
          )}
        </div>
        {demo && (
          <form
            className="flex"
            onSubmit={(e) => {
              e.preventDefault();
              demoReply();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Practice a response…"
              aria-label="Demo response"
            />
            <button aria-label="Send demo response" className="btn">
              <Send size={16} />
            </button>
          </form>
        )}
        {turns.length > 0 && !started && (
          <button
            className="btn"
            disabled={busy || saved}
            onClick={save}
            style={{ marginTop: 18 }}
          >
            <Save size={14} />
            {saved
              ? "Session saved"
              : busy
                ? "Saving and analyzing…"
                : "Save session & feedback"}
          </button>
        )}
        {saved && publicMode && (
          <p className="muted">
            Your teacher can review your session in their dashboard.
          </p>
        )}
      </div>
    </div>
  );
}

export default function Conversation(
  props: Parameters<typeof ConversationInner>[0],
) {
  return (
    <ConversationProvider>
      <ConversationInner {...props} />
    </ConversationProvider>
  );
}
