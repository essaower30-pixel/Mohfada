import React, { useState } from 'react';
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Send,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  User,
  Store,
  Bookmark,
  Building,
  LogOut,
  Banknote,
  PlusCircle,
  UserPlus,
  Sparkles,
  Smartphone,
  Share2,
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';
import { LocalTransaction, SavedContact } from '../types/wallet';
import { AdminProfileModal } from './AdminProfileModal';
import { ShareAppModal } from './ShareAppModal';

interface UserWalletViewProps {
  onOpenBarcodeScan: () => void;
  onOpenBarcodeShow: () => void;
  onOpenLogin: () => void;
}

export const UserWalletView: React.FC<UserWalletViewProps> = ({
  onOpenBarcodeScan,
  onOpenBarcodeShow,
  onOpenLogin,
}) => {
  const {
    state,
    currentUser,
    adminUser,
    transferBalance,
    addSavedContact,
    removeSavedContact,
    setView,
    logout,
  } = useCommunityWallet();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Modals inside user view
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showAdminProfile, setShowAdminProfile] = useState(false);
  const [showShareAppModal, setShowShareAppModal] = useState(false);

  // Pay form states
  const [payIdentifier, setPayIdentifier] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [saveToQuickPay, setSaveToQuickPay] = useState(false);
  const [payError, setPayError] = useState('');

  // Live recipient lookup by mobile or account
  const cleanPayId = payIdentifier.replace(/[\s\-\+]/g, '');
  const cleanTrimmed = payIdentifier.trim().toLowerCase();
  const matchedRecipient = cleanPayId.length >= 3 || cleanTrimmed.length >= 3
    ? state.users.find(
        (u) =>
          u.id !== currentUser.id &&
          (u.phone.replace(/[\s\-\+]/g, '') === cleanPayId ||
            u.phone.replace(/[\s\-\+]/g, '').replace(/^0/, '') === cleanPayId.replace(/^0/, '') ||
            u.accountNumber.toLowerCase() === cleanTrimmed ||
            (u.username && u.username.toLowerCase() === cleanTrimmed))
      )
    : undefined;

  // Add Contact modal states
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactAccount, setNewContactAccount] = useState('');
  const [contactError, setContactError] = useState('');

  // Receive modal states
  const [receiveQrUrl, setReceiveQrUrl] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [copiedAcc, setCopiedAcc] = useState(false);

  // Transaction filter
  const [txFilter, setTxFilter] = useState<'all' | 'outgoing' | 'incoming'>('all');

  // Success toast
  const [toastMsg, setToastMsg] = useState('');

  // Real-time live incoming balance alert
  const prevBalanceRef = React.useRef<number>(currentUser.balance);
  const isFirstMountRef = React.useRef<boolean>(true);

  React.useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevBalanceRef.current = currentUser.balance;
      return;
    }

    if (currentUser.balance > prevBalanceRef.current) {
      const diff = currentUser.balance - prevBalanceRef.current;
      confetti({ particleCount: 75, spread: 70 });
      setToastMsg(`وصلك رصيد إضافي جديد بقيمة +${diff.toLocaleString()} ل.س فوراً!`);
      setTimeout(() => setToastMsg(''), 6000);
    }
    prevBalanceRef.current = currentUser.balance;
  }, [currentUser.balance]);

  // Match transactions across all sister accounts sharing the user's phone number
  const myCleanPhone = currentUser.phone.replace(/[\s\-\+]/g, '').replace(/^0/, '');
  const myAccountIds = React.useMemo(() => {
    return new Set(
      state.users
        .filter((u) => u.id === currentUser.id || (myCleanPhone && u.phone.replace(/[\s\-\+]/g, '').replace(/^0/, '') === myCleanPhone))
        .map((u) => u.id)
    );
  }, [state.users, currentUser.id, myCleanPhone]);

  const userTransactions = state.transactions.filter(
    (tx) =>
      myAccountIds.has(tx.senderId) ||
      myAccountIds.has(tx.recipientId) ||
      (myCleanPhone && tx.recipientName === (currentUser.shopName || currentUser.name))
  );

  const filteredTransactions = userTransactions.filter((tx) => {
    if (txFilter === 'outgoing') return myAccountIds.has(tx.senderId);
    if (txFilter === 'incoming') return myAccountIds.has(tx.recipientId);
    return true;
  });

  // Handle Pay Submit
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    const res = transferBalance({
      recipientIdentifier: payIdentifier,
      amount: amt,
      note: payNote,
      saveToQuickPay,
    });

    if (res.success && res.tx) {
      confetti({ particleCount: 70, spread: 60 });
      setShowPayModal(false);
      setPayIdentifier('');
      setPayAmount('');
      setPayNote('');
      setToastMsg(`تم إتمام عملية الدفع بنجاح! رقم الإيصال: ${res.tx.receiptCode}`);
      setTimeout(() => setToastMsg(''), 5000);
    } else {
      setPayError(res.error || 'فشلت عملية الدفع');
    }
  };

  const handleQuickPayContact = (contact: SavedContact) => {
    setPayIdentifier(contact.accountNumber || contact.phone);
    setShowPayModal(true);
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');

    if (!newContactName.trim()) {
      setContactError('يرجى إدخال اسم جهة الدفع');
      return;
    }
    if (!newContactPhone.trim() && !newContactAccount.trim()) {
      setContactError('يرجى إدخال رقم الموبايل أو رقم الحساب المالي');
      return;
    }

    addSavedContact({
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      accountNumber: newContactAccount.trim() || `ACC-${Math.floor(100 + Math.random() * 900)}`,
    });

    setShowAddContactModal(false);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactAccount('');
  };

  // Generate QR for receive modal
  React.useEffect(() => {
    if (showReceiveModal && currentUser) {
      const amt = parseFloat(requestedAmount) || 0;
      const payload = JSON.stringify({
        app: 'pocket_cash',
        account: currentUser.accountNumber,
        phone: currentUser.phone,
        name: currentUser.shopName || currentUser.name,
        amount: amt > 0 ? amt : undefined,
      });

      QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => setReceiveQrUrl(url))
        .catch((err) => console.error(err));
    }
  }, [showReceiveModal, currentUser, requestedAmount]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(currentUser.accountNumber);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/20 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="p-1 font-bold cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Wallet Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border-2 border-emerald-500/30 shadow-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* User info & balance */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={currentUser.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {currentUser.role === 'admin'
                      ? 'أمين الصندوق والمعتمد'
                      : currentUser.role === 'merchant'
                      ? 'متجر معتمد'
                      : 'مواطن بالحي'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-bold">
                    {currentUser.accountNumber}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                  {currentUser.shopName || currentUser.name}
                </h2>
                <p className="text-xs text-slate-400 font-num">
                  هاتف: <span className="text-slate-200 font-bold">{currentUser.phone}</span>
                </p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-slate-400 font-bold">رصيدك المالي المتاح للتداول والإنفاق:</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black font-num text-emerald-400 tracking-tight">
                  {currentUser.balance.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-slate-300">ليرة سورية</span>
              </div>
            </div>
          </div>

          {/* Core Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 min-w-[220px]">
            {/* Pay / Transfer button */}
            <button
              type="button"
              onClick={() => setShowPayModal(true)}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>دفع أو تحويل رصيد</span>
            </button>

            {/* Receive balance button */}
            <button
              type="button"
              onClick={() => setShowReceiveModal(true)}
              className="py-3 px-4 rounded-2xl bg-slate-950/90 hover:bg-slate-900 text-slate-100 border-2 border-emerald-500/50 hover:border-emerald-400 font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span>استلام رصيد (إظهار كودي)</span>
            </button>

            {/* Barcode scanner & gallery import button */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenBarcodeScan}
                className="py-2.5 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-teal-400" />
                <span>مسح باركود</span>
              </button>

              <button
                type="button"
                onClick={onOpenBarcodeShow}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>باركود حسابي</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Pay Saved Contacts */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">جهات الدفع السريع المحفوظة لديك</h3>
              <p className="text-[11px] text-slate-400">
                ادفع لمحلاتك أو أصدقائك بنقرة واحدة دون إدخال الحساب
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddContactModal(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة جهة</span>
          </button>
        </div>

        {(!currentUser.savedContacts || currentUser.savedContacts.length === 0) ? (
          <div className="py-6 px-4 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800">
            <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-slate-300">لم تحتفظ بأي جهات للدفع السريع بعد</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              عند الدفع لأي متجر أو مستخدم، يمكنك تفعيل خيار الحفظ للوصول السريع مستقبلاً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {currentUser.savedContacts.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 flex items-center justify-between gap-2.5 transition group"
              >
                <div
                  onClick={() => handleQuickPayContact(c)}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100 group-hover:text-teal-400 truncate">
                      {c.shopName || c.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-num font-mono truncate">
                      {c.accountNumber} • {c.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleQuickPayContact(c)}
                    className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 text-xs font-bold transition cursor-pointer"
                  >
                    دفع
                  </button>
                  <button
                    onClick={() => removeSavedContact(c.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="حذف من المحفوظات"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions History */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">سجل العمليات والحركات الشخصية</h3>
              <p className="text-[11px] text-slate-400">
                جميع حركات الدفع والاستلام والشحن الخاصة بحسابك
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-center">
            <button
              onClick={() => setTxFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                txFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({userTransactions.length})
            </button>
            <button
              onClick={() => setTxFilter('outgoing')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                txFilter === 'outgoing' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              دفع صادر
            </button>
            <button
              onClick={() => setTxFilter('incoming')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                txFilter === 'incoming' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              استلام وارد
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            لا توجد حركات تطابق التحديد حالياً.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => {
              const isIncome = myAccountIds.has(tx.recipientId);
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-100 truncate">
                          {isIncome ? `استلام من: ${tx.senderName}` : `دفع إلى: ${tx.recipientName}`}
                        </p>
                        {tx.isQrScan && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                            باركود
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{tx.note}</p>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <p
                      className={`font-black font-num text-sm sm:text-base ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {tx.amount.toLocaleString()} ل.س
                    </p>
                    <span className="text-[10px] text-slate-500 font-num font-mono block">
                      {tx.receiptCode}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200 relative z-[100000]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">دفع أو تحويل رصيد</h3>
                  <p className="text-xs text-slate-400">تحويل مالي فوري لحساب مشترك بالحي</p>
                </div>
              </div>

              <button
                onClick={() => setShowPayModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رقم حساب أو رقم موبايل المستلم *
                </label>
                <input
                  type="text"
                  required
                  value={payIdentifier}
                  onChange={(e) => setPayIdentifier(e.target.value)}
                  placeholder="مثال: 0951854257 أو POCKET-100"
                  className="w-full bg-slate-950 text-white font-bold text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left"
                />

                {matchedRecipient && (
                  <div className="mt-2 p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center gap-2.5 text-xs">
                    <img
                      src={matchedRecipient.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold text-teal-300">{matchedRecipient.shopName || matchedRecipient.name}</p>
                      <p className="text-[10px] text-slate-400 font-num">{matchedRecipient.accountNumber} • {matchedRecipient.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  المبلغ المراد تحويله (ل.س) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="500"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="المبلغ بالليرة السورية"
                  className="w-full bg-slate-950 text-white font-num font-black text-sm rounded-xl px-3 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left"
                />
              </div>

              {/* Quick chips */}
              <div className="flex flex-wrap gap-1.5">
                {[5000, 10000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPayAmount(String(amt))}
                    className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-num text-xs font-bold transition cursor-pointer"
                  >
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Commission note */}
              {parseFloat(payAmount) > 0 && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>عمولة التحويل (1% للإدارة):</span>
                    <span className="font-num text-slate-300">
                      {Math.round(parseFloat(payAmount) * 0.01).toLocaleString()} ل.س
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span>الإجمالي المخصوم من محفظتك:</span>
                    <span className="font-bold font-num text-emerald-400">
                      {(
                        parseFloat(payAmount) + Math.round(parseFloat(payAmount) * 0.01)
                      ).toLocaleString()}{' '}
                      ل.س
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ملاحظة العملية (اختياري)
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="مثال: دفع مشتريات خضار، إرجاع رصيد..."
                  className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2 border border-slate-800 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveContactCheck"
                  checked={saveToQuickPay}
                  onChange={(e) => setSaveToQuickPay(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="saveContactCheck" className="text-xs text-slate-300 cursor-pointer">
                  حفظ هذا المستلم في جهات الدفع السريع
                </label>
              </div>

              {payError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  إتمام التحويل الفوري
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl p-5 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200 relative z-[100000]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">استلام رصيد</h3>
                  <p className="text-xs text-slate-400">أظهر الباركود للدافع ليتم التحويل لك</p>
                </div>
              </div>

              <button
                onClick={() => setShowReceiveModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-3">
              <div className="p-3 bg-white rounded-3xl inline-block shadow-2xl mx-auto border-4 border-slate-800">
                {receiveQrUrl ? (
                  <img src={receiveQrUrl} alt="Receive QR" className="w-48 h-48 object-contain" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                    جاري التحميل...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-sm text-white">
                  {currentUser.shopName || currentUser.name}
                </h4>
                <p className="text-xs text-emerald-400 font-bold font-mono">
                  {currentUser.accountNumber}
                </p>
                <p className="text-xs text-slate-400 font-num">
                  هاتف: {currentUser.phone}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyAccount}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedAcc ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>تم نسخ رقم الحساب!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-teal-400" />
                    <span>نسخ رقم الحساب المالي</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl p-5 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200 relative z-[100000]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm text-white">إضافة جهة دفع سريع جديدة</h3>
              </div>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الاسم أو اسم المتجر *
                </label>
                <input
                  type="text"
                  required
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="مثال: بقالية النور"
                  className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2 border border-slate-800 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رقم الموبايل
                </label>
                <input
                  type="tel"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="09xxxxxxxx"
                  className="w-full bg-slate-950 text-white font-num text-xs rounded-xl px-3 py-2 border border-slate-800 focus:border-teal-500 outline-none text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رقم الحساب المالي (إن وجد)
                </label>
                <input
                  type="text"
                  value={newContactAccount}
                  onChange={(e) => setNewContactAccount(e.target.value)}
                  placeholder="مثال: SHOP-201"
                  className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl px-3 py-2 border border-slate-800 focus:border-teal-500 outline-none text-left"
                />
              </div>

              {contactError && (
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {contactError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
                >
                  حفظ الجهة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share App Modal */}
      {showShareAppModal && (
        <ShareAppModal isOpen={showShareAppModal} onClose={() => setShowShareAppModal(false)} />
      )}

      {/* Admin Profile Modal */}
      {showAdminProfile && (
        <AdminProfileModal isOpen={showAdminProfile} onClose={() => setShowAdminProfile(false)} />
      )}
    </div>
  );
};
