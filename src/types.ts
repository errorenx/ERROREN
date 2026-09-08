export interface MessageAttachment {
  name: string;
  mimeType: string;
  data: string; // base64 without prefix
  previewUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachment?: MessageAttachment;
  isStreaming?: boolean;
  error?: boolean;
  feedback?: 'like' | 'dislike' | null;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  pinned?: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  systemPrompt: string;
  speechVoiceName: string;
  speechRate: number;
  streamResponses: boolean;
}
