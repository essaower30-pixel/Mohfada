import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with auto-detect long polling so it does not hang or time out on mobile networks/proxies
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  // If already initialized (e.g. during module reload), retrieve existing instance
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };

  // Only throw for permission/auth violations as required by security guidelines;
  // handle offline/network connection drops gracefully without breaking application runtime
  if (errMsg.includes('permission') || errMsg.includes('PERMISSION_DENIED')) {
    console.error('Firestore Security Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.warn('Firestore Operation Notification (operating in local/offline cache):', errMsg);
  }
}

// Test connection on boot as mandated by Firebase Integration guidelines
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    // 5-second race timeout to prevent hanging when mobile network latency is high
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('connection timeout')), 5000)
    );
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      timeoutPromise,
    ]);
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('the client is offline') ||
        error.message.includes('timeout') ||
        error.message.includes('Could not reach Cloud Firestore'))
    ) {
      console.warn('Firebase client is operating in local cache / offline mode.');
    }
    return false;
  }
}
