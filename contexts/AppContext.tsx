import React, { createContext, useState, useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Product, Order, Customer, Expense, Supplier, Employee, Delivery, User, Driver, PurchaseOrder, Screen, AppNotification, OrderItem, PurchaseOrderItem, Request, UserRole, RepairInvoice, Quotation, QuotationItem, KitchenContract
} from '../types';
import { ROLE_PERMISSIONS, mockProducts } from '../constants';
import { 
  subscribeToCollection, 
  ProductService, 
  OrderService, 
  CustomerService, 
  ExpenseService, 
  SupplierService, 
  DriverService, 
  DeliveryService, 
  PurchaseOrderService,
  RequestService,
  RepairService,
  QuotationService,
  KitchenContractService,
  NotificationService,
  UserService,
  authService
} from '../src/firebaseService';
import { auth } from '../src/firebase';
import { compressAndResizeImage } from '../src/utils/imageUtils';

interface AppContextType {
  // State
  isLoading: boolean;
  currentUser: User | null;
  view: 'website' | 'oms';
  activeScreen: Screen;
  selectedItemId: string | null;
  globalSearchQuery: string;
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  products: Product[];
  orders: Order[];
  customers: Customer[];
  expenses: Expense[];
  suppliers: Supplier[];
  employees: Employee[];
  drivers: Driver[];
  deliveries: Delivery[];
  users: User[];
  purchaseOrders: PurchaseOrder[];
  notifications: AppNotification[];
  requests: Request[];
  repairs: RepairInvoice[];
  quotations: Quotation[];
  contracts: KitchenContract[];
  
  // Actions
  setView: (view: 'website' | 'oms') => void;
  setActiveScreen: (screen: Screen) => void;
  setSelectedItemId: (id: string | null) => void;
  setGlobalSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  
  // Auth
  login: (email: string, password: string) => Promise<any>;
  loginWithPin: (pin: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<any>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  
  // Data mutations
  addOrder: (newOrderData: Omit<Order, 'id' | 'orderNumber' | 'status'>, deliveryOption: 'none' | 'charge' | 'free', creatingFromRequestId?: string) => Promise<string | void>;
  updateOrder: (orderId: string, updatedOrderData: Omit<Order, 'id' | 'orderNumber' | 'status'>, originalOrderItems: OrderItem[]) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  addProduct: (newProductData: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (productId: string, updatedProductData: Partial<Omit<Product, 'id'>>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleProductStatus: (productId: string) => Promise<void>;
  addCustomer: (newCustomerData: Omit<Customer, 'id' | 'joinDate'>) => Promise<string | void>;
  updateCustomer: (customerId: string, updatedCustomerData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  addExpense: (newExpenseData: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (expenseId: string, updatedExpenseData: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  addSupplier: (newSupplierData: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (supplierId: string, updatedSupplierData: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  addDelivery: (orderId: string, driverId?: string, customAddress?: string, notes?: string) => Promise<void>;
  updateDelivery: (deliveryId: string, updatedData: Partial<Delivery>) => Promise<void>;
  updateDeliveryStatus: (deliveryId: string, status: Delivery['status']) => Promise<void>;
  deleteDelivery: (deliveryId: string) => Promise<void>;
  addDriver: (name: string, phone?: string, vehicle?: string) => Promise<void>;
  deleteDriver: (driverId: string) => Promise<void>;
  importCustomers: (newCustomers: Omit<Customer, 'id' | 'joinDate'>[]) => Promise<void>;
  importProducts: (newProducts: Omit<Product, 'id' | 'status'>[]) => Promise<void>;
  addUser: (newUserData: Omit<User, 'id'> & { password?: string }) => Promise<void>;
  updateUser: (userId: string, updatedUserData: Partial<Omit<User, 'id'>>) => Promise<void>;
  uploadProfilePicture: (userId: string, file: File) => Promise<string>;
  uploadProductImage: (file: File, productId?: string) => Promise<string>;
  deleteUser: (userId: string) => Promise<void>;
  addPurchaseOrder: (newPOData: Omit<PurchaseOrder, 'id' | 'poNumber'>) => Promise<void>;
  receivePurchaseOrder: (orderId: string) => Promise<void>;
  addNotification: (messageKey: string, screen: Screen, messageParams?: { [key: string]: string | number }, relatedId?: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  addRequest: (requestData: Omit<Request, 'id' | 'date' | 'status'>) => Promise<void>;
  updateRequestStatus: (requestId: string, status: Request['status']) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
  updateRequest: (requestId: string, updatedData: Partial<Request>) => Promise<void>;
  addRepair: (repairData: Omit<RepairInvoice, 'id' | 'repairNumber'>) => Promise<void>;
  updateRepairStatus: (repairId: string, status: RepairInvoice['status']) => Promise<void>;
  deleteRepair: (repairId: string) => Promise<void>;
  updateRepair: (repairId: string, updatedData: Partial<RepairInvoice>) => Promise<void>;
  addQuotation: (quotationData: Omit<Quotation, 'id'>) => Promise<string | void>;
  updateQuotation: (quotationId: string, updatedData: Partial<Quotation>) => Promise<void>;
  updateQuotationStatus: (quotationId: string, status: Quotation['status']) => Promise<void>;
  deleteQuotation: (quotationId: string) => Promise<void>;
  convertQuotationToOrder: (quotationId: string, deliveryOption?: 'none' | 'charge' | 'free') => Promise<string | void>;
  addContract: (contractData: Omit<KitchenContract, 'id' | 'contractNumber' | 'paidAmount' | 'remainingAmount'>) => Promise<string | void>;
  updateContract: (contractId: string, updatedData: Partial<KitchenContract>) => Promise<void>;
  deleteContract: (contractId: string) => Promise<void>;
  recordMilestonePayment: (contractId: string, milestoneId: string, paymentMethod: 'Cash' | 'Card' | 'BenefitPay' | 'BankTransfer', notes?: string) => Promise<void>;
  updateCustomerLoyalty: (customerId: string, pointsDelta: number) => Promise<void>;
  hasPermission: (screen: Screen) => boolean;
  isAdmin: () => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 9);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock initial data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([{ id: 'd1', name: 'Alaa' }, { id: 'd2', name: 'Hassan' }]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [repairs, setRepairs] = useState<RepairInvoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  const [view, setView] = useState<'website' | 'oms'>('website');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [contracts, setContracts] = useState<KitchenContract[]>([]);

  const sessionGenerationRef = useRef(0);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const handleSession = async (firebaseUser: any) => {
        const currentGen = ++sessionGenerationRef.current;
        const isDesktop = typeof window !== 'undefined' && Boolean((window as any).omsDesktop);
        const pinSessionUid = isDesktop ? null : localStorage.getItem('oms_pin_session_uid');

        if (!firebaseUser && !pinSessionUid) {
            setCurrentUser(null);
            setView('website');
            setIsLoading(false);
            unsubs.forEach(unsub => { if (unsub) unsub(); });
            unsubs = [];
            if (isDesktop) {
                setProducts([]);
                setOrders([]);
                setCustomers([]);
                setExpenses([]);
                setSuppliers([]);
                setDrivers([]);
                setDeliveries([]);
                setUsers([]);
                setPurchaseOrders([]);
                setNotifications([]);
                setRequests([]);
                setRepairs([]);
                setQuotations([]);
                setContracts([]);
            } else {
                unsubs.push(subscribeToCollection<Product>('products', setProducts, 'createdAt'));
            }
            return;
        }

        try {
            // Unsubscribe existing
            unsubs.forEach(unsub => { if (unsub) unsub(); });
            unsubs = [];

            const guarded = <T,>(setter: (data: T) => void) => (data: T) => {
                if (currentGen === sessionGenerationRef.current) {
                    setter(data);
                }
            };

            // subscribe to normal things
            unsubs.push(subscribeToCollection<Product>('products', guarded(setProducts), 'createdAt'));
            unsubs.push(subscribeToCollection<Order>('orders', guarded(setOrders), 'date'));
            unsubs.push(subscribeToCollection<Customer>('customers', guarded(setCustomers), 'joinDate'));
            unsubs.push(subscribeToCollection<Expense>('expenses', guarded(setExpenses), 'date'));
            unsubs.push(subscribeToCollection<Supplier>('suppliers', guarded(setSuppliers)));
            unsubs.push(subscribeToCollection<Driver>('drivers', guarded(setDrivers)));
            unsubs.push(subscribeToCollection<Delivery>('deliveries', guarded(setDeliveries)));
            unsubs.push(subscribeToCollection<PurchaseOrder>('purchase_orders', guarded(setPurchaseOrders as any), 'date'));
            unsubs.push(subscribeToCollection<Request>('requests', guarded(setRequests), 'date'));
            unsubs.push(subscribeToCollection<RepairInvoice>('repairs', guarded(setRepairs), 'date'));
            unsubs.push(subscribeToCollection<Quotation>('quotations', guarded(setQuotations), 'date'));
            unsubs.push(subscribeToCollection<KitchenContract>('contracts', guarded(setContracts), 'contractDate'));
            unsubs.push(subscribeToCollection<AppNotification>('notifications', guarded(setNotifications), 'date'));
            unsubs.push(subscribeToCollection<User>('users', guarded(setUsers)));

            // Fetch the logged-in user's profile
            const activeUid = firebaseUser ? firebaseUser.uid : pinSessionUid;
            let profile = activeUid ? await UserService.getProfile(activeUid) : null;

            if (currentGen !== sessionGenerationRef.current) {
                unsubs.forEach(unsub => { if (unsub) unsub(); });
                unsubs = [];
                return;
            }
            
            if (!profile && firebaseUser && !isDesktop) {
                // Auto-create profile if it doesn't exist on web
                console.log("No profile found, creating one for:", firebaseUser.uid);
                const newProfile = {
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    email: firebaseUser.email || '',
                    role: 'Admin', 
                    permissions: ROLE_PERMISSIONS['Admin'],
                    status: 'Active'
                };
                await UserService.add(newProfile as any);
                
                // Fetch again
                profile = await UserService.getProfile(firebaseUser.uid);
            } else if (!profile && pinSessionUid && !isDesktop) {
                // Auto-create or fallback profile for PIN user session
                const isMaster = pinSessionUid === 'admin_pin_user';
                const defaultPinProfile = {
                    uid: pinSessionUid,
                    name: isMaster ? 'Master Admin' : 'Staff User',
                    email: isMaster ? 'admin@modernhouse.bh' : 'staff@modernhouse.bh',
                    role: 'Admin',
                    permissions: ROLE_PERMISSIONS['Admin'],
                    status: 'Active',
                    pin: '1234'
                };
                try {
                    await UserService.add(defaultPinProfile as any);
                    profile = await UserService.getProfile(pinSessionUid);
                } catch {
                    profile = { id: pinSessionUid, ...defaultPinProfile } as any;
                }
            }

            if (currentGen !== sessionGenerationRef.current) {
                unsubs.forEach(unsub => { if (unsub) unsub(); });
                unsubs = [];
                return;
            }

            if (profile) {
                setCurrentUser({
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    role: (profile.role as any) || 'Admin',
                    permissions: (() => {
                        const userRole = ((profile as any).role || 'Admin') as UserRole;
                        const defaultPerms = ROLE_PERMISSIONS[userRole] || [];
                        const userPerms = (profile as any).permissions || defaultPerms;
                        return Array.from(new Set([...userPerms, ...defaultPerms]));
                    })(),
                    status: (profile as any).status || 'Active',
                    imageUrl: (profile as any).imageUrl,
                    pin: (profile as any).pin
                });
                setView('oms');
            } else if (isDesktop) {
                setCurrentUser(null);
                unsubs.forEach(unsub => { if (unsub) unsub(); });
                unsubs = [];
            }
        } catch (err) {
            console.error("Session handling error", err);
        } finally {
            if (currentGen === sessionGenerationRef.current) {
                setIsLoading(false);
            }
        }
    };

    const unsubAuth = authService.onAuthStateChanged(handleSession);

    return () => {
        sessionGenerationRef.current++;
        unsubAuth();
        unsubs.forEach(unsub => { if (unsub) unsub(); });
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      return await authService.login(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPin = async (pin: string): Promise<User> => {
    const cleanPin = pin.trim();
    if (!cleanPin) {
      throw new Error("PIN code is required");
    }

    if (window.omsDesktop) {
      const { authService: localAuthService } = await import('../src/desktop/localService');
      return localAuthService.loginWithPin(cleanPin);
    }

    // Try background Firebase Auth session
    authService.ensureAuth().catch(() => {});

    // Look for matching user in loaded users list
    let matchedUser = users.find(u => u.pin === cleanPin && u.status === 'Active');
    
    // If users list might not be populated or offline fallback for default PIN '1234'
    if (!matchedUser && cleanPin === '1234') {
      matchedUser = users.find(u => u.status === 'Active') || {
        id: 'admin_pin_user',
        name: 'Master Admin',
        email: 'admin@modernhouse.bh',
        role: 'Admin',
        permissions: ROLE_PERMISSIONS['Admin'],
        status: 'Active',
        pin: '1234'
      };
    }

    if (!matchedUser) {
      throw new Error("Invalid PIN code. Please try again.");
    }

    const defaultPerms = ROLE_PERMISSIONS[matchedUser.role] || [];
    const mergedPermissions = Array.from(new Set([...(matchedUser.permissions || defaultPerms), ...defaultPerms]));

    const authenticatedUser: User = {
      ...matchedUser,
      permissions: mergedPermissions
    };

    setCurrentUser(authenticatedUser);
    setView('oms');
    localStorage.setItem('oms_pin_session_uid', authenticatedUser.id);
    return authenticatedUser;
  };

  const logout = async () => {
      sessionGenerationRef.current++;
      localStorage.removeItem('oms_pin_session_uid');
      setCurrentUser(null);
      setView('website');
      const isDesktop = typeof window !== 'undefined' && Boolean((window as any).omsDesktop);
      if (isDesktop) {
          setProducts([]);
          setOrders([]);
          setCustomers([]);
          setExpenses([]);
          setSuppliers([]);
          setDrivers([]);
          setDeliveries([]);
          setUsers([]);
          setPurchaseOrders([]);
          setNotifications([]);
          setRequests([]);
          setRepairs([]);
          setQuotations([]);
          setContracts([]);
      }
      await authService.logout();
  };
  const sendPasswordResetEmail = async (email: string) => {
    await authService.sendPasswordResetEmail(email);
  };
  const register = async (name: string, email: string, password: string) => {
    const cred = await authService.register(email, password);
    if (cred.user) {
      await UserService.add({
        uid: cred.user.uid,
        name,
        email,
        role: 'Admin',
        permissions: ROLE_PERMISSIONS['Admin'],
        status: 'Active'
      } as any);
    }
    return cred;
  };

  const addOrder = async (newOrderData: Omit<Order, 'id' | 'orderNumber' | 'status'>, deliveryOption: 'none' | 'charge' | 'free', creatingFromRequestId?: string) => {
      try {
          if (window.omsDesktop) {
              const savedOrder: Order = await window.omsDesktop.call('saveOrder', newOrderData, {
                  deliveryOption,
                  requestId: creatingFromRequestId
              });
              return savedOrder.id;
          }
          // Sanitize undefined fields for Firestore
          const sanitizedOrderData = Object.fromEntries(
              Object.entries(newOrderData).filter(([_, v]) => v !== undefined)
          );

          // Compute clean sequential order number (ORD-1001, ORD-1002, ...)
          let maxOrderSeq = 1000;
          orders.forEach(o => {
            if (o.orderNumber) {
              const m = String(o.orderNumber).match(/(\d+)/);
              if (m) {
                const n = parseInt(m[1], 10);
                if (n >= maxOrderSeq && n < 999999) maxOrderSeq = n;
              }
            }
          });
          const cleanOrderNumber = newOrderData.orderNumber || `ORD-${maxOrderSeq + 1}`;

          const newOrder = {
              ...sanitizedOrderData,
              orderNumber: cleanOrderNumber,
              status: 'Completed'
          };
          const data = await OrderService.add(newOrder as any); 
          if (!data) throw new Error("Failed to create order in database");
          
          for (const item of newOrderData.items) {
              const product = products.find(p => p.id === item.productId);
              if (product) {
                  const newStock = product.stock - item.quantity;
                  await ProductService.update(product.id, { stock: newStock });
                  
                  if (newStock <= product.lowStockThreshold) {
                      await addNotification(
                          'header.notifications.low_stock_item',
                          'inventory',
                          { name: product.name, stock: newStock.toString() },
                          product.id
                      );
                  }
              }
          }
          
          const customer = customers.find(c => c.id === newOrderData.customerId);
          const notificationParams = { orderNumber: newOrder.orderNumber, customerName: customer?.name || 'Unknown' };
          
          await addNotification(
              'header.notifications.new_order', 
              'orders', 
              notificationParams, 
              data.id
          );

          if (deliveryOption === 'charge' || deliveryOption === 'free') {
              await DeliveryService.add({
                  orderId: data.id,
                  status: 'Pending',
                  customerId: newOrderData.customerId,
                  address: customer?.address || 'Unknown Address'
              } as any);
              
              await addNotification(
                  'header.notifications.new_delivery_request', 
                  'delivery', 
                  notificationParams, 
                  data.id
              );
          }
          
          return data.id;
      } catch (e: any) {
          console.error("Failed to add order", e);
          throw e;
      }
  };

  const updateOrder = async (orderId: string, updatedOrderData: Omit<Order, 'id' | 'orderNumber' | 'status'>, originalOrderItems: OrderItem[]) => {
      try {
          if (window.omsDesktop) {
              await window.omsDesktop.call('saveOrder', updatedOrderData, { id: orderId });
              return;
          }
          // Calculate stock differences
          const stockChanges: Record<string, number> = {};
          
          // Add back original quantities
          for (const origItem of originalOrderItems) {
              stockChanges[origItem.productId] = (stockChanges[origItem.productId] || 0) + origItem.quantity;
          }
          
          // Deduct new quantities
          for (const newItem of updatedOrderData.items) {
              stockChanges[newItem.productId] = (stockChanges[newItem.productId] || 0) - newItem.quantity;
          }
          
          // Apply changes to products
          for (const productId in stockChanges) {
              const diff = stockChanges[productId];
              if (diff !== 0) {
                  const product = products.find(p => p.id === productId);
                  if (product) {
                      const newStock = product.stock + diff;
                      await ProductService.update(productId, { stock: newStock });
                  }
              }
          }
          
          // Sanitize undefined fields for Firestore
          const sanitizedOrderData = Object.fromEntries(
              Object.entries(updatedOrderData).filter(([_, v]) => v !== undefined)
          );
          
          await OrderService.update(orderId, sanitizedOrderData as any);
      } catch (e: any) {
          console.error("Failed to update order", e);
          throw e;
      }
  };

  const deleteOrder = async (orderId: string) => {
      try {
          if (window.omsDesktop) {
              await window.omsDesktop.call('deleteOrder', orderId);
              return;
          }
          const order = orders.find(o => o.id === orderId);
          if (order) {
              for (const item of order.items) {
                  const product = products.find(p => p.id === item.productId);
                  if (product) {
                      const newStock = product.stock + item.quantity;
                      await ProductService.update(product.id, { stock: newStock });
                  }
              }
          }
          await OrderService.delete(orderId);
      } catch (e) {
          console.error("Failed to delete order", e);
          throw e;
      }
  };

  const addProduct = async (newProductData: Omit<Product, 'id'>) => {
      try {
          await ProductService.add(newProductData);
      } catch (e) {
          console.error("Failed to add product", e);
      }
  };
  const updateProduct = async (productId: string, updatedProductData: Partial<Omit<Product, 'id'>>) => {
      try {
          await ProductService.update(productId, updatedProductData);
      } catch (e) {
          console.error("Failed to update product", e);
      }
  };
  const deleteProduct = async (productId: string) => {
      try {
          await ProductService.delete(productId);
      } catch (e) {
          console.error("Failed to delete product", e);
      }
  };
  const toggleProductStatus = async (productId: string) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      try {
          await ProductService.update(productId, { status: product.status === 'Active' ? 'Inactive' : 'Active' });
      } catch (e) {
          console.error("Failed to toggle status", e);
      }
  };
  const addCustomer = async (newCustomerData: Omit<Customer, 'id' | 'joinDate'>) => {
      try {
          const data = await CustomerService.add({ ...newCustomerData, joinDate: new Date().toISOString() } as any);
          setCustomers(prev => [...prev, data]);
          return data.id;
      } catch (e) { console.error("Failed to add customer", e); throw e; }
  };
  const updateCustomer = async (customerId: string, updatedCustomerData: Partial<Customer>) => {
      try {
          await CustomerService.update(customerId, updatedCustomerData);
          setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...updatedCustomerData } : c));
      } catch (e) { console.error("Failed to update customer", e); throw e; }
  };
  const deleteCustomer = async (customerId: string) => {
      try {
          await CustomerService.delete(customerId);
      } catch (e) { console.error("Failed to delete customer", e); throw e; }
  };
  const addExpense = async (newExpenseData: Omit<Expense, 'id'>) => {
      try {
          await ExpenseService.add(newExpenseData as any);
      } catch (e) { console.error("Failed to add expense", e); }
  };
  const updateExpense = async (expenseId: string, updatedExpenseData: Partial<Expense>) => {
      try {
          await ExpenseService.update(expenseId, updatedExpenseData);
      } catch (e) {
          console.error("Failed to update expense", e); throw e;
      }
  };
  const deleteExpense = async (expenseId: string) => {
      try {
          await ExpenseService.delete(expenseId);
      } catch (e) {
          console.error("Failed to delete expense", e); throw e;
      }
  };
  const addSupplier = async (newSupplierData: Omit<Supplier, 'id'>) => {
      try {
          return await SupplierService.add(newSupplierData as any);
      } catch (e) {
          console.error("Failed to add supplier", e);
          throw e;
      }
  };
  const updateSupplier = async (supplierId: string, updatedSupplierData: Partial<Supplier>) => {
      try {
          return await SupplierService.update(supplierId, updatedSupplierData);
      } catch (e) {
          console.error("Failed to update supplier", e);
          throw e;
      }
  };
  const deleteSupplier = async (supplierId: string) => {
      try {
          return await SupplierService.delete(supplierId);
      } catch (e) {
          console.error("Failed to delete supplier", e);
          throw e;
      }
  };
  const addDelivery = async (orderId: string, driverId?: string, customAddress?: string, notes?: string) => {
      try {
          const order = orders.find(o => o.id === orderId);
          const customer = customers.find(c => c.id === order?.customerId);
          const address = customAddress || customer?.address || 'Bahrain';
          const customerId = order?.customerId || customer?.id || 'Walk-in';
          await DeliveryService.add({
              orderId,
              driverId: driverId || '',
              status: 'Pending',
              customerId,
              address,
              notes: notes || '',
              createdAt: new Date().toISOString()
          } as any);
      } catch (e) { console.error("Failed to add delivery", e); }
  };
  const updateDelivery = async (deliveryId: string, updatedData: Partial<Delivery>) => {
      try {
          await DeliveryService.update(deliveryId, updatedData);
      } catch (e) {
          console.error("Failed to update delivery", e);
          throw e;
      }
  };
  const updateDeliveryStatus = async (deliveryId: string, status: Delivery['status']) => {
      try {
          const updateData: any = { status };
          if (status === 'Delivered') {
              updateData.deliveryDate = new Date().toISOString();
          } else {
              updateData.deliveryDate = null;
          }
          await DeliveryService.update(deliveryId, updateData);
      } catch (e) {
          console.error("Failed to update delivery status", e);
      }
  };
  
  const deleteDelivery = async (deliveryId: string) => {
      try {
          await DeliveryService.delete(deliveryId);
      } catch (e) {
          console.error("Failed to delete delivery", e);
          throw e; // rethrow to handle in component
      }
  };

  const addDriver = async (name: string, phone?: string, vehicle?: string) => {
      try {
          await DriverService.add({ name, phone: phone || '', vehicle: vehicle || '', status: 'Available' } as any);
      } catch (e) {
          console.error("Failed to add driver", e);
          throw e;
      }
  };

  const deleteDriver = async (driverId: string) => {
      try {
          await DriverService.delete(driverId);
      } catch (e) {
          console.error("Failed to delete driver", e);
          throw e;
      }
  };

  const importCustomers = async (newCustomers: Omit<Customer, 'id' | 'joinDate'>[]) => {
      try {
          const promises = newCustomers.map(c => CustomerService.add({ ...c, joinDate: new Date().toISOString() }));
          await Promise.all(promises);
      } catch (e) { console.error("Failed to import customers", e); }
  };
  const importProducts = async (newProducts: Omit<Product, 'id' | 'status'>[]) => {
      try {
          const promises = newProducts.map(p => ProductService.add({ ...p, status: 'Active' }));
          await Promise.all(promises);
      } catch (e) {
          console.error("Failed to import products", e);
      }
  };
  const addUser = async (newUserData: Omit<User, 'id'> & { password?: string }) => {
      try {
          await UserService.add(newUserData);
      } catch (e: any) { 
          console.error("Failed to add user", e); 
          throw new Error(e.message || "Failed to add user");
      }
  };
  const updateUser = async (userId: string, updatedUserData: Partial<Omit<User, 'id'>>) => {
      try {
          const sanitizedUserData = { ...updatedUserData };
          // Guard: if imageUrl is an oversized data URL, compress it to keep under 80KB
          if (sanitizedUserData.imageUrl && sanitizedUserData.imageUrl.startsWith('data:image') && sanitizedUserData.imageUrl.length > 80000) {
              sanitizedUserData.imageUrl = await compressAndResizeImage(sanitizedUserData.imageUrl, {
                  maxWidth: 320,
                  maxHeight: 320,
                  quality: 0.8,
                  maxBytes: 80 * 1024
              });
          }
          await UserService.update(userId, sanitizedUserData);
          setCurrentUser(prev => (prev && prev.id === userId ? { ...prev, ...sanitizedUserData } : prev));
      } catch (e) { 
          console.error("Failed to update user", e);
          throw e;
      }
  };
  const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
      return compressAndResizeImage(file, {
          maxWidth: 320,
          maxHeight: 320,
          quality: 0.8,
          maxBytes: 80 * 1024
      });
  };
  const uploadProductImage = async (file: File, productId?: string): Promise<string> => {
      return compressAndResizeImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.75,
          maxBytes: 180 * 1024
      });
  };
  const deleteUser = async (userId: string) => {
      try {
          await UserService.delete(userId);
      } catch (e) { console.error("Failed to delete user", e); }
  };
  const addPurchaseOrder = async (newPOData: Omit<PurchaseOrder, 'id' | 'poNumber'>) => {
      try {
          await PurchaseOrderService.add({ ...newPOData, poNumber: `PO-${Date.now()}` } as any);
      } catch (e) { console.error("Failed to add PO", e); }
  };
  const receivePurchaseOrder = async (orderId: string) => {
      try {
          if (window.omsDesktop) {
              await window.omsDesktop.call('receivePurchaseOrder', orderId);
              return;
          }
          const po = purchaseOrders.find(p => p.id === orderId);
          if (po && po.status !== 'Received') {
              for (const item of po.items) {
                  const product = products.find(p => p.id === item.productId);
                  if (product) {
                      const newStock = product.stock + item.quantity;
                      await ProductService.update(product.id, { stock: newStock });
                  }
              }
          }
          await PurchaseOrderService.update(orderId, { status: 'Received' } as any);
      } catch (e) { console.error("Failed to receive PO", e); throw e; }
  };
  const addNotification = async (messageKey: string, screen: Screen, messageParams?: { [key: string]: string | number }, relatedId?: string) => {
      try {
          await NotificationService.add({ messageKey, screen, messageParams, date: new Date().toISOString(), read: false, relatedId } as any);
      } catch (e) { console.error("Failed to add notification", e); }
  };
  const markNotificationAsRead = async (notificationId: string) => {
      try {
          await NotificationService.update(notificationId, { read: true } as any);
      } catch (e) { console.error("Failed to mark notification", e); }
  };
  const addRequest = async (requestData: Omit<Request, 'id' | 'date' | 'status'>) => {
      try {
          const newRequest = await RequestService.add({ ...requestData, date: new Date().toISOString(), status: 'Pending' } as any);
          await addNotification(
              'header.notifications.new_website_request',
              'requests',
              { customerName: requestData.customerName },
              newRequest?.id || ''
          );
      } catch (e) { 
          console.error("Failed to add request", e); 
          throw e;
      }
  };
  const updateRequestStatus = async (requestId: string, status: Request['status']) => {
      try {
          await RequestService.update(requestId, { status } as any);
      } catch (e) { console.error("Failed to update request", e); }
  };
  const deleteRequest = async (requestId: string) => {
      try {
          await RequestService.delete(requestId);
      } catch (e) {
          console.error("Failed to delete request", e);
          throw e;
      }
  };
  const updateRequest = async (requestId: string, updatedData: Partial<Request>) => {
      try {
          await RequestService.update(requestId, updatedData);
      } catch (e) {
          console.error("Failed to update request", e);
          throw e;
      }
  };

  const addRepair = async (repairData: Omit<RepairInvoice, 'id' | 'repairNumber'>) => {
      try {
          await RepairService.add({ ...repairData, repairNumber: `REP-${Date.now()}` } as any);
      } catch (e) { console.error("Failed to add repair", e); }
  };
  const updateRepairStatus = async (repairId: string, status: RepairInvoice['status']) => {
      try {
          await RepairService.update(repairId, { status } as any);
      } catch (e) { console.error("Failed to update repair status", e); }
  };
  const deleteRepair = async (repairId: string) => {
      try {
          await RepairService.delete(repairId);
      } catch (e) { console.error("Failed to delete repair", e); }
  };
  const updateRepair = async (repairId: string, updatedData: Partial<RepairInvoice>) => {
      try {
          await RepairService.update(repairId, updatedData);
      } catch (e) { console.error("Failed to update repair", e); }
  };

  const addQuotation = async (quotationData: Omit<Quotation, 'id'>) => {
      try {
          const sanitized = Object.fromEntries(
              Object.entries(quotationData).filter(([_, v]) => v !== undefined)
          );
          const res = await QuotationService.add(sanitized as any);
          return res?.id;
      } catch (e) {
          console.error("Failed to add quotation", e);
          throw e;
      }
  };

  const updateQuotation = async (quotationId: string, updatedData: Partial<Quotation>) => {
      try {
          const sanitized = Object.fromEntries(
              Object.entries(updatedData).filter(([_, v]) => v !== undefined)
          );
          await QuotationService.update(quotationId, sanitized as any);
      } catch (e) {
          console.error("Failed to update quotation", e);
          throw e;
      }
  };

  const updateQuotationStatus = async (quotationId: string, status: Quotation['status']) => {
      try {
          await QuotationService.update(quotationId, { status });
      } catch (e) {
          console.error("Failed to update quotation status", e);
          throw e;
      }
  };

  const deleteQuotation = async (quotationId: string) => {
      try {
          await QuotationService.delete(quotationId);
      } catch (e) {
          console.error("Failed to delete quotation", e);
          throw e;
      }
  };

  const convertQuotationToOrder = async (quotationId: string, deliveryOption: 'none' | 'charge' | 'free' = 'none') => {
      try {
          const quotation = quotations.find(q => q.id === quotationId);
          if (!quotation) throw new Error("Quotation not found");
          if (quotation.convertedOrderId) return quotation.convertedOrderId;

          const orderItems: import('../types').OrderItem[] = quotation.items.map(item => ({
              productId: item.productId || `custom_${Date.now()}`,
              quantity: item.quantity,
              price: item.unitPrice,
              vatPercent: item.vatPercent || 0,
              vatAmount: item.vatAmount || 0,
          }));


          let customerId = quotation.customerId;
          if (!customerId) {
              const existingCustomer = customers.find(c => 
                  c.name.toLowerCase() === quotation.customerName.toLowerCase() || 
                  (quotation.customerPhone && c.phone === quotation.customerPhone)
              );
              if (existingCustomer) {
                  customerId = existingCustomer.id;
              } else {
                  const newCust = await CustomerService.add({
                      name: quotation.customerName,
                      phone: quotation.customerPhone,
                      email: quotation.customerEmail || '',
                      address: quotation.customerAddress || '',
                      joinDate: new Date().toISOString()
                  });
                  customerId = newCust?.id || 'guest_customer';
              }
          }

          const orderData: Omit<Order, 'id' | 'orderNumber' | 'status'> = {
              customerId: customerId || 'guest_customer',
              date: new Date().toISOString(),
              items: orderItems,
              subtotal: quotation.subtotal,
              discount: quotation.discount ?? 0,
              total: quotation.total,
              paymentMethod: 'Cash',
              employeeId: currentUser?.id || 'local-admin',
          };

          if (window.omsDesktop) {
              const savedOrder: Order = await window.omsDesktop.call('saveOrder', orderData, {
                  deliveryOption,
                  quotationId
              });
              return savedOrder.id;
          }

          const orderId = await addOrder(orderData, deliveryOption);
          
          await QuotationService.update(quotationId, {
              status: 'Converted',
              convertedOrderId: typeof orderId === 'string' ? orderId : undefined
          });

          return orderId;
      } catch (e) {
          console.error("Failed to convert quotation to order", e);
          throw e;
      }
  };

  const addContract = async (contractData: Omit<KitchenContract, 'id' | 'contractNumber' | 'paidAmount' | 'remainingAmount'>) => {
    try {
      const paidAmount = (contractData.milestones || [])
        .filter(m => m.status === 'Paid')
        .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      const remainingAmount = Math.max(0, (Number(contractData.totalAmount) || 0) - paidAmount);
      const contractNumber = `KTC-${Date.now().toString().slice(-6)}`;
      const payload: Omit<KitchenContract, 'id'> = {
        ...contractData,
        contractNumber,
        paidAmount,
        remainingAmount,
        status: contractData.status || 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const sanitized = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined)
      );
      const res = await KitchenContractService.add(sanitized as any);
      return res?.id;
    } catch (e) {
      console.error("Failed to add contract", e);
      throw e;
    }
  };

  const updateContract = async (contractId: string, updatedData: Partial<KitchenContract>) => {
    try {
      const existing = contracts.find(c => c.id === contractId);
      const merged = { ...existing, ...updatedData };
      if (merged.milestones) {
        merged.paidAmount = merged.milestones
          .filter(m => m.status === 'Paid')
          .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
        merged.remainingAmount = Math.max(0, (Number(merged.totalAmount) || 0) - (merged.paidAmount || 0));
      }
      merged.updatedAt = new Date().toISOString();
      const sanitized = Object.fromEntries(
        Object.entries(merged).filter(([_, v]) => v !== undefined)
      );
      await KitchenContractService.update(contractId, sanitized as any);
    } catch (e) {
      console.error("Failed to update contract", e);
      throw e;
    }
  };

  const deleteContract = async (contractId: string) => {
    try {
      await KitchenContractService.delete(contractId);
    } catch (e) {
      console.error("Failed to delete contract", e);
      throw e;
    }
  };

  const recordMilestonePayment = async (contractId: string, milestoneId: string, paymentMethod: 'Cash' | 'Card' | 'BenefitPay' | 'BankTransfer', notes?: string) => {
    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) throw new Error("Contract not found");
      const updatedMilestones = contract.milestones.map(m => {
        if (m.id === milestoneId) {
          return {
            ...m,
            status: 'Paid' as const,
            paidDate: new Date().toISOString(),
            paidMethod: paymentMethod,
            notes: notes || m.notes
          };
        }
        return m;
      });
      await updateContract(contractId, { milestones: updatedMilestones });
    } catch (e) {
      console.error("Failed to record milestone payment", e);
      throw e;
    }
  };

  const updateCustomerLoyalty = async (customerId: string, pointsDelta: number) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;
      const currentPoints = customer.loyaltyPoints || 0;
      const newPoints = Math.max(0, currentPoints + pointsDelta);
      await CustomerService.update(customerId, { loyaltyPoints: newPoints });
    } catch (e) {
      console.error("Failed to update customer loyalty points", e);
    }
  };

  const hasPermission = useCallback((screen: Screen) => currentUser?.permissions.includes(screen) || false, [currentUser]);
  const isAdminFlag = useCallback(() => currentUser?.role === 'Admin', [currentUser]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen(prev => !prev), []);

  const employees = useMemo(() => {
    const mapped = users.map(user => ({ id: user.id, name: user.name }));
    // Ensure Mahmoud is available if not present in users list
    if (!mapped.some(e => e.name === 'محمود' || e.name === 'Mahmoud')) {
        mapped.push({ id: 'mahmoud_fixed_id', name: 'محمود' });
    }
    return mapped;
  }, [users]);

  const value = useMemo(() => ({
    isLoading, currentUser, view, setView, activeScreen, setActiveScreen, selectedItemId, setSelectedItemId,
    globalSearchQuery, setGlobalSearchQuery,
    isSidebarOpen, toggleSidebar, isMobileMenuOpen, toggleMobileMenu,
    products, orders, customers, expenses, suppliers, employees, drivers, deliveries, users, purchaseOrders, notifications, requests, repairs, quotations, contracts,
    login, loginWithPin, logout, register, sendPasswordResetEmail,
    addOrder, updateOrder, deleteOrder, addProduct, updateProduct, deleteProduct, toggleProductStatus,
    addCustomer, updateCustomer, deleteCustomer, addExpense, updateExpense, deleteExpense, addSupplier, updateSupplier, deleteSupplier, addDelivery, updateDelivery, updateDeliveryStatus, deleteDelivery, addDriver, deleteDriver,
    importCustomers, importProducts, addUser, updateUser, uploadProfilePicture, uploadProductImage, deleteUser,
    addPurchaseOrder, receivePurchaseOrder, addNotification, markNotificationAsRead,
    addRequest, updateRequestStatus, deleteRequest, updateRequest, addRepair, updateRepairStatus, deleteRepair, updateRepair,
    addQuotation, updateQuotation, updateQuotationStatus, deleteQuotation, convertQuotationToOrder,
    addContract, updateContract, deleteContract, recordMilestonePayment, updateCustomerLoyalty,
    hasPermission, isAdmin: isAdminFlag
  }), [
    isLoading, currentUser, view, activeScreen, selectedItemId, globalSearchQuery, isSidebarOpen, isMobileMenuOpen,
    products, orders, customers, expenses, suppliers, employees, drivers, deliveries, users, purchaseOrders, notifications, requests, repairs, quotations, contracts,
    toggleSidebar, toggleMobileMenu, hasPermission, isAdminFlag
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
