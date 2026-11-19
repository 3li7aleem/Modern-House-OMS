import React from 'react';
import { RepairInvoice, Customer } from '../../types';
import { 
    Clock, 
    Wrench, 
    CheckCircle2, 
    Truck, 
    User, 
    Phone, 
    ChevronRight, 
    ChevronLeft, 
    ArrowRight,
    ArrowLeft,
    AlertTriangle,
    Tag,
    Eye
} from 'lucide-react';

interface MaintenanceKanbanProps {
    repairs: RepairInvoice[];
    customers: Customer[];
    onSelectRepair: (repair: RepairInvoice) => void;
    onStatusChange: (id: string, status: RepairInvoice['status']) => Promise<void>;
    language: 'ar' | 'en';
    formatCurrency: (amount: number) => string;
    formatDate: (date: string) => string;
}

interface ColumnConfig {
    id: RepairInvoice['status'];
    titleAr: string;
    titleEn: string;
    color: string;
    bgHeader: string;
    icon: React.ReactNode;
}

export const MaintenanceKanban: React.FC<MaintenanceKanbanProps> = ({
    repairs,
    customers,
    onSelectRepair,
    onStatusChange,
    language,
    formatCurrency,
    formatDate
}) => {
    const isAr = language === 'ar';

    const columns: ColumnConfig[] = [
        {
            id: 'Pending',
            titleAr: 'قيد الانتظار والاستلام',
            titleEn: 'Pending',
            color: 'text-amber-600 dark:text-amber-400',
            bgHeader: 'bg-amber-500/10 border-amber-200 dark:border-amber-900',
            icon: <Clock className="w-4 h-4" />
        },
        {
            id: 'In Progress',
            titleAr: 'قيد الفحص والإصلاح',
            titleEn: 'In Progress',
            color: 'text-blue-600 dark:text-blue-400',
            bgHeader: 'bg-blue-500/10 border-blue-200 dark:border-blue-900',
            icon: <Wrench className="w-4 h-4" />
        },
        {
            id: 'Ready',
            titleAr: 'جاهز للاستلام',
            titleEn: 'Ready for Pickup',
            color: 'text-emerald-600 dark:text-emerald-400',
            bgHeader: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-900',
            icon: <CheckCircle2 className="w-4 h-4" />
        },
        {
            id: 'Delivered',
            titleAr: 'تم التسليم للعميل',
            titleEn: 'Delivered',
            color: 'text-slate-600 dark:text-slate-400',
            bgHeader: 'bg-slate-500/10 border-slate-200 dark:border-slate-800',
            icon: <Truck className="w-4 h-4" />
        }
    ];

    const getNextStatus = (current: RepairInvoice['status']): RepairInvoice['status'] | null => {
        switch (current) {
            case 'Pending': return 'In Progress';
            case 'In Progress': return 'Ready';
            case 'Ready': return 'Delivered';
            default: return null;
        }
    };

    const getPrevStatus = (current: RepairInvoice['status']): RepairInvoice['status'] | null => {
        switch (current) {
            case 'In Progress': return 'Pending';
            case 'Ready': return 'In Progress';
            case 'Delivered': return 'Ready';
            default: return null;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
            {columns.map(col => {
                const colRepairs = repairs.filter(r => r.status === col.id);

                return (
                    <div 
                        key={col.id} 
                        className="bg-slate-50/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[750px] overflow-hidden shadow-xs"
                    >
                        {/* Column Header */}
                        <div className={`p-3.5 border-b flex items-center justify-between ${col.bgHeader}`}>
                            <div className="flex items-center gap-2">
                                <span className={col.color}>{col.icon}</span>
                                <h4 className={`text-xs font-bold ${col.color}`}>
                                    {isAr ? col.titleAr : col.titleEn}
                                </h4>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs font-mono">
                                {colRepairs.length}
                            </span>
                        </div>

                        {/* Column Cards List */}
                        <div className="p-3 overflow-y-auto space-y-3 flex-1">
                            {colRepairs.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-xs italic">
                                    {isAr ? 'لا توجد تذاكر في هذه المرحلة' : 'No tickets in this stage'}
                                </div>
                            ) : (
                                colRepairs.map(repair => {
                                    const customer = customers.find(c => c.id === repair.customerId);
                                    const nextStatus = getNextStatus(repair.status);
                                    const prevStatus = getPrevStatus(repair.status);

                                    return (
                                        <div
                                            key={repair.id}
                                            onClick={() => onSelectRepair(repair)}
                                            className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between space-y-2.5"
                                        >
                                            {/* Top Line: Ticket # & Priority */}
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary transition">
                                                    {repair.repairNumber}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {repair.priority === 'Urgent' && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                                                            {isAr ? 'عاجل' : 'Urgent'}
                                                        </span>
                                                    )}
                                                    {repair.warrantyStatus === 'Under Warranty' && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                                            {isAr ? 'ضمان' : 'Warranty'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Customer Name */}
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                                                    {customer?.name || (isAr ? 'عميل غير مسجل' : 'Unknown')}
                                                </p>
                                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                    {customer?.phone || ''}
                                                </p>
                                            </div>

                                            {/* Device & Problem summary */}
                                            <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-xs space-y-1">
                                                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                                                    <Tag className="w-3 h-3 text-primary flex-shrink-0" />
                                                    <span>{repair.deviceType || (isAr ? 'جهاز منزلي' : 'Appliance')} {repair.brandModel ? `(${repair.brandModel})` : ''}</span>
                                                </div>
                                                {repair.problemDescription && (
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                                        {repair.problemDescription}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Bottom Card Controls: Price & Quick Advance Buttons */}
                                            <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60" onClick={e => e.stopPropagation()}>
                                                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(repair.totalAmount)}
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    {prevStatus && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onStatusChange(repair.id, prevStatus)}
                                                            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] transition"
                                                            title={isAr ? 'رجوع للمرحلة السابقة' : 'Move to Previous Stage'}
                                                        >
                                                            {isAr ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                                                        </button>
                                                    )}
                                                    {nextStatus && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onStatusChange(repair.id, nextStatus)}
                                                            className="px-2 py-1 rounded-md bg-primary/10 hover:bg-primary text-primary hover:text-white text-[11px] font-semibold transition flex items-center gap-1"
                                                            title={isAr ? 'نقل للمرحلة التالية' : 'Move to Next Stage'}
                                                        >
                                                            <span>{isAr ? 'تقديم' : 'Next'}</span>
                                                            {isAr ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
