

import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { PurchaseOrder } from '../types';
import AddPurchaseOrderModal from '../components/purchaseorders/AddPurchaseOrderModal';
import PurchaseOrderDetailModal from '../components/purchaseorders/PurchaseOrderDetailModal';

const PurchaseOrdersScreen: React.FC = () => {
    const { purchaseOrders, suppliers, addPurchaseOrder, receivePurchaseOrder } = useAppContext();
    const { t, formatDate, formatCurrency } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
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
            <div className="flex justify-between items-center">
                <h3 className="text-3xl font-medium text-text-primary dark:text-dark-text-primary">{t('purchaseOrders.title')}</h3>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition"
                >
                    {t('purchaseOrders.new_po_button')}
                </button>
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
        </div>
    );
};

export default PurchaseOrdersScreen;