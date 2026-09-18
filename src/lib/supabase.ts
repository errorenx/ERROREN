import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import type { Conversation, ChatMessage, UserProfile } from '../types';

// Lazy singleton initialization for Supabase Client
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseConfig = () => {
  const metaEnv = (import.meta as any).env || {};
  const url =
    metaEnv.VITE_SUPABASE_URL ||
    (typeof window !== 'undefined' ? localStorage.getItem('erroren_supabase_url') || '' : '');
  const anonKey =
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    (typeof window !== 'undefined' ? localStorage.getItem('erroren_supabase_key') || '' : '');

  return { url: url.trim(), anonKey: anonKey.trim(), isConfigured: Boolean(url && anonKey) };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

export const getSupabase = (): SupabaseClient | null => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('erroren_supabase_url', url.trim());
    localStorage.setItem('erroren_supabase_key', anonKey.trim());
  }
  supabaseInstance = null; // Reset instance to pick up new credentials
};

// UUID Utilities to satisfy PostgreSQL strict UUID column requirements
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Stable memory cache mapping local pseudo-IDs (e.g. conv_123) to valid UUIDs
const idToUuidMap = new Map<string, string>();

export function ensureUUID(id?: string): string {
  if (!id) return generateUUID();
  if (isUUID(id)) return id;
  if (idToUuidMap.has(id)) return idToUuidMap.get(id)!;
  const newUuid = generateUUID();
  idToUuidMap.set(id, newUuid);
  return newUuid;
}

/**
 * Normal Email/Password User Registration via Supabase Auth
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  name: string
): Promise<{ user: User | null; session: Session | null; needsEmailConfirmation: boolean }> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase is not configured. Please add your Supabase URL & Anon Key in Settings.');
  }

  const cleanEmail = email.trim();
  const cleanName = name.trim();

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: pass,
    options: {
      data: {
        name: cleanName,
        display_name: cleanName,
      },
    },
  });

  if (error) {
    throw error;
  }

  const user = data.user;
  const session = data.session;

  if (user) {
    // Upsert into public.profiles table (id = auth.users.id)
    try {
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          name: cleanName || cleanEmail.split('@')[0],
          email: cleanEmail,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch (profErr) {
      console.warn('Profile record upsert notice on signup:', profErr);
    }
  }

  return {
    user,
    session,
    needsEmailConfirmation: !session,
  };
}

/**
 * Normal Email/Password Login via Supabase Auth
 */
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{ user: User; session: Session | null; profile: UserProfile }> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase is not configured. Please add your Supabase URL & Anon Key in Settings.');
  }

  const cleanEmail = email.trim();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: pass,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('Login failed. Please check your credentials.');
  }

  let profileName = data.user.user_metadata?.name || data.user.user_metadata?.display_name || cleanEmail.split('@')[0];

  try {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileRow && profileRow.name) {
      profileName = profileRow.name;
    } else {
      // Create profile row if it does not exist yet
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          name: profileName,
          email: cleanEmail,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }
  } catch (profErr) {
    console.warn('Failed to fetch profile during login:', profErr);
  }

  const profile: UserProfile = {
    id: data.user.id,
    name: profileName,
    email: cleanEmail,
    savedAt: Date.now(),
  };

  return {
    user: data.user,
    session: data.session,
    profile,
  };
}

/**
 * Sign out current user from Supabase Auth
 */
export async function logOut(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Supabase signOut warning:', error);
    }
  } catch (err) {
    console.error('Supabase sign out error:', err);
  }
}

/**
 * Get the currently authenticated Supabase user and session
 */
export async function getSessionUser(): Promise<{ user: User | null; profile: UserProfile | null }> {
  const supabase = getSupabase();
  if (!supabase) return { user: null, profile: null };

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return { user: null, profile: null };

    const user = session.user;
    let profileName = user.user_metadata?.name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';

    try {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .maybeSingle();

      if (profileRow?.name) {
        profileName = profileRow.name;
      }
    } catch {
      // Graceful fallback to user metadata
    }

    const profile: UserProfile = {
      id: user.id,
      name: profileName,
      email: user.email || '',
      savedAt: Date.now(),
    };

    return { user, profile };
  } catch (err) {
    console.warn('getSessionUser error:', err);
    return { user: null, profile: null };
  }
}

/**
 * Fetch a user profile from public.profiles
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabase();
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name || 'User',
      email: data.email || '',
      savedAt: Date.now(),
    };
  } catch (err) {
    console.warn('fetchUserProfile notice:', err);
    return null;
  }
}

/**
 * Update user profile in public.profiles
 */
export async function saveUserProfile(userId: string, name: string, email: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !userId) return;

  try {
    await supabase.from('profiles').upsert(
      {
        id: userId,
        name: name.trim(),
        email: email.trim(),
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('saveUserProfile notice:', err);
  }
}

/**
 * Save / sync an entire conversation and its messages to Supabase
 * Tables: public.conversations and public.messages
 */
export async function saveConversationToCloud(
  userId: string,
  conversation: Conversation
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !userId || !conversation?.id) return;

  const convUuid = ensureUUID(conversation.id);

  try {
    // 1. Upsert into public.conversations
    const { error: convErr } = await supabase.from('conversations').upsert(
      {
        id: convUuid,
        user_id: userId,
        title: conversation.title || 'New chat',
        created_at: new Date(conversation.createdAt || Date.now()).toISOString(),
        updated_at: new Date(conversation.updatedAt || Date.now()).toISOString(),
      },
      { onConflict: 'id' }
    );

    if (convErr) {
      console.warn('Supabase save conversation error:', convErr);
      return;
    }

    // 2. Upsert each message into public.messages
    if (Array.isArray(conversation.messages) && conversation.messages.length > 0) {
      const messageRows = conversation.messages.map(m => ({
        id: ensureUUID(m.id),
        conversation_id: convUuid,
        user_id: userId,
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content || '',
        attachment: m.attachment ? m.attachment : null,
        generated_image: m.generatedImage ? m.generatedImage : null,
        created_at: new Date(m.timestamp || Date.now()).toISOString(),
      }));

      const { error: msgErr } = await supabase.from('messages').upsert(messageRows, {
        onConflict: 'id',
      });

      if (msgErr) {
        console.warn('Supabase save messages error:', msgErr);
      }
    }
  } catch (err) {
    console.error('saveConversationToCloud error:', err);
  }
}

/**
 * Delete a conversation and its messages from Supabase
 */
export async function deleteConversationFromCloud(
  userId: string,
  conversationId: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !userId || !conversationId) return;

  const convUuid = ensureUUID(conversationId);

  try {
    // Delete associated messages first
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', convUuid)
      .eq('user_id', userId);

    // Delete conversation
    await supabase
      .from('conversations')
      .delete()
      .eq('id', convUuid)
      .eq('user_id', userId);
  } catch (err) {
    console.error('deleteConversationFromCloud error:', err);
  }
}

/**
 * Load all conversations and their messages for an authenticated user from Supabase
 */
export async function loadCloudConversations(userId: string): Promise<Conversation[]> {
  const supabase = getSupabase();
  if (!supabase || !userId) return [];

  try {
    // 1. Fetch user's conversations ordered by updated_at desc
    const { data: convs, error: convErr } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (convErr) {
      console.warn('Supabase load conversations notice:', convErr);
      return [];
    }

    if (!convs || convs.length === 0) {
      return [];
    }

    // 2. Fetch user's messages ordered chronologically
    const { data: msgs, error: msgErr } = await supabase
      .from('messages')
      .select('id, conversation_id, role, content, attachment, generated_image, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (msgErr) {
      console.warn('Supabase load messages notice:', msgErr);
    }

    // Group messages by conversation_id
    const messagesByConvId: Record<string, ChatMessage[]> = {};
    (msgs || []).forEach(m => {
      const cId = m.conversation_id;
      if (!messagesByConvId[cId]) {
        messagesByConvId[cId] = [];
      }
      messagesByConvId[cId].push({
        id: m.id,
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content || '',
        attachment: m.attachment || undefined,
        generatedImage: m.generated_image || undefined,
        timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
      });
    });

    // Construct final Conversation list
    const result: Conversation[] = convs.map(c => ({
      id: c.id,
      title: c.title || 'New chat',
      createdAt: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
      updatedAt: c.updated_at ? new Date(c.updated_at).getTime() : Date.now(),
      messages: messagesByConvId[c.id] || [],
    }));

    return result;
  } catch (err) {
    console.error('loadCloudConversations error:', err);
    return [];
  }
}
