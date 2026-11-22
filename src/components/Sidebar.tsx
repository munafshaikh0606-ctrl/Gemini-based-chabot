import React, { useRef } from "react";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Upload, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Sparkles, 
  X,
  FileVideo,
  Eye,
  Info
} from "lucide-react";
import { ChatSession, BackdropSettings } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  settings: BackdropSettings;
  onUpdateSettings: (settings: Partial<BackdropSettings>) => void;
}

const PRESETS = [
  {
    name: "Thunderstorm (Default)",
    url: "https://assets.mixkit.co/videos/preview/mixkit-lightning-strikes-in-the-sky-during-a-storm-41482-large.mp4"
  },
  {
    name: "Majestic Eagle Soaring",
    url: "https://assets.mixkit.co/videos/preview/mixkit-bald-eagle-flying-through-clouds-4886-large.mp4"
  },
  {
    name: "Drifting Star Nebula",
    url: "https://assets.mixkit.co/videos/preview/mixkit-star-ry-night-sky-over-clouds-40915-large.mp4"
  },
  {
    name: "Stormy Cloud Flashes",
    url: "https://assets.mixkit.co/videos/preview/mixkit-thunderstorm-with-lightning-flashes-in-the-sky-41481-large.mp4"
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  settings,
  onUpdateSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateSettings({
        videoUrl: url,
        customVideoName: file.name
      });
    }
  };

  const selectPreset = (url: string) => {
    onUpdateSettings({
      videoUrl: url,
      customVideoName: null
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 lg:hidden"
            id="mobile-sidebar-overlay"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-[320px] bg-[#050505]/90 border-r border-white/5 z-40 flex flex-col justify-between backdrop-blur-3xl select-none text-white overflow-hidden shadow-2xl"
            id="app-sidebar"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between" id="sidebar-header">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-white/10 flex items-center justify-center pulsing-glow">
                  <span className="w-3 h-3 bg-indigo-500 rounded-full inline-block" />
                </div>
                <span className="font-display font-semibold tracking-wide text-lg text-white">
                  Gemini Advanced
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors lg:hidden"
                title="Close sidebar"
                id="close-sidebar-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" id="sidebar-scroll-area">
              {/* Action Button */}
              <button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-98 border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 font-medium transition-all text-sm group"
                id="new-chat-btn"
              >
                <Plus className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                New Chat Session
              </button>

              {/* Chat History Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat History
                </div>
                {sessions.length === 0 ? (
                  <div className="text-xs text-slate-500 py-4 text-center italic">
                    No recent chats
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {sessions.map((session) => {
                      const isActive = session.id === currentSessionId;
                      return (
                        <div
                          key={session.id}
                          className={`group w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-all border ${
                            isActive
                              ? "bg-indigo-600/20 border-indigo-500/30 text-white"
                              : "bg-white/5 border-transparent text-slate-300 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <button
                            onClick={() => {
                              onSelectSession(session.id);
                              onClose();
                            }}
                            className="flex-1 text-left truncate font-medium mr-2"
                            title={session.title}
                          >
                            {session.title || "Untitled Session"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-[1px] bg-white/10" />

              {/* Backdrop controller */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  <Sliders className="w-3.5 h-3.5" />
                  Backdrop Controller
                </div>

                {/* Preset Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300 block">Video Presets</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {PRESETS.map((preset) => {
                      const isSelected = settings.videoUrl === preset.url && !settings.customVideoName;
                      return (
                        <button
                          key={preset.name}
                          onClick={() => selectPreset(preset.url)}
                          className={`w-full py-1.5 px-3 rounded-lg text-xs text-left font-medium transition-all border ${
                            isSelected
                              ? "bg-indigo-600/25 border-indigo-500/40 text-white"
                              : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Uploader */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300 block">Upload Custom Video</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-3 rounded-xl border border-dashed transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                      settings.customVideoName
                        ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-200"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {settings.customVideoName ? (
                      <>
                        <FileVideo className="w-5 h-5 text-indigo-400 pulsing-glow" />
                        <span className="text-xs font-semibold truncate max-w-full px-2 block">
                          {settings.customVideoName}
                        </span>
                        <span className="text-[10px] text-slate-400">Click to replace video</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-white" />
                        <span className="text-xs font-medium">Drag-and-Drop or Browse</span>
                        <span className="text-[10px] text-slate-500">Supports .mp4, .webm, .mov</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sliders */}
                <div className="space-y-3 pt-2">
                  {/* Opacity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-indigo-400" /> Video Opacity</span>
                      <span className="font-mono">{Math.round(settings.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={settings.opacity}
                      onChange={(e) => onUpdateSettings({ opacity: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Blur */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Glass Blur</span>
                      <span className="font-mono">{settings.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={settings.blur}
                      onChange={(e) => onUpdateSettings({ blur: parseInt(e.target.value) })}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Volume Controller */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <button
                        onClick={() => onUpdateSettings({ muted: !settings.muted })}
                        className="flex items-center gap-1 hover:text-indigo-300 transition-colors"
                      >
                        {settings.muted ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{settings.muted ? "Muted" : "Backdrop Audio"}</span>
                      </button>
                      <span className="font-mono">{Math.round(settings.volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.0"
                      step="0.05"
                      disabled={settings.muted}
                      value={settings.volume}
                      onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
                      className={`w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 ${
                        settings.muted ? "opacity-30 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>

                  {/* Playback rate */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 block">Playback Speed</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[0.5, 1.0, 1.5, 2.0].map((rate) => {
                        const isSelected = settings.playbackRate === rate;
                        return (
                          <button
                            key={rate}
                            onClick={() => onUpdateSettings({ playbackRate: rate })}
                            className={`py-1 rounded text-[10px] font-mono font-medium transition-all border ${
                              isSelected
                                ? "bg-indigo-600/30 border-indigo-500/40 text-white"
                                : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {rate}x
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-950/40 text-slate-400 text-xs flex flex-col gap-1.5" id="sidebar-footer">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>To check out your own video loop:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Drag-and-drop or select any video file on the Custom Upload card to run it locally in full real-time high fidelity.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
