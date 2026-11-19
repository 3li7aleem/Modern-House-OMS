

import { Product, Order, Customer, Expense, Supplier, Employee, Driver, Delivery, PurchaseOrder } from '../types';

export const initialProducts: Product[] = [
  { id: 'p-g414', name: 'AS 414 Brushed Kitchen Sink (47x82cm)', sku: 'G 414', barcode: '869000000001', category: 'Sinks', supplierId: 's1', purchasePrice: 35, salePrice: 53.00, stock: 25, lowStockThreshold: 5, warrantyMonths: 12, imageUrl: 'https://i.ibb.co/3WqVzZ7/g414-sink.jpg', status: 'Active' },
  { id: 'p-g65', name: 'AS 65 Satin Inset Sink (50x80cm)', sku: 'G 65', barcode: '869000000002', category: 'Sinks', supplierId: 's1', purchasePrice: 34, salePrice: 52.00, stock: 30, lowStockThreshold: 5, warrantyMonths: 12, imageUrl: 'https://i.ibb.co/L5hQzP0/g65-sink.jpg', status: 'Active' },
  { id: 'p-g297', name: 'AS 297 Drawn Brushed Sink (40x76cm)', sku: 'G 297', barcode: '869000000003', category: 'Sinks', supplierId: 's2', purchasePrice: 42, salePrice: 65.00, stock: 18, lowStockThreshold: 5, warrantyMonths: 12, imageUrl: 'https://i.ibb.co/3WqVzZ7/g414-sink.jpg', status: 'Active' },
  { id: 'p-g293', name: 'AS 293 Double Bowl Brushed Sink (46x81cm)', sku: 'G 293', barcode: '869000000004', category: 'Sinks', supplierId: 's2', purchasePrice: 43, salePrice: 65.00, stock: 15, lowStockThreshold: 4, warrantyMonths: 18, imageUrl: 'https://i.ibb.co/qD5h5wV/g293-sink.jpg', status: 'Active' },
  { id: 'p-g102', name: 'AS 102 Handmade Brushed Sink (40x55cm)', sku: 'G 102', barcode: '869000000005', category: 'Sinks', supplierId: 's1', purchasePrice: 40, salePrice: 60.00, stock: 22, lowStockThreshold: 5, warrantyMonths: 24, imageUrl: 'https://i.ibb.co/GQLTyyV/g102-sink.jpg', status: 'Active' },
  { id: 'p-u006', name: 'U006 Undermount Kitchen Sink (40x45cm)', sku: 'U 006', barcode: '869000000006', category: 'Sinks', supplierId: 's2', purchasePrice: 18, salePrice: 28.00, stock: 40, lowStockThreshold: 10, warrantyMonths: 12, imageUrl: 'https://i.ibb.co/pwnL1cT/u006-sink.jpg', status: 'Active' },
  { id: 'p-s006', name: 'S006 Double Bowl Special Sink (80x45cm)', sku: 'S 006', barcode: '869000000007', category: 'Sinks', supplierId: 's1', purchasePrice: 38, salePrice: 58.00, stock: 12, lowStockThreshold: 3, warrantyMonths: 18, imageUrl: 'https://i.ibb.co/VWVgLhM/s006-sink.jpg', status: 'Active' },
];
export const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Ali Ahmed', phone: '0501234567', address: '123 Main St, Manama', joinDate: '2023-01-15' },
  { id: 'c2', name: 'Fatima Khan', phone: '0559876543', address: '456 Juffair Ave, Manama', joinDate: '2022-11-20' },
];
export const initialOrders: Order[] = [
    { id: 'sale1', orderNumber: 'INV-2024-001', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), customerId: 'c1', items: [{ productId: 'p-g414', quantity: 1, price: 53.00 }], subtotal: 53.00, discount: 10, total: 47.70, paymentMethod: 'Card', employeeId: 'e1', deliveryFee: 2, status: 'Completed' },
    { id: 'sale2', orderNumber: 'INV-2024-002', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), customerId: 'c2', items: [{ productId: 'p-g65', quantity: 1, price: 52.00 }, { productId: 'p-u006', quantity: 2, price: 28.00 }], subtotal: 108.00, discount: 0, total: 108.00, paymentMethod: 'Cash', employeeId: 'e2', status: 'Completed' },
];
export const initialExpenses: Expense[] = [
  { id: 'exp1', date: '2024-05-01', category: 'Rent', description: 'May Rent', amount: 5000 },
  { id: 'exp2', date: '2024-05-15', category: 'Utilities', description: 'Electricity Bill', amount: 450 },
  { id: 'exp3', date: '2024-05-16', category: 'Other', description: 'Shipping cost for INV-2024-001', amount: 15, orderId: 'sale1' },
];
export const initialSuppliers: Supplier[] = [
    { id: 's1', name: 'KitchenWare Global', contactPerson: 'John Doe', phone: '111-222-3333', email: 'contact@kitchenware.com' },
    { id: 's2', name: 'Home Goods Inc.', contactPerson: 'Jane Smith', phone: '444-555-6666', email: 'sales@homegoods.com' },
];
export const initialDrivers: Driver[] = [ { id: 'drv1', name: 'Yusuf Ali' }, { id: 'drv2', name: 'Ahmed Khan' } ];
export const initialDeliveries: Delivery[] = [
    { id: 'd1', orderId: 'sale1', customerId: 'c1', address: '123 Main St, Manama', status: 'Delivered', deliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), driverId: 'drv1' },
    { id: 'd2', orderId: 'sale2', customerId: 'c2', address: '456 Juffair Ave, Manama', status: 'Out for Delivery', driverId: 'drv2', estimatedDeliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), currentLocation: { lat: 26.225, lng: 50.61 }, route: [ { lat: 26.236, lng: 50.58  }, { lat: 26.230, lng: 50.595 }, { lat: 26.225, lng: 50.61 }, { lat: 26.218, lng: 50.635 } ] }
];
export const initialPurchaseOrders: PurchaseOrder[] = [
    { id: 'po1', poNumber: 'PO-2024-001', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), supplierId: 's1', items: [ { productId: 'p-g414', quantity: 20, purchasePrice: 35 }, { productId: 'p-g297', quantity: 10, purchasePrice: 42 }, ], totalAmount: (20 * 35) + (10 * 42), status: 'Received' },
    { id: 'po2', poNumber: 'PO-2024-002', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), supplierId: 's2', items: [ { productId: 'p-g293', quantity: 15, purchasePrice: 43 }, { productId: 'p-u006', quantity: 50, purchasePrice: 18 }, ], totalAmount: (15 * 43) + (50 * 18), status: 'Pending' }
];