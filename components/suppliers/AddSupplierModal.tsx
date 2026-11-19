import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Supplier } from '../../types';

interface AddEditSupplierModalProps {
  onClose: () => void;
  onSave: (supplierData: Omit<Supplier, 'id'>, supplierId?: string) => void;
  supplierToEdit: Supplier | null;
}

const AddEditSupplierModal: React.FC<AddEditSupplierModalProps> = ({ onClose, onSave, supplierToEdit }) => {
  const { t } = useTranslation();
  
  const [supplierData, setSupplierData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (supplierToEdit) {
      setSupplierData({
        name: supplierToEdit.name,
        contactPerson: supplierToEdit.contactPerson || '',
        phone: supplierToEdit.phone || '',
        email: supplierToEdit.email || '',
      });
    }
  }, [supplierToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSupplierData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!supplierData.name || !supplierData.phone) {
      alert('Name and Phone are required.');
      return;
    }
    onSave(supplierData as Omit<Supplier, 'id'>, supplierToEdit?.id);
  };

  const isEditing = !!supplierToEdit;
  const modalTitle = isEditing ? t('suppliers.edit_modal.title') || 'Edit Supplier' : t('suppliers.add_modal.title');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg m-4 transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b rounded-t dark:border-dark-border">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">{modalTitle}</h3>
          <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('suppliers.add_modal.name')}</label>
            <input type="text" name="name" value={supplierData.name} onChange={handleChange} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" required />
          </div>
           <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('suppliers.add_modal.email')}</label>
            <input type="email" name="email" value={supplierData.email} onChange={handleChange} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('suppliers.add_modal.contact')}</label>
            <input type="text" name="contactPerson" value={supplierData.contactPerson} onChange={handleChange} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('suppliers.add_modal.phone')}</label>
            <input type="text" name="phone" value={supplierData.phone} onChange={handleChange} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" required />
          </div>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse">
             <button onClick={onClose} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-focus rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">{t('suppliers.add_modal.cancel_button')}</button>
             <button onClick={handleSubmit} type="button" className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary-focus font-medium rounded-lg text-sm px-5 py-2.5 text-center">{t('suppliers.add_modal.save_button')}</button>
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

export default AddEditSupplierModal;