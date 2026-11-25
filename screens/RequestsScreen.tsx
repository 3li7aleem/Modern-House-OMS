import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { Order, Request } from '../types';
import RequestDetailModal from '../components/requests/RequestDetailModal';
import NewOrderModal from '../components/sales/NewInvoiceModal';
import EditRequestModal from '../components/requests/EditRequestModal';
import PrintRequestModal from '../components/requests/PrintRequestModal';
import { Edit, Trash2, Printer, Eye, MessageSquare, Plus, Search, PackageX } from 'lucide-react';

type RequestFilter = 'all' | 'out_of_stock' | 'Pending' | 'Processing' | 'Completed';

const RequestsScreen: React.FC = () => {
    const { requests, products, updateRequestStatus, addOrder, selectedItemId, setSelectedItemId, deleteRequest, updateRequest, addRequest } = useAppContext();
    const { t, formatDate, formatNumber, language } = useTranslation();
    const isAr = language === 'ar';

    const [requestToView, setRequestToView] = useState<Request | null>(null);
    const [requestToConvert, setRequestToConvert] = useState<Request | null>(null);
    const [requestToEdit, setRequestToEdit] = useState<Request | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [requestToPrint, setRequestToPrint] = useState<Request | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<RequestFilter>('all');

    const requestStatuses: Request['status'][] = ['Pending', 'Processing', 'Completed', 'Cancelled'];

    const isUnavailableRequest = (req: Request): boolean => {
        if (req.isOutOfStockRequest) return true;
        return (req.items || []).some(item => {
            if (item.isCustom || item.productId?.startsWith('custom_')) return true;
            const prod = products.find(p => p.id === item.productId);
            return !prod || (prod.stock ?? 0) <= 0;
        });
    };

    const getItemLabel = (item: Request['items'][number]) => {
        const prod = products.find(p => p.id === item.productId);
        return item.name || prod?.name || (isAr ? 'صنف غير مدرج' : 'Custom Item');
    };

    const filteredRequests = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return requests.filter((req: Request) => {
            if (activeFilter === 'out_of_stock' && !isUnavailableRequest(req)) return false;
            if (['Pending', 'Processing', 'Completed'].includes(activeFilter) && req.status !== activeFilter) return false;
            if (!q) return true;
            const itemMatch = (req.items || []).some(it => {
                const name = getItemLabel(it).toLowerCase();
                return name.includes(q) || (it.sku || '').toLowerCase().includes(q);
            });
            return (
                (req.customerName || '').toLowerCase().includes(q) ||
                (req.customerPhone || '').toLowerCase().includes(q) ||
                (req.notes || '').toLowerCase().includes(q) ||
                itemMatch
            );
        });
    }, [requests, products, searchQuery, activeFilter]);

    const outOfStockCount = useMemo(() => requests.filter(isUnavailableRequest).length, [requests, products]);
    const pendingCount = useMemo(() => requests.filter(r => r.status === 'Pending').length, [requests]);

    const formatWhatsAppPhone = (phone: string): string => {
        let clean = phone.replace(/[+\s-]/g, '');
        if (clean.startsWith('00')) {
            clean = clean.slice(2);
        }
        if (clean.length === 8 && !clean.startsWith('973')) {
            clean = '973' + clean;
        }
        return clean;
    };

    const handleWhatsAppConfirm = (request: Request) => {
        const phone = formatWhatsAppPhone(request.customerPhone);
        const statusLabel = t(`requests.status_labels.${request.status}`);
        const itemSummary = (request.items || [])
            .map(it => `• ${getItemLabel(it)} (×${formatNumber(it.quantity)})`)
            .join('\n');

        const isShowroomSpecial = request.source === 'showroom' || isUnavailableRequest(request);

        const messageAr = isShowroomSpecial
            ? `أهلاً بك يا ${request.customerName}، يسعدنا تواصلك مع مودرن هاوس للتجارة. ✨\n\nتم تسجيل طلبك الخاص بنجاح:\n${itemSummary}\n\nحالة الطلب الحالية: [ ${statusLabel} ]\nتاريخ التسجيل: ${formatDate(request.date)}\n\nسنتواصل معك فور توفر الأصناف لتأكيد التوصيل والتركيب. نشكرك لثقتك بنا! 🌸`
            : `أهلاً بك يا ${request.customerName}، يسعدنا تواصلك مع مودرن هاوس (Modern House). ✨\n\nنود تأكيد استلام طلبك الوارد إلينا عبر الموقع الإلكتروني بنجاح.\n\nحالة طلبك الحالية: [ ${statusLabel} ]\nتاريخ الطلب: ${formatDate(request.date)}\n\nيتم الآن مراجعة الأصناف وسيتم التواصل معك قريباً لتأكيد تفاصيل وموعد التوصيل. نشكرك لطلبك وتعاملك معنا! 🌸`;

        const messageEn = isShowroomSpecial
            ? `Hello ${request.customerName},\n\nWe have registered your special item request at Modern House for Trading:\n${itemSummary}\n\nCurrent Status: [ ${statusLabel} ]\nDate: ${formatDate(request.date)}\n\nWe will notify you as soon as the items are available. Thank you for choosing us! 🌸`
            : `Hello ${request.customerName},\n\nWe have received and approved your online order request at Modern House. ✨\n\nYour Request Status: [ ${statusLabel} ]\nOrder Date: ${formatDate(request.date)}\n\nWe are currently preparing your items and will contact you shortly regarding delivery arrangements. Thank you for your business! 🌸`;

        const encodedText = encodeURIComponent(isAr ? messageAr : messageEn);
        window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
    };

    useEffect(() => {
        if (selectedItemId && requests.length > 0) {
            const requestFromNotification = requests.find(r => r.id === selectedItemId);
            if (requestFromNotification) {
                setRequestToView(requestFromNotification);
                setSelectedItemId(null);
            }
        }
    }, [selectedItemId, requests, setSelectedItemId]);

    const handleSaveOrder = async (newOrderData: Omit<Order, 'id' | 'orderNumber' | 'status'>, deliveryOption: 'none' | 'charge' | 'free') => {
        if (!requestToConvert) return;

        try {
            await addOrder(newOrderData, deliveryOption, requestToConvert.id);
            setRequestToConvert(null);
        } catch (error: any) {
            console.error("Failed to save order from request:", error);
            alert(`Error saving order: ${error.message}`);
            throw error;
        }
    };

    const handleApproveRequest = (request: Request) => {
        setRequestToConvert(request);
        setRequestToView(null);
    };

    const handleRejectRequest = async (request: Request) => {
        await updateRequestStatus(request.id, 'Cancelled');
        setRequestToView(null);
    };

    const handleSaveRequest = async (requestId: string, updatedData: Partial<Request>) => {
        await updateRequest(requestId, updatedData);
    };

    const handleDeleteRequest = async (request: Request) => {
        if (confirm(t('requests.delete_confirmation') || 'Are you sure you want to delete this customer request?')) {
            await deleteRequest(request.id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header & Primary CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-dark-text-primary">
                        {t('requests.title')}
                    </h3>
                    <p className="text-xs sm:text-sm text-text-secondary dark:text-dark-text-secondary mt-1">
                        {t('requests.subtitle') || (isAr ? 'إدارة طلبات العملاء الواردة وتسجيل طلبات الأصناف غير المتوفرة في المخزون' : 'Manage incoming customer requests and out-of-stock special item requests')}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl shadow-md shadow-primary/20 transition-all active:scale-95 shrink-0"
                    title={t('requests.add_out_of_stock_hint') || (isAr ? 'إضافة طلب لصنف غير متوفر بالمخزون' : 'Add a new request for an out-of-stock item')}
                >
                    <Plus className="w-4 h-4" />
                    <span>{t('requests.add_button') || (isAr ? 'إضافة طلب جديد' : 'Add New Request')}</span>
                </button>
            </div>

            {/* Search & Quick Filter Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card dark:bg-dark-card p-3 rounded-2xl border border-border dark:border-dark-border shadow-xs">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('requests.search_placeholder') || (isAr ? 'ابحث باسم العميل أو رقم الهاتف أو الصنف المطلوب...' : 'Search by customer, phone, or item...')}
                        className="w-full ps-9 pe-3 py-2 text-xs sm:text-sm bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-foreground dark:text-dark-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                    {[
                        { id: 'all', label: t('requests.filter_all') || (isAr ? 'الكل' : 'All'), count: requests.length },
                        { id: 'out_of_stock', label: t('requests.filter_out_of_stock') || (isAr ? 'غير متوفر بالمخزون' : 'Out of Stock'), count: outOfStockCount },
                        { id: 'Pending', label: t('requests.status_labels.Pending'), count: pendingCount },
                        { id: 'Processing', label: t('requests.status_labels.Processing') },
                        { id: 'Completed', label: t('requests.status_labels.Completed') }
                    ].map(tab => {
                        const isActive = activeFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveFilter(tab.id as RequestFilter)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                                    isActive
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
                                    }`}>
                                        {formatNumber(tab.count)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-card shadow-lg rounded-2xl overflow-hidden dark:bg-dark-card border border-border dark:border-dark-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start text-text-secondary dark:text-dark-text-secondary">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800/70 dark:text-gray-300 border-b border-border dark:border-dark-border">
                            <tr>
                                <th scope="col" className="px-6 py-3.5 text-start">{t('requests.table.customer')}</th>
                                <th scope="col" className="px-6 py-3.5 text-start">{t('requests.table.phone')}</th>
                                <th scope="col" className="px-6 py-3.5 text-start">{t('requests.table.items') || (isAr ? 'الأصناف المطلوبة' : 'Requested Items')}</th>
                                <th scope="col" className="px-6 py-3.5 text-start">{t('requests.table.date')}</th>
                                <th scope="col" className="px-6 py-3.5 text-center">{t('requests.table.status')}</th>
                                <th scope="col" className="px-6 py-3.5 text-center">{t('requests.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-dark-border">
                            {filteredRequests.map((request: Request) => {
                                const unavailable = isUnavailableRequest(request);
                                const firstItem = request.items?.[0];
                                const extraCount = Math.max(0, (request.items?.length || 0) - 1);

                                return (
                                    <tr key={request.id} className="bg-card dark:bg-dark-card hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-text-primary whitespace-nowrap dark:text-white">
                                            <div>{request.customerName}</div>
                                            {unavailable && (
                                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                                    <PackageX className="w-3 h-3" />
                                                    <span>{t('requests.out_of_stock_badge') || (isAr ? 'غير متوفر بالمخزون' : 'Out of Stock')}</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">{request.customerPhone}</td>
                                        <td className="px-6 py-4 max-w-xs">
                                            {firstItem ? (
                                                <div className="space-y-0.5">
                                                    <div className="text-xs sm:text-sm font-medium text-text-primary dark:text-white truncate">
                                                        {getItemLabel(firstItem)}
                                                        <span className="text-primary font-bold ms-1.5 tabular-nums">
                                                            (×{formatNumber(firstItem.quantity)})
                                                        </span>
                                                    </div>
                                                    {extraCount > 0 && (
                                                        <span className="text-[11px] text-slate-400">
                                                            +{formatNumber(extraCount)} {isAr ? 'أصناف أخرى' : 'more items'}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs">{formatDate(request.date)}</td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <select
                                                value={request.status}
                                                onChange={(e) => updateRequestStatus(request.id, e.target.value as Request['status'])}
                                                className={`px-3 py-1.5 border-none rounded-lg text-xs font-semibold text-white appearance-none text-center cursor-pointer ${
                                                    request.status === 'Completed' ? 'bg-emerald-500' :
                                                    request.status === 'Processing' ? 'bg-blue-500' :
                                                    request.status === 'Cancelled' ? 'bg-rose-500' :
                                                    'bg-amber-500'
                                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                                            >
                                                {requestStatuses.map(status => (
                                                    <option key={status} value={status} className="bg-gray-800 text-white">
                                                        {t(`requests.status_labels.${status}`)}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => setRequestToView(request)}
                                                    className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-lg transition-colors"
                                                    title={t('general.details') || 'Details'}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setRequestToEdit(request)}
                                                    className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title={t('general.edit') || 'Edit'}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setRequestToPrint(request)}
                                                    className="p-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                                    title={t('orders.table.print') || 'Print'}
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleWhatsAppConfirm(request)}
                                                    className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                    title={isAr ? 'تأكيد الطلب عبر واتساب' : 'Confirm via WhatsApp'}
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRequest(request)}
                                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                                    title={t('general.delete') || 'Delete'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {request.status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleApproveRequest(request)}
                                                        className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 rounded-lg text-xs font-semibold transition"
                                                    >
                                                        {t('requests.table.create_order')}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredRequests.length === 0 && (
                    <div className="p-10 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                            <PackageX className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                            {t('requests.empty_state') || (isAr ? 'لا توجد طلبات مسجلة حالياً' : 'No customer requests found')}
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('requests.add_button') || (isAr ? 'إضافة طلب جديد' : 'Add New Request')}</span>
                        </button>
                    </div>
                )}
            </div>

            {requestToView && (
                <RequestDetailModal
                    request={requestToView}
                    onClose={() => setRequestToView(null)}
                    onApprove={handleApproveRequest}
                    onReject={handleRejectRequest}
                />
            )}
            {(isAddModalOpen || requestToEdit) && (
                <EditRequestModal
                    request={requestToEdit}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setRequestToEdit(null);
                    }}
                    onSave={handleSaveRequest}
                    onAdd={addRequest}
                />
            )}
            {requestToPrint && (
                <PrintRequestModal
                    request={requestToPrint}
                    onClose={() => setRequestToPrint(null)}
                />
            )}
            {requestToConvert && (
                <NewOrderModal
                    onClose={() => setRequestToConvert(null)}
                    onSave={handleSaveOrder}
                    requestToConvert={requestToConvert}
                />
            )}
        </div>
    );
};

export default RequestsScreen;
