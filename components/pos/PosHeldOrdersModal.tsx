import React from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Product } from '../../types';
import { Clock, Trash2, ArrowRight, X, AlertCircle } from 'lucide-react';

export interface HeldCartItem {
  product: Product;
  quantity: number;
}

export interface HeldOrder {
  id: string;
  heldAt: string;
  customerName: string;
  customerId: string;
  items: HeldCartItem[];
  discount: number;
  note?: string;
  subtotal: number;
  total: number;
}

interface PosHeldOrdersModalProps {
  heldOrders: HeldOrder[];
  onResume: (order: HeldOrder) => void;
  onDelete: (orderId: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const PosHeldOrdersModal: React.FC<PosHeldOrdersModalProps> = ({
  heldOrders,
  onResume,
  onDelete,
  onClearAll,
  onClose,
}) => {
  const { t, formatCurrency, formatDate, formatTime, language } = useTranslation();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-dark-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border dark:border-dark-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'الطلبات المعلقة' : 'Parked / Held Orders'}
              </h3>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {language === 'ar'
                  ? `${heldOrders.length} طلبات معلقة بانتظار الاستئناف`
                  : `${heldOrders.length} orders currently on hold`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {heldOrders.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(language === 'ar' ? 'هل أنت متأكد من مسح جميع الطلبات المعلقة؟' : 'Clear all held orders?')) {
                    onClearAll();
                  }
                }}
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {language === 'ar' ? 'مسح الكل' : 'Clear All'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List of Held Orders */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {heldOrders.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-text-secondary dark:text-dark-text-secondary">
              <AlertCircle className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm font-medium">
                {language === 'ar' ? 'لا توجد طلبات معلقة حالياً' : 'No held orders at the moment'}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {language === 'ar'
                  ? 'يمكنك تعليق أي سلة مؤقتاً لخدمة عميل آخر بالضغط على زر "تعليق الطلب"'
                  : 'You can park an order when a customer steps aside to serve the next customer'}
              </p>
            </div>
          ) : (
            heldOrders.map((held) => {
              const totalItemsCount = held.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <div
                  key={held.id}
                  className="bg-card dark:bg-dark-card p-4 rounded-xl border border-border dark:border-dark-border hover:border-primary/50 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-text-primary dark:text-dark-text-primary">
                        {held.customerName || (language === 'ar' ? 'عميل نقدي عام' : 'Walk-in')}
                      </span>
                      {held.note && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                          {held.note}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatTime(held.heldAt)} • {formatDate(held.heldAt)}
                      </span>
                    </div>

                    {/* Preview items */}
                    <div className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1 truncate">
                      {held.items.map(it => `${it.product.name} (x${it.quantity})`).join(', ')}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-medium">
                        {totalItemsCount} {language === 'ar' ? 'قطع' : 'items'}
                      </span>
                      <span className="font-bold text-primary text-sm">
                        {formatCurrency(held.total)}
                      </span>
                      {held.discount > 0 && (
                        <span className="text-emerald-600 font-medium">
                          {held.discount}% {language === 'ar' ? 'خصم' : 'off'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => onDelete(held.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                      title={language === 'ar' ? 'حذف الطلب المعلق' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onResume(held)}
                      className="flex-1 sm:flex-initial py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>{language === 'ar' ? 'استرجاع للسلة' : 'Resume Order'}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-muted/20 border-t border-border dark:border-dark-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-text-primary dark:text-dark-text-primary text-xs font-semibold transition-colors"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosHeldOrdersModal;
