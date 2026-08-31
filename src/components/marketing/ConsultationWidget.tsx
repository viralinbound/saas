"use client";

import { useMemo, useState } from "react";
import { CONSULTATION_SLOTS } from "@/lib/marketing-content";

export function ConsultationWidget() {
  const [slot, setSlot] = useState("10:00am");

  const todayLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" });
  }, []);

  function book() {
    const text = encodeURIComponent(
      `Hi, I'd like to book a 15-min SuperShowroom strategy call for ${todayLabel} at ${slot}.`
    );
    window.open(`https://wa.me/918431101466?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="appointment-scheduler-box">
      <div className="scheduler-header-host">
        <div className="host-avatar-badge">S</div>
        <div>
          <div className="host-info-title">SuperShowroom</div>
          <div style={{ fontSize: "0.82rem", color: "var(--slate-500)", fontWeight: 600 }}>15-Min Live Strategy Call</div>
        </div>
      </div>
      <div className="scheduler-meta-tags">
        <span>⏱ 15 min strategy call</span>
        <span>💬 WhatsApp Call or Google Meet Video Invite</span>
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: 10, color: "var(--primary-navy)" }}>Select Date & Time (IST):</div>
        <div className="time-slots-column-grid">
          {CONSULTATION_SLOTS.map((t) => (
            <button key={t} type="button" className={`time-slot-btn${slot === t ? " active" : ""}`} onClick={() => setSlot(t)}>
              {t}
            </button>
          ))}
        </div>
        <p style={{ marginTop: 14, fontSize: "0.88rem", fontWeight: 700, color: "var(--slate-600)" }}>
          Selected: Today at {slot}
        </p>
        <button type="button" onClick={book} className="btn btn-primary btn-full" style={{ marginTop: 12 }}>
          Book This Appointment Slot →
        </button>
      </div>
    </div>
  );
}
