import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Download,
  ExternalLink,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import QRCode from 'qrcode';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Canonical Public Shared App URL (Accessible to anyone without 403 Forbidden)
export const PUBLIC_APP_URL =
  'https://ais-pre-n6niorgs4l5qof6qdhjb2p-105836077369.europe-west2.run.app';

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(PUBLIC_APP_URL, {
      width: 320,
      margin: 2,
      color: {
        dark: '#022c22', // Deep emerald
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate App QR:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(PUBLIC_APP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'محفظة كاش الحي - بديل محفظة الجيب الورقية',
          text: 'افتح محفظة كاش الحي للتداول المحلي المباشر:',
          url: PUBLIC_APP_URL,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = 'barq_cash_app_qr.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 font-['Cairo',sans-serif]">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative z-[100000]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">باركود ورابط التطبيق العام</h3>
              <p className="text-[11px] text-slate-400">امسح الكود بكاميرا الموبايل لفتح التطبيق فوراً</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Why Error 403 Happens Clarification Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>تنبيه هام لتجنب خطأ 403 Forbidden:</span>
            </div>
            <p className="text-[11px] text-slate-300">
              خطأ 403 يحدث فقط عند مسح رابط شاشة التطوير <span className="text-amber-300 font-mono text-[10px]">aistudio.google.com</span>. هذا الباركود أدناه مبرمج على <strong className="text-emerald-400">الرابط العام المباشر</strong> الذي يفتح عند أي مستخدم بكل سلاسة!
            </p>
          </div>

          {/* QR Code Container */}
          <div className="bg-slate-950 border-2 border-emerald-500/30 rounded-3xl p-5 text-center shadow-xl">
            <div className="w-56 h-56 bg-white p-3 rounded-2xl mx-auto shadow-2xl flex items-center justify-center border-4 border-emerald-500/40">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="App Public QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
                  <QrCode className="w-10 h-10 animate-spin text-emerald-500" />
                  <span className="text-xs">جاري تجهيز الباركود...</span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-1">
              <p className="font-extrabold text-sm text-white">
                وجه كاميرا الهاتف نحو الباركود لفتح التطبيق
              </p>
              <p className="text-[11px] text-slate-400">
                يعمل على جميع أجهزة أندرويد و iPhone بدون تسجيل دخول جوجل
              </p>
            </div>
          </div>

          {/* Public Link Box */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-400 font-bold block">الرابط العام المباشر للتطبيق:</span>
            <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-xs text-emerald-400 font-mono truncate select-all dir-ltr text-left">
                {PUBLIC_APP_URL}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition cursor-pointer"
                title="نسخ الرابط"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleNativeShare}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>{copied ? 'تم النسخ!' : 'مشاركة الرابط'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-400 shrink-0" />
              <span>تحميل صورة الباركود</span>
            </button>
          </div>

          <a
            href={PUBLIC_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>تجربة فتح الرابط العام في نافذة جديدة</span>
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
};
