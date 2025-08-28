"use client";

import { createContext, useContext, useEffect, useState } from "react";

type PrivacyMode = "off" | "blur" | "hoverToReveal";

const PrivacyCtx = createContext<{
  mode: PrivacyMode;
  setMode: (m: PrivacyMode) => void;
}>({
  mode: "off",
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  setMode: () => {},
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PrivacyMode>("off");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(
        "vaultPrivacyMode",
      ) as PrivacyMode | null;
      if (stored === "off" || stored === "blur" || stored === "hoverToReveal") {
        setMode(stored);
      }
    } catch {
      // ignore access errors (e.g., disabled storage)
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("vaultPrivacyMode", mode);
    } catch {
      // ignore quota/access errors
    }
  }, [mode]);

  return (
    <PrivacyCtx.Provider value={{ mode, setMode }}>
      {children}
    </PrivacyCtx.Provider>
  );
}

export const usePrivacy = () => useContext(PrivacyCtx);
