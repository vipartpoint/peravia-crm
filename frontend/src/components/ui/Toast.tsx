'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const typeConfig = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-teal-600" />,
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    progress: 'bg-teal-500',
    iconBg: 'bg-white'
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-rose-600" />,
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    progress: 'bg-rose-500',
    iconBg: 'bg-white'
  },
  warning: {
    icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    progress: 'bg-amber-500',
    iconBg: 'bg-white'
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-600" />,
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    progress: 'bg-blue-500',
    iconBg: 'bg-white'
  }
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...message, id }]);
    
    if (message.duration !== 0) {
      setTimeout(() => {
        dismiss(id);
      }, message.duration || 4000);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-[100] flex flex-col gap-3 w-[90vw] sm:w-[380px] pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const config = typeConfig[t.type];
            return (
              <motion.div
                layout
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className={`pointer-events-auto overflow-hidden bg-white shadow-sm border ${config.border} rounded-2xl flex relative`}
              >
                {/* Progress bar line */}
                {t.duration !== 0 && (
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: (t.duration || 4000) / 1000, ease: 'linear' }}
                    className={`absolute bottom-0 left-0 h-0.5 ${config.progress}`}
                  />
                )}
                
                <div className="flex w-full p-4 gap-3 items-start">
                  <motion.div 
                    initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bg} shadow-sm border border-white`}
                  >
                    {config.icon}
                  </motion.div>
                  <div className="flex-1 pt-1">
                    <h4 className="text-sm font-semibold text-slate-800 tracking-tight">{t.title}</h4>
                    {t.description && <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">{t.description}</p>}
                    {t.action && (
                      <button 
                        onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                        className="mt-3 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {t.action.label}
                      </button>
                    )}
                  </div>
                  <button onClick={() => dismiss(t.id)} className="shrink-0 p-1.5 -mr-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
