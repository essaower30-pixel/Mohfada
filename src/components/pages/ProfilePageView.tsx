import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Smartphone,
  MapPin,
  Store,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Save,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../../services/walletState';

const USER_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

interface ProfilePageViewProps {
  onBackToHome: () => void;
}

export const ProfilePageView: React.FC<ProfilePageViewProps> = ({ onBackToHome }) => {
  const { currentUser, adminUser, updateUserProfile } = useCommunityWallet();

  const isAdmin = currentUser?.role === 'admin';
  const targetUser = isAdmin ? adminUser : currentUser;

  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [avatar, setAvatar] = useState(USER_AVATARS[0]);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (targetUser) {
      setName(targetUser.name || '');
      setShopName(targetUser.shopName || '');
      setPhone(targetUser.phone || '');
      setUsername(targetUser.username || '');
      setAddress(targetUser.address || '');
      setPin(targetUser.pin || '');
      setAvatar(targetUser.avatar || USER_AVATARS[0]);
    }
  }, [targetUser]);

  if (!currentUser || !targetUser) return null;

  const isMerchant = currentUser.role === 'merchant';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('يرجى إدخال الاسم');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم الموبايل');
      return;
    }
    if (!pin.trim()) {
      setErrorMsg('يرجى إدخال كلمة المرور / رمز الدخول');
      return;
    }

    const res = updateUserProfile({
      userId: targetUser.id,
      name: name.trim(),
      shopName: isMerchant || shopName.trim() ? shopName.trim() : undefined,
      phone: phone.trim(),
      username: username.trim() || undefined,
      address: address.trim(),
      pin: pin.trim(),
      avatar: avatar.trim(),
    });

    if (res.success) {
      confetti({ particleCount: 50, spread: 60 });
      setSuccessMsg('تم حفظ وتحديث البيانات بنجاح في قاعدة البيانات السحابية!');
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } else {
      setErrorMsg(res.error || 'فشل التحديث');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-md ${
              isAdmin
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}
          >
            {isAdmin ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {isAdmin ? 'صفحة تعديل بيانات الإدارة وأمين الصندوق' : 'صفحة تعديل بيانات الحساب الشخصي'}
            </h2>
            <p className="text-xs text-slate-400">
              رقم الحساب: <span className="font-mono font-bold text-slate-200">{targetUser.accountNumber}</span>
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

      {/* Main Profile Form */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              الصورة الرمزية للحساب:
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <img
                src={avatar}
                alt="Avatar"
                className={`w-16 h-16 rounded-2xl object-cover border-2 shrink-0 shadow-lg ${
                  isAdmin ? 'border-amber-400' : 'border-emerald-400'
                }`}
              />
              <div className="flex gap-2 flex-wrap">
                {USER_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                      avatar === av
                        ? isAdmin
                          ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/30'
                          : 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/30'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={av} alt="option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name & Shop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAdmin ? 'اسم أمين الصندوق / المعتمد *' : 'الاسم الشخصي *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل الاسم"
                className="w-full bg-slate-950 text-white text-sm rounded-xl px-3.5 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAdmin
                  ? 'اسم مركز / نقطة الكاش بالحي *'
                  : isMerchant
                  ? 'اسم المتجر / المحل *'
                  : 'اسم المتجر أو الكنية (اختياري)'}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={isAdmin ? 'مركز إدارة كاش الحي' : 'سوبرماركت / بقالية...'}
                className="w-full bg-slate-950 text-white text-sm rounded-xl px-3.5 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Phone & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رقم الموبايل المسجل *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full bg-slate-950 text-white text-sm font-num rounded-xl px-3.5 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAdmin ? 'اسم المستخدم للدخول للإدارة *' : 'اسم المستخدم (اختياري)'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isAdmin ? 'admin' : 'اسم مستخدم بالإنجليزية'}
                className="w-full bg-slate-950 text-white text-sm rounded-xl px-3.5 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              العنوان / الموقع داخل الحي *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: جانب جامع التقوى - شارع السوق"
              className="w-full bg-slate-950 text-white text-sm rounded-xl px-3.5 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* PIN / Password */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              كلمة المرور / الرمز السري للدخول *
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="رمز الدخول السري"
                className="w-full bg-slate-950 text-white text-sm rounded-xl pr-3.5 pl-11 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              يتم حفظ هذا الرمز بشكل دائم ولا يتغير تلقائياً
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
                isAdmin
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتحديث البيانات فوراً</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
