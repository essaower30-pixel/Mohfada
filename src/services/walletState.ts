import { useState, useEffect } from 'react';
import {
  CommunityUser,
  AdminVault,
  LocalTransaction,
  LocalWalletState,
  LocalTxType,
  SavedContact,
} from '../types/wallet';
import {
  INITIAL_USERS,
  INITIAL_ADMIN_VAULT,
  INITIAL_TRANSACTIONS,
} from '../data/mockData';

const STORAGE_KEY = 'pocket_cash_community_wallet_v7';

function getInitialState(): LocalWalletState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure admin has username: 'admin' and address if not present
      if (parsed.users) {
        parsed.users = parsed.users.map((u: CommunityUser) => {
          if (u.id === 'usr_admin') {
            return {
              ...u,
              username: u.username || 'admin',
              pin: u.pin || 'admin',
              address: u.address || 'ساحة الحي الرئيسية - جانب جامع التقوى (مكتب إدارة كاش الحي)',
            };
          }
          // Remove (مواطن بالحي) from user name if present
          if (u.name) {
            u.name = u.name.replace(/\s*\(مواطن بالحي\)\s*/g, '').trim();
          }
          // Remove any saved contact for admin from customer's list
          if (u.savedContacts) {
            u.savedContacts = u.savedContacts.filter((c) => c.accountNumber !== 'CASH-100');
          }
          return u;
        });
      }
      const curUser = parsed.users?.find((u: CommunityUser) => u.id === parsed.currentUserId);
      if (curUser?.role !== 'admin') {
        parsed.activeView = 'wallet';
      }
      parsed.adminVault = {
        ...INITIAL_ADMIN_VAULT,
        ...parsed.adminVault,
        transferFeeRate: parsed.adminVault?.transferFeeRate ?? 0.01,
        totalAdminFeesCollected: parsed.adminVault?.totalAdminFeesCollected ?? 730,
      };
      if (parsed.transactions) {
        parsed.transactions = parsed.transactions.map((tx: LocalTransaction) => {
          if ((tx.type === 'p2p_transfer' || tx.type === 'merchant_pay') && tx.fee === undefined) {
            return { ...tx, fee: Math.round(tx.amount * 0.01) };
          }
          return tx;
        });
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading local storage', err);
  }

  return {
    users: INITIAL_USERS,
    currentUserId: 'usr_ahmad', // Default active citizen
    adminVault: INITIAL_ADMIN_VAULT,
    transactions: INITIAL_TRANSACTIONS,
    activeView: 'wallet',
  };
}

type Listener = (state: LocalWalletState) => void;
const listeners = new Set<Listener>();

let currentState: LocalWalletState = getInitialState();

function updateState(updater: (prev: LocalWalletState) => LocalWalletState) {
  currentState = updater(currentState);
  const activeUser = currentState.users.find((u) => u.id === currentState.currentUserId);
  if (activeUser?.role !== 'admin' && currentState.activeView === 'admin') {
    currentState.activeView = 'wallet';
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
  listeners.forEach((fn) => fn(currentState));
}

function generateReceiptCode(prefix: string) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function useCommunityWallet() {
  const [state, setState] = useState<LocalWalletState>(currentState);

  useEffect(() => {
    const handler = (s: LocalWalletState) => setState(s);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const currentUser =
    state.users.find((u) => u.id === state.currentUserId) || state.users[1] || state.users[0];

  const adminUser = state.users.find((u) => u.role === 'admin') || state.users[0];

  const switchUser = (userId: string) => {
    updateState((prev) => ({
      ...prev,
      currentUserId: userId,
      activeView: 'wallet',
    }));
  };

  const setView = (view: 'wallet' | 'admin') => {
    if (view === 'admin' && currentUser.role !== 'admin') {
      return;
    }
    updateState((prev) => ({
      ...prev,
      activeView: view,
    }));
  };

  // Change user password / PIN
  const updateUserPassword = (params: {
    userId: string;
    oldPin: string;
    newPin: string;
  }): { success: boolean; error?: string } => {
    const user = state.users.find((u) => u.id === params.userId);
    if (!user) {
      return { success: false, error: 'المستخدم غير موجود' };
    }
    if (user.pin && user.pin !== params.oldPin) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
    }
    if (!params.newPin || params.newPin.length < 3) {
      return { success: false, error: 'كلمة المرور الجديدة يجب أن تكون 3 أحرف أو أرقام على الأقل' };
    }

    updateState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === params.userId ? { ...u, pin: params.newPin } : u
      ),
    }));

    return { success: true };
  };

  // Update user / admin personal profile
  const updateUserProfile = (params: {
    userId: string;
    name?: string;
    phone?: string;
    shopName?: string;
    address?: string;
    username?: string;
    avatar?: string;
    pin?: string;
  }): { success: boolean; error?: string } => {
    const user = state.users.find((u) => u.id === params.userId);
    if (!user) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    if (params.username) {
      const cleanUsername = params.username.trim().toLowerCase();
      const existingUser = state.users.find(
        (u) =>
          u.id !== params.userId &&
          u.username &&
          u.username.toLowerCase() === cleanUsername
      );
      if (existingUser) {
        return { success: false, error: 'اسم المستخدم مسجل بالفعل، يرجى اختيار اسم آخر' };
      }
    }

    if (params.phone) {
      const cleanPhone = params.phone.replace(/[\s\-\+]/g, '');
      const existingPhone = state.users.find(
        (u) =>
          u.id !== params.userId &&
          u.phone.replace(/[\s\-\+]/g, '') === cleanPhone
      );
      if (existingPhone) {
        return { success: false, error: 'رقم الموبايل مسجل بالفعل لمستخدم آخر' };
      }
    }

    updateState((prev) => ({
      ...prev,
      users: prev.users.map((u) => {
        if (u.id === params.userId) {
          return {
            ...u,
            name: params.name !== undefined && params.name.trim() ? params.name.trim() : u.name,
            phone: params.phone !== undefined && params.phone.trim() ? params.phone.trim() : u.phone,
            shopName: params.shopName !== undefined ? params.shopName.trim() : u.shopName,
            address: params.address !== undefined ? params.address.trim() : u.address,
            username: params.username !== undefined ? params.username.trim() : u.username,
            avatar: params.avatar !== undefined && params.avatar.trim() ? params.avatar.trim() : u.avatar,
            pin: params.pin !== undefined && params.pin.trim() ? params.pin.trim() : u.pin,
          };
        }
        return u;
      }),
    }));

    return { success: true };
  };

  // Add saved quick-pay contact to currentUser
  const addSavedContact = (contact: Omit<SavedContact, 'id' | 'savedAt'>) => {
    const newContact: SavedContact = {
      ...contact,
      id: `cnt_${Date.now()}`,
      savedAt: new Date().toISOString(),
    };

    updateState((prev) => ({
      ...prev,
      users: prev.users.map((u) => {
        if (u.id === currentUser.id) {
          const existing = u.savedContacts || [];
          if (existing.some((c) => c.accountNumber === contact.accountNumber || c.phone === contact.phone)) {
            return u;
          }
          return { ...u, savedContacts: [...existing, newContact] };
        }
        return u;
      }),
    }));
  };

  // Remove saved quick-pay contact
  const removeSavedContact = (contactId: string) => {
    updateState((prev) => ({
      ...prev,
      users: prev.users.map((u) => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            savedContacts: (u.savedContacts || []).filter((c) => c.id !== contactId),
          };
        }
        return u;
      }),
    }));
  };

  // Transfer / Pay balance to another user
  const transferBalance = (params: {
    recipientIdentifier: string;
    amount: number;
    note?: string;
    isQrScan?: boolean;
    saveToQuickPay?: boolean;
  }): { success: boolean; error?: string; tx?: LocalTransaction } => {
    if (params.amount <= 0) {
      return { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' };
    }

    const feeRate = state.adminVault.transferFeeRate ?? 0.01;
    const fee = Math.round(params.amount * feeRate);
    const totalDeduction = params.amount + fee;

    if (currentUser.balance < totalDeduction) {
      return {
        success: false,
        error: `رصيد محفظتك الحالي (${currentUser.balance.toLocaleString()} ل.س) لا يكفي لإتمام الدفع مع عمولة التحويل العائدة للإدارة (${fee.toLocaleString()} ل.س). الإجمالي المطلوب: ${totalDeduction.toLocaleString()} ل.س`,
      };
    }

    const cleanIdent = params.recipientIdentifier.trim();
    const cleanDigits = cleanIdent.replace(/[\s\-\+]/g, '');
    const recipient = state.users.find((u) => {
      if (u.id === cleanIdent) return true;
      if (u.accountNumber.toLowerCase() === cleanIdent.toLowerCase()) return true;
      if (u.phone === cleanIdent) return true;
      const userDigits = u.phone.replace(/[\s\-\+]/g, '');
      if (cleanDigits && userDigits === cleanDigits) return true;
      if (cleanDigits && userDigits.replace(/^0/, '') === cleanDigits.replace(/^0/, '')) return true;
      if (u.username && u.username.toLowerCase() === cleanIdent.toLowerCase()) return true;
      return false;
    });

    if (!recipient) {
      return { success: false, error: 'المستلم غير مسجل في المحفظة، تأكد من رقم الحساب أو الموبايل' };
    }

    if (recipient.id === currentUser.id) {
      return { success: false, error: 'لا يمكن الدفع لنفس الحساب' };
    }

    if (recipient.role === 'admin') {
      return {
        success: false,
        error: 'لا يمكن إجراء عمليات مع الإدارة عن بُعد؛ يجب الحضور شخصياً لمقر الإدارة لتسليم أو استلام الكاش يداً بيد.',
      };
    }

    const isMerchant = recipient.role === 'merchant';
    const txType: LocalTxType = isMerchant ? 'merchant_pay' : 'p2p_transfer';
    const prefix = params.isQrScan ? 'QR' : 'PAY';

    const newTx: LocalTransaction = {
      id: `ltx_${Date.now()}`,
      type: txType,
      amount: params.amount,
      fee: fee,
      senderId: currentUser.id,
      senderName: currentUser.shopName || currentUser.name,
      recipientId: recipient.id,
      recipientName: recipient.shopName || recipient.name,
      timestamp: new Date().toISOString(),
      note: params.note || (isMerchant ? 'دفع مشتريات' : 'دفع رصيد محلي'),
      receiptCode: generateReceiptCode(prefix),
      isQrScan: !!params.isQrScan,
    };

    updateState((prev) => {
      let updatedUsers = prev.users.map((u) => {
        if (u.id === currentUser.id) {
          let contacts = u.savedContacts || [];
          if (
            params.saveToQuickPay &&
            !contacts.some((c) => c.accountNumber === recipient.accountNumber)
          ) {
            contacts = [
              ...contacts,
              {
                id: `cnt_${Date.now()}`,
                name: recipient.name,
                phone: recipient.phone,
                accountNumber: recipient.accountNumber,
                shopName: recipient.shopName,
                savedAt: new Date().toISOString(),
              },
            ];
          }
          return { ...u, balance: u.balance - totalDeduction, savedContacts: contacts };
        }
        if (u.id === recipient.id) {
          return { ...u, balance: u.balance + params.amount };
        }
        if (u.role === 'admin') {
          // Admin account balance also receives the transfer fee
          return { ...u, balance: u.balance + fee };
        }
        return u;
      });

      return {
        ...prev,
        adminVault: {
          ...prev.adminVault,
          cashInDrawer: prev.adminVault.cashInDrawer + fee,
          totalAdminFeesCollected: (prev.adminVault.totalAdminFeesCollected || 0) + fee,
        },
        users: updatedUsers,
        transactions: [newTx, ...prev.transactions],
      };
    });

    return { success: true, tx: newTx };
  };

  // Manager function: Supply/charge balance to a user against cash received in hand
  const adminChargeUserCash = (params: {
    userId: string;
    amount: number;
    note?: string;
  }): { success: boolean; error?: string; tx?: LocalTransaction } => {
    if (params.amount <= 0) {
      return { success: false, error: 'المبلغ غير صالح' };
    }
    if (state.adminVault.digitalVaultBalance < params.amount) {
      return {
        success: false,
        error: 'رصيد الخزينة الرقمي لا يكفي لإضافة الرصيد المطلوب',
      };
    }

    const targetUser = state.users.find((u) => u.id === params.userId);
    if (!targetUser) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    const newTx: LocalTransaction = {
      id: `ltx_${Date.now()}`,
      type: 'admin_cash_charge',
      amount: params.amount,
      senderId: adminUser.id,
      senderName: adminUser.name,
      recipientId: targetUser.id,
      recipientName: targetUser.shopName || targetUser.name,
      timestamp: new Date().toISOString(),
      note: params.note || `شحن وتزويد رصيد مقابل استلام ${params.amount.toLocaleString()} ل.س كاش`,
      receiptCode: generateReceiptCode('ADD-CASH'),
      isQrScan: false,
    };

    updateState((prev) => ({
      ...prev,
      adminVault: {
        ...prev.adminVault,
        digitalVaultBalance: prev.adminVault.digitalVaultBalance - params.amount,
        cashInDrawer: prev.adminVault.cashInDrawer + params.amount,
        totalIssuedToUsers: prev.adminVault.totalIssuedToUsers + params.amount,
      },
      users: prev.users.map((u) =>
        u.id === targetUser.id ? { ...u, balance: u.balance + params.amount } : u
      ),
      transactions: [newTx, ...prev.transactions],
    }));

    return { success: true, tx: newTx };
  };

  // Manager function: Exchange user points/balance to physical cash (cash payout)
  const adminWithdrawUserCash = (params: {
    userId: string;
    amount: number;
    note?: string;
  }): { success: boolean; error?: string; tx?: LocalTransaction } => {
    const targetUser = state.users.find((u) => u.id === params.userId);
    if (!targetUser) {
      return { success: false, error: 'المستخدم غير موجود' };
    }
    if (targetUser.balance < params.amount) {
      return {
        success: false,
        error: `رصيد المستخدم (${targetUser.balance.toLocaleString()} ل.س) لا يكفي لصرف هذا المبلغ`,
      };
    }

    const newTx: LocalTransaction = {
      id: `ltx_${Date.now()}`,
      type: 'admin_cash_withdraw',
      amount: params.amount,
      senderId: targetUser.id,
      senderName: targetUser.shopName || targetUser.name,
      recipientId: adminUser.id,
      recipientName: adminUser.name,
      timestamp: new Date().toISOString(),
      note: params.note || `تبديل رصيد ونقاط إلى كاش ورقي بقيمة ${params.amount.toLocaleString()} ل.س نقداً`,
      receiptCode: generateReceiptCode('CASH-OUT'),
      isQrScan: false,
    };

    updateState((prev) => ({
      ...prev,
      adminVault: {
        ...prev.adminVault,
        digitalVaultBalance: prev.adminVault.digitalVaultBalance + params.amount,
        cashInDrawer: Math.max(0, prev.adminVault.cashInDrawer - params.amount),
        cashPaidOut: prev.adminVault.cashPaidOut + params.amount,
      },
      users: prev.users.map((u) =>
        u.id === targetUser.id ? { ...u, balance: u.balance - params.amount } : u
      ),
      transactions: [newTx, ...prev.transactions],
    }));

    return { success: true, tx: newTx };
  };

  const registerNewUser = (params: {
    name: string;
    phone: string;
    role: 'resident' | 'merchant';
    shopName?: string;
    initialCashPaid?: number;
    pin?: string;
  }) => {
    const newId = `usr_${Date.now().toString(36)}`;
    const accNumber =
      params.role === 'merchant'
        ? `SHOP-${Math.floor(200 + Math.random() * 800)}`
        : `POCKET-${Math.floor(100 + Math.random() * 900)}`;

    const initialAmount = params.initialCashPaid || 0;

    const newUser: CommunityUser = {
      id: newId,
      name: params.name,
      phone: params.phone,
      accountNumber: accNumber,
      role: params.role,
      shopName: params.shopName,
      balance: initialAmount,
      pin: params.pin || '1234',
      registeredAt: new Date().toISOString().split('T')[0],
      savedContacts: [
        {
          id: `cnt_admin_${Date.now()}`,
          name: adminUser.name,
          phone: adminUser.phone,
          accountNumber: adminUser.accountNumber,
          shopName: adminUser.shopName,
          savedAt: new Date().toISOString(),
        },
      ],
      avatar:
        params.role === 'merchant'
          ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    let initialTx: LocalTransaction | null = null;
    if (initialAmount > 0) {
      initialTx = {
        id: `ltx_${Date.now()}`,
        type: 'admin_cash_charge',
        amount: initialAmount,
        senderId: adminUser.id,
        senderName: adminUser.name,
        recipientId: newId,
        recipientName: params.shopName || params.name,
        timestamp: new Date().toISOString(),
        note: `اشتراك جديد مع تزويد رصيد كاش بمبلغ ${initialAmount.toLocaleString()} ل.س`,
        receiptCode: generateReceiptCode('SUB-IN'),
        isQrScan: false,
      };
    }

    updateState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUserId: newId, // Immediately persist & log in as the newly registered user
      activeView: 'wallet',
      adminVault: {
        ...prev.adminVault,
        digitalVaultBalance: prev.adminVault.digitalVaultBalance - initialAmount,
        cashInDrawer: prev.adminVault.cashInDrawer + initialAmount,
        totalIssuedToUsers: prev.adminVault.totalIssuedToUsers + initialAmount,
      },
      transactions: initialTx ? [initialTx, ...prev.transactions] : prev.transactions,
    }));

    return newUser;
  };

  const setTransferFeeRate = (rate: number) => {
    updateState((prev) => ({
      ...prev,
      adminVault: {
        ...prev.adminVault,
        transferFeeRate: rate,
      },
    }));
  };

  const resetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    currentState = getInitialState();
    listeners.forEach((fn) => fn(currentState));
  };

  return {
    state,
    currentUser,
    adminUser,
    switchUser,
    setView,
    transferBalance,
    addSavedContact,
    removeSavedContact,
    adminChargeUserCash,
    adminWithdrawUserCash,
    registerNewUser,
    updateUserPassword,
    updateUserProfile,
    setTransferFeeRate,
    resetData,
  };
}
