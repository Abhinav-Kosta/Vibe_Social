import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';

const ChatPage = () => {
  const location = useLocation();
  const [activeChatId, setActiveChatId] = useState(null);

  useEffect(() => {
    // Handle redirect shortcut from user profile message click
    if (location.state?.activeChatId) {
      setActiveChatId(location.state.activeChatId);
    }
  }, [location.state]);

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
  };

  const handleRefreshChatSidebar = () => {
    // Simple state update or hook if sidebar needs manual update on self messages
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />

      <div className="flex-1 flex overflow-hidden max-w-6xl w-full mx-auto border-x border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <ChatSidebar
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
        />

        {activeChatId ? (
          <ChatWindow
            chatId={activeChatId}
            onNewMessageSent={handleRefreshChatSidebar}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950/20">
            <h2 className="text-xl font-black text-slate-400 mb-1">Your Messages</h2>
            <p className="text-slate-400 text-xs">
              Send private photos and messages to a friend.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
