import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Download, Users, Package, TrendingUp, Calendar, 
  ArrowUpRight, ArrowDownRight, Award, DollarSign, Printer,
  Layers, ShoppingBag, Wallet, FileText, CheckCircle2, 
  AlertCircle, ChevronRight, X, Percent, BarChart3
} from 'lucide-react';
import PrintReportModal from '../components/reports/PrintReportModal';

const PALETTE = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

type ReportTab = 'sales' | 'inventory' | 'finance' | 'staff';
type TimeframeFilter = 'today' | 'week' | 'month' | 'last_month' | 'year' | 'all';

const ReportsScreen: React.FC = () => {
  const { orders, products, employees, expenses, customers } = useAppContext();
  const { t, formatCurrency, formatNumber, formatDate, language } = useTranslation();
  const { logoUrl, footerText } = useSettings();
  const { theme } = useTheme();
  const isRtl = language === 'ar';

  const formatPercent = useCallback((value: number, digits = 1) => {
    return `${formatNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
  }, [formatNumber]);

  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const printIframeRef = useRef<HTMLIFrameElement>(null);

  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#334155' : '#f1f5f9';

  // Date filtering logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const isDateWithinTimeframe = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    switch (timeframe) {
      case 'today':
        return dateStr.startsWith(todayStr);
      case 'week': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      case 'month': {
        const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return dateStr.startsWith(ym);
      }
      case 'last_month': {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lmStr = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}`;
        return dateStr.startsWith(lmStr);
      }
      case 'year':
        return d.getFullYear() === now.getFullYear();
      case 'all':
      default:
        return true;
    }
  };

  // Filtered Orders & Expenses
  const filteredOrders = useMemo(() => {
    return orders.filter(o => isDateWithinTimeframe(o.date));
  }, [orders, timeframe]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => isDateWithinTimeframe(e.date));
  }, [expenses, timeframe]);

  // --- Sales Metrics Calculation ---
  const salesMetrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const totalItemsCount = filteredOrders.reduce((sum, o) => {
      return sum + (o.items || []).reduce((iSum, i) => iSum + (i.quantity || 0), 0);
    }, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Payment Methods Breakdown
    const paymentMap = new Map<string, { count: number; total: number }>();
    filteredOrders.forEach(o => {
      const pm = o.paymentMethod || 'Cash';
      const curr = paymentMap.get(pm) || { count: 0, total: 0 };
      paymentMap.set(pm, {
        count: curr.count + 1,
        total: curr.total + (o.total || 0)
      });
    });

    const paymentData = Array.from(paymentMap.entries()).map(([name, data]) => ({
      name,
      displayName: name === 'Card' ? (isRtl ? 'بطاقة بنكية' : 'Card') : name === 'BenefitPay' ? 'BenefitPay' : (isRtl ? 'نقداً' : 'Cash'),
      count: data.count,
      total: data.total,
      percentage: totalRevenue > 0 ? ((data.total / totalRevenue) * 100).toFixed(1) : '0'
    }));

    // Top Selling Products
    const productSalesMap = new Map<string, { quantity: number; revenue: number }>();
    filteredOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const curr = productSalesMap.get(item.productId) || { quantity: 0, revenue: 0 };
        productSalesMap.set(item.productId, {
          quantity: curr.quantity + item.quantity,
          revenue: curr.revenue + (item.price * item.quantity)
        });
      });
    });

    const topProducts = Array.from(productSalesMap.entries())
      .map(([id, data]) => {
        const p = products.find(prod => prod.id === id);
        return {
          id,
          name: p ? p.name : (isRtl ? 'صنف غير معروف' : 'Product'),
          sku: p ? p.sku : '',
          category: p ? p.category : '',
          quantity: data.quantity,
          revenue: data.revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Sales Trend over Time
    const trendMap = new Map<string, number>();
    filteredOrders.forEach(order => {
      if (!order.date) return;
      const d = new Date(order.date);
      let key = '';
      if (timeframe === 'today' || timeframe === 'week') {
        key = order.date.split('T')[0];
      } else if (timeframe === 'year') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = order.date.split('T')[0];
      }
      trendMap.set(key, (trendMap.get(key) || 0) + (order.total || 0));
    });

    const trendData = Array.from(trendMap.entries())
      .map(([dateKey, total]) => {
        return {
          name: dateKey,
          total
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      totalRevenue,
      totalOrders,
      totalItemsCount,
      avgOrderValue,
      paymentData,
      topProducts,
      trendData
    };
  }, [filteredOrders, products, isRtl, timeframe]);

  // --- Inventory Valuation Metrics ---
  const inventoryMetrics = useMemo(() => {
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const categoryStockMap = new Map<string, { count: number; costVal: number; retailVal: number }>();

    products.forEach(p => {
      const stock = p.stock || 0;
      const purchasePrice = p.purchasePrice || 0;
      const salePrice = p.salePrice || 0;

      const itemCostVal = stock * purchasePrice;
      const itemRetailVal = stock * salePrice;

      totalCostValuation += itemCostVal;
      totalRetailValuation += itemRetailVal;

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= (p.lowStockThreshold || 5)) {
        lowStockCount++;
      }

      const cat = p.category || (isRtl ? 'عام' : 'General');
      const curr = categoryStockMap.get(cat) || { count: 0, costVal: 0, retailVal: 0 };
      categoryStockMap.set(cat, {
        count: curr.count + stock,
        costVal: curr.costVal + itemCostVal,
        retailVal: curr.retailVal + itemRetailVal
      });
    });

    const unrealizedGrossProfit = totalRetailValuation - totalCostValuation;
    const potentialMargin = totalRetailValuation > 0 ? (unrealizedGrossProfit / totalRetailValuation) * 100 : 0;

    const categoryBreakdown = Array.from(categoryStockMap.entries()).map(([cat, val]) => ({
      category: cat,
      stockCount: val.count,
      costVal: val.costVal,
      retailVal: val.retailVal,
      margin: val.retailVal > 0 ? ((val.retailVal - val.costVal) / val.retailVal) * 100 : 0
    })).sort((a, b) => b.costVal - a.costVal);

    // Top high-value stock items
    const topCapitalItems = [...products]
      .map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        purchasePrice: p.purchasePrice,
        salePrice: p.salePrice,
        totalCostValue: (p.stock || 0) * (p.purchasePrice || 0),
        totalRetailValue: (p.stock || 0) * (p.salePrice || 0)
      }))
      .sort((a, b) => b.totalCostValue - a.totalCostValue)
      .slice(0, 6);

    return {
      totalProducts: products.length,
      totalCostValuation,
      totalRetailValuation,
      unrealizedGrossProfit,
      potentialMargin,
      lowStockCount,
      outOfStockCount,
      categoryBreakdown,
      topCapitalItems
    };
  }, [products, isRtl]);

  // --- Financial & P&L Metrics ---
  const financeMetrics = useMemo(() => {
    const revenue = salesMetrics.totalRevenue;
    const cogs = filteredOrders.reduce((sum, order) => {
      return sum + (order.items || []).reduce((itemSum, item) => {
        const prod = products.find(p => p.id === item.productId);
        return itemSum + (prod ? prod.purchasePrice * item.quantity : 0);
      }, 0);
    }, 0);

    const totalExp = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalExp;

    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const expenseRatio = revenue > 0 ? (totalExp / revenue) * 100 : 0;

    // Expenses by Category
    const expCatMap = new Map<string, number>();
    filteredExpenses.forEach(e => {
      const cat = e.category || 'Other';
      expCatMap.set(cat, (expCatMap.get(cat) || 0) + (e.amount || 0));
    });

    const expenseCategories = Array.from(expCatMap.entries()).map(([name, amount]) => ({
      name,
      displayName: t(`finance.categories.${name}`) || name,
      amount,
      percentage: totalExp > 0 ? ((amount / totalExp) * 100).toFixed(1) : '0'
    })).sort((a, b) => b.amount - a.amount);

    return {
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      expenses: totalExp,
      expenseRatio,
      netProfit,
      netMargin,
      expenseCategories
    };
  }, [salesMetrics.totalRevenue, filteredOrders, products, filteredExpenses, t]);

  // --- Staff & Salesperson Metrics ---
  const staffMetrics = useMemo(() => {
    const staffMap = new Map<string, { count: number; total: number }>();
    filteredOrders.forEach(o => {
      const empId = o.employeeId || 'unknown';
      const curr = staffMap.get(empId) || { count: 0, total: 0 };
      staffMap.set(empId, {
        count: curr.count + 1,
        total: curr.total + (o.total || 0)
      });
    });

    const staffList = Array.from(staffMap.entries()).map(([id, data]) => {
      const emp = employees.find(e => e.id === id);
      return {
        id,
        name: emp ? emp.name : (isRtl ? 'المبيعات العامة' : 'Store Staff'),
        count: data.count,
        total: data.total,
        average: data.count > 0 ? data.total / data.count : 0,
        contribution: salesMetrics.totalRevenue > 0 ? (data.total / salesMetrics.totalRevenue) * 100 : 0
      };
    }).sort((a, b) => b.total - a.total);

    return {
      staffList,
      topSeller: staffList[0] || null
    };
  }, [filteredOrders, employees, isRtl, salesMetrics.totalRevenue]);

  // CSV Export for current Tab
  const handleExportCSV = () => {
    let filename = '';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeTab === 'sales') {
      filename = `sales_report_${timeframe}_${todayStr}.csv`;
      headers = ['Order Number', 'Date', 'Customer', 'Items Count', 'Payment Method', 'Total'];
      rows = filteredOrders.map(o => [
        o.orderNumber,
        o.date.split('T')[0],
        customers.find(c => c.id === o.customerId)?.name || o.customerId,
        (o.items || []).reduce((s, i) => s + i.quantity, 0),
        o.paymentMethod,
        o.total
      ]);
    } else if (activeTab === 'inventory') {
      filename = `inventory_valuation_${todayStr}.csv`;
      headers = ['Product Name', 'SKU', 'Category', 'Stock Qty', 'Cost Price', 'Sale Price', 'Cost Valuation', 'Retail Valuation'];
      rows = products.map(p => [
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        p.category,
        p.stock,
        p.purchasePrice,
        p.salePrice,
        (p.stock || 0) * (p.purchasePrice || 0),
        (p.stock || 0) * (p.salePrice || 0)
      ]);
    } else if (activeTab === 'finance') {
      filename = `pl_statement_${timeframe}_${todayStr}.csv`;
      headers = ['Category / Item', 'Amount (BHD)', 'Percentage'];
      rows = [
        ['Total Sales Revenue', financeMetrics.revenue, '100%'],
        ['Cost of Goods Sold (COGS)', financeMetrics.cogs, `${((financeMetrics.cogs / (financeMetrics.revenue || 1)) * 100).toFixed(1)}%`],
        ['Gross Profit', financeMetrics.grossProfit, `${financeMetrics.grossMargin.toFixed(1)}%`],
        ['Operating Expenses', financeMetrics.expenses, `${financeMetrics.expenseRatio.toFixed(1)}%`],
        ['Net Profit', financeMetrics.netProfit, `${financeMetrics.netMargin.toFixed(1)}%`],
        ...financeMetrics.expenseCategories.map(c => [`Expense: ${c.displayName}`, c.amount, `${c.percentage}%`])
      ];
    } else {
      filename = `staff_performance_${timeframe}_${todayStr}.csv`;
      headers = ['Employee', 'Orders Handled', 'Total Sales Revenue', 'Avg Ticket Size', 'Contribution %'];
      rows = staffMetrics.staffList.map(s => [
        `"${s.name.replace(/"/g, '""')}"`,
        s.count,
        s.total,
        s.average.toFixed(3),
        `${s.contribution.toFixed(1)}%`
      ]);
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepared Data for Print Modal
  const currentReportData = useMemo(() => {
    const timeframeLabels: Record<TimeframeFilter, string> = {
      today: isRtl ? 'اليوم' : 'Today',
      week: isRtl ? `آخر ${formatNumber(7)} أيام` : 'Last 7 Days',
      month: isRtl ? 'هذا الشهر' : 'This Month',
      last_month: isRtl ? 'الشهر الماضي' : 'Last Month',
      year: isRtl ? 'هذا العام' : 'This Year',
      all: isRtl ? 'جميع الفترات' : 'All Time'
    };
    const periodLabel = timeframeLabels[timeframe] || timeframe;

    if (activeTab === 'sales') {
      return {
        title: isRtl ? 'تقرير المبيعات والإيرادات' : 'Sales & Revenue Report',
        periodLabel,
        summaryCards: [
          { label: isRtl ? 'إجمالي الإيرادات' : 'Total Revenue', value: formatCurrency(salesMetrics.totalRevenue) },
          { label: isRtl ? 'عدد الفواتير' : 'Invoices Count', value: formatNumber(filteredOrders.length) },
          { label: isRtl ? 'متوسط الفاتورة' : 'Avg Order Value', value: formatCurrency(salesMetrics.avgOrderValue) },
          { label: isRtl ? 'إجمالي القطع المباعة' : 'Items Sold', value: formatNumber(salesMetrics.totalItemsCount) }
        ],
        tableHeaders: [
          isRtl ? 'رقم الفاتورة' : 'Invoice #',
          isRtl ? 'التاريخ' : 'Date',
          isRtl ? 'العميل' : 'Customer',
          isRtl ? 'القطع' : 'Items',
          isRtl ? 'طريقة الدفع' : 'Payment',
          isRtl ? 'الإجمالي' : 'Total'
        ],
        tableRows: filteredOrders.map(o => [
          o.orderNumber,
          formatDate(o.date),
          customers.find(c => c.id === o.customerId)?.name || (isRtl ? 'عميل نقدي' : 'Cash Customer'),
          (o.items || []).reduce((s, i) => s + i.quantity, 0),
          o.paymentMethod || 'Cash',
          formatCurrency(o.total || 0)
        ]),
        totalsRow: [
          isRtl ? 'المجموع الإجمالي' : 'Grand Total',
          '-',
          `${formatNumber(filteredOrders.length)} ${isRtl ? 'فاتورة' : 'orders'}`,
          salesMetrics.totalItemsCount,
          '-',
          formatCurrency(salesMetrics.totalRevenue)
        ]
      };
    } else if (activeTab === 'inventory') {
      const totalCost = products.reduce((acc, p) => acc + (p.stock || 0) * (p.purchasePrice || 0), 0);
      const totalRetail = products.reduce((acc, p) => acc + (p.stock || 0) * (p.salePrice || 0), 0);
      const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);

      return {
        title: isRtl ? 'تقرير تقييم وجرد المخزون والأجهزة' : 'Inventory Valuation & Stock Report',
        periodLabel: isRtl ? 'الرصيد اللحظي' : 'Current Snapshot',
        summaryCards: [
          { label: isRtl ? 'إجمالي الأصناف' : 'Total SKUs', value: formatNumber(products.length) },
          { label: isRtl ? 'إجمالي القطع المتوفرة' : 'Stock Units', value: formatNumber(totalStock) },
          { label: isRtl ? 'تقييم التكلفة' : 'Cost Valuation', value: formatCurrency(totalCost) },
          { label: isRtl ? 'تقييم سعر البيع' : 'Retail Valuation', value: formatCurrency(totalRetail) }
        ],
        tableHeaders: [
          isRtl ? 'اسم الصنف' : 'Product Name',
          'SKU',
          isRtl ? 'التصنيف' : 'Category',
          isRtl ? 'الكمية' : 'Stock',
          isRtl ? 'سعر التكلفة' : 'Cost',
          isRtl ? 'سعر البيع' : 'Price',
          isRtl ? 'إجمالي التكلفة' : 'Total Cost'
        ],
        tableRows: products.map(p => [
          p.name,
          p.sku || '-',
          p.category || '-',
          p.stock || 0,
          formatCurrency(p.purchasePrice || 0),
          formatCurrency(p.salePrice || 0),
          formatCurrency((p.stock || 0) * (p.purchasePrice || 0))
        ]),
        totalsRow: [
          isRtl ? 'الإجمالي العام' : 'Total',
          '-',
          `${formatNumber(products.length)} ${isRtl ? 'صنف' : 'items'}`,
          totalStock,
          '-',
          '-',
          formatCurrency(totalCost)
        ]
      };
    } else if (activeTab === 'finance') {
      return {
        title: isRtl ? 'تقرير قائمة الدخل والأرباح (P&L)' : 'Profit & Loss Statement (P&L)',
        periodLabel,
        summaryCards: [
          { label: isRtl ? 'إجمالي المبيعات' : 'Revenue', value: formatCurrency(financeMetrics.revenue) },
          { label: isRtl ? 'تكلفة البضاعة المباعة' : 'COGS', value: formatCurrency(financeMetrics.cogs) },
          { label: isRtl ? 'المصروفات التشغيلية' : 'Expenses', value: formatCurrency(financeMetrics.expenses) },
          { label: isRtl ? 'صافي الربح' : 'Net Profit', value: formatCurrency(financeMetrics.netProfit) }
        ],
        tableHeaders: [
          isRtl ? 'البند المالي' : 'Financial Line Item',
          isRtl ? 'القيمة (د.ب)' : 'Amount (BHD)',
          isRtl ? 'النسبة من المبيعات' : 'Percentage'
        ],
        tableRows: [
          [isRtl ? 'إجمالي إيرادات المبيعات' : 'Total Sales Revenue', formatCurrency(financeMetrics.revenue), formatPercent(100, 0)],
          [isRtl ? 'تكلفة البضاعة المباعة (COGS)' : 'Cost of Goods Sold', formatCurrency(financeMetrics.cogs), formatPercent((financeMetrics.cogs / (financeMetrics.revenue || 1)) * 100)],
          [isRtl ? 'مجمل الربح' : 'Gross Profit', formatCurrency(financeMetrics.grossProfit), formatPercent(financeMetrics.grossMargin)],
          [isRtl ? 'إجمالي المصروفات' : 'Operating Expenses', formatCurrency(financeMetrics.expenses), formatPercent(financeMetrics.expenseRatio)],
          [isRtl ? 'صافي الأرباح' : 'Net Profit', formatCurrency(financeMetrics.netProfit), formatPercent(financeMetrics.netMargin)],
          ...financeMetrics.expenseCategories.map(c => [
            `${isRtl ? 'مصروف:' : 'Expense:'} ${c.displayName}`,
            formatCurrency(c.amount),
            formatPercent(Number(c.percentage))
          ])
        ]
      };
    } else {
      return {
        title: isRtl ? 'تقرير أداء فريق المبيعات' : 'Sales Team Performance Report',
        periodLabel,
        summaryCards: [
          { label: isRtl ? 'عدد الموظفين' : 'Staff Members', value: formatNumber(staffMetrics.staffList.length) },
          { label: isRtl ? 'إجمالي المبيعات' : 'Team Revenue', value: formatCurrency(salesMetrics.totalRevenue) },
          { label: isRtl ? 'إجمالي الفواتير' : 'Invoices Handled', value: formatNumber(salesMetrics.totalOrders) },
          { label: isRtl ? 'الأعلى مبيعاً' : 'Top Performer', value: staffMetrics.topSeller?.name || '-' }
        ],
        tableHeaders: [
          isRtl ? 'اسم الموظف' : 'Staff Name',
          isRtl ? 'عدد الفواتير' : 'Orders Count',
          isRtl ? 'إجمالي المبيعات' : 'Total Sales',
          isRtl ? 'متوسط الفاتورة' : 'Avg Order',
          isRtl ? 'نسبة المساهمة' : 'Contribution'
        ],
        tableRows: staffMetrics.staffList.map(s => [
          s.name,
          s.count,
          formatCurrency(s.total),
          formatCurrency(s.average),
          formatPercent(s.contribution)
        ])
      };
    }
  }, [activeTab, timeframe, filteredOrders, products, financeMetrics, staffMetrics, salesMetrics, customers, formatCurrency, formatNumber, formatPercent, formatDate, isRtl]);

  // Safe In-Page Print Trigger -> Opens Report Print Preview Modal
  const handlePrint = () => {
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('reports.title')}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مركز التقارير والتحليلات' : 'Analytics & Business Intelligence'}</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRtl 
              ? 'تقارير شاملة للمبيعات، تقييم المخزون، قائمة الدخل، وأداء فريق العمل' 
              : 'Detailed analysis for sales performance, stock valuation, P&L, and team efficiency'}
          </p>
        </div>

        {/* Global Export & Print Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all"
            title={isRtl ? "تصدير بيانات التقرير النشط كملف CSV" : "Export current report as CSV"}
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{isRtl ? 'تصدير إكسل (CSV)' : 'Export CSV'}</span>
          </button>

          <button 
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all shadow-sm"
            title={isRtl ? "استخراج ومعاينة التقرير الرسمي PDF" : "Generate & View Official PDF Report"}
          >
            <FileText className="w-4 h-4 text-amber-500" />
            <span>{isRtl ? 'استخراج تقرير رسمي (PDF)' : 'Official PDF Report'}</span>
          </button>

          <button 
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover active:scale-95 rounded-xl shadow-md shadow-primary/20 transition-all"
            title={isRtl ? "طباعة التقرير" : "Print Report"}
          >
            <Printer className="w-4 h-4" />
            <span>{isRtl ? 'طباعة التقرير' : 'Print Report'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
        {/* Domain Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 scrollbar-none">
          {[
            { id: 'sales', label: isRtl ? 'المبيعات والإيرادات' : 'Sales & Revenue', icon: ShoppingBag },
            { id: 'inventory', label: isRtl ? 'تقييم المخزون' : 'Inventory Valuation', icon: Package },
            { id: 'finance', label: isRtl ? 'قائمة الدخل والأرباح' : 'Profit & Loss (P&L)', icon: Wallet },
            { id: 'staff', label: isRtl ? 'أداء فريق المبيعات' : 'Staff Performance', icon: Users },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Timeframe Presets */}
        <div className="flex items-center gap-1 px-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'today', label: isRtl ? 'اليوم' : 'Today' },
            { id: 'week', label: isRtl ? `${formatNumber(7)} أيام` : '7 Days' },
            { id: 'month', label: isRtl ? 'هذا الشهر' : 'This Month' },
            { id: 'last_month', label: isRtl ? 'الشهر الماضي' : 'Last Month' },
            { id: 'year', label: isRtl ? 'هذا العام' : 'Year' },
            { id: 'all', label: isRtl ? 'الكل' : 'All' },
          ].map(tf => {
            const isTfActive = timeframe === tf.id;
            return (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as TimeframeFilter)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isTfActive
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SALES & REVENUE REPORT */}
      {/* ============================================================== */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Sales Scorecard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{t('reports.total_revenue')}</span>
              <h3 className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-2">
                {formatCurrency(salesMetrics.totalRevenue)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{formatNumber(filteredOrders.length)} {isRtl ? 'فاتورة صادرة' : 'orders processed'}</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{t('reports.total_orders')}</span>
              <h3 className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-2">
                {formatNumber(salesMetrics.totalOrders)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{formatNumber(salesMetrics.totalItemsCount)} {isRtl ? 'قطعة مباعة' : 'total items sold'}</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{isRtl ? 'متوسط قيمة الفاتورة (AOV)' : 'Average Order Value'}</span>
              <h3 className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-2">
                {formatCurrency(salesMetrics.avgOrderValue)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{isRtl ? 'معدل سلة الشراء' : 'Basket size efficiency'}</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{t('reports.top_performing_employee')}</span>
              <h3 className="text-2xl font-bold text-primary truncate mt-2">
                {staffMetrics.topSeller ? staffMetrics.topSeller.name : (isRtl ? 'غير محدد' : 'N/A')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {staffMetrics.topSeller ? `${formatCurrency(staffMetrics.topSeller.total)} (${formatPercent(staffMetrics.topSeller.contribution, 0)})` : '-'}
              </p>
            </div>
          </div>

          {/* Sales Trend & Payment Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend Chart (2 Cols) */}
            <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span>{isRtl ? 'منحنى نمو المبيعات' : 'Sales Revenue Curve'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isRtl ? 'مسار الإيرادات عبر الفترة الزمنية المختارة' : 'Revenue progression across the selected timeframe'}
                  </p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesMetrics.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="name" stroke={tickColor} fontSize={11} tickLine={false} />
                    <YAxis stroke={tickColor} fontSize={11} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip 
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                        borderRadius: '12px'
                      }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods Distribution (1 Col) */}
            <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  <span>{isRtl ? 'طرق الدفع والتحصيل' : 'Payment Distribution'}</span>
                </h3>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesMetrics.paymentData}
                        dataKey="total"
                        nameKey="displayName"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {salesMetrics.paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {salesMetrics.paymentData.map((pm, i) => (
                    <div key={pm.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-700/40 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{pm.displayName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums text-slate-400">{formatPercent(Number(pm.percentage))}</span>
                        <span className="tabular-nums font-semibold text-slate-900 dark:text-white">{formatCurrency(pm.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products Table */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>{t('reports.top_products')}</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start text-slate-600 dark:text-slate-300">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3 text-start">{isRtl ? 'الترتيب' : 'Rank'}</th>
                    <th className="px-5 py-3 text-start">{isRtl ? 'اسم الصنف' : 'Product'}</th>
                    <th className="px-5 py-3 text-start">{isRtl ? 'التصنيف' : 'Category'}</th>
                    <th className="px-5 py-3 text-center">{isRtl ? 'الكمية المباعة' : 'Units Sold'}</th>
                    <th className="px-5 py-3 text-end">{isRtl ? 'إجمالي المبيعات' : 'Revenue'}</th>
                    <th className="px-5 py-3 text-end">{isRtl ? 'نسبة المساهمة' : 'Contribution'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {salesMetrics.topProducts.map((prod, index) => {
                    const share = salesMetrics.totalRevenue > 0 ? (prod.revenue / salesMetrics.totalRevenue) * 100 : 0;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition">
                        <td className="px-5 py-3.5 font-bold tabular-nums text-xs text-slate-400">#{formatNumber(index + 1)}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">{prod.name}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{prod.category || '-'}</td>
                        <td className="px-5 py-3.5 text-center tabular-nums font-medium">{formatNumber(prod.quantity)}</td>
                        <td className="px-5 py-3.5 text-end tabular-nums font-bold text-slate-900 dark:text-white">{formatCurrency(prod.revenue)}</td>
                        <td className="px-5 py-3.5 text-end tabular-nums text-xs text-primary font-medium">{formatPercent(share)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: INVENTORY VALUATION REPORT */}
      {/* ============================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory Valuation Scorecard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{isRtl ? 'قيمة المخزون بسعر التكلفة' : 'Total Cost Valuation'}</span>
              <h3 className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-2">
                {formatCurrency(inventoryMetrics.totalCostValuation)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{formatNumber(inventoryMetrics.totalProducts)} {isRtl ? 'صنف مسجل' : 'registered products'}</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{isRtl ? 'القيمة السوقية المتوقعة (بيع)' : 'Total Retail Valuation'}</span>
              <h3 className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400 mt-2">
                {formatCurrency(inventoryMetrics.totalRetailValuation)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{isRtl ? 'عند بيع كامل المخزون المتوفر' : 'Upon full inventory clearance'}</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{isRtl ? 'إجمالي الأرباح المتوقعة' : 'Unrealized Gross Profit'}</span>
              <h3 className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-2">
                {formatCurrency(inventoryMetrics.unrealizedGrossProfit)}
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {isRtl ? 'هامش ربح متوقع' : 'Potential Margin'}: {formatPercent(inventoryMetrics.potentialMargin)}
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{isRtl ? 'تنبيهات المخزون' : 'Stock Alerts'}</span>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xl font-bold tabular-nums text-rose-600">{formatNumber(inventoryMetrics.outOfStockCount)}</span>
                <span className="text-xs text-slate-400">{isRtl ? 'نفد تماماً' : 'out of stock'}</span>
                <span className="text-slate-300">/</span>
                <span className="text-2xl font-bold tabular-nums text-amber-500">{formatNumber(inventoryMetrics.lowStockCount)}</span>
                <span className="text-xs text-slate-400">{isRtl ? 'منخفض' : 'low stock'}</span>
              </div>
            </div>
          </div>

          {/* Category Valuation Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                {isRtl ? 'تقييم رأس المال حسب التصنيف' : 'Capital Allocation by Category'}
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryMetrics.categoryBreakdown.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="category" stroke={tickColor} fontSize={11} tickLine={false} />
                    <YAxis stroke={tickColor} fontSize={11} tickLine={false} tickFormatter={(v) => `${v}`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="costVal" name={isRtl ? 'سعر التكلفة' : 'Cost Value'} fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="retailVal" name={isRtl ? 'سعر البيع' : 'Retail Value'} fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Capital-Heavy Items */}
            <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                {isRtl ? 'أعلى الأصناف قيمة في المستودع' : 'Highest Capital Invested Items'}
              </h3>
              <div className="space-y-3">
                {inventoryMetrics.topCapitalItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="min-w-0 flex-1 pe-3">
                      <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatNumber(item.stock)} {isRtl ? 'قطعة' : 'units'} @ {formatCurrency(item.purchasePrice)}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                        {formatCurrency(item.totalCostValue)}
                      </p>
                      <p className="text-[10px] text-emerald-600 tabular-nums">
                        {isRtl ? 'البيع:' : 'Retail:'} {formatCurrency(item.totalRetailValue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: PROFIT & LOSS (P&L) FINANCIAL STATEMENT */}
      {/* ============================================================== */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          {/* P&L Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{isRtl ? 'إجمالي الدخل (المبيعات)' : 'Gross Revenue'}</span>
              <h3 className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-2">
                {formatCurrency(financeMetrics.revenue)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{formatPercent(100, 0)} {isRtl ? 'قاعدة الإيرادات' : 'revenue base'}</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{isRtl ? 'الربح الإجمالي (Gross Profit)' : 'Gross Profit'}</span>
              <h3 className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400 mt-2">
                {formatCurrency(financeMetrics.grossProfit)}
              </h3>
              <p className="text-xs text-blue-600 font-semibold mt-1">
                {isRtl ? 'هامش الربح الإجمالي' : 'Gross Margin'}: {formatPercent(financeMetrics.grossMargin)}
              </p>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm ${
              financeMetrics.netProfit >= 0
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
            }`}>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? 'صافي الربح النهائي (Net Profit)' : 'Operating Net Profit'}
              </span>
              <h3 className={`text-2xl font-bold tabular-nums mt-2 ${
                financeMetrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {formatCurrency(financeMetrics.netProfit)}
              </h3>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                {isRtl ? 'هامش صافي الربح' : 'Net Margin'}: {formatPercent(financeMetrics.netMargin)}
              </p>
            </div>
          </div>

          {/* Formal P&L Statement Table */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {isRtl ? 'قائمة الدخل والنتائج المالية (P&L Statement)' : 'Income Statement (P&L)'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {isRtl ? 'كشف تفصيلي بالإيرادات، تكلفة البضاعة المباعة، والمصروفات التشغيلية' : 'Detailed breakdown of revenue, COGS, and operating expenses'}
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {/* Revenue */}
              <div className="py-3 flex items-center justify-between font-medium">
                <span className="text-slate-900 dark:text-white">{formatNumber(1)}. {isRtl ? 'إجمالي إيرادات المبيعات' : 'Gross Sales Revenue'}</span>
                <span className="tabular-nums font-bold text-slate-900 dark:text-white">{formatCurrency(financeMetrics.revenue)}</span>
              </div>

              {/* COGS */}
              <div className="py-3 flex items-center justify-between font-medium text-slate-600 dark:text-slate-400 ps-4">
                <span>(-) {isRtl ? 'تكلفة البضاعة المباعة (COGS)' : 'Cost of Goods Sold (COGS)'}</span>
                <span className="tabular-nums text-amber-600">({formatCurrency(financeMetrics.cogs)})</span>
              </div>

              {/* Gross Profit */}
              <div className="py-3 flex items-center justify-between font-bold bg-slate-50 dark:bg-slate-900/60 px-3 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400">= {isRtl ? 'إجمالي الربح (Gross Profit)' : 'Gross Profit'}</span>
                <span className="tabular-nums text-blue-600 dark:text-blue-400">
                  {formatCurrency(financeMetrics.grossProfit)} ({formatPercent(financeMetrics.grossMargin)})
                </span>
              </div>

              {/* Expenses Subtitle */}
              <div className="py-2.5 font-semibold text-xs text-slate-400 uppercase tracking-wider pt-4">
                {isRtl ? 'المصروفات التشغيلية' : 'Operating Expenses'}
              </div>

              {/* Expense Categories */}
              {financeMetrics.expenseCategories.map(cat => (
                <div key={cat.name} className="py-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 ps-6">
                  <span>{cat.displayName}</span>
                  <span className="tabular-nums text-rose-500">({formatCurrency(cat.amount)})</span>
                </div>
              ))}

              {/* Total Expenses */}
              <div className="py-3 flex items-center justify-between font-medium text-slate-700 dark:text-slate-300 ps-4">
                <span>(-) {isRtl ? 'إجمالي المصروفات التشغيلية' : 'Total Operating Expenses'}</span>
                <span className="tabular-nums text-rose-600">({formatCurrency(financeMetrics.expenses)})</span>
              </div>

              {/* Final Net Profit */}
              <div className={`py-4 flex items-center justify-between font-bold text-base px-4 rounded-xl mt-2 ${
                financeMetrics.netProfit >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
              }`}>
                <span>= {isRtl ? 'صافي الربح التشغيلي (Net Profit)' : 'Net Operating Profit'}</span>
                <span className="tabular-nums text-lg">
                  {formatCurrency(financeMetrics.netProfit)} ({formatPercent(financeMetrics.netMargin)})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: STAFF & TEAM PERFORMANCE */}
      {/* ============================================================== */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Top Performer Card */}
          {staffMetrics.topSeller && (
            <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:to-transparent rounded-3xl border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-xl shadow-md shadow-primary/30">
                  {staffMetrics.topSeller.name.charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {isRtl ? 'الموظف الأعلى تحقيقاً للمبيعات' : 'Top Performing Salesperson'}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {staffMetrics.topSeller.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatNumber(staffMetrics.topSeller.count)} {isRtl ? 'طلبات مكتملة' : 'completed orders'} · {isRtl ? 'المساهمة:' : 'Contribution:'} {formatPercent(staffMetrics.topSeller.contribution)}
                  </p>
                </div>
              </div>
              <div className="text-start sm:text-end">
                <span className="text-xs text-slate-400">{isRtl ? 'إجمالي المحقق' : 'Achieved Revenue'}</span>
                <h4 className="text-2xl font-bold tabular-nums text-primary">
                  {formatCurrency(staffMetrics.topSeller.total)}
                </h4>
              </div>
            </div>
          )}

          {/* Staff Leaderboard Table */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {isRtl ? 'لوحة أداء فريق المبيعات' : 'Sales Team Efficiency Leaderboard'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start text-slate-600 dark:text-slate-300">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3 text-start">{isRtl ? 'الموظف' : 'Employee'}</th>
                    <th className="px-5 py-3 text-center">{isRtl ? 'عدد الفواتير' : 'Orders Count'}</th>
                    <th className="px-5 py-3 text-end">{isRtl ? 'إجمالي المبيعات' : 'Total Revenue'}</th>
                    <th className="px-5 py-3 text-end">{isRtl ? 'متوسط الفاتورة' : 'Average Ticket'}</th>
                    <th className="px-5 py-3 text-end">{isRtl ? 'نسبة المساهمة' : 'Contribution'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {staffMetrics.staffList.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold">
                            {emp.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center tabular-nums">{formatNumber(emp.count)}</td>
                      <td className="px-5 py-4 text-end tabular-nums font-bold text-slate-900 dark:text-white">{formatCurrency(emp.total)}</td>
                      <td className="px-5 py-4 text-end tabular-nums text-slate-500">{formatCurrency(emp.average)}</td>
                      <td className="px-5 py-4 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <span className="tabular-nums text-xs font-semibold text-primary">{formatPercent(emp.contribution)}</span>
                          <div className="w-16 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${emp.contribution}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Official Report Print & Export Modal */}
      <PrintReportModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        reportType={activeTab}
        timeframe={timeframe}
        data={currentReportData}
      />
    </div>
  );
};

export default ReportsScreen;
