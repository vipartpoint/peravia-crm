'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronUp } from 'lucide-react';
import { Button } from './Button';

interface ActionItem {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
}

interface RightActionPanelProps {
  actions: ActionItem[];
  title?: string;
}

export function RightActionPanel({ actions, title = 'عملیات سریع' }: RightActionPanelProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:flex flex-col w-64 shrink-0">
        <div className="sticky top-20 bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">{title}</h3>
          <div className="flex flex-col gap-2">
            {actions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Button 
                  key={idx} 
                  variant={action.variant || 'outline'} 
                  onClick={action.onClick}
                  className="w-full justify-start text-sm"
                >
                  <Icon className="w-4 h-4 ml-2" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Trigger */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center border-2 border-slate-800"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 z-50 lg:hidden backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl lg:hidden p-6 pb-safe"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
                <button onClick={() => setIsMobileOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {actions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <Button 
                      key={idx} 
                      variant={action.variant || 'outline'} 
                      onClick={() => {
                        action.onClick();
                        setIsMobileOpen(false);
                      }}
                      className="w-full justify-start text-base py-3"
                    >
                      <Icon className="w-5 h-5 ml-3" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
