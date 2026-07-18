'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AchievementToast } from '@/components/ui/AchievementToast';

interface AdoptionContextType {
  onboardingLevel: number;
  healthScore: number;
  progressPercentage: number;
  achievements: string[];
  trackEvent: (eventKey: string) => void;
  unlockAchievement: (achievementId: string, title: string) => void;
  userRole: string;
}

const AdoptionContext = createContext<AdoptionContextType | undefined>(undefined);

export const useAdoption = () => {
  const context = useContext(AdoptionContext);
  if (!context) throw new Error('useAdoption must be used within AdoptionProvider');
  return context;
};

export const AdoptionProvider = ({ children }: { children: ReactNode }) => {
  const [onboardingLevel, setOnboardingLevel] = useState(1);
  const [healthScore, setHealthScore] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [toast, setToast] = useState<{ id: string; title: string } | null>(null);
  const [userRole, setUserRole] = useState('SystemAdmin');

  useEffect(() => {
    // 1. Get Role
    try {
      const userStr = localStorage.getItem('crm_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.role?.name) {
          setUserRole(user.role.name);
        }
      }
    } catch (e) {}

    // 2. Load Progress & Achievements
    loadAdoptionState();

    // 3. Setup Listeners for automatic event tracking
    const handleStorageChange = () => loadAdoptionState();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadAdoptionState = () => {
    // Determine level from completed tours
    const isL1 = localStorage.getItem('crm_tour_dashboard_completed') === 'true';
    const isL2 = localStorage.getItem('crm_tour_orders_completed') === 'true';
    const isL3 = localStorage.getItem('crm_tour_inventory_completed') === 'true';
    const isL4 = localStorage.getItem('crm_tour_ai-assistant_completed') === 'true';
    
    let level = 1;
    let progress = 25;
    if (isL1) { level = 2; progress = 50; }
    if (isL1 && isL2) { level = 3; progress = 75; }
    if (isL1 && isL2 && isL3 && isL4) { level = 4; progress = 100; }
    
    setOnboardingLevel(level);
    setProgressPercentage(progress);

    // Achievements
    const savedAchievements = JSON.parse(localStorage.getItem('crm_achievements') || '[]');
    setAchievements(savedAchievements);

    // Health Score (0-100)
    // Formula: log(visits) + AI uses + tasks + customization
    const logins = parseInt(localStorage.getItem('crm_stats_logins') || '0', 10);
    const aiUses = parseInt(localStorage.getItem('crm_stats_ai_uses') || '0', 10);
    const customized = localStorage.getItem('dashboardExecutiveLayoutV1') ? 20 : 0;
    
    let score = Math.min(20, logins * 2) + Math.min(30, aiUses * 5) + customized + (progress * 0.3);
    setHealthScore(Math.min(100, Math.round(score)));
  };

  const trackEvent = (eventKey: string) => {
    const current = parseInt(localStorage.getItem(`crm_stats_${eventKey}`) || '0', 10);
    localStorage.setItem(`crm_stats_${eventKey}`, (current + 1).toString());
    
    // Achievement checks
    if (eventKey === 'logins' && current === 0) unlockAchievement('first_login', 'اولین ورود به سیستم');
    if (eventKey === 'lead_created' && current === 0) unlockAchievement('first_lead', 'اولین سرنخ ثبت شد');
    if (eventKey === 'ai_uses' && current === 0) unlockAchievement('first_ai', 'اولین تحلیل هوش مصنوعی انجام شد');
    if (eventKey === 'customer_created' && current === 9) unlockAchievement('10_customers', '۱۰ مشتری ثبت شد');

    loadAdoptionState();
  };

  const unlockAchievement = (achievementId: string, title: string) => {
    const saved = JSON.parse(localStorage.getItem('crm_achievements') || '[]');
    if (!saved.includes(achievementId)) {
      const updated = [...saved, achievementId];
      localStorage.setItem('crm_achievements', JSON.stringify(updated));
      setAchievements(updated);
      setToast({ id: achievementId, title });
      setTimeout(() => setToast(null), 4000);
      
      // Also add points to health
      loadAdoptionState();
    }
  };

  return (
    <AdoptionContext.Provider value={{ onboardingLevel, healthScore, progressPercentage, achievements, trackEvent, unlockAchievement, userRole }}>
      {children}
      {toast && <AchievementToast title={toast.title} onClose={() => setToast(null)} />}
    </AdoptionContext.Provider>
  );
};
