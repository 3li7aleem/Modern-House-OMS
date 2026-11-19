import React, { useState } from 'react';
import { Product } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { StorageImage } from '../StorageImage';
import ProductQrCode from './ProductQrCode';
import ProductQrModal from './ProductQrModal';
import { QrCode } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product;
  supplierName: string;
  onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-border dark:border-dark-border last:border-b-0">
        <dt className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{label}</dt>
        <dd className="mt-1 text-sm text-text-primary dark:text-dark-text-primary sm:mt-0 sm:col-span-2 font-semibold">{value}</dd>
    </div>
);


const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, supplierName, onClose }) => {
  const { t, formatCurrency, language } = useTranslation();
  const [showQrModal, setShowQrModal] = useState(false);
  const scanValue = product.barcode || product.sku || product.id;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300"
        onClick={handleBackdropClick}
        aria-modal="true"
        role="dialog"
      >
        <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card">
          <div className="flex justify-between items-center p-5 border-b rounded-t dark:border-dark-border">
            <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
              {t('inventory.modal.title_prefix')} {product.name}
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
          
          <div className="p-6 overflow-y-auto">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6">
              {product.imageUrl ? (
                <div className="w-full sm:w-1/2">
                  <StorageImage src={product.imageUrl} alt={product.name} className="w-full h-56 object-contain rounded-lg bg-gray-100 dark:bg-gray-800 border border-border dark:border-dark-border" />
                </div>
              ) : null}
              
              <div className={`${product.imageUrl ? 'w-full sm:w-1/2' : 'w-full'} flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-border dark:border-dark-border text-center`}>
                <div className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-2">
                  {language === 'ar' ? 'رمز QR للمنتج' : 'Product QR Code'}
                </div>
                <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-xs cursor-pointer" onClick={() => setShowQrModal(true)}>
                  <ProductQrCode value={scanValue} size={110} title={language === 'ar' ? 'اضغط للتكبير والطباعة' : 'Click to enlarge and print'} />
                </div>
                <div className="font-mono text-xs text-text-secondary dark:text-dark-text-secondary mt-2 truncate max-w-full">
                  {scanValue}
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-lg transition"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'عرض وطباعة الملصق' : 'View & Print Label'}</span>
                </button>
              </div>
            </div>

            <dl>
              <DetailRow label={t('inventory.modal.sku')} value={product.sku} />
              <DetailRow label={t('inventory.modal.barcode')} value={product.barcode || t('general.not_applicable')} />
              <DetailRow label={t('inventory.modal.category')} value={product.category} />
              <DetailRow label={t('inventory.modal.supplier')} value={supplierName} />
              <DetailRow label={t('inventory.modal.purchase_price')} value={formatCurrency(product.purchasePrice)} />
              <DetailRow label={t('inventory.modal.sale_price')} value={formatCurrency(product.salePrice)} />
              <DetailRow label={t('inventory.modal.current_stock')} value={product.stock} />
              <DetailRow label={t('inventory.modal.low_stock_threshold')} value={product.lowStockThreshold} />
              <DetailRow label={t('inventory.modal.warranty')} value={product.warrantyMonths ? `${product.warrantyMonths} ${t('inventory.modal.months')}` : t('general.not_applicable')} />
              <DetailRow label={t('inventory.modal.description')} value={product.description || t('general.not_applicable')} />
            </dl>
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

      {showQrModal && (
        <ProductQrModal
          product={product}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </>
  );
};

export default ProductDetailModal;