import React from "react";
import { Waves, Fish, ShieldAlert, Cpu, Smartphone, Wind, ExternalLink } from "lucide-react";

export default function INCOISServiceCards({ onSelectServiceQuery }) {
  const services = [
    {
      id: "osf",
      title: "Ocean State Forecast (OSF)",
      icon: Waves,
      colorClass: "card-blue",
      desc: "7-day forecasts of wave heights, swells, sea surface temperature, and ocean currents for navigation safety.",
      url: "https://incois.gov.in/site/forecast.jsp",
      sampleQuery: "Show the current pattern during June 2025",
    },
    {
      id: "pfz",
      title: "Potential Fishing Zone (PFZ)",
      icon: Fish,
      colorClass: "card-teal",
      desc: "Daily multi-satellite ocean color and thermal front advisories assisting coastal artisanal and mechanized fishermen.",
      url: "https://incois.gov.in/site/ecosystem.jsp",
      sampleQuery: "Show SST evolution in the Arabian Sea during June 2025",
    },
    {
      id: "tews",
      title: "Tsunami Early Warning (ITEWC)",
      icon: ShieldAlert,
      colorClass: "card-red",
      desc: "24x7 monitoring network of seismic stations, coastal tide gauges, and bottom pressure recorders covering the Indian Ocean rim.",
      url: "https://tsunami.incois.gov.in/TEWS/",
      sampleQuery: "Show SSH evolution in the Bay of Bengal",
    },
    {
      id: "argo",
      title: "Argo Float Ocean Profiling",
      icon: Cpu,
      colorClass: "card-amber",
      desc: "Autonomous robotic profilers measuring temperature and salinity down to 2,000m depth across global ocean basins.",
      url: "https://incois.gov.in/argo",
      sampleQuery: "Show 3D temperature profile in Arabian Sea June 2025",
    },
    {
      id: "hwa",
      title: "High Wave & Swell Alerts",
      icon: Wind,
      colorClass: "card-cyan",
      desc: "Early warnings for coastal erosion, swell surges (Kallakkadal), and storm surges during monsoon and cyclonic events.",
      url: "https://incois.gov.in/site/services/hwa.jsp",
      sampleQuery: "What is coastal upwelling?",
    },
    {
      id: "samudra",
      title: "SAMUDRA Mobile Services",
      icon: Smartphone,
      colorClass: "card-indigo",
      desc: "Smart Access to Marine Users for ocean Data Resources and Advisories with GIS maps in multiple Indian regional languages.",
      url: "https://incois.gov.in/site/SAMUDRA/index.html",
      sampleQuery: "Show 3D temperature profile in Arabian Sea June 2025",
    },
  ];

  return (
    <section className="incois-services-section">
      <div className="services-section-header">
        <div>
          <span className="section-eyebrow">NATIONAL OCEANIC SERVICES</span>
          <h2 className="section-title">INCOIS Operational Portals & Core Services</h2>
        </div>
        <p className="section-subtitle">
          Explore operational marine advisories, numerical model products, and real-time observation networks.
        </p>
      </div>

      <div className="services-grid">
        {services.map((srv) => {
          const IconComp = srv.icon;
          return (
            <div key={srv.id} className={`service-card ${srv.colorClass}`}>
              <div className="card-top">
                <div className="service-icon-box">
                  <IconComp size={22} />
                </div>
                <a
                  href={srv.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="service-ext-link"
                  title="Open official portal"
                >
                  <ExternalLink size={14} />
                </a>
              </div>

              <h3 className="service-card-title">{srv.title}</h3>
              <p className="service-card-desc">{srv.desc}</p>

              <div className="service-card-footer">
                <button
                  type="button"
                  onClick={() => onSelectServiceQuery(srv.sampleQuery)}
                  className="quick-query-btn"
                >
                  <span>Query in GYANI</span>
                  <span className="arrow-sym">→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
