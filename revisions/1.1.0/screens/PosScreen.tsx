import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Product, OrderItem, Order, Customer } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import PrintOrderModal from '../components/sales/PrintInvoiceModal';
import BarcodeScanner from '../components/sales/BarcodeScanner';
import AddCustomerModal from '../components/customers/AddCustomerModal';
import PosThermalReceiptModal from '../components/pos/PosThermalReceiptModal';
import PosHeldOrdersModal, { HeldOrder } from '../components/pos/PosHeldOrdersModal';
import PosShiftSummaryModal from '../components/pos/PosShiftSummaryModal';
import PosQuickCustomItemModal from '../components/pos/PosQuickCustomItemModal';
import PosShortcutsModal from '../components/pos/PosShortcutsModal';
import {
  playScanBeep,
  playSuccessChime,
  playErrorTone,
  getPosSoundEnabled,
  setPosSoundEnabled,
} from '../components/pos/posAudio';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  CreditCard,
  Banknote,
  User,
  Truck,
  Barcode,
  PauseCircle,
  LayoutGrid,
  List,
  Volume2,
  VolumeX,
  HelpCircle,
  History,
  Trash2,
  Check,
  Percent,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StorageImage } from '../components/StorageImage';

const HELD_ORDERS_STORAGE_KEY = 'pos_held_orders_v1';

const PosScreen: React.FC = () => {
  const { products, customers, employees, addOrder, currentUser, orders, addCustomer } = useAppContext();
  const { formatCurrency, t, language } = useTranslation();

  // Search and category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart state
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>(currentUser?.id || employees[0]?.id || '');
  const [deliveryOption, setDeliveryOption] = useState<'none' | 'charge' | 'free'>('none');

  // Pricing & Discounts
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [isVatEnabled, setIsVatEnabled] = useState<boolean>(true);
  const [vatPercent, setVatPercent] = useState<number>(10);

  // Payments & Cash Tender
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'BenefitPay'>('Cash');
  const [benefitPayRefPos, setBenefitPayRefPos] = useState<string>('');
  const [cashTendered, setCashTendered] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals state
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);
  const [isShiftSummaryModalOpen, setIsShiftSummaryModalOpen] = useState(false);
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Completed Order & Receipts
  const [orderToPrintThermal, setOrderToPrintThermal] = useState<{
    order: Order;
    amountTendered?: number;
    changeDue?: number;
  } | null>(null);
  const [orderToPrintA4, setOrderToPrintA4] = useState<Order | null>(null);

  // Held Orders State
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    try {
      const saved = localStorage.getItem(HELD_ORDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sound feedback toggle
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(getPosSoundEnabled());

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setPosSoundEnabled(next);
  };

  // Toast state
  const [toastMessage, setToastMessage] = useState<{ message: string; id: number } | null>(null);

  const DELIVERY_FEE = 2;

  // Persist held orders
  useEffect(() => {
    try {
      localStorage.setItem(HELD_ORDERS_STORAGE_KEY, JSON.stringify(heldOrders));
    } catch (e) {
      console.error('Failed to save held orders', e);
    }
  }, [heldOrders]);

  // Sync employee ID
  useEffect(() => {
    if (!employeeId && employees.length > 0) {
      setEmployeeId(currentUser?.id || employees[0]?.id || '');
    }
  }, [employees, currentUser, employeeId]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set(products.filter(p => p.status === 'Active').map(p => p.category));
    return ['All', ...Array.from(cats).sort()];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (product.status !== 'Active') return false;

      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesCategory;

      const matchesSearch =
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        (product.barcode && product.barcode.includes(q)) ||
        product.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.product.salePrice * item.quantity, 0);
  }, [cartItems]);

  const totalPurchaseCost = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.product.purchasePrice * item.quantity, 0);
  }, [cartItems]);

  // Calculate discount amount in BHD
  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      const pct = Math.max(0, Math.min(discountValue, 100));
      return (subtotal * pct) / 100;
    }
    return Math.min(discountValue, subtotal);
  }, [subtotal, discountType, discountValue]);

  // Effective discount percentage (for order record)
  const effectiveDiscountPercent = useMemo(() => {
    if (subtotal <= 0) return 0;
    return Math.round((discountAmount / subtotal) * 100);
  }, [subtotal, discountAmount]);

  // VAT Amount
  const vatAmount = useMemo(() => {
    if (!isVatEnabled) return 0;
    const netAfterDiscount = Math.max(0, subtotal - discountAmount);
    return netAfterDiscount * (vatPercent / 100);
  }, [subtotal, discountAmount, isVatEnabled, vatPercent]);

  // Total
  const total = useMemo(() => {
    let finalTotal = Math.max(0, subtotal - discountAmount) + vatAmount;
    if (deliveryOption === 'charge') {
      finalTotal += DELIVERY_FEE;
    }
    return Math.round(finalTotal * 1000) / 1000;
  }, [subtotal, discountAmount, deliveryOption, vatAmount]);

  // Change Due calculation (for Cash payments)
  const parsedCashTendered = parseFloat(cashTendered) || 0;
  const changeDue = useMemo(() => {
    if (paymentMethod !== 'Cash' || parsedCashTendered <= 0) return 0;
    return Math.max(0, parsedCashTendered - total);
  }, [paymentMethod, parsedCashTendered, total]);

  // Cart helper functions
  const addToCart = (product: Product, qtyToAdd = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + qtyToAdd > product.stock) {
          playErrorTone();
          setToastMessage({
            message: language === 'ar' ? `الكمية غير متوفرة في المخزون (${product.name})` : `Out of stock limit reached (${product.name})`,
            id: Date.now(),
          });
          return prev;
        }
        playScanBeep();
        setToastMessage({
          message: `+${qtyToAdd} ${product.name}`,
          id: Date.now(),
        });
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + qtyToAdd } : item
        );
      }

      if (product.stock >= qtyToAdd) {
        playScanBeep();
        setToastMessage({
          message: `${product.name} ${language === 'ar' ? 'أضيف للسلة' : 'added to cart'}`,
          id: Date.now(),
        });
        return [...prev, { product, quantity: qtyToAdd }];
      }

      playErrorTone();
      return prev;
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              playErrorTone();
              setToastMessage({
                message: language === 'ar' ? 'تم بلوغ الحد الأقصى للمخزون' : 'Stock limit reached',
                id: Date.now(),
              });
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[];
    });
  };

  const setExactQuantity = (productId: string, qty: number) => {
    if (isNaN(qty) || qty < 1) return;
    setCartItems(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const clamped = Math.min(qty, item.product.stock);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    if (cartItems.length === 0) return;
    if (confirm(language === 'ar' ? 'هل أنت متأكد من رغبتك بإفراغ السلة الحالية؟' : 'Clear all items from current cart?')) {
      setCartItems([]);
      setDiscountValue(0);
      setCashTendered('');
      setBenefitPayRefPos('');
      setDeliveryOption('none');
    }
  };

  // Quick custom item handler
  const handleAddCustomItem = (item: { name: string; price: number; quantity: number }) => {
    const customProduct: Product = {
      id: `custom_${Date.now()}`,
      name: item.name,
      sku: 'SERVICE',
      barcode: '',
      category: 'Service',
      supplierId: '',
      purchasePrice: 0,
      salePrice: item.price,
      stock: 99999,
      lowStockThreshold: 0,
      status: 'Active',
    };
    addToCart(customProduct, item.quantity);
  };

  // Hold current order
  const handleHoldOrder = () => {
    if (cartItems.length === 0) {
      alert(language === 'ar' ? 'السلة فارغة، لا يوجد ما يتم تعليقه.' : 'Cart is empty. Nothing to hold.');
      return;
    }

    const customerObj = customers.find(c => c.id === customerId);
    const defaultName = customerObj?.name || (language === 'ar' ? 'عميل نقدي' : 'Walk-in');
    const promptNote = prompt(
      language === 'ar' ? 'أدخل ملاحظة أو اسم للطلب المعلق:' : 'Enter a reference note or customer name for this held order:',
      defaultName
    );

    if (promptNote === null) return; // User cancelled

    const newHeld: HeldOrder = {
      id: `held_${Date.now()}`,
      heldAt: new Date().toISOString(),
      customerName: promptNote.trim() || defaultName,
      customerId,
      items: [...cartItems],
      discount: effectiveDiscountPercent,
      note: promptNote.trim() || undefined,
      subtotal,
      total,
    };

    setHeldOrders(prev => [newHeld, ...prev]);
    // Clear active cart for next customer
    setCartItems([]);
    setDiscountValue(0);
    setCustomerId('');
    setCashTendered('');
    setBenefitPayRefPos('');
    setDeliveryOption('none');

    setToastMessage({
      message: language === 'ar' ? 'تم تعليق الطلب بنجاح' : 'Order parked on hold',
      id: Date.now(),
    });
  };

  // Resume a held order
  const handleResumeHeldOrder = (held: HeldOrder) => {
    if (cartItems.length > 0) {
      if (
        !confirm(
          language === 'ar'
            ? 'توجد عناصر في السلة الحالية. هل ترغب باستبدالها بالطلب المسترجع؟'
            : 'Active cart has items. Replace current cart with this held order?'
        )
      ) {
        return;
      }
    }

    setCartItems(held.items);
    setCustomerId(held.customerId || '');
    setDiscountType('percent');
    setDiscountValue(held.discount || 0);
    // Remove from held orders
    setHeldOrders(prev => prev.filter(o => o.id !== held.id));
    setIsHeldOrdersModalOpen(false);

    setToastMessage({
      message: language === 'ar' ? 'تم استرجاع الطلب المعلق' : 'Held order resumed',
      id: Date.now(),
    });
  };

  const handleDeleteHeldOrder = (orderId: string) => {
    setHeldOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const handleClearAllHeld = () => {
    setHeldOrders([]);
  };

  // Barcode scan handler
  const handleBarcodeScanned = (barcode: string) => {
    setIsBarcodeScannerOpen(false);
    const cleaned = barcode.trim();
    if (!cleaned) return;

    const matchedProduct = products.find(
      p =>
        p.status === 'Active' &&
        (p.barcode === cleaned || p.sku.toLowerCase() === cleaned.toLowerCase())
    );

    if (matchedProduct) {
      addToCart(matchedProduct);
    } else {
      playErrorTone();
      alert(language === 'ar' ? `لم يتم العثور على منتج بهذا الباركود: ${cleaned}` : `No product found with barcode: ${cleaned}`);
    }
  };

  // Search input keydown handler (supports USB hardware barcode scanners)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;

      // Try exact barcode match first
      const exactBarcode = products.find(
        p => p.status === 'Active' && p.barcode && p.barcode.toLowerCase() === q
      );
      if (exactBarcode) {
        addToCart(exactBarcode);
        setSearchQuery('');
        return;
      }

      // Try exact SKU match
      const exactSku = products.find(
        p => p.status === 'Active' && p.sku && p.sku.toLowerCase() === q
      );
      if (exactSku) {
        addToCart(exactSku);
        setSearchQuery('');
        return;
      }

      // If only 1 product matches search query, add it
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery('');
      }
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input field other than search
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'F2' || (e.key === '/' && !isInput)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F4' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        if (cartItems.length > 0 && !isProcessing) {
          handleCheckout();
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleHoldOrder();
      } else if (e.key === 'F9') {
        e.preventDefault();
        clearCart();
      } else if (e.key === 'F1') {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsBarcodeScannerOpen(false);
        setIsAddCustomerModalOpen(false);
        setIsHeldOrdersModalOpen(false);
        setIsShiftSummaryModalOpen(false);
        setIsCustomItemModalOpen(false);
        setIsShortcutsModalOpen(false);
        setOrderToPrintThermal(null);
        setOrderToPrintA4(null);
        setIsCustomerDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, isProcessing, heldOrders, customerId, subtotal, total]);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Checkout process
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert(language === 'ar' ? 'السلة فارغة.' : 'Cart is empty.');
      return;
    }

    if (paymentMethod === 'BenefitPay' && !benefitPayRefPos.trim()) {
      alert(language === 'ar' ? 'يرجى إدخال رقم العملية المرجعي لبنفت بي (BenefitPay Ref).' : 'Please enter BenefitPay Reference Number.');
      return;
    }

    if (paymentMethod === 'Cash' && parsedCashTendered > 0 && parsedCashTendered < total) {
      if (
        !confirm(
          language === 'ar'
            ? `المبلغ المدفوع (${formatCurrency(parsedCashTendered)}) أقل من الإجمالي (${formatCurrency(total)}). هل ترغب بالمتابعة كدفع جزئي؟`
            : `Cash tendered (${formatCurrency(parsedCashTendered)}) is less than total (${formatCurrency(total)}). Proceed anyway?`
        )
      ) {
        return;
      }
    }

    if (!employeeId) {
      alert(language === 'ar' ? 'يرجى اختيار البائع / الموظف المسؤول.' : 'Please select assigned seller / cashier.');
      return;
    }

    const finalCustomerId = customerId || 'Walk-in';

    const finalItems: OrderItem[] = cartItems.map(item => {
      const discountFactor = subtotal > 0 ? 1 - discountAmount / subtotal : 1;
      const itemNetTotal = item.product.salePrice * item.quantity * discountFactor;
      const itemVatAmount = isVatEnabled ? itemNetTotal * (vatPercent / 100) : 0;
      return {
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.salePrice,
        vatPercent: isVatEnabled ? vatPercent : 0,
        vatAmount: itemVatAmount,
      };
    });

    const orderData: Omit<Order, 'id' | 'orderNumber' | 'status'> = {
      date: new Date().toISOString(),
      customerId: finalCustomerId,
      items: finalItems,
      subtotal,
      discount: effectiveDiscountPercent,
      total,
      paymentMethod,
      employeeId,
      ...(paymentMethod === 'BenefitPay' ? { benefitPayRef: benefitPayRefPos.trim() } : {}),
    };

    if (deliveryOption === 'charge') {
      orderData.deliveryFee = DELIVERY_FEE;
    } else if (deliveryOption === 'free') {
      orderData.deliveryFee = 0;
    }

    setIsProcessing(true);
    try {
      const orderId = await addOrder(orderData, deliveryOption);
      if (orderId) {
        playSuccessChime();

        try {
          // Desktop receipts use the committed record and its actual order number.
          const receiptOrder: Order = window.omsDesktop
            ? await window.omsDesktop.call('get', 'orders', orderId)
            : {
              ...orderData,
              id: orderId,
              orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
              status: 'Completed',
            };
          if (!receiptOrder) throw new Error('Saved order could not be loaded');

          setOrderToPrintThermal({
            order: receiptOrder,
            amountTendered: parsedCashTendered > 0 ? parsedCashTendered : total,
            changeDue: changeDue,
          });
        } catch (error) {
          console.error('Order saved, but receipt could not be prepared', error);
          alert(language === 'ar'
            ? `تم حفظ الطلب (${orderId})، ولكن تعذر تجهيز الإيصال. يمكنك طباعته من شاشة الطلبات.`
            : `Order saved (${orderId}), but the receipt could not be prepared. Print it from Orders.`);
        }

        // Reset cart for next order
        setCartItems([]);
        setDiscountValue(0);
        setCustomerId('');
        setCustomerSearchQuery('');
        setSearchQuery('');
        setBenefitPayRefPos('');
        setCashTendered('');
        setDeliveryOption('none');
      }
    } catch (error: any) {
      console.error(error);
      playErrorTone();
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Selected customer object
  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedCashier = employees.find(e => e.id === employeeId);

  // Filtered customers for search dropdown
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return customers.slice(0, 10);
    return customers.filter(
      c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    ).slice(0, 10);
  }, [customers, customerSearchQuery]);

  return (
    <div className="flex flex-col gap-3 h-auto min-h-full xl:h-[calc(100vh-5.5rem)] relative">
      {/* Mobile Catalog vs Cart Switcher */}
      <div className="xl:hidden flex rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 p-1 flex-shrink-0 shadow-xs">
        <button
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'catalog'
              ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>{language === 'ar' ? 'المنتجات والبحث' : 'Products & Search'}</span>
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'cart'
              ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{language === 'ar' ? 'السلة والدفع' : 'Cart & Checkout'}</span>
          {cartItems.length > 0 && (
            <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1 rtl:ml-0 rtl:mr-1">
              {cartItems.reduce((acc, it) => acc + it.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-5 flex-1 min-h-0">
        {/* LEFT SECTION: Products & Search Catalog */}
        <div className={`flex-1 flex-col min-w-0 space-y-3.5 h-full ${mobileTab === 'cart' ? 'hidden xl:flex' : 'flex'}`}>
        {/* Actions & Filters Toolbar */}
        <div className="bg-card dark:bg-dark-card p-3 rounded-2xl shadow-xs border border-border dark:border-dark-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search bar & Barcode scan button */}
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 rtl:left-auto rtl:right-3.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={
                  language === 'ar'
                    ? 'بحث بالاسم، الكود، أو الباركود (F2)...'
                    : 'Search product, SKU, or barcode (F2)...'
                }
                className="w-full pl-9 pr-8 rtl:pl-8 rtl:pr-9 py-2 bg-gray-100 dark:bg-gray-800/80 border border-transparent focus:border-primary rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Camera Barcode Scanner Button */}
            <button
              onClick={() => setIsBarcodeScannerOpen(true)}
              className="p-2 sm:px-3 sm:py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0"
              title={language === 'ar' ? 'مسح باركود بالكاميرا' : 'Camera Barcode Scanner'}
            >
              <Barcode className="w-4 h-4" />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'كاميرا' : 'Scan'}
              </span>
            </button>
          </div>

          {/* Quick POS Utilities (Held Orders, Custom Item, Shift Summary, Sound, Layout, Shortcuts) */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Custom Item */}
            <button
              onClick={() => setIsCustomItemModalOpen(true)}
              className="p-2 text-text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors relative"
              title={language === 'ar' ? 'إضافة خدمة أو صنف مخصص' : 'Add Custom Item / Service'}
            >
              <PlusCircle className="w-4 h-4" />
            </button>

            {/* Held Orders Button */}
            <button
              onClick={() => setIsHeldOrdersModalOpen(true)}
              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors relative"
              title={language === 'ar' ? 'الطلبات المعلقة' : 'Parked Orders'}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {language === 'ar' ? 'المعلقة' : 'Held'}
              </span>
              {heldOrders.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {heldOrders.length}
                </span>
              )}
            </button>

            {/* Daily Shift Summary (Z-Report) */}
            <button
              onClick={() => setIsShiftSummaryModalOpen(true)}
              className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title={language === 'ar' ? 'ملخص مبيعات اليوم والوردية' : 'Daily Shift Summary'}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {language === 'ar' ? 'الوردية' : 'Shift'}
              </span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl transition-colors ${
                soundEnabled
                  ? 'text-primary bg-primary/10 hover:bg-primary/20'
                  : 'text-gray-400 hover:text-gray-600 bg-gray-100 dark:bg-gray-800'
              }`}
              title={soundEnabled ? (language === 'ar' ? 'كتم الصوت' : 'Mute Sound') : (language === 'ar' ? 'تفعيل الصوت' : 'Enable Sound')}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-dark-card text-primary shadow-xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-dark-card text-primary shadow-xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Shortcuts Help */}
            <button
              onClick={() => setIsShortcutsModalOpen(true)}
              className="p-2 text-gray-400 hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              title="Keyboard Shortcuts (F1)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hidescrollbar">
          {categories.map(cat => {
            const count =
              cat === 'All'
                ? products.filter(p => p.status === 'Active').length
                : products.filter(p => p.status === 'Active' && p.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-card dark:bg-dark-card text-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 border border-border dark:border-dark-border'
                }`}
              >
                <span>{cat === 'All' ? (language === 'ar' ? 'الكل' : 'All') : cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Products Grid / List View */}
        <div className="flex-1 overflow-y-auto xl:h-0 pr-1">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 pb-8">
              {filteredProducts.map(product => {
                const inCartItem = cartItems.find(it => it.product.id === product.id);
                const inCartQty = inCartItem?.quantity || 0;
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`group bg-card dark:bg-dark-card rounded-2xl p-2.5 shadow-xs border transition-all flex flex-col justify-between select-none relative ${
                      isOutOfStock
                        ? 'opacity-45 cursor-not-allowed border-dashed border-red-300 dark:border-red-900/50'
                        : 'border-border dark:border-dark-border hover:border-primary hover:shadow-md cursor-pointer active:scale-98'
                    }`}
                  >
                    {/* Badge: Items currently in cart */}
                    {inCartQty > 0 && (
                      <span className="absolute top-2 left-2 rtl:left-auto rtl:right-2 z-10 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        {inCartQty}
                      </span>
                    )}

                    {/* Stock Alert Badge */}
                    <span
                      className={`absolute top-2 right-2 rtl:right-auto rtl:left-2 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        isOutOfStock
                          ? 'bg-red-500 text-white'
                          : isLowStock
                          ? 'bg-amber-500 text-white'
                          : 'bg-black/40 text-white backdrop-blur-xs'
                      }`}
                    >
                      {isOutOfStock
                        ? (language === 'ar' ? 'نفد' : 'Out')
                        : `${product.stock} ${language === 'ar' ? 'قطعة' : 'left'}`}
                    </span>

                    {/* Product Image */}
                    <div className="h-28 sm:h-32 bg-gray-50 dark:bg-gray-800/60 rounded-xl overflow-hidden flex items-center justify-center relative mb-2">
                      {product.imageUrl ? (
                        <StorageImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-[10px] font-mono">
                          {product.category || 'Product'}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-text-primary dark:text-dark-text-primary line-clamp-2 leading-tight">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-text-secondary dark:text-dark-text-secondary truncate font-mono">
                        {product.barcode || product.sku}
                      </p>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-2.5 pt-2 border-t border-border/50 dark:border-dark-border/50 flex items-center justify-between">
                      <span className="text-primary font-bold text-sm">
                        {formatCurrency(product.salePrice)}
                      </span>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-primary group-hover:text-white text-text-secondary flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-16 text-center text-text-secondary dark:text-dark-text-secondary flex flex-col items-center justify-center">
                  <Search className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="font-semibold text-sm">
                    {language === 'ar' ? 'لا توجد منتجات مطابقة للبحث' : 'No products found'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {language === 'ar' ? 'جرّب البحث باسم آخر أو إزالة فلتر الفئة' : 'Try another query or clear category filter'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Compact List View */
            <div className="space-y-1.5 pb-8">
              {filteredProducts.map(product => {
                const inCartItem = cartItems.find(it => it.product.id === product.id);
                const inCartQty = inCartItem?.quantity || 0;
                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`bg-card dark:bg-dark-card p-2.5 rounded-xl border border-border dark:border-dark-border flex items-center justify-between gap-3 transition-colors ${
                      isOutOfStock
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:border-primary cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center text-[9px] text-gray-400">
                        {product.imageUrl ? (
                          <StorageImage src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          'IMG'
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-text-primary dark:text-dark-text-primary truncate">
                            {product.name}
                          </h4>
                          {inCartQty > 0 && (
                            <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                              x{inCartQty}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-text-secondary dark:text-dark-text-secondary font-mono flex items-center gap-2">
                          <span>{product.sku}</span>
                          <span>•</span>
                          <span>{product.category}</span>
                          <span>•</span>
                          <span className={product.stock <= 3 ? 'text-amber-500 font-bold' : ''}>
                            {language === 'ar' ? `المتبقي: ${product.stock}` : `Stock: ${product.stock}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary text-sm whitespace-nowrap">
                        {formatCurrency(product.salePrice)}
                      </span>
                      <button
                        disabled={isOutOfStock}
                        className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart, Customer, Discounts & Checkout Panel */}
      <div className={`w-full xl:w-[420px] flex-shrink-0 bg-card dark:bg-dark-card rounded-2xl shadow-md flex flex-col border border-border dark:border-dark-border h-full overflow-hidden ${mobileTab === 'catalog' ? 'hidden xl:flex' : 'flex'}`}>
        {/* Cart Header */}
        <div className="p-3.5 border-b border-border dark:border-dark-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileTab('catalog')}
              className="xl:hidden p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg flex items-center gap-0.5 text-xs font-semibold mr-1 rtl:mr-0 rtl:ml-1"
              title={language === 'ar' ? 'الرجوع للمنتجات' : 'Back to products'}
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'سلة الطلب الحالي' : 'Active Order'}
              </h3>
              <p className="text-[11px] text-text-secondary dark:text-dark-text-secondary">
                {cartItems.reduce((acc, it) => acc + it.quantity, 0)} {language === 'ar' ? 'قطع مختارة' : 'items total'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Hold Order */}
            <button
              onClick={handleHoldOrder}
              disabled={cartItems.length === 0}
              className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-40 transition-colors"
              title={language === 'ar' ? 'تعليق الطلب (F8)' : 'Park / Hold Cart (F8)'}
            >
              <PauseCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'تعليق' : 'Hold'}</span>
            </button>

            {/* Clear Cart */}
            <button
              onClick={clearCart}
              disabled={cartItems.length === 0}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-40 transition-colors"
              title={language === 'ar' ? 'إفراغ السلة (F9)' : 'Clear Cart (F9)'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customer & Cashier Selector */}
        <div className="p-3 border-b border-border dark:border-dark-border bg-gray-50/50 dark:bg-gray-900/30 space-y-2">
          {/* Customer Search / Selection */}
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 rtl:left-auto rtl:right-3" />
                <input
                  type="text"
                  value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone})` : customerSearchQuery}
                  onChange={e => {
                    setCustomerId('');
                    setCustomerSearchQuery(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  placeholder={language === 'ar' ? 'عميل نقدي عام (أو ابحث بالاسم/الهاتف)...' : 'Walk-in (or search customer)...'}
                  className="w-full pl-8 pr-7 rtl:pl-7 rtl:pr-8 py-1.5 bg-white dark:bg-gray-800 border border-border dark:border-dark-border rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                />
                {(customerId || customerSearchQuery) && (
                  <button
                    onClick={() => {
                      setCustomerId('');
                      setCustomerSearchQuery('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Add New Customer Button */}
              <button
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="p-1.5 bg-primary text-white rounded-xl hover:bg-primary-hover flex-shrink-0 transition-colors"
                title={language === 'ar' ? 'إضافة عميل جديد' : 'New Customer'}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Dropdown Results */}
            {isCustomerDropdownOpen && !customerId && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-border/50 dark:divide-dark-border/50 text-xs">
                {/* Walk-in Customer option */}
                <div
                  onClick={() => {
                    setCustomerId('');
                    setCustomerSearchQuery('');
                    setIsCustomerDropdownOpen(false);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center font-semibold text-primary"
                >
                  <span>{language === 'ar' ? 'عميل نقدي عام (افتراضي)' : 'Walk-in Customer (Default)'}</span>
                </div>

                {filteredCustomers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setCustomerId(c.id);
                      setCustomerSearchQuery('');
                      setIsCustomerDropdownOpen(false);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                  >
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{c.name}</span>
                    <span className="text-gray-400 font-mono text-[11px]">{c.phone}</span>
                  </div>
                ))}

                {filteredCustomers.length === 0 && customerSearchQuery && (
                  <div className="p-2.5 text-center text-gray-400 text-xs">
                    {language === 'ar' ? 'لا يوجد عميل بهذا الاسم/الرقم' : 'No customer found'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cashier & Delivery Selectors Row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Cashier selector */}
            <div className="relative">
              <select
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="w-full py-1.5 px-2 bg-white dark:bg-gray-800 border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer font-medium"
              >
                <option value="">{language === 'ar' ? 'اختر الكاشير...' : 'Select Cashier...'}</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery option selector */}
            <div className="relative">
              <select
                value={deliveryOption}
                onChange={e => setDeliveryOption(e.target.value as any)}
                className="w-full py-1.5 px-2 bg-white dark:bg-gray-800 border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer font-medium"
              >
                <option value="none">{language === 'ar' ? 'بدون توصيل (استلام)' : 'No Delivery'}</option>
                <option value="charge">
                  {language === 'ar' ? `توصيل مدفوع (+${formatCurrency(DELIVERY_FEE)})` : `Delivery (+${formatCurrency(DELIVERY_FEE)})`}
                </option>
                <option value="free">{language === 'ar' ? 'توصيل مجاني' : 'Free Delivery'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {cartItems.map(item => (
            <div
              key={item.product.id}
              className="p-2.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-border/70 dark:border-dark-border/70 flex items-center justify-between gap-3 group"
            >
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold text-text-primary dark:text-dark-text-primary truncate">
                  {item.product.name}
                </h5>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-secondary dark:text-dark-text-secondary">
                  <span className="font-bold text-primary">
                    {formatCurrency(item.product.salePrice)}
                  </span>
                  <span>×</span>
                  <span>{item.quantity}</span>
                  <span>=</span>
                  <span className="font-extrabold text-text-primary dark:text-dark-text-primary">
                    {formatCurrency(item.product.salePrice * item.quantity)}
                  </span>
                </div>
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-white dark:bg-gray-900 border border-border dark:border-dark-border rounded-lg p-0.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.product.stock}
                    value={item.quantity}
                    onChange={e => setExactQuantity(item.product.id, parseInt(e.target.value) || 1)}
                    className="w-8 text-center text-xs font-bold bg-transparent border-none outline-none p-0"
                  />
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="p-1 text-gray-500 hover:text-primary transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove item"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {cartItems.length === 0 && (
            <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center text-text-secondary dark:text-dark-text-secondary p-4">
              <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold">
                {language === 'ar' ? 'السلة فارغة حالياً' : 'Cart is empty'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {language === 'ar' ? 'انقر على المنتجات أو امسح الباركود لإضافتها' : 'Click products or scan barcode to add'}
              </p>
            </div>
          )}
        </div>

        {/* Pricing, Discounts, Payment & Checkout Panel */}
        <div className="p-3.5 bg-gray-50 dark:bg-gray-900/80 border-t border-border dark:border-dark-border space-y-3 text-xs">
          {/* Discount Controls */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-border dark:border-dark-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-secondary dark:text-dark-text-secondary flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-primary" />
                {language === 'ar' ? 'الخصم' : 'Discount'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    discountType === 'percent'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    discountType === 'fixed'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  BHD
                </button>
                <input
                  type="number"
                  min="0"
                  step={discountType === 'percent' ? '1' : '0.1'}
                  value={discountValue || ''}
                  onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 px-1.5 py-0.5 text-right bg-gray-50 dark:bg-gray-900 border border-border dark:border-dark-border rounded-md text-xs font-bold outline-none"
                />
              </div>
            </div>

            {/* Quick Discount Presets */}
            <div className="flex items-center gap-1">
              {[5, 10, 15, 20].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setDiscountType('percent');
                    setDiscountValue(pct);
                  }}
                  className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                    discountType === 'percent' && discountValue === pct
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold'
                      : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              {discountValue > 0 && (
                <button
                  type="button"
                  onClick={() => setDiscountValue(0)}
                  className="px-2 py-1 rounded-md text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  {language === 'ar' ? 'إلغاء' : 'Reset'}
                </button>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <span className="font-semibold text-text-secondary dark:text-dark-text-secondary block">
              {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'Cash', label: language === 'ar' ? 'نقد (كاش)' : 'Cash', icon: Banknote },
                { id: 'Card', label: language === 'ar' ? 'بطاقة بنكية' : 'Card', icon: CreditCard },
                { id: 'BenefitPay', label: 'BenefitPay', icon: Banknote },
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`py-2 px-1.5 rounded-xl border font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-white dark:bg-gray-800 border-border dark:border-dark-border text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-750'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px] truncate">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BenefitPay Reference Number */}
          {paymentMethod === 'BenefitPay' && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-secondary dark:text-dark-text-secondary">
                {language === 'ar' ? 'رقم عملية بنفت بي المرجعي *' : 'BenefitPay Reference No. *'}
              </label>
              <input
                type="text"
                required
                value={benefitPayRefPos}
                onChange={e => setBenefitPayRefPos(e.target.value)}
                placeholder="e.g. 987654321"
                className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-border dark:border-dark-border rounded-xl text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
              />
            </div>
          )}

          {/* Cash Quick Tender & Change Calculator */}
          {paymentMethod === 'Cash' && total > 0 && (
            <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  {language === 'ar' ? 'المبلغ المستلم من العميل' : 'Cash Tendered'}
                </span>
                <input
                  type="number"
                  step="0.05"
                  value={cashTendered}
                  onChange={e => setCashTendered(e.target.value)}
                  placeholder={total.toFixed(3)}
                  className="w-24 px-2 py-1 text-right bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-bold outline-none text-emerald-900 dark:text-emerald-200"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCashTendered(total.toFixed(3))}
                  className="flex-1 py-1 bg-white dark:bg-gray-800 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-md text-[10px] font-bold border border-emerald-200 dark:border-emerald-800"
                >
                  {language === 'ar' ? 'المبلغ بالضبط' : 'Exact'}
                </button>
                {[5, 10, 20, 50].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCashTendered(val.toString())}
                    className="flex-1 py-1 bg-white dark:bg-gray-800 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-md text-[10px] font-bold border border-emerald-200 dark:border-emerald-800"
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Change Returned Highlight */}
              {parsedCashTendered > 0 && (
                <div className="pt-1.5 border-t border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-800 dark:text-emerald-300">
                    {language === 'ar' ? 'المتبقي للعميل (الباقي):' : 'Change Due:'}
                  </span>
                  <span className="text-base text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(changeDue)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Totals Summary */}
          <div className="space-y-1.5 pt-1 border-t border-border dark:border-dark-border text-xs">
            <div className="flex justify-between text-text-secondary dark:text-dark-text-secondary">
              <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>
                  {language === 'ar' ? 'الخصم' : 'Discount'} ({effectiveDiscountPercent}%)
                </span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            {/* VAT Toggle & Amount */}
            <div className="flex justify-between items-center text-text-secondary dark:text-dark-text-secondary">
              <span className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="vat-pos-toggle"
                  checked={isVatEnabled}
                  onChange={e => setIsVatEnabled(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                />
                <label htmlFor="vat-pos-toggle" className="cursor-pointer">
                  {language === 'ar' ? 'ضريبة القيمة المضافة (10%)' : 'VAT (10%)'}
                </label>
              </span>
              <span>{isVatEnabled ? formatCurrency(vatAmount) : formatCurrency(0)}</span>
            </div>

            {deliveryOption === 'charge' && (
              <div className="flex justify-between text-text-secondary dark:text-dark-text-secondary">
                <span>{language === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}</span>
                <span>{formatCurrency(DELIVERY_FEE)}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-2 border-t border-border dark:border-dark-border flex justify-between items-center">
              <span className="font-bold text-sm text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'المجموع الإجمالي' : 'Grand Total'}
              </span>
              <span className="text-xl font-extrabold text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isProcessing}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-bold text-base transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span>{language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>{language === 'ar' ? 'إتمام البيع والدفع' : 'Complete Sale & Pay'}</span>
                <span className="opacity-90 text-sm font-normal">({formatCurrency(total)})</span>
              </>
            )}
          </button>
        </div>
      </div>
      </div>

      {/* Mobile floating quick checkout bar when viewing catalog */}
      {cartItems.length > 0 && mobileTab === 'catalog' && (
        <div className="xl:hidden fixed bottom-20 left-3 right-3 z-40 animate-in slide-in-from-bottom-3 duration-200">
          <button
            onClick={() => setMobileTab('cart')}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 px-4 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-xs sm:text-sm border border-white/10"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                {cartItems.reduce((acc, it) => acc + it.quantity, 0)}
              </span>
              <span>{language === 'ar' ? 'سلة الطلب' : 'Active Order'}</span>
            </div>
            <div className="flex items-center gap-2 font-black text-primary">
              <span className="text-sm">{formatCurrency(total)}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180 text-white dark:text-slate-900" />
            </div>
          </button>
        </div>
      )}

      {/* MODALS */}

      {/* 1. Thermal Receipt Modal */}
      {orderToPrintThermal && (
        <PosThermalReceiptModal
          order={orderToPrintThermal.order}
          customer={customers.find(c => c.id === orderToPrintThermal.order.customerId)}
          cashier={employees.find(e => e.id === orderToPrintThermal.order.employeeId)}
          products={products}
          amountTendered={orderToPrintThermal.amountTendered}
          changeDue={orderToPrintThermal.changeDue}
          onClose={() => setOrderToPrintThermal(null)}
          onOpenA4Invoice={() => {
            const ord = orderToPrintThermal.order;
            setOrderToPrintThermal(null);
            setOrderToPrintA4(ord);
          }}
        />
      )}

      {/* 2. Formal A4 Invoice Modal */}
      {orderToPrintA4 && (
        <PrintOrderModal
          order={orderToPrintA4}
          onClose={() => setOrderToPrintA4(null)}
        />
      )}

      {/* 3. Barcode Scanner Camera Modal */}
      {isBarcodeScannerOpen && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setIsBarcodeScannerOpen(false)}
        />
      )}

      {/* 4. Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <AddCustomerModal
          onClose={() => setIsAddCustomerModalOpen(false)}
          onSave={async customerData => {
            try {
              const newCustomer = await addCustomer(customerData);
              setIsAddCustomerModalOpen(false);
              if (newCustomer) {
                setCustomerId(newCustomer as any);
              }
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      {/* 5. Held Orders Modal */}
      {isHeldOrdersModalOpen && (
        <PosHeldOrdersModal
          heldOrders={heldOrders}
          onResume={handleResumeHeldOrder}
          onDelete={handleDeleteHeldOrder}
          onClearAll={handleClearAllHeld}
          onClose={() => setIsHeldOrdersModalOpen(false)}
        />
      )}

      {/* 6. Shift / Daily Summary (Z-Report) Modal */}
      {isShiftSummaryModalOpen && (
        <PosShiftSummaryModal
          orders={orders}
          products={products}
          currentCashier={selectedCashier}
          onClose={() => setIsShiftSummaryModalOpen(false)}
        />
      )}

      {/* 7. Quick Custom Item / Service Modal */}
      {isCustomItemModalOpen && (
        <PosQuickCustomItemModal
          onAdd={handleAddCustomItem}
          onClose={() => setIsCustomItemModalOpen(false)}
        />
      )}

      {/* 8. Keyboard Shortcuts Modal */}
      {isShortcutsModalOpen && (
        <PosShortcutsModal onClose={() => setIsShortcutsModalOpen(false)} />
      )}

      {/* Dynamic Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key={toastMessage.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-6 right-6 md:right-1/2 md:translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center space-x-2.5 rtl:space-x-reverse z-50 pointer-events-none text-xs font-semibold"
          >
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span>{toastMessage.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hidescrollbar::-webkit-scrollbar {
          display: none;
        }
        .hidescrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default PosScreen;
