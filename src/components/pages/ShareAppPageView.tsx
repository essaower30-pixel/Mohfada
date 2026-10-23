import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Download,
  ArrowRight,
  Sparkles,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface ShareAppPageViewProps {
  onBackToHome: () => void;
}

export const ShareAppPageView: React.FC<ShareAppPageViewProps> = ({ onBackToHome }) => {
  const { isInstallable, triggerInstall } = usePWAInstall();

  const [installQrUrl, setInstallQrUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const appShareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/`
      : 'https://ais-dev-n6niorgs4l5qof6qdhjb2p-105836077369.europe-west2.run.app/';

  useEffect(() => {
    QRCode.toDataURL(appShareUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
      .then((url) => setInstallQrUrl(url))
      .catch((err) => console.error(err));
  }, [appShareUrl]);

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(appShareUrl);
      setCopiedLink(true);
      confetti({ particleCount: 30, spread: 50 });
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({
          title: 'كاش الحي - محفظة الجيب الرقمية',
          text: 'انضم إلى شبكة كاش الحي للتداول المالي الفوري والشراء بدون كاش ورقي!',
          url: appShareUrl,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0 shadow-md">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              مشاركة التطبيق وتثبيته في الحي
            </h2>
            <p className="text-xs text-slate-400">
              شارك رابط وباركود التطبيق مع الجيران وأصحاب المحلات للانضمام فوراً
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

      {/* Main Content Card */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-5">
        {/* QR Display */}
        <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-teal-500/30">
          {installQrUrl ? (
            <img src={installQrUrl} alt="App Install QR" className="w-60 h-60 sm:w-68 sm:h-68 rounded-xl object-contain" />
          ) : (
            <div className="w-60 h-60 flex items-center justify-center text-slate-400 text-xs font-bold">
              جاري تجهيز الباركود...
            </div>
          )}
        </div>

        <div className="max-w-md space-y-2">
          <h3 className="text-base sm:text-lg font-black text-white">
            امسح الباركود لفتح التطبيق وتثبيته على الهاتف فوراً
          </h3>
          <p className="text-xs text-slate-400">
            يعمل التطبيق على جميع أجهزة آيفون وأندرويد والكمبيوتر كـ تطبيق سريع وخفيف بدون الحاجة للتحميل من المتجر.
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full max-w-sm space-y-2.5">
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-3 px-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-teal-500/20"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة رابط التطبيق عبر الواتساب / الرسائل</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'تم نسخ الرابط بنجاح!' : 'نسخ رابط التطبيق المباشر'}</span>
          </button>

          {isInstallable && (
            <button
              type="button"
              onClick={triggerInstall}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق على هذا الجهاز الآن</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
