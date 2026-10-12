import { useMemo, useState } from "react";
import InstitutionalHeader from "./components/Header/InstitutionalHeader";
import QueryWorkspace from "./components/Workspace/QueryWorkspace";
import VisualizationViewport from "./components/Viewport/VisualizationViewport";
import ScientificMetadataPanel from "./components/Metadata/ScientificMetadataPanel";
import { AlertCircle } from "lucide-react";

const API = "http://localhost:8000";

const languages = {
  en: { name: "English", native: "English" },
  te: { name: "Telugu", native: "తెలుగు" },
  hi: { name: "Hindi", native: "हिन्दी" },
  ta: { name: "Tamil", native: "தமிழ்" },
};

const copy = {
  en: {
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

  // Temporal animation state
  const [timeIndex, setTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const t = copy[language];
  const currentExamples = useMemo(() => examples[language], [language]);

  function changeLanguage(next) {
    setLanguage(next);
    setQuery(examples[next][0]);
    setResult(null);
    setError("");
  }

  async function handleGenerate(customQuery) {
    const q = customQuery !== undefined ? customQuery : query;
    if (!q.trim()) return;

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
      {/* Institutional MoES/INCOIS Header */}
      <InstitutionalHeader
        language={language}
        onLanguageChange={changeLanguage}
        languages={languages}
        copy={copy}
      />

      {/* Main Scientific Workspace Container */}
      <main className="gyani-main-container">
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
