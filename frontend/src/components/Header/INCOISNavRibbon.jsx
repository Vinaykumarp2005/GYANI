import React, { useState } from "react";
import { ChevronDown, ExternalLink, Sparkles, Database, Layers, ShieldAlert, Compass } from "lucide-react";

export default function INCOISNavRibbon({ onSelectSection }) {
  const [activeMenu, setActiveMenu] = useState("gyani");

  const navItems = [
    {
      id: "home",
      label: "Home",
      href: "https://incois.gov.in/site/index.jsp",
      isExternal: true,
    },
    {
      id: "services",
      label: "Operational Services",
      isDropdown: true,
      children: [
        { label: "Ocean State Forecast (OSF)", href: "https://incois.gov.in/site/forecast.jsp", desc: "Wave, wind, and current forecasts" },
        { label: "Tsunami Early Warning (ITEWC)", href: "https://tsunami.incois.gov.in/TEWS/", desc: "24x7 seismic and tsunami monitoring" },
        { label: "Potential Fishing Zone (PFZ)", href: "https://incois.gov.in/site/ecosystem.jsp", desc: "Satellite thermal and chlorophyll fronts" },
        { label: "High Wave / Swell Alerts", href: "https://incois.gov.in/site/services/hwa.jsp", desc: "Coastal swell and surge advisories" },
      ],
    },
    {
      id: "portals",
      label: "INCOIS Portals & Data",
      isDropdown: true,
      children: [
        { label: "Argo Float Analytics", href: "https://incois.gov.in/argo", desc: "Robotic temperature & depth profilers" },
        { label: "Ocean Observation Network (OON)", href: "https://incois.gov.in/site/datainfo/OON.jsp", desc: "Moored buoys, tide gauges, drifters" },
        { label: "Live Access Server (LAS)", href: "https://las.incois.gov.in/", desc: "Gridded model visualizer & OPeNDAP" },
        { label: "ERDDAP Data Server", href: "https://erddap.incois.gov.in/", desc: "Standardized scientific data access" },
        { label: "SAMUDRA Mobile App", href: "https://incois.gov.in/site/SAMUDRA/index.html", desc: "Mobile marine advisories" },
      ],
    },
    {
      id: "research",
      label: "Modelling & Missions",
      isDropdown: true,
      children: [
        { label: "Deep Ocean Mission", href: "https://incois.gov.in/site/deep-ocean.jsp", desc: "MoES exploration initiative" },
        { label: "Ocean Modelling & Forecasting", href: "https://incois.gov.in/site/datainfo/modelling/modelling.jsp", desc: "ROMS and wave numerical models" },
        { label: "Monsoon Mission", href: "https://incois.gov.in/site/uc.jsp", desc: "Coupled climate model research" },
      ],
    },
    {
      id: "gyani",
      label: "GYANI 3D Visualizer",
      isHighlight: true,
      isAction: true,
    },
    {
      id: "contact",
      label: "Contact Us",
      href: "https://incois.gov.in/site/contactus.jsp",
      isExternal: true,
    },
  ];

  return (
    <nav className="incois-primary-nav-ribbon" aria-label="Main Navigation">
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
                  <button type="button" className="nav-ribbon-link dropdown-toggle">
                    <span>{item.label}</span>
                    <ChevronDown size={12} className="dropdown-arrow" />
                  </button>
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
                          <span className="dropdown-child-title">{child.label}</span>
                          {child.desc && <span className="dropdown-child-desc">{child.desc}</span>}
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
