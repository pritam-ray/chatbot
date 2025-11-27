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
} from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { CacheManager } from './components/CacheManager';
import { ThemeSettings } from './components/ThemeSettings';
import { ConversationSidebar } from './components/ConversationSidebar';
import { CodeSandbox } from './components/CodeSandbox';
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

const FOLLOW_UP_PROMPTS = [
  {
    id: 'poem',
    label: 'Write me a poem in the style of Edgar Allan Poe.',
    prompt: 'Write me a poem in the style of Edgar Allan Poe.',
  },
  {
    id: 'ai-fun',
    label: "What's something fun I can make with AI today?",
    prompt: "What's something fun I can make with AI today?",
  },
  {
    id: 'space-fact',
    label: 'Tell me an interesting fact about space.',
    prompt: 'Tell me an interesting fact about space.',
  },
];

const QUICK_PROMPTS = [
  {
    id: 'lesson-plan',
    title: 'Plan a lightning presentation',
    description: 'Turn a messy idea into tight talking points.',
    icon: Sparkles,
    prompt: 'Help me craft a five-minute presentation outline about upcoming AI trends for product teams.',
  },
  {
    id: 'code-review',
    title: 'Explain this code',
    description: 'Get human-style walkthroughs of tricky snippets.',
    icon: Code2,
    prompt: 'Explain what this React hook is doing and suggest optimizations:\n\nfunction useData(url) {\n  const [data, setData] = useState(null);\n  useEffect(() => {\n    fetch(url).then((res) => res.json()).then(setData);\n  }, [url]);\n  return data;\n}',
  },
  {
    id: 'meeting-notes',
    title: 'Summarize notes',
    description: 'Pull action items and owners instantly.',
    icon: NotebookPen,
    prompt: 'Summarize these meeting notes into 3 takeaways with owners and deadlines: \n- Design wants final copy by Friday\n- Backend estimates API v2 ready in 2 sprints\n- Need launch checklist for onboarding.',
  },
  {
    id: 'brainstorm',
    title: 'Brainstorm campaigns',
    description: 'Get creative variations fast.',
    icon: Lightbulb,
    prompt: 'Brainstorm 4 fresh campaign ideas for a fintech startup that helps freelancers get paid faster.',
  },
];

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isCodeSandboxOpen, setIsCodeSandboxOpen] = useState(false);
  const [sandboxCode, setSandboxCode] = useState<string>('');
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
    <div className="flex h-screen bg-[#f7f7f8] text-[#202123]">
      <ConversationSidebar
        activeConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      <div className="flex flex-col flex-1 bg-[#f7f7f8]">
        <header className="border-b border-black/5 bg-[#f7f7f8]/95 backdrop-blur-sm" role="banner">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <span>ChatGPT</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" aria-hidden="true" />
                </div>
                <button className="px-3 py-1 rounded-full text-sm font-semibold text-[#6d3ef8] bg-[#f4edff] border border-[#e2d4ff]">
                  + Free offer
                </button>
              </div>
              <p className="text-sm text-gray-500">Azure OpenAI assistant · Always learning</p>
            </div>
            <nav className="flex items-center gap-2" aria-label="Main navigation">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-white border border-black/10 text-gray-600">Free Research Preview</span>
              <button
                className="p-2.5 rounded-xl border border-black/10 bg-white text-gray-700 hover:bg-[#ececf1]"
                aria-label="Share conversation"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                className="p-2.5 rounded-xl border border-black/10 bg-white text-gray-700 hover:bg-[#ececf1]"
                aria-label="Add collaborators"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCodeSandboxOpen(true)}
                className="p-2.5 rounded-xl border border-black/10 bg-white text-gray-700 hover:bg-[#ececf1]"
                aria-label="Open JavaScript Sandbox"
              >
                <Code2 className="w-4 h-4" />
              </button>
              <ThemeSettings />
              <CacheManager />
              <button
                className="p-2.5 rounded-xl border border-black/10 bg-white text-gray-700 hover:bg-[#ececf1]"
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
              <div className="space-y-6" role="region" aria-label="Welcome screen">
                <div className="bg-white border border-black/5 rounded-[32px] p-10 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-gray-500 text-sm">
                    <div className="w-10 h-10 rounded-full bg-[#10a37f]/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-[#10a37f]" />
                    </div>
                    <div className="flex items-center gap-1 text-[15px] text-[#202123]">
                      <span>ChatGPT</span>
                      <span role="img" aria-label="smile">🙂</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">Hi! How can I help you today?</p>
                    <p className="text-gray-500 mt-1">Follow up with one of these quick ideas.</p>
                  </div>
                </div>

                <div className="bg-white border border-black/5 rounded-[32px] shadow-sm">
                  <p className="px-6 pt-6 pb-3 text-xs uppercase tracking-[0.2em] text-gray-500">Follow up</p>
                  <div className="divide-y divide-black/5">
                    {FOLLOW_UP_PROMPTS.map(({ id, label, prompt }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="w-full flex items-center justify-between px-6 py-4 text-left text-[#202123] hover:bg-[#f5f5f7]"
                      >
                        <span>{label}</span>
                        <ArrowUpRight className="w-5 h-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {QUICK_PROMPTS.map(({ id, title, description, icon: Icon, prompt }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left bg-white border border-black/5 rounded-3xl p-5 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#10a37f]/30"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-10 h-10 rounded-full bg-[#f0f4f9] flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[#202123]" />
                        </div>
                        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-[#202123]">{title}</h3>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} onRunCode={handleRunCode} />
                ))}
                {isLoading && (
                  <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#10a37f]/10 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-[#10a37f]" />
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
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
    </div>
  );
}

export default App;
