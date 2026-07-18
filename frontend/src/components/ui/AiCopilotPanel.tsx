'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, MessageSquare, Send, Sparkles, ChevronRight } from 'lucide-react';
import { api } from '@/services/api';

export function AiCopilotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Global toggle listener
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-ai-copilot', handleToggle);
    return () => window.removeEventListener('toggle-ai-copilot', handleToggle);
  }, []);

  // Provide contextual greeting based on route
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let contextMsg = 'چطور می‌توانم به شما کمک کنم؟';
      if (pathname.includes('/customers/')) contextMsg = 'من آماده‌ام تا خلاصه این مشتری یا تاریخچه سفارشات او را برای شما تحلیل کنم.';
      else if (pathname.includes('/leads/')) contextMsg = 'آیا می‌خواهید ایمیل پیگیری برای این سرنخ را برایتان بنویسم؟';
      else if (pathname.includes('/dashboard')) contextMsg = 'به داشبورد خوش آمدید! مایلید گزارش فروش امروز را مرور کنیم؟';

      setMessages([{ role: 'ai', content: `سلام! ${contextMsg}` }]);
    }
  }, [isOpen, pathname, messages.length]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Mocking AI response for the UI layer
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', content: `در حال حاضر سرور هوش مصنوعی برای درخواست "${userMessage}" در دسترس نیست. اما من می‌توانم کارهای ساده را شبیه‌سازی کنم.` }]);
        setLoading(false);
      }, 1000);
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">AI Copilot</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> در حال یادگیری
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-50/30 dark:bg-slate-900/30">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="از Copilot بپرسید..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-slate-200 placeholder:text-slate-400 transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="absolute left-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                <button onClick={() => setInput('گزارش وضعیت مشتری')} className="shrink-0 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors">گزارش مشتری</button>
                <button onClick={() => setInput('نوشتن پیش‌نویس ایمیل پیگیری')} className="shrink-0 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors">پیش‌نویس ایمیل</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
