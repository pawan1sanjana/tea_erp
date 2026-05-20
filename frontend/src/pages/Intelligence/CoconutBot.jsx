import ChatInterface from "./ChatInterface";

const KNOWLEDGE = `
You are a helpful assistant for the Sri Lanka Coconut Industry (CRI Guidelines). You answer questions based on the Coconut Research Institute (CRI) recommendations.

IMPORTANT LANGUAGE RULE: The user interface language is set to "LANG_PLACEHOLDER". Always respond ONLY in LANG_FULL_PLACEHOLDER. Do not mix languages. Be concise, accurate, and practical.

KEY KNOWLEDGE:

VARIETIES:
- Tall (Sri Lanka Tall - TxT): Long life, stable yield.
- Dwarf (Green/Yellow/Red - DxD): Early flowering, shorter height.
- Hybrids: CRIC60 (Tall x Dwarf), CRIC65 (Dwarf x Tall). Improved yield and resistance.

ENVIRONMENTAL REQUIREMENTS:
- Soil: Well-drained sandy loam is best.
- Rainfall: 1250mm - 2500mm annually.
- Sunlight: High requirement (>2000 hours/year).

ESTABLISHMENT:
- Spacing: 26ft x 26ft (Triangle or Square system) - 160-175 palms/ha.
- Seedling selection: 9-12 month old seedlings with good girth and vigorous growth.

FERTILIZER:
- APU (Adult Palm Urea) mixture: 3kg per palm per year (split into 2 doses).
- Organic: Use cow dung, poultry manure, or compost in the manure circle.

HARVESTING:
- Harvest interval: 45 - 60 days (every 2 months).
- Maturity: 11-12 months for copra; younger for drinking water (Kurumba).

DISEASES:
- Bud Rot (Phytophthora palmivora): Treat with Copper fungicides.
- Leaf Wilt: Manage nutrition and irrigation.
- Stem Bleeding: Clean the area and apply coal tar or fungicide.

PESTS:
- Red Palm Weevil: Most dangerous. Use pheromone traps and chemical injection if needed.
- Black Beetle: Use pheromone traps and maintain sanitation.
- Coconut Mite (Aceria guerreronis): Neem oil based sprays.

PROCESSING:
- Copra, Coconut Oil, Desiccated Coconut (DC), Coconut Milk, Coir, Shell Charcoal.
`;

const UI = {
  en: {
    title: "Coconut Expert AI",
    online: "Online",
    placeholder: "Ask about hybrids, pests, harvesting...",
    welcome: "Welcome! 🥥 I'm your Coconut Expert assistant. Ask me anything about coconut cultivation, pest control, or CRI recommendations!",
    error: "Error processing request.",
    langBadge: "සිංහල 🇱🇰",
    strip: "Responding in English",
    stripSwitch: "සිංහලට මාරු වන්න",
    suggestions: [
      "CRIC60 vs CRIC65 hybrids?",
      "Treating Red Palm Weevil?",
      "How many palms per hectare?",
      "Best fertilizer for adult palms?",
      "Mite control methods?",
    ],
  },
  si: {
    title: "පොල් විශේෂඥයා",
    online: "සක්රිය",
    placeholder: "දෙමුහුන්, පළිබෝධකයන් ගැන අසන්න...",
    welcome: "ආයුබෝවන්! 🥥 මම ඔබේ පොල් වගා සහායකයාය. පොල් වගාව, පළිබෝධ පාලනය හෝ CRI උපදෙස් ගැන ඕනෑම දෙයක් අසන්න!",
    error: "දෝෂයක් සිදු විය.",
    langBadge: "English 🇬🇧",
    strip: "සිංහලෙන් පිළිතුරු දේ",
    stripSwitch: "Switch to English",
    suggestions: [
      "CRIC60 සහ CRIC65 වෙනස?",
      "රතු කුරුමිණියා මර්දනය?",
      "හෙක්ටයාරයකට පැළ කීයද?",
      "වැඩිහිටි ගස්වලට දිය යුතු පොහොර?",
      "පොල් මැක්කා මර්දනය?",
    ],
  },
};

export default function CoconutBot({ onBack }) {
  return (
    <ChatInterface 
      knowledge={KNOWLEDGE}
      ui={UI}
      botName="Coconut Expert"
      botAvatar="🥥"
      accentColor="#0891B2"
      onBack={onBack}
    />
  );
}
