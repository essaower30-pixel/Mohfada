import React, { useState } from 'react';
import {
  Zap,
  Bookmark,
  Plus,
  Trash2,
  Store,
  User,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowUpRight,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCommunityWallet } from '../../services/walletState';
import { SavedContact } from '../../types/wallet';

interface QuickPayPageViewProps {
  onBackToHome: () => void;
}

export const QuickPayPageView: React.FC<QuickPayPageViewProps> = ({ onBackToHome }) => {
  const {
    state,
    currentUser,
    transferBalance,
    addSavedContact,
    removeSavedContact,
  } = useCommunityWallet();

  // Direct Pay Form States
  const [payIdentifier, setPayIdentifier] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [saveToQuickPay, setSaveToQuickPay] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccessMsg, setPaySuccessMsg] = useState('');

  // Add Contact Modal
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactAccount, setNewContactAccount] = useState('');
  const [contactError, setContactError] = useState('');

  // Contact search filter
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) return null;

  // Live Recipient Lookup
  const cleanPayId = payIdentifier.replace(/[\s\-\+]/g, '');
  const cleanTrimmed = payIdentifier.trim().toLowerCase();
  const matchedRecipient =
    cleanPayId.length >= 3 || cleanTrimmed.length >= 3
      ? state.users.find(
          (u) =>
            u.id !== currentUser.id &&
            (u.phone.replace(/[\s\-\+]/g, '') === cleanPayId ||
              u.phone.replace(/[\s\-\+]/g, '').replace(/^0/, '') === cleanPayId.replace(/^0/, '') ||
              u.accountNumber.toLowerCase() === cleanTrimmed ||
              (u.username && u.username.toLowerCase() === cleanTrimmed))
        )
      : undefined;

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPaySuccessMsg('');

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    const res = transferBalance({
      recipientIdentifier: payIdentifier.trim(),
      amount: amt,
      note: payNote.trim() || undefined,
      saveToQuickPay: saveToQuickPay,
    });

    if (res.success && res.tx) {
      confetti({ particleCount: 75, spread: 60 });
      setPaySuccessMsg(
        `تم تحويل مبلغ ${amt.toLocaleString()} ل.س إلى (${res.tx.recipientName}) بنجاح! رقم الإيصال: ${res.tx.receiptCode}`
      );
      setPayAmount('');
      setPayNote('');
      setPayIdentifier('');
      setSaveToQuickPay(false);
    } else {
      setPayError(res.error || 'فشلت عملية التحويل');
    }
  };

  const handleSelectQuickPayContact = (contact: SavedContact) => {
    setPayIdentifier(contact.phone || contact.accountNumber);
    setPayError('');
    setPaySuccessMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');

    if (!newContactName.trim()) {
      setContactError('يرجى إدخال اسم الجهة أو المتجر');
      return;
    }
    if (!newContactPhone.trim() && !newContactAccount.trim()) {
      setContactError('يرجى إدخال رقم الموبايل أو رقم الحساب على الأقل');
      return;
    }

    addSavedContact({
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      accountNumber: newContactAccount.trim().toUpperCase() || 'POCKET-000',
    });

    confetti({ particleCount: 30, spread: 40 });
    setShowAddContactModal(false);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactAccount('');
  };

  const savedContacts = currentUser.savedContacts || [];
  const filteredContacts = savedContacts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.shopName && c.shopName.toLowerCase().includes(q)) ||
      c.phone.includes(q) ||
      c.accountNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0 shadow-md">
            <Zap className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              الدفع السريع والتحويل الفوري
            </h2>
            <p className="text-xs text-slate-400">
              رصيدك المتاح للتداول:{' '}
              <span className="font-bold font-num text-emerald-400">
                {currentUser.balance.toLocaleString()} ل.س
              </span>
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

      {/* Success Notification */}
      {paySuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{paySuccessMsg}</span>
          </div>
          <button onClick={() => setPaySuccessMsg('')} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Direct Payment Form */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
        <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
          <Send className="w-4 h-4 text-teal-400" />
          <span>تحويل رصيد فوري إلى مستخدم أو متجر</span>
        </h3>

        <form onSubmit={handlePaySubmit} className="space-y-4">
          {/* Pay Identifier */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              رقم الموبايل أو رقم الحساب المالي للمستلم *
            </label>
            <input
              type="text"
              required
              value={payIdentifier}
              onChange={(e) => setPayIdentifier(e.target.value)}
              placeholder="مثال: 09xxxxxxxx أو SHOP-201"
              className="w-full bg-slate-950 text-white text-sm rounded-xl px-3.5 py-2.5 border border-slate-800 focus:border-teal-500 outline-none font-mono text-left"
            />

            {/* Matched Recipient Live Badge */}
            {matchedRecipient && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 animate-in fade-in">
                <img
                  src={matchedRecipient.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt={matchedRecipient.name}
                  className="w-9 h-9 rounded-lg object-cover border border-emerald-400 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-emerald-300 truncate">
                    {matchedRecipient.shopName || matchedRecipient.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-num">
                    حساب: {matchedRecipient.accountNumber} • هاتف: {matchedRecipient.phone}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Amount & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                المبلغ المراد تحويله (ل.س) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="أدخل المبلغ"
                className="w-full bg-slate-950 text-white font-num text-lg font-black rounded-xl px-3.5 py-2 border border-slate-800 focus:border-teal-500 outline-none text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                بيان الدفعة (اختياري)
              </label>
              <input
                type="text"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder="مثال: تسديد حساب بقالية"
                className="w-full bg-slate-950 text-white text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Save to quick pay toggle */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={saveToQuickPay}
              onChange={(e) => setSaveToQuickPay(e.target.checked)}
              className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500 bg-slate-950 border-slate-800"
            />
            <span className="text-xs text-slate-300">
              حفظ هذا المستلم في قائمة جهات الدفع السريع لديك
            </span>
          </label>

          {payError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{payError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>تأكيد التحويل والدفع الآن</span>
          </button>
        </form>
      </div>

      {/* Quick Pay Saved Contacts Section */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                جهات الدفع السريع المحفوظة ({savedContacts.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                انقر على زر «دفع» لأي جهة لملء بياناتها فورياً
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddContactModal(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة جهة جديدة</span>
          </button>
        </div>

        {/* Search Input if multiple contacts */}
        {savedContacts.length > 3 && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              className="w-full bg-slate-950 text-white text-xs rounded-xl pr-9 pl-3 py-2 border border-slate-800 focus:border-teal-500 outline-none"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
          </div>
        )}

        {filteredContacts.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800">
            <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-slate-300">
              {searchQuery ? 'لا توجد جهات تطابق البحث' : 'لم تحفظ أي جهات بعد'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
              يمكنك إضافة محلاتك المفضلة وجيرانك لتسديد حساباتك لهم بنقرة واحدة.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredContacts.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 flex items-center justify-between gap-2.5 transition group"
              >
                <div
                  onClick={() => handleSelectQuickPayContact(c)}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100 group-hover:text-teal-400 truncate">
                      {c.shopName || c.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-num font-mono truncate">
                      {c.accountNumber} • {c.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleSelectQuickPayContact(c)}
                    className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 text-xs font-bold transition cursor-pointer"
                  >
                    دفع
                  </button>
                  <button
                    onClick={() => removeSavedContact(c.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="حذف من المحفوظات"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200 relative z-[100000]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">إضافة جهة دفع سريع</h3>
                  <p className="text-[11px] text-slate-400">حفظ متجر أو صديق لتسديد الدفعات فورياً</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اسم الجهة / المحل *
                </label>
                <input
                  type="text"
                  required
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="مثال: بقالية الأمانة"
                  className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  رقم الموبايل
                </label>
                <input
                  type="tel"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="09xxxxxxxx"
                  className="w-full bg-slate-950 text-white font-num text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-teal-500 outline-none text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  رقم الحساب المالي (إن وجد)
                </label>
                <input
                  type="text"
                  value={newContactAccount}
                  onChange={(e) => setNewContactAccount(e.target.value)}
                  placeholder="مثال: SHOP-201"
                  className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:border-teal-500 outline-none text-left"
                />
              </div>

              {contactError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {contactError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition cursor-pointer"
                >
                  حفظ الجهة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
