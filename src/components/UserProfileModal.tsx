import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Smartphone,
  MapPin,
  Store,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';

const USER_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updateUserProfile } = useCommunityWallet();

  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [avatar, setAvatar] = useState(USER_AVATARS[0]);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync state when modal opens or currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setShopName(currentUser.shopName || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
      setPin(currentUser.pin || '');
      setAvatar(currentUser.avatar || USER_AVATARS[0]);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const isMerchant = currentUser.role === 'merchant';
  const isAdmin = currentUser.role === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسمك الكريم');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم الموبايل');
      return;
    }
    if (!pin.trim()) {
      setErrorMsg('يرجى تحديد كلمة المرور / رمز المرور');
      return;
    }

    const res = updateUserProfile({
      userId: currentUser.id,
      name: name.trim(),
      shopName: isMerchant || shopName.trim() ? shopName.trim() : undefined,
      phone: phone.trim(),
      address: address.trim(),
      pin: pin.trim(),
      avatar: avatar.trim(),
    });

    if (res.success) {
      confetti({ particleCount: 50, spread: 60 });
      setSuccessMsg('تم حفظ وتحديث بيانات حسابك بنجاح وحفظها سحابياً!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'فشل التحديث');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200 relative z-[100000]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isAdmin
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}>
              {isAdmin ? <Sparkles className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {isAdmin ? 'تعديل بيانات الإدارة' : 'تعديل بيانات حسابي الشخصي'}
              </h3>
              <p className="text-xs text-slate-400">
                حساب رقم: <span className="font-mono font-bold text-slate-200">{currentUser.accountNumber}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              اختر صورتك الرمزية:
            </label>
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt="User Avatar"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shrink-0 shadow-md"
              />
              <div className="flex gap-2 flex-wrap">
                {USER_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                      avatar === av ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={av} alt="avatar option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name & Shop Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                الاسم الشخصي *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أبو محمد"
                className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isMerchant ? 'اسم المحل / المتجر *' : 'اسم المتجر أو الكنية (اختياري)'}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={isMerchant ? 'مثال: سوبرماركت البركة' : 'اختياري'}
                className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Phone & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                رقم الموبايل *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full bg-slate-950 text-white text-xs font-num rounded-xl px-3 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left"
              />
              <p className="text-[10px] text-slate-500 mt-1">يستخدم لتسجيل الدخول والتحويلات</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                العنوان أو الموقع بالحي
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: شارع الروضة - جانب الصيدلية"
                className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* PIN / Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              كلمة المرور / الرمز السري *
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="رمز المرور لتسجيل الدخول"
                className="w-full bg-slate-950 text-white text-xs rounded-xl pr-3 pl-10 py-2.5 border border-slate-800 focus:border-emerald-500 outline-none text-left font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              يتم حفظ هذا الرمز بشكل دائم ولا يتغير تلقائياً
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer shadow-md ${
                isAdmin
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
