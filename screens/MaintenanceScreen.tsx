import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { RepairInvoice } from '../types';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit,
  Printer,
  LayoutGrid,
  List,
  MessageSquare,
  Eye,
  Tag,
  Coins,
  ShieldCheck,
  Truck,
  RotateCcw,
  Smartphone,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AddEditRepairModal } from '../components/maintenance/AddEditRepairModal';
import { RepairDetailsModal } from '../components/maintenance/RepairDetailsModal';
import { MaintenanceKanban } from '../components/maintenance/MaintenanceKanban';
import { printRepairInvoice } from '../components/maintenance/printRepairInvoice';

const MaintenanceScreen: React.FC = () => {
  const { customers, employees, repairs, deleteRepair, addRepair, updateRepair, updateRepairStatus } = useAppContext();
  const { t, language, formatDate, formatCurrency } = useTranslation();
  const isAr = language === 'ar';

  // View state: 'table' or 'kanban'
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Filters and Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RepairInvoice['status'] | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Normal' | 'High' | 'Urgent'>('All');
  const [warrantyFilter, setWarrantyFilter] = useState<'All' | 'Under Warranty' | 'Out of Warranty'>('All');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairInvoice | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRepairForDetails, setSelectedRepairForDetails] = useState<RepairInvoice | null>(null);

  // Filtered repairs
  const filteredRepairs = useMemo(() => {
    return repairs.filter(repair => {
      const customer = customers.find(c => c.id === repair.customerId);
      const query = searchTerm.trim().toLowerCase();

      const matchesSearch = !query || 
        repair.repairNumber.toLowerCase().includes(query) ||
        (customer?.name || '').toLowerCase().includes(query) ||
        (customer?.phone || '').includes(query) ||
        (repair.deviceType || '').toLowerCase().includes(query) ||
        (repair.brandModel || '').toLowerCase().includes(query) ||
        (repair.serialNumber || '').toLowerCase().includes(query) ||
        (repair.problemDescription || '').toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'All' || repair.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || (repair.priority || 'Normal') === priorityFilter;
      const matchesWarranty = warrantyFilter === 'All' || (repair.warrantyStatus || 'Out of Warranty') === warrantyFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesWarranty;
    });
  }, [repairs, customers, searchTerm, statusFilter, priorityFilter, warrantyFilter]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = repairs.length;
    const pending = repairs.filter(r => r.status === 'Pending').length;
    const inProgress = repairs.filter(r => r.status === 'In Progress').length;
    const ready = repairs.filter(r => r.status === 'Ready').length;
    const delivered = repairs.filter(r => r.status === 'Delivered').length;
    const totalRevenue = repairs.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    return { total, pending, inProgress, ready, delivered, totalRevenue };
  }, [repairs]);

  // Add / Edit submission
  const handleSaveRepair = async (repairData: Omit<RepairInvoice, 'id' | 'repairNumber'>) => {
    if (editingRepair) {
      await updateRepair(editingRepair.id, repairData);
    } else {
      await addRepair(repairData);
    }
  };

  // Quick Status change from table or kanban
  const handleStatusChange = async (id: string, newStatus: RepairInvoice['status']) => {
    await updateRepairStatus(id, newStatus);
    if (selectedRepairForDetails && selectedRepairForDetails.id === id) {
      setSelectedRepairForDetails(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Status visual badge helper
  const getStatusColor = (status: RepairInvoice['status']) => {
    switch (status) {
      case 'Pending': 
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'In Progress': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900';
      case 'Ready': 
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      case 'Delivered': 
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'Cancelled': 
        return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900';
      default: 
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: RepairInvoice['status']) => {
    if (!isAr) return status;
    switch (status) {
      case 'Pending': return 'قيد الانتظار';
      case 'In Progress': return 'قيد الفحص والإصلاح';
      case 'Ready': return 'جاهز للاستلام';
      case 'Delivered': return 'تم التسليم';
      case 'Cancelled': return 'ملغي';
      default: return status;
    }
  };

  // Fast direct WhatsApp update
  const handleDirectWhatsApp = (repair: RepairInvoice) => {
    const customer = customers.find(c => c.id === repair.customerId);
    const phone = customer?.phone?.replace(/[+\s-]/g, '') || '';
    let cleanPhone = phone;
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.slice(2);
    if (cleanPhone.length === 8 && !cleanPhone.startsWith('973')) {
      cleanPhone = '973' + cleanPhone;
    }

    const customerName = customer?.name || (isAr ? 'عزيزنا العميل' : 'Valued Customer');
    const deviceName = repair.deviceType || (isAr ? 'الجهاز' : 'Appliance');
    const remaining = Math.max(0, repair.totalAmount - (repair.paidAmount || 0));

    let msg = '';
    if (repair.status === 'Ready') {
      msg = isAr 
        ? `مرحباً ${customerName}، يسعدنا إبلاغك بأن جهازك (${deviceName}) برقم إيصال ${repair.repairNumber} جاهز الآن للاستلام من معرض مودرن هاوس! 🛠️✨\nالمبلغ المتبقي: ${formatCurrency(remaining)}.\nأوقات العمل: من 9 صباحاً حتى 10 مساءً.`
        : `Hello ${customerName}, your device (${deviceName}) under receipt #${repair.repairNumber} is ready for pickup at Modern House! 🛠️✨ Remaining due: ${formatCurrency(remaining)}.`;
    } else {
      msg = isAr
        ? `مرحباً ${customerName}، تحديث من مودرن هاوس بخصوص جهازك (${deviceName}) رقم ${repair.repairNumber}: الحالة الحالية هي (${getStatusLabel(repair.status)}). نسعد دائماً بخدمتك!`
        : `Hello ${customerName}, update from Modern House regarding device (${deviceName}) #${repair.repairNumber}: current status is (${repair.status}).`;
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-inner">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'قسم الصيانة والإصلاح الفني' : 'Maintenance & Repairs Workshop'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr 
                  ? 'إدارة فحص وإصلاح الأجهزة المنزلية ومستلزمات المطبخ، تتبع مراحل العمل، والضمان' 
                  : 'Track kitchenware repairs, technical diagnosis, spare parts, and customer pickups'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>{isAr ? 'جدول' : 'Table'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>{isAr ? 'لوحة كانبان' : 'Kanban'}</span>
            </button>
          </div>

          {/* New Ticket Button */}
          <button 
            type="button"
            onClick={() => {
              setEditingRepair(null);
              setIsAddEditModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 active:scale-98 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-primary/20 transition-all text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{isAr ? 'سند صيانة جديد' : 'New Repair Ticket'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'إجمالي السندات' : 'Total Tickets'}
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {stats.total}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              {isAr ? 'قيد الانتظار' : 'Pending'}
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {stats.pending}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              {isAr ? 'قيد الفحص والإصلاح' : 'In Progress'}
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {stats.inProgress}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              {isAr ? 'جاهز للاستلام' : 'Ready'}
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {stats.ready}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'إجمالي تكاليف الصيانة' : 'Total Value'}
            </p>
            <p className="text-xl font-black text-primary mt-1 font-mono">
              {formatCurrency(stats.totalRevenue)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
        
        {/* Search & Filters Toolbar */}
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={isAr ? 'ابحث برقم السند، العميل، الهاتف، نوع الجهاز، أو السيريال...' : 'Search by repair #, customer, phone, device, serial...'}
              className="w-full ps-9 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 hidden sm:inline">{isAr ? 'الحالة:' : 'Status:'}</span>
              <select 
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 dark:text-slate-200 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="All">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="Pending">{isAr ? 'قيد الانتظار' : 'Pending'}</option>
                <option value="In Progress">{isAr ? 'قيد الفحص والإصلاح' : 'In Progress'}</option>
                <option value="Ready">{isAr ? 'جاهز للاستلام' : 'Ready'}</option>
                <option value="Delivered">{isAr ? 'تم التسليم' : 'Delivered'}</option>
                <option value="Cancelled">{isAr ? 'ملغي' : 'Cancelled'}</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 hidden sm:inline">{isAr ? 'الأولوية:' : 'Priority:'}</span>
              <select 
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 dark:text-slate-200 outline-none"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
              >
                <option value="All">{isAr ? 'كل الأولويات' : 'All Priorities'}</option>
                <option value="Normal">{isAr ? 'عادي' : 'Normal'}</option>
                <option value="High">{isAr ? 'مرتفع' : 'High'}</option>
                <option value="Urgent">{isAr ? 'عاجل' : 'Urgent'}</option>
              </select>
            </div>

            {/* Warranty Filter */}
            <div className="flex items-center gap-1.5">
              <select 
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 dark:text-slate-200 outline-none"
                value={warrantyFilter}
                onChange={(e) => setWarrantyFilter(e.target.value as any)}
              >
                <option value="All">{isAr ? 'كل أنواع الضمان' : 'All Warranty'}</option>
                <option value="Under Warranty">{isAr ? 'تحت الضمان' : 'Under Warranty'}</option>
                <option value="Out of Warranty">{isAr ? 'خارج الضمان' : 'Out of Warranty'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Switch: Table or Kanban */}
        {viewMode === 'kanban' ? (
          <MaintenanceKanban
            repairs={filteredRepairs}
            customers={customers}
            onSelectRepair={(repair) => {
              setSelectedRepairForDetails(repair);
              setIsDetailsModalOpen(true);
            }}
            onStatusChange={handleStatusChange}
            language={language}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        ) : (
          /* Table View */
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-start">{isAr ? 'رقم السند' : 'Repair #'}</th>
                    <th className="px-4 py-3 text-start">{isAr ? 'العميل' : 'Customer'}</th>
                    <th className="px-4 py-3 text-start">{isAr ? 'الجهاز / العطل' : 'Device & Issue'}</th>
                    <th className="px-4 py-3 text-start hidden sm:table-cell">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'المرحلة' : 'Status'}</th>
                    <th className="px-4 py-3 text-end">{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRepairs.map((repair) => {
                    const customer = customers.find(c => c.id === repair.customerId);
                    const remaining = Math.max(0, repair.totalAmount - (repair.paidAmount || 0));

                    return (
                      <tr 
                        key={repair.id} 
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedRepairForDetails(repair);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        {/* Repair # & Badges */}
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="group-hover:text-primary transition">{repair.repairNumber}</span>
                            {repair.priority === 'Urgent' && (
                              <span className="w-2 h-2 rounded-full bg-red-500" title={isAr ? 'أولوية عاجلة' : 'Urgent'} />
                            )}
                            {(repair.beforeImageUrl || repair.afterImageUrl) && (
                              <span 
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                title={isAr ? 'مرفق صور الصيانة' : 'Maintenance Photos'}
                              >
                                <Camera className="w-3 h-3" />
                                <span>{isAr ? 'صور' : 'Photos'}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {customer?.name || (isAr ? 'غير مسجل' : 'Unknown')}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {customer?.phone || '-'}
                          </div>
                        </td>

                        {/* Device & Problem */}
                        <td className="px-4 py-3 max-w-[220px]">
                          <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {repair.deviceType || (isAr ? 'جهاز منزلي' : 'Appliance')} {repair.brandModel ? `(${repair.brandModel})` : ''}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {repair.problemDescription || (repair.items[0]?.description || '-')}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap hidden sm:table-cell">
                          <div>{formatDate(repair.date)}</div>
                          {repair.expectedReturnDate && (
                            <div className="text-[10px] text-slate-400">
                              {isAr ? 'المتوقع:' : 'Exp:'} {formatDate(repair.expectedReturnDate)}
                            </div>
                          )}
                        </td>

                        {/* Status (with inline quick change) */}
                        <td className="px-4 py-3 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <select
                            value={repair.status}
                            onChange={(e) => handleStatusChange(repair.id, e.target.value as any)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer ${getStatusColor(repair.status)}`}
                          >
                            <option value="Pending">{getStatusLabel('Pending')}</option>
                            <option value="In Progress">{getStatusLabel('In Progress')}</option>
                            <option value="Ready">{getStatusLabel('Ready')}</option>
                            <option value="Delivered">{getStatusLabel('Delivered')}</option>
                            <option value="Cancelled">{getStatusLabel('Cancelled')}</option>
                          </select>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-end font-mono whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(repair.totalAmount)}
                          </div>
                          {remaining > 0 ? (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400">
                              {isAr ? 'متبقي: ' : 'Due: '}{formatCurrency(remaining)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              {isAr ? 'مسدد' : 'Paid'}
                            </div>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="px-4 py-3 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {/* Inspect Details */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRepairForDetails(repair);
                                setIsDetailsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title={isAr ? 'معاينة التفاصيل' : 'View Details'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* WhatsApp Direct */}
                            {customer?.phone && (
                              <button
                                type="button"
                                onClick={() => handleDirectWhatsApp(repair)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition"
                                title={isAr ? 'إرسال تحديث عبر واتساب' : 'WhatsApp Status'}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}

                            {/* Print Invoice */}
                            <button 
                              type="button"
                              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" 
                              title={isAr ? 'طباعة الإيصال' : 'Print Invoice'}
                              onClick={() => printRepairInvoice(repair, customer, isAr, formatCurrency)}
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button 
                              type="button"
                              className="p-1.5 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition" 
                              title={isAr ? 'تعديل' : 'Edit'}
                              onClick={() => {
                                setEditingRepair(repair);
                                setIsAddEditModalOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button 
                              type="button"
                              className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" 
                              title={isAr ? 'حذف' : 'Delete'}
                              onClick={() => {
                                if (window.confirm(isAr ? 'هل أنت متأكد من حذف إيصال الصيانة هذا؟' : 'Are you sure you want to delete this repair invoice?')) {
                                  deleteRepair(repair.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRepairs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400">
                            <Wrench className="w-10 h-10" />
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm">
                            {isAr ? 'لم يتم العثور على أي سندات صيانة مطابقة.' : 'No repair records found.'}
                          </p>
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingRepair(null);
                              setIsAddEditModalOpen(true);
                            }}
                            className="text-primary text-xs font-bold hover:underline"
                          >
                            {isAr ? 'إصدار أول سند صيانة الآن' : 'Create your first repair invoice'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Add / Edit Repair Modal */}
      <AddEditRepairModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingRepair(null);
        }}
        editingRepair={editingRepair}
        customers={customers}
        employees={employees}
        onSave={handleSaveRepair}
        language={language}
        formatCurrency={formatCurrency}
      />

      {/* Details & WhatsApp Modal */}
      <RepairDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedRepairForDetails(null);
        }}
        repair={selectedRepairForDetails}
        customer={customers.find(c => c.id === selectedRepairForDetails?.customerId)}
        onEdit={(rep) => {
          setEditingRepair(rep);
          setIsAddEditModalOpen(true);
        }}
        onDelete={(id) => deleteRepair(id)}
        onStatusChange={handleStatusChange}
        onUpdatePhotos={async (id, photos) => {
          await updateRepair(id, photos);
          if (selectedRepairForDetails && selectedRepairForDetails.id === id) {
            setSelectedRepairForDetails(prev => prev ? { ...prev, ...photos } : null);
          }
        }}
        language={language}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

    </div>
  );
};

export default MaintenanceScreen;
