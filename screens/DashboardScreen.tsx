import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import SalesChart from '../components/dashboard/SalesChart';
import { Order, Delivery, Quotation } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import { 
  TrendingUp, ShoppingCart, AlertCircle, Truck, ArrowRight, 
  Package, DollarSign, Wrench, Lock, Sparkles, QrCode, Wifi, 
  Smartphone, FileText, CheckCircle2, Clock, Users, Award, 
  ShieldCheck, Copy, Check, ExternalLink, Flame, Layers, 
  ChevronRight, Store, AlertTriangle, ArrowUpRight, FileSpreadsheet
} from 'lucide-react';

const CLOUD_URL_DEFAULT = 'https://exchanges-exclusively-cube-cayman.trycloudflare.com';
const LAN_URL_DEFAULT = 'http://192.168.8.29:3000';

const DashboardScreen: React.FC = () => {
  const { 
    orders, products, customers, expenses, deliveries, 
    purchaseOrders, repairs, quotations = [], requests = [], setActiveScreen, 
    currentUser, logout 
  } = useAppContext();
  
  const { t, formatCurrency, formatDate, language } = useTranslation();
  const isAr = language === 'ar';

  const [showQrModal, setShowQrModal] = useState(false);
  const [activeTabUrl, setActiveTabUrl] = useState<'cloud' | 'lan'>('cloud');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const targetUrl = activeTabUrl === 'cloud' ? CLOUD_URL_DEFAULT : LAN_URL_DEFAULT;
    QRCode.toDataURL(targetUrl, { width: 220, margin: 1 })
      .then(setQrCodeDataUrl)
      .catch(() => {});
  }, [activeTabUrl]);

  const handleCopyLink = () => {
    const targetUrl = activeTabUrl === 'cloud' ? CLOUD_URL_DEFAULT : LAN_URL_DEFAULT;
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || (isAr ? 'عميل نقدي' : 'Cash Customer');
  const getOrderNumber = (id: string) => orders.find(o => o.id === id)?.orderNumber || t('general.not_applicable');

  // --- Financial & Sales KPIs ---
  const totalRevenue = useMemo(() => orders.reduce((acc, order) => acc + (order.total || 0), 0), [orders]);
  
  const totalCostOfGoods = useMemo(() => orders.reduce((acc, order) => {
    const orderCost = order.items.reduce((itemAcc, item) => {
      const product = products.find(p => p.id === item.productId);
      return itemAcc + (product ? (product.purchasePrice || 0) * item.quantity : 0);
    }, 0);
    return acc + orderCost;
  }, 0), [orders, products]);

  const grossProfit = totalRevenue - totalCostOfGoods;
  const totalExpenses = useMemo(() => expenses.reduce((acc, expense) => acc + (expense.amount || 0), 0), [expenses]);
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // --- Today's Metrics ---
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = useMemo(() => orders.filter(o => o.date && o.date.startsWith(todayStr)), [orders, todayStr]);
  const todayRevenue = useMemo(() => todayOrders.reduce((acc, o) => acc + (o.total || 0), 0), [todayOrders]);

  // --- Inventory & Appliance KPIs ---
  const lowStockItems = useMemo(() => products.filter(p => p.stock <= (p.lowStockThreshold ?? 5) && p.status !== 'Archived'), [products]);
  const outOfStockItems = useMemo(() => products.filter(p => p.stock <= 0 && p.status !== 'Archived'), [products]);
  const totalInventoryValuation = useMemo(() => products.reduce((acc, p) => acc + ((p.stock || 0) * (p.purchasePrice || 0)), 0), [products]);

  // --- Quotations & Inquiries KPIs ---
  const activeQuotations = useMemo(() => (quotations || []).filter(q => q.status === 'Sent' || q.status === 'Draft'), [quotations]);
  const totalQuotationsValue = useMemo(() => (quotations || []).reduce((acc, q) => acc + (q.totalAmount || 0), 0), [quotations]);
  const acceptedQuotations = useMemo(() => (quotations || []).filter(q => q.status === 'Accepted'), [quotations]);
  const quotationAcceptanceRate = (quotations || []).length > 0 ? Math.round((acceptedQuotations.length / (quotations || []).length) * 100) : 0;

  // --- Loyalty & VIP Customers ---
  const loyaltyCustomers = useMemo(() => customers.filter(c => (c.loyaltyPoints || 0) > 0), [customers]);
  const totalLoyaltyPoints = useMemo(() => customers.reduce((acc, c) => acc + (c.loyaltyPoints || 0), 0), [customers]);

  // --- Deliveries & Maintenance ---
  const pendingDeliveries = useMemo(() => deliveries.filter(d => d.status === 'Pending'), [deliveries]);
  const activeRepairs = useMemo(() => (repairs || []).filter(r => r.status !== 'Completed' && r.status !== 'Cancelled'), [repairs]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 md:space-y-8"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ============================================================== */}
      {/* 1. TOP HEADER & SHOWROOM IDENTITY                              */}
      {/* ============================================================== */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 text-xl border border-amber-300/40">
            MH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'مؤسسة البيت الحديث للتجارة' : 'Modern House for Trading'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                OMS v1.1
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isAr 
                ? 'إدارة معارض المطابخ الحديثة • الأجهزة البلت إن • نقاط البيع السحابية' 
                : 'Modern Kitchens Showroom • Built-in Appliances • Cloud POS Operations'}
            </p>
          </div>
        </div>

        {/* Live System Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div 
            className="flex items-center justify-center p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs"
            title={isAr ? 'قاعدة بيانات محلية نشطة (D:\\oms)' : 'Local DB Active (D:\\oms)'}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
            title={isAr ? 'قفل الجلسة (PIN)' : 'Lock Session'}
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. EXECUTIVE HERO COMMAND DECK ("مركز عمليات المعرض الموحد")   */}
      {/* ============================================================== */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl md:rounded-[2.2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-neutral-950 text-white p-4 sm:p-6 md:p-8 shadow-2xl border border-amber-500/30 ring-1 ring-amber-400/20"
      >
        {/* Ambient Backlight Elements & Radial Highlights */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4 sm:space-y-6">
          {/* Top Deck Header: Title Badge & Live System Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-white/10">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-black bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-500/40 shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
              <span>{isAr ? 'مركز عمليات المعرض الموحد' : 'Unified Showroom Operations Hub'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[10px] text-amber-200/80 font-normal">Command Deck</span>
            </div>

            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold text-slate-300 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{isAr ? 'قاعدة بيانات محلية نشطة' : 'Local SQLite Active'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                <Wifi className="w-3 h-3 text-sky-400" />
                <span>{isAr ? 'مزامنة سحابية مستمرة' : 'Cloud Sync Live'}</span>
              </span>
            </div>
          </div>

          {/* Main Greeting & Mission Statement */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200">
                {currentUser?.name 
                  ? (isAr ? `أهلاً بك، ${currentUser.name} 👋` : `Welcome back, ${currentUser.name} 👋`) 
                  : (isAr ? 'أهلاً بك في منظومة البيت الحديث 👋' : 'Welcome to Modern House OMS 👋')}
              </h1>
              <p className="hidden sm:block text-xs md:text-sm text-slate-300/90 leading-relaxed">
                {isAr 
                  ? 'متابعة لحظية وموحدة لفواتير المبيعات، عروض الأسعار، مخزون الأجهزة المتاح، وأوامر الصيانة والتوصيل مع تكامل فوري لأجهزة التابلت والجوال.'
                  : 'Real-time unified management for sales invoices, quotations, appliance inventory, and maintenance/delivery dispatches with instant mobile tablet integration.'}
              </p>
            </div>

            {/* Action Command Pills */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full xl:w-auto">
              <button
                onClick={() => setActiveScreen('pos')}
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/30 transition-all duration-200 active:scale-95 cursor-pointer ring-1 ring-amber-300/50"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isAr ? 'فاتورة كاشير (POS)' : 'POS Checkout'}</span>
              </button>

              <button
                onClick={() => setActiveScreen('quotations')}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 backdrop-blur-md transition active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span>{isAr ? 'عروض الأسعار' : 'Quotations'}</span>
              </button>

              <button
                onClick={() => setActiveScreen('inventory')}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 backdrop-blur-md transition active:scale-95 cursor-pointer"
              >
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span>{isAr ? 'المخزون والأصناف' : 'Inventory'}</span>
              </button>

              <button
                onClick={() => setActiveScreen('maintenance')}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 backdrop-blur-md transition active:scale-95 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
                <span>{isAr ? 'الصيانة والورشة' : 'Maintenance'}</span>
              </button>

              <button
                onClick={() => setActiveScreen('delivery')}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 backdrop-blur-md transition active:scale-95 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                <span>{isAr ? 'التوصيل' : 'Deliveries'}</span>
              </button>

              <button
                onClick={() => setShowQrModal(true)}
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition active:scale-95 cursor-pointer"
                title={isAr ? 'مسح كود التابلت والجوال' : 'Tablet QR Code'}
              >
                <QrCode className="w-4 h-4" />
                <span className="sm:hidden text-xs font-bold">{isAr ? 'رمز التابلت' : 'Tablet QR'}</span>
              </button>
            </div>
          </div>

          {/* Interactive In-Deck Operations HUD (4 Glass Metric Tiles) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
            {/* Tile 1: مبيعات اليوم */}
            <div 
              onClick={() => setActiveScreen('orders')}
              className="p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-bold">{isAr ? 'مبيعات اليوم' : "Today's Sales"}</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
              </div>
              <div className="text-lg lg:text-xl font-black text-white font-mono tracking-tight">
                {formatCurrency(todayRevenue)}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                {todayOrders.length} {isAr ? 'فاتورة مسجلة اليوم' : 'orders today'}
              </div>
            </div>

            {/* Tile 2: عروض الأسعار */}
            <div 
              onClick={() => setActiveScreen('quotations')}
              className="p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-bold">{isAr ? 'عروض الأسعار المفتوحة' : 'Active Quotations'}</span>
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
              </div>
              <div className="text-lg lg:text-xl font-black text-amber-300 font-mono tracking-tight">
                {activeQuotations.length} {isAr ? 'عرض سعر' : 'quotes'}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold mt-1 font-mono">
                {formatCurrency(totalQuotationsValue)} {isAr ? 'إجمالي القيمة' : 'value'}
              </div>
            </div>

            {/* Tile 3: كتالوج المعرض */}
            <div 
              onClick={() => setActiveScreen('inventory')}
              className="p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-bold">{isAr ? 'أصناف المعرض المتوفرة' : 'Catalog Products'}</span>
                <Package className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition" />
              </div>
              <div className="text-lg lg:text-xl font-black text-white font-mono tracking-tight">
                {products.length} {isAr ? 'صنف جاهز' : 'items'}
              </div>
              <div className="text-[10px] text-sky-300 font-semibold mt-1">
                {lowStockItems.length > 0 
                  ? (isAr ? `${lowStockItems.length} صنف قارب النفاد` : `${lowStockItems.length} low stock`) 
                  : (isAr ? 'المخزون متوفر بالكامل' : 'Stock healthy')}
              </div>
            </div>

            {/* Tile 4: الصيانة والتوصيل */}
            <div 
              onClick={() => setActiveScreen('maintenance')}
              className="p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-bold">{isAr ? 'الورشة والتوصيل' : 'Repairs & Delivery'}</span>
                <div className="flex items-center gap-1 text-slate-400">
                  <Wrench className="w-3 h-3 text-sky-400" />
                  <Truck className="w-3 h-3 text-violet-400" />
                </div>
              </div>
              <div className="text-lg lg:text-xl font-black text-white font-mono tracking-tight">
                {repairs.length} {isAr ? 'صيانة' : 'repairs'} • {deliveries.length} {isAr ? 'توصيل' : 'deliv'}
              </div>
              <div className="text-[10px] text-slate-300 font-semibold mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{isAr ? 'متابعة تشغيلية مباشرة' : 'Live operations active'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================== */}
      {/* 3. SHOWROOM OPERATIONAL PILLARS (4 MAJOR CARDS)                 */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* PILLAR 1: المبيعات والأرباح */}
        <motion.div 
          variants={itemVariants}
          onClick={() => setActiveScreen('orders')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'المبيعات والأرباح' : 'Sales & Revenue'}
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {isAr ? 'صافي الربح:' : 'Net:'} {formatCurrency(netProfit)}
            </span>
            <span className="text-slate-400 font-medium">
              {orders.length} {isAr ? 'طلب' : 'orders'}
            </span>
          </div>
        </motion.div>

        {/* PILLAR 2: عروض الأسعار والطلبات */}
        <motion.div 
          variants={itemVariants}
          onClick={() => setActiveScreen('quotations')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-500/20 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {isAr ? 'عروض الأسعار والطلبات' : 'Quotations & Inquiries'}
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(totalQuotationsValue)}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-amber-700 dark:text-amber-300 font-bold">
              {isAr ? 'عروض معتمدة:' : 'Accepted:'} {acceptedQuotations.length} {isAr ? 'عرض' : 'quotes'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
              {quotationAcceptanceRate}% {isAr ? 'نسبة القبول' : 'Acceptance'}
            </span>
          </div>
        </motion.div>

        {/* PILLAR 3: الأجهزة والمخزون */}
        <motion.div 
          variants={itemVariants}
          onClick={() => setActiveScreen('inventory')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'الأجهزة والمخزون' : 'Appliances & Stock'}
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {products.length} <span className="text-xs font-normal text-slate-400">{isAr ? 'صنف مسجل' : 'items'}</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            {lowStockItems.length > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {lowStockItems.length} {isAr ? 'صنف منخفض' : 'low stock'}
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isAr ? 'المخزون آمن' : 'Stock Healthy'}
              </span>
            )}
            <span className="text-slate-400 font-medium text-[11px]">
              {formatCurrency(totalInventoryValuation)}
            </span>
          </div>
        </motion.div>

        {/* PILLAR 4: العملاء وخدمات ما بعد البيع */}
        <motion.div 
          variants={itemVariants}
          onClick={() => setActiveScreen('customers')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'العملاء والولاء' : 'Clients & Loyalty'}
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {customers.length} <span className="text-xs font-normal text-slate-400">{isAr ? 'عميل مسجل' : 'clients'}</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              {totalLoyaltyPoints} {isAr ? 'نقطة ولاء' : 'points'}
            </span>
            <span className="text-slate-400 font-medium">
              {pendingDeliveries.length} {isAr ? 'توصيل معلق' : 'deliveries'}
            </span>
          </div>
        </motion.div>

      </div>

      {/* ============================================================== */}
      {/* 4. SHOWROOM SALES CHART                                        */}
      {/* ============================================================== */}
      <motion.div 
        variants={itemVariants}
        className="w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'حركة مبيعات الأيام السبعة الأخيرة' : 'Last 7 Days Sales Trend'}
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {isAr ? 'تحديث لحظي ومستمر' : 'Real-time Live'}
          </span>
        </div>

        <div className="h-72 w-full">
          <SalesChart ordersData={orders || []} />
        </div>
      </motion.div>

      {/* ============================================================== */}
      {/* 5. OPERATIONAL ACTIVITY: KITCHEN PROJECTS & RECENT INVOICES   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recent Quotations Table */}
        <motion.div 
          variants={itemVariants}
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'أحدث عروض الأسعار والطلبات' : 'Recent Quotations & Inquiries'}
              </h4>
            </div>
            <button 
              onClick={() => setActiveScreen('quotations')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              {isAr ? 'عرض الكل' : 'View All'} ({(quotations || []).length})
            </button>
          </div>

          <div className="space-y-3">
            {(quotations || []).slice(0, 4).map(quotation => {
              const statusColors: Record<string, string> = {
                Draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                Sent: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
                Accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                Rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
              };

              return (
                <div 
                  key={quotation.id}
                  onClick={() => setActiveScreen('quotations')}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {quotation.quotationNumber}
                      </span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                        • {getCustomerName(quotation.customerId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <span>{isAr ? 'التاريخ:' : 'Date:'} {formatDate(quotation.date)}</span>
                      <span>• {quotation.items?.length || 0} {isAr ? 'أصناف' : 'items'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-end">
                      <span className="block text-xs font-black text-slate-900 dark:text-white">
                        {formatCurrency(quotation.totalAmount)}
                      </span>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[quotation.status] || statusColors.Draft}`}>
                        {quotation.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {(quotations || []).length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">{isAr ? 'لا توجد عروض أسعار مسجلة حالياً' : 'No quotations recorded yet'}</p>
                <button
                  onClick={() => setActiveScreen('quotations')}
                  className="mt-2 text-xs text-amber-600 font-bold hover:underline"
                >
                  {isAr ? '+ إنشاء أول عرض سعر' : '+ Create first quotation'}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Invoices Table */}
        <motion.div 
          variants={itemVariants}
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'أحدث فواتير المعرض ونقاط البيع' : 'Recent Showroom Invoices'}
              </h4>
            </div>
            <button 
              onClick={() => setActiveScreen('orders')}
              className="text-xs font-bold text-primary hover:underline"
            >
              {isAr ? 'عرض الكل' : 'View All'} ({orders.length})
            </button>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 4).map(order => (
              <div 
                key={order.id}
                onClick={() => setActiveScreen('orders')}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      • {getCustomerName(order.customerId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>{formatDate(order.date)}</span>
                    <span>• {order.items?.length || 0} {isAr ? 'قطع' : 'items'}</span>
                    {order.paymentMethod && <span>• {order.paymentMethod}</span>}
                  </div>
                </div>

                <div className="text-end">
                  <span className="block font-mono text-xs font-black text-slate-900 dark:text-white">
                    {formatCurrency(order.total)}
                  </span>
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ {isAr ? 'مدفوعة' : 'Paid'}
                  </span>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">{isAr ? 'لا توجد فواتير مسجلة اليوم' : 'No orders recorded today'}</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* Mobile & Tablet QR Access Modal */}
      {showQrModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-5"
            onClick={e => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm md:text-base">
                    {isAr ? 'ربط التابلت والجوال بالنظام' : 'Connect Mobile & Tablet'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'مسح الرمز للدخول الفوري ومزامنة الفواتير' : 'Scan to access OMS and sync data'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* URL Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTabUrl('cloud')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  activeTabUrl === 'cloud'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Wifi className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'الإنترنت السحابي' : 'Cloud Online'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabUrl('lan')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  activeTabUrl === 'lan'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-sky-500" />
                <span>{isAr ? 'شبكة المعرض (Wi-Fi)' : 'Showroom LAN'}</span>
              </button>
            </div>

            {/* QR Code Presentation Box */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="Access QR Code" 
                  className="w-48 h-48 rounded-xl shadow-xs bg-white p-2 border border-slate-200"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-slate-200 animate-pulse flex items-center justify-center" />
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-3 text-center">
                {isAr ? 'امسح الرمز بكاميرا الجوال أو التابلت للفتح المباشر' : 'Scan with mobile camera to open instantly'}
              </span>
            </div>

            {/* URL Display and Quick Copy */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono">
              <span className="truncate text-slate-700 dark:text-slate-300 dir-ltr text-[11px]">
                {activeTabUrl === 'cloud' ? CLOUD_URL_DEFAULT : LAN_URL_DEFAULT}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-600 shadow-2xs hover:bg-slate-50 flex items-center gap-1 flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
              </button>
            </div>

            {/* Tips for Permanent App Installation */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold">{isAr ? '💡 نصيحة لتشغيل دائم كأنه تطبيق:' : '💡 Pro tip for app install:'}</p>
              <p>
                {isAr 
                  ? 'بعد فتح الرابط في متصفح Chrome، اضغط على (⋮) ثم اختر "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية" ليعمل بملء الشاشة مع حفظ تسجيل الدخول.' 
                  : 'After opening in Chrome, tap (⋮) then select "Install App" or "Add to Home Screen" to run full-screen.'}
              </p>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default DashboardScreen;
