
import React, { useState } from 'react';
import { Customer, Order } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import PrintOrderModal from '../sales/PrintInvoiceModal';

interface CustomerOrdersModalProps {
  customer: Customer;
  onClose: () => void;
}

const WarrantyStatus: React.FC<{ orderDate: string; warrantyMonths?: number }> = ({ orderDate, warrantyMonths }) => {
    const { t, formatDate } = useTranslation();
    if (!warrantyMonths) return <span>-</span>;
    
    const purchaseDate = new Date(orderDate);
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);

    const today = new Date();
    const remainingDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (remainingDays < 0) {
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{t('customers.invoice_modal.status_expired')}</span>;
    } else {
        return (
            <div className="flex flex-col items-start">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{t('customers.invoice_modal.status_active')}</span>
                <span className="text-xs text-gray-500 mt-1">{t('customers.invoice_modal.warranty_expires')} {formatDate(expiryDate.toISOString())}</span>
                <span className="text-xs text-gray-500">({t('customers.invoice_modal.warranty_remaining', {days: remainingDays})})</span>
            </div>
        );
    }
};

const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({ customer, onClose }) => {
  const { t, formatCurrency, formatDate } = useTranslation();
  const { orders, products } = useAppContext();
  const customerOrders = orders.filter(s => s.customerId === customer.id);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 transition-opacity duration-300"
        onClick={handleBackdropClick}
        aria-modal="true"
        role="dialog"
      >
        <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl m-4 transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-5 border-b rounded-t dark:border-dark-border">
            <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
              {t('customers.invoice_modal.title', { customerName: customer.name })}
            </h3>
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>

          <div className="p-6">
              {customerOrders.length === 0 ? (
                  <p className="text-center text-text-secondary dark:text-dark-text-secondary">{t('customers.invoice_modal.no_invoices')}</p>
              ) : (
                  <div className="space-y-6">
                      {customerOrders.map(order => (
                          <div key={order.id} className="border border-border rounded-lg p-4 dark:border-dark-border">
                              <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-dark-border">
                                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                      <h4 className="font-bold text-lg text-primary">{t('customers.invoice_modal.invoice_number')}: {order.orderNumber}</h4>
                                      <button onClick={() => setOrderToPrint(order)} className="text-sm font-medium text-primary hover:underline">
                                          {t('orders.table.print')}
                                      </button>
                                      <button onClick={() => setOrderToPrint(order)} className="text-sm font-medium text-secondary hover:underline">
                                          {t('orders.print_modal.download_pdf_button')}
                                      </button>
                                  </div>
                                  <div>
                                      <p><span className="font-semibold">{t('customers.invoice_modal.date')}:</span> {formatDate(order.date)}</p>
                                      <p><span className="font-semibold">{t('customers.invoice_modal.total')}:</span> {formatCurrency(order.total)}</p>
                                  </div>
                              </div>
                              <h5 className="font-semibold mb-2 text-text-primary dark:text-dark-text-primary">{t('customers.invoice_modal.products')}</h5>
                              <table className="w-full text-sm text-left">
                                  <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                      <tr>
                                          <th className="px-4 py-2">{t('customers.invoice_modal.product_name')}</th>
                                          <th className="px-4 py-2 text-center">{t('inventory.table.quantity')}</th>
                                          <th className="px-4 py-2">{t('customers.invoice_modal.warranty_status')}</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {order.items.map(item => {
                                          const product = products.find(p => p.id === item.productId);
                                          return (
                                              <tr key={item.productId} className="border-b dark:border-dark-border">
                                                  <td className="px-4 py-2 font-medium text-text-primary dark:text-white">{product?.name || 'N/A'}</td>
                                                  <td className="px-4 py-2 text-center">{item.quantity}</td>
                                                  <td className="px-4 py-2">
                                                      <WarrantyStatus orderDate={order.date} warrantyMonths={product?.warrantyMonths} />
                                                  </td>
                                              </tr>
                                          )
                                      })}
                                  </tbody>
                              </table>
                          </div>
                      ))}
                  </div>
              )}
          </div>
          <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border">
              <button 
                  onClick={onClose} 
                  type="button" 
                  className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary-focus font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                  {t('customers.invoice_modal.close')}
              </button>
          </div>
        </div>
        <style>{`
          @keyframes fadeInScale {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-fade-in-scale { animation: fadeInScale 0.2s ease-out forwards; }
        `}</style>
      </div>
      {orderToPrint && (
        <PrintOrderModal
            order={orderToPrint}
            onClose={() => setOrderToPrint(null)}
        />
      )}
    </>
  );
};

export default CustomerOrdersModal;