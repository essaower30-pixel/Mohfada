import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  CommunityUser,
  AdminVault,
  LocalTransaction,
  LocalWalletState,
} from '../types/wallet';

/**
 * Real-time synchronization layer between Pocket Cash Community Wallet
 * and Firestore Cloud Database.
 * Ensures all neighborhood residents and merchants see live balances,
 * registered users, and transactions across multiple mobile devices.
 */

// Active listeners callbacks
type UsersCallback = (users: CommunityUser[]) => void;
type TransactionsCallback = (txs: LocalTransaction[]) => void;
type VaultCallback = (vault: AdminVault) => void;

let unsubUsers: (() => void) | null = null;
let unsubTxs: (() => void) | null = null;
let unsubVault: (() => void) | null = null;

/**
 * Start listening to all users in real time.
 * When any user registers or updates balance on any phone, all phones receive the update.
 */
export function startUsersRealtimeSync(callback: UsersCallback): () => void {
  if (unsubUsers) unsubUsers();

  const usersCol = collection(db, 'users');
  unsubUsers = onSnapshot(
    usersCol,
    (snapshot) => {
      if (snapshot.empty) {
        return;
      }
      const liveUsers: CommunityUser[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as CommunityUser;
        liveUsers.push({
          ...data,
          id: d.id,
        });
      });
      callback(liveUsers);
    },
    (err) => {
      console.warn('Realtime users sync error:', err);
    }
  );

  return unsubUsers;
}

/**
 * Start listening to all transactions in real time.
 */
export function startTransactionsRealtimeSync(callback: TransactionsCallback): () => void {
  if (unsubTxs) unsubTxs();

  const txCol = collection(db, 'transactions');
  const q = query(txCol, orderBy('timestamp', 'desc'), limit(150));
  unsubTxs = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) return;
      const liveTxs: LocalTransaction[] = [];
      snapshot.forEach((d) => {
        liveTxs.push(d.data() as LocalTransaction);
      });
      callback(liveTxs);
    },
    (err) => {
      console.warn('Realtime transactions sync error:', err);
    }
  );

  return unsubTxs;
}

/**
 * Start listening to the central admin vault in real time.
 */
export function startVaultRealtimeSync(callback: VaultCallback): () => void {
  if (unsubVault) unsubVault();

  const vaultDoc = doc(db, 'admin_vault', 'central');
  unsubVault = onSnapshot(
    vaultDoc,
    (snapshot) => {
      if (!snapshot.exists()) return;
      callback(snapshot.data() as AdminVault);
    },
    (err) => {
      console.warn('Realtime vault sync error:', err);
    }
  );

  return unsubVault;
}

/**
 * Save / Update a single user in Firestore
 */
export async function syncUserToCloud(user: CommunityUser): Promise<void> {
  try {
    await setDoc(doc(db, 'users', user.id), user, { merge: true });
  } catch (err) {
    console.error('Failed to sync user to Firestore:', err);
  }
}

/**
 * Save a new transaction in Firestore
 */
export async function syncTransactionToCloud(tx: LocalTransaction): Promise<void> {
  try {
    await setDoc(doc(db, 'transactions', tx.id), tx);
  } catch (err) {
    console.error('Failed to sync transaction to Firestore:', err);
  }
}

/**
 * Save updated admin vault state to Firestore
 */
export async function syncVaultToCloud(vault: AdminVault): Promise<void> {
  try {
    await setDoc(doc(db, 'admin_vault', 'central'), vault, { merge: true });
  } catch (err) {
    console.error('Failed to sync vault to Firestore:', err);
  }
}

/**
 * Atomic batch update for a money transfer between two community members
 */
export async function syncTransferBatchToCloud(params: {
  sender: CommunityUser;
  recipient: CommunityUser;
  admin: CommunityUser;
  adminVault: AdminVault;
  transaction: LocalTransaction;
  allSenderIds?: string[];
  allRecipientIds?: string[];
}): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', params.sender.id), params.sender, { merge: true });
    if (params.allSenderIds) {
      params.allSenderIds.forEach((sId) => {
        if (sId !== params.sender.id) {
          batch.set(doc(db, 'users', sId), { ...params.sender, id: sId }, { merge: true });
        }
      });
    }

    batch.set(doc(db, 'users', params.recipient.id), params.recipient, { merge: true });
    if (params.allRecipientIds) {
      params.allRecipientIds.forEach((rId) => {
        if (rId !== params.recipient.id) {
          batch.set(doc(db, 'users', rId), { ...params.recipient, id: rId }, { merge: true });
        }
      });
    }

    batch.set(doc(db, 'users', params.admin.id), params.admin, { merge: true });
    batch.set(doc(db, 'admin_vault', 'central'), params.adminVault, { merge: true });
    batch.set(doc(db, 'transactions', params.transaction.id), params.transaction);
    await batch.commit();
  } catch (err) {
    console.error('Failed to sync transfer batch to Firestore:', err);
  }
}

/**
 * Atomic batch update for cash supply/withdraw by admin
 */
export async function syncAdminCashActionToCloud(params: {
  targetUser: CommunityUser;
  adminVault: AdminVault;
  transaction: LocalTransaction;
  allTargetIds?: string[];
}): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', params.targetUser.id), params.targetUser, { merge: true });
    if (params.allTargetIds) {
      params.allTargetIds.forEach((tId) => {
        if (tId !== params.targetUser.id) {
          batch.set(doc(db, 'users', tId), { ...params.targetUser, id: tId }, { merge: true });
        }
      });
    }
    batch.set(doc(db, 'admin_vault', 'central'), params.adminVault, { merge: true });
    batch.set(doc(db, 'transactions', params.transaction.id), params.transaction);
    await batch.commit();
  } catch (err) {
    console.error('Failed to sync cash action batch to Firestore:', err);
  }
}

/**
 * Direct fetch all users without waiting for snapshot (used for polling & visibility change)
 */
export async function fetchAllUsersNow(): Promise<CommunityUser[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (snap.empty) return [];
    const list: CommunityUser[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as CommunityUser), id: d.id });
    });
    return list;
  } catch (e) {
    console.warn('fetchAllUsersNow error:', e);
    return [];
  }
}

/**
 * Direct fetch all transactions without waiting for snapshot
 */
export async function fetchAllTransactionsNow(): Promise<LocalTransaction[]> {
  try {
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(150));
    const snap = await getDocs(q);
    if (snap.empty) return [];
    const list: LocalTransaction[] = [];
    snap.forEach((d) => {
      list.push(d.data() as LocalTransaction);
    });
    return list;
  } catch (e) {
    console.warn('fetchAllTransactionsNow error:', e);
    return [];
  }
}

/**
 * Direct fetch admin vault
 */
export async function fetchVaultNow(): Promise<AdminVault | null> {
  try {
    const snap = await getDoc(doc(db, 'admin_vault', 'central'));
    if (!snap.exists()) return null;
    return snap.data() as AdminVault;
  } catch (e) {
    console.warn('fetchVaultNow error:', e);
    return null;
  }
}
