"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/marketing-content";

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="faq-accordion-container">
      {FAQ_ITEMS.map((item, i) => (
        <div key={item.q} className={`faq-item${open === i ? " active" : ""}`}>
          <button type="button" className="faq-question" onClick={() => setOpen(open === i ? null : i)}>
            {item.q} <span>▼</span>
          </button>
          <div className="faq-answer">{item.a}</div>
        </div>
      ))}
    </div>
  );
}
