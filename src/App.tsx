import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  ChevronDown,
  Share2,
  UserPlus,
  MoreHorizontal,
  Sparkles,
  Code2,
  NotebookPen,
  Lightbulb,
  ArrowUpRight,
  Image as ImageIcon,
} from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { CacheManager } from './components/CacheManager';
import { ThemeSettings } from './components/ThemeSettings';
import { ConversationSidebar } from './components/ConversationSidebar';
import { CodeSandbox } from './components/CodeSandbox';
import { ImageGenerationPanel } from './components/ImageGenerationPanel';
import { Message, Attachment, streamChatCompletion } from './services/azureOpenAI';
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

const HERO_ACTIONS = [
  {
    id: 'news-recaps',
    label: 'Catch me up on AI news',
    prompt: 'Give me three concise bullet points that summarize the most important AI news stories from this week.',
  },
  {
    id: 'code-review',
    label: 'Explain the code I paste',
    prompt: 'Review the code I provide and explain what it does, calling out potential issues or optimizations.',
  },
  {
    id: 'summarize-notes',
    label: 'Summarize this meeting for me',
    prompt: 'Summarize this meeting transcript into 3 takeaways, 3 action items, and owners for each.',
  },
  {
    id: 'idea-storm',
    label: 'Brainstorm launch ideas',
    prompt: 'Brainstorm 5 creative product launch ideas for a fintech startup that helps freelancers get paid faster.',
  },
];

const QUICK_PROMPTS = [
  {
    id: 'lesson-plan',
    title: 'Plan a lightning presentation',
    description: 'Turn a messy idea into tight talking points.',
    icon: Sparkles,
    prompt: 'Help me craft a five-minute presentation outline about upcoming AI trends for product teams.',
    eyebrow: 'Present',
    gradient: 'from-[#f8f1ff] via-[#f3f6ff] to-[#eef9ff]',
    accent: 'text-[#8b5cf6]',
  },
  {
    id: 'code-review',
    title: 'Explain this code',
    description: 'Get human-style walkthroughs of tricky snippets.',
    icon: Code2,
    prompt: 'Explain what this React hook is doing and suggest optimizations:\n\nfunction useData(url) {\n  const [data, setData] = useState(null);\n  useEffect(() => {\n    fetch(url).then((res) => res.json()).then(setData);\n  }, [url]);\n  return data;\n}',
    eyebrow: 'Debug',
    gradient: 'from-[#eef5ff] via-[#edf9ff] to-[#f4f1ff]',
    accent: 'text-[#2563eb]',
  },
  {
    id: 'meeting-notes',
    title: 'Summarize notes',
    description: 'Pull action items and owners instantly.',
    icon: NotebookPen,
    prompt: 'Summarize these meeting notes into 3 takeaways with owners and deadlines: \n- Design wants final copy by Friday\n- Backend estimates API v2 ready in 2 sprints\n- Need launch checklist for onboarding.',
    eyebrow: 'Catch up',
    gradient: 'from-[#fdf6ed] via-[#f7f1ff] to-[#eef7ff]',
    accent: 'text-[#f97316]',
  },
  {
    id: 'brainstorm',
    title: 'Brainstorm campaigns',
    description: 'Get creative variations fast.',
    icon: Lightbulb,
    prompt: 'Brainstorm 4 fresh campaign ideas for a fintech startup that helps freelancers get paid faster.',
    eyebrow: 'Create',
    gradient: 'from-[#ecfdf5] via-[#f1f4ff] to-[#f5efff]',
    accent: 'text-[#10b981]',
  },
];

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isCodeSandboxOpen, setIsCodeSandboxOpen] = useState(false);
  const [sandboxCode, setSandboxCode] = useState<string>('');
  const [showImageGenPanel, setShowImageGenPanel] = useState(false);
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

  const handleRunCode = (code: string) => {
    setSandboxCode(code);
    setIsCodeSandboxOpen(true);
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
        const textarea = document.querySelector('textarea');
        (textarea as HTMLTextAreaElement | null)?.focus();
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
    {
      key: 'e',
      ctrlKey: true,
      shiftKey: true,
      description: 'Open code sandbox',
      handler: () => setIsCodeSandboxOpen(true),
    },
  ]);

  const handleSendMessage = async (content: string, displayContent?: string, attachments?: Attachment[]) => {
    const userMessage: Message = {
      role: 'user',
      content, // Full content for API
      displayContent: displayContent || content, // Display content for UI
      attachments: attachments || [],
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
    <div className="flex h-screen bg-[#f7f7f8] dark:bg-[#212121] text-[#202123] dark:text-[#ececf1]">
      <ConversationSidebar
        activeConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      <div className="flex flex-col flex-1 bg-[#f7f7f8] dark:bg-[#212121]">
        <header className="border-b border-black/5 dark:border-white/10 bg-[#f7f7f8]/95 dark:bg-[#212121]/95 backdrop-blur-sm" role="banner">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <span>ChatGPT</span>
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                </div>
                <button className="px-3 py-1 rounded-full text-sm font-semibold text-[#6d3ef8] bg-[#f4edff] dark:bg-[#6d3ef8]/20 border border-[#e2d4ff] dark:border-[#6d3ef8]/30">
                  + Free offer
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Azure OpenAI assistant · Always learning</p>
            </div>
            <nav className="flex items-center gap-2" aria-label="Main navigation">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-300">Free Research Preview</span>
              <button
                className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2f2f2f] text-gray-700 dark:text-gray-200 hover:bg-[#ececf1] dark:hover:bg-[#3f3f3f]"
                aria-label="Share conversation"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2f2f2f] text-gray-700 dark:text-gray-200 hover:bg-[#ececf1] dark:hover:bg-[#3f3f3f]"
                aria-label="Add collaborators"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCodeSandboxOpen(true)}
                className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2f2f2f] text-gray-700 dark:text-gray-200 hover:bg-[#ececf1] dark:hover:bg-[#3f3f3f]"
                aria-label="Open JavaScript Sandbox"
              >
                <Code2 className="w-4 h-4" />
              </button>
              <ThemeSettings />
              <CacheManager />
              <button
                className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2f2f2f] text-gray-700 dark:text-gray-200 hover:bg-[#ececf1] dark:hover:bg-[#3f3f3f]"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" role="main" aria-label="Chat conversation">
          <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-8" role="region" aria-label="Welcome screen">
                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <section className="relative overflow-hidden rounded-[36px] border border-black/5 dark:border-white/10 bg-gradient-to-br from-[#f5f2ff] via-[#eef5ff] to-[#f0fbf4] dark:from-[#1d1f2b] dark:via-[#1e2437] dark:to-[#142521] shadow-sm">
                    <div className="absolute inset-0 opacity-60 pointer-events-none">
                      <div className="absolute -top-24 -right-12 w-72 h-72 bg-gradient-to-br from-[#b5a8ff] via-transparent to-transparent rounded-full blur-3xl" />
                      <div className="absolute -bottom-32 -left-10 w-80 h-80 bg-gradient-to-br from-[#8af1d8] via-transparent to-transparent rounded-full blur-3xl" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)]" />
                    </div>
                    <div className="relative z-10 p-8 space-y-6">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 text-[#202123] dark:text-[#ececf1] text-xs font-semibold tracking-wide">Default</span>
                        <span className="font-semibold text-[#10a37f] dark:text-[#7ee3c7]">GPT-4o mini</span>
                        <span>Fast · Reliable · Multimodal</span>
                      </div>
                      <div className="space-y-3">
                        <h1 className="text-3xl sm:text-4xl font-semibold text-[#202123] dark:text-white">How can I help you today?</h1>
                        <p className="text-base text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                          Get instant answers, write or build anything, and take action across docs, images, and audio — all in one familiar ChatGPT space.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3" aria-label="Suggested quick actions">
                        {HERO_ACTIONS.map(({ id, label, prompt }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => handleSendMessage(prompt)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/60 dark:border-white/15 bg-white/90 dark:bg-white/5 text-sm font-medium text-[#202123] dark:text-[#ececf1] shadow-sm hover:bg-white dark:hover:bg-white/10"
                          >
                            <span>{label}</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {QUICK_PROMPTS.map(({ id, title, description, icon: Icon, prompt, eyebrow, gradient, accent }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className={`relative overflow-hidden text-left rounded-3xl border border-black/5 dark:border-white/10 p-5 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#10a37f]/30 bg-gradient-to-br ${gradient}`}
                      >
                        <div className="absolute -right-6 -top-8 w-32 h-32 bg-white/20 dark:bg-white/5 rounded-full blur-3xl" aria-hidden="true" />
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-6">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">{eyebrow}</p>
                              <h3 className="mt-2 text-base font-semibold text-[#202123] dark:text-[#ececf1]">{title}</h3>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl border border-white/60 dark:border-white/15 bg-white/80 dark:bg-white/5 flex items-center justify-center ${accent}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex-1">{description}</p>
                          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#10a37f] dark:text-[#7ee3c7]">
                            Open
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} onRunCode={handleRunCode} />
                ))}
                {isLoading && (
                  <div className="bg-white dark:bg-[#2f2f2f] border border-black/5 dark:border-white/10 rounded-3xl p-6 shadow-sm flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#10a37f]/10 dark:bg-[#10a37f]/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-[#10a37f]" />
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="w-2 h-2 bg-[#10a37f] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-[#10a37f] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-[#10a37f] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>

      {isCodeSandboxOpen && (
        <CodeSandbox
          initialCode={sandboxCode || "// Write your JavaScript code here\nconsole.log('Hello, World!');\n\n// Try these examples:\n// console.log(2 + 2);\n// console.log(['apple', 'banana', 'cherry']);\n// console.log({ name: 'John', age: 30 });"}
          onClose={() => {
            setIsCodeSandboxOpen(false);
            setSandboxCode('');
          }}
        />
      )}

      {showImageGenPanel && (
        <ImageGenerationPanel
          onClose={() => setShowImageGenPanel(false)}
          onImagesGenerated={(images) => {
            // Add generated images as an assistant message
            const imageMessage: Message = {
              role: 'assistant',
              content: 'I generated the images you requested:',
              generatedImages: images,
            };
            setMessages(prev => [...prev, imageMessage]);
            scrollToBottom();
          }}
        />
      )}

      {/* Floating Action Button for Image Generation */}
      <button
        onClick={() => setShowImageGenPanel(true)}
        className="fixed bottom-24 right-8 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40"
        title="Generate Images with DALL-E"
        aria-label="Generate Images"
      >
        <ImageIcon className="w-6 h-6" />
      </button>
    </div>
  );
}

export default App;
