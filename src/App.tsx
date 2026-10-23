import React, { useState, useEffect } from 'react';
import { useCommunityWallet } from './services/walletState';
import { testFirebaseConnection } from './services/firebase';
import { TopNav } from './components/TopNav';
import { UserWalletView } from './components/UserWalletView';
import { AdminPortal } from './components/AdminPortal';
import { LoginModal } from './components/LoginModal';
import { BarcodeModal } from './components/BarcodeModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ShareAppModal } from './components/ShareAppModal';

export default function App() {
  const { state, currentUser } = useCommunityWallet();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInitialMode, setBarcodeInitialMode] = useState<'scan' | 'show'>('scan');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showShareAppModal, setShowShareAppModal] = useState(false);

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
      {/* Top Navbar */}
      <TopNav
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
        onOpenBarcodeScan={handleOpenBarcodeScan}
        onOpenBarcodeShow={handleOpenBarcodeShow}
        onOpenShareApp={() => setShowShareAppModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 pb-12">
        {currentUser ? (
          state.activeView === 'admin' ? (
            <AdminPortal />
          ) : (
            <UserWalletView
              onOpenBarcodeScan={handleOpenBarcodeScan}
              onOpenBarcodeShow={handleOpenBarcodeShow}
              onOpenLogin={() => setShowLoginModal(true)}
            />
          )
        ) : (
          <LoginModal
            isOpen={true}
            isStandalone={true}
            initialTab="login"
          />
        )}
      </main>

      {/* Modals */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          initialTab="login"
        />
      )}

      {showBarcodeModal && (
        <BarcodeModal
          isOpen={showBarcodeModal}
          initialMode={barcodeInitialMode}
          onClose={() => setShowBarcodeModal(false)}
        />
      )}

      {showChangePasswordModal && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}

      {showShareAppModal && (
        <ShareAppModal
          isOpen={showShareAppModal}
          onClose={() => setShowShareAppModal(false)}
        />
      )}
    </div>
  );
}
