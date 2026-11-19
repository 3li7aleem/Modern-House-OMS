import React, { useState, useMemo } from 'react';
import { Quotation, QuotationStatus } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Printer, 
  MessageSquare, 
  ShoppingCart, 
  Edit, 
  Trash2, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileCheck,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  List
} from 'lucide-react';
import { AddEditQuotationModal } from '../components/quotations/AddEditQuotationModal';
import { QuotationDetailsModal } from '../components/quotations/QuotationDetailsModal';
import { PrintQuotationModal } from '../components/quotations/PrintQuotationModal';

export const QuotationsScreen: React.FC = () => {
  const { 
    quotations, 
    addQuotation, 
    updateQuotation, 
    deleteQuotation,
    convertQuotationToOrder 
  } = useAppContext();
  const { language, formatCurrency, formatDate } = useTranslation();
  const isAr = language === 'ar';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'number'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printingQuotation, setPrintingQuotation] = useState<Quotation | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const totalQuotes = quotations.length;
    const pendingQuotes = quotations.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
    const acceptedQuotes = quotations.filter(q => q.status === 'Accepted' || q.status === 'Converted').length;
    const convertedQuotes = quotations.filter(q => q.status === 'Converted').length;
    
    const totalValue = quotations.reduce((acc, q) => acc + (q.total || 0), 0);
    const conversionRate = totalQuotes > 0 ? Math.round((convertedQuotes / totalQuotes) * 100) : 0;

    return {
      totalQuotes,
      pendingQuotes,
      acceptedQuotes,
      convertedQuotes,
      totalValue,
      conversionRate
    };
  }, [quotations]);

  // Filtered & sorted quotations
  const filteredQuotations = useMemo(() => {
    return quotations
      .filter(q => {
        // Status filter
        if (statusFilter !== 'All') {
          if (statusFilter === 'Expired') {
            const isExp = new Date(q.validUntil) < new Date() && q.status !== 'Converted' && q.status !== 'Accepted';
            if (!isExp) return false;
          } else if (q.status !== statusFilter) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchNumber = q.quotationNumber?.toLowerCase().includes(query);
          const matchCustomer = q.customerName?.toLowerCase().includes(query);
          const matchPhone = q.customerPhone?.includes(query);
          const matchItem = q.items?.some(i => i.name?.toLowerCase().includes(query) || i.sku?.toLowerCase().includes(query));
          return matchNumber || matchCustomer || matchPhone || matchItem;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a.date;
        let valB: any = b.date;

        if (sortBy === 'total') {
          valA = a.total;
          valB = b.total;
        } else if (sortBy === 'number') {
          valA = a.quotationNumber;
          valB = b.quotationNumber;
        }

        if (sortOrder === 'desc') {
          return valA < valB ? 1 : -1;
        }
        return valA > valB ? 1 : -1;
      });
  }, [quotations, statusFilter, searchQuery, sortBy, sortOrder]);

  const handleOpenAdd = () => {
    setEditingQuotation(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setIsAddEditOpen(true);
  };

  const handleOpenDetails = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsDetailsOpen(true);
  };

  const handleOpenPrint = (quotation: Quotation) => {
    setPrintingQuotation(quotation);
    setIsPrintOpen(true);
  };

  const handleDuplicate = (quotation: Quotation) => {
    const clone: Quotation = {
      ...quotation,
      id: '',
      quotationNumber: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      status: 'Draft',
      convertedOrderId: undefined
    };
    setEditingQuotation(clone);
    setIsDetailsOpen(false);
    setIsAddEditOpen(true);
  };

  const handleSaveQuotation = async (quotationData: Omit<Quotation, 'id'>) => {
    if (editingQuotation && editingQuotation.id) {
      await updateQuotation(editingQuotation.id, quotationData);
    } else {
      await addQuotation(quotationData);
    }
  };

  const handleSendWhatsApp = (quotation: Quotation) => {
    const phone = (quotation.customerPhone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('973') ? phone : (phone.length === 8 ? `973${phone}` : phone);

    const message = isAr
      ? `السلام عليكم ${quotation.customerName}،\nيسرنا في مودرن هاوس للتجارة تقديم عرض السعر رقم: *${quotation.quotationNumber}*.\n\n` +
        `المبلغ الإجمالي: *${formatCurrency(quotation.total)}* شامل الضريبة.\n` +
        `صلاحية العرض لغاية: ${formatDate(quotation.validUntil)}.\n\n` +
        `نسعد بخدمتكم وتأكيد طلبكم في أي وقت!`
      : `Dear ${quotation.customerName},\nModern House for Trading is pleased to share Quotation *#${quotation.quotationNumber}*.\n\n` +
        `Total Amount: *${formatCurrency(quotation.total)}*.\n` +
        `Valid until: ${formatDate(quotation.validUntil)}.\n\n` +
        `Thank you for choosing us!`;

    const encoded = encodeURIComponent(message);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const exportToCSV = () => {
    const headers = [
      isAr ? 'رقم العرض' : 'Quote #',
      isAr ? 'العميل' : 'Customer',
      isAr ? 'الهاتف' : 'Phone',
      isAr ? 'تاريخ الإصدار' : 'Issue Date',
      isAr ? 'صالح لغاية' : 'Valid Until',
      isAr ? 'عدد الأصناف' : 'Items Count',
      isAr ? 'المجموع قبل الضريبة' : 'Subtotal',
      isAr ? 'الضريبة' : 'VAT',
      isAr ? 'الإجمالي د.ب' : 'Total BHD',
      isAr ? 'الحالة' : 'Status'
    ];

    const rows = filteredQuotations.map(q => [
      q.quotationNumber,
      `"${q.customerName || ''}"`,
      q.customerPhone || '',
      q.date ? q.date.split('T')[0] : '',
      q.validUntil ? q.validUntil.split('T')[0] : '',
      q.items?.length || 0,
      q.subtotal || 0,
      q.vatTotal || 0,
      q.total || 0,
      q.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quotations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
      case 'Sent':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
      case 'Accepted':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200';
      case 'Expired':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
      case 'Converted':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: QuotationStatus) => {
    switch (status) {
      case 'Draft': return isAr ? 'مسودة' : 'Draft';
      case 'Sent': return isAr ? 'تم الإرسال' : 'Sent';
      case 'Accepted': return isAr ? 'مقبول' : 'Accepted';
      case 'Rejected': return isAr ? 'مرفوض' : 'Rejected';
      case 'Expired': return isAr ? 'منتهي الصلاحية' : 'Expired';
      case 'Converted': return isAr ? 'تم التحويل لطلب' : 'Converted';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {isAr ? 'عروض الأسعار' : 'Price Quotations'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {isAr ? 'إدارة وإصدار ومتابعة عروض الأسعار الرسمية وتحويلها إلى فواتير مبيعات' : 'Create, track, and convert formal commercial price offers'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition shadow-lg shadow-primary/25"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? '+ عرض سعر جديد' : '+ New Quotation'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Quotes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'إجمالي العروض' : 'Total Quotes'}</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {stats.totalQuotes}
            </h3>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isAr ? 'كل عروض الأسعار المسجلة' : 'All created proposals'}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Pending / Sent */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'عروض معلقة / مرسلة' : 'Pending / Sent'}</p>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {stats.pendingQuotes}
            </h3>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isAr ? 'بانتظار موافقة العميل' : 'Awaiting client confirmation'}
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Quoted Value */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'إجمالي قيمة العروض' : 'Quoted Value'}</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {formatCurrency(stats.totalValue)}
            </h3>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isAr ? 'شاملة ضريبة القيمة المضافة' : 'Including VAT'}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Conversion to Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'معدل التحويل للطلبات' : 'Order Conversion'}</p>
            <h3 className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">
              {stats.conversionRate}%
            </h3>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isAr ? `${stats.convertedQuotes} عروض تحولت لطلبات` : `${stats.convertedQuotes} converted to orders`}
            </span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Control Bar: Filters, Search & View toggle */}
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث برقم العرض، اسم العميل، الهاتف، أو الصنف...' : 'Search by quote #, client, phone, or item...'}
              className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold px-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>{isAr ? 'الحالة:' : 'Status:'}</span>
          </span>
          {[
            { id: 'All', label: isAr ? 'الكل' : 'All' },
            { id: 'Draft', label: isAr ? 'مسودة' : 'Draft' },
            { id: 'Sent', label: isAr ? 'تم الإرسال' : 'Sent' },
            { id: 'Accepted', label: isAr ? 'مقبول' : 'Accepted' },
            { id: 'Converted', label: isAr ? 'تم التحويل لطلب' : 'Converted' },
            { id: 'Rejected', label: isAr ? 'مرفوض' : 'Rejected' },
            { id: 'Expired', label: isAr ? 'منتهي الصلاحية' : 'Expired' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredQuotations.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-slate-400">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isAr ? 'لا توجد عروض أسعار مسجلة' : 'No price quotations found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {isAr ? 'ابدأ الآن بإنشاء أول عرض سعر تجاري رسمي وقدمه لعملائك لزيادة مبيعاتك.' : 'Get started by creating a new formal quotation for your customers.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? '+ إنشاء عرض سعر جديد' : '+ Create Quotation'}</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5">{isAr ? 'رقم العرض' : 'Quote #'}</th>
                  <th className="p-3.5">{isAr ? 'العميل' : 'Customer'}</th>
                  <th className="p-3.5">{isAr ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                  <th className="p-3.5">{isAr ? 'صالح لغاية' : 'Valid Until'}</th>
                  <th className="p-3.5 text-center">{isAr ? 'الأصناف' : 'Items'}</th>
                  <th className="p-3.5 text-right rtl:text-left">{isAr ? 'الإجمالي (د.ب)' : 'Total (BHD)'}</th>
                  <th className="p-3.5 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3.5 text-center w-36">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredQuotations.map((quotation, index) => {
                  const isExp = new Date(quotation.validUntil) < new Date() && quotation.status !== 'Converted' && quotation.status !== 'Accepted';

                  return (
                    <tr 
                      key={quotation.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition cursor-pointer"
                      onClick={() => handleOpenDetails(quotation)}
                    >
                      <td className="p-3.5 text-center text-slate-400 font-medium">{index + 1}</td>

                      <td className="p-3.5 font-bold font-mono text-primary">
                        {quotation.quotationNumber}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {quotation.customerName}
                        </div>
                        {quotation.customerPhone && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {quotation.customerPhone}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {formatDate(quotation.date)}
                      </td>

                      <td className="p-3.5">
                        <span className={`font-semibold ${isExp ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}`}>
                          {formatDate(quotation.validUntil)}
                        </span>
                        {isExp && (
                          <span className="block text-[10px] text-rose-500 font-bold">
                            {isAr ? 'منتهي' : 'Expired'}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-bold">
                          {quotation.items?.length || 0}
                        </span>
                      </td>

                      <td className="p-3.5 text-right rtl:text-left font-black font-mono text-slate-900 dark:text-white">
                        {formatCurrency(quotation.total)}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(quotation.status)}`}>
                          {getStatusLabel(quotation.status)}
                        </span>
                      </td>

                      <td className="p-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenDetails(quotation)}
                            title={isAr ? 'عرض التفاصيل' : 'View Details'}
                            className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenPrint(quotation)}
                            title={isAr ? 'طباعة العرض' : 'Print Quote'}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleSendWhatsApp(quotation)}
                            title={isAr ? 'إرسال عبر واتساب' : 'Send via WhatsApp'}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {quotation.status !== 'Converted' && (
                            <button
                              onClick={() => {
                                setSelectedQuotation(quotation);
                                setIsDetailsOpen(true);
                              }}
                              title={isAr ? 'تحويل إلى طلب مبيعات' : 'Convert to Order'}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(quotation)}
                            title={isAr ? 'تعديل' : 'Edit'}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuotations.map(quotation => {
            const isExp = new Date(quotation.validUntil) < new Date() && quotation.status !== 'Converted' && quotation.status !== 'Accepted';

            return (
              <div
                key={quotation.id}
                onClick={() => handleOpenDetails(quotation)}
                className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5 hover:border-primary/50 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-sm text-primary">
                      {quotation.quotationNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(quotation.status)}`}>
                      {getStatusLabel(quotation.status)}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                    {quotation.customerName}
                  </h3>
                  {quotation.customerPhone && (
                    <p className="text-xs text-slate-500 font-mono mb-3">
                      {quotation.customerPhone}
                    </p>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isAr ? 'تاريخ الإصدار:' : 'Issued:'}</span>
                      <span>{formatDate(quotation.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isAr ? 'صالح لغاية:' : 'Valid Until:'}</span>
                      <span className={isExp ? 'text-rose-500 font-bold' : ''}>
                        {formatDate(quotation.validUntil)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isAr ? 'عدد الأصناف:' : 'Items:'}</span>
                      <span className="font-bold">{quotation.items?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-baseline mb-4">
                    <span className="text-xs text-slate-400 font-bold">{isAr ? 'المبلغ الإجمالي:' : 'Total Amount:'}</span>
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                      {formatCurrency(quotation.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenDetails(quotation)}
                      className="flex-1 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition text-center"
                    >
                      {isAr ? 'عرض' : 'Details'}
                    </button>
                    <button
                      onClick={() => handleOpenPrint(quotation)}
                      className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSendWhatsApp(quotation)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(quotation)}
                      className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddEditQuotationModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        quotationToEdit={editingQuotation}
        onSave={handleSaveQuotation}
      />

      <QuotationDetailsModal
        isOpen={isDetailsOpen}
        quotation={selectedQuotation}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={q => {
          setIsDetailsOpen(false);
          handleOpenEdit(q);
        }}
        onPrint={q => {
          handleOpenPrint(q);
        }}
        onDuplicate={handleDuplicate}
      />

      {printingQuotation && isPrintOpen && (
        <PrintQuotationModal
          quotation={printingQuotation}
          onClose={() => {
            setIsPrintOpen(false);
            setPrintingQuotation(null);
          }}
        />
      )}

    </div>
  );
};
