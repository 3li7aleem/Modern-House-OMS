import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { Delivery } from '../../types';
import { Truck, CheckSquare, X, ArrowRight, Check } from 'lucide-react';

interface BatchAssignDriverModalProps {
  selectedDeliveryIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

const BatchAssignDriverModal: React.FC<BatchAssignDriverModalProps> = ({
  selectedDeliveryIds,
  onClose,
  onSuccess,
}) => {
  const { drivers, updateDelivery, updateDeliveryStatus } = useAppContext();
  const { language } = useTranslation();

  const [driverId, setDriverId] = useState<string>('');
  const [newStatus, setNewStatus] = useState<Delivery['status'] | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId && !newStatus) {
      alert(language === 'ar' ? 'يرجى اختيار سائق أو تغيير الحالة.' : 'Please select a driver or status.');
      return;
    }

    setIsSubmitting(true);
    try {
      for (const id of selectedDeliveryIds) {
        if (driverId) {
          await updateDelivery(id, { driverId });
        }
        if (newStatus) {
          await updateDeliveryStatus(id, newStatus);
        }
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      alert(e.message || 'Failed to update deliveries');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border dark:border-dark-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'إجراء جماعي للتوصيلات' : 'Bulk Action on Deliveries'}
              </h3>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {language === 'ar'
                  ? `تم تحديد ${selectedDeliveryIds.length} طلب توصيل`
                  : `${selectedDeliveryIds.length} deliveries selected`}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-text-primary dark:text-dark-text-primary">
              {language === 'ar' ? 'إسناد إلى سائق (اختياري)' : 'Assign to Driver (Optional)'}
            </label>
            <select
              value={driverId}
              onChange={e => setDriverId(e.target.value)}
              className="w-full px-3 py-2.5 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{language === 'ar' ? '-- بدون تغيير السائق --' : '-- No driver change --'}</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.phone ? `(${d.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-text-primary dark:text-dark-text-primary">
              {language === 'ar' ? 'تحديث حالة التوصيل (اختياري)' : 'Update Status (Optional)'}
            </label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{language === 'ar' ? '-- بدون تغيير الحالة --' : '-- No status change --'}</option>
              <option value="Pending">{language === 'ar' ? 'معلق (Pending)' : 'Pending'}</option>
              <option value="Out for Delivery">{language === 'ar' ? 'قيد التوصيل (Out for Delivery)' : 'Out for Delivery'}</option>
              <option value="Delivered">{language === 'ar' ? 'تم التسليم (Delivered)' : 'Delivered'}</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!driverId && !newStatus)}
              className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? (language === 'ar' ? 'جاري التطبيق...' : 'Applying...') : (language === 'ar' ? 'تطبيق على المحددة' : 'Apply to Selected')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchAssignDriverModal;
