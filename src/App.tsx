/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  loadConversations,
  saveConversations,
  loadActiveChatId,
  saveActiveChatId,
  loadSettings,
  saveSettings,
  generateChatTitle,
  loadLocalProfile,
  saveLocalProfile,
  loadProjects,
  saveProjects,
  loadActiveProjectId,
  saveActiveProjectId,
} from './utils/storage';
import { Conversation, ChatMessage, MessageAttachment, AppSettings, UserProfile, Project } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { AccountModal } from './components/AccountModal';
import { ProjectModal } from './components/ProjectModal';
import {
  getSupabase,
  logOut,
  saveConversationToCloud,
  deleteConversationFromCloud,
  loadCloudConversations,
} from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
  applyTheme,
  saveThemeMode,
  saveColorId,
  saveThemeId,
  ColorId,
  ThemeMode,
  ThemeId,
  THEMES,
  DEFAULT_THEME_ID,
  DEFAULT_THEME_MODE,
  DEFAULT_COLOR_ID,
} from './utils/theme';
import { classifyImageIntent } from './utils/imageIntent';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(() => loadLocalProfile());
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const profile = loadLocalProfile();
    return loadConversations(profile?.id || null);
  });
  const [activeId, setActiveId] = useState<string>(() => {
    const profile = loadLocalProfile();
    return loadActiveChatId(profile?.id || null);
  });
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => loadActiveProjectId());
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize theme on mount and whenever themeMode or colorId changes
  useEffect(() => {
    const mode = settings.themeMode || DEFAULT_THEME_MODE;
    const color = settings.colorId || DEFAULT_COLOR_ID;
    applyTheme(mode, color);
    saveThemeMode(mode);
    saveColorId(color);
    saveThemeId(`${color}-${mode}`);
  }, [settings.themeMode, settings.colorId]);

  // Sync settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Listen to Supabase Auth state
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const handleAuthChange = async (user: User | null) => {
      setCurrentUser(user);
      if (user) {
        let profileName =
          user.user_metadata?.name ||
          user.user_metadata?.display_name ||
          user.email?.split('@')[0] ||
          'User';

        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', user.id)
            .maybeSingle();

          if (prof?.name) {
            profileName = prof.name;
          }
        } catch (e) {
          console.warn('Profile fetch notice on auth change:', e);
        }

        const profile: UserProfile = {
          id: user.id,
          name: profileName,
          email: user.email || '',
          avatar: undefined,
          savedAt: Date.now(),
        };
        setLocalProfile(profile);
        saveLocalProfile(profile);

        // 1. Strictly load this user's OWN isolated conversations from localStorage cache
        const userLocalChats = loadConversations(user.id);
        setConversations(userLocalChats);

        try {
          // 2. Fetch cloud chats strictly for THIS user from Supabase
          const cloudChats = await loadCloudConversations(user.id);
          if (cloudChats.length > 0) {
            setConversations(cloudChats);
            const savedActiveId = loadActiveChatId(user.id);
            if (cloudChats.some(c => c.id === savedActiveId)) {
              setActiveId(savedActiveId);
            } else {
              setActiveId(cloudChats[0].id);
            }
          } else if (userLocalChats.length > 0) {
            // Upload user's local chats to Supabase
            userLocalChats.forEach(c => {
              if (c.messages.length > 0) {
                saveConversationToCloud(user.id, c).catch(err =>
                  console.warn('User cloud sync notice:', err)
                );
              }
            });
          }
        } catch (err) {
          console.error('Failed to sync cloud conversations:', err);
        }
      } else {
        // User logged out or guest: strictly load isolated guest chats
        const guestChats = loadConversations(null);
        setConversations(guestChats);
        const guestActiveId = loadActiveChatId(null) || guestChats[0]?.id || 'conv_default';
        setActiveId(guestActiveId);
      }
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session?.user || null);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync active chat ID & conversations with localStorage strictly per user
  useEffect(() => {
    const userId = currentUser?.id || localProfile?.id || null;
    saveConversations(conversations, userId);
  }, [conversations, currentUser?.id, localProfile?.id]);

  useEffect(() => {
    const userId = currentUser?.id || localProfile?.id || null;
    saveActiveChatId(activeId, userId);
  }, [activeId, currentUser?.id, localProfile?.id]);

  // Global Keyboard Shortcuts (Ctrl/Cmd + K for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeConversation =
    conversations.find(c => c.id === activeId) || conversations[0] || {
      id: 'conv_fallback',
      title: 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

  const handleSelectThemeMode = (mode: ThemeMode) => {
    const currentColor = settings.colorId || DEFAULT_COLOR_ID;
    const updated: AppSettings = {
      ...settings,
      themeMode: mode,
      themeId: `${currentColor}-${mode}`,
    };
    setSettings(updated);
    applyTheme(mode, currentColor);
    saveThemeMode(mode);
    saveThemeId(`${currentColor}-${mode}`);
  };

  const handleSelectColorId = (colorId: ColorId) => {
    const currentMode = settings.themeMode || DEFAULT_THEME_MODE;
    const updated: AppSettings = {
      ...settings,
      colorId,
      themeId: `${colorId}-${currentMode}`,
    };
    setSettings(updated);
    applyTheme(currentMode, colorId);
    saveColorId(colorId);
    saveThemeId(`${colorId}-${currentMode}`);
  };

  const handleSelectTheme = (themeId: ThemeId) => {
    const parts = themeId.split('-');
    const color = (parts[0] as ColorId) || DEFAULT_COLOR_ID;
    const mode = (parts[1] as ThemeMode) || DEFAULT_THEME_MODE;
    const updated: AppSettings = {
      ...settings,
      themeId,
      themeMode: mode,
      colorId: color,
    };
    setSettings(updated);
    applyTheme(mode, color);
    saveThemeMode(mode);
    saveColorId(color);
    saveThemeId(themeId);
  };

  const handleSaveProfile = (profile: UserProfile) => {
    setLocalProfile(profile);
    saveLocalProfile(profile);
    // Switch to this user's isolated conversations
    const userChats = loadConversations(profile.id);
    setConversations(userChats);
    const activeChatId = loadActiveChatId(profile.id);
    if (userChats.some(c => c.id === activeChatId)) {
      setActiveId(activeChatId);
    } else {
      setActiveId(userChats[0]?.id || 'conv_default');
    }
  };

  const handleLogoutProfile = async () => {
    setLocalProfile(null);
    saveLocalProfile(null);
    if (currentUser) {
      await logOut().catch(console.error);
    }
    // Switch immediately to isolated guest chats so no chats are leaked or mixed
    const guestChats = loadConversations(null);
    setConversations(guestChats);
    const guestActiveId = loadActiveChatId(null) || guestChats[0]?.id || 'conv_default';
    setActiveId(guestActiveId);
  };

  const handleSelectProject = (projectId: string | null) => {
    setActiveProjectId(projectId);
    saveActiveProjectId(projectId);

    // If active conversation doesn't belong to this project, select or create one
    if (projectId) {
      const projectConvs = conversations.filter(c => c.projectId === projectId);
      if (projectConvs.length > 0) {
        setActiveId(projectConvs[0].id);
      } else {
        const proj = projects.find(p => p.id === projectId);
        const newChat: Conversation = {
          id: `conv_${Date.now()}`,
          title: `${proj?.name || 'Project'} - Chat 1`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          projectId: projectId,
        };
        setConversations(prev => [newChat, ...prev]);
        setActiveId(newChat.id);
      }
    }
  };

  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: `proj_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newProject, ...projects];
    setProjects(updated);
    saveProjects(updated);
    handleSelectProject(newProject.id);
  };

  const handleDeleteProject = (projectId: string) => {
    const updated = projects.filter(p => p.id !== projectId);
    setProjects(updated);
    saveProjects(updated);
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      saveActiveProjectId(null);
    }
  };

  const handleOpenAccountWithMode = (mode: 'register' | 'login') => {
    setAuthMode(mode);
    setIsAccountOpen(true);
  };

  const handleNewChat = () => {
    if (activeConversation.messages.length === 0) {
      return;
    }

    const currentProj = projects.find(p => p.id === activeProjectId);
    const newChat: Conversation = {
      id: `conv_${Date.now()}`,
      title: currentProj
        ? `${currentProj.name} - Chat ${conversations.filter(c => c.projectId === activeProjectId).length + 1}`
        : 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      projectId: activeProjectId || undefined,
    };

    setConversations(prev => [newChat, ...prev]);
    setActiveId(newChat.id);

    if (currentUser) {
      saveConversationToCloud(currentUser.id, newChat).catch(console.error);
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => {
      const remaining = prev.filter(c => c.id !== id);
      if (remaining.length === 0) {
        const fresh: Conversation = {
          id: `conv_${Date.now()}`,
          title: 'New chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) {
        setActiveId(remaining[0].id);
      }
      return remaining;
    });

    if (currentUser) {
      deleteConversationFromCloud(currentUser.id, id).catch(console.error);
    }
  };

  const handleTogglePin = (id: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const handleClearAllChats = () => {
    const fresh: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    if (currentUser) {
      conversations.forEach(c => {
        deleteConversationFromCloud(currentUser.id, c.id).catch(console.error);
      });
    }
    setConversations([fresh]);
    setActiveId(fresh.id);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  const executeChatStream = async (
    conversationId: string,
    historyForApi: Array<{ role: 'user' | 'model'; text: string }>,
    attachment?: MessageAttachment
  ) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsGenerating(true);

    const assistantMsgId = `asst_${Date.now()}`;

    // Add placeholder assistant message
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id !== conversationId) return conv;
        return {
          ...conv,
          updatedAt: Date.now(),
          messages: [
            ...conv.messages,
            {
              id: assistantMsgId,
              role: 'assistant',
              content: '',
              timestamp: Date.now(),
              isStreaming: true,
            },
          ],
        };
      })
    );

    const currentProj = projects.find(p => p.id === activeProjectId);
    const combinedSystemPrompt = [
      currentProj?.systemPrompt ? `[Active Project: ${currentProj.name}]\n${currentProj.systemPrompt}` : undefined,
      settings.systemPrompt,
    ].filter(Boolean).join('\n\n');

    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: historyForApi,
          image: attachment ? { data: attachment.data, mimeType: attachment.mimeType } : undefined,
          systemPrompt: combinedSystemPrompt || undefined,
        }),
      });

      if (!response.ok) {
        // Check if server is running or if static environment (e.g. GitHub Pages)
        if (response.status === 404 || response.status >= 500) {
          if (settings.clientApiKey) {
            // Direct client call for static GitHub Pages deployment with user-provided Gemini API key
            try {
              const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${settings.clientApiKey}`;
              const clientPayload = {
                contents: historyForApi.map(m => ({
                  role: m.role === 'user' ? 'user' : 'model',
                  parts: [{ text: m.text || '' }],
                })),
                systemInstruction: settings.systemPrompt ? { parts: [{ text: settings.systemPrompt }] } : undefined,
              };
              const directRes = await fetch(directUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientPayload),
                signal: abortController.signal,
              });
              if (directRes.ok) {
                const data = await directRes.json();
                const directText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
                setConversations(prev =>
                  prev.map(conv => {
                    if (conv.id !== conversationId) return conv;
                    return {
                      ...conv,
                      messages: conv.messages.map(m =>
                        m.id === assistantMsgId ? { ...m, content: directText, isStreaming: false } : m
                      ),
                    };
                  })
                );
                return;
              }
            } catch (directErr: any) {
              console.warn('Client-side direct Gemini fetch notice:', directErr);
            }
          }

          // Resilient Neural Engine Fallback (Supports English, Roman Urdu & All Languages on Static GitHub Pages)
          try {
            const fallbackMessages = [
              {
                role: 'system',
                content:
                  combinedSystemPrompt ||
                  'You are ERROREN, a friendly, ultra-fast, and precise AI assistant. You speak and understand English, Roman Urdu (e.g., "aap kaise hain", "mujhe code chahiye", "kya haal hy"), Urdu, and other languages fluently. Always respond in the language the user speaks. Provide clean Markdown with properly formatted code blocks.',
              },
              ...historyForApi.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.text || '',
              })),
            ];

            const neuralRes = await fetch('https://text.pollinations.ai/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: fallbackMessages,
                model: 'openai',
                seed: 42,
              }),
              signal: abortController.signal,
            });

            if (neuralRes.ok) {
              const neuralText = await neuralRes.text();
              const cleanOutput = neuralText.trim() || 'I am ERROREN. How can I assist you?';
              
              // Simulate smooth progressive rendering
              const words = cleanOutput.split(' ');
              let accumulated = '';
              for (let i = 0; i < words.length; i++) {
                accumulated += (i > 0 ? ' ' : '') + words[i];
                if (i % 3 === 0 || i === words.length - 1) {
                  setConversations(prev =>
                    prev.map(conv => {
                      if (conv.id !== conversationId) return conv;
                      return {
                        ...conv,
                        messages: conv.messages.map(m =>
                          m.id === assistantMsgId
                            ? { ...m, content: accumulated, isStreaming: i < words.length - 1 }
                            : m
                        ),
                      };
                    })
                  );
                  await new Promise(r => setTimeout(r, 20));
                }
              }
              return;
            }
          } catch (neuralErr) {
            console.warn('Neural client fallback notice:', neuralErr);
          }
        }
        throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              accumulatedText += `\n\n⚠️ *${parsed.error}*`;
            } else if (parsed.chunk) {
              accumulatedText += parsed.chunk;
            }

            // Update the message in state
            setConversations(prev =>
              prev.map(conv => {
                if (conv.id !== conversationId) return conv;
                return {
                  ...conv,
                  messages: conv.messages.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedText, isStreaming: true }
                      : m
                  ),
                };
              })
            );
          } catch {
            // Ignore partial SSE JSON parse issues
          }
        }
      }

      // Mark streaming done and backup to Firestore if user logged in
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id !== conversationId) return conv;
          const updatedConv = {
            ...conv,
            updatedAt: Date.now(),
            messages: conv.messages.map(m =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: accumulatedText || 'I am here to help! How can I assist you further?',
                    isStreaming: false,
                  }
                : m
            ),
          };

          if (currentUser) {
            saveConversationToCloud(currentUser.id, updatedConv).catch(err =>
              console.warn('Failed to auto-save to cloud:', err)
            );
          }

          return updatedConv;
        });
        return updated;
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.id !== conversationId) return conv;
            const updatedConv = {
              ...conv,
              messages: conv.messages.map(m =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              ),
            };
            if (currentUser) {
              saveConversationToCloud(currentUser.id, updatedConv).catch(console.error);
            }
            return updatedConv;
          });
          return updated;
        });
      } else {
        console.error('Error during streaming chat:', err);
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.id !== conversationId) return conv;
            const updatedConv = {
              ...conv,
              messages: conv.messages.map(m =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content:
                        m.content ||
                        `An error occurred while generating a response: ${err.message || 'Please check your connection and try again.'}`,
                      isStreaming: false,
                      error: true,
                    }
                  : m
              ),
            };
            if (currentUser) {
              saveConversationToCloud(currentUser.id, updatedConv).catch(console.error);
            }
            return updatedConv;
          });
          return updated;
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async (text: string, attachment?: MessageAttachment) => {
    if (isGenerating) return;

    const currentConv = activeConversation;
    const userMsgId = `user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachment,
    };

    const shouldUpdateTitle =
      currentConv.messages.length === 0 ||
      currentConv.title === 'New chat' ||
      currentConv.title === 'Welcome to ERROREN';

    const newTitle = shouldUpdateTitle ? generateChatTitle(text || 'Image Analysis') : currentConv.title;
    const updatedMessages = [...currentConv.messages, userMessage];

    const updatedConv: Conversation = {
      ...currentConv,
      title: newTitle,
      updatedAt: Date.now(),
      messages: updatedMessages,
      projectId: activeProjectId || currentConv.projectId,
    };

    setConversations(prev =>
      prev.map(c => (c.id === currentConv.id ? updatedConv : c))
    );

    if (currentUser) {
      saveConversationToCloud(currentUser.id, updatedConv).catch(console.error);
    }

    // Natural Language Multimodal Intent Detection (Generate, Edit, Reference, or Normal Chat)
    const imageIntent = classifyImageIntent(text, attachment, currentConv.messages);

    if (imageIntent.type !== 'none') {
      setIsGenerating(true);
      const assistantMsgId = `asst_${Date.now()}`;

      let placeholderContent = `Creating photo for: "${imageIntent.prompt}"...`;
      if (imageIntent.type === 'edit') {
        placeholderContent = `Editing photo based on instruction: "${imageIntent.prompt}"...`;
      } else if (imageIntent.type === 'reference') {
        placeholderContent = `Creating photo based on reference: "${imageIntent.prompt}"...`;
      }

      const placeholderAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: placeholderContent,
        timestamp: Date.now(),
        isStreaming: true,
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === currentConv.id
            ? {
                ...updatedConv,
                messages: [...updatedMessages, placeholderAssistantMsg],
              }
            : c
        )
      );

      try {
        const apiBase = (import.meta as any).env?.VITE_API_URL || '';
        const targetImage = imageIntent.sourceImage || (attachment ? { data: attachment.data, mimeType: attachment.mimeType, url: attachment.previewUrl } : undefined);

        const response = await fetch(`${apiBase}/api/generate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: imageIntent.prompt,
            effectivePrompt: imageIntent.effectivePrompt,
            previousImagePrompt: imageIntent.previousImagePrompt,
            image: targetImage,
            mode: imageIntent.type,
            aspectRatio: imageIntent.aspectRatio || '1:1',
          }),
        });

        if (!response.ok) {
          throw new Error(`Image API status ${response.status}`);
        }

        const data = await response.json();
        const generatedImgUrl = data.url || data.imageUrl;
        if (generatedImgUrl) {
          const actionLabel =
            imageIntent.type === 'edit'
              ? 'edited photo'
              : imageIntent.type === 'reference'
              ? 'reference-inspired photo'
              : 'generated photo';

          setConversations(prev =>
            prev.map(c => {
              if (c.id !== currentConv.id) return c;
              const finishedConv: Conversation = {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map(m =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: data.revisedPrompt
                          ? `Here is your ${actionLabel}:\n\n*${data.revisedPrompt}*`
                          : `Here is your ${actionLabel}:`,
                        generatedImage: {
                          url: generatedImgUrl,
                          prompt: imageIntent.prompt,
                          revisedPrompt: data.revisedPrompt,
                          aspectRatio: data.aspectRatio || imageIntent.aspectRatio || '1:1',
                        },
                        isStreaming: false,
                      }
                    : m
                ),
              };
              if (currentUser) {
                saveConversationToCloud(currentUser.id, finishedConv).catch(console.error);
              }
              return finishedConv;
            })
          );
          return;
        } else {
          throw new Error(data.error || 'No image returned');
        }
      } catch (imgErr: any) {
        console.warn('Backend image endpoint unavailable, generating via direct neural engine fallback:', imgErr);
        try {
          let fallbackPrompt = imageIntent.effectivePrompt || imageIntent.prompt;
          if (imageIntent.type === 'edit' && imageIntent.previousImagePrompt && !imageIntent.effectivePrompt) {
            fallbackPrompt = `${imageIntent.previousImagePrompt}, modified with: ${imageIntent.prompt}, photorealistic authentic quality`;
          } else if (imageIntent.type === 'reference' && !imageIntent.effectivePrompt) {
            fallbackPrompt = `in the visual style of reference, ${imageIntent.prompt}, 8k resolution`;
          }

          const safeAspect = imageIntent.aspectRatio || '1:1';
          let w = 1024;
          let h = 1024;
          if (safeAspect === '16:9') { w = 1280; h = 720; }
          else if (safeAspect === '9:16') { w = 720; h = 1280; }
          else if (safeAspect === '4:3') { w = 1024; h = 768; }
          else if (safeAspect === '3:4') { w = 768; h = 1024; }

          const directImgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
            fallbackPrompt
          )}?width=${w}&height=${h}&seed=${Math.floor(Math.random() * 1000000)}&model=flux&nologo=true`;

          setConversations(prev =>
            prev.map(c => {
              if (c.id !== currentConv.id) return c;
              const finishedConv: Conversation = {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map(m =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: `Here is your requested photo:`,
                        generatedImage: {
                          url: directImgUrl,
                          prompt: imageIntent.prompt,
                          aspectRatio: imageIntent.aspectRatio || '1:1',
                        },
                        isStreaming: false,
                      }
                    : m
                ),
              };
              if (currentUser) {
                saveConversationToCloud(currentUser.id, finishedConv).catch(console.error);
              }
              return finishedConv;
            })
          );
          return;
        } catch (directImgErr) {
          console.error('Direct neural image error:', directImgErr);
        }

        // Fall back to standard streaming text model
        setConversations(prev =>
          prev.map(c => {
            if (c.id !== currentConv.id) return c;
            return {
              ...c,
              messages: c.messages.filter(m => m.id !== assistantMsgId),
            };
          })
        );
      } finally {
        setIsGenerating(false);
      }
    }

    const historyForApi = updatedMessages.map(m => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      text: m.content,
    }));

    await executeChatStream(currentConv.id, historyForApi, attachment);
  };

  const handleRegenerate = async () => {
    if (isGenerating || activeConversation.messages.length === 0) return;

    const messages = [...activeConversation.messages];
    if (messages[messages.length - 1].role === 'assistant') {
      messages.pop();
    }

    if (messages.length === 0) return;

    const lastUserMsg = messages[messages.length - 1];
    setConversations(prev =>
      prev.map(c => (c.id === activeConversation.id ? { ...c, messages } : c))
    );

    const historyForApi = messages.map(m => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      text: m.content,
    }));

    await executeChatStream(activeConversation.id, historyForApi, lastUserMsg.attachment);
  };

  const handleEditUserMessage = async (messageId: string, newContent: string) => {
    if (isGenerating) return;

    const msgIndex = activeConversation.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const sliced = activeConversation.messages.slice(0, msgIndex);
    const targetMsg = activeConversation.messages[msgIndex];

    const editedUserMsg: ChatMessage = {
      ...targetMsg,
      content: newContent,
      timestamp: Date.now(),
    };

    const newMessages = [...sliced, editedUserMsg];

    const updatedConv: Conversation = {
      ...activeConversation,
      messages: newMessages,
      updatedAt: Date.now(),
    };

    setConversations(prev =>
      prev.map(c => (c.id === activeConversation.id ? updatedConv : c))
    );

    if (currentUser) {
      saveConversationToCloud(currentUser.id, updatedConv).catch(console.error);
    }

    const historyForApi = newMessages.map(m => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      text: m.content,
    }));

    await executeChatStream(activeConversation.id, historyForApi, targetMsg.attachment);
  };

  const handleFeedback = (messageId: string, type: 'like' | 'dislike') => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id !== activeConversation.id) return conv;
        const updatedConv = {
          ...conv,
          messages: conv.messages.map(m => {
            if (m.id !== messageId) return m;
            return {
              ...m,
              feedback: m.feedback === type ? null : type,
            };
          }),
        };

        if (currentUser) {
          saveConversationToCloud(currentUser.id, updatedConv).catch(console.error);
        }

        return updatedConv;
      })
    );
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden font-sans antialiased relative transition-colors"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={id => setActiveId(id)}
        onNewConversation={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onTogglePin={handleTogglePin}
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentProfile={localProfile}
        onOpenAccount={() => handleOpenAccountWithMode('register')}
        onLogoutProfile={handleLogoutProfile}
        currentThemeMode={settings.themeMode}
        currentColorId={settings.colorId}
        onSelectThemeMode={handleSelectThemeMode}
        onSelectColorId={handleSelectColorId}
        currentThemeId={settings.themeId}
        onSelectTheme={handleSelectTheme}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onOpenCreateProject={() => setIsProjectModalOpen(true)}
        onDeleteProject={handleDeleteProject}
        onOpenAccountWithMode={handleOpenAccountWithMode}
      />

      {/* Main Chat View */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <ChatArea
          conversation={activeConversation}
          isGenerating={isGenerating}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          onRegenerate={handleRegenerate}
          onEditUserMessage={handleEditUserMessage}
          onFeedback={handleFeedback}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          isSidebarOpen={isSidebarOpen}
          onNewChat={handleNewChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
          currentProfile={localProfile}
          onOpenAccount={() => handleOpenAccountWithMode('register')}
          currentThemeMode={settings.themeMode}
          currentColorId={settings.colorId}
          onSelectThemeMode={handleSelectThemeMode}
          onSelectColorId={handleSelectColorId}
          currentThemeId={settings.themeId}
          onSelectTheme={handleSelectTheme}
        />
      </main>

      {/* Settings Modal with 10 Themes */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={newSettings => setSettings(newSettings)}
        onClearAllChats={handleClearAllChats}
        currentConversation={activeConversation}
        currentProfile={localProfile}
        onLogoutProfile={handleLogoutProfile}
        onOpenAccount={() => handleOpenAccountWithMode('register')}
      />

      {/* Account & Profile Modal with Login/Register Modes */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        currentProfile={localProfile}
        onSaveProfile={handleSaveProfile}
        initialMode={authMode}
      />

      {/* Project Creation Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
