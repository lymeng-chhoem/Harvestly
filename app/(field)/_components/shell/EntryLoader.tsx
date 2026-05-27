"use client";

import { useEffect, useState } from "react";
import type { Language } from "@/lib/harvestly-content";
import { BotanicalSprig } from "../ui/BotanicalSprig";

export function EntryLoader({ language }: { language: Language }) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reducedFrame = window.requestAnimationFrame(() => setVisible(false));
      return () => window.cancelAnimationFrame(reducedFrame);
    }

    let animationFrame = 0;
    let hideTimer = 0;
    const duration = 720;
    const startedAt = performance.now();

    function advance(now: number) {
      const amount = Math.min(100, Math.round(((now - startedAt) / duration) * 100));
      setProgress(amount);
      if (amount < 100) {
        animationFrame = window.requestAnimationFrame(advance);
        return;
      }
      setExiting(true);
      hideTimer = window.setTimeout(() => setVisible(false), 180);
    }

    animationFrame = window.requestAnimationFrame(advance);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className={`entry-loader ${exiting ? "exiting" : ""}`} role="status" aria-label={language === "km" ? "កំពុងបើក Harvestly" : "Opening Harvestly"}>
      <div className="loader-content">
        <BotanicalSprig className="loader-sprig" />
        <strong>HARVESTLY</strong>
        <p>{language === "km" ? "កំពុងរៀបចំឧបករណ៍វាល" : "Preparing your field guide"}</p>
        <div className="loader-meter" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
        <output>{progress}%</output>
      </div>
    </div>
  );
}
