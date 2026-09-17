import { Conversation, AppSettings, UserProfile, Project } from '../types';
import {
  DEFAULT_COLOR_ID,
  DEFAULT_THEME_ID,
  DEFAULT_THEME_MODE,
  loadSavedColorId,
  loadSavedThemeId,
  loadSavedThemeMode,
  COLOR_PALETTES,
} from './theme';

const STORAGE_CURRENT_ID_KEY = 'erroren_active_chat_id_v2';
const STORAGE_SETTINGS_KEY = 'erroren_settings_v2';
const STORAGE_USER_PROFILE_KEY = 'erroren_user_profile_v2';

export function getConversationsStorageKey(userId?: string | null): string {
  if (userId) {
    return `erroren_conversations_user_${userId}`;
  }
  if (typeof window === 'undefined') return 'erroren_conversations_guest';
  let guestId = localStorage.getItem('erroren_guest_session_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('erroren_guest_session_id', guestId);
  }
  return `erroren_conversations_${guestId}`;
}

export function getActiveChatStorageKey(userId?: string | null): string {
  if (userId) {
    return `erroren_active_chat_user_${userId}`;
  }
  return STORAGE_CURRENT_ID_KEY;
}

export const DEFAULT_SETTINGS: AppSettings = {
  themeId: loadSavedThemeId() || DEFAULT_THEME_ID,
  themeMode: loadSavedThemeMode() || DEFAULT_THEME_MODE,
  colorId: loadSavedColorId() || DEFAULT_COLOR_ID,
  systemPrompt: '',
  streamResponses: true,
};

export function createInitialConversation(): Conversation {
  return {
    id: `conv_${Date.now()}`,
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
          `- 💾 **Account Isolation**: Your chats are strictly private and isolated to your account.`,
        timestamp: Date.now(),
      },
    ],
  };
}

export const INITIAL_CONVERSATION: Conversation = createInitialConversation();

export function loadConversations(userId?: string | null): Conversation[] {
  try {
    const key = getConversationsStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [createInitialConversation()];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [createInitialConversation()];
  } catch (err) {
    console.error('Failed to load conversations from localStorage', err);
    return [createInitialConversation()];
  }
}

export function saveConversations(conversations: Conversation[], userId?: string | null): void {
  try {
    const key = getConversationsStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations to localStorage', err);
  }
}

export function loadActiveChatId(userId?: string | null): string {
  try {
    const key = getActiveChatStorageKey(userId);
    return localStorage.getItem(key) || INITIAL_CONVERSATION.id;
  } catch {
    return INITIAL_CONVERSATION.id;
  }
}

export function saveActiveChatId(id: string, userId?: string | null): void {
  try {
    const key = getActiveChatStorageKey(userId);
    localStorage.setItem(key, id);
  } catch (err) {
    console.error('Failed to save active chat ID', err);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    
    // Determine theme mode ('dark' or 'light')
    const themeMode = parsed.themeMode === 'light' || parsed.themeMode === 'dark' 
      ? parsed.themeMode 
      : DEFAULT_SETTINGS.themeMode;

    // Determine color ID (1 of 10)
    const colorId = parsed.colorId && COLOR_PALETTES[parsed.colorId]
      ? parsed.colorId
      : DEFAULT_SETTINGS.colorId;

    const themeId = `${colorId}-${themeMode}`;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      themeMode,
      colorId,
      themeId,
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

const STORAGE_PROJECTS_KEY = 'erroren_projects_v2';
const STORAGE_ACTIVE_PROJECT_KEY = 'erroren_active_project_id_v2';

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load projects from localStorage', err);
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to localStorage', err);
  }
}

export function loadActiveProjectId(): string | null {
  try {
    return localStorage.getItem(STORAGE_ACTIVE_PROJECT_KEY) || null;
  } catch {
    return null;
  }
}

export function saveActiveProjectId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_ACTIVE_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_PROJECT_KEY);
    }
  } catch (err) {
    console.error('Failed to save active project ID', err);
  }
}

