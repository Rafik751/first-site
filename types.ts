export enum Role {
  User = 'user',
  Model = 'model',
  System = 'system'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  snippet: string;
}

export type ViewMode = 'chat' | 'articles';

export interface AppState {
  currentSessionId: string | null;
  sessions: Record<string, ChatSession>;
  articles: Article[];
  viewMode: ViewMode;
  isSidebarOpen: boolean;
  isLoading: boolean;
}