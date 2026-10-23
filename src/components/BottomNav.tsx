import React from 'react';
import {
  Wallet,
  Building,
  UserCog,
  Shield,
  Zap,
  Clock,
  KeyRound,
  Share2,
} from 'lucide-react';
import { useCommunityWallet } from '../services/walletState';

export type BottomNavTab = 'home' | 'quick_pay' | 'history' | 'profile' | 'password' | 'share';

interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { currentUser, state } = useCommunityWallet();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  const tabs: Array<{
    id: BottomNavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      id: 'home',
      label: isAdmin && state.activeView === 'admin' ? 'الصندوق' : 'الرئيسية',
      icon: isAdmin && state.activeView === 'admin' ? Building : Wallet,
    },
    {
      id: 'quick_pay',
      label: 'الدفع السريع',
      icon: Zap,
    },
    {
      id: 'history',
      label: 'سجل العمليات',
      icon: Clock,
    },
    {
      id: 'profile',
      label: isAdmin ? 'بيانات الإدارة' : 'تعديل بياناتي',
      icon: isAdmin ? Shield : UserCog,
    },
    {
      id: 'password',
      label: 'كلمة المرور',
      icon: KeyRound,
    },
    {
      id: 'share',
      label: 'المشاركة',
      icon: Share2,
    },
  ];

  return (
    <nav
      aria-label="شريط التنقل السفلي"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t-2 border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.6)]"
    >
      <div className="max-w-2xl mx-auto px-2 py-1.5 flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all duration-200 cursor-pointer relative ${
                isActive
                  ? isAdmin
                    ? 'text-amber-300 bg-amber-500/15 shadow-sm'
                    : 'text-emerald-300 bg-emerald-500/15 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {/* Active top pill indicator */}
              {isActive && (
                <span
                  className={`absolute -top-1.5 w-6 h-1 rounded-full ${
                    isAdmin
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                  }`}
                />
              )}

              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
              />
              <span
                className={`text-[10px] font-bold mt-1 tracking-tight truncate max-w-[58px] sm:max-w-none text-center ${
                  isActive ? 'font-black' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
