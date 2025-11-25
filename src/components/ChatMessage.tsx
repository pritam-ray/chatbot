import { User, Bot } from 'lucide-react';
import { Message } from '../services/azureOpenAI';
import { formatText, renderMarkdown } from '../utils/markdown';

interface ChatMessageProps {
  message: Message;
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
              <div key={item.key} className={`${sizes[item.level - 1]} font-bold mt-4 mb-2 text-slate-800`}>
                <span dangerouslySetInnerHTML={{ __html: formatText(item.content) }} />
              </div>
            );

          case 'codeblock':
            return (
              <pre
                key={item.key}
                className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-700 text-slate-100 p-5 rounded-xl overflow-x-auto text-sm font-mono my-4 border border-slate-600 shadow-lg"
              >
                <code>{item.content}</code>
              </pre>
            );

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
                className="border-l-4 border-slate-400 pl-5 py-3 text-slate-700 italic bg-gradient-to-r from-slate-50 to-slate-100/50 my-3 rounded-r-lg shadow-sm"
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
    <div className={`flex gap-4 p-6 ${isUser ? 'bg-gradient-to-r from-slate-50 to-blue-50/40 border-l-4 border-slate-300' : 'bg-white border-l-4 border-blue-400/60 shadow-sm'}`}>
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center flex-none shadow-lg ${
          isUser ? 'bg-gradient-to-br from-slate-400 to-blue-400' : 'bg-gradient-to-br from-slate-500 to-blue-500'
        }`}
      >
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-slate-700 mb-2">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <div className="text-slate-700 leading-relaxed">
          {isUser ? (message.displayContent || message.content) : <RenderFormattedContent content={message.content} />}
        </div>
      </div>
    </div>
  );
}
