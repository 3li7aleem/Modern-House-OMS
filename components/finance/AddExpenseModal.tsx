
import React, { useState } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Expense } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

interface AddExpenseModalProps {
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id'>) => void;
  initialData?: Expense;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ onClose, onSave, initialData }) => {
  const { t } = useTranslation();
  const { customers, orders } = useAppContext();
  const today = new Date().toISOString().split('T')[0];
  
  const [date, setDate] = useState(initialData?.date.split('T')[0] || today);
  const [category, setCategory] = useState<Expense['category']>(initialData?.category || 'Other');
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState<number | ''>(initialData?.amount || '');
  const [orderId, setOrderId] = useState(initialData?.orderId || '');

  const expenseCategories: Expense['category'][] = ['Rent', 'Salaries', 'Utilities', 'Supplies', 'Other'];

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || 'Unknown';
  };

  const handleSubmit = () => {
    if (!date || !category || !description || amount === '' || Number(amount) <= 0) {
      alert('Please fill all fields correctly.');
      return;
    }

    const expenseData: Omit<Expense, 'id'> & { orderId?: string } = {
      date,
      category,
      description,
      amount: Number(amount),
    };
    
    if (orderId) {
        expenseData.orderId = orderId;
    }

    onSave(expenseData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg m-4 transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b rounded-t dark:border-dark-border">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            {initialData ? t('finance.modal.edit_title') || 'Edit Expense' : t('finance.modal.title')}
          </h3>
          <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('finance.modal.date')}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:placeholder-gray-400 dark:text-white" />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('finance.modal.category')}</label>
            <select value={category} onChange={e => setCategory(e.target.value as Expense['category'])} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:placeholder-gray-400 dark:text-white">
              <option value="">{t('finance.modal.select_category')}</option>
              {expenseCategories.map(cat => <option key={cat} value={cat}>{t(`finance.categories.${cat}`)}</option>)}
            </select>
          </div>
           <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('finance.modal.linked_invoice')}</label>
            <select value={orderId} onChange={e => setOrderId(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:placeholder-gray-400 dark:text-white">
              <option value="">{t('finance.modal.select_invoice')}</option>
              {orders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} ({getCustomerName(order.customerId)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('finance.modal.description')}</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:placeholder-gray-400 dark:text-white" />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('finance.modal.amount')}</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} min="0" step="0.001" className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:placeholder-gray-400 dark:text-white" />
          </div>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse">
             <button onClick={onClose} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-focus rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">{t('finance.modal.cancel_button')}</button>
             <button onClick={handleSubmit} type="button" className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary-focus font-medium rounded-lg text-sm px-5 py-2.5 text-center">{t('finance.modal.save_button')}</button>
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
  );
};

export default AddExpenseModal;