"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "./studio";
import { api } from "./api";
import { usePreferences } from "./preferences";
import PersonalNote from "./personal-note";
type Session = {
  id: string;
  agent: { name: string };
  duration: number;
  analysis: string;
  simulated: boolean;
  createdAt: string;
};
export default function Dashboard() {
  const { preferences } = usePreferences();
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
          <div className="eyebrow">YOUR PRACTICE JOURNAL</div>
          <h1 className="journal-title">
            {preferences.name
              ? `${preferences.name}, look how far you’ve come.`
              : "You showed up. That counts."}
          </h1>
          <p className="muted">
            A few things to learn from. A few things to feel good about.
          </p>
        </div>
        <Link href="/new" className="btn primary">
          Try something new ↗
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
        <PersonalNote
          storageKey="practice-intention"
          title="What are you working on?"
          prompt="Maybe it’s asking better questions. Maybe it’s slowing down. One thing you’d like to try next time…"
        />
      </div>
      <div className="sectionhead">
        <h2>Your conversations, so far</h2>
        <div className="flex">
          <input
            aria-label="Search sessions"
            placeholder="Find a conversation…"
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
