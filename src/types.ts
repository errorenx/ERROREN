import { ColorId, ThemeId, ThemeMode } from './utils/theme';

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
  themeId: ThemeId;
  themeMode: ThemeMode;
  colorId: ColorId;
  systemPrompt: string;
  streamResponses: boolean;
  clientApiKey?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  savedAt: number;
}

export interface UserAuthProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
