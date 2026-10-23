import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Sparkles,
  Smartphone,
  Banknote,
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../../services/walletState';

interface MyQrPageViewProps {
  onBackToHome: () => void;
}

export const MyQrPageView: React.FC<MyQrPageViewProps> = ({ onBackToHome }) => {
  const { currentUser } = useCommunityWallet();

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [requestAmount, setRequestAmount] = useState<string>('');
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const amtNum = parseFloat(requestAmount) || 0;
      const payload = JSON.stringify({
        app: 'pocket_cash',
        account: currentUser.accountNumber,
        phone: currentUser.phone,
        name: currentUser.shopName || currentUser.name,
        amount: amtNum > 0 ? amtNum : undefined,
      });

      QRCode.toDataURL(payload, {
        width: 360,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    }
  }, [currentUser, requestAmount]);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  const handleCopyAcc = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(currentUser.accountNumber);
      setCopiedAcc(true);
      confetti({ particleCount: 30, spread: 50 });
      setTimeout(() => setCopiedAcc(false), 2000);
    }
  };

  const handleCopyPhone = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(currentUser.phone);
      setCopiedPhone(true);
      confetti({ particleCount: 30, spread: 50 });
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-md">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              باركود حسابي المالي
            </h2>
            <p className="text-xs text-slate-400">
              اعرض هذا الكود للزبائن أو المشتركين لاستلام الدفعات فورياً
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToHome}
          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرئيسية</span>
        </button>
      </div>

      {/* Main QR Card */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-5">
        {/* User Badge */}
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={currentUser.name}
            className="w-12 h-12 rounded-2xl object-cover border-2 border-cyan-400 shrink-0 shadow-md"
          />
          <div className="text-right">
            <h3 className="font-black text-base text-white">
              {currentUser.shopName || currentUser.name}
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {isAdmin ? 'إدارة الصندوق' : currentUser.role === 'merchant' ? 'متجر معتمد' : 'مواطن'}
            </span>
          </div>
        </div>

        {/* QR Image Display */}
        <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-cyan-500/30">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="Account QR Code" className="w-60 h-60 sm:w-68 sm:h-68 rounded-xl object-contain" />
          ) : (
            <div className="w-60 h-60 flex items-center justify-center text-slate-400 text-xs font-bold">
              جاري تجهيز الباركود...
            </div>
          )}
        </div>

        {/* Optional Custom Amount Input */}
        <div className="w-full max-w-sm space-y-1.5 text-right">
          <label className="block text-xs font-bold text-slate-300">
            تحديد مبلغ محدد على الباركود (اختياري):
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              placeholder="مثال: 50000 ل.س (اتركه فارغاً لأي مبلغ)"
              className="w-full bg-slate-950 text-white font-num text-sm rounded-xl px-3.5 py-2.5 border border-slate-800 focus:border-cyan-500 outline-none text-left"
            />
            {requestAmount && (
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-cyan-400">
                ل.س
              </span>
            )}
          </div>
        </div>

        {/* Copy Account Details */}
        <div className="w-full max-w-sm grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyAcc}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copiedAcc ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="font-mono">{copiedAcc ? 'تم النسخ!' : currentUser.accountNumber}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPhone}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copiedPhone ? <Check className="w-4 h-4 text-emerald-400" /> : <Smartphone className="w-4 h-4" />}
            <span className="font-num">{copiedPhone ? 'تم النسخ!' : currentUser.phone}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
