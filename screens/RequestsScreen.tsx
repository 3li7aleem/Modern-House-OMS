

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { Order, Request } from '../types';
import RequestDetailModal from '../components/requests/RequestDetailModal';
import NewOrderModal from '../components/sales/NewInvoiceModal';
import EditRequestModal from '../components/requests/EditRequestModal';
import PrintRequestModal from '../components/requests/PrintRequestModal';
import { Edit, Trash2, Printer, Eye, MessageSquare } from 'lucide-react';

const RequestsScreen: React.FC = () => {
    const { requests, updateRequestStatus, addOrder, selectedItemId, setSelectedItemId, deleteRequest, updateRequest } = useAppContext();
    const { t, formatDate, language } = useTranslation();
    const [requestToView, setRequestToView] = useState<Request | null>(null);
    const [requestToConvert, setRequestToConvert] = useState<Request | null>(null);
    const [requestToEdit, setRequestToEdit] = useState<Request | null>(null);
    const [requestToPrint, setRequestToPrint] = useState<Request | null>(null);

    const requestStatuses: Request['status'][] = ['Pending', 'Processing', 'Completed', 'Cancelled'];
    
    // Formatting the telephone number into a proper wa.me target number (removing non-digits, prepending GCC 973 if short/local)
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
        
        const statusLabel = 
            request.status === 'Pending' ? (language === 'ar' ? 'قيد الانتظار' : 'Pending') :
            request.status === 'Processing' ? (language === 'ar' ? 'قيد المعالجة' : 'Processing') :
            request.status === 'Completed' ? (language === 'ar' ? 'تم الاكتمال' : 'Completed') :
            (language === 'ar' ? 'ملغي' : 'Cancelled');

        const messageAr = `أهلاً بك يا ${request.customerName}، يسعدنا تواصلك مع مودرن هاوس (Modern House). ✨\n\nنود تأكيد استلام طلبك الوارد إلينا عبر الموقع الإلكتروني بنجاح.\n\nحالة طلبك الحالية: [ ${statusLabel} ]\nتاريخ الطلب: ${formatDate(request.date)}\n\nيتم الآن مراجعة الأصناف وسيتم التواصل معك قريباً لتأكيد تفاصيل وموعد التوصيل. نشكرك لطلبك وتعاملك معنا! 🌸`;
        
        const messageEn = `Hello ${request.customerName},\n\nWe have received and approved your online order request at Modern House. ✨\n\nYour Request Status: [ ${statusLabel} ]\nOrder Date: ${formatDate(request.date)}\n\nWe are currently preparing your items and will contact you shortly regarding delivery arrangements. Thank you for your business! 🌸`;
        
        const textToUse = language === 'ar' ? messageAr : messageEn;
        const encodedText = encodeURIComponent(textToUse);
        window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
    };
    
    useEffect(() => {
        if (selectedItemId && requests.length > 0) {
            const requestFromNotification = requests.find(r => r.id === selectedItemId);
            if (requestFromNotification) {
                setRequestToView(requestFromNotification);
                setSelectedItemId(null); // Clear after use
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
        if (confirm(t('requests.delete_confirmation') || 'Are you sure you want to delete this customer order?')) {
            await deleteRequest(request.id);
        }
    };

    return (
        <div>
            <h3 className="text-3xl font-medium text-text-primary dark:text-dark-text-primary">{t('requests.title')}</h3>

            <div className="mt-8 bg-card shadow-lg rounded-lg overflow-hidden dark:bg-dark-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-text-secondary dark:text-dark-text-secondary">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('requests.table.customer')}</th>
                                <th scope="col" className="px-6 py-3">{t('requests.table.phone')}</th>
                                <th scope="col" className="px-6 py-3">{t('requests.table.date')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('requests.table.status')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('requests.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request: Request) => (
                                <tr key={request.id} className="bg-card border-b dark:bg-dark-card dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap dark:text-white">{request.customerName}</td>
                                    <td className="px-6 py-4">{request.customerPhone}</td>
                                    <td className="px-6 py-4">{formatDate(request.date)}</td>
                                    <td className="px-6 py-4 text-center">
                                         <select
                                            value={request.status}
                                            onChange={(e) => updateRequestStatus(request.id, e.target.value as Request['status'])}
                                            className={`p-2 border-none rounded text-xs text-white appearance-none text-center ${
                                                request.status === 'Completed' ? 'bg-green-500' :
                                                request.status === 'Processing' ? 'bg-blue-500' :
                                                request.status === 'Cancelled' ? 'bg-red-500' :
                                                'bg-yellow-500'
                                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-opacity-80`}
                                            style={{ paddingRight: '1.5rem' }}
                                        >
                                            {requestStatuses.map(status => (
                                                <option key={status} value={status} className="bg-gray-800 text-white">
                                                    {t(`requests.status_labels.${status}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => setRequestToView(request)} 
                                                className="p-1 px-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-750/50 rounded-lg transition-colors"
                                                title={t('general.details') || 'Details'}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => setRequestToEdit(request)} 
                                                className="p-1 px-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title={t('general.edit') || 'Edit'}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => setRequestToPrint(request)} 
                                                className="p-1 px-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                                title={t('orders.table.print') || 'Print'}
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleWhatsAppConfirm(request)} 
                                                className="p-1 px-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                                title={language === 'ar' ? 'تأكيد الطلب عبر واتساب' : 'Confirm via WhatsApp'}
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteRequest(request)} 
                                                className="p-1 px-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title={t('general.delete') || 'Delete'}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            {request.status === 'Pending' && (
                                                <button 
                                                    onClick={() => handleApproveRequest(request)} 
                                                    className="px-2.5 py-1 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-200 hover:text-green-800 rounded text-xs transition"
                                                >
                                                    {t('requests.table.create_order')}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {requestToView && (
                <RequestDetailModal
                    request={requestToView}
                    onClose={() => setRequestToView(null)}
                    onApprove={handleApproveRequest}
                    onReject={handleRejectRequest}
                />
            )}
            {requestToEdit && (
                <EditRequestModal
                    request={requestToEdit}
                    onClose={() => setRequestToEdit(null)}
                    onSave={handleSaveRequest}
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
