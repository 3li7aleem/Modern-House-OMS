import React, { useState, useMemo } from 'react';
import { Customer, Order } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import PrintOrderModal from '../sales/PrintInvoiceModal';
import { 
  User, Phone, Mail, MapPin, Building, Calendar, ShoppingBag, 
  FileText, Wrench, ExternalLink, Printer, Edit, MessageSquare, 
  DollarSign, CheckCircle2, AlertCircle, X, ShieldAlert, ShieldCheck, Star
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
  onEditCustomer?: (customer: Customer) => void;
}

const WarrantyBadge: React.FC<{ orderDate: string; warrantyMonths?: number }> = ({ orderDate, warrantyMonths }) => {
  const { language, formatDate } = useTranslation();
  if (!warrantyMonths) return <span className="text-gray-400 text-xs">-</span>;
  
  const purchaseDate = new Date(orderDate);
  const expiryDate = new Date(purchaseDate);
  expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);

  const today = new Date();
  const remainingDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (remainingDays < 0) {
    return (
      <span className="px-2 py-0.5 inline-flex items-center gap-1 text-[11px] font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
        <ShieldAlert className="w-3 h-3" />
        {language === 'ar' ? 'منتهي الضمان' : 'Warranty Expired'}
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 inline-flex items-center gap-1 text-[11px] font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
      <ShieldCheck className="w-3 h-3" />
      <span>{language === 'ar' ? `ساري (${remainingDays} يوم)` : `Active (${remainingDays}d)`}</span>
    </span>
  );
};

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ 
  customer, 
  onClose,
  onEditCustomer
}) => {
  const { t, formatDate, formatCurrency, language } = useTranslation();
  const { orders, products, quotations, repairs, updateCustomerLoyalty } = useAppContext();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'quotations' | 'repairs'>('overview');
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  const handleAddBonusPoints = async () => {
    const input = window.prompt(
      language === 'ar'
        ? 'أدخل عدد نقاط المكافأة لإضافتها للعميل (مثال: 50):'
        : 'Enter bonus loyalty points to add:'
    );
    if (!input) return;
    const points = parseInt(input);
    if (isNaN(points) || points <= 0) {
      alert(language === 'ar' ? 'يرجى إدخال رقم نقاط صحيح.' : 'Invalid points number.');
      return;
    }
    await updateCustomerLoyalty(customer.id, points);
    customer.loyaltyPoints = (customer.loyaltyPoints || 0) + points;
  };

  // Filter linked data for this customer
  const customerOrders = useMemo(() => {
    return orders
      .filter(o => o.customerId === customer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, customer.id]);

  const customerQuotations = useMemo(() => {
    return quotations
      .filter(q => q.customerId === customer.id || (q.customerPhone && q.customerPhone === customer.phone))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [quotations, customer.id, customer.phone]);

  const customerRepairs = useMemo(() => {
    return repairs
      .filter(r => r.customerId === customer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [repairs, customer.id]);

  // Financial aggregates
  const totalSpent = useMemo(() => {
    return customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [customerOrders]);

  const avgOrderValue = customerOrders.length > 0 ? totalSpent / customerOrders.length : 0;

  // Clean phone number for WhatsApp
  const cleanPhoneForWhatsApp = (rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('973')) return digits;
    if (digits.length === 8) return `973${digits}`;
    return digits;
  };

  const whatsAppUrl = `https://wa.me/${cleanPhoneForWhatsApp(customer.phone)}?text=${encodeURIComponent(
    language === 'ar' 
      ? `مرحباً ${customer.name}، معك مودرن هاوس للتجارة (سوق واقف). نسعد بالتواصل معك!` 
      : `Hello ${customer.name}, Modern House for Trading. How can we help you today?`
  )}`;

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'Commercial':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{language === 'ar' ? 'تجاري / مؤسسة' : 'Commercial'}</span>;
      case 'VIP':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">★ {language === 'ar' ? 'عميل مميز (VIP)' : 'VIP Client'}</span>;
      case 'Wholesale':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">{language === 'ar' ? 'مبيعات جملة' : 'Wholesale'}</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{language === 'ar' ? 'عميل أفراد' : 'Individual'}</span>;
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-3 sm:p-4 overflow-y-auto"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
      >
        <div 
          className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-4xl my-auto overflow-hidden transform transition-all animate-fade-in-scale max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex justify-between items-start p-5 sm:p-6 border-b border-border dark:border-dark-border bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/60 dark:to-gray-800/20">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                {customer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">
                    {customer.name}
                  </h3>
                  {getCategoryBadge(customer.category)}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-text-secondary dark:text-dark-text-secondary">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span dir="ltr">{customer.phone}</span>
                  </span>
                  {customer.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span>{customer.email}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{language === 'ar' ? 'مسجل منذ:' : 'Since:'} {formatDate(customer.joinDate)}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onEditCustomer && (
                <button
                  onClick={() => {
                    onClose();
                    onEditCustomer(customer);
                  }}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-border dark:border-dark-border bg-card dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-semibold text-text-primary dark:text-dark-text-primary flex items-center gap-1.5 transition"
                  title={language === 'ar' ? 'تعديل البيانات' : 'Edit Profile'}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{language === 'ar' ? 'تعديل' : 'Edit'}</span>
                </button>
              )}
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Communication & Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 sm:p-5 bg-gray-50/70 dark:bg-gray-800/30 border-b border-border dark:border-dark-border">
            <div className="p-3 bg-card dark:bg-dark-card rounded-xl border border-border dark:border-dark-border">
              <span className="text-[11px] font-semibold text-text-secondary dark:text-dark-text-secondary block">
                {language === 'ar' ? 'إجمالي المشتريات' : 'Lifetime Spend'}
              </span>
              <span className="text-base sm:text-lg font-black text-primary">
                {formatCurrency(totalSpent)}
              </span>
            </div>

            <div className="p-3 bg-card dark:bg-dark-card rounded-xl border border-border dark:border-dark-border">
              <span className="text-[11px] font-semibold text-text-secondary dark:text-dark-text-secondary block">
                {language === 'ar' ? 'عدد الفواتير' : 'Total Orders'}
              </span>
              <span className="text-base sm:text-lg font-black text-text-primary dark:text-white">
                {customerOrders.length} {language === 'ar' ? 'طلب' : 'orders'}
              </span>
            </div>

            {/* Loyalty Points Card */}
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/60 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>{language === 'ar' ? 'رصيد نقاط الولاء' : 'Loyalty Points'}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                </span>
                <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 block mt-0.5 font-mono">
                  {customer.loyaltyPoints || 0} <span className="text-[11px] font-normal text-amber-700 dark:text-amber-300">({formatCurrency(((customer.loyaltyPoints || 0) * 0.1))})</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddBonusPoints}
                className="mt-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline text-start"
              >
                {language === 'ar' ? '+ منح مكافأة نقاط' : '+ Reward Points'}
              </button>
            </div>

            <div className="p-3 bg-card dark:bg-dark-card rounded-xl border border-border dark:border-dark-border">
              <span className="text-[11px] font-semibold text-text-secondary dark:text-dark-text-secondary block">
                {language === 'ar' ? 'متوسط الفاتورة' : 'Avg Order Value'}
              </span>
              <span className="text-base sm:text-lg font-black text-text-primary dark:text-white">
                {formatCurrency(avgOrderValue)}
              </span>
            </div>

            <div className="p-2 sm:p-3 bg-card dark:bg-dark-card rounded-xl border border-border dark:border-dark-border flex items-center justify-between gap-1.5">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
              </a>
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center justify-center p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
                title={language === 'ar' ? 'اتصال هاتفي' : 'Phone Call'}
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border dark:border-dark-border px-5 bg-card dark:bg-dark-card text-xs sm:text-sm font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 border-b-2 font-bold whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary dark:text-dark-text-secondary hover:text-text-primary'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{language === 'ar' ? 'الملف والعنوان' : 'Profile & Address'}</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-4 border-b-2 font-bold whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary dark:text-dark-text-secondary hover:text-text-primary'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{language === 'ar' ? 'الفواتير والطلبات' : 'Orders & Invoices'} ({customerOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('quotations')}
              className={`py-3 px-4 border-b-2 font-bold whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === 'quotations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary dark:text-dark-text-secondary hover:text-text-primary'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{language === 'ar' ? 'عروض الأسعار' : 'Quotations'} ({customerQuotations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('repairs')}
              className={`py-3 px-4 border-b-2 font-bold whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === 'repairs'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary dark:text-dark-text-secondary hover:text-text-primary'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>{language === 'ar' ? 'الصيانة والضمان' : 'Repairs'} ({customerRepairs.length})</span>
            </button>
          </div>

          {/* Modal Tab Content Area */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {/* TAB 1: OVERVIEW & ADDRESS */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contact & Registration Info Card */}
                  <div className="p-4 bg-gray-50/60 dark:bg-gray-800/30 rounded-xl border border-border dark:border-dark-border space-y-3">
                    <h4 className="text-xs font-bold text-text-primary dark:text-dark-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-primary" />
                      <span>{language === 'ar' ? 'بيانات الاتصال والتسجيل' : 'Contact & Registration'}</span>
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-dark-border/60">
                        <span className="text-text-secondary dark:text-dark-text-secondary text-xs">{language === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}</span>
                        <span className="font-semibold text-text-primary dark:text-white">{customer.name}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-dark-border/60">
                        <span className="text-text-secondary dark:text-dark-text-secondary text-xs">{language === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}</span>
                        <span className="font-semibold text-text-primary dark:text-white" dir="ltr">{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-dark-border/60">
                          <span className="text-text-secondary dark:text-dark-text-secondary text-xs">{language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</span>
                          <span className="font-medium text-text-primary dark:text-white">{customer.email}</span>
                        </div>
                      )}
                      {customer.commercialRegister && (
                        <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-dark-border/60">
                          <span className="text-text-secondary dark:text-dark-text-secondary text-xs">{language === 'ar' ? 'السجل التجاري (CR):' : 'C.R. Number:'}</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{customer.commercialRegister}</span>
                        </div>
                      )}
                      {customer.taxNumber && (
                        <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-dark-border/60">
                          <span className="text-text-secondary dark:text-dark-text-secondary text-xs">{language === 'ar' ? 'الرقم الضريبي (VAT):' : 'VAT Number:'}</span>
                          <span className="font-mono font-medium text-text-primary dark:text-white">{customer.taxNumber}</span>
                        </div>
                      )}
                      {customer.creditLimit ? (
                        <div className="flex justify-between py-1.5 border-b border-border/60 dark:border-dark-border/60">
                          <span className="text-text-secondary dark:text-dark-text-secondary text-xs">{language === 'ar' ? 'الحد الائتماني المعتمد:' : 'Credit Limit:'}</span>
                          <span className="font-bold text-amber-600">{formatCurrency(customer.creditLimit)}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Address & Delivery Location Card */}
                  <div className="p-4 bg-gray-50/60 dark:bg-gray-800/30 rounded-xl border border-border dark:border-dark-border space-y-3">
                    <h4 className="text-xs font-bold text-text-primary dark:text-dark-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'ar' ? 'عنوان التوصيل والإقامة' : 'Address & Delivery Location'}</span>
                    </h4>

                    {customer.address ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-card dark:bg-dark-card rounded-lg border border-border dark:border-dark-border text-sm font-medium text-text-primary dark:text-white leading-relaxed">
                          {customer.address}
                        </div>
                        {customer.region && (
                          <div className="text-xs text-text-secondary dark:text-dark-text-secondary">
                            <span className="font-semibold">{language === 'ar' ? 'المنطقة:' : 'Area:'}</span> {customer.region}
                          </div>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${customer.address}, Bahrain`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'فتح العنوان في خرائط Google' : 'Open in Google Maps'}</span>
                        </a>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-text-secondary dark:text-dark-text-secondary text-xs">
                        {language === 'ar' ? 'لم يتم تسجيل عنوان محدد للعميل حتى الآن.' : 'No delivery address recorded yet.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes & Special Instructions */}
                {customer.notes && (
                  <div className="p-4 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                      {language === 'ar' ? 'ملاحظات وتفضيلات العميل:' : 'Customer Notes:'}
                    </h4>
                    <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-line">
                      {customer.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ORDERS & INVOICES */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {customerOrders.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border dark:border-dark-border rounded-xl">
                    <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">
                      {language === 'ar' ? 'لا توجد طلبات أو فواتير مسجلة لهذا العميل.' : 'No orders recorded for this customer yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerOrders.map(order => (
                      <div 
                        key={order.id} 
                        className="p-4 rounded-xl border border-border dark:border-dark-border bg-card dark:bg-dark-card shadow-sm hover:border-primary/40 transition"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border dark:border-dark-border">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-primary">
                                #{order.orderNumber}
                              </span>
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 font-medium">
                                {order.paymentMethod || 'Cash'}
                              </span>
                            </div>
                            <span className="text-xs text-text-secondary dark:text-dark-text-secondary">
                              {formatDate(order.date)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-end">
                              <span className="text-xs text-text-secondary dark:text-dark-text-secondary block">
                                {language === 'ar' ? 'إجمالي الطلب' : 'Total'}
                              </span>
                              <span className="text-base font-extrabold text-text-primary dark:text-white">
                                {formatCurrency(order.total)}
                              </span>
                            </div>

                            <button
                              onClick={() => setOrderToPrint(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border dark:border-dark-border text-xs font-semibold text-text-primary dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                              title={language === 'ar' ? 'طباعة / تصدير الفاتورة' : 'Print Invoice'}
                            >
                              <Printer className="w-3.5 h-3.5 text-primary" />
                              <span>{language === 'ar' ? 'الفاتورة' : 'Invoice'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Order Items Table */}
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-xs text-start">
                            <thead>
                              <tr className="text-text-secondary dark:text-dark-text-secondary border-b border-border/50 dark:border-dark-border/50">
                                <th className="py-1.5 text-start">{language === 'ar' ? 'الصنف / الجهاز' : 'Item'}</th>
                                <th className="py-1.5 text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                                <th className="py-1.5 text-end">{language === 'ar' ? 'السعر' : 'Price'}</th>
                                <th className="py-1.5 text-end">{language === 'ar' ? 'الضمان' : 'Warranty'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 dark:divide-dark-border/40">
                              {order.items.map((item, idx) => {
                                const product = products.find(p => p.id === item.productId);
                                return (
                                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                                    <td className="py-2 font-medium text-text-primary dark:text-white">
                                      {product?.name || `Product (${item.productId})`}
                                    </td>
                                    <td className="py-2 text-center font-bold">
                                      {item.quantity}
                                    </td>
                                    <td className="py-2 text-end">
                                      {formatCurrency(item.price)}
                                    </td>
                                    <td className="py-2 text-end">
                                      <WarrantyBadge orderDate={order.date} warrantyMonths={product?.warrantyMonths} />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: QUOTATIONS */}
            {activeTab === 'quotations' && (
              <div className="space-y-4">
                {customerQuotations.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border dark:border-dark-border rounded-xl">
                    <FileText className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">
                      {language === 'ar' ? 'لا توجد عروض أسعار مسجلة لهذا العميل.' : 'No quotations created for this customer.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerQuotations.map(quote => (
                      <div 
                        key={quote.id}
                        className="p-4 rounded-xl border border-border dark:border-dark-border bg-card dark:bg-dark-card flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">#{quote.quotationNumber}</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              quote.status === 'Converted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30' :
                              quote.status === 'Accepted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30' :
                              quote.status === 'Sent' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-800'
                            }`}>
                              {quote.status}
                            </span>
                          </div>
                          <span className="text-xs text-text-secondary dark:text-dark-text-secondary">
                            {formatDate(quote.date)} • {quote.items?.length || 0} {language === 'ar' ? 'أصناف' : 'items'}
                          </span>
                        </div>

                        <div className="text-end">
                          <span className="text-xs text-text-secondary dark:text-dark-text-secondary block">
                            {language === 'ar' ? 'المبلغ الإجمالي' : 'Total'}
                          </span>
                          <span className="text-base font-bold text-text-primary dark:text-white">
                            {formatCurrency(quote.total)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: REPAIRS & MAINTENANCE */}
            {activeTab === 'repairs' && (
              <div className="space-y-4">
                {customerRepairs.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border dark:border-dark-border rounded-xl">
                    <Wrench className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">
                      {language === 'ar' ? 'لا توجد طلبات صيانة أو أجهزة مسجلة لهذا العميل.' : 'No maintenance tickets for this customer.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerRepairs.map(repair => (
                      <div 
                        key={repair.id}
                        className="p-4 rounded-xl border border-border dark:border-dark-border bg-card dark:bg-dark-card flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">#{repair.repairNumber}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {repair.status}
                            </span>
                          </div>
                          <p className="text-xs text-text-primary dark:text-white font-medium mt-1">
                            {repair.deviceType || 'Device'} - {repair.brandModel || ''}
                          </p>
                          <span className="text-xs text-text-secondary dark:text-dark-text-secondary">
                            {formatDate(repair.date)} {repair.problemDescription ? `• ${repair.problemDescription}` : ''}
                          </span>
                        </div>

                        <div className="text-end">
                          <span className="text-xs text-text-secondary dark:text-dark-text-secondary block">
                            {language === 'ar' ? 'التكلفة' : 'Cost'}
                          </span>
                          <span className="text-sm font-bold text-text-primary dark:text-white">
                            {formatCurrency(repair.totalAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-t border-border dark:border-dark-border bg-gray-50/50 dark:bg-gray-800/30">
            <span className="text-xs text-text-secondary dark:text-dark-text-secondary">
              ID: <span className="font-mono">{customer.id}</span>
            </span>

            <button 
              onClick={onClose} 
              type="button" 
              className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-text-primary dark:text-white text-xs font-bold transition"
            >
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {orderToPrint && (
        <PrintOrderModal
          order={orderToPrint}
          onClose={() => setOrderToPrint(null)}
        />
      )}
    </>
  );
};

export default CustomerDetailModal;
