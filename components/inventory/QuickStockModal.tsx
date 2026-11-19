import React, { useState } from 'react';
import { Product } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { 
  X, 
  PlusCircle, 
  MinusCircle, 
  CheckCircle2, 
  Package, 
  ArrowRight, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { StorageImage } from '../StorageImage';

interface QuickStockModalProps {
  product: Product;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickStockModal: React.FC<QuickStockModalProps> = ({ product, onClose, onSuccess }) => {
  const { updateProduct, addNotification } = useAppContext();
  const { language, t } = useTranslation();
  const isAr = language === 'ar';

  const [mode, setMode] = useState<'add' | 'reduce' | 'set'>('add');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentStock = product.stock || 0;

  // Calculate new stock
  const newStock = mode === 'add' 
    ? currentStock + quantity 
    : mode === 'reduce' 
      ? Math.max(0, currentStock - quantity)
      : Math.max(0, quantity);

  const difference = newStock - currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 0 || isNaN(quantity)) {
      setErrorMessage(isAr ? 'يرجى إدخال كمية صحيحة' : 'Please enter a valid quantity');
      return;
    }

    if (mode === 'reduce' && quantity > currentStock) {
      if (!window.confirm(isAr 
        ? `الكمية المراد خصمها (${quantity}) أكبر من المتوفر حالياً (${currentStock}). سيصبح المخزون 0. هل تود المتابعة؟` 
        : `Deduction (${quantity}) exceeds current stock (${currentStock}). Stock will become 0. Continue?`)) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await updateProduct(product.id, {
        stock: newStock
      });

      // If low stock, trigger notification
      if (newStock <= (product.lowStockThreshold || 5)) {
        await addNotification(
          'header.notifications.low_stock_item',
          'inventory',
          { name: product.name, stock: newStock.toString() },
          product.id
        );
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || (isAr ? 'فشل تحديث المخزون' : 'Failed to update stock'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetReasons = isAr ? [
    'توريد بضاعة جديدة',
    'جرد دوري فعلي',
    'تالف أو منتهي الصلاحية',
    'مرتجع من عميل',
    'تصحيح خطأ إدخال'
  ] : [
    'New stock delivery',
    'Physical inventory count',
    'Damaged or expired goods',
    'Customer return',
    'Data entry correction'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isAr ? 'تعديل سريع للمخزون' : 'Quick Stock Adjustment'}
              </h3>
              <p className="text-xs text-slate-500">
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Product Summary Header Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            {product.imageUrl ? (
              <StorageImage src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                <Package className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{product.name}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                {product.sku && <span>SKU: {product.sku}</span>}
                {product.barcode && <span>• Barcode: {product.barcode}</span>}
              </div>
            </div>
            <div className="text-right rtl:text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'الرصيد الحالي' : 'Current'}</span>
              <span className="text-base font-black font-mono text-slate-900 dark:text-white">{currentStock}</span>
            </div>
          </div>

          {/* Operation Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {isAr ? 'نوع الحركة:' : 'Adjustment Type:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setMode('add'); setQuantity(1); }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 border transition ${
                  mode === 'add'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? '+ إضافة بضاعة' : '+ Add Stock'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setMode('reduce'); setQuantity(1); }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 border transition ${
                  mode === 'reduce'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <MinusCircle className="w-4 h-4 text-rose-600" />
                <span>{isAr ? '- صرف / إنقاص' : '- Deduct'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setMode('set'); setQuantity(currentStock); }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 border transition ${
                  mode === 'set'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>{isAr ? '= جرد فعلي' : '= Set Exact'}</span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {mode === 'set' 
                  ? (isAr ? 'الرصيد الفعلي الجديد:' : 'New Counted Stock:') 
                  : (isAr ? 'الكمية:' : 'Quantity to adjust:')}
              </label>
              <div className="flex gap-1.5">
                {[1, 5, 10, 20, 50].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      if (mode === 'set') {
                        setQuantity(val);
                      } else {
                        setQuantity(val);
                      }
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 rounded hover:bg-primary hover:text-white transition"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                required
                className="flex-1 px-4 py-2.5 text-lg font-black font-mono text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Resulting Stock Preview Pill */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-500 block">{isAr ? 'الرصيد بعد التعديل:' : 'New Stock Level:'}</span>
              <span className={`text-xs font-bold ${difference > 0 ? 'text-emerald-600' : difference < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                {difference > 0 ? `+${difference}` : difference} {isAr ? 'قطعة' : 'units'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-slate-400 line-through">{currentStock}</span>
              <ArrowRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
              <span className={`text-2xl font-black font-mono ${
                newStock <= (product.lowStockThreshold || 5) ? 'text-rose-600' : 'text-primary'
              }`}>
                {newStock}
              </span>
            </div>
          </div>

          {/* Reason note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'سبب التعديل (اختياري):' : 'Reason for Adjustment (Optional):'}
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {presetReasons.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-[10px] px-2 py-1 rounded-lg border transition ${
                    reason === r 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={isAr ? 'اكتب ملاحظة أو سبب التعديل...' : 'E.g., Delivered from supplier invoice #492'}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-primary"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? (isAr ? 'جاري التحديث...' : 'Updating...') : (isAr ? 'حفظ وتحديث الرصيد' : 'Save Adjustment')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
