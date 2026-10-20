import React, { useState } from 'react';
import {
  Wallet,
  Building,
  LogOut,
  ChevronDown,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Share2,
  QrCode,
} from 'lucide-react';
import { useCommunityWallet } from '../services/walletState';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ChangePasswordModal } from './ChangePasswordModal';
import { AdminProfileModal } from './AdminProfileModal';
import { ShareAppModal } from './ShareAppModal';

interface TopNavProps {
  onOpenLogin: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenLogin }) => {
  const { currentUser, setView, state } = useCommunityWallet();
  const { isInstallable, triggerInstall } = usePWAInstall();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAdminProfile, setShowAdminProfile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Admin features are ONLY visible to the single designated manager user
  const isAdmin = currentUser.role === 'admin';

  const handleLogout = () => {
    setShowProfileMenu(false);
    onOpenLogin();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl p-0.5 shadow-md shrink-0 ${
              isAdmin
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-amber-500/20'
                : 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/20'
            }`}
          >
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              {isAdmin ? (
                <Building className="w-5 h-5 text-amber-400" />
              ) : (
                <Wallet className="w-5 h-5 text-emerald-400" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-white truncate">
                {isAdmin ? 'صندوق كاش الحي' : 'كاش الحي'}
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                  isAdmin
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isAdmin ? 'لوحة الإدارة والصندوق' : 'بديل محفظة الجيب'}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>سحابي</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {isAdmin ? 'إدارة تزويد الرصيد وصرف الكاش بالحي' : 'المحفظة الرقمية للتداول المحلي'}
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2">
          {/* PWA 1-Click Install Button */}
          {isInstallable && (
            <button
              type="button"
              onClick={triggerInstall}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 animate-pulse hover:opacity-90 transition cursor-pointer"
              title="تثبيت التطبيق على الهاتف"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>تثبيت التطبيق</span>
            </button>
          )}

          {/* Share App QR Button */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="مشاركة رابط وباركود التطبيق العام"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">باركود التطبيق</span>
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border transition cursor-pointer ${
                isAdmin
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 hover:border-amber-400'
                  : 'bg-slate-950 border-slate-700/80 hover:bg-slate-800 text-slate-200'
              }`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-xl object-cover border border-emerald-500/50 shrink-0"
              />
              <div className="text-right hidden sm:block">
                <span className="font-bold text-xs text-white block truncate max-w-[120px]">
                  {currentUser.shopName || currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 block font-num">
                  {currentUser.accountNumber}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute left-0 mt-2 w-72 rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/50"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {currentUser.shopName || currentUser.name}
                    </p>
                    <p className="text-xs text-slate-400 font-num">{currentUser.phone}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                      {currentUser.role === 'admin'
                        ? 'المدير المعتمد لتزويد الكاش'
                        : currentUser.role === 'merchant'
                        ? 'متجر معتمد بالحي'
                        : 'مواطن / مقيم'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">رقم الحساب:</span>
                    <span className="font-mono font-bold text-emerald-400 font-num">
                      {currentUser.accountNumber}
                    </span>
                  </div>
                  {isAdmin ? (
                    <>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                        <span className="text-slate-400">الكاش الفعلي في الدرج:</span>
                        <span className="font-bold text-amber-400 font-num">
                          {state.adminVault.cashInDrawer.toLocaleString()} ل.س
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">رصيد الخزينة الرقمي:</span>
                        <span className="font-bold text-emerald-400 font-num">
                          {state.adminVault.digitalVaultBalance.toLocaleString()} ل.س
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الرصيد المتوفر:</span>
                      <span className="font-bold text-white font-num">
                        {currentUser.balance.toLocaleString()} ل.س
                      </span>
                    </div>
                  )}
                </div>

                {/* If Admin: Quick Link to Edit Profile only (No personal wallet) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowAdminProfile(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>تعديل بيانات الإدارة والمقر</span>
                  </button>
                )}

                {/* Share App QR Button in Dropdown */}
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowShareModal(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>مشاركة باركود ورابط التطبيق للعامة</span>
                </button>

                {/* Change Password / PIN */}
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowChangePassword(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>تغيير كلمة المرور / رمز الدخول</span>
                </button>

                {/* Logout Button in Dropdown */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>تسجيل الخروج من الحساب</span>
                </button>
              </div>
            )}
          </div>

          {/* Dedicated Direct Logout Icon in the Navbar */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={showAdminProfile}
        onClose={() => setShowAdminProfile(false)}
      />

      {/* Public Share App Modal (Prevents 403 Forbidden errors) */}
      <ShareAppModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </header>
  );
};
