import React, { useRef } from 'react';
import { Order, Product, Employee } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Banknote, CreditCard, DollarSign, Printer, X, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';

interface PosShiftSummaryModalProps {
  orders: Order[];
  products: Product[];
  currentCashier?: Employee | null;
  onClose: () => void;
}

const PosShiftSummaryModal: React.FC<PosShiftSummaryModalProps> = ({
  orders,
  products,
  currentCashier,
  onClose,
}) => {
  const { t, formatCurrency, formatDate, formatTime, language } = useTranslation();
  const { settings } = useSettings();
  const reportRef = useRef<HTMLDivElement>(null);

  // Filter today's completed POS orders
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysOrders = orders.filter(o => {
    if (!o.date) return false;
    const orderDateStr = o.date.split('T')[0];
    return orderDateStr === todayStr && o.status !== 'Cancelled';
  });

  const totalSales = todaysOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalSubtotal = todaysOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalOrdersCount = todaysOrders.length;

  const cashOrders = todaysOrders.filter(o => o.paymentMethod === 'Cash');
  const cashTotal = cashOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const cardOrders = todaysOrders.filter(o => o.paymentMethod === 'Card');
  const cardTotal = cardOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const benefitOrders = todaysOrders.filter(o => o.paymentMethod === 'BenefitPay');
  const benefitTotal = benefitOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const totalVat = todaysOrders.reduce((acc, o) => {
    const orderVat = o.items.reduce((s, it) => s + (it.vatAmount || 0), 0);
    return acc + orderVat;
  }, 0);

  const totalDiscounts = todaysOrders.reduce((acc, o) => {
    if (o.discount > 0) {
      return acc + (o.subtotal * (o.discount / 100));
    }
    return acc;
  }, 0);

  // Top products sold today
  const productSalesMap = new Map<string, { name: string; qty: number; total: number }>();
  todaysOrders.forEach(o => {
    o.items.forEach(it => {
      const prod = products.find(p => p.id === it.productId);
      const name = prod?.name || 'Custom Item';
      const existing = productSalesMap.get(it.productId) || { name, qty: 0, total: 0 };
      existing.qty += it.quantity;
      existing.total += it.price * it.quantity;
      productSalesMap.set(it.productId, existing);
    });
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="shift-summary-modal-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-dark-card w-full max-w-xl rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border dark:border-dark-border flex items-center justify-between bg-muted/30 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'ملخص الوردية اليومي (Z-Report)' : 'Daily Register / Shift Summary'}
              </h3>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {formatDate(new Date().toISOString())} • {currentCashier?.name || 'Cashier'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              {language === 'ar' ? 'طباعة التقرير' : 'Print Report'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Printable Report Wrapper */}
          <div ref={reportRef} id="printable-shift-report" className="space-y-5">
            {/* Store Banner for print */}
            <div className="text-center pb-3 border-b border-border dark:border-dark-border">
              <h2 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'مودرن هاوس للتجارة' : 'MODERN HOUSE FOR TRADING'}
              </h2>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {language === 'ar' ? 'تقرير إغلاق الوردية والمبيعات اليومية' : 'End of Day Register Shift Report'}
              </p>
              <div className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">
                <span>{formatDate(new Date().toISOString())}</span> • <span>{currentCashier?.name || 'Cashier'}</span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block">
                  {language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}
                </span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(totalSales)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 block">
                  {language === 'ar' ? 'عدد الطلبات' : 'Total Orders'}
                </span>
                <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {totalOrdersCount}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
                  {language === 'ar' ? 'متوسط قيمة الطلب' : 'Avg Order Value'}
                </span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0)}
                </span>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="p-4 rounded-xl border border-border dark:border-dark-border bg-card dark:bg-dark-card space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-dark-text-secondary flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                {language === 'ar' ? 'توزيع المبيعات حسب طريقة الدفع' : 'Payment Methods Breakdown'}
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'ar' ? 'نقد (كاش)' : 'Cash'}</span>
                    <span className="text-xs text-gray-400">({cashOrders.length} {language === 'ar' ? 'عمليات' : 'txns'})</span>
                  </div>
                  <span className="font-bold">{formatCurrency(cashTotal)}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>{language === 'ar' ? 'بطاقة بنكية' : 'Card'}</span>
                    <span className="text-xs text-gray-400">({cardOrders.length} {language === 'ar' ? 'عمليات' : 'txns'})</span>
                  </div>
                  <span className="font-bold">{formatCurrency(cardTotal)}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span>{language === 'ar' ? 'بنفت بي (BenefitPay)' : 'BenefitPay'}</span>
                    <span className="text-xs text-gray-400">({benefitOrders.length} {language === 'ar' ? 'عمليات' : 'txns'})</span>
                  </div>
                  <span className="font-bold">{formatCurrency(benefitTotal)}</span>
                </div>
              </div>
            </div>

            {/* Taxes & Discounts */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border dark:border-dark-border bg-gray-50/50 dark:bg-gray-800/30">
                <span className="text-gray-500 block mb-1">
                  {language === 'ar' ? 'ضريبة القيمة المضافة المحصلة' : 'Total VAT Collected'}
                </span>
                <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">
                  {formatCurrency(totalVat)}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-border dark:border-dark-border bg-gray-50/50 dark:bg-gray-800/30">
                <span className="text-gray-500 block mb-1">
                  {language === 'ar' ? 'إجمالي الخصومات الممنوحة' : 'Total Discounts Given'}
                </span>
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(totalDiscounts)}
                </span>
              </div>
            </div>

            {/* Top Sold Products */}
            {topProducts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-dark-text-secondary flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                  {language === 'ar' ? 'الأصناف الأكثر طلباً اليوم' : "Top Selling Items Today"}
                </h4>
                <div className="border border-border dark:border-dark-border rounded-xl overflow-hidden divide-y divide-border dark:divide-dark-border text-xs">
                  {topProducts.map((p, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-medium truncate max-w-[200px]">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-text-secondary dark:text-dark-text-secondary">
                          {p.qty} {language === 'ar' ? 'قطع' : 'pcs'}
                        </span>
                        <span className="font-bold text-primary">{formatCurrency(p.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-muted/20 border-t border-border dark:border-dark-border flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-text-primary dark:text-dark-text-primary text-xs font-semibold transition-colors"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          #shift-summary-modal-backdrop {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            display: block !important;
            padding: 0 !important;
          }
          #printable-shift-report {
            visibility: visible !important;
            width: 100% !important;
            color: black !important;
            background: white !important;
          }
          #printable-shift-report * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PosShiftSummaryModal;
