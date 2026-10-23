import React, { useState, useEffect } from 'react';
import { useCommunityWallet } from './services/walletState';
import { testFirebaseConnection } from './services/firebase';
import { TopNav } from './components/TopNav';
import { BottomNav, BottomNavTab } from './components/BottomNav';
import { UserWalletView } from './components/UserWalletView';
import { AdminPortal } from './components/AdminPortal';
import { LoginModal } from './components/LoginModal';
import { BarcodeModal } from './components/BarcodeModal';
import { QuickPayPageView } from './components/pages/QuickPayPageView';
import { HistoryPageView } from './components/pages/HistoryPageView';
import { ProfilePageView } from './components/pages/ProfilePageView';
import { ChangePasswordPageView } from './components/pages/ChangePasswordPageView';
import { ShareAppPageView } from './components/pages/ShareAppPageView';

export default function App() {
  const { state, currentUser } = useCommunityWallet();

  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Barcode modal for quick home card action buttons
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInitialMode, setBarcodeInitialMode] = useState<'scan' | 'show'>('scan');

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const handleOpenBarcodeScan = () => {
    setBarcodeInitialMode('scan');
    setShowBarcodeModal(true);
  };

  const handleOpenBarcodeShow = () => {
    setBarcodeInitialMode('show');
    setShowBarcodeModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Clean Top Header (No duplicate toolbar) */}
      <TopNav onOpenLogin={() => setShowLoginModal(true)} />

      {/* Main Container - with bottom padding to ensure content is never hidden behind the persistent bottom bar */}
      <main className="flex-1 pb-24 sm:pb-20">
        {currentUser ? (
          <>
            {activeTab === 'home' && (
              state.activeView === 'admin' ? (
                <AdminPortal
                  onOpenEditProfile={() => setActiveTab('profile')}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              ) : (
                <UserWalletView
                  onOpenBarcodeScan={handleOpenBarcodeScan}
                  onOpenBarcodeShow={handleOpenBarcodeShow}
                  onOpenLogin={() => setShowLoginModal(true)}
                  onOpenEditProfile={() => setActiveTab('profile')}
                  onOpenChangePassword={() => setActiveTab('password')}
                />
              )
            )}

            {activeTab === 'quick_pay' && (
              <QuickPayPageView onBackToHome={() => setActiveTab('home')} />
            )}

            {activeTab === 'history' && (
              <HistoryPageView onBackToHome={() => setActiveTab('home')} />
            )}

            {activeTab === 'profile' && (
              <ProfilePageView onBackToHome={() => setActiveTab('home')} />
            )}

            {activeTab === 'password' && (
              <ChangePasswordPageView onBackToHome={() => setActiveTab('home')} />
            )}

            {activeTab === 'share' && (
              <ShareAppPageView onBackToHome={() => setActiveTab('home')} />
            )}
          </>
        ) : (
          <LoginModal
            isOpen={true}
            isStandalone={true}
            initialTab="login"
          />
        )}
      </main>

      {/* Persistent Bottom Toolbar (Visible on ALL pages when logged in) */}
      {currentUser && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Barcode Modal (Camera / Studio QR scanner & My QR) for Home page card buttons */}
      {showBarcodeModal && (
        <BarcodeModal
          isOpen={showBarcodeModal}
          initialMode={barcodeInitialMode}
          onClose={() => setShowBarcodeModal(false)}
        />
      )}

      {/* Login Modal for guest access */}
      {showLoginModal && !currentUser && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          initialTab="login"
        />
      )}
    </div>
  );
}
