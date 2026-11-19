import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { Supplier } from '../types';
import AddEditSupplierModal from '../components/suppliers/AddSupplierModal';
import { Edit, Trash2 } from 'lucide-react';

const SuppliersScreen: React.FC = () => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useAppContext();
    const { t } = useTranslation();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

    const handleSaveSupplier = async (supplierData: Omit<Supplier, 'id'>, supplierId?: string) => {
        try {
            if (supplierId) {
                await updateSupplier(supplierId, supplierData);
            } else {
                await addSupplier(supplierData);
            }
            setIsAddModalOpen(false);
            setSupplierToEdit(null);
        } catch (error: any) {
            console.error("Failed to save supplier:", error);
            alert(t('common.error_saving') || "Failed to save supplier.");
        }
    };

    const handleEditSupplier = (supplier: Supplier) => {
        setSupplierToEdit(supplier);
        setIsAddModalOpen(true);
    };

    const handleDeleteSupplier = async (supplierId: string) => {
        if (window.confirm(t('common.delete_confirm') || "Are you sure you want to delete this supplier?")) {
            await deleteSupplier(supplierId);
        }
    };

    return (
        <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <h3 className="text-3xl font-medium text-text-primary dark:text-dark-text-primary">{t('suppliers.title')}</h3>
                <button 
                    onClick={() => { setSupplierToEdit(null); setIsAddModalOpen(true); }}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition"
                >
                    {t('suppliers.add_supplier_button')}
                </button>
            </div>

            <div className="mt-8 bg-card shadow-lg rounded-lg overflow-hidden dark:bg-dark-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-text-secondary dark:text-dark-text-secondary">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('suppliers.table.name')}</th>
                                <th scope="col" className="px-6 py-3">{t('suppliers.table.email')}</th>
                                <th scope="col" className="px-6 py-3">{t('suppliers.table.contact')}</th>
                                <th scope="col" className="px-6 py-3">{t('suppliers.table.phone')}</th>
                                <th scope="col" className="px-6 py-3">{t('general.actions') || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((supplier: Supplier) => (
                                <tr key={supplier.id} className="bg-card border-b dark:bg-dark-card dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap dark:text-white">{supplier.name}</td>
                                    <td className="px-6 py-4">{supplier.email || '-'}</td>
                                    <td className="px-6 py-4">{supplier.contactPerson}</td>
                                    <td className="px-6 py-4">{supplier.phone}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleEditSupplier(supplier)} className="text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg transition-colors group/btn" title={t('general.edit') || "Edit"}>
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteSupplier(supplier.id)} className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/30 p-2 rounded-lg transition-colors group/btn" title={t('general.delete') || "Delete"}>
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddModalOpen && (
                <AddEditSupplierModal
                    onClose={() => { setIsAddModalOpen(false); setSupplierToEdit(null); }}
                    onSave={handleSaveSupplier}
                    supplierToEdit={supplierToEdit}
                />
            )}
        </div>
    );
};

export default SuppliersScreen;