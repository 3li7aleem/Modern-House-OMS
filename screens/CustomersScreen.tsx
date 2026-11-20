import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Customer } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import AddCustomerModal from '../components/customers/AddCustomerModal';
import CustomerDetailModal from '../components/customers/CustomerDetailModal';
import CustomerInvoicesModal from '../components/customers/CustomerInvoicesModal';
import { 
  Users, UserPlus, Download, Upload, Search, Phone, MessageSquare, 
  MapPin, Calendar, ShoppingBag, DollarSign, Edit, Trash2, Eye, 
  LayoutGrid, List, CheckSquare, Square, ArrowUpDown, X, Star, 
  FileSpreadsheet, ShieldCheck, Tag, ExternalLink, Award, RefreshCw
} from 'lucide-react';

declare const XLSX: any;

const downloadFile = (blob: Blob, filename: string) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.error("Direct link click failed", err);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;
      if (typeof base64data === 'string') {
        const a = document.createElement('a');
        a.href = base64data;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
      }
    };
    reader.readAsDataURL(blob);
  }
};

const exportCustomerCSVFallback = (items: any[], filename: string) => {
  if (!items || !items.length) {
    alert("No data available to export.");
    return;
  }
  
  const headers = [
    'الاسم (Name)',
    'رقم الهاتف (Phone)',
    'التصنيف (Category)',
    'المنطقة (Region)',
    'العنوان (Address)',
    'السجل التجاري (CR)',
    'الرقم الضريبي (VAT)',
    'عدد الطلبات (Orders Count)',
    'إجمالي المشتريات (Total Spend BHD)',
    'تاريخ التسجيل (Join Date)',
    'ملاحظات (Notes)'
  ];

  const keys = [
    'name',
    'phone',
    'category',
    'region',
    'address',
    'commercialRegister',
    'taxNumber',
    'orderCount',
    'totalSpent',
    'joinDate',
    'notes'
  ];
  
  const csvRows = [headers.join(',')];
  
  for (const item of items) {
    const values = keys.map(key => {
      const val = item[key];
      if (val === undefined || val === null) {
        return '""';
      }
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvContent = csvRows.join('\r\n');
  const bomToken = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM for Arabic excel compatibility
  const blob = new Blob([bomToken, csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename);
};

const CustomersScreen: React.FC = () => {
  const { 
    customers, 
    orders, 
    addCustomer, 
    updateCustomer, 
    importCustomers, 
    deleteCustomer, 
    currentUser, 
    globalSearchQuery 
  } = useAppContext();
  
  const { t, formatDate, formatCurrency, language } = useTranslation();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  const [selectedCustomerForInvoices, setSelectedCustomerForInvoices] = useState<Customer | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'WITH_ORDERS' | 'NO_ORDERS' | 'TOP_SPENDERS'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'SPEND_DESC' | 'ORDERS_DESC' | 'NAME_ASC'>('NEWEST');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Multi-selection state
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  const importInputRef = useRef<HTMLInputElement>(null);

  // Sync with global search query
  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setSearchQuery(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  // Compute Customer Statistics Map (orders count, total spend, last order date)
  const customerStatsMap = useMemo(() => {
    const map = new Map<string, { orderCount: number; totalSpent: number; lastOrderDate?: string }>();
    
    orders.forEach(order => {
      if (!order.customerId) return;
      const current = map.get(order.customerId) || { orderCount: 0, totalSpent: 0 };
      const newTotal = current.totalSpent + (order.total || 0);
      const newCount = current.orderCount + 1;
      let lastDate = current.lastOrderDate;
      if (!lastDate || new Date(order.date) > new Date(lastDate)) {
        lastDate = order.date;
      }
      map.set(order.customerId, {
        orderCount: newCount,
        totalSpent: newTotal,
        lastOrderDate: lastDate
      });
    });

    return map;
  }, [orders]);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalCount = customers.length;
    let activeWithOrdersCount = 0;
    let totalLifetimeRevenue = 0;
    let commercialAndVipCount = 0;

    customers.forEach(c => {
      const stats = customerStatsMap.get(c.id);
      if (stats && stats.orderCount > 0) {
        activeWithOrdersCount++;
        totalLifetimeRevenue += stats.totalSpent;
      }
      if (c.category === 'Commercial' || c.category === 'VIP' || c.category === 'Wholesale' || c.commercialRegister) {
        commercialAndVipCount++;
      }
    });

    return {
      totalCount,
      activeWithOrdersCount,
      totalLifetimeRevenue,
      commercialAndVipCount
    };
  }, [customers, customerStatsMap]);

  // Filtering & Sorting
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const stats = customerStatsMap.get(customer.id) || { orderCount: 0, totalSpent: 0 };

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = customer.name?.toLowerCase().includes(query);
        const matchesPhone = customer.phone?.toLowerCase().includes(query);
        const matchesEmail = customer.email?.toLowerCase().includes(query);
        const matchesAddress = customer.address?.toLowerCase().includes(query);
        const matchesCR = customer.commercialRegister?.toLowerCase().includes(query);
        const matchesNotes = customer.notes?.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesAddress && !matchesCR && !matchesNotes) {
          return false;
        }
      }

      // Category Filter
      if (selectedCategory !== 'ALL') {
        const cat = customer.category || 'Individual';
        if (cat !== selectedCategory) return false;
      }

      // Activity Filter
      if (activityFilter === 'WITH_ORDERS' && stats.orderCount === 0) return false;
      if (activityFilter === 'NO_ORDERS' && stats.orderCount > 0) return false;
      if (activityFilter === 'TOP_SPENDERS' && stats.totalSpent < 500) return false;

      return true;
    }).sort((a, b) => {
      const statsA = customerStatsMap.get(a.id) || { orderCount: 0, totalSpent: 0 };
      const statsB = customerStatsMap.get(b.id) || { orderCount: 0, totalSpent: 0 };

      switch (sortBy) {
        case 'NEWEST':
          return new Date(b.joinDate || 0).getTime() - new Date(a.joinDate || 0).getTime();
        case 'OLDEST':
          return new Date(a.joinDate || 0).getTime() - new Date(b.joinDate || 0).getTime();
        case 'SPEND_DESC':
          return statsB.totalSpent - statsA.totalSpent;
        case 'ORDERS_DESC':
          return statsB.orderCount - statsA.orderCount;
        case 'NAME_ASC':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });
  }, [customers, customerStatsMap, searchQuery, selectedCategory, activityFilter, sortBy]);

  // Clean phone for WhatsApp
  const cleanPhoneForWhatsApp = (rawPhone: string) => {
    const digits = (rawPhone || '').replace(/\D/g, '');
    if (digits.startsWith('973')) return digits;
    if (digits.length === 8) return `973${digits}`;
    return digits;
  };

  // Customer Save & Edit
  const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'joinDate'>) => {
    try {
      await addCustomer(customerData);
      setIsAddModalOpen(false);
    } catch (error: any) {
      console.error("Failed to add customer:", error);
      alert(language === 'ar' ? 'فشل إضافة العميل.' : 'Failed to save customer.');
    }
  };

  const handleUpdateCustomer = async (customerId: string, updatedData: Partial<Customer>) => {
    try {
      await updateCustomer(customerId, updatedData);
      setCustomerToEdit(null);
      alert(language === 'ar' ? 'تم تحديث بيانات العميل بنجاح!' : 'Customer updated successfully!');
    } catch (error: any) {
      console.error("Failed to update customer:", error);
      alert(language === 'ar' ? 'فشل تحديث بيانات العميل.' : 'Failed to update customer.');
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (currentUser?.role !== 'Admin') {
      alert(language === 'ar' ? 'مطلوب صلاحية مدير لحذف العميل.' : 'Admin approval required to delete.');
      return;
    }

    const stats = customerStatsMap.get(customer.id);
    const hasOrders = stats && stats.orderCount > 0;

    const message = hasOrders
      ? (language === 'ar' 
          ? `تنبيه: العميل "${customer.name}" لديه (${stats.orderCount}) طلبات مسجلة بإجمالي ${formatCurrency(stats.totalSpent)}. هل أنت متأكد من الحذف؟`
          : `Warning: Customer "${customer.name}" has ${stats.orderCount} orders totaling ${formatCurrency(stats.totalSpent)}. Delete anyway?`)
      : (language === 'ar' 
          ? `هل أنت متأكد من حذف العميل "${customer.name}"؟` 
          : `Are you sure you want to delete customer "${customer.name}"?`);

    if (window.confirm(message)) {
      try {
        await deleteCustomer(customer.id);
        setSelectedCustomerIds(prev => prev.filter(id => id !== customer.id));
        alert(language === 'ar' ? 'تم حذف العميل بنجاح.' : 'Customer deleted successfully.');
      } catch (error) {
        alert(language === 'ar' ? 'فشل الحذف. قد تكون هنالك بيانات مرتبطة به.' : 'Failed to delete customer.');
      }
    }
  };

  // Multi-selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCustomerIds(filteredCustomers.map(c => c.id));
    } else {
      setSelectedCustomerIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedCustomerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Export handler
  const handleExport = (exportSubsetOnly: boolean = false) => {
    const listToExport = exportSubsetOnly && selectedCustomerIds.length > 0
      ? customers.filter(c => selectedCustomerIds.includes(c.id))
      : filteredCustomers;

    if (listToExport.length === 0) {
      alert(language === 'ar' ? 'لا توجد بيانات متاحة للتصدير.' : 'No data to export.');
      return;
    }

    const exportRows = listToExport.map(c => {
      const stats = customerStatsMap.get(c.id) || { orderCount: 0, totalSpent: 0 };
      return {
        name: c.name || '',
        phone: c.phone || '',
        category: c.category || 'Individual',
        region: c.region || '',
        address: c.address || '',
        commercialRegister: c.commercialRegister || '',
        taxNumber: c.taxNumber || '',
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent.toFixed(3),
        joinDate: c.joinDate ? formatDate(c.joinDate) : '',
        notes: c.notes || ''
      };
    });

    try {
      if (typeof XLSX === 'undefined' || !XLSX.utils || !XLSX.utils.json_to_sheet) {
        exportCustomerCSVFallback(exportRows, "modern_house_customers.csv");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");
      
      try {
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        const buf = new ArrayBuffer(wbout.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xFF;
        const blob = new Blob([buf], { type: "application/octet-stream" });
        downloadFile(blob, "modern_house_customers.xlsx");
      } catch {
        XLSX.writeFile(wb, "modern_house_customers.xlsx");
      }
    } catch (err) {
      console.error("XLSX export failed, fallback to CSV", err);
      exportCustomerCSVFallback(exportRows, "modern_house_customers.csv");
    }
  };

  // Import handler
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const validCustomers = json
          .filter(row => row.name || row['الاسم'] || row['Customer Name'])
          .map(row => ({
            name: String(row.name || row['الاسم'] || row['Customer Name'] || '').trim(),
            phone: String(row.phone || row['الهاتف'] || row['رقم الهاتف'] || row['Phone'] || '').trim(),
            address: String(row.address || row['العنوان'] || row['Address'] || '').trim(),
            region: String(row.region || row['المنطقة'] || '').trim(),
            commercialRegister: String(row.commercialRegister || row['السجل التجاري'] || '').trim(),
            notes: String(row.notes || row['ملاحظات'] || '').trim(),
          }))
          .filter(c => c.name && c.phone);

        if (validCustomers.length > 0) {
          importCustomers(validCustomers as any);
          alert(language === 'ar' 
            ? `تم استيراد ${validCustomers.length} عميل بنجاح!` 
            : `${validCustomers.length} customers imported successfully!`);
        } else {
          alert(language === 'ar' 
            ? 'لم يتم العثور على عملاء صالحين في الملف. تأكد من وجود عمودي "name" و "phone".' 
            : 'No valid customers found in the file. Ensure "name" and "phone" columns exist.');
        }
      } catch (error) {
        console.error("Error importing file:", error);
        alert(language === 'ar' ? 'حدث خطأ أثناء استيراد الملف.' : 'Error importing Excel file.');
      }
    };
    reader.readAsBinaryString(file);
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'Commercial':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{language === 'ar' ? 'تجاري' : 'Commercial'}</span>;
      case 'VIP':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">★ VIP</span>;
      case 'Wholesale':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">{language === 'ar' ? 'جملة' : 'Wholesale'}</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{language === 'ar' ? 'أفراد' : 'Individual'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-text-primary dark:text-dark-text-primary tracking-tight">
                {language === 'ar' ? 'إدارة العملاء والزبائن' : 'Customer Relationship Management'}
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary dark:text-dark-text-secondary mt-0.5">
                {language === 'ar' ? 'قاعدة بيانات عملاء مودرن هاوس للتجارة، تتبع الفواتير، ومبيعات الزبائن' : 'Modern House customer database, order history & client tracking'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export */}
          <button 
            onClick={() => handleExport(false)} 
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition active:scale-95"
            title={language === 'ar' ? 'تصدير قائمة العملاء إلى Excel' : 'Export to Excel'}
          >
            <Download className="w-4 h-4" />
            <span>{language === 'ar' ? 'تصدير Excel' : 'Export'}</span>
          </button>

          {/* Import */}
          <button 
            onClick={() => importInputRef.current?.click()} 
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-card dark:bg-dark-card border border-border dark:border-dark-border hover:bg-gray-100 dark:hover:bg-gray-700 text-text-primary dark:text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition active:scale-95"
            title={language === 'ar' ? 'استيراد عملاء من ملف Excel' : 'Import from Excel'}
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{language === 'ar' ? 'استيراد' : 'Import'}</span>
          </button>
          <input 
            type="file" 
            ref={importInputRef} 
            style={{ display: 'none' }} 
            onChange={handleImport} 
            accept=".xlsx, .xls, .csv" 
          />

          {/* Add Customer */}
          <button 
            onClick={() => {
              setCustomerToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-primary/20 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'ar' ? '+ عميل جديد' : '+ Add Customer'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Customers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary block">
              {language === 'ar' ? 'إجمالي العملاء' : 'Total Customers'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-text-primary dark:text-white mt-1 block">
              {kpis.totalCount}
            </span>
            <span className="text-[11px] text-text-secondary dark:text-dark-text-secondary">
              {language === 'ar' ? 'عميل مسجل بالنظام' : 'registered accounts'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Buyers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary block">
              {language === 'ar' ? 'عملاء نشطون' : 'Active Buyers'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {kpis.activeWithOrdersCount}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {kpis.totalCount > 0 ? `${Math.round((kpis.activeWithOrdersCount / kpis.totalCount) * 100)}% ${language === 'ar' ? 'نسبة النشاط' : 'activity rate'}` : ''}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Lifetime Revenue Generated */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary block">
              {language === 'ar' ? 'إجمالي مشتريات العملاء' : 'Total Client Sales'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-primary mt-1 block">
              {formatCurrency(kpis.totalLifetimeRevenue)}
            </span>
            <span className="text-[11px] text-text-secondary dark:text-dark-text-secondary">
              {language === 'ar' ? 'القيمة التراكمية للفواتير' : 'cumulative invoice value'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Commercial & VIP */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary block">
              {language === 'ar' ? 'مؤسسات وعملاء VIP' : 'Commercial & VIP'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {kpis.commercialAndVipCount}
            </span>
            <span className="text-[11px] text-text-secondary dark:text-dark-text-secondary">
              {language === 'ar' ? 'حسابات تجارية وخاصة' : 'corporate & VIP partners'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters, Sort, View Toggle */}
      <div className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-sm space-y-4">
        {/* Row 1: Search & Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute top-3.5 start-3.5 text-text-secondary dark:text-dark-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'ابحث بالاسم، رقم الهاتف، السجل التجاري، المنطقة...' : 'Search by name, phone, CR, area...'}
              className="ps-10 pe-10 py-2.5 w-full text-sm text-text-primary dark:text-white placeholder-text-secondary bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-3 end-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Activity Filter */}
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as any)}
              className="py-2.5 px-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-xs sm:text-sm font-medium text-text-primary dark:text-white outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">{language === 'ar' ? 'كافة النشاطات' : 'All Activity'}</option>
              <option value="WITH_ORDERS">{language === 'ar' ? 'لديهم طلبات سابقة' : 'With Orders'}</option>
              <option value="NO_ORDERS">{language === 'ar' ? 'عملاء جدد (بدون طلبات)' : 'No Orders Yet'}</option>
              <option value="TOP_SPENDERS">{language === 'ar' ? 'الأكثر شراءً (>500 د.ب)' : 'Top Spenders (>500 BHD)'}</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2.5 px-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-xs sm:text-sm font-medium text-text-primary dark:text-white outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="NEWEST">{language === 'ar' ? 'الأحدث تسجيلاً' : 'Newest'}</option>
              <option value="SPEND_DESC">{language === 'ar' ? 'الأعلى إنفاقاً' : 'Highest Spend'}</option>
              <option value="ORDERS_DESC">{language === 'ar' ? 'الأكثر طلباً' : 'Most Orders'}</option>
              <option value="NAME_ASC">{language === 'ar' ? 'أبجدياً (أ - ي)' : 'Name (A-Z)'}</option>
              <option value="OLDEST">{language === 'ar' ? 'الأقدم تسجيلاً' : 'Oldest'}</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-border dark:border-dark-border">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table' 
                    ? 'bg-card dark:bg-dark-card text-primary shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                title={language === 'ar' ? 'عرض الجدول' : 'Table View'}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'cards' 
                    ? 'bg-card dark:bg-dark-card text-primary shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                title={language === 'ar' ? 'عرض البطاقات' : 'Cards View'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border dark:border-dark-border">
          <span className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary me-2">
            {language === 'ar' ? 'التصنيف:' : 'Category:'}
          </span>
          {[
            { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
            { id: 'Individual', labelAr: 'أفراد', labelEn: 'Individual' },
            { id: 'Commercial', labelAr: 'تجاري / شركات', labelEn: 'Commercial' },
            { id: 'VIP', labelAr: 'عملاء VIP', labelEn: 'VIP' },
            { id: 'Wholesale', labelAr: 'مبيعات جملة', labelEn: 'Wholesale' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {language === 'ar' ? cat.labelAr : cat.labelEn}
            </button>
          ))}

          {/* Reset Filters Shortcut */}
          {(searchQuery || selectedCategory !== 'ALL' || activityFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setActivityFilter('ALL');
              }}
              className="ms-auto inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{language === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Multi-Select Action Bar */}
      {selectedCustomerIds.length > 0 && (
        <div className="sticky top-2 z-20 p-3 sm:p-4 rounded-2xl bg-primary text-white shadow-xl flex items-center justify-between gap-3 animate-fade-in-scale">
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold">
            <CheckSquare className="w-5 h-5" />
            <span>
              {language === 'ar' 
                ? `تم تحديد ${selectedCustomerIds.length} من أصل ${filteredCustomers.length} عميل` 
                : `${selectedCustomerIds.length} of ${filteredCustomers.length} selected`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport(true)}
              className="px-3 py-1.5 bg-white text-primary rounded-xl text-xs font-bold hover:bg-gray-100 transition shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تصدير المحدد' : 'Export Selected'}</span>
            </button>
            <button
              onClick={() => setSelectedCustomerIds([])}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition"
            >
              {language === 'ar' ? 'إلغاء' : 'Deselect'}
            </button>
          </div>
        </div>
      )}

      {/* Customer List Display */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl shadow-sm space-y-3">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-text-primary dark:text-white">
            {language === 'ar' ? 'لا يوجد عملاء مطابقون لمعايير البحث' : 'No matching customers found'}
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary dark:text-dark-text-secondary max-w-md mx-auto">
            {language === 'ar' 
              ? 'جرّب تغيير كلمات البحث أو إعادة ضبط خيارات التصفية لعرض جميع العملاء.'
              : 'Try adjusting your search criteria or resetting filters to see all customers.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setActivityFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl border border-border dark:border-dark-border text-xs font-bold text-text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {language === 'ar' ? 'إعادة ضبط التصفية' : 'Reset Filters'}
            </button>
            <button
              onClick={() => {
                setCustomerToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition"
            >
              {language === 'ar' ? '+ إضافة عميل جديد' : '+ Add Customer'}
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-card dark:bg-dark-card shadow-lg rounded-2xl border border-border dark:border-dark-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start text-text-secondary dark:text-dark-text-secondary">
              <thead className="text-xs uppercase bg-gray-50/80 dark:bg-gray-800/60 text-text-secondary dark:text-dark-text-secondary border-b border-border dark:border-dark-border">
                <tr>
                  <th scope="col" className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedCustomerIds.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-start font-bold">
                    {language === 'ar' ? 'العميل والتصنيف' : 'Customer & Category'}
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-start font-bold">
                    {language === 'ar' ? 'الاتصال والواتساب' : 'Contact & WhatsApp'}
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-start font-bold">
                    {language === 'ar' ? 'العنوان / المنطقة' : 'Address / Area'}
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center font-bold">
                    {language === 'ar' ? 'الطلبات والمشتريات' : 'Orders & Spend'}
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center font-bold">
                    {language === 'ar' ? 'نقاط الولاء' : 'Loyalty Points'}
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-start font-bold">
                    {language === 'ar' ? 'تاريخ التسجيل' : 'Join Date'}
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center font-bold">
                    {language === 'ar' ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                {filteredCustomers.map((customer: Customer) => {
                  const stats = customerStatsMap.get(customer.id) || { orderCount: 0, totalSpent: 0 };
                  const isSelected = selectedCustomerIds.includes(customer.id);
                  const whatsAppUrl = `https://wa.me/${cleanPhoneForWhatsApp(customer.phone)}?text=${encodeURIComponent(
                    language === 'ar' 
                      ? `مرحباً ${customer.name}، معك مودرن هاوس للتجارة.` 
                      : `Hello ${customer.name}, Modern House for Trading.`
                  )}`;

                  return (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition ${
                        isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(customer.id)}
                          className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Customer Name & Badge */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0">
                            {customer.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span 
                                onClick={() => setSelectedCustomerForDetails(customer)}
                                className="font-bold text-text-primary dark:text-white hover:text-primary cursor-pointer transition"
                              >
                                {customer.name}
                              </span>
                              {getCategoryBadge(customer.category)}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {customer.commercialRegister && (
                                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                                  CR: {customer.commercialRegister}
                                </span>
                              )}
                              {customer.email && (
                                <span className="text-xs text-text-secondary dark:text-dark-text-secondary">
                                  {customer.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Direct Contact */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary dark:text-white" dir="ltr">
                            {customer.phone}
                          </span>
                          <a
                            href={whatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300 transition"
                            title={language === 'ar' ? 'محادثة واتساب' : 'WhatsApp'}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${customer.phone}`}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 transition"
                            title={language === 'ar' ? 'اتصال هاتفي' : 'Phone Call'}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Address & Region */}
                      <td className="px-6 py-4">
                        {customer.address ? (
                          <div className="max-w-xs">
                            <span className="text-xs text-text-primary dark:text-white line-clamp-1">
                              {customer.address}
                            </span>
                            {customer.region && (
                              <span className="text-[11px] text-text-secondary dark:text-dark-text-secondary block">
                                {customer.region}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>

                      {/* Orders & Lifetime Spend */}
                      <td className="px-6 py-4 text-center">
                        <div>
                          <span className="font-bold text-text-primary dark:text-white block">
                            {formatCurrency(stats.totalSpent)}
                          </span>
                          <span className="text-[11px] text-text-secondary dark:text-dark-text-secondary">
                            {stats.orderCount} {language === 'ar' ? 'طلب' : 'orders'}
                          </span>
                        </div>
                      </td>

                      {/* Loyalty Points */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 font-mono">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{customer.loyaltyPoints || 0}</span>
                          </span>
                          <span className="text-[10px] text-text-secondary mt-0.5">
                            {((customer.loyaltyPoints || 0) >= 1000 ? (language === 'ar' ? 'بلاتيني' : 'Platinum') :
                              (customer.loyaltyPoints || 0) >= 500 ? (language === 'ar' ? 'ذهبي' : 'Gold') :
                              (customer.loyaltyPoints || 0) >= 100 ? (language === 'ar' ? 'فضي' : 'Silver') :
                              (language === 'ar' ? 'برونزي' : 'Bronze'))}
                          </span>
                        </div>
                      </td>

                      {/* Member Since */}
                      <td className="px-6 py-4 text-xs whitespace-nowrap">
                        {formatDate(customer.joinDate)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 360 Details */}
                          <button 
                            onClick={() => setSelectedCustomerForDetails(customer)} 
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition"
                            title={language === 'ar' ? 'عرض الملف والبيانات الشاملة' : 'View Customer Profile'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Customer */}
                          <button 
                            onClick={() => {
                              setCustomerToEdit(customer);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition"
                            title={language === 'ar' ? 'تعديل بيانات العميل' : 'Edit Customer'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* View Invoices */}
                          <button 
                            onClick={() => setSelectedCustomerForInvoices(customer)} 
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition"
                            title={language === 'ar' ? 'عرض فواتير العميل' : 'View Invoices'}
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>

                          {/* Delete (Admin) */}
                          <button 
                            onClick={() => handleDelete(customer)} 
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition"
                            title={language === 'ar' ? 'حذف العميل' : 'Delete Customer'}
                          >
                            <Trash2 className="w-4 h-4" />
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
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer: Customer) => {
            const stats = customerStatsMap.get(customer.id) || { orderCount: 0, totalSpent: 0 };
            const isSelected = selectedCustomerIds.includes(customer.id);
            const whatsAppUrl = `https://wa.me/${cleanPhoneForWhatsApp(customer.phone)}?text=${encodeURIComponent(
              language === 'ar' 
                ? `مرحباً ${customer.name}، معك مودرن هاوس للتجارة.` 
                : `Hello ${customer.name}, Modern House for Trading.`
            )}`;

            return (
              <div 
                key={customer.id}
                className={`p-5 rounded-2xl bg-card dark:bg-dark-card border transition shadow-sm hover:shadow-md flex flex-col justify-between ${
                  isSelected 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-border dark:border-dark-border hover:border-primary/50'
                }`}
              >
                <div>
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-black text-base flex items-center justify-center shrink-0">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 
                          onClick={() => setSelectedCustomerForDetails(customer)}
                          className="font-bold text-base text-text-primary dark:text-white hover:text-primary cursor-pointer transition line-clamp-1"
                        >
                          {customer.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          {getCategoryBadge(customer.category)}
                          {customer.commercialRegister && (
                            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded">
                              CR: {customer.commercialRegister}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectOne(customer.id)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer mt-1"
                    />
                  </div>

                  {/* Contact & Address */}
                  <div className="space-y-1.5 text-xs text-text-secondary dark:text-dark-text-secondary py-2 border-y border-border/50 dark:border-dark-border/50 my-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-text-primary dark:text-white font-medium">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        <span dir="ltr">{customer.phone}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100 transition"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`tel:${customer.phone}`}
                          className="p-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 transition"
                          title="Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {customer.address && (
                      <div className="flex items-start gap-1 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Order Metrics */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/30 mb-4">
                    <div>
                      <span className="text-[10px] text-text-secondary dark:text-dark-text-secondary block">
                        {language === 'ar' ? 'إجمالي المشتريات' : 'Lifetime Spend'}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(stats.totalSpent)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-secondary dark:text-dark-text-secondary block">
                        {language === 'ar' ? 'عدد الفواتير' : 'Orders'}
                      </span>
                      <span className="text-sm font-bold text-text-primary dark:text-white">
                        {stats.orderCount} {language === 'ar' ? 'طلب' : 'orders'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 dark:border-dark-border/60 text-xs">
                  <button
                    onClick={() => setSelectedCustomerForDetails(customer)}
                    className="font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'الملف الشامل' : 'Profile'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCustomerToEdit(customer);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      title={language === 'ar' ? 'تعديل' : 'Edit'}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedCustomerForInvoices(customer)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                      title={language === 'ar' ? 'الفواتير' : 'Invoices'}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                      title={language === 'ar' ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isAddModalOpen && (
        <AddCustomerModal 
          onClose={() => {
            setIsAddModalOpen(false);
            setCustomerToEdit(null);
          }}
          onSave={handleSaveCustomer}
          customerToEdit={customerToEdit}
          onUpdate={handleUpdateCustomer}
        />
      )}

      {/* Customer 360 Detail Modal */}
      {selectedCustomerForDetails && (
        <CustomerDetailModal
          customer={selectedCustomerForDetails}
          onClose={() => setSelectedCustomerForDetails(null)}
          onEditCustomer={(customer) => {
            setCustomerToEdit(customer);
            setIsAddModalOpen(true);
          }}
        />
      )}

      {/* Customer Invoices Modal */}
      {selectedCustomerForInvoices && (
        <CustomerInvoicesModal
          customer={selectedCustomerForInvoices}
          onClose={() => setSelectedCustomerForInvoices(null)}
        />
      )}
    </div>
  );
};

export default CustomersScreen;
