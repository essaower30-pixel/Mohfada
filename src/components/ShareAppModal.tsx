import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [appQrUrl, setAppQrUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/`
    : 'https://ais-dev-n6niorgs4l5qof6qdhjb2p-105836077369.europe-west2.run.app/';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(shareUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => setAppQrUrl(url))
        .catch((err) => console.error(err));
    }
  }, [isOpen, shareUrl]);

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'محفظة كاش الحي',
          text: 'رابط الانضمام واستخدام محفظة كاش الحي للتبادل المالي المحلي:',
          url: shareUrl,
        });
      } catch {
        // Ignored
      }
    } else {
      handleCopyLink();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl p-5 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200 relative z-[100000]">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">مشاركة التطبيق للعامة</h3>
              <p className="text-xs text-slate-400">باركود ورابط فتح التطبيق لأي مقيم</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-3">
          <div className="p-3 bg-white rounded-3xl inline-block shadow-xl border-4 border-slate-800">
            {appQrUrl ? (
              <img src={appQrUrl} alt="App QR" className="w-48 h-48 object-contain" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                جاري توليد الباركود...
              </div>
            )}
          </div>

          <p className="text-xs text-slate-300">
            امسح الباركود بكاميرا أي هاتف محمول لفتح المحفظة فوراً دون تحميل!
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>تم نسخ الرابط!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>نسخ رابط المحفظة</span>
                </>
              )}
            </button>

            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة الرابط عبر الواتساب والتطبيقات</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
