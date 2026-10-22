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
import {
  startUsersRealtimeSync,
  startTransactionsRealtimeSync,
  startVaultRealtimeSync,
  syncUserToCloud,
  syncTransactionToCloud,
  syncVaultToCloud,
  syncTransferBatchToCloud,
  syncAdminCashActionToCloud,
} from './firestoreSync';

const STORAGE_KEY = 'pocket_cash_community_wallet_v8';
const LEGACY_STORAGE_KEY = 'pocket_cash_community_wallet_v7';

function getInitialState(): LocalWalletState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure admin has username: 'admin' and address if not present
      if (parsed.users) {
        // Ensure any base community user (such as Om Mohammed 0951854257) is present in users
        INITIAL_USERS.forEach((initU) => {
          if (!parsed.users.some((u: CommunityUser) => u.id === initU.id || u.phone === initU.phone)) {
            parsed.users.push(initU);
          }
        });

        parsed.users = parsed.users.map((u: CommunityUser) => {
          if (u.id === 'usr_admin') {
            return {
              ...u,
              username: u.username || 'admin',
              pin: u.pin || 'admin',
              balance: 0,
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
      // CRITICAL: NEVER auto-login as 'usr_ahmad' (عيسى عوير). On new install or legacy mock state, keep currentUserId null!
      const curUser = (parsed.currentUserId && parsed.currentUserId !== 'usr_ahmad')
        ? parsed.users?.find((u: CommunityUser) => u.id === parsed.currentUserId) || null
        : null;
      parsed.currentUserId = curUser ? curUser.id : null;
      parsed.activeView = curUser?.role === 'admin' ? 'admin' : 'wallet';
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
    currentUserId: null, // First-time installation / new user: NO default user! Registration screen appears empty!
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
  const activeUser = currentState.currentUserId
    ? currentState.users.find((u) => u.id === currentState.currentUserId)
    : null;
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

// Global Cloud Synchronization across all devices
let isCloudSyncActive = false;
function initCloudSync() {
  if (isCloudSyncActive || typeof window === 'undefined') return;
  isCloudSyncActive = true;

  // 1. Live Users Realtime Sync
  startUsersRealtimeSync((cloudUsers) => {
    updateState((prev) => {
      const userMap = new Map<string, CommunityUser>();
      // Keep initial users
      INITIAL_USERS.forEach((u) => userMap.set(u.id, u));
      // Add local users
      prev.users.forEach((u) => userMap.set(u.id, u));
      // Overwrite with live cloud users
      cloudUsers.forEach((u) => userMap.set(u.id, u));

      // Upload any locally registered user that does not exist in cloud yet
      const cloudIds = new Set(cloudUsers.map((u) => u.id));
      prev.users.forEach((localU) => {
        if (!cloudIds.has(localU.id) && localU.id.startsWith('usr_')) {
          syncUserToCloud(localU);
        }
      });

      return {
        ...prev,
        users: Array.from(userMap.values()),
      };
    });
  });

  // 2. Live Transactions Realtime Sync
  startTransactionsRealtimeSync((cloudTxs) => {
    updateState((prev) => {
      const txMap = new Map<string, LocalTransaction>();
      prev.transactions.forEach((tx) => txMap.set(tx.id, tx));
      cloudTxs.forEach((tx) => txMap.set(tx.id, tx));
      const sorted = Array.from(txMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      return {
        ...prev,
        transactions: sorted,
      };
    });
  });

  // 3. Live Vault Realtime Sync
  startVaultRealtimeSync((cloudVault) => {
    updateState((prev) => ({
      ...prev,
      adminVault: {
        ...prev.adminVault,
        ...cloudVault,
      },
    }));
  });
}

// Start cloud sync immediately
initCloudSync();

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

  const currentUser: CommunityUser | null = state.currentUserId
    ? state.users.find((u) => u.id === state.currentUserId) || null
    : null;

  const adminUser = state.users.find((u) => u.role === 'admin') || state.users[0];

  const switchUser = (userId: string) => {
    const targetUser = state.users.find((u) => u.id === userId);
    updateState((prev) => ({
      ...prev,
      currentUserId: userId,
      activeView: targetUser?.role === 'admin' ? 'admin' : 'wallet',
    }));
  };

  const logout = () => {
    updateState((prev) => ({
      ...prev,
      currentUserId: null,
      activeView: 'wallet',
    }));
  };

  const setView = (view: 'wallet' | 'admin') => {
    if (view === 'admin' && currentUser?.role !== 'admin') {
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

    const updatedUser = { ...user, pin: params.newPin };
    updateState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === params.userId ? updatedUser : u
      ),
    }));
    syncUserToCloud(updatedUser);

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

    const updatedUser: CommunityUser = {
      ...user,
      name: params.name !== undefined && params.name.trim() ? params.name.trim() : user.name,
      phone: params.phone !== undefined && params.phone.trim() ? params.phone.trim() : user.phone,
      shopName: params.shopName !== undefined ? params.shopName.trim() : user.shopName,
      address: params.address !== undefined ? params.address.trim() : user.address,
      username: params.username !== undefined ? params.username.trim() : user.username,
      avatar: params.avatar !== undefined && params.avatar.trim() ? params.avatar.trim() : user.avatar,
      pin: params.pin !== undefined && params.pin.trim() ? params.pin.trim() : user.pin,
    };

    updateState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === params.userId ? updatedUser : u)),
    }));
    syncUserToCloud(updatedUser);

    return { success: true };
  };

  // Add saved quick-pay contact to currentUser
  const addSavedContact = (contact: Omit<SavedContact, 'id' | 'savedAt'>) => {
    if (!currentUser) return;
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
    if (!currentUser) return;
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
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً للقيام بعمليات الدفع' };
    }

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

    // Realtime Atomic Cloud Sync to Firestore
    const updatedSender: CommunityUser = {
      ...currentUser,
      balance: currentUser.balance - totalDeduction,
    };
    const updatedRecipient: CommunityUser = {
      ...recipient,
      balance: recipient.balance + params.amount,
    };
    const updatedAdmin: CommunityUser = {
      ...adminUser,
      balance: adminUser.balance + fee,
    };
    const updatedVault: AdminVault = {
      ...state.adminVault,
      cashInDrawer: state.adminVault.cashInDrawer + fee,
      totalAdminFeesCollected: (state.adminVault.totalAdminFeesCollected || 0) + fee,
    };

    syncTransferBatchToCloud({
      sender: updatedSender,
      recipient: updatedRecipient,
      admin: updatedAdmin,
      adminVault: updatedVault,
      transaction: newTx,
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

    const updatedUser: CommunityUser = {
      ...targetUser,
      balance: targetUser.balance + params.amount,
    };
    const updatedVault: AdminVault = {
      ...state.adminVault,
      digitalVaultBalance: state.adminVault.digitalVaultBalance - params.amount,
      cashInDrawer: state.adminVault.cashInDrawer + params.amount,
      totalIssuedToUsers: state.adminVault.totalIssuedToUsers + params.amount,
    };
    syncAdminCashActionToCloud({
      targetUser: updatedUser,
      adminVault: updatedVault,
      transaction: newTx,
    });

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

    const updatedUser: CommunityUser = {
      ...targetUser,
      balance: targetUser.balance - params.amount,
    };
    const updatedVaultWithdraw: AdminVault = {
      ...state.adminVault,
      digitalVaultBalance: state.adminVault.digitalVaultBalance + params.amount,
      cashInDrawer: Math.max(0, state.adminVault.cashInDrawer - params.amount),
      cashPaidOut: state.adminVault.cashPaidOut + params.amount,
    };
    syncAdminCashActionToCloud({
      targetUser: updatedUser,
      adminVault: updatedVaultWithdraw,
      transaction: newTx,
    });

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

    // Realtime Cloud Sync of newly registered user
    syncUserToCloud(newUser);
    if (initialTx) {
      syncTransactionToCloud(initialTx);
      const updatedVaultReg: AdminVault = {
        ...state.adminVault,
        digitalVaultBalance: state.adminVault.digitalVaultBalance - initialAmount,
        cashInDrawer: state.adminVault.cashInDrawer + initialAmount,
        totalIssuedToUsers: state.adminVault.totalIssuedToUsers + initialAmount,
      };
      syncVaultToCloud(updatedVaultReg);
    }

    return newUser;
  };

  const setTransferFeeRate = (rate: number) => {
    const updatedVault = {
      ...state.adminVault,
      transferFeeRate: rate,
    };
    updateState((prev) => ({
      ...prev,
      adminVault: updatedVault,
    }));
    syncVaultToCloud(updatedVault);
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
    logout,
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
