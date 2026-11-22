import React, { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  Menu, 
  Sliders, 
  AlertCircle,
  HelpCircle,
  MessageCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onOpenSidebar: () => void;
  modelError: string | null;
  onTriggerUpload?: () => void;
}

const SUGGESTIONS = [
  {
    title: "Code Design",
    prompt: "Write a majestic, cinematic poem about an eagle soaring through a heavy lightning storm.",
    icon: "💻"
  },
  {
    title: "Science & Exploration",
    prompt: "Explain the atmospheric science behind how lightning strikes are generated in thunder clouds.",
    icon: "⚡"
  },
  {
    title: "Creative Insight",
    prompt: "Provide 5 inspirational and motivational quotes inspired by eagles conquering storms.",
    icon: "✨"
  },
  {
    title: "Atmospheric Facts",
    prompt: "Tell me some mind-blowing facts about lightning storms, eagles, and high-altitude weather.",
    icon: "🌩️"
  }
];

// Helper to format timestamps elegantly
const formatTime = (date: Date) => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date(date));
  } catch (e) {
    return "";
  }
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onOpenSidebar,
  modelError,
  onTriggerUpload
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll to the bottom when messages or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Safe and clean regex-based renderer for simple markdown tags
  const renderMarkdown = (text: string, messageId: string) => {
    if (!text) return null;

    // Split text by code blocks (```)
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // If it is a code block
      if (part.startsWith("```") && part.endsWith("```")) {
        const codeLines = part.slice(3, -3).trim().split("\n");
        // Check if first line is a language identifier
        let language = "code";
        let code = part.slice(3, -3).trim();
        if (codeLines[0] && codeLines[0].length < 15 && !codeLines[0].includes(" ") && !codeLines[0].includes(":") && !codeLines[0].includes("=")) {
          language = codeLines[0];
          code = codeLines.slice(1).join("\n");
        }

        const blockId = `${messageId}-code-${index}`;

        return (
          <div key={blockId} className="my-4 rounded-xl border border-white/10 overflow-hidden bg-slate-950/70 shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-white/5 text-xs text-slate-400 font-mono">
              <span>{language}</span>
              <button
                onClick={() => handleCopy(code, blockId)}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 hover:text-white transition-all"
                title="Copy code"
              >
                {copiedId === blockId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-w-full">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // If it is regular inline text, parse inline tags (bold, lists, inline code)
      const subParts = part.split(/(\*\*.*?\*\*|`.*?`|\n)/g);

      return (
        <span key={index}>
          {subParts.map((subPart, subIndex) => {
            if (subPart === "\n") {
              return <br key={subIndex} />;
            }
            if (subPart.startsWith("**") && subPart.endsWith("**")) {
              return (
                <strong key={subIndex} className="font-semibold text-white">
                  {subPart.slice(2, -2)}
                </strong>
              );
            }
            if (subPart.startsWith("`") && subPart.endsWith("`")) {
              return (
                <code key={subIndex} className="px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 font-mono text-xs border border-white/5">
                  {subPart.slice(1, -1)}
                </code>
              );
            }

            // Bullet points detection
            if (subPart.trim().startsWith("- ") || subPart.trim().startsWith("* ")) {
              return (
                <span key={subIndex} className="block pl-4 py-0.5 relative">
                  <span className="absolute left-1 text-indigo-400">•</span>
                  {subPart.trim().slice(2)}
                </span>
              );
            }

            return <React.Fragment key={subIndex}>{subPart}</React.Fragment>;
          })}
        </span>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden" id="chat-interface-wrapper">
      {/* Top Navigation Bar (Frosted overlay) */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#050505]/30 backdrop-blur-xl z-10" id="chat-header">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 hover:border-white/20 active:scale-95"
            title="Open Control Panel"
            id="sidebar-toggle-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-display font-semibold tracking-wide text-sm text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block pulsing-glow" />
              <span>Gemini Advanced</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 pulsing-glow" />
              <span>Real-Time Ambient Active</span>
            </p>
          </div>
        </div>

        {/* Quick helper to reveal side controller */}
        <button
          onClick={onOpenSidebar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium border border-white/10 hover:border-white/15 transition-all text-slate-300 hover:text-white"
          id="reveal-backdrop-btn"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Backdrop Adjustments</span>
        </button>
      </header>

      {/* Model Error Message Banner */}
      {modelError && (
        <div className="absolute top-18 left-6 right-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/35 backdrop-blur-md flex items-start gap-3 z-20 text-rose-200 text-xs shadow-lg" id="api-error-banner">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Backend Communication Error</span>
            <p className="opacity-90 leading-relaxed">{modelError}</p>
          </div>
        </div>
      )}

      {/* Message List Feed */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" id="messages-feed-area">
        {messages.length === 0 ? (
          /* Welcome / Onboarding Screen matching Sophisticated Dark Spec */
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto h-full flex flex-col justify-center items-center text-center space-y-10 py-12"
              id="chat-welcome-screen"
            >
              <div className="space-y-4">
                <h2 className="font-display font-medium text-4xl sm:text-5xl lg:text-6xl sophisticated-hero-text tracking-tight leading-tight pt-2">
                  Hello, Explorer.<br />
                  <span className="opacity-60 text-3xl sm:text-4xl lg:text-5xl font-light">How can I help you today?</span>
                </h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                  Powered by <span className="text-indigo-400 font-medium">gemini-3.5-flash</span>. Immersive high-fidelity ambient backdrop looping in real-time.
                </p>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  onClick={onTriggerUpload}
                  className="mt-6 inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/35 text-indigo-300 text-xs font-medium max-w-md mx-auto transition-all duration-300 shadow-md cursor-pointer group active:scale-95 select-none"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                  <span>
                    Drag & Drop your <strong className="text-white">Eagle Storm</strong> video file here or click to open uploader!
                  </span>
                </motion.div>
              </div>

              {/* Suggestion Prompt Chips Grid */}
              <div className="w-full space-y-4" id="suggestion-chips-container">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  {SUGGESTIONS.slice(0, 3).map((s) => (
                    <button
                      key={s.title}
                      onClick={() => onSendMessage(s.prompt)}
                      className="sophisticated-glass rounded-2xl p-5 text-left hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer duration-300 group"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono group-hover:text-indigo-300 transition-colors">
                          {s.title}
                        </span>
                        <span className="text-sm">{s.icon}</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed group-hover:text-white transition-colors">
                        {s.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          /* Conversation Bubble Stack */
          <div className="max-w-3xl mx-auto space-y-6" id="messages-stack">
            <AnimatePresence initial={false}>
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 350 }}
                    className={`flex items-start gap-3.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Role Avatar */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border text-xs font-semibold shrink-0 select-none ${
                      isUser
                        ? "bg-indigo-600/30 border-indigo-400/30 text-indigo-100"
                        : "bg-slate-850/40 border-white/10 text-indigo-400"
                    }`}>
                      {isUser ? "ME" : "AI"}
                    </div>

                    {/* Speech Bubble Container */}
                    <div className="flex flex-col max-w-[82%] space-y-1">
                      <div className={`p-4 rounded-2xl shadow-xl leading-relaxed text-sm backdrop-blur-md transition-all ${
                        isUser
                          ? "bg-indigo-600/20 border border-indigo-500/20 text-white rounded-tr-xs"
                          : "bg-slate-900/30 border border-white/5 text-slate-100 rounded-tl-xs"
                      }`}>
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : (
                          <div className="space-y-1">
                            {renderMarkdown(message.content, message.id)}
                          </div>
                        )}
                      </div>

                      {/* Timestamp & Meta Footer */}
                      <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 font-mono px-2 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}>
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatTime(message.timestamp)}</span>
                        {message.modelUsed && !isUser && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-indigo-400/80">{message.modelUsed}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Continuous Typing Pulsing Bubbles */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3.5"
                  id="loading-indicator-wrapper"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-850/40 border border-white/10 text-indigo-400 flex items-center justify-center text-xs font-semibold shrink-0">
                    AI
                  </div>
                  <div className="flex flex-col max-w-[80%] space-y-1">
                    <div className="p-4 rounded-2xl bg-slate-900/30 border border-white/5 shadow-xl backdrop-blur-md rounded-tl-xs">
                      <div className="flex items-center gap-1.5 py-1.5 px-1" id="typing-bubble-container">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono px-2">Gemini is streaming...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Area matching Sophisticated Dark Spec (64px high, glass styling) */}
      <footer className="p-5 border-t border-white/5 bg-[#050505]/30 backdrop-blur-xl z-10" id="chat-footer-input">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3 items-center" id="chat-form">
            <div className="flex-1 sophisticated-input-bar h-16 flex items-center px-4 gap-3 focus-within:border-indigo-500/40 transition-all duration-300">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Gemini..."
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-white/40 text-base focus:outline-none resize-none leading-relaxed overflow-hidden h-6 self-center"
                id="chat-textarea-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  input.trim() && !isLoading
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer hover:scale-105 active:scale-95"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
                title="Send query"
                id="chat-submit-btn"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          {/* Bottom Labels from the spec */}
          <div className="flex justify-center gap-8 mt-4 text-[10px] text-white/30 uppercase tracking-widest font-mono select-none">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Language: English (US)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
