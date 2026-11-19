import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import { Truck, X, User, MapPin, Calendar, Clock, FileText, Phone, Search } from 'lucide-react';

interface CreateDeliveryModalProps {
  onClose: () => void;
}

const CreateDeliveryModal: React.FC<CreateDeliveryModalProps> = ({ onClose }) => {
  const { t, language, formatDate } = useTranslation();
  const { orders, deliveries, drivers, customers, addDelivery } = useAppContext();

  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Eligible orders that don't have an active or completed delivery
  const eligibleOrders = useMemo(() => {
    const existingDeliveryOrderIds = new Set(deliveries.map(d => d.orderId));
    return orders.filter(o => !existingDeliveryOrderIds.has(o.id));
  }, [orders, deliveries]);

  // Filtered orders by search
  const filteredOrders = useMemo(() => {
    const q = orderSearchQuery.trim().toLowerCase();
    if (!q) return eligibleOrders.slice(0, 15);
    return eligibleOrders
      .filter(o => {
        const customer = customers.find(c => c.id === o.customerId);
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          (customer?.name && customer.name.toLowerCase().includes(q)) ||
          (customer?.phone && customer.phone.includes(q))
        );
      })
      .slice(0, 15);
  }, [eligibleOrders, orderSearchQuery, customers]);

  const selectedOrder = useMemo(() => {
    return eligibleOrders.find(o => o.id === selectedOrderId);
  }, [selectedOrderId, eligibleOrders]);

  const customerForSelectedOrder = useMemo(() => {
    if (!selectedOrder) return null;
    return customers.find(c => c.id === selectedOrder.customerId);
  }, [selectedOrder, customers]);

  // Update address when customer changes
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = eligibleOrders.find(o => o.id === orderId);
    if (ord) {
      const cust = customers.find(c => c.id === ord.customerId);
      if (cust?.address) {
        setCustomAddress(cust.address);
      } else {
        setCustomAddress('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      alert(language === 'ar' ? 'يرجى اختيار الطلب للتوصيل.' : 'Please select an order.');
      return;
    }

    const finalAddress = customAddress.trim() || customerForSelectedOrder?.address || '';
    if (!finalAddress) {
      alert(language === 'ar' ? 'يرجى كتابة عنوان التوصيل.' : 'Please enter delivery address.');
      return;
    }

    setIsSaving(true);
    try {
      await addDelivery(
        selectedOrderId,
        selectedDriverId || undefined,
        finalAddress,
        deliveryNotes.trim()
      );
      onClose();
    } catch (error: any) {
      console.error('Failed to create delivery note:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-dark-card w-full max-w-xl rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border dark:border-dark-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'إنشاء أمر توصيل جديد' : 'Create New Delivery Order'}
              </h3>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {language === 'ar' ? 'ربط الطلب بسند توصيل وتعيين السائق' : 'Assign order to courier with delivery note'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Order Search & Selection */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-text-primary dark:text-dark-text-primary">
              {language === 'ar' ? 'اختر الطلب للتوصيل *' : 'Select Order to Deliver *'}
            </label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rtl:left-auto rtl:right-3" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={e => setOrderSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'ابحث برقم الطلب أو اسم العميل...' : 'Filter by order # or customer...'}
                  className="w-full pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-2 bg-gray-50 dark:bg-gray-800/60 border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <select
                required
                value={selectedOrderId}
                onChange={e => handleSelectOrder(e.target.value)}
                className="w-full px-3 py-2.5 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{language === 'ar' ? '-- اختر الطلب من القائمة --' : '-- Choose Order --'}</option>
                {filteredOrders.map(o => {
                  const cust = customers.find(c => c.id === o.customerId);
                  return (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {cust?.name || 'Walk-in'} ({formatDate(o.date)})
                    </option>
                  );
                })}
              </select>
            </div>
            {eligibleOrders.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">
                {language === 'ar' ? 'لا توجد طلبات جديدة متاحة للتوصيل حالياً.' : 'No pending orders available for delivery.'}
              </p>
            )}
          </div>

          {/* Customer Snapshot */}
          {customerForSelectedOrder && (
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border/70 dark:border-dark-border/70 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-text-primary dark:text-dark-text-primary">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>{customerForSelectedOrder.name}</span>
                </div>
                {customerForSelectedOrder.phone && (
                  <div className="flex items-center gap-1.5 text-text-secondary dark:text-dark-text-secondary font-mono text-[11px]" dir="ltr">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{customerForSelectedOrder.phone}</span>
                  </div>
                )}
              </div>
              <div className="text-right rtl:text-left">
                <span className="text-[11px] text-gray-400 block">{language === 'ar' ? 'حالة الطلب' : 'Status'}</span>
                <span className="font-bold text-primary">{selectedOrder?.status}</span>
              </div>
            </div>
          )}

          {/* Driver Selection */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-text-primary dark:text-dark-text-primary">
              {language === 'ar' ? 'تعيين السائق المسؤول (اختياري)' : 'Assign Courier / Driver (Optional)'}
            </label>
            <select
              value={selectedDriverId}
              onChange={e => setSelectedDriverId(e.target.value)}
              className="w-full px-3 py-2.5 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{language === 'ar' ? '-- بدون تعيين (قيد الانتظار) --' : '-- Unassigned (Pending) --'}</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.phone ? `(${d.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Delivery Address */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-text-primary dark:text-dark-text-primary flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {language === 'ar' ? 'عنوان التوصيل بالتفصيل *' : 'Delivery Address *'}
              </span>
              <span className="text-[10px] text-gray-400 font-normal">
                {language === 'ar' ? 'المجمع، الشارع، المبنى، المنطقة' : 'Block, Road, Building, Area'}
              </span>
            </label>
            <textarea
              required
              rows={2}
              value={customAddress}
              onChange={e => setCustomAddress(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: سوق واقف، مجمع 1204، مبنى 55، شقة 3' : 'e.g. Souq Waqif, Block 1204, Bldg 55...'}
              className="w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Notes for Driver */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-text-primary dark:text-dark-text-primary flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              {language === 'ar' ? 'ملاحظات خاصة بالتوصيل' : 'Delivery Instructions / Notes'}
            </label>
            <input
              type="text"
              value={deliveryNotes}
              onChange={e => setDeliveryNotes(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: الاتصال قبل الوصول بـ 15 دقيقة، ترك الطلب عند الباب...' : 'e.g. Call 15 mins ahead...'}
              className="w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-border dark:border-dark-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving || !selectedOrderId}
              className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              <span>{isSaving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'إنشاء سند التوصيل' : 'Create Delivery Note')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDeliveryModal;
