import React, { useState } from "react";
import { Globe } from "lucide-react";
import CompassGyro3D from "../ThreeD/CompassGyro3D";

export default function InstitutionalHeader({ language, onLanguageChange, languages, copy }) {
  const [fontSizeOffset, setFontSizeOffset] = useState(0);

  const handleFontSize = (offset) => {
    setFontSizeOffset(offset);
    document.documentElement.style.fontSize =
      offset === 0 ? "100%" : offset > 0 ? "108%" : "92%";
  };

  return (
    <header className="institutional-header">
      {/* 1. Official Government of India & MoES Top Bar */}
      <div className="gov-topbar">
        <div className="gov-topbar-inner">
          <div className="gov-brand">
            <span className="emblem-text">भारत सरकार | Government of India</span>
            <span className="gov-sep">·</span>
            <span className="moes-text">पृथ्वी विज्ञान मंत्रालय | Ministry of Earth Sciences</span>
          </div>

          <div className="topbar-right">
            {/* Standard Accessibility Font Sizing Tools */}
            <div className="accessibility-tools" aria-label="Font size controls">
              <span className="access-label">Font:</span>
              <button
                type="button"
                onClick={() => handleFontSize(-1)}
                className={`access-btn ${fontSizeOffset === -1 ? "active" : ""}`}
                title="Decrease font size"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => handleFontSize(0)}
                className={`access-btn ${fontSizeOffset === 0 ? "active" : ""}`}
                title="Standard font size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleFontSize(1)}
                className={`access-btn ${fontSizeOffset === 1 ? "active" : ""}`}
                title="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Live Service Status Indicator */}
            <div className="status-badge" title="INCOIS Observation & Forecast Servers Online">
              <span className="status-dot"></span>
              <span className="status-text">INCOIS Services: Online</span>
            </div>

            {/* Multilingual Selector */}
            <div className="lang-picker">
              <Globe size={13} className="lang-icon" />
              <label htmlFor="header-lang-select" className="sr-only">
                Language
              </label>
              <select
                id="header-lang-select"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="lang-select"
              >
                {Object.entries(languages).map(([code, item]) => (
                  <option key={code} value={code}>
                    {item.native} ({item.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Institutional Identity & Revolving 3D Compass Gyroscope */}
      <div className="header-main">
        <div className="header-main-inner">
          <div className="incois-logo-block">
            {/* Precision 3D Marine Compass Gyroscope Crest */}
            <div className="incois-crest-3d">
              <CompassGyro3D />
            </div>

            <div className="incois-titles">
              <h2 className="institution-name">
                भारतीय राष्ट्रीय महासागर सूचना सेवा केंद्र (इन्कोइस)
              </h2>
              <h1 className="institution-en">
                INDIAN NATIONAL CENTRE FOR OCEAN INFORMATION SERVICES
              </h1>
              <p className="institution-sub">
                (An Autonomous Body under the Ministry of Earth Sciences, Govt. of India)
              </p>
            </div>
          </div>

          <div className="project-badge-block">
            <div className="gyani-brand-badge">
              <span className="gyani-acronym">GYANI</span>
              <span className="gyani-tagline">Intelligent Scientific Visualizer</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
