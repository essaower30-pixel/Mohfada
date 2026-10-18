import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../services/walletState';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, updateUserPassword } = useCommunityWallet();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!oldPassword) {
      setErrorMsg('يرجى إدخال كلمة المرور الحالية');
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setErrorMsg('كلمة المرور الجديدة يجب أن تكون 3 خانات على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('كلمة المرور الجديدة غير متطابقة مع التأكيد');
      return;
    }

    const res = updateUserPassword({
      userId: currentUser.id,
      oldPin: oldPassword,
      newPin: newPassword,
    });

    if (res.success) {
      confetti({ particleCount: 60, spread: 60 });
      setSuccessMsg('تم تغيير كلمة المرور بنجاح وحفظها!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'فشل تحديث كلمة المرور');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200 relative z-[100000]">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">تغيير كلمة المرور</h3>
              <p className="text-xs text-slate-400">
                تحديث كلمة المرور لحساب ({currentUser.name})
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Old Password */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              كلمة المرور الحالية *
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                required
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="كلمة المرور الحالية"
                className="w-full bg-slate-950 text-white placeholder-slate-500 text-sm font-bold rounded-2xl px-4 py-2.5 border-2 border-slate-600 focus:border-amber-400 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute left-3 top-3 text-slate-400 hover:text-white transition cursor-pointer"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              كلمة المرور الجديدة *
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="كلمة المرور الجديدة"
                className="w-full bg-slate-950 text-white placeholder-slate-500 text-sm font-bold rounded-2xl px-4 py-2.5 border-2 border-slate-600 focus:border-emerald-400 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute left-3 top-3 text-slate-400 hover:text-white transition cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              تأكيد كلمة المرور الجديدة *
            </label>
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorMsg('');
              }}
              placeholder="أعد كتابة كلمة المرور الجديدة"
              className="w-full bg-slate-950 text-white placeholder-slate-500 text-sm font-bold rounded-2xl px-4 py-2.5 border-2 border-slate-600 focus:border-emerald-400 outline-none transition"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border-2 border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>حفظ كلمة المرور الجديدة</span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
