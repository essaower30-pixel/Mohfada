import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Wallet,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  User,
  Store,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
  initialTab?: 'login' | 'register';
}

function formatPhoneForWhatsApp(phone: string): string {
  let clean = phone.replace(/[\s\-\+]/g, '');
  if (clean.startsWith('09')) {
    clean = '963' + clean.slice(1);
  } else if (clean.startsWith('9') && clean.length === 9) {
    clean = '963' + clean;
  }
  return clean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  isStandalone = false,
  initialTab = 'register',
}) => {
  const { state, switchUser, registerNewUser } = useCommunityWallet();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    setLoginError('');
    setRegError('');
    setRegSuccess('');
  }, [initialTab, isOpen]);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  // WhatsApp recovery info
  const [whatsappSentInfo, setWhatsappSentInfo] = useState<{
    name: string;
    phone: string;
    message: string;
    pin: string;
  } | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'resident' | 'merchant'>('resident');
  const [regShopName, setRegShopName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  if (!isOpen) return null;

  const handleForgotPassword = () => {
    setLoginError('');
    const clean = loginIdentifier.trim().toLowerCase();
    if (!clean) {
      setLoginError(
        'يرجى كتابة رقم الموبايل أو اسم المستخدم في الحقل أعلاه أولاً للتعرف على حسابك وإرسال كلمة السر إليه.'
      );
      return;
    }

    const cleanDigits = clean.replace(/[\s\-\+]/g, '');
    const cleanDigitsNoZero = cleanDigits.replace(/^0/, '');

    const matchingUsers = state.users.filter((u) => {
      const uPhoneClean = (u.phone || '').replace(/[\s\-\+]/g, '');
      const uPhoneNoZero = uPhoneClean.replace(/^0/, '');
      return (
        (u.username && u.username.toLowerCase() === clean) ||
        u.accountNumber.toLowerCase() === clean ||
        (cleanDigits && (uPhoneClean === cleanDigits || (cleanDigitsNoZero && uPhoneNoZero === cleanDigitsNoZero)))
      );
    });

    if (matchingUsers.length === 0) {
      setLoginError(
        'لم يتم العثور على حساب مسجل برقم الموبايل أو اسم المستخدم هذا. يرجى التأكد من الرقم أو تسجيل حساب جديد.'
      );
      return;
    }

    const pin =
      matchingUsers.find((u) => u.pin && u.pin !== '1234')?.pin ||
      matchingUsers[0].pin ||
      '1234';

    const found = matchingUsers.find((u) => u.pin === pin) || matchingUsers[0];
    const cleanPhone = formatPhoneForWhatsApp(found.phone);

    const whatsappMsg =
      `*محفظة كاش الحي • بديل محفظة الجيب* 💳\n\n` +
      `مرحباً بك أخي/أختي: *${found.shopName || found.name}*\n` +
      `لقد تم طلب استعادة كلمة المرور لحسابك في *محفظة كاش الحي*.\n\n` +
      `🔑 *كلمة المرور / رمز الدخول الخاص بك:* \`${pin}\`\n` +
      `📋 *رقم الحساب:* ${found.accountNumber}\n` +
      `📱 *رقم الموبايل المسجل:* ${found.phone}\n\n` +
      `⚠️ *تنبيه أمان:* يرجى الحفاظ على سرية كلمة المرور وعدم مشاركتها مع أي شخص لضمان أمان رصيدك المالي.\n` +
      `—\n` +
      `*إدارة محفظة كاش الحي*`;

    setWhatsappSentInfo({
      name: found.shopName || found.name,
      phone: found.phone,
      message: whatsappMsg,
      pin: pin,
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

    const cleanDigits = clean.replace(/[\s\-\+]/g, '');
    const cleanDigitsNoZero = cleanDigits.replace(/^0/, '');

    const matchingUsers = state.users.filter((u) => {
      const uPhoneClean = (u.phone || '').replace(/[\s\-\+]/g, '');
      const uPhoneNoZero = uPhoneClean.replace(/^0/, '');
      return (
        (u.username && u.username.toLowerCase() === clean) ||
        u.accountNumber.toLowerCase() === clean ||
        (cleanDigits && (uPhoneClean === cleanDigits || (cleanDigitsNoZero && uPhoneNoZero === cleanDigitsNoZero)))
      );
    });

    if (matchingUsers.length === 0) {
      setLoginError('الحساب غير مسجل. يرجى التأكد من البيانات أو تسجيل حساب جديد.');
      return;
    }

    const matchedUser = matchingUsers.find((u) => u.pin === loginPassword);
    if (!matchedUser) {
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

    setRegSuccess(`تم إنشاء الحساب بنجاح! رقم حسابك: ${newUser.accountNumber}`);
    confetti({ particleCount: 80, spread: 70 });

    setTimeout(() => {
      if (onClose) onClose();
    }, 600);
  };

  const modalBody = (
    <div
      className={`w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative ${
        isStandalone ? 'mx-auto my-auto' : 'my-auto z-[100000]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-white">كاش الحي • محفظة الجيب</h3>
            <p className="text-xs text-slate-400">
              {isStandalone
                ? 'أنشئ حسابك الجديد أو سجّل دخولك للتداول المالي المباشر'
                : 'تسجيل الدخول أو الاشتراك لتبادل الكاش محلياً'}
            </p>
          </div>
        </div>

        {!isStandalone && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('register');
            setLoginError('');
            setRegError('');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'register'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>اشتراك جديد (مواطن / متجر)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('login');
            setLoginError('');
            setRegError('');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'login'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>تسجيل الدخول</span>
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* ================= REGISTER TAB ================= */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                الاسم والكنية *
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="مثال: محمد سعيد أو أم محمد"
                className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                رقم الموبايل * (المستخدم للدخول والدفع)
              </label>
              <input
                type="tel"
                required
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full bg-slate-950 text-white font-num text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left font-bold"
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الحساب *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('resident')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    regRole === 'resident'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>مواطن / زبون</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('merchant')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    regRole === 'merchant'
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>متجر / بقالية / صيدلية</span>
                </button>
              </div>
            </div>

            {regRole === 'merchant' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم المتجر أو المحل التجاري *
                </label>
                <input
                  type="text"
                  required
                  value={regShopName}
                  onChange={(e) => setRegShopName(e.target.value)}
                  placeholder="مثال: بقالية البركة، صيدلية الشفاء..."
                  className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                تعيين كلمة مرور أو رمز PIN للحساب *
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="اختر كلمة مرور أو رمز سري للحساب"
                  className="w-full bg-slate-950 text-white text-xs rounded-xl pr-3 pl-10 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute left-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-black text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>إنشاء الحساب وبدء الاستخدام فوراً</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </form>
        )}

        {/* ================= LOGIN TAB ================= */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                رقم الموبايل أو اسم المستخدم *
              </label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="أدخل رقم الموبايل أو اسم المستخدم"
                className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">كلمة المرور *</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-teal-400 hover:text-teal-300 hover:underline cursor-pointer"
                >
                  هل نسيت كلمة السر؟
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full bg-slate-950 text-white text-xs rounded-xl pr-3 pl-10 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {whatsappSentInfo && (
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-teal-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>تم تجهيز رسالة استعادة كلمة المرور لحساب ({whatsappSentInfo.name})</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  كلمة المرور الخاصة بك هي: <code className="bg-slate-900 px-2 py-0.5 rounded text-teal-400 font-bold">{whatsappSentInfo.pin}</code>
                </p>
                <a
                  href={`https://wa.me/${formatPhoneForWhatsApp(whatsappSentInfo.phone)}?text=${encodeURIComponent(whatsappSentInfo.message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>فتح الواتساب واستلام كلمة السر</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>تسجيل الدخول للمحفظة</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </form>
        )}
      </div>
    </div>
  );

  if (isStandalone) {
    return <div className="min-h-screen flex items-center justify-center p-4">{modalBody}</div>;
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      {modalBody}
    </div>,
    document.body
  );
};
