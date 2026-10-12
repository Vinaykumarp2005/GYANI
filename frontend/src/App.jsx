import { useMemo, useState, useRef } from "react";
import InstitutionalHeader from "./components/Header/InstitutionalHeader";
import INCOISNavRibbon from "./components/Header/INCOISNavRibbon";
import AdvisoryTicker from "./components/Common/AdvisoryTicker";
import OceanGlobe3D from "./components/ThreeD/OceanGlobe3D";
import ArgoFloat3D from "./components/ThreeD/ArgoFloat3D";
import INCOISServiceCards from "./components/Home/INCOISServiceCards";
import QueryWorkspace from "./components/Workspace/QueryWorkspace";
import VisualizationViewport from "./components/Viewport/VisualizationViewport";
import ScientificMetadataPanel from "./components/Metadata/ScientificMetadataPanel";
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
    placeholder: "Ask an oceanographic question or query 3D depth layers (e.g. 'Show 3D temperature profile in Arabian Sea')...",
    generate: "Generate Visualization",
    generating: "Generating...",
    try: "Try asking:",
    generated: "GENERATED RESULT",
    intent: "Detected Intent",
    provenance: "Dataset & Provenance",
    footer: "Prototype developed for INCOIS ocean-science inquiry. Synthetic demo dataset is utilized for testing — replace with verified INCOIS operational NetCDF/Zarr data before scientific use.",
    error: "Generation failed",
    imageAlt: "Generated scientific visualization",
  },
  te: {
    heroTitle: "సముద్ర శాస్త్ర విజువలైజేషన్ వేదిక",
    heroSubtitle: "హిందూ మహాసముద్ర పరిధిలో సహజ భాషా ప్రశ్నలను అడగండి. పరస్పర ప్రతిస్పందించే 3D లోతు ఉష్ణోగ్రత నమూనాలు, కాలిక యానిమేషన్లను అన్వేషించండి.",
    exploreBtn: "3D లోతు పొరలను చూడండి",
    instrumentBtn: "3D ఆర్గో ప్రొఫైలర్ నమూనా",
    question: "సముద్ర శాస్త్ర ప్రశ్న",
    placeholder: "సముద్ర శాస్త్ర ప్రశ్నించండి లేదా 3D లోతు పొరలను అన్వేషించండి (ఉదా. 'అరేబియా సముద్రంలో ఉష్ణోగ్రత 3D దృశ్యం')...",
    generate: "విజువలైజేషన్ రూపొందించండి",
    generating: "రూపొందిస్తోంది...",
    try: "ప్రయత్నించండి:",
    generated: "రూపొందించిన ఫలితం",
    intent: "గుర్తించిన ఉద్దేశ్యం",
    provenance: "డేటాసెట్ / మూల సమాచారం",
    footer: "ఇది INCOIS సముద్ర పరిశోధన నమూనా మాత్రమే. డెమో డేటాసెట్ కృత్రిమమైనది. అధికారిక వినియోగానికి ముందు ధృవీకరించిన INCOIS డేటాతో భర్తీ చేయండి.",
    error: "విజువలైజేషన్ రూపొందించలేకపోయింది",
    imageAlt: "రూపొందించిన శాస్త్రీయ విజువలైజేషన్",
  },
  hi: {
    heroTitle: "बुद्धिमान समुद्र-विज्ञान विज़ुअलाइज़ेशन",
    heroSubtitle: "हिंद महासागर क्षेत्र से जुड़े प्रश्न पूछें। इंटरएक्टिव 3D पानी के नीचे तापमान और गहराई प्रोफाइल, समय-आधारित एनिमेशन देखें।",
    exploreBtn: "3D गहराई की परतें देखें",
    instrumentBtn: "3D आर्गो फ्लोट मॉडल",
    question: "समुद्र-विज्ञान प्रश्न",
    placeholder: "समुद्र-विज्ञान का प्रश्न पूछें या 3D गहराई की परतें देखें (उदा. 'अरब सागर में तापमान का 3D दृश्य')...",
    generate: "विज़ुअलाइज़ेशन बनाएँ",
    generating: "बनाया जा रहा है...",
    try: "आज़माएँ:",
    generated: "तैयार परिणाम",
    intent: "पहचाना गया उद्देश्य",
    provenance: "डेटासेट / स्रोत",
    footer: "INCOIS समुद्र-विज्ञान अनुसंधान के लिए विकसित प्रोटोटाइप। डेमो डेटासेट कृत्रिम है - वैज्ञानिक उपयोग से पहले सत्यापित INCOIS डेटा से बदलें।",
    error: "विज़ुअलाइज़ेशन नहीं बन सका",
    imageAlt: "तैयार वैज्ञानिक विज़ुअलाइज़ेशन",
  },
  ta: {
    heroTitle: "அறிவியல் கடலியல் காட்சிப்படுத்தல் தளம்",
    heroSubtitle: "இந்தியப் பெருங்கடல் தொடர்பான கேள்விகளைக் கேளுங்கள். ஊடாடும் 3D நீருக்கடியில் வெப்பநிலை மற்றும் ஆழப் படங்கள், அசைவூட்டங்களை ஆராயுங்கள்.",
    exploreBtn: "3D ஆழ அடுக்குகளைக் காட்டு",
    instrumentBtn: "3D ஆர்கோ மிதவை மாதிரி",
    question: "கடலியல் கேள்வி",
    placeholder: "கடலியல் கேள்வியைக் கேளுங்கள் அல்லது 3D ஆழ அடுக்குகளை ஆராயுங்கள் (எ.கா. 'அரபிக்கடலில் வெப்பநிலை 3D காட்சி')...",
    generate: "காட்சிப்படுத்தலை உருவாக்கு",
    generating: "உருவாக்கப்படுகிறது...",
    try: "முயற்சிக்கவும்:",
    generated: "உருவாக்கப்பட்ட முடிவு",
    intent: "கண்டறியப்பட்ட நோக்கம்",
    provenance: "தரவுத்தொகுப்பு / மூலம்",
    footer: "INCOIS கடலியல் பயன்பாட்டுக்கான முன்மாதிரி. மாதிரி தரவுத்தொகுப்பு செயற்கையானது - அறிவியல் பயன்பாட்டிற்கு முன் சரிபார்க்கப்பட்ட INCOIS தரவால் மாற்றவும்.",
    error: "காட்சிப்படுத்தலை உருவாக்க முடியவில்லை",
    imageAlt: "உருவாக்கப்பட்ட அறிவியல் காட்சிப்படுத்தல்",
  },
};

const examples = {
  en: [
    "Show 3D temperature profile in Arabian Sea June 2025",
    "Show SST evolution in the Arabian Sea during June 2025",
    "Show SSH evolution in the Bay of Bengal",
    "How did temperature change with depth at 10 N 75 E during June 2025?",
    "Show the current pattern during June 2025",
    "What is coastal upwelling?",
  ],
  te: [
    "అరేబియా సముద్రంలో ఉష్ణోగ్రత 3D దృశ్యం చూపించండి",
    "జూన్ 2025లో అరేబియా సముద్రంలో SST మార్పును చూపించండి",
    "బంగాళాఖాతంలో SSH మార్పును చూపించండి",
    "జూన్ 2025లో 10 N 75 E వద్ద లోతుతో ఉష్ణోగ్రత ఎలా మారింది?",
    "జూన్ 2025లో సముద్ర ప్రవాహ నమూనాను చూపించండి",
    "తీర ప్రాంత అప్‌వెల్లింగ్ అంటే ఏమిటి?",
  ],
  hi: [
    "अरब सागर में तापमान का 3D दृश्य दिखाएँ",
    "जून 2025 में अरब सागर में SST का बदलाव दिखाएँ",
    "बंगाल की खाड़ी में SSH का बदलाव दिखाएँ",
    "जून 2025 में 10 N 75 E पर गहराई के साथ तापमान कैसे बदला?",
    "जून 2025 में समुद्री धारा का पैटर्न दिखाएँ",
    "तटीय अपवेलिंग क्या है?",
  ],
  ta: [
    "அரபிக்கடலில் வெப்பநிலை 3D காட்சி காட்டு",
    "ஜூன் 2025 இல் அரபிக்கடலில் SST மாற்றத்தைக் காட்டு",
    "வங்காள விரிகுடாவில் SSH மாற்றத்தைக் காட்டு",
    "ஜூன் 2025 இல் 10 N 75 E இடத்தில் ஆழத்துடன் வெப்பநிலை எவ்வாறு மாறியது?",
    "ஜூன் 2025 இல் கடல் நீரோட்ட வடிவத்தைக் காட்டு",
    "கடலோர மேலெழுச்சி என்றால் என்ன?",
  ],
};

export default function App() {
  const [language, setLanguage] = useState("en");
  const [query, setQuery] = useState(examples.en[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showInstrumentModel, setShowInstrumentModel] = useState(false);

  // Temporal animation state
  const [timeIndex, setTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const workspaceRef = useRef(null);

  const t = copy[language];
  const currentExamples = useMemo(() => examples[language], [language]);

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

            <div className="hero-actions-row">
              <button
                type="button"
                onClick={() => handleGenerate(currentExamples[0])}
                className="hero-primary-btn"
              >
                <Layers size={17} />
                <span>{t.exploreBtn}</span>
                <ChevronRight size={15} />
              </button>

              <button
                type="button"
                onClick={() => setShowInstrumentModel(!showInstrumentModel)}
                className={`hero-secondary-btn ${showInstrumentModel ? "active" : ""}`}
              >
                <Box size={16} />
                <span>{showInstrumentModel ? "Hide 3D Profiler" : t.instrumentBtn}</span>
              </button>
            </div>

            {/* Modal Drawer for 3D Argo Profiler */}
            {showInstrumentModel && (
              <ArgoFloat3D onClose={() => setShowInstrumentModel(false)} />
            )}
          </div>

          <div className="hero-globe-block">
            {/* Interactive Revolving 3D Ocean Globe */}
            <OceanGlobe3D onSelectStationQuery={(q) => handleGenerate(q)} />
          </div>
        </div>
      </section>

      {/* 5. INCOIS Operational Core Service Tiles */}
      <INCOISServiceCards onSelectServiceQuery={(q) => handleGenerate(q)} />

      {/* 6. Main Scientific Workspace Container */}
      <main ref={workspaceRef} className="gyani-main-container">
        <div className="workspace-section-banner">
          <Waves size={20} className="banner-icon" />
          <div>
            <h2 className="banner-title">GYANI Scientific Inquiry Workspace</h2>
            <p className="banner-subtitle">
              Submit your natural-language questions or inspect 3D temperature depth slices.
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

      {/* 7. Institutional Footer */}
      <footer className="institutional-footer">
        <div className="footer-inner">
          <p className="footer-text">{t.footer}</p>
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
