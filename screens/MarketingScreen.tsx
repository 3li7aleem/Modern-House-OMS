import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Customer } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { 
    MessageSquare, 
    Send, 
    Search, 
    CheckSquare, 
    Square, 
    Check, 
    AlertCircle, 
    X, 
    ChevronRight, 
    ChevronLeft,
    RefreshCw,
    HelpCircle,
    BookOpen,
    Plus,
    Copy,
    Sparkles,
    Tag,
    Package,
    Heart,
    Smartphone,
    ExternalLink,
    Filter,
    Users,
    CheckCircle2
} from 'lucide-react';
import { 
    MarketingTemplate, 
    BUILTIN_MARKETING_TEMPLATES, 
    TEMPLATE_VARIABLES,
    TemplateCategory,
    CATEGORY_INFO 
} from '../components/marketing/marketingTemplates';
import { TemplateLibraryModal } from '../components/marketing/TemplateLibraryModal';

interface QueueItem {
    customer: Customer;
    message: string;
    status: 'pending' | 'sent' | 'skipped';
}

const LOCAL_STORAGE_CUSTOM_TEMPLATES_KEY = 'mh_marketing_custom_templates_v2';

const MarketingScreen: React.FC = () => {
    const { customers } = useAppContext();
    const { t, language } = useTranslation();
    const isAr = language === 'ar';

    // Templates State (combines built-in + locally stored custom templates)
    const [customTemplates, setCustomTemplates] = useState<MarketingTemplate[]>(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TEMPLATES_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load custom templates from localStorage", e);
            return [];
        }
    });

    const allTemplates = useMemo(() => {
        return [...BUILTIN_MARKETING_TEMPLATES, ...customTemplates];
    }, [customTemplates]);

    // Active Category Filter for quick template selector
    const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(BUILTIN_MARKETING_TEMPLATES[0].id);
    const [customMessage, setCustomMessage] = useState<string>(
        isAr ? BUILTIN_MARKETING_TEMPLATES[0].contentAr : BUILTIN_MARKETING_TEMPLATES[0].contentEn
    );

    // Variable replacement customizations
    const [storeNameVar, setStoreNameVar] = useState<string>(isAr ? 'مودرن هاوس' : 'Modern House');
    const [promoCodeVar, setPromoCodeVar] = useState<string>('MH15');
    const [orderNumberVar, setOrderNumberVar] = useState<string>('ORD-1082');

    // Customer Selection & Directory States
    const [searchQuery, setSearchQuery] = useState('');
    const [customerFilterType, setCustomerFilterType] = useState<'all' | 'validPhone' | 'selected'>('all');
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());

    // Single WhatsApp Direct Test
    const [testPhoneNumber, setTestPhoneNumber] = useState('');
    const [copiedPreview, setCopiedPreview] = useState(false);

    // Modals
    const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
    const [isSendingQueueOpen, setIsSendingQueueOpen] = useState(false);
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

    const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Save custom templates to localStorage
    const handleAddNewTemplate = (newTmplData: Omit<MarketingTemplate, 'id' | 'isCustom'>) => {
        const newTemplate: MarketingTemplate = {
            ...newTmplData,
            id: `custom_${Date.now()}`,
            isCustom: true
        };
        const updated = [newTemplate, ...customTemplates];
        setCustomTemplates(updated);
        try {
            localStorage.setItem(LOCAL_STORAGE_CUSTOM_TEMPLATES_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to save to localStorage", e);
        }
        setSelectedTemplateId(newTemplate.id);
        setCustomMessage(isAr ? newTemplate.contentAr : newTemplate.contentEn);
    };

    const handleDeleteCustomTemplate = (templateId: string) => {
        const updated = customTemplates.filter(t => t.id !== templateId);
        setCustomTemplates(updated);
        try {
            localStorage.setItem(LOCAL_STORAGE_CUSTOM_TEMPLATES_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to save to localStorage", e);
        }
        if (selectedTemplateId === templateId) {
            setSelectedTemplateId(BUILTIN_MARKETING_TEMPLATES[0].id);
            setCustomMessage(isAr ? BUILTIN_MARKETING_TEMPLATES[0].contentAr : BUILTIN_MARKETING_TEMPLATES[0].contentEn);
        }
    };

    // Filter templates for the quick dropdown based on activeCategoryFilter
    const filteredQuickTemplates = useMemo(() => {
        if (activeCategoryFilter === 'all') return allTemplates;
        return allTemplates.filter(t => t.category === activeCategoryFilter);
    }, [allTemplates, activeCategoryFilter]);

    // Format phone number to international wa.me format
    const formatWhatsAppPhone = (phone: string): string => {
        let clean = phone.replace(/[+\s-]/g, '');
        if (clean.startsWith('00')) {
            clean = clean.slice(2);
        }
        // If 8 digits, default Bahrain/GCC (+973)
        if (clean.length === 8 && !clean.startsWith('973')) {
            clean = '973' + clean;
        }
        return clean;
    };

    // Compose dynamic message with all variables
    const composeMessage = (templateText: string, customer?: Customer): string => {
        const customerName = customer?.name || (isAr ? 'أحمد عبد الله' : 'Ahmed Abdullah');
        const customerPhone = customer?.phone || '+973 39000000';

        return templateText
            .replace(/\[الاسم\]/g, customerName)
            .replace(/\[Name\]/g, customerName)
            .replace(/\[المتجر\]/g, storeNameVar || (isAr ? 'مودرن هاوس' : 'Modern House'))
            .replace(/\[Store\]/g, storeNameVar || 'Modern House')
            .replace(/\[كود_الخصم\]/g, promoCodeVar || 'MH15')
            .replace(/\[Coupon\]/g, promoCodeVar || 'MH15')
            .replace(/\[رقم_الطلب\]/g, orderNumberVar || 'ORD-1082')
            .replace(/\[Order#\]/g, orderNumberVar || 'ORD-1082')
            .replace(/\[الهاتف\]/g, customerPhone)
            .replace(/\[Phone\]/g, customerPhone);
    };

    // Live preview based on the first selected customer or placeholder
    const livePreviewText = useMemo(() => {
        const firstSelectedId = Array.from(selectedCustomerIds)[0];
        const selectedCustomer = customers.find(c => c.id === firstSelectedId);
        return composeMessage(customMessage, selectedCustomer);
    }, [customMessage, selectedCustomerIds, customers, isAr, storeNameVar, promoCodeVar, orderNumberVar]);

    // Handle template selection changes
    const handleTemplateSelect = (template: MarketingTemplate) => {
        setSelectedTemplateId(template.id);
        setCustomMessage(isAr ? template.contentAr : template.contentEn);
    };

    // Insert variable tag at cursor position
    const handleInsertTag = (tag: string) => {
        if (!messageTextareaRef.current) {
            setCustomMessage(prev => prev + ' ' + tag);
            return;
        }
        const textarea = messageTextareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = customMessage;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const newText = before + tag + after;
        setCustomMessage(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + tag.length, start + tag.length);
        }, 10);
    };

    // Filter customers
    const filteredCustomers = useMemo(() => {
        return customers.filter(customer => {
            const nameMatch = (customer.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const phoneMatch = (customer.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSearch = nameMatch || phoneMatch;

            if (!matchesSearch) return false;

            if (customerFilterType === 'validPhone') {
                return (customer.phone || '').trim().length >= 8;
            }
            if (customerFilterType === 'selected') {
                return selectedCustomerIds.has(customer.id);
            }
            return true;
        });
    }, [customers, searchQuery, customerFilterType, selectedCustomerIds]);

    // Selection handlers
    const handleToggleSelectAll = () => {
        if (filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomerIds.has(c.id))) {
            const newSet = new Set(selectedCustomerIds);
            filteredCustomers.forEach(c => newSet.delete(c.id));
            setSelectedCustomerIds(newSet);
        } else {
            const newSet = new Set(selectedCustomerIds);
            filteredCustomers.forEach(c => newSet.add(c.id));
            setSelectedCustomerIds(newSet);
        }
    };

    const handleSelectIndividual = (id: string) => {
        const newSet = new Set(selectedCustomerIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedCustomerIds(newSet);
    };

    const handleSelectAllInSystem = () => {
        const newSet = new Set<string>();
        customers.forEach(c => newSet.add(c.id));
        setSelectedCustomerIds(newSet);
    };

    const handleClearSelection = () => {
        setSelectedCustomerIds(new Set());
    };

    // Single WhatsApp Direct Test
    const handleSendDirectTest = () => {
        const phone = testPhoneNumber.trim();
        if (!phone) {
            alert(isAr ? 'الرجاء إدخال رقم الهاتف للتجربة.' : 'Please enter a test phone number.');
            return;
        }
        const formatted = formatWhatsAppPhone(phone);
        const encodedText = encodeURIComponent(livePreviewText);
        window.open(`https://wa.me/${formatted}?text=${encodedText}`, '_blank');
    };

    const handleCopyPreview = () => {
        navigator.clipboard.writeText(livePreviewText);
        setCopiedPreview(true);
        setTimeout(() => setCopiedPreview(false), 2000);
    };

    // Initialize Sender Queue Modal
    const handleStartCampaign = () => {
        if (selectedCustomerIds.size === 0) {
            alert(isAr 
                ? 'يرجى تحديد عميل واحد على الأقل من الجدول لإطلاق الحملة.' 
                : 'Please select at least one customer from the list to start the campaign.');
            return;
        }

        const items: QueueItem[] = [];
        customers.forEach(c => {
            if (selectedCustomerIds.has(c.id)) {
                items.push({
                    customer: c,
                    message: composeMessage(customMessage, c),
                    status: 'pending'
                });
            }
        });

        setQueue(items);
        setCurrentQueueIndex(0);
        setIsSendingQueueOpen(true);
    };

    // Open WhatsApp Web/App for the current item in the queue
    const handleSendCurrent = (index: number) => {
        const item = queue[index];
        if (!item) return;

        const formattedPhone = formatWhatsAppPhone(item.customer.phone);
        const encodedText = encodeURIComponent(item.message);
        const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

        const updatedQueue = [...queue];
        updatedQueue[index].status = 'sent';
        setQueue(updatedQueue);

        window.open(waUrl, '_blank');

        if (index < queue.length - 1) {
            setTimeout(() => {
                setCurrentQueueIndex(index + 1);
            }, 400);
        }
    };

    const handleSkipCurrent = (index: number) => {
        const updatedQueue = [...queue];
        updatedQueue[index].status = 'skipped';
        setQueue(updatedQueue);

        if (index < queue.length - 1) {
            setCurrentQueueIndex(index + 1);
        }
    };

    const queueStats = useMemo(() => {
        const total = queue.length;
        const sent = queue.filter(q => q.status === 'sent').length;
        const skipped = queue.filter(q => q.status === 'skipped').length;
        const pending = queue.filter(q => q.status === 'pending').length;
        return { total, sent, skipped, pending };
    }, [queue]);

    // Statistics on customer selection
    const customerStats = useMemo(() => {
        const total = customers.length;
        const withPhone = customers.filter(c => (c.phone || '').trim().length >= 8).length;
        const selected = selectedCustomerIds.size;
        return { total, withPhone, selected };
    }, [customers, selectedCustomerIds]);

    return (
        <div className="space-y-6 pb-12" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
            
            {/* Header with Title & Launch Campaign Action */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-inner">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {isAr ? 'التسويق وتحديثات العملاء عبر واتساب' : 'WhatsApp Marketing & Order Updates'}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {isAr 
                                    ? 'مكتبة رسائل وقوالب لتحديثات الطلبات، العروض الترويجية، ومتابعة ولاء العملاء بضغطة زر' 
                                    : 'Pre-defined message templates for order tracking, discounts, and customer engagement'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Library Browse Modal Button */}
                    <button
                        type="button"
                        onClick={() => setIsLibraryModalOpen(true)}
                        className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-xs"
                    >
                        <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{isAr ? 'مكتبة القوالب (15+ قالب)' : 'Template Library (15+)'}</span>
                    </button>

                    {/* Launch Campaign Button */}
                    <button 
                        onClick={handleStartCampaign}
                        disabled={selectedCustomerIds.size === 0}
                        className={`px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-sm transition-all ${
                            selectedCustomerIds.size > 0 
                                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white cursor-pointer hover:shadow' 
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        }`}
                    >
                        <Send className="w-4 h-4" />
                        <span>
                            {isAr 
                                ? `إطلاق الحملة (${selectedCustomerIds.size} عميل)` 
                                : `Launch Outreach (${selectedCustomerIds.size})`}
                        </span>
                    </button>
                </div>
            </div>

            {/* Quick KPI Stat Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isAr ? 'قوالب الرسائل الجاهزة' : 'Ready Templates'}
                        </p>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {allTemplates.length} {isAr ? 'قالب متاح' : 'Templates'}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                            {isAr ? 'طلبات، عروض، ومتابعة عملاء' : 'Orders, promos, and care'}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isAr ? 'العملاء المسجلون بأرقام' : 'Clients with Phone'}
                        </p>
                        <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {customerStats.withPhone} / {customerStats.total}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                            {isAr ? 'أرقام جاهزة للإرسال المباشر' : 'Valid WhatsApp contacts'}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Smartphone className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isAr ? 'المستهدفون بالحملة الحالية' : 'Selected Target'}
                        </p>
                        <h4 className="text-xl font-bold text-primary mt-0.5">
                            {customerStats.selected} {isAr ? 'عميل محدد' : 'Selected'}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                            {customerStats.selected > 0 
                                ? (isAr ? 'جاهز لإطلاق الرسائل' : 'Ready to dispatch') 
                                : (isAr ? 'حدد عملاء من الجدول' : 'Select from directory')}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Main Workspace Split: Left/Composer vs Right/Target Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Section 1: Message Composer & Dynamic Preview (Cols 5) */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
                        
                        {/* Composer Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                    {isAr ? 'تجهيز الرسالة ومكتبة القوالب' : 'Message Composer & Templates'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsLibraryModalOpen(true)}
                                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>{isAr ? 'استعراض المكتبة' : 'Browse All'}</span>
                            </button>
                        </div>

                        {/* Category Quick Filter Pills */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {isAr ? 'تصفية القوالب حسب المجال:' : 'Filter Template Category:'}
                            </label>
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                {[
                                    { key: 'all', label: isAr ? 'الكل' : 'All' },
                                    { key: 'orders', label: isAr ? '📦 تحديثات الطلبات' : '📦 Orders' },
                                    { key: 'promotions', label: isAr ? '🏷️ العروض والخصومات' : '🏷️ Promos' },
                                    { key: 'followup', label: isAr ? '🤍 متابعة العملاء' : '🤍 Care' },
                                    { key: 'custom', label: isAr ? '✏️ قوالبي' : '✏️ Custom' },
                                ].map(cat => (
                                    <button
                                        key={cat.key}
                                        type="button"
                                        onClick={() => {
                                            setActiveCategoryFilter(cat.key);
                                            // Select first in category if available
                                            const first = allTemplates.find(t => cat.key === 'all' || t.category === cat.key);
                                            if (first) {
                                                handleTemplateSelect(first);
                                            }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                                            activeCategoryFilter === cat.key
                                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dropdown - Template Select */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {isAr ? 'اختر القالب الجاهز:' : 'Select Template:'}
                                </label>
                                <span className="text-[11px] text-slate-400">
                                    {filteredQuickTemplates.length} {isAr ? 'قالب' : 'available'}
                                </span>
                            </div>

                            <select
                                value={selectedTemplateId}
                                onChange={(e) => {
                                    const tmpl = allTemplates.find(t => t.id === e.target.value);
                                    if (tmpl) handleTemplateSelect(tmpl);
                                }}
                                className="w-full text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                            >
                                {filteredQuickTemplates.map((tmpl) => (
                                    <option key={tmpl.id} value={tmpl.id}>
                                        {isAr ? tmpl.nameAr : tmpl.nameEn} {tmpl.isCustom ? (isAr ? '(مخصص)' : '(Custom)') : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Quick Variable Insert Buttons */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {isAr ? 'إدراج متغيرات ذكية تلقائية (انقر للإضافة):' : 'Click to insert dynamic tags:'}
                                </label>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {TEMPLATE_VARIABLES.map(v => (
                                    <button
                                        key={v.tag}
                                        type="button"
                                        onClick={() => handleInsertTag(v.tag)}
                                        className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1"
                                        title={isAr ? `إدراج ${v.labelAr}` : `Insert ${v.labelEn}`}
                                    >
                                        <Plus className="w-3 h-3" />
                                        <span>{v.tag}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Textarea - Custom Message Content */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {isAr ? 'نص الرسالة (قابل للتعديل):' : 'Message Content (Editable):'}
                                </label>
                                <span className="text-[11px] text-slate-400">
                                    {customMessage.length} {isAr ? 'حرف' : 'chars'}
                                </span>
                            </div>
                            <textarea
                                ref={messageTextareaRef}
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                rows={6}
                                placeholder={isAr ? 'اكتب نص الرسالة هنا...' : 'Type message text here...'}
                                className="w-full text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none leading-relaxed transition"
                            />
                        </div>

                        {/* Variable Value Configurator Inputs */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                {isAr ? 'قيم المتغيرات العامة للحملة:' : 'Campaign Variable Values:'}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                                        [المتجر]
                                    </label>
                                    <input
                                        type="text"
                                        value={storeNameVar}
                                        onChange={e => setStoreNameVar(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                                        [كود_الخصم]
                                    </label>
                                    <input
                                        type="text"
                                        value={promoCodeVar}
                                        onChange={e => setPromoCodeVar(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                                        [رقم_الطلب]
                                    </label>
                                    <input
                                        type="text"
                                        value={orderNumberVar}
                                        onChange={e => setOrderNumberVar(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Real-time Realistic WhatsApp Chat Bubble Preview */}
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Smartphone className="w-4 h-4 text-emerald-600" />
                                    <span>{isAr ? 'معاينة واقعية لشاشة واتساب:' : 'Live WhatsApp Mockup Preview:'}</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleCopyPreview}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    {copiedPreview ? (
                                        <>
                                            <Check className="w-3 h-3 text-emerald-500" />
                                            <span className="text-emerald-500">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            <span>{isAr ? 'نسخ النص' : 'Copy'}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* WhatsApp Screen Frame */}
                            <div className="rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-xs bg-[#e5ddd5] dark:bg-[#0b141a]">
                                {/* WhatsApp Header Bar */}
                                <div className="bg-[#075e54] dark:bg-[#1f2c34] text-white px-4 py-2.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-white">
                                            {isAr ? 'ع' : 'C'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold leading-none">
                                                {selectedCustomerIds.size > 0 
                                                    ? customers.find(c => selectedCustomerIds.has(c.id))?.name 
                                                    : (isAr ? 'أحمد عبد الله (عميل تجريبي)' : 'Ahmed Abdullah (Sample)')}
                                            </p>
                                            <span className="text-[10px] text-emerald-200">
                                                {isAr ? 'متصل الآن' : 'online'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-mono">
                                        WhatsApp
                                    </span>
                                </div>

                                {/* WhatsApp Chat Canvas */}
                                <div className="p-4 min-h-[140px] flex flex-col justify-end">
                                    <div className="self-end max-w-[90%] bg-[#dcf8c6] dark:bg-[#005c4b] text-slate-900 dark:text-emerald-50 rounded-2xl rounded-tr-xs p-3 shadow-sm text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                                        {livePreviewText}
                                        <div className="text-[10px] text-slate-500 dark:text-emerald-300 font-mono text-end mt-1 flex items-center justify-end gap-1">
                                            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="text-emerald-600 dark:text-emerald-300 font-bold">✓✓</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Direct Fast Test WhatsApp Number */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                {isAr ? 'إرسال تجريبي سريع لرقم محدد:' : 'Quick Test to Single Phone:'}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={testPhoneNumber}
                                    onChange={e => setTestPhoneNumber(e.target.value)}
                                    placeholder={isAr ? 'مثال: 97339000000 أو 39000000' : 'e.g. 97339000000'}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs rounded-xl p-2.5 font-mono text-slate-900 dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={handleSendDirectTest}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>{isAr ? 'تجربة الآن' : 'Test Send'}</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Section 2: Target Client Directory & Selectors (Cols 7) */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
                        
                        {/* Directory Controls Header */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    <span>{isAr ? 'تحديد قائمة العملاء المستهدفة' : 'Target Client Directory'}</span>
                                </h3>
                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {isAr
                                        ? `تم تحديد ${selectedCustomerIds.size} من أصل ${customers.length} عميل`
                                        : `${selectedCustomerIds.size} of ${customers.length} clients selected`}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleSelectAllInSystem}
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl font-semibold transition"
                                >
                                    {isAr ? 'تحديد الكل' : 'Select All'}
                                </button>
                                <button 
                                    onClick={handleClearSelection}
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:text-red-600 text-slate-700 dark:text-slate-200 text-xs rounded-xl font-semibold transition"
                                >
                                    {isAr ? 'إلغاء التحديد' : 'Deselect'}
                                </button>
                            </div>
                        </div>

                        {/* Search and Customer Type Filter */}
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <div className="relative flex-1">
                                <Search className="absolute top-3 start-3 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={isAr ? 'ابحث بالاسم أو رقم الهاتف...' : 'Search by client name or phone...'}
                                    className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl ps-9 pe-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute top-2.5 end-3 text-slate-400 hover:text-slate-600 p-0.5"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Filter Type Pills */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setCustomerFilterType('all')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                        customerFilterType === 'all'
                                            ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    {isAr ? 'الكل' : 'All'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCustomerFilterType('validPhone')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                        customerFilterType === 'validPhone'
                                            ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                                    }`}
                                    title={isAr ? "العملاء الذين لديهم أرقام صالحة" : "Clients with valid phone"}
                                >
                                    {isAr ? 'برقم هاتف' : 'With Phone'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCustomerFilterType('selected')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                        customerFilterType === 'selected'
                                            ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    {isAr ? `المحددون (${selectedCustomerIds.size})` : `Selected (${selectedCustomerIds.size})`}
                                </button>
                            </div>
                        </div>

                        {/* Customer Table Container */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                            <div className="overflow-x-auto max-h-[460px] no-scrollbar">
                                <table className="w-full text-xs sm:text-sm text-start text-slate-600 dark:text-slate-300">
                                    <thead className="text-[11px] uppercase bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 sticky top-0 z-20 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 w-12 text-center">
                                                <button 
                                                    onClick={handleToggleSelectAll}
                                                    className="inline-flex items-center justify-center text-primary"
                                                    title={isAr ? 'تحديد كل الظاهرين' : 'Toggle Filtered Selection'}
                                                >
                                                    {filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomerIds.has(c.id)) ? (
                                                        <CheckSquare className="w-5 h-5 text-primary" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </button>
                                            </th>
                                            <th scope="col" className="px-4 py-3 font-semibold text-start">{isAr ? 'اسم العميل' : 'Customer Name'}</th>
                                            <th scope="col" className="px-4 py-3 font-semibold text-start">{isAr ? 'الهاتف' : 'Phone'}</th>
                                            <th scope="col" className="px-4 py-3 font-semibold text-start hidden sm:table-cell">{isAr ? 'العنوان' : 'Address'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredCustomers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-12 text-slate-400">
                                                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                                    <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                                                        {isAr ? 'لا يوجد عملاء مطابقين لمعايير التصفية الحالية.' : 'No customers match the current filters.'}
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredCustomers.map((customer) => {
                                                const isSelected = selectedCustomerIds.has(customer.id);
                                                const hasValidPhone = (customer.phone || '').trim().length >= 8;

                                                return (
                                                    <tr 
                                                        key={customer.id} 
                                                        onClick={() => handleSelectIndividual(customer.id)}
                                                        className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                                            isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <button 
                                                                onClick={() => handleSelectIndividual(customer.id)}
                                                                className="inline-flex items-center justify-center text-primary"
                                                            >
                                                                {isSelected ? (
                                                                    <CheckSquare className="w-4.5 h-4.5 text-primary" />
                                                                ) : (
                                                                    <Square className="w-4.5 h-4.5 text-slate-400 dark:text-slate-600" />
                                                                )}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                                            {customer.name}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-xs">
                                                            <span className={hasValidPhone ? 'text-slate-700 dark:text-slate-300' : 'text-red-500'}>
                                                                {customer.phone || (isAr ? 'غير مسجل' : 'No phone')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell truncate max-w-[180px]">
                                                            {customer.address || '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Campaign Dispatch Queue Modal */}
            {isSendingQueueOpen && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div 
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
                        style={{ direction: isAr ? 'rtl' : 'ltr' }}
                    >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
                            <div>
                                <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                    <Send className="w-5 h-5 text-emerald-500 animate-pulse" />
                                    <span>{isAr ? 'حملة إرسال رسائل الواتساب المتتابعة' : 'WhatsApp Outreach Launcher'}</span>
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {isAr 
                                        ? 'سيتم فتح تطبيق ومحادثة واتساب لكل عميل بالترتيب مع إدراج اسمه والرسالة المخصصة.' 
                                        : 'Open customized WhatsApp chat per customer in sequence.'}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsSendingQueueOpen(false)}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Sending Statistics Bar */}
                        <div className="bg-primary/5 border-b border-slate-200 dark:border-slate-800 p-4 grid grid-cols-4 gap-2 text-center">
                            <div>
                                <span className="block text-xs text-slate-500 dark:text-slate-400">{isAr ? 'إجمالي الحملة' : 'Total'}</span>
                                <span className="block text-lg font-bold text-slate-900 dark:text-white">{queueStats.total}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-emerald-600 dark:text-emerald-400">{isAr ? 'تم الفتح' : 'Opened'}</span>
                                <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400">{queueStats.sent}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-amber-600 dark:text-amber-400">{isAr ? 'تم تخطيه' : 'Skipped'}</span>
                                <span className="block text-lg font-bold text-amber-600 dark:text-amber-400">{queueStats.skipped}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-primary">{isAr ? 'متبقي' : 'Pending'}</span>
                                <span className="block text-lg font-bold text-primary">{queueStats.pending}</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 overflow-hidden">
                            <div 
                                className="bg-emerald-500 h-full transition-all duration-300"
                                style={{ width: `${queueStats.total > 0 ? ((queueStats.sent + queueStats.skipped) / queueStats.total) * 100 : 0}%` }}
                            />
                        </div>

                        {/* Modal Body: Active Target Customer Details */}
                        <div className="p-6 overflow-y-auto space-y-5 flex-1 select-none">
                            {currentQueueIndex < queue.length ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-primary tracking-wider font-mono">
                                                    {isAr ? `العميل الحالي (${currentQueueIndex + 1} من ${queue.length})` : `Active Client (${currentQueueIndex + 1} of ${queue.length})`}
                                                </span>
                                                <h5 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                                                    {queue[currentQueueIndex].customer.name}
                                                </h5>
                                                <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
                                                    {queue[currentQueueIndex].customer.phone}
                                                </span>
                                            </div>
                                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-500/20">
                                                {isAr ? 'جاهز للإرسال' : 'Pending Trigger'}
                                            </span>
                                        </div>

                                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1">
                                            <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                                                {isAr ? 'الرسالة المجهزة للعميل بالواتساب' : 'Customized WhatsApp Message'}
                                            </span>
                                            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-lg text-sm text-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                                                {queue[currentQueueIndex].message}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <button
                                            onClick={() => handleSendCurrent(currentQueueIndex)}
                                            className="flex-1 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-base font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                                        >
                                            <Send className="w-5 h-5" />
                                            <span>
                                                {isAr ? 'إرسال وفتح محادثة واتساب' : 'Send & Open WhatsApp'}
                                            </span>
                                        </button>
                                        
                                        <button
                                            onClick={() => handleSkipCurrent(currentQueueIndex)}
                                            className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition"
                                        >
                                            {isAr ? 'تخطي هذا العميل' : 'Skip Client'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 space-y-4">
                                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500">
                                        <Check className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h5 className="text-xl font-bold text-slate-900 dark:text-white">
                                            {isAr ? 'اكتملت حملة واتساب بنجاح!' : 'Outreach Campaign Completed!'}
                                        </h5>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            {isAr
                                                ? `تمت معالجة كافة العملاء الـ ${queue.length} بنجاح.`
                                                : `Processed all ${queue.length} clients in the dispatch queue.`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsSendingQueueOpen(false)}
                                        className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition"
                                    >
                                        {isAr ? 'إغلاق النافذة' : 'Close Launcher'}
                                    </button>
                                </div>
                            )}

                            {/* Historic Queue Checklist */}
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-6">
                                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                    {isAr ? 'قائمة العملاء في الحملة' : 'Campaign Dispatch List'}
                                </span>
                                
                                <div className="space-y-2 max-h-[160px] overflow-y-auto pe-1">
                                    {queue.map((item, idx) => (
                                        <div 
                                            key={item.customer.id}
                                            className={`flex items-center justify-between text-xs p-2.5 rounded-lg border ${
                                                idx === currentQueueIndex 
                                                    ? 'bg-primary/5 dark:bg-primary/10 border-primary' 
                                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">{item.customer.name}</span>
                                                <span className="text-slate-400 font-mono text-[11px]">({item.customer.phone})</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {item.status === 'sent' && (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                                        <Check className="w-3.5 h-3.5" /> {isAr ? 'تم الفتح' : 'Opened'}
                                                    </span>
                                                )}
                                                {item.status === 'skipped' && (
                                                    <span className="text-slate-400 italic font-medium">{isAr ? 'تم تخطيه' : 'Skipped'}</span>
                                                )}
                                                {item.status === 'pending' && idx === currentQueueIndex && (
                                                    <span className="text-amber-500 font-bold animate-pulse">{isAr ? 'جاري الآن' : 'Active'}</span>
                                                )}
                                                {item.status === 'pending' && idx !== currentQueueIndex && (
                                                    <span className="text-slate-400">{isAr ? 'قيد الانتظار' : 'Pending'}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Navigation Step indicator */}
                        {currentQueueIndex < queue.length && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 select-none">
                                <button 
                                    onClick={() => setCurrentQueueIndex(v => Math.max(0, v - 1))}
                                    disabled={currentQueueIndex === 0}
                                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                                    <span>{isAr ? 'السابق' : 'Prev'}</span>
                                </button>
                                
                                <span className="font-semibold">
                                    {isAr ? `خطوة ${currentQueueIndex + 1} من أصل ${queue.length}` : `Step ${currentQueueIndex + 1} of ${queue.length}`}
                                </span>

                                <button 
                                    onClick={() => setCurrentQueueIndex(v => Math.min(queue.length, v + 1))}
                                    disabled={currentQueueIndex >= queue.length}
                                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                                >
                                    <span>{isAr ? 'التالي' : 'Next'}</span>
                                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* Template Library Modal Component */}
            <TemplateLibraryModal
                isOpen={isLibraryModalOpen}
                onClose={() => setIsLibraryModalOpen(false)}
                templates={allTemplates}
                onSelectTemplate={handleTemplateSelect}
                onAddNewTemplate={handleAddNewTemplate}
                onDeleteCustomTemplate={handleDeleteCustomTemplate}
                language={language}
            />

        </div>
    );
};

export default MarketingScreen;
