import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  QrCode,
  Camera,
  Send,
  Store,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Share2,
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';

interface BarcodeModalProps {
  isOpen: boolean;
  initialTab?: 'scan' | 'show';
  onClose: () => void;
  onSuccess: (code: string) => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  isOpen,
  initialTab = 'scan',
  onClose,
  onSuccess,
}) => {
  const { state, currentUser, transferBalance } = useCommunityWallet();

  const [tab, setTab] = useState<'scan' | 'show'>(initialTab);

  // Scan state
  const [selectedMerchantId, setSelectedMerchantId] = useState(
    state.users.find((u) => u.role === 'merchant')?.id || ''
  );
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('شراء مشتريات عبر الباركود');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Show QR state
  const [qrAmount, setQrAmount] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedAcc, setCopiedAcc] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Generate QR code for receiving
  useEffect(() => {
    if (!isOpen) return;

    const payload = JSON.stringify({
      protocol: 'pocket_cash',
      userId: currentUser.id,
      name: currentUser.shopName || currentUser.name,
      account: currentUser.accountNumber,
      amount: qrAmount ? parseFloat(qrAmount) : undefined,
    });

    QRCode.toDataURL(payload, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#022c22',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [isOpen, qrAmount, currentUser]);

  if (!isOpen) return null;

  const targetMerchant = state.users.find((u) => u.id === selectedMerchantId);

  const handleSimulateScan = (mId: string, suggestedAmount?: string) => {
    setIsScanning(true);
    setSelectedMerchantId(mId);
    if (suggestedAmount) setAmount(suggestedAmount);

    setTimeout(() => {
      setIsScanning(false);
    }, 1000);
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('الرجاء إدخال مبلغ صحيح');
      return;
    }

    if (currentUser.balance < numericAmount) {
      setErrorMsg(
        `رصيدك المتاح (${currentUser.balance.toLocaleString()} ل.س) لا يكفي لإتمام عملية الدفع`
      );
      return;
    }

    const res = transferBalance({
      recipientIdentifier: selectedMerchantId,
      amount: numericAmount,
      note: note.trim() || 'دفع بالباركود',
      isQrScan: true,
    });

    if (res.success && res.tx) {
      confetti({ particleCount: 70, spread: 60 });
      onSuccess(res.tx.receiptCode);
      onClose();
    } else {
      setErrorMsg(res.error || 'حدث خطأ في عملية الدفع');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative z-[100000]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">الدفع والاستلام بالباركود</h3>
              <p className="text-xs text-slate-400">بديل الكاش الورقي داخل المحلات والحي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="p-5 pb-0">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setTab('scan');
                setErrorMsg('');
              }}
              className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                tab === 'scan'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>دفع (مسح باركود المتجر)</span>
            </button>

            <button
              onClick={() => {
                setTab('show');
                setErrorMsg('');
              }}
              className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                tab === 'show'
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>استلام (عرض كودي)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {tab === 'scan' ? (
            <form onSubmit={handleExecutePayment} className="space-y-4">
              {/* Camera Scanner Simulation Box */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 text-center space-y-3">
                <div className="relative mx-auto w-44 h-44 bg-slate-900 rounded-2xl border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center overflow-hidden">
                  {isScanning ? (
                    <>
                      <Camera className="w-10 h-10 text-emerald-400 animate-pulse mb-2" />
                      <p className="text-xs text-emerald-300 font-semibold px-2">جاري قراءة الرمز...</p>
                      <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-[0_0_10px_#10b981] animate-scan"></div>
                    </>
                  ) : (
                    <div className="p-3">
                      <QrCode className="w-12 h-12 text-slate-500 mx-auto mb-1" />
                      <p className="text-[11px] text-slate-400">وجه الكاميرا نحو باركود المحل أو اختر أدناه</p>
                    </div>
                  )}
                </div>

                {/* Quick 1-click scan chips for neighborhood shops */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-semibold">
                    محلات الحي المعتمدة (انقر للمسح الفوري):
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {state.users
                      .filter((u) => u.role === 'merchant')
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSimulateScan(m.id, '25000')}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold shrink-0 transition flex items-center gap-1 ${
                            selectedMerchantId === m.id
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          <Store className="w-3 h-3" />
                          <span>{m.shopName || m.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Target Merchant Display */}
              {targetMerchant && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={targetMerchant.avatar}
                      alt={targetMerchant.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold text-white">
                        {targetMerchant.shopName || targetMerchant.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-num">
                        حساب: {targetMerchant.accountNumber}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    تم التحقق ✅
                  </span>
                </div>
              )}

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>المبلغ المراد دفعه *</span>
                  <span className="text-slate-400">
                    رصيدك:{' '}
                    <span className="text-emerald-400 font-bold font-num">
                      {currentUser.balance.toLocaleString()} ل.س
                    </span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="500"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-base font-bold text-white font-num outline-none text-left"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                    ليرة سورية (ل.س)
                  </span>
                </div>

                {/* Presets */}
                <div className="flex gap-1.5 mt-2">
                  {[10000, 25000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt.toString())}
                      className="flex-1 py-1 rounded-lg text-[10px] font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition font-num"
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  بيان المشتريات (اختياري)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="مثال: فاتورة بقالية، خضار..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>تأكيد خصم الرصيد والدفع فوراً</span>
              </button>
            </form>
          ) : (
            /* Tab 2: Show QR Code */
            <div className="space-y-4 text-center">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  تحديد مبلغ مطلوب بالباركود (اختياري):
                </label>
                <input
                  type="number"
                  step="500"
                  value={qrAmount}
                  onChange={(e) => setQrAmount(e.target.value)}
                  placeholder="اتركه فارغاً ليحدد الدافع المبلغ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-num text-center outline-none"
                />
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
                <div className="w-52 h-52 bg-white p-2.5 rounded-2xl mx-auto shadow-xl flex items-center justify-center">
                  {qrDataUrl && (
                    <img src={qrDataUrl} alt="Pocket QR" className="w-full h-full object-contain" />
                  )}
                </div>

                <div className="mt-3">
                  <p className="font-bold text-sm text-white">
                    {currentUser.shopName || currentUser.name}
                  </p>
                  <p className="text-xs text-slate-400 font-num font-mono">
                    رقم الحساب: {currentUser.accountNumber}
                  </p>
                  {qrAmount && (
                    <p className="text-xs font-bold text-emerald-400 font-num mt-1">
                      المبلغ المطلوب: {parseFloat(qrAmount).toLocaleString()} ل.س
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser.accountNumber);
                    setCopiedAcc(true);
                    setTimeout(() => setCopiedAcc(false), 2000);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAcc ? 'تم النسخ' : 'نسخ رقم الحساب'}</span>
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
