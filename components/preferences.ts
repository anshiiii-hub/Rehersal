"use client";
import { useEffect, useState } from "react";
export type Preferences = {
  name: string;
  workspace: string;
  theme: "paper" | "night";
};
const defaults: Preferences = {
  name: "",
  workspace: "My rehearsal studio",
  theme: "paper",
};
const key = "rehearsal-preferences";
function read(): Preferences {
  try {
    const p = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      name: typeof p.name === "string" ? p.name.slice(0, 35) : "",
      workspace:
        typeof p.workspace === "string"
          ? p.workspace.slice(0, 45)
          : defaults.workspace,
      theme: p.theme === "night" ? "night" : "paper",
    };
  } catch {
    return defaults;
  }
}
export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  useEffect(() => {
    const sync = () => {
      const p = read();
      setPreferences(p);
      document.documentElement.dataset.theme = p.theme;
    };
    sync();
    window.addEventListener(key, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(key, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  function update(p: Preferences) {
    localStorage.setItem(key, JSON.stringify(p));
    window.dispatchEvent(new Event(key));
  }
  return { preferences, update };
}
