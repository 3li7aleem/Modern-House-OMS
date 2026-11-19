import React, { useState } from 'react';
import { Request, RequestItem } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import { Trash2, Plus, X } from 'lucide-react';

interface EditRequestModalProps {
  request: Request;
  onClose: () => void;
  onSave: (requestId: string, updatedData: Partial<Request>) => Promise<void>;
}

const EditRequestModal: React.FC<EditRequestModalProps> = ({ request, onClose, onSave }) => {
  const { t } = useTranslation();
  const { products } = useAppContext();

  const [customerName, setCustomerName] = useState(request.customerName);
  const [customerPhone, setCustomerPhone] = useState(request.customerPhone);
  const [customerAddress, setCustomerAddress] = useState(request.customerAddress || '');
  const [items, setItems] = useState<RequestItem[]>(request.items || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems([...items, { productId: products[0].id, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemProductChange = (index: number, productId: string) => {
    const updated = [...items];
    updated[index].productId = productId;
    setItems(updated);
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, quantity);
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert(t('general.required_fields') || 'Please fill in name and phone number.');
      return;
    }
    if (items.length === 0) {
      alert(t('requests.edit_modal.no_items') || 'Please add at least one item.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(request.id, {
        customerName,
        customerPhone,
        customerAddress: customerAddress || null as any,
        items
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
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
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl m-4 transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b rounded-t dark:border-dark-border">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            {t('requests.edit_modal.title') || 'Edit Customer Order'}
          </h3>
          <button 
            type="button" 
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                {t('requests.detail_modal.customer_name') || 'Customer Name'} *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full text-sm p-2 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                {t('requests.detail_modal.customer_phone') || 'Customer Phone'} *
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="w-full text-sm p-2 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
              />
            </div>

            {/* Customer Address */}
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                {t('requests.detail_modal.customer_address') || 'Customer Address'}
              </label>
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                rows={2}
                className="w-full text-sm p-2 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
              />
            </div>

            {/* Requested Items Section */}
            <div className="pt-4 border-t dark:border-dark-border">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold text-text-primary dark:text-dark-text-primary">
                  {t('requests.detail_modal.requested_items') || 'Order Items'}
                </h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs text-primary dark:text-dark-text-primary font-medium hover:underline bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 px-2 py-1 rounded"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('orders.modal.add_item') || 'Add Item'}</span>
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary text-center py-4 bg-gray-50 dark:bg-gray-800 rounded">
                  {t('orders.modal.no_items_selected') || 'No items selected.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemProductChange(index, e.target.value)}
                        className="flex-1 text-xs p-2 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - ({p.stock} units)
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemQuantityChange(index, parseInt(e.target.value) || 1)}
                        className="w-20 text-xs p-2 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse">
            <button 
              type="button" 
              onClick={onClose} 
              className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600"
            >
              {t('general.cancel_button') || 'Cancel'}
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="text-white bg-primary hover:bg-primary-hover disabled:bg-gray-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition"
            >
              {isSaving ? t('general.saving') || 'Saving...' : t('general.save') || 'Save Changes'}
            </button>
          </div>
        </form>
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

export default EditRequestModal;
