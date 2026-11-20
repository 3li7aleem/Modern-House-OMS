import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
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
  Compass,
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
  Check,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

const BAHRAIN_AREAS = [
  { id: 'all', nameAr: 'جميع مناطق البحرين', nameEn: 'All Bahrain Areas', keywords: [] },
  { id: 'capital', nameAr: 'العاصمة (المنامة / السيف / الجفير)', nameEn: 'Capital (Manama/Seef/Juffair)', keywords: ['المنامة', 'السيف', 'الجفير', 'العدلية', 'أم الحصم', 'الزنج', 'manama', 'seef', 'juffair'] },
  { id: 'northern', nameAr: 'الشمالية (سوق واقف / مدينة حمد / البديع)', nameEn: 'Northern (Souq Waqif/Hamad/Budaiya)', keywords: ['سوق واقف', 'مدينة حمد', 'حمد', 'البديع', 'سار', 'الجنبية', 'كرانة', 'باربار', 'souq waqif', 'hamad', 'budaiya', 'saar'] },
  { id: 'southern', nameAr: 'الجنوبية (الرفاع / عوالي / مدينة عيسى)', nameEn: 'Southern (Riffa/Awali/Isa Town)', keywords: ['الرفاع', 'عوالي', 'مدينة عيسى', 'عيسى', 'سند', 'البوكوارة', 'riffa', 'isa town', 'awali', 'sanad'] },
  { id: 'muharraq', nameAr: 'المحرق (البسيتين / قلالي / عراد / الحد)', nameEn: 'Muharraq (Busaiteen/Hidd/Arad)', keywords: ['المحرق', 'البسيتين', 'قلالي', 'عراد', 'الحد', 'أمواج', 'ديار المحرق', 'muharraq', 'busaiteen', 'hidd', 'arad', 'amwaj'] },
  { id: 'sitra', nameAr: 'سترة والمعامير والعكر', nameEn: 'Sitra & Maameer', keywords: ['سترة', 'المعامير', 'العكر', 'النويدرات', 'sitra', 'maameer'] }
];

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
  const { settings } = useSettings();
  const isAr = language === 'ar';

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Out for Delivery' | 'Delivered'>('All');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
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

    // Active Drivers count (assigned to at least one active delivery)
    const activeDriverIds = new Set(
      deliveries
        .filter(d => d.status === 'Out for Delivery' && d.driverId)
        .map(d => d.driverId)
    );

    const completionRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return {
      total,
      pending,
      outForDelivery,
      delivered,
      pendingCodTotal,
      activeDriversCount: activeDriverIds.size,
      completionRate,
    };
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

      // 3. Bahrain Area filter
      if (selectedAreaFilter !== 'all') {
        const area = BAHRAIN_AREAS.find(a => a.id === selectedAreaFilter);
        if (area && area.keywords.length > 0) {
          const addr = (delivery.address || '').toLowerCase();
          const match = area.keywords.some(kw => addr.includes(kw.toLowerCase()));
          if (!match) return false;
        }
      }

      // 4. Date filter
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

      // 5. Search query
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
  }, [deliveries, activeTab, selectedDriverFilter, selectedAreaFilter, dateFilter, searchQuery, orders, customers, drivers]);

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

  // Quick 1-Click Status Update
  const handleQuickStatusChange = async (deliveryId: string, newStatus: Delivery['status']) => {
    await updateDeliveryStatus(deliveryId, newStatus);
  };

  // Batch Status Update
  const handleBatchStatusUpdate = async (newStatus: Delivery['status']) => {
    for (const id of selectedDeliveryIds) {
      await updateDeliveryStatus(id, newStatus);
    }
    setSelectedDeliveryIds([]);
  };

  // Delete delivery handler
  const handleDelete = async (deliveryId: string) => {
    if (currentUser?.role !== 'Admin') {
      alert(isAr ? 'مطلوب موافقة المدير للحذف.' : 'Admin Approval Required to delete.');
      return;
    }
    if (confirm(isAr ? 'هل أنت متأكد من حذف أمر التوصيل هذا؟' : 'Are you sure you want to delete this delivery note?')) {
      await deleteDelivery(deliveryId);
      setSelectedDeliveryIds(prev => prev.filter(id => id !== deliveryId));
    }
  };

  // Get Digital Invoice Link
  const getInvoiceLink = (orderNumber: string) => {
    return `https://modern-house-oms.vercel.app/?invoice=${encodeURIComponent(orderNumber)}`;
  };

  // WhatsApp Customer message (Branded with Digital Invoice & Modern House Store signature)
  const handleSendCustomerMsg = (delivery: Delivery) => {
    const customer = getCustomer(delivery.customerId);
    if (!customer?.phone) {
      alert(isAr ? 'لا يوجد رقم هاتف للعميل' : 'No phone number for customer');
      return;
    }
    const orderNumber = getOrderNumber(delivery.orderId);
    const driver = getDriver(delivery.driverId);
    const invoiceUrl = getInvoiceLink(orderNumber);
    const trackingUrl = `https://modern-house-oms.vercel.app/?track=${encodeURIComponent(orderNumber)}`;

    let msg = '';
    if (delivery.status === 'Delivered') {
      msg = isAr
        ? `مرحباً ${customer.name}،\nيسر إدارة *مودرن هاوس للتجارة* إعلامك بأنه تم تسليم طلبك رقم *${orderNumber}* بنجاح! 📦✨\n\n📄 *رابط الفاتورة المعتمدة:* ${invoiceUrl}\n\nنتمنى لك تجربة متميزة ويسعدنا دائماً خدمتك.\nمودرن هاوس للتجارة — سوق واقف، مملكة البحرين\nهاتف: 35965477 - 77905477`
        : `Hello ${customer.name},\n*Modern House for Trading* informs you that your order *#${orderNumber}* has been delivered successfully! 📦✨\n\n📄 *Verified Digital Invoice:* ${invoiceUrl}\n\nThank you for choosing Modern House!\nSouq Waqif, Bahrain | Tel: 35965477 - 77905477`;
    } else if (delivery.status === 'Out for Delivery') {
      msg = isAr
        ? `مرحباً ${customer.name}،\nطلبك رقم *${orderNumber}* في الطريق إليك الآن مع المندوب (${driver?.name || 'سائق التوصيل'}${driver?.phone ? ` - ${driver.phone}` : ''}). 🚚\nالعنوان: ${delivery.address}\n\n📍 *تتبع مسار الشحنة مباشرة:* ${trackingUrl}\n📄 *رابط الفاتورة المعتمدة:* ${invoiceUrl}\n\nمودرن هاوس للتجارة — هاتف: 35965477 - 77905477`
        : `Hello ${customer.name},\nYour order *#${orderNumber}* is out for delivery with courier (${driver?.name || 'Driver'}${driver?.phone ? ` - ${driver.phone}` : ''}). 🚚\nAddress: ${delivery.address}\n\n📍 *Live Order Tracking:* ${trackingUrl}\n📄 *Digital Invoice:* ${invoiceUrl}\n\nModern House for Trading | Tel: 35965477 - 77905477`;
    } else {
      msg = isAr
        ? `مرحباً ${customer.name}،\nلقد تم تأكيد وتجهيز طلبك رقم *${orderNumber}* للتوصيل إلى: ${delivery.address}.\n\n📍 *تتبع حالة الطلب:* ${trackingUrl}\n📄 *رابط الفاتورة المعتمدة:* ${invoiceUrl}\n\nمودرن هاوس للتجارة — هاتف: 35965477 - 77905477`
        : `Hello ${customer.name},\nYour order *#${orderNumber}* is scheduled for delivery to: ${delivery.address}.\n\n📍 *Order Tracking:* ${trackingUrl}\n📄 *Digital Invoice:* ${invoiceUrl}\n\nModern House for Trading | Tel: 35965477 - 77905477`;
    }

    const phone = customer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // WhatsApp Driver message (includes direct Waze & Google Maps link)
  const handleSendDriverMsg = (delivery: Delivery) => {
    const order = getOrder(delivery.orderId);
    const customer = getCustomer(delivery.customerId);
    const driver = getDriver(delivery.driverId);

    const orderNumber = order?.orderNumber || 'N/A';
    const gmapsLink = `https://maps.google.com/?q=${encodeURIComponent(delivery.address)}`;
    const wazeLink = `https://waze.com/ul?q=${encodeURIComponent(delivery.address)}&navigate=yes`;
    const itemsCount = order?.items.reduce((acc, it) => acc + it.quantity, 0) || 0;
    const totalAmount = order?.total ? formatCurrency(order.total) : '0';
    const isCod = order?.paymentMethod === 'Cash';

    const msg = isAr
      ? `📦 *مهمة توصيل طلب — مودرن هاوس للتجارة*\n` +
        `• رقم الطلب: *${orderNumber}*\n` +
        `• العميل: ${customer?.name || 'Walk-in'}\n` +
        `• هاتف العميل: ${customer?.phone || 'لا يوجد'}\n` +
        `• عنوان التوصيل: ${delivery.address}\n` +
        `• عدد الأصناف: ${itemsCount}\n` +
        `• طريقة الدفع: ${isCod ? '💵 كاش (مطلوب تحصيل المبلغ)' : '💳 مدفوع مسبقاً'}\n` +
        `• المبلغ المطلوب تحصيله: *${totalAmount}*\n\n` +
        `🗺️ *موقع التوصيل على خرائط Google:*\n${gmapsLink}\n` +
        `🧭 *فتح في تطبيق Waze الملاحي:*\n${wazeLink}\n` +
        (delivery.notes ? `\n📝 *ملاحظات خاصة:* ${delivery.notes}` : '')
      : `📦 *Delivery Task — Modern House for Trading*\n` +
        `• Order #: *${orderNumber}*\n` +
        `• Customer: ${customer?.name || 'Walk-in'}\n` +
        `• Phone: ${customer?.phone || 'N/A'}\n` +
        `• Address: ${delivery.address}\n` +
        `• Items Count: ${itemsCount}\n` +
        `• Payment: ${isCod ? '💵 COD (Collect Cash)' : '💳 Paid Online/Card'}\n` +
        `• Amount to Collect: *${totalAmount}*\n\n` +
        `🗺️ *Google Maps:* ${gmapsLink}\n` +
        `🧭 *Waze:* ${wazeLink}\n` +
        (delivery.notes ? `\n📝 *Notes:* ${delivery.notes}` : '');

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

  // Open Waze Navigation
  const handleOpenWaze = (address: string) => {
    window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`, '_blank');
  };

  // Export deliveries to CSV
  const handleExportCSV = () => {
    if (filteredDeliveries.length === 0) {
      alert(isAr ? 'لا توجد بيانات للتصدير' : 'No data to export');
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
    <div className="space-y-6 pb-24">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-700/50">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight text-white">
                {isAr ? 'مركز إدارة التوصيل واللوجستيات' : 'Delivery & Logistics Center'}
              </h2>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {isAr ? 'مودرن هاوس للتجارة' : 'Modern House'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isAr
                ? 'إسناد وتتبع شحنات المعرض، التوجيه الملاحي الفوري (Google Maps & Waze)، ومراسلة العملاء بالواتساب الموثق'
                : 'Dispatch, live GPS navigation (Google Maps & Waze), courier management, and verified WhatsApp notifications'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export Manifest */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs border border-white/10 backdrop-blur-xs"
            title="Export CSV Manifest"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">{isAr ? 'تصدير الكشف' : 'Export'}</span>
          </button>

          {/* Manage Drivers */}
          <button
            onClick={() => setIsDriversModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs border border-white/10 backdrop-blur-xs"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'إدارة المناديب' : 'Couriers'}</span>
            <span className="bg-amber-500 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {drivers.length}
            </span>
          </button>

          {/* Create Delivery Note */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'أمر توصيل جديد' : 'New Delivery'}</span>
          </button>
        </div>
      </div>

      {/* KPI Analytics Cards with Completion Progress */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Total Deliveries */}
          <div className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-text-secondary dark:text-dark-text-secondary block">
                {isAr ? 'إجمالي التوصيلات' : 'Total Deliveries'}
              </span>
              <span className="text-2xl font-black text-text-primary dark:text-dark-text-primary font-mono">
                {metrics.total}
              </span>
            </div>
          </div>

          {/* Pending */}
          <div
            onClick={() => setActiveTab('Pending')}
            className={`p-4 rounded-2xl bg-card dark:bg-dark-card border shadow-xs flex items-center gap-3 cursor-pointer transition-all ${
              activeTab === 'Pending' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border dark:border-dark-border hover:border-amber-400'
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-text-secondary dark:text-dark-text-secondary block">
                {isAr ? 'بانتظار التجهيز' : 'Pending'}
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {metrics.pending}
              </span>
            </div>
          </div>

          {/* Out for Delivery (Live Pulse) */}
          <div
            onClick={() => setActiveTab('Out for Delivery')}
            className={`p-4 rounded-2xl bg-card dark:bg-dark-card border shadow-xs flex items-center gap-3 cursor-pointer transition-all ${
              activeTab === 'Out for Delivery' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-border dark:border-dark-border hover:border-blue-400'
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 relative">
              <Navigation className="w-5 h-5" />
              {metrics.outForDelivery > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <span className="text-[11px] font-semibold text-text-secondary dark:text-dark-text-secondary block flex items-center gap-1">
                <span>{isAr ? 'في الطريق الآن' : 'Out for Delivery'}</span>
                {metrics.outForDelivery > 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {metrics.outForDelivery}
              </span>
            </div>
          </div>

          {/* Delivered */}
          <div
            onClick={() => setActiveTab('Delivered')}
            className={`p-4 rounded-2xl bg-card dark:bg-dark-card border shadow-xs flex items-center gap-3 cursor-pointer transition-all ${
              activeTab === 'Delivered' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-border dark:border-dark-border hover:border-emerald-400'
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-text-secondary dark:text-dark-text-secondary block">
                {isAr ? 'تم التسليم بنجاح' : 'Delivered'}
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {metrics.delivered}
              </span>
            </div>
          </div>

          {/* Pending Cash to Collect (COD) */}
          <div className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-text-secondary dark:text-dark-text-secondary block">
                {isAr ? 'تحصيل كاش (COD)' : 'COD to Collect'}
              </span>
              <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono">
                {formatCurrency(metrics.pendingCodTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="bg-card dark:bg-dark-card p-3 rounded-2xl border border-border dark:border-dark-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-text-primary dark:text-dark-text-primary">
                {isAr ? 'مؤشر إنجاز التوصيل اليومي:' : 'Delivery Progress:'}
              </span>
              <span className="text-text-secondary ms-1">
                {isAr
                  ? `${metrics.delivered} من أصل ${metrics.total} طلب تم تسليمها (${metrics.completionRate}%)`
                  : `${metrics.delivered} of ${metrics.total} delivered (${metrics.completionRate}%)`}
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-md flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border border-border/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(metrics.completionRate, 3)}%` }}
              />
            </div>
            <span className="font-mono font-bold text-xs text-text-primary dark:text-dark-text-primary">
              {metrics.completionRate}%
            </span>
          </div>

          <div className="text-[11px] text-text-secondary flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {isAr
                ? `${metrics.activeDriversCount} مناديب نشطين في الميدان`
                : `${metrics.activeDriversCount} active couriers in field`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Navigation Bar */}
      <div className="bg-card dark:bg-dark-card p-3.5 rounded-3xl shadow-xs border border-border dark:border-dark-border space-y-3.5">
        {/* Status Tabs & View Mode */}
        <div className="flex items-center justify-between border-b border-border/60 dark:border-dark-border/60 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hidescrollbar">
            {(
              [
                { id: 'All', label: isAr ? 'جميع التوصيلات' : 'All Deliveries', count: metrics.total },
                { id: 'Pending', label: isAr ? 'قيد الانتظار' : 'Pending', count: metrics.pending },
                { id: 'Out for Delivery', label: isAr ? 'قيد التوصيل (في الطريق)' : 'Out for Delivery', count: metrics.outForDelivery },
                { id: 'Delivered', label: isAr ? 'تم التسليم' : 'Delivered', count: metrics.delivered },
              ] as const
            ).map(tab => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-md dark:bg-amber-500 dark:text-slate-950'
                      : 'text-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View mode toggle (Table / Cards) */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-dark-card text-primary shadow-xs font-bold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-dark-card text-primary shadow-xs font-bold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bahrain Governorate & Area Quick Filters */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>{isAr ? 'فلترة بحسب المحافظة والمنطقة (مملكة البحرين):' : 'Filter by Bahrain Region:'}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hidescrollbar">
            {BAHRAIN_AREAS.map(area => {
              const isSelected = selectedAreaFilter === area.id;
              return (
                <button
                  key={area.id}
                  onClick={() => setSelectedAreaFilter(area.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {isAr ? area.nameAr : area.nameEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Driver, & Date Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث برقم الطلب، العميل، الهاتف، العنوان، أو السائق...'
                  : 'Search by order #, customer, phone, address, or driver...'
              }
              className="w-full pl-9 pr-8 rtl:pl-8 rtl:pr-9 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Driver */}
            <select
              value={selectedDriverFilter}
              onChange={e => setSelectedDriverFilter(e.target.value)}
              className="py-2 px-3 bg-gray-50 dark:bg-gray-800 border border-border dark:border-dark-border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option value="All">{isAr ? 'جميع السائقين' : 'All Drivers'}</option>
              <option value="unassigned">{isAr ? 'غير مسند لسائق (Unassigned)' : 'Unassigned'}</option>
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
              className="py-2 px-3 bg-gray-50 dark:bg-gray-800 border border-border dark:border-dark-border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option value="all">{isAr ? 'جميع التواريخ' : 'All Dates'}</option>
              <option value="today">{isAr ? 'اليوم فقط' : 'Today only'}</option>
              <option value="week">{isAr ? 'آخر 7 أيام' : 'This week'}</option>
              <option value="month">{isAr ? 'هذا الشهر' : 'This month'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table View */}
      {viewMode === 'table' ? (
        <div className="bg-card dark:bg-dark-card shadow-sm rounded-3xl overflow-hidden border border-border dark:border-dark-border">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right text-text-secondary dark:text-dark-text-secondary">
              <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase tracking-wider text-[11px] text-text-primary dark:text-dark-text-primary border-b border-border dark:border-dark-border font-black">
                <tr>
                  <th scope="col" className="p-3.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                    >
                      {selectedDeliveryIds.length > 0 &&
                      selectedDeliveryIds.length === filteredDeliveries.length ? (
                        <CheckSquare className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3.5">{isAr ? 'رقم الطلب' : 'Order #'}</th>
                  <th scope="col" className="px-4 py-3.5">{isAr ? 'العميل' : 'Customer'}</th>
                  <th scope="col" className="px-4 py-3.5">{isAr ? 'العنوان والملاحة' : 'Address & GPS'}</th>
                  <th scope="col" className="px-4 py-3.5">{isAr ? 'المندوب المسؤول' : 'Assigned Courier'}</th>
                  <th scope="col" className="px-4 py-3.5 text-center">{isAr ? 'الحالة والإجراء السريع' : 'Status & Quick Action'}</th>
                  <th scope="col" className="px-4 py-3.5">{isAr ? 'المبلغ' : 'Amount'}</th>
                  <th scope="col" className="px-4 py-3.5 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
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
                        isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(delivery.id)}
                          className="text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
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
                          {customer?.name || 'عميل نقدي'}
                        </div>
                        {customer?.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary mt-0.5" dir="ltr">
                            <span className="font-mono text-gray-500">{customer.phone}</span>
                            <a
                              href={`tel:${customer.phone}`}
                              className="text-gray-400 hover:text-amber-600 p-0.5"
                              title={isAr ? 'اتصال بالعميل' : 'Call'}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleSendCustomerMsg(delivery)}
                              className="text-emerald-500 hover:text-emerald-600 p-0.5 cursor-pointer"
                              title={isAr ? 'إرسال إشعار واتساب مع الفاتورة الرقمية' : 'WhatsApp'}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Delivery Address & GPS Navigation */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-medium text-text-primary dark:text-dark-text-primary line-clamp-2 leading-tight">
                                {delivery.address || 'مملكة البحرين'}
                              </p>
                              {delivery.notes && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 italic truncate mt-0.5">
                                  {delivery.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Dual Navigation Buttons: Google Maps & Waze */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              onClick={() => handleOpenMaps(delivery.address)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/50 cursor-pointer"
                              title="Google Maps"
                            >
                              <Navigation className="w-2.5 h-2.5" />
                              <span>Google Maps</span>
                            </button>
                            <button
                              onClick={() => handleOpenWaze(delivery.address)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-600 hover:text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-200/50 cursor-pointer"
                              title="Waze"
                            >
                              <Compass className="w-2.5 h-2.5" />
                              <span>Waze</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Driver (Inline Selector) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          <select
                            value={delivery.driverId || ''}
                            onChange={e => updateDelivery(delivery.id, { driverId: e.target.value })}
                            className="text-xs font-semibold py-1 px-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border dark:border-dark-border outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer w-36"
                          >
                            <option value="">{isAr ? '-- بدون سائق --' : '-- Unassigned --'}</option>
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
                                className="text-amber-600 hover:text-amber-700 font-bold cursor-pointer"
                                title="Send Task Details to Driver"
                              >
                                {isAr ? 'إرسال المهمة' : 'Send Task'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status & 1-Click Action Buttons */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1.5">
                          <select
                            value={delivery.status}
                            onChange={e => updateDeliveryStatus(delivery.id, e.target.value as Delivery['status'])}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold outline-none cursor-pointer border-none shadow-2xs ${
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
                                  ? (isAr ? 'تم التسليم' : 'Delivered')
                                  : status === 'Out for Delivery'
                                  ? (isAr ? 'قيد التوصيل' : 'Out for Delivery')
                                  : (isAr ? 'معلق' : 'Pending')}
                              </option>
                            ))}
                          </select>

                          {/* 1-Click Fast Advance Buttons */}
                          {delivery.status === 'Pending' && (
                            <button
                              onClick={() => handleQuickStatusChange(delivery.id, 'Out for Delivery')}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
                              title={isAr ? 'تحويل فوري إلى قيد التوصيل' : 'Mark as Out for Delivery'}
                            >
                              <span>خروج للتوصيل 🚀</span>
                            </button>
                          )}

                          {delivery.status === 'Out for Delivery' && (
                            <button
                              onClick={() => handleQuickStatusChange(delivery.id, 'Delivered')}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
                              title={isAr ? 'تأكيد التسليم للعميل' : 'Mark as Delivered'}
                            >
                              <Check className="w-3 h-3" />
                              <span>تم التسليم</span>
                            </button>
                          )}

                          {delivery.proofImageUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewProofImage(delivery.proofImageUrl!)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:scale-102 transition shadow-2xs cursor-pointer"
                              title={isAr ? 'عرض صورة إثبات التسليم' : 'View Proof Photo'}
                            >
                              <Camera className="w-3 h-3 text-emerald-600" />
                              <span>{isAr ? 'صورة التسليم' : 'Photo'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Amount & Payment Method */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-text-primary dark:text-dark-text-primary font-mono">
                          {order ? formatCurrency(order.total) : '-'}
                        </div>
                        <span className={`text-[10px] font-bold block ${
                          order?.paymentMethod === 'Cash' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'
                        }`}>
                          {order?.paymentMethod === 'Cash' ? (isAr ? '💵 دفع عند الاستلام' : 'Cash on Delivery') : (order?.paymentMethod || 'Online')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Details / Track */}
                          <button
                            onClick={() => setDeliveryToTrack(delivery)}
                            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={isAr ? 'تفاصيل وتتبع الطلب' : 'Details & Tracking'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print Note */}
                          <button
                            onClick={() => setDeliveryToPrint(delivery)}
                            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={isAr ? 'طباعة سند التوصيل الرسمي' : 'Print Delivery Note'}
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Customer */}
                          <button
                            onClick={() => handleSendCustomerMsg(delivery)}
                            className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                            title={isAr ? 'مراسلة العميل (واتساب مع رابط الفاتورة)' : 'WhatsApp Customer'}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(delivery.id)}
                            className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title={isAr ? 'حذف أمر التوصيل' : 'Delete'}
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
                        {isAr ? 'لا توجد طلبات توصيل مطابقة للبحث' : 'No deliveries found'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isAr
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
                className={`bg-card dark:bg-dark-card rounded-3xl p-5 border shadow-sm transition-all flex flex-col justify-between space-y-4 relative ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/20'
                    : 'border-border dark:border-dark-border hover:shadow-md'
                }`}
              >
                {/* Card Top: Order Number & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(delivery.id)}
                      className="text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <span className="font-black text-sm text-text-primary dark:text-dark-text-primary font-mono block">
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
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold outline-none cursor-pointer border-none ${
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
                          ? (isAr ? 'تم التسليم' : 'Delivered')
                          : status === 'Out for Delivery'
                          ? (isAr ? 'قيد التوصيل' : 'Out for Delivery')
                          : (isAr ? 'معلق' : 'Pending')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer & Phone Card */}
                <div className="p-3 rounded-2xl bg-gray-50/90 dark:bg-gray-800/60 border border-border/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary dark:text-dark-text-primary">
                      {customer?.name || 'عميل نقدي'}
                    </span>
                    {order && (
                      <span className="font-black text-amber-600 dark:text-amber-400 font-mono">
                        {formatCurrency(order.total)}
                      </span>
                    )}
                  </div>
                  {customer?.phone && (
                    <div className="flex items-center justify-between text-[11px] text-text-secondary">
                      <span dir="ltr" className="font-mono">{customer.phone}</span>
                      <div className="flex items-center gap-1.5">
                        <a href={`tel:${customer.phone}`} className="text-gray-400 hover:text-amber-500 p-0.5">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleSendCustomerMsg(delivery)}
                          className="text-emerald-500 hover:text-emerald-600 p-0.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Address & Dual Navigation */}
                <div className="text-xs space-y-2">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary dark:text-dark-text-primary font-medium line-clamp-2">
                        {delivery.address || 'مملكة البحرين'}
                      </p>
                      {delivery.notes && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 italic mt-0.5">
                          {delivery.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dual Navigation Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleOpenMaps(delivery.address)}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 py-1.5 rounded-xl border border-blue-200/50 cursor-pointer transition"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Google Maps</span>
                    </button>
                    <button
                      onClick={() => handleOpenWaze(delivery.address)}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 py-1.5 rounded-xl border border-cyan-200/50 cursor-pointer transition"
                    >
                      <Compass className="w-3 h-3" />
                      <span>Waze</span>
                    </button>
                  </div>
                </div>

                {/* Driver Assignment */}
                <div className="text-xs pt-2 border-t border-border/60 flex items-center justify-between">
                  <span className="text-text-secondary text-[11px] font-semibold">
                    {isAr ? 'المندوب:' : 'Courier:'}
                  </span>
                  <select
                    value={delivery.driverId || ''}
                    onChange={e => updateDelivery(delivery.id, { driverId: e.target.value })}
                    className="text-xs font-semibold py-1 px-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-border dark:border-dark-border outline-none cursor-pointer"
                  >
                    <option value="">{isAr ? '-- بدون سائق --' : '-- Unassigned --'}</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 1-Click Status Quick Advance Bar */}
                <div className="flex items-center gap-2">
                  {delivery.status === 'Pending' && (
                    <button
                      onClick={() => handleQuickStatusChange(delivery.id, 'Out for Delivery')}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>خروج للتوصيل 🚀</span>
                    </button>
                  )}
                  {delivery.status === 'Out for Delivery' && (
                    <button
                      onClick={() => handleQuickStatusChange(delivery.id, 'Delivered')}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>تأكيد التسليم بنجاح</span>
                    </button>
                  )}
                  {delivery.status === 'Delivered' && (
                    <div className="w-full py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-center text-xs font-bold flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تم التسليم للعميل' : 'Delivered'}</span>
                    </div>
                  )}
                </div>

                {delivery.proofImageUrl && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPreviewProofImage(delivery.proofImageUrl!)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:scale-102 transition shadow-2xs cursor-pointer"
                    >
                      <Camera className="w-3 h-3 text-emerald-600" />
                      <span>{isAr ? 'معاينة صورة إثبات التسليم' : 'View Proof Photo'}</span>
                    </button>
                  </div>
                )}

                {/* Card Actions Bottom */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setDeliveryToTrack(delivery)}
                    className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-text-primary dark:text-dark-text-primary text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'التفاصيل' : 'Details'}</span>
                  </button>

                  <button
                    onClick={() => setDeliveryToPrint(delivery)}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                    title={isAr ? 'طباعة سند التوصيل' : 'Print Note'}
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleSendDriverMsg(delivery)}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 transition-colors cursor-pointer"
                    title={isAr ? 'إرسال المهمة للمندوب' : 'Send to Driver'}
                  >
                    <Navigation className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(delivery.id)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-500 transition-colors cursor-pointer"
                    title={isAr ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Batch Operations Bar */}
      {selectedDeliveryIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-2xl bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-amber-500/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              {selectedDeliveryIds.length}
            </div>
            <span className="text-xs font-bold">
              {isAr ? `تم تحديد ${selectedDeliveryIds.length} طلبات` : `${selectedDeliveryIds.length} items`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
            >
              {isAr ? 'إسناد سائق دفعة واحدة' : 'Assign Courier'}
            </button>
            <button
              onClick={() => handleBatchStatusUpdate('Out for Delivery')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {isAr ? 'خروج للتوصيل 🚀' : 'Out for Delivery'}
            </button>
            <button
              onClick={() => handleBatchStatusUpdate('Delivered')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {isAr ? 'تم التسليم ✅' : 'Delivered'}
            </button>
            <button
              onClick={() => setSelectedDeliveryIds([])}
              className="p-2 text-slate-400 hover:text-white transition cursor-pointer"
              title={isAr ? 'إلغاء التحديد' : 'Deselect'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
                <span>{isAr ? 'صورة إثبات التسليم للطلب' : 'Proof of Delivery Photo'}</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewProofImage(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
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
