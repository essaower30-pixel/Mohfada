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
  username?: string;
  phone: string;
  accountNumber: string;
  role: 'resident' | 'merchant' | 'admin';
  shopName?: string;
  address?: string;
  balance: number;
  pin?: string;
  avatar?: string;
  registeredAt: string;
  savedContacts?: SavedContact[];
}

export interface AdminVault {
  digitalVaultBalance: number;
  cashInDrawer: number;
  cashPaidOut: number;
  totalIssuedToUsers: number;
  transferFeeRate: number; // e.g. 0.01 for 1%
  totalAdminFeesCollected: number;
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
  fee?: number;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  timestamp: string;
  note: string;
  receiptCode: string;
  isQrScan?: boolean;
}

export interface LocalWalletState {
  users: CommunityUser[];
  currentUserId: string | null;
  adminVault: AdminVault;
  transactions: LocalTransaction[];
  activeView: 'wallet' | 'admin';
}
