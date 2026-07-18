'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '../ui/Tooltip';
import { AdoptionStatus } from '@/components/ui/AdoptionStatus';
import { 
  Home, Users, BadgeDollarSign, MapPin, CheckSquare, 
  BrainCircuit, Presentation, Building, Archive, ArrowLeftRight, 
  ReceiptText, CreditCard, Wallet, Target, Award, Trophy, 
  PieChart, Package, FileCheck2, LockKeyhole, MonitorSmartphone, 
  ShieldAlert, Settings, LogOut, ChevronLeft, TrendingUp
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onLogoutClick: () => void;
  isMobile?: boolean;
}

// Grouped Menu structure
const menuGroups = [
  {
    label: 'داشبورد',
    items: [
      { icon: Home, label: 'داشبورد', href: '/dashboard' },
    ]
  },
  {
    label: 'فروش',
    items: [
      { icon: Users, label: 'سرنخ‌ها', href: '/leads' },
      { icon: TrendingUp, label: 'فرصت‌های فروش', href: '/opportunities' },
      { icon: PieChart, label: 'گزارش قیف فروش', href: '/opportunities/dashboard' },
      { icon: Users, label: 'مشتریان', href: '/customers' },
      { icon: Presentation, label: 'جلسات ارائه', href: '/presentations' },
      { icon: MapPin, label: 'ویزیت‌ها', href: '/visits' },
      { icon: ReceiptText, label: 'سفارشات', href: '/orders' },
    ]
  },
  {
    label: 'مالی',
    items: [
      { icon: CreditCard, label: 'اسناد دریافتی', href: '/cheques' },
      { icon: BadgeDollarSign, label: 'دریافتی‌ها', href: '/payments' },
      { icon: Wallet, label: 'مطالبات', href: '/receivables' },
    ]
  },
  {
    label: 'انبار',
    items: [
      { icon: Building, label: 'انبارها', href: '/warehouses' },
      { icon: Archive, label: 'موجودی', href: '/inventory' },
      { icon: ArrowLeftRight, label: 'گردش کالا', href: '/inventory/movements' },
      { icon: Package, label: 'محصولات', href: '/products' },
    ]
  },
  {
    label: 'تحلیل',
    items: [
      { icon: Target, label: 'اهداف فروش', href: '/kpi' },
      { icon: Award, label: 'پورسانت‌ها', href: '/commissions' },
      { icon: Trophy, label: 'رتبه‌بندی‌ها', href: '/rankings' },
      { icon: PieChart, label: 'گزارشات', href: '/reports' },
      { icon: ShieldAlert, label: 'گزارش پیامک‌ها', href: '/reports/sms' },
    ]
  },
  {
    label: 'هوش مصنوعی',
    items: [
      { icon: BrainCircuit, label: 'دستیار هوشمند', href: '/ai-assistant' },
      { icon: BrainCircuit, label: 'هوش فروش', href: '/ai-insights' },
    ]
  },
  {
    label: 'مدیریت و امنیت',
    items: [
      { icon: Users, label: 'مدیریت کاربران', href: '/users' },
      { icon: FileCheck2, label: 'تأییدیه‌ها', href: '/approvals' },
      { icon: LockKeyhole, label: 'سطوح دسترسی', href: '/permissions' },
      { icon: MonitorSmartphone, label: 'نشست‌های فعال', href: '/sessions' },
      { icon: ShieldAlert, label: 'امنیت', href: '/security-dashboard' },
      { icon: Settings, label: 'تنظیمات', href: '/settings' },
    ]
  }
];

export function Sidebar({ isOpen, onLogoutClick, isMobile = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : (isMobile ? 0 : 72) }}
      className={`bg-sidebar-bg flex flex-col shadow-sm h-full overflow-hidden transition-all duration-200 ${isOpen || !isMobile ? 'border-l border-border' : ''}`}
    >
      <div className="h-16 flex items-center justify-center border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-xl text-foreground whitespace-nowrap"
              >
                CRM روانکار
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {isOpen && <AdoptionStatus />}
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-6">
            {isOpen && (
              <div className="px-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {group.label}
              </div>
            )}
            <ul className="space-y-1 px-3">
              {group.items.map((item) => {
                // Find the best match (longest href) across all menu items
                const allItems = menuGroups.flatMap(g => g.items);
                const matchingItems = allItems.filter(i => pathname === i.href || pathname.startsWith(i.href + '/'));
                const bestMatch = matchingItems.sort((a, b) => b.href.length - a.href.length)[0];
                
                const active = bestMatch ? bestMatch.href === item.href : (pathname === item.href || pathname.startsWith(item.href + '/'));
                const liContent = (
                  <Link href={item.href}>
                    <div className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${active ? 'bg-primary/10 text-primary dark:text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                      <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`} />
                      <AnimatePresence>
                        {isOpen && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="mr-3 font-medium whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {!isOpen ? (
                      <Tooltip content={item.label} position="left">
                        {liContent}
                      </Tooltip>
                    ) : (
                      liContent
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        {isOpen ? (
          <button
            onClick={onLogoutClick}
            className="flex items-center w-full px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="mr-3 font-medium whitespace-nowrap">خروج از سیستم</span>
          </button>
        ) : (
          <Tooltip content="خروج از سیستم" position="left">
            <button
              onClick={onLogoutClick}
              className="flex items-center justify-center w-full px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
            </button>
          </Tooltip>
        )}
      </div>
    </motion.aside>
  );
}
