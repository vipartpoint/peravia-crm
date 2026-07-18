'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

const shortcuts = [
  {
    category: 'عمومی',
    items: [
      { keys: ['Ctrl/Cmd', 'K'], label: 'جستجوی هوشمند (Command Palette)' },
      { keys: ['Shift', '?'], label: 'راهنمای کلیدهای میانبر' },
      { keys: ['Esc'], label: 'بستن پنجره‌ها و منوها' },
    ]
  },
  {
    category: 'ایجاد سریع (داخل Command Palette با >)',
    items: [
      { keys: ['C'], label: 'مشتری جدید' },
      { keys: ['L'], label: 'سرنخ جدید' },
      { keys: ['O'], label: 'سفارش جدید' },
      { keys: ['V'], label: 'ویزیت جدید' },
      { keys: ['T'], label: 'تسک جدید' },
    ]
  }
];

export function KeyboardShortcutsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        onClose(); // Toggle if we had an open handler, but since we receive isOpen as prop, let's assume it's handled globally or here.
        // For pure simplicity, we just rely on the parent to toggle, or trigger a custom event.
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative z-10"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <Keyboard className="w-5 h-5 text-teal-600" />
                <h2 className="font-semibold text-lg tracking-tight">کلیدهای میانبر</h2>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {shortcuts.map((group, idx) => (
                <div key={idx} className={idx > 0 ? 'mt-6' : ''}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">{group.category}</h3>
                  <div className="space-y-2">
                    {group.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                        <span className="text-[13px] font-medium text-slate-600">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          {item.keys.map((key, keyIdx) => (
                            <React.Fragment key={keyIdx}>
                              <kbd className="px-2 py-1 bg-white border border-slate-200 text-slate-500 rounded-md text-[11px] font-sans font-semibold shadow-sm">
                                {key}
                              </kbd>
                              {keyIdx < item.keys.length - 1 && <span className="text-slate-300 text-[10px]">+</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
