"use client";
import { useEffect, useState } from "react";
import { api } from "./api";
import Conversation from "./conversation";
export default function PublicTalk({ id }: { id: string }) {
  const [data, setData] = useState<{
      name: string;
      welcome_message: string;
      brief: string;
      live: boolean;
    }>(),
    [error, setError] = useState("");
  useEffect(() => {
    api(`/api/public/${id}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);
  return (
    <main style={{ maxWidth: 1100, margin: "auto", padding: "45px 25px" }}>
      <div className="brand">
        ≋ rehearsal<span className="coral">.</span>
      </div>
      <div className="heading" style={{ marginTop: 40 }}>
        <div>
          <div className="eyebrow">A SAFE PLACE TO FIND YOUR VOICE</div>
          <h1>{data?.name || "Your practice room"}</h1>
          <p className="muted">{data?.brief}</p>
        </div>
      </div>
      {error ? (
        <div className="notice error">{error}</div>
      ) : data ? (
        <>
          {!data.live && (
            <div className="notice">
              This is an offline demo agent. Live voice becomes available when
              the teacher configures ElevenLabs.
            </div>
          )}
          <Conversation
            id={id}
            name={data.name}
            welcome={data.welcome_message}
            publicMode
          />
        </>
      ) : (
        <div className="empty">Setting the scene…</div>
      )}
    </main>
  );
}
