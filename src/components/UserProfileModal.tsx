import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Lock,
  MapPin,
  Camera,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  Upload,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile } = useCommunityWallet();

  const [avatar, setAvatar] = useState('');
  const [address, setAddress] = useState('');
  const [shopName, setShopName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setAvatar(currentUser.avatar || '');
      setAddress(currentUser.address || '');
      setShopName(currentUser.shopName || '');
      setNewPassword(currentUser.pin || '');
      setConfirmPassword(currentUser.pin || '');
      setError('');
      setSuccessMsg('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  // Handle local image file upload from device studio/gallery
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح (JPEG أو PNG أو WebP)');
      return;
    }

    setIsUploading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to maximum 300x300 to optimize storage in Firestore & LocalStorage
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(compressedDataUrl);
          setSuccessMsg('تم استيراد الصورة بنجاح من الاستديو!');
          setTimeout(() => setSuccessMsg(''), 3000);
        }
        setIsUploading(false);
      };
      img.onerror = () => {
        setError('تعذر قراءة الصورة، يرجى تجربة صورة أخرى');
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setError('حدث خطأ أثناء تحميل الملف');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    if (newPassword && newPassword.length < 3) {
      setError('كلمة المرور يجب أن تكون 3 خانات أو أحرف على الأقل');
      return;
    }

    const res = updateUserProfile({
      userId: currentUser.id,
      avatar: avatar.trim(),
      address: address.trim(),
      shopName: currentUser.role === 'merchant' ? shopName.trim() : undefined,
      pin: newPassword.trim() || undefined,
    });

    if (res.success) {
      confetti({ particleCount: 50, spread: 60 });
      setSuccessMsg('تم حفظ البيانات الشخصية بنجاح!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setError(res.error || 'حدث خطأ أثناء حفظ البيانات');
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">
                تعديل البيانات الشخصية
              </h3>
              <p className="text-xs text-slate-400">
                حساب: <span className="font-mono text-emerald-400 font-bold">{currentUser.accountNumber}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border-2 border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="font-semibold">{successMsg}</p>
            </div>
          )}

          {/* 1. Profile Photo (Avatar) with Studio/Gallery Import */}
          <div className="space-y-2.5 pb-2 border-b border-slate-800/80">
            <label className="block text-xs font-bold text-slate-300">
              صورة الملف الشخصي (يمكنك استيراد صورة من الاستديو):
            </label>

            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt="الصورة الشخصية"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-md shadow-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg transition cursor-pointer"
                  title="استيراد صورة من الاستديو"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'جاري قراءة الصورة...' : 'استيراد صورة من الاستديو / المعرض'}</span>
                </button>

                <p className="text-[11px] text-slate-400 leading-tight">
                  اختر صورة من ذاكرة جهازك أو الاستديو وسيتم حفظها مباشرة على حسابك.
                </p>
              </div>
            </div>

            {/* Quick Preset Avatars */}
            <div>
              <p className="text-[11px] text-slate-400 mb-1.5 font-medium">أو اختر صورة جاهزة سريعة:</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(preset)}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                      avatar === preset ? 'border-emerald-400 ring-2 ring-emerald-400/30 scale-105' : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Full Name (LOCKED / READ-ONLY) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>الاسم الثلاثي الإجباري:</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center gap-1 border border-amber-500/20">
                <Lock className="w-2.5 h-2.5" />
                <span>غير قابل للتعديل</span>
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={currentUser.name}
                disabled
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border-2 border-slate-800 text-slate-400 text-sm font-bold cursor-not-allowed select-none"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              🔒 لا يستطيع المستخدم تغيير الاسم الثلاثي الإجباري لضمان أمان المعاملات المالية بالحي وعدم انتحال الشخصيات.
            </p>
          </div>

          {/* 3. Phone Number (LOCKED / READ-ONLY) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>رقم الهاتف المعتمد:</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center gap-1 border border-amber-500/20">
                <Lock className="w-2.5 h-2.5" />
                <span>غير قابل للتعديل</span>
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={currentUser.phone}
                disabled
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border-2 border-slate-800 text-slate-400 text-sm font-mono font-bold cursor-not-allowed select-none"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              🔒 لا يمكن تغيير رقم الهاتف لكونه المعرّف الأساسي لاستقبال الرصيد والدفع بالباركود واستعادة كلمة السر.
            </p>
          </div>

          {/* Shop Name (if Merchant) */}
          {currentUser.role === 'merchant' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-cyan-400" />
                <span>اسم المحل أو المتجر التجاري:</span>
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="اسم المحل التجاري"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border-2 border-slate-800 focus:border-cyan-400 text-white text-sm font-semibold outline-none transition"
              />
            </div>
          )}

          {/* 4. Password / PIN (EDITABLE) */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>تغيير كلمة المرور / رمز الدخول:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة المرور الجديدة"
                  className="w-full py-2.5 pr-3 pl-9 rounded-xl bg-slate-950 border-2 border-slate-800 focus:border-emerald-500 text-white text-sm font-mono outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تأكيد كلمة المرور"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border-2 border-slate-800 focus:border-emerald-500 text-white text-sm font-mono outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* 5. Address (EDITABLE) */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>العنوان / مكان الإقامة في الحي:</span>
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: جانب جامع التقوى - الحارة الشرقية"
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border-2 border-slate-800 focus:border-emerald-500 text-white text-xs sm:text-sm font-semibold outline-none transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
