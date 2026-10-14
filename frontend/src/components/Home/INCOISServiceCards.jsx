import React from "react";
import { Waves, Fish, ShieldAlert, Cpu, Smartphone, Wind, ExternalLink } from "lucide-react";

export default function INCOISServiceCards() {
  const services = [
    {
      id: "osf",
      title: "Ocean State Forecast (OSF)",
      badge: "Navigational Safety",
      icon: Waves,
      theme: "card-blue",
      desc: "7-day forecasts of wave heights, swell direction, sea surface temperature, and ocean currents for navigation and coastal safety.",
      url: "https://incois.gov.in/site/forecast.jsp",
    },
    {
      id: "pfz",
      title: "Potential Fishing Zone (PFZ)",
      badge: "Fisheries Advisory",
      icon: Fish,
      theme: "card-teal",
      desc: "Multi-satellite thermal and chlorophyll front advisories guiding artisanal and mechanized fishermen to productive fishing grounds.",
      url: "https://incois.gov.in/site/ecosystem.jsp",
    },
    {
      id: "tews",
      title: "Tsunami Early Warning (ITEWC)",
      badge: "24x7 Multi-Hazard",
      icon: ShieldAlert,
      theme: "card-red",
      desc: "Continuous real-time seismic monitoring, coastal tide gauge network, and deep-ocean bottom pressure recorders (BPR) covering the Indian Ocean rim.",
      url: "https://tsunami.incois.gov.in/TEWS/",
    },
    {
      id: "argo",
      title: "Argo Float Ocean Profiling",
      badge: "Autonomous Robotics",
      icon: Cpu,
      theme: "card-amber",
      desc: "Global network of robotic profiling floats measuring vertical temperature and salinity distributions down to 2,000m depth.",
      url: "https://incois.gov.in/argo",
    },
    {
      id: "hwa",
      title: "High Wave & Swell Alerts",
      badge: "Coastal Protection",
      icon: Wind,
      theme: "card-cyan",
      desc: "Early warning bulletins for coastal erosion, swell surges (Kallakkadal), and storm surges during monsoon and cyclonic events.",
      url: "https://incois.gov.in/site/services/hwa.jsp",
    },
    {
      id: "samudra",
      title: "SAMUDRA Mobile Services",
      badge: "Smart Marine App",
      icon: Smartphone,
      theme: "card-indigo",
      desc: "Smart Access to Marine Users for ocean Data Resources and Advisories with real-time GIS mapping in regional Indian languages.",
      url: "https://incois.gov.in/site/SAMUDRA/index.html",
    },
  ];

  return (
    <section className="incois-services-section" aria-label="INCOIS Core Services">
      <div className="services-section-header">
        <div className="section-title-wrap">
          <span className="section-eyebrow">NATIONAL OCEANIC INFRASTRUCTURE</span>
          <h2 className="section-title">INCOIS Core Portals & Operational Services</h2>
        </div>
        <p className="section-subtitle">
          Direct access to verified national marine advisories, numerical model products, and observational networks.
        </p>
      </div>

      <div className="services-grid">
        {services.map((srv) => {
          const IconComp = srv.icon;
          return (
            <div key={srv.id} className={`service-card ${srv.theme}`}>
              <div className="card-top">
                <div className="service-icon-box">
                  <IconComp size={22} />
                </div>
                <div className="card-top-right">
                  <span className="service-category-badge">{srv.badge}</span>
                  <a
                    href={srv.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="service-ext-link"
                    title={`Open official ${srv.title} portal`}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <h3 className="service-card-title">{srv.title}</h3>
              <p className="service-card-desc">{srv.desc}</p>

            </div>
          );
        })}
      </div>
    </section>
  );
}
