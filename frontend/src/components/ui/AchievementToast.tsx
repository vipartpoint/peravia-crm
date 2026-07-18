import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Medal, X } from 'lucide-react';

interface Props {
  title: string;
  onClose: () => void;
}

export function AchievementToast({ title, onClose }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-6 right-6 z-[200] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-4 flex items-center gap-4 w-80"
      >
        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20">
          <Medal className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-0.5">دستاور جدید!</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
