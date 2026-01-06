'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import ChatWidget from './ChatWidget';

/**
 * Floating chat shortcut anchored bottom-right.
 * Opens chat as a popup widget instead of navigating to a page.
 */
export default function ChatFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggle = () => {
    if (isOpen && !isMinimized) {
      setIsMinimized(true);
    } else if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleToggle}
          aria-label="Open chat"
          className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-500/30 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition"
        >
          <MessageCircle size={22} />
        </button>
      )}
      <ChatWidget
        isOpen={isOpen}
        onClose={handleClose}
        onMinimize={handleMinimize}
        isMinimized={isMinimized}
      />
      {isMinimized && (
        <button
          onClick={handleToggle}
          aria-label="Open chat"
          className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-500/30 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition"
        >
          <MessageCircle size={22} />
        </button>
      )}
    </>
  );
}

