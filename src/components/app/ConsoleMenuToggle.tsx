"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Hamburger + backdrop for the merchant console sidebar on tablet/mobile.
 * Toggles `.is-open` on <aside id="console-aside"> and `.console-menu-open` on
 * <html>; CSS in globals.css handles the slide-in. Auto-closes on route change.
 */
export function ConsoleMenuToggle() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const aside = document.getElementById("console-aside");
    aside?.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("console-menu-open", open);
    return () => {
      aside?.classList.remove("is-open");
      document.documentElement.classList.remove("console-menu-open");
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="console-burger"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? "✕" : "☰"}
      </button>
      {open && <div className="console-backdrop" onClick={() => setOpen(false)} aria-hidden />}
    </>
  );
}
