'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChat } from '@/contexts/ChatContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { t } = useLanguage();
  const { chatHistory, setCurrentChat, currentChat, deleteChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [showHistoryTooltip, setShowHistoryTooltip] = useState(false);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chatHistory;
    
    const query = searchQuery.toLowerCase();
    return chatHistory.filter(chat => 
      chat.title.toLowerCase().includes(query) || 
      chat.preview.toLowerCase().includes(query)
    );
  }, [chatHistory, searchQuery]);

  const handleChatSelect = (chat: any) => {
    setCurrentChat(chat);
    setShowHistoryTooltip(false);
  };

  const handleNewChat = () => {
    setCurrentChat(null);
    window.location.reload();
  };

  const groupChatsByDate = (chats: any[]) => {
    const groups: { [key: string]: any[] } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    chats.forEach(chat => {
      const chatDate = new Date(chat.timestamp);
      
      if (chatDate >= today) {
        groups.today.push(chat);
      } else if (chatDate >= yesterday) {
        groups.yesterday.push(chat);
      } else if (chatDate >= weekAgo) {
        groups.thisWeek.push(chat);
      } else if (chatDate >= monthAgo) {
        groups.thisMonth.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    return groups;
  };

  const chatGroups = groupChatsByDate(filteredChats);

  return (
    <>
      {/* Main Sidebar - Full height and fixed */}
      <div className={`h-full bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} p-4 border-b border-gray-200 bg-white h-[72px]`}>
          {isOpen && <h2 className="text-lg font-semibold text-gray-900">{t('sidebarHistory')}</h2>}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isOpen ? "Minimize sidebar" : "Expand sidebar"}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>

        {/* Search Section */}
        <div className={`${isOpen ? 'p-3' : 'p-2'} bg-white border-b border-gray-200`}>
          {isOpen ? (
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('sidebarSearchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button 
              className="w-full p-2.5 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center group relative"
              title="Search"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {t('sidebarSearchPlaceholder')}
              </span>
            </button>
          )}
        </div>

        {/* New Chat Button */}
        <div className={`${isOpen ? 'p-3' : 'p-2'} bg-white border-b border-gray-200`}>
          {isOpen ? (
            <button 
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg py-2.5 px-4 hover:bg-gray-800 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('sidebarNewChat')}
            </button>
          ) : (
            <button 
              onClick={handleNewChat}
              className="w-full p-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center group relative"
              title="New Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {t('sidebarNewChat')}
              </span>
            </button>
          )}
        </div>

        {/* Chat History */}
        {isOpen ? (
          <div className="flex-1 overflow-y-auto bg-white">
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-sm text-center">
                  {searchQuery ? t('sidebarNoMatchingConversations') : t('sidebarNoConversationsYet')}
                </p>
                {!searchQuery && (
                  <p className="text-xs text-center mt-1">
                    {t('sidebarStartNewChat')}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-2">
                {/* Today */}
                {chatGroups.today.length > 0 && (
                  <div className="mb-1">
                    <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('sidebarToday')}</h3>
                    {chatGroups.today.map((chat) => (
                      <ChatItem 
                        key={chat.id} 
                        chat={chat} 
                        onSelect={handleChatSelect}
                        onDelete={deleteChat}
                        isHovered={hoveredChatId === chat.id}
                        onHover={setHoveredChatId}
                        isActive={currentChat?.id === chat.id}
                      />
                    ))}
                  </div>
                )}

                {/* Yesterday */}
                {chatGroups.yesterday.length > 0 && (
                  <div className="mb-1">
                    <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('sidebarYesterday')}</h3>
                    {chatGroups.yesterday.map((chat) => (
                      <ChatItem 
                        key={chat.id} 
                        chat={chat} 
                        onSelect={handleChatSelect}
                        onDelete={deleteChat}
                        isHovered={hoveredChatId === chat.id}
                        onHover={setHoveredChatId}
                        isActive={currentChat?.id === chat.id}
                      />
                    ))}
                  </div>
                )}

                {/* This Week */}
                {chatGroups.thisWeek.length > 0 && (
                  <div className="mb-1">
                    <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('sidebarThisWeek')}</h3>
                    {chatGroups.thisWeek.map((chat) => (
                      <ChatItem 
                        key={chat.id} 
                        chat={chat} 
                        onSelect={handleChatSelect}
                        onDelete={deleteChat}
                        isHovered={hoveredChatId === chat.id}
                        onHover={setHoveredChatId}
                        isActive={currentChat?.id === chat.id}
                      />
                    ))}
                  </div>
                )}

                {/* This Month */}
                {chatGroups.thisMonth.length > 0 && (
                  <div className="mb-1">
                    <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('sidebarThisMonth')}</h3>
                    {chatGroups.thisMonth.map((chat) => (
                      <ChatItem 
                        key={chat.id} 
                        chat={chat} 
                        onSelect={handleChatSelect}
                        onDelete={deleteChat}
                        isHovered={hoveredChatId === chat.id}
                        onHover={setHoveredChatId}
                        isActive={currentChat?.id === chat.id}
                      />
                    ))}
                  </div>
                )}

                {/* Older */}
                {chatGroups.older.length > 0 && (
                  <div className="mb-1">
                    <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('sidebarOlder')}</h3>
                    {chatGroups.older.map((chat) => (
                      <ChatItem 
                        key={chat.id} 
                        chat={chat} 
                        onSelect={handleChatSelect}
                        onDelete={deleteChat}
                        isHovered={hoveredChatId === chat.id}
                        onHover={setHoveredChatId}
                        isActive={currentChat?.id === chat.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center pt-4 bg-white relative">
            <div 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer group relative"
              onMouseEnter={() => setShowHistoryTooltip(true)}
              onMouseLeave={() => setShowHistoryTooltip(false)}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {t('sidebarHistory')}
              </span>
            </div>

            {/* History Tooltip Popup */}
            {showHistoryTooltip && chatHistory.length > 0 && (
              <div 
                className="absolute left-full ml-2 top-0 w-72 max-h-[600px] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50"
                onMouseEnter={() => setShowHistoryTooltip(true)}
                onMouseLeave={() => setShowHistoryTooltip(false)}
              >
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-sm text-gray-900">{t('sidebarRecentConversations')}</h3>
                </div>
                <div className="overflow-y-auto max-h-[540px]">
                  {chatHistory.slice(0, 10).map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${
                        currentChat?.id === chat.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                        {chat.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {chat.preview}
                      </p>
                      <span className="text-xs text-gray-400 mt-1 block">
                        {new Date(chat.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className={`p-4 border-t border-gray-200 bg-white ${!isOpen && 'px-2'}`}>
          {isOpen ? (
            <div className="flex items-center justify-center text-xs text-gray-400">
              <span>{t('sidebarMathTutorAI')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface ChatItemProps {
  chat: any;
  onSelect: (chat: any) => void;
  onDelete: (chatId: string) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  isActive: boolean;
}

function ChatItem({ chat, onSelect, onDelete, isHovered, onHover, isActive }: ChatItemProps) {
  return (
    <div
      onClick={() => onSelect(chat)}
      onMouseEnter={() => onHover(chat.id)}
      onMouseLeave={() => onHover(null)}
      className={`group relative px-4 py-3 cursor-pointer transition-all duration-200 ${
        isActive ? 'bg-gray-200' : isHovered ? 'bg-gray-100' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
            isActive ? 'bg-gray-900' : isHovered ? 'bg-gray-700' : 'bg-gray-300'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
            {chat.title}
          </h4>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {chat.preview}
          </p>
        </div>
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete "${chat.title}"?`)) {
                onDelete(chat.id);
              }
            }}
            className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors group"
            aria-label="Delete chat"
          >
            <svg className="w-4 h-4 text-gray-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
