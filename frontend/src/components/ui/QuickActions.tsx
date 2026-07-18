'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Target, ShoppingCart, MapPin, CheckSquare, CreditCard, FileText } from 'lucide-react';
import { useGlobalEntity, EntityType } from '@/contexts/GlobalEntityContext';

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const { openCreate } = useGlobalEntity();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const actions: { label: string, icon: any, type: EntityType, color: string, bg: string }[] = [
    { label: 'پرداخت جدید', icon: CreditCard, type: 'payment', color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'چک جدید', icon: FileText, type: 'cheque', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'تسک جدید', icon: CheckSquare, type: 'task', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'ویزیت جدید', icon: MapPin, type: 'visit', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'سفارش جدید', icon: ShoppingCart, type: 'order', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'لید جدید', icon: Target, type: 'lead', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'مشتری جدید', icon: Users, type: 'customer', color: 'text-teal-700', bg: 'bg-teal-50' },
  ];

  const handleAction = (type: EntityType) => {
    setIsOpen(false);
    openCreate(type);
  };

  return (
    <div data-tour="tour-fab" ref={containerRef} className="fixed bottom-8 left-4 sm:bottom-6 sm:left-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 left-0 flex flex-col-reverse gap-3 pb-2"
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAction(action.type)}
                  className="flex items-center gap-3 group"
                >
                  <span className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[13px] font-medium px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {action.label}
                  </span>
                  <div className={`w-11 h-11 rounded-full shadow-sm flex items-center justify-center ${action.bg} border border-white hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
