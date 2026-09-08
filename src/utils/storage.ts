import { Conversation, AppSettings, UserProfile } from '../types';
import { DEFAULT_THEME_ID, loadSavedThemeId, THEMES } from './theme';

const STORAGE_CONVERSATIONS_KEY = 'erroren_conversations_v2';
const STORAGE_CURRENT_ID_KEY = 'erroren_active_chat_id_v2';
const STORAGE_SETTINGS_KEY = 'erroren_settings_v2';
const STORAGE_USER_PROFILE_KEY = 'erroren_user_profile_v2';

export const DEFAULT_SETTINGS: AppSettings = {
  themeId: loadSavedThemeId() || DEFAULT_THEME_ID,
  themeMode: THEMES[loadSavedThemeId() || DEFAULT_THEME_ID]?.mode || 'dark',
  systemPrompt: '',
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
        `- 💻 **Code & Architecture**: Debug errors, write algorithms, review code\n` +
        `- ✍️ **Writing & Analysis**: Draft emails, summarize articles, brainstorm strategies\n` +
        `- 🎨 **10 Color Themes**: Select from 5 dark & 5 light themes in Settings\n` +
        `- 💾 **Instant Save**: Save your profile and chat history effortlessly with zero verification`,
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
    const parsed = JSON.parse(raw);
    const themeId = parsed.themeId && THEMES[parsed.themeId] ? parsed.themeId : DEFAULT_SETTINGS.themeId;
    const themeMode = THEMES[themeId]?.mode || 'dark';
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      themeId,
      themeMode,
    };
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

export function loadLocalProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalProfile(profile: UserProfile | null): void {
  try {
    if (profile) {
      localStorage.setItem(STORAGE_USER_PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_USER_PROFILE_KEY);
    }
  } catch (err) {
    console.error('Failed to save local profile', err);
  }
}

export function generateChatTitle(firstMessage: string): string {
  const clean = firstMessage.trim().replace(/^#+\s*/, '').replace(/\n+/g, ' ');
  if (clean.length <= 32) return clean;
  return clean.slice(0, 30) + '...';
}
