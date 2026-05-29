import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Send, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import API from '../../services/api';

const ChatWindow = ({ chatId, onNewMessageSent }) => {
  const { user: currentUser } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [partner, setPartner] = useState(null);
  
  const [isTyping, setIsTyping] = useState(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch messages history & details
  useEffect(() => {
    const fetchChatDetails = async () => {
      try {
        const chatRes = await API.get('/chats');
        if (chatRes.data.success) {
          const currentChat = chatRes.data.data.find((c) => c._id === chatId);
          if (currentChat) {
            const partnerUser = currentChat.participants.find(
              (p) => p._id !== currentUser._id
            );
            setPartner(partnerUser);
          }
        }

        const msgRes = await API.get(`/messages/${chatId}`);
        if (msgRes.data.success) {
          setMessages(msgRes.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (chatId) {
      fetchChatDetails();
    }
  }, [chatId, currentUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerIsTyping]);

  // Socket event listeners for real-time messages & statuses
  useEffect(() => {
    if (!socket || !chatId) return;

    // Listen for new messages
    socket.on('new-message', ({ chatId: incomingChatId, message }) => {
      if (incomingChatId === chatId) {
        setMessages((prev) => [...prev, message]);
        // Trigger read status
        socket.emit('message-read', {
          chatId,
          messageId: message._id,
          senderId: message.sender._id,
        });
      }
    });

    // Listen for typing events
    socket.on('typing', ({ chatId: incomingChatId, isTyping }) => {
      if (incomingChatId === chatId) {
        setPartnerIsTyping(isTyping);
      }
    });

    // Listen for read receipts
    socket.on('chat-read', ({ chatId: incomingChatId }) => {
      if (incomingChatId === chatId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender._id === currentUser._id ? { ...msg, status: 'read' } : msg
          )
        );
      }
    });

    return () => {
      socket.off('new-message');
      socket.off('typing');
      socket.off('chat-read');
    };
  }, [socket, chatId, currentUser]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!socket || !partner) return;

    // Send typing notification
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        chatId,
        receiverId: partner._id,
        isTyping: true,
      });
    }

    // Debounce stop typing signal
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', {
        chatId,
        receiverId: partner._id,
        isTyping: false,
      });
    }, 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('receiverId', partner._id);
    if (inputText.trim()) formData.append('content', inputText);
    if (selectedFile) formData.append('media', selectedFile);

    setInputText('');
    handleRemoveFile();

    try {
      const res = await API.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        if (onNewMessageSent) onNewMessageSent();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const getPartnerStatus = () => {
    if (!partner) return '';
    const onlineInfo = onlineUsers[partner._id];
    if (onlineInfo?.isOnline || (partner.isOnline && !onlineInfo)) {
      return 'Online';
    }
    const lastSeenTime = onlineInfo?.lastSeen || partner.lastSeen;
    if (!lastSeenTime) return 'Offline';
    const date = new Date(lastSeenTime);
    return `Last seen ${date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}`;
  };

  if (!partner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-400 text-sm">Select a chat to start conversation</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-3">
          <img
            src={partner.profilePic}
            alt={partner.fullName}
            className="h-10 w-10 rounded-full object-cover border border-slate-100 dark:border-slate-800"
          />
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {partner.fullName}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {partnerIsTyping ? (
                <span className="text-emerald-500 font-semibold animate-pulse">typing...</span>
              ) : (
                getPartnerStatus()
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isSelf={msg.sender._id === currentUser._id}
          />
        ))}

        {partnerIsTyping && (
          <div className="flex flex-col items-start mb-3">
            <span className="text-[10px] text-slate-400 mb-1 ml-2">
              {partner.username} is typing
            </span>
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
        {filePreview && (
          <div className="relative inline-block mb-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <img src={filePreview} alt="Upload preview" className="h-20 w-20 object-cover" />
            <button
              onClick={handleRemoveFile}
              className="absolute top-1 right-1 p-1 bg-slate-900/80 rounded-full text-white hover:bg-slate-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*,application/pdf"
          />

          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder-slate-400 dark:text-slate-200"
          />

          <button
            type="submit"
            disabled={!inputText.trim() && !selectedFile}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md shadow-blue-500/10 transition-all cursor-pointer"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
