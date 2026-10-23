import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  QrCode,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Send,
  Zap,
  User,
  Store,
  UploadCloud,
  FlipHorizontal,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';
import { CommunityUser, LocalTransaction } from '../types/wallet';

interface BarcodeModalProps {
  isOpen: boolean;
  initialMode: 'scan' | 'show';
  onClose: () => void;
  onOpenPayWithRecipient?: (recipientIdOrPhone: string, amount?: number) => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  isOpen,
  initialMode,
  onClose,
}) => {
  const { state, currentUser, transferBalance } = useCommunityWallet();

  const [mode, setMode] = useState<'scan' | 'show'>(initialMode);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [scanError, setScanError] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Scanned / Target Recipient State
  const [scannedRecipient, setScannedRecipient] = useState<CommunityUser | null>(null);
  const [scannedAmount, setScannedAmount] = useState<string>('');
  const [scannedNote, setScannedNote] = useState<string>('دفع مشتريات عبر الباركود');
  const [payError, setPayError] = useState<string>('');
  const [paySuccessTx, setPaySuccessTx] = useState<LocalTransaction | null>(null);

  // Show QR states
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [requestAmount, setRequestAmount] = useState<string>('');
  const [copiedAcc, setCopiedAcc] = useState(false);

  // Video and Canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setScannedRecipient(null);
      setScannedAmount('');
      setPaySuccessTx(null);
      setScanError('');
      setPayError('');
    } else {
      stopCamera();
    }
  }, [isOpen, initialMode]);

  // Generate QR code when showing
  useEffect(() => {
    if (isOpen && mode === 'show' && currentUser) {
      const amtNum = parseFloat(requestAmount) || 0;
      const payload = JSON.stringify({
        app: 'pocket_cash',
        account: currentUser.accountNumber,
        phone: currentUser.phone,
        name: currentUser.shopName || currentUser.name,
        amount: amtNum > 0 ? amtNum : undefined,
      });

      QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    }
  }, [isOpen, mode, currentUser, requestAmount]);

  // Start / Stop camera when in scan mode
  useEffect(() => {
    if (isOpen && mode === 'scan' && !scannedRecipient && !paySuccessTx) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, mode, cameraFacing, scannedRecipient, paySuccessTx]);

  const startCamera = async () => {
    stopCamera();
    setScanError('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setScanError('الكاميرا غير مدعومة في هذا المتصفح. يمكنك استيراد صورة الباركود من الاستديو أدناه.');
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setScanError('تم رفض إذن الكاميرا. يرجى تفعيل إذن الكاميرا أو استخدام زر "استيراد من الاستديو".');
      } else {
        setScanError('تعذر فتح الكاميرا المباشرة. يمكنك اختيار صورة الباركود من المعرض / الاستديو مباشرة.');
      }
      setCameraActive(false);
    }
  };

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

  const startScanningLoop = () => {
    const scan = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            handleDecodedBarcode(code.data);
            return; // stop scanning loop on hit
          }
        }
      }
      animFrameIdRef.current = requestAnimationFrame(scan);
    };

    animFrameIdRef.current = requestAnimationFrame(scan);
  };

  // Decode from file uploaded from gallery/studio
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setIsProcessingImage(false);
          setScanError('فشل معالجة الصورة في المتصفح.');
          return;
        }

        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        setIsProcessingImage(false);
        if (code && code.data) {
          handleDecodedBarcode(code.data);
        } else {
          setScanError('لم يتم العثور على رمز باركود صالح في الصورة المحددة. يرجى التأكد من وضوح الباركود واختيار صورة أخرى.');
        }
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        setScanError('تعذر قراءة ملف الصورة المحدد.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input so user can pick the same file again if needed
    e.target.value = '';
  };

  // Parse decoded QR data and match recipient in database
  const handleDecodedBarcode = (rawData: string) => {
    stopCamera();
    let targetAccount = '';
    let targetPhone = '';
    let targetAmount: number | undefined;

    // Check if JSON
    try {
      const parsed = JSON.parse(rawData);
      targetAccount = parsed.account || parsed.accountNumber || '';
      targetPhone = parsed.phone || '';
      if (parsed.amount && !isNaN(Number(parsed.amount))) {
        targetAmount = Number(parsed.amount);
      }
    } catch {
      // If not JSON, handle URL or plain string
      if (rawData.includes('?') || rawData.includes('&')) {
        try {
          const urlObj = new URL(rawData, window.location.origin);
          targetAccount = urlObj.searchParams.get('account') || urlObj.searchParams.get('acc') || '';
          targetPhone = urlObj.searchParams.get('phone') || '';
          const amt = urlObj.searchParams.get('amount') || urlObj.searchParams.get('amt');
          if (amt && !isNaN(Number(amt))) targetAmount = Number(amt);
        } catch {
          targetAccount = rawData.trim();
        }
      } else {
        targetAccount = rawData.trim();
      }
    }

    const cleanAcc = (targetAccount || '').trim().toLowerCase();
    const cleanPhone = (targetPhone || rawData || '').replace(/[\s\-\+]/g, '');
    const cleanPhoneNoZero = cleanPhone.replace(/^0/, '');

    const found = state.users.find((u) => {
      const uClean = (u.accountNumber || '').toLowerCase();
      const uPhone = (u.phone || '').replace(/[\s\-\+]/g, '');
      const uPhoneNoZero = uPhone.replace(/^0/, '');

      if (cleanAcc && uClean === cleanAcc) return true;
      if (cleanPhone && (uPhone === cleanPhone || (cleanPhoneNoZero && uPhoneNoZero === cleanPhoneNoZero))) return true;
      if (u.id === rawData.trim()) return true;
      if (u.username && u.username.toLowerCase() === rawData.trim().toLowerCase()) return true;
      return false;
    });

    if (!found) {
      setScanError(`تمت قراءة الرمز (${rawData.slice(0, 30)}) بنجاح، ولكن لم يتم العثور على حساب مسجل يطابق هذا الباركود!`);
      return;
    }

    if (currentUser && found.id === currentUser.id) {
      setScanError('هذا الباركود يخص حسابك أنت! لا يمكن الدفع لنفس الحساب.');
      return;
    }

    if (found.role === 'admin') {
      setScanError('حساب الإدارة مخصص لاستلام وتسليم الكاش يداً بيد داخل المقر فقط.');
      return;
    }

    // Set recipient and proceed to payment confirmation step
    setScannedRecipient(found);
    if (targetAmount && targetAmount > 0) {
      setScannedAmount(String(targetAmount));
    }
    confetti({ particleCount: 30, spread: 50 });
  };

  // Execute payment via barcode
  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');

    if (!scannedRecipient) return;
    const amt = parseFloat(scannedAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    const res = transferBalance({
      recipientIdentifier: scannedRecipient.accountNumber,
      amount: amt,
      note: scannedNote || 'دفع مشتريات عبر الباركود',
      isQrScan: true,
      saveToQuickPay: true,
    });

    if (res.success && res.tx) {
      setPaySuccessTx(res.tx);
      confetti({ particleCount: 80, spread: 70 });
    } else {
      setPayError(res.error || 'فشلت عملية الدفع. يرجى المحاولة مجدداً.');
    }
  };

  const handleCopyAccount = () => {
    if (currentUser?.accountNumber) {
      navigator.clipboard.writeText(currentUser.accountNumber);
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 relative z-[100000]">
        
        {/* Hidden Canvas for QR video frame processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden File Input for Gallery / Studio Image Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {mode === 'scan' ? 'الدفع السريع بالباركود' : 'رمز باركود حسابي'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'scan'
                  ? 'امسح باركود المتجر أو استورد صورة الباركود من الاستديو'
                  : 'أظهر الرمز للمشتري أو المتجر ليتم الدفع لك فوراً'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Scan vs Show */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('scan');
              setScannedRecipient(null);
              setPaySuccessTx(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              mode === 'scan'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>مسح باركود للدفع</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('show');
              stopCamera();
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              mode === 'show'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>إظهار باركودي للاستلام</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4">
          {/* ================= MODE: SCAN ================= */}
          {mode === 'scan' && (
            <>
              {/* State 1: Payment Success Receipt */}
              {paySuccessTx ? (
                <div className="text-center py-4 space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">تم الدفع بالباركود بنجاح!</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      تم تحويل المبلغ للمستلم ({paySuccessTx.recipientName}) فوراً
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>المبلغ المدفوع:</span>
                      <span className="font-bold font-num text-emerald-400 text-sm">
                        {paySuccessTx.amount.toLocaleString()} ل.س
                      </span>
                    </div>
                    {paySuccessTx.fee !== undefined && (
                      <div className="flex justify-between text-slate-400">
                        <span>عمولة التحويل (1%):</span>
                        <span className="font-num text-slate-300">{paySuccessTx.fee.toLocaleString()} ل.س</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                      <span>رقم إيصال المعاملة:</span>
                      <span className="font-mono font-bold text-teal-400">{paySuccessTx.receiptCode}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPaySuccessTx(null);
                      setScannedRecipient(null);
                      onClose();
                    }}
                    className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                  >
                    تم وإغلاق
                  </button>
                </div>
              ) : scannedRecipient ? (
                /* State 2: Confirmation & Payment Form for Scanned Recipient */
                <form onSubmit={handleExecutePayment} className="space-y-4 animate-in fade-in">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-teal-500/40 flex items-center gap-3">
                    <img
                      src={scannedRecipient.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={scannedRecipient.name}
                      className="w-12 h-12 rounded-xl object-cover border border-teal-500/50 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold">
                          {scannedRecipient.role === 'merchant' ? 'متجر معتمد' : 'مواطن'}
                        </span>
                        <h4 className="font-bold text-sm text-white truncate">
                          {scannedRecipient.shopName || scannedRecipient.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 font-num truncate mt-0.5">
                        {scannedRecipient.accountNumber} • {scannedRecipient.phone}
                      </p>
                    </div>
                  </div>

                  {/* Amount to pay */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      المبلغ المراد دفعه (ل.س) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      step="500"
                      value={scannedAmount}
                      onChange={(e) => setScannedAmount(e.target.value)}
                      placeholder="أدخل المبلغ بالليرة السورية"
                      className="w-full bg-slate-950 text-white font-num text-base font-black rounded-xl px-4 py-3 border-2 border-slate-700 focus:border-teal-500 outline-none text-left"
                    />
                  </div>

                  {/* Quick amount chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {[5000, 10000, 25000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setScannedAmount(String(amt))}
                        className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-num text-xs font-bold transition cursor-pointer"
                      >
                        +{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  {/* Summary Box: Current Balance & Fee */}
                  {currentUser && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>رصيد محفظتك المتاح:</span>
                        <span className="font-bold font-num text-slate-200">
                          {currentUser.balance.toLocaleString()} ل.س
                        </span>
                      </div>
                      {parseFloat(scannedAmount) > 0 && (
                        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                          <span>العمولة (1%) + المبلغ:</span>
                          <span className="font-bold font-num text-teal-400">
                            {(
                              parseFloat(scannedAmount) + Math.round(parseFloat(scannedAmount) * 0.01)
                            ).toLocaleString()}{' '}
                            ل.س
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      ملاحظة العملية (اختياري)
                    </label>
                    <input
                      type="text"
                      value={scannedNote}
                      onChange={(e) => setScannedNote(e.target.value)}
                      placeholder="مثال: دفع فاتورة بقالية، خضار..."
                      className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2 border border-slate-800 focus:border-teal-500 outline-none"
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
                      onClick={() => {
                        setScannedRecipient(null);
                        startCamera();
                      }}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                    >
                      إلغاء والمسح مجدداً
                    </button>

                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20 transition cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>تأكيد الدفع الفوري</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* State 3: Camera Live Scanner + Studio Gallery Import */
                <div className="space-y-4">
                  {/* Camera Viewport */}
                  <div className="relative aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden bg-black border-2 border-slate-700 shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />

                    {/* Scanning overlay frame */}
                    {cameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-teal-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(20,184,166,0.3)] animate-pulse">
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-teal-400 -mt-1 -ml-1 rounded-tl" />
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-teal-400 -mt-1 -mr-1 rounded-tr" />
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-teal-400 -mb-1 -ml-1 rounded-bl" />
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-teal-400 -mb-1 -mr-1 rounded-br" />
                          
                          {/* Laser scanning bar */}
                          <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-transparent animate-bounce" />
                        </div>
                      </div>
                    )}

                    {!cameraActive && (
                      <div className="text-center p-4 space-y-2">
                        <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400">
                          {scanError ? 'الكاميرا غير مفعلة' : 'جاري تشغيل الكاميرا...'}
                        </p>
                      </div>
                    )}

                    {/* Flip Camera Button */}
                    {cameraActive && (
                      <button
                        type="button"
                        onClick={() =>
                          setCameraFacing((prev) =>
                            prev === 'environment' ? 'user' : 'environment'
                          )
                        }
                        className="absolute bottom-3 left-3 p-2 rounded-xl bg-slate-900/80 text-teal-300 border border-slate-700 hover:bg-slate-800 transition cursor-pointer"
                        title="تبديل الكاميرا الخلفية / الأمامية"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* GALLERY / STUDIO IMPORT BUTTON (High priority user request) */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingImage}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600/30 to-teal-600/30 hover:from-indigo-600/40 hover:to-teal-600/40 text-teal-200 border-2 border-teal-500/40 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer shadow-lg"
                    >
                      <ImageIcon className="w-5 h-5 text-teal-400 shrink-0" />
                      <span>
                        {isProcessingImage
                          ? 'جاري فحص صورة الباركود...'
                          : 'استيراد صورة الباركود من الاستديو / المعرض'}
                      </span>
                      <UploadCloud className="w-4 h-4 text-teal-300 mr-auto shrink-0" />
                    </button>
                    <p className="text-[11px] text-slate-400 text-center mt-1.5">
                      يمكنك اختيار أي لقطة شاشة (Screenshot) أو صورة لباركود مرسلة لك عبر الواتساب للتعرف عليها فوراً.
                    </p>
                  </div>

                  {scanError && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{scanError}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ================= MODE: SHOW ================= */}
          {mode === 'show' && currentUser && (
            <div className="text-center space-y-4 animate-in fade-in">
              {/* Optional requested amount */}
              <div className="text-right">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  تحديد مبلغ مطلوب دفعه في الباركود (اختياري)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="500"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    placeholder="اتركه فارغاً ليحدد الدافع المبلغ بنفسه"
                    className="w-full bg-slate-950 text-white font-num text-xs rounded-xl px-3 py-2 border border-slate-800 focus:border-teal-500 outline-none text-left"
                  />
                  {requestAmount && (
                    <button
                      type="button"
                      onClick={() => setRequestAmount('')}
                      className="absolute left-2.5 top-2 text-xs text-slate-400 hover:text-white"
                    >
                      مسح
                    </button>
                  )}
                </div>
              </div>

              {/* QR Image */}
              <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl mx-auto border-4 border-slate-800">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="My QR Code"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    جاري توليد الباركود...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-base text-white">
                  {currentUser.shopName || currentUser.name}
                </h4>
                <p className="text-xs text-teal-400 font-bold font-mono">
                  {currentUser.accountNumber}
                </p>
                <p className="text-xs text-slate-400 font-num">
                  هاتف: {currentUser.phone}
                </p>
                {parseFloat(requestAmount) > 0 && (
                  <p className="text-xs font-bold font-num text-emerald-400 bg-emerald-500/10 py-1 px-3 rounded-full inline-block mt-1">
                    المبلغ المطلوب: {parseFloat(requestAmount).toLocaleString()} ل.س
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copiedAcc ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>تم نسخ رقم الحساب!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-teal-400" />
                      <span>نسخ رقم الحساب المالي ({currentUser.accountNumber})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
