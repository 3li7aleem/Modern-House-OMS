import React from 'react';
import { X, Sparkles, Check, Package, Flame, Award, Plus } from 'lucide-react';
import { Product } from '../../types';

export interface KitchenBundle {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  bundlePrice: number;
  originalPrice: number;
  items: {
    skuOrName: string;
    qty: number;
    title: string;
  }[];
}

const DEFAULT_BUNDLES: KitchenBundle[] = [
  {
    id: 'bundle_kitchen_trio_90',
    nameAr: 'طقم المطبخ الماسي المدمج (3 قطع 90 سم)',
    nameEn: 'Diamond Built-in Trio 90cm',
    descAr: 'موقد غاز زجاجي 90 سم + شفاط هرمي مات 90 سم + ميكروويف أو فرن تركي مدمج',
    descEn: 'Built-in Gas Hob 90cm + T-Type Hood 90cm + Built-in Oven',
    bundlePrice: 185.00,
    originalPrice: 220.00,
    items: [
      { skuOrName: 'SKU-614104-54', qty: 1, title: 'موقد غاز زجاجي مدمج 90 سم' },
      { skuOrName: 'SKU-614104-50', qty: 1, title: 'شفاط هرمي أسود مات 90 سم' },
      { skuOrName: 'SKU-614104-53', qty: 1, title: 'ميكروويف ديجيتال ستانلس مدمج' }
    ]
  },
  {
    id: 'bundle_kitchen_duo_60',
    nameAr: 'باقة المطبخ العصري الموفر (قطعتين 60 سم)',
    nameEn: 'Modern Compact Duo 60cm',
    descAr: 'موقد سيراميك مدمج 60 سم + شفاط جداري أسود 60 سم',
    descEn: 'Built-in Glass Hob 60cm + Chimney Hood 60cm',
    bundlePrice: 89.00,
    originalPrice: 110.00,
    items: [
      { skuOrName: 'SKU-614105-55', qty: 1, title: 'موقد بلت إن زجاجي 60 سم' },
      { skuOrName: 'SKU-614104-52', qty: 1, title: 'شفاط مطبخ أسود 60 سم' }
    ]
  },
  {
    id: 'bundle_smart_sink_combo',
    nameAr: 'باقة المغسلة الشلال الذكية المتكاملة',
    nameEn: 'Smart Waterfall Sink Combo',
    descAr: 'حوض نانو أسود مقاوم للخدش + خلاط شلال رقمي + ملحقات التقطيع والغسيل',
    descEn: 'Nano Black Waterfall Sink + Pull-out Digital Faucet + Accessories',
    bundlePrice: 75.00,
    originalPrice: 95.00,
    items: [
      { skuOrName: 'SKU-614105-56', qty: 1, title: 'حوض مغسلة نانو شلال فاخر' }
    ]
  }
];

interface PosKitchenBundlesModalProps {
  products: Product[];
  formatCurrency: (val: number) => string;
  isAr: boolean;
  onAddBundleToCart: (itemsToAdd: { product: Product; quantity: number }[], bundleDiscount: number) => void;
  onClose: () => void;
}

export const PosKitchenBundlesModal: React.FC<PosKitchenBundlesModalProps> = ({
  products,
  formatCurrency,
  isAr,
  onAddBundleToCart,
  onClose,
}) => {
  const handleApplyBundle = (bundle: KitchenBundle) => {
    const matchedItems: { product: Product; quantity: number }[] = [];

    for (const item of bundle.items) {
      // Find matching product in catalog
      const prod = products.find(p => 
        p.sku === item.skuOrName || 
        p.name.toLowerCase().includes(item.skuOrName.toLowerCase())
      ) || products.find(p => p.category?.includes('Built-in')) || products[0];

      if (prod) {
        matchedItems.push({ product: prod, quantity: item.qty });
      }
    }

    if (matchedItems.length === 0) {
      alert(isAr ? 'عذراً، أصناف الباقة غير متوفرة حالياً في المخزون.' : 'Bundle items currently unavailable in inventory.');
      return;
    }

    const totalRegularPrice = matchedItems.reduce((acc, curr) => acc + (curr.product.salePrice * curr.quantity), 0);
    const bundleDiscount = Math.max(0, totalRegularPrice - bundle.bundlePrice);

    onAddBundleToCart(matchedItems, bundleDiscount);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {isAr ? 'عروض وباقات المطابخ المعتمدة' : 'Official Kitchen Packages & Combos'}
              </h3>
              <p className="text-[11px] text-slate-500">مودرن هاوس للتجارة • أسعار مجمعة مخفضة</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bundles List */}
        <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {DEFAULT_BUNDLES.map(b => {
            const savings = b.originalPrice - b.bundlePrice;
            return (
              <div
                key={b.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 bg-slate-50/50 dark:bg-slate-950/40 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        {isAr ? b.nameAr : b.nameEn}
                      </h4>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] rounded-full">
                        {isAr ? `وفر ${formatCurrency(savings)}` : `Save ${formatCurrency(savings)}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{isAr ? b.descAr : b.descEn}</p>
                  </div>

                  <div className="text-left rtl:text-left shrink-0">
                    <span className="text-[10px] text-slate-400 line-through block">
                      {formatCurrency(b.originalPrice)}
                    </span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                      {formatCurrency(b.bundlePrice)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? `تشمل ${b.items.length} قطع متناسقة` : `Includes ${b.items.length} pieces`}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyBundle(b)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة الباقة للفاتورة' : 'Add Bundle'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PosKitchenBundlesModal;
