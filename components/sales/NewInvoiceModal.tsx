

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { Order, OrderItem, Customer, Request, Product } from '../../types';
import AddCustomerModal from '../customers/AddCustomerModal';
import BarcodeScanner from './BarcodeScanner';

interface NewOrderModalProps {
  onClose: () => void;
  onSave: (orderData: Omit<Order, 'id' | 'orderNumber' | 'status'>, deliveryOption: 'none' | 'charge' | 'free') => Promise<void>;
  requestToConvert?: Request | null;
  orderToEdit?: Order | null;
}

const DELIVERY_FEE = 2;

const NewOrderModal: React.FC<NewOrderModalProps> = ({ onClose, onSave, requestToConvert, orderToEdit }) => {
  const { t, formatCurrency } = useTranslation();
  const { products, customers, employees, addCustomer, currentUser } = useAppContext();
  const isEditing = !!orderToEdit;

  const [customerId, setCustomerId] = useState('');
  const [employeeId, setEmployeeId] = useState(currentUser?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('Cash');
  const [benefitPayRef, setBenefitPayRef] = useState('');
  const [items, setItems] = useState<Partial<OrderItem>[]>([{ productId: '', quantity: 1 }]);
  const [discount, setDiscount] = useState(0);
  const [isVatEnabled, setIsVatEnabled] = useState(true);
  const [vatPercent, setVatPercent] = useState(10);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<'none' | 'charge' | 'free'>('none');
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [codeInputValue, setCodeInputValue] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);


  useEffect(() => {
    if (isEditing) {
        setCustomerId(orderToEdit.customerId);
        const customer = customers.find(c => c.id === orderToEdit.customerId);
        if (customer) setSearchQuery(customer.name);
        setEmployeeId(orderToEdit.employeeId);
        setPaymentMethod(orderToEdit.paymentMethod);
        setBenefitPayRef(orderToEdit.benefitPayRef || '');
        setItems(orderToEdit.items);
        setDiscount(orderToEdit.discount);
        setIsVatEnabled(orderToEdit.items[0]?.vatPercent !== undefined ? (orderToEdit.items[0]?.vatPercent > 0) : true);
        setVatPercent(orderToEdit.items[0]?.vatPercent || 10);
        if (orderToEdit.deliveryFee === 0) {
            setDeliveryOption('free');
        } else if (orderToEdit.deliveryFee && orderToEdit.deliveryFee > 0) {
            setDeliveryOption('charge');
        } else {
            setDeliveryOption('none');
        }
    } else if (requestToConvert) {
      // Find if customer exists
      const existingCustomer = customers.find(c => c.phone === requestToConvert.customerPhone);
      if (existingCustomer) {
        setCustomerId(existingCustomer.id);
        setSearchQuery(existingCustomer.name);
      } else {
        // Pre-fill search query for potential new customer
        setSearchQuery(`${requestToConvert.customerName} (${requestToConvert.customerPhone})`);
      }

      const requestedItems = requestToConvert.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product?.salePrice || 0,
        };
      }).filter(Boolean);
      setItems(requestedItems);
      
      if(requestToConvert.customerAddress) {
          setDeliveryOption('charge');
      }
    }
  }, [orderToEdit, requestToConvert, customers, products]);


  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === customerId);
  }, [customerId, customers]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return [];
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const queryDigits = normalizedQuery.replace(/\D/g, '');
    const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean);

    return customers.filter(customer => {
      const name = customer.name.toLowerCase();
      const phone = customer.phone;
      const phoneDigits = phone.replace(/\D/g, '');

      if (name.includes(normalizedQuery) || phone.includes(normalizedQuery)) return true;
      if (queryDigits && phoneDigits.includes(queryDigits)) return true;

      if (searchTerms.length > 0) {
        return searchTerms.every(term => name.includes(term) || phone.includes(term));
      }
      return false;
    });
  }, [searchQuery, customers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            setIsSearchFocused(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);
  
  const handleSelectCustomer = (customer: Customer) => {
    setCustomerId(customer.id);
    setSearchQuery(customer.name);
    setIsSearchFocused(false);
  };

  const handleClearCustomer = () => {
      setCustomerId('');
      setSearchQuery('');
  };

  const activeProducts = useMemo(() => products.filter(p => p.status === 'Active'), [products]);
  
  const availableStockForProduct = (p: Product) => {
      if (isEditing) {
          const originalItem = orderToEdit.items.find(i => i.productId === p.id);
          return p.stock + (originalItem?.quantity || 0);
      }
      return p.stock;
  };

  const getQuantityInCart = (productId: string, currentIndex: number) => {
    return items.reduce((total, item, index) => {
        if (item.productId === productId && index !== currentIndex) {
            return total + (item.quantity || 0);
        }
        return total;
    }, 0);
  };

  const paymentOptions: Order['paymentMethod'][] = ['Cash', 'Card', 'BenefitPay'];

  const handleAddItem = () => {
     if (items.length === 0 || items[items.length - 1].productId) {
        setItems([...items, { productId: '', quantity: 1 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    if (field === 'productId') {
        item.productId = String(value);
        const product = products.find(p => p.id === String(value));
        item.price = product ? product.salePrice : 0;
        item.quantity = 1;
    } else if (field === 'quantity') {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const totalAvailable = availableStockForProduct(product);
          const quantityInCart = getQuantityInCart(product.id, index);
          const availableStock = totalAvailable - quantityInCart;
          
          let qty = Number(value);
          if (qty > availableStock) {
              qty = availableStock;
          }
          item.quantity = qty > 0 ? qty : 0;
        } else {
            item.quantity = Number(value) > 0 ? Number(value) : 1;
        }
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
        const product = products.find(p => p.id === item.productId);
        return acc + (product ? product.salePrice * (item.quantity || 0) : 0);
    }, 0);
  }, [items, products]);

  const totalPurchaseCost = useMemo(() => {
    return items.reduce((acc, item) => {
      const product = products.find(p => p.id === item.productId);
      return acc + (product ? product.purchasePrice * (item.quantity || 0) : 0);
    }, 0);
  }, [items, products]);
  
  const maxAllowedDiscount = useMemo(() => {
    if (subtotal <= totalPurchaseCost) {
      return 0;
    }
    const maxDiscountFromProfit = ((subtotal - totalPurchaseCost) / subtotal) * 100;
    return Math.floor(Math.min(50, maxDiscountFromProfit));
  }, [subtotal, totalPurchaseCost]);

  const vatAmount = useMemo(() => {
    if (!isVatEnabled) return 0;
    const discountAmount = subtotal * (discount / 100);
    const netAmount = subtotal - discountAmount;
    return netAmount * (vatPercent / 100);
  }, [subtotal, discount, isVatEnabled, vatPercent]);

  const total = useMemo(() => {
    const discountAmount = subtotal * (discount / 100);
    const totalAfterDiscount = subtotal - discountAmount;
    const totalWithVat = totalAfterDiscount + vatAmount;
    if (deliveryOption === 'charge') {
        return totalWithVat + DELIVERY_FEE;
    }
    return totalWithVat;
  }, [subtotal, discount, deliveryOption, vatAmount]);

  const handleApplyOffer = () => {
    const offerDiscount = 15;
    const newDiscount = Math.max(0, Math.min(offerDiscount, maxAllowedDiscount));
    setDiscount(newDiscount);
  };
  
  const handleDiscountChange = (value: string) => {
      const requestedDiscount = parseInt(value, 10) || 0;
      const newDiscount = Math.max(0, Math.min(requestedDiscount, maxAllowedDiscount));
      setDiscount(newDiscount);
  }

  const handleSaveNewCustomer = async (customerData: Omit<Customer, 'id' | 'joinDate'>) => {
    const newCustomer = await addCustomer(customerData);
    setIsAddCustomerModalOpen(false);
    if (newCustomer) {
      handleSelectCustomer(newCustomer);
    }
  };

  const handleCodeScanned = (code: string) => {
    if (!code) return;
    const product = products.find(p => p.barcode === code.trim());

    if (!product) {
        alert(t('orders.modal.code_not_found'));
        setCodeInputValue('');
        return;
    }

    const totalAvailable = availableStockForProduct(product);
    const quantityInCart = items.reduce((total, item) => item.productId === product.id ? total + (item.quantity || 0) : total, 0);
    
    if (quantityInCart >= totalAvailable) {
        alert(t('orders.modal.product_out_of_stock', { name: product.name }));
        setCodeInputValue('');
        return;
    }

    const existingItemIndex = items.findIndex(item => item.productId === product.id);

    if (existingItemIndex > -1) {
        const newItems = [...items];
        const existingItem = newItems[existingItemIndex];
        const newQuantity = (existingItem.quantity || 0) + 1;
        newItems[existingItemIndex] = { ...existingItem, quantity: newQuantity };
        setItems(newItems);
    } else {
        const newItems = items.filter(item => item.productId);
        setItems([...newItems, { productId: product.id, quantity: 1, price: product.salePrice }]);
    }
    
    setCodeInputValue('');
    setIsScannerOpen(false);
  };

  const handleSubmit = async () => {
    let finalCustomerId = customerId;

    if (!finalCustomerId && requestToConvert) {
      // It's a new customer from a request, create them first
      const newCustomer = await addCustomer({
        name: requestToConvert.customerName,
        phone: requestToConvert.customerPhone,
        address: requestToConvert.customerAddress,
      });
      if (!newCustomer) {
        alert('Failed to create new customer profile.');
        return;
      }
      finalCustomerId = newCustomer.id;
    }


    if (!finalCustomerId || !employeeId || items.every(i => !i.productId)) {
        alert('Please fill all required fields and add at least one item.');
        return;
    }

    if (paymentMethod === 'BenefitPay' && !benefitPayRef) {
        alert('Please enter the BenefitPay reference number.');
        return;
    }

    const finalItems: OrderItem[] = items
      .filter(item => item.productId && item.quantity && item.price && item.quantity > 0)
      .map(item => {
          const discountFactor = 1 - (discount / 100);
          const itemNetTotal = (item.price! * item.quantity!) * discountFactor;
          const itemVatAmount = isVatEnabled ? itemNetTotal * (vatPercent / 100) : 0;
          return {
              productId: item.productId!,
              quantity: item.quantity!,
              price: item.price!,
              vatPercent: isVatEnabled ? vatPercent : 0,
              vatAmount: itemVatAmount
          };
      });

    if(finalItems.length === 0) {
        alert('Please add at least one product with a quantity greater than 0.');
        return;
    }

    const orderData: Omit<Order, 'id' | 'orderNumber' | 'status'> = {
        date: new Date().toISOString(),
        customerId: finalCustomerId,
        items: finalItems,
        subtotal,
        discount,
        total,
        paymentMethod,
        employeeId,
    };
    
    if (paymentMethod === 'BenefitPay' && benefitPayRef) {
      orderData.benefitPayRef = benefitPayRef;
    }
    if (deliveryOption === 'charge') {
      orderData.deliveryFee = DELIVERY_FEE;
    } else if (deliveryOption === 'free') {
      orderData.deliveryFee = 0;
    }
    
    setIsSaving(true);
    try {
        await onSave(orderData, deliveryOption);
    } catch (error) {
        // Parent component will show an alert. We just need to stop the loading state.
    } finally {
        setIsSaving(false);
    }
  };

  const modalTitle = isEditing ? t('orders.modal.edit_title') : t('orders.modal.title');
  const saveButtonText = isEditing ? t('orders.modal.update_button') : t('orders.modal.save_button');

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 transition-opacity duration-300" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl m-4 transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b rounded-t dark:border-dark-border">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">{modalTitle}</h3>
          <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('orders.modal.customer')}</label>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <div ref={searchRef} className="relative w-full">
                           <div className="relative">
                               <input
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) => {
                                      setSearchQuery(e.target.value);
                                      if (customerId) setCustomerId('');
                                  }}
                                  onFocus={() => setIsSearchFocused(true)}
                                  placeholder={t('orders.modal.search_customer_placeholder')}
                                  className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white"
                                />
                                {customerId && (
                                    <button onClick={handleClearCustomer} className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-500 hover:text-red-500">
                                        &times;
                                    </button>
                                )}
                            </div>
                            {isSearchFocused && !customerId && (
                                <ul className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto dark:bg-dark-card dark:border-dark-border">
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.map(customer => (
                                            <li
                                                key={customer.id}
                                                onClick={() => handleSelectCustomer(customer)}
                                                className="px-4 py-2 cursor-pointer hover:bg-sidebar-hover dark:hover:bg-dark-sidebar-hover"
                                            >
                                                {customer.name} ({customer.phone})
                                            </li>
                                        ))
                                    ) : (
                                        searchQuery && <li className="px-4 py-2 text-gray-500">{t('orders.modal.no_customer_found')}</li>
                                    )}
                                </ul>
                            )}
                        </div>
                        <button onClick={() => setIsAddCustomerModalOpen(true)} className="px-3 py-2 text-sm font-medium text-white bg-secondary rounded-lg hover:bg-opacity-90 focus:ring-4 focus:outline-none focus:ring-secondary-focus whitespace-nowrap">
                          {t('orders.modal.new_customer_button')}
                        </button>
                    </div>
                 </div>
                 <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('orders.modal.date')}</label>
                    <input type="text" disabled value={new Date().toLocaleDateString()} className="bg-gray-100 border border-border text-gray-500 text-sm rounded-lg block w-full p-2.5 cursor-not-allowed dark:bg-gray-700 dark:border-dark-border dark:text-gray-400" />
                </div>
            </div>
            
            <div className="border-t border-border dark:border-dark-border pt-4">
                <h4 className="text-lg font-semibold mb-2 text-text-primary dark:text-dark-text-primary">{t('orders.modal.items')}</h4>
                <div className="space-y-2">
                {items.map((item, index) => {
                    const productForItem = item.productId ? products.find(p => p.id === item.productId) : null;
                    const totalAvailable = productForItem ? availableStockForProduct(productForItem) : 0;
                    const quantityInCartForItem = productForItem ? getQuantityInCart(productForItem.id, index) : 0;
                    const availableStockForItem = totalAvailable - quantityInCartForItem;
                    
                    return (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start">
                        <select
                            className="col-span-5 bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white"
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        >
                             <option value="">{t('orders.modal.select_product')}</option>
                            {activeProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="col-span-2">
                            <input
                                type="number"
                                placeholder={t('orders.modal.quantity')}
                                className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                min="0"
                                max={availableStockForItem}
                                disabled={!item.productId}
                            />
                            {productForItem && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('orders.modal.in_stock')}: {availableStockForItem}
                                </p>
                            )}
                        </div>
                        <div className="col-span-2 p-2.5 text-sm text-right text-text-secondary dark:text-dark-text-secondary">{formatCurrency(item.price || 0)}</div>
                        <div className="col-span-2 p-2.5 text-sm text-right font-semibold text-text-primary dark:text-dark-text-primary">{formatCurrency((item.price || 0) * (item.quantity || 0))}</div>
                        <button onClick={() => handleRemoveItem(index)} className="col-span-1 text-red-500 hover:text-red-700 mt-2">&times;</button>
                    </div>
                )})}
                </div>
                 <button onClick={handleAddItem} className="mt-2 text-sm text-primary font-medium hover:underline">{t('orders.modal.add_item_button')}</button>
            </div>

            <div className="border-t border-border dark:border-dark-border pt-4 mt-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={codeInputValue}
                        onChange={(e) => setCodeInputValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCodeScanned(codeInputValue); }}
                        placeholder={t('orders.modal.code_input_placeholder')}
                        className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white"
                    />
                    <button 
                        type="button" 
                        onClick={() => setIsScannerOpen(true)}
                        className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-opacity-90 transition whitespace-nowrap flex items-center gap-2"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v2a1 1 0 11-2 0V4zm14 0a1 1 0 00-1-1h-4a1 1 0 100 2h3v2a1 1 0 102 0V4zm-2 12a1 1 0 01-1 1h-4a1 1 0 110-2h3v-2a1 1 0 112 0v3zm-8-1a1 1 0 00-1-1H5v-2a1 1 0 10-2 0v3a1 1 0 001 1h4a1 1 0 100-2z" clipRule="evenodd" /></svg>
                       {t('orders.modal.scan_code_button')}
                    </button>
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border dark:border-dark-border pt-4 mt-4">
                <div>
                     <label className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('orders.modal.salesperson')}</label>
                    <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white">
                        <option value="">{t('orders.modal.select_salesperson')}</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                     <label className="block mt-4 mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('orders.modal.payment_method')}</label>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white">
                            {paymentOptions.map(method => (
                                <option key={method} value={method}>{t(`orders.payment_methods.${method}`)}</option>
                            ))}
                        </select>
                         {paymentMethod === 'BenefitPay' && (
                            <input type="text" value={benefitPayRef} onChange={e => setBenefitPayRef(e.target.value)} placeholder={t('orders.modal.benefit_pay_ref')} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" />
                         )}
                    </div>
                    <div className="mt-4">
                        <label htmlFor="delivery-option" className="block mb-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{t('orders.modal.delivery_option')}</label>
                        <select
                            id="delivery-option"
                            value={deliveryOption}
                            onChange={(e) => setDeliveryOption(e.target.value as any)}
                            disabled={!selectedCustomer && !requestToConvert?.customerAddress}
                            className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:placeholder-gray-400 dark:text-white disabled:opacity-50"
                        >
                            <option value="none">{t('orders.modal.delivery_options.none')}</option>
                            <option value="charge">{t('orders.modal.delivery_options.charge', { fee: formatCurrency(DELIVERY_FEE) })}</option>
                            <option value="free">{t('orders.modal.delivery_options.free')}</option>
                        </select>
                        {(!selectedCustomer?.address && !requestToConvert?.customerAddress) && (customerId || requestToConvert) && (
                            <p className="mt-1 text-xs text-red-500">
                            {t('orders.modal.delivery_not_available_no_address')}
                            </p>
                        )}
                    </div>
                </div>
                <div className="space-y-2 text-right">
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary dark:text-dark-text-secondary">{t('orders.modal.subtotal')}:</span>
                        <span className="font-semibold text-text-primary dark:text-dark-text-primary">{formatCurrency(subtotal)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <label className="text-text-secondary dark:text-dark-text-secondary">{t('orders.modal.discount')}:</label>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <button onClick={handleApplyOffer} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{t('orders.modal.apply_offer_button')}</button>
                          <input 
                            type="number" 
                            value={discount} 
                            onChange={e => handleDiscountChange(e.target.value)} 
                            className="w-20 text-right bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary dark:bg-dark-background dark:border-dark-border dark:text-white"
                          />
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <input
                            type="checkbox"
                            id="vat-toggle"
                            checked={isVatEnabled}
                            onChange={(e) => setIsVatEnabled(e.target.checked)}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label htmlFor="vat-toggle" className="text-text-secondary dark:text-dark-text-secondary cursor-pointer select-none">
                            {t('orders.modal.vat') || 'VAT (%)'}:
                          </label>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <input 
                            type="number" 
                            value={vatPercent} 
                            disabled={!isVatEnabled}
                            min="0"
                            max="100"
                            step="0.1"
                            onChange={e => setVatPercent(parseFloat(e.target.value) || 0)} 
                            className={`w-20 text-right bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary dark:bg-dark-background dark:border-dark-border dark:text-white ${!isVatEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                        </div>
                    </div>
                    {(deliveryOption === 'charge' || deliveryOption === 'free') && (
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary dark:text-dark-text-secondary">{t('orders.modal.delivery_fee')}:</span>
                            <span className="font-semibold text-text-primary dark:text-dark-text-primary">
                                {formatCurrency(deliveryOption === 'charge' ? DELIVERY_FEE : 0)}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-xl border-t border-border dark:border-dark-border pt-2 mt-2">
                        <span className="font-bold text-text-primary dark:text-dark-text-primary">{t('orders.modal.grand_total')}:</span>
                        <span className="font-bold text-green-600">{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse">
             <button onClick={onClose} disabled={isSaving} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-focus rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 disabled:opacity-50">{t('orders.modal.cancel_button')}</button>
             <button onClick={handleSubmit} disabled={isSaving} type="button" className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary-focus font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50">
                {isSaving ? t('orders.modal.saving_button') : saveButtonText}
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
    {isAddCustomerModalOpen && (
      <AddCustomerModal 
        onClose={() => setIsAddCustomerModalOpen(false)}
        onSave={handleSaveNewCustomer}
      />
    )}
    {isScannerOpen && (
        <BarcodeScanner 
            onScan={handleCodeScanned}
            onClose={() => setIsScannerOpen(false)}
        />
    )}
    </>
  );
};

export default NewOrderModal;