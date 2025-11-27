import { useEffect, useRef } from 'react';
import {
  User,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { Message } from '../services/azureOpenAI';
import { renderMarkdownToHTML } from '../utils/markdown';
import 'katex/dist/katex.min.css';

interface ChatMessageProps {
  message: Message;
  onRunCode?: (code: string) => void;
}

function MarkdownContent({ content, onRunCode }: { content: string; onRunCode?: (code: string) => void }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // Add copy buttons and run buttons to code blocks after rendering
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
        
        // Check if this is JavaScript/HTML code and add run button
        const language = codeElement.className.match(/language-(\w+)/)?.[1];
        const isRunnable = language === 'javascript' || language === 'js' || language === 'html';
        
        // Wrap pre in relative container for absolute positioning
        const wrapper = document.createElement('div');
        wrapper.className = 'relative group';
        block.parentNode?.insertBefore(wrapper, block);
        wrapper.appendChild(block);
        
        if (isRunnable && onRunCode) {
          // Add run button
          const runButton = document.createElement('button');
          runButton.className = 'copy-button absolute top-3 right-16 p-2.5 bg-green-700/80 hover:bg-green-600 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-110 active:scale-95';
          runButton.setAttribute('aria-label', 'Run code in sandbox');
          runButton.innerHTML = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
          
          runButton.addEventListener('click', () => {
            const code = codeElement.textContent || '';
            onRunCode(code);
          });
          
          wrapper.appendChild(runButton);
        }
        
        wrapper.appendChild(copyButton);
      });
    }
  }, [content, onRunCode]);

  const html = renderMarkdownToHTML(content);

  return (
    <div 
      ref={contentRef}
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

export function ChatMessage({ message, onRunCode }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <article
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}
      aria-label={isUser ? 'User message' : 'AI Assistant message'}
    >
      {!isUser && (
        <div
          className="w-11 h-11 rounded-full bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center mr-4 shrink-0"
          aria-hidden="true"
        >
          <Bot className="w-5 h-5" />
        </div>
      )}

      <div className={`group ${isUser ? 'max-w-[70%]' : 'flex-1'} space-y-3`}>
        <div
          className={`rounded-[28px] px-6 py-5 text-[15px] leading-7 shadow-sm ${
            isUser
              ? 'bg-[#e8edf3] text-[#202123] ml-auto'
              : 'bg-white border border-black/5 text-[#202123]'
          }`}
        >
          {!isUser && <div className="text-sm font-semibold mb-2">ChatGPT</div>}
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.displayContent || message.content}</p>
          ) : (
            <MarkdownContent content={message.content} onRunCode={onRunCode} />
          )}
        </div>

        {!isUser && (
          <div className="flex items-center justify-end gap-1 text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {[
              { id: 'up', icon: ThumbsUp, label: 'Good response' },
              { id: 'down', icon: ThumbsDown, label: 'Bad response' },
              { id: 'copy', icon: Copy, label: 'Copy response' },
              { id: 'refresh', icon: RefreshCw, label: 'Regenerate' },
              { id: 'share', icon: Share2, label: 'Share response' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label={label}
                title={`${label} (coming soon)`}
                disabled
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div
          className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center ml-4 shrink-0"
          aria-hidden="true"
        >
          <User className="w-5 h-5" />
        </div>
      )}
    </article>
  );
}
