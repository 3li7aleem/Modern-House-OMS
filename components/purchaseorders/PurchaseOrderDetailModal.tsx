import React from 'react';
import { PurchaseOrder } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';

interface PurchaseOrderDetailModalProps {
  purchaseOrder: PurchaseOrder;
  onClose: () => void;
}

const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({ purchaseOrder, onClose }) => {
  const { t, formatCurrency, formatDate } = useTranslation();
  const { products, suppliers } = useAppContext();

  const supplier = suppliers.find(s => s.id === purchaseOrder.supplierId);

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'N/A';
  };
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl m-4 transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card">
        <div className="flex justify-between items-center p-5 border-b rounded-t dark:border-dark-border">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            {t('purchaseOrders.detail_modal.title')} #{purchaseOrder.poNumber}
          </h3>
          <button 
            type="button" 
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div><strong>{t('purchaseOrders.table.supplier')}:</strong> {supplier?.name || 'N/A'}</div>
            <div className="text-right"><strong>{t('purchaseOrders.table.date')}:</strong> {formatDate(purchaseOrder.date)}</div>
            <div><strong>{t('purchaseOrders.table.status')}:</strong> {t(`purchaseOrders.status_labels.${purchaseOrder.status}`)}</div>
            <div className="text-right"><strong>{t('purchaseOrders.table.total')}:</strong> {formatCurrency(purchaseOrder.totalAmount)}</div>
          </div>
          
          <table className="w-full text-sm text-left text-text-secondary dark:text-dark-text-secondary">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">{t('purchaseOrders.detail_modal.product')}</th>
                <th scope="col" className="px-6 py-3 text-center">{t('purchaseOrders.detail_modal.quantity')}</th>
                <th scope="col" className="px-6 py-3 text-right">{t('purchaseOrders.detail_modal.unit_price')}</th>
                <th scope="col" className="px-6 py-3 text-right">{t('purchaseOrders.detail_modal.total')}</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrder.items.map((item, index) => (
                <tr key={index} className="bg-card border-b dark:bg-dark-card dark:border-dark-border">
                  <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap dark:text-white">{getProductName(item.productId)}</td>
                  <td className="px-6 py-4 text-center">{item.quantity}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(item.purchasePrice)}</td>
                  <td className="px-6 py-4 text-right font-semibold">{formatCurrency(item.purchasePrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border">
            <button 
                onClick={onClose} 
                type="button" 
                className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary-focus font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
                {t('inventory.modal.close')}
            </button>
        </div>
      </div>
       <style>{`
        @keyframes fadeInScale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PurchaseOrderDetailModal;
