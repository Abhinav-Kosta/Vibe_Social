import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import API from '../../services/api';

const ChatSidebar = ({ activeChatId, onSelectChat }) => {
  const { user: currentUser } = useAuth();
  const { onlineUsers } = useSocket();

  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const res = await API.get('/chats');
      if (res.data.success) {
        setChats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [activeChatId]);

  // Search users to start chat
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const res = await API.get(`/users/search?query=${searchQuery}`);
          if (res.data.success) {
            setSearchResults(res.data.data);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleStartChat = async (receiverId) => {
    try {
      const res = await API.post('/chats', { receiverId });
      if (res.data.success) {
        setSearchQuery('');
        onSelectChat(res.data.data._id);
        fetchChats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getChatPartner = (chat) => {
    return chat.participants.find((p) => p._id !== currentUser._id);
  };

  const isPartnerOnline = (partnerId) => {
    return onlineUsers[partnerId]?.isOnline || false;
  };

  const formatLatestTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="w-full md:w-80 h-full border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 transition-all duration-300">
      {/* Header Search */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
        <h2 className="text-xl font-extrabold mb-3">Chats</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Main chat list */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? (
          <div>
            <h3 className="text-[10px] font-extrabold uppercase text-slate-400 p-4">Search Results</h3>
            {searchResults.length > 0 ? (
              searchResults.map((userResult) => (
                <div
                  key={userResult._id}
                  onClick={() => handleStartChat(userResult._id)}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <img
                    src={userResult.profilePic}
                    alt={userResult.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold">{userResult.fullName}</p>
                    <p className="text-xs text-slate-400">@{userResult.username}</p>
                  </div>
                  <Plus className="h-4 w-4 text-slate-400 ml-auto" />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center p-4">No users found</p>
            )}
          </div>
        ) : loading ? (
          <div className="flex justify-center p-8">
            <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : chats.length === 0 ? (
          <p className="text-xs text-slate-400 text-center p-8">No active chats. Start one by searching above!</p>
        ) : (
          chats.map((chat) => {
            const partner = getChatPartner(chat);
            if (!partner) return null;
            const active = chat._id === activeChatId;
            const online = isPartnerOnline(partner._id);

            return (
              <div
                key={chat._id}
                onClick={() => onSelectChat(chat._id)}
                className={`flex items-center space-x-3 px-4 py-3.5 cursor-pointer border-b border-slate-50 dark:border-slate-800/30 transition-all ${
                  active ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="relative">
                  <img
                    src={partner.profilePic}
                    alt={partner.fullName}
                    className="h-11 w-11 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                  />
                  {online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                      {partner.fullName}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {formatLatestTime(chat.latestMessage?.createdAt || chat.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {chat.latestMessage ? (
                      <>
                        {chat.latestMessage.sender._id === currentUser._id ? 'You: ' : ''}
                        {chat.latestMessage.content || 'Sent an attachment'}
                      </>
                    ) : (
                      'No messages yet'
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
