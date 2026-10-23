import React from 'react';
import {
  Wallet,
  LogOut,
  LogIn,
  Download,
} from 'lucide-react';
import { useCommunityWallet } from '../services/walletState';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TopNavProps {
  onOpenLogin: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenLogin }) => {
  const { state, currentUser, setView, logout } = useCommunityWallet();
  const { isInstallable, triggerInstall } = usePWAInstall();

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => currentUser && isAdmin && setView('admin')}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
              <span>كاش الحي</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                محفظة الجيب
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">تداول محلي فوري وبديل الكاش الورقي</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              {/* User badge */}
              <div className="hidden xs:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-slate-200 truncate max-w-[140px]">
                  {currentUser.shopName || currentUser.name}
                </span>
              </div>

              {/* Install PWA button if available */}
              {isInstallable && (
                <button
                  type="button"
                  onClick={triggerInstall}
                  className="py-1.5 px-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/25 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">تثبيت التطبيق</span>
                </button>
              )}

              {/* Logout button */}
              <button
                type="button"
                onClick={logout}
                className="py-1.5 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول / اشتراك</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
