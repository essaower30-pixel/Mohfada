import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { UserWalletView } from './components/UserWalletView';
import { AdminPortal } from './components/AdminPortal';
import { BarcodeModal } from './components/BarcodeModal';
import { LoginModal } from './components/LoginModal';
import { useCommunityWallet } from './services/walletState';
import { testFirebaseConnection } from './services/firebase';

export default function App() {
  const { state, currentUser } = useCommunityWallet();

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  // Modal controls
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [barcodeTab, setBarcodeTab] = useState<'scan' | 'show'>('scan');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleOpenBarcodeScan = () => {
    setBarcodeTab('scan');
    setIsBarcodeOpen(true);
  };

  const handleOpenBarcodeShow = () => {
    setBarcodeTab('show');
    setIsBarcodeOpen(true);
  };

  // If no user is logged in (fresh install / new user / logged out), show standalone modal
  // If user previously logged in/out, default to 'login' tab so they can immediately type password; otherwise 'register'
  const hasRememberedUser =
    typeof window !== 'undefined' &&
    (!!localStorage.getItem('pocket_cash_last_user_phone') ||
     !!localStorage.getItem('pocket_cash_last_user_id') ||
     !!localStorage.getItem('pocket_cash_last_user_name'));

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
        <TopNav onOpenLogin={() => setIsLoginOpen(true)} />

        <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col items-center justify-center">
          <LoginModal
            isOpen={true}
            isStandalone={true}
            initialTab={hasRememberedUser ? 'login' : 'register'}
          />
        </main>

        <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              محفظة كاش الحي • بديل محفظة الجيب الورقية للتداول المحلي المباشر
            </p>
            <p className="text-[11px] text-slate-400">
              سجّل حسابك الجديد مجاناً أو ادخل برقم هاتفك للبدء فوراً
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Admin has no personal wallet - directly opens AdminPortal (Vault & Cash Desk)
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Navigation */}
      <TopNav onOpenLogin={() => setIsLoginOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-2.5 sm:py-6 pb-24 sm:pb-8">
        {isAdmin ? (
          <AdminPortal />
        ) : (
          <UserWalletView
            onOpenBarcodeScan={handleOpenBarcodeScan}
            onOpenBarcodeShow={handleOpenBarcodeShow}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}
      </main>

      {/* Clean Footer (Desktop only to prevent mobile scrolling) */}
      <footer className="hidden sm:block border-t border-slate-900 bg-slate-950/80 py-5 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            محفظة كاش الحي • بديل محفظة الجيب الورقية للتداول المحلي المباشر
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <button
              onClick={() => setIsLoginOpen(true)}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              تبديل الحساب أو تسجيل مستخدم آخر
            </button>
          </div>
        </div>
      </footer>

      {/* Barcode Payment & Receive Modal */}
      <BarcodeModal
        isOpen={isBarcodeOpen}
        initialTab={barcodeTab}
        onClose={() => setIsBarcodeOpen(false)}
        onSuccess={(code) => {
          // Success handled in modal
        }}
      />

      {/* Login / Switch Account Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        isStandalone={false}
        initialTab="login"
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}
