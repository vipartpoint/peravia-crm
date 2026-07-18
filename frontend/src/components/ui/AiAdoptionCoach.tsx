'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, X, ArrowLeft, BrainCircuit } from 'lucide-react';

interface Suggestion {
  id: string;
  message: string;
  actionText: string;
  actionEvent?: string;
  link?: string;
}

export function AiAdoptionCoach() {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const evaluateUsage = () => {
      const aiUses = parseInt(localStorage.getItem('crm_stats_ai_uses') || '0', 10);
      const commandPalette = parseInt(localStorage.getItem('crm_stats_command_uses') || '0', 10);
      const toursCompleted = localStorage.getItem('crm_tour_completed') === 'true';
      const customers = parseInt(localStorage.getItem('crm_stats_customer_created') || '0', 10);
      const leads = parseInt(localStorage.getItem('crm_stats_lead_created') || '0', 10);

      if (aiUses === 0) {
        setSuggestion({
          id: 'no_ai',
          message: 'هنوز از دستیار هوشمند استفاده نکرده‌اید. می‌توانید وضعیت فروش و مشتریان را با زبان طبیعی تحلیل کنید.',
          actionText: 'باز کردن دستیار هوشمند',
          actionEvent: 'ai-copilot-open'
        });
      } else if (commandPalette === 0) {
        setSuggestion({
          id: 'no_cmd',
          message: 'برای دسترسی سریع‌تر به تمام بخش‌های سیستم، می‌توانید از کلیدهای میانبر (Cmd+K) استفاده کنید.',
          actionText: 'مشاهده کلیدهای میانبر',
          actionEvent: 'tour-command' // or custom event
        });
      } else if (leads > 5 && aiUses < 2) {
        setSuggestion({
          id: 'leads_no_ai',
          message: 'شما چندین سرنخ فعال دارید! پیشنهاد می‌شود سرنخ‌های این هفته را با دستیار هوشمند بررسی کنید.',
          actionText: 'تحلیل سرنخ‌ها',
          actionEvent: 'ai-copilot-open'
        });
      } else if (!toursCompleted && customers === 0) {
        setSuggestion({
          id: 'no_tours',
          message: 'برای آشنایی سریع‌تر با سیستم، آموزش‌های تعاملی مراحل مختلف را تکمیل کنید.',
          actionText: 'شروع آموزش',
          actionEvent: 'start-page-tour'
        });
      } else {
        setSuggestion(null);
      }
    };

    evaluateUsage();
    // Re-evaluate occasionally
    const interval = setInterval(evaluateUsage, 10000);
    return () => clearInterval(interval);
  }, [dismissed]);

  const handleAction = () => {
    if (suggestion?.actionEvent) {
      if (suggestion.actionEvent === 'ai-copilot-open') {
        window.dispatchEvent(new CustomEvent('ai-copilot-open', { detail: { context: 'coach' } }));
      } else if (suggestion.actionEvent === 'start-page-tour') {
        window.dispatchEvent(new CustomEvent('start-page-tour'));
      }
    }
  };

  if (!suggestion || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-4 sm:p-5 mb-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Background glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
          <BrainCircuit className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">پیشنهاد هوشمند (Adoption Coach)</h4>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {suggestion.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 relative z-10 sm:ml-4 sm:shrink-0">
        <button 
          onClick={handleAction}
          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors flex items-center gap-2"
        >
          {suggestion.actionText}
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => setDismissed(true)}
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="بستن پیشنهاد"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
