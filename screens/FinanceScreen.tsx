import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Expense } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import AddExpenseModal from '../components/finance/AddExpenseModal';
import ExpenseDetailModal from '../components/finance/ExpenseDetailModal';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Cell, PieChart, Pie, Legend, AreaChart, Area 
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Plus, Search, Filter, Download, Printer, Edit2, Trash2, 
  TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, 
  ArrowDownRight, PieChart as PieIcon, Calendar, CheckCircle2, 
  AlertTriangle, X, Eye, FileText, Layers, ShieldCheck
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Rent: '#6366f1',       // Indigo
  Salaries: '#3b82f6',   // Blue
  Utilities: '#06b6d4',  // Cyan
  Supplies: '#f59e0b',   // Amber
  Other: '#ec4899',      // Pink
};

type TimeframeOption = 'all' | 'this_month' | 'last_month' | 'last_90_days' | 'this_year';

const FinanceScreen: React.FC = () => {
  const { orders, expenses, products, addExpense, updateExpense, deleteExpense } = useAppContext();
  const { t, formatCurrency, formatDate, language } = useTranslation();
  const isRtl = language === 'ar';
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#334155' : '#f1f5f9';

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters & Search
  const [timeframe, setTimeframe] = useState<TimeframeOption>('this_month');
  const [selectedSpecificMonth, setSelectedSpecificMonth] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [chartView, setChartView] = useState<'monthly' | 'trend'>('monthly');

  // Month list calculation
  const availableMonths = useMemo(() => {
    const dates = [...orders.map(s => s.date), ...expenses.map(e => e.date)];
    const monthSet = new Set<string>();
    dates.forEach(dateStr => {
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      monthSet.add(`${year}-${month}`);
    });
    return Array.from(monthSet).sort().reverse();
  }, [orders, expenses]);

  // Current date helpers
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Filter dates based on timeframe
  const isDateInTimeframe = (dateStr: string) => {
    if (!dateStr) return false;
    if (selectedSpecificMonth) {
      return dateStr.startsWith(selectedSpecificMonth);
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    switch (timeframe) {
      case 'this_month':
        return dateStr.startsWith(currentYearMonth);
      case 'last_month':
        return dateStr.startsWith(lastYearMonth);
      case 'last_90_days': {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return d >= ninetyDaysAgo;
      }
      case 'this_year':
        return d.getFullYear() === now.getFullYear();
      case 'all':
      default:
        return true;
    }
  };

  // Filtered orders & expenses
  const filteredOrders = useMemo(() => {
    return orders.filter(o => isDateInTimeframe(o.date));
  }, [orders, timeframe, selectedSpecificMonth]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => isDateInTimeframe(e.date));
  }, [expenses, timeframe, selectedSpecificMonth]);

  // Financial Computations for current filtered period
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((acc, order) => acc + (order.total || 0), 0);
  }, [filteredOrders]);

  const costAnalysis = useMemo(() => {
    let missingCostItemsCount = 0;
    let missingCostOrdersCount = 0;
    let computedCogs = 0;

    filteredOrders.forEach(order => {
      let orderHasMissing = false;
      (order.items || []).forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cost = (product && typeof product.purchasePrice === 'number' && product.purchasePrice > 0)
          ? product.purchasePrice
          : (typeof (item as any).purchasePrice === 'number' && (item as any).purchasePrice > 0 ? (item as any).purchasePrice : 0);
        
        if (cost <= 0) {
          missingCostItemsCount++;
          orderHasMissing = true;
        } else {
          computedCogs += cost * item.quantity;
        }
      });
      if (orderHasMissing) missingCostOrdersCount++;
    });

    return {
      cogs: computedCogs,
      hasMissing: missingCostItemsCount > 0,
      missingItemsCount: missingCostItemsCount,
      missingOrdersCount: missingCostOrdersCount,
    };
  }, [filteredOrders, products]);

  const totalCostOfGoods = costAnalysis.cogs;
  const isProfitIncomplete = costAnalysis.hasMissing;

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => acc + (expense.amount || 0), 0);
  }, [filteredExpenses]);

  const grossProfit = totalRevenue - totalCostOfGoods;
  const netProfit = grossProfit - totalExpenses;
  
  const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const expenseRatioPercent = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

  // Monthly aggregated data for multi-month financial bar / area charts
  const monthlyTimelineData = useMemo(() => {
    const months = availableMonths.slice(0, 6).reverse(); // Last 6 recorded months
    return months.map(mKey => {
      const [year, month] = mKey.split('-');
      const dObj = new Date(Number(year), Number(month) - 1);
      const label = dObj.toLocaleString(isRtl ? 'ar-BH' : 'en-US', { month: 'short', year: '2-digit' });

      const mOrders = orders.filter(o => o.date.startsWith(mKey));
      const mExpenses = expenses.filter(e => e.date.startsWith(mKey));

      const rev = mOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const cogs = mOrders.reduce((sum, o) => {
        return sum + (o.items || []).reduce((iSum, item) => {
          const product = products.find(p => p.id === item.productId);
          return iSum + (product ? product.purchasePrice * item.quantity : 0);
        }, 0);
      }, 0);
      const exp = mExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const gross = rev - cogs;
      const net = gross - exp;

      return {
        monthKey: mKey,
        label,
        revenue: rev,
        cogs,
        grossProfit: gross,
        expenses: exp,
        netProfit: net,
      };
    });
  }, [availableMonths, orders, expenses, products, isRtl]);

  // Expenses Category Breakdown
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {
      Rent: 0,
      Salaries: 0,
      Utilities: 0,
      Supplies: 0,
      Other: 0,
    };

    filteredExpenses.forEach(exp => {
      const cat = exp.category || 'Other';
      if (catMap[cat] !== undefined) {
        catMap[cat] += exp.amount || 0;
      } else {
        catMap['Other'] += exp.amount || 0;
      }
    });

    return Object.entries(catMap)
      .map(([name, value]) => ({
        name,
        displayName: t(`finance.categories.${name}`) || name,
        value,
        color: CATEGORY_COLORS[name] || '#94a3b8',
        percentage: totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : '0',
      }))
      .filter(item => item.value > 0 || totalExpenses === 0);
  }, [filteredExpenses, totalExpenses, t]);

  // Filtered & Sorted Expense Ledger List
  const displayExpenses = useMemo(() => {
    return filteredExpenses
      .filter(exp => {
        // Category filter
        if (categoryFilter !== 'All' && exp.category !== categoryFilter) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesDesc = (exp.description || '').toLowerCase().includes(q);
          const matchesCat = (exp.category || '').toLowerCase().includes(q);
          const matchesAmount = String(exp.amount || '').includes(q);
          const matchesOrder = (exp.orderId || '').toLowerCase().includes(q);
          return matchesDesc || matchesCat || matchesAmount || matchesOrder;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'amount_desc') {
          return (b.amount || 0) - (a.amount || 0);
        }
        if (sortBy === 'amount_asc') {
          return (a.amount || 0) - (b.amount || 0);
        }
        return 0;
      });
  }, [filteredExpenses, categoryFilter, searchQuery, sortBy]);

  // Total amount of currently displayed/filtered expenses
  const displayedExpensesSum = useMemo(() => {
    return displayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [displayExpenses]);

  // CRUD Handlers
  const handleSaveExpense = async (newExpenseData: Omit<Expense, 'id'>) => {
    try {
      if (expenseToEdit) {
        await updateExpense(expenseToEdit.id, newExpenseData);
      } else {
        await addExpense(newExpenseData);
      }
      setIsAddModalOpen(false);
      setExpenseToEdit(null);
    } catch (error) {
      console.error("Failed to save expense", error);
      alert(isRtl ? "فشل حفظ المصروف، يرجى المحاولة ثانية" : "Failed to save expense");
    }
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    } catch (error) {
      console.error("Failed to delete expense", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getLinkedOrderNumber = (orderId?: string) => {
    if (!orderId) return '-';
    const order = orders.find(s => s.id === orderId);
    return order ? order.orderNumber : (orderId.substring(0, 8) + '...');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Category', 'Description', 'Linked Order', 'Amount (BHD)'];
    const rows = displayExpenses.map(e => [
      e.id,
      e.date.split('T')[0],
      e.category,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      getLinkedOrderNumber(e.orderId),
      e.amount
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe In-Page Print Statement
  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('finance.title')}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              netProfit >= 0 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {netProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{netProfit >= 0 ? (isRtl ? 'أداء ربحي إيجابي' : 'Profitable') : (isRtl ? 'عجز مالي' : 'Net Loss')}</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRtl 
              ? 'مراقبة السيولة النقدية، تكاليف البضاعة، هوامش الأرباح والمصروفات التشغيلية' 
              : 'Monitor revenue, COGS, gross margins, operating expenses and net profit'}
          </p>
        </div>

        {/* Global Finance Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all"
            title={isRtl ? "تصدير كشف المصروفات" : "Export Expenses CSV"}
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">{isRtl ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          <button
            onClick={handlePrintStatement}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all"
            title={isRtl ? "طباعة التقرير" : "Print Report"}
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">{isRtl ? 'طباعة' : 'Print'}</span>
          </button>

          <button
            onClick={() => {
              setExpenseToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover active:scale-95 rounded-xl shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('finance.add_expense_button')}</span>
          </button>
        </div>
      </div>

      {/* Interactive Timeframe Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
        {/* Segmented Preset Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 scrollbar-none">
          {[
            { id: 'this_month', label: isRtl ? 'هذا الشهر' : 'This Month' },
            { id: 'last_month', label: isRtl ? 'الشهر الماضي' : 'Last Month' },
            { id: 'last_90_days', label: isRtl ? 'آخر 90 يوماً' : 'Last 90 Days' },
            { id: 'this_year', label: isRtl ? 'هذا العام' : 'This Year' },
            { id: 'all', label: isRtl ? 'كل الفترات' : 'All Time' },
          ].map(opt => {
            const isActive = !selectedSpecificMonth && timeframe === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setSelectedSpecificMonth('');
                  setTimeframe(opt.id as TimeframeOption);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Specific Month Picker Dropdown */}
        <div className="flex items-center gap-2 px-2">
          <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedSpecificMonth}
            onChange={(e) => {
              setSelectedSpecificMonth(e.target.value);
            }}
            className="w-full sm:w-auto text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
            aria-label="Select custom month"
          >
            <option value="">{isRtl ? 'اختيار شهر محدد...' : 'Select specific month...'}</option>
            {availableMonths.map(m => {
              const [y, mo] = m.split('-');
              const d = new Date(Number(y), Number(mo) - 1);
              const label = d.toLocaleString(isRtl ? 'ar-BH' : 'en-US', { month: 'long', year: 'numeric' });
              return (
                <option key={m} value={m}>{label}</option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Profit Accuracy Incomplete Warning Banner */}
      {isProfitIncomplete && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <span>
              {isRtl
                ? `تنبيه دقة الأرباح: يوجد ${costAnalysis.missingItemsCount} منتج مباع بدون تكلفة شراء مسجلة في كروت الأصناف. حساب الأرباح الحالية تقريبي وغير مكتمل حتى استكمال أسعار التكلفة.`
                : `Profit Accuracy Notice: ${costAnalysis.missingItemsCount} sold products have missing purchase costs. Profit calculations are marked incomplete until costs are configured.`}
            </span>
          </div>
        </div>
      )}

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('finance.cards.total_revenue')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(totalRevenue)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{filteredOrders.length} {isRtl ? 'طلب مبيعات' : 'orders'}</span>
              <span aria-hidden="true">·</span>
              <span>{isRtl ? 'متوسط الفاتورة' : 'AOV'}: {formatCurrency(filteredOrders.length ? totalRevenue / filteredOrders.length : 0)}</span>
            </div>
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isRtl ? 'تكلفة البضاعة المباعة (COGS)' : 'Cost of Goods Sold'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(totalCostOfGoods)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{totalRevenue > 0 ? ((totalCostOfGoods / totalRevenue) * 100).toFixed(1) : 0}% {isRtl ? 'من الإيرادات' : 'of revenue'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-600 font-medium">
                {isRtl ? 'هامش مجمل' : 'Gross'}: {grossMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('finance.cards.total_expenses')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {formatCurrency(totalExpenses)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{filteredExpenses.length} {isRtl ? 'عملية صرف' : 'transactions'}</span>
              <span aria-hidden="true">·</span>
              <span>{expenseRatioPercent.toFixed(1)}% {isRtl ? 'نسبة المصاريف' : 'expense ratio'}</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden group transition-all ${
          isProfitIncomplete
            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60'
            : netProfit >= 0
              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('finance.cards.net_profit')}
              </span>
              {isProfitIncomplete && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {isRtl ? 'غير مكتمل ⚠️' : 'Incomplete ⚠️'}
                </span>
              )}
            </div>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isProfitIncomplete
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                : netProfit >= 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
            }`}>
              {isProfitIncomplete ? <AlertCircle className="w-4 h-4" /> : netProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-bold font-mono tabular-nums ${
              isProfitIncomplete ? 'text-amber-600 dark:text-amber-400' : netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(netProfit)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold">{netMarginPercent.toFixed(1)}% {isRtl ? 'هامش صافي الربح' : 'net margin'}</span>
              <span aria-hidden="true">·</span>
              <span>{isRtl ? 'المجمل' : 'Gross'}: {formatCurrency(grossProfit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: P&L Performance & Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Financial Performance Overview (2 Cols) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isRtl ? 'الأداء المالي المقارن' : 'Comparative Financial Performance'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isRtl ? 'مقارنة الإيرادات، التكلفة، والمصروفات خلال الأشهر المسجلة' : 'Revenue, COGS, and operating expenses over time'}
                </p>
              </div>

              {/* View Toggle */}
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl self-start">
                <button
                  onClick={() => setChartView('monthly')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    chartView === 'monthly'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {isRtl ? 'الأعمدة' : 'Bar Chart'}
                </button>
                <button
                  onClick={() => setChartView('trend')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    chartView === 'trend'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {isRtl ? 'المساحة' : 'Area Trend'}
                </button>
              </div>
            </div>

            {/* Chart Container */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'monthly' ? (
                  <BarChart data={monthlyTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="label" stroke={tickColor} fontSize={12} tickLine={false} />
                    <YAxis stroke={tickColor} fontSize={11} tickLine={false} tickFormatter={(v) => `${v}`} />
                    <Tooltip
                      formatter={(val: number, name: string) => [
                        formatCurrency(val),
                        name === 'revenue' 
                          ? (isRtl ? 'الإيرادات' : 'Revenue')
                          : name === 'expenses'
                          ? (isRtl ? 'المصروفات' : 'Expenses')
                          : (isRtl ? 'صافي الربح' : 'Net Profit')
                      ]}
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      formatter={(val) => (
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {val === 'revenue' ? (isRtl ? 'الإيرادات' : 'Revenue') : val === 'expenses' ? (isRtl ? 'المصروفات' : 'Expenses') : (isRtl ? 'صافي الربح' : 'Net Profit')}
                        </span>
                      )}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="netProfit" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                ) : (
                  <AreaChart data={monthlyTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="label" stroke={tickColor} fontSize={12} tickLine={false} />
                    <YAxis stroke={tickColor} fontSize={11} tickLine={false} tickFormatter={(v) => `${v}`} />
                    <Tooltip
                      formatter={(val: number) => formatCurrency(val)}
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                        borderRadius: '12px'
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="netProfit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Distribution Spectrum Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
              <span>{isRtl ? 'توزيع الإيراد الكلي' : 'Total Revenue Allocation'}</span>
              <span>100% ({formatCurrency(totalRevenue)})</span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div 
                className="bg-amber-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, totalRevenue > 0 ? (totalCostOfGoods / totalRevenue) * 100 : 0))}%` }}
                title={`${isRtl ? 'تكلفة بضاعة' : 'COGS'}: ${totalRevenue > 0 ? ((totalCostOfGoods / totalRevenue) * 100).toFixed(1) : 0}%`}
              />
              <div 
                className="bg-rose-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0))}%` }}
                title={`${isRtl ? 'مصروفات تشغيل' : 'Expenses'}: ${totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : 0}%`}
              />
              <div 
                className="bg-emerald-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0))}%` }}
                title={`${isRtl ? 'صافي ربح' : 'Net Profit'}: ${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%`}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{isRtl ? 'تكلفة البضاعة' : 'COGS'} ({totalRevenue > 0 ? ((totalCostOfGoods / totalRevenue) * 100).toFixed(0) : 0}%)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{isRtl ? 'المصروفات' : 'Expenses'} ({expenseRatioPercent.toFixed(0)}%)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{isRtl ? 'صافي الربح' : 'Net Margin'} ({netMarginPercent.toFixed(0)}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Expenses by Category Donut Chart (1 Col) */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isRtl ? 'توزيع المصروفات' : 'Expense Breakdown'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isRtl ? 'حسب بنود الصرف التشغيلي' : 'By operational cost category'}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                {formatCurrency(totalExpenses)}
              </span>
            </div>

            {/* Donut Chart */}
            <div className="h-52 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="displayName"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: number) => formatCurrency(val)}
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                      borderRadius: '10px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400 font-medium">{isRtl ? 'الإجمالي' : 'Total'}</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>

            {/* Category Breakdown List */}
            <div className="space-y-2 mt-2">
              {categoryData.map(cat => (
                <div key={cat.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-700/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{cat.displayName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">{cat.percentage}%</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">{formatCurrency(cat.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expense Ledger Section: Search, Filters & Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {/* Table Controls Bar */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t('finance.expense_log')}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                {displayExpenses.length} {isRtl ? 'سجل' : 'records'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRtl ? 'سجل المصروفات التشغيلية والمشتريات المسجلة' : 'Complete register of registered operational expenses and bills'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? "بحث في الوصف، الصنف، الطلب..." : "Search expenses..."}
                className="w-full ps-9 pe-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 -translate-y-1/2 end-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="date_desc">{isRtl ? 'الأحدث أولاً' : 'Newest First'}</option>
              <option value="date_asc">{isRtl ? 'الأقدم أولاً' : 'Oldest First'}</option>
              <option value="amount_desc">{isRtl ? 'المبلغ: الأعلى' : 'Amount: Highest'}</option>
              <option value="amount_asc">{isRtl ? 'المبلغ: الأقل' : 'Amount: Lowest'}</option>
            </select>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="px-5 py-2.5 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-xs text-slate-400 font-medium me-1 whitespace-nowrap">{isRtl ? 'التصنيف:' : 'Category:'}</span>
          {['All', 'Rent', 'Salaries', 'Utilities', 'Supplies', 'Other'].map(cat => {
            const isCatActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isCatActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat === 'All' ? (isRtl ? 'الكل' : 'All') : (t(`finance.categories.${cat}`) || cat)}
              </button>
            );
          })}
          <div className="ms-auto text-xs font-medium text-slate-500 whitespace-nowrap">
            {isRtl ? 'مجموع المعروض:' : 'Total Filtered:'}{' '}
            <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(displayedExpensesSum)}</span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {displayExpenses.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {isRtl ? 'لا توجد مصروفات مسجلة مطابقة' : 'No matching expenses found'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isRtl ? 'يمكنك إضافة مصروف جديد باستخدام الزر بالأعلى' : 'Try adjusting filters or record a new expense.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-start text-slate-600 dark:text-slate-300">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-700/80">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-start font-semibold">{t('finance.table.date')}</th>
                  <th scope="col" className="px-6 py-3.5 text-start font-semibold">{t('finance.table.category')}</th>
                  <th scope="col" className="px-6 py-3.5 text-start font-semibold">{t('finance.table.description')}</th>
                  <th scope="col" className="px-6 py-3.5 text-start font-semibold">{t('finance.table.linked_invoice')}</th>
                  <th scope="col" className="px-6 py-3.5 text-end font-semibold">{t('finance.table.amount')}</th>
                  <th scope="col" className="px-6 py-3.5 text-center font-semibold">{t('finance.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayExpenses.map(expense => (
                  <tr 
                    key={expense.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: CATEGORY_COLORS[expense.category] || '#94a3b8' }} 
                        />
                        {t(`finance.categories.${expense.category}`) || expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-white line-clamp-1 max-w-sm">
                        {expense.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {expense.orderId ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium">
                          #{getLinkedOrderNumber(expense.orderId)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-end font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedExpense(expense)}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          title={isRtl ? "عرض التفاصيل" : "View Details"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setExpenseToEdit(expense);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                          title={isRtl ? "تعديل" : "Edit"}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpenseToDelete(expense)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title={isRtl ? "حذف" : "Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isAddModalOpen && (
        <AddExpenseModal
          onClose={() => {
            setIsAddModalOpen(false);
            setExpenseToEdit(null);
          }}
          onSave={handleSaveExpense}
          initialData={expenseToEdit || undefined}
        />
      )}

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
        />
      )}

      {/* Custom Safe Delete Confirmation Modal (Avoids window.confirm) */}
      {expenseToDelete && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !isDeleting && setExpenseToDelete(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isRtl ? 'تأكيد حذف المصروف' : 'Confirm Expense Deletion'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {isRtl 
                ? `هل أنت متأكد من حذف هذا المصروف "${expenseToDelete.description}" بقيمة ${formatCurrency(expenseToDelete.amount)}؟ لا يمكن التراجع عن هذا الإجراء.` 
                : `Are you sure you want to delete "${expenseToDelete.description}" for ${formatCurrency(expenseToDelete.amount)}? This action cannot be undone.`}
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition"
              >
                {isDeleting ? (isRtl ? 'جاري الحذف...' : 'Deleting...') : (isRtl ? 'نعم، حذف' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceScreen;
