



export type Screen = 'dashboard' | 'orders' | 'inventory' | 'finance' | 'customers' | 'suppliers' | 'delivery' | 'users' | 'purchaseOrders' | 'website' | 'requests' | 'settings' | 'reports' | 'pos' | 'marketing' | 'maintenance' | 'quotations' | 'contracts';

export interface ContractMilestone {
  id: string;
  title: string;
  percentage: number;
  amount: number;
  dueDate?: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  paidDate?: string;
  paidMethod?: 'Cash' | 'Card' | 'BenefitPay' | 'BankTransfer';
  notes?: string;
}

export type KitchenContractStatus = 'Draft' | 'Active' | 'Manufacturing' | 'ReadyForInstallation' | 'Completed' | 'Cancelled';

export interface KitchenContract {
  id: string;
  contractNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  kitchenDesign: string; // e.g. Modern Acrylic, Classic Wood, Aluminum L-shape
  dimensions?: string;
  woodType?: string;
  countertopType?: string;
  accessories?: string;
  appliancesIncluded?: string;
  contractDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: KitchenContractStatus;
  milestones: ContractMilestone[];
  warrantyYears?: number;
  technicianName?: string;
  notes?: string;
  terms?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuotationItem {
  productId?: string;
  name: string;
  sku?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  vatPercent?: number;
  vatAmount?: number;
  total: number;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';

export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  taxNumber?: string;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  vatTotal: number;
  total: number;
  status: QuotationStatus;
  convertedOrderId?: string;
  notes?: string;
  terms?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  preparedBy?: string;
  userId?: string;
  createdAt?: string;
}

export interface RepairInvoice {
  id: string;
  repairNumber: string;
  date: string;
  customerId: string;
  items: {
    description: string;
    cost: number;
  }[];
  totalAmount: number;
  status: 'Pending' | 'In Progress' | 'Ready' | 'Delivered' | 'Cancelled';
  notes?: string;
  expectedReturnDate?: string;
  deviceType?: string;
  brandModel?: string;
  serialNumber?: string;
  problemDescription?: string;
  technicianName?: string;
  priority?: 'Normal' | 'High' | 'Urgent';
  warrantyStatus?: 'Under Warranty' | 'Out of Warranty';
  paidAmount?: number;
  paymentStatus?: 'Paid' | 'Partial' | 'Unpaid';
  photos?: string[];
  beforeImageUrl?: string;
  afterImageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  supplierId: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  lowStockThreshold: number;
  warrantyMonths?: number;
  imageUrl?: string;
  description?: string;
  status: 'Active' | 'Inactive';
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  vatPercent?: number;
  vatAmount?: number;
}

export interface Order {
  id:string;
  orderNumber: string;
  date: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'BenefitPay';
  benefitPayRef?: string;
  employeeId: string;
  deliveryFee?: number;
  status: 'Completed' | 'Pending' | 'Shipped' | 'Cancelled';
  pointsEarned?: number;
  pointsRedeemed?: number;
  loyaltyDiscount?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  region?: string;
  address?: string;
  commercialRegister?: string;
  taxNumber?: string;
  notes?: string;
  joinDate: string;
  category?: 'Individual' | 'Commercial' | 'VIP' | 'Wholesale';
  creditLimit?: number;
  balance?: number;
  loyaltyPoints?: number;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Rent' | 'Salaries' | 'Utilities' | 'Supplies' | 'Other';
  description: string;
  amount: number;
  orderId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
}

export interface Employee {
  id: string;
  name: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  vehicle?: string;
  status?: 'Available' | 'Busy' | 'Off-duty';
}

export interface Delivery {
  id: string;
  orderId: string;
  customerId: string;
  address: string;
  status: 'Pending' | 'Out for Delivery' | 'Delivered';
  deliveryDate?: string;
  driverId?: string;
  estimatedDeliveryTime?: string;
  currentLocation?: { lat: number; lng: number };
  route?: { lat: number; lng: number }[];
  notes?: string;
  deliveryFee?: number;
  recipientPhone?: string;
  createdAt?: string;
  proofImageUrl?: string;
  deliveredAt?: string;
  recipientSignature?: string;
}


export interface PurchaseOrderItem {
  productId: string;
  quantity: number;
  purchasePrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Partial' | 'Received';
}

export type UserRole = 'Admin' | 'Sales Manager' | 'Accountant' | 'Warehouse Staff' | 'Delivery' | 'Salesperson' | 'Maintenance';

export interface User {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  role: UserRole;
  permissions: Screen[];
  status: 'Active' | 'Inactive';
  imageUrl?: string;
  pin?: string; // 4 to 6 digit security PIN for quick login
}

export interface AppNotification {
  id: string;
  messageKey: string;
  messageParams?: { [key: string]: string | number };
  read: boolean;
  date: string;
  screen: Screen;
  relatedId?: string;
}

export interface RequestItem {
    productId: string;
    quantity: number;
}

export interface Request {
    id: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    date: string;
    items: RequestItem[];
    status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
}