import React, { useState, useMemo } from 'react';
import { X, ShoppingCart, Send, CheckCircle2, AlertTriangle, Building2, Calculator, Printer } from 'lucide-react';
import { Product, Supplier } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';

interface SmartReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  suppliers: Supplier[];
}

interface ReorderItem {
  productId: string;
  product: Product;
  currentStock: number;
  threshold: number;
  suggestedQty: number;
  orderQty: number;
  purchasePrice: number;
  selected: boolean;
}

export const SmartReorderModal: React.FC<SmartReorderModalProps> = ({
  isOpen,
  onClose,
  products,
  suppliers
}) => {
  const { language } = useTranslation();
  const { addPurchaseOrder } = useAppContext();
  const isAr = language === 'ar';

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [createdPoSuccess, setCreatedPoSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize reorder items from products that are low on stock
  const lowStockProducts = useMemo(() => {
    return products.filter(p => {
      const threshold = p.lowStockThreshold ?? 5;
      return p.stock <= threshold && p.status !== 'Archived';
    });
  }, [products]);

  const [reorderList, setReorderList] = useState<Record<string, { orderQty: number; selected: boolean }>>({});

  // Sync reorder list when lowStockProducts change
  React.useEffect(() => {
    const initial: Record<string, { orderQty: number; selected: boolean }> = {};
    lowStockProducts.forEach(p => {
      const threshold = p.lowStockThreshold ?? 5;
      const target = Math.max(1, (threshold * 2) - Math.max(0, p.stock));
      initial[p.id] = {
        orderQty: target,
        selected: true
      };
    });
    setReorderList(initial);
    setCreatedPoSuccess(false);
  }, [lowStockProducts, isOpen]);

  // Combined item list with supplier info
  const items: ReorderItem[] = useMemo(() => {
    return lowStockProducts.map(p => {
      const threshold = p.lowStockThreshold ?? 5;
      const state = reorderList[p.id] || {
        orderQty: Math.max(1, (threshold * 2) - Math.max(0, p.stock)),
        selected: true
      };
      return {
        productId: p.id,
        product: p,
        currentStock: p.stock,
        threshold,
        suggestedQty: Math.max(1, (threshold * 2) - Math.max(0, p.stock)),
        orderQty: state.orderQty,
        purchasePrice: p.purchasePrice || 0,
        selected: state.selected
      };
    }).filter(item => {
      if (selectedSupplierId === 'all') return true;
      return item.product.supplierId === selectedSupplierId;
    });
  }, [lowStockProducts, reorderList, selectedSupplierId]);

  const selectedItems = useMemo(() => items.filter(i => i.selected && i.orderQty > 0), [items]);

  const totalUnits = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + curr.orderQty, 0);
  }, [selectedItems]);

  const totalEstimatedCost = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + (curr.orderQty * curr.purchasePrice), 0);
  }, [selectedItems]);

  const handleQtyChange = (productId: string, qty: number) => {
    setReorderList(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        orderQty: Math.max(0, qty)
      }
    }));
  };

  const handleToggleSelect = (productId: string) => {
    setReorderList(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected: !prev[productId]?.selected
      }
    }));
  };

  const handleSelectAll = (select: boolean) => {
    setReorderList(prev => {
      const next = { ...prev };
      items.forEach(i => {
        if (next[i.productId]) {
          next[i.productId].selected = select;
        }
      });
      return next;
    });
  };

  const handleCreatePurchaseOrders = async () => {
    if (selectedItems.length === 0) return;
    setIsSubmitting(true);
    try {
      // Group items by supplierId
      const bySupplier: Record<string, typeof selectedItems> = {};
      selectedItems.forEach(item => {
        const supp = item.product.supplierId || 'GENERAL';
        if (!bySupplier[supp]) bySupplier[supp] = [];
        bySupplier[supp].push(item);
      });

      for (const [suppId, suppItems] of Object.entries(bySupplier)) {
        const poItems = suppItems.map(i => ({
          productId: i.productId,
          quantity: i.orderQty,
          purchasePrice: i.purchasePrice
        }));
        const totalAmount = suppItems.reduce((acc, i) => acc + (i.orderQty * i.purchasePrice), 0);

        await addPurchaseOrder({
          date: new Date().toISOString(),
          supplierId: suppId,
          items: poItems,
          totalAmount,
          status: 'Pending'
        });
      }

      setCreatedPoSuccess(true);
      setTimeout(() => {
        setCreatedPoSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to create purchase orders:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (selectedItems.length === 0) return;

    let supplierName = '';
    let supplierPhone = '';
    if (selectedSupplierId !== 'all') {
      const supp = suppliers.find(s => s.id === selectedSupplierId);
      if (supp) {
        supplierName = supp.name;
        supplierPhone = supp.phone ? supp.phone.replace(/[^0-9]/g, '') : '';
      }
    }

    const lines = [
      `*طلب بضاعة وتوريد جديد — Modern House*`,
      supplierName ? `السادة: ${supplierName}` : '',
      `التاريخ: ${new Date().toLocaleDateString('ar-BH')}`,
      `---------------------------------`,
      ...selectedItems.map((item, idx) => 
        `${idx + 1}. *${item.product.name}*` +
        (item.product.sku ? ` (${item.product.sku})` : '') +
        `\n   الكمية المطلوبة: *${item.orderQty} قطعة*`
      ),
      `---------------------------------`,
      `إجمالي الأصناف: ${selectedItems.length}`,
      `إجمالي القطع: ${totalUnits}`,
      `\nيرجى تأكيد الاستلام وموعد التوريد. شكراً لكم.`
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join('\n'));
    const url = supplierPhone 
      ? `https://wa.me/${supplierPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {isAr ? 'إعادة الطلب الذكي للنواقص' : 'Smart Inventory Reordering'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr 
                  ? 'اقتراح كميات التوريد تلقائياً بناءً على حد الأمان ومخزون كل صنف' 
                  : 'Automatically suggest replenishment quantities based on safety stock thresholds'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Summary Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'تصفية بالمورد:' : 'Filter by Supplier:'}
            </span>
            <select
              value={selectedSupplierId}
              onChange={e => setSelectedSupplierId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="all">{isAr ? 'جميع الموردين' : 'All Suppliers'}</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSelectAll(true)}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
            >
              {isAr ? 'تحديد الكل' : 'Select All'}
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={() => handleSelectAll(false)}
              className="text-slate-500 hover:underline"
            >
              {isAr ? 'إلغاء التحديد' : 'Deselect All'}
            </button>
          </div>
        </div>

        {/* Product Items Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {items.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'لا توجد نواقص مطابقة للشرط الحالي' : 'No low stock items match the criteria'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isAr ? 'جميع الأصناف أعلى من حد الأمان المحدد لها.' : 'All items are above their safety thresholds.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map(item => {
                const supp = suppliers.find(s => s.id === item.product.supplierId);
                const isOutOfStock = item.currentStock <= 0;

                return (
                  <div 
                    key={item.productId}
                    className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      item.selected 
                        ? 'bg-white dark:bg-slate-800 border-amber-500/40 shadow-sm' 
                        : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input 
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleSelect(item.productId)}
                        className="w-4 h-4 text-amber-500 rounded border-slate-300 dark:border-slate-700 focus:ring-amber-400"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.product.name}
                          </h4>
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20">
                              {isAr ? 'نفد' : 'Out'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                              {isAr ? 'منخفض' : 'Low'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.product.sku && <span>SKU: {item.product.sku}</span>}
                          {supp && <span>• {supp.name}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Stock stats */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <span className="block text-[10px] text-slate-400">{isAr ? 'المتوفر' : 'Stock'}</span>
                        <span className={`font-bold ${isOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.currentStock}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] text-slate-400">{isAr ? 'حد الأمان' : 'Safety'}</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          {item.threshold}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] text-slate-400">{isAr ? 'المقترح' : 'Suggested'}</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          +{item.suggestedQty}
                        </span>
                      </div>

                      {/* Order Quantity Input */}
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
                        <button
                          type="button"
                          disabled={!item.selected || item.orderQty <= 1}
                          onClick={() => handleQtyChange(item.productId, item.orderQty - 1)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 disabled:opacity-30"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          disabled={!item.selected}
                          value={item.orderQty}
                          onChange={e => handleQtyChange(item.productId, parseInt(e.target.value) || 0)}
                          className="w-12 text-center text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none"
                        />
                        <button
                          type="button"
                          disabled={!item.selected}
                          onClick={() => handleQtyChange(item.productId, item.orderQty + 1)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      {item.purchasePrice > 0 && (
                        <div className="text-end min-w-[70px] hidden sm:block">
                          <span className="block text-[10px] text-slate-400">{isAr ? 'التكلفة' : 'Cost'}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {(item.orderQty * item.purchasePrice).toFixed(2)} د.ب
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer / Action Summary */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-slate-500">{isAr ? 'الأصناف المحددة:' : 'Selected:'} </span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedItems.length}</span>
            </div>
            <div>
              <span className="text-slate-500">{isAr ? 'إجمالي القطع:' : 'Total Units:'} </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{totalUnits}</span>
            </div>
            {totalEstimatedCost > 0 && (
              <div>
                <span className="text-slate-500">{isAr ? 'التكلفة المقدرة:' : 'Est. Cost:'} </span>
                <span className="font-bold text-slate-900 dark:text-white">{totalEstimatedCost.toFixed(2)} د.ب</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={selectedItems.length === 0}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
              title="مشاركة طلب التوريد عبر واتساب"
            >
              <Send className="w-4 h-4" />
              <span>{isAr ? 'واتساب للمورد' : 'Send WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handleCreatePurchaseOrders}
              disabled={selectedItems.length === 0 || isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-amber-500/20"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {createdPoSuccess 
                  ? (isAr ? '✓ تم إنشاء أمر الشراء' : '✓ PO Created') 
                  : (isAr ? 'إنشاء أمر شراء بالنظام' : 'Create System PO')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
