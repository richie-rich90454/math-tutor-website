'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChat } from '@/contexts/ChatContext';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatInterface() {
  const { t } = useLanguage();
  const { currentChat } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          preferredLanguage: localStorage.getItem('preferredLanguage') || 'en',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center mt-20">
              <div className="mb-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a math conversation</h3>
                <p className="text-gray-500 text-sm mb-8">Ask me anything about mathematics</p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                <button className="text-left p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  <p className="text-sm font-medium text-gray-900">Basic Math</p>
                  <p className="text-xs text-gray-500 mt-1">Addition, subtraction...</p>
                </button>
                <button className="text-left p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  <p className="text-sm font-medium text-gray-900">Fractions</p>
                  <p className="text-xs text-gray-500 mt-1">Learn about parts</p>
                </button>
                <button className="text-left p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  <p className="text-sm font-medium text-gray-900">Geometry</p>
                  <p className="text-xs text-gray-500 mt-1">Shapes and angles</p>
                </button>
                <button className="text-left p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  <p className="text-sm font-medium text-gray-900">Word Problems</p>
                  <p className="text-xs text-gray-500 mt-1">Real-world math</p>
                </button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`group relative max-w-[70%]`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                <span className={`text-xs mt-1 px-2 block ${
                  message.role === 'user' ? 'text-right text-gray-400' : 'text-left text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('inputPlaceholder')}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent pr-12"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 bg-gray-900 text-white rounded-lg p-2 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex space-x-2">
              <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>
            <span className="text-xs text-gray-400">Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}