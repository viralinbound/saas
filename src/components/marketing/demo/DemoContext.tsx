"use client";

import { createContext, useContext, useState } from "react";
import { BookDemoModal } from "./BookDemoModal";

const Ctx = createContext<{ open: () => void }>({ open: () => {} });

export function useDemo() {
  return useContext(Ctx);
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      {open && <BookDemoModal onClose={() => setOpen(false)} />}
    </Ctx.Provider>
  );
}

/** Drop-in button that opens the demo modal (works inside server components). */
export function BookDemoButton({
  children = "book a demo",
  style,
  className,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { open } = useDemo();
  return (
    <button type="button" onClick={open} className={className} style={{ font: "inherit", cursor: "pointer", ...style }}>
      {children}
    </button>
  );
}
