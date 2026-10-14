import { useMemo, useState, useRef, useEffect } from "react";
import InstitutionalHeader from "./components/Header/InstitutionalHeader";
import INCOISNavRibbon from "./components/Header/INCOISNavRibbon";
import AdvisoryTicker from "./components/Common/AdvisoryTicker";
import OceanGlobe3D from "./components/ThreeD/OceanGlobe3D";
import ArgoFloat3D from "./components/ThreeD/ArgoFloat3D";
import INCOISServiceCards from "./components/Home/INCOISServiceCards";
import QueryWorkspace from "./components/Workspace/QueryWorkspace";
import VisualizationViewport from "./components/Viewport/VisualizationViewport";
import ScientificMetadataPanel from "./components/Metadata/ScientificMetadataPanel";
import QueryHistoryDrawer from "./components/History/QueryHistoryDrawer";
import { AlertCircle, Box, Compass, Sparkles, ChevronRight, Waves, Layers } from "lucide-react";

const API = "http://localhost:8000";

const languages = {
  en: { name: "English", native: "English" },
  te: { name: "Telugu", native: "తెలుగు" },
  hi: { name: "Hindi", native: "हिन्दी" },
  ta: { name: "Tamil", native: "தமிழ்" },
};

const copy = {
  en: {
    heroTitle: "Intelligent Ocean-Science Visualization",
    heroSubtitle: "Ask natural-language questions across the Indian Ocean realm. Explore interactive 3D underwater temperature depth profiles, temporal animations, and numerical model datasets.",
    exploreBtn: "Explore 3D Depth Layers",
    instrumentBtn: "View 3D Argo Profiler",
    question: "Ocean-Science Query",
    placeholder: "Ask an oceanographic question, request a 2D/3D visualization, or generate an illustration...",
    generate: "Submit Query",
    generating: "Analyzing with Gemini...",
    try: "Try asking:",
    generated: "GENERATED RESULT",
    intent: "Detected Intent",
    provenance: "Dataset & Provenance",
    footer: "Prototype developed for INCOIS ocean-science inquiry. Powered by Google Gemini AI & INCOIS Numerical NetCDF Engine.",
    error: "Generation failed",
    imageAlt: "Generated scientific visualization",
  },
  te: {
    heroTitle: "సముద్ర శాస్త్ర విజువలైజేషన్ వేదిక",
    heroSubtitle: "హిందూ మహాసముద్ర పరిధిలో సహజ భాషా ప్రశ్నలను అడగండి. పరస్పర ప్రతిస్పందించే 3D లోతు ఉష్ణోగ్రత నమూనాలు, కాలిక యానిమేషన్లను అన్వేషించండి.",
    exploreBtn: "3D లోతు పొరలను చూడండి",
    instrumentBtn: "3D ఆర్గో ప్రొఫైలర్ నమూనా",
    question: "సముద్ర శాస్త్ర ప్రశ్న",
    placeholder: "సముద్ర శాస్త్ర ప్రశ్నించండి లేదా 3D లోతు పొరలను అన్వేషించండి...",
    generate: "ప్రశ్న సమర్పించండి",
    generating: "విశ్లేషిస్తోంది...",
    try: "ప్రయత్నించండి:",
    generated: "రూపొందించిన ఫలితం",
    intent: "గుర్తించిన ఉద్దేశ్యం",
    provenance: "డేటాసెట్ / మూల సమాచారం",
    footer: "ఇది INCOIS సముద్ర పరిశోధన నమూనా మాత్రమే. జెమిని AI ఆధారిత విశ్లేషణ.",
    error: "విజువలైజేషన్ రూపొందించలేకపోయింది",
    imageAlt: "రూపొందించిన శాస్త్రీయ విజువలైజేషన్",
  },
  hi: {
    heroTitle: "बुद्धिमान समुद्र-विज्ञान विज़ुअलाइज़ेशन",
    heroSubtitle: "हिंद महासागर क्षेत्र से जुड़े प्रश्न पूछें। इंटरएक्टिव 3D पानी के नीचे तापमान और गहराई प्रोफाइल, समय-आधारित एनिमेशन देखें।",
    exploreBtn: "3D गहराई की परतें देखें",
    instrumentBtn: "3D आर्गो फ्लोट मॉडल",
    question: "समुद्र-विज्ञान प्रश्न",
    placeholder: "समुद्र-विज्ञान का प्रश्न पूछें या 3D गहराई की परतें देखें...",
    generate: "प्रश्न सबमिट करें",
    generating: "जेमिनी से विश्लेषण जारी है...",
    try: "आज़माएँ:",
    generated: "तैयार परिणाम",
    intent: "पहचाना गया उद्देश्य",
    provenance: "डेटासेट / स्रोत",
    footer: "INCOIS समुद्र-विज्ञान अनुसंधान के लिए विकसित प्रोटोटाइप। गूगल जेमिनी एआई द्वारा संचालित।",
    error: "विज़ुअलाइज़ेशन नहीं बन सका",
    imageAlt: "तैयार वैज्ञानिक विज़ुअलाइज़ेशन",
  },
  ta: {
    heroTitle: "அறிவியல் கடலியல் காட்சிப்படுத்தல் தளம்",
    heroSubtitle: "இந்தியப் பெருங்கடல் தொடர்பான கேள்விகளைக் கேளுங்கள். ஊடாடும் 3D நீருக்கடியில் வெப்பநிலை மற்றும் ஆழப் படங்கள், அசைவூட்டங்களை ஆராயுங்கள்.",
    exploreBtn: "3D ஆழ அடுக்குகளைக் காட்டு",
    instrumentBtn: "3D ஆர்கோ மிதவை மாதிரி",
    question: "கடலியல் கேள்வி",
    placeholder: "கடலியல் கேள்வியைக் கேளுங்கள் அல்லது 3D ஆழ அடுக்குகளை ஆராயுங்கள்...",
    generate: "கேள்வி சமர்ப்பிக்கவும்",
    generating: "ஆராய்கிறது...",
    try: "முயற்சிக்கவும்:",
    generated: "உருவாக்கப்பட்ட முடிவு",
    intent: "கண்டறியப்பட்ட நோக்கம்",
    provenance: "தரவுத்தொகுப்பு / மூலம்",
    footer: "INCOIS கடலியல் பயன்பாட்டுக்கான முன்மாதிரி. கூகிள் ஜெமினி ஏஐ மூலம் இயக்கப்படுகிறது.",
    error: "காட்சிப்படுத்தலை உருவாக்க முடியவில்லை",
    imageAlt: "உருவாக்கப்பட்ட அறிவியல் காட்சிப்படுத்தல்",
  },
};

const examples = {
  en: [
    "What is ocean forecast.",
    "Explain the importance of ocean salinity.",
    "Show 3D temperature profile in Arabian Sea June 2025",
    "Show SST evolution in the Arabian Sea during June 2025",
    "Visualize ocean temperature at different depths.",
    "Generate an illustration of underwater ecosystems.",
  ],
  te: [
    "సముద్ర సూచన అంటే ఏమిటి?",
    "సముద్రపు లవణీయత ప్రాముఖ్యతను వివరించండి.",
    "అరేబియా సముద్రంలో ఉష్ణోగ్రత 3D దృశ్యం చూపించండి",
    "జూన్ 2025లో అరేబియా సముద్రంలో SST మార్పును చూపించండి",
    "వివిధ లోతుల్లో సముద్ర ఉష్ణోగ్రతను దృశ్యమానం చేయండి",
    "నీటి అడుగున పర్యావరణ వ్యవస్థ చిత్రాన్ని రూపొందించండి",
  ],
  hi: [
    "समुद्री पूर्वानुमान क्या है?",
    "समुद्र की लवणता का महत्व समझाइए।",
    "अरब सागर में तापमान का 3D दृश्य दिखाएँ",
    "जून 2025 में अरब सागर में SST का बदलाव दिखाएँ",
    "विभिन्न गहराइयों पर समुद्री तापमान की कल्पना करें",
    "पानी के नीचे के पारिस्थितिकी तंत्र का चित्र बनाएं",
  ],
  ta: [
    "கடல் முன்னறிவிப்பு என்றால் என்ன?",
    "கடல் உவர்ப்பியலின் முக்கியத்துவத்தை விளக்குங்கள்.",
    "அரபிக்கடலில் வெப்பநிலை 3D காட்சி காட்டு",
    "ஜூன் 2025 இல் அரபிக்கடலில் SST மாற்றத்தைக் காட்டு",
    "பல்வேறு ஆழங்களில் கடல் வெப்பநிலையைக் காட்சிப்படுத்துங்கள்",
    "நீருக்கடியில் உள்ள சுற்றுச்சூழல் அமைப்பின் விளக்கப்படத்தை உருவாக்கவும்",
  ],
};

export default function App() {
  const [language, setLanguage] = useState("en");
  const [query, setQuery] = useState(examples.en[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showInstrumentModel, setShowInstrumentModel] = useState(false);

  // History State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);

  // Temporal animation state
  const [timeIndex, setTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const workspaceRef = useRef(null);

  const t = copy[language];
  const currentExamples = useMemo(() => examples[language], [language]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setHistoryItems(data.history || []);
      }
    } catch (e) {
      console.warn("[GYANI] History fetch failed", e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  function changeLanguage(next) {
    setLanguage(next);
    setQuery(examples[next][0]);
    setResult(null);
    setError("");
  }

  const scrollToWorkspace = () => {
    if (workspaceRef.current) {
      workspaceRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  async function handleGenerate(customQuery) {
    const q = customQuery !== undefined ? customQuery : query;
    if (!q.trim()) return;

    if (customQuery) {
      setQuery(customQuery);
    }

    setLoading(true);
    setError("");
    setIsPlaying(false);
    setTimeIndex(0);

    try {
      const response = await fetch(`${API}/api/visualize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, language }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || t.error);
      setResult(data);
      scrollToWorkspace();
      fetchHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectExample = (ex) => {
    setQuery(ex);
    handleGenerate(ex);
  };

  const handleSelectHistoryItem = (item) => {
    setQuery(item.query);
    if (item.result && item.result.success) {
      setResult(item.result);
      scrollToWorkspace();
    } else {
      handleGenerate(item.query);
    }
  };

  const handleClearHistory = async () => {
    try {
      await fetch(`${API}/api/history`, { method: "DELETE" });
      setHistoryItems([]);
    } catch (e) {
      console.error("[GYANI] Failed to clear history", e);
    }
  };

  return (
    <div className="gyani-institutional-app" lang={language}>
      {/* 1. Institutional MoES / INCOIS Header */}
      <InstitutionalHeader
        language={language}
        onLanguageChange={changeLanguage}
        languages={languages}
        copy={copy}
      />

      {/* 2. Primary Navigation Ribbon (INCOIS Style) */}
      <INCOISNavRibbon onSelectSection={scrollToWorkspace} />

      {/* 3. Live Ocean Advisory & Alert Ticker */}
      <AdvisoryTicker />

      {/* 4. Hero Section with Revolving 3D Ocean Globe */}
      <section className="incois-hero-showcase">
        <div className="hero-inner-container">
          <div className="hero-text-block">
            <div className="hero-badge-tag">
              <Sparkles size={13} className="hero-badge-icon" />
              <span>INCOIS OCEAN KNOWLEDGE ENTERPRISE</span>
            </div>
            <h1 className="hero-main-heading">{t.heroTitle}</h1>
            <p className="hero-description">{t.heroSubtitle}</p>

            <div className="hero-cta-group">
              <button
                type="button"
                onClick={() => {
                  setQuery("Show 3D temperature profile in Arabian Sea June 2025");
                  handleGenerate("Show 3D temperature profile in Arabian Sea June 2025");
                }}
                className="hero-primary-btn"
              >
                <Box size={16} />
                <span>{t.exploreBtn}</span>
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setShowInstrumentModel(true)}
                className="hero-secondary-btn"
              >
                <Layers size={16} />
                <span>{t.instrumentBtn}</span>
              </button>
            </div>
          </div>

          <div className="hero-3d-stage">
            <OceanGlobe3D onSelectStationQuery={(q) => handleGenerate(q)} />
          </div>
        </div>
      </section>

      {/* 5. INCOIS Operational Core Service Tiles */}
      <INCOISServiceCards />

      {/* 6. Main Scientific Workspace Container */}
      <main ref={workspaceRef} className="gyani-main-container">
        <div className="workspace-section-banner">
          <Waves size={20} className="banner-icon" />
          <div>
            <h2 className="banner-title">GYANI Scientific Inquiry Workspace</h2>
            <p className="banner-subtitle">
              Intelligent query routing across Explanatory Text, 2D Maps, 3D Depth Layers, and AI Illustrations.
            </p>
          </div>
        </div>

        <QueryWorkspace
          query={query}
          onQueryChange={setQuery}
          onSubmit={() => handleGenerate()}
          loading={loading}
          examples={currentExamples}
          t={t}
          onSelectExample={handleSelectExample}
          onOpenHistory={() => setHistoryOpen(true)}
          historyCount={historyItems.length}
        />

        {error && (
          <div className="system-error-banner" role="alert">
            <AlertCircle size={18} className="error-icon" />
            <div className="error-content">
              <strong>{t.error}:</strong> {error}
            </div>
          </div>
        )}

        {result && (
          <div className="results-layout-flow">
            <VisualizationViewport
              result={result}
              apiBase={API}
              timeIndex={timeIndex}
              onTimeChange={setTimeIndex}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={setPlaybackSpeed}
              t={t}
            />

            <ScientificMetadataPanel result={result} />
          </div>
        )}
      </main>

      {/* Query History Drawer */}
      <QueryHistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={historyItems}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />

      {/* 3D Argo Profiler Interactive Modal */}
      {showInstrumentModel && (
        <ArgoFloat3D onClose={() => setShowInstrumentModel(false)} />
      )}

      {/* 7. Institutional Footer */}
      <footer className="institutional-footer">
        <div className="footer-inner">
          <div className="footer-left-block">
            <p className="footer-org">
              भारतीय राष्ट्रीय महासागर सूचना सेवा केंद्र (इन्कोइस) · Indian National Centre for Ocean Information Services
            </p>
            <p className="footer-text">{t.footer}</p>
          </div>
          <div className="footer-links">
            <a href="https://incois.gov.in/site/disclaimer.jsp" target="_blank" rel="noreferrer">
              Disclaimer
            </a>
            <span className="dot">·</span>
            <a href="https://incois.gov.in/site/rti.jsp" target="_blank" rel="noreferrer">
              RTI
            </a>
            <span className="dot">·</span>
            <a href="https://incois.gov.in/site/contactus.jsp" target="_blank" rel="noreferrer">
              Contact INCOIS
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
