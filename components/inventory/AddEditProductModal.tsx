

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Product, Supplier } from '../../types';

import { StorageImage } from '../StorageImage';

interface AddEditProductModalProps {
  suppliers: Supplier[];
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id'>, imageFile: File | null, productId?: string) => void;
  productToEdit: Product | null;
  isSaving: boolean;
}

const AddEditProductModal: React.FC<AddEditProductModalProps> = ({ suppliers, onClose, onSave, productToEdit, isSaving }) => {
  const { t } = useTranslation();
  const isEditing = !!productToEdit;

  const [productData, setProductData] = useState<Omit<Product, 'id'>>({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    supplierId: '',
    purchasePrice: 0,
    salePrice: 0,
    stock: 0,
    lowStockThreshold: 10,
    warrantyMonths: 0,
    imageUrl: '',
    description: '',
    status: 'Active',
  });
  
  const [purchasePriceStr, setPurchasePriceStr] = useState<string>(productToEdit?.purchasePrice !== undefined ? productToEdit.purchasePrice.toString() : '');
  const [salePriceStr, setSalePriceStr] = useState<string>(productToEdit?.salePrice !== undefined ? productToEdit.salePrice.toString() : '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
        setProductData({
            name: productToEdit.name,
            sku: productToEdit.sku,
            barcode: productToEdit.barcode,
            category: productToEdit.category,
            supplierId: productToEdit.supplierId,
            purchasePrice: productToEdit.purchasePrice,
            salePrice: productToEdit.salePrice,
            stock: productToEdit.stock,
            lowStockThreshold: productToEdit.lowStockThreshold,
            warrantyMonths: productToEdit.warrantyMonths || 0,
            imageUrl: productToEdit.imageUrl || '',
            description: productToEdit.description || '',
            status: productToEdit.status,
        });
        setPurchasePriceStr(productToEdit.purchasePrice !== undefined ? productToEdit.purchasePrice.toString() : '');
        setSalePriceStr(productToEdit.salePrice !== undefined ? productToEdit.salePrice.toString() : '');
        setImagePreview(productToEdit.imageUrl || null);
    } else {
        setProductData({
            name: '',
            sku: '',
            barcode: '',
            category: '',
            supplierId: '',
            purchasePrice: 0,
            salePrice: 0,
            stock: 0,
            lowStockThreshold: 10,
            warrantyMonths: 0,
            imageUrl: '',
            description: '',
            status: 'Active',
        });
        setPurchasePriceStr('');
        setSalePriceStr('');
        setImagePreview(null);
    }
  }, [productToEdit]);

  const handlePurchasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPurchasePriceStr(val);
    setProductData(prev => ({ ...prev, purchasePrice: parseFloat(val) || 0 }));
  };

  const handleSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSalePriceStr(val);
    setProductData(prev => ({ ...prev, salePrice: parseFloat(val) || 0 }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: ['purchasePrice', 'salePrice', 'stock', 'lowStockThreshold', 'warrantyMonths'].includes(name) ? parseFloat(value) || 0 : value
    }));
  };
  
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files[0]) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setProductData(prev => ({ ...prev, imageUrl: '' }));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // Clear URL field if user uploads a file, as the file will take precedence
      setProductData(prev => ({ ...prev, imageUrl: '' }));
    }
  };
  
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setProductData(prev => ({ ...prev, imageUrl: value }));
    setImagePreview(value);
    // Clear file if user types a URL
    setImageFile(null);
  };

  const handleSubmit = () => {
    if (!productData.name || !productData.sku || !productData.category || !productData.supplierId || productData.salePrice <= 0) {
      alert('Please fill all required fields: Name, SKU, Category, Supplier, and Sale Price.');
      return;
    }
    onSave(productData, imageFile, productToEdit?.id);
  };

  const modalTitle = isEditing ? t('inventory.edit_modal.title') : t('inventory.add_modal.title');
  const saveButtonText = isEditing ? t('inventory.edit_modal.save_button') : t('inventory.add_modal.save_button');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 transition-opacity duration-300" onClick={onClose} aria-modal="true" role="dialog" onPaste={handlePaste}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl m-4 transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b rounded-t dark:border-dark-border">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">{modalTitle}</h3>
          <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('inventory.add_modal.name')}</label>
                    <input type="text" name="name" value={productData.name} onChange={handleChange} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" required />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('inventory.add_modal.sku')}</label>
                    <input type="text" name="sku" value={productData.sku} onChange={handleChange} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" required />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('inventory.add_modal.barcode')}</label>
                    <input type="text" name="barcode" value={productData.barcode} onChange={handleChange} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('inventory.add_modal.category')}</label>
                    <input type="text" name="category" value={productData.category} onChange={handleChange} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" required />
                </div>
            </div>
             <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('inventory.add_modal.supplier')}</label>
                <select name="supplierId" value={productData.supplierId} onChange={handleChange} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" required>
                    <option value="">{t('inventory.add_modal.select_supplier')}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('inventory.add_modal.purchase_price')}</label>
                    <input 
                      type="number" 
                      name="purchasePrice" 
                      min="0" 
                      step="0.001" 
                      value={purchasePriceStr} 
                      onChange={handlePurchasePriceChange} 
                      placeholder="0.000"
                      className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" 
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('inventory.add_modal.sale_price')}</label>
                    <input 
                      type="number" 
                      name="salePrice" 
                      min="0" 
                      step="0.001" 
                      value={salePriceStr} 
                      onChange={handleSalePriceChange} 
                      placeholder="0.000"
                      className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" 
                      required 
                    />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('inventory.add_modal.initial_stock')}</label>
                    <input type="number" name="stock" min="0" value={productData.stock} onChange={handleChange} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('inventory.add_modal.low_stock_threshold')}</label>
                    <input type="number" name="lowStockThreshold" min="0" value={productData.lowStockThreshold} onChange={handleChange} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" />
                </div>
            </div>
            <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('inventory.add_modal.warranty')}</label>
                <input type="number" name="warrantyMonths" min="0" value={productData.warrantyMonths} onChange={handleChange} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" />
            </div>
            <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('inventory.add_modal.description')}</label>
                <textarea name="description" value={productData.description || ''} onChange={handleChange} rows={3} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white resize-y" placeholder={t('inventory.add_modal.description') + '...'} />
            </div>
             <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('inventory.edit_modal.image')}</label>
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    {imagePreview ? (
                        <StorageImage src={imagePreview} alt="Product Preview" className="w-20 h-20 rounded-lg object-cover bg-gray-200 dark:bg-gray-700" />
                    ) : (
                        <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                    )}
                    <div className="flex-grow">
                        <label htmlFor="image-upload" className="cursor-pointer bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-hover transition">
                            {t('inventory.edit_modal.upload_image')}
                        </label>
                        <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        <p className="text-xs text-text-secondary mt-1">{t('inventory.edit_modal.or_paste_url')}</p>
                        <input type="text" name="imageUrl" value={productData.imageUrl} onChange={handleImageUrlChange} placeholder="https://example.com/image.png" className="mt-1 bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse">
             <button onClick={onClose} disabled={isSaving} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-focus rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 disabled:opacity-50">{t('inventory.add_modal.cancel_button')}</button>
             <button onClick={handleSubmit} disabled={isSaving} type="button" className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary-focus font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50">
                {isSaving ? t('inventory.edit_modal.saving_button') : saveButtonText}
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
  );
};

export default AddEditProductModal;
