'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { api } from '@/services/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { QuickActions } from '@/components/ui/QuickActions';
import { ToastProvider } from '@/components/ui/Toast';
import { GlobalEntityProvider } from '@/contexts/GlobalEntityContext';
import { AdoptionProvider } from '@/providers/AdoptionProvider';
import { GlobalEntityModal } from '@/components/ui/GlobalEntityModal';
import { OnboardingTour } from '@/components/ui/OnboardingTour';
import { AiCopilotPanel } from '@/components/ui/AiCopilotPanel';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch(e) {}
    router.push('/login');
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        const user = res.user;
        const mandatoryRoles = ['SystemAdmin', 'Finance', 'WarehouseManager', 'FactoryManager'];
        if (mandatoryRoles.includes(user?.role?.name) && !user?.mfaEnabled) {
          if (pathname !== '/settings/security') {
            router.push('/settings/security');
          }
        }
      } catch (err) {
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
      }
    };
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    const checkScreen = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setIsMobile(true);
        setIsTablet(false);
        setSidebarOpen(false);
      } else if (width < 1024) {
        setIsMobile(false);
        setIsTablet(true);
        setSidebarOpen(false);
      } else {
        setIsMobile(false);
        setIsTablet(false);
        const saved = localStorage.getItem('sidebarOpen');
        setSidebarOpen(saved === null ? true : saved === 'true');
      }
    };

    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setSidebarOpen(newState);
    if (!isMobile && !isTablet) {
      localStorage.setItem('sidebarOpen', String(newState));
    }
  };

  // Prevent hydration mismatch layout jump
  // Removed: returning null in layout breaks Next.js app router hydration

  return (
    <ToastProvider>
      <AdoptionProvider>
        <GlobalEntityProvider>
          <div className="flex h-screen bg-background overflow-hidden text-foreground">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar Component */}
        <div className={`${isMobile ? 'fixed inset-y-0 right-0 z-40 shadow-2xl' : 'relative z-20'}`}>
          <Sidebar 
            isOpen={isSidebarOpen} 
            isMobile={isMobile}
            onLogoutClick={() => setShowLogoutModal(true)} 
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Header Component */}
          <Header 
            isSidebarOpen={isSidebarOpen} 
            onToggleSidebar={toggleSidebar} 
          />
          
          {/* Main Viewport */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
              {children}
          </main>
        </div>

        {/* Global Components */}
        <CommandPalette />
        <QuickActions />
        <GlobalEntityModal />
        <OnboardingTour />
        <AiCopilotPanel />

        {/* Logout Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                onClick={() => setShowLogoutModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 w-[90%] max-w-sm z-50 text-center border border-slate-100 dark:border-slate-800"
              >
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">خروج از سیستم</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-[13px] leading-relaxed">آیا مطمئن هستید که می‌خواهید خارج شوید؟ نشست فعلی شما پایان می‌یابد.</p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowLogoutModal(false)} variant="outline" className="flex-1">
                    انصراف
                  </Button>
                  <Button onClick={handleLogout} variant="danger" className="flex-1">
                    خروج
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
        </GlobalEntityProvider>
      </AdoptionProvider>
    </ToastProvider>
  );
}
