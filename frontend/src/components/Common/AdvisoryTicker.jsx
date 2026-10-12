import React, { useState } from "react";
import { AlertTriangle, Radio, Volume2, ShieldAlert } from "lucide-react";

export default function AdvisoryTicker() {
  const [isPaused, setIsPaused] = useState(false);

  const bulletins = [
    {
      type: "HIGH WAVE",
      level: "warning",
      text: "High Wave Alert: Swell surge of 2.2m – 3.1m predicted along Kerala and South Tamil Nadu coasts; small boats advised caution.",
    },
    {
      type: "ITEWC",
      level: "normal",
      text: "Indian Tsunami Early Warning Centre (ITEWC): Status NORMAL. No tsunami threat detected in the Indian Ocean rim.",
    },
    {
      type: "OSF",
      level: "advisory",
      text: "Ocean State Forecast: Surface wind speeds 22–28 knots over the South-West Arabian Sea. Rough sea conditions prevailing.",
    },
    {
      type: "PFZ",
      level: "info",
      text: "Potential Fishing Zone (PFZ) Advisories updated based on NOAA/AVHRR SST and Oceansat chlorophyll data.",
    },
  ];

  return (
    <div className="incois-advisory-ticker-bar">
      <div className="ticker-label-badge">
        <span className="live-pulse-dot"></span>
        <Radio size={13} className="ticker-icon" />
        <span className="ticker-heading">INCOIS BULLETINS</span>
      </div>

      <div
        className="ticker-marquee-track"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`ticker-marquee-content ${isPaused ? "paused" : ""}`}>
          {bulletins.concat(bulletins).map((item, idx) => (
            <span key={idx} className={`bulletin-item ${item.level}`}>
              <span className="bulletin-type">[{item.type}]</span>
              <span className="bulletin-text">{item.text}</span>
              <span className="bulletin-divider">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
