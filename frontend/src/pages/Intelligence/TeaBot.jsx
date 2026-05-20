import ChatInterface from "./ChatInterface";

const KNOWLEDGE = `
You are a helpful assistant for the Sri Lanka Tea Industry (TRI Guidelines). You answer questions based on the Tea Handbook and TRI (Tea Research Institute) recommendations.

IMPORTANT LANGUAGE RULE: The user interface language is set to "LANG_PLACEHOLDER". Always respond ONLY in LANG_FULL_PLACEHOLDER. Do not mix languages. Be concise, accurate, and practical.

KEY KNOWLEDGE:

BOTANY & VARIETIES:
- Camellia sinensis (var. assamica and var. sinensis).
- Popular Clones: TRI 2023, 2024, 2025 (High yield), TRI 3025, TRI 4006.
- High Grown (>1200m), Mid Grown (600-1200m), Low Grown (0-600m).

ENVIRONMENTAL REQUIREMENTS:
- Soil pH: 4.5 - 5.5 (Must be acidic).
- Rainfall: 2500mm - 5000mm annually.
- Temperature: 13°C - 30°C.

ESTABLISHMENT:
- Spacing: 4ft x 2ft or 4ft x 2.5ft.
- Planting Hole: 18"x18"x18" (45cm).
- Shade Trees: High shade (Albizia), Low shade (Gliricidia).

FERTILIZER:
- Young Tea: T65, T200, T750 mixtures.
- Mature Tea: V-mixture (Urea, Rock Phosphate, MOP).
- Dolomite: Used only if pH is below 4.5.

PLUCKING & HARVEST:
- Standard: "Two leaves and a bud".
- Plucking Round: 5-7 days (Low country peak), 10-14 days (Up country).
- Yield: 1500 - 3000 kg Made Tea per hectare.

DISEASES:
- Blister Blight (Exobasidium vexans): Treat with Copper Oxychloride or Hexaconazole.
- Poria Root Disease: Remove affected bushes and treat soil.
- Stem Canker: Manage through proper pruning and fungicide.

PESTS:
- Shot-hole Borer: Chemical control and biological management.
- Tea Tortrix: Use macrocentrus (biological control).
- Red Spider Mites: Sulphur or specialized miticides.

PROCESSING:
- Withering, Rolling, Fermentation (Oxidation), Firing (Drying), Grading.
- Grades: BOP, BOPF, OP, FBOP, Silver Tips (White Tea).
`;

const UI = {
  en: {
    title: "Tea Master AI",
    online: "Online",
    placeholder: "Ask about plucking, clones, diseases...",
    welcome: "Welcome! 🍃 I'm your Tea Master assistant. Ask me anything about tea cultivation, processing, or TRI recommendations!",
    error: "Error processing request.",
    langBadge: "සිංහල 🇱🇰",
    strip: "Responding in English",
    stripSwitch: "සිංහලට මාරු වන්න",
    suggestions: [
      "What are TRI 2023 clones?",
      "Ideal soil pH for tea?",
      "Treating Blister Blight?",
      "Two leaves and a bud rule?",
      "Tea grading process?",
    ],
  },
  si: {
    title: "තේ මාස්ටර්",
    online: "සක්රිය",
    placeholder: "නෙළීම, ක්ලෝන, රෝග ගැන අසන්න...",
    welcome: "ආයුබෝවන්! 🍃 මම ඔබේ තේ සහායකයාය. තේ වගාව, අස්වනු නෙළීම හෝ TRI උපදෙස් ගැන ඕනෑම දෙයක් අසන්න!",
    error: "දෝෂයක් සිදු විය.",
    langBadge: "English 🇬🇧",
    strip: "සිංහලෙන් පිළිතුරු දේ",
    stripSwitch: "Switch to English",
    suggestions: [
      "TRI 2023 ක්ලෝන යනු මොනවාද?",
      "තේ වලට සුදුසු පස කුමක්ද?",
      "බ්ලිස්ටර් බ්ලයිට් රෝගය?",
      "දලු නෙළීමේ නීතිය?",
      "තේ වර්ග කිරීමේ පියවර?",
    ],
  },
};

export default function TeaBot({ onBack }) {
  return (
    <ChatInterface 
      knowledge={KNOWLEDGE}
      ui={UI}
      botName="Tea Master"
      botAvatar="🍃"
      accentColor="#059669"
      onBack={onBack}
    />
  );
}
