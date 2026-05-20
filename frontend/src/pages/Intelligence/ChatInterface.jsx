import { useState, useRef, useEffect } from "react";
import { Send, Languages as LanguagesIcon, ChevronLeft, RotateCcw, AlertCircle, Sparkles } from "lucide-react";
import { apiClient } from "../../api/client";

// Lightweight text formatter: **bold**, newlines, bullet lists
function FormattedText({ text }) {
  const lines = text.split("\n");
  return (
    <span>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const formatted = parts.map((part, pi) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pi}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        const isBullet = line.trimStart().startsWith("- ") || line.trimStart().startsWith("• ");
        return (
          <span key={li}>
            {li > 0 && "\n"}
            {isBullet ? (
              <span style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 3 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "currentColor", opacity: 0.45,
                  flexShrink: 0, marginTop: 7, display: "inline-block"
                }} />
                {formatted.map((f, i) =>
                  typeof f === "string" ? f.replace(/^[\s\-•]+/, "") : f
                )}
              </span>
            ) : (
              formatted
            )}
          </span>
        );
      })}
    </span>
  );
}

export default function ChatInterface({
  knowledge,
  ui,
  botName,
  botAvatar = "🌿",
  accentColor = "#059669",
  onBack,
}) {
  const [lang, setLang] = useState("en");
  const t = ui[lang];

  const [messages, setMessages] = useState({
    en: [{ role: "assistant", content: ui.en.welcome }],
    si: [{ role: "assistant", content: ui.si.welcome }],
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentMessages = messages[lang];
  const showSuggestions = currentMessages.length <= 1 && !loading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lang]);

  useEffect(() => {
    setError(null);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [lang]);

  const switchLang = () => setLang((l) => (l === "en" ? "si" : "en"));
  const clearChat = () => {
    setMessages((prev) => ({
      ...prev,
      [lang]: [{ role: "assistant", content: ui[lang].welcome }],
    }));
    setError(null);
  };

  const buildSystem = () => {
    const langName = lang === "en" ? "English" : "Sinhala";
    const langFull = lang === "en" ? "English" : "Sinhala (සිංහල)";
    return knowledge
      .replace("LANG_PLACEHOLDER", langName)
      .replace("LANG_FULL_PLACEHOLDER", langFull);
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    setError(null);

    const newMsgs = [...currentMessages, { role: "user", content: userText }];
    setMessages((prev) => ({ ...prev, [lang]: newMsgs }));
    setLoading(true);

    try {
      const apiMessages = newMsgs
        .slice(1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await apiClient.post("/ai/chat", {
        messages: apiMessages,
        system: buildSystem(),
      });

      if (!res.success) throw new Error(res.error || "AI Service Error");

      const reply =
        res.data?.content?.find((b) => b.type === "text")?.text ||
        "No response.";

      setMessages((prev) => ({
        ...prev,
        [lang]: [...newMsgs, { role: "assistant", content: reply }],
      }));
    } catch (err) {
      console.error("API error:", err);
      setError(err.message);
      setMessages((prev) => ({ ...prev, [lang]: currentMessages }));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-0 animate-in fade-in duration-700 pb-4">
      {/* ── System-standard page header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic leading-tight">
              {t.title}
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1.5">
              {lang === "en" ? "AI AGRONOMIC INTELLIGENCE SERVICE" : "කෘෂිකාර්මික බුද්ධි සේවාව"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t.online}
            </span>
          </div>

          <button
            onClick={switchLang}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
          >
            <LanguagesIcon size={15} />
            {lang === "en" ? "සිංහල" : "English"}
          </button>

          {currentMessages.length > 1 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
            >
              <RotateCcw size={15} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className="premium-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden"
        style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 14rem)", minHeight: 480 }}>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "20px 20px 12px",
          display: "flex", flexDirection: "column", gap: 14,
          scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent"
        }}>
          {currentMessages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                gap: 8,
                animation: "ci-fadein 0.22s ease"
              }}
            >
              {/* Bot avatar */}
              {msg.role === "assistant" && (
                <div style={{
                  width: 30, height: 30, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, flexShrink: 0, marginBottom: 2,
                  background: `${accentColor}15`, color: accentColor
                }}>
                  {botAvatar}
                </div>
              )}

              {/* Bubble */}
              <div style={{
                maxWidth: "78%",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                fontSize: 14, lineHeight: 1.6, wordBreak: "break-word",
                ...(msg.role === "user"
                  ? { background: accentColor, color: "#fff", fontWeight: 500 }
                  : {
                    background: "var(--ci-bot-bg, #f8fafc)",
                    color: "var(--ci-bot-text, #1e293b)",
                    border: "1px solid var(--ci-bot-border, #e2e8f0)"
                  })
              }}>
                <FormattedText text={msg.content} />
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, flexShrink: 0,
                background: `${accentColor}15`, color: accentColor
              }}>
                {botAvatar}
              </div>
              <div style={{
                padding: "12px 16px",
                borderRadius: "18px 18px 18px 4px",
                background: "var(--ci-bot-bg, #f8fafc)",
                border: "1px solid var(--ci-bot-border, #e2e8f0)",
                display: "flex", alignItems: "center", gap: 5
              }}>
                {[0, 150, 300].map((delay, i) => (
                  <span key={i} style={{
                    display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                    background: "#94a3b8",
                    animation: `ci-bounce 1.1s ${delay}ms infinite ease-in-out`
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold">
              <AlertCircle size={13} className="flex-shrink-0" />
              <span className="flex-1">{t.error} — {error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-black leading-none ml-1">✕</button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="px-5 pb-3 flex flex-wrap gap-2 border-t border-slate-50 dark:border-slate-800 pt-3">
            <p className="w-full text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1 flex items-center gap-1.5">
              <Sparkles size={10} style={{ color: accentColor }} />
              Suggested Questions
            </p>
            {t.suggestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                style={{ "--accent": accentColor }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-end gap-3">
          <div
            className="flex-1 flex items-end gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 transition-all"
            style={{ "--accent": accentColor }}
            onFocusCapture={e => e.currentTarget.style.borderColor = accentColor}
            onBlurCapture={e => e.currentTarget.style.borderColor = ""}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t.placeholder}
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-200 resize-none leading-6 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-outfit"
              style={{ minHeight: 28, maxHeight: 120 }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            style={{ background: loading || !input.trim() ? "#cbd5e1" : accentColor }}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] pb-3">
          Powered by Google Gemini · Estate Intelligence Hub
        </p>
      </div>

      <style>{`
        @keyframes ci-fadein {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ci-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-5px); }
        }
        .dark .premium-card {
          --ci-bot-bg: #1e293b;
          --ci-bot-text: #e2e8f0;
          --ci-bot-border: #334155;
        }
        .premium-card {
          --ci-bot-bg: #f8fafc;
          --ci-bot-text: #1e293b;
          --ci-bot-border: #e2e8f0;
        }
      `}</style>
    </div>
  );
}
