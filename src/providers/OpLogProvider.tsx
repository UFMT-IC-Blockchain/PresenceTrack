import React, { createContext, useContext, useMemo, useState } from "react";

type OpLogLevel = "info" | "success" | "error";
type OpLogEntry = { id: string; ts: number; level: OpLogLevel; text: string };

type Ctx = {
  entries: OpLogEntry[];
  isOpen: boolean;
  log: (level: OpLogLevel, text: string) => void;
  toggle: () => void;
  clear: () => void;
};

const OpLogCtx = createContext<Ctx | null>(null);

export const OpLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<OpLogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const log = (level: OpLogLevel, text: string) => {
    setEntries((prev) => [{ id: Math.random().toString(36).slice(2), ts: Date.now(), level, text }, ...prev].slice(0, 500));
  };
  const toggle = () => setIsOpen((v) => !v);
  const clear = () => setEntries([]);
  const value = useMemo(() => ({ entries, isOpen, log, toggle, clear }), [entries, isOpen]);
  return <OpLogCtx.Provider value={value}>{children}</OpLogCtx.Provider>;
};

export const useOpLog = () => {
  const ctx = useContext(OpLogCtx);
  if (!ctx) throw new Error("OpLogProvider missing");
  return ctx;
};