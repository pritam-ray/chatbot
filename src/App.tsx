import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { CacheManager } from './components/CacheManager';
import { ThemeSettings } from './components/ThemeSettings';
import { ConversationSidebar } from './components/ConversationSidebar';
import { Message, streamChatCompletion } from './services/azureOpenAI';
import { getCachedResponse, setCachedResponse, cleanExpiredCache } from './utils/cache';
import { useTheme } from './contexts/ThemeContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import {
  generateId,
  saveConversation,
  getConversation,
  getActiveConversationId,
  setActiveConversationId,
  Conversation,
} from './utils/storage';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toggleTheme } = useTheme();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Save conversation whenever messages change
  const saveCurrentConversation = useCallback(() => {
    if (messages.length === 0) return;
    
    const conversationId = currentConversationId || generateId();
    
    // Generate title from first user message
    const firstUserMessage = messages.find(m => m.role === 'user');
    const title = firstUserMessage
      ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
      : 'New Conversation';
    
    const conversation: Conversation = {
      id: conversationId,
      title,
      messages,
      createdAt: currentConversationId ? (getConversation(conversationId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
    };
    
    saveConversation(conversation);
    
    if (!currentConversationId) {
      setCurrentConversationId(conversationId);
      setActiveConversationId(conversationId);
    }
  }, [messages, currentConversationId]);

  useEffect(() => {
    scrollToBottom();
    saveCurrentConversation();
  }, [messages, scrollToBottom, saveCurrentConversation]);

  // Clean expired cache on mount and load active conversation
  useEffect(() => {
    cleanExpiredCache();
    
    // Load active conversation
    const activeId = getActiveConversationId();
    if (activeId) {
      const conversation = getConversation(activeId);
      if (conversation) {
        setCurrentConversationId(conversation.id);
        setMessages(conversation.messages);
      }
    }
  }, []);

  // Handler functions - must be defined before useKeyboardShortcuts
  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setActiveConversationId(null);
  };

  const handleSelectConversation = (id: string | null) => {
    if (!id) {
      handleNewConversation();
      return;
    }
    
    const conversation = getConversation(id);
    if (conversation) {
      setMessages(conversation.messages);
      setCurrentConversationId(conversation.id);
      setActiveConversationId(conversation.id);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 't',
      ctrlKey: true,
      shiftKey: true,
      description: 'Toggle theme',
      handler: toggleTheme,
    },
    {
      key: '/',
      ctrlKey: true,
      description: 'Focus input',
      handler: () => {
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        input?.focus();
      },
    },
    {
      key: 'c',
      ctrlKey: true,
      shiftKey: true,
      description: 'Clear chat',
      handler: () => {
        if (window.confirm('Clear all messages?')) {
          handleNewConversation();
        }
      },
    },
    {
      key: 'n',
      ctrlKey: true,
      description: 'New conversation',
      handler: handleNewConversation,
    },
  ]);

  const handleSendMessage = async (content: string, displayContent?: string) => {
    const userMessage: Message = {
      role: 'user',
      content, // Full content for API
      displayContent: displayContent || content, // Display content for UI
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const messageHistory = [...messages, userMessage];

      // Check cache first
      const cachedResponse = getCachedResponse(messageHistory);
      
      if (cachedResponse) {
        // Use cached response
        const assistantMessage: Message = {
          role: 'assistant',
          content: cachedResponse,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // No cache hit, stream from API
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      for await (const chunk of streamChatCompletion(messageHistory)) {
        assistantMessage.content += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...assistantMessage };
          return newMessages;
        });
      }

      // Cache the complete response
      if (assistantMessage.content) {
        setCachedResponse(messageHistory, assistantMessage.content);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        activeConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        <header className="bg-gradient-to-r from-slate-800 via-theme-primary to-theme-secondary dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 backdrop-blur-sm border-b border-white/10 dark:border-slate-800 shadow-2xl relative" role="banner">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-4 relative z-10">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm" aria-hidden="true">
            <MessageSquare className="w-6 h-6 text-white drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-lg flex-1">AI Chatbot</h1>
          <nav className="flex items-center gap-2" aria-label="Main navigation">
            <ThemeSettings />
            <CacheManager />
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto" role="main" aria-label="Chat conversation">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center" role="region" aria-label="Welcome screen">
            <div className="text-center space-y-8 p-10">
              <div className="inline-flex p-8 bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-3xl shadow-2xl ring-1 ring-slate-200/50 dark:ring-slate-700/50 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/40 dark:from-white/5 to-transparent rounded-3xl"></div>
                <MessageSquare className="w-24 h-24 text-slate-700 dark:text-slate-300 relative z-10" />
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                  Start a conversation
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md text-lg mx-auto leading-relaxed">
                  Ask me anything! I'm powered by Azure OpenAI and ready to help you.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-5 p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-l-4 border-theme-primary dark:border-theme-primary/80 shadow-lg dark:shadow-slate-950/50 rounded-r-lg mx-2">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-slate-600 via-theme-primary to-theme-accent dark:from-slate-700 dark:via-theme-primary dark:to-theme-accent flex items-center justify-center shadow-xl ring-2 ring-white/20 dark:ring-slate-700/30">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">
                    AI Assistant
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-theme-primary rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-theme-primary rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-theme-primary rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}

export default App;
