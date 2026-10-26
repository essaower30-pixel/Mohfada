import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Smartphone,
  Lock,
  Wallet,
  UserPlus,
  LogIn,
  Store,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  HelpCircle,
  MessageCircle,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';
import { formatPhoneForWhatsApp, WhatsAppActionButtons } from '../utils/whatsapp';

export interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
  initialTab?: 'login' | 'register';
}

export const normalizePhone = (input: string) => {
  return (input || '')
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9')
    .replace(/[\s\-\+]/g, '');
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  isStandalone = false,
  initialTab = 'register',
}) => {
  const { state, switchUser, registerNewUser } = useCommunityWallet();

  // Active Tab: Login vs Register
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Sync activeTab when initialTab or isOpen changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    setLoginError('');
    setRegError('');
    setRegSuccess('');
  }, [initialTab, isOpen]);

  // Ref for password input to auto-focus when phone number is retained
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  // Retain user's phone on logout / reload from localStorage or default to Abu Mohammed's phone
  const [loginIdentifier, setLoginIdentifier] = useState(() => {
    try {
      const saved = localStorage.getItem('pocket_cash_last_user_phone');
      if (saved) return saved;
    } catch (e) {}
    return '0982215383';
  });

  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Password attempts tracking (3 attempts limit)
  const [failedAttempts, setFailedAttempts] = useState(0);

  // WhatsApp recovery info
  const [whatsappSentInfo, setWhatsappSentInfo] = useState<{
    name: string;
    phone: string;
    message: string;
    pin: string;
  } | null>(null);

  // Register form state (Completely empty for fresh new user experience!)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'resident' | 'merchant'>('resident');
  const [regShopName, setRegShopName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Auto-identify recognized user from loginIdentifier or saved info
  const recognizedUser = useMemo(() => {
    const raw = (loginIdentifier || '').trim();
    if (!raw) return null;
    const clean = raw.toLowerCase();
    const cleanDigits = normalizePhone(clean);
    const cleanDigitsNoZero = cleanDigits.replace(/^0/, '');

    return (
      state.users.find((u) => {
        const uPhoneClean = normalizePhone(u.phone || '');
        const uPhoneNoZero = uPhoneClean.replace(/^0/, '');
        const isPhoneMatch =
          cleanDigits &&
          (uPhoneClean === cleanDigits ||
            (cleanDigitsNoZero && uPhoneNoZero === cleanDigitsNoZero) ||
            ((cleanDigits === '0982115383' || cleanDigits === '0982215383' || cleanDigitsNoZero === '982115383' || cleanDigitsNoZero === '982215383') &&
             (uPhoneClean === '0982115383' || uPhoneClean === '0982215383' || uPhoneNoZero === '982115383' || uPhoneNoZero === '982215383')));
        const isTextMatch =
          (u.username && u.username.toLowerCase() === clean) ||
          u.accountNumber.toLowerCase() === clean ||
          u.name.toLowerCase() === clean ||
          (clean.includes('محمد') && (u.name.includes('عوير') || u.name.includes('محمد'))) ||
          (clean.includes('عوير') && u.name.includes('عوير')) ||
          (u.shopName && u.shopName.toLowerCase().includes(clean));
        return isPhoneMatch || isTextMatch;
      }) || null
    );
  }, [loginIdentifier, state.users]);

  // Auto-focus password input when tab is login and identifier is already filled
  useEffect(() => {
    if (activeTab === 'login' && loginIdentifier && passwordInputRef.current) {
      const timer = setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isOpen]);

  const handleForgotPassword = () => {
    setLoginError('');
    const rawInput = loginIdentifier.trim();
    if (!rawInput) {
      setLoginError(
        'يرجى كتابة رقم الموبايل أو اسم المستخدم في الحقل أعلاه أولاً للتعرف على حسابك وإرسال كلمة السر إليه عبر الواتساب.'
      );
      return;
    }

    const clean = rawInput.toLowerCase();
    const cleanDigits = normalizePhone(clean);
    const cleanDigitsNoZero = cleanDigits.replace(/^0/, '');

    const matchingUsers = state.users.filter((u) => {
      const uPhoneClean = normalizePhone(u.phone || '');
      const uPhoneNoZero = uPhoneClean.replace(/^0/, '');

      const isPhoneMatch =
        cleanDigits &&
        (uPhoneClean === cleanDigits ||
          (cleanDigitsNoZero && uPhoneNoZero === cleanDigitsNoZero) ||
          // Match Abu Mohammed / Essa Ower phone variants (0982115383 / 0982215383)
          ((cleanDigits === '0982115383' || cleanDigits === '0982215383' || cleanDigitsNoZero === '982115383' || cleanDigitsNoZero === '982215383') &&
           (uPhoneClean === '0982115383' || uPhoneClean === '0982215383' || uPhoneNoZero === '982115383' || uPhoneNoZero === '982215383')));

      const isTextMatch =
        (u.username && u.username.toLowerCase() === clean) ||
        u.accountNumber.toLowerCase() === clean ||
        u.name.toLowerCase().includes(clean) ||
        (clean.includes('محمد') && (u.name.includes('عوير') || u.name.includes('محمد'))) ||
        (clean.includes('عوير') && u.name.includes('عوير')) ||
        (u.shopName && u.shopName.toLowerCase().includes(clean));

      return isPhoneMatch || isTextMatch;
    });

    if (matchingUsers.length === 0) {
      setLoginError(
        'لم يتم العثور على حساب مسجل برقم الموبايل أو اسم المستخدم هذا. يرجى التأكد من الرقم أو تسجيل حساب جديد.'
      );
      return;
    }

    // Pick real custom PIN (preferring any PIN that is not '1234' and not empty)
    const pin =
      matchingUsers.find((u) => u.pin && u.pin !== '1234')?.pin ||
      matchingUsers[0].pin ||
      '1234';

    const found = matchingUsers.find((u) => u.pin === pin) || matchingUsers[0];

    // Ensure the WhatsApp destination uses the active verified mobile (0982215383)
    let targetPhone = found.phone || '';
    const normTarget = normalizePhone(targetPhone);
    if (normTarget === '0982115383' || normTarget === '982115383' || normTarget === '0115982383' || normTarget === '115982383') {
      targetPhone = '0982215383';
    }

    const whatsappMsg =
      `*محفظة كاش الحي • بديل محفظة الجيب* 💳\n\n` +
      `مرحباً بك أخي/أختي: *${found.shopName || found.name}*\n` +
      `لقد تم طلب استعادة كلمة المرور لحسابك في *محفظة كاش الحي*.\n\n` +
      `🔑 *كلمة المرور / رمز الدخول الخاص بك:* \`${pin}\`\n` +
      `📋 *رقم الحساب:* ${found.accountNumber}\n` +
      `📱 *رقم الموبايل المسجل:* ${targetPhone}\n\n` +
      `⚠️ *تنبيه أمان:* يرجى الحفاظ على سرية كلمة المرور وعدم مشاركتها مع أي شخص لضمان أمان رصيدك المالي.\n` +
      `—\n` +
      `*إدارة محفظة كاش الحي*`;

    // Strictly protect credentials: do NOT show the password on the UI screen
    setWhatsappSentInfo({
      name: found.shopName || found.name,
      phone: targetPhone,
      message: whatsappMsg,
      pin: '', // Never display password in the web UI for account security
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (failedAttempts >= 3) {
      setLoginError(
        'تم استنفاد 3 محاولات خاطئة! تم قفل الدخول لحماية الحساب. اضغط على "هل نسيت كلمة السر؟" لاستلامها عبر الواتس اب.'
      );
      return;
    }

    const clean = loginIdentifier.trim().toLowerCase();
    if (!clean) {
      setLoginError('يرجى إدخال رقم الموبايل أو اسم المستخدم');
      return;
    }
    if (!loginPassword) {
      setLoginError('يرجى إدخال كلمة المرور');
      return;
    }

    const cleanDigits = normalizePhone(clean);
    const cleanDigitsNoZero = cleanDigits.replace(/^0/, '');

    // Match across all users with this phone, username, or account number
    const matchingUsers = state.users.filter((u) => {
      const uPhoneClean = normalizePhone(u.phone || '');
      const uPhoneNoZero = uPhoneClean.replace(/^0/, '');
      return (
        (u.username && u.username.toLowerCase() === clean) ||
        u.accountNumber.toLowerCase() === clean ||
        u.name.toLowerCase() === clean ||
        (clean.includes('محمد') && (u.name.includes('عوير') || u.name.includes('محمد'))) ||
        (clean.includes('عوير') && u.name.includes('عوير')) ||
        (cleanDigits && (
          uPhoneClean === cleanDigits ||
          (cleanDigitsNoZero && uPhoneNoZero === cleanDigitsNoZero) ||
          ((cleanDigits === '0982115383' || cleanDigits === '0982215383' || cleanDigitsNoZero === '982115383' || cleanDigitsNoZero === '982215383') &&
           (uPhoneClean === '0982115383' || uPhoneClean === '0982215383' || uPhoneNoZero === '982115383' || uPhoneNoZero === '982215383'))
        ))
      );
    });

    if (matchingUsers.length === 0) {
      setLoginError('الحساب غير مسجل. يرجى التأكد من البيانات أو تسجيل حساب جديد.');
      return;
    }

    // Match if password matches ANY account of this user
    const matchedUser = matchingUsers.find((u) => u.pin === loginPassword);
    if (!matchedUser) {
      // Check if user has no pin configured and entered 1234
      const emptyPinMatch = matchingUsers.find((u) => !u.pin && loginPassword === '1234');
      if (!emptyPinMatch) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        const remaining = 3 - newAttempts;
        if (remaining > 0) {
          setLoginError(
            `كلمة المرور غير صحيحة! متبقي لديك ${
              remaining === 1 ? 'محاولة واحدة فقط' : `${remaining} محاولات`
            }.`
          );
        } else {
          setLoginError(
            'تم استنفاد 3 محاولات خاطئة! تم قفل الدخول مؤقتاً لحماية الحساب. اضغط على "هل نسيت كلمة السر؟" لإرسال كلمة السر إلى الواتس اب باسم المحفظة.'
          );
        }
        return;
      }
    }

    const activeUser = matchedUser || matchingUsers[0];

    // Save user details so phone and name are remembered on logout
    if (activeUser && activeUser.phone) {
      try {
        localStorage.setItem('pocket_cash_last_user_phone', activeUser.phone);
        localStorage.setItem('pocket_cash_last_user_name', activeUser.shopName || activeUser.name);
        localStorage.setItem('pocket_cash_last_user_id', activeUser.id);
      } catch (e) {}
    }

    // Switch user and save session
    setFailedAttempts(0);
    setWhatsappSentInfo(null);
    switchUser(activeUser.id);
    confetti({ particleCount: 50, spread: 60 });
    if (onClose) onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const cleanPhone = regPhone.trim();
    if (!regName.trim()) {
      setRegError('يرجى إدخال الاسم والكنية');
      return;
    }
    if (!cleanPhone) {
      setRegError('يرجى إدخال رقم الموبايل');
      return;
    }
    if (!regPassword.trim()) {
      setRegError('يرجى تعيين كلمة مرور أو رمز PIN للحساب');
      return;
    }

    const cleanDigits = cleanPhone.replace(/[\s\-\+]/g, '');
    const cleanDigitsNoZero = cleanDigits.replace(/^0/, '');

    // Check if phone already registered
    const existing = state.users.find((u) => {
      const uPhoneClean = (u.phone || '').replace(/[\s\-\+]/g, '');
      const uPhoneNoZero = uPhoneClean.replace(/^0/, '');
      return cleanDigits && (uPhoneClean === cleanDigits || (cleanDigitsNoZero && uPhoneNoZero === cleanDigitsNoZero));
    });

    if (existing) {
      setRegError(
        `هذا الرقم مسجل مسبقاً باسم (${existing.shopName || existing.name})! تم تحويلك لشاشة الدخول، يمكنك تسجيل الدخول بكلمة المرور.`
      );
      setLoginIdentifier(cleanPhone);
      setActiveTab('login');
      return;
    }

    if (regRole === 'merchant' && !regShopName.trim()) {
      setRegError('يرجى كتابة اسم المتجر أو المحل التجاري');
      return;
    }

    const newUser = registerNewUser({
      name: regName.trim(),
      phone: cleanPhone,
      role: regRole,
      shopName: regRole === 'merchant' ? regShopName.trim() : undefined,
      initialCashPaid: 0,
      pin: regPassword.trim(),
    });

    // Save newly registered user to localStorage
    if (newUser && newUser.phone) {
      try {
        localStorage.setItem('pocket_cash_last_user_phone', newUser.phone);
        localStorage.setItem('pocket_cash_last_user_name', newUser.shopName || newUser.name);
        localStorage.setItem('pocket_cash_last_user_id', newUser.id);
      } catch (e) {}
    }

    setRegSuccess(`تم إنشاء الحساب بنجاح! رقم حسابك: ${newUser.accountNumber}`);
    confetti({ particleCount: 80, spread: 70 });

    setTimeout(() => {
      if (onClose) onClose();
    }, 600);
  };

  if (!isOpen) return null;

  const modalBody = (
    <div
      className={`w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative ${
        isStandalone ? 'mx-auto my-auto' : 'my-auto z-[100000]'
      }`}
    >
      {/* Modal Top Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-white">
              كاش الحي • محفظة الجيب
            </h3>
            <p className="text-xs text-slate-400">
              {isStandalone
                ? 'أنشئ حسابك الجديد أو سجّل دخولك للتداول المالي المباشر'
                : 'تسجيل الدخول أو الاشتراك لتبادل الكاش محلياً'}
            </p>
          </div>
        </div>

        {/* Close Button: ONLY visible when logged-in user is switching accounts */}
        {!isStandalone && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tab Switcher: Register vs Login */}
      <div className="p-4 sm:p-5 pb-0">
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border-2 border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setLoginError('');
              setRegError('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'register'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>تسجيل جديد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
              setRegError('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'login'
                ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول</span>
          </button>
        </div>
      </div>

        {/* Tab 1: Login Form */}
        {activeTab === 'login' ? (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Recognized User Welcome Card on Logout / Return */}
            {recognizedUser && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border-2 border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {recognizedUser.avatar ? (
                      <img
                        src={recognizedUser.avatar}
                        alt={recognizedUser.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md">
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-300 font-black text-lg">
                          {recognizedUser.name.slice(0, 1)}
                        </div>
                      </div>
                    )}
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -left-0.5 shadow-sm"></span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-emerald-400">مرحباً بك مجدداً:</span>
                      <h4 className="text-sm sm:text-base font-black text-white truncate">
                        {recognizedUser.shopName || recognizedUser.name}
                      </h4>
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-emerald-300 font-bold">{recognizedUser.phone}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 font-mono text-[10px]">{recognizedUser.accountNumber}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('');
                    setLoginPassword('');
                    setLoginError('');
                    try {
                      localStorage.removeItem('pocket_cash_last_user_phone');
                      localStorage.removeItem('pocket_cash_last_user_name');
                      localStorage.removeItem('pocket_cash_last_user_id');
                    } catch (e) {}
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-amber-300 px-2.5 py-1.5 rounded-xl hover:bg-slate-800 border border-slate-700/80 transition shrink-0 cursor-pointer"
                  title="الدخول برقم أو حساب آخر"
                >
                  تبديل الحساب
                </button>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Identifier Input Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-200">
                    رقم الموبايل أو اسم المستخدم *
                  </label>
                  {loginIdentifier && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('');
                        setLoginPassword('');
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      مسح وتغيير الرقم
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      setLoginError('');
                      if (failedAttempts > 0) {
                        setFailedAttempts(0);
                      }
                      if (whatsappSentInfo) {
                        setWhatsappSentInfo(null);
                      }
                    }}
                    placeholder="09xxxxxxxx أو اسم المستخدم"
                    className="w-full bg-slate-950 text-white placeholder-slate-400 text-sm sm:text-base font-bold rounded-2xl px-4 py-3 border-2 border-slate-600 focus:border-emerald-400 focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/20 outline-none transition shadow-inner pl-10"
                  />
                  <Smartphone className="w-5 h-5 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Password Input Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-200">
                    كلمة المرور / رمز الدخول {recognizedUser ? `لـ (${recognizedUser.shopName || recognizedUser.name})` : ''} *
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer flex items-center gap-1 group"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
                    <span className="underline underline-offset-4">هل نسيت كلمة السر؟</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={failedAttempts >= 3}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError('');
                    }}
                    placeholder="••••••••"
                    className={`w-full bg-slate-950 text-white placeholder-slate-400 text-sm sm:text-base font-bold rounded-2xl px-4 py-3 border-2 outline-none transition shadow-inner pl-10 ${
                      failedAttempts >= 3
                        ? 'border-rose-500/50 opacity-60 cursor-not-allowed'
                        : 'border-slate-600 focus:border-emerald-400 focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Subtext when user is recognized */}
                {recognizedUser && !loginError && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>تم حفظ رقمك واسمك بنجاح. اكتب كلمة المرور فقط للدخول السريع للمحفظة.</span>
                  </div>
                )}

                {/* Remaining Attempts Indicator */}
                {failedAttempts > 0 && failedAttempts < 3 && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] px-1 text-amber-300 font-bold animate-in fade-in">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>محاولات الدخول: {failedAttempts} من 3</span>
                    </span>
                    <span className="text-rose-400">
                      متبقي {3 - failedAttempts === 1 ? 'محاولة واحدة فقط' : `${3 - failedAttempts} محاولات`}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Box */}
              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border-2 border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-semibold">{loginError}</p>
                </div>
              )}

              {/* WhatsApp Recovery Confirmation Card */}
              {whatsappSentInfo && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/70 border-2 border-emerald-500/50 text-xs space-y-3 animate-in fade-in zoom-in-95 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-sm">
                      <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>إرسال كلمة السر عبر الواتس اب</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      باسم المحفظة
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">
                    تم تجهيز رسالة استعادة كلمة المرور رسمياً باسم <strong className="text-emerald-300">محفظة كاش الحي</strong> لحساب المشترك (<span className="text-white font-bold">{whatsappSentInfo.name}</span>) على الرقم (<span className="text-emerald-300 font-mono font-bold">{whatsappSentInfo.phone}</span>).
                  </p>

                  {/* Informative explanation note */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-[11px] text-slate-300 space-y-1">
                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                      <span>💡 تم تحديث الرابط المباشر لواتساب الأعمال:</span>
                    </div>
                    <p className="text-slate-300 leading-snug">
                      اضغط على <strong className="text-teal-300">واتساب للأعمال</strong> أدناه للفتح المباشر. كما يمكنك الضغط على <strong className="text-white">مراسلة نفسك</strong> أو إرسالها عبر <strong className="text-amber-300">رسالة SMS عادية</strong> مباشرة إلى هاتفك.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] text-slate-300 font-bold mb-1">
                      اختر الطريقة المناسبة لاستلام كلمة السر:
                    </p>
                    <WhatsAppActionButtons
                      phone={whatsappSentInfo.phone}
                      text={whatsappSentInfo.message}
                      regularLabel="واتساب العادي"
                      businessLabel="واتساب للأعمال"
                      size="md"
                      className="w-full"
                      showSelfChatOption={true}
                      showSmsOption={true}
                      showCopyButton={true}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800">
                    <span className="text-emerald-400/90 font-medium">الرمز آمن ومحمي داخل الرسالة الرسمية</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFailedAttempts(0);
                        setWhatsappSentInfo(null);
                        setLoginError('');
                      }}
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>إعادة المحاولة بعد استلام الرمز</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Login Button */}
              {failedAttempts >= 3 ? (
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="w-full py-3.5 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>إرسال كلمة السر إلى الواتس اب (باسم المحفظة)</span>
                  </button>
                  <p className="text-[11px] text-center text-amber-300/90 font-medium">
                    ⚠️ استنفدت 3 محاولات خاطئة. يرجى استلام كلمة السر عبر واتساب للمتابعة.
                  </p>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <LogIn className="w-5 h-5" />
                  <span>دخول للمحفظة</span>
                </button>
              )}
            </form>
          </div>
        ) : (
          /* Tab 2: Register New User Form */
          <div className="p-4 sm:p-5 space-y-4">
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Role Selector: Resident vs Merchant */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                  نوع الحساب في الحي *
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border-2 border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRegRole('resident')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      regRole === 'resident'
                        ? 'bg-slate-800 text-white border-2 border-emerald-500/60 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>مواطن / مقيم بالحي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('merchant')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      regRole === 'merchant'
                        ? 'bg-teal-500 text-slate-950 border-2 border-teal-400 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>متجر / بقالية / صيدلية</span>
                  </button>
                </div>
              </div>

              {/* Name Input Box */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                  الاسم الكامل (الاسم والكنية) *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    setRegError('');
                  }}
                  placeholder="مثال: يوسف الأحمد"
                  className="w-full bg-slate-950 text-white placeholder-slate-400 text-sm font-bold rounded-2xl px-4 py-3 border-2 border-slate-600 focus:border-emerald-400 focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/20 outline-none transition shadow-inner"
                />
              </div>

              {/* Shop Name Input if Merchant */}
              {regRole === 'merchant' && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                    اسم المتجر أو المحل بالحي *
                  </label>
                  <input
                    type="text"
                    required
                    value={regShopName}
                    onChange={(e) => {
                      setRegShopName(e.target.value);
                      setRegError('');
                    }}
                    placeholder="مثال: بقالية الياسمين، صيدلية النور..."
                    className="w-full bg-slate-950 text-white placeholder-slate-400 text-sm font-bold rounded-2xl px-4 py-3 border-2 border-teal-500 focus:border-teal-400 focus:bg-slate-900 focus:ring-4 focus:ring-teal-500/20 outline-none transition shadow-inner"
                  />
                </div>
              )}

              {/* Phone Input Box */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                  رقم الموبايل *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => {
                      setRegPhone(e.target.value);
                      setRegError('');
                    }}
                    placeholder="09xxxxxxxx"
                    className="w-full bg-slate-950 text-white placeholder-slate-400 font-num text-sm sm:text-base font-bold rounded-2xl px-4 py-3 border-2 border-slate-600 focus:border-emerald-400 focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/20 outline-none transition shadow-inner"
                  />
                  <Smartphone className="w-5 h-5 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Password / PIN Input Box */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                  تعيين كلمة المرور أو رمز الدخول *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="اكتب كلمة مرور قوية"
                    className="w-full bg-slate-950 text-white placeholder-slate-400 text-sm font-bold rounded-2xl px-4 py-3 border-2 border-slate-600 focus:border-emerald-400 focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/20 outline-none transition shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {regError && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border-2 border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 shadow-lg shadow-teal-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>إنشاء الحساب ودخول المحفظة فوراً</span>
              </button>
            </form>
          </div>
        )}
    </div>
  );

  if (isStandalone) {
    return (
      <div className="w-full py-4 sm:py-8 px-2 sm:px-4 flex flex-col items-center justify-center">
        {modalBody}
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      {modalBody}
    </div>,
    document.body
  );
};
