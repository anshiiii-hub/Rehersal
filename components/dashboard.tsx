"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "./studio";
import { api } from "./api";
import { Grade } from "@/lib/schemas";
type Session = {
  id: string;
  agent: { name: string };
  duration: number;
  analysis: string;
  simulated: boolean;
  createdAt: string;
};
export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("all"),
    [query, setQuery] = useState("");
  useEffect(() => {
    api("/api/sessions")
      .then(setSessions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const success = sessions.filter(
      (s) => JSON.parse(s.analysis).outcome === "success",
    ).length,
    avg = sessions.length
      ? Math.round(
          sessions.reduce((n, s) => n + s.duration, 0) / sessions.length,
        )
      : 0;
  return (
    <Shell>
      <div className="heading">
        <div>
          <div className="eyebrow">THE MOMENTS THAT MAKE A DIFFERENCE</div>
          <h1>Every conversation, a little better.</h1>
          <p className="muted">Look back. Find the turning points. Go again.</p>
        </div>
        <Link href="/new" className="btn primary">
          Create an agent ↗
        </Link>
      </div>
      {error && <div className="notice error">{error}</div>}
      <div className="stats">
        {[
          ["Total sessions", sessions.length, "Across your rehearsal room"],
          [
            "Average duration",
            `${Math.floor(avg / 60)}m ${avg % 60}s`,
            "Time spent finding your voice",
          ],
          [
            "Success rate",
            sessions.length
              ? `${Math.round((success / sessions.length) * 100)}%`
              : "—",
            "Based on session evaluation",
          ],
          [
            "Role-play moments",
            sessions.filter((s) => JSON.parse(s.analysis).items.length > 0)
              .length,
            "Practice with purpose",
          ],
        ].map(([name, value, sub]) => (
          <div className="card stat" key={name}>
            <small>{name}</small>
            <strong>{value}</strong>
            <small>{sub}</small>
          </div>
        ))}
      </div>
      <div className="split">
        <div className="panel">
          <h3>How the conversations landed</h3>
          {["success", "partial", "needs-practice"].map((outcome) => {
            const count = sessions.filter(
              (s) => JSON.parse(s.analysis).outcome === outcome,
            ).length;
            return (
              <div key={outcome} style={{ marginTop: 23 }}>
                <div
                  className="flex"
                  style={{ justifyContent: "space-between" }}
                >
                  <span>{outcome.replaceAll("-", " ")}</span>
                  <small>{count} sessions</small>
                </div>
                <div className="bar">
                  <div
                    style={{
                      width: `${sessions.length ? (count / sessions.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="panel"
          style={{ background: "linear-gradient(120deg,#2b223a,#1c1923)" }}
        >
          <div className="eyebrow">PRACTICE MAKES PROGRESS</div>
          <h2>
            The transcript tells a story.
            <br />
            The feedback shows the way.
          </h2>
          <p className="muted">
            Open a role-play session to see evidence-backed scores, missed
            opportunities, and the next thing to try.
          </p>
          <span style={{ color: "#c5a4fa" }}>
            A better conversation starts with reflection. ↗
          </span>
        </div>
      </div>
      <div className="sectionhead">
        <h2>Session history</h2>
        <div className="flex">
          <input
            aria-label="Search sessions"
            placeholder="Search agents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Filter outcome"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All outcomes</option>
            <option value="success">Success</option>
            <option value="partial">Partial</option>
            <option value="needs-practice">Needs practice</option>
          </select>
        </div>
      </div>
      <div className="panel" style={{ padding: "6px 18px" }}>
        {loading ? (
          <div className="empty">Gathering your conversations…</div>
        ) : sessions.length === 0 ? (
          <div className="empty">
            Your story starts with a conversation. Test an agent and save your
            first session.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Outcome</th>
                <th>Source</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions
                .filter(
                  (s) =>
                    s.agent.name.toLowerCase().includes(query.toLowerCase()) &&
                    (filter === "all" ||
                      JSON.parse(s.analysis).outcome === filter),
                )
                .map((s) => (
                  <tr key={s.id}>
                    <td>{s.agent.name}</td>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td>
                      {Math.floor(s.duration / 60)}m {s.duration % 60}s
                    </td>
                    <td>
                      <span className="pill">
                        {JSON.parse(s.analysis).outcome}
                      </span>
                    </td>
                    <td>
                      <small>
                        {s.simulated ? "Demo fixture" : "ElevenLabs"}
                      </small>
                    </td>
                    <td>
                      <Link href={`/sessions/${s.id}`}>Review ↗</Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
      <p>
        <small>
          Privacy: saved transcripts are stored in this workspace. Open a
          session to delete its transcript and associated provider conversation.
        </small>
      </p>
    </Shell>
  );
}
