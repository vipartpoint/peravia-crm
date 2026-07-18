'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit2, ListPlus, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onActivity?: () => void;
  onArchive?: () => void;
}

export function ActionMenu({ onView, onEdit, onActivity, onArchive }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeAndCall = (fn: () => void) => {
    setIsOpen(false);
    fn();
  };

  return (
    <div className="relative inline-block text-right" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[100] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1 flex flex-col">
              {onView && <button onClick={() => closeAndCall(onView)} className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors">
                <Eye className="w-4 h-4 ml-2.5 text-slate-400 dark:text-slate-500 dark:text-slate-400" /> مشاهده رکورد
              </button>}
              {onEdit && <button onClick={() => closeAndCall(onEdit)} className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors">
                <Edit2 className="w-4 h-4 ml-2.5 text-slate-400 dark:text-slate-500 dark:text-slate-400" /> ویرایش
              </button>}
              {onActivity && <button onClick={() => closeAndCall(onActivity)} className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors">
                <ListPlus className="w-4 h-4 ml-2.5 text-slate-400 dark:text-slate-500 dark:text-slate-400" /> ثبت فعالیت
              </button>}
              {onArchive && (
                <>
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />
                  <button onClick={() => closeAndCall(onArchive)} className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <Archive className="w-4 h-4 ml-2.5 text-red-400 dark:text-red-500" /> آرشیو کردن
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
