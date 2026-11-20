import type { User } from '../../types';
import { auth } from './localAuth';
const api = () => {
  if (!window.omsDesktop) throw new Error('Local desktop storage is unavailable');
  return window.omsDesktop;
};
const report = (error: any) => { console.error(error); window.alert(`تعذر حفظ أو قراءة البيانات المحلية: ${error.message}`); };
export const subscribeToCollection = <T,>(collection: string, setter: (data: T[]) => void, orderField?: string) => {
  let live = true;
  let generation = 0;
  const refresh = async () => {
    const current = ++generation;
    try { const data = await api().call('list', collection, orderField); if (live && current === generation) setter(data); }
    catch (error) { if (live) report(error); }
  };
  const unsubscribe = api().onChanged(changed => { if (changed === collection) void refresh(); });
  void refresh();
  return () => { live = false; unsubscribe(); };
};
export const getActiveUserId = (id?: string) => auth.currentUser?.uid || id || 'local-admin';
export const createItem = (collection: string, payload: any) => api().call('create', collection, { ...payload, userId: getActiveUserId(payload?.userId) }).catch(error => { report(error); throw error; });
export const updateItem = (collection: string, id: string, payload: any) => api().call('update', collection, id, payload).catch(error => { report(error); throw error; });
export const deleteItem = (collection: string, id: string) => api().call('delete', collection, id).catch(error => { report(error); throw error; });
const service = (collection: string) => ({
  add: (payload: any) => createItem(collection, payload),
  update: (id: string, payload: any) => updateItem(collection, id, payload),
  delete: (id: string) => deleteItem(collection, id)
});
export const ProductService = service('products');
export const OrderService = service('orders');
export const CustomerService = service('customers');
export const ExpenseService = service('expenses');
export const SupplierService = service('suppliers');
export const DriverService = service('drivers');
export const DeliveryService = service('deliveries');
export const PurchaseOrderService = service('purchase_orders');
export const RequestService = service('requests');
export const RepairService = service('repairs');
export const QuotationService = service('quotations');
export const KitchenContractService = service('contracts');
export const NotificationService = service('notifications');
export const UserService = {
  ...service('users'),
  add: async (user: any) => {
    if (user.uid && await api().call('get', 'users', user.uid)) return updateItem('users', user.uid, user);
    return createItem('users', user);
  },
  getProfile: (id: string): Promise<User | null> => api().call('get', 'users', id)
};
const listeners = new Set<(user: any) => void>();
let authRevision = 0;
const asAuthUser = (user: any) => user ? { uid: user.id, email: user.email, displayName: user.name } : null;
const notify = (user: any) => {
  authRevision++;
  auth.currentUser = asAuthUser(user);
  for (const callback of Array.from(listeners)) {
    try {
      const res: any = callback(auth.currentUser);
      if (res && typeof res.catch === 'function') {
        res.catch((err: any) => report(err));
      }
    } catch (error) {
      report(error);
    }
  }
  return { user: auth.currentUser };
};
export const authService = {
  login: async (email: string, password: string) => {
    const user = await api().call('login', email, password);
    if (user && user.id) {
      try { localStorage.setItem('oms_local_session_uid', user.id); } catch {}
    }
    return notify(user);
  },
  loginWithPin: async (pin: string) => {
    const user = await api().call('loginPin', pin);
    if (user && user.id) {
      try { localStorage.setItem('oms_local_session_uid', user.id); } catch {}
    }
    notify(user);
    return user;
  },
  register: async (_email: string, _password: string): Promise<any> => { throw new Error('أضف المستخدمين من شاشة إدارة المستخدمين في النسخة المحلية.'); },
  logout: async () => {
    try { localStorage.removeItem('oms_local_session_uid'); } catch {}
    await api().call('logout');
    notify(null);
  },
  signInAnonymously: async (): Promise<any> => { throw new Error('تسجيل الدخول مطلوب عبر اسم المستخدم أو كلمة المرور أو رمز PIN.'); },
  ensureAuth: async () => auth.currentUser,
  sendPasswordResetEmail: async (_email: string) => { throw new Error('استعادة البريد غير متاحة دون إنترنت. يستطيع مدير الجهاز تعديل بيانات المستخدم محليًا.'); },
  onAuthStateChanged: (callback: (user: any) => void) => {
    let live = true;
    const revision = authRevision;
    listeners.add(callback);
    // Require login on app launch for maximum security
    api().call('session', null).then(user => {
      if (live && revision === authRevision) { auth.currentUser = asAuthUser(user); callback(auth.currentUser); }
    }).catch(report);
    return () => { live = false; listeners.delete(callback); };
  }
};
export const uploadFile = (file: File, _feature?: string, _id?: string): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});
export const getSignedUrl = async (value: string | null | undefined) => value || null;
export const deleteFile = async (_path: string) => {};
