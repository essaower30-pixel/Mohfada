import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Phone,
  MapPin,
  Building,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  Camera,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { adminUser, updateUserProfile } = useCommunityWallet();

  const [name, setName] = useState(adminUser.name || 'أبو حامد');
  const [shopName, setShopName] = useState(adminUser.shopName || 'نقطة الكاش المعتمدة بالحي');
  const [phone, setPhone] = useState(adminUser.phone || '0999000111');
  const [address, setAddress] = useState(
    adminUser.address || 'ساحة الحي الرئيسية - جانب جامع التقوى (مكتب إدارة كاش الحي)'
  );
  const [username, setUsername] = useState(adminUser.username || 'admin');
  const [newPin, setNewPin] = useState('');
  const [avatar, setAvatar] = useState(
    adminUser.avatar || DEFAULT_AVATARS[0]
  );

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
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
          setAvatar(canvas.toDataURL('image/jpeg', 0.85));
          setSuccessMsg('تم اختيار الصورة بنجاح!');
          setTimeout(() => setSuccessMsg(''), 2500);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم المدير');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم موبايل الإدارة');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('يرجى إدخال عنوان ومقر الإدارة لتسليم الكاش');
      return;
    }

    if (!username.trim()) {
      setErrorMsg('يرجى إدخال اسم المستخدم لتسجيل الدخول');
      return;
    }

    if (newPin && newPin.length < 3) {
      setErrorMsg('كلمة المرور يجب أن تتكون من 3 أحرف أو أرقام على الأقل');
      return;
    }

    const res = updateUserProfile({
      userId: adminUser.id,
      name: name.trim(),
      shopName: shopName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      username: username.trim(),
      avatar: avatar.trim(),
      pin: newPin.trim() ? newPin.trim() : undefined,
    });

    if (res.success) {
      confetti({ particleCount: 70, spread: 60 });
      setSuccessMsg('تم حفظ وتحديث بيانات الإدارة بنجاح، وستظهر لجميع المشتركين!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'حدث خطأ أثناء حفظ البيانات');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200 relative z-[100000]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">تعديل البيانات الشخصية للإدارة</h3>
              <p className="text-xs text-slate-400">
                تحديث معلومات المدير وعنوان النقطة ورقم التواصل للدخول والتعامل
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

        {/* Informative Note */}
        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl text-[11px] sm:text-xs text-amber-300/90 leading-relaxed">
          💡 <strong>ملاحظة هامة:</strong> رقم الموبايل والعنوان المكتوبين هنا هما اللذان يظهران في صفحة الزبائن ليعرف المشتركون أين يحضرون شخصياً لاستلام الكاش أو تزويد الرصيد.
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Avatar selector */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">
              الصورة الرمزية للمدير (أو استيراد من الاستديو):
            </label>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={avatar}
                  alt="Admin Avatar"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-amber-500 text-slate-950 font-bold shadow transition cursor-pointer"
                  title="استيراد من الاستديو"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              <div className="flex-1 space-y-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>استيراد صورة من الاستديو</span>
                </button>

                <div className="flex items-center gap-2 pt-0.5">
                  {DEFAULT_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-7 h-7 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                        avatar === url
                          ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/30'
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Admin Name */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                اسم المدير الشخصي *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أبو حامد"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 pl-8 text-white text-xs focus:outline-none focus:border-amber-500"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Shop Name / Center Title */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                اسم نقطة الكاش / المركز
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="مثال: مكتب إدارة كاش الحي"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 pl-8 text-white text-xs focus:outline-none focus:border-amber-500"
                />
                <Building className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Admin Mobile Phone */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              رقم موبايل وهاتف الإدارة المعتمد *
            </label>
            <div className="relative">
              <input
                type="text"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0999000111"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 pl-8 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                required
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              يستخدم للاتصال المباشر من الزبائن ولتسجيل الدخول للنظام.
            </p>
          </div>

          {/* Admin Physical Address */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              عنوان ومقر الإدارة الفعلي بالحي *
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: ساحة الحي الرئيسية - جانب جامع التقوى (مكتب كاش الحي)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 pl-8 text-white text-xs focus:outline-none focus:border-amber-500"
                required
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              هذا العنوان يظهر في بطاقة الإدارة بصفحة الزبون ليعرف المشترك موقع الاستلام والتسليم شخصياً.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>بيانات تسجيل الدخول للإدارة:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Username */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  اسم المستخدم للدخول (Username)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-1.5 px-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* New Password (optional) */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  كلمة المرور الجديدة (اختياري)
                </label>
                <input
                  type="password"
                  dir="ltr"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="اتركها فارغة للإبقاء على الحالية"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-1.5 px-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>حفظ وتحديث البيانات</span>
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
};
