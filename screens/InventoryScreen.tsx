import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Product } from '../types';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Power, 
  PowerOff, 
  Printer, 
  TrendingUp, 
  DollarSign, 
  Package, 
  QrCode, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  Scan, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  CheckSquare, 
  Square,
  BarChart3,
  Layers,
  ArrowUpDown,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  Database,
  ShoppingCart,
  Sparkles
} from 'lucide-react';
import { calculateInventoryForecasts } from '../lib/aiService';
import { SmartReorderModal } from '../components/inventory/SmartReorderModal';
import ProductDetailModal from '../components/inventory/ProductDetailModal';
import ProductQrCode from '../components/inventory/ProductQrCode';
import ProductQrModal from '../components/inventory/ProductQrModal';
import { useTranslation } from '../contexts/LanguageContext';
import AddEditProductModal from '../components/inventory/AddEditProductModal';
import PrintInventoryModal from '../components/inventory/PrintInventoryModal';
import { QuickStockModal } from '../components/inventory/QuickStockModal';
import { BarcodeScannerModal } from '../components/inventory/BarcodeScannerModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StorageImage } from '../components/StorageImage';

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

const exportToCSVFallback = (items: any[], filename: string) => {
  if (!items || !items.length) {
    alert("No data available to export.");
    return;
  }
  
  const keys = [
    'name', 'sku', 'barcode', 'category', 'supplierId',
    'purchasePrice', 'salePrice', 'stock', 'lowStockThreshold',
    'warrantyMonths', 'imageUrl', 'description', 'status'
  ];
  
  const csvRows = [keys.join(',')];
  for (const item of items) {
    const values = keys.map(key => {
      const val = item[key];
      if (val === undefined || val === null) return '""';
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvContent = csvRows.join('\r\n');
  const bomToken = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bomToken, csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename);
};

export const InventoryScreen: React.FC = () => {
  const { 
    products, 
    suppliers, 
    orders, 
    customers, 
    addProduct, 
    importProducts, 
    updateProduct, 
    toggleProductStatus, 
    deleteProduct, 
    uploadProductImage, 
    globalSearchQuery 
  } = useAppContext();

  const { t, formatCurrency, formatDate, language } = useTranslation();
  const isAr = language === 'ar';

  // Navigation and Modals state
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'expiringWarranties' | 'forecasting'>('products');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // AI Inventory Predictive Forecasting
  const inventoryForecasts = useMemo(() => {
    return calculateInventoryForecasts(products, orders);
  }, [products, orders]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductForQr, setSelectedProductForQr] = useState<Product | null>(null);
  const [selectedProductForQuickStock, setSelectedProductForQuickStock] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSmartReorderOpen, setIsSmartReorderOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'inactive'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'default' | 'name-asc' | 'name-desc' | 'stock-desc' | 'stock-asc' | 'price-desc' | 'price-asc' | 'profit-desc'>('default');

  // Bulk Selection
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const importInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setSearchQuery(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || t('general.not_applicable');

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Expiring Warranties calculation
  const expiringWarranties = useMemo(() => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    const today = new Date();
    const expiring = [];

    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product && product.warrantyMonths) {
          const purchaseDate = new Date(order.date);
          const expiryDate = new Date(purchaseDate);
          expiryDate.setMonth(expiryDate.getMonth() + product.warrantyMonths);

          if (expiryDate >= today && expiryDate <= soon) {
            const remainingDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            expiring.push({
              order,
              product,
              customer: customers.find(c => c.id === order.customerId),
              expiryDate,
              remainingDays,
            });
          }
        }
      });
    });
    return expiring.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  }, [orders, products, customers]);

  // Financial Stats & Stock KPIs
  const kpis = useMemo(() => {
    let totalItemsCount = 0;
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalPurchaseValue = 0;
    let totalSaleValue = 0;

    products.forEach(p => {
      totalItemsCount++;
      const stock = p.stock || 0;
      totalStockUnits += stock;
      const threshold = p.lowStockThreshold || 10;

      if (p.status === 'Active') {
        if (stock === 0) {
          outOfStockCount++;
        } else if (stock <= threshold) {
          lowStockCount++;
        }
        totalPurchaseValue += (p.purchasePrice || 0) * stock;
        totalSaleValue += (p.salePrice || 0) * stock;
      }
    });

    const totalProfit = totalSaleValue - totalPurchaseValue;
    const profitMarginPercent = totalPurchaseValue > 0 
      ? Math.round((totalProfit / totalPurchaseValue) * 100) 
      : 0;

    return {
      totalItemsCount,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
      totalPurchaseValue,
      totalSaleValue,
      totalProfit,
      profitMarginPercent,
      chartData: [
        { name: isAr ? 'تكلفة الشراء' : 'Purchase Cost', value: totalPurchaseValue, color: '#6366f1' },
        { name: isAr ? 'قيمة البيع' : 'Sale Value', value: totalSaleValue, color: '#10b981' },
        { name: isAr ? 'الأرباح المتوقعة' : 'Potential Profit', value: totalProfit, color: '#f59e0b' }
      ]
    };
  }, [products, isAr]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Stock status filter
        if (stockStatusFilter === 'in_stock') {
          if (p.status !== 'Active' || p.stock <= (p.lowStockThreshold || 10)) return false;
        } else if (stockStatusFilter === 'low_stock') {
          if (p.status !== 'Active' || p.stock === 0 || p.stock > (p.lowStockThreshold || 10)) return false;
        } else if (stockStatusFilter === 'out_of_stock') {
          if (p.status !== 'Active' || p.stock > 0) return false;
        } else if (stockStatusFilter === 'inactive') {
          if (p.status === 'Active') return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }

        // Supplier filter
        if (selectedSupplierId !== 'all' && p.supplierId !== selectedSupplierId) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchName = p.name?.toLowerCase().includes(query);
          const matchSku = p.sku?.toLowerCase().includes(query);
          const matchBarcode = p.barcode?.toLowerCase().includes(query);
          const matchCategory = p.category?.toLowerCase().includes(query);
          const supplier = suppliers.find(s => s.id === p.supplierId);
          const matchSupplier = supplier?.name?.toLowerCase().includes(query);

          if (!matchName && !matchSku && !matchBarcode && !matchCategory && !matchSupplier) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'stock-desc':
            return (b.stock || 0) - (a.stock || 0);
          case 'stock-asc':
            return (a.stock || 0) - (b.stock || 0);
          case 'price-desc':
            return (b.salePrice || 0) - (a.salePrice || 0);
          case 'price-asc':
            return (a.salePrice || 0) - (b.salePrice || 0);
          case 'profit-desc': {
            const profitA = (a.salePrice || 0) - (a.purchasePrice || 0);
            const profitB = (b.salePrice || 0) - (b.purchasePrice || 0);
            return profitB - profitA;
          }
          default:
            return 0;
        }
      });
  }, [products, stockStatusFilter, selectedCategory, selectedSupplierId, searchQuery, sortOption, suppliers]);

  // Bulk selection helpers
  const handleToggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Actions
  const handleAddProduct = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm(t('inventory.delete_confirmation'))) {
      deleteProduct(productId);
    }
  };

  const handleToggleStatus = (product: Product) => {
    const message = product.status === 'Active'
      ? t('inventory.deactivate_confirmation')
      : t('inventory.activate_confirmation');
    if (window.confirm(message)) {
      toggleProductStatus(product.id);
    }
  };

  const handleCloseAddEditModal = () => {
    setIsModalOpen(false);
    setProductToEdit(null);
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'>, imageFile: File | null, productId?: string) => {
    setIsSavingProduct(true);
    try {
      const finalProductData = { ...productData } as any;
      if (imageFile) {
        const imageUrl = await uploadProductImage(imageFile, productId);
        finalProductData.imageUrl = imageUrl;
      }

      if (productId) {
        await updateProduct(productId, finalProductData);
      } else {
        await addProduct(finalProductData);
      }
      handleCloseAddEditModal();
    } catch (error: any) {
      console.error("Failed to save product:", error);
      alert(error.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleExport = () => {
    try {
      const exportList = selectedProductIds.size > 0 
        ? products.filter(p => selectedProductIds.has(p.id)) 
        : filteredProducts;

      if (typeof XLSX === 'undefined' || !XLSX.utils || !XLSX.utils.json_to_sheet) {
        exportToCSVFallback(exportList, "products.csv");
        return;
      }
      
      const safeTruncate = (val: any) => typeof val === 'string' && val.length > 30000 ? val.slice(0, 30000) + '...' : val;
      const cleanProducts = exportList.map(p => ({
        name: safeTruncate(p.name || ''),
        sku: safeTruncate(p.sku || ''),
        barcode: safeTruncate(p.barcode || ''),
        category: safeTruncate(p.category || ''),
        supplier: getSupplierName(p.supplierId || ''),
        purchasePrice: p.purchasePrice || 0,
        salePrice: p.salePrice || 0,
        stock: p.stock || 0,
        lowStockThreshold: p.lowStockThreshold || 10,
        warrantyMonths: p.warrantyMonths || 0,
        status: p.status || 'Active'
      }));

      const ws = XLSX.utils.json_to_sheet(cleanProducts);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory");
      
      try {
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        const buf = new ArrayBuffer(wbout.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xFF;
        const blob = new Blob([buf], { type: "application/octet-stream" });
        downloadFile(blob, `Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
      } catch (e) {
        XLSX.writeFile(wb, `Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (err) {
      exportToCSVFallback(products, "products.csv");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const validProducts = json
          .map(row => {
            const name = row['اسم المنتج / Name'] || row['اسم المنتج'] || row.Name || row.name;
            const sku = row['رمز المنتج / SKU'] || row['رمز المنتج'] || row.SKU || row.sku;
            const barcode = row['الباركود / Barcode'] || row['الباركود'] || row.Barcode || row.barcode || '';
            const category = row['التصنيف / Category'] || row['التصنيف'] || row.Category || row.category || 'General';
            const supplierId = row['المورد / Supplier'] || row['المورد'] || row.Supplier || row.supplierId || 'HANDMADE';
            const purchasePrice = Number(row['سعر الشراء / Cost'] || row['سعر الشراء'] || row.Cost || row.cost || row.purchasePrice || 0);
            const salePrice = Number(row['سعر البيع / Sale Price'] || row['سعر البيع'] || row['Sale Price'] || row.price || row.salePrice || 0);
            const stock = Number(row['الكمية / Stock'] || row['الكمية'] || row.Stock || row.stock || 0);
            const lowStockThreshold = Number(row['حد الطلب / Low Stock'] || row['حد الطلب'] || row['Low Stock'] || row.lowStockThreshold || 10);
            const warrantyMonths = Number(row['الضمان بالشهور / Warranty'] || row['الضمان بالشهور'] || row.Warranty || row.warrantyMonths || 12);
            const description = String(row['الوصف / Description'] || row['الوصف'] || row.Description || row.description || '');
            const rawImg = row['رابط الصورة / Image URL'] || row['رابط الصورة'] || row['Image URL'] || row.imageUrl || '';
            const imageUrl = rawImg === '[صورة مرفوعة - Image Base64]' ? '' : String(rawImg);
            const status = (row['الحالة / Status'] || row.Status || row.status || 'Active') === 'Inactive' ? 'Inactive' : 'Active';

            return {
              name: String(name || ''),
              sku: String(sku || ''),
              barcode: String(barcode),
              category: String(category),
              supplierId: String(supplierId),
              purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : 0,
              salePrice: Number.isFinite(salePrice) ? salePrice : 0,
              stock: Number.isFinite(stock) ? stock : 0,
              lowStockThreshold: Number.isFinite(lowStockThreshold) ? lowStockThreshold : 10,
              warrantyMonths: Number.isFinite(warrantyMonths) ? warrantyMonths : 12,
              description,
              imageUrl,
              status: status as 'Active' | 'Inactive'
            };
          })
          .filter(p => p.name && p.sku);
        
        if (validProducts.length > 0) {
          await importProducts(validProducts);
          alert(isAr ? `تم استيراد ${validProducts.length} منتج بنجاح إلى المخازن!` : `${validProducts.length} products imported successfully!`);
        } else {
          alert(isAr ? 'لم يتم العثور على منتجات صالحة في الملف. يرجى التأكد من وجود أعمدة الاسم ورمز المنتج (SKU).' : 'No valid products found in the file. Required columns: name, sku.');
        }
      } catch (error) {
        console.error("Error importing file:", error);
        alert(isAr ? "حدث خطأ أثناء قراءة ملف الإكسيل." : "An error occurred while importing the file.");
      }
    };
    reader.readAsBinaryString(file);
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  const handleLoadOfficialCatalog = async () => {
    if (!window.confirm(isAr ? 'هل تريد تحميل وتعيين كافة منتجات ملف الإكسيل (112 منتج) في المخازن وقاعدة البيانات؟' : 'Do you want to import all 112 official catalog products from the Excel sheet into the inventory database?')) return;
    try {
      const { mockProducts } = await import('../constants');
      await importProducts(mockProducts);
      alert(isAr ? 'تم استيراد وتحديث كافة منتجات ملف الإكسيل (112 منتج) بنجاح في المخازن!' : 'All 112 catalog products imported successfully into the inventory database!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error loading catalog');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Top Header & Global Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {isAr ? 'إدارة المخزون والمستودع' : 'Inventory & Warehouse Management'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {isAr ? 'متابعة حركة المنتجات، الأرصدة، تنبيهات النواقص، ورموز الباركود' : 'Track stock levels, reorder alerts, valuations, and barcode labels'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Barcode Scanner Button */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-100 transition shadow-sm"
            title={isAr ? 'مسح الباركود بالكاميرا' : 'Scan Barcode with Camera'}
          >
            <Scan className="w-4 h-4 text-purple-600" />
            <span>{isAr ? 'ماسح الباركود' : 'Scan Barcode'}</span>
          </button>

          {/* Print Report */}
          <button 
            type="button"
            onClick={() => setIsPrintModalOpen(true)} 
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{isAr ? 'طباعة التقرير' : 'Print Report'}</span>
          </button>

          {/* Export Excel / CSV */}
          <button 
            type="button"
            onClick={handleExport} 
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'تصدير Excel' : 'Export Excel'}</span>
          </button>

          {/* Load Official Excel Catalog */}
          <button
            type="button"
            onClick={handleLoadOfficialCatalog}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-100 transition shadow-sm"
            title={isAr ? "تحميل منتجات الإكسيل الرسمية (112 منتج)" : "Load 112 Excel Catalog Products"}
          >
            <Database className="w-4 h-4 text-purple-600" />
            <span>{isAr ? 'قاعدة منتجات الإكسيل' : 'Excel Catalog'}</span>
          </button>

          {/* Import Excel */}
          <button 
            type="button"
            onClick={() => importInputRef.current?.click()} 
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 transition shadow-sm"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'استيراد' : 'Import'}</span>
          </button>
          <input type="file" ref={importInputRef} style={{ display: 'none' }} onChange={handleImport} accept=".xlsx, .xls" />

          {/* Add Product Button */}
          <button 
            type="button"
            onClick={handleAddProduct}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? '+ إضافة منتج جديد' : '+ New Product'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* KPI 1: Unique Items */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'إجمالي الأصناف' : 'Total Items'}</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{kpis.totalItemsCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'صنف مسجل بالنظام' : 'SKUs registered'}</span>
          </div>
        </div>

        {/* KPI 2: Total Units */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'إجمالي القطع' : 'Stock Units'}</span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{kpis.totalStockUnits}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'قطعة في المستودع' : 'Units available'}</span>
          </div>
        </div>

        {/* KPI 3: Low Stock Warning */}
        <div 
          onClick={() => setStockStatusFilter('low_stock')}
          className={`bg-white dark:bg-slate-800/80 p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between shadow-sm hover:border-amber-400 ${
            stockStatusFilter === 'low_stock' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-slate-700/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">{isAr ? 'مخزون منخفض' : 'Low Stock'}</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{kpis.lowStockCount}</span>
            <span className="text-[10px] text-amber-600 font-bold block mt-0.5">{isAr ? 'تحت حد الطلب' : 'Below threshold'}</span>
          </div>
        </div>

        {/* KPI 4: Out of Stock */}
        <div 
          onClick={() => setStockStatusFilter('out_of_stock')}
          className={`bg-white dark:bg-slate-800/80 p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between shadow-sm hover:border-rose-400 ${
            stockStatusFilter === 'out_of_stock' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">{isAr ? 'نفد من المخزون' : 'Out of Stock'}</span>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-lg">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">{kpis.outOfStockCount}</span>
            <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{isAr ? 'الرصيد 0' : 'Zero units'}</span>
          </div>
        </div>

        {/* KPI 5: Inventory Purchase Value */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'قيمة التكلفة' : 'Cost Value'}</span>
            <div className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white truncate block">
              {formatCurrency(kpis.totalPurchaseValue)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'سعر الشراء الإجمالي' : 'Total cost basis'}</span>
          </div>
        </div>

        {/* KPI 6: Potential Profit */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">{isAr ? 'الربح المتوقع' : 'Potential Margin'}</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 truncate block">
              {formatCurrency(kpis.totalProfit)}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
              +{kpis.profitMarginPercent}% {isAr ? 'هامش ربح' : 'margin'}
            </span>
          </div>
        </div>

      </div>

      {/* Low Stock Alert Notice Banner */}
      {(kpis.lowStockCount > 0 || kpis.outOfStockCount > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">
                {isAr ? 'تنبيه: توجد أصناف تحتاج إلى إعادة طلب فوري من الموردين!' : 'Alert: Low stock items need reordering!'}
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-400/90 mt-0.5">
                {isAr 
                  ? `يوجد ${kpis.lowStockCount} أصناف تحت حد الأمان و ${kpis.outOfStockCount} أصناف نفدت كلياً.` 
                  : `${kpis.lowStockCount} items below safety threshold and ${kpis.outOfStockCount} items out of stock.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsSmartReorderOpen(true)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة طلب ذكي' : 'Smart Reorder'}</span>
            </button>
            {stockStatusFilter !== 'low_stock' && (
              <button
                type="button"
                onClick={() => setStockStatusFilter('low_stock')}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                {isAr ? 'عرض النواقص' : 'Show Low Stock'}
              </button>
            )}
            {stockStatusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStockStatusFilter('all')}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
              >
                {isAr ? 'إلغاء التصفية' : 'Clear Filter'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs (Products vs Analytics vs Expiring Warranties) */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-6 rtl:space-x-reverse" aria-label="Tabs">
          <button 
            onClick={() => setActiveTab('products')} 
            className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              activeTab === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{isAr ? 'قائمة المنتجات والمخزون' : 'Products & Inventory'}</span>
            <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
              {filteredProducts.length}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              activeTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{isAr ? 'تحليلات القيمة المالية' : 'Financial Analytics'}</span>
          </button>

          <button 
            onClick={() => setActiveTab('expiringWarranties')} 
            className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              activeTab === 'expiringWarranties'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'الضمانات المنتهية قريباً' : 'Expiring Warranties'}</span>
            {expiringWarranties.length > 0 && (
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 font-mono font-bold">
                {expiringWarranties.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('forecasting')} 
            className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              activeTab === 'forecasting'
                ? 'border-purple-600 text-purple-700 dark:text-purple-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
            <span>{isAr ? 'التنبؤ الذكي بالنفاد (AI)' : 'AI Run-out Forecasting'}</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black">
              AI ✨
            </span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Products Listing */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          
          {/* Filter & Control Toolbar */}
          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3">
            
            {/* Top Row: Search input + View Mode + Sorter */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث باسم الصنف، الباركود، SKU، التصنيف، أو المورد...' : 'Search by name, SKU, barcode, category, supplier...'}
                  className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sorting, Suppliers & View Mode */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category selector dropdown */}
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                >
                  <option value="all">{isAr ? 'جميع التصنيفات' : 'All Categories'}</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* Supplier selector dropdown */}
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                >
                  <option value="all">{isAr ? 'جميع الموردين' : 'All Suppliers'}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                {/* Sorter */}
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                >
                  <option value="default">{isAr ? 'الترتيب الافتراضي' : 'Default Sorting'}</option>
                  <option value="name-asc">{isAr ? 'الاسم (أ - ي)' : 'Name (A - Z)'}</option>
                  <option value="name-desc">{isAr ? 'الاسم (ي - أ)' : 'Name (Z - A)'}</option>
                  <option value="stock-desc">{isAr ? 'المخزون: الأعلى للأقل' : 'Stock: High to Low'}</option>
                  <option value="stock-asc">{isAr ? 'المخزون: الأقل للأعلى' : 'Stock: Low to High'}</option>
                  <option value="price-desc">{isAr ? 'السعر: الأعلى للأقل' : 'Price: High to Low'}</option>
                  <option value="price-asc">{isAr ? 'السعر: الأقل للأعلى' : 'Price: Low to High'}</option>
                  <option value="profit-desc">{isAr ? 'الربح: الأعلى للأقل' : 'Profit: High to Low'}</option>
                </select>

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
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Quick Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-bold px-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>{isAr ? 'الحالة:' : 'Status:'}</span>
              </span>

              {[
                { id: 'all', label: isAr ? 'الكل' : 'All', count: products.length },
                { id: 'in_stock', label: isAr ? 'متوفر' : 'In Stock', count: products.filter(p => p.status === 'Active' && p.stock > (p.lowStockThreshold || 10)).length },
                { id: 'low_stock', label: isAr ? 'مخزون منخفض' : 'Low Stock', count: kpis.lowStockCount },
                { id: 'out_of_stock', label: isAr ? 'نفد من المخزون' : 'Out of Stock', count: kpis.outOfStockCount },
                { id: 'inactive', label: isAr ? 'معطل' : 'Inactive', count: products.filter(p => p.status === 'Inactive').length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStockStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    stockStatusFilter === tab.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    stockStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

          </div>

          {/* Bulk Action Bar (when items selected) */}
          {selectedProductIds.size > 0 && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between animate-fade-in text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary">
                  {isAr ? `تم تحديد ${selectedProductIds.size} صنف` : `${selectedProductIds.size} products selected`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                >
                  {isAr ? 'تصدير المحدد فقط' : 'Export Selected'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProductIds(new Set())}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-700 transition"
                >
                  {isAr ? 'إلغاء التحديد' : 'Clear'}
                </button>
              </div>
            </div>
          )}

          {/* Results count & Delete All */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <div>
              {isAr ? `عرض ${filteredProducts.length} من أصل ${products.length} صنف` : `Showing ${filteredProducts.length} of ${products.length} products`}
            </div>
            {products.length > 0 && (
              <button 
                onClick={async () => {
                  if (window.confirm(t('inventory.delete_all_products_confirm'))) {
                    setIsDeletingAll(true);
                    try {
                      await Promise.all(products.map(p => deleteProduct(p.id)));
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsDeletingAll(false);
                    }
                  }
                }}
                disabled={isDeletingAll}
                className="text-rose-500 hover:text-rose-700 font-medium transition"
              >
                {isDeletingAll ? '...' : t('inventory.delete_all_products')}
              </button>
            )}
          </div>

          {/* Main View: Table vs Grid Cards */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'لا توجد منتجات مطابقة لخيارات البحث والتصفية' : 'No products match your search or filter'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {isAr ? 'جرب تغيير عبارة البحث أو إزالة بعض الفلاتر' : 'Try clearing your search or filters'}
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setStockStatusFilter('all'); setSelectedCategory('all'); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                {isAr ? 'إعادة ضبط التصفية' : 'Reset Filters'}
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* Enhanced Table View */
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left rtl:text-right">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                          onChange={handleToggleSelectAll}
                          className="rounded border-slate-300"
                        />
                      </th>
                      <th className="p-3 w-12">{t('inventory.table.image')}</th>
                      <th className="p-3 w-14 text-center">{t('inventory.table.qr_code')}</th>
                      <th className="p-3">{t('inventory.table.product_name')}</th>
                      <th className="p-3">{t('inventory.table.sku')}</th>
                      <th className="p-3">{t('inventory.table.category')}</th>
                      <th className="p-3">{t('inventory.table.supplier')}</th>
                      <th className="p-3 text-right rtl:text-left">{t('inventory.table.price')}</th>
                      <th className="p-3 text-right rtl:text-left">{t('inventory.table.net_profit')}</th>
                      <th className="p-3 text-center min-w-[140px]">{t('inventory.table.stock')}</th>
                      <th className="p-3 text-center">{t('inventory.table.status')}</th>
                      <th className="p-3 text-center w-36">{t('inventory.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {filteredProducts.map(product => {
                      const isLowStock = product.status === 'Active' && product.stock <= (product.lowStockThreshold || 10) && product.stock > 0;
                      const isOutOfStock = product.status === 'Active' && product.stock === 0;
                      const scanValue = product.barcode || product.sku || product.id;
                      const profitVal = (product.salePrice || 0) - (product.purchasePrice || 0);
                      const profitMargin = product.purchasePrice > 0 ? Math.round((profitVal / product.purchasePrice) * 100) : 0;
                      const threshold = product.lowStockThreshold || 10;
                      const stockPercentage = Math.min(100, Math.round(((product.stock || 0) / (threshold * 3)) * 100));

                      return (
                        <tr 
                          key={product.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition ${product.status === 'Inactive' ? 'opacity-60 bg-slate-50/50' : ''}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.has(product.id)}
                              onChange={() => handleToggleSelectOne(product.id)}
                              className="rounded border-slate-300"
                            />
                          </td>

                          {/* Image */}
                          <td className="p-3">
                            {product.imageUrl ? (
                              <StorageImage src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </td>

                          {/* QR Code */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedProductForQr(product)}
                              className="inline-flex flex-col items-center justify-center p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                              title={isAr ? 'عرض وطباعة رمز QR' : 'View & Print QR Code'}
                            >
                              <ProductQrCode value={scanValue} size={32} />
                            </button>
                          </td>

                          {/* Product Name */}
                          <td className="p-3 font-semibold text-slate-900 dark:text-white max-w-[200px]">
                            <div className="truncate font-bold">{product.name}</div>
                            {product.barcode && (
                              <div className="text-[10px] text-slate-400 font-mono">Barcode: {product.barcode}</div>
                            )}
                          </td>

                          {/* SKU */}
                          <td className="p-3 font-mono text-slate-500 font-semibold">{product.sku}</td>

                          {/* Category */}
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                              {product.category || '-'}
                            </span>
                          </td>

                          {/* Supplier */}
                          <td className="p-3 text-slate-500">{getSupplierName(product.supplierId)}</td>

                          {/* Sale Price */}
                          <td className="p-3 text-right rtl:text-left font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(product.salePrice)}
                          </td>

                          {/* Net Profit & Margin */}
                          <td className="p-3 text-right rtl:text-left font-mono">
                            <div className={`font-bold ${profitVal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatCurrency(profitVal)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {profitMargin > 0 ? `+${profitMargin}%` : `${profitMargin}%`}
                            </div>
                          </td>

                          {/* Stock Level with Progress Bar & Quick Adjust */}
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="text-center min-w-[50px]">
                                <span className={`font-mono text-sm font-black ${
                                  isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900 dark:text-white'
                                }`}>
                                  {product.stock || 0}
                                </span>
                                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mx-auto mt-1">
                                  <div 
                                    className={`h-full rounded-full ${
                                      isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.max(5, stockPercentage)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Quick stock +/- button */}
                              <button
                                type="button"
                                onClick={() => setSelectedProductForQuickStock(product)}
                                className="p-1 text-primary hover:bg-primary/10 rounded-lg transition"
                                title={isAr ? 'تعديل سريع للمخزون (+/-)' : 'Quick Adjust Stock (+/-)'}
                              >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                              product.status === 'Inactive' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                              isOutOfStock ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              isLowStock ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {
                                product.status === 'Inactive' ? (isAr ? 'معطل' : 'Inactive') :
                                isOutOfStock ? (isAr ? 'نفد' : 'Out of Stock') :
                                isLowStock ? (isAr ? 'منخفض' : 'Low Stock') :
                                (isAr ? 'متوفر' : 'In Stock')
                              }
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedProduct(product)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                                title={t('inventory.table.details')}
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedProductForQuickStock(product)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                                title={isAr ? 'تعديل المخزون' : 'Adjust Stock'}
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEditProduct(product)}
                                className="p-1.5 text-slate-600 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                title={t('general.edit')}
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(product)}
                                className={`p-1.5 rounded-lg transition ${
                                  product.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={product.status === 'Active' ? t('general.deactivate') : t('general.activate')}
                              >
                                {product.status === 'Active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                title={t('general.delete')}
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
            /* Enhanced Grid Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const isLowStock = product.status === 'Active' && product.stock <= (product.lowStockThreshold || 10) && product.stock > 0;
                const isOutOfStock = product.status === 'Active' && product.stock === 0;
                const profitVal = (product.salePrice || 0) - (product.purchasePrice || 0);

                return (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-4 hover:border-primary/50 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar with SKU and Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {product.sku}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          product.status === 'Inactive' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                          isOutOfStock ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          isLowStock ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {
                            product.status === 'Inactive' ? (isAr ? 'معطل' : 'Inactive') :
                            isOutOfStock ? (isAr ? 'نفد' : 'Out of Stock') :
                            isLowStock ? (isAr ? 'منخفض' : 'Low Stock') :
                            (isAr ? 'متوفر' : 'In Stock')
                          }
                        </span>
                      </div>

                      {/* Image Thumbnail */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-750 mb-3 flex items-center justify-center">
                        {product.imageUrl ? (
                          <StorageImage src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-10 h-10 text-slate-400" />
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedProductForQr(product)}
                          className="absolute top-2 right-2 rtl:right-auto rtl:left-2 p-1.5 bg-white/90 dark:bg-slate-900/90 rounded-lg shadow-sm text-slate-700 dark:text-slate-200 hover:scale-110 transition"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Product Name & Category */}
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 mb-1" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-xs text-slate-500 mb-3">
                        {product.category || (isAr ? 'غير مصنف' : 'Uncategorized')} • {getSupplierName(product.supplierId)}
                      </p>

                      {/* Stock Level Card */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 mb-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{isAr ? 'الرصيد بالمستودع:' : 'Warehouse Stock:'}</span>
                          <span className={`text-base font-black font-mono ${
                            isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900 dark:text-white'
                          }`}>
                            {product.stock || 0} {isAr ? 'قطعة' : 'units'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedProductForQuickStock(product)}
                          className="px-2.5 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition"
                        >
                          {isAr ? 'تعديل + / -' : 'Adjust'}
                        </button>
                      </div>

                      {/* Pricing Info */}
                      <div className="flex justify-between items-baseline text-xs mb-3">
                        <div>
                          <span className="text-slate-400 text-[10px] block">{isAr ? 'سعر البيع:' : 'Price:'}</span>
                          <span className="font-black text-sm font-mono text-primary">
                            {formatCurrency(product.salePrice)}
                          </span>
                        </div>
                        <div className="text-right rtl:text-left">
                          <span className="text-slate-400 text-[10px] block">{isAr ? 'صافي الربح:' : 'Profit:'}</span>
                          <span className="font-bold text-xs font-mono text-emerald-600">
                            +{formatCurrency(profitVal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="flex-1 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl transition text-center"
                      >
                        {isAr ? 'تفاصيل' : 'Details'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="p-1.5 text-slate-600 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                        title={t('general.edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(product)}
                        className={`p-1.5 rounded-xl transition ${
                          product.status === 'Active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={product.status === 'Active' ? t('general.deactivate') : t('general.activate')}
                      >
                        {product.status === 'Active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                        title={t('general.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Tab 2: Financial Analytics Dashboard */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Purchase Value */}
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                  <Package className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{t('inventory.total_purchase_value')}</span>
              </div>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {formatCurrency(kpis.totalPurchaseValue)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? 'رأس المال المستثمر في بضاعة المستودع' : 'Total capital tied up in inventory'}
              </p>
            </div>

            {/* Sale Value */}
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{t('inventory.total_sale_value')}</span>
              </div>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {formatCurrency(kpis.totalSaleValue)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? 'القيمة المتوقعة عند بيع كامل المخزون' : 'Gross expected revenue upon full liquidation'}
              </p>
            </div>

            {/* Profit Margin */}
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{t('inventory.total_potential_profit')}</span>
              </div>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {formatCurrency(kpis.totalProfit)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? `هامش ربح إجمالي يقدر بـ +${kpis.profitMarginPercent}%` : `Overall estimated margin of +${kpis.profitMarginPercent}%`}
              </p>
            </div>

          </div>

          {/* Bar Chart Visual */}
          <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>{isAr ? 'مقارنة رأس المال والقيمة البيعية والأرباح' : 'Cost vs. Sale vs. Profit Comparison'}</span>
            </h4>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={kpis.chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    width={120}
                    tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                    }}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40}>
                    {kpis.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Expiring Warranties */}
      {activeTab === 'expiringWarranties' && (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? 'قائمة المنتجات المبيعة ذات الضمانات المنتهية قريباً (خلال 30 يوماً)' : 'Sold Products with Warranties Expiring within 30 Days'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5">{t('inventory.table.product_name')}</th>
                  <th className="p-3.5">{t('inventory.expiring_table.customer')}</th>
                  <th className="p-3.5">{t('inventory.expiring_table.invoice')}</th>
                  <th className="p-3.5">{t('inventory.expiring_table.expiry_date')}</th>
                  <th className="p-3.5 text-center">{t('inventory.expiring_table.remaining')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {expiringWarranties.map(({ product, customer, order, expiryDate, remainingDays }, index) => (
                  <tr key={`${order.id}-${product.id}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-750/50">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{product.name}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      <div>{customer?.name || 'N/A'}</div>
                      {customer?.phone && <div className="text-[10px] text-slate-400 font-mono">{customer.phone}</div>}
                    </td>
                    <td className="p-3.5 font-mono text-primary font-bold">{order.orderNumber}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{formatDate(expiryDate.toISOString())}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {remainingDays} {t('inventory.expiring_table.days')}
                      </span>
                    </td>
                  </tr>
                ))}
                {expiringWarranties.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      {t('inventory.no_expiring_warranties')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: AI Inventory Run-out Forecasting */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-4 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between text-rose-800 dark:text-rose-300">
                <span className="text-xs font-bold">{isAr ? 'أصناف حرجة توشك على النفاد (خلال 7 أيام)' : 'Critical Items (< 7 Days)'}</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-2xl font-black font-mono text-rose-700 dark:text-rose-300 block mt-2">
                {inventoryForecasts.filter(f => f.urgency === 'حرجة (خلال أسبوع)').length}
              </span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 block font-medium">
                {isAr ? 'يتطلب إصدار أمر شراء عاجل فوراً' : 'Urgent purchase order required'}
              </span>
            </div>

            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
                <span className="text-xs font-bold">{isAr ? 'أصناف متوسطة الأولوية (خلال 30 يوم)' : 'Medium Priority (< 30 Days)'}</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl font-black font-mono text-amber-700 dark:text-amber-300 block mt-2">
                {inventoryForecasts.filter(f => f.urgency === 'متوسطة (خلال شهر)').length}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block font-medium">
                {isAr ? 'يُنصح بجدولة التوريد مع الموردين' : 'Schedule reorders with vendors'}
              </span>
            </div>

            <div className="bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 p-4 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between text-purple-800 dark:text-purple-300">
                <span className="text-xs font-bold">{isAr ? 'إجمالي الكميات المقترحة للتوريد' : 'Recommended Reorder Units'}</span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-2xl font-black font-mono text-purple-700 dark:text-purple-300 block mt-2">
                {inventoryForecasts.reduce((acc, f) => acc + f.suggestedReorderQuantity, 0)} {isAr ? 'قطعة' : 'units'}
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 block font-medium">
                {isAr ? 'محسوبة وفق معدل حركة المبيعات الفعلية' : 'Based on real sales velocity'}
              </span>
            </div>
          </div>

          {/* Forecasts Table */}
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>{isAr ? 'جدول التنبؤ الذكي بمواعيد نفاد المخزون وإعادة الطلب' : 'AI Stockout & Reorder Forecast Schedule'}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? 'خوارزمية الذكاء الاصطناعي تحلل سرعة بيع كل صنف (60 يوماً) وتتوقع تاريخ النفاد التقديري' : 'AI algorithm models product burn rate over 60 days to predict exact stockout dates'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5">{isAr ? 'المنتج' : 'Product'}</th>
                    <th className="p-3.5 text-center">{isAr ? 'الرصيد الحالي' : 'Stock'}</th>
                    <th className="p-3.5 text-center">{isAr ? 'معدل البيع اليومي' : 'Daily Velocity'}</th>
                    <th className="p-3.5 text-center">{isAr ? 'الأيام المتبقية' : 'Days Remaining'}</th>
                    <th className="p-3.5 text-center">{isAr ? 'تاريخ النفاد المتوقع' : 'Estimated Run-out'}</th>
                    <th className="p-3.5 text-center">{isAr ? 'درجة الخطورة' : 'Urgency'}</th>
                    <th className="p-3.5 text-center">{isAr ? 'الكمية المقترحة للطلب' : 'Suggested Reorder'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {inventoryForecasts.map((f, idx) => (
                    <tr key={f.product.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{f.product.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{f.product.sku || f.product.category}</div>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold">
                        <span className={f.product.stock <= 5 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}>
                          {f.product.stock}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-600 dark:text-slate-300">
                        {f.dailySalesVelocity.toFixed(2)} / {isAr ? 'يوم' : 'day'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold">
                        <span className={f.daysRemaining <= 7 ? 'text-rose-600 font-black' : f.daysRemaining <= 30 ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'}>
                          {f.daysRemaining > 999 ? '999+' : `${f.daysRemaining} ${isAr ? 'يوم' : 'days'}`}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {f.estimatedRunOutDate}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                          f.urgency === 'حرجة (خلال أسبوع)'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : f.urgency === 'متوسطة (خلال شهر)'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {f.urgency}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-black text-purple-700 dark:text-purple-300">
                        +{f.suggestedReorderQuantity} {isAr ? 'قطعة' : 'units'}
                      </td>
                    </tr>
                  ))}
                  {inventoryForecasts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        {isAr ? 'لا توجد بيانات حركة مبيعات كافية لاحتساب التنبؤ بعد.' : 'No sales velocity data yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)}
          supplierName={getSupplierName(selectedProduct.supplierId)} 
        />
      )}

      {isModalOpen && (
        <AddEditProductModal 
          suppliers={suppliers}
          onClose={handleCloseAddEditModal}
          onSave={handleSaveProduct}
          productToEdit={productToEdit}
          isSaving={isSavingProduct}
        />
      )}

      {isPrintModalOpen && (
        <PrintInventoryModal 
          products={products}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {selectedProductForQr && (
        <ProductQrModal 
          product={selectedProductForQr}
          onClose={() => setSelectedProductForQr(null)}
        />
      )}

      {selectedProductForQuickStock && (
        <QuickStockModal
          product={selectedProductForQuickStock}
          onClose={() => setSelectedProductForQuickStock(null)}
        />
      )}

      {isScannerOpen && (
        <BarcodeScannerModal
          products={products}
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onSelectProduct={(p) => {
            setSelectedProduct(p);
          }}
        />
      )}

      {isSmartReorderOpen && (
        <SmartReorderModal
          isOpen={isSmartReorderOpen}
          onClose={() => setIsSmartReorderOpen(false)}
          products={products}
          suppliers={suppliers}
        />
      )}

    </div>
  );
};

export default InventoryScreen;
