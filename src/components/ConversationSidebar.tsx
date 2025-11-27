import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Pin, Edit2, Check, X, Download, Upload } from 'lucide-react';
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const loadConversations = () => {
    const loaded = getConversations();
    // Sort: pinned first, then by updated date
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
    <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onNewConversation}
          className="w-full bg-gradient-to-r from-theme-primary to-theme-secondary text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
          aria-label="New conversation"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleExport}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
            title="Export conversations"
            aria-label="Export conversations"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleImport}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
            title="Import conversations"
            aria-label="Import conversations"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No conversations yet.
              <br />
              Start a new chat!
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`group relative p-3 rounded-xl cursor-pointer transition-colors ${
                  activeConversationId === conversation.id
                    ? 'bg-theme-primary/10 dark:bg-theme-primary/20 border border-theme-primary/30'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
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
                      className="flex-1 bg-white dark:bg-slate-800 border border-theme-primary rounded px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
                      autoFocus
                      aria-label="Edit conversation title"
                    />
                    <button
                      onClick={() => handleSaveEdit(conversation.id)}
                      className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                      aria-label="Save title"
                    >
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      aria-label="Cancel edit"
                    >
                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {conversation.title}
                          </h3>
                          {conversation.pinned && (
                            <Pin className="w-3 h-3 text-theme-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {conversation.messages.length} messages • {formatDate(conversation.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handlePin(conversation.id, e)}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        title={conversation.pinned ? 'Unpin' : 'Pin'}
                        aria-label={conversation.pinned ? 'Unpin conversation' : 'Pin conversation'}
                      >
                        <Pin
                          className={`w-3.5 h-3.5 ${
                            conversation.pinned
                              ? 'text-theme-primary fill-theme-primary'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => handleEdit(conversation, e)}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        title="Rename"
                        aria-label="Rename conversation"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(conversation.id, e)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        title="Delete"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
