import React, { useState, useEffect } from 'react';
import {
  Building,
  Coins,
  ArrowDownToLine,
  PlusCircle,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Search,
  Sparkles,
  Wallet,
  KeyRound,
  Smartphone,
  UserCheck,
  Shield,
  ShieldCheck,
  Phone,
  ArrowRight,
  MapPin,
  User,
  Lock,
  Eye,
  EyeOff,
  Users,
  BarChart3,
  TrendingUp,
  ArrowRightLeft,
  Percent,
  Activity,
  Printer,
  FileText,
  ArrowUpRight,
  Clock,
  Filter,
  Cloud,
  Database,
  QrCode,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { CommunityUser } from '../types/wallet';
import { ChangePasswordModal } from './ChangePasswordModal';
import { AdminProfileModal } from './AdminProfileModal';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

export const AdminPortal: React.FC = () => {
  const {
    state,
    adminUser,
    updateUserProfile,
    adminChargeUserCash,
    adminWithdrawUserCash,
    registerNewUser,
    setTransferFeeRate,
    setView,
  } = useCommunityWallet();

  const { isInstallable, triggerInstall } = usePWAInstall();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'charge' | 'withdraw' | 'new_user' | 'lookup' | 'reports' | 'install_qr' | 'edit_profile'>('charge');

  // App Installation QR & Link states
  const [installQrUrl, setInstallQrUrl] = useState('');
  const [copiedInstallLink, setCopiedInstallLink] = useState(false);

  const appInstallUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/`
    : 'https://ais-dev-n6niorgs4l5qof6qdhjb2p-105836077369.europe-west2.run.app/';

  useEffect(() => {
    QRCode.toDataURL(appInstallUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setInstallQrUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate install QR code', err);
      });
  }, [appInstallUrl]);

  const handleCopyInstallLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(appInstallUrl);
      setCopiedInstallLink(true);
      setTimeout(() => setCopiedInstallLink(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    if (!installQrUrl) return;
    const a = document.createElement('a');
    a.href = installQrUrl;
    a.download = 'pocket-cash-app-install-qr.png';
    a.click();
  };

  // Reports and Analytics filter states
  const [reportFilter, setReportFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'transfers' | 'fees'>('all');
  const [reportSearch, setReportSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedFeePercent, setSelectedFeePercent] = useState<string>(
    (((state.adminVault.transferFeeRate ?? 0.01) * 100)).toString()
  );
  const [feeRateSavedNotice, setFeeRateSavedNotice] = useState('');

  // 1. Registered Customers Metrics
  const registeredUsers = state.users.filter((u) => u.role !== 'admin');
  const residentsCount = registeredUsers.filter((u) => u.role === 'resident').length;
  const merchantsCount = registeredUsers.filter((u) => u.role === 'merchant').length;
  const totalRegisteredUsers = registeredUsers.length;

  // 2. Deposit Operations (admin_cash_charge)
  const depositTxs = state.transactions.filter((tx) => tx.type === 'admin_cash_charge');
  const totalDepositedAmount = depositTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const avgDepositAmount = depositTxs.length > 0 ? Math.round(totalDepositedAmount / depositTxs.length) : 0;

  // 3. Withdrawal Operations (admin_cash_withdraw)
  const withdrawTxs = state.transactions.filter((tx) => tx.type === 'admin_cash_withdraw');
  const totalWithdrawnAmount = withdrawTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const avgWithdrawAmount = withdrawTxs.length > 0 ? Math.round(totalWithdrawnAmount / withdrawTxs.length) : 0;

  // 4. User-to-User Transfers (p2p_transfer & merchant_pay)
  const userTransferTxs = state.transactions.filter(
    (tx) => tx.type === 'p2p_transfer' || tx.type === 'merchant_pay'
  );
  const totalTransfersAmount = userTransferTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const avgTransferAmount = userTransferTxs.length > 0 ? Math.round(totalTransfersAmount / userTransferTxs.length) : 0;

  // 5. Amount Returning to Administration from Transfers
  const totalAdminTransferFees = userTransferTxs.reduce((sum, tx) => {
    if (typeof tx.fee === 'number') return sum + tx.fee;
    return sum + Math.round(tx.amount * (state.adminVault.transferFeeRate ?? 0.01));
  }, 0);

  // 6. Interaction & Engagement Metrics
  const activeUserIds = new Set<string>();
  state.transactions.forEach((tx) => {
    if (tx.senderId !== adminUser.id) activeUserIds.add(tx.senderId);
    if (tx.recipientId !== adminUser.id) activeUserIds.add(tx.recipientId);
  });
  const activeUsersCount = activeUserIds.size;
  const engagementRate = totalRegisteredUsers > 0
    ? Math.min(100, Math.round((activeUsersCount / totalRegisteredUsers) * 100))
    : 0;

  // Total balance circulating among users
  const totalUserBalances = registeredUsers.reduce((sum, u) => sum + u.balance, 0);

  // Commission updater handler
  const handleUpdateFeeRate = (newPercent: number) => {
    const rate = newPercent / 100;
    setTransferFeeRate(rate);
    setSelectedFeePercent(newPercent.toString());
    confetti({ particleCount: 50, spread: 60 });
    setFeeRateSavedNotice(`تم تحديث نسبة عمولة التحويل العائدة للإدارة إلى ${newPercent}% بنجاح!`);
    setTimeout(() => setFeeRateSavedNotice(''), 4500);
  };

  // Filtered transactions for reports
  const filteredReportTxs = state.transactions.filter((tx) => {
    if (reportFilter === 'deposits' && tx.type !== 'admin_cash_charge') return false;
    if (reportFilter === 'withdrawals' && tx.type !== 'admin_cash_withdraw') return false;
    if (reportFilter === 'transfers' && tx.type !== 'p2p_transfer' && tx.type !== 'merchant_pay') return false;
    if (reportFilter === 'fees' && (!tx.fee || tx.fee <= 0)) return false;

    if (reportSearch.trim()) {
      const q = reportSearch.trim().toLowerCase();
      const matchSender = tx.senderName.toLowerCase().includes(q);
      const matchRecipient = tx.recipientName.toLowerCase().includes(q);
      const matchReceipt = tx.receiptCode.toLowerCase().includes(q);
      const matchNote = tx.note?.toLowerCase().includes(q);
      return matchSender || matchRecipient || matchReceipt || matchNote;
    }
    return true;
  });

  // Filtered customer list
  const filteredCustomers = registeredUsers.filter((u) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.trim().toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.accountNumber.toLowerCase().includes(q) ||
      (u.shopName && u.shopName.toLowerCase().includes(q))
    );
  });

  // Admin Profile form states for dedicated tab
  const [profileName, setProfileName] = useState(adminUser.name || 'أبو حامد');
  const [profileShopName, setProfileShopName] = useState(adminUser.shopName || 'نقطة الكاش المعتمدة بالحي');
  const [profilePhone, setProfilePhone] = useState(adminUser.phone || '0999000111');
  const [profileAddress, setProfileAddress] = useState(
    adminUser.address || 'ساحة الحي الرئيسية - جانب جامع التقوى (مكتب إدارة كاش الحي)'
  );
  const [profileUsername, setProfileUsername] = useState(adminUser.username || 'admin');
  const [profileNewPin, setProfileNewPin] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState(
    adminUser.avatar || DEFAULT_AVATARS[0]
  );
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Phone normalization & lookup
  const normalizePhone = (p: string) => p.replace(/[\s\-\+]/g, '').trim();

  const findSubscriberByPhone = (phoneInput: string): CommunityUser | undefined => {
    const clean = normalizePhone(phoneInput);
    if (!clean || clean.length < 3) return undefined;
    return state.users.find((u) => {
      if (u.role === 'admin') return false;
      const userPhoneClean = normalizePhone(u.phone);
      if (userPhoneClean === clean) return true;
      if (userPhoneClean.replace(/^0/, '') === clean.replace(/^0/, '')) return true;
      if (u.accountNumber.toLowerCase() === phoneInput.trim().toLowerCase()) return true;
      return false;
    });
  };

  // Charge state (via mobile number)
  const [chargePhone, setChargePhone] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeNote, setChargeNote] = useState('شحن وتزويد رصيد مقابل استلام كاش يداً بيد');
  const [chargeSuccess, setChargeSuccess] = useState('');
  const [chargeError, setChargeError] = useState('');

  // Withdraw state (via mobile number)
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('تبديل رصيد ونقاط إلى كاش ورقي وتسليم المبالغ');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  // New user registration state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('09');
  const [newRole, setNewRole] = useState<'resident' | 'merchant'>('resident');
  const [newShopName, setNewShopName] = useState('');
  const [newInitialCash, setNewInitialCash] = useState('100000');
  const [newSuccess, setNewSuccess] = useState('');

  // Lookup tab state
  const [lookupPhone, setLookupPhone] = useState('');

  // Matched subscribers in real-time
  const targetChargeUser = findSubscriberByPhone(chargePhone);
  const targetWithdrawUser = findSubscriberByPhone(withdrawPhone);
  const targetLookupUser = findSubscriberByPhone(lookupPhone);

  const handleChargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChargeError('');
    setChargeSuccess('');

    if (!targetChargeUser) {
      setChargeError('يرجى إدخال رقم موبايل مشترك مسجل في النظام للتعرف عليه أولاً');
      return;
    }

    const amt = parseFloat(chargeAmount);
    if (isNaN(amt) || amt <= 0) {
      setChargeError('الرجاء إدخال مبلغ صحيح');
      return;
    }

    const res = adminChargeUserCash({
      userId: targetChargeUser.id,
      amount: amt,
      note: chargeNote,
    });

    if (res.success && res.tx) {
      confetti({ particleCount: 70, spread: 60 });
      setChargeSuccess(
        `تم بنجاح تزويد رصيد ${amt.toLocaleString()} ل.س لحساب (${res.tx.recipientName}) برقم الموبايل (${targetChargeUser.phone}) وقبض الكاش في الدرج!`
      );
      setChargeAmount('');
      setTimeout(() => setChargeSuccess(''), 4500);
    } else {
      setChargeError(res.error || 'حدث خطأ في عملية الشحن');
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    if (!targetWithdrawUser) {
      setWithdrawError('يرجى إدخال رقم موبايل مشترك مسجل في النظام للتعرف عليه أولاً');
      return;
    }

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawError('الرجاء إدخال مبلغ صحيح');
      return;
    }

    const res = adminWithdrawUserCash({
      userId: targetWithdrawUser.id,
      amount: amt,
      note: withdrawNote,
    });

    if (res.success && res.tx) {
      confetti({ particleCount: 50, spread: 50 });
      setWithdrawSuccess(
        `تم بنجاح صرف وتسليم ${amt.toLocaleString()} ل.س نقداً للمشترك (${targetWithdrawUser.name}) وخصم الرصيد الرقمي!`
      );
      setWithdrawAmount('');
      setTimeout(() => setWithdrawSuccess(''), 4500);
    } else {
      setWithdrawError(res.error || 'حدث خطأ في عملية السحب');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewSuccess('');

    if (!newName || !newPhone) return;

    const initialCash = parseFloat(newInitialCash) || 0;
    const created = registerNewUser({
      name: newName,
      phone: newPhone,
      role: newRole,
      shopName: newRole === 'merchant' ? newShopName : undefined,
      initialCashPaid: initialCash,
    });

    confetti({ particleCount: 80, spread: 70 });
    setNewSuccess(
      `تم تسجيل (${created.name}) بنجاح كـ ${
        created.role === 'merchant' ? 'متجر معتمد' : 'مشترك بالحي'
      } برقم الموبايل: ${created.phone} ورقم الحساب: ${created.accountNumber}`
    );

    setNewName('');
    setNewPhone('09');
    setNewShopName('');
    setNewInitialCash('100000');
    setTimeout(() => setNewSuccess(''), 5000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileName.trim()) {
      setProfileError('يرجى كتابة اسم المدير الشخصي');
      return;
    }
    if (!profilePhone.trim()) {
      setProfileError('يرجى إدخال رقم موبايل وهاتف الإدارة المعتمد');
      return;
    }
    if (!profileAddress.trim()) {
      setProfileError('يرجى تحديد عنوان ومقر الإدارة لتسليم الكاش');
      return;
    }
    if (!profileUsername.trim()) {
      setProfileError('يرجى تحديد اسم المستخدم لتسجيل الدخول');
      return;
    }
    if (profileNewPin && profileNewPin.length < 3) {
      setProfileError('كلمة المرور يجب ألا تقل عن 3 خانات');
      return;
    }

    const res = updateUserProfile({
      userId: adminUser.id,
      name: profileName.trim(),
      shopName: profileShopName.trim(),
      phone: profilePhone.trim(),
      address: profileAddress.trim(),
      username: profileUsername.trim(),
      avatar: profileAvatar.trim(),
      pin: profileNewPin.trim() ? profileNewPin.trim() : undefined,
    });

    if (res.success) {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      setProfileSuccess('تم حفظ وتحديث بيانات الإدارة بنجاح! تظهر الآن لجميع المشتركين وفي شاشات الدخول.');
      if (profileNewPin.trim()) {
        setProfileNewPin('');
      }
      setTimeout(() => {
        setProfileSuccess('');
      }, 5000);
    } else {
      setProfileError(res.error || 'فشل حفظ وتحديث البيانات');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Return to Personal Wallet Bar + Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>لوحة تزويد الرصيد وصندوق كاش الحي</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                صلاحية المدير
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تزويد المستخدمين بالرصيد برقم الموبايل مقابل كاش، وتبديل النقاط لكاش ورقي، وتسجيل المشتركين
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setView('wallet')}
            className="py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer active:scale-95"
            title="الانتقال للمحفظة الشخصية"
          >
            <Wallet className="w-4 h-4" />
            <span>محفظتي الشخصية</span>
          </button>
        </div>
      </div>

      {/* 6 Stat Cards of Admin Dashboard with Requested Customer Count & Transfer Returns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Card 1: Registered Customers Count */}
        <div
          onClick={() => setActiveTab('reports')}
          className="bg-slate-900 border-2 border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl p-4 transition cursor-pointer hover:shadow-lg hover:shadow-cyan-500/10 group"
          title="انقر لفتح تقرير تفاعل المشتركين وتفاصيل الزبائن"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-slate-300">عدد الزبائن المسجلين</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white font-num flex items-baseline gap-1">
            <span>{totalRegisteredUsers}</span>
            <span className="text-xs font-normal text-cyan-300">مشترك</span>
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800">
            <span>{residentsCount} مواطن • {merchantsCount} متجر</span>
            <span className="text-cyan-400 font-bold group-hover:underline text-[10px]">عرض ←</span>
          </div>
        </div>

        {/* Card 2: Admin Revenue / Returns from User Transfers */}
        <div
          onClick={() => {
            setActiveTab('reports');
            setReportFilter('fees');
          }}
          className="bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-4 transition cursor-pointer hover:shadow-lg hover:shadow-amber-500/15 group"
          title="المبلغ الذي عاد للإدارة جراء رسوم وعمولات التحويل بين المستخدمين"
        >
          <div className="flex items-center justify-between text-xs text-amber-300/90 mb-1.5">
            <span className="font-bold">عائدات الإدارة من التحويل</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-400 font-num flex items-baseline gap-1">
            <span>{totalAdminTransferFees.toLocaleString()}</span>
            <span className="text-xs font-normal text-amber-300/80">ل.س</span>
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800">
            <span className="text-amber-300/90 font-medium">عمولة {((state.adminVault.transferFeeRate ?? 0.01) * 100).toFixed(1)}%</span>
            <span className="text-amber-400 font-bold group-hover:underline text-[10px]">السجل ←</span>
          </div>
        </div>

        {/* Card 3: Deposited Amounts (Cash Charges) */}
        <div
          onClick={() => {
            setActiveTab('reports');
            setReportFilter('deposits');
          }}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition cursor-pointer hover:shadow-md group"
          title="المبالغ المقبوضة كاش وتم شحنها لأرصدة المشتركين"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-slate-300">المبالغ المودعة (الشحن)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <PlusCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-emerald-400 font-num">
            {totalDepositedAmount.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 mr-1">ل.س</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800">
            {depositTxs.length} عملية شحن رصيد نقداً
          </p>
        </div>

        {/* Card 4: Withdrawn Amounts (Cash Payouts) */}
        <div
          onClick={() => {
            setActiveTab('reports');
            setReportFilter('withdrawals');
          }}
          className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-4 transition cursor-pointer hover:shadow-md group"
          title="المبالغ التي تم صرفها وتسليمها كاش ورقي للزبائن"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-slate-300">المبالغ المسحوبة (الصرف)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400 group-hover:scale-110 transition">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-rose-400 font-num">
            {totalWithdrawnAmount.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 mr-1">ل.س</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800">
            {withdrawTxs.length} عملية تسليم كاش ورقي
          </p>
        </div>

        {/* Card 5: User Transfers Total Volume */}
        <div
          onClick={() => {
            setActiveTab('reports');
            setReportFilter('transfers');
          }}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 transition cursor-pointer hover:shadow-md group"
          title="إجمالي حركة التداول والدفع بين المستخدمين"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-slate-300">التحويلات بين المستخدمين</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-blue-400 font-num">
            {totalTransfersAmount.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 mr-1">ل.س</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800">
            {userTransferTxs.length} تحويل ودفع مشتريات
          </p>
        </div>

        {/* Card 6: Cash in Drawer & Vault */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-slate-300">الكاش الفعلي في الدرج</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white font-num">
            {state.adminVault.cashInDrawer.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 mr-1">ل.س</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800 truncate" title="رصيد الخزينة الرقمي المتاح">
            الخزينة: {state.adminVault.digitalVaultBalance.toLocaleString()} ل.س
          </p>
        </div>
      </div>

      {/* Tabs Menu (Desktop) */}
      <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('charge')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'charge'
              ? 'bg-emerald-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>تزويد الرصيد (مقابل كاش)</span>
        </button>

        <button
          onClick={() => setActiveTab('withdraw')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'withdraw'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>استلام وتسليم الكاش (تبديل النقاط)</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold flex items-center gap-2 transition shrink-0 cursor-pointer border ${
            activeTab === 'reports'
              ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-indigo-400/50 shadow-lg shadow-indigo-500/25'
              : 'text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>التقارير الشاملة والتفاعل وعوائد التحويل</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/30 text-indigo-200">
            {state.transactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('new_user')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'new_user'
              ? 'bg-cyan-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>تسجيل مشترك أو متجر</span>
        </button>

        <button
          onClick={() => setActiveTab('lookup')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'lookup'
              ? 'bg-indigo-500 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>استعلام عن مشترك</span>
        </button>

        <button
          onClick={() => setActiveTab('install_qr')}
          className={`py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition shrink-0 cursor-pointer border ${
            activeTab === 'install_qr'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/25'
              : 'text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>رابط وباركود تثبيت التطبيق</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>

        <button
          onClick={() => setActiveTab('edit_profile')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 cursor-pointer ${
            activeTab === 'edit_profile'
              ? 'bg-amber-500 text-slate-950 shadow shadow-amber-500/20'
              : 'text-amber-400/90 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>تعديل بيانات الإدارة والمقر</span>
        </button>
      </div>

      {/* Mobile Sub-Navigation Pills (Shown only when in Subscribers/Tools on Mobile) */}
      {(activeTab === 'new_user' || activeTab === 'lookup' || activeTab === 'install_qr' || activeTab === 'edit_profile') && (
        <div className="flex sm:hidden items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs overflow-x-auto no-scrollbar shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab('new_user')}
            className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
              activeTab === 'new_user'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>تسجيل جديد</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lookup')}
            className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
              activeTab === 'lookup'
                ? 'bg-indigo-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>استعلام وبحث</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('install_qr')}
            className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
              activeTab === 'install_qr'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>باركود التطبيق</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit_profile')}
            className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
              activeTab === 'edit_profile'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>بيانات المقر</span>
          </button>
        </div>
      )}

      {/* TAB 1: Charge Balance against Cash (BY MOBILE NUMBER) */}
      {activeTab === 'charge' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>تزويد رصيد محفظة لمشترك (مقابل كاش مقبوض يداً بيد)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                يتم اختيار المشترك مباشرة بكتابة رقم الموبايل دون الحاجة للبحث في قوائم المشتركين
              </p>
            </div>
            <span className="hidden sm:inline-block text-[11px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              تحديد برقم الهاتف
            </span>
          </div>

          <form onSubmit={handleChargeSubmit} className="space-y-4 max-w-xl">
            {/* Enter Subscriber Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                رقم موبايل المشترك المستلم للرصيد *
              </label>
              <div className="relative">
                <Smartphone className="w-5 h-5 text-slate-500 absolute right-3.5 top-3.5" />
                <input
                  type="tel"
                  dir="ltr"
                  required
                  value={chargePhone}
                  onChange={(e) => {
                    setChargePhone(e.target.value);
                    setChargeError('');
                  }}
                  placeholder="مثال: 0982115383"
                  className="w-full bg-slate-950 text-white placeholder-slate-500 font-num text-sm font-bold rounded-2xl pr-11 pl-4 py-3 border-2 border-slate-700 focus:border-emerald-500 focus:bg-slate-900 outline-none transition"
                />
              </div>
            </div>

            {/* Live Subscriber Identification Card */}
            {chargePhone.trim().length > 0 ? (
              targetChargeUser ? (
                <div className="p-3.5 bg-slate-950 rounded-2xl border-2 border-emerald-500/40 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={targetChargeUser.avatar}
                      alt={targetChargeUser.name}
                      className="w-11 h-11 rounded-xl object-cover border border-emerald-500/50 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm truncate">
                          {targetChargeUser.shopName || targetChargeUser.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                          {targetChargeUser.role === 'merchant' ? 'متجر معتمد' : 'مواطن بالحي'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-num font-mono mt-0.5">
                        رقم الحساب: <span className="text-slate-200 font-bold">{targetChargeUser.accountNumber}</span> • الهاتف: {targetChargeUser.phone}
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-num shrink-0 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">الرصيد قبل الشحن:</span>
                    <span className="font-extrabold text-sm text-emerald-400">
                      {targetChargeUser.balance.toLocaleString()} ل.س
                    </span>
                  </div>
                </div>
              ) : chargePhone.trim().length >= 4 ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>لم يتم العثور على مشترك مسجل بهذا الرقم ({chargePhone})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPhone(chargePhone);
                      setActiveTab('new_user');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-[11px] hover:bg-cyan-400 transition self-start sm:self-center cursor-pointer"
                  >
                    + تسجيل مشترك جديد بهذا الرقم
                  </button>
                </div>
              ) : null
            ) : (
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
                <span>اكتب رقم موبايل المشترك لتحديد حسابه ورصيده تلقائياً وإتمام الشحن.</span>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                المبلغ المقبوض كاش يداً بيد (ليرة سورية) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  required
                  value={chargeAmount}
                  onChange={(e) => {
                    setChargeAmount(e.target.value);
                    setChargeError('');
                  }}
                  placeholder="مثال: 250000"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm font-bold text-white font-num outline-none text-left"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                  ليرة سورية (ل.س)
                </span>
              </div>

              {/* Quick amount buttons */}
              <div className="flex gap-2 mt-2">
                {[50000, 100000, 250000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setChargeAmount(amt.toString())}
                    className="flex-1 py-1 rounded-lg text-[10px] font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition font-num cursor-pointer"
                  >
                    {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ملاحظة الإيصال (اختياري)
              </label>
              <input
                type="text"
                value={chargeNote}
                onChange={(e) => setChargeNote(e.target.value)}
                placeholder="مثال: شحن اشتراك أسبوعي كاش"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            {chargeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{chargeError}</span>
              </div>
            )}

            {chargeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{chargeSuccess}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!targetChargeUser}
              className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
                targetChargeUser
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>
                {targetChargeUser
                  ? `تأكيد قبض الكاش وشحن رصيد (${targetChargeUser.name})`
                  : 'أدخل رقم موبايل المشترك أولاً لتفعيل الشحن'}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: Withdraw Cash / Exchange to Cash (BY MOBILE NUMBER) */}
      {activeTab === 'withdraw' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-amber-400" />
                <span>تسليم وصرف كاش ورقي لمشترك (خصم من الرصيد وتبديل النقاط)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                يتم اختيار المشترك مباشرة بإدخال رقم موبايله لخصم الرصيد الرقمي وتسليمه الكاش نقداً
              </p>
            </div>
            <span className="hidden sm:inline-block text-[11px] px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
              صرف نقدي برقم الموبايل
            </span>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4 max-w-xl">
            {/* Enter Subscriber Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                رقم موبايل المشترك طالب صرف الكاش *
              </label>
              <div className="relative">
                <Smartphone className="w-5 h-5 text-slate-500 absolute right-3.5 top-3.5" />
                <input
                  type="tel"
                  dir="ltr"
                  required
                  value={withdrawPhone}
                  onChange={(e) => {
                    setWithdrawPhone(e.target.value);
                    setWithdrawError('');
                  }}
                  placeholder="مثال: 0982115383"
                  className="w-full bg-slate-950 text-white placeholder-slate-500 font-num text-sm font-bold rounded-2xl pr-11 pl-4 py-3 border-2 border-slate-700 focus:border-amber-500 focus:bg-slate-900 outline-none transition"
                />
              </div>
            </div>

            {/* Target user live card */}
            {withdrawPhone.trim().length > 0 ? (
              targetWithdrawUser ? (
                <div className="p-3.5 bg-slate-950 rounded-2xl border-2 border-amber-500/40 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={targetWithdrawUser.avatar}
                      alt={targetWithdrawUser.name}
                      className="w-11 h-11 rounded-xl object-cover border border-amber-500/50 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm truncate">
                          {targetWithdrawUser.shopName || targetWithdrawUser.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold shrink-0">
                          {targetWithdrawUser.role === 'merchant' ? 'متجر معتمد' : 'مواطن'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-num font-mono mt-0.5">
                        حساب رقم: <span className="text-slate-200 font-bold">{targetWithdrawUser.accountNumber}</span> • الهاتف: {targetWithdrawUser.phone}
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-num shrink-0 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">الرصيد المتاح للصرف:</span>
                    <span className="font-extrabold text-sm text-amber-400">
                      {targetWithdrawUser.balance.toLocaleString()} ل.س
                    </span>
                  </div>
                </div>
              ) : withdrawPhone.trim().length >= 4 ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>لم يتم العثور على مشترك مسجل برقم الموبايل ({withdrawPhone})</span>
                </div>
              ) : null
            ) : (
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
                <span>أدخل رقم موبايل المشترك لتحديد رصيده المتاح لصرف الكاش.</span>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                مبلغ الكاش المراد تسليمه وصرفه (ل.س) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  required
                  value={withdrawAmount}
                  onChange={(e) => {
                    setWithdrawAmount(e.target.value);
                    setWithdrawError('');
                  }}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm font-bold text-white font-num outline-none text-left"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                  ليرة سورية
                </span>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ملاحظة الإيصال
              </label>
              <input
                type="text"
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
                placeholder="بيان عملية الصرف..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!targetWithdrawUser}
              className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
                targetWithdrawUser
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>
                {targetWithdrawUser
                  ? `تأكيد تسليم الكاش نقداً لـ (${targetWithdrawUser.name})`
                  : 'أدخل رقم موبايل المشترك لتفعيل الصرف'}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: New User / Merchant Registration */}
      {activeTab === 'new_user' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>تسجيل مشترك أو محل تجاري جديد في الحي</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                إضافة جار جديد أو بقالية/صيدلية مع شحن رصيد افتتاحي مقابل كاش مقبوض
              </p>
            </div>
            <span className="hidden sm:inline-block text-[11px] px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20">
              تسجيل معتمد
            </span>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setNewRole('resident')}
                className={`py-2 px-3 rounded-xl font-bold transition cursor-pointer ${
                  newRole === 'resident'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                مواطن / مقيم بالحي
              </button>
              <button
                type="button"
                onClick={() => setNewRole('merchant')}
                className={`py-2 px-3 rounded-xl font-bold transition cursor-pointer ${
                  newRole === 'merchant'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                محل تجاري / بقالية / صيدلية
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                اسم المشترك بالكامل *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: أحمد عبد الله"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            {newRole === 'merchant' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم المحل أو البقالية *
                </label>
                <input
                  type="text"
                  required
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="مثال: بقالية البركة"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                رقم الموبايل * (المستخدم لتسجيل الدخول واختيار الحساب)
              </label>
              <input
                type="tel"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-num font-bold outline-none text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                المبلغ المقبوض كاش كرصيد افتتاحي (ل.س)
              </label>
              <input
                type="number"
                step="5000"
                value={newInitialCash}
                onChange={(e) => setNewInitialCash(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-num font-bold outline-none text-left"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                يتم استلام هذا المبلغ كاش وإضافته لدرج الصندوق، وشحن رصيد مماثل لمحفظة المشترك فوراً.
              </p>
            </div>

            {newSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{newSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>إتمام تسجيل المشترك وقبض الكاش الأولي</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: Subscriber Lookup by Mobile Number (NO PUBLIC LIST) */}
      {activeTab === 'lookup' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                <span>الاستعلام المباشر عن حساب مشترك برقم الموبايل</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                أدخل رقم موبايل أي مشترك للاطلاع على رصيده الحالي وحسابه والقيام بعمليات الشحن أو الصرف
              </p>
            </div>
          </div>

          <div className="max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                رقم موبايل المشترك المراد الاستعلام عنه *
              </label>
              <div className="relative">
                <Smartphone className="w-5 h-5 text-slate-500 absolute right-3.5 top-3.5" />
                <input
                  type="tel"
                  dir="ltr"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder="أدخل رقم الموبايل (مثال: 0982115383)"
                  className="w-full bg-slate-950 text-white placeholder-slate-500 font-num text-sm font-bold rounded-2xl pr-11 pl-4 py-3 border-2 border-slate-700 focus:border-indigo-500 focus:bg-slate-900 outline-none transition"
                />
              </div>
            </div>

            {/* Result display */}
            {lookupPhone.trim().length > 0 ? (
              targetLookupUser ? (
                <div className="p-5 rounded-3xl bg-slate-950 border-2 border-indigo-500/40 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <img
                        src={targetLookupUser.avatar}
                        alt={targetLookupUser.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/50 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white">
                            {targetLookupUser.shopName || targetLookupUser.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                            {targetLookupUser.role === 'merchant' ? 'متجر معتمد' : 'مواطن بالحي'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-num mt-1">
                          الهاتف: <span className="text-slate-200 font-bold">{targetLookupUser.phone}</span> • حساب رقم: <span className="text-indigo-300 font-mono font-bold">{targetLookupUser.accountNumber}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">الرصيد المتاح الحالي:</span>
                    <span className="text-xl font-black text-emerald-400 font-num">
                      {targetLookupUser.balance.toLocaleString()} <span className="text-xs font-normal text-slate-400">ل.س</span>
                    </span>
                  </div>

                  {/* Direct actions */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setChargePhone(targetLookupUser.phone);
                        setActiveTab('charge');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>تزويد رصيد (كاش)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawPhone(targetLookupUser.phone);
                        setActiveTab('withdraw');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>صرف وتسليم كاش</span>
                    </button>
                  </div>
                </div>
              ) : lookupPhone.trim().length >= 4 ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>لا يوجد مشترك مسجل برقم الموبايل ({lookupPhone})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPhone(lookupPhone);
                      setActiveTab('new_user');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition cursor-pointer self-start sm:self-center"
                  >
                    + تسجيل مشترك جديد
                  </button>
                </div>
              ) : null
            ) : (
              <div className="py-8 px-4 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-slate-400 space-y-2">
                <Search className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">
                  الاستعلام يتم حصراً عبر رقم الموبايل
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  حفاظاً على خصوصية السكان، لا تظهر قوائم المشتركين للعامة. اكتب رقم هاتف المشترك للاستعلام عن حسابه.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Comprehensive Reports, Engagement, Deposits, Withdrawals, Transfers & Admin Returns */}
      {activeTab === 'reports' && (
        <div className="bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-5 sm:p-7 space-y-7 shadow-2xl animate-in fade-in duration-200">
          {/* Header of Reports Tab */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    لوحة التقارير الشاملة وتحليلات الصندوق
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    تقارير حية ومحدثة
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  إحصائيات تفاعل الزبائن، المبالغ المودعة والمسحوبة، وتحويلات المشتركين مع العائد المحقق للإدارة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="طباعة ملخص التقرير المالي"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>طباعة التقرير</span>
              </button>
            </div>
          </div>

          {/* Firebase Cloud & Database Status Banner */}
          <div className="rounded-2xl bg-slate-950/90 border border-amber-500/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-sm">قاعدة بيانات وسحابة Firebase</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>متصل ونشط</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  معرّف المشروع السحابي: <span className="font-mono text-amber-300 font-bold">celtic-script-nzp2g</span> • قواعد الأمان: <span className="text-emerald-300 font-bold">منشورة ومحمية (Firestore Rules)</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                تزامن سحابي فوري + دعم كامل للأوفلاين
              </span>
            </div>
          </div>

          {/* 1. Special Golden Card: Amount Returning to Administration from User Transfers */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-950 to-slate-900 border-2 border-amber-500/50 p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-black text-white">
                      المبلغ العائد للإدارة جراء عمليات التحويل بين المستخدمين
                    </h4>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                      عوائد وأرباح الصندوق
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                    هذا المبلغ ناتج عن الرسوم المستقطعة تلقائياً عند إجراء المشتركين لتحويلات شخصية أو دفع مشتريات للمتاجر، ويعود بالكامل لحساب وصندوق الإدارة لتمويل وضمان عمليات كاش الحي.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/90 border-2 border-amber-500/40 rounded-2xl p-4 text-center sm:text-left shrink-0">
                <span className="text-[11px] text-amber-300/80 font-bold block mb-1">
                  إجمالي المبلغ العائد للإدارة:
                </span>
                <p className="text-2xl sm:text-3xl font-black text-amber-400 font-num">
                  {totalAdminTransferFees.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-400">ل.س</span>
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">
                  من إجمالي {userTransferTxs.length} عملية تحويل ودفع
                </span>
              </div>
            </div>

            {/* Commission Rate Controller */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-400" />
                  <span>تعديل نسبة عمولة الإدارة على التحويل:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {[0, 0.5, 1, 1.5, 2].map((pct) => {
                    const isCur = Math.abs((state.adminVault.transferFeeRate ?? 0.01) * 100 - pct) < 0.01;
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleUpdateFeeRate(pct)}
                        className={`py-1 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer font-num ${
                          isCur
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {pct === 0 ? '0% مجاناً' : `${pct}%`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                النسبة الحالية المطبقة:{' '}
                <span className="text-amber-300 font-bold font-num">
                  {((state.adminVault.transferFeeRate ?? 0.01) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {feeRateSavedNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feeRateSavedNotice}</span>
              </div>
            )}
          </div>

          {/* 2. Key Analytics Grid: Customers Engagement & Core Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Registered Customers & Engagement Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">تقرير الزبائن والتفاعل</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-white font-num">
                {totalRegisteredUsers}{' '}
                <span className="text-xs font-normal text-cyan-300">مشترك مسجل</span>
              </p>
              <div className="space-y-1 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span>المواطنون والمقيمون:</span>
                  <span className="text-slate-200 font-bold font-num">{residentsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>المحلات والبقاليات:</span>
                  <span className="text-slate-200 font-bold font-num">{merchantsCount}</span>
                </div>
                <div className="flex justify-between text-cyan-300 pt-0.5">
                  <span>نسبة التفاعل والنشاط:</span>
                  <span className="font-bold font-num">{engagementRate}% ({activeUsersCount} نشط)</span>
                </div>
              </div>
            </div>

            {/* Deposited Cash Report Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">تقرير المبالغ المودعة</span>
                <PlusCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-num">
                {totalDepositedAmount.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">ل.س</span>
              </p>
              <div className="space-y-1 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span>عدد عمليات الشحن والإيداع:</span>
                  <span className="text-slate-200 font-bold font-num">{depositTxs.length} عملية</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط قيمة الشحن:</span>
                  <span className="text-slate-200 font-bold font-num">{avgDepositAmount.toLocaleString()} ل.س</span>
                </div>
                <div className="flex justify-between text-emerald-300 pt-0.5">
                  <span>كاش مقبوض بالدرج:</span>
                  <span className="font-bold font-num">مضاف فوراً</span>
                </div>
              </div>
            </div>

            {/* Withdrawn Cash Report Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">تقرير المبالغ المسحوبة</span>
                <ArrowDownToLine className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-rose-400 font-num">
                {totalWithdrawnAmount.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">ل.س</span>
              </p>
              <div className="space-y-1 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span>عدد عمليات الصرف الورقي:</span>
                  <span className="text-slate-200 font-bold font-num">{withdrawTxs.length} عملية</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط قيمة السحب:</span>
                  <span className="text-slate-200 font-bold font-num">{avgWithdrawAmount.toLocaleString()} ل.س</span>
                </div>
                <div className="flex justify-between text-rose-300 pt-0.5">
                  <span>كاش مصروف يداً بيد:</span>
                  <span className="font-bold font-num">مخصوم من الدرج</span>
                </div>
              </div>
            </div>

            {/* User Transfers Report Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">تحويلات المستخدمين</span>
                <ArrowRightLeft className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-blue-400 font-num">
                {totalTransfersAmount.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">ل.س</span>
              </p>
              <div className="space-y-1 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span>عدد عمليات التحويل والدفع:</span>
                  <span className="text-slate-200 font-bold font-num">{userTransferTxs.length} عملية</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط التحويل الواحد:</span>
                  <span className="text-slate-200 font-bold font-num">{avgTransferAmount.toLocaleString()} ل.س</span>
                </div>
                <div className="flex justify-between text-amber-300 pt-0.5">
                  <span>العائد المتحقق للإدارة:</span>
                  <span className="font-bold font-num">+{totalAdminTransferFees.toLocaleString()} ل.س</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Visual Volume & Interaction Comparison Bar */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white">توزيع ونشاط التدفقات المالية بالحي:</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>إيداع وشحن: {totalDepositedAmount.toLocaleString()} ل.س</span>
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  <span>سحب وصرف: {totalWithdrawnAmount.toLocaleString()} ل.س</span>
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                  <span>تحويلات وتداول: {totalTransfersAmount.toLocaleString()} ل.س</span>
                </span>
              </div>
            </div>

            {/* Visual Bar */}
            {totalDepositedAmount + totalWithdrawnAmount + totalTransfersAmount > 0 && (
              <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex">
                <div
                  style={{
                    width: `${Math.max(
                      5,
                      Math.round(
                        (totalDepositedAmount /
                          (totalDepositedAmount + totalWithdrawnAmount + totalTransfersAmount)) *
                          100
                      )
                    )}%`,
                  }}
                  className="bg-emerald-500 h-full transition-all"
                  title="المبالغ المودعة"
                />
                <div
                  style={{
                    width: `${Math.max(
                      5,
                      Math.round(
                        (totalWithdrawnAmount /
                          (totalDepositedAmount + totalWithdrawnAmount + totalTransfersAmount)) *
                          100
                      )
                    )}%`,
                  }}
                  className="bg-rose-500 h-full transition-all"
                  title="المبالغ المسحوبة"
                />
                <div
                  style={{
                    width: `${Math.max(
                      5,
                      Math.round(
                        (totalTransfersAmount /
                          (totalDepositedAmount + totalWithdrawnAmount + totalTransfersAmount)) *
                          100
                      )
                    )}%`,
                  }}
                  className="bg-blue-500 h-full transition-all"
                  title="التحويلات بين المستخدمين"
                />
              </div>
            )}
          </div>

          {/* 4. Registered Customers Engagement List (Search & Activity) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h4 className="font-extrabold text-sm text-white">
                  قائمة الزبائن والمشتركين المسجلين ومستوى تفاعلهم ({filteredCustomers.length})
                </h4>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="بحث باسم المشترك، الموبايل، أو الحساب..."
                  className="w-full bg-slate-950 text-white placeholder-slate-500 text-xs font-semibold rounded-xl pr-9 pl-3 py-2 border border-slate-800 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
                لا يوجد زبائن يطابقون عبارة البحث.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1 no-scrollbar">
                {filteredCustomers.map((cust) => {
                  const userTxCount = state.transactions.filter(
                    (tx) => tx.senderId === cust.id || tx.recipientId === cust.id
                  ).length;
                  return (
                    <div
                      key={cust.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={cust.avatar}
                          alt={cust.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white truncate">
                              {cust.shopName || cust.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold shrink-0">
                              {cust.role === 'merchant' ? 'متجر' : 'مواطن'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-num font-mono mt-0.5">
                            الهاتف: {cust.phone} • الحساب: {cust.accountNumber}
                          </p>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <p className="font-extrabold text-emerald-400 font-num text-sm">
                          {cust.balance.toLocaleString()} ل.س
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-bold inline-block mt-0.5">
                          {userTxCount} حركات تفاعل
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Detailed Transactions Ledger with Filters & Admin Fee Highlight */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h4 className="font-extrabold text-sm text-white">
                  سجل الحركات والتقارير التفصيلي ({filteredReportTxs.length})
                </h4>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setReportFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                    reportFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل ({state.transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilter('deposits')}
                  className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                    reportFilter === 'deposits'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  المودع (الشحن) ({depositTxs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilter('withdrawals')}
                  className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                    reportFilter === 'withdrawals'
                      ? 'bg-rose-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  المسحوب (الصرف) ({withdrawTxs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilter('transfers')}
                  className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                    reportFilter === 'transfers'
                      ? 'bg-blue-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  التحويلات ({userTransferTxs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilter('fees')}
                  className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                    reportFilter === 'fees'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-amber-300/80 hover:text-amber-300'
                  }`}
                >
                  عوائد الإدارة
                </button>
              </div>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="تصفية السجل باسم المشترك، رقم الإيصال، أو البيان..."
                className="w-full bg-slate-950 text-white placeholder-slate-500 text-xs font-semibold rounded-xl pr-10 pl-3 py-2.5 border border-slate-800 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Transactions List */}
            {filteredReportTxs.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
                لا توجد عمليات تطابق معايير الفلترة المحددة.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredReportTxs.map((tx) => {
                  const isDeposit = tx.type === 'admin_cash_charge';
                  const isWithdraw = tx.type === 'admin_cash_withdraw';
                  const isTransfer = tx.type === 'p2p_transfer' || tx.type === 'merchant_pay';
                  const hasFee = typeof tx.fee === 'number' && tx.fee > 0;

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isDeposit
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : isWithdraw
                              ? 'bg-rose-500/15 text-rose-400'
                              : 'bg-blue-500/15 text-blue-400'
                          }`}
                        >
                          {isDeposit ? (
                            <PlusCircle className="w-4 h-4" />
                          ) : isWithdraw ? (
                            <ArrowDownToLine className="w-4 h-4" />
                          ) : (
                            <ArrowRightLeft className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isDeposit
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : isWithdraw
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {isDeposit
                                ? 'إيداع وشحن رصيد'
                                : isWithdraw
                                ? 'سحب وصرف كاش'
                                : tx.type === 'merchant_pay'
                                ? 'دفع لمتجر'
                                : 'تحويل بين مستخدمين'}
                            </span>
                            <span className="font-bold text-white truncate">
                              {tx.senderName} ← {tx.recipientName}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                            {tx.note}
                          </p>
                          <span className="text-[10px] text-slate-500 font-num font-mono mt-0.5 block">
                            كود: {tx.receiptCode} • {new Date(tx.timestamp).toLocaleString('ar-SY', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>

                      <div className="text-left font-num shrink-0 self-end sm:self-center bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">مبلغ الحركة:</span>
                        <span className="text-base font-extrabold text-white">
                          {tx.amount.toLocaleString()} ل.س
                        </span>

                        {hasFee && (
                          <div className="flex items-center justify-end gap-1 text-[10px] text-amber-300 font-bold mt-0.5">
                            <span>عاد للإدارة:</span>
                            <span className="text-amber-400">+{tx.fee?.toLocaleString()} ل.س</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: App Installation QR Barcode & Link */}
      {activeTab === 'install_qr' && (
        <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-7 space-y-7 shadow-2xl animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25 shrink-0 font-bold">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    باركود ورابط تثبيت تطبيق محفظة كاش الحي
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    تثبيت فوري PWA
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  امسح الباركود بهاتفك أو انسخ الرابط لتثبيت تطبيق المحفظة على هواتف المشتركين والمتاجر ليعمل كبديل لمحفظة الجيب أوفلاين
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="طباعة بوستر التثبيت للمركز والمحلات"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>طباعة بوستر المركز</span>
              </button>
            </div>
          </div>

          {/* Main Showcase: Official App Icon & Quick Details */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border-2 border-emerald-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* App Icon Image */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/20 border-2 border-emerald-400/50 bg-slate-950 p-1">
                  <img
                    src="/pwa-512x512.png"
                    alt="أيقونة محفظة كاش الحي للتثبيت 512x512"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-full shadow whitespace-nowrap">
                  أيقونة محفظة الجيب (512×512)
                </span>
              </div>

              {/* Text / App Info */}
              <div className="space-y-2 text-center md:text-right flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h4 className="text-lg sm:text-xl font-black text-white">
                    تطبيق محفظة كاش الحي
                  </h4>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                    بديل محفظة الجيب النقدية
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  تطبيق وب تقدمي (Progressive Web App) يتيح لجميع سكان الحي وأصحاب المحلات والبقاليات التداول اليومي المباشر، الدفع الفوري، وتبديل الكاش بالرصيد الرقمي عبر كود QR وبدون أي حاجة للإنترنت بعد التثبيت.
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2 text-[11px]">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>يعمل بدون إنترنت (Offline-First)</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-cyan-300 font-bold flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>تثبيت مباشر دون متجر تطبيقات</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-amber-300 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>آمن ومحمي ومشفر</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Barcode & Link Action Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* The QR Barcode Card */}
            <div className="lg:col-span-5 bg-slate-950 border-2 border-emerald-500/30 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                <QrCode className="w-4 h-4" />
                <span>امسح الباركود بكاميرا الموبايل للتثبيت:</span>
              </div>

              {/* QR Container */}
              <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-slate-800">
                {installQrUrl ? (
                  <img
                    src={installQrUrl}
                    alt="باركود تثبيت تطبيق كاش الحي"
                    className="w-56 h-56 object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    جاري توليد الباركود...
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 block font-medium">
                  يوجه مباشرة لصفحة التثبيت على أندرويد وآيفون
                </span>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تحميل الباركود كصورة (PNG)</span>
                </button>
              </div>
            </div>

            {/* Direct Link and Installation Guides */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
              {/* Copy Link Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-white flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-emerald-400" />
                    <span>رابط التثبيت المباشر:</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    يمكن إرساله عبر واتساب أو الرسائل
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appInstallUrl}
                    className="flex-1 bg-slate-900 text-slate-300 text-xs font-mono font-semibold rounded-xl px-3.5 py-3 border border-slate-800 focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInstallLink}
                    className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      copiedInstallLink
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                    }`}
                  >
                    {copiedInstallLink ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ الرابط</span>
                      </>
                    )}
                  </button>
                </div>

                {isInstallable && (
                  <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                    <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>المتصفح جاهز للتثبيت الفوري بنقرة واحدة:</span>
                    </span>
                    <button
                      type="button"
                      onClick={triggerInstall}
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:opacity-95 transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>تثبيت التطبيق الآن على هذا الجهاز</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions for Android & iPhone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Android Guide */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      📱
                    </div>
                    <span className="font-bold text-xs text-white">طريقة التثبيت على أندرويد</span>
                  </div>
                  <ol className="text-[11px] text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed pr-1">
                    <li>امسح الباركود أو افتح الرابط في متصفح Chrome.</li>
                    <li>
                      اضغط على رسالة <strong className="text-emerald-300">"تثبيت كاش الحي"</strong> أو من خيارات المتصفح (⋮) اختر <strong className="text-slate-200">"تثبيت التطبيق"</strong> أو <strong className="text-slate-200">"إضافة للشاشة الرئيسية"</strong>.
                    </li>
                    <li>ستظهر أيقونة محفظة الجيب بين تطبيقات الهاتف وتعمل بدون إنترنت.</li>
                  </ol>
                </div>

                {/* iPhone Guide */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      🍏
                    </div>
                    <span className="font-bold text-xs text-white">طريقة التثبيت على آيفون (iOS)</span>
                  </div>
                  <ol className="text-[11px] text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed pr-1">
                    <li>افتح الرابط في متصفح <strong className="text-cyan-300">Safari</strong>.</li>
                    <li>
                      اضغط على زر المشاركة <strong className="text-slate-200">(Share ⎋)</strong> في أسفل الشاشة.
                    </li>
                    <li>
                      اختر <strong className="text-slate-200">"إضافة إلى الصفحة الرئيسية (Add to Home Screen)"</strong> ثم اضغط <strong className="text-emerald-300">"إضافة"</strong>.
                    </li>
                  </ol>
                </div>
              </div>

              {/* Admin Note Box */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  <strong>نصيحة للإدارة:</strong> يمكنك طباعة هذا الباركود ولصقه على مكتب الإدارة في الحي أو عند مدخل المركز، بحيث يتمكن أي مواطن أو صاحب دكان من مسح الكود وتثبيت المحفظة فوراً واستلام رصيده الأول يداً بيد.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TAB 5: Edit Admin Personal Profile & Physical HQ Details */}
      {activeTab === 'edit_profile' && (
        <div className="bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                  <span>تعديل البيانات الشخصية ومقر الإدارة</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    تنسيق وتحديث فوري
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  هذه المعلومات تظهر لجميع المشتركين ليعرفوا عنوان المقر ورقم الموبايل للحضور شخصياً واستلام أو تسليم الكاش
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('charge')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>العودة لشحن الرصيد</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          {/* Alerts */}
          {profileError && (
            <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs rounded-2xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-2xl flex items-center gap-2.5 font-bold shadow-lg shadow-emerald-500/10 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column (7 cols) */}
            <form onSubmit={handleSaveProfile} className="lg:col-span-7 space-y-4">
              {/* Avatar Selector */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2.5">
                <label className="block text-slate-300 font-bold text-xs">
                  الصورة الرمزية للمدير:
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={profileAvatar}
                    alt="Admin Avatar"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/60 shadow-md shrink-0"
                  />
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[11px] text-slate-400 block">
                      اختر صورة رمزية معتمدة:
                    </span>
                    <div className="flex items-center gap-2">
                      {DEFAULT_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProfileAvatar(url)}
                          className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                            profileAvatar === url
                              ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/40'
                              : 'border-slate-700 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Shop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold text-xs mb-1.5">
                    اسم المدير الشخصي *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="مثال: أبو حامد"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl py-2.5 px-3 pl-9 text-white text-xs font-bold outline-none transition"
                      required
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold text-xs mb-1.5">
                    اسم نقطة الكاش / المركز
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileShopName}
                      onChange={(e) => setProfileShopName(e.target.value)}
                      placeholder="مثال: نقطة الكاش المعتمدة بالحي"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl py-2.5 px-3 pl-9 text-white text-xs outline-none transition"
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-slate-300 font-bold text-xs mb-1.5">
                  رقم موبايل وهاتف الإدارة المعتمد *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="0999000111"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl py-2.5 px-3 pl-9 text-white text-xs font-mono font-bold outline-none transition"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  رقم الاتصال المباشر الذي يظهر في صفحة الزبائن للاستفسار أو طلب حضور لاستلام وتسليم الكاش
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-300 font-bold text-xs mb-1.5">
                  عنوان ومقر الإدارة الفعلي بالحي *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="ساحة الحي الرئيسية - جانب جامع التقوى (مكتب إدارة كاش الحي)"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl py-2.5 px-3 pl-9 text-white text-xs outline-none transition"
                    required
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  الموقع الدقيق بالحي المعروض للمشتركين ليعرفوا أين يتوجهون شخصياً يداً بيد
                </p>
              </div>

              {/* Credentials Box */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>بيانات تسجيل الدخول للإدارة (خاصة بالمدير):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      اسم المستخدم لتسجيل الدخول *
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={profileUsername}
                      onChange={(e) => setProfileUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl py-2 px-3 text-white text-xs font-mono font-bold outline-none"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-400 text-[11px]">
                        كلمة المرور الجديدة (اختياري)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPinText(!showPinText)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer"
                      >
                        {showPinText ? 'إخفاء' : 'إظهار'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPinText ? 'text' : 'password'}
                        dir="ltr"
                        value={profileNewPin}
                        onChange={(e) => setProfileNewPin(e.target.value)}
                        placeholder="اتركها فارغة للإبقاء على الحالية"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl py-2 px-3 text-white text-xs font-mono outline-none"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto py-3 px-8 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>حفظ وتحديث بيانات الإدارة</span>
                </button>
              </div>
            </form>

            {/* Live Preview Column (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>معاينة حية: كيف تظهر بياناتك لجميع المشتركين</span>
              </div>

              <div className="rounded-2xl border-2 border-emerald-500/30 bg-slate-950 p-4 space-y-3.5 shadow-xl relative overflow-hidden">
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  واجهة الزبائن
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <img
                    src={profileAvatar}
                    alt={profileName}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-amber-400/50 shadow shrink-0"
                  />
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-white truncate">
                        {profileName || 'أبو حامد'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                        المدير
                      </span>
                    </div>
                    <p className="text-xs text-amber-300/90 font-medium truncate mt-0.5">
                      {profileShopName || 'نقطة الكاش المعتمدة بالحي'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-slate-400 text-[11px]">رقم هاتف وموبايل الإدارة:</span>
                    <span className="font-bold text-white font-mono font-num dir-ltr mr-auto">
                      {profilePhone || '0999000111'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[11px] block">عنوان ومقر الإدارة:</span>
                      <span className="text-slate-200 text-xs font-medium leading-relaxed block">
                        {profileAddress || 'ساحة الحي الرئيسية'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>الحضور شخصياً للمقر لتسليم أو استلام الكاش الورقي</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/80 leading-relaxed">
                ✨ أي تعديل تحفظه هنا يحدّث فورياً عنوان الإدارة ورقم الهاتف في محفظة كل ساكن وتاجر بالحي.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      {/* Edit Admin Profile Modal */}
      <AdminProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />

      {/* Fixed Mobile Bottom Navigation Toolbar for Admin Portal (No Scrolling Needed) */}
      <nav
        aria-label="شريط أدوات الإدارة السريع"
        className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-amber-500/30 px-2 py-2 shadow-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 text-center">
          {/* 1. تزويد رصيد (شحن) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('charge');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'charge'
                ? 'text-emerald-300 font-black scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'charge'
                  ? 'bg-gradient-to-tr from-emerald-500/30 to-teal-400/20 border-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] text-emerald-300'
                  : 'bg-slate-900/70 border border-slate-800 text-slate-400'
              }`}
            >
              <PlusCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-1 font-bold">تزويد رصيد</span>
            {activeTab === 'charge' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5 animate-pulse"></span>
            )}
          </button>

          {/* 2. صرف كاش (سحب) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('withdraw');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'withdraw'
                ? 'text-amber-300 font-black scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'withdraw'
                  ? 'bg-gradient-to-tr from-amber-500/30 to-yellow-400/20 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] text-amber-300'
                  : 'bg-slate-900/70 border border-slate-800 text-slate-400'
              }`}
            >
              <ArrowDownToLine className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-1 font-bold">صرف كاش</span>
            {activeTab === 'withdraw' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5 animate-pulse"></span>
            )}
          </button>

          {/* 3. المشتركون */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('new_user');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer relative ${
              activeTab === 'new_user' || activeTab === 'lookup'
                ? 'text-cyan-300 font-black scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
                activeTab === 'new_user' || activeTab === 'lookup'
                  ? 'bg-gradient-to-tr from-cyan-500/30 to-blue-400/20 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] text-cyan-300'
                  : 'bg-slate-900/70 border border-slate-800 text-slate-400'
              }`}
            >
              <Users className="w-5 h-5 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black flex items-center justify-center font-num shadow">
                {totalRegisteredUsers}
              </span>
            </div>
            <span className="text-[10px] mt-1 font-bold">المشتركون</span>
            {(activeTab === 'new_user' || activeTab === 'lookup') && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-0.5 animate-pulse"></span>
            )}
          </button>

          {/* 4. التقارير */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('reports');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer relative ${
              activeTab === 'reports'
                ? 'text-indigo-300 font-black scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
                activeTab === 'reports'
                  ? 'bg-gradient-to-tr from-indigo-500/30 to-violet-400/20 border-2 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)] text-indigo-300'
                  : 'bg-slate-900/70 border border-slate-800 text-slate-400'
              }`}
            >
              <BarChart3 className="w-5 h-5 stroke-[2.2]" />
              {state.transactions.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-indigo-400 text-white text-[10px] font-black flex items-center justify-center font-num shadow">
                  {state.transactions.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-bold">التقارير</span>
            {activeTab === 'reports' && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-0.5 animate-pulse"></span>
            )}
          </button>

          {/* 5. المحفظة الشخصية */}
          <button
            type="button"
            onClick={() => setView('wallet')}
            className="flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer text-slate-400 hover:text-emerald-300 active:scale-95"
            title="الانتقال للمحفظة الشخصية"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900/70 border border-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300 transition-all">
              <Wallet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-1 font-bold">المحفظة</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
