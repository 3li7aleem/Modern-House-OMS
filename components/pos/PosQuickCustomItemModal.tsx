import React, { useState } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { PlusCircle, X, Tag } from 'lucide-react';

interface PosQuickCustomItemModalProps {
  onAdd: (item: { name: string; price: number; quantity: number }) => void;
  onClose: () => void;
}

const PosQuickCustomItemModal: React.FC<PosQuickCustomItemModalProps> = ({
  onAdd,
  onClose,
}) => {
  const { t, formatCurrency, language } = useTranslation();
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const quickPresets = [
    { name: language === 'ar' ? 'أجرة صيانة سريعة' : 'Quick Repair Service', price: 5 },
    { name: language === 'ar' ? 'فحص ومعاينة' : 'Inspection / Diagnosis', price: 3 },
    { name: language === 'ar' ? 'تركيب قطع غيار' : 'Parts Installation', price: 2 },
    { name: language === 'ar' ? 'شحن / توصيل خاص' : 'Express Delivery', price: 2.5 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (!name.trim()) {
      alert(language === 'ar' ? 'يرجى كتابة اسم الصنف أو الخدمة.' : 'Please enter item or service name.');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      alert(language === 'ar' ? 'يرجى إدخال سعر صحيح أكبر من الصفر.' : 'Please enter a valid price.');
      return;
    }
    if (quantity < 1) {
      alert(language === 'ar' ? 'الكمية يجب أن تكون 1 على الأقل.' : 'Quantity must be at least 1.');
      return;
    }

    onAdd({
      name: name.trim(),
      price: numPrice,
      quantity,
    });
    onClose();
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
        {/* Header */}
        <div className="p-4 border-b border-border dark:border-dark-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'إضافة صنف أو خدمة سريعة' : 'Add Custom Item / Service'}
              </h3>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {language === 'ar' ? 'بدون الحاجة لإنشاء منتج مسبقاً في المخزون' : 'Add directly to current cart'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {language === 'ar' ? 'نماذج خدمات شائعة' : 'Popular Presets'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setName(preset.name);
                    setPrice(preset.price.toString());
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
                >
                  {preset.name} ({formatCurrency(preset.price)})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
              {language === 'ar' ? 'اسم الصنف / الخدمة *' : 'Item / Service Name *'}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: صيانة شاشة، خدمة تركيب...' : 'e.g., Screen repair, Installation fee...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-background text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                {language === 'ar' ? 'السعر (د.ب) *' : 'Price (BHD) *'}
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-background text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                {language === 'ar' ? 'الكمية' : 'Quantity'}
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-background text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-text-primary dark:text-dark-text-primary text-xs font-semibold transition-colors"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              {language === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PosQuickCustomItemModal;
