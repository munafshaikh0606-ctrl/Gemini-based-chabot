export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  modelUsed?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export interface BackdropSettings {
  videoUrl: string;
  customVideoName: string | null;
  opacity: number; // 0 to 1
  blur: number; // 0 to 40 (px)
  volume: number; // 0 to 1
  muted: boolean;
  playbackRate: number; // 0.5 to 2
}
