import React, { useState, useEffect } from 'react';
import { Quotation, QuotationItem, QuotationStatus } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { 
  X, 
  Plus, 
  Trash2, 
  Search, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  CheckCircle,
  Percent,
  Clock,
  Sparkles
} from 'lucide-react';

interface AddEditQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationToEdit?: Quotation | null;
  onSave: (quotationData: Omit<Quotation, 'id'>) => Promise<void>;
}

export const AddEditQuotationModal: React.FC<AddEditQuotationModalProps> = ({
  isOpen,
  onClose,
  quotationToEdit,
  onSave
}) => {
  const { customers, products, currentUser } = useAppContext();
  const { language, formatCurrency } = useTranslation();
  const isAr = language === 'ar';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [quotationNumber, setQuotationNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [status, setStatus] = useState<QuotationStatus>('Draft');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);

  // Line items
  const [items, setItems] = useState<QuotationItem[]>([
    { name: '', quantity: 1, unitPrice: 0, discount: 0, vatPercent: 10, vatAmount: 0, total: 0 }
  ]);

  // Quick product search for lines
  const [searchQuery, setSearchQuery] = useState<{ [index: number]: string }>({});

  // Helper to add days to current date
  const setValidityDays = (days: number) => {
    const base = new Date(date || new Date());
    base.setDate(base.getDate() + days);
    setValidUntil(base.toISOString().split('T')[0]);
  };

  useEffect(() => {
    if (isOpen) {
      if (quotationToEdit) {
        setQuotationNumber(quotationToEdit.quotationNumber);
        setDate(quotationToEdit.date ? quotationToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setValidUntil(quotationToEdit.validUntil ? quotationToEdit.validUntil.split('T')[0] : '');
        setSelectedCustomerId(quotationToEdit.customerId || '');
        setCustomerName(quotationToEdit.customerName || '');
        setCustomerPhone(quotationToEdit.customerPhone || '');
        setCustomerEmail(quotationToEdit.customerEmail || '');
        setCustomerAddress(quotationToEdit.customerAddress || '');
        setTaxNumber(quotationToEdit.taxNumber || '');
        setStatus(quotationToEdit.status || 'Draft');
        setNotes(quotationToEdit.notes || '');
        setTerms(quotationToEdit.terms || '');
        setPreparedBy(quotationToEdit.preparedBy || currentUser?.name || '');
        setOverallDiscount(quotationToEdit.discount || 0);
        setItems(quotationToEdit.items && quotationToEdit.items.length > 0 ? quotationToEdit.items : [
          { name: '', quantity: 1, unitPrice: 0, discount: 0, vatPercent: 10, vatAmount: 0, total: 0 }
        ]);
      } else {
        // New Quote
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const autoNumber = `QT-${new Date().getFullYear()}-${randomNum}`;
        setQuotationNumber(autoNumber);
        const todayStr = new Date().toISOString().split('T')[0];
        setDate(todayStr);
        
        // Default valid for 15 days
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 15);
        setValidUntil(expireDate.toISOString().split('T')[0]);

        setSelectedCustomerId('');
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setCustomerAddress('');
        setTaxNumber('');
        setStatus('Draft');
        setNotes('');
        setTerms(
          isAr
            ? '1. الأسعار سارية حتى تاريخ انتهاء صلاحية العرض.\n2. يتم دفع 50% مقدماً عند اعتماد العرض و 50% عند التوريد.\n3. الأسعار تشمل ضريبة القيمة المضافة (10%) والتوصيل.'
            : '1. Prices are valid until quotation expiration date.\n2. Payment terms: 50% advance upon confirmation, 50% upon delivery.\n3. Prices include 10% VAT and local delivery.'
        );
        setPreparedBy(currentUser?.name || 'محمود');
        setOverallDiscount(0);
        setItems([
          { name: '', quantity: 1, unitPrice: 0, discount: 0, vatPercent: 10, vatAmount: 0, total: 0 }
        ]);
      }
      setError(null);
    }
  }, [isOpen, quotationToEdit, currentUser, isAr]);

  // When customer is selected from dropdown
  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) return;
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone || '');
      setCustomerEmail(cust.email || '');
      setCustomerAddress(cust.address || '');
    }
  };

  // Recalculate an item line
  const updateItem = (index: number, updates: Partial<QuotationItem>) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const current = { ...newItems[index], ...updates };

      const qty = Math.max(1, current.quantity || 1);
      const price = Math.max(0, current.unitPrice || 0);
      const discount = Math.max(0, current.discount || 0);
      const sub = Math.max(0, (qty * price) - discount);
      const vatRate = current.vatPercent !== undefined ? current.vatPercent : 10;
      const vatAmt = sub * (vatRate / 100);
      const total = sub + vatAmt;

      newItems[index] = {
        ...current,
        quantity: qty,
        unitPrice: price,
        discount,
        vatPercent: vatRate,
        vatAmount: Number(vatAmt.toFixed(3)),
        total: Number(total.toFixed(3))
      };
      return newItems;
    });
  };

  // Pick a product into a line
  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    updateItem(index, {
      productId: prod.id,
      name: prod.name,
      sku: prod.sku,
      unitPrice: prod.salePrice || 0
    });

    // clear search
    setSearchQuery(prev => ({ ...prev, [index]: '' }));
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { name: '', quantity: 1, unitPrice: 0, discount: 0, vatPercent: 10, vatAmount: 0, total: 0 }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + ((item.quantity * item.unitPrice) - (item.discount || 0)), 0);
  const vatTotal = items.reduce((acc, item) => acc + (item.vatAmount || 0), 0);
  const grandTotal = Math.max(0, (subtotal - (overallDiscount || 0)) + vatTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError(isAr ? 'يرجى إدخال اسم العميل أو اختياره من القائمة.' : 'Please enter or select a customer name.');
      return;
    }

    if (items.length === 0 || !items.some(i => i.name.trim())) {
      setError(isAr ? 'يرجى إضافة صنف واحد على الأقل للعرض.' : 'Please add at least one line item to the quotation.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const quotationPayload: Omit<Quotation, 'id'> = {
        quotationNumber: quotationNumber.trim() || `QT-${Date.now()}`,
        date: date || new Date().toISOString(),
        validUntil: validUntil || new Date(Date.now() + 15 * 86400000).toISOString(),
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        items: items.filter(i => i.name.trim()),
        subtotal: Number(subtotal.toFixed(3)),
        discount: Number(overallDiscount || 0),
        vatTotal: Number(vatTotal.toFixed(3)),
        total: Number(grandTotal.toFixed(3)),
        status: status || 'Draft',
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        preparedBy: preparedBy.trim() || currentUser?.name || undefined,
        userId: currentUser?.id,
        createdAt: quotationToEdit?.createdAt || new Date().toISOString()
      };

      await onSave(quotationPayload);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (isAr ? 'حدث خطأ أثناء حفظ عرض السعر' : 'Failed to save quotation'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {quotationToEdit 
                  ? (isAr ? `تعديل عرض السعر (${quotationToEdit.quotationNumber})` : `Edit Quotation (${quotationToEdit.quotationNumber})`)
                  : (isAr ? 'إنشاء عرض سعر تجاري جديد' : 'New Price Quotation')}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'أدخل تفاصيل العميل والأصناف وشروط الدفع والتسليم' : 'Enter customer information, line items, and commercial terms'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Section 1: Quote Info & Customer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'رقم العرض' : 'Quotation #'}
              </label>
              <input
                type="text"
                value={quotationNumber}
                onChange={e => setQuotationNumber(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'تاريخ الإصدار' : 'Issue Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'صالح لغاية' : 'Valid Until'}
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setValidityDays(7)}
                    className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded hover:bg-primary hover:text-white transition"
                  >
                    +7d
                  </button>
                  <button
                    type="button"
                    onClick={() => setValidityDays(15)}
                    className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded hover:bg-primary hover:text-white transition"
                  >
                    +15d
                  </button>
                  <button
                    type="button"
                    onClick={() => setValidityDays(30)}
                    className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded hover:bg-primary hover:text-white transition"
                  >
                    +30d
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Section 2: Customer Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>{isAr ? 'بيانات العميل' : 'Customer Information'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'اختيار عميل مسجل' : 'Select Registered Customer'}
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={e => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="">{isAr ? '-- عميل جديد / إدخال يدوي --' : '-- New / Manual Customer --'}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'اسم العميل *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  required
                  placeholder={isAr ? 'مثال: شركة الخليج للمقاولات' : 'e.g. Gulf Contracting Co.'}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="33000000"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'العنوان / الموقع' : 'Delivery Address / Location'}
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder={isAr ? 'المنامة، بناية 12، طريق 34' : 'Manama, Bldg 12, Road 34'}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'الرقم الضريبي أو السجل' : 'Tax / CR Number'}
                </label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={e => setTaxNumber(e.target.value)}
                  placeholder="2200000000"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'حالة العرض' : 'Quotation Status'}
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as QuotationStatus)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="Draft">{isAr ? 'مسودة (Draft)' : 'Draft'}</option>
                  <option value="Sent">{isAr ? 'تم الإرسال للعميل (Sent)' : 'Sent'}</option>
                  <option value="Accepted">{isAr ? 'مقبول (Accepted)' : 'Accepted'}</option>
                  <option value="Rejected">{isAr ? 'مرفوض (Rejected)' : 'Rejected'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>{isAr ? 'الأصناف والخدمات في العرض' : 'Quotation Line Items'}</span>
              </h4>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? '+ إضافة بند جديد' : '+ Add Item'}</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left rtl:text-right">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5 w-8 text-center">#</th>
                      <th className="p-2.5 min-w-[220px]">{isAr ? 'الصنف / المنتج' : 'Item / Product'}</th>
                      <th className="p-2.5 w-24 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                      <th className="p-2.5 w-28">{isAr ? 'سعر الوحدة (د.ب)' : 'Unit Price (BHD)'}</th>
                      <th className="p-2.5 w-24">{isAr ? 'الخصم (د.ب)' : 'Disc. (BHD)'}</th>
                      <th className="p-2.5 w-24 text-center">{isAr ? 'ضريبة VAT' : 'VAT'}</th>
                      <th className="p-2.5 w-28">{isAr ? 'الإجمالي (د.ب)' : 'Total (BHD)'}</th>
                      <th className="p-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 text-center text-slate-400 font-semibold">{index + 1}</td>
                        
                        <td className="p-2.5">
                          <div className="space-y-1.5">
                            {/* Inventory product dropdown selector */}
                            <select
                              value={item.productId || ''}
                              onChange={e => handleProductSelect(index, e.target.value)}
                              className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 outline-none"
                            >
                              <option value="">{isAr ? '📦 اختر من المخزون أو اكتب وصفاً يدوياً' : '📦 Pick from inventory or type custom'}</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} - {formatCurrency(p.salePrice)} (المتبقي: {p.stock})
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              value={item.name}
                              onChange={e => updateItem(index, { name: e.target.value })}
                              required
                              placeholder={isAr ? 'اسم الصنف أو الخدمة المطلوبة...' : 'Item description or service...'}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium outline-none focus:border-primary"
                            />
                          </div>
                        </td>

                        <td className="p-2.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => updateItem(index, { quantity: parseFloat(e.target.value) || 1 })}
                            className="w-full px-2 py-1.5 text-xs text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold outline-none focus:border-primary font-mono"
                          />
                        </td>

                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.unitPrice}
                            onChange={e => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-primary font-mono"
                          />
                        </td>

                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.discount || 0}
                            onChange={e => updateItem(index, { discount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-primary font-mono text-rose-500"
                          />
                        </td>

                        <td className="p-2.5 text-center">
                          <select
                            value={item.vatPercent ?? 10}
                            onChange={e => updateItem(index, { vatPercent: parseFloat(e.target.value) })}
                            className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                          >
                            <option value={10}>10%</option>
                            <option value={0}>{isAr ? 'معفى 0%' : '0% Exempt'}</option>
                          </select>
                        </td>

                        <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-white">
                          {formatCurrency(item.total)}
                        </td>

                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            disabled={items.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-20 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 4: Totals & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'شروط وأحكام العرض' : 'Commercial Terms & Warranty'}
                </label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'ملاحظات خاصة تظهر في العرض' : 'Special Notes for Customer'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={isAr ? 'أي شروط تسليم خاصة، أوقات العمل، طريقة الدفع...' : 'Delivery conditions, lead times, payment arrangements...'}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'المسؤول عن العرض / الموظف' : 'Prepared By'}
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={e => setPreparedBy(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="md:col-span-5">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  {isAr ? 'ملخص الحسابات' : 'Financial Summary'}
                </h5>

                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>{isAr ? 'المجموع قبل الضريبة والخصم:' : 'Subtotal:'}</span>
                  <span className="font-mono font-bold">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>{isAr ? 'خصم إضافي إجمالي (د.ب):' : 'Overall Discount (BHD):'}</span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={overallDiscount}
                    onChange={e => setOverallDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-xs text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-rose-500 font-bold outline-none"
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>{isAr ? 'ضريبة القيمة المضافة (10%):' : 'VAT Total (10%):'}</span>
                  <span className="font-mono font-bold">{formatCurrency(vatTotal)}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'المبلغ الإجمالي النهائي:' : 'Final Grand Total:'}
                  </span>
                  <span className="font-black text-xl font-mono text-primary">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting 
                ? (isAr ? 'جاري الحفظ...' : 'Saving...') 
                : (quotationToEdit 
                  ? (isAr ? 'حفظ التعديلات' : 'Save Changes') 
                  : (isAr ? 'إنشاء وحفظ العرض' : 'Create Quotation'))}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
