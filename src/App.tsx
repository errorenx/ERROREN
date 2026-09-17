/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
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
  auth,
  logOut,
  saveConversationToCloud,
  deleteConversationFromCloud,
  loadCloudConversations,
} from './lib/firebase';
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

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string>(() => loadActiveChatId());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => loadActiveProjectId());
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(() => loadLocalProfile());

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

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!auth) return;
    try {
      const unsubscribe = onAuthStateChanged(auth, async user => {
        setCurrentUser(user);
        if (user) {
        // If logged in via Google and no local profile name, populate local profile
        if (!localProfile) {
          const profile: UserProfile = {
            id: user.uid,
            name: user.displayName || 'Google User',
            email: user.email || '',
            avatar: user.photoURL || undefined,
            savedAt: Date.now(),
          };
          setLocalProfile(profile);
          saveLocalProfile(profile);
        }

        try {
          const cloudChats = await loadCloudConversations(user.uid);
          if (cloudChats.length > 0) {
            setConversations(prevLocal => {
              const cloudIds = new Set(cloudChats.map(c => c.id));
              const localOnly = prevLocal.filter(c => !cloudIds.has(c.id) && c.messages.length > 0);

              localOnly.forEach(localChat => {
                saveConversationToCloud(user.uid, localChat).catch(err =>
                  console.warn('Backup local chat to cloud error:', err)
                );
              });

              const merged = [...cloudChats, ...localOnly].sort(
                (a, b) => b.updatedAt - a.updatedAt
              );
              return merged;
            });

            if (!cloudChats.some(c => c.id === activeId) && cloudChats[0]) {
              setActiveId(cloudChats[0].id);
            }
          } else {
            setConversations(prevLocal => {
              prevLocal.forEach(c => {
                if (c.messages.length > 0) {
                  saveConversationToCloud(user.uid, c).catch(err =>
                    console.warn('Initial cloud sync error:', err)
                  );
                }
              });
              return prevLocal;
            });
          }
        } catch (err) {
          console.error('Failed to sync cloud conversations:', err);
        }
      }
    }, err => {
      console.warn('onAuthStateChanged listener warning:', err);
    });

      return () => unsubscribe();
    } catch (err) {
      console.warn('onAuthStateChanged setup notice:', err);
    }
  }, []);

  // Sync active chat ID & conversations with localStorage
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveActiveChatId(activeId);
  }, [activeId]);

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
  };

  const handleLogoutProfile = async () => {
    setLocalProfile(null);
    saveLocalProfile(null);
    if (currentUser) {
      await logOut().catch(console.error);
    }
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
      saveConversationToCloud(currentUser.uid, newChat).catch(console.error);
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
      deleteConversationFromCloud(currentUser.uid, id).catch(console.error);
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
        deleteConversationFromCloud(currentUser.uid, c.id).catch(console.error);
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
      const response = await fetch('/api/chat/stream', {
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
        if (response.status === 404) {
          if (settings.clientApiKey) {
            // Direct client call for static GitHub Pages deployment with user-provided Gemini API key
            try {
              const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${settings.clientApiKey}`;
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
              console.warn('Client-side direct Gemini fetch error:', directErr);
            }
          }

          throw new Error(
            'ERROREN is deployed on static GitHub Pages. To chat here without a backend server, please enter your free Gemini API Key in Settings (⚙️ top right > AI Persona & API tab).'
          );
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
            saveConversationToCloud(currentUser.uid, updatedConv).catch(err =>
              console.warn('Failed to auto-save to Firestore:', err)
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
              saveConversationToCloud(currentUser.uid, updatedConv).catch(console.error);
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
              saveConversationToCloud(currentUser.uid, updatedConv).catch(console.error);
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

  const isImageRequest = (promptText: string, hasAttachment: boolean): boolean => {
    const p = promptText.toLowerCase().trim();
    if (
      p.startsWith('/image') ||
      p.startsWith('/draw') ||
      p.startsWith('/photo') ||
      p.startsWith('/generate') ||
      p.startsWith('/edit')
    ) {
      return true;
    }
    if (
      p.includes('generate image') ||
      p.includes('generate photo') ||
      p.includes('generate an image') ||
      p.includes('create an image') ||
      p.includes('create a photo') ||
      p.includes('create photo') ||
      p.includes('create image') ||
      p.includes('draw an image') ||
      p.includes('draw a picture') ||
      p.includes('make an image') ||
      p.includes('make a photo') ||
      p.includes('draw me') ||
      p.includes('paint an image')
    ) {
      return true;
    }
    // Roman Urdu & Urdu patterns:
    if (
      p.includes('photo bana') ||
      p.includes('photo bna') ||
      p.includes('image bna') ||
      p.includes('image bana') ||
      p.includes('tasveer bna') ||
      p.includes('tasweer bna') ||
      p.includes('tasveer bana') ||
      p.includes('photo chay') ||
      p.includes('image chay') ||
      p.includes('photo chahiye') ||
      p.includes('image chahiye') ||
      p.includes('photo create') ||
      p.includes('image create') ||
      p.includes('photo bnwa') ||
      p.includes('photo bnay') ||
      p.includes('image bnay')
    ) {
      return true;
    }
    if (
      hasAttachment &&
      (p.includes('edit') ||
        p.includes('modify') ||
        p.includes('style') ||
        p.includes('change') ||
        p.includes('make it') ||
        p.includes('filter'))
    ) {
      return true;
    }
    return false;
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
      saveConversationToCloud(currentUser.uid, updatedConv).catch(console.error);
    }

    // In-chat ChatGPT-style image generation/editing
    if (isImageRequest(text, !!attachment)) {
      setIsGenerating(true);
      const assistantMsgId = `asst_${Date.now()}`;
      const placeholderAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: attachment
          ? `Editing photo based on prompt: "${text}"...`
          : `Creating and generating photo for: "${text}"...`,
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
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            image: attachment ? { data: attachment.data, mimeType: attachment.mimeType } : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`Image API status ${response.status}`);
        }

        const data = await response.json();
        if (data.url) {
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
                          ? `Here is your generated photo:\n\n*${data.revisedPrompt}*`
                          : `Here is your requested photo:`,
                        generatedImage: {
                          url: data.url,
                          prompt: text,
                          revisedPrompt: data.revisedPrompt,
                          aspectRatio: data.aspectRatio || '1:1',
                        },
                        isStreaming: false,
                      }
                    : m
                ),
              };
              if (currentUser) {
                saveConversationToCloud(currentUser.uid, finishedConv).catch(console.error);
              }
              return finishedConv;
            })
          );
          return;
        } else {
          throw new Error(data.error || 'No image returned');
        }
      } catch (imgErr: any) {
        console.warn('In-chat image generation fallback notice:', imgErr);
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
      saveConversationToCloud(currentUser.uid, updatedConv).catch(console.error);
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
          saveConversationToCloud(currentUser.uid, updatedConv).catch(console.error);
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
