import { useState } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Message } from '../services/azureOpenAI';
import { formatText, renderMarkdown } from '../utils/markdown';

interface ChatMessageProps {
  message: Message;
}

function CodeBlock({ content, itemKey }: { content: string; itemKey: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div key={itemKey} className="relative group my-4">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2.5 bg-slate-700/80 hover:bg-slate-600 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
        title={copied ? 'Copied!' : 'Copy code'}
        aria-label={copied ? 'Code copied' : 'Copy code to clipboard'}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-slate-300" />
        )}
      </button>
      <pre className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6 rounded-2xl overflow-x-auto text-sm font-mono border border-slate-700/50 shadow-2xl ring-1 ring-white/5">
        <code>{content}</code>
      </pre>
    </div>
  );
}

function RenderFormattedContent({ content }: { content: string }) {
  const parsed = renderMarkdown(content);

  return (
    <>
      {parsed.map((item: any) => {
        switch (item.type) {
          case 'empty':
            return <div key={item.key} className="h-3" />;

          case 'heading':
            const sizes = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs'];
            return (
              <div key={item.key} className={`${sizes[item.level - 1]} font-bold mt-6 mb-3 bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 bg-clip-text text-transparent`}>
                <span dangerouslySetInnerHTML={{ __html: formatText(item.content) }} />
              </div>
            );

          case 'codeblock':
            return <CodeBlock key={item.key} content={item.content} itemKey={item.key} />;

          case 'bullet':
            return (
              <div key={item.key} className="ml-6 flex gap-3 my-1">
                <span className="text-slate-500 mt-0.5 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatText(item.content) }} />
              </div>
            );

          case 'numbered':
            return (
              <div key={item.key} className="ml-6 flex gap-3 my-1">
                <span className="text-slate-500 font-bold">{item.number}.</span>
                <span dangerouslySetInnerHTML={{ __html: formatText(item.content) }} />
              </div>
            );

          case 'blockquote':
            return (
              <div
                key={item.key}
                className="border-l-4 border-gradient-to-b from-blue-400 to-indigo-500 pl-6 py-4 text-slate-700 italic bg-gradient-to-r from-slate-50/80 via-blue-50/30 to-transparent my-4 rounded-r-xl shadow-md backdrop-blur-sm"
              >
                <span dangerouslySetInnerHTML={{ __html: formatText(item.content) }} />
              </div>
            );

          case 'divider':
            return <hr key={item.key} className="my-4 border-t-2 border-slate-200" />;

          default:
            return (
              <div key={item.key} className="mb-2">
                <span dangerouslySetInnerHTML={{ __html: formatText(item.content) }} />
              </div>
            );
        }
      })}
    </>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-5 p-6 transition-all ${isUser ? 'bg-gradient-to-r from-slate-50/80 via-blue-50/30 to-transparent border-l-4 border-slate-300/70' : 'bg-white/60 backdrop-blur-sm border-l-4 border-gradient-to-b from-blue-400 to-indigo-400 shadow-md hover:shadow-lg transition-shadow'}`}>
      <div
        className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center flex-none shadow-xl ring-2 ring-white/30 transition-transform hover:scale-105 ${
          isUser ? 'bg-gradient-to-br from-slate-500 via-blue-500 to-indigo-500' : 'bg-gradient-to-br from-slate-600 via-blue-600 to-indigo-600'
        }`}
      >
        {isUser ? <User className="w-5 h-5 text-white drop-shadow" /> : <Bot className="w-5 h-5 text-white drop-shadow" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <div className="text-slate-700 leading-relaxed">
          {isUser ? (message.displayContent || message.content) : <RenderFormattedContent content={message.content} />}
        </div>
      </div>
    </div>
  );
}
