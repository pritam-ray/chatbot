import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Pin,
  Edit2,
  Check,
  X,
  Download,
  Upload,
  Search,
  BookOpen,
  Folder,
} from 'lucide-react';
import {
  getConversations,
  deleteConversation,
  toggleConversationPin,
  updateConversationTitle,
  exportConversations,
  importConversations,
  Conversation,
} from '../utils/storage';

interface ConversationSidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onNewConversation: () => void;
}

export function ConversationSidebar({
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  const QUICK_ACTIONS = [
    { id: 'search', label: 'Search chats', icon: Search },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'projects', label: 'Projects', icon: Folder },
  ];

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const loadConversations = () => {
    const loaded = getConversations();
    const sorted = loaded.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
    setConversations(sorted);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      deleteConversation(id);
      loadConversations();
      if (activeConversationId === id) {
        onSelectConversation(null);
      }
    }
  };

  const handlePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleConversationPin(id);
    loadConversations();
  };

  const handleEdit = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      updateConversationTitle(id, editTitle.trim());
      loadConversations();
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleExport = () => {
    const json = exportConversations();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot-conversations-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (importConversations(content)) {
            loadConversations();
            alert('Conversations imported successfully!');
          } else {
            alert('Failed to import conversations. Invalid format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <aside className="w-72 bg-white dark:bg-[#171717] text-gray-900 dark:text-gray-100 flex flex-col h-full border-r border-black/10 dark:border-white/10">
      <div className="p-4 space-y-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          <span>Workspace</span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#2f2f2f] text-gray-600 dark:text-gray-300">Free</span>
        </div>

        <button
          onClick={onNewConversation}
          className="w-full bg-[#ececf1] dark:bg-[#2f2f2f] hover:bg-white dark:hover:bg-[#3a3a3a] text-[#202123] dark:text-[#ececf1] py-3 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors border border-black/10 dark:border-white/10"
          aria-label="New conversation"
        >
          <Plus className="w-5 h-5" />
          New chat
        </button>

        <div className="space-y-1">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2f2f2f]"
                aria-label={action.label}
              >
                <span className="p-2 rounded-xl bg-gray-100 dark:bg-[#2f2f2f]">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 text-left font-medium">{action.label}</span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Soon</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 text-[13px] text-gray-600 dark:text-gray-300">
          <button
            onClick={handleExport}
            className="flex-1 bg-gray-100 dark:bg-[#2f2f2f] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] text-gray-800 dark:text-gray-200 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            title="Export conversations"
            aria-label="Export conversations"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={handleImport}
            className="flex-1 bg-gray-100 dark:bg-[#2f2f2f] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] text-gray-800 dark:text-gray-200 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            title="Import conversations"
            aria-label="Import conversations"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <p className="px-2 text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Recents</p>
        {conversations.length === 0 ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-12">
            <p>No conversations yet</p>
            <p className="text-xs mt-1">Start chatting to see them appear here.</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`group relative px-3 py-2 rounded-xl cursor-pointer text-sm transition-all border ${
                activeConversationId === conversation.id
                  ? 'bg-[#f3f5f9] dark:bg-[#2f2f2f] text-[#202123] dark:text-[#ececf1] border-[#cfd7e3] dark:border-[#444444] shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2f2f2f] border-transparent'
              }`}
              role="button"
              tabIndex={0}
              aria-label={`Conversation: ${conversation.title}`}
            >
              {editingId === conversation.id ? (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(conversation.id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="flex-1 bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-white/20 rounded px-2 py-1 text-sm text-gray-800 dark:text-gray-200 focus:outline-none"
                    autoFocus
                    aria-label="Edit conversation title"
                  />
                  <button
                    onClick={() => handleSaveEdit(conversation.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] rounded"
                    aria-label="Save title"
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] rounded"
                    aria-label="Cancel edit"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <MessageSquare className={`w-4 h-4 ${activeConversationId === conversation.id ? 'text-[#202123] dark:text-[#ececf1]' : 'text-gray-400 dark:text-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate">{conversation.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(conversation.updatedAt)} • {conversation.messages.length} messages
                      </p>
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handlePin(conversation.id, e)}
                      className="p-1.5 hover:bg-gray-200 rounded"
                      title={conversation.pinned ? 'Unpin' : 'Pin'}
                      aria-label={conversation.pinned ? 'Unpin conversation' : 'Pin conversation'}
                    >
                      <Pin
                        className={`w-3.5 h-3.5 ${
                          conversation.pinned ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => handleEdit(conversation, e)}
                      className="p-1.5 hover:bg-gray-200 rounded"
                      title="Rename"
                      aria-label="Rename conversation"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(conversation.id, e)}
                      className="p-1.5 hover:bg-gray-200 rounded"
                      title="Delete"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-black/5 space-y-3">
        <button className="w-full bg-[#10a37f] text-white rounded-2xl py-2.5 text-sm font-semibold hover:bg-[#0d8a69] transition-all">
          Upgrade plan
        </button>
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-gray-100">
          <div className="w-9 h-9 rounded-full bg-white border border-black/5 flex items-center justify-center font-semibold">PR</div>
          <div className="text-sm">
            <p className="font-medium text-[#202123]">Pritam Ray</p>
            <p className="text-gray-500 text-xs">pritam@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
