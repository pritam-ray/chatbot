import { useEffect, useRef } from 'react';
import { User, Bot } from 'lucide-react';
import { Message } from '../services/azureOpenAI';
import { renderMarkdownToHTML } from '../utils/markdown';
import 'katex/dist/katex.min.css';

interface ChatMessageProps {
  message: Message;
}

function MarkdownContent({ content }: { content: string }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // Add copy buttons to code blocks after rendering
      const codeBlocks = contentRef.current.querySelectorAll('pre.code-block');
      
      codeBlocks.forEach((block) => {
        const codeElement = block.querySelector('code');
        if (!codeElement) return;
        
        // Check if copy button already exists
        if (block.querySelector('.copy-button')) return;
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button absolute top-3 right-3 p-2.5 bg-slate-700/80 hover:bg-slate-600 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-110 active:scale-95';
        copyButton.setAttribute('aria-label', 'Copy code to clipboard');
        copyButton.innerHTML = `<svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
        
        copyButton.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(codeElement.textContent || '');
            copyButton.innerHTML = `<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            setTimeout(() => {
              copyButton.innerHTML = `<svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
            }, 2000);
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        });
        
        // Wrap pre in relative container for absolute positioning
        const wrapper = document.createElement('div');
        wrapper.className = 'relative group';
        block.parentNode?.insertBefore(wrapper, block);
        wrapper.appendChild(block);
        wrapper.appendChild(copyButton);
      });
    }
  }, [content]);

  const html = renderMarkdownToHTML(content);

  return (
    <div 
      ref={contentRef}
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div 
      className={`flex gap-5 p-6 transition-all ${
        isUser 
          ? 'bg-slate-50/80 dark:bg-slate-800/40 border-l-4 border-slate-300/70 dark:border-slate-600/50' 
          : 'bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border-l-4 border-theme-primary dark:border-theme-primary/80 shadow-md hover:shadow-lg dark:shadow-slate-950/50 transition-shadow'
      }`}
      role="article"
      aria-label={isUser ? 'User message' : 'AI Assistant message'}
    >
      <div
        className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center flex-none shadow-xl ring-2 ring-white/30 dark:ring-slate-700/30 transition-transform hover:scale-105 ${
          isUser 
            ? 'bg-gradient-to-br from-slate-500 via-theme-primary to-theme-secondary dark:from-slate-600 dark:via-theme-primary dark:to-theme-secondary' 
            : 'bg-gradient-to-br from-slate-600 via-theme-primary to-theme-accent dark:from-slate-700 dark:via-theme-primary dark:to-theme-accent'
        }`}
        aria-hidden="true"
      >
        {isUser ? <User className="w-5 h-5 text-white drop-shadow" /> : <Bot className="w-5 h-5 text-white drop-shadow" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
          {isUser ? (message.displayContent || message.content) : <MarkdownContent content={message.content} />}
        </div>
      </div>
    </div>
  );
}
