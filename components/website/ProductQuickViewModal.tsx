import React from 'react';
import { Product } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';

import { StorageImage } from '../StorageImage';

interface ProductQuickViewModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({ product, onClose, onAddToCart }) => {
  const { t, formatCurrency } = useTranslation();

  const handleAddToCartClick = () => {
    onAddToCart(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all scale-95 opacity-0 animate-fade-in-scale" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-white/10">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">{product.name}</h3>
          <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-center bg-gray-100 dark:bg-dark-background rounded-lg">
            <StorageImage src={product.imageUrl || 'https://via.placeholder.com/400'} alt={product.name} className="max-h-96 w-auto object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="bg-secondary text-white text-xs font-bold px-2 py-1 rounded-full self-start mb-2">{product.category}</span>
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">{product.name}</h2>
            <p className="text-3xl font-bold text-primary mb-4">{formatCurrency(product.salePrice)}</p>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">SKU: {product.sku}</p>
            
            <div className="border-t dark:border-dark-border pt-4 mt-auto">
                 <p className={`text-sm mb-4 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? `${t('orders.modal.in_stock')}: ${product.stock}` : t('inventory.status_labels.out_of_stock')}
                 </p>
                <button 
                    onClick={handleAddToCartClick}
                    className="w-full mt-auto px-6 py-3 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={product.stock === 0}
                >
                    {t('website.add_to_request')}
                </button>
            </div>
          </div>
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

export default ProductQuickViewModal;