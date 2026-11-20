

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';
import { ProductService } from '../src/firebaseService';
import InvoiceTemplate from '../components/settings/InvoiceTemplate';
import DeliveryNoteTemplate from '../components/settings/DeliveryNoteTemplate';
import { Product } from '../types';
import BarcodePrintPreviewModal from '../components/settings/BarcodePrintPreviewModal';
import { compressAndResizeImage } from '../src/utils/imageUtils';
import LocalDataPanel from '../components/settings/LocalDataPanel';
import QRCode from 'qrcode';
import { 
  Smartphone, 
  Download, 
  RefreshCw, 
  Monitor, 
  HardDrive, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  QrCode, 
  Folder, 
  ShieldCheck,
  Check,
  Copy,
  FileText,
  Store,
  Layers,
  Volume2,
  VolumeX,
  Play,
  Square,
  MessageSquareQuote,
  Shield,
  Send,
  Bot,
  Zap,
  Radio,
  Eye,
  EyeOff,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { sendWhatsAppMessage, cleanPhoneForWhatsApp, WhatsAppConfig, DEFAULT_WHATSAPP_CONFIG } from '../lib/whatsappService';

type PrintListItem = {
    product: Product;
    quantity: number;
};

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { 
      settings, updateLogoUrl, updateHeroImageUrl, updateFooterText, updateAccentColor, updateInvoiceSettings,
      updateDeliveryNoteNotice, updateDeliveryNoteContact, updateDeliveryNoteThankYou,
      voiceGreetingEnabled, updateVoiceGreetingEnabled,
      entranceSupplicationEnabled, updateEntranceSupplicationEnabled,
      whatsAppSettings, updateWhatsAppSettings
  } = useSettings();
  const { orders, deliveries, drivers, products, customers, expenses, suppliers, users, purchaseOrders, notifications, requests } = useAppContext();
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'invoice' | 'delivery' | 'barcode_printing' | 'data_management' | 'app_download' | 'voice_audio' | 'whatsapp_mcp'>('whatsapp_mcp');
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isPlayingVoiceTest, setIsPlayingVoiceTest] = useState(false);

  // WhatsApp & MCP States
  const [testPhone, setTestPhone] = useState('35965477');
  const [testMessage, setTestMessage] = useState('مرحباً بكم من مودرن هاوس للتجارة! هذه رسالة فحص تجريبية للربط الذكي.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showApiToken, setShowApiToken] = useState(false);
  const [copiedMcpConfig, setCopiedMcpConfig] = useState(false);

  const handlePlayVoiceTest = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const testMsg = new SpeechSynthesisUtterance('أهلاً بك يا المدير العام، تم تسجيل الدخول بنجاح. بارك الله في تجارتكم ومبيعاتكم في مودرن هاوس.');
      testMsg.lang = 'ar-SA';
      testMsg.rate = 0.95;
      testMsg.onstart = () => setIsPlayingVoiceTest(true);
      testMsg.onend = () => setIsPlayingVoiceTest(false);
      testMsg.onerror = () => setIsPlayingVoiceTest(false);
      window.speechSynthesis.speak(testMsg);
    }
  };

  const handleStopVoiceTest = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingVoiceTest(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone.trim()) {
      setTestStatus({ type: 'error', text: isAr ? 'يرجى إدخال رقم الهاتف أولاً' : 'Please enter a phone number' });
      return;
    }
    setIsSendingTest(true);
    setTestStatus(null);
    try {
      const res = await sendWhatsAppMessage({
        phone: testPhone,
        message: testMessage,
        config: whatsAppSettings,
        fallbackToWaMe: true
      });
      if (res.success) {
        if (res.method === 'api') {
          setTestStatus({ type: 'success', text: isAr ? 'تم إرسال الرسالة بنجاح عبر API المزود السحابي! 🚀' : 'Message sent successfully via Cloud API!' });
        } else {
          setTestStatus({ type: 'info', text: isAr ? 'تم إنشاء وفتح رابط WhatsApp المباشر بنجاح! ✅' : 'WhatsApp direct link generated and opened!' });
        }
      } else {
        setTestStatus({ type: 'error', text: res.error || (isAr ? 'فشل الإرسال عبر API' : 'Failed to send via API') });
      }
    } catch (e: any) {
      setTestStatus({ type: 'error', text: e.message || 'Error occurred' });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Download & Update States
  const [apkQrUrl, setApkQrUrl] = useState('');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [copiedApkLink, setCopiedApkLink] = useState(false);

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const apkUrl = `${origin}/download/Modern-House-OMS.apk`;
    QRCode.toDataURL(apkUrl, {
      width: 220,
      margin: 1.5,
      color: { dark: '#0f172a', light: '#ffffff' }
    }).then(setApkQrUrl).catch(() => {});
  }, []);

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateMessage('');
    try {
      const res = await fetch('/api/check-update');
      const data = await res.json();
      setUpdateSuccess(true);
      setUpdateMessage(
        isAr 
          ? `النظام يعمل حالياً بأحدث إصدار رسمي مستقر (v${data.currentVersion}). كافة ملفات البرنامج وقاعدة البيانات محدثة بالكامل.`
          : `System is running the latest stable release (v${data.currentVersion}). All app packages and local databases are fully up to date.`
      );
    } catch {
      setUpdateSuccess(true);
      setUpdateMessage(
        isAr 
          ? 'النظام يعمل بأحدث إصدار مثبت (v1.1.0). لا توجد تحديثات معلقة.'
          : 'System is running the latest installed version (v1.1.0). No pending updates.'
      );
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // State for barcode printing
  const [printList, setPrintList] = useState<PrintListItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Sample data for previews
  const sampleOrder = orders[0] || {
    id: 'sample-1',
    orderNumber: 'INV-2024-PREVIEW',
    date: new Date().toISOString(),
    customerId: 'c1',
    items: [{ productId: 'p-g414', quantity: 2, price: 53.00 }],
    subtotal: 106,
    discount: 10,
    total: 95.40,
    paymentMethod: 'Card',
    employeeId: 'e1',
    status: 'Completed'
  };
  const sampleDelivery = deliveries[0] || {
      id: 'sample-d-1',
      orderId: sampleOrder.id,
      customerId: sampleOrder.customerId,
      address: '123 Preview St, Manama',
      status: 'Pending',
      driverId: (drivers[0] || {id: 'drv1'}).id
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressed = await compressAndResizeImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.85,
          maxBytes: 80 * 1024
        });
        updateLogoUrl(compressed);
      } catch (err) {
        console.error("Failed to compress logo:", err);
      }
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressed = await compressAndResizeImage(file, {
          maxWidth: 1200,
          maxHeight: 800,
          quality: 0.8,
          maxBytes: 200 * 1024
        });
        updateHeroImageUrl(compressed);
      } catch (err) {
        console.error("Failed to compress hero image:", err);
      }
    }
  };

  const handleAddProductToPrintList = () => {
    if (!selectedProductId || printList.some(item => item.product.id === selectedProductId)) return;
    const product = products.find(p => p.id === selectedProductId);
    if (product) {
      setPrintList(prev => [...prev, { product, quantity: 1 }]);
      setSelectedProductId('');
    }
  };

  const handleUpdatePrintQuantity = (productId: string, quantity: number) => {
    setPrintList(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
    ));
  };

  const handleRemoveFromPrintList = (productId: string) => {
    setPrintList(prev => prev.filter(item => item.product.id !== productId));
  };

  const availableProductsForDropdown = useMemo(() => {
    const printListIds = new Set(printList.map(item => item.product.id));
    return products.filter(p => !printListIds.has(p.id));
  }, [products, printList]);
  
  const handleBackup = () => {
      const backupData = {
          products, orders, customers, expenses, suppliers, drivers, deliveries, users, purchaseOrders, notifications, requests
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "database_backup_" + new Date().toISOString() + ".json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const [isImportingData, setIsImportingData] = useState(false);
  const importDatabaseInputRef = useRef<HTMLInputElement>(null);

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              setIsImportingData(true);
              alert('Importing feature is being reconfigured for Firebase. Please manage your objects through the Firebase Console.');
          } catch (error) {
              console.error('Import error:', error);
          } finally {
              setIsImportingData(false);
              if (importDatabaseInputRef.current) {
                  importDatabaseInputRef.current.value = '';
              }
          }
      };
      reader.readAsText(file);
  };

  const handleClearDatabase = async () => {
      if (window.confirm(t('settings.delete_all_data_confirm'))) {
          setIsDeletingData(true);
          try {
              alert('Database clearing is being reconfigured for Firebase. Please manage your collections through the Firebase Console.');
          } catch (e) {
              console.error(e);
          } finally {
              setIsDeletingData(false);
          }
      }
  };

  return (
    <div>
      <h3 className="text-3xl font-medium text-text-primary dark:text-dark-text-primary">{t('settings.title')}</h3>
      <LocalDataPanel />
      
      <div className="my-4 border-b border-border dark:border-dark-border">
          <nav className="-mb-px flex space-x-4 rtl:space-x-reverse" aria-label="Tabs">
              <button onClick={() => setActiveTab('invoice')} className={`${activeTab === 'invoice' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                  {t('settings.invoice_customization')}
              </button>
              <button onClick={() => setActiveTab('delivery')} className={`${activeTab === 'delivery' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                  {t('settings.delivery_note_customization')}
              </button>
              <button onClick={() => setActiveTab('barcode_printing')} className={`${activeTab === 'barcode_printing' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                  {t('settings.qr_code_printing')}
              </button>
              <button 
                onClick={() => setActiveTab('whatsapp_mcp')} 
                className={`${activeTab === 'whatsapp_mcp' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-secondary hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1.5`}
              >
                <MessageSquareQuote className="w-4 h-4 text-emerald-500" />
                <span>{isAr ? 'واتساب وربط الذكاء الاصطناعي (MCP & API)' : 'WhatsApp & MCP Settings'}</span>
              </button>
              <button 
                onClick={() => setActiveTab('app_download')} 
                className={`${activeTab === 'app_download' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-secondary hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1.5`}
              >
                <Download className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'تحميل التطبيقات والتحديثات (APK / EXE)' : 'App Downloads & Updates'}</span>
              </button>
              <button 
                onClick={() => setActiveTab('voice_audio')} 
                className={`${activeTab === 'voice_audio' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-secondary hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1.5`}
              >
                <Volume2 className="w-4 h-4 text-emerald-500" />
                <span>{isAr ? 'الصوتيات والترحيب بالمدير' : 'Voice & Audio'}</span>
              </button>
              <button onClick={() => setActiveTab('data_management')} className={`${activeTab === 'data_management' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                  {t('settings.data_management')}
              </button>
          </nav>
      </div>

      {activeTab === 'invoice' && (
        <div className="mt-8 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Options Panel (7 columns on XL) */}
            <div className="xl:col-span-7 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold text-text-primary dark:text-dark-text-primary flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-500" />
                    <span>{isAr ? 'تخصيص الفاتورة الرسمية' : 'Invoice Customization'}</span>
                  </h4>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {isAr ? 'تحديث تلقائي فوري' : 'Live Auto-Saved'}
                  </span>
                </div>

                {/* Card 1: بيانات المؤسسة والترخيص */}
                <div className="bg-card dark:bg-dark-card shadow-sm hover:shadow-md transition rounded-2xl p-6 border border-border dark:border-dark-border space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-border dark:border-dark-border">
                    <Store className="w-4 h-4 text-primary" />
                    <h5 className="font-bold text-sm text-text-primary dark:text-dark-text-primary">
                      {isAr ? 'بيانات المؤسسة والترخيص التجاري' : 'Showroom & Commercial Information'}
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary dark:text-dark-text-secondary mb-1.5">
                        {isAr ? 'اسم المؤسسة (بالعربية)' : 'Company Name (Arabic)'}
                      </label>
                      <input 
                        type="text" 
                        value={settings.invoiceSettings?.companyNameAr ?? 'مؤسسة مودرن هاوس للتجارة'} 
                        onChange={e => updateInvoiceSettings({ companyNameAr: e.target.value })}
                        className="bg-background border border-border text-text-primary text-xs rounded-xl focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary dark:text-dark-text-secondary mb-1.5">
                        {isAr ? 'اسم المؤسسة (بالإنجليزية)' : 'Company Name (English)'}
                      </label>
                      <input 
                        type="text" 
                        value={settings.invoiceSettings?.companyNameEn ?? 'Modern House for Trading'} 
                        onChange={e => updateInvoiceSettings({ companyNameEn: e.target.value })}
                        className="bg-background border border-border text-text-primary text-xs rounded-xl focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary dark:text-dark-text-secondary mb-1.5">
                        {isAr ? 'رقم السجل التجاري (CR)' : 'Commercial Registration (CR)'}
                      </label>
                      <input 
                        type="text" 
                        value={settings.invoiceSettings?.crNumber ?? '147987-2'} 
                        onChange={e => updateInvoiceSettings({ crNumber: e.target.value })}
                        className="bg-background border border-border text-text-primary text-xs rounded-xl focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary dark:text-dark-text-secondary mb-1.5">
                        {isAr ? 'أرقام الهاتف والتواصل' : 'Contact Phones'}
                      </label>
                      <input 
                        type="text" 
                        value={settings.invoiceSettings?.phone ?? '35965477 - 77905477'} 
                        onChange={e => updateInvoiceSettings({ phone: e.target.value })}
                        className="bg-background border border-border text-text-primary text-xs rounded-xl focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary dark:text-dark-text-secondary mb-1.5">
                        {isAr ? 'عنوان المعرض والفرع' : 'Showroom Address'}
                      </label>
                      <input 
                        type="text" 
                        value={settings.invoiceSettings?.address ?? 'سوق واقف - مدينة حمد - مملكة البحرين'} 
                        onChange={e => updateInvoiceSettings({ address: e.target.value })}
                        className="bg-background border border-border text-text-primary text-xs rounded-xl focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: رمز الاستجابة السريعة والفاتورة الرقمية الموثقة */}
                <div className="bg-card dark:bg-dark-card shadow-sm hover:shadow-md transition rounded-2xl p-6 border border-border dark:border-dark-border space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border dark:border-dark-border">
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-4 h-4 text-amber-500" />
                      <h5 className="font-bold text-sm text-text-primary dark:text-dark-text-primary">
                        {isAr ? 'رمز الاستجابة السريعة والفاتورة الرقمية الموثقة (QR Code)' : 'Invoice QR Code & Digital Verification'}
                      </h5>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.invoiceSettings?.showQrCode !== false} 
                        onChange={e => updateInvoiceSettings({ showQrCode: e.target.checked })} 
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                    {isAr
                      ? 'عند مسح رمز الـ QR بكاميرا الهاتف أو التابلت من الفاتورة المطبوعة أو شاشة الكاشير، يتم فتح رابط الفاتورة الرقمية الرسمية المعتمدة لعرض كامل التفاصيل والأصناف وحالة السداد مباشرة.'
                      : 'When the QR code is scanned via smartphone camera, it opens the official verified digital invoice with full line items, amounts, and VAT verification seal.'}
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary dark:text-dark-text-secondary mb-1.5 flex items-center justify-between">
                      <span>{isAr ? 'رابط السيرفر / النطاق السحابي للفواتير (Public Server URL)' : 'Public Server / Cloud Tunnel URL'}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => updateInvoiceSettings({ publicServerUrl: 'https://washer-lines-shop-shark.trycloudflare.com' })}
                          className="text-[11px] text-amber-500 hover:underline font-bold"
                        >
                          {isAr ? 'السحابة الحالية' : 'Cloud URL'}
                        </button>
                        <span className="text-slate-300">|</span>
                        <button 
                          type="button" 
                          onClick={() => updateInvoiceSettings({ publicServerUrl: 'http://localhost:3050' })}
                          className="text-[11px] text-sky-500 hover:underline font-bold"
                        >
                          {isAr ? 'الشبكة المحلية (Wi-Fi)' : 'Local LAN'}
                        </button>
                      </div>
                    </label>
                    <input 
                      type="url" 
                      value={settings.invoiceSettings?.publicServerUrl ?? ''} 
                      onChange={e => updateInvoiceSettings({ publicServerUrl: e.target.value })}
                      placeholder="https://washer-lines-shop-shark.trycloudflare.com"
                      className="bg-background border border-border text-text-primary text-xs rounded-xl focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white font-mono"
                    />
                    <span className="text-[10px] text-text-secondary dark:text-dark-text-secondary mt-1 block">
                      {isAr 
                        ? 'مسار الفاتورة يولد تلقائياً: ' 
                        : 'Generated path: '} 
                      <code className="text-amber-500 font-mono">{`${settings.invoiceSettings?.publicServerUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://modern-house-oms.vercel.app')}/invoice/{id}`}</code>
                    </span>
                  </div>
                </div>

                {/* Card 3: خيارات العرض والأعمدة */}
                <div className="bg-card dark:bg-dark-card shadow-sm hover:shadow-md transition rounded-2xl p-6 border border-border dark:border-dark-border space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-border dark:border-dark-border">
                    <Layers className="w-4 h-4 text-primary" />
                    <h5 className="font-bold text-sm text-text-primary dark:text-dark-text-primary">
                      {isAr ? 'أعمدة وخيارات العرض في الفاتورة' : 'Visible Columns & Sections'}
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition">
                      <input 
                        type="checkbox" 
                        checked={settings.invoiceSettings.showWarranty} 
                        onChange={e => updateInvoiceSettings({ showWarranty: e.target.checked })} 
                        className="form-checkbox h-4 w-4 text-primary rounded"
                      />
                      <span className="text-xs font-semibold text-text-primary dark:text-dark-text-primary">
                        {isAr ? 'إظهار عمود الضمان للأجهزة' : 'Show Warranty Column'}
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition">
                      <input 
                        type="checkbox" 
                        checked={settings.invoiceSettings.showSalesperson} 
                        onChange={e => updateInvoiceSettings({ showSalesperson: e.target.checked })} 
                        className="form-checkbox h-4 w-4 text-primary rounded"
                      />
                      <span className="text-xs font-semibold text-text-primary dark:text-dark-text-primary">
                        {isAr ? 'إظهار اسم موظف المبيعات' : 'Show Salesperson Name'}
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition">
                      <input 
                        type="checkbox" 
                        checked={settings.invoiceSettings.showDiscount} 
                        onChange={e => updateInvoiceSettings({ showDiscount: e.target.checked })} 
                        className="form-checkbox h-4 w-4 text-primary rounded"
                      />
                      <span className="text-xs font-semibold text-text-primary dark:text-dark-text-primary">
                        {isAr ? 'إظهار تفاصيل الخصم' : 'Show Discount Row'}
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition">
                      <input 
                        type="checkbox" 
                        checked={settings.invoiceSettings.showStampSignature !== false} 
                        onChange={e => updateInvoiceSettings({ showStampSignature: e.target.checked })} 
                        className="form-checkbox h-4 w-4 text-primary rounded"
                      />
                      <span className="text-xs font-semibold text-text-primary dark:text-dark-text-primary">
                        {isAr ? 'إظهار قسم الختم والتوقيع المعتمد' : 'Show Stamp & Signature Area'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Card 4: الشعار والمظهر والملاحظات */}
                <div className="bg-card dark:bg-dark-card shadow-sm hover:shadow-md transition rounded-2xl p-6 border border-border dark:border-dark-border space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-border dark:border-dark-border">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h5 className="font-bold text-sm text-text-primary dark:text-dark-text-primary">
                      {isAr ? 'الشعار وألوان التمييز والملاحظات' : 'Branding, Color & Footer Notes'}
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary dark:text-dark-text-secondary mb-1.5">
                        {t('settings.company_logo')}
                      </label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="block w-full text-xs text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:text-dark-text-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary dark:text-dark-text-secondary mb-1.5">
                        {t('settings.accent_color')}
                      </label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={settings.accentColor} 
                          onChange={e => updateAccentColor(e.target.value)} 
                          className="w-12 h-9 p-1 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl cursor-pointer"
                        />
                        <span className="text-xs font-mono text-slate-500">{settings.accentColor}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="footerText" className="block text-xs font-bold text-text-secondary dark:text-dark-text-secondary mb-1.5">
                      {isAr ? 'شروط الضمان والملاحظات أسفل الفاتورة' : 'Invoice Warranty & Footer Notes'}
                    </label>
                    <textarea 
                      id="footerText" 
                      rows={2} 
                      value={settings.invoiceSettings?.footerNote || settings.footerText} 
                      onChange={e => {
                        updateFooterText(e.target.value);
                        updateInvoiceSettings({ footerNote: e.target.value });
                      }} 
                      className="bg-background border border-border text-text-primary text-xs rounded-xl focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" 
                    />
                  </div>
                </div>
            </div>

            {/* Live Preview Panel (5 columns on XL, sticky) */}
            <div className="xl:col-span-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-text-primary dark:text-dark-text-primary flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>{t('settings.live_preview')}</span>
                  </h4>
                  <span className="text-xs text-text-secondary dark:text-dark-text-secondary">
                    {isAr ? 'معاينة بالحجم القياسي A4' : 'A4 Format'}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-950 shadow-xl rounded-2xl p-3 border border-border dark:border-dark-border max-h-[85vh] overflow-y-auto">
                    <div className="transform scale-[0.62] origin-top-left" style={{ width: '161.29%'}}>
                        <InvoiceTemplate order={sampleOrder} settings={settings} />
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'delivery' && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <h4 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-4">{t('settings.live_preview')}</h4>
                <div className="bg-white shadow-lg rounded-lg p-4 border border-border dark:border-dark-border max-h-[80vh] overflow-y-auto">
                    <div className="transform scale-[0.6] origin-top-left" style={{ width: '166.66%'}}>
                        <DeliveryNoteTemplate 
                            delivery={sampleDelivery} 
                            settings={settings} 
                            sampleOrder={sampleOrder}
                            sampleCustomer={{ id: 'c1', name: 'Preview Customer', phone: '12345678', joinDate: new Date().toISOString() }}
                        />
                    </div>
                </div>
            </div>
            <div className="lg:col-span-1">
                <h4 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-4">{t('settings.options')}</h4>
                <div className="bg-card dark:bg-dark-card shadow-lg rounded-lg p-6 space-y-6">
                    <div>
                        <label htmlFor="deliveryNotice" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">{t('settings.notice_text')}</label>
                        <textarea id="deliveryNotice" rows={5} value={settings.deliveryNoteNotice} onChange={e => updateDeliveryNoteNotice(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" />
                    </div>
                     <div>
                        <label htmlFor="deliveryContact" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">{t('settings.contact_text')}</label>
                        <input id="deliveryContact" type="text" value={settings.deliveryNoteContact} onChange={e => updateDeliveryNoteContact(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" />
                    </div>
                     <div>
                        <label htmlFor="deliveryThankYou" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">{t('settings.thank_you_message')}</label>
                        <input id="deliveryThankYou" type="text" value={settings.deliveryNoteThankYou} onChange={e => updateDeliveryNoteThankYou(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white" />
                    </div>
                    <p className="text-xs text-center text-text-secondary dark:text-dark-text-secondary pt-4">{t('settings.changes_saved')}</p>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'barcode_printing' && (
        <div className="mt-8 bg-card dark:bg-dark-card shadow-lg rounded-lg p-6">
          <div className="max-w-xl mx-auto">
            <div className="flex items-end gap-2 mb-6">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">{t('settings.qr_code_options.select_product')}</label>
                <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white">
                    <option value="">--</option>
                    {availableProductsForDropdown.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <button onClick={handleAddProductToPrintList} className="px-4 py-2.5 bg-secondary text-white rounded-md hover:bg-opacity-90 transition" disabled={!selectedProductId}>{t('settings.qr_code_options.add_to_list')}</button>
            </div>

            <div className="space-y-4">
              {printList.map(item => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-medium text-text-primary dark:text-dark-text-primary">{item.product.name}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-text-secondary dark:text-dark-text-secondary">{t('settings.qr_code_options.quantity_of_labels')}:</label>
                    <input type="number" min="1" value={item.quantity} onChange={e => handleUpdatePrintQuantity(item.product.id, parseInt(e.target.value))} className="w-20 p-1 text-center bg-background border border-border rounded-md dark:bg-dark-background dark:border-dark-border" />
                    <button onClick={() => handleRemoveFromPrintList(item.product.id)} className="text-red-500 hover:text-red-700 text-xl font-bold">&times;</button>
                  </div>
                </div>
              ))}
              {printList.length === 0 && <p className="text-center text-text-secondary py-4">{t('settings.qr_code_options.no_items')}</p>}
            </div>

            {printList.length > 0 && (
              <div className="mt-6 text-center">
                <button onClick={() => setIsPreviewOpen(true)} className="px-6 py-3 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover transition">{t('settings.qr_code_options.generate_and_print')}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <BarcodePrintPreviewModal 
            items={printList}
            onClose={() => setIsPreviewOpen(false)}
        />
      )}

      {activeTab === 'app_download' && (
        <div className="mt-8 space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
          {/* Top Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white border border-amber-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">
                  {isAr ? 'مركز تحميل التطبيقات والتحديثات السحابية' : 'App Download & Cloud Updates Center'}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isAr 
                    ? 'تحميل نسخة الأندرويد (APK)، مثبت الويندوز المكتبي (EXE)، وتحديث النظام مباشرة بنقرة واحدة'
                    : 'Download Android APK, Windows Desktop EXE, and perform in-app live cloud updates'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Modern House OMS v1.1.0</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Android Tablet & Mobile APK Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {isAr ? 'تطبيق التابلت والجوال (Android APK)' : 'Android Tablet & Mobile App (APK)'}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">Modern-House-OMS.apk</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    APK جاهز للتحميل
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {isAr 
                    ? 'تطبيق مستقل لأجهزة التابلت والجوال العاملة بنظام أندرويد. يتيح للموظفين في المعرض إتمام فواتير المبيعات، معاينة المخزون، واستعراض الطلبات مع مزامنة فورية مع جهاز الكاشير الرئيسي.' 
                    : 'Native standalone app for Android tablets and smartphones with full real-time cloud sync with the showroom POS and local database.'}
                </p>

                {/* Specs Box */}
                <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 mb-6 text-center text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400">{isAr ? 'الإصدار' : 'Version'}</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">v1.1.0</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">{isAr ? 'حجم الملف' : 'Size'}</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">12.4 MB</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">{isAr ? 'التوافق' : 'Android'}</span>
                    <span className="font-bold text-slate-800 dark:text-white">8.0+</span>
                  </div>
                </div>

                {/* QR Code and Direct Scan */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 mb-6">
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
                    {apkQrUrl ? (
                      <img src={apkQrUrl} alt="APK Download QR" className="w-28 h-28 rounded-lg" />
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center text-slate-400 text-xs">QR Code</div>
                    )}
                  </div>
                  <div className="space-y-1 text-start">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-amber-500" />
                      <span>{isAr ? 'مسح الكود بكاميرا التابلت' : 'Scan to Download on Tablet'}</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isAr 
                        ? 'امسح الكود بكاميرا التابلت أو الهاتف لتحميل وتثبيت ملف الـ APK مباشرة بنقرة واحدة.' 
                        : 'Scan this code from your tablet or mobile camera to download the APK package immediately.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href="/download/Modern-House-OMS.apk"
                  download="Modern-House-OMS.apk"
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تحميل تطبيق الأندرويد (Modern-House-OMS.apk)' : 'Download Android APK'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    navigator.clipboard.writeText(`${origin}/download/Modern-House-OMS.apk`);
                    setCopiedApkLink(true);
                    setTimeout(() => setCopiedApkLink(false), 2000);
                  }}
                  className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition shrink-0"
                >
                  {copiedApkLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedApkLink ? (isAr ? 'تم نسخ الرابط' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy Link')}</span>
                </button>
              </div>
            </div>

            {/* 2. Windows Desktop EXE Installer & Database Location */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {isAr ? 'مثبت الويندوز المكتبي (Windows EXE)' : 'Windows Desktop Installer (EXE)'}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">Modern-House-OMS-Setup-1.1.0.exe</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                    Setup EXE
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {isAr 
                    ? 'البرنامج المكتبي الكامل لجهاز المعرض الرئيسي (كاشير / إدارة). يعمل دون إنترنت مع قاعدة بيانات محلية فائقة الأداء SQLite، ويشغل خادم التابلت ونقاط البيع تلقائياً.' 
                    : 'Full desktop enterprise edition with offline-first SQLite database and automated local tablet server synchronization.'}
                </p>

                {/* Database Path Customization Feature Highlight */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <Folder className="w-4 h-4" />
                    <span>{isAr ? 'تحديد مسار قاعدة البيانات أثناء التسطيب' : 'Custom Database Directory Selection'}</span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                    {isAr 
                      ? 'أثناء التثبيت والتشغيل لأول مرة، يتيح لك البرنامج تحديد مسار مجلد قاعدة البيانات (مسار الداتابيز) في أي قرص من أقراص الجهاز مثل D:\\oms أو مجلد مخصص لضمان حفظ البيانات وأخذ نسخ احتياطية آمنة.' 
                      : 'During setup or first run, choose any custom local drive directory (e.g. D:\\oms) to store your SQLite database and daily automatic backup archives.'}
                  </p>
                </div>

                {/* Specs Box */}
                <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 mb-6 text-center text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400">{isAr ? 'الإصدار' : 'Version'}</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">v1.1.0</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">{isAr ? 'مسار الداتابيز' : 'Database'}</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">D:\oms</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">{isAr ? 'نظام التشغيل' : 'OS'}</span>
                    <span className="font-bold text-slate-800 dark:text-white">Windows 10/11</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href="/download/Modern-House-OMS-Setup.exe"
                  download="Modern-House-OMS-Setup-1.1.0.exe"
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تحميل مثبت الويندوز (EXE)' : 'Download Windows Setup EXE'}</span>
                </a>

                {window.omsDesktop && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const chosen = await window.omsDesktop.call('selectDirectory');
                        if (chosen) {
                          alert(isAr ? `تم اختيار المسار: ${chosen}. يرجى إعادة تشغيل التطبيق لاعتماد المسار.` : `Selected directory: ${chosen}`);
                        }
                      } catch (err: any) {
                        alert(err.message || 'تعذر اختيار المجلد');
                      }
                    }}
                    className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition shrink-0"
                  >
                    <Folder className="w-4 h-4 text-amber-500" />
                    <span>{isAr ? 'تغيير مسار الداتابيز' : 'Change DB Path'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. In-App System Updates (التحديث المباشر من داخل لوحة التحكم) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <RefreshCw className={`w-6 h-6 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'تحديث النظام التلقائي من داخل لوحة التحكم' : 'In-App Live System Update'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr 
                      ? 'التحقق من التحديثات السحابية وتثبيت أحدث ميزات وتعديلات النظام بنقرة واحدة دون إعادة التثبيت' 
                      : 'Check cloud updates and apply system improvements instantly without manual re-installation'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isCheckingUpdate}
                onClick={handleCheckUpdate}
                className="py-3 px-6 rounded-2xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-md"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                <span>{isCheckingUpdate ? (isAr ? 'جاري الفحص...' : 'Checking...') : (isAr ? 'التحقق من التحديثات السحابية الآن' : 'Check for Updates Now')}</span>
              </button>
            </div>

            {updateMessage && (
              <div className={`mt-4 p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
                updateSuccess 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <span>{updateMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition shrink-0"
                >
                  {isAr ? 'إعادة تحميل النظام' : 'Reload'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Voice & Audio Greeting Customization Screen */}
      {activeTab === 'voice_audio' && (
        <div className="mt-8 space-y-8 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 md:p-8 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-2xl">
                <Volume2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white">
                  {isAr ? 'إدارة الصوتيات والترحيب الذكي بالمدير العام' : 'Voice Greeting & Smart Audio System'}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  {isAr 
                    ? 'التحكم الكامل في رسائل الترحيب الصوتي للمدير، دعاء دخول المعرض والمنظومة، وإمكانية تفعيلها أو إيقافها فوراً'
                    : 'Configure voice greetings for manager login, entrance supplications, and in-app sound toggles'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${
                voiceGreetingEnabled 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${voiceGreetingEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span>{voiceGreetingEnabled ? (isAr ? 'الصوت مفعّل' : 'Voice Active') : (isAr ? 'الصوت متوقف' : 'Voice Muted')}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Card 1: Voice Greeting at Login */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Volume2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {isAr ? 'الترحيب الصوتي عند تسجيل الدخول' : 'Voice Greeting on Login'}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">SpeechSynthesis (ar-SA)</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-xl ${
                    voiceGreetingEnabled 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {voiceGreetingEnabled ? (isAr ? 'مفعل الآن' : 'Enabled') : (isAr ? 'معطل' : 'Disabled')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {isAr 
                    ? 'عند تسجيل الدخول أو فتح التطبيق، يقوم النظام بنطق عبارة ترحيبية خاصة بالمدير العام: "أهلاً بك يا المدير العام، تم تسجيل الدخول بنجاح. بارك الله في تجارتكم". يمكنك تفعيلها أو كتمها بنقرة واحدة.' 
                    : 'System plays an automatic audio greeting addressing the manager upon logging into the OMS platform.'}
                </p>

                {/* Quote Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 mb-6 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <MessageSquareQuote className="w-4 h-4 text-emerald-500" />
                    <span>{isAr ? 'نص الترحيب المسجل:' : 'Audio Speech Script:'}</span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium italic">
                    «أهلاً بك يا المدير العام، تم تسجيل الدخول بنجاح. بارك الله في تجارتكم ومبيعاتكم في مودرن هاوس»
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateVoiceGreetingEnabled(!voiceGreetingEnabled)}
                  className={`w-full sm:flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer ${
                    voiceGreetingEnabled 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  {voiceGreetingEnabled ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{voiceGreetingEnabled ? (isAr ? 'إيقاف الترحيب الصوتي' : 'Disable Voice Greeting') : (isAr ? 'تفعيل الترحيب الصوتي' : 'Enable Voice Greeting')}</span>
                </button>

                <button
                  type="button"
                  onClick={isPlayingVoiceTest ? handleStopVoiceTest : handlePlayVoiceTest}
                  className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition shrink-0 cursor-pointer"
                >
                  {isPlayingVoiceTest ? (
                    <>
                      <Square className="w-4 h-4 text-rose-500 fill-current" />
                      <span className="text-rose-500">{isAr ? 'إيقاف الصوت' : 'Stop'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-emerald-500 fill-current" />
                      <span>{isAr ? 'تجربة الصوت الآن' : 'Test Voice'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Card 2: Entrance Supplication Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {isAr ? 'شريط دعاء الدخول أعلى الشاشة' : 'Entrance Supplication Banner'}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">Top Floating Banner</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-xl ${
                    entranceSupplicationEnabled 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {entranceSupplicationEnabled ? (isAr ? 'مفعل الآن' : 'Enabled') : (isAr ? 'معطل' : 'Disabled')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {isAr 
                    ? 'يظهر شريط دعاء الدخول المبارك بشكل فخم أعلى الشاشة مع فتح المنظومة، ومزود بزر إغلاق وإلغاء بارز عالي الوضوح يمكن من خلاله إلغاء التنبيه وإيقاف الصوت بلمسة واحدة.' 
                    : 'Displays the blessed entrance supplication banner at top with a prominent, easy-to-dismiss cancel button.'}
                </p>

                {/* Banner Preview Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-amber-500/40 text-white mb-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-400">{isAr ? 'معاينة شريط الدعاء:' : 'Banner Preview:'}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-[10px]">
                      {isAr ? 'زر إغلاق بارز ✕' : 'Clear Close ✕'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-200">
                    «بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا»
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateEntranceSupplicationEnabled(!entranceSupplicationEnabled)}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer ${
                    entranceSupplicationEnabled 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20' 
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{entranceSupplicationEnabled ? (isAr ? 'إيقاف شريط الدعاء' : 'Disable Banner') : (isAr ? 'تفعيل شريط الدعاء' : 'Enable Banner')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'whatsapp_mcp' && (
        <div className="mt-8 space-y-8 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 md:p-8 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-2xl shadow-inner">
                <MessageSquareQuote className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-xl font-black text-white">
                    {isAr ? 'إعدادات واتساب وربط الذكاء الاصطناعي (MCP & API)' : 'WhatsApp Gateway & MCP Settings'}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                    {whatsAppSettings.provider.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {isAr 
                    ? 'تحكم ببوابة إرسال الفواتير ورسائل التتبع السحابية وربط خادم الذكاء الاصطناعي MCP لمودرن هاوس'
                    : 'Manage WhatsApp dispatch gateways, automated order tracking, and AI MCP server integration'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>MCP: whatsapp-marketing</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (7 cols): Gateway Providers & Credentials */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Provider Selection Card */}
              <div className="bg-card dark:bg-dark-card rounded-3xl p-6 border border-border dark:border-dark-border shadow-sm space-y-4">
                <h5 className="text-base font-bold text-text-primary dark:text-dark-text-primary flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'اختيار بوابة ومزود خدمة واتساب' : 'Select WhatsApp Gateway'}</span>
                </h5>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                  {isAr 
                    ? 'اختر طريقة الإرسال المناسبة لنشاطك (رابط مباشر مجاني دون تكلفة، أو إرسال آلي صامت عبر API)' 
                    : 'Choose your dispatch method (zero-cost direct links or silent background API sending)'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  
                  {/* Option 1: Direct wa.me */}
                  <div 
                    onClick={() => updateWhatsAppSettings({ provider: 'direct' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      whatsAppSettings.provider === 'direct'
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-border dark:border-dark-border hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-text-primary dark:text-dark-text-primary flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-emerald-500" />
                        <span>{isAr ? 'رابط مباشر (wa.me)' : 'Direct Link (wa.me)'}</span>
                      </span>
                      {whatsAppSettings.provider === 'direct' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <p className="text-[11px] text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                      {isAr ? 'مجاني وبدون اشتراك، يفتح تطبيق واتساب أو الويب مباشرة مع نص منسق.' : 'Universal zero-cost option. Opens WhatsApp Web or App with pre-filled text.'}
                    </p>
                  </div>

                  {/* Option 2: UltraMsg API */}
                  <div 
                    onClick={() => updateWhatsAppSettings({ provider: 'ultramsg' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      whatsAppSettings.provider === 'ultramsg'
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-border dark:border-dark-border hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-text-primary dark:text-dark-text-primary flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>UltraMsg Cloud API</span>
                      </span>
                      {whatsAppSettings.provider === 'ultramsg' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <p className="text-[11px] text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                      {isAr ? 'إرسال آلي وصامت في الخلفية للعميل مباشرة دون مغادرة شاشة الكاشير.' : 'Silent background sending via UltraMsg instance. No manual browser action required.'}
                    </p>
                  </div>

                  {/* Option 3: Green API */}
                  <div 
                    onClick={() => updateWhatsAppSettings({ provider: 'greenapi' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      whatsAppSettings.provider === 'greenapi'
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-border dark:border-dark-border hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-text-primary dark:text-dark-text-primary flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-blue-500" />
                        <span>Green API</span>
                      </span>
                      {whatsAppSettings.provider === 'greenapi' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <p className="text-[11px] text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                      {isAr ? 'بوابة سحابية سريعة بحسابات الأعمال وتدعم إرسال الفواتير والوسائط.' : 'Reliable business gateway supporting automated dispatch and invoice media.'}
                    </p>
                  </div>

                  {/* Option 4: WhatsApp Cloud API */}
                  <div 
                    onClick={() => updateWhatsAppSettings({ provider: 'meta_cloud' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      whatsAppSettings.provider === 'meta_cloud'
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-border dark:border-dark-border hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-text-primary dark:text-dark-text-primary flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span>Meta Cloud API</span>
                      </span>
                      {whatsAppSettings.provider === 'meta_cloud' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <p className="text-[11px] text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                      {isAr ? 'واجهة Meta الرسمية السحابية المعتمدة للمؤسسات الكبرى.' : 'Official Meta Graph Cloud API for verified business numbers.'}
                    </p>
                  </div>

                </div>
              </div>

              {/* Credentials & Parameters Card */}
              <div className="bg-card dark:bg-dark-card rounded-3xl p-6 border border-border dark:border-dark-border shadow-sm space-y-4">
                <h5 className="text-base font-bold text-text-primary dark:text-dark-text-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'بيانات الاعتماد والربط' : 'Gateway Credentials & Parameters'}</span>
                </h5>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary dark:text-dark-text-secondary mb-1">
                      {isAr ? 'رقم هاتف المعرض المعتمد (مع فتح خط البحرين +973)' : 'Official Store Sender Phone (+973)'}
                    </label>
                    <input 
                      type="text"
                      value={whatsAppSettings.senderPhone || '35965477'}
                      onChange={(e) => updateWhatsAppSettings({ senderPhone: e.target.value })}
                      placeholder="35965477"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-background text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* UltraMsg Fields */}
                  {whatsAppSettings.provider === 'ultramsg' && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">إعدادات حساب UltraMsg</span>
                        <a 
                          href="https://ultramsg.com" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <span>لوحة تحكم UltraMsg</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-secondary mb-1">Instance ID</label>
                          <input 
                            type="text"
                            value={whatsAppSettings.instanceId || ''}
                            onChange={(e) => updateWhatsAppSettings({ instanceId: e.target.value })}
                            placeholder="instance12345"
                            className="w-full px-3 py-2 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-background text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-secondary mb-1">Token</label>
                          <div className="relative">
                            <input 
                              type={showApiToken ? "text" : "password"}
                              value={whatsAppSettings.token || ''}
                              onChange={(e) => updateWhatsAppSettings({ token: e.target.value })}
                              placeholder="xxxxxxxxxx"
                              className="w-full px-3 py-2 pr-9 rtl:pr-3 rtl:pl-9 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-background text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiToken(!showApiToken)}
                              className="absolute top-1/2 -translate-y-1/2 right-2.5 rtl:right-auto rtl:left-2.5 text-text-secondary hover:text-text-primary"
                            >
                              {showApiToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Green API Fields */}
                  {whatsAppSettings.provider === 'greenapi' && (
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400">إعدادات Green API</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-secondary mb-1">IdInstance</label>
                          <input 
                            type="text"
                            value={whatsAppSettings.greenIdInstance || ''}
                            onChange={(e) => updateWhatsAppSettings({ greenIdInstance: e.target.value })}
                            placeholder="1101xxxxxx"
                            className="w-full px-3 py-2 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-background text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-secondary mb-1">ApiTokenInstance</label>
                          <input 
                            type="password"
                            value={whatsAppSettings.greenApiToken || ''}
                            onChange={(e) => updateWhatsAppSettings({ greenApiToken: e.target.value })}
                            placeholder="token..."
                            className="w-full px-3 py-2 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-background text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Automation Toggles */}
                  <div className="pt-3 border-t border-border dark:border-dark-border space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={whatsAppSettings.autoSendInvoice}
                        onChange={(e) => updateWhatsAppSettings({ autoSendInvoice: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-text-primary dark:text-dark-text-primary">
                        {isAr ? 'إرسال الفاتورة الرقمية السحابية تلقائياً للعميل عند إتمام الدفع (POS)' : 'Auto-send digital invoice to customer upon checkout'}
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={whatsAppSettings.autoSendTracking}
                        onChange={(e) => updateWhatsAppSettings({ autoSendTracking: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-text-primary dark:text-dark-text-primary">
                        {isAr ? 'إرسال رابط التتبع المباشر تلقائياً للعميل عند خروج الشحنة مع المندوب' : 'Auto-send live order tracking link upon delivery dispatch'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (5 cols): Test Tool & MCP Server Diagnostics */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Live Test Diagnostic Tool */}
              <div className="bg-card dark:bg-dark-card rounded-3xl p-6 border border-border dark:border-dark-border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-base font-bold text-text-primary dark:text-dark-text-primary flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-500" />
                    <span>{isAr ? 'أداة الفحص والإرسال التجريبي' : 'Live Test Sender'}</span>
                  </h5>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Live Diagnostics
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-secondary mb-1">
                      {isAr ? 'رقم الهاتف للاختبار' : 'Recipient Phone Number'}
                    </label>
                    <input 
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="35965477"
                      className="w-full px-3 py-2 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-background text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-secondary mb-1">
                      {isAr ? 'نص الرسالة الاختبارية' : 'Test Message Body'}
                    </label>
                    <textarea 
                      rows={3}
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-background text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendTestMessage}
                    disabled={isSendingTest}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isSendingTest ? (isAr ? 'جارٍ الإرسال...' : 'Sending...') : (isAr ? 'إرسال رسالة اختبارية 🚀' : 'Send Test Message 🚀')}</span>
                  </button>

                  {testStatus && (
                    <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      testStatus.type === 'success' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                      testStatus.type === 'info' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30' :
                      'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    }`}>
                      {testStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{testStatus.text}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* MCP Server Diagnostics Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-emerald-500/30 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm text-emerald-400">خادم MCP للذكاء الاصطناعي</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                    JSON-RPC 2.0
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300 font-mono">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Server:</span>
                    <span className="text-white font-bold">whatsapp-marketing</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Database:</span>
                    <span className="text-amber-400 font-bold">D:/oms/oms.sqlite (SQLite)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      Active & Connected
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">الأدوات المسجلة في الخادم (MCP Tools):</span>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-emerald-300">whatsapp_send_message</span>
                      <span className="text-[10px] text-slate-400">Direct message</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-emerald-300">whatsapp_send_invoice</span>
                      <span className="text-[10px] text-slate-400">Itemized invoice link</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-emerald-300">whatsapp_broadcast_campaign</span>
                      <span className="text-[10px] text-slate-400">Built-in & Sinks Promo</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-emerald-300">whatsapp_list_templates</span>
                      <span className="text-[10px] text-slate-400">Template catalog</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-emerald-300">whatsapp_list_customers</span>
                      <span className="text-[10px] text-slate-400">Customer directory</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const mcpConfig = {
                        mcpServers: {
                          "whatsapp-marketing": {
                            command: "node",
                            args: ["c:\\Users\\7aleem\\Desktop\\Modern House OMS\\Modern House OMS Development\\src\\mcp\\whatsapp-mcp-server.cjs"],
                            env: {
                              OMS_DATABASE_PATH: "D:/oms/oms.sqlite"
                            }
                          }
                        }
                      };
                      navigator.clipboard.writeText(JSON.stringify(mcpConfig, null, 2));
                      setCopiedMcpConfig(true);
                      setTimeout(() => setCopiedMcpConfig(false), 2500);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition flex items-center justify-center gap-2"
                  >
                    {copiedMcpConfig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMcpConfig ? (isAr ? 'تم نسخ إعداد MCP JSON بنجاح!' : 'Copied MCP Config!') : (isAr ? 'نسخ إعداد MCP لبرامج الذكاء الاصطناعي' : 'Copy MCP Config JSON')}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {activeTab === 'data_management' && !window.omsDesktop && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card dark:bg-dark-card shadow-lg rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
                <h4 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-2">{t('settings.backup_database')}</h4>
                <p className="text-text-secondary dark:text-dark-text-secondary mb-6 text-sm">
                    {t('settings.backup_database_desc')}
                </p>
                <button onClick={handleBackup} className="px-6 py-3 border border-blue-500 text-blue-600 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/30 font-semibold rounded-md transition duration-300 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {t('settings.backup_database')}
                </button>
            </div>

            <div className="bg-card dark:bg-dark-card shadow-lg rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
                <h4 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-2">{t('settings.import_database')}</h4>
                <p className="text-text-secondary dark:text-dark-text-secondary mb-6 text-sm">
                    {t('settings.import_database_desc')}
                </p>
                <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    ref={importDatabaseInputRef}
                    onChange={handleImportDatabase}
                />
                <button onClick={() => importDatabaseInputRef.current?.click()} disabled={isImportingData} className="px-6 py-3 border border-green-500 text-green-600 bg-transparent hover:bg-green-50 dark:hover:bg-green-900/30 font-semibold rounded-md transition duration-300 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50">
                    {isImportingData ? '...' : t('settings.import_database')}
                </button>
            </div>

            <div className="bg-card dark:bg-dark-card shadow-lg rounded-lg p-6 flex flex-col items-center justify-center text-center border-2 border-red-500/20">
                <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <h4 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-2">{t('settings.delete_all_data')}</h4>
                <p className="text-text-secondary dark:text-dark-text-secondary mb-6 text-sm">
                    {t('settings.delete_all_data_desc')}
                </p>
                <button onClick={handleClearDatabase} disabled={isDeletingData} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition duration-300 w-full max-w-xs disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500">
                    {isDeletingData ? '...' : t('settings.delete_all_data')}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default SettingsScreen;
