'use client';

import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextHelpProps {
  title: string;
  content: string;
}

export function ContextHelp({ title, content }: ContextHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center align-middle ml-1">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-slate-400 hover:text-primary transition-colors focus:outline-none"
        aria-label="راهنما"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl z-[150] pointer-events-none"
          >
            <div className="relative">
              <h4 className="font-bold text-[13px] mb-1 text-slate-100">{title}</h4>
              <p className="text-[12px] leading-relaxed text-slate-300">{content}</p>
              
              {/* Tooltip Arrow */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
