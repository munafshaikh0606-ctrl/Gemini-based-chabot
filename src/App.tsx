import React, { useState, useEffect } from "react";
import { ChatSession, BackdropSettings, Message } from "./types";
import { VideoBackground } from "./components/VideoBackground";
import { Sidebar } from "./components/Sidebar";
import { ChatInterface } from "./components/ChatInterface";
import { Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const STORAGE_CHATS_KEY = "gemini_portal_chats";
const STORAGE_SETTINGS_KEY = "gemini_portal_settings";

const DEFAULT_VIDEO_URL = "https://assets.mixkit.co/videos/preview/mixkit-bald-eagle-flying-through-clouds-4886-large.mp4";

export default function App() {
  // --- Backdrop State ---
  const [isDragging, setIsDragging] = useState(false);
  const [backdropSettings, setBackdropSettings] = useState<BackdropSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Don't restore custom URL since Object URLs expire across session loads
        if (parsed.customVideoName) {
          return {
            ...parsed,
            videoUrl: DEFAULT_VIDEO_URL,
            customVideoName: null
          };
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Could not load stored backdrop settings", e);
    }
    return {
      videoUrl: DEFAULT_VIDEO_URL,
      customVideoName: null,
      opacity: 0.5,
      blur: 12,
      volume: 0.3,
      muted: true,
      playbackRate: 1.0
    };
  });

  // --- Sessions State ---
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHATS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Cast raw dates back to actual Dates
        return parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
      }
    } catch (e) {
      console.warn("Could not load stored chats", e);
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    if (sessions.length > 0) {
      return sessions[0].id;
    }
    return "";
  });

  // --- UI Layout State ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // Auto-save conversations to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Auto-save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(backdropSettings));
  }, [backdropSettings]);

  // Handle responsive sidebar on startup
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize(); // trigger on load
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Event Handlers ---
  const handleUpdateSettings = (updated: Partial<BackdropSettings>) => {
    setBackdropSettings((prev) => ({
      ...prev,
      ...updated
    }));
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setModelError(null);
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(7),
      title: "New Conversation",
      messages: [],
      createdAt: new Date()
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setModelError(null);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length > 0 && currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      } else if (filtered.length === 0) {
        setCurrentSessionId("");
      }
      return filtered;
    });
    setModelError(null);
  };

  const handleSendMessage = async (content: string) => {
    let targetSessionId = currentSessionId;
    let currentSessionsList = [...sessions];

    // 1. If there's no active session, create one automatically
    if (!targetSessionId) {
      const newSession: ChatSession = {
        id: Math.random().toString(36).substring(7),
        title: content.substring(0, 24) + (content.length > 24 ? "..." : ""),
        messages: [],
        createdAt: new Date()
      };
      currentSessionsList = [newSession, ...currentSessionsList];
      setSessions(currentSessionsList);
      setCurrentSessionId(newSession.id);
      targetSessionId = newSession.id;
    }

    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      content: content,
      timestamp: new Date()
    };

    // 2. Append user message to the active session
    let updatedSessionMessages: Message[] = [];
    currentSessionsList = currentSessionsList.map((session) => {
      if (session.id === targetSessionId) {
        const isFirstMessage = session.messages.length === 0;
        updatedSessionMessages = [...session.messages, userMessage];
        return {
          ...session,
          title: isFirstMessage 
            ? content.substring(0, 26) + (content.length > 26 ? "..." : "")
            : session.title,
          messages: updatedSessionMessages
        };
      }
      return session;
    });

    setSessions(currentSessionsList);
    setIsLoading(true);
    setModelError(null);

    // 3. Request Streaming response from backend Express Server
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedSessionMessages.map(m => ({ role: m.role, content: m.content })),
          systemInstruction: "You are an intelligent, highly helpful, and conversational AI assistant. You are running in a gorgeous, iOS-styled immersive glassmorphism frontend with a live stormy, eagle-filled backdrop. Frame your responses clearly. Keep them deeply descriptive, structured, and visually clean. Use bullet points and code blocks with markdown tags wherever appropriate."
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) {
        throw new Error("Unable to initialize response stream reader.");
      }

      // Add a blank assistant message to start compiling real-time tokens
      const assistantMessageId = Math.random().toString();
      const initialAssistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        modelUsed: "gemini-3.5-flash"
      };

      setSessions((prev) => prev.map((session) => {
        if (session.id === targetSessionId) {
          return {
            ...session,
            messages: [...session.messages, initialAssistantMessage]
          };
        }
        return session;
      }));

      let assistantContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // retain incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                assistantContent += parsed.text;

                // Dynamically update this assistant message's content
                setSessions((prev) => prev.map((session) => {
                  if (session.id === targetSessionId) {
                    return {
                      ...session,
                      messages: session.messages.map((m) => 
                        m.id === assistantMessageId
                          ? { ...m, content: assistantContent }
                          : m
                      )
                    };
                  }
                  return session;
                }));
              }
            } catch (err) {
              console.warn("Error parsing streamed SSE token:", err);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to query server-side chat API:", error);
      setModelError(error.message || "Unable to reach the Gemini server. Verify the server is online and secrets are injected.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Hidden File Uploader ---
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setBackdropSettings((prev) => ({
        ...prev,
        videoUrl: url,
        customVideoName: file.name
      }));
    }
  };

  // --- Drag & Drop Background Video Overrides ---
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setBackdropSettings((prev) => ({
        ...prev,
        videoUrl: url,
        customVideoName: file.name
      }));
    }
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const activeMessages = currentSession ? currentSession.messages : [];

  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex w-screen h-screen overflow-hidden font-sans text-slate-100 bg-slate-950"
      id="app-root-wrapper"
    >
      {/* Hidden File Input for Video Upload */}
      <input 
        type="file" 
        accept="video/*" 
        ref={fileInputRef} 
        onChange={handleFileInput} 
        className="hidden" 
      />

      {/* 1. HTML5 Loop Video Backdrop Layer */}
      <VideoBackground settings={backdropSettings} />

      {/* 2. Glassmorphic Sidebar (Drawer) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        settings={backdropSettings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* 3. Core Blurred Conversation Workspace */}
      <main className="flex-1 flex flex-col h-full relative" id="app-workspace-main">
        <ChatInterface
          messages={activeMessages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onOpenSidebar={() => setSidebarOpen(true)}
          modelError={modelError}
          onTriggerUpload={handleTriggerUpload}
        />
      </main>

      {/* 4. Elegant Drag & Drop File Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020205]/85 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 border-4 border-dashed border-indigo-500/30 m-4 rounded-3xl pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="flex flex-col items-center justify-center text-center space-y-4 max-w-sm"
            >
              <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 pulsing-glow mb-2">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-display font-semibold text-white">
                Release to Apply Live Background
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drop your <strong className="text-white">Eagle Storm</strong> video file here. Supports MP4, WebM, and MOV formats.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
