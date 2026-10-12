import React, { useState } from "react";
import { ChevronDown, ExternalLink, Sparkles } from "lucide-react";

export default function INCOISNavRibbon({ onSelectSection }) {
  const [activeMenu, setActiveMenu] = useState("gyani");

  const navItems = [
    { id: "home", label: "Home", href: "https://incois.gov.in/site/index.jsp", isExternal: true },
    {
      id: "services",
      label: "Ocean Services",
      isDropdown: true,
      children: [
        { label: "Ocean State Forecast (OSF)", href: "https://incois.gov.in/site/forecast.jsp" },
        { label: "Tsunami Early Warning (ITEWC)", href: "https://tsunami.incois.gov.in/TEWS/" },
        { label: "Potential Fishing Zone (PFZ)", href: "https://incois.gov.in/site/ecosystem.jsp" },
        { label: "High Wave / Swell Alerts", href: "https://incois.gov.in/site/services/hwa.jsp" },
      ],
    },
    {
      id: "data",
      label: "Data Holdings",
      isDropdown: true,
      children: [
        { label: "Argo Analytics Dashboard", href: "https://incois.gov.in/argo" },
        { label: "Ocean Observation Network (OON)", href: "https://incois.gov.in/site/datainfo/OON.jsp" },
        { label: "ERDDAP Server", href: "https://erddap.incois.gov.in/" },
        { label: "Live Access Server (LAS)", href: "https://las.incois.gov.in/" },
      ],
    },
    { id: "research", label: "Modelling & Research", href: "https://incois.gov.in/site/datainfo/modelling/modelling.jsp", isExternal: true },
    { id: "mission", label: "Deep Ocean Mission", href: "https://incois.gov.in/site/deep-ocean.jsp", isExternal: true },
    { id: "gyani", label: "GYANI Visualizer", isHighlight: true, isAction: true },
    { id: "contact", label: "Contact Us", href: "https://incois.gov.in/site/contactus.jsp", isExternal: true },
  ];

  return (
    <nav className="incois-primary-nav-ribbon">
      <div className="nav-ribbon-inner">
        <ul className="nav-ribbon-list">
          {navItems.map((item) => (
            <li
              key={item.id}
              className={`nav-ribbon-item ${item.isHighlight ? "highlight-item" : ""} ${activeMenu === item.id ? "active" : ""}`}
            >
              {item.isAction ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu(item.id);
                    if (onSelectSection) onSelectSection("workspace");
                  }}
                  className="nav-ribbon-link action-link"
                >
                  <Sparkles size={14} className="highlight-icon" />
                  <span>{item.label}</span>
                </button>
              ) : item.isExternal ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-ribbon-link"
                >
                  <span>{item.label}</span>
                  <ExternalLink size={11} className="nav-ext-small" />
                </a>
              ) : (
                <div className="nav-dropdown-trigger">
                  <span className="nav-ribbon-link">
                    <span>{item.label}</span>
                    <ChevronDown size={12} className="dropdown-arrow" />
                  </span>
                  {item.children && (
                    <div className="nav-dropdown-menu">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dropdown-menu-item"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
