import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { Delivery, Customer, Driver } from '../types';
import DeliveryTrackingModal from '../components/deliveries/DeliveryTrackingModal';
import PrintDeliveryNoteModal from '../components/deliveries/PrintDeliveryModal';
import CreateDeliveryModal from '../components/deliveries/CreateDeliveryModal';
import DriversManagementModal from '../components/deliveries/DriversManagementModal';
import BatchAssignDriverModal from '../components/deliveries/BatchAssignDriverModal';
import {
  Truck,
  Plus,
  Search,
  Phone,
  MessageSquare,
  Navigation,
  Printer,
  Trash2,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Download,
  Filter,
  Eye,
  CheckSquare,
  Square,
  LayoutGrid,
  List,
  ExternalLink,
  Banknote,
  Calendar,
  X,
  ChevronDown,
  Camera,
} from 'lucide-react';

const DeliveriesScreen: React.FC = () => {
  const {
    deliveries,
    orders,
    customers,
    drivers,
    updateDeliveryStatus,
    updateDelivery,
    deleteDelivery,
    currentUser,
  } = useAppContext();

  const { t, formatDate, formatCurrency, language } = useTranslation();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Out for Delivery' | 'Delivered'>('All');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Selected Deliveries for Batch Operations
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);

  // Modals state
  const [deliveryToTrack, setDeliveryToTrack] = useState<Delivery | null>(null);
  const [deliveryToPrint, setDeliveryToPrint] = useState<Delivery | null>(null);
  const [previewProofImage, setPreviewProofImage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDriversModalOpen, setIsDriversModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Helper getters
  const getOrder = (orderId: string) => orders.find(s => s.id === orderId);
  const getOrderNumber = (orderId: string) => getOrder(orderId)?.orderNumber || 'N/A';
  const getCustomer = (customerId: string) => customers.find(c => c.id === customerId);
  const getDriver = (driverId?: string) => drivers.find(d => d.id === driverId);

  const deliveryStatuses: Delivery['status'][] = ['Pending', 'Out for Delivery', 'Delivered'];

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = deliveries.length;
    const pending = deliveries.filter(d => d.status === 'Pending').length;
    const outForDelivery = deliveries.filter(d => d.status === 'Out for Delivery').length;
    const delivered = deliveries.filter(d => d.status === 'Delivered').length;

    // Calculate pending Cash on Delivery (COD) amounts to collect
    const pendingCodTotal = deliveries.reduce((acc, d) => {
      if (d.status === 'Delivered') return acc;
      const order = orders.find(o => o.id === d.orderId);
      if (order && order.paymentMethod === 'Cash') {
        return acc + order.total;
      }
      return acc;
    }, 0);

    return { total, pending, outForDelivery, delivered, pendingCodTotal };
  }, [deliveries, orders]);

  // Filtered deliveries list
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(delivery => {
      // 1. Tab filter
      if (activeTab !== 'All' && delivery.status !== activeTab) {
        return false;
      }

      // 2. Driver filter
      if (selectedDriverFilter === 'unassigned') {
        if (delivery.driverId) return false;
      } else if (selectedDriverFilter !== 'All' && delivery.driverId !== selectedDriverFilter) {
        return false;
      }

      // 3. Date filter
      if (dateFilter !== 'all') {
        const order = orders.find(o => o.id === delivery.orderId);
        const targetDateStr = delivery.deliveryDate || order?.date || '';
        if (targetDateStr) {
          const itemDate = new Date(targetDateStr);
          const now = new Date();
          if (dateFilter === 'today') {
            const isToday =
              itemDate.getDate() === now.getDate() &&
              itemDate.getMonth() === now.getMonth() &&
              itemDate.getFullYear() === now.getFullYear();
            if (!isToday) return false;
          } else if (dateFilter === 'week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            if (itemDate < oneWeekAgo) return false;
          } else if (dateFilter === 'month') {
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(now.getDate() - 30);
            if (itemDate < oneMonthAgo) return false;
          }
        }
      }

      // 4. Search query
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      const order = orders.find(o => o.id === delivery.orderId);
      const customer = customers.find(c => c.id === delivery.customerId);
      const driver = drivers.find(d => d.id === delivery.driverId);

      const matchOrder = order?.orderNumber.toLowerCase().includes(q) || false;
      const matchCustomer =
        (customer?.name && customer.name.toLowerCase().includes(q)) ||
        (customer?.phone && customer.phone.includes(q)) ||
        false;
      const matchDriver = driver?.name && driver.name.toLowerCase().includes(q);
      const matchAddress = delivery.address && delivery.address.toLowerCase().includes(q);
      const matchNotes = delivery.notes && delivery.notes.toLowerCase().includes(q);

      return matchOrder || matchCustomer || matchDriver || matchAddress || matchNotes;
    });
  }, [deliveries, activeTab, selectedDriverFilter, dateFilter, searchQuery, orders, customers, drivers]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedDeliveryIds.length === filteredDeliveries.length) {
      setSelectedDeliveryIds([]);
    } else {
      setSelectedDeliveryIds(filteredDeliveries.map(d => d.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedDeliveryIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Delete delivery handler
  const handleDelete = async (deliveryId: string) => {
    if (currentUser?.role !== 'Admin') {
      alert(language === 'ar' ? 'مطلوب موافقة المدير للحذف.' : 'Admin Approval Required to delete.');
      return;
    }
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف أمر التوصيل هذا؟' : 'Are you sure you want to delete this delivery note?')) {
      await deleteDelivery(deliveryId);
      setSelectedDeliveryIds(prev => prev.filter(id => id !== deliveryId));
    }
  };

  // WhatsApp Customer message
  const handleSendCustomerMsg = (delivery: Delivery) => {
    const customer = getCustomer(delivery.customerId);
    if (!customer?.phone) {
      alert(language === 'ar' ? 'لا يوجد رقم هاتف للعميل' : 'No phone number for customer');
      return;
    }
    const orderNumber = getOrderNumber(delivery.orderId);
    const driver = getDriver(delivery.driverId);

    let msg = '';
    if (delivery.status === 'Delivered') {
      msg = language === 'ar'
        ? `مرحباً ${customer.name}، نود إبلاغك بأنه تم تسليم طلبك رقم ${orderNumber} بنجاح. شكراً لتسوقكم من متجر البيت الحديث للتجارة!`
        : `Hello ${customer.name}, your order #${orderNumber} has been delivered successfully. Thank you for choosing Modern House for Trading!`;
    } else if (delivery.status === 'Out for Delivery') {
      msg = language === 'ar'
        ? `مرحباً ${customer.name}، طلبك رقم ${orderNumber} في الطريق إليك مع المندوب (${driver?.name || 'سائق التوصيل'}${driver?.phone ? ` - ${driver.phone}` : ''}). العنوان: ${delivery.address}.`
        : `Hello ${customer.name}, your order #${orderNumber} is out for delivery with ${driver?.name || 'our courier'}. Address: ${delivery.address}.`;
    } else {
      msg = language === 'ar'
        ? `مرحباً ${customer.name}، لقد تم تجهيز طلبك رقم ${orderNumber} للتوصيل إلى: ${delivery.address}.`
        : `Hello ${customer.name}, your order #${orderNumber} is prepared for delivery to: ${delivery.address}.`;
    }

    const phone = customer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // WhatsApp Driver message
  const handleSendDriverMsg = (delivery: Delivery) => {
    const order = getOrder(delivery.orderId);
    const customer = getCustomer(delivery.customerId);
    const driver = getDriver(delivery.driverId);

    const orderNumber = order?.orderNumber || 'N/A';
    const locationLink = `https://maps.google.com/?q=${encodeURIComponent(delivery.address)}`;
    const itemsCount = order?.items.reduce((acc, it) => acc + it.quantity, 0) || 0;
    const totalAmount = order?.total ? formatCurrency(order.total) : '0';

    const msg = language === 'ar'
      ? `📦 *مهمة توصيل طلب*\n` +
        `• رقم الطلب: ${orderNumber}\n` +
        `• العميل: ${customer?.name || 'Walk-in'}\n` +
        `• الهاتف: ${customer?.phone || 'لا يوجد'}\n` +
        `• العنوان: ${delivery.address}\n` +
        `• عدد الأصناف: ${itemsCount}\n` +
        `• المبلغ المطلوب تحصيله: ${totalAmount}\n` +
        `• خريطة الموقع: ${locationLink}\n` +
        (delivery.notes ? `• ملاحظات: ${delivery.notes}\n` : '')
      : `📦 *Delivery Task*\n` +
        `• Order: #${orderNumber}\n` +
        `• Customer: ${customer?.name || 'Walk-in'}\n` +
        `• Phone: ${customer?.phone || 'N/A'}\n` +
        `• Address: ${delivery.address}\n` +
        `• Map: ${locationLink}\n` +
        (delivery.notes ? `• Notes: ${delivery.notes}\n` : '');

    const driverPhone = driver?.phone ? driver.phone.replace(/\D/g, '') : '';
    const url = driverPhone
      ? `https://wa.me/${driverPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Open Google Maps
  const handleOpenMaps = (address: string) => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  // Export deliveries to CSV
  const handleExportCSV = () => {
    if (filteredDeliveries.length === 0) {
      alert(language === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export');
      return;
    }

    const headers = [
      'Order Number',
      'Customer',
      'Phone',
      'Driver',
      'Address',
      'Status',
      'Delivery Date',
      'Notes',
    ];

    const rows = filteredDeliveries.map(d => {
      const order = getOrder(d.orderId);
      const customer = getCustomer(d.customerId);
      const driver = getDriver(d.driverId);
      return [
        order?.orderNumber || 'N/A',
        customer?.name || 'Walk-in',
        customer?.phone || '',
        driver?.name || 'Unassigned',
        `"${(d.address || '').replace(/"/g, '""')}"`,
        d.status,
        d.deliveryDate ? formatDate(d.deliveryDate) : '',
        `"${(d.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `deliveries_manifest_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary tracking-tight">
                {language === 'ar' ? 'إدارة التوصيل والشحنات' : 'Delivery & Logistics'}
              </h2>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {language === 'ar'
                  ? 'متابعة وإسناد طلبات التوصيل للعملاء والسائقين في مملكة البحرين'
                  : 'Track, dispatch, and manage orders for couriers across Bahrain'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Manifest */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-card dark:bg-dark-card border border-border dark:border-dark-border hover:bg-gray-100 dark:hover:bg-gray-800 text-text-primary dark:text-dark-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Export CSV Manifest"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">{language === 'ar' ? 'تصدير الكشف' : 'Export'}</span>
          </button>

          {/* Manage Drivers */}
          <button
            onClick={() => setIsDriversModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-card dark:bg-dark-card border border-border dark:border-dark-border hover:bg-gray-100 dark:hover:bg-gray-800 text-text-primary dark:text-dark-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>{language === 'ar' ? 'إدارة السائقين' : 'Drivers'}</span>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {drivers.length}
            </span>
          </button>

          {/* Create Delivery Note */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'أمر توصيل جديد' : 'New Delivery'}</span>
          </button>
        </div>
      </div>

      {/* KPI Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Deliveries */}
        <div className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-text-secondary dark:text-dark-text-secondary block">
              {language === 'ar' ? 'إجمالي التوصيلات' : 'Total Deliveries'}
            </span>
            <span className="text-xl font-extrabold text-text-primary dark:text-dark-text-primary">
              {metrics.total}
            </span>
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setActiveTab('Pending')}
          className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-text-secondary dark:text-dark-text-secondary block">
              {language === 'ar' ? 'بانتظار الإسناد والتجهيز' : 'Pending'}
            </span>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {metrics.pending}
            </span>
          </div>
        </div>

        {/* Out for Delivery */}
        <div
          onClick={() => setActiveTab('Out for Delivery')}
          className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs flex items-center gap-3 cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-text-secondary dark:text-dark-text-secondary block">
              {language === 'ar' ? 'قيد التوصيل في الطريق' : 'Out for Delivery'}
            </span>
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {metrics.outForDelivery}
            </span>
          </div>
        </div>

        {/* Delivered */}
        <div
          onClick={() => setActiveTab('Delivered')}
          className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs flex items-center gap-3 cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-text-secondary dark:text-dark-text-secondary block">
              {language === 'ar' ? 'تم التسليم بنجاح' : 'Delivered'}
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {metrics.delivered}
            </span>
          </div>
        </div>

        {/* Pending Cash to Collect (COD) */}
        <div className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-text-secondary dark:text-dark-text-secondary block">
              {language === 'ar' ? 'مبالغ قيد التحصيل (كاش)' : 'COD to Collect'}
            </span>
            <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400">
              {formatCurrency(metrics.pendingCodTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Navigation Bar */}
      <div className="bg-card dark:bg-dark-card p-3 rounded-2xl shadow-xs border border-border dark:border-dark-border space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center justify-between border-b border-border/60 dark:border-dark-border/60 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hidescrollbar">
            {(
              [
                { id: 'All', label: language === 'ar' ? 'جميع التوصيلات' : 'All Deliveries', count: metrics.total },
                { id: 'Pending', label: language === 'ar' ? 'قيد الانتظار' : 'Pending', count: metrics.pending },
                { id: 'Out for Delivery', label: language === 'ar' ? 'قيد التوصيل' : 'Out for Delivery', count: metrics.outForDelivery },
                { id: 'Delivered', label: language === 'ar' ? 'تم التسليم' : 'Delivered', count: metrics.delivered },
              ] as const
            ).map(tab => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View mode toggle (Table / Cards) */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-dark-card text-primary shadow-xs'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-dark-card text-primary shadow-xs'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search, Driver, & Date Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'بحث برقم الطلب، العميل، الهاتف، العنوان، أو السائق...'
                  : 'Search by order #, customer, phone, address, or driver...'
              }
              className="w-full pl-8 pr-7 rtl:pl-7 rtl:pr-8 py-2 bg-gray-50 dark:bg-gray-800/80 border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Driver */}
            <select
              value={selectedDriverFilter}
              onChange={e => setSelectedDriverFilter(e.target.value)}
              className="py-1.5 px-3 bg-gray-50 dark:bg-gray-800 border border-border dark:border-dark-border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="All">{language === 'ar' ? 'جميع السائقين' : 'All Drivers'}</option>
              <option value="unassigned">{language === 'ar' ? 'غير مسند لسائق (Unassigned)' : 'Unassigned'}</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Filter by Date */}
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="py-1.5 px-3 bg-gray-50 dark:bg-gray-800 border border-border dark:border-dark-border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">{language === 'ar' ? 'جميع التواريخ' : 'All Dates'}</option>
              <option value="today">{language === 'ar' ? 'اليوم فقط' : 'Today only'}</option>
              <option value="week">{language === 'ar' ? 'آخر 7 أيام' : 'This week'}</option>
              <option value="month">{language === 'ar' ? 'هذا الشهر' : 'This month'}</option>
            </select>
          </div>
        </div>

        {/* Batch Operations Banner (shown when rows are selected) */}
        {selectedDeliveryIds.length > 0 && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-3 flex-wrap animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <CheckSquare className="w-4 h-4" />
              <span>
                {language === 'ar'
                  ? `تم تحديد ${selectedDeliveryIds.length} طلب توصيل`
                  : `${selectedDeliveryIds.length} deliveries selected`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-3 py-1.5 bg-primary text-white hover:bg-primary-hover rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إسناد سائق أو تحديث الحالة' : 'Assign Driver / Status'}</span>
              </button>

              <button
                onClick={() => setSelectedDeliveryIds([])}
                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded-lg transition-colors"
              >
                {language === 'ar' ? 'إلغاء التحديد' : 'Deselect All'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Table or Cards View */}
      {viewMode === 'table' ? (
        <div className="bg-card dark:bg-dark-card shadow-xs rounded-2xl overflow-hidden border border-border dark:border-dark-border">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right text-text-secondary dark:text-dark-text-secondary">
              <thead className="bg-gray-50/80 dark:bg-gray-800/60 uppercase tracking-wider text-[11px] text-text-primary dark:text-dark-text-primary border-b border-border dark:border-dark-border font-bold">
                <tr>
                  <th scope="col" className="p-3.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-gray-400 hover:text-primary transition-colors"
                    >
                      {selectedDeliveryIds.length > 0 &&
                      selectedDeliveryIds.length === filteredDeliveries.length ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3.5">{language === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
                  <th scope="col" className="px-4 py-3.5">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                  <th scope="col" className="px-4 py-3.5">{language === 'ar' ? 'العنوان' : 'Delivery Address'}</th>
                  <th scope="col" className="px-4 py-3.5">{language === 'ar' ? 'السائق المسؤول' : 'Assigned Courier'}</th>
                  <th scope="col" className="px-4 py-3.5 text-center">{language === 'ar' ? 'حالة التوصيل' : 'Status'}</th>
                  <th scope="col" className="px-4 py-3.5">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                  <th scope="col" className="px-4 py-3.5 text-center">{language === 'ar' ? 'الإجراءات السريعة' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                {filteredDeliveries.map(delivery => {
                  const order = getOrder(delivery.orderId);
                  const customer = getCustomer(delivery.customerId);
                  const driver = getDriver(delivery.driverId);
                  const isSelected = selectedDeliveryIds.includes(delivery.id);

                  return (
                    <tr
                      key={delivery.id}
                      className={`hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors ${
                        isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(delivery.id)}
                          className="text-gray-400 hover:text-primary transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Order Number & Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-text-primary dark:text-dark-text-primary block font-mono text-xs">
                          {order?.orderNumber || 'N/A'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {delivery.deliveryDate ? formatDate(delivery.deliveryDate) : formatDate(order?.date || new Date().toISOString())}
                        </span>
                      </td>

                      {/* Customer info */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-text-primary dark:text-dark-text-primary">
                          {customer?.name || 'Walk-in'}
                        </div>
                        {customer?.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary mt-0.5" dir="ltr">
                            <span className="font-mono text-gray-500">{customer.phone}</span>
                            <a
                              href={`tel:${customer.phone}`}
                              className="text-gray-400 hover:text-primary"
                              title="Call"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => handleSendCustomerMsg(delivery)}
                              className="text-emerald-500 hover:text-emerald-600"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Delivery Address */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-medium text-text-primary dark:text-dark-text-primary line-clamp-2 leading-tight">
                              {delivery.address || 'Bahrain'}
                            </p>
                            {delivery.notes && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 italic truncate mt-0.5">
                                {delivery.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Assigned Driver (Inline Selector) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          <select
                            value={delivery.driverId || ''}
                            onChange={e => updateDelivery(delivery.id, { driverId: e.target.value })}
                            className="text-xs font-semibold py-1 px-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border dark:border-dark-border outline-none focus:ring-1 focus:ring-primary cursor-pointer w-36"
                          >
                            <option value="">{language === 'ar' ? '-- بدون سائق --' : '-- Unassigned --'}</option>
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>

                          {driver?.phone && (
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                              <span dir="ltr" className="font-mono">{driver.phone}</span>
                              <button
                                onClick={() => handleSendDriverMsg(delivery)}
                                className="text-blue-500 hover:text-blue-600 font-bold"
                                title="Send GPS & Task to Driver"
                              >
                                {language === 'ar' ? 'إرسال للمندوب' : 'Send Task'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Selector */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <select
                          value={delivery.status}
                          onChange={e => updateDeliveryStatus(delivery.id, e.target.value as Delivery['status'])}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold outline-none cursor-pointer border-none shadow-2xs ${
                            delivery.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : delivery.status === 'Out for Delivery'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {deliveryStatuses.map(status => (
                            <option key={status} value={status} className="bg-white dark:bg-gray-900 text-text-primary">
                              {status === 'Delivered'
                                ? (language === 'ar' ? 'تم التسليم' : 'Delivered')
                                : status === 'Out for Delivery'
                                ? (language === 'ar' ? 'قيد التوصيل' : 'Out for Delivery')
                                : (language === 'ar' ? 'معلق' : 'Pending')}
                            </option>
                          ))}
                        </select>

                        {delivery.proofImageUrl && (
                          <div>
                            <button
                              type="button"
                              onClick={() => setPreviewProofImage(delivery.proofImageUrl!)}
                              className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:scale-102 transition shadow-2xs"
                              title={language === 'ar' ? 'عرض صورة إثبات التسليم' : 'View Proof Photo'}
                            >
                              <Camera className="w-3 h-3 text-emerald-600" />
                              <span>{language === 'ar' ? 'صورة التسليم' : 'Photo'}</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Amount & Payment Method */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-text-primary dark:text-dark-text-primary">
                          {order ? formatCurrency(order.total) : '-'}
                        </div>
                        <span className="text-[10px] text-gray-400 block">
                          {order?.paymentMethod || 'Cash'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Details / Track */}
                          <button
                            onClick={() => setDeliveryToTrack(delivery)}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title={language === 'ar' ? 'تفاصيل وتتبع الطلب' : 'Details & Tracking'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print Note */}
                          <button
                            onClick={() => setDeliveryToPrint(delivery)}
                            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title={language === 'ar' ? 'طباعة مذكرة التوصيل' : 'Print Delivery Note'}
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Customer */}
                          <button
                            onClick={() => handleSendCustomerMsg(delivery)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                            title={language === 'ar' ? 'مراسلة العميل (واتساب)' : 'WhatsApp Customer'}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Google Maps Link */}
                          <button
                            onClick={() => handleOpenMaps(delivery.address)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                            title={language === 'ar' ? 'فتح في خرائط جوجل' : 'Open in Google Maps'}
                          >
                            <Navigation className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(delivery.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title={language === 'ar' ? 'حذف أمر التوصيل' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredDeliveries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-text-secondary dark:text-dark-text-secondary">
                      <Truck className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                      <p className="font-bold text-sm">
                        {language === 'ar' ? 'لا توجد طلبات توصيل مطابقة للبحث' : 'No deliveries found'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {language === 'ar'
                          ? 'قم بإنشاء أمر توصيل جديد أو إزالة فلاتر البحث الحالية'
                          : 'Create a new delivery note or adjust your search filters'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeliveries.map(delivery => {
            const order = getOrder(delivery.orderId);
            const customer = getCustomer(delivery.customerId);
            const driver = getDriver(delivery.driverId);
            const isSelected = selectedDeliveryIds.includes(delivery.id);

            return (
              <div
                key={delivery.id}
                className={`bg-card dark:bg-dark-card rounded-2xl p-4 border shadow-xs transition-all flex flex-col justify-between space-y-3.5 relative ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border dark:border-dark-border hover:shadow-md'
                }`}
              >
                {/* Card Top: Order Number & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(delivery.id)}
                      className="text-gray-400 hover:text-primary transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <span className="font-bold text-sm text-text-primary dark:text-dark-text-primary font-mono block">
                        #{order?.orderNumber || 'N/A'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {delivery.deliveryDate ? formatDate(delivery.deliveryDate) : formatDate(order?.date || new Date().toISOString())}
                      </span>
                    </div>
                  </div>

                  <select
                    value={delivery.status}
                    onChange={e => updateDeliveryStatus(delivery.id, e.target.value as Delivery['status'])}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold outline-none cursor-pointer border-none ${
                      delivery.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : delivery.status === 'Out for Delivery'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {deliveryStatuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'Delivered'
                          ? (language === 'ar' ? 'تم التسليم' : 'Delivered')
                          : status === 'Out for Delivery'
                          ? (language === 'ar' ? 'قيد التوصيل' : 'Out for Delivery')
                          : (language === 'ar' ? 'معلق' : 'Pending')}
                      </option>
                    ))}
                  </select>
                </div>

                {delivery.proofImageUrl && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPreviewProofImage(delivery.proofImageUrl!)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:scale-102 transition shadow-2xs"
                      title={language === 'ar' ? 'عرض صورة إثبات التسليم' : 'View Proof Photo'}
                    >
                      <Camera className="w-3 h-3 text-emerald-600" />
                      <span>{language === 'ar' ? 'معاينة صورة إثبات التسليم' : 'View Proof Photo'}</span>
                    </button>
                  </div>
                )}

                {/* Customer & Phone */}
                <div className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-border/50 dark:border-dark-border/50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary dark:text-dark-text-primary">
                      {customer?.name || 'Walk-in Customer'}
                    </span>
                    {order && (
                      <span className="font-extrabold text-primary font-mono">
                        {formatCurrency(order.total)}
                      </span>
                    )}
                  </div>
                  {customer?.phone && (
                    <div className="flex items-center justify-between text-[11px] text-text-secondary">
                      <span dir="ltr" className="font-mono">{customer.phone}</span>
                      <div className="flex items-center gap-1">
                        <a href={`tel:${customer.phone}`} className="text-gray-400 hover:text-primary">
                          <Phone className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => handleSendCustomerMsg(delivery)}
                          className="text-emerald-500 hover:text-emerald-600"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-text-secondary">
                    <span className="flex items-center gap-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      {language === 'ar' ? 'عنوان التوصيل:' : 'Address:'}
                    </span>
                    <button
                      onClick={() => handleOpenMaps(delivery.address)}
                      className="text-blue-500 hover:underline flex items-center gap-0.5 text-[10px] font-bold"
                    >
                      <span>{language === 'ar' ? 'خرائط جوجل' : 'Google Maps'}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <p className="text-text-primary dark:text-dark-text-primary font-medium line-clamp-2">
                    {delivery.address || 'Bahrain'}
                  </p>
                  {delivery.notes && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                      {delivery.notes}
                    </p>
                  )}
                </div>

                {/* Driver */}
                <div className="text-xs pt-1 border-t border-border/50 dark:border-dark-border/50 flex items-center justify-between">
                  <span className="text-text-secondary text-[11px]">
                    {language === 'ar' ? 'السائق:' : 'Courier:'}
                  </span>
                  <select
                    value={delivery.driverId || ''}
                    onChange={e => updateDelivery(delivery.id, { driverId: e.target.value })}
                    className="text-xs font-semibold py-1 px-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border dark:border-dark-border outline-none"
                  >
                    <option value="">{language === 'ar' ? '-- بدون سائق --' : '-- Unassigned --'}</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {delivery.proofImageUrl && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPreviewProofImage(delivery.proofImageUrl!)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:scale-102 transition shadow-2xs"
                      title={language === 'ar' ? 'عرض صورة إثبات التسليم' : 'View Proof Photo'}
                    >
                      <Camera className="w-3 h-3 text-emerald-600" />
                      <span>{language === 'ar' ? 'معاينة صورة إثبات التسليم' : 'View Proof Photo'}</span>
                    </button>
                  </div>
                )}

                {/* Card Actions Bottom */}
                <div className="pt-2 border-t border-border/60 dark:border-dark-border/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setDeliveryToTrack(delivery)}
                    className="flex-1 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-text-primary dark:text-dark-text-primary text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    <span>{language === 'ar' ? 'التفاصيل' : 'Details'}</span>
                  </button>

                  <button
                    onClick={() => setDeliveryToPrint(delivery)}
                    className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                    title={language === 'ar' ? 'طباعة مذكرة التوصيل' : 'Print Note'}
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleSendDriverMsg(delivery)}
                    className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 transition-colors"
                    title={language === 'ar' ? 'إرسال المهمة للسائق' : 'Send to Driver'}
                  >
                    <Navigation className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(delivery.id)}
                    className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-500 transition-colors"
                    title={language === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}

      {/* 1. Tracking & Order Details Modal */}
      {deliveryToTrack && (
        <DeliveryTrackingModal
          delivery={deliveryToTrack}
          onClose={() => setDeliveryToTrack(null)}
          onPrintNote={d => {
            setDeliveryToTrack(null);
            setDeliveryToPrint(d);
          }}
        />
      )}

      {/* 2. Print Delivery Note Modal */}
      {deliveryToPrint && (
        <PrintDeliveryNoteModal
          delivery={deliveryToPrint}
          onClose={() => setDeliveryToPrint(null)}
        />
      )}

      {/* 3. Create Delivery Modal */}
      {isCreateModalOpen && (
        <CreateDeliveryModal onClose={() => setIsCreateModalOpen(false)} />
      )}

      {/* 4. Drivers Management Modal */}
      {isDriversModalOpen && (
        <DriversManagementModal onClose={() => setIsDriversModalOpen(false)} />
      )}

      {/* 5. Batch Operations Modal */}
      {isBatchModalOpen && (
        <BatchAssignDriverModal
          selectedDeliveryIds={selectedDeliveryIds}
          onClose={() => setIsBatchModalOpen(false)}
          onSuccess={() => setSelectedDeliveryIds([])}
        />
      )}

      {/* 6. Proof of Delivery Full Photo Preview Lightbox */}
      {previewProofImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewProofImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full text-white px-2">
              <span className="font-bold text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ar' ? 'صورة إثبات التسليم للطلب' : 'Proof of Delivery Photo'}</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewProofImage(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewProofImage}
              alt="Proof of Delivery Full"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl border border-white/10 object-contain"
            />
          </div>
        </div>
      )}

      <style>{`
        .hidescrollbar::-webkit-scrollbar {
          display: none;
        }
        .hidescrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default DeliveriesScreen;
