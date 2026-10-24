"use client";
import { useEffect, useState } from "react";
import { PencilLine, Check } from "lucide-react";
export default function PersonalNote({
  storageKey,
  title,
  prompt,
}: {
  storageKey: string;
  title: string;
  prompt: string;
}) {
  const [note, setNote] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      const value = localStorage.getItem(`rehearsal-note-${storageKey}`) || "";
      setNote(value);
      setSaved(!!value);
    } catch {}
  }, [storageKey]);
  return (
    <section className="panel personal-note">
      <span className="handwritten">a note for your future self</span>
      <h2>{title}</h2>
      <label className="sr-only" htmlFor={`note-${storageKey}`}>
        {title}
      </label>
      <textarea
        id={`note-${storageKey}`}
        value={note}
        maxLength={1000}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        placeholder={prompt}
        rows={3}
      />
      <div className="note-footer">
        <small>Just for you. Saved in this browser.</small>
        <button
          className="btn"
          disabled={saved}
          onClick={() => {
            try {
              localStorage.setItem(`rehearsal-note-${storageKey}`, note);
              setSaved(true);
            } catch {
              setSaved(false);
            }
          }}
        >
          {saved ? (
            <>
              <Check size={13} />
              Kept for next time
            </>
          ) : (
            <>
              <PencilLine size={13} />
              Keep this note
            </>
          )}
        </button>
      </div>
      <span className="sr-only" role="status">
        {saved ? "Your note is saved" : ""}
      </span>
    </section>
  );
}
