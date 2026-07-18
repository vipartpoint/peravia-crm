'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Users, ShoppingCart, MapPin, CheckSquare, Plus, ArrowLeft, Target, History, Star, Command } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/services/api';
import { useGlobalEntity } from '@/contexts/GlobalEntityContext';
import { useRecentWork } from '@/hooks/useRecentWork';
import { useFavorites } from '@/hooks/useFavorites';

const searchCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60000;

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ category: string, items: any[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { recentWork, addRecent } = useRecentWork(5);
  const { favorites } = useFavorites();

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { openCreate, openView } = useGlobalEntity();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (query.startsWith('>')) {
      setResults([{
        category: 'ایجاد سریع',
        items: [
          { title: 'ثبت مشتری جدید', subtitle: 'Customer', icon: Plus, action: () => openCreate('customer'), shortcut: 'C' },
          { title: 'ثبت سرنخ جدید', subtitle: 'Lead', icon: Plus, action: () => openCreate('lead'), shortcut: 'L' },
          { title: 'ثبت سفارش جدید', subtitle: 'Order', icon: Plus, action: () => openCreate('order'), shortcut: 'O' },
          { title: 'ثبت ویزیت جدید', subtitle: 'Visit', icon: Plus, action: () => openCreate('visit'), shortcut: 'V' },
          { title: 'ثبت تسک جدید', subtitle: 'Task', icon: Plus, action: () => openCreate('task'), shortcut: 'T' },
        ].filter(i => i.title.includes(query.replace('>', '').trim()))
      }]);
      return;
    }

    if (query.trim().length < 2) {
      const defaultSections: any[] = [];
      
      if (favorites.length > 0) {
        defaultSections.push({
          category: 'نشان شده‌ها',
          items: favorites.slice(0, 3).map(f => ({
            title: f.title, subtitle: f.subtitle, icon: Star, iconColor: 'text-amber-500', 
            action: () => openView(f.type as any, f.id)
          }))
        });
      }

      if (recentWork.length > 0) {
        defaultSections.push({
          category: 'اخیراً استفاده شده',
          items: recentWork.slice(0, 4).map(r => ({
            title: r.title, subtitle: r.subtitle, icon: History, 
            action: r.href ? undefined : () => openView(r.entityType as any, r.id),
            href: r.href
          }))
        });
      }

      defaultSections.push({
        category: 'اقدامات سریع',
        items: [
          { title: 'ثبت مشتری جدید', icon: Plus, action: () => openCreate('customer') },
          { title: 'ثبت لید جدید', icon: Plus, action: () => openCreate('lead') },
        ]
      });

      setResults(defaultSections);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      const q = query.toLowerCase().trim();

      // Check cache
      const cached = searchCache.get(q);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setResults(cached.data);
        setSelectedIndex(0);
        setLoading(false);
        return;
      }

      try {
        // Fetch all in parallel
        const [customers, leads, orders] = await Promise.all([
          api.get('/customers').catch(() => []),
          api.get('/leads').catch(() => []),
          api.get('/orders').catch(() => [])
        ]);

        const filteredCustomers = (customers || []).filter((c: any) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q)).slice(0, 5);
        const filteredLeads = (leads || []).filter((l: any) => l.name?.toLowerCase().includes(q) || l.companyName?.toLowerCase().includes(q)).slice(0, 5);
        const filteredOrders = (orders || []).filter((o: any) => o.orderNumber?.toLowerCase().includes(q)).slice(0, 5);

        const newResults = [];
        
        if (filteredCustomers.length > 0) {
          newResults.push({
            category: 'مشتریان',
            items: filteredCustomers.map((c: any) => ({
              title: c.name, subtitle: c.phone || 'مشتری', icon: Users, action: () => openView('customer', c.id)
            }))
          });
        }
        
        if (filteredLeads.length > 0) {
          newResults.push({
            category: 'لیدها',
            items: filteredLeads.map((l: any) => ({
              title: l.name, subtitle: l.companyName || 'سرنخ', icon: Target, action: () => openView('lead', l.id)
            }))
          });
        }

        if (filteredOrders.length > 0) {
          newResults.push({
            category: 'سفارشات',
            items: filteredOrders.map((o: any) => ({
              title: `سفارش ${o.orderNumber}`, subtitle: `${o.totalAmount} ریال`, icon: ShoppingCart, action: () => openView('order', o.id)
            }))
          });
        }

        // Context-aware sorting: prioritize the category matching the current route
        if (pathname) {
          newResults.sort((a, b) => {
            const aMatch = pathname.includes('customers') && a.category === 'مشتریان' || pathname.includes('leads') && a.category === 'لیدها' || pathname.includes('orders') && a.category === 'سفارشات';
            const bMatch = pathname.includes('customers') && b.category === 'مشتریان' || pathname.includes('leads') && b.category === 'لیدها' || pathname.includes('orders') && b.category === 'سفارشات';
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          });
        }

        searchCache.set(q, { data: newResults, timestamp: Date.now() });
        setResults(newResults);
        setSelectedIndex(0);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const flatItems = results.flatMap(group => group.items);

  const handleNavigate = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        executeAction(flatItems[selectedIndex]);
      }
    }
  };

  const executeAction = (item: any) => {
    setIsOpen(false);
    
    // Save to recent work if it's an entity or view
    if (item.title && (item.href || item.action)) {
      addRecent({
        id: item.id || Math.random().toString(),
        type: item.href ? 'report' : 'record',
        entityType: item.type,
        title: item.title,
        subtitle: item.subtitle,
        href: item.href
      });
    }

    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden relative z-10 flex flex-col max-h-[60vh]"
          >
            <div className="flex items-center px-4 py-4 border-b border-border bg-white dark:bg-slate-900">
              <Search className="w-5 h-5 text-primary shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleNavigate}
                placeholder="جستجو در تمام بخش‌ها (حداقل ۲ حرف)..."
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-slate-400 px-4 py-1 text-lg"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded text-xs font-sans font-medium">ESC</kbd>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide bg-slate-50 dark:bg-slate-800/50/50">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-sm font-medium">در حال جستجو...</span>
                </div>
              ) : results.length === 0 && query.length >= 2 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm">
                  موردی یافت نشد.
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  {results.map((group, groupIdx) => {
                    const startIndex = results.slice(0, groupIdx).reduce((acc, g) => acc + g.items.length, 0);
                    return (
                      <div key={groupIdx}>
                        <div className="px-3 mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{group.category}</div>
                        <ul className="space-y-1">
                          {group.items.map((item, itemIdx) => {
                            const globalIndex = startIndex + itemIdx;
                            const isSelected = globalIndex === selectedIndex;
                            const Icon = item.icon || FileText;
                            return (
                              <li key={itemIdx}>
                                <button
                                  onClick={() => executeAction(item)}
                                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-right transition-colors ${
                                    isSelected ? 'bg-primary text-white shadow-md' : 'hover:bg-white dark:bg-slate-900 bg-transparent text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                      <Icon className={`w-4 h-4 ${item.iconColor || ''}`} />
                                    </div>
                                    <div className="flex flex-col items-start">
                                      <span className="font-semibold text-[13px] text-slate-800 dark:text-slate-200">{item.title}</span>
                                      {item.subtitle && (
                                        <span className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400'}`}>
                                          {item.subtitle}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {item.shortcut && (
                                      <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 rounded text-[10px] font-sans font-medium">
                                        {item.shortcut}
                                      </kbd>
                                    )}
                                    {isSelected && <ArrowLeft className="w-4 h-4 text-slate-400" />}
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="bg-white dark:bg-slate-900 px-4 py-3 border-t border-border flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-sans">↵</kbd> انتخاب</span>
              <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-sans">↑↓</kbd> حرکت</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
