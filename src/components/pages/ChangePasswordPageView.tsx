import React, { useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowRight,
  Save,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../../services/walletState';

interface ChangePasswordPageViewProps {
  onBackToHome: () => void;
}

export const ChangePasswordPageView: React.FC<ChangePasswordPageViewProps> = ({ onBackToHome }) => {
  const { currentUser, updateUserPassword } = useCommunityWallet();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPin.trim()) {
      setErrorMsg('يرجى إدخال كلمة المرور الحالية');
      return;
    }
    if (!newPin.trim()) {
      setErrorMsg('يرجى إدخال كلمة المرور الجديدة');
      return;
    }
    if (newPin.trim().length < 3) {
      setErrorMsg('كلمة المرور الجديدة يجب أن تكون 3 أحرف أو أرقام على الأقل');
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setErrorMsg('تأكيد كلمة المرور غير متطابق مع كلمة المرور الجديدة');
      return;
    }

    const res = updateUserPassword({
      userId: currentUser.id,
      oldPin: currentPin.trim(),
      newPin: newPin.trim(),
    });
    if (res.success) {
      confetti({ particleCount: 60, spread: 60 });
      setSuccessMsg('تم تغيير وتحديث كلمة المرور بنجاح وحفظها سحابياً!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      setErrorMsg(res.error || 'فشل تغيير كلمة المرور');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              تغيير كلمة المرور والرمز السري
            </h2>
            <p className="text-xs text-slate-400">
              تأمين حسابك برمز دخول شخصي دائم
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

      {/* Main Card */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
          {/* Current Pin */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              كلمة المرور الحالية *
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
                className="w-full bg-slate-950 text-white text-sm rounded-xl pr-3.5 pl-11 py-2.5 border border-slate-800 focus:border-amber-500 outline-none text-left font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Pin */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              كلمة المرور الجديدة *
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                className="w-full bg-slate-950 text-white text-sm rounded-xl pr-3.5 pl-11 py-2.5 border border-slate-800 focus:border-amber-500 outline-none text-left font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Pin */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              تأكيد كلمة المرور الجديدة *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="أعد إدخال كلمة المرور للتأكيد"
                className="w-full bg-slate-950 text-white text-sm rounded-xl pr-3.5 pl-11 py-2.5 border border-slate-800 focus:border-amber-500 outline-none text-left font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/25"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتثبيت كلمة المرور الجديدة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
