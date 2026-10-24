import { Shell } from "@/components/studio";
import Link from "next/link";
export default function Guide() {
  return (
    <Shell>
      <div className="eyebrow">YOUR FIRST REHEARSAL</div>
      <h1>An idea. A voice. A conversation.</h1>
      <p className="muted">
        Five small steps to build something worth talking to.
      </p>
      {[
        [
          "Write",
          "Describe the character or assistant in a few sentences. Choose a starter if you need a little inspiration.",
        ],
        [
          "Rehearse",
          "Start a microphone conversation. Try interrupting, changing languages, or asking a difficult question.",
        ],
        [
          "Refine",
          "Direct changes in plain language, preview the diff, and apply it. The form editor works without an LLM key.",
        ],
        [
          "Take the stage",
          "Publish a practice link or copy the iframe into your own site. Students never receive hidden character instructions.",
        ],
        [
          "Reflect",
          "Save your session. Read the transcript and the evidence-backed role-play feedback in Overview.",
        ],
      ].map(([title, text], i) => (
        <div className="panel" key={title}>
          <span className="eyebrow">0{i + 1}</span>
          <h2>{title}</h2>
          <p className="muted">{text}</p>
        </div>
      ))}
      <Link className="btn primary" href="/new">
        Create your first agent ↗
      </Link>
    </Shell>
  );
}
