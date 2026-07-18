'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Target, Lightbulb, CheckCircle2, UserCheck } from 'lucide-react';
import { getToursForRole, TourStep } from '@/data/tours';
import { useAdoption } from '@/providers/AdoptionProvider';

export function OnboardingTour() {
  const pathname = usePathname();
  const { userRole } = useAdoption();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tourData, setTourData] = useState<TourStep[]>([]);
  const [tourKey, setTourKey] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Determine which tour to load based on pathname
    let key = '';
    if (pathname === '/dashboard' || pathname === '/') key = 'dashboard';
    else if (pathname.includes('/customers')) key = 'customers';
    else if (pathname.includes('/leads')) key = 'leads';
    else if (pathname.includes('/orders')) key = 'orders';
    else if (pathname.includes('/inventory')) key = 'inventory';

    const roleTours = getToursForRole(userRole);

    if (key && roleTours[key]) {
      setTourKey(key);
      setTourData(roleTours[key]);
      
      const lsKey = `crm_tour_${key}_completed`;
      const isCompleted = localStorage.getItem(lsKey) === 'true';
      const isGlobalCompleted = localStorage.getItem('crm_tour_completed') === 'true';
      
      // Auto-start if not completed
      if (!isCompleted && !isGlobalCompleted) {
        // Start after a slight delay to ensure DOM is ready
        setTimeout(() => setIsActive(true), 1500);
      }
    } else {
      setIsActive(false);
    }
  }, [pathname, userRole]);

  useEffect(() => {
    const handleTrigger = () => {
      setCurrentStep(0);
      setIsActive(true);
    };
    window.addEventListener('start-page-tour', handleTrigger);
    return () => window.removeEventListener('start-page-tour', handleTrigger);
  }, []);

  useEffect(() => {
    if (!isActive || tourData.length === 0) return;

    const updatePosition = () => {
      const step = tourData[currentStep];
      if (!step) return;
      
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        if (!isMobile) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    // Add interval to catch dynamically rendered elements
    const interval = setInterval(updatePosition, 500);
    return () => {
      window.removeEventListener('resize', updatePosition);
      clearInterval(interval);
    };
  }, [isActive, currentStep, tourData, isMobile]);

  // Accessibility: Escape to close, Enter to next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === 'Escape') endTour();
      if (e.key === 'Enter') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep]);

  const handleNext = () => {
    if (currentStep < tourData.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const endTour = () => {
    setIsActive(false);
    if (tourKey) {
      localStorage.setItem(`crm_tour_${tourKey}_completed`, 'true');
    }
  };

  const skipTour = () => {
    endTour();
    localStorage.setItem('crm_tour_completed', 'true'); // Never show automatically anywhere
  };

  if (!isActive || tourData.length === 0) return null;

  const currentStepData = tourData[currentStep];

  return (
    <div className="fixed inset-0 z-[120] pointer-events-none">
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] pointer-events-auto transition-all"
          onClick={endTour}
        />
      </AnimatePresence>

      <AnimatePresence>
        {isMobile ? (
          // Mobile Bottom Sheet
          <motion.div
            key="mobile-sheet"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl pointer-events-auto z-[130] flex flex-col max-h-[85vh]"
          >
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-4 mb-2" />
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-black text-slate-800 dark:text-white text-lg">{currentStepData.title}</h3>
                <button onClick={endTour} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {currentStepData.description}
                </p>
                
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 font-bold text-sm mb-1.5">
                    <Target className="w-4 h-4" /> چرا مهم است؟
                  </div>
                  <p className="text-[13px] text-amber-800 dark:text-amber-400/90 leading-relaxed">
                    {currentStepData.importance}
                  </p>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-500 font-bold text-sm mb-1.5">
                    <UserCheck className="w-4 h-4" /> وظیفه شما
                  </div>
                  <p className="text-[13px] text-indigo-800 dark:text-indigo-400/90 leading-relaxed">
                    {currentStepData.responsibility}
                  </p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-500 font-bold text-sm mb-1.5">
                    <Lightbulb className="w-4 h-4" /> ترفند حرفه‌ای
                  </div>
                  <p className="text-[13px] text-emerald-800 dark:text-emerald-400/90 leading-relaxed">
                    {currentStepData.proTip}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
              <button onClick={skipTour} className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium">
                رد کردن کل آموزش
              </button>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrev} disabled={currentStep === 0}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-md shadow-primary/20 flex items-center gap-2"
                >
                  {currentStep === tourData.length - 1 ? <><CheckCircle2 className="w-4 h-4" /> پایان</> : 'بعدی'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          // Desktop Tooltip
          <motion.div
            key="desktop-tooltip"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ 
              opacity: 1, scale: 1, y: 0,
              top: targetRect 
                ? Math.max(16, Math.min(window.innerHeight - 450, targetRect.height > 200 ? Math.max(16, targetRect.top + 64) : (currentStepData.position === 'bottom' ? targetRect.bottom + 16 : targetRect.top - 400))) 
                : window.innerHeight / 2 - 200,
              left: targetRect ? Math.max(16, Math.min(window.innerWidth - 380, targetRect.left + (targetRect.width / 2) - 190)) : window.innerWidth / 2 - 190
            }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            className="absolute w-[380px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 pointer-events-auto overflow-hidden flex flex-col z-[130]"
          >
            {/* Highlight Target Indicator */}
            {targetRect && (
              <div 
                className="fixed border-2 border-primary rounded-xl transition-all duration-300 pointer-events-none"
                style={{
                  top: targetRect.top - 8,
                  left: targetRect.left - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.4)'
                }}
              />
            )}

              <div className="p-6 relative z-10 bg-white dark:bg-slate-900">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-black text-slate-800 dark:text-white text-lg">{currentStepData.title}</h3>
                  <button onClick={endTour} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {currentStepData.description}
                  </p>
                  
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-500 font-bold text-xs mb-1">
                      <Target className="w-3.5 h-3.5" /> چرا مهم است؟
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-400/90 leading-relaxed">
                      {currentStepData.importance}
                    </p>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-500 font-bold text-xs mb-1">
                      <UserCheck className="w-3.5 h-3.5" /> وظیفه شما
                    </div>
                    <p className="text-xs text-indigo-800 dark:text-indigo-400/90 leading-relaxed">
                      {currentStepData.responsibility}
                    </p>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-500 font-bold text-xs mb-1">
                      <Lightbulb className="w-3.5 h-3.5" /> ترفند حرفه‌ای
                    </div>
                    <p className="text-xs text-emerald-800 dark:text-emerald-400/90 leading-relaxed">
                      {currentStepData.proTip}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-10">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  مرحله {currentStep + 1} از {tourData.length}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrev} disabled={currentStep === 0}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleNext}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-[13px] font-bold shadow-md transition-colors flex items-center gap-1.5"
                  >
                    {currentStep === tourData.length - 1 ? <><CheckCircle2 className="w-3.5 h-3.5" /> پایان</> : 'بعدی'}
                  </button>
                </div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
