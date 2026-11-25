import React, { useState, useMemo } from 'react';
import { Request, RequestItem } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import { Trash2, Plus, X, PackageX, Package, Search, UserCheck, AlertCircle } from 'lucide-react';

interface EditRequestModalProps {
  request?: Request | null;
  onClose: () => void;
  onSave?: (requestId: string, updatedData: Partial<Request>) => Promise<void>;
  onAdd?: (newRequestData: Omit<Request, 'id' | 'date' | 'status'>) => Promise<void>;
}

const createEmptyCustomItem = (): RequestItem => ({
  productId: '',
  quantity: 1,
  name: '',
  sku: '',
  estimatedPrice: undefined,
  isCustom: true,
  notes: ''
});

const EditRequestModal: React.FC<EditRequestModalProps> = ({ request, onClose, onSave, onAdd }) => {
  const { t, language, formatNumber } = useTranslation();
  const { products, customers } = useAppContext();
  const isAr = language === 'ar';
  const isEditing = !!request;

  const [customerName, setCustomerName] = useState(request?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(request?.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(request?.customerAddress || '');
  const [notes, setNotes] = useState(request?.notes || '');
  const [isOutOfStockRequest, setIsOutOfStockRequest] = useState<boolean>(
    request ? Boolean(request.isOutOfStockRequest) : true
  );
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [items, setItems] = useState<RequestItem[]>(() => {
    if (request?.items && request.items.length > 0) {
      return request.items.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const inferredCustom = Boolean(
          item.isCustom ||
          (item.productId && item.productId.startsWith('custom_')) ||
          !prod
        );
        return {
          ...item,
          isCustom: inferredCustom,
          name: item.name || prod?.name || '',
          sku: item.sku || prod?.sku || '',
          estimatedPrice: item.estimatedPrice ?? prod?.salePrice,
          notes: item.notes || ''
        };
      });
    }
    return [createEmptyCustomItem()];
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aOut = (a.stock ?? 0) <= 0 ? 0 : 1;
      const bOut = (b.stock ?? 0) <= 0 ? 0 : 1;
      if (aOut !== bOut) return aOut - bOut;
      return a.name.localeCompare(b.name);
    });
  }, [products]);

  const matchingCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    const digits = q.replace(/\D/g, '');
    return customers
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (digits && (c.phone || '').replace(/\D/g, '').includes(digits))
      )
      .slice(0, 10);
  }, [customerSearch, customers]);

  const handlePickCustomer = (customerId: string) => {
    const picked = customers.find(c => c.id === customerId);
    if (!picked) return;
    setCustomerName(picked.name);
    setCustomerPhone(picked.phone || '');
    setCustomerAddress(picked.address || '');
    setCustomerSearch(picked.name);
    setShowCustomerDropdown(false);
  };

  const handleAddItem = (customMode = true) => {
    if (!customMode && sortedProducts.length > 0) {
      const first = sortedProducts[0];
      setItems(prev => [
        ...prev,
        {
          productId: first.id,
          quantity: 1,
          name: first.name,
          sku: first.sku,
          estimatedPrice: first.salePrice,
          isCustom: false,
          notes: ''
        }
      ]);
      return;
    }
    setItems(prev => [...prev, createEmptyCustomItem()]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleModeSwitch = (index: number, toCustom: boolean) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      if (toCustom) {
        return {
          ...item,
          isCustom: true,
          productId: item.productId?.startsWith('custom_') ? item.productId : '',
        };
      }
      const firstProd = sortedProducts[0];
      return {
        ...item,
        isCustom: false,
        productId: firstProd?.id || '',
        name: firstProd?.name || item.name || '',
        sku: firstProd?.sku || item.sku || '',
        estimatedPrice: firstProd?.salePrice ?? item.estimatedPrice,
      };
    }));
  };

  const updateItemField = (index: number, patch: Partial<RequestItem>) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleItemProductChange = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    updateItemField(index, {
      productId,
      name: prod?.name || '',
      sku: prod?.sku || '',
      estimatedPrice: prod?.salePrice,
      isCustom: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError(t('general.required_fields') || (isAr ? 'يرجى إدخال اسم العميل ورقم الهاتف.' : 'Please enter customer name and phone number.'));
      return;
    }

    const validItems: RequestItem[] = [];
    const stamp = Date.now();

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const qty = Math.max(1, Number(item.quantity) || 1);
      if (item.isCustom) {
        const cleanName = (item.name || '').trim();
        if (!cleanName) {
          setFormError(t('requests.edit_modal.no_items') || (isAr ? 'يرجى إدخال اسم الصنف المطلوب لكل سطر.' : 'Please enter the requested item name.'));
          return;
        }
        const normalized: RequestItem = {
          productId: item.productId && item.productId.startsWith('custom_') ? item.productId : `custom_${stamp}_${idx}`,
          quantity: qty,
          name: cleanName,
          isCustom: true
        };
        if (item.sku?.trim()) normalized.sku = item.sku.trim();
        if (item.estimatedPrice !== undefined && !Number.isNaN(Number(item.estimatedPrice)) && Number(item.estimatedPrice) > 0) {
          normalized.estimatedPrice = Number(item.estimatedPrice);
        }
        if (item.notes?.trim()) normalized.notes = item.notes.trim();
        validItems.push(normalized);
      } else {
        if (!item.productId) {
          setFormError(isAr ? 'يرجى اختيار منتج من القائمة أو تحويله إلى صنف غير متوفر.' : 'Please select a catalog product or switch to custom item.');
          return;
        }
        const prod = products.find(p => p.id === item.productId);
        const normalized: RequestItem = {
          productId: item.productId,
          quantity: qty,
          isCustom: false
        };
        if (prod?.name) normalized.name = prod.name;
        if (prod?.sku) normalized.sku = prod.sku;
        if (item.estimatedPrice !== undefined && !Number.isNaN(Number(item.estimatedPrice)) && Number(item.estimatedPrice) > 0) {
          normalized.estimatedPrice = Number(item.estimatedPrice);
        } else if (prod?.salePrice) {
          normalized.estimatedPrice = prod.salePrice;
        }
        if (item.notes?.trim()) normalized.notes = item.notes.trim();
        validItems.push(normalized);
      }
    }

    if (validItems.length === 0) {
      setFormError(t('requests.edit_modal.no_items') || (isAr ? 'يرجى إضافة صنف واحد على الأقل.' : 'Please add at least one item.'));
      return;
    }

    const hasOutOfStock = isOutOfStockRequest || validItems.some(it => {
      if (it.isCustom || it.productId.startsWith('custom_')) return true;
      const prod = products.find(p => p.id === it.productId);
      return (prod?.stock ?? 0) <= 0;
    });

    try {
      setIsSaving(true);
      if (isEditing && request && onSave) {
        await onSave(request.id, {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim() || undefined,
          notes: notes.trim() || undefined,
          isOutOfStockRequest: hasOutOfStock,
          items: validItems
        });
      } else if (onAdd) {
        await onAdd({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim() || undefined,
          notes: notes.trim() || undefined,
          source: 'showroom',
          isOutOfStockRequest: hasOutOfStock,
          items: validItems
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err?.message || (isAr ? 'تعذر حفظ الطلب' : 'Failed to save request'));
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
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-center items-center p-3 sm:p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card border border-border dark:border-dark-border overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-start gap-4 p-5 border-b border-border dark:border-dark-border bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <PackageX className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary dark:text-dark-text-primary">
                {isEditing
                  ? (t('requests.edit_modal.title') || (isAr ? 'تعديل طلب العميل' : 'Edit Customer Request'))
                  : (t('requests.edit_modal.add_title') || (isAr ? 'إضافة طلب جديد (صنف غير متوفر بالمخزون)' : 'New Customer Request (Out of Stock / Special Order)'))}
              </h3>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-0.5">
                {t('requests.edit_modal.add_subtitle') || (isAr ? 'تسجيل طلب عميل لصنف غير متوفر في المخزون أو غير مدرج في الكتالوج' : 'Record a customer request for an unlisted or out-of-stock item')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-700 dark:hover:text-white"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {formError && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Quick Select Existing Customer */}
            {customers.length > 0 && (
              <div className="relative p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                <label className="flex items-center gap-1.5 text-xs font-bold text-text-secondary dark:text-dark-text-secondary mb-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  <span>{t('requests.edit_modal.customer_lookup') || (isAr ? 'اختيار سريع لعميل مسجل (اختياري)' : 'Quick Select Existing Customer (Optional)')}</span>
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
                  <input
                    type="text"
                    value={customerSearch}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 180)}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    placeholder={t('requests.edit_modal.customer_lookup_placeholder') || (isAr ? 'ابحث باسم العميل أو رقم الهاتف للتعبئة التلقائية...' : 'Search by name or phone to auto-fill...')}
                    className="w-full ps-9 pe-3 py-2 text-xs sm:text-sm text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
                  />
                  {showCustomerDropdown && matchingCustomers.length > 0 && (
                    <ul className="absolute z-20 w-full mt-1 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-lg max-h-44 overflow-y-auto divide-y divide-border/50 dark:divide-dark-border/50">
                      {matchingCustomers.map(c => (
                        <li
                          key={c.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handlePickCustomer(c.id);
                          }}
                          className="px-3.5 py-2 text-xs sm:text-sm cursor-pointer hover:bg-primary/10 flex items-center justify-between gap-2"
                        >
                          <span className="font-semibold text-text-primary dark:text-white">{c.name}</span>
                          <span className="text-text-secondary dark:text-dark-text-secondary font-mono text-xs">{c.phone}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Customer Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                  {t('requests.detail_modal.customer_name') || (isAr ? 'اسم العميل' : 'Customer Name')} *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder={isAr ? 'مثال: أحمد علي' : 'e.g., Ahmed Ali'}
                  className="w-full text-sm p-2.5 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                  {t('requests.detail_modal.customer_phone') || (isAr ? 'هاتف العميل' : 'Customer Phone')} *
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder={isAr ? 'مثال: 33001122' : 'e.g., 33001122'}
                  className="w-full text-sm p-2.5 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                {t('requests.detail_modal.customer_address') || (isAr ? 'عنوان العميل' : 'Customer Address')}
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder={isAr ? 'اختياري: المنطقة / المجمع / الطريق / المنزل' : 'Optional delivery address'}
                className="w-full text-sm p-2.5 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
              />
            </div>

            {/* Requested Items Section */}
            <div className="pt-4 border-t border-border dark:border-dark-border space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-text-primary dark:text-dark-text-primary">
                    {t('requests.detail_modal.requested_items') || (isAr ? 'الأصناف المطلوبة' : 'Requested Items')}
                  </h4>
                  <label className="inline-flex items-center gap-2 mt-1 text-xs text-amber-700 dark:text-amber-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isOutOfStockRequest}
                      onChange={(e) => setIsOutOfStockRequest(e.target.checked)}
                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                    <span>{t('requests.edit_modal.mark_out_of_stock') || (isAr ? 'تمييز كطلب صنف غير متوفر بالمخزون / طلب خاص' : 'Mark as Out-of-Stock / Backorder Request')}</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddItem(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة صنف غير متوفر' : 'Add Unlisted Item'}</span>
                  </button>
                  {products.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAddItem(false)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'من الكتالوج' : 'From Catalog'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const selectedCatalogProduct = !item.isCustom ? products.find(p => p.id === item.productId) : undefined;
                  const isCatalogOut = selectedCatalogProduct ? (selectedCatalogProduct.stock ?? 0) <= 0 : false;

                  return (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 space-y-3"
                    >
                      {/* Item Mode Toggle & Delete */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="inline-flex rounded-lg p-0.5 bg-slate-200/80 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => handleModeSwitch(index, true)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                              item.isCustom
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                            }`}
                          >
                            <PackageX className="w-3.5 h-3.5" />
                            <span>{t('requests.edit_modal.item_mode_custom') || (isAr ? 'صنف غير متوفر / خاص' : 'Not in Inventory')}</span>
                          </button>
                          {products.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleModeSwitch(index, false)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                                !item.isCustom
                                  ? 'bg-primary text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                              }`}
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>{t('requests.edit_modal.item_mode_catalog') || (isAr ? 'منتج من الكتالوج' : 'Catalog Product')}</span>
                            </button>
                          )}
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                            title={t('general.delete') || 'Remove'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Item Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        {item.isCustom ? (
                          <>
                            <div className="sm:col-span-6">
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                {t('requests.edit_modal.custom_item_name') || (isAr ? 'اسم الصنف / الموديل المطلوب *' : 'Product / Model Name *')}
                              </label>
                              <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) => updateItemField(index, { name: e.target.value })}
                                placeholder={t('requests.edit_modal.custom_item_placeholder') || (isAr ? 'مثال: فرن بلت إن 90 سم ستانلس ستيل...' : 'e.g., Built-in 90cm Stainless Oven...')}
                                className="w-full text-xs sm:text-sm p-2 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                {t('requests.edit_modal.sku') || (isAr ? 'الكود / الموديل' : 'Model / SKU')}
                              </label>
                              <input
                                type="text"
                                value={item.sku || ''}
                                onChange={(e) => updateItemField(index, { sku: e.target.value })}
                                placeholder="SKU"
                                className="w-full text-xs sm:text-sm p-2 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="sm:col-span-8">
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              {t('requests.detail_modal.product') || (isAr ? 'المنتج' : 'Product')} *
                            </label>
                            <select
                              value={item.productId}
                              onChange={(e) => handleItemProductChange(index, e.target.value)}
                              className="w-full text-xs sm:text-sm p-2 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
                            >
                              {sortedProducts.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} — {(p.stock ?? 0) <= 0
                                    ? (isAr ? `غير متوفر بالمخزون (${formatNumber(0)})` : 'Out of Stock (0)')
                                    : (isAr ? `المتوفر: ${formatNumber(p.stock)}` : `In Stock: ${p.stock}`)}
                                </option>
                              ))}
                            </select>
                            {isCatalogOut && (
                              <span className="inline-block mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                {isAr ? 'تنبيه: رصيد هذا المنتج حالياً ٠ في المخزون' : 'Notice: This catalog product currently has 0 stock'}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            {t('requests.detail_modal.quantity') || (isAr ? 'الكمية' : 'Quantity')} *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemField(index, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                            className="w-full text-xs sm:text-sm p-2 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            {t('requests.edit_modal.estimated_price') || (isAr ? 'السعر المتوقع (د.ب)' : 'Est. Price')}
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.estimatedPrice ?? ''}
                            onChange={(e) => updateItemField(index, {
                              estimatedPrice: e.target.value === '' ? undefined : parseFloat(e.target.value)
                            })}
                            placeholder="0.000"
                            className="w-full text-xs sm:text-sm p-2 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
                          />
                        </div>
                      </div>

                      {/* Item Specifications / Notes */}
                      <div>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateItemField(index, { notes: e.target.value })}
                          placeholder={t('requests.edit_modal.item_notes') || (isAr ? 'مواصفات إضافية (اللون، المقاس، المورد المطلوب...)' : 'Optional specs (color, size, supplier reference...)')}
                          className="w-full text-xs p-2 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* General Request Notes */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                {t('requests.detail_modal.notes') || (isAr ? 'ملاحظات الطلب' : 'Request Notes')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t('requests.edit_modal.request_notes') || (isAr ? 'مثال: العميل بانتظار التوريد، موعد الوصول المتوقع، عربون...' : 'Optional notes: expected arrival date, deposit details...')}
                className="w-full text-sm p-2.5 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-background dark:border-dark-border dark:text-dark-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-xl border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-600"
            >
              {t('general.cancel_button') || (isAr ? 'إلغاء' : 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="text-white bg-primary hover:bg-primary-hover disabled:bg-gray-400 font-semibold rounded-xl text-sm px-5 py-2.5 text-center transition shadow-sm"
            >
              {isSaving
                ? (t('general.saving') || (isAr ? 'جاري الحفظ...' : 'Saving...'))
                : isEditing
                  ? (t('general.save') || (isAr ? 'حفظ التعديلات' : 'Save Changes'))
                  : (t('requests.add_button') || (isAr ? 'إضافة الطلب' : 'Save Request'))}
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
