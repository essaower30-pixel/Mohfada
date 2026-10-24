import React, { useState, useEffect, useRef } from 'react';
import {
  ScanLine,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Zap,
  User,
  Store,
  UploadCloud,
  FlipHorizontal,
  ArrowRight,
} from 'lucide-react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../../services/walletState';
import { CommunityUser, LocalTransaction } from '../../types/wallet';

interface ScanBarcodePageViewProps {
  onBackToHome: () => void;
}

export const ScanBarcodePageView: React.FC<ScanBarcodePageViewProps> = ({ onBackToHome }) => {
  const { state, currentUser, transferBalance } = useCommunityWallet();

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [scanError, setScanError] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Scanned target recipient
  const [scannedRecipient, setScannedRecipient] = useState<CommunityUser | null>(null);
  const [scannedAmount, setScannedAmount] = useState<string>('');
  const [scannedNote, setScannedNote] = useState<string>('دفع مشتريات عبر الباركود');
  const [payError, setPayError] = useState<string>('');
  const [paySuccessTx, setPaySuccessTx] = useState<LocalTransaction | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    stopCamera();
    setScanError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraActive(false);
      setScanError(
        'تعذر فتح الكاميرا مباشرة. يمكنك استخدام زر (استيراد صورة من الاستديو) لاختيار صورة كود الباركود فوراً.'
      );
    }
  };

  const tickScan = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(tickScan);
      return;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      handleQrDataDecoded(code.data);
      stopCamera();
      return;
    }

    animFrameIdRef.current = requestAnimationFrame(tickScan);
  };

  const handleQrDataDecoded = (rawData: string) => {
    setScanError('');
    let targetPhone = '';
    let targetAccount = '';
    let embeddedAmount: number | undefined = undefined;

    try {
      const parsed = JSON.parse(rawData);
      if (parsed.phone) targetPhone = parsed.phone;
      if (parsed.account || parsed.accountNumber) targetAccount = parsed.account || parsed.accountNumber;
      if (parsed.amount && typeof parsed.amount === 'number') {
        embeddedAmount = parsed.amount;
      }
    } catch {
      targetAccount = rawData.trim();
    }

    const cleanPhone = (targetPhone || (!rawData.trim().startsWith('{') ? rawData : '')).replace(/[\s\-\+]/g, '');
    const cleanPhoneNoZero = cleanPhone.replace(/^0/, '');
    const cleanAcc = (targetAccount || '').trim().toLowerCase();

    // Priority 1: Match by unique mobile phone number
    let found = cleanPhone.length >= 7 ? state.users.find((u) => {
      if (u.id === currentUser?.id) return false;
      const uPhone = (u.phone || '').replace(/[\s\-\+]/g, '');
      const uPhoneNoZero = uPhone.replace(/^0/, '');
      return uPhone === cleanPhone || (cleanPhoneNoZero && uPhoneNoZero === cleanPhoneNoZero);
    }) : undefined;

    // Priority 2: Match by unique account number
    if (!found && cleanAcc) {
      found = state.users.find((u) => {
        if (u.id === currentUser?.id) return false;
        return (u.accountNumber || '').toLowerCase() === cleanAcc;
      });
    }

    if (!found) {
      setScanError(
        `تم التعرف على الرمز ولكن لم يتم العثور على حساب مسجل يطابق هذا الباركود في النظام.`
      );
      return;
    }

    confetti({ particleCount: 40, spread: 50 });
    setScannedRecipient(found);
    if (embeddedAmount && embeddedAmount > 0) {
      setScannedAmount(embeddedAmount.toString());
    }
  };

  const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setScanError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessingImage(false);
          setScanError('فشل تهيئة معالج الصور');
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'attemptBoth',
        });

        setIsProcessingImage(false);
        if (code && code.data) {
          handleQrDataDecoded(code.data);
        } else {
          setScanError('لم يتم العثور على كود باركود واضح في الصورة المختارة، يرجى اختيار صورة واضحة ومقروءة.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePayScannedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    if (!scannedRecipient) return;

    const amt = parseFloat(scannedAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    const res = transferBalance({
      recipientIdentifier: scannedRecipient.phone || scannedRecipient.accountNumber,
      amount: amt,
      note: scannedNote || 'دفع مشتريات عبر الباركود',
      isQrScan: true,
    });

    if (res.success && res.tx) {
      confetti({ particleCount: 80, spread: 70 });
      setPaySuccessTx(res.tx);
      setScannedRecipient(null);
      setScannedAmount('');
    } else {
      setPayError(res.error || 'فشلت عملية التحويل');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0 shadow-md">
            <ScanLine className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              مسح الباركود والدفع السريع
            </h2>
            <p className="text-xs text-slate-400">
              مسح كود المتجر أو الزبون عبر الكاميرا أو استيراد صورة من الاستديو
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

      {/* Success Receipt */}
      {paySuccessTx && (
        <div className="p-5 rounded-3xl bg-emerald-950/40 border-2 border-emerald-500/50 space-y-3 shadow-xl animate-in zoom-in-95">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <div>
              <h4 className="font-black text-base text-white">تمت عملية الدفع بنجاح!</h4>
              <p className="text-xs text-emerald-300">رقم الإيصال: {paySuccessTx.receiptCode}</p>
            </div>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs space-y-1">
            <p className="text-slate-300">
              المستلم:{' '}
              <span className="font-bold text-white">{paySuccessTx.recipientName}</span>
            </p>
            <p className="text-slate-300">
              المبلغ المدفوع:{' '}
              <span className="font-black text-emerald-400 text-sm font-num">
                {paySuccessTx.amount.toLocaleString()} ل.س
              </span>
            </p>
          </div>
          <button
            onClick={() => setPaySuccessTx(null)}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition cursor-pointer"
          >
            مسح كود آخر
          </button>
        </div>
      )}

      {/* Scanned Payee Form */}
      {scannedRecipient && !paySuccessTx && (
        <div className="bg-slate-900 border-2 border-teal-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <img
              src={scannedRecipient.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={scannedRecipient.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-400 shrink-0 shadow-md"
            />
            <div className="flex-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                المستلم الذي تم مسحه
              </span>
              <h3 className="text-base font-black text-white mt-1">
                {scannedRecipient.shopName || scannedRecipient.name}
              </h3>
              <p className="text-xs text-slate-400 font-num">
                رقم الحساب: <span className="text-slate-200 font-mono font-bold">{scannedRecipient.accountNumber}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handlePayScannedSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                المبلغ المراد دفعه (ل.س) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={scannedAmount}
                onChange={(e) => setScannedAmount(e.target.value)}
                placeholder="أدخل المبلغ بالليرة السورية"
                className="w-full bg-slate-950 text-white font-num text-lg font-black rounded-xl px-3.5 py-2.5 border border-slate-800 focus:border-teal-500 outline-none text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                البيان / ملاحظة الدفعة
              </label>
              <input
                type="text"
                value={scannedNote}
                onChange={(e) => setScannedNote(e.target.value)}
                placeholder="مشتريات بقالية / خضار..."
                className="w-full bg-slate-950 text-white text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:border-teal-500 outline-none"
              />
            </div>

            {payError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setScannedRecipient(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                إلغاء ومسح جديد
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 stroke-[2.5]" />
                <span>تأكيد الدفع الفوري</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scanner & Gallery Actions */}
      {!scannedRecipient && !paySuccessTx && (
        <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
          {/* Action Choice Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                if (cameraActive) {
                  stopCamera();
                } else {
                  startCamera('environment');
                }
              }}
              className={`py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
                cameraActive
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>{cameraActive ? 'إيقاف تشغيل الكاميرا' : 'تشغيل كاميرا المسح الفوري'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImage}
              className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700/80 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <ImageIcon className="w-5 h-5 text-teal-400" />
              <span>{isProcessingImage ? 'جاري قراءة الصورة...' : 'استيراد صورة باركود من الاستديو'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryImageUpload}
            />
          </div>

          {/* Camera Viewfinder */}
          {cameraActive && (
            <div className="relative overflow-hidden rounded-2xl bg-black aspect-video max-h-80 border-2 border-teal-500/50 shadow-inner flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              <div className="absolute inset-0 border-2 border-dashed border-teal-400/60 m-8 rounded-2xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-3 left-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const newF = cameraFacing === 'environment' ? 'user' : 'environment';
                    setCameraFacing(newF);
                    startCamera(newF);
                  }}
                  className="p-2 rounded-xl bg-slate-950/80 text-white border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span>قلب الكاميرا</span>
                </button>
              </div>
            </div>
          )}

          {scanError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <p className="font-bold text-slate-300">💡 نصائح للمسح السريع:</p>
            <p>• وجه الكاميرا نحو كود QR المعروض على هاتف المتجر أو الزبون.</p>
            <p>• أو التقط لقطة شاشة للباركود واستوردها بنقرة واحدة عبر زر «استيراد صورة من الاستديو».</p>
          </div>
        </div>
      )}
    </div>
  );
};
