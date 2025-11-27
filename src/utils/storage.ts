import { Message } from '../services/azureOpenAI';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface PinnedMessage {
  id: string;
  conversationId: string;
  message: Message;
  pinnedAt: number;
  note?: string;
}

export interface UISettings {
  sidebarCollapsed?: boolean;
  lastConversationId?: string;
}

const CONVERSATIONS_KEY = 'chatbot_conversations';
const PINNED_MESSAGES_KEY = 'chatbot_pinned_messages';
const UI_SETTINGS_KEY = 'chatbot_ui_settings';
const ACTIVE_CONVERSATION_KEY = 'chatbot_active_conversation';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all conversations
 */
export function getConversations(): Conversation[] {
  try {
    const data = localStorage.getItem(CONVERSATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
}

/**
 * Save a conversation
 */
export function saveConversation(conversation: Conversation): void {
  try {
    const conversations = getConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.unshift(conversation);
    }
    
    // Keep only last 50 conversations
    const trimmed = conversations.slice(0, 50);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(trimmed));
    
    console.log('💾 Conversation saved:', conversation.title);
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

/**
 * Get a conversation by ID
 */
export function getConversation(id: string): Conversation | null {
  const conversations = getConversations();
  return conversations.find(c => c.id === id) || null;
}

/**
 * Delete a conversation
 */
export function deleteConversation(id: string): void {
  try {
    const conversations = getConversations();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
    
    // Clear active conversation if it's the deleted one
    if (getActiveConversationId() === id) {
      setActiveConversationId(null);
    }
    
    console.log('🗑️ Conversation deleted:', id);
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
}

/**
 * Update conversation title
 */
export function updateConversationTitle(id: string, title: string): void {
  try {
    const conversations = getConversations();
    const conversation = conversations.find(c => c.id === id);
    
    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = Date.now();
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    }
  } catch (error) {
    console.error('Error updating conversation title:', error);
  }
}

/**
 * Toggle conversation pinned status
 */
export function toggleConversationPin(id: string): void {
  try {
    const conversations = getConversations();
    const conversation = conversations.find(c => c.id === id);
    
    if (conversation) {
      conversation.pinned = !conversation.pinned;
      conversation.updatedAt = Date.now();
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    }
  } catch (error) {
    console.error('Error toggling conversation pin:', error);
  }
}

/**
 * Get active conversation ID
 */
export function getActiveConversationId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
  } catch (error) {
    console.error('Error getting active conversation:', error);
    return null;
  }
}

/**
 * Set active conversation ID
 */
export function setActiveConversationId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    }
  } catch (error) {
    console.error('Error setting active conversation:', error);
  }
}

/**
 * Get pinned messages
 */
export function getPinnedMessages(): PinnedMessage[] {
  try {
    const data = localStorage.getItem(PINNED_MESSAGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading pinned messages:', error);
    return [];
  }
}

/**
 * Pin a message
 */
export function pinMessage(conversationId: string, message: Message, note?: string): void {
  try {
    const pinned = getPinnedMessages();
    const pinnedMessage: PinnedMessage = {
      id: generateId(),
      conversationId,
      message,
      pinnedAt: Date.now(),
      note,
    };
    
    pinned.unshift(pinnedMessage);
    
    // Keep only last 100 pinned messages
    const trimmed = pinned.slice(0, 100);
    localStorage.setItem(PINNED_MESSAGES_KEY, JSON.stringify(trimmed));
    
    console.log('📌 Message pinned');
  } catch (error) {
    console.error('Error pinning message:', error);
  }
}

/**
 * Unpin a message
 */
export function unpinMessage(id: string): void {
  try {
    const pinned = getPinnedMessages();
    const filtered = pinned.filter(p => p.id !== id);
    localStorage.setItem(PINNED_MESSAGES_KEY, JSON.stringify(filtered));
    
    console.log('📌 Message unpinned');
  } catch (error) {
    console.error('Error unpinning message:', error);
  }
}

/**
 * Get UI settings
 */
export function getUISettings(): UISettings {
  try {
    const data = localStorage.getItem(UI_SETTINGS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading UI settings:', error);
    return {};
  }
}

/**
 * Save UI settings
 */
export function saveUISettings(settings: UISettings): void {
  try {
    const current = getUISettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving UI settings:', error);
  }
}

/**
 * Clear all storage (for reset/debugging)
 */
export function clearAllStorage(): void {
  try {
    localStorage.removeItem(CONVERSATIONS_KEY);
    localStorage.removeItem(PINNED_MESSAGES_KEY);
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    console.log('🧹 All storage cleared');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}

/**
 * Export conversations as JSON
 */
export function exportConversations(): string {
  const conversations = getConversations();
  return JSON.stringify(conversations, null, 2);
}

/**
 * Import conversations from JSON
 */
export function importConversations(jsonData: string): boolean {
  try {
    const conversations = JSON.parse(jsonData);
    if (Array.isArray(conversations)) {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
      console.log('📥 Conversations imported');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing conversations:', error);
    return false;
  }
}
