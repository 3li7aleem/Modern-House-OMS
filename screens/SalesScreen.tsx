

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Order, OrderItem } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import NewOrderModal from '../components/sales/NewInvoiceModal';
import PrintOrderModal from '../components/sales/PrintInvoiceModal';
import OrderDetailsModal from '../components/sales/OrderDetailsModal';
import { DollarSign, CalendarDays, Edit, Printer, Trash2, Eye, Download } from 'lucide-react';

const OrdersScreen: React.FC = () => {
  const { orders, customers, employees, addOrder, updateOrder, products, deleteOrder, isAdmin, globalSearchQuery } = useAppContext();
  const { t, formatCurrency, formatDate, formatTime } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [orderToView, setOrderToView] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
        if (globalSearchQuery !== undefined) {
             setSearchQuery(globalSearchQuery);
        }
  }, [globalSearchQuery]);

  const todayRevenue = useMemo(() => {
    const todayStr = new Date().toDateString();
    return orders.filter(o => new Date(o.date).toDateString() === todayStr)
                 .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const thisMonthRevenue = useMemo(() => {
    const today = new Date();
    return orders.filter(o => {
        const d = new Date(o.date);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const { language } = useTranslation();
  const isAr = language === 'ar';
  const getCustomerName = (id: string) => {
    if (!id || id === 'Walk-in' || id === 'cash') return isAr ? 'عميل نقدي' : 'Cash Customer';
    return customers.find(c => c.id === id)?.name || (isAr ? 'عميل نقدي' : 'Cash Customer');
  };
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || (isAr ? 'مدير النظام' : 'Admin');
  
  const calculateOrderProfit = (order: Order) => {
    return order.items.reduce((acc, item) => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            return acc + (product.salePrice - product.purchasePrice) * item.quantity;
        }
        return acc;
    }, 0);
  };

  const filteredOrders = useMemo(() => {
    if (!searchQuery) {
        return orders;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return orders.filter(order =>
        order.id.toLowerCase().includes(lowercasedQuery) ||
        order.orderNumber.toLowerCase().includes(lowercasedQuery) ||
        getCustomerName(order.customerId).toLowerCase().includes(lowercasedQuery)
    );
  }, [orders, searchQuery, customers, getCustomerName]);

  const handleSaveOrUpdate = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'status'>, deliveryOption: 'none' | 'charge' | 'free') => {
    try {
        if (orderToEdit) {
            await updateOrder(orderToEdit.id, orderData, orderToEdit.items);
        } else {
            await addOrder(orderData, deliveryOption);
        }
        setIsModalOpen(false);
        setOrderToEdit(null);
    } catch (error: any) {
        console.error("Failed to save order:", error);
        alert(`Error saving order: ${error.message}`);
        throw error; // Re-throw to allow modal to handle its state
    }
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setOrderToEdit(null);
  };
  
  const handleOpenNewOrderModal = () => {
    setOrderToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditOrderModal = (order: Order) => {
    setOrderToEdit(order);
    setIsModalOpen(true);
  };

  const handleEditClick = (order: Order) => {
    if (!isAdmin()) {
      alert(t('general.admin_required') || 'This action requires the manager user privileges.');
      return;
    }
    handleOpenEditOrderModal(order);
  };

  const handlePrintClick = (order: Order) => {
    if (!isAdmin()) {
      alert(t('general.admin_required') || 'This action requires the manager user privileges.');
      return;
    }
    setOrderToPrint(order);
  };

  const handleDetailsClick = (order: Order) => {
    if (!isAdmin()) {
      alert(t('general.admin_required') || 'This action requires the manager user privileges.');
      return;
    }
    setOrderToView(order);
  };

  const handleDeleteOrder = (order: Order) => {
      if (isAdmin()) {
          setOrderToDelete(order);
      } else {
          alert(t('general.admin_required') || 'This action requires the manager user privileges.');
      }
  };

  const exportToExcel = () => {
    // Generate headers
    const headers = [
      t('orders.table.order') || 'Order Number',
      t('orders.table.date') || 'Date',
      'Time',
      t('orders.table.customer') || 'Customer',
      t('orders.table.salesperson') || 'Salesperson',
      t('orders.print_modal.subtotal') || 'Subtotal',
      t('orders.modal.discount') || 'Discount %',
      t('orders.print_modal.vat') || 'VAT Amount',
      t('orders.print_modal.delivery_fee') || 'Delivery Fee',
      t('orders.table.total') || 'Total',
      t('orders.table.net_profit') || 'Net Profit',
      t('orders.table.payment') || 'Payment Method'
    ];

    // Build rows
    const rows = filteredOrders.map(order => {
      const orderVatAmount = order.items.reduce((sum, item) => sum + (item.vatAmount || 0), 0);
      return [
        order.orderNumber,
        formatDate(order.date),
        formatTime(order.date),
        `"${getCustomerName(order.customerId).replace(/"/g, '""')}"`,
        `"${getEmployeeName(order.employeeId).replace(/"/g, '""')}"`,
        order.subtotal.toFixed(2),
        `${order.discount}%`,
        orderVatAmount.toFixed(2),
        (order.deliveryFee || 0).toFixed(2),
        order.total.toFixed(2),
        calculateOrderProfit(order).toFixed(2),
        order.paymentMethod
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // Add BOM for proper Arabic support inside Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h3 className="text-3xl font-medium text-text-primary dark:text-dark-text-primary">{t('orders.title')}</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 border border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition shadow-sm text-sm"
          >
            <Download className="w-4 h-4" />
            <span>{t('orders.export_button') || 'Export Orders'}</span>
          </button>
          <button 
            onClick={handleOpenNewOrderModal}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition text-sm font-medium"
          >
            {t('orders.new_order_button')}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card dark:bg-dark-card shadow-sm rounded-lg p-6 flex items-center space-x-4 rtl:space-x-reverse border border-border dark:border-dark-border">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                <DollarSign className="w-8 h-8" />
            </div>
            <div>
                <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('orders.daily_revenue')}</p>
                <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{formatCurrency(todayRevenue)}</p>
            </div>
        </div>
        <div className="bg-card dark:bg-dark-card shadow-sm rounded-lg p-6 flex items-center space-x-4 rtl:space-x-reverse border border-border dark:border-dark-border">
            <div className="p-3 bg-green-100 text-green-600 rounded-full dark:bg-green-900/30 dark:text-green-400">
                <CalendarDays className="w-8 h-8" />
            </div>
            <div>
                <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('orders.monthly_revenue')}</p>
                <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{formatCurrency(thisMonthRevenue)}</p>
            </div>
        </div>
      </div>
      
      <div className="mt-6">
        <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('orders.search_placeholder')}
            className="w-full sm:w-64 md:w-96 ps-4 pe-4 py-2 text-sm text-foreground placeholder-text-secondary bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground dark:placeholder-dark-text-secondary"
        />
      </div>

      <div className="mt-4 bg-card shadow-lg rounded-lg overflow-hidden dark:bg-dark-card">
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-text-secondary dark:text-dark-text-secondary">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">{t('orders.table.order')}</th>
                        <th scope="col" className="px-6 py-3">{t('orders.table.date')}</th>
                        <th scope="col" className="px-6 py-3">{t('orders.table.customer')}</th>
                        <th scope="col" className="px-6 py-3">{t('orders.table.salesperson')}</th>
                        <th scope="col" className="px-6 py-3">{t('orders.table.total')}</th>
                        <th scope="col" className="px-6 py-3">{t('orders.table.discount')}</th>
                        <th scope="col" className="px-6 py-3">{t('orders.table.net_profit')}</th>
                        <th scope="col" className="px-6 py-3">{t('orders.table.payment')}</th>
                        <th scope="col" className="px-6 py-3 text-center">{t('orders.table.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map((order: Order) => (
                        <tr key={order.id} className="bg-card border-b dark:bg-dark-card dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap dark:text-white">{order.orderNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div>{formatDate(order.date)}</div>
                                <div className="text-xs text-text-secondary dark:text-gray-400">{formatTime(order.date)}</div>
                            </td>
                            <td className="px-6 py-4">{getCustomerName(order.customerId)}</td>
                            <td className="px-6 py-4">{getEmployeeName(order.employeeId)}</td>
                            <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(order.total)}</td>
                            <td className="px-6 py-4 text-red-500">{formatCurrency(order.subtotal * (order.discount / 100))}</td>
                            <td className="px-6 py-4 font-semibold text-blue-600">{formatCurrency(calculateOrderProfit(order))}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    order.paymentMethod === 'Card' ? 'bg-blue-100 text-blue-800' :
                                    order.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' :
                                    'bg-purple-100 text-purple-800'
                                }`}>
                                    {t(`orders.payment_methods.${order.paymentMethod}`)}
                                </span>
                                {order.benefitPayRef && <div className="text-xs text-gray-500 mt-1">Ref: {order.benefitPayRef}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => handleDetailsClick(order)} 
                                        className="p-1 px-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-750/50 rounded-lg transition-colors"
                                        title={t('general.details') || 'Details'}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleEditClick(order)} 
                                        className="p-1 px-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title={t('general.edit') || 'Edit'}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handlePrintClick(order)} 
                                        className="p-1 px-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                        title={t('orders.table.print') || 'Print'}
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteOrder(order)} 
                                        className="p-1 px-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        title={t('general.delete') || 'Delete'}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      {isModalOpen && (
        <NewOrderModal 
          onClose={handleModalClose}
          onSave={handleSaveOrUpdate}
          orderToEdit={orderToEdit}
        />
      )}
      {orderToPrint && (
        <PrintOrderModal
            order={orderToPrint}
            onClose={() => setOrderToPrint(null)}
        />
      )}
      {orderToView && (
        <OrderDetailsModal
          order={orderToView}
          onClose={() => setOrderToView(null)}
          onPrint={() => {
            setOrderToPrint(orderToView);
            setOrderToView(null);
          }}
          onEdit={() => {
            handleOpenEditOrderModal(orderToView);
            setOrderToView(null);
          }}
          onDelete={() => {
            handleDeleteOrder(orderToView);
            setOrderToView(null);
          }}
          isAdminUser={isAdmin()}
        />
      )}
      {orderToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-150 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-left rtl:text-right">
              {t('orders.delete_confirmation_title') || 'Confirm Deletion'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-left rtl:text-right">
              {t('orders.delete_confirmation_desc', { orderNumber: orderToDelete.orderNumber }) || `Are you sure you want to delete order ${orderToDelete.orderNumber}?`}
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {t('orders.modal.cancel_button') || 'Cancel'}
              </button>
              <button 
                onClick={async () => {
                  try {
                    await deleteOrder(orderToDelete.id);
                    setOrderToDelete(null);
                  } catch (e: any) {
                    alert(e.message || 'Failed to delete order');
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold text-white transition-colors h-10 flex items-center shadow-lg shadow-red-500/10"
              >
                {t('general.delete') || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersScreen;
