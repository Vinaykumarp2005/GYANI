import React, { useState } from "react";
import { Globe, Activity, ExternalLink, Compass } from "lucide-react";
import CompassGyro3D from "../ThreeD/CompassGyro3D";

export default function InstitutionalHeader({ language, onLanguageChange, languages, copy }) {
  const t = copy[language] || copy.en;
  const [fontSizeOffset, setFontSizeOffset] = useState(0);

  const handleFontSize = (offset) => {
    setFontSizeOffset(offset);
    document.documentElement.style.fontSize = offset === 0 ? "100%" : offset > 0 ? "110%" : "90%";
  };

  const officialLinks = [
    { label: "Ocean Observations", url: "https://incois.gov.in/site/datainfo/OON.jsp" },
    { label: "Argo Dashboard", url: "https://incois.gov.in/argo" },
    { label: "ERDDAP Portal", url: "https://erddap.incois.gov.in/" },
    { label: "Live Access Server", url: "https://las.incois.gov.in/" },
    { label: "SAMUDRA App", url: "https://incois.gov.in/site/SAMUDRA/index.html" },
  ];

  return (
    <header className="institutional-header">
      {/* Top Gov/MoES Banner with Accessibility Tools */}
      <div className="gov-topbar">
        <div className="gov-topbar-inner">
          <div className="gov-brand">
            <span className="emblem-text">भारत सरकार | Government of India</span>
            <span className="gov-sep">·</span>
            <span className="moes-text">पृथ्वी विज्ञान मंत्रालय | Ministry of Earth Sciences</span>
          </div>

          <div className="topbar-right">
            {/* Accessibility Controls */}
            <div className="accessibility-tools">
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

            <div className="status-badge">
              <span className="status-dot"></span>
              <span className="status-text">INCOIS Services: Online</span>
            </div>

            <div className="lang-picker">
              <Globe size={14} className="lang-icon" />
              <label htmlFor="header-lang-select" className="sr-only">Language</label>
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

      {/* Main Institutional Identity Bar with Revolving 3D Gyroscope */}
      <div className="header-main">
        <div className="header-main-inner">
          <div className="incois-logo-block">
            {/* Revolving 3D Marine Compass Gyroscope */}
            <div className="incois-crest-3d">
              <CompassGyro3D />
            </div>

            <div className="incois-titles">
              <div className="institution-name">
                भारतीय राष्ट्रीय महासागर सूचना सेवा केंद्र (इन्कोइस)
              </div>
              <div className="institution-en">
                INDIAN NATIONAL CENTRE FOR OCEAN INFORMATION SERVICES
              </div>
              <div className="institution-sub">
                (An Autonomous Body under the Ministry of Earth Sciences, Govt. of India)
              </div>
            </div>
          </div>

          <div className="project-badge-block">
            <div className="gyani-brand-badge">
              <span className="gyani-acronym">GYANI</span>
              <span className="gyani-tagline">Scientific Visualization Module</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Strip */}
      <nav className="header-nav-strip">
        <div className="nav-strip-inner">
          <span className="nav-label">INCOIS PORTALS:</span>
          <ul className="nav-links">
            {officialLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link-item"
                >
                  {link.label}
                  <ExternalLink size={11} className="nav-ext-icon" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
