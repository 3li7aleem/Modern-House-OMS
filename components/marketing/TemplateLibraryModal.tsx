import React, { useState, useMemo } from 'react';
import { 
    MarketingTemplate, 
    TemplateCategory, 
    CATEGORY_INFO, 
    TEMPLATE_VARIABLES 
} from './marketingTemplates';
import { 
    X, 
    Search, 
    Package, 
    Tag, 
    Heart, 
    Sparkles, 
    Bookmark, 
    Copy, 
    Check, 
    Plus, 
    Trash2, 
    CheckCircle2, 
    ArrowRight,
    ArrowLeft,
    FileText
} from 'lucide-react';

interface TemplateLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    templates: MarketingTemplate[];
    onSelectTemplate: (template: MarketingTemplate) => void;
    onAddNewTemplate: (template: Omit<MarketingTemplate, 'id' | 'isCustom'>) => void;
    onDeleteCustomTemplate: (templateId: string) => void;
    language: 'ar' | 'en';
}

const getCategoryIcon = (category: TemplateCategory) => {
    switch (category) {
        case 'orders':
            return <Package className="w-4 h-4" />;
        case 'promotions':
            return <Tag className="w-4 h-4" />;
        case 'followup':
            return <Heart className="w-4 h-4" />;
        case 'general':
            return <Sparkles className="w-4 h-4" />;
        case 'custom':
            return <Bookmark className="w-4 h-4" />;
        default:
            return <FileText className="w-4 h-4" />;
    }
};

export const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({
    isOpen,
    onClose,
    templates,
    onSelectTemplate,
    onAddNewTemplate,
    onDeleteCustomTemplate,
    language
}) => {
    const isAr = language === 'ar';
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    // Form state for creating custom template
    const [newTitleAr, setNewTitleAr] = useState('');
    const [newCategory, setNewCategory] = useState<TemplateCategory>('orders');
    const [newContentAr, setNewContentAr] = useState('');
    const [newDescriptionAr, setNewDescriptionAr] = useState('');

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
            const query = searchQuery.trim().toLowerCase();
            if (!query) return matchesCategory;

            const name = (isAr ? t.nameAr : t.nameEn).toLowerCase();
            const desc = (isAr ? t.descriptionAr : t.descriptionEn).toLowerCase();
            const content = (isAr ? t.contentAr : t.contentEn).toLowerCase();
            const tags = t.tags.some(tag => tag.toLowerCase().includes(query));

            return matchesCategory && (name.includes(query) || desc.includes(query) || content.includes(query) || tags);
        });
    }, [templates, selectedCategory, searchQuery, isAr]);

    const handleCopy = (t: MarketingTemplate, e: React.MouseEvent) => {
        e.stopPropagation();
        const text = isAr ? t.contentAr : t.contentEn;
        navigator.clipboard.writeText(text);
        setCopiedId(t.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitleAr.trim() || !newContentAr.trim()) {
            alert(isAr ? 'الرجاء إدخال عنوان ونص القالب.' : 'Please enter template title and content.');
            return;
        }

        onAddNewTemplate({
            category: newCategory,
            nameAr: newTitleAr.trim(),
            nameEn: newTitleAr.trim(),
            descriptionAr: newDescriptionAr.trim() || (isAr ? 'قالب مخصص تم إنشاؤه بواسطة المستخدم' : 'Custom user template'),
            descriptionEn: newDescriptionAr.trim() || 'Custom user template',
            badgeAr: isAr ? 'مخصص' : 'Custom',
            badgeEn: 'Custom',
            contentAr: newContentAr.trim(),
            contentEn: newContentAr.trim(),
            tags: ['مخصص', newCategory]
        });

        // Reset
        setNewTitleAr('');
        setNewContentAr('');
        setNewDescriptionAr('');
        setIsCreatingNew(false);
        setSelectedCategory('custom');
    };

    const handleInsertTag = (tag: string) => {
        setNewContentAr(prev => prev + ' ' + tag);
    };

    if (!isOpen) return null;

    const categories: { key: string; label: string; count: number }[] = [
        { key: 'all', label: isAr ? 'جميع القوالب' : 'All Templates', count: templates.length },
        { key: 'orders', label: isAr ? 'تحديثات الطلبات' : 'Order Updates', count: templates.filter(t => t.category === 'orders').length },
        { key: 'promotions', label: isAr ? 'العروض والخصومات' : 'Promotions', count: templates.filter(t => t.category === 'promotions').length },
        { key: 'followup', label: isAr ? 'متابعة العملاء' : 'Customer Care', count: templates.filter(t => t.category === 'followup').length },
        { key: 'general', label: isAr ? 'رسائل عامة' : 'General Notes', count: templates.filter(t => t.category === 'general').length },
        { key: 'custom', label: isAr ? 'قوالبي المخصصة' : 'Custom Templates', count: templates.filter(t => t.category === 'custom').length }
    ];

    return (
        <div 
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
            onClick={onClose}
            style={{ direction: isAr ? 'rtl' : 'ltr' }}
        >
            <div 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh] animate-fade-in-scale text-slate-800 dark:text-slate-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {isAr ? 'مكتبة رسائل وقوالب الواتساب الجاهزة' : 'WhatsApp Message Templates Library'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {isAr 
                                    ? 'قوالب احترافية معدة مسبقاً لتحديثات الطلبات، الحملات التسويقية، ورعاية العملاء' 
                                    : 'Pre-written templates for order notifications, marketing deals, and customer support'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsCreatingNew(!isCreatingNew)}
                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isCreatingNew ? (isAr ? 'العودة للمكتبة' : 'Back to Library') : (isAr ? 'إنشاء قالب جديد' : 'New Template')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {isCreatingNew ? (
                    /* Create Custom Template View */
                    <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto">
                        <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/20 flex items-start gap-2.5 text-xs text-primary">
                            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">{isAr ? 'إنشاء قالب مخصص جديد:' : 'Create Custom Template:'}</span>
                                <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                                    {isAr 
                                        ? 'سيتم حفظ القالب محلياً في نظامك للاستخدام الفوري في أي وقت بحملاتك التسويقية.' 
                                        : 'This template will be saved to your local library for immediate reuse across campaigns.'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'عنوان القالب' : 'Template Title'} *
                                </label>
                                <input
                                    type="text"
                                    value={newTitleAr}
                                    onChange={e => setNewTitleAr(e.target.value)}
                                    placeholder={isAr ? 'مثال: تذكير بموعد الصيانة' : 'e.g. Order Delivery Reminder'}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'التصنيف' : 'Category'} *
                                </label>
                                <select
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value as TemplateCategory)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white"
                                >
                                    <option value="orders">{isAr ? 'تحديثات الطلبات' : 'Order Updates'}</option>
                                    <option value="promotions">{isAr ? 'العروض الترويجية' : 'Promotions'}</option>
                                    <option value="followup">{isAr ? 'متابعة العملاء' : 'Customer Care'}</option>
                                    <option value="general">{isAr ? 'رسائل عامة' : 'General'}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {isAr ? 'وصف مختصر (اختياري)' : 'Short Description (Optional)'}
                            </label>
                            <input
                                type="text"
                                value={newDescriptionAr}
                                onChange={e => setNewDescriptionAr(e.target.value)}
                                placeholder={isAr ? 'وصف مختصر للغرض من الرسالة' : 'Brief explanation of message purpose'}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {isAr ? 'نص رسالة الواتساب' : 'WhatsApp Message Body'} *
                                </label>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[11px] text-slate-400">{isAr ? 'إدراج متغير:' : 'Insert variable:'}</span>
                                    {TEMPLATE_VARIABLES.map(v => (
                                        <button
                                            key={v.tag}
                                            type="button"
                                            onClick={() => handleInsertTag(v.tag)}
                                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono text-slate-600 dark:text-slate-300 transition"
                                            title={isAr ? v.labelAr : v.labelEn}
                                        >
                                            {v.tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                value={newContentAr}
                                onChange={e => setNewContentAr(e.target.value)}
                                rows={5}
                                placeholder={isAr ? 'أهلاً بك [الاسم]، نود إعلامك بأن...' : 'Hello [الاسم], we would like to let you know...'}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white leading-relaxed"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setIsCreatingNew(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                            >
                                {isAr ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition flex items-center gap-1.5"
                            >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isAr ? 'حفظ القالب بالمكتبة' : 'Save Template'}</span>
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Template Browser View */
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Search and Category Filter Toolbar */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 space-y-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute top-3 start-3 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={isAr ? 'ابحث عن قالب بالاسم، المحتوى، أو الكلمات المفتاحية...' : 'Search templates by title, content, or tags...'}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm rounded-xl p-2.5 ps-9 pe-8 focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white transition"
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

                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat.key}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                                            selectedCategory === cat.key
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {cat.key !== 'all' && getCategoryIcon(cat.key as TemplateCategory)}
                                        <span>{cat.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                            selectedCategory === cat.key
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                        }`}>
                                            {cat.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Templates Grid Cards */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {filteredTemplates.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        {isAr ? 'لم يتم العثور على قوالب مطابقة' : 'No matching templates found'}
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                        {isAr ? 'جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً من القائمة أعلاه.' : 'Try adjusting your search terms or filter category.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredTemplates.map(t => {
                                        const catInfo = CATEGORY_INFO[t.category] || CATEGORY_INFO.general;
                                        const content = isAr ? t.contentAr : t.contentEn;
                                        const name = isAr ? t.nameAr : t.nameEn;
                                        const description = isAr ? t.descriptionAr : t.descriptionEn;

                                        return (
                                            <div
                                                key={t.id}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition flex flex-col justify-between group"
                                            >
                                                <div>
                                                    {/* Card Header: Category & Badge */}
                                                    <div className="flex items-center justify-between mb-2.5">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${catInfo.color}`}>
                                                            {getCategoryIcon(t.category)}
                                                            <span>{isAr ? catInfo.titleAr : catInfo.titleEn}</span>
                                                        </span>

                                                        <div className="flex items-center gap-1">
                                                            {t.isCustom && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm(isAr ? 'هل أنت متأكد من حذف هذا القالب المخصص؟' : 'Delete this custom template?')) {
                                                                            onDeleteCustomTemplate(t.id);
                                                                        }
                                                                    }}
                                                                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition"
                                                                    title={isAr ? 'حذف القالب' : 'Delete'}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleCopy(t, e)}
                                                                className="text-slate-400 hover:text-primary p-1 rounded-md transition"
                                                                title={isAr ? 'نسخ النص' : 'Copy'}
                                                            >
                                                                {copiedId === t.id ? (
                                                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Title & Description */}
                                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary transition">
                                                        {name}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                                        {description}
                                                    </p>

                                                    {/* WhatsApp message snippet */}
                                                    <div className="mt-3 p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl text-xs text-slate-700 dark:text-slate-200 line-clamp-3 leading-relaxed font-sans">
                                                        {content}
                                                    </div>

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap items-center gap-1 mt-2.5">
                                                        {t.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Action CTA */}
                                                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onSelectTemplate(t);
                                                            onClose();
                                                        }}
                                                        className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1"
                                                    >
                                                        <span>{isAr ? 'استخدام هذا القالب' : 'Use Template'}</span>
                                                        {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal Footer */}
                <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                        {isAr 
                            ? `يتوفر ${templates.length} قالباً جاهزاً بالمكتبة مع دعم المتغيرات الديناميكية` 
                            : `${templates.length} ready-to-use templates available with dynamic tags`}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                    >
                        {isAr ? 'إغلاق' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};
