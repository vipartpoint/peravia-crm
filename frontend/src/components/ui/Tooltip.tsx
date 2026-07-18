'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

export const InfoIcon = ({ className = "w-4 h-4 text-slate-400 hover:text-slate-600 ml-1 inline-block" }) => (
  <Info className={className} />
);

export function Tooltip({ children, content, position = 'top' }: { children: React.ReactNode, content: string, position?: 'top' | 'bottom' | 'left' | 'right' }) {
  const [isVisible, setIsVisible] = React.useState(false);

  const positions = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 whitespace-nowrap px-2.5 py-1.5 text-xs font-medium text-white bg-slate-800 rounded shadow-sm pointer-events-none ${positions[position]}`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
