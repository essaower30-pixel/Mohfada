import React, { useState, useMemo } from 'react';
import {
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  ArrowRight,
  QrCode,
  FileText,
  Calendar,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { useCommunityWallet } from '../../services/walletState';

interface HistoryPageViewProps {
  onBackToHome: () => void;
}

export const HistoryPageView: React.FC<HistoryPageViewProps> = ({ onBackToHome }) => {
  const { state, currentUser } = useCommunityWallet();

  const [txFilter, setTxFilter] = useState<'all' | 'outgoing' | 'incoming' | 'qr'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) return null;

  // Match transactions across all accounts associated with user's phone or id
  const myCleanPhone = currentUser.phone.replace(/[\s\-\+]/g, '').replace(/^0/, '');
  const myAccountIds = useMemo(() => {
    return new Set(
      state.users
        .filter(
          (u) =>
            u.id === currentUser.id ||
            (myCleanPhone && u.phone.replace(/[\s\-\+]/g, '').replace(/^0/, '') === myCleanPhone)
        )
        .map((u) => u.id)
    );
  }, [state.users, currentUser.id, myCleanPhone]);

  const userTransactions = useMemo(() => {
    return state.transactions.filter(
      (tx) =>
        myAccountIds.has(tx.senderId) ||
        myAccountIds.has(tx.recipientId) ||
        (myCleanPhone && tx.recipientName === (currentUser.shopName || currentUser.name))
    );
  }, [state.transactions, myAccountIds, myCleanPhone, currentUser]);

  // Totals
  const { totalIncoming, totalOutgoing } = useMemo(() => {
    let inc = 0;
    let out = 0;
    userTransactions.forEach((tx) => {
      if (myAccountIds.has(tx.recipientId)) {
        inc += tx.amount;
      }
      if (myAccountIds.has(tx.senderId)) {
        out += tx.amount;
      }
    });
    return { totalIncoming: inc, totalOutgoing: out };
  }, [userTransactions, myAccountIds]);

  const filteredTransactions = useMemo(() => {
    return userTransactions.filter((tx) => {
      // Filter by direction
      if (txFilter === 'outgoing' && !myAccountIds.has(tx.senderId)) return false;
      if (txFilter === 'incoming' && !myAccountIds.has(tx.recipientId)) return false;
      if (txFilter === 'qr' && !tx.isQrScan) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName =
          tx.senderName.toLowerCase().includes(q) || tx.recipientName.toLowerCase().includes(q);
        const matchCode = tx.receiptCode.toLowerCase().includes(q);
        const matchNote = tx.note ? tx.note.toLowerCase().includes(q) : false;
        return matchName || matchCode || matchNote;
      }

      return true;
    });
  }, [userTransactions, txFilter, searchQuery, myAccountIds]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-md">
            <Clock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              سجل العمليات والحركات المالية
            </h2>
            <p className="text-xs text-slate-400">
              جميع حركات الدفع والتحويل والاستلام والإيصالات
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

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>إجمالي المقبوضات الواردة:</span>
          </p>
          <p className="text-xl sm:text-2xl font-black font-num text-emerald-400 mt-1">
            +{totalIncoming.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">ل.س</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            <span>إجمالي المدفوعات الصادرة:</span>
          </p>
          <p className="text-xl sm:text-2xl font-black font-num text-rose-400 mt-1">
            -{totalOutgoing.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">ل.س</span>
          </p>
        </div>
      </div>

      {/* Main Transactions Card */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs flex-wrap">
            <button
              onClick={() => setTxFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                txFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({userTransactions.length})
            </button>
            <button
              onClick={() => setTxFilter('outgoing')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                txFilter === 'outgoing'
                  ? 'bg-rose-500/20 text-rose-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              دفع صادر
            </button>
            <button
              onClick={() => setTxFilter('incoming')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                txFilter === 'incoming'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              استلام وارد
            </button>
            <button
              onClick={() => setTxFilter('qr')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                txFilter === 'qr'
                  ? 'bg-teal-500/20 text-teal-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              باركود
            </button>
          </div>

          <div className="relative min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الإيصال..."
              className="w-full bg-slate-950 text-white text-xs rounded-xl pr-8 pl-3 py-2 border border-slate-800 focus:border-cyan-500 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-2">
            <Clock className="w-9 h-9 text-slate-600 mx-auto opacity-50" />
            <p className="text-xs font-bold text-slate-300">
              {searchQuery ? 'لا توجد عمليات تطابق البحث' : 'لا توجد حركات مسجلة حالياً'}
            </p>
            <p className="text-[11px] text-slate-500">
              جميع الحركات المالية والتحويلات ستظهر هنا بتفاصيلها الكاملة وإيصالاتها
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => {
              const isIncome = myAccountIds.has(tx.recipientId);
              return (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        isIncome
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-slate-100 truncate">
                          {isIncome
                            ? `استلام من: ${tx.senderName}`
                            : `دفع إلى: ${tx.recipientName}`}
                        </p>
                        {tx.isQrScan && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold">
                            باركود QR
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {tx.note || 'عملية تحويل رصيد نقدي'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-num mt-0.5">
                        {new Date(tx.timestamp).toLocaleString('ar-SY', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80 shrink-0">
                    <p
                      className={`font-black font-num text-base sm:text-lg ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {tx.amount.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-400">ل.س</span>
                    </p>
                    <span className="text-[10px] text-slate-500 font-num font-mono bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 mt-1">
                      إيصال: {tx.receiptCode}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
