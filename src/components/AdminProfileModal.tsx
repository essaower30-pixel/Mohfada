import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Shield,
  Smartphone,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { adminUser, updateUserProfile } = useCommunityWallet();

  const [name, setName] = useState(adminUser.name || '');
  const [shopName, setShopName] = useState(adminUser.shopName || '');
  const [phone, setPhone] = useState(adminUser.phone || '');
  const [username, setUsername] = useState(adminUser.username || 'admin');
  const [address, setAddress] = useState(
    adminUser.address || 'ساحة الحي الرئيسية - جانب جامع التقوى (مكتب إدارة كاش الحي)'
  );
  const [pin, setPin] = useState(adminUser.pin || 'admin');
  const [showPin, setShowPin] = useState(false);
  const [avatar, setAvatar] = useState(adminUser.avatar || DEFAULT_AVATARS[0]);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم المعتمد أو أمين الصندوق');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم الموبايل');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('يرجى إدخال اسم المستخدم للدخول');
      return;
    }
    if (!pin.trim()) {
      setErrorMsg('يرجى تحديد كلمة المرور');
      return;
    }

    const res = updateUserProfile({
      userId: adminUser.id,
      name: name.trim(),
      shopName: shopName.trim(),
      phone: phone.trim(),
      username: username.trim(),
      address: address.trim(),
      pin: pin.trim(),
      avatar: avatar.trim(),
    });

    if (res.success) {
      confetti({ particleCount: 50, spread: 60 });
      setSuccessMsg('تم حفظ وتحديث بيانات الإدارة بنجاح!');
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
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">الملف التعريفي لإدارة الصندوق</h3>
              <p className="text-xs text-slate-400">تعديل بيانات أمين الصندوق والمعتمد بالحي</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Avatar selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              الصورة الرمزية للإدارة
            </label>
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt="Admin Avatar"
                className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500 shrink-0 shadow-md"
              />
              <div className="flex gap-2">
                {DEFAULT_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                      avatar === av ? 'border-amber-400 scale-105' : 'border-slate-800 opacity-60'
                    }`}
                  >
                    <img src={av} alt="avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                اسم أمين الصندوق / المعتمد *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2 border border-slate-800 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                اسم نقطة الكاش / المركز *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2 border border-slate-800 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

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
                className="w-full bg-slate-950 text-white text-xs font-num rounded-xl px-3 py-2 border border-slate-800 focus:border-amber-500 outline-none text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                اسم المستخدم للدخول *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2 border border-slate-800 focus:border-amber-500 outline-none text-left"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              عنوان مقر الإدارة الفعلي داخل الحي *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2 border border-slate-800 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              كلمة مرور الدخول للإدارة *
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs rounded-xl pr-3 pl-10 py-2 border border-slate-800 focus:border-amber-500 outline-none text-left"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-3 top-2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer"
            >
              حفظ بيانات الإدارة
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
