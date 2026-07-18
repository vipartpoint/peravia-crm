'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import { BrainCircuit, Send, Bot, User, Sparkles, MessageSquare, PlusCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AiAssistantPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'فروش این ماه چقدر بوده؟',
    'بهترین کارشناس ماه چه کسی است؟',
    '۱۰ مشتری در معرض ریزش را نشان بده',
    'وضعیت مالی و چک‌های برگشتی چگونه است؟'
  ];

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get('/ai-assistant/sessions');
      setSessions(res);
      if (res.length > 0 && !activeSessionId) {
        setActiveSessionId(res[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await api.get(`/ai-assistant/sessions/${id}/messages`);
      setMessages(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai-assistant/query', { query: text, sessionId: activeSessionId });
      if (!activeSessionId && res.sessionId) {
        setActiveSessionId(res.sessionId);
        fetchSessions(); // refresh sidebar
      }
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
    } catch (e: any) {
      alert(e.response?.data?.message || 'خطا در ارتباط با هوش مصنوعی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      
      {/* Sidebar: History */}
      <div className="w-1/4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold flex items-center text-gray-800 dark:text-gray-100">
            <MessageSquare className="w-5 h-5 ml-2 text-indigo-500" />
            تاریخچه گفتگوها
          </h2>
          <button onClick={() => setActiveSessionId(null)} className="text-indigo-600 hover:text-indigo-800 p-1" title="چت جدید">
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`w-full text-right p-3 rounded-xl text-sm transition truncate ${activeSessionId === s.id ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'hover:bg-gray-50 text-gray-600'}`}
            >
              {s.title || 'گفتگوی جدید'}
            </button>
          ))}
          {sessions.length === 0 && <p className="text-center text-xs text-gray-400 mt-4">تاریخچه‌ای وجود ندارد.</p>}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-3/4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="h-16 border-b border-gray-100 dark:border-gray-800 flex items-center px-6 bg-white dark:bg-slate-900/50 backdrop-blur-xl z-10 shrink-0">
          <BrainCircuit className="w-6 h-6 ml-3 text-indigo-600" />
          <div>
            <h1 className="font-black text-gray-900 text-lg">دستیار هوشمند مدیرعامل</h1>
            <p className="text-xs text-gray-500 font-medium">پاسخگویی بر اساس داده‌های زنده سازمان (CRM)</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 border border-indigo-100 shadow-inner">
                <BrainCircuit className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">چگونه می‌توانم کمک کنم؟</h2>
              <p className="text-gray-500 text-sm mb-8">من به دیتابیس مشتریان، فروش‌ها و گزارشات مالی متصل هستم. سوال خود را بپرسید.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {suggestedQuestions.map((sq, i) => (
                  <button key={i} onClick={() => handleSend(sq)} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:shadow-md p-4 rounded-2xl text-sm font-medium text-gray-700 dark:text-gray-200 text-right transition flex items-start group">
                    <Sparkles className="w-4 h-4 ml-2 text-indigo-400 shrink-0 group-hover:text-indigo-600 transition" />
                    <span>{sq}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 ml-4' : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 mr-4'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-600" />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tl-none' : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 rounded-tr-none'}`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="prose prose-sm prose-indigo rtl prose-p:leading-relaxed prose-a:text-indigo-600 max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="flex flex-row">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 mr-4 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl rounded-tr-none bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center bg-gray-50 rounded-2xl p-2 border border-gray-200 dark:border-gray-700 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition shadow-inner">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend(input)}
              placeholder="از هوش مصنوعی بپرسید..."
              className="flex-1 bg-transparent border-none outline-none text-sm px-4 text-gray-800 dark:text-gray-100 placeholder-gray-400"
              disabled={loading}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
              className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition shadow-md shadow-indigo-200 shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
