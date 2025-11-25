import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HashRouter } from 'react-router-dom';
import { Role, Message, ChatSession, Article, ViewMode } from './types';
import { streamChatResponse } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { SendIcon, PlusIcon, MenuIcon, GithubIcon, TrashIcon, ArticleIcon, CloseIcon, MessageSquareIcon, EditIcon, CheckIcon, DownloadIcon } from './components/Icons';

function App() {
  // --- State ---
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  
  // Data State
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Initialization ---
  useEffect(() => {
    // Load from LocalStorage if available
    const savedSessions = localStorage.getItem('gemini_sessions');
    const savedArticles = localStorage.getItem('gemini_articles');
    
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    if (savedArticles) setArticles(JSON.parse(savedArticles));

    // If no sessions, create default
    if (!savedSessions) {
      const initialId = Date.now().toString();
      const initialSession: ChatSession = {
        id: initialId,
        title: 'New Conversation',
        messages: [{
          id: 'welcome',
          role: Role.Model,
          content: 'Hello! I am your Gemini AI assistant. You can ask me to write articles for you, and then save them to your library.\n\nمرحباً! أنا مساعد الذكاء الاصطناعي جيمناي. يمكنك أن تطلب مني كتابة مقالات لك، ثم حفظها في مكتبتك.',
          timestamp: Date.now()
        }],
        updatedAt: Date.now()
      };
      setSessions({ [initialId]: initialSession });
      setCurrentSessionId(initialId);
    } else {
        // Set most recent session
        const sessionKeys = Object.keys(JSON.parse(savedSessions));
        if (sessionKeys.length > 0) setCurrentSessionId(sessionKeys[sessionKeys.length - 1]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to LocalStorage
  useEffect(() => {
    if (Object.keys(sessions).length > 0) {
        localStorage.setItem('gemini_sessions', JSON.stringify(sessions));
    }
    localStorage.setItem('gemini_articles', JSON.stringify(articles));
  }, [sessions, articles]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (viewMode === 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessions, currentSessionId, viewMode]);

  // Handle Input Height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // --- Logic Helpers ---

  const getCurrentMessages = () => {
    if (!currentSessionId || !sessions[currentSessionId]) return [];
    return sessions[currentSessionId].messages;
  };

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => ({ ...prev, [newId]: newSession }));
    setCurrentSessionId(newId);
    setViewMode('chat');
    setIsEditing(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const newSessions = { ...prev };
      delete newSessions[id];
      if (Object.keys(newSessions).length === 0) {
          // Keep at least one session logic could go here
      }
      return newSessions;
    });
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const saveToArticles = (content: string) => {
    const lines = content.split('\n');
    const titleLine = lines.find(l => l.trim().length > 0) || 'Untitled Article';
    const cleanTitle = titleLine.replace(/^#+\s*/, '').substring(0, 50); 
    
    const newArticle: Article = {
      id: Date.now().toString(),
      title: cleanTitle,
      content: content,
      snippet: content.substring(0, 120).replace(/[\n#]/g, ' ') + '...',
      createdAt: Date.now()
    };

    setArticles(prev => [newArticle, ...prev]);
    alert('Article saved to your library!');
  };

  const createManualArticle = () => {
    const newId = Date.now().toString();
    const newArticle: Article = {
      id: newId,
      title: 'New Article',
      content: 'Start writing your article here...',
      snippet: 'New draft...',
      createdAt: Date.now()
    };
    setArticles(prev => [newArticle, ...prev]);
    setSelectedArticleId(newId);
    setViewMode('articles');
    startEditing(newArticle);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteArticle = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setArticles(prev => prev.filter(a => a.id !== id));
      if (selectedArticleId === id) {
        setSelectedArticleId(null);
        setIsEditing(false);
      }
  };

  const startEditing = (article: Article) => {
    setEditTitle(article.title);
    setEditContent(article.content);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!selectedArticleId) return;
    setArticles(prev => prev.map(a => {
      if (a.id === selectedArticleId) {
        return {
          ...a,
          title: editTitle,
          content: editContent,
          snippet: editContent.substring(0, 120).replace(/[\n#]/g, ' ') + '...'
        };
      }
      return a;
    }));
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const downloadArticle = (article: Article) => {
    const element = document.createElement("a");
    const file = new Blob([article.content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    const filename = article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".md";
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // --- Chat Logic ---

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !currentSessionId || isGenerating) return;

    const userMsgContent = input.trim();
    setInput('');
    setIsGenerating(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.User,
      content: userMsgContent,
      timestamp: Date.now()
    };

    setSessions(prev => {
      const session = prev[currentSessionId];
      const title = session.messages.length <= 1 ? userMsgContent.slice(0, 30) : session.title;
      return {
        ...prev,
        [currentSessionId]: {
          ...session,
          title,
          messages: [...session.messages, userMsg],
          updatedAt: Date.now()
        }
      };
    });

    // 2. Prepare Placeholder for AI Message
    const aiMsgId = (Date.now() + 1).toString();
    const aiPlaceholder: Message = {
      id: aiMsgId,
      role: Role.Model,
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    setSessions(prev => ({
      ...prev,
      [currentSessionId]: {
        ...prev[currentSessionId],
        messages: [...prev[currentSessionId].messages, aiPlaceholder]
      }
    }));

    // 3. Stream Response
    const currentHistory = sessions[currentSessionId].messages;
    const fullHistory = [...currentHistory, userMsg];

    let accumulatedText = "";

    try {
      const stream = streamChatResponse(fullHistory, userMsgContent);
      
      for await (const chunk of stream) {
        accumulatedText += chunk;
        setSessions(prev => {
           if (!prev[currentSessionId]) return prev;
           const session = prev[currentSessionId];
           const updatedMessages = session.messages.map(m => 
             m.id === aiMsgId ? { ...m, content: accumulatedText } : m
           );
           return {
             ...prev,
             [currentSessionId]: {
               ...session,
               messages: updatedMessages
             }
           };
        });
      }
    } finally {
      setIsGenerating(false);
      setSessions(prev => {
         if (!prev[currentSessionId]) return prev;
         const session = prev[currentSessionId];
         const updatedMessages = session.messages.map(m => 
           m.id === aiMsgId ? { ...m, isStreaming: false } : m
         );
         return {
           ...prev,
           [currentSessionId]: { ...session, messages: updatedMessages }
         };
      });
    }
  }, [input, currentSessionId, isGenerating, sessions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- Render ---

  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans">
        
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`
            fixed md:relative z-30 w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">
              Gemini Workspace
            </h1>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <CloseIcon className="w-5 h-5"/>
            </button>
          </div>

          <div className="p-3 space-y-2">
            <button
              onClick={createNewSession}
              className="w-full flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-lg transition-colors font-medium shadow-lg shadow-brand-900/20"
            >
              <PlusIcon className="w-5 h-5" />
              <span>New Chat</span>
            </button>
            <button
               onClick={() => { setViewMode('articles'); setIsSidebarOpen(false); setSelectedArticleId(null); setIsEditing(false); }}
               className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors font-medium ${viewMode === 'articles' ? 'bg-slate-800 text-brand-400' : 'text-slate-400 hover:bg-slate-800/50'}`}
            >
              <ArticleIcon className="w-5 h-5" />
              <span>My Articles ({articles.length})</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pl-2">Recent Chats</h3>
            {(Object.values(sessions) as ChatSession[])
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map(session => (
              <div 
                key={session.id}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  setViewMode('chat');
                  setIsEditing(false);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`
                  group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all
                  ${currentSessionId === session.id && viewMode === 'chat' ? 'bg-slate-800 text-brand-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                `}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                   <MessageSquareIcon className="w-4 h-4 flex-shrink-0" />
                   <span className="truncate text-sm">{session.title || 'Untitled Chat'}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/30 hover:text-red-400 rounded transition-all"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-800">
             <div className="flex items-center gap-3 text-slate-500 text-xs">
                <GithubIcon className="w-4 h-4" />
                <span>Static Host Ready</span>
             </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full relative">
          
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md z-10 sticky top-0">
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                    {viewMode === 'chat' ? 'Chat' : 'Articles Library'}
                    {viewMode === 'articles' && selectedArticleId && isEditing && (
                      <span className="text-xs bg-brand-900/50 text-brand-300 px-2 py-0.5 rounded border border-brand-800">Editing</span>
                    )}
                </div>
             </div>
             
             <div className="flex items-center gap-2">
               <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-brand-400 border border-slate-700">
                 Gemini 2.5 Flash
               </span>
             </div>
          </header>

          {/* VIEW: CHAT */}
          {viewMode === 'chat' && (
            <>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
                    <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-end pb-4">
                    {getCurrentMessages().length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 opacity-60 mt-20">
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                <PlusIcon className="w-8 h-8" />
                            </div>
                            <p>Start a new conversation</p>
                        </div>
                    ) : (
                        getCurrentMessages().map((msg) => (
                        <ChatMessage 
                            key={msg.id} 
                            message={msg} 
                            onSaveAsArticle={msg.role === Role.Model ? saveToArticles : undefined}
                        />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="p-4 bg-slate-950/90 backdrop-blur border-t border-slate-800">
                    <div className="max-w-3xl mx-auto relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Gemini to write an article... (Arabic supported)"
                        rows={1}
                        disabled={isGenerating}
                        className="w-full bg-slate-900 text-slate-100 placeholder-slate-500 border border-slate-700 rounded-2xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none max-h-48 scrollbar-hide"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isGenerating}
                        className={`
                        absolute right-2 bottom-2 p-2 rounded-xl transition-all
                        ${!input.trim() || isGenerating 
                            ? 'text-slate-600 bg-transparent cursor-not-allowed' 
                            : 'bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-500/20'
                        }
                        `}
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                    </div>
                    <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-600">
                        AI can make mistakes.
                    </p>
                    </div>
                </div>
            </>
          )}

          {/* VIEW: ARTICLES */}
          {viewMode === 'articles' && (
              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
                  {!selectedArticleId ? (
                      // Article List
                      <div className="max-w-4xl mx-auto">
                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <ArticleIcon className="w-6 h-6 text-brand-500"/>
                                My Saved Articles
                            </h2>
                            <button 
                              onClick={createManualArticle}
                              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all border border-slate-700"
                            >
                              <PlusIcon className="w-4 h-4" />
                              New Article
                            </button>
                          </div>
                          
                          {articles.length === 0 ? (
                              <div className="text-center py-20 bg-slate-900 rounded-2xl border border-slate-800 border-dashed">
                                  <p className="text-slate-500">No articles saved yet.</p>
                                  <p className="text-sm text-slate-600 mt-2">Ask Gemini to write something, or click "New Article".</p>
                              </div>
                          ) : (
                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                  {articles.map(article => (
                                      <div 
                                        key={article.id} 
                                        onClick={() => setSelectedArticleId(article.id)}
                                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-brand-500/50 hover:bg-slate-800 transition-all cursor-pointer group flex flex-col h-64"
                                      >
                                          <div className="flex-1 overflow-hidden">
                                              <h3 className="font-bold text-lg text-slate-200 mb-2 line-clamp-2 leading-tight">
                                                  {article.title}
                                              </h3>
                                              <p className="text-slate-400 text-sm line-clamp-4">
                                                  {article.snippet}
                                              </p>
                                          </div>
                                          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                                              <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                                              <button 
                                                  onClick={(e) => deleteArticle(e, article.id)}
                                                  className="hover:text-red-400 p-1.5 rounded hover:bg-slate-700 transition-colors"
                                                  title="Delete Article"
                                              >
                                                  <TrashIcon className="w-4 h-4"/>
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  ) : (
                      // Single Article Reader / Editor
                      <div className="max-w-3xl mx-auto bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                          {(() => {
                              const article = articles.find(a => a.id === selectedArticleId);
                              if (!article) return null;
                              
                              if (isEditing) {
                                return (
                                  <div className="flex flex-col gap-4">
                                    <input 
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      className="bg-slate-800 border border-slate-700 text-xl font-bold p-3 rounded-lg text-white w-full focus:outline-none focus:border-brand-500"
                                      placeholder="Article Title"
                                    />
                                    <textarea
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="bg-slate-800 border border-slate-700 p-3 rounded-lg text-slate-300 w-full h-[60vh] focus:outline-none focus:border-brand-500 font-mono text-sm resize-none"
                                      placeholder="Write your article here using Markdown..."
                                    />
                                    <div className="flex gap-2 justify-end mt-2">
                                      <button 
                                        onClick={cancelEdit}
                                        className="px-4 py-2 text-slate-400 hover:text-white"
                                      >
                                        Cancel
                                      </button>
                                      <button 
                                        onClick={saveEdit}
                                        className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                                      >
                                        <CheckIcon className="w-4 h-4" /> Save Changes
                                      </button>
                                    </div>
                                  </div>
                                )
                              }

                              return (
                                  <article className="prose prose-invert prose-lg max-w-none">
                                      <div className="flex items-center justify-between mb-6">
                                        <button 
                                            onClick={() => { setSelectedArticleId(null); setIsEditing(false); }}
                                            className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 no-underline"
                                        >
                                            ← Back to Library
                                        </button>
                                        <div className="flex items-center gap-2">
                                          <button 
                                            onClick={() => downloadArticle(article)}
                                            className="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded transition-colors"
                                            title="Download Markdown"
                                          >
                                            <DownloadIcon className="w-5 h-5" />
                                          </button>
                                          <button 
                                            onClick={() => startEditing(article)}
                                            className="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded transition-colors"
                                            title="Edit Article"
                                          >
                                            <EditIcon className="w-5 h-5" />
                                          </button>
                                        </div>
                                      </div>
                                      
                                      <h1 className="mb-4">{article.title}</h1>
                                      <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">
                                        {article.content}
                                      </div>
                                  </article>
                              );
                          })()}
                      </div>
                  )}
              </div>
          )}

        </main>
      </div>
    </HashRouter>
  );
}

export default App;