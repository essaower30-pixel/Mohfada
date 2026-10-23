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
  Smartphone,
  Phone,
  ArrowRight,
  MapPin,
  User,
  Users,
  BarChart3,
  Percent,
  Activity,
  Printer,
  FileText,
  ArrowUpRight,
  Clock,
  Filter,
  Cloud,
  QrCode,
  Copy,
  Check,
  Share2,
  KeyRound,
  Shield,
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';
import { CommunityUser } from '../types/wallet';
import { ChangePasswordModal } from './ChangePasswordModal';
import { AdminProfileModal } from './AdminProfileModal';

import { BottomNavTab } from './BottomNav';

interface AdminPortalProps {
  onOpenEditProfile?: () => void;
  onNavigateTab?: (tab: BottomNavTab) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onOpenEditProfile,
  onNavigateTab,
}) => {
  const {
    state,
    adminUser,
    adminChargeUserCash,
    adminWithdrawUserCash,
    registerNewUser,
    setTransferFeeRate,
    setView,
  } = useCommunityWallet();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'charge' | 'withdraw' | 'new_user' | 'lookup' | 'reports' | 'install_qr'>('charge');

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
      .then((url) => setInstallQrUrl(url))
      .catch((err) => console.error(err));
  }, [appInstallUrl]);

  const handleCopyInstallLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(appInstallUrl);
      setCopiedInstallLink(true);
      setTimeout(() => setCopiedInstallLink(false), 2000);
    }
  };

  // Phone normalization & lookup
  const normalizePhone = (p: string) => p.replace(/[\s\-\+]/g, '').replace(/^0/, '');

  const findSubscriberByPhone = (phoneInput: string): CommunityUser | undefined => {
    const clean = normalizePhone(phoneInput);
    if (!clean || clean.length < 3) return undefined;
    return state.users.find((u) => {
      if (u.role === 'admin') return false;
      const userClean = normalizePhone(u.phone);
      if (userClean === clean) return true;
      if (u.accountNumber.toLowerCase() === phoneInput.trim().toLowerCase()) return true;
      return false;
    });
  };

  // Charge state
  const [chargePhone, setChargePhone] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeNote, setChargeNote] = useState('شحن وتزويد رصيد مقابل استلام كاش يداً بيد');
  const [chargeSuccess, setChargeSuccess] = useState('');
  const [chargeError, setChargeError] = useState('');

  // Withdraw state
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
  const [newPin, setNewPin] = useState('1234');
  const [newSuccess, setNewSuccess] = useState('');
  const [newError, setNewError] = useState('');

  // Lookup state
  const [lookupPhone, setLookupPhone] = useState('');

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
      setChargeError('يرجى إدخال مبلغ صحيح أكبر من صفر');
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
        `تم شحن رصيد بقيمة ${amt.toLocaleString()} ل.س لحساب (${targetChargeUser.shopName || targetChargeUser.name}) بنجاح! رقم الإيصال: ${res.tx.receiptCode}`
      );
      setChargeAmount('');
    } else {
      setChargeError(res.error || 'فشلت عملية الشحن');
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
      setWithdrawError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    const res = adminWithdrawUserCash({
      userId: targetWithdrawUser.id,
      amount: amt,
      note: withdrawNote,
    });

    if (res.success && res.tx) {
      confetti({ particleCount: 70, spread: 60 });
      setWithdrawSuccess(
        `تم صرف مبلغ ${amt.toLocaleString()} ل.س كاش للمشترك (${targetWithdrawUser.shopName || targetWithdrawUser.name}) وخصمها من رصيده! رقم الإيصال: ${res.tx.receiptCode}`
      );
      setWithdrawAmount('');
    } else {
      setWithdrawError(res.error || 'فشلت عملية الصرف');
    }
  };

  const handleNewUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewError('');
    setNewSuccess('');

    if (!newName.trim()) {
      setNewError('يرجى إدخال اسم المشترك');
      return;
    }
    if (!newPhone.trim() || newPhone.trim() === '09') {
      setNewError('يرجى إدخال رقم الموبايل');
      return;
    }

    const initialAmt = parseFloat(newInitialCash) || 0;
    const user = registerNewUser({
      name: newName.trim(),
      phone: newPhone.trim(),
      role: newRole,
      shopName: newRole === 'merchant' ? newShopName.trim() : undefined,
      initialCashPaid: initialAmt,
      pin: newPin.trim() || '1234',
    });

    confetti({ particleCount: 80, spread: 70 });
    setNewSuccess(
      `تم تسجيل المشترك (${user.shopName || user.name}) بنجاح! رقم الحساب المالي: ${user.accountNumber}`
    );
    setNewName('');
    setNewPhone('09');
    setNewShopName('');
    setNewInitialCash('100000');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-5 pb-20 sm:pb-8">
      {/* Top Admin Summary Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  لوحة المعتمد وأمين الصندوق
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold">
                  {adminUser.accountNumber}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {adminUser.shopName || adminUser.name}
              </h2>
              <p className="text-xs text-slate-400">{adminUser.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => (onOpenEditProfile ? onOpenEditProfile() : setShowEditProfile(true))}
              className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>تعديل بيانات الإدارة</span>
            </button>
            <button
              onClick={() => setView('wallet')}
              className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition cursor-pointer shadow-md"
            >
              عرض محفظتي الشخصية
            </button>
          </div>
        </div>

        {/* Vault Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <p className="text-[11px] text-slate-400 font-bold">كاش بالدرج الفعلي (مقبوض):</p>
            <p className="text-xl sm:text-2xl font-black font-num text-emerald-400 mt-1">
              {state.adminVault.cashInDrawer.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">ل.س</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <p className="text-[11px] text-slate-400 font-bold">رصيد الخزينة الرقمية المتبقي:</p>
            <p className="text-xl sm:text-2xl font-black font-num text-cyan-400 mt-1">
              {state.adminVault.digitalVaultBalance.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">ل.س</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <p className="text-[11px] text-slate-400 font-bold">كاش تم صرفه للزبائن:</p>
            <p className="text-xl sm:text-2xl font-black font-num text-amber-400 mt-1">
              {state.adminVault.cashPaidOut.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">ل.س</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <p className="text-[11px] text-slate-400 font-bold">أرباح العمولات المجمعة (1%):</p>
            <p className="text-xl sm:text-2xl font-black font-num text-teal-400 mt-1">
              {(state.adminVault.totalAdminFeesCollected || 0).toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">ل.س</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setActiveTab('charge')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'charge'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>تزويد وشحن رصيد (قبض كاش)</span>
        </button>

        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'withdraw'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>صرف كاش ورقي (تسليم مبالغ)</span>
        </button>

        <button
          onClick={() => setActiveTab('new_user')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'new_user'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>تسجيل مشترك جديد</span>
        </button>

        <button
          onClick={() => setActiveTab('lookup')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'lookup'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>استعلام عن مشترك</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>التقارير وسجل الصندوق</span>
        </button>

        <button
          onClick={() => setActiveTab('install_qr')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'install_qr'
              ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>باركود نشر التطبيق</span>
        </button>
      </div>

      {/* ================= TAB 1: CHARGE BALANCE ================= */}
      {activeTab === 'charge' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base text-white">تزويد وشحن رصيد لمشترك (استلام كاش يداً بيد)</h3>
              <p className="text-xs text-slate-400">
                أدخل رقم موبايل الزبون، استلم المبلغ كاش وأودعه بالدرج، ثم اضغط شحن الرصيد
              </p>
            </div>
          </div>

          <form onSubmit={handleChargeSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                رقم موبايل المشترك المراد شحنه *
              </label>
              <input
                type="tel"
                required
                value={chargePhone}
                onChange={(e) => setChargePhone(e.target.value)}
                placeholder="أدخل رقم الموبايل (مثال: 0982115383)"
                className="w-full bg-slate-950 text-white font-bold text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left"
              />

              {targetChargeUser && (
                <div className="mt-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <img
                    src={targetChargeUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-bold text-emerald-300 text-sm">{targetChargeUser.shopName || targetChargeUser.name}</p>
                    <p className="text-xs text-slate-400 font-num">
                      الرصيد الحالي: <span className="text-white font-bold">{targetChargeUser.balance.toLocaleString()} ل.س</span> • الحساب: {targetChargeUser.accountNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                المبلغ المقبوض كاش للشحن (ل.س) *
              </label>
              <input
                type="number"
                required
                min="500"
                step="500"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                placeholder="المبلغ بالليرة السورية"
                className="w-full bg-slate-950 text-white font-num font-black text-sm rounded-xl px-3 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[25000, 50000, 100000, 200000, 500000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setChargeAmount(String(amt))}
                  className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-num text-xs font-bold transition cursor-pointer"
                >
                  +{amt.toLocaleString()}
                </button>
              ))}
            </div>

            {chargeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{chargeError}</span>
              </div>
            )}

            {chargeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{chargeSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              تأكيد استلام الكاش وإيداع الرصيد للمشترك
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 2: WITHDRAW CASH ================= */}
      {activeTab === 'withdraw' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ArrowDownToLine className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base text-white">صرف رصيد وتبديله إلى كاش ورقي (تسليم مبالغ نقدية)</h3>
              <p className="text-xs text-slate-400">
                يتم خصم الرصيد من محفظة المشترك وتسليمه المبالغ الورقية من درج الصندوق
              </p>
            </div>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                رقم موبايل المشترك الراغب بالصرف *
              </label>
              <input
                type="tel"
                required
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
                placeholder="أدخل رقم الموبايل (مثال: 0982115383)"
                className="w-full bg-slate-950 text-white font-bold text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-amber-500 outline-none text-left"
              />

              {targetWithdrawUser && (
                <div className="mt-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                  <img
                    src={targetWithdrawUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-bold text-amber-300 text-sm">{targetWithdrawUser.shopName || targetWithdrawUser.name}</p>
                    <p className="text-xs text-slate-400 font-num">
                      الرصيد المتاح للصرف: <span className="text-white font-bold">{targetWithdrawUser.balance.toLocaleString()} ل.س</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                المبلغ المراد صرفه كاش للمشترك (ل.س) *
              </label>
              <input
                type="number"
                required
                min="500"
                step="500"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="المبلغ بالليرة السورية"
                className="w-full bg-slate-950 text-white font-num font-black text-sm rounded-xl px-3 py-2.5 border border-slate-800 focus:border-amber-500 outline-none text-left"
              />
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
            >
              خصم الرصيد وتسليم الكاش الورقي للزبون
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 3: REGISTER NEW USER ================= */}
      {activeTab === 'new_user' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-base text-white">تسجيل مشترك جديد بالحي من مكتب الإدارة</h3>
              <p className="text-xs text-slate-400">
                فتح محفظة جديدة لمواطن أو متجر مع إمكانية قبض رصيد افتتاحي كاش فوراً
              </p>
            </div>
          </div>

          <form onSubmit={handleNewUserSubmit} className="space-y-3.5 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: أحمد عبد الله"
                className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الموبايل *</label>
              <input
                type="tel"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full bg-slate-950 text-white font-num font-bold text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-cyan-500 outline-none text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع المشترك *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewRole('resident')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    newRole === 'resident'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  مواطن بالحي
                </button>
                <button
                  type="button"
                  onClick={() => setNewRole('merchant')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    newRole === 'merchant'
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  متجر / بقالية معتمدة
                </button>
              </div>
            </div>

            {newRole === 'merchant' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المتجر التجاري *</label>
                <input
                  type="text"
                  required
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="مثال: بقالية البركة"
                  className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-cyan-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                المبلغ المقبوض كاش كرصيد افتتاحي (ل.س)
              </label>
              <input
                type="number"
                step="5000"
                value={newInitialCash}
                onChange={(e) => setNewInitialCash(e.target.value)}
                className="w-full bg-slate-950 text-white font-num font-bold text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-cyan-500 outline-none text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                كلمة المرور الابتدائية
              </label>
              <input
                type="text"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-cyan-500 outline-none text-left"
              />
            </div>

            {newError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {newError}
              </div>
            )}

            {newSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {newSuccess}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              تسجيل المشترك وقبض الكاش
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 4: LOOKUP SUBSCRIBER ================= */}
      {activeTab === 'lookup' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Search className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base text-white">الاستعلام المباشر عن حساب مشترك</h3>
              <p className="text-xs text-slate-400">
                أدخل رقم موبايل أو حساب أي مشترك للاطلاع على رصيده الحالي
              </p>
            </div>
          </div>

          <div className="max-w-md space-y-3">
            <input
              type="tel"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
              placeholder="أدخل رقم الموبايل (مثال: 0982115383)"
              className="w-full bg-slate-950 text-white font-bold text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-indigo-500 outline-none text-left"
            />

            {targetLookupUser ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <img
                    src={targetLookupUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-black text-sm text-white">
                      {targetLookupUser.shopName || targetLookupUser.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-num">
                      {targetLookupUser.accountNumber} • {targetLookupUser.phone}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400">الرصيد المالي الحالي: </span>
                  <span className="font-black font-num text-emerald-400 text-base">
                    {targetLookupUser.balance.toLocaleString()} ل.س
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setChargePhone(targetLookupUser.phone);
                      setActiveTab('charge');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    شحن رصيد
                  </button>
                  <button
                    onClick={() => {
                      setWithdrawPhone(targetLookupUser.phone);
                      setActiveTab('withdraw');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    صرف كاش
                  </button>
                </div>
              </div>
            ) : lookupPhone.trim().length >= 3 ? (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-950 rounded-xl">
                لم يتم العثور على مشترك يطابق هذا الرقم.
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ================= TAB 5: REPORTS & TRANSACTIONS ================= */}
      {activeTab === 'reports' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-bold text-base text-white">سجل العمليات الكامل لحركات الصندوق</h3>
                <p className="text-xs text-slate-400">إجمالي الحركات والتحويلات المنجزة على الشبكة</p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة كشف الحساب</span>
            </button>
          </div>

          <div className="space-y-2">
            {state.transactions.slice(0, 25).map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-white">
                    {tx.senderName} ➔ {tx.recipientName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {tx.note} • {new Date(tx.timestamp).toLocaleString('ar-SY')}
                  </p>
                </div>
                <div className="text-left font-num font-bold text-slate-100">
                  {tx.amount.toLocaleString()} ل.س
                  <span className="block text-[10px] text-teal-400 font-mono">{tx.receiptCode}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 6: APP INSTALL QR ================= */}
      {activeTab === 'install_qr' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-2xl flex items-center justify-center mx-auto">
            <QrCode className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-black text-white">باركود نشر وتثبيت محفظة كاش الحي</h3>
            <p className="text-xs text-slate-400 mt-1">
              يمكنك طباعة هذا الباركود وتعليقه في البقاليات ومكتب الصندوق ليقوم أهالي الحي بمسحه وفتح المحفظة
            </p>
          </div>

          <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl border-4 border-slate-800">
            {installQrUrl ? (
              <img src={installQrUrl} alt="App QR" className="w-56 h-56 object-contain" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                جاري التوليد...
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleCopyInstallLink}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {copiedInstallLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>تم نسخ الرابط!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-teal-400" />
                  <span>نسخ رابط الموقع العام</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showChangePassword && (
        <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
      )}

      {showEditProfile && (
        <AdminProfileModal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
};
