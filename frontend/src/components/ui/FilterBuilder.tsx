'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Plus, X, Save, Pin, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface SavedView {
  id: string;
  name: string;
  isPinned: boolean;
  isDefault: boolean;
  filters: FilterRule[];
}

interface FilterBuilderProps {
  fields: { key: string, label: string }[];
  onApply: (filters: FilterRule[]) => void;
  storageKey: string;
}

export function FilterBuilder({ fields, onApply, storageKey }: FilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string>('default');
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  useEffect(() => {
    const views = localStorage.getItem(`savedViews_${storageKey}`);
    if (views) {
      setSavedViews(JSON.parse(views));
    } else {
      const defaultView = { id: 'default', name: 'همه (پیش‌فرض)', isPinned: true, isDefault: true, filters: [] };
      setSavedViews([defaultView]);
      localStorage.setItem(`savedViews_${storageKey}`, JSON.stringify([defaultView]));
    }
  }, [storageKey]);

  useEffect(() => {
    onApply(rules);
  }, [rules]);

  const saveCurrentView = (name: string) => {
    const newView = {
      id: Date.now().toString(),
      name,
      isPinned: false,
      isDefault: false,
      filters: [...rules]
    };
    const newViews = [...savedViews, newView];
    setSavedViews(newViews);
    setActiveViewId(newView.id);
    localStorage.setItem(`savedViews_${storageKey}`, JSON.stringify(newViews));
  };

  const applyView = (view: SavedView) => {
    setActiveViewId(view.id);
    setRules(view.filters);
    setViewMenuOpen(false);
  };

  const addRule = () => {
    setRules([...rules, { id: Date.now().toString(), field: fields[0]?.key || '', operator: 'equals', value: '' }]);
  };

  const updateRule = (id: string, updates: Partial<FilterRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Saved Views Header */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {savedViews.filter(v => v.isPinned || v.isDefault || v.id === activeViewId).map(view => (
          <button
            key={view.id}
            onClick={() => applyView(view)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
              activeViewId === view.id 
                ? 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:border-primary/30' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800'
            }`}
          >
            {view.isPinned && <Pin className="w-3 h-3 opacity-50" />}
            {view.name}
          </button>
        ))}
        
        <div className="relative">
          <button 
            onClick={() => setViewMenuOpen(!viewMenuOpen)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800"
          >
            بیشتر <ChevronDown className="w-3.5 h-3.5" />
          </button>
          
          <AnimatePresence>
            {viewMenuOpen && (
              <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} exit={{opacity:0, y:5}} className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase px-2 mb-1">همه ویوها</p>
                  {savedViews.map(view => (
                    <button key={view.id} onClick={() => applyView(view)} className="w-full text-right px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 rounded-lg flex items-center justify-between">
                      {view.name}
                      {activeViewId === view.id && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1" />
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
            rules.length > 0 ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          فیلترهای پیشرفته {rules.length > 0 && `(${rules.length})`}
        </button>
      </div>

      {/* Filter Builder Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} className="overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              
              {rules.length === 0 ? (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
                  هیچ فیلتری اعمال نشده است.
                </div>
              ) : (
                rules.map((rule, idx) => (
                  <div key={rule.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {idx > 0 && <span className="text-xs font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 px-2 hidden sm:inline">و</span>}
                    <select 
                      value={rule.field}
                      onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                      className="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none dark:text-slate-200"
                    >
                      {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                    
                    <select 
                      value={rule.operator}
                      onChange={(e) => updateRule(rule.id, { operator: e.target.value })}
                      className="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none dark:text-slate-200"
                    >
                      <option value="contains">شامل باشد</option>
                      <option value="equals">برابر باشد با</option>
                      <option value="startsWith">شروع شود با</option>
                      <option value="greaterThan">بیشتر از</option>
                      <option value="lessThan">کمتر از</option>
                    </select>

                    <input 
                      type="text"
                      placeholder="مقدار..."
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                      className="flex-1 min-w-[150px] text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none dark:text-slate-200"
                    />

                    <button onClick={() => removeRule(rule.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 mt-4">
                <button onClick={addRule} className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                  <Plus className="w-3.5 h-3.5" /> افزودن شرط
                </button>

                {rules.length > 0 && (
                  <button 
                    onClick={() => {
                      const name = prompt('نام ویو جدید را وارد کنید:');
                      if (name) saveCurrentView(name);
                    }}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> ذخیره به عنوان ویو
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
