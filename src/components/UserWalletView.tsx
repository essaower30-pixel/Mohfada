import React, { useState } from 'react';
import {
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
  Info,
  LogOut,
  Banknote,
  PlusCircle,
  ArrowDownToLine,
  UserPlus,
  ShieldCheck,
  Sparkles,
  Smartphone,
  MapPin,
  PhoneCall,
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';
import { LocalTransaction, SavedContact } from '../types/wallet';
import { AdminProfileModal } from './AdminProfileModal';

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
  } = useCommunityWallet();

  const isAdmin = currentUser.role === 'admin';

  // Modals inside user view
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showAdminProfile, setShowAdminProfile] = useState(false);

  // Pay form states
  const [payIdentifier, setPayIdentifier] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [saveToQuickPay, setSaveToQuickPay] = useState(false);
  const [payError, setPayError] = useState('');

  // Live recipient lookup by mobile or account
  const cleanPayId = payIdentifier.replace(/[\s\-\+]/g, '');
  const matchedRecipient = cleanPayId.length >= 3
    ? state.users.find(
        (u) =>
          u.id !== currentUser.id &&
          (u.phone.replace(/[\s\-\+]/g, '') === cleanPayId ||
            u.phone.replace(/[\s\-\+]/g, '').replace(/^0/, '') === cleanPayId.replace(/^0/, '') ||
            u.accountNumber.toLowerCase() === payIdentifier.trim().toLowerCase())
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

  // User's own transactions
  const userTransactions = state.transactions.filter(
    (tx) => tx.senderId === currentUser.id || tx.recipientId === currentUser.id
  );

  const filteredTransactions = userTransactions.filter((tx) => {
    if (txFilter === 'outgoing') return tx.senderId === currentUser.id;
    if (txFilter === 'incoming') return tx.recipientId === currentUser.id;
    return true;
  });

  // Generate QR for receive modal
  const handleOpenReceive = () => {
    const payload = JSON.stringify({
      protocol: 'pocket_cash',
      userId: currentUser.id,
      name: currentUser.name,
      account: currentUser.accountNumber,
      phone: currentUser.phone,
      amount: requestedAmount ? parseFloat(requestedAmount) : undefined,
    });

    QRCode.toDataURL(payload, {
      width: 260,
      margin: 1.5,
      color: { dark: '#022c22', light: '#ffffff' },
    })
      .then((url) => setReceiveQrUrl(url))
      .catch((err) => console.error(err));

    setShowReceiveModal(true);
  };

  // Re-generate QR when requestedAmount changes
  React.useEffect(() => {
    if (!showReceiveModal) return;
    const payload = JSON.stringify({
      protocol: 'pocket_cash',
      userId: currentUser.id,
      name: currentUser.name,
      account: currentUser.accountNumber,
      phone: currentUser.phone,
      amount: requestedAmount ? parseFloat(requestedAmount) : undefined,
    });
    QRCode.toDataURL(payload, {
      width: 260,
      margin: 1.5,
      color: { dark: '#022c22', light: '#ffffff' },
    }).then((url) => setReceiveQrUrl(url));
  }, [requestedAmount, showReceiveModal, currentUser]);

  // Execute payment
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (!payIdentifier.trim()) {
      setPayError('يرجى إدخال رقم الموبايل أو اختيار جهة دفع');
      return;
    }

    if (matchedRecipient?.role === 'admin') {
      setPayError('لا يمكن التحويل للإدارة عن بُعد؛ يجب الحضور شخصياً لمقر الإدارة للاستلام أو التسليم كاش يداً بيد.');
      return;
    }

    const res = transferBalance({
      recipientIdentifier: payIdentifier,
      amount: amt,
      note: payNote.trim() || 'دفع رصيد محلي',
      isQrScan: false,
      saveToQuickPay,
    });

    if (res.success && res.tx) {
      confetti({ particleCount: 70, spread: 60 });
      setShowPayModal(false);
      setPayAmount('');
      setPayIdentifier('');
      setPayNote('');
      setSaveToQuickPay(false);
      setToastMsg(`تم بنجاح دفع ${amt.toLocaleString()} ل.س إلى (${res.tx.recipientName})`);
      setTimeout(() => setToastMsg(''), 4500);
    } else {
      setPayError(res.error || 'فشلت عملية الدفع');
    }
  };

  // Add contact to saved list
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');

    if (!newContactName.trim() || (!newContactPhone.trim() && !newContactAccount.trim())) {
      setContactError('يرجى إدخال الاسم ورقم الحساب أو الموبايل');
      return;
    }

    addSavedContact({
      name: newContactName.trim(),
      phone: newContactPhone.trim() || newContactAccount.trim(),
      accountNumber: newContactAccount.trim() || newContactPhone.trim(),
    });

    setNewContactName('');
    setNewContactPhone('');
    setNewContactAccount('');
    setShowAddContactModal(false);
    setToastMsg('تمت إضافة جهة الدفع السريع بنجاح');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleQuickPayContact = (contact: SavedContact) => {
    setPayIdentifier(contact.accountNumber || contact.phone);
    setShowPayModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* 1. Main User Profile & Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          {/* User Personal Information Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {currentUser.shopName || currentUser.name}
                  </h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {isAdmin
                      ? 'المدير المعتمد لتزويد الكاش'
                      : currentUser.role === 'merchant'
                      ? 'متجر معتمد'
                      : 'مواطن بالحي'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-num font-mono mt-0.5">
                  حساب رقم: <span className="text-slate-200 font-bold">{currentUser.accountNumber}</span> • هاتف: {currentUser.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAdminProfile(true)}
                  className="py-2 px-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  title="تعديل اسم المدير، رقم الموبايل، العنوان ومقر الكاش"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>تعديل بيانات الإدارة</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenLogin}
                className="py-2 px-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="تسجيل الخروج من الحساب"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>تسجيل خروج</span>
              </button>
            </div>
          </div>

          {/* Current Available Balance */}
          <div>
            <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-semibold mb-1">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>الرصيد المتوفر لديك في محفظة الجيب:</span>
            </div>

            <div className="flex items-baseline gap-2.5">
              <h1 className="text-4xl sm:text-6xl font-black text-white font-num tracking-tight">
                {currentUser.balance.toLocaleString()}
              </h1>
              <span className="text-base sm:text-xl font-extrabold text-emerald-400">
                ليرة سورية (ل.س)
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              رصيدك الرقمي الجاهز للدفع المباشر بدل حمل النقود الورقية
            </p>
          </div>

          {/* 2 Primary Action Buttons: دفع رصيد & استلام رصيد */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {/* Pay Button */}
            <button
              onClick={() => {
                setPayIdentifier('');
                setShowPayModal(true);
              }}
              className="py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition active:scale-[0.99] cursor-pointer"
            >
              <ArrowUpRight className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              <span>دفع رصيد (بالباركود أو الحساب)</span>
            </button>

            {/* Receive Button */}
            <button
              onClick={handleOpenReceive}
              className="py-4 px-6 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-100 border-2 border-slate-700/80 font-black text-sm sm:text-base shadow-md flex items-center justify-center gap-2.5 transition active:scale-[0.99] cursor-pointer"
            >
              <ArrowDownLeft className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
              <span>استلام رصيد (كود الباركود الخاص بي)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SPECIAL MANAGER CONTROLS: APPEAR ONLY IF USER IS THE MANAGER */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-amber-200 flex items-center gap-2">
                  <span>أدوات المدير المعتمد (تزويد الرصيد وصرف الكاش)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                    خاص بك كمدير
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  أنت مستخدم عادي في التداول، وتملك صلاحية شحن أرصدة المشتركين وتبديل نقاطهم إلى كاش ورقي
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setView('admin')}
              className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition shadow-md self-start sm:self-center"
            >
              <Building className="w-4 h-4" />
              <span>فتح لوحة الصندوق الكاملة</span>
            </button>
          </div>

          {/* Quick Stats for Manager */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">الكاش الفعلي في الدرج:</span>
              <span className="text-base font-extrabold text-amber-400 font-num block mt-0.5">
                {state.adminVault.cashInDrawer.toLocaleString()} ل.س
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">رصيد الخزينة الرقمي:</span>
              <span className="text-base font-extrabold text-emerald-400 font-num block mt-0.5">
                {state.adminVault.digitalVaultBalance.toLocaleString()} ل.س
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between sm:block">
              <span className="text-slate-400 block text-[11px]">مشتركو ومحلات الحي:</span>
              <span className="text-base font-extrabold text-cyan-400 font-num block mt-0.5">
                {state.users.length - 1} مشترك
              </span>
            </div>
          </div>

          {/* Manager Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setView('admin')}
              className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>تزويد رصيد لمشترك (قبض كاش)</span>
            </button>

            <button
              type="button"
              onClick={() => setView('admin')}
              className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <ArrowDownToLine className="w-4 h-4 text-amber-400" />
              <span>تسليم وصرف كاش (خصم رصيد)</span>
            </button>

            <button
              type="button"
              onClick={() => setView('admin')}
              className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4 text-cyan-400" />
              <span>تسجيل مشترك جديد</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. جهات الدفع السريع المحفوظة فقط (Saved Quick-Pay Contacts) */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm text-white">جهات الدفع السريع المحفوظة لديك</h3>
              <p className="text-[11px] text-slate-400">
                حساباتك المفضلة (كالبقالية أو الأصدقاء) للدفع بنقرة واحدة دون البحث
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddContactModal(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة جهة</span>
          </button>
        </div>

        {/* Saved Contacts List or Clean Empty State */}
        {(!currentUser.savedContacts || currentUser.savedContacts.length === 0) ? (
          <div className="py-6 px-4 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800">
            <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-slate-300">
              لم تحتفظ بأي جهات للدفع السريع بعد
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              يمكنك حفظ البقاليات أو الأشخاص الذين تتعامل معهم باستمرار لتسريع عمليات الدفع المستقبلية.
            </p>
            <button
              onClick={() => setShowAddContactModal(true)}
              className="mt-3 text-xs font-bold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>إضافة جهتك الأولى الآن</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {currentUser.savedContacts.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 flex items-center justify-between gap-2.5 transition group"
              >
                <div
                  onClick={() => handleQuickPayContact(c)}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 truncate">
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
                    className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-[11px] font-bold transition cursor-pointer"
                  >
                    دفع
                  </button>
                  <button
                    onClick={() => removeSavedContact(c.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
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

      {/* 3. شريط أسفل صفحته يتضمن الحركات والعمليات التي يجريها على الحساب */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm text-white">شريط سجل العمليات والحركات الشخصية</h3>
              <p className="text-[11px] text-slate-400">
                جميع حركات الدفع والاستلام والشحن الخاصة بحسابك فقط
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-center">
            <button
              onClick={() => setTxFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                txFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({userTransactions.length})
            </button>
            <button
              onClick={() => setTxFilter('outgoing')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                txFilter === 'outgoing'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              دفع صادر
            </button>
            <button
              onClick={() => setTxFilter('incoming')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                txFilter === 'incoming'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              استلام وارد
            </button>
          </div>
        </div>

        {/* Transactions Items */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            لا توجد حركات تطابق التحديد حالياً.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.recipientId === currentUser.id;
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
                    {!isIncome && typeof tx.fee === 'number' && tx.fee > 0 && (
                      <span className="text-[10px] text-amber-300/80 font-num block">
                        عمولة الإدارة: {tx.fee.toLocaleString()} ل.س
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. عنوان الإدارة ورقم التلفون لشحن وصرف الكاش يداً بيد (معلومات فقط دون عمليات عن بعد) */}
      {!isAdmin && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border-2 border-slate-800 space-y-3.5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    إدارة كاش الحي (نقطة استلام وتسليم الكاش)
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    حضور شخصي
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  المعتمد: {adminUser.name}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 self-start sm:self-center">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>الدوام: 9:00 ص - 9:00 م</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Address */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-0.5">عنوان مقر الإدارة:</span>
                <p className="text-white font-semibold leading-relaxed">
                  {adminUser.address || 'ساحة الحي الرئيسية - جانب جامع التقوى (مكتب إدارة كاش الحي)'}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <PhoneCall className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-0.5">رقم هاتف الإدارة والتواصل:</span>
                  <p className="text-white font-black font-num text-sm">
                    {adminUser.phone}
                  </p>
                </div>
              </div>

              <a
                href={`tel:${adminUser.phone}`}
                className="py-1.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-xs transition border border-cyan-500/30 shrink-0 self-center"
              >
                اتصال الآن
              </a>
            </div>
          </div>

          {/* Notice: Must attend in person */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-300">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="leading-relaxed text-[11px] sm:text-xs">
              <strong>تنبيه:</strong> لشحن رصيد محفظتك نقداً أو استرداد نقاطك وتحويلها إلى كاش ورقي، يجب الحضور شخصياً لمقر الإدارة للاستلام والتسليم يداً بيد. لا يمكن إجراء عمليات مالية مع الإدارة عن بُعد عبر التطبيق.
            </p>
          </div>
        </div>
      )}

      {/* MODAL 1: دفع رصيد (Pay Balance Modal) */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">دفع رصيد</h3>
                  <p className="text-xs text-slate-400">تحويل مباشر أو دفع ثمن مشتريات</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              {/* Option to use Barcode Scanner */}
              <button
                type="button"
                onClick={() => {
                  setShowPayModal(false);
                  onOpenBarcodeScan();
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-dashed border-emerald-500/50 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>أو مسح باركود QR الخاص بالمستلم بالكاميرا</span>
              </button>

              {/* Recipient Mobile Phone or Account */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1">
                  رقم موبايل المشترك المستلم (أو رقم الحساب) *
                </label>
                <div className="relative">
                  <Smartphone className="w-5 h-5 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={payIdentifier}
                    onChange={(e) => {
                      setPayIdentifier(e.target.value);
                      setPayError('');
                    }}
                    placeholder="مثال: 0982115383"
                    className="w-full bg-slate-950 text-white placeholder-slate-500 font-num text-sm font-bold rounded-2xl pr-11 pl-4 py-3 border-2 border-slate-600 focus:border-emerald-400 focus:bg-slate-900 outline-none transition text-left"
                  />
                </div>

                {/* Instant recipient live feedback */}
                {matchedRecipient && (
                  matchedRecipient.role === 'admin' ? (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>حساب الإدارة: لا يمكن التحويل للإدارة عن بُعد؛ يجب الحضور شخصياً لمقر الإدارة للاستلام أو التسليم كاش يداً بيد.</span>
                    </div>
                  ) : (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>المستلم: {matchedRecipient.shopName || matchedRecipient.name} ({matchedRecipient.role === 'merchant' ? 'متجر معتمد' : 'مواطن بالحي'})</span>
                    </div>
                  )
                )}
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-200 mb-1">
                  <span>المبلغ المراد دفعه (ل.س) *</span>
                  <span className="text-slate-400 text-xs font-normal">
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
                    value={payAmount}
                    onChange={(e) => {
                      setPayAmount(e.target.value);
                      setPayError('');
                    }}
                    placeholder="0"
                    className="w-full bg-slate-950 text-white placeholder-slate-400 font-num text-base font-bold rounded-2xl px-4 py-3 border-2 border-slate-600 focus:border-emerald-400 focus:bg-slate-900 outline-none text-left"
                  />
                  <span className="absolute left-3 top-3.5 text-xs text-slate-400 font-bold pointer-events-none">
                    ل.س
                  </span>
                </div>
              </div>

              {/* Fee and Total Breakdown */}
              {parseFloat(payAmount) > 0 && (
                <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>مبلغ التحويل الصافي للمستلم:</span>
                    <span className="font-bold text-white font-num">
                      {parseFloat(payAmount).toLocaleString()} ل.س
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>
                      عمولة التحويل العائدة للإدارة (
                      {((state.adminVault.transferFeeRate ?? 0.01) * 100).toFixed(1)}%):
                    </span>
                    <span className="font-bold font-num">
                      +
                      {Math.round(
                        parseFloat(payAmount) * (state.adminVault.transferFeeRate ?? 0.01)
                      ).toLocaleString()}{' '}
                      ل.س
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-black border-t border-slate-800 pt-1.5">
                    <span>إجمالي الخصم من محفظتك:</span>
                    <span className="font-num">
                      {(
                        parseFloat(payAmount) +
                        Math.round(
                          parseFloat(payAmount) * (state.adminVault.transferFeeRate ?? 0.01)
                        )
                      ).toLocaleString()}{' '}
                      ل.س
                    </span>
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  بيان العملية (اختياري)
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="مثال: فاتورة بقالية، صرف كاش، سداد حساب..."
                  className="w-full bg-slate-950 text-white placeholder-slate-400 text-xs font-bold rounded-2xl px-4 py-2.5 border-2 border-slate-600 focus:border-emerald-400 focus:bg-slate-900 outline-none"
                />
              </div>

              {/* Checkbox: Save to quick pay */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveToQuickPay}
                  onChange={(e) => setSaveToQuickPay(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-700 bg-slate-950"
                />
                <span className="text-xs text-slate-300 font-medium">
                  حفظ هذا المستلم في قائمة "الدفع السريع" الخاصة بي
                </span>
              </label>

              {payError && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border-2 border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>تأكيد خصم الرصيد والدفع</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: استلام رصيد (Receive Balance Modal with QR) */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-right">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-400">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">استلام رصيد بالباركود</h3>
                  <p className="text-xs text-slate-400">شارك الرمز أو رقم الحساب لاستلام المبالغ</p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Optional Amount */}
            <div className="text-right">
              <label className="block text-xs font-bold text-slate-200 mb-1">
                تحديد مبلغ محدد للطلب (اختياري):
              </label>
              <input
                type="number"
                step="500"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
                placeholder="اتركه فارغاً ليستلم أي مبلغ"
                className="w-full bg-slate-950 text-white placeholder-slate-400 text-xs font-bold font-num rounded-xl px-3 py-2 border-2 border-slate-600 focus:border-teal-400 outline-none text-center"
              />
            </div>

            {/* QR Card */}
            <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3">
              <div className="w-52 h-52 bg-white p-2.5 rounded-2xl mx-auto shadow-xl flex items-center justify-center">
                {receiveQrUrl && (
                  <img src={receiveQrUrl} alt="My QR" className="w-full h-full object-contain" />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-white">{currentUser.name}</p>
                <p className="text-xs text-slate-400 font-num font-mono mt-0.5">
                  رقم الحساب: <span className="text-emerald-400 font-bold">{currentUser.accountNumber}</span>
                </p>
                {requestedAmount && (
                  <p className="text-xs font-bold text-teal-400 font-num mt-1">
                    المبلغ المطلوب: {parseFloat(requestedAmount).toLocaleString()} ل.س
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(currentUser.accountNumber);
                setCopiedAcc(true);
                setTimeout(() => setCopiedAcc(false), 2000);
              }}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {copiedAcc ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">تم نسخ رقم الحساب بنجاح</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ رقم الحساب ({currentUser.accountNumber})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: إضافة جهة للدفع السريع */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-400" />
                <span>إضافة جهة إلى الدفع السريع</span>
              </h3>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  الاسم أو اسم المتجر *
                </label>
                <input
                  type="text"
                  required
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="مثال: بقالية الحارة، أبو محمد..."
                  className="w-full bg-slate-950 text-white placeholder-slate-400 text-xs font-bold rounded-2xl px-3 py-2.5 border-2 border-slate-600 focus:border-emerald-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  رقم الحساب أو الموبايل *
                </label>
                <input
                  type="text"
                  required
                  value={newContactAccount}
                  onChange={(e) => setNewContactAccount(e.target.value)}
                  placeholder="مثال: CASH-100 أو SHOP-201 أو 09xxxxxxxx"
                  className="w-full bg-slate-950 text-white placeholder-slate-400 text-xs font-bold font-num rounded-2xl px-3 py-2.5 border-2 border-slate-600 focus:border-emerald-400 outline-none"
                />
              </div>

              {contactError && (
                <p className="text-xs text-rose-400 font-semibold">{contactError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ في قائمة الدفع السريع</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Profile Modal */}
      {isAdmin && (
        <AdminProfileModal
          isOpen={showAdminProfile}
          onClose={() => setShowAdminProfile(false)}
        />
      )}
    </div>
  );
};
