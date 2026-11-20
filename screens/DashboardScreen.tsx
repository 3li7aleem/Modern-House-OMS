import React, { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { Order, Quotation, Product } from '../types';
import { 
  TrendingUp, 
  ShoppingCart, 
  FileText, 
  FileSpreadsheet, 
  AlertTriangle, 
  Wrench, 
  Truck, 
  Package, 
  ArrowUpRight, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';

const CHART_COLORS = ['#14213D', '#F59E0B', '#059669', '#3B82F6', '#8B5CF6', '#EC4899'];

const DashboardScreen: React.FC = () => {
  const { 
    orders = [], 
    products = [], 
    customers = [], 
    deliveries = [], 
    quotations = [], 
    repairs = [], 
    currentUser, 
    setActiveScreen, 
    setSelectedItemId 
  } = useAppContext();

  const { t, formatCurrency, formatDate, language } = useTranslation();
  const isAr = language === 'ar';

  // --- Real Operational KPIs Calculation ---
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // 1. Today's Sales
  const todayOrders = useMemo(() => 
    orders.filter(o => o.date && o.date.startsWith(todayStr) && o.status !== 'Cancelled'),
    [orders, todayStr]
  );
  const todayRevenue = useMemo(() => 
    todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    [todayOrders]
  );

  // 2. Open Orders (Pending / Processing)
  const openOrders = useMemo(() => 
    orders.filter(o => o.status === 'Pending' || o.status === 'Processing'),
    [orders]
  );

  // 3. Pending Quotations
  const pendingQuotations = useMemo(() => 
    quotations.filter(q => q.status === 'Sent' || q.status === 'Draft'),
    [quotations]
  );

  // 4. Low Stock Products
  const lowStockProducts = useMemo(() => 
    products.filter(p => (p.stock || 0) <= (p.lowStockThreshold ?? 5) && p.status !== 'Archived'),
    [products]
  );
  const outOfStockProducts = useMemo(() => 
    products.filter(p => (p.stock || 0) <= 0 && p.status !== 'Archived'),
    [products]
  );

  // 5. Open Maintenance / Repairs
  const openRepairs = useMemo(() => 
    repairs.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled'),
    [repairs]
  );

  // 6. Pending Deliveries
  const pendingDeliveries = useMemo(() => 
    deliveries.filter(d => d.status === 'Pending' || d.status === 'Out for Delivery'),
    [deliveries]
  );

  // --- Recent Operations Combined List ---
  const recentOperations = useMemo(() => {
    const list: Array<{
      id: string;
      orderNumber: string;
      type: 'order' | 'quotation';
      customerName: string;
      date: string;
      amount: number;
      status: string;
      raw: Order | Quotation;
    }> = [];

    orders.slice(0, 15).forEach(o => {
      const cust = customers.find(c => c.id === o.customerId);
      list.push({
        id: o.id,
        orderNumber: o.orderNumber || o.id.slice(0, 8),
        type: 'order',
        customerName: cust?.name || (isAr ? 'عميل نقدي' : 'Cash Customer'),
        date: o.date,
        amount: o.total || 0,
        status: o.status,
        raw: o
      });
    });

    quotations.slice(0, 8).forEach(q => {
      const cust = customers.find(c => c.id === q.customerId);
      list.push({
        id: q.id,
        orderNumber: q.quoteNumber || q.id.slice(0, 8),
        type: 'quotation',
        customerName: cust?.name || (isAr ? 'عرض سعر' : 'Quotation'),
        date: q.issueDate || q.createdAt || new Date().toISOString(),
        amount: q.totalAmount || 0,
        status: q.status,
        raw: q
      });
    });

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list.slice(0, 7);
  }, [orders, quotations, customers, isAr]);

  // --- Real Sales Trend Data for Recharts ---
  const salesChartData = useMemo(() => {
    const dailyMap: { [date: string]: number } = {};
    // Last 7 days dates
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      dailyMap[ds] = 0;
    }

    orders.forEach(o => {
      if (o.status !== 'Cancelled' && o.date) {
        const ds = o.date.slice(0, 10);
        if (dailyMap[ds] !== undefined) {
          dailyMap[ds] += o.total || 0;
        }
      }
    });

    return Object.entries(dailyMap).map(([date, amount]) => {
      const dObj = new Date(date);
      const label = dObj.toLocaleDateString(isAr ? 'ar-BH' : 'en-GB', { weekday: 'short', day: 'numeric' });
      return {
        date,
        label,
        amount: Number(amount.toFixed(3))
      };
    });
  }, [orders, isAr]);

  // --- Category Breakdown Data ---
  const categoryData = useMemo(() => {
    const map: { [cat: string]: number } = {};
    products.forEach(p => {
      if (p.status !== 'Archived') {
        const cat = p.category || (isAr ? 'أخرى' : 'Other');
        map[cat] = (map[cat] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).slice(0, 5);
  }, [products, isAr]);

  // Today Date Formatted
  const currentDateFormatted = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(isAr ? 'ar-BH' : 'en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [isAr]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* ============================================================== */}
      {/* 1. OPERATIONAL HEADER & FAST ACTIONS                           */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
              {isAr 
                ? `مرحباً بك، ${currentUser?.name || 'المدير العام'} 👋`
                : `Welcome, ${currentUser?.name || 'General Manager'} 👋`}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              {currentUser?.role || 'Admin'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentDateFormatted}</span>
            </span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{isAr ? 'النظام جاهز ومحدث' : 'System Ready & Operational'}</span>
            </span>
          </div>
        </div>

        {/* Quick Operational Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveScreen('pos')}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isAr ? 'فاتورة كاشير جديدة' : 'New POS Sale'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('quotations')}
            className="flex-1 md:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
            <span>{isAr ? 'عرض سعر جديد' : 'New Quotation'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('inventory')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5"
            title={isAr ? 'إدارة المخزون' : 'Manage Inventory'}
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>{isAr ? 'إضافة صنف' : 'Add Product'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. OPERATIONAL KPI METRIC CARDS (6 FOCUSED CARDS)              */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Card 1: Today's Sales */}
        <div 
          onClick={() => setActiveScreen('orders')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'مبيعات اليوم' : "Today's Sales"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(todayRevenue)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {todayOrders.length} {isAr ? 'عملية مكتملة' : 'completed orders'}
            </p>
          </div>
        </div>

        {/* Card 2: Open Orders */}
        <div 
          onClick={() => setActiveScreen('orders')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'طلبات مفتوحة' : 'Open Orders'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {openOrders.length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isAr ? 'قيد التجهيز والدفع' : 'Pending fulfillment'}
            </p>
          </div>
        </div>

        {/* Card 3: Pending Quotations */}
        <div 
          onClick={() => setActiveScreen('quotations')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'عروض أسعار معلقة' : 'Pending Quotes'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {pendingQuotations.length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isAr ? 'بانتظار تأكيد العميل' : 'Awaiting confirmation'}
            </p>
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div 
          onClick={() => setActiveScreen('inventory')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'مخزون منخفض' : 'Low Stock'}
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              lowStockProducts.length > 0 
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className={`text-base sm:text-lg font-black tracking-tight ${lowStockProducts.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {lowStockProducts.length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {outOfStockProducts.length > 0 ? (isAr ? `${outOfStockProducts.length} صنف نفد بالكامل` : `${outOfStockProducts.length} out of stock`) : (isAr ? 'تحت الحد الأدنى' : 'Below threshold')}
            </p>
          </div>
        </div>

        {/* Card 5: Open Repairs */}
        <div 
          onClick={() => setActiveScreen('maintenance')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'أوامر الصيانة' : 'Active Repairs'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {openRepairs.length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isAr ? 'قيد الفحص والإصلاح' : 'In workshop/check'}
            </p>
          </div>
        </div>

        {/* Card 6: Pending Deliveries */}
        <div 
          onClick={() => setActiveScreen('delivery')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'شحنات معلقة' : 'Dispatches'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {pendingDeliveries.length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isAr ? 'جاهزة لخروج المندوب' : 'Ready for delivery'}
            </p>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 3. ACTIVITY & OPERATIONAL ACTIONS (2 COLS)                     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left (8 cols): Recent Operations Table */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'آخر العمليات والفواتير' : 'Recent Operations & Invoices'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'أحدث حركات المبيعات وعروض الأسعار في النظام' : 'Latest sales orders & quotations logged'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveScreen('orders')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          {recentOperations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {isAr ? 'لا توجد عمليات مسجلة حتى الآن.' : 'No recent operations recorded.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <th className="font-semibold text-start pb-2.5">{isAr ? 'رقم العملية' : 'Ref #'}</th>
                    <th className="font-semibold text-start pb-2.5">{isAr ? 'النوع' : 'Type'}</th>
                    <th className="font-semibold text-start pb-2.5">{isAr ? 'العميل' : 'Customer'}</th>
                    <th className="font-semibold text-start pb-2.5">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="font-semibold text-start pb-2.5">{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th className="font-semibold text-start pb-2.5">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="font-semibold text-end pb-2.5">{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentOperations.map((op) => (
                    <tr key={`${op.type}-${op.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {op.orderNumber}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          op.type === 'order' 
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {op.type === 'order' ? (isAr ? 'فاتورة' : 'Order') : (isAr ? 'عرض سعر' : 'Quote')}
                        </span>
                      </td>
                      <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {op.customerName}
                      </td>
                      <td className="py-2.5 text-slate-400 text-[11px]">
                        {formatDate(op.date)}
                      </td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(op.amount)}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          op.status === 'Delivered' || op.status === 'Completed' || op.status === 'Accepted'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : op.status === 'Pending' || op.status === 'Sent' || op.status === 'Draft'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {op.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (op.type === 'order') {
                              setActiveScreen('orders');
                              setSelectedItemId(op.id);
                            } else {
                              setActiveScreen('quotations');
                              setSelectedItemId(op.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title={isAr ? 'فتح التفاصيل' : 'Open details'}
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right (4 cols): Urgent Tasks & Operational Alerts */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'المهام والتنبيهات التشغيلية' : 'Action Items & Alerts'}</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
              {lowStockProducts.length + pendingDeliveries.length + openRepairs.length}
            </span>
          </div>

          <div className="space-y-3">
            {/* Low Stock Items Alert */}
            {lowStockProducts.length > 0 && (
              <div 
                onClick={() => setActiveScreen('inventory')}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تنبيه مخزون حرج' : 'Critical Stock Alert'}</span>
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-500 text-white">
                    {lowStockProducts.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                  {lowStockProducts[0]?.name} ({lowStockProducts[0]?.stock} {isAr ? 'حبة فقط' : 'left'})
                </p>
              </div>
            )}

            {/* Pending Deliveries Alert */}
            {pendingDeliveries.length > 0 && (
              <div 
                onClick={() => setActiveScreen('delivery')}
                className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>{isAr ? 'طلبات بانتظار خروج التوصيل' : 'Deliveries Awaiting Dispatch'}</span>
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-sky-500 text-white">
                    {pendingDeliveries.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {isAr ? 'تتطلب تعيين مندوب وتأكيد عنوان العميل' : 'Require driver assignment & dispatch confirmation'}
                </p>
              </div>
            )}

            {/* Active Repairs Alert */}
            {openRepairs.length > 0 && (
              <div 
                onClick={() => setActiveScreen('maintenance')}
                className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{isAr ? 'أجهزة بالصيانة قيد المتابعة' : 'Repairs in Progress'}</span>
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-purple-500 text-white">
                    {openRepairs.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {isAr ? 'يرجى مراجعة حالة فحص قطع الغيار والضمان' : 'Review warranty diagnostics & parts'}
                </p>
              </div>
            )}

            {/* All clear state */}
            {lowStockProducts.length === 0 && pendingDeliveries.length === 0 && openRepairs.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'كافة العمليات منتظمة ومستقرة' : 'All operational tasks up to date'}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 4. REAL DATA ANALYTICS & VISUALIZATIONS                        */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Trend Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'حركة المبيعات خلال الـ 7 أيام الأخيرة' : '7-Day Revenue Trend'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'مستخرجة من فواتير المبيعات الفعلية (د.ب BHD)' : 'Based on real confirmed sales (BHD)'}
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              BHD Live
            </span>
          </div>

          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14213D" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#14213D" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#94A3B8' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#94A3B8' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  formatter={(val: any) => [`${val} د.ب`, isAr ? 'المبيعات' : 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#FFF',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#14213D" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#salesGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appliance Categories Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? 'توزيع الأجهزة والمخزون' : 'Inventory Category Mix'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAr ? 'نسبة الأصناف حسب فئات المطابخ' : 'Appliance and fixture categories'}
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {categoryData.length === 0 ? (
              <div className="text-xs text-slate-400">{isAr ? 'لا توجد فئات' : 'No categories'}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => [`${val} ${isAr ? 'صنف' : 'items'}`, name]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#FFF',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                <span>{item.name}</span>
                <span className="font-bold font-mono">({item.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardScreen;
