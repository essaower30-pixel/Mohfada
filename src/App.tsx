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

  // Only the designated admin user can see the AdminPortal
  const isAdmin = currentUser.role === 'admin';
  const showAdminPortal = isAdmin && state.activeView === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Navigation */}
      <TopNav onOpenLogin={() => setIsLoginOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {showAdminPortal ? (
          <AdminPortal />
        ) : (
          <UserWalletView
            onOpenBarcodeScan={handleOpenBarcodeScan}
            onOpenBarcodeShow={handleOpenBarcodeShow}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}
      </main>

      {/* Clean Footer without admin links for normal users */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            محفظة كاش الحي • بديل محفظة الجيب الورقية للتداول المحلي المباشر
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <button
              onClick={() => setIsLoginOpen(true)}
              className="text-slate-400 hover:text-white transition"
            >
              تبديل الحساب أو تسجيل الخروج
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

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}
