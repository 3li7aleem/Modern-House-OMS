

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { RequestItem } from '../../types';

import { StorageImage } from '../StorageImage';

interface RequestCartModalProps {
  cart: { [productId: string]: number };
  onClose: () => void;
  onSubmit: (items: RequestItem[], customerName: string, customerPhone: string, customerAddress: string) => Promise<void>;
  setCart: React.Dispatch<React.SetStateAction<{ [productId: string]: number }>>;
}

const RequestCartModal: React.FC<RequestCartModalProps> = ({ cart, onClose, onSubmit, setCart }) => {
    const { products } = useAppContext();
    const { t, formatCurrency, language } = useTranslation();

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [addressFlat, setAddressFlat] = useState('');
    const [addressBuilding, setAddressBuilding] = useState('');
    const [addressRoad, setAddressRoad] = useState('');
    const [addressBlock, setAddressBlock] = useState('');
    const [addressArea, setAddressArea] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const cartItems = useMemo(() => {
        return Object.entries(cart)
            .map(([productId, quantity]) => {
                const product = products.find(p => p.id === productId);
                if (!product) return null;
                return { product, quantity };
            })
            .filter(Boolean);
    }, [cart, products]);

    const total = useMemo(() => {
        return cartItems.reduce((acc, item) => {
            if (item) {
                return acc + item.product.salePrice * item.quantity;
            }
            return acc;
        }, 0);
    }, [cartItems]);

    const handleQuantityChange = (productId: string, newQuantity: number) => {
        setCart(prevCart => {
            if (newQuantity <= 0) {
                const { [productId]: _, ...rest } = prevCart;
                return rest;
            }
            return {
                ...prevCart,
                [productId]: newQuantity,
            };
        });
    };

    const handleRemoveItem = (productId: string) => {
        handleQuantityChange(productId, 0);
    };

    const handleSubmit = async () => {
        const parts = [
            addressFlat ? `${language === 'ar' ? 'شقة/منزل' : 'Flat/Home'} ${addressFlat}` : '',
            addressBuilding ? `${language === 'ar' ? 'مبنى' : 'Building'} ${addressBuilding}` : '',
            addressRoad ? `${language === 'ar' ? 'طريق' : 'Road'} ${addressRoad}` : '',
            addressBlock ? `${language === 'ar' ? 'مجمع' : 'Block'} ${addressBlock}` : '',
            addressArea ? `${language === 'ar' ? 'المنطقة' : 'Area'} ${addressArea}` : '',
        ].filter(Boolean);
        const combinedAddress = parts.join(', ');

        if (!customerName || !customerPhone || !combinedAddress || cartItems.length === 0) {
            alert('Please fill in your name, phone number, address details, and add items to your request.');
            return;
        }
        
        setIsSubmitting(true);
        const itemsToSubmit: RequestItem[] = cartItems.map(item => ({
            productId: item!.product.id,
            quantity: item!.quantity
        }));
        
        try {
            await onSubmit(itemsToSubmit, customerName, customerPhone, combinedAddress);
            setIsSubmitted(true);
        } catch (error) {
            console.error("Failed to submit request:", error);
            alert("Failed to submit request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b rounded-t dark:border-dark-border">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            {isSubmitted ? t('website.cart.success_title') : t('website.cart.title')}
          </h3>
          <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>

        {isSubmitted ? (
            <div className="p-6 text-center">
                <p className="text-text-primary dark:text-dark-text-primary mb-4">{t('website.cart.success_message')}</p>
                 <button onClick={onClose} type="button" className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary-focus font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                    {t('website.cart.close')}
                </button>
            </div>
        ) : (
        <>
            <div className="p-6 max-h-[45vh] overflow-y-auto">
                {cartItems.length === 0 ? (
                    <p className="text-center text-text-secondary dark:text-dark-text-secondary">{t('website.cart.empty')}</p>
                ) : (
                    <div className="space-y-4">
                        {cartItems.map(item => item && (
                            <div key={item.product.id} className="flex items-center space-x-4 rtl:space-x-reverse">
                                <StorageImage src={item.product.imageUrl || 'https://via.placeholder.com/100'} alt={item.product.name} className="w-16 h-16 object-cover rounded-md" />
                                <div className="flex-grow">
                                    <p className="font-semibold text-text-primary dark:text-dark-text-primary">{item.product.name}</p>
                                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{formatCurrency(item.product.salePrice)}</p>
                                </div>
                                <input 
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value))}
                                    className="w-16 p-1 text-center bg-background border border-border rounded-md dark:bg-dark-background dark:border-dark-border"
                                />
                                <p className="font-semibold w-20 text-right">{formatCurrency(item.product.salePrice * item.quantity)}</p>
                                <button onClick={() => handleRemoveItem(item.product.id)} className="text-red-500 hover:text-red-700 text-lg">&times;</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {cartItems.length > 0 && (
                <div className="p-6 border-t dark:border-dark-border space-y-4 max-h-[40vh] overflow-y-auto">
                    <div className="flex justify-between text-lg font-bold">
                        <span>{t('orders.modal.grand_total')}:</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('website.cart.name')}</label>
                            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg block w-full p-2.5 dark:bg-dark-background dark:border-dark-border" required />
                        </div>
                         <div>
                            <label className="block mb-1 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('website.cart.phone')}</label>
                            <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg block w-full p-2.5 dark:bg-dark-background dark:border-dark-border" required />
                        </div>
                    </div>
                    
                    <div className="border-t pt-3 dark:border-dark-border">
                        <span className="block mb-2 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                            {language === 'ar' ? 'تفاصيل عنوان التوصيل' : 'Delivery Address Details'}
                        </span>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                                    {language === 'ar' ? 'شقة / منزل' : 'Home / Flat'}
                                </label>
                                <input type="text" value={addressFlat} onChange={e => setAddressFlat(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg block w-full p-2" required />
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                                    {language === 'ar' ? 'مبنى / فيلا' : 'Building'}
                                </label>
                                <input type="text" value={addressBuilding} onChange={e => setAddressBuilding(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg block w-full p-2" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                                    {language === 'ar' ? 'طريق / شارع' : 'Street / Road'}
                                </label>
                                <input type="text" value={addressRoad} onChange={e => setAddressRoad(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg block w-full p-2" required />
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                                    {language === 'ar' ? 'مجمع' : 'Block'}
                                </label>
                                <input type="text" value={addressBlock} onChange={e => setAddressBlock(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg block w-full p-2" required />
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                                    {language === 'ar' ? 'المنطقة' : 'Area'}
                                </label>
                                <input type="text" value={addressArea} onChange={e => setAddressArea(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg block w-full p-2" required />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse">
                <button onClick={onClose} type="button" className="text-gray-500 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">{t('orders.modal.cancel_button')}</button>
                {cartItems.length > 0 && (
                    <button onClick={handleSubmit} disabled={isSubmitting} type="button" className="text-white bg-primary hover:bg-primary-hover font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50">
                        {isSubmitting ? t('website.cart.submitting') : t('website.cart.submit')}
                    </button>
                )}
            </div>
        </>
        )}
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

export default RequestCartModal;
