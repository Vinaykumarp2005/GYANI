import { useMemo, useState } from "react";

const API = "http://localhost:8000";

const languages = {
  en: { name: "English", native: "English" },
  te: { name: "Telugu", native: "తెలుగు" },
  hi: { name: "Hindi", native: "हिन्दी" },
  ta: { name: "Tamil", native: "தமிழ்" }
};

const copy = {
  en: {
    eyebrow: "INCOIS / GYANI PROTOTYPE", title: "🌊 GYANI Scientific Visualizer",
    subtitle: "Turn ocean-science questions into maps, plots and animations.", badge: "AI + Scientific Visualization",
    language: "Language", question: "Your question", placeholder: "Ask an ocean-science question…",
    generate: "Generate Visualization", generating: "Generating…", try: "Try:", generated: "GENERATED RESULT",
    intent: "Detected intent", provenance: "Dataset / provenance",
    footer: "Prototype only · Demo dataset is synthetic · Replace with verified INCOIS data before scientific use.",
    error: "Generation failed", imageAlt: "Generated scientific visualization"
  },
  te: {
    eyebrow: "INCOIS / GYANI నమూనా", title: "🌊 GYANI శాస్త్రీయ విజువలైజర్",
    subtitle: "సముద్ర శాస్త్ర ప్రశ్నలను మ్యాప్‌లు, గ్రాఫ్‌లు మరియు యానిమేషన్‌లుగా మార్చండి.", badge: "AI + శాస్త్రీయ విజువలైజేషన్",
    language: "భాష", question: "మీ ప్రశ్న", placeholder: "సముద్ర శాస్త్రానికి సంబంధించిన ప్రశ్న అడగండి…",
    generate: "విజువలైజేషన్ రూపొందించండి", generating: "రూపొందిస్తోంది…", try: "ప్రయత్నించండి:", generated: "రూపొందించిన ఫలితం",
    intent: "గుర్తించిన ఉద్దేశ్యం", provenance: "డేటాసెట్ / మూల సమాచారం",
    footer: "ఇది నమూనా మాత్రమే · డెమో డేటాసెట్ కృత్రిమమైనది · శాస్త్రీయ వినియోగానికి ముందు ధృవీకరించిన INCOIS డేటాతో మార్చండి.",
    error: "విజువలైజేషన్ రూపొందించలేకపోయింది", imageAlt: "రూపొందించిన శాస్త్రీయ విజువలైజేషన్"
  },
  hi: {
    eyebrow: "INCOIS / GYANI प्रोटोटाइप", title: "🌊 GYANI वैज्ञानिक विज़ुअलाइज़र",
    subtitle: "समुद्र-विज्ञान के प्रश्नों को मानचित्र, ग्राफ़ और एनिमेशन में बदलें।", badge: "AI + वैज्ञानिक विज़ुअलाइज़ेशन",
    language: "भाषा", question: "आपका प्रश्न", placeholder: "समुद्र-विज्ञान से जुड़ा प्रश्न पूछें…",
    generate: "विज़ुअलाइज़ेशन बनाएँ", generating: "बनाया जा रहा है…", try: "आज़माएँ:", generated: "तैयार परिणाम",
    intent: "पहचाना गया उद्देश्य", provenance: "डेटासेट / स्रोत",
    footer: "केवल प्रोटोटाइप · डेमो डेटासेट कृत्रिम है · वैज्ञानिक उपयोग से पहले सत्यापित INCOIS डेटा से बदलें।",
    error: "विज़ुअलाइज़ेशन नहीं बन सका", imageAlt: "तैयार वैज्ञानिक विज़ुअलाइज़ेशन"
  },
  ta: {
    eyebrow: "INCOIS / GYANI முன்மாதிரி", title: "🌊 GYANI அறிவியல் காட்சிப்படுத்தி",
    subtitle: "கடலியல் கேள்விகளை வரைபடங்கள், வரைபடக் கோவைகள் மற்றும் அசைவூட்டங்களாக மாற்றுங்கள்.", badge: "AI + அறிவியல் காட்சிப்படுத்தல்",
    language: "மொழி", question: "உங்கள் கேள்வி", placeholder: "கடலியல் தொடர்பான கேள்வியைக் கேளுங்கள்…",
    generate: "காட்சிப்படுத்தலை உருவாக்கு", generating: "உருவாக்கப்படுகிறது…", try: "முயற்சிக்கவும்:", generated: "உருவாக்கப்பட்ட முடிவு",
    intent: "கண்டறியப்பட்ட நோக்கம்", provenance: "தரவுத்தொகுப்பு / மூலம்",
    footer: "முன்மாதிரி மட்டும் · டெமோ தரவுத்தொகுப்பு செயற்கையானது · அறிவியல் பயன்பாட்டிற்கு முன் சரிபார்க்கப்பட்ட INCOIS தரவால் மாற்றவும்.",
    error: "காட்சிப்படுத்தலை உருவாக்க முடியவில்லை", imageAlt: "உருவாக்கப்பட்ட அறிவியல் காட்சிப்படுத்தல்"
  }
};

const examples = {
  en: ["Show SST evolution in the Arabian Sea during June 2025", "Show SSH evolution in the Bay of Bengal", "How did temperature change with depth at 10 N 75 E during June 2025?", "Show the current pattern during June 2025", "What is coastal upwelling?"],
  te: ["జూన్ 2025లో అరేబియా సముద్రంలో SST మార్పును చూపించండి", "బంగాళాఖాతంలో SSH మార్పును చూపించండి", "జూన్ 2025లో 10 N 75 E వద్ద లోతుతో ఉష్ణోగ్రత ఎలా మారింది?", "జూన్ 2025లో సముద్ర ప్రవాహ నమూనాను చూపించండి", "తీర ప్రాంత అప్‌వెల్లింగ్ అంటే ఏమిటి?"],
  hi: ["जून 2025 में अरब सागर में SST का बदलाव दिखाएँ", "बंगाल की खाड़ी में SSH का बदलाव दिखाएँ", "जून 2025 में 10 N 75 E पर गहराई के साथ तापमान कैसे बदला?", "जून 2025 में समुद्री धारा का पैटर्न दिखाएँ", "तटीय अपवेलिंग क्या है?"],
  ta: ["ஜூன் 2025 இல் அரபிக்கடலில் SST மாற்றத்தைக் காட்டு", "வங்காள விரிகுடாவில் SSH மாற்றத்தைக் காட்டு", "ஜூன் 2025 இல் 10 N 75 E இடத்தில் ஆழத்துடன் வெப்பநிலை எவ்வாறு மாறியது?", "ஜூன் 2025 இல் கடல் நீரோட்ட வடிவத்தைக் காட்டு", "கடலோர மேலெழுச்சி என்றால் என்ன?"]
};

export default function App() {
  const [language, setLanguage] = useState("en");
  const [query, setQuery] = useState(examples.en[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const t = copy[language];
  const currentExamples = useMemo(() => examples[language], [language]);

  function changeLanguage(next) {
    setLanguage(next);
    setQuery(examples[next][0]);
    setResult(null);
    setError("");
  }

  async function generate() {
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch(`${API}/api/visualize`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, language })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || t.error);
      setResult(data);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  const media = result?.visualization;
  return (
    <div className="app" lang={language}>
      <header>
        <div><div className="eyebrow">{t.eyebrow}</div><h1>{t.title}</h1><p>{t.subtitle}</p></div>
        <div className="header-actions">
          <div className="language-control"><label htmlFor="language">🌐 {t.language}</label><select id="language" value={language} onChange={(e) => changeLanguage(e.target.value)}>{Object.entries(languages).map(([code, item]) => <option key={code} value={code}>{item.native}</option>)}</select></div>
          <div className="badge">{t.badge}</div>
        </div>
      </header>
      <main>
        <section className="card">
          <label htmlFor="query">{t.question}</label>
          <textarea id="query" value={query} placeholder={t.placeholder} onChange={(e) => setQuery(e.target.value)} rows={4} />
          <button onClick={generate} disabled={loading || !query.trim()}>{loading ? t.generating : t.generate}</button>
          <div className="examples"><span>{t.try}</span>{currentExamples.map((x) => <button className="chip" key={x} onClick={() => setQuery(x)}>{x}</button>)}</div>
        </section>
        {error && <section className="error">{error}</section>}
        {result && <section className="result">
          <div className="card">
            <div className="result-head"><div><div className="eyebrow">{t.generated}</div><h2>{result.intent.visualization}</h2></div><span className="type">{result.category}</span></div>
            {media.media_type === "video/mp4" ? <video controls autoPlay loop src={`${API}${media.url}`} className="visual" /> : <img src={`${API}${media.url}`} className="visual" alt={t.imageAlt} />}
            <p className="explanation">{result.explanation}</p>
          </div>
          <div className="grid"><div className="card"><h3>{t.intent}</h3><pre>{JSON.stringify(result.intent, null, 2)}</pre></div><div className="card"><h3>{t.provenance}</h3><pre>{JSON.stringify(result.metadata, null, 2)}</pre></div></div>
        </section>}
      </main>
      <footer>{t.footer}</footer>
    </div>
  );
}
