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
              <div key={item.key} className={`${sizes[item.level - 1]} font-bold mt-4 mb-2 text-blue-900`}>
                <span dangerouslySetInnerHTML={{ __html: formatText(item.content) }} />
              </div>
            );

          case 'codeblock':
            return (
              <pre
                key={item.key}
                className="bg-gradient-to-br from-blue-950 to-blue-900 text-blue-50 p-5 rounded-xl overflow-x-auto text-sm font-mono my-4 border-2 border-blue-800 shadow-lg"
              >
                <code>{item.content}</code>
              </pre>
            );

          case 'bullet':
            return (
              <div key={item.key} className="ml-6 flex gap-3 my-1">
                <span className="text-blue-600 mt-0.5 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatText(item.content) }} />
              </div>
            );

          case 'numbered':
            return (
              <div key={item.key} className="ml-6 flex gap-3 my-1">
                <span className="text-blue-600 font-bold">{item.number}.</span>
                <span dangerouslySetInnerHTML={{ __html: formatText(item.content) }} />
              </div>
            );

          case 'blockquote':
            return (
              <div
                key={item.key}
                className="border-l-4 border-blue-500 pl-5 py-3 text-blue-900 italic bg-gradient-to-r from-blue-50 to-blue-100 my-3 rounded-r-lg shadow-sm"
              >
                <span dangerouslySetInnerHTML={{ __html: formatText(item.content) }} />
              </div>
            );

          case 'divider':
            return <hr key={item.key} className="my-4 border-t-2 border-blue-300" />;

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
    <div className={`flex gap-4 p-6 ${isUser ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-white border-l-4 border-blue-500 shadow-sm'}`}>
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center flex-none shadow-md ${
          isUser ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-blue-600 to-blue-700'
        }`}
      >
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-blue-900 mb-2">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <div className="text-gray-800 leading-relaxed">
          {isUser ? message.content : <RenderFormattedContent content={message.content} />}
        </div>
      </div>
    </div>
  );
}
