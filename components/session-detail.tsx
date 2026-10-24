"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "./studio";
import { api } from "./api";
import { Config, Grade, Turn } from "@/lib/schemas";
type Detail = {
  id: string;
  agent: { id: string; name: string; config: Config };
  transcript: Turn[];
  analysis: Grade & { provider?: unknown };
  duration: number;
  simulated: boolean;
};
export default function SessionDetail({ id }: { id: string }) {
  const [s, setS] = useState<Detail>(),
    [error, setError] = useState("");
  useEffect(() => {
    api(`/api/sessions/${id}`)
      .then(setS)
      .catch((e) => setError(e.message));
  }, [id]);
  if (!s)
    return (
      <Shell>
        <div className="empty">{error || "Finding the turning points…"}</div>
      </Shell>
    );
  const score = s.analysis.items.reduce((n, i) => n + i.points, 0),
    max = s.agent.config.rubric.reduce((n, i) => n + i.points, 0);
  return (
    <Shell>
      <Link href="/dashboard" className="muted">
        ← All conversations
      </Link>
      <div className="heading" style={{ marginTop: 20 }}>
        <div>
          <div className="eyebrow">EVERY WORD IS A CHANCE TO GROW</div>
          <h1>{s.agent.name}</h1>
          <p className="muted">
            Session reflection · {Math.floor(s.duration / 60)}m{" "}
            {s.duration % 60}s · {s.simulated ? "Demo fixture" : "Live voice"}
          </p>
        </div>
        {max > 0 && (
          <div className="center">
            <strong style={{ fontSize: 44, color: "#c5a5ff" }}>
              {score}
              <small style={{ fontSize: 18 }}>/{max}</small>
            </strong>
            <p className="muted">Your practice score</p>
          </div>
        )}
      </div>
      {error && <div className="notice error">{error}</div>}
      {s.simulated && (
        <div className="notice">
          This is a labeled demo fixture. Its transcript and scores are
          illustrative, not results from a live call.
        </div>
      )}
      <div className="panel">
        <span className="pill">{s.analysis.outcome}</span>
        <p>{s.analysis.summary}</p>
        <small>Sentiment: {s.analysis.sentiment}</small>
        {s.analysis.flagged_issues.map((x, i) => (
          <p className="coral" key={i}>
            {x}
          </p>
        ))}
      </div>
      <div className="split">
        <div className="panel">
          <h3>The conversation, with context</h3>
          <p>
            <small>
              Green highlights indicate a verified evidence quote. Scores
              without a matching student quote are zero.
            </small>
          </p>
          {s.transcript.map((t, i) => {
            const hit = s.analysis.items.find(
              (x) => x.turn_index === i && x.status !== "missed",
            );
            return (
              <div className={`turn ${t.role} ${hit ? "hit" : ""}`} key={i}>
                <small>
                  {i + 1} · {t.role === "user" ? "Student" : s.agent.name}
                </small>
                <p>{t.message}</p>
                {hit && (
                  <small style={{ color: "#9ad0b1" }}>
                    ✓ {s.agent.config.rubric.find((r) => r.id === hit.id)?.name}{" "}
                    · +{hit.points}
                  </small>
                )}
              </div>
            );
          })}
        </div>
        <div>
          {s.analysis.items.length > 0 && (
            <div className="panel">
              <h3>Your practice rubric</h3>
              {s.analysis.items.map((item) => {
                const r = s.agent.config.rubric.find((r) => r.id === item.id);
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: "18px 0",
                      borderBottom: "1px solid #302b38",
                    }}
                  >
                    <div
                      className="flex"
                      style={{ justifyContent: "space-between" }}
                    >
                      <b>{r?.name}</b>
                      <span
                        style={{
                          color:
                            item.status === "missed" ? "#f1a492" : "#a8d5b4",
                        }}
                      >
                        {item.points}/{r?.points}
                      </span>
                    </div>
                    <p className="muted" style={{ fontSize: 12 }}>
                      {item.evidence
                        ? `“${item.evidence}”`
                        : "No verified evidence found."}
                    </p>
                    <span className="badge">{item.status}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="panel">
            <h3>Three things to take into the next conversation</h3>
            {s.analysis.top_improvements.map((x, i) => (
              <p key={i}>
                <span style={{ color: "#be9dfa" }}>
                  {String(i + 1).padStart(2, "0")}{" "}
                </span>
                {x}
              </p>
            ))}
          </div>
          <div className="panel">
            <h3>Missed moments</h3>
            {s.analysis.missed_moments.length ? (
              s.analysis.missed_moments.map((x, i) => (
                <p className="muted" key={i}>
                  {x}
                </p>
              ))
            ) : (
              <p className="muted">No additional moments identified.</p>
            )}
            <h3>Secrets uncovered</h3>
            {s.agent.config.secrets.map((secret, i) => (
              <p className="muted" key={i}>
                {s.analysis.secrets_uncovered.includes(secret.secret)
                  ? "✓"
                  : "○"}{" "}
                {secret.secret}
              </p>
            ))}
          </div>
          {!!s.analysis.provider && (
            <details className="panel">
              <summary>ElevenLabs evaluation & data collection</summary>
              <pre className="code">
                {JSON.stringify(s.analysis.provider, null, 2)}
              </pre>
            </details>
          )}
          <Link className="btn primary" href={`/agents/${s.agent.id}/test`}>
            Take another rehearsal ↗
          </Link>
        </div>
      </div>
      <div className="panel" style={{ marginTop: 25 }}>
        <h3>Your words, your choice</h3>
        <p className="muted">
          This transcript is stored locally. Delete removes the local session
          and its provider conversation when available.
        </p>
        <button
          className="btn"
          onClick={async () => {
            if (
              window.confirm(
                "Permanently delete this session and its provider conversation?",
              )
            ) {
              try {
                await api(`/api/sessions/${id}`, "DELETE");
                window.location.href = "/dashboard";
              } catch (e) {
                setError((e as Error).message);
              }
            }
          }}
        >
          Delete session
        </button>
      </div>
    </Shell>
  );
}
