

import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { PurchaseOrder } from '../types';
import AddPurchaseOrderModal from '../components/purchaseorders/AddPurchaseOrderModal';
import PurchaseOrderDetailModal from '../components/purchaseorders/PurchaseOrderDetailModal';
import { AiInvoiceScannerModal } from '../components/ai/AiInvoiceScannerModal';
import { Sparkles, Camera, Plus } from 'lucide-react';

const PurchaseOrdersScreen: React.FC = () => {
    const { purchaseOrders, suppliers, addPurchaseOrder, receivePurchaseOrder } = useAppContext();
    const { t, formatDate, formatCurrency } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
    const [receivingPoId, setReceivingPoId] = useState<string | null>(null);
    const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

    const { language } = useTranslation();
    const isAr = language === 'ar';
    const getSupplierName = (supplierId: string) => {
        if (!supplierId) return isAr ? 'مورد غير محدد' : 'Unspecified Supplier';
        const found = suppliers.find(s => s.id === supplierId || s.name === supplierId);
        return found?.name || supplierId;
    };
    
    const handleReceiveOrder = async (orderId: string) => {
        if (window.confirm(t('purchaseOrders.receive_confirmation'))) {
            setReceivingPoId(orderId);
            try {
                await receivePurchaseOrder(orderId);
            } catch (error) {
                console.error("Failed to receive purchase order:", error);
                alert(`Failed to receive order: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setReceivingPoId(null);
            }
        }
    };
    
    const handleSavePurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'poNumber'>) => {
        addPurchaseOrder(poData);
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-3xl font-medium text-text-primary dark:text-dark-text-primary">{t('purchaseOrders.title')}</h3>
                <div className="flex items-center gap-2">
                    <button 
                        type="button"
                        onClick={() => setIsAiScannerOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/15 via-amber-500/15 to-purple-600/15 hover:from-purple-600/25 hover:to-amber-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer group"
                    >
                        <Sparkles className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform duration-300 animate-pulse" />
                        <span>{isAr ? 'مسح فاتورة المورد (AI OCR) 📷' : 'Scan Vendor Invoice 📷'}</span>
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition text-xs sm:text-sm font-bold shadow cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('purchaseOrders.new_po_button')}</span>
                    </button>
                </div>
            </div>

            <div className="mt-8 bg-card shadow-lg rounded-lg overflow-hidden dark:bg-dark-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-text-secondary dark:text-dark-text-secondary">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('purchaseOrders.table.po_number')}</th>
                                <th scope="col" className="px-6 py-3">{t('purchaseOrders.table.supplier')}</th>
                                <th scope="col" className="px-6 py-3">{t('purchaseOrders.table.date')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('purchaseOrders.table.total')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('purchaseOrders.table.status')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('purchaseOrders.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseOrders.map((po: PurchaseOrder) => (
                                <tr key={po.id} className="bg-card border-b dark:bg-dark-card dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap dark:text-white">{po.poNumber}</td>
                                    <td className="px-6 py-4">{getSupplierName(po.supplierId)}</td>
                                    <td className="px-6 py-4">{formatDate(po.date)}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(po.totalAmount)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            po.status === 'Received' ? 'bg-green-100 text-green-800' :
                                            po.status === 'Partial' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {t(`purchaseOrders.status_labels.${po.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-2 rtl:space-x-reverse">
                                        <button onClick={() => setSelectedPo(po)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">{t('purchaseOrders.table.details')}</button>
                                        {po.status !== 'Received' && (
                                            <button 
                                                onClick={() => handleReceiveOrder(po.id)} 
                                                className="font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={receivingPoId === po.id}
                                            >
                                                {receivingPoId === po.id ? t('purchaseOrders.table.receiving') : t('purchaseOrders.table.receive')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && (
                <AddPurchaseOrderModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSavePurchaseOrder}
                />
            )}
            {selectedPo && (
                <PurchaseOrderDetailModal
                    purchaseOrder={selectedPo}
                    onClose={() => setSelectedPo(null)}
                />
            )}

            {/* AI Vendor Invoice OCR Scanner Modal */}
            <AiInvoiceScannerModal
                isOpen={isAiScannerOpen}
                onClose={() => setIsAiScannerOpen(false)}
                onApplyPurchaseOrder={(parsedData) => {
                    // Match supplier
                    const foundSupplier = suppliers.find(s => 
                        s.id === parsedData.supplierId || 
                        (parsedData.supplierName && s.name.toLowerCase().includes(parsedData.supplierName.toLowerCase()))
                    );

                    const newPoPayload = {
                        supplierId: foundSupplier ? foundSupplier.id : (suppliers[0]?.id || 'unknown'),
                        date: parsedData.invoiceDate || new Date().toISOString(),
                        items: parsedData.items.map(it => ({
                            productId: it.productId || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                            quantity: it.quantity || 1,
                            purchasePrice: it.unitPrice || 0
                        })),
                        totalAmount: parsedData.totalAmount || 0,
                        status: 'Pending' as const,
                        notes: `تم التوليد التلقائي عبر الذكاء الاصطناعي (AI OCR) من فاتورة رقم: ${parsedData.invoiceNumber || 'N/A'}`
                    };

                    addPurchaseOrder(newPoPayload as any);
                    setIsAiScannerOpen(false);
                }}
            />
        </div>
    );
};

export default PurchaseOrdersScreen;