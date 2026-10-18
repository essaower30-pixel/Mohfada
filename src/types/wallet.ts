export type UserRole = 'admin' | 'merchant' | 'resident';

export interface SavedContact {
  id: string;
  name: string;
  phone: string;
  accountNumber: string;
  shopName?: string;
  savedAt: string;
}

export interface CommunityUser {
  id: string;
  name: string;
  username?: string; // e.g. 'admin'
  phone: string;
  accountNumber: string; // e.g. 'POCKET-562'
  role: UserRole;
  shopName?: string;
  balance: number; // in Syrian Pounds (ل.س)
  pin: string; // Password / PIN (initially 'admin' for admin)
  avatar?: string;
  address?: string;
  registeredAt: string;
  savedContacts?: SavedContact[];
}

export interface AdminVault {
  digitalVaultBalance: number;
  cashInDrawer: number;
  cashPaidOut: number;
  totalIssuedToUsers: number;
  transferFeeRate?: number; // e.g. 0.01 for 1%
  totalAdminFeesCollected?: number; // total revenue returned to admin from transfers
}

export type LocalTxType =
  | 'admin_cash_charge'
  | 'admin_cash_withdraw'
  | 'p2p_transfer'
  | 'merchant_pay';

export interface LocalTransaction {
  id: string;
  type: LocalTxType;
  amount: number;
  fee?: number; // Amount returning to admin from user-to-user transfer
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  timestamp: string;
  note: string;
  receiptCode: string;
  isQrScan: boolean;
}

export interface LocalWalletState {
  users: CommunityUser[];
  currentUserId: string;
  adminVault: AdminVault;
  transactions: LocalTransaction[];
  activeView: 'wallet' | 'admin';
}
