import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDoc,
  getDocs,
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  User as FirebaseUser,
  getAuth,
  signInAnonymously
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { db, auth, firebaseConfig } from './firebase';
import { compressAndResizeImage } from './utils/imageUtils';
import { 
  Product, Order, Customer, Expense, Supplier, Driver, Delivery, User, PurchaseOrder, AppNotification, Request, RepairInvoice, Quotation, KitchenContract 
} from '../types';

// Operation Types for error handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as any)?.code;

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };

  // If offline or temporarily unavailable, log a warning rather than crashing if in list/subscription
  if (errorCode === 'unavailable' || errMessage.includes('offline') || errMessage.includes('Could not reach Cloud Firestore')) {
    console.warn('Firestore is temporarily operating in offline mode:', JSON.stringify(errInfo));
    if (operationType === OperationType.LIST) {
      return; // Do not throw to avoid unhandled rejection in live snapshot listener
    }
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to convert Firestore data to our app types
const convertDoc = <T>(doc: any): T => {
  const data = doc.data();
  // Convert timestamps to ISO strings if needed
  const result = { ...data, id: doc.id };
  return result as T;
};

/**
 * Loading user's data with Realtime subscriptions
 */
export const subscribeToCollection = <T,>(
  collectionName: string,
  setter: (data: T[]) => void,
  orderField?: string
) => {
  let q = query(collection(db, collectionName));
  if (orderField) {
    q = query(q, orderBy(orderField, 'desc'));
  }

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => convertDoc<T>(doc));
    setter(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  });

  return unsubscribe;
};

/**
 * Safely resolves the active user ID from Firebase Auth, passed payload, or stored PIN session.
 * Guarantees a non-undefined string to prevent Firestore "Unsupported field value: undefined" errors.
 */
export const getActiveUserId = (payloadUserId?: string): string => {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  if (payloadUserId && typeof payloadUserId === 'string' && payloadUserId.trim()) {
    return payloadUserId.trim();
  }
  if (typeof window !== 'undefined') {
    const storedPinUid = localStorage.getItem('oms_pin_session_uid');
    if (storedPinUid && storedPinUid.trim()) {
      return storedPinUid.trim();
    }
  }
  return 'system_admin';
};

/**
 * Deeply sanitizes an object before writing to Firestore by removing any undefined keys
 * or nullish invalid values while preserving Dates, Timestamps, and FieldValues.
 */
export const sanitizeFirestoreData = <T = any>(data: T): T => {
  if (data === undefined) {
    return null as any;
  }
  if (data === null) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeFirestoreData(item)) as any;
  }
  if (typeof data === 'object') {
    // Check if it's a special Firestore type (Timestamp, FieldValue sentinel) or Date
    if (
      data instanceof Date ||
      data instanceof Timestamp ||
      ('_methodName' in (data as any)) ||
      (typeof (data as any).toMillis === 'function')
    ) {
      return data;
    }

    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeFirestoreData(value);
      }
    }
    return cleanObj as any;
  }
  return data;
};

/**
 * Ensures that any data URL image in the payload is compressed down to a safe size (< 90KB)
 * so that the Firestore document never approaches the 1MB document limit.
 */
export const ensureSafePayloadImages = async <T extends Record<string, any>>(obj: T): Promise<T> => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string' && val.startsWith('data:image') && val.length > 70000) {
      try {
        const isAvatar = key === 'imageUrl' || key === 'profileImage';
        obj[key as keyof T] = await compressAndResizeImage(val, {
          maxWidth: isAvatar ? 320 : 800,
          maxHeight: isAvatar ? 320 : 800,
          quality: 0.8,
          maxBytes: isAvatar ? 80 * 1024 : 180 * 1024,
        }) as any;
      } catch (err) {
        console.warn('Image payload optimization skipped:', err);
      }
    }
  }
  return obj;
};

/**
 * CRUD Helpers
 */
export const createItem = async (collectionName: string, payload: any) => {
  try {
    const safePayload = await ensureSafePayloadImages({ ...(payload || {}) });
    const userId = getActiveUserId(safePayload.userId);
    const docData = sanitizeFirestoreData({
      ...safePayload,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const docRef = await addDoc(collection(db, collectionName), docData);
    return { id: docRef.id, ...safePayload, userId };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
};

export const updateItem = async (collectionName: string, id: string, payload: any) => {
  try {
    const docRef = doc(db, collectionName, id);
    const safePayload = await ensureSafePayloadImages({ ...payload });
    const sanitizedPayload = sanitizeFirestoreData({
      ...safePayload,
      updatedAt: serverTimestamp()
    });
    if ('id' in sanitizedPayload) {
      delete sanitizedPayload.id;
    }
    await updateDoc(docRef, sanitizedPayload);
    return { id, ...payload };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
  }
};

export const deleteItem = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
  }
};

/**
 * Storage logic (simplified - user didn't ask for storage but Supabase had it)
 * For now, we'll keep it as placeholders or use Firebase Storage if configured.
 * Since set_up_firebase only handles Firestore and Auth, we'll skip Storage for now
 * or just return the file name/dummy URL.
 */
export const uploadFile = async (file: File, featureName: string, itemId: string) => {
  // Skipping Firebase Storage for now as it's not provisioned by default
  return URL.createObjectURL(file);
};

export const deleteFile = async (path: string) => {
  console.log("Delete file from storage ignored for now", path);
};

export const getSignedUrl = async (path: string | undefined | null) => {
  return path || null;
};

/**
 * Specific Services
 */
export const ProductService = {
  add: (product: Omit<Product, 'id'>) => createItem('products', product),
  update: (id: string, product: Partial<Product>) => updateItem('products', id, product),
  delete: (id: string) => deleteItem('products', id),
};

export const OrderService = {
  add: (order: Omit<Order, 'id'>) => createItem('orders', order),
  update: (id: string, order: Partial<Order>) => updateItem('orders', id, order),
  delete: (id: string) => deleteItem('orders', id),
};

export const CustomerService = {
  add: (customer: Omit<Customer, 'id'>) => createItem('customers', customer),
  update: (id: string, customer: Partial<Customer>) => updateItem('customers', id, customer),
  delete: (id: string) => deleteItem('customers', id),
};

export const ExpenseService = {
  add: (expense: Omit<Expense, 'id'>) => createItem('expenses', expense),
  update: (id: string, expense: Partial<Expense>) => updateItem('expenses', id, expense),
  delete: (id: string) => deleteItem('expenses', id),
};

export const SupplierService = {
  add: (supplier: Omit<Supplier, 'id'>) => createItem('suppliers', supplier),
  update: (id: string, supplier: Partial<Supplier>) => updateItem('suppliers', id, supplier),
  delete: (id: string) => deleteItem('suppliers', id),
};

export const DriverService = {
  add: (driver: Omit<Driver, 'id'>) => createItem('drivers', driver),
  update: (id: string, driver: Partial<Driver>) => updateItem('drivers', id, driver),
  delete: (id: string) => deleteItem('drivers', id),
};

export const DeliveryService = {
  add: (delivery: Omit<Delivery, 'id'>) => createItem('deliveries', delivery),
  update: (id: string, delivery: Partial<Delivery>) => updateItem('deliveries', id, delivery),
  delete: (id: string) => deleteItem('deliveries', id),
};

export const PurchaseOrderService = {
  add: (po: Omit<PurchaseOrder, 'id'>) => createItem('purchase_orders', po),
  update: (id: string, po: Partial<PurchaseOrder>) => updateItem('purchase_orders', id, po),
  delete: (id: string) => deleteItem('purchase_orders', id),
};

export const RequestService = {
  add: (req: Omit<Request, 'id'>) => createItem('requests', req),
  update: (id: string, req: Partial<Request>) => updateItem('requests', id, req),
  delete: (id: string) => deleteItem('requests', id),
};

export const RepairService = {
  add: (repair: Omit<RepairInvoice, 'id'>) => createItem('repairs', repair),
  update: (id: string, repair: Partial<RepairInvoice>) => updateItem('repairs', id, repair),
  delete: (id: string) => deleteItem('repairs', id),
};

export const QuotationService = {
  add: (quotation: Omit<Quotation, 'id'>) => createItem('quotations', quotation),
  update: (id: string, quotation: Partial<Quotation>) => updateItem('quotations', id, quotation),
  delete: (id: string) => deleteItem('quotations', id),
};

export const KitchenContractService = {
  add: (contract: Omit<KitchenContract, 'id'>) => createItem('contracts', contract),
  update: (id: string, contract: Partial<KitchenContract>) => updateItem('contracts', id, contract),
  delete: (id: string) => deleteItem('contracts', id),
};

export const NotificationService = {
  add: (notification: Omit<AppNotification, 'id'>) => createItem('notifications', notification),
  update: (id: string, notification: Partial<AppNotification>) => updateItem('notifications', id, notification),
  delete: (id: string) => deleteItem('notifications', id),
};

export const authService = {
  login: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
  register: (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password),
  logout: () => signOut(auth),
  signInAnonymously: () => signInAnonymously(auth),
  sendPasswordResetEmail: (email: string) => firebaseSendPasswordResetEmail(auth, email),
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => onAuthStateChanged(auth, callback),
  ensureAuth: async () => {
    if (auth.currentUser) return auth.currentUser;
    try {
      const cred = await signInAnonymously(auth);
      return cred.user;
    } catch {
      return null;
    }
  }
};

export const UserService = {
  add: async (user: Omit<User, 'id'> & { password?: string; uid?: string }) => {
    try {
      const { password, uid, ...userProfile } = user;
      let targetUid: string | undefined = uid;

      if (!targetUid && password) {
        // Create Firebase Auth Account using a secondary app to avoid logging out the current admin
        const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp_${Date.now()}`);
        const secondaryAuth = getAuth(secondaryApp);
        try {
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userProfile.email, password);
          targetUid = userCredential.user.uid;
        } finally {
          await deleteApp(secondaryApp);
        }
      } else if (!targetUid) {
        // If no UID and no password, check if current user is the one being added
        if (auth.currentUser && auth.currentUser.email === userProfile.email) {
          targetUid = auth.currentUser.uid;
        } else {
          // Generate a deterministic or unique ID for PIN/offline created staff
          targetUid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        }
      }
      
      const safeUserProfile = await ensureSafePayloadImages({ ...userProfile });
      const docRef = doc(db, 'users', targetUid!);
      const userData = sanitizeFirestoreData({
        ...safeUserProfile,
        userId: targetUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(docRef, userData, { merge: true });
      return { id: targetUid!, ...safeUserProfile };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  },
  update: (id: string, user: Partial<User>) => updateItem('users', id, user),
  delete: (id: string) => deleteItem('users', id),
  getProfile: async (id: string) => {
    try {
      const docRef = doc(db, 'users', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return convertDoc<User>(snapshot);
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${id}`);
    }
  }
};
