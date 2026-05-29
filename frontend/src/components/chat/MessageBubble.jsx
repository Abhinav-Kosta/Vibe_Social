import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageBubble = ({ message, isSelf }) => {
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const renderStatus = () => {
    if (!isSelf) return null;
    if (message.status === 'sent') {
      return <Check className="h-3.5 w-3.5 text-slate-400" />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck className="h-3.5 w-3.5 text-slate-450" />;
    }
    if (message.status === 'read') {
      return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    }
    return null;
  };

  return (
    <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} mb-3`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative transition-all ${
          isSelf
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800/80 rounded-tl-none'
        }`}
      >
        {/* Render Attachments if any */}
        {message.mediaUrl && (
          <div className="mb-2 rounded-xl overflow-hidden max-w-sm">
            {message.mediaType === 'image' && (
              <img src={message.mediaUrl} alt="Shared media" className="w-full object-cover max-h-60" />
            )}
            {message.mediaType === 'video' && (
              <video src={message.mediaUrl} controls className="w-full max-h-60" />
            )}
            {message.mediaType === 'file' && (
              <a
                href={message.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 p-2 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-xs hover:underline text-slate-900 dark:text-white"
              >
                <span className="truncate max-w-[200px] font-bold">Attachment File</span>
              </a>
            )}
          </div>
        )}

        {/* Text message */}
        {message.content && <p className="text-sm leading-relaxed break-words">{message.content}</p>}

        {/* Timestamp and Read Status */}
        <div className="flex items-center justify-end space-x-1 mt-1">
          <span className={`text-[10px] ${isSelf ? 'text-blue-100' : 'text-slate-400'}`}>
            {formatTime(message.createdAt)}
          </span>
          {renderStatus()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
