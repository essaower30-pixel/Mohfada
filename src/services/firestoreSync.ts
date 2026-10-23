import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  CommunityUser,
  AdminVault,
  LocalTransaction,
} from '../types/wallet';

type UsersCallback = (users: CommunityUser[]) => void;
type TransactionsCallback = (txs: LocalTransaction[]) => void;
type VaultCallback = (vault: AdminVault) => void;

let unsubUsers: (() => void) | null = null;
let unsubTxs: (() => void) | null = null;
let unsubVault: (() => void) | null = null;

export function startUsersRealtimeSync(callback: UsersCallback): () => void {
  if (unsubUsers) unsubUsers();

  const usersCol = collection(db, 'users');
  unsubUsers = onSnapshot(
    usersCol,
    (snapshot) => {
      if (snapshot.empty) return;
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
    (err) => console.warn('Users realtime sync notice:', err.message)
  );
  return () => {
    if (unsubUsers) unsubUsers();
  };
}

export function startTransactionsRealtimeSync(callback: TransactionsCallback): () => void {
  if (unsubTxs) unsubTxs();

  const txsCol = collection(db, 'transactions');
  unsubTxs = onSnapshot(
    txsCol,
    (snapshot) => {
      if (snapshot.empty) return;
      const liveTxs: LocalTransaction[] = [];
      snapshot.forEach((d) => {
        liveTxs.push(d.data() as LocalTransaction);
      });
      callback(liveTxs);
    },
    (err) => console.warn('Transactions sync notice:', err.message)
  );
  return () => {
    if (unsubTxs) unsubTxs();
  };
}

export function startVaultRealtimeSync(callback: VaultCallback): () => void {
  if (unsubVault) unsubVault();

  const vaultDocRef = doc(db, 'admin_vault', 'main');
  unsubVault = onSnapshot(
    vaultDocRef,
    (snapshot) => {
      if (!snapshot.exists()) return;
      callback(snapshot.data() as AdminVault);
    },
    (err) => console.warn('Vault sync notice:', err.message)
  );
  return () => {
    if (unsubVault) unsubVault();
  };
}

export async function fetchAllUsersNow(): Promise<CommunityUser[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: CommunityUser[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as CommunityUser), id: d.id });
    });
    return list;
  } catch {
    return [];
  }
}

export async function fetchAllTransactionsNow(): Promise<LocalTransaction[]> {
  try {
    const snap = await getDocs(collection(db, 'transactions'));
    const list: LocalTransaction[] = [];
    snap.forEach((d) => list.push(d.data() as LocalTransaction));
    return list;
  } catch {
    return [];
  }
}

export async function fetchVaultNow(): Promise<AdminVault | null> {
  try {
    const snap = await getDoc(doc(db, 'admin_vault', 'main'));
    if (snap.exists()) {
      return snap.data() as AdminVault;
    }
    return null;
  } catch {
    return null;
  }
}

export async function syncUserToCloud(user: CommunityUser): Promise<void> {
  try {
    const cleanUser = { ...user };
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(userDocRef, cleanUser, { merge: true });
  } catch (e) {
    console.warn('Failed to sync user to cloud:', e);
  }
}

export async function syncTransactionToCloud(tx: LocalTransaction): Promise<void> {
  try {
    const txDocRef = doc(db, 'transactions', tx.id);
    await setDoc(txDocRef, tx);
  } catch (e) {
    console.warn('Failed to sync transaction to cloud:', e);
  }
}

export async function syncVaultToCloud(vault: AdminVault): Promise<void> {
  try {
    const vaultDocRef = doc(db, 'admin_vault', 'main');
    await setDoc(vaultDocRef, vault, { merge: true });
  } catch (e) {
    console.warn('Failed to sync vault to cloud:', e);
  }
}

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

    const senderIds = params.allSenderIds?.length ? params.allSenderIds : [params.sender.id];
    senderIds.forEach((sid) => {
      batch.set(doc(db, 'users', sid), { balance: params.sender.balance }, { merge: true });
    });

    const recipientIds = params.allRecipientIds?.length ? params.allRecipientIds : [params.recipient.id];
    recipientIds.forEach((rid) => {
      batch.set(doc(db, 'users', rid), { balance: params.recipient.balance }, { merge: true });
    });

    batch.set(doc(db, 'users', params.admin.id), { balance: params.admin.balance }, { merge: true });
    batch.set(doc(db, 'admin_vault', 'main'), params.adminVault, { merge: true });
    batch.set(doc(db, 'transactions', params.transaction.id), params.transaction);

    await batch.commit();
  } catch (e) {
    console.warn('Batch transfer cloud sync error:', e);
  }
}

export async function syncAdminCashActionToCloud(params: {
  targetUser: CommunityUser;
  adminVault: AdminVault;
  transaction: LocalTransaction;
}): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', params.targetUser.id), { balance: params.targetUser.balance }, { merge: true });
    batch.set(doc(db, 'admin_vault', 'main'), params.adminVault, { merge: true });
    batch.set(doc(db, 'transactions', params.transaction.id), params.transaction);
    await batch.commit();
  } catch (e) {
    console.warn('Admin cash action cloud sync error:', e);
  }
}
