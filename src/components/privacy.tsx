"use client";

import { createContext, useContext, useEffect, useState } from "react";

type PrivacyMode = "off" | "blur" | "hoverToReveal";

const PrivacyCtx = createContext<{
  mode: PrivacyMode;
  setMode: (m: PrivacyMode) => void;
}>({
  mode: "off",
  setMode: () => {},
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PrivacyMode>(
    () => (localStorage.getItem("vaultPrivacyMode") as PrivacyMode) || "off",
  );

  useEffect(() => localStorage.setItem("vaultPrivacyMode", mode), [mode]);

  return (
    <PrivacyCtx.Provider value={{ mode, setMode }}>
      {children}
    </PrivacyCtx.Provider>
  );
}

export const usePrivacy = () => useContext(PrivacyCtx);
