import React, { useEffect, useRef } from "react";
import { BackdropSettings } from "../types";

interface VideoBackgroundProps {
  settings: BackdropSettings;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ settings }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync video volume, playback rate, and muted state with settings
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = settings.volume;
      video.playbackRate = settings.playbackRate;
      video.muted = settings.muted;
      
      // Play video if it is paused and has a valid source
      if (video.paused && settings.videoUrl) {
        video.play().catch((err) => {
          console.warn("Video auto-play interrupted:", err);
        });
      }
    }
  }, [settings.volume, settings.playbackRate, settings.muted, settings.videoUrl]);

  return (
    <div className="fixed inset-0 w-full h-full -z-10 sophisticated-dark-bg overflow-hidden select-none">
      {/* Background radial ambient glow for incredible dark contrast */}
      <div className="sophisticated-ambient-glow pulsing-glow" />
      
      {settings.videoUrl ? (
        <video
          ref={videoRef}
          key={settings.videoUrl}
          src={settings.videoUrl}
          autoPlay
          loop
          muted={settings.muted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
          style={{
            opacity: settings.opacity,
            filter: `blur(${settings.blur}px)`,
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-white/40 text-sm font-mono">
          No background video loaded
        </div>
      )}

      {/* Dynamic atmospheric layer to darken the background slightly so text remains highly readable (iOS styling) */}
      <div 
        className="absolute inset-0 bg-[#040406]/35 pointer-events-none transition-colors duration-500" 
        style={{
          backdropFilter: `blur(${settings.blur}px)`,
        }}
      />
    </div>
  );
};
