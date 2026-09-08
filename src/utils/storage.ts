import { Conversation, AppSettings, ChatMessage } from '../types';

const STORAGE_CONVERSATIONS_KEY = 'erroren_conversations_v1';
const STORAGE_CURRENT_ID_KEY = 'erroren_active_chat_id_v1';
const STORAGE_SETTINGS_KEY = 'erroren_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  systemPrompt: '',
  speechVoiceName: '',
  speechRate: 1,
  streamResponses: true,
};

export const INITIAL_CONVERSATION: Conversation = {
  id: 'conv_default',
  title: 'Welcome to ERROREN',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [
    {
      id: 'welcome_1',
      role: 'assistant',
      content:
        `Hello! I am **ERROREN**, your intelligent AI assistant.\n\n` +
        `How can I assist you today? Feel free to ask me anything in **English**, **Roman Urdu** (jaise: *"kya haal hai?"*), or **Urdu** (اردو).\n\n` +
        `- 💻 **Code & Technical**: Debug errors, write code, explain algorithms\n` +
        `- ✍️ **Writing & Brainstorming**: Essays, emails, creative ideas\n` +
        `- 🖼️ **Image Understanding**: Attach photos or screenshots to analyze\n` +
        `- 🎙️ **Voice**: Talk directly using the microphone button`,
      timestamp: Date.now(),
    },
  ],
};

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_CONVERSATIONS_KEY);
    if (!raw) return [INITIAL_CONVERSATION];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [INITIAL_CONVERSATION];
  } catch (err) {
    console.error('Failed to load conversations from localStorage', err);
    return [INITIAL_CONVERSATION];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations to localStorage', err);
  }
}

export function loadActiveChatId(): string {
  try {
    return localStorage.getItem(STORAGE_CURRENT_ID_KEY) || INITIAL_CONVERSATION.id;
  } catch {
    return INITIAL_CONVERSATION.id;
  }
}

export function saveActiveChatId(id: string): void {
  try {
    localStorage.setItem(STORAGE_CURRENT_ID_KEY, id);
  } catch (err) {
    console.error('Failed to save active chat ID', err);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function generateChatTitle(firstMessage: string): string {
  const clean = firstMessage.trim().replace(/^#+\s*/, '').replace(/\n+/g, ' ');
  if (clean.length <= 32) return clean;
  return clean.slice(0, 30) + '...';
}
