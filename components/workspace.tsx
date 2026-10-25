"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Copy,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  Send,
  RotateCcw,
} from "lucide-react";
import { Shell, Agent, Toast } from "./studio";
import { api, authHeaders } from "./api";
import { Config } from "@/lib/schemas";
import Conversation from "./conversation";
type Version = { id: string; config: Config; createdAt: string };
export default function Workspace({
  id,
  stage,
}: {
  id: string;
  stage: string;
}) {
  const [agent, setAgent] = useState<Agent>(),
    [config, setConfig] = useState<Config>(),
    [versions, setVersions] = useState<Version[]>([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [instruction, setInstruction] = useState(""),
    [patch, setPatch] = useState<{ config: Config; explanation: string }>(),
    [voices, setVoices] = useState<
      { voice_id: string; name: string; labels?: Record<string, string> }[]
    >([]),
    [filter, setFilter] = useState({
      search: "",
      language: "",
      gender: "",
      use_cases: "",
    }),
    [uploadText, setUploadText] = useState(""),
    [voiceDescription, setVoiceDescription] = useState(""),
    [design, setDesign] = useState<
      {
        audio_base_64: string;
        generated_voice_id: string;
        media_type: string;
      }[]
    >([]);
  useEffect(() => {
    load();
  }, [id]);
  async function load() {
    try {
      const a = await api(`/api/agents/${id}`);
      setAgent(a);
      setConfig(a.config);
      setVersions(a.versions);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function change<K extends keyof Config>(key: K, value: Config[K]) {
    setConfig((c) => (c ? { ...c, [key]: value } : c));
  }
  async function save(c = config) {
    if (!c) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/agents/${id}`, "PUT", c);
      setPatch(undefined);
      setMessage("Saved. Your agent is ready to rehearse.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function requestPatch() {
    setBusy(true);
    setError("");
    try {
      setPatch(await api(`/api/agents/${id}/refine`, "POST", { instruction }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function list() {
    try {
      const data = await api("/api/voices?" + new URLSearchParams(filter));
      setVoices(data.voices);
      if (!data.voices.length) setMessage("No voices match these filters.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function preview(voice: string) {
    try {
      const r = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          action: "preview",
          voice,
          text: config?.welcome_message,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      const url = URL.createObjectURL(await r.blob());
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Copied to clipboard");
    } catch {
      setError("Clipboard unavailable. Select and copy the text manually.");
    }
  }
  if (!agent || !config)
    return (
      <Shell>
        <div className="panel empty">
          {error || "Opening the rehearsal room…"}
        </div>
      </Shell>
    );
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/talk/${id}`
      : `/talk/${id}`;
  return (
    <Shell>
      <Link href="/agents" className="muted flex" style={{ fontSize: 12 }}>
        <ArrowLeft size={14} />
        Back to your agents
      </Link>
      <div className="heading" style={{ marginTop: 22 }}>
        <div>
          <div className="eyebrow">
            {config.kind === "roleplay"
              ? "THE REHEARSAL SPECIAL"
              : "YOUR VOICE AGENT"}
          </div>
          <h1>{agent.name}</h1>
          <span className="muted">
            {config.kind === "roleplay"
              ? "A little resistance. A lot of growth."
              : "Ready for a better conversation."}
          </span>
        </div>
        <span className="badge">
          {agent.remoteId ? "Live voice ready" : "Offline demo"}
        </span>
      </div>
      <nav className="stage">
        {["test", "edit", "deploy"].map((s, i) => (
          <Link
            key={s}
            className={stage === s ? "selected" : ""}
            href={`/agents/${id}/${s}`}
          >
            {`0${i + 1}`} &nbsp;{" "}
            {s === "test"
              ? "Rehearse"
              : s === "edit"
                ? "Refine"
                : "Take the stage"}
          </Link>
        ))}
        <Link href="/dashboard">04 &nbsp; Observe ↗</Link>
      </nav>
      {error && (
        <div className="notice error" role="alert">
          {error}
          <button onClick={() => setError("")} style={{ float: "right" }}>
            ×
          </button>
        </div>
      )}
      {stage === "test" ? (
        <>
          <Conversation
            id={id}
            name={agent.name}
            welcome={config.welcome_message}
          />
          <div className="panel">
            <h3>Transcribe a caller recording</h3>
            <p className="muted">
              Upload an audio file (up to 20 MB) to inspect a caller transcript
              with ElevenLabs Scribe. This does not make a phone call or
              generate synthetic callers.
            </p>
            <input
              aria-label="Upload caller audio"
              type="file"
              accept="audio/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                try {
                  const form = new FormData();
                  form.set("file", file);
                  const r = await fetch("/api/scribe", {
                    method: "POST",
                    headers: authHeaders(),
                    body: form,
                  });
                  const data = await r.json();
                  if (!r.ok) throw new Error(data.error);
                  setUploadText(data.text);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
            {busy && <p className="muted">Processing…</p>}
            {uploadText && <pre className="code">{uploadText}</pre>}
          </div>
          <div className="panel">
            <h3>The scene is set</h3>
            <p className="muted">{config.persona}</p>
            <div className="flex">
              <span className="badge">{config.difficulty}</span>
              <span className="badge">{config.languages.join(" + ")}</span>
              <span className="badge">
                {config.rubric.length
                  ? `${config.rubric.length} scoring criteria`
                  : "Goal-oriented assistant"}
              </span>
              <Link
                href={`/agents/${id}/edit`}
                style={{ marginLeft: "auto", color: "var(--violet)" }}
              >
                Fine-tune your character ↗
              </Link>
            </div>
          </div>
        </>
      ) : stage === "edit" ? (
        <div className="split">
          <div>
            <div className="panel">
              <h3>Direct your next draft</h3>
              <p className="muted">
                A small change can change the whole conversation.
              </p>
              <textarea
                aria-label="Refinement request"
                placeholder="Make the patient more evasive, but let empathy soften them…"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                maxLength={1000}
              />
              <button
                className="btn primary"
                disabled={busy || instruction.length < 3}
                onClick={requestPatch}
                style={{ marginTop: 12 }}
              >
                <Send size={14} />
                {busy ? "Working on your direction…" : "Preview changes"}
              </button>
              {patch && (
                <div style={{ marginTop: 22 }}>
                  <div className="notice">{patch.explanation}</div>
                  {(Object.keys(config) as (keyof Config)[])
                    .filter(
                      (k) =>
                        JSON.stringify(config[k]) !==
                        JSON.stringify(patch.config[k]),
                    )
                    .map((k) => (
                      <div key={k}>
                        <h3>{k}</h3>
                        <pre className="code" style={{ color: "#e3a095" }}>
                          {JSON.stringify(config[k], null, 2)}
                        </pre>
                        <pre
                          className="code"
                          style={{ color: "var(--positive)" }}
                        >
                          {JSON.stringify(patch.config[k], null, 2)}
                        </pre>
                      </div>
                    ))}
                  <div className="flex">
                    <button
                      className="btn primary"
                      onClick={() => save(patch.config)}
                      disabled={busy}
                    >
                      Apply changes
                    </button>
                    <button className="btn" onClick={() => setPatch(undefined)}>
                      Discard
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="panel">
              <h3>Version history</h3>
              <p className="muted">Every saved direction has a way back.</p>
              {versions.map((v, i) => (
                <div
                  className="flex"
                  key={v.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid var(--line)",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    Version {versions.length - i}
                    <br />
                    <small>{new Date(v.createdAt).toLocaleString()}</small>
                  </span>
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() => {
                      setConfig(v.config);
                      save(v.config);
                    }}
                  >
                    <RotateCcw size={12} />
                    Restore
                  </button>
                </div>
              ))}
            </div>
            <div className="panel">
              <h3>Voice casting</h3>
              <p className="muted">
                Find a voice that feels like your character.
              </p>
              <input
                placeholder="Search voices"
                aria-label="Search voices"
                value={filter.search}
                onChange={(e) =>
                  setFilter({ ...filter, search: e.target.value })
                }
              />
              <div className="flex" style={{ margin: "12px 0" }}>
                <select
                  aria-label="Voice language"
                  value={filter.language}
                  onChange={(e) =>
                    setFilter({ ...filter, language: e.target.value })
                  }
                >
                  <option value="">All languages</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
                <select
                  aria-label="Voice gender"
                  value={filter.gender}
                  onChange={(e) =>
                    setFilter({ ...filter, gender: e.target.value })
                  }
                >
                  <option value="">All genders</option>
                  <option>male</option>
                  <option>female</option>
                  <option>neutral</option>
                </select>
              </div>
              <select
                aria-label="Voice use case"
                value={filter.use_cases}
                onChange={(e) =>
                  setFilter({ ...filter, use_cases: e.target.value })
                }
              >
                <option value="">All use cases</option>
                <option value="conversational">Conversational</option>
                <option value="characters_animation">
                  Characters & animation
                </option>
                <option value="narration">Narration</option>
              </select>
              <button
                className="btn"
                onClick={list}
                style={{ margin: "12px 0" }}
              >
                Browse ElevenLabs voices
              </button>
              <div className="voicegrid">
                {voices.map((v) => (
                  <div className="card" key={v.voice_id}>
                    <h3>{v.name}</h3>
                    <small>{Object.values(v.labels || {}).join(" · ")}</small>
                    <div className="flex" style={{ marginTop: 12 }}>
                      <button
                        className="btn"
                        onClick={() => preview(v.voice_id)}
                        aria-label={`Preview ${v.name}`}
                      >
                        <Play size={12} />
                      </button>
                      <button
                        className="btn"
                        onClick={() => change("voice_id", v.voice_id)}
                      >
                        {config.voice_id === v.voice_id ? "Selected" : "Choose"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <hr style={{ borderColor: "var(--line)", margin: "24px 0" }} />
              <h3>Or design an original voice</h3>
              <p>
                <small>
                  Fictional voices only. Do not imitate a real person.
                </small>
              </p>
              <textarea
                aria-label="Voice design description"
                placeholder="A warm, softly spoken fictional character with a low pitch and a hint of hesitation…"
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
              />
              <button
                className="btn"
                style={{ marginTop: 12 }}
                disabled={busy || voiceDescription.length < 20}
                onClick={async () => {
                  setBusy(true);
                  try {
                    setDesign(
                      (
                        await api("/api/voices", "POST", {
                          action: "design",
                          description: voiceDescription,
                        })
                      ).previews,
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Generate voice previews
              </button>
              {design.map((v, i) => (
                <div
                  className="panel"
                  key={v.generated_voice_id}
                  style={{ marginTop: 15 }}
                >
                  <audio
                    controls
                    src={`data:${v.media_type};base64,${v.audio_base_64}`}
                    style={{ width: "100%" }}
                  />
                  <button
                    className="btn"
                    onClick={async () => {
                      try {
                        const d = await api("/api/voices", "POST", {
                          action: "save",
                          id: v.generated_voice_id,
                          name: `${config.name} voice ${i + 1}`,
                          description: voiceDescription,
                        });
                        change("voice_id", d.voice_id);
                        setMessage(
                          "Voice selected. Save the configuration to apply it.",
                        );
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Use this voice
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div
              className="flex"
              style={{ justifyContent: "space-between", marginBottom: 22 }}
            >
              <h3>The character sheet</h3>
              <button
                className="btn primary"
                disabled={busy}
                onClick={() => save()}
              >
                <Save size={14} />
                Save changes
              </button>
            </div>
            <label className="field">
              <span>Name</span>
              <input
                value={config.name}
                onChange={(e) => change("name", e.target.value)}
              />
            </label>
            <label className="field">
              <span>System persona</span>
              <textarea
                rows={5}
                value={config.persona}
                onChange={(e) => change("persona", e.target.value)}
              />
            </label>
            <label className="field">
              <span>First words</span>
              <textarea
                rows={3}
                value={config.welcome_message}
                onChange={(e) => change("welcome_message", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Language</span>
              <select
                value={
                  config.languages.length === 2 ? "both" : config.languages[0]
                }
                onChange={(e) =>
                  change(
                    "languages",
                    e.target.value === "both"
                      ? ["en", "hi"]
                      : [e.target.value as "en" | "hi"],
                  )
                }
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="both">English + Hindi</option>
              </select>
            </label>
            <label className="field">
              <span>Difficulty</span>
              <select
                value={config.difficulty}
                onChange={(e) =>
                  change("difficulty", e.target.value as Config["difficulty"])
                }
              >
                {["Friendly", "Tough", "Brutal"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Voice ID</span>
              <input
                value={config.voice_id}
                onChange={(e) => change("voice_id", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Guardrails · one per line</span>
              <textarea
                rows={4}
                value={config.guardrails.join("\n")}
                onChange={(e) =>
                  change("guardrails", e.target.value.split("\n"))
                }
              />
            </label>
            <h3>Conversation flow</h3>
            {config.conversation_flow.map((s, i) => (
              <div className="panel" key={i} style={{ padding: 12 }}>
                <div className="flowrow">
                  <input
                    aria-label={`Step ${i + 1}`}
                    value={s.step}
                    onChange={(e) =>
                      change(
                        "conversation_flow",
                        config.conversation_flow.map((x, j) =>
                          i === j ? { ...x, step: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <button
                    aria-label="Move step up"
                    disabled={i === 0}
                    onClick={() => {
                      const f = [...config.conversation_flow];
                      [f[i - 1], f[i]] = [f[i], f[i - 1]];
                      change("conversation_flow", f);
                    }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    aria-label="Move step down"
                    disabled={i === config.conversation_flow.length - 1}
                    onClick={() => {
                      const f = [...config.conversation_flow];
                      [f[i + 1], f[i]] = [f[i], f[i + 1]];
                      change("conversation_flow", f);
                    }}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    aria-label="Delete step"
                    onClick={() =>
                      change(
                        "conversation_flow",
                        config.conversation_flow.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  aria-label={`Condition ${i + 1}`}
                  value={s.condition}
                  onChange={(e) =>
                    change(
                      "conversation_flow",
                      config.conversation_flow.map((x, j) =>
                        i === j ? { ...x, condition: e.target.value } : x,
                      ),
                    )
                  }
                />
              </div>
            ))}
            <button
              className="btn"
              onClick={() =>
                change("conversation_flow", [
                  ...config.conversation_flow,
                  { step: "New step", condition: "After the previous step" },
                ])
              }
            >
              <Plus size={14} />
              Add a step
            </button>
            {config.kind === "roleplay" && (
              <>
                <h3 style={{ marginTop: 30 }}>Private director’s notes</h3>
                <label className="field">
                  <span>Hidden goals · never shown to students</span>
                  <textarea
                    value={config.hidden_goals.join("\n")}
                    onChange={(e) =>
                      change("hidden_goals", e.target.value.split("\n"))
                    }
                  />
                </label>
                <label className="field">
                  <span>Emotional arc</span>
                  <textarea
                    value={config.emotional_arc}
                    onChange={(e) => change("emotional_arc", e.target.value)}
                  />
                </label>
                <h3>Secrets & reveal conditions</h3>
                {config.secrets.map((s, i) => (
                  <div className="panel" key={i} style={{ padding: 12 }}>
                    <input
                      aria-label={`Secret ${i + 1}`}
                      value={s.secret}
                      onChange={(e) =>
                        change(
                          "secrets",
                          config.secrets.map((x, j) =>
                            i === j ? { ...x, secret: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      style={{ marginTop: 8 }}
                      aria-label={`Reveal condition ${i + 1}`}
                      value={s.reveal_condition}
                      onChange={(e) =>
                        change(
                          "secrets",
                          config.secrets.map((x, j) =>
                            i === j
                              ? { ...x, reveal_condition: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
                <h3>Scoring rubric</h3>
                {config.rubric.map((r, i) => (
                  <div key={r.id} className="panel" style={{ padding: 12 }}>
                    <div className="flex">
                      <input
                        aria-label={`Criterion ${i + 1}`}
                        value={r.name}
                        onChange={(e) =>
                          change(
                            "rubric",
                            config.rubric.map((x, j) =>
                              i === j ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <input
                        aria-label={`Points ${i + 1}`}
                        style={{ width: 80 }}
                        type="number"
                        min={1}
                        max={100}
                        value={r.points}
                        onChange={(e) =>
                          change(
                            "rubric",
                            config.rubric.map((x, j) =>
                              i === j
                                ? { ...x, points: Number(e.target.value) }
                                : x,
                            ),
                          )
                        }
                      />
                    </div>
                    <input
                      aria-label={`Evidence hint ${i + 1}`}
                      style={{ marginTop: 8 }}
                      value={r.evidence_hint}
                      onChange={(e) =>
                        change(
                          "rubric",
                          config.rubric.map((x, j) =>
                            i === j
                              ? { ...x, evidence_hint: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </>
            )}
            <button
              className="btn primary"
              disabled={busy}
              onClick={() => save()}
              style={{ marginTop: 20 }}
            >
              Save configuration
            </button>
          </div>
        </div>
      ) : stage === "deploy" ? (
        <div className="split">
          <div>
            <div className="panel">
              <span className="eyebrow">OPEN THE DOORS</span>
              <h2>
                {config.kind === "roleplay"
                  ? "Your students’ next breakthrough."
                  : "Let the conversation begin."}
              </h2>
              <p className="muted">
                Publish a link anyone can open. Your character’s private
                instructions stay behind the curtain.
              </p>
              <button
                className="btn primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api(`/api/agents/${id}/publish`, "POST");
                    await load();
                    setMessage("Practice link published");
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {agent.published
                  ? "Update published link"
                  : "Publish practice link"}
                <ArrowUpRightIcon />
              </button>
              {agent.published && (
                <>
                  <pre className="code">{url}</pre>
                  <div className="flex">
                    <button className="btn" onClick={() => copy(url)}>
                      <Copy size={14} />
                      Copy link
                    </button>
                    <a
                      className="btn"
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open practice page ↗
                    </a>
                  </div>
                </>
              )}
              <div className="notice">
                AI disclosure is visible on every practice page. Sessions are
                saved only when the student chooses to save.
              </div>
            </div>
            <div className="panel">
              <h3>Embed the rehearsal room</h3>
              <p className="muted">
                A little stage, wherever your learners are.
              </p>
              <pre className="code">{`<iframe src="${url}" title="AI voice practice" allow="microphone" width="100%" height="760" style="border:0;border-radius:16px"></iframe>`}</pre>
              <button
                className="btn"
                onClick={() =>
                  copy(
                    `<iframe src="${url}" title="AI voice practice" allow="microphone" width="100%" height="760"></iframe>`,
                  )
                }
              >
                <Copy size={14} />
                Copy embed code
              </button>
            </div>
          </div>
          <div>
            <div className="panel">
              <h3>Before you take the stage</h3>
              <p className="muted">
                ✓ AI identity is disclosed
                <br />✓ No real-person impersonation
                <br />✓ Private instructions stay server-side
                <br />✓ Transcripts can be deleted
              </p>
              <p>
                <small>
                  Public links allow anyone with the link to start a call
                  against your account. Keep this hackathon deployment private
                  or add quotas before wider release.
                </small>
              </p>
            </div>
            <div className="panel">
              <h3>Remove this agent</h3>
              <p className="muted">
                Deletes the agent and its local versions and sessions.
              </p>
              <button
                className="btn"
                onClick={async () => {
                  if (
                    window.confirm(
                      "Delete this agent and its local session history?",
                    )
                  ) {
                    try {
                      await api(`/api/agents/${id}`, "DELETE");
                      window.location.href = "/agents";
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }
                }}
              >
                <Trash2 size={14} />
                Delete agent
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty">
          Choose Rehearse, Refine, or Take the stage above.
        </div>
      )}
      <Toast message={message} />
    </Shell>
  );
}
function ArrowUpRightIcon() {
  return <span>↗</span>;
}
