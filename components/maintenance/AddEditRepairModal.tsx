import React, { useState, useEffect } from 'react';
import { Customer, Employee, RepairInvoice } from '../../types';
import { 
    X, 
    Wrench, 
    Plus, 
    Trash2, 
    Calendar, 
    User, 
    Phone, 
    Tag, 
    ShieldCheck, 
    AlertTriangle, 
    Clock, 
    Coins, 
    Check, 
    FileText 
} from 'lucide-react';

interface AddEditRepairModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingRepair: RepairInvoice | null;
    customers: Customer[];
    employees: Employee[];
    onSave: (repairData: Omit<RepairInvoice, 'id' | 'repairNumber'>) => Promise<void>;
    language: 'ar' | 'en';
    formatCurrency: (amount: number) => string;
}

const COMMON_DEVICE_TYPES_AR = [
    'خلاط كهربائي ومحضر طعام',
    'ماكينة قهوة وإسبريسو',
    'قلاية هوائية (Air Fryer)',
    'فرن وميكروويف',
    'غلاية كهربائية',
    'طباخ ليزري وسطحي',
    'عصارة فواكه وخضار',
    'عجانة ومضرب بيض',
    'أواني ضغط وأجهزة طهي',
    'جهاز منزلي آخر'
];

export const AddEditRepairModal: React.FC<AddEditRepairModalProps> = ({
    isOpen,
    onClose,
    editingRepair,
    customers,
    employees,
    onSave,
    language,
    formatCurrency
}) => {
    const isAr = language === 'ar';

    const [customerId, setCustomerId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedReturnDate, setExpectedReturnDate] = useState('');
    const [status, setStatus] = useState<RepairInvoice['status']>('Pending');
    const [deviceType, setDeviceType] = useState('');
    const [brandModel, setBrandModel] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [problemDescription, setProblemDescription] = useState('');
    const [technicianName, setTechnicianName] = useState('');
    const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
    const [warrantyStatus, setWarrantyStatus] = useState<'Under Warranty' | 'Out of Warranty'>('Out of Warranty');
    const [items, setItems] = useState<{ description: string; cost: number }[]>([
        { description: '', cost: 0 }
    ]);
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partial' | 'Unpaid'>('Unpaid');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate or reset form
    useEffect(() => {
        if (editingRepair) {
            setCustomerId(editingRepair.customerId || '');
            setDate(editingRepair.date ? editingRepair.date.split('T')[0] : new Date().toISOString().split('T')[0]);
            setExpectedReturnDate(editingRepair.expectedReturnDate ? editingRepair.expectedReturnDate.split('T')[0] : '');
            setStatus(editingRepair.status || 'Pending');
            setDeviceType(editingRepair.deviceType || '');
            setBrandModel(editingRepair.brandModel || '');
            setSerialNumber(editingRepair.serialNumber || '');
            setProblemDescription(editingRepair.problemDescription || '');
            setTechnicianName(editingRepair.technicianName || '');
            setPriority(editingRepair.priority || 'Normal');
            setWarrantyStatus(editingRepair.warrantyStatus || 'Out of Warranty');
            setItems(editingRepair.items && editingRepair.items.length > 0 
                ? editingRepair.items 
                : [{ description: '', cost: 0 }]
            );
            setPaidAmount(editingRepair.paidAmount || 0);
            setPaymentStatus(editingRepair.paymentStatus || 'Unpaid');
            setNotes(editingRepair.notes || '');
        } else {
            setCustomerId('');
            setDate(new Date().toISOString().split('T')[0]);
            setExpectedReturnDate('');
            setStatus('Pending');
            setDeviceType('');
            setBrandModel('');
            setSerialNumber('');
            setProblemDescription('');
            setTechnicianName(employees[0]?.name || '');
            setPriority('Normal');
            setWarrantyStatus('Out of Warranty');
            setItems([{ description: '', cost: 0 }]);
            setPaidAmount(0);
            setPaymentStatus('Unpaid');
            setNotes('');
        }
    }, [editingRepair, isOpen, employees]);

    const totalAmount = items.reduce((acc, item) => acc + (Number(item.cost) || 0), 0);
    const remainingBalance = Math.max(0, totalAmount - paidAmount);

    // Auto-update paymentStatus based on paidAmount vs totalAmount
    const handlePaidAmountChange = (amount: number) => {
        setPaidAmount(amount);
        if (amount >= totalAmount && totalAmount > 0) {
            setPaymentStatus('Paid');
        } else if (amount > 0 && amount < totalAmount) {
            setPaymentStatus('Partial');
        } else {
            setPaymentStatus('Unpaid');
        }
    };

    const handleAddItem = () => {
        setItems(prev => [...prev, { description: '', cost: 0 }]);
    };

    const handleItemChange = (index: number, field: 'description' | 'cost', value: string | number) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length <= 1) return;
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId) {
            alert(isAr ? 'الرجاء اختيار العميل.' : 'Please select a customer.');
            return;
        }

        // Validate items
        const validItems = items.filter(item => item.description.trim() !== '');
        if (validItems.length === 0) {
            alert(isAr ? 'الرجاء إدخال بند إصلاح أو فحص واحد على الأقل.' : 'Please provide at least one repair item or inspection description.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({
                customerId,
                date: new Date(date).toISOString(),
                expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate).toISOString() : undefined,
                status,
                deviceType: deviceType.trim() || undefined,
                brandModel: brandModel.trim() || undefined,
                serialNumber: serialNumber.trim() || undefined,
                problemDescription: problemDescription.trim() || undefined,
                technicianName: technicianName.trim() || undefined,
                priority,
                warrantyStatus,
                items: validItems,
                totalAmount,
                paidAmount,
                paymentStatus,
                notes: notes.trim() || undefined
            });
            onClose();
        } catch (err) {
            console.error('Error saving repair invoice:', err);
            alert(isAr ? 'حدث خطأ أثناء حفظ الفاتورة، يرجى المحاولة ثانية.' : 'Failed to save repair invoice. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
            onClick={onClose}
            style={{ direction: isAr ? 'rtl' : 'ltr' }}
        >
            <div 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[92vh] animate-fade-in-scale text-slate-800 dark:text-slate-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                            <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editingRepair 
                                    ? (isAr ? `تعديل تذكرة الصيانة #${editingRepair.repairNumber}` : `Edit Repair Ticket #${editingRepair.repairNumber}`)
                                    : (isAr ? 'إنشاء تذكرة صيانة وإصلاح جديدة' : 'New Maintenance & Repair Ticket')
                                }
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {isAr 
                                    ? 'تسجيل فحص وإصلاح الأجهزة وأدوات المطبخ مع متابعة قطع الغيار والضمان' 
                                    : 'Log kitchenware & device repairs, inspection symptoms, parts, and warranty status'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    
                    {/* Section 1: Customer & Schedule */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary" />
                            <span>{isAr ? 'بيانات العميل والمواعيد' : 'Customer & Schedule'}</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-1">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'العميل' : 'Customer'} *
                                </label>
                                <select
                                    required
                                    value={customerId}
                                    onChange={e => setCustomerId(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="">{isAr ? 'اختر العميل...' : 'Select Customer...'}</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.phone ? `(${c.phone})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'تاريخ الاستلام' : 'Received Date'} *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'التاريخ المتوقع للتسليم' : 'Expected Ready Date'}
                                </label>
                                <input
                                    type="date"
                                    value={expectedReturnDate}
                                    onChange={e => setExpectedReturnDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Device Specs & Fault Information */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-primary" />
                            <span>{isAr ? 'مواصفات الجهاز ونوع العطل' : 'Device Specifications & Fault Diagnosis'}</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'نوع الجهاز أو القطعة' : 'Device / Item Type'}
                                </label>
                                <input
                                    type="text"
                                    list="device-types-list"
                                    value={deviceType}
                                    onChange={e => setDeviceType(e.target.value)}
                                    placeholder={isAr ? 'مثال: خلاط كهربائي، ماكينة قهوة' : 'e.g. Blender, Espresso Machine'}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <datalist id="device-types-list">
                                    {COMMON_DEVICE_TYPES_AR.map(t => (
                                        <option key={t} value={t} />
                                    ))}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'الماركة والموديل' : 'Brand & Model'}
                                </label>
                                <input
                                    type="text"
                                    value={brandModel}
                                    onChange={e => setBrandModel(e.target.value)}
                                    placeholder={isAr ? 'مثال: فيليبس Philips HR3752' : 'e.g. Philips HR3752'}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'الرقم التسلسلي (Serial Number)' : 'Serial Number'}
                                </label>
                                <input
                                    type="text"
                                    value={serialNumber}
                                    onChange={e => setSerialNumber(e.target.value)}
                                    placeholder={isAr ? 'رقم السيريال إن وجد' : 'Serial number'}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {isAr ? 'وصف العطل أو المشكلة المبلغ عنها من العميل' : 'Reported Problem / Symptoms'}
                            </label>
                            <textarea
                                value={problemDescription}
                                onChange={e => setProblemDescription(e.target.value)}
                                rows={2}
                                placeholder={isAr ? 'مثال: الجهاز لا يعمل نهائياً عند التوصيل بالكهرباء، أو صوت غير طبيعي بالمحرك...' : 'e.g. Device does not turn on, motor makes clicking sound...'}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'حالة الضمان' : 'Warranty Status'}
                                </label>
                                <select
                                    value={warrantyStatus}
                                    onChange={e => setWarrantyStatus(e.target.value as any)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white"
                                >
                                    <option value="Under Warranty">{isAr ? 'تحت الضمان (مجاني أو مغطى)' : 'Under Warranty'}</option>
                                    <option value="Out of Warranty">{isAr ? 'خارج الضمان (مدفوع)' : 'Out of Warranty'}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'درجة الأولوية' : 'Priority Level'}
                                </label>
                                <select
                                    value={priority}
                                    onChange={e => setPriority(e.target.value as any)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white"
                                >
                                    <option value="Normal">{isAr ? 'عادي (Normal)' : 'Normal'}</option>
                                    <option value="High">{isAr ? 'مرتفع (High)' : 'High'}</option>
                                    <option value="Urgent">{isAr ? 'عاجل جداً (Urgent)' : 'Urgent'}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'الفني المسؤول' : 'Assigned Technician'}
                                </label>
                                <input
                                    type="text"
                                    list="technicians-list"
                                    value={technicianName}
                                    onChange={e => setTechnicianName(e.target.value)}
                                    placeholder={isAr ? 'اسم الفني المسؤول' : 'Technician name'}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white"
                                />
                                <datalist id="technicians-list">
                                    {employees.map(e => (
                                        <option key={e.id} value={e.name} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Repair Items & Parts Breakdown */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-primary" />
                                <span>{isAr ? 'بنود الإصلاح وقطع الغيار والعمالة' : 'Labor, Services & Spare Parts'}</span>
                            </h4>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            >
                                <Plus className="w-3 h-3" />
                                <span>{isAr ? 'إضافة بند' : 'Add Item'}</span>
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={e => handleItemChange(index, 'description', e.target.value)}
                                            placeholder={isAr ? 'مثال: فحص الدائرة الكهربائية / استبدال التروس / تنظيف شامل' : 'e.g. Gear replacement, Motor servicing'}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={item.cost || ''}
                                            onChange={e => handleItemChange(index, 'cost', parseFloat(e.target.value) || 0)}
                                            placeholder={isAr ? 'التكلفة' : 'Cost'}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-mono text-slate-900 dark:text-white text-end focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="p-2.5 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Status & Financials */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-primary" />
                            <span>{isAr ? 'الحالة الحالية والمدفوعات' : 'Current Status & Financials'}</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'حالة التذكرة' : 'Ticket Status'} *
                                </label>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value as any)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white font-semibold"
                                >
                                    <option value="Pending">{isAr ? 'قيد الانتظار والاستلام (Pending)' : 'Pending'}</option>
                                    <option value="In Progress">{isAr ? 'قيد الفحص والإصلاح (In Progress)' : 'In Progress'}</option>
                                    <option value="Ready">{isAr ? 'جاهز للاستلام (Ready)' : 'Ready'}</option>
                                    <option value="Delivered">{isAr ? 'تم التسليم للعميل (Delivered)' : 'Delivered'}</option>
                                    <option value="Cancelled">{isAr ? 'ملغي (Cancelled)' : 'Cancelled'}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'المبلغ المدفوع مقدماً' : 'Paid / Advance Amount'}
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={paidAmount || ''}
                                    onChange={e => handlePaidAmountChange(parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-mono text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'حالة الدفع' : 'Payment Status'}
                                </label>
                                <select
                                    value={paymentStatus}
                                    onChange={e => setPaymentStatus(e.target.value as any)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white"
                                >
                                    <option value="Unpaid">{isAr ? 'غير مدفوع' : 'Unpaid'}</option>
                                    <option value="Partial">{isAr ? 'دفع جزئي / عربون' : 'Partial'}</option>
                                    <option value="Paid">{isAr ? 'مدفوع بالكامل' : 'Paid in Full'}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {isAr ? 'ملاحظات فنية إضافية' : 'Additional Technical Notes'}
                            </label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                placeholder={isAr ? 'أي إرشادات أو ملاحظات خاصة بقطع الغيار أو التسليم...' : 'Special instructions, spare part requirements...'}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white resize-none"
                            />
                        </div>

                        {/* Financial Totals Banner */}
                        <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 block">{isAr ? 'المبلغ الإجمالي للإصلاح:' : 'Total Repair Cost:'}</span>
                                <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 block">{isAr ? 'المسدد:' : 'Paid:'}</span>
                                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(paidAmount)}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 block">{isAr ? 'المتبقي عند الاستلام:' : 'Remaining Due:'}</span>
                                <span className={`text-base font-bold font-mono ${remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                                    {formatCurrency(remainingBalance)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-sm transition flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            <span>{editingRepair ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إصدار التذكرة' : 'Create Ticket')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
