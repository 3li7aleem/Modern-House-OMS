
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { PurchaseOrder, PurchaseOrderItem } from '../../types';

interface AddPurchaseOrderModalProps {
  onClose: () => void;
  onSave: (poData: Omit<PurchaseOrder, 'id' | 'poNumber'>) => void;
}

const AddPurchaseOrderModal: React.FC<AddPurchaseOrderModalProps> = ({ onClose, onSave }) => {
  const { t, formatCurrency } = useTranslation();
  const { products, suppliers } = useAppContext();
  
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<Partial<PurchaseOrderItem>[]>([{ productId: '', quantity: 1 }]);
  
  const activeProducts = useMemo(() => products.filter(p => p.status === 'Active'), [products]);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    if (field === 'productId') {
        item.productId = String(value);
        const product = products.find(p => p.id === String(value));
        item.purchasePrice = product ? product.purchasePrice : 0;
        item.quantity = 1; 
    } else if (field === 'quantity') {
        item.quantity = Number(value) > 0 ? Number(value) : 1;
    } else if (field === 'purchasePrice') {
        item.purchasePrice = Number(value) >= 0 ? Number(value) : 0;
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const totalAmount = useMemo(() => {
    return items.reduce((acc, item) => {
        return acc + ((item.purchasePrice || 0) * (item.quantity || 0));
    }, 0);
  }, [items]);

  const handleSubmit = () => {
    if (items.some(i => !i.productId)) {
        alert('Please add at least one product.');
        return;
    }

    const finalItems: PurchaseOrderItem[] = items
      .filter(item => item.productId && item.quantity && item.purchasePrice !== undefined && item.quantity > 0)
      .map(item => ({
          productId: item.productId!,
          quantity: item.quantity!,
          purchasePrice: item.purchasePrice!
      }));

    if(finalItems.length === 0) {
        alert('Please add at least one product with a quantity greater than 0.');
        return;
    }

    const poData: Omit<PurchaseOrder, 'id' | 'poNumber'> = {
        date: new Date().toISOString(),
        supplierId: supplierId || '',
        items: finalItems,
        totalAmount,
        status: 'Pending',
    };
    onSave(poData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 transition-opacity duration-300" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl m-4 transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b rounded-t dark:border-dark-border">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">{t('purchaseOrders.modal.title')}</h3>
          <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                 <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('purchaseOrders.modal.date')}</label>
                    <input type="text" disabled value={new Date().toLocaleDateString()} className="bg-gray-100 border border-border text-gray-500 text-sm rounded-lg block w-full p-2.5 cursor-not-allowed dark:bg-gray-700 dark:border-dark-border dark:text-gray-400" />
                </div>
            </div>
            
            <div className="border-t border-border dark:border-dark-border pt-4">
                <h4 className="text-lg font-semibold mb-2 text-text-primary dark:text-dark-text-primary">{t('purchaseOrders.modal.items')}</h4>
                <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <select
                            className="col-span-5 bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white"
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        >
                             <option value="">{t('purchaseOrders.modal.select_product')}</option>
                            {activeProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="col-span-2">
                            <input
                                type="number"
                                placeholder={t('purchaseOrders.modal.quantity')}
                                className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white"
                                value={item.quantity ?? ''}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                min="1"
                            />
                        </div>
                        <div className="col-span-2">
                             <input
                                type="number"
                                placeholder={t('purchaseOrders.modal.purchase_price')}
                                className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white"
                                value={item.purchasePrice ?? ''}
                                onChange={(e) => handleItemChange(index, 'purchasePrice', e.target.value)}
                                min="0"
                                step="0.001"
                            />
                        </div>
                        <div className="col-span-2 p-2.5 text-sm text-right font-semibold text-text-primary dark:text-dark-text-primary">{formatCurrency((item.purchasePrice || 0) * (item.quantity || 0))}</div>
                        <button onClick={() => handleRemoveItem(index)} className="col-span-1 text-red-500 hover:text-red-700">&times;</button>
                    </div>
                ))}
                </div>
                 <button onClick={handleAddItem} className="mt-2 text-sm text-primary font-medium hover:underline">{t('purchaseOrders.modal.add_item_button')}</button>
            </div>

            <div className="flex justify-end border-t border-border dark:border-dark-border pt-4 mt-4">
                 <div className="w-full max-w-xs space-y-2 text-right">
                    <div className="flex justify-between items-center text-xl">
                        <span className="font-bold text-text-primary dark:text-dark-text-primary">{t('purchaseOrders.modal.grand_total')}:</span>
                        <span className="font-bold text-green-600">{formatCurrency(totalAmount)}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse">
             <button onClick={onClose} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-focus rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">{t('purchaseOrders.modal.cancel_button')}</button>
             <button onClick={handleSubmit} type="button" className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary-focus font-medium rounded-lg text-sm px-5 py-2.5 text-center">{t('purchaseOrders.modal.save_button')}</button>
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

export default AddPurchaseOrderModal;