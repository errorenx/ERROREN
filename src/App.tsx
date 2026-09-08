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
} from './utils/storage';
import { Conversation, ChatMessage, MessageAttachment, AppSettings } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string>(() => loadActiveChatId());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync active chat ID & conversations with localStorage
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveActiveChatId(activeId);
  }, [activeId]);

  useEffect(() => {
    saveSettings(settings);
    // Theme class management on HTML element
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [settings]);

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

  const handleNewChat = () => {
    // If current conversation is already empty, just keep it
    if (activeConversation.messages.length === 0) {
      return;
    }

    const newChat: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    setConversations(prev => [newChat, ...prev]);
    setActiveId(newChat.id);
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
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
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

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: historyForApi,
          image: attachment ? { data: attachment.data, mimeType: attachment.mimeType } : undefined,
          systemPrompt: settings.systemPrompt || undefined,
        }),
      });

      if (!response.ok) {
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

      // Mark streaming done
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id !== conversationId) return conv;
          return {
            ...conv,
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
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User deliberately stopped generation
        setConversations(prev =>
          prev.map(conv => {
            if (conv.id !== conversationId) return conv;
            return {
              ...conv,
              messages: conv.messages.map(m =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              ),
            };
          })
        );
      } else {
        console.error('Error during streaming chat:', err);
        setConversations(prev =>
          prev.map(conv => {
            if (conv.id !== conversationId) return conv;
            return {
              ...conv,
              messages: conv.messages.map(m =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content:
                        m.content ||
                        'Sorry, I encountered an issue generating a response. Please check your connection or try again.',
                      isStreaming: false,
                      error: true,
                    }
                  : m
              ),
            };
          })
        );
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

    // Auto-update title if it's currently generic
    const shouldUpdateTitle =
      currentConv.messages.length === 0 ||
      currentConv.title === 'New chat' ||
      currentConv.title === 'Welcome to ERROREN';

    const newTitle = shouldUpdateTitle ? generateChatTitle(text || 'Image Analysis') : currentConv.title;

    // Update conversation with user message
    const updatedMessages = [...currentConv.messages, userMessage];

    setConversations(prev =>
      prev.map(c =>
        c.id === currentConv.id
          ? {
              ...c,
              title: newTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : c
      )
    );

    // Prepare history payload for API
    const historyForApi = updatedMessages.map(m => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      text: m.content,
    }));

    await executeChatStream(currentConv.id, historyForApi, attachment);
  };

  const handleRegenerate = async () => {
    if (isGenerating || activeConversation.messages.length === 0) return;

    // Remove last assistant message
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

    // Slice messages up to the edited user message
    const sliced = activeConversation.messages.slice(0, msgIndex);
    const targetMsg = activeConversation.messages[msgIndex];

    const editedUserMsg: ChatMessage = {
      ...targetMsg,
      content: newContent,
      timestamp: Date.now(),
    };

    const newMessages = [...sliced, editedUserMsg];

    setConversations(prev =>
      prev.map(c => (c.id === activeConversation.id ? { ...c, messages: newMessages } : c))
    );

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
        return {
          ...conv,
          messages: conv.messages.map(m => {
            if (m.id !== messageId) return m;
            return {
              ...m,
              feedback: m.feedback === type ? null : type,
            };
          }),
        };
      })
    );
  };

  const handleToggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050505] text-[#e0e0e0] font-sans antialiased relative selection:bg-[#00FF66] selection:text-black">
      {/* Ambient Flux Glow */}
      <div
        className="absolute top-0 right-0 w-48 h-full pointer-events-none z-0"
        style={{ background: 'linear-gradient(to left, rgba(0, 255, 102, 0.03), transparent)' }}
      />

      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={id => setActiveId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(prev => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        onToggleTheme={handleToggleTheme}
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
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={newSettings => setSettings(newSettings)}
        onClearAllChats={handleClearAllChats}
        currentConversation={activeConversation}
      />
    </div>
  );
}
