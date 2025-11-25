import React from 'react';
import { Message, Role } from '../types';
import { SparklesIcon, SaveIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  onSaveAsArticle?: (content: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSaveAsArticle }) => {
  const isUser = message.role === Role.User;

  // Basic formatting helper
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group animate-fade-in-up`}>
      <div className={`flex max-w-[95%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-indigo-600' : 'bg-brand-600'} shadow-lg`}>
          {isUser ? (
             <img src="https://picsum.photos/40/40" alt="User" className="rounded-full w-8 h-8 border border-white/20" />
          ) : (
            <SparklesIcon className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col items-start gap-1 max-w-full">
          <div 
            className={`
              p-4 rounded-2xl shadow-md text-sm md:text-base leading-relaxed overflow-hidden relative
              ${isUser 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
              }
            `}
          >
            {message.role === Role.Model && message.isStreaming && message.content.length === 0 ? (
               <span className="flex gap-1 items-center h-6">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
               </span>
            ) : (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}
          </div>
          
          {/* Action Buttons for Model Responses */}
          {!isUser && !message.isStreaming && message.content.length > 0 && onSaveAsArticle && (
            <button 
              onClick={() => onSaveAsArticle(message.content)}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-400 ml-1 px-2 py-1 rounded hover:bg-slate-800"
              title="Save as Article"
            >
              <SaveIcon className="w-3.5 h-3.5" />
              <span>Save Article</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};