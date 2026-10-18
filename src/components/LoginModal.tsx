import React, { useState } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { state, switchUser, registerNewUser } = useCommunityWallet();

  // Active Tab: Login vs Register
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const clean = loginIdentifier.trim().toLowerCase();
    if (!clean) {
      setLoginError('يرجى إدخال رقم الموبايل أو اسم المستخدم');
      return;
    }
    if (!loginPassword) {
      setLoginError('يرجى إدخال كلمة المرور');
      return;
    }

    // Match by username (e.g. admin), phone, or account number
    const found = state.users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === clean) ||
        u.phone === loginIdentifier.trim() ||
        u.phone.replace(/\s+/g, '') === loginIdentifier.trim().replace(/\s+/g, '') ||
        u.accountNumber.toLowerCase() === clean
    );

    if (!found) {
      setLoginError('الحساب غير مسجل. يرجى التأكد من البيانات أو تسجيل حساب جديد.');
      return;
    }

    if (found.pin && found.pin !== loginPassword) {
      setLoginError('كلمة المرور غير صحيحة. يرجى المحاولة مجدداً.');
      return;
    }

    // Switch user and save session
    switchUser(found.id);
    confetti({ particleCount: 50, spread: 60 });
    onClose();
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

    // Check if phone already registered
    const existing = state.users.find(
      (u) =>
        u.phone === cleanPhone ||
        u.phone.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, '')
    );
    if (existing) {
      setRegError('هذا الرقم مسجل مسبقاً! يمكنك تسجيل الدخول به مباشرة.');
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
      onClose();
    }, 800);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 relative z-[100000]">
        
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
                تسجيل الدخول أو الاشتراك لتبادل الكاش محلياً
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="p-4 sm:p-5 pb-0">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border-2 border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
                setRegError('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setLoginError('');
                setRegError('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>تسجيل مستخدم جديد</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Login Form */}
        {activeTab === 'login' ? (
          <div className="p-4 sm:p-5 space-y-4">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Identifier Input Box */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                  رقم الموبايل أو اسم المستخدم *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      setLoginError('');
                    }}
                    placeholder="09xxxxxxxx أو اسم المستخدم"
                    className="w-full bg-slate-950 text-white placeholder-slate-400 text-sm sm:text-base font-bold rounded-2xl px-4 py-3 border-2 border-slate-600 focus:border-emerald-400 focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/20 outline-none transition shadow-inner"
                  />
                  <Smartphone className="w-5 h-5 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Password Input Box */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                  كلمة المرور / رمز الدخول *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError('');
                    }}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 text-white placeholder-slate-400 text-sm sm:text-base font-bold rounded-2xl px-4 py-3 border-2 border-slate-600 focus:border-emerald-400 focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/20 outline-none transition shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Box */}
              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border-2 border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-semibold">{loginError}</p>
                </div>
              )}

              {/* Submit Login Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <LogIn className="w-5 h-5" />
                <span>دخول للمحفظة</span>
              </button>
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
    </div>,
    document.body
  );
};
