import React, { useState } from "react";
import { Radio, Pause, Play, AlertCircle, Info, ShieldCheck } from "lucide-react";

export default function AdvisoryTicker() {
  const [isPaused, setIsPaused] = useState(false);

  const bulletins = [
    {
      type: "HIGH WAVE ALERT",
      badgeClass: "badge-alert",
      icon: AlertCircle,
      text: "Swell surge of 2.2m – 3.2m predicted along Kerala, Lakshadweep, and South Tamil Nadu coasts; small craft advised caution.",
    },
    {
      type: "TSUNAMI STATUS: NORMAL",
      badgeClass: "badge-normal",
      icon: ShieldCheck,
      text: "Indian Tsunami Early Warning Centre (ITEWC): Status NORMAL. No earthquake above threat threshold in the Indian Ocean basin.",
    },
    {
      type: "OCEAN STATE FORECAST",
      badgeClass: "badge-advisory",
      icon: Info,
      text: "Surface wind speeds 22–28 knots over the South-West Arabian Sea. Rough sea conditions prevailing.",
    },
    {
      type: "PFZ ADVISORY",
      badgeClass: "badge-info",
      icon: Info,
      text: "Potential Fishing Zone (PFZ) composite maps updated for Gujarat, Maharashtra, and Karnataka marine sectors.",
    },
  ];

  return (
    <div className="incois-advisory-ticker-bar" role="region" aria-label="Live Ocean Bulletins">
      <div className="ticker-label-badge">
        <span className="live-pulse-dot" aria-hidden="true"></span>
        <Radio size={13} className="ticker-icon" />
        <span className="ticker-heading">LIVE BULLETINS</span>
      </div>

      <div
        className="ticker-marquee-track"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`ticker-marquee-content ${isPaused ? "paused" : ""}`}>
          {bulletins.concat(bulletins).map((item, idx) => {
            const Icon = item.icon;
            return (
              <span key={idx} className={`bulletin-item ${item.badgeClass}`}>
                <span className="bulletin-type">
                  <Icon size={12} className="bulletin-icon" />
                  {item.type}
                </span>
                <span className="bulletin-text">{item.text}</span>
                <span className="bulletin-divider" aria-hidden="true">✦</span>
              </span>
            );
          })}
        </div>
      </div>

      {isPaused && (
        <div className="ticker-pause-indicator" title="Marquee paused on hover">
          <Pause size={11} />
          <span>Paused</span>
        </div>
      )}
    </div>
  );
}
