
import React from 'react';
import { Expense } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';

interface ExpenseDetailModalProps {
  expense: Expense;
  onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-border dark:border-dark-border last:border-b-0">
        <dt className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{label}</dt>
        <dd className="mt-1 text-sm text-text-primary dark:text-dark-text-primary sm:mt-0 sm:col-span-2 font-semibold">{value}</dd>
    </div>
);


const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ expense, onClose }) => {
  const { t, formatCurrency, formatDate } = useTranslation();
  const { orders, customers } = useAppContext();

  const linkedOrder = expense.orderId ? orders.find(s => s.id === expense.orderId) : null;
  const linkedCustomer = linkedOrder ? customers.find(c => c.id === linkedOrder.customerId) : null;

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
            {t('finance.detail_modal.title')}
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
          <dl>
            <DetailRow label={t('finance.detail_modal.date')} value={formatDate(expense.date)} />
            <DetailRow label={t('finance.detail_modal.category')} value={t(`finance.categories.${expense.category}`)} />
            <DetailRow label={t('finance.detail_modal.description')} value={expense.description} />
            <DetailRow label={t('finance.detail_modal.amount')} value={formatCurrency(expense.amount)} />
          </dl>

          {expense.orderId && (
            <div className="mt-6 border-t border-border dark:border-dark-border pt-4">
              <h4 className="text-lg font-medium text-text-primary dark:text-dark-text-primary mb-2">
                {t('finance.detail_modal.linked_invoice_details')}
              </h4>
              {linkedOrder ? (
                <dl>
                  <DetailRow label={t('finance.detail_modal.invoice_number')} value={linkedOrder.orderNumber} />
                  <DetailRow label={t('finance.detail_modal.customer_name')} value={linkedCustomer?.name || 'N/A'} />
                  <DetailRow label={t('finance.detail_modal.invoice_date')} value={formatDate(linkedOrder.date)} />
                  <DetailRow label={t('finance.detail_modal.invoice_total')} value={formatCurrency(linkedOrder.total)} />
                </dl>
              ) : (
                <p className="text-text-secondary dark:text-dark-text-secondary">{t('finance.detail_modal.no_linked_invoice')}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border">
            <button 
                onClick={onClose} 
                type="button" 
                className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary-focus font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
                {t('finance.detail_modal.close')}
            </button>
        </div>
      </div>
       <style>{`
        @keyframes fadeInScale {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ExpenseDetailModal;