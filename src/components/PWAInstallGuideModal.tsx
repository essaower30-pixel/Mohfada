import React from 'react';
import { X, Smartphone, Download, Share2, CheckCircle2, Sparkles, ArrowDown } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, triggerInstall } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await triggerInstall();
      if (installed) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-right overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-20 bg-emerald-500/15 blur-2xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="relative mb-3">
            <img
              src="/pwa-192x192.png"
              alt="شعار محفظة كاش الحي"
              className="w-20 h-20 rounded-2xl shadow-xl shadow-emerald-500/20 border border-emerald-500/40 object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full shadow">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">
            تثبيت محفظة كاش الحي
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            تثبيت التطبيق يمنحك تجربة محفظة حقيقية سريعة تفتح بضغطة زر وتعمل كبديل كامل لمحفظة الجيب
          </p>
        </div>

        {/* One-Click Native Install Button (if available) */}
        {isInstallable && (
          <div className="mb-5">
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:opacity-95 transition cursor-pointer animate-pulse"
            >
              <Download className="w-5 h-5" />
              <span>تثبيت التطبيق الآن بنقرة واحدة</span>
            </button>
          </div>
        )}

        {/* Step-by-Step Guidance */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-sm">
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-slate-800">
            <Smartphone className="w-4 h-4" />
            <span>خطوات التثبيت السريع على الهاتف:</span>
          </div>

          {/* Android Steps */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">
              لهواتف أندرويد (Google Chrome):
            </div>
            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside pr-1">
              <li>
                اضغط على القائمة <strong className="text-white">( ⋮ )</strong> بأعلى أو أسفل متصفح Chrome.
              </li>
              <li>
                اختر <strong className="text-emerald-400">"تثبيت التطبيق"</strong> أو <strong className="text-emerald-400">"إضافة إلى الشاشة الرئيسية"</strong>.
              </li>
              <li>
                اضغط على <strong className="text-white">"تثبيت"</strong> لتنزيل أيقونة المحفظة مباشرة على شاشة هاتفك.
              </li>
            </ol>
          </div>

          {/* iOS Steps */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="text-xs font-semibold text-slate-300">
              لهواتف آيفون (Safari):
            </div>
            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside pr-1">
              <li>
                اضغط على زر المشاركة <strong className="text-white">(Share)</strong> بالأسفل.
              </li>
              <li>
                اسحب للأسفل واضغط <strong className="text-emerald-400">"إضافة إلى الصفحة الرئيسية"</strong>.
              </li>
            </ol>
          </div>
        </div>

        {/* Quick Features summary */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-800/40 p-2 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>يعمل بدون شريط متصفح</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/40 p-2 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>دخول فوري بلمسة واحدة</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
        >
          فهمت ذلك، إغلاق
        </button>
      </div>
    </div>
  );
};
