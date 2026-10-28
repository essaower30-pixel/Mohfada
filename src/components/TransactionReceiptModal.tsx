import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Smartphone,
  ExternalLink,
  QrCode,
  FileText,
  Percent,
  Calendar,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { LocalTransaction, CommunityUser } from '../types/wallet';
import {
  generateReceiptImage,
  generateReceiptText,
  formatReceiptDate,
  getReceiptTxTypeLabel,
  shareReceiptAsImageOnly,
  copyReceiptImageToClipboard,
  downloadReceiptImageFile,
} from '../utils/receiptGenerator';
import { openWhatsApp } from '../utils/whatsapp';

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: LocalTransaction | null;
  currentUser?: CommunityUser | null;
  recipientPhone?: string;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  currentUser,
  recipientPhone,
}) => {
  const [imageGenerating, setImageGenerating] = useState(false);
  const [generatedImageData, setGeneratedImageData] = useState<{
    dataUrl: string;
    blob: Blob;
    fileName: string;
  } | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [showTextOptions, setShowTextOptions] = useState(false);

  // Generate Ultra-HD 4K image whenever a new transaction is selected
  useEffect(() => {
    if (!isOpen || !transaction) {
      setGeneratedImageData(null);
      setFeedbackMsg('');
      setShowTextOptions(false);
      return;
    }

    let isMounted = true;
    setImageGenerating(true);

    generateReceiptImage(transaction)
      .then((res) => {
        if (isMounted) {
          setGeneratedImageData(res);
          setImageGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate high-res receipt image:', err);
        if (isMounted) {
          setImageGenerating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const isFeeApplicable = typeof transaction.fee === 'number' && transaction.fee > 0;
  const totalDeducted = transaction.amount + (transaction.fee || 0);
  const receiptText = generateReceiptText(transaction);
  const targetPhone = recipientPhone || '';

  // 1. Primary Action: Share ONLY the Image directly to WhatsApp (No text attached!)
  const handleShareImageOnlyToWhatsApp = async () => {
    if (!generatedImageData) {
      setFeedbackMsg('جاري تحضير صورة الإيصال بدقة عالية...');
      return;
    }

    try {
      setFeedbackMsg('جاري فتح الواتساب لمشاركة صورة الإيصال فقط...');
      // IMPORTANT: share ONLY the image file, NO text caption
      const sharedNatively = await shareReceiptAsImageOnly({
        blob: generatedImageData.blob,
        fileName: generatedImageData.fileName,
      });

      if (!sharedNatively) {
        // Fallback for browsers without direct file sharing (e.g. desktop):
        // Automatically download image & copy to clipboard so user can paste into WhatsApp
        downloadReceiptImageFile(
          generatedImageData.dataUrl,
          generatedImageData.fileName
        );
        await copyReceiptImageToClipboard(generatedImageData.blob);

        setFeedbackMsg(
          'تم تنزيل الصورة ونسخها للحافظة! يمكنك الآن لصقها مباشرة في محادثة الواتساب (Ctrl+V أو لصق).'
        );
      } else {
        setFeedbackMsg('تمت مشاركة صورة الإيصال بنجاح!');
        setTimeout(() => setFeedbackMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error sharing receipt image:', err);
      downloadReceiptImageFile(
        generatedImageData.dataUrl,
        generatedImageData.fileName
      );
      setFeedbackMsg('تم حفظ صورة الإيصال في جهازك.');
    }
  };

  // 2. Download Image at 4K Resolution
  const handleDownloadImage = () => {
    if (!generatedImageData) return;
    downloadReceiptImageFile(
      generatedImageData.dataUrl,
      generatedImageData.fileName
    );
    setFeedbackMsg('تم حفظ صورة الإيصال بدقة فائقة 4K في جهازك بنجاح!');
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  // 3. Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!generatedImageData) return;
    const success = await copyReceiptImageToClipboard(generatedImageData.blob);
    if (success) {
      setCopiedImage(true);
      setFeedbackMsg('تم نسخ الصورة! اضغط (لصق / Paste) في محادثة الواتساب لإرسالها فوراً.');
      setTimeout(() => {
        setCopiedImage(false);
        setFeedbackMsg('');
      }, 4500);
    } else {
      handleDownloadImage();
    }
  };

  // 4. Optional Text Copy
  const handleCopyText = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(receiptText);
      }
      setCopiedText(true);
      setFeedbackMsg('تم نسخ نص الإشعار للحافظة');
      setTimeout(() => {
        setCopiedText(false);
        setFeedbackMsg('');
      }, 3500);
    } catch {
      setFeedbackMsg('تعذر النسخ التلقائي');
    }
  };

  // Deterministic auth code
  let authCode = '857605';
  if (transaction.receiptCode) {
    const digitsOnly = transaction.receiptCode.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 4) {
      authCode = digitsOnly.padEnd(6, '9').slice(0, 6);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-b border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-2">
                <span>إشعار عملية بنكي</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold">
                  دقة فائقة 4K
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                إرسال صورة الإيصال فقط بدون نص وبأعلى درجات الوضوح
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">

          {/* Feedback notification banner */}
          {feedbackMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Action Buttons Hub (Top prominent) */}
          <div className="space-y-2.5">
            {/* Primary Button: Share ONLY the Image to WhatsApp (No text!) */}
            <button
              type="button"
              onClick={handleShareImageOnlyToWhatsApp}
              disabled={imageGenerating}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/50 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-5 h-5 shrink-0" />
              <span>
                {imageGenerating
                  ? 'جاري توليد الصورة بدقة 4K...'
                  : '📲 إرسال صورة الإيصال فقط عبر الواتساب (بدون نص)'}
              </span>
            </button>

            {/* Secondary Buttons Row: Download & Copy Image */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={imageGenerating || !generatedImageData}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="تنزيل صورة الإيصال بدقة فائقة 4K"
              >
                <Download className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>تحميل الصورة (دقة 4K)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                disabled={imageGenerating || !generatedImageData}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="نسخ الصورة للحافظة ولصقها في الواتس مباشرة"
              >
                {copiedImage ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400">تم نسخ الصورة!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>نسخ الصورة للحافظة</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* THE RECEIPT PREVIEW (Shows the actual generated Ultra-HD image) */}
          <div className="bg-slate-950/60 rounded-3xl p-3 sm:p-4 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 px-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="w-4 h-4" />
                معاينة صورة الإيصال البنكي (محفظة الحي InstaPay)
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                HD Lossless PNG
              </span>
            </div>

            {imageGenerating ? (
              <div className="h-72 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-emerald-400">
                  جاري رسم صورة الإيصال بدقة فائقة وبخطوط واضحة...
                </span>
              </div>
            ) : generatedImageData ? (
              <div className="rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl bg-white">
                <img
                  src={generatedImageData.dataUrl}
                  alt="إشعار عملية كاش الحي"
                  className="w-full h-auto block select-none"
                  loading="eager"
                />
              </div>
            ) : null}

            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed text-center">
              💡 <span className="font-bold">نصيحة للجودة الفائقة:</span> تم ضبط أبعاد الجدول وخطوطه العريضة لتبقى واضحة 100% ومقروءة عند التكبير في الواتساب دون أي تشويش.
            </div>
          </div>

          {/* Optional Text Toggle (Collapsed by default so user gets image only) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTextOptions(!showTextOptions)}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 transition cursor-pointer mx-auto"
            >
              <span>{showTextOptions ? '▲ إخفاء خيارات النص' : '▼ هل تريد إرسال نص الإشعار أيضاً؟ (اختياري)'}</span>
            </button>

            {showTextOptions && (
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2 animate-in fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsApp({
                        phone: targetPhone,
                        text: receiptText,
                        isBusiness: false,
                      })
                    }
                    className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>واتساب العادي (نص)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openWhatsApp({
                        phone: targetPhone,
                        text: receiptText,
                        isBusiness: true,
                      })
                    }
                    className="py-2 px-3 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>واتساب للأعمال (نص)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">تم نسخ نص الإشعار!</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>نسخ نص الإشعار للحافظة</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
