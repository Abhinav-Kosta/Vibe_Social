import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/80 px-4 py-3.5 rounded-2xl max-w-[80px]">
      <div className="h-2 w-2 bg-slate-400 rounded-full typing-dot"></div>
      <div className="h-2 w-2 bg-slate-400 rounded-full typing-dot"></div>
      <div className="h-2 w-2 bg-slate-400 rounded-full typing-dot"></div>
    </div>
  );
};

export default TypingIndicator;
