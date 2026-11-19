import React, { useState, useEffect, useRef } from 'react';
import { RepairInvoice, Customer } from '../../types';
import { 
    X, 
    Wrench, 
    Printer, 
    Edit, 
    Trash2, 
    MessageSquare, 
    Phone, 
    Calendar, 
    User, 
    Tag, 
    ShieldCheck, 
    Coins, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Check,
    Camera,
    Eye,
    ZoomIn,
    Upload,
    RefreshCw,
    Image as ImageIcon
} from 'lucide-react';
import { printRepairInvoice } from './printRepairInvoice';

interface RepairDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    repair: RepairInvoice | null;
    customer?: Customer;
    onEdit: (repair: RepairInvoice) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: RepairInvoice['status']) => Promise<void>;
    onUpdatePhotos?: (id: string, photos: { beforeImageUrl?: string; afterImageUrl?: string }) => Promise<void>;
    language: 'ar' | 'en';
    formatCurrency: (amount: number) => string;
    formatDate: (date: string) => string;
}

export const RepairDetailsModal: React.FC<RepairDetailsModalProps> = ({
    isOpen,
    onClose,
    repair,
    customer,
    onEdit,
    onDelete,
    onStatusChange,
    onUpdatePhotos,
    language,
    formatCurrency,
    formatDate
}) => {
    if (!isOpen || !repair) return null;

    const isAr = language === 'ar';
    const remainingBalance = Math.max(0, repair.totalAmount - (repair.paidAmount || 0));

    // Photo states
    const [beforeImage, setBeforeImage] = useState<string | undefined>(repair.beforeImageUrl || repair.photos?.[0]);
    const [afterImage, setAfterImage] = useState<string | undefined>(repair.afterImageUrl || repair.photos?.[1]);
    const [isUploading, setIsUploading] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

    const beforeInputRef = useRef<HTMLInputElement>(null);
    const afterInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (repair) {
            setBeforeImage(repair.beforeImageUrl || repair.photos?.[0]);
            setAfterImage(repair.afterImageUrl || repair.photos?.[1]);
        }
    }, [repair]);

    // Canvas image compression (1200px max, 0.82 JPEG quality)
    const compressImageFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const maxDim = 1200;
                    let { width, height } = img;
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(e.target?.result as string);
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressed = canvas.toDataURL('image/jpeg', 0.82);
                    resolve(compressed);
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handlePhotoSelected = async (file: File, type: 'before' | 'after') => {
        try {
            setIsUploading(true);
            const compressed = await compressImageFile(file);
            if (type === 'before') {
                setBeforeImage(compressed);
                if (onUpdatePhotos) {
                    await onUpdatePhotos(repair.id, { beforeImageUrl: compressed, afterImageUrl: afterImage });
                }
            } else {
                setAfterImage(compressed);
                if (onUpdatePhotos) {
                    await onUpdatePhotos(repair.id, { beforeImageUrl: beforeImage, afterImageUrl: compressed });
                }
            }
        } catch (err) {
            console.error('Failed to capture photo:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePhoto = async (type: 'before' | 'after') => {
        if (type === 'before') {
            setBeforeImage(undefined);
            if (onUpdatePhotos) {
                await onUpdatePhotos(repair.id, { beforeImageUrl: '', afterImageUrl: afterImage });
            }
        } else {
            setAfterImage(undefined);
            if (onUpdatePhotos) {
                await onUpdatePhotos(repair.id, { beforeImageUrl: beforeImage, afterImageUrl: '' });
            }
        }
    };

    const getStatusBadge = (status: RepairInvoice['status']) => {
        switch (status) {
            case 'Pending':
                return {
                    label: isAr ? 'قيد الانتظار والاستلام' : 'Pending',
                    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                };
            case 'In Progress':
                return {
                    label: isAr ? 'قيد الفحص والإصلاح' : 'In Progress',
                    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                };
            case 'Ready':
                return {
                    label: isAr ? 'جاهز للاستلام من المعرض' : 'Ready for Pickup',
                    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                };
            case 'Delivered':
                return {
                    label: isAr ? 'تم التسليم للعميل' : 'Delivered',
                    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                };
            case 'Cancelled':
                return {
                    label: isAr ? 'ملغي' : 'Cancelled',
                    color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-300 dark:border-red-800'
                };
            default:
                return { label: status, color: 'bg-gray-100 text-gray-700' };
        }
    };

    const statusBadge = getStatusBadge(repair.status);

    const handleSendWhatsAppUpdate = () => {
        const phone = customer?.phone?.replace(/[+\s-]/g, '') || '';
        let cleanPhone = phone;
        if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.slice(2);
        if (cleanPhone.length === 8 && !cleanPhone.startsWith('973')) {
            cleanPhone = '973' + cleanPhone;
        }

        const customerName = customer?.name || (isAr ? 'عزيزنا العميل' : 'Valued Customer');
        const deviceName = repair.deviceType || (isAr ? 'الجهاز' : 'Appliance');
        const repairNum = repair.repairNumber;

        let message = '';
        if (repair.status === 'Ready') {
            message = isAr
                ? `مرحباً ${customerName}، يسعدنا إبلاغك بأن جهازك (${deviceName}) برقم إيصال ${repairNum} أصبح جاهزاً الآن للاستلام من معرض مودرن هاوس! 🛠️✨\nالمبلغ المتبقي: ${formatCurrency(remainingBalance)}.\nأوقات العمل: من 9 صباحاً حتى 10 مساءً. نسعد بزيارتك!`
                : `Hello ${customerName}, your device (${deviceName}) with receipt #${repairNum} is now READY for pickup at Modern House! 🛠️✨\nRemaining Balance: ${formatCurrency(remainingBalance)}.\nStore Hours: 9 AM - 10 PM. Always at your service!`;
        } else if (repair.status === 'In Progress') {
            message = isAr
                ? `مرحباً ${customerName}، نفيدك بأن جهازك (${deviceName}) برقم إيصال ${repairNum} قيد الفحص والإصلاح حالياً من قبل فنيي مودرن هاوس. سنوافيك فور الانتهاء والجاهزية. شكراً لصبرك! 🔧`
                : `Hello ${customerName}, your device (${deviceName}) under ticket #${repairNum} is currently being serviced and inspected by our technicians. We will update you once ready! 🔧`;
        } else {
            message = isAr
                ? `مرحباً ${customerName}، نود تزويدك بتحديث حول طلب الصيانة رقم ${repairNum} الخاص بـ (${deviceName}) في مودرن هاوس: الحالة الحالية هي "${statusBadge.label}". للإستفسار لا تتردد بالتواصل معنا.`
                : `Hello ${customerName}, this is an update regarding repair ticket #${repairNum} for (${deviceName}) at Modern House. Current status: "${repair.status}". Feel free to reach out anytime.`;
        }

        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <>
            <div 
                className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
                onClick={onClose}
                style={{ direction: isAr ? 'rtl' : 'ltr' }}
            >
                <div 
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[92vh] animate-fade-in-scale text-slate-800 dark:text-slate-100"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                <Wrench className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                                        {repair.repairNumber}
                                    </h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.color}`}>
                                        {statusBadge.label}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isAr ? 'تاريخ الاستلام:' : 'Received:'} {formatDate(repair.date)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => printRepairInvoice(repair, customer, isAr, formatCurrency)}
                                className="p-2 text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                                title={isAr ? 'طباعة الإيصال' : 'Print Invoice'}
                            >
                                <Printer className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onEdit(repair);
                                }}
                                className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl transition"
                                title={isAr ? 'تعديل التذكرة' : 'Edit Ticket'}
                            >
                                <Edit className="w-4 h-4" />
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

                    {/* Content */}
                    <div className="p-6 space-y-6 overflow-y-auto">
                        
                        {/* Quick Status Action Bar */}
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                                {isAr ? 'تحديث مرحلة الصيانة سريعا:' : 'Quick Stage Transition:'}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                {(['Pending', 'In Progress', 'Ready', 'Delivered', 'Cancelled'] as RepairInvoice['status'][]).map(st => {
                                    const active = repair.status === st;
                                    const badge = getStatusBadge(st);
                                    return (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => onStatusChange(repair.id, st)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                                                active 
                                                    ? 'bg-primary text-white border-primary shadow-xs' 
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {active && <Check className="w-3.5 h-3.5" />}
                                            <span>{badge.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Customer & Device Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Customer Card */}
                            <div className="bg-slate-50/60 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-primary" />
                                    <span>{isAr ? 'بيانات العميل' : 'Customer Details'}</span>
                                </h4>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        {customer?.name || (isAr ? 'عميل غير مسجل' : 'Unknown')}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                                        {customer?.phone || (isAr ? 'لا يوجد هاتف' : 'No phone')}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {customer?.address || '-'}
                                    </p>
                                </div>
                                
                                {customer?.phone && (
                                    <div className="pt-2 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSendWhatsAppUpdate}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>{isAr ? 'إرسال إشعار عبر واتساب' : 'WhatsApp Update'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Device Specs Card */}
                            <div className="bg-slate-50/60 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-primary" />
                                    <span>{isAr ? 'مواصفات الجهاز المسلم' : 'Device Specifications'}</span>
                                </h4>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{isAr ? 'نوع الجهاز:' : 'Type:'}</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{repair.deviceType || (isAr ? 'أدوات مطبخ' : 'Appliance')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{isAr ? 'الماركة والموديل:' : 'Model:'}</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{repair.brandModel || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{isAr ? 'الرقم التسلسلي:' : 'Serial #:'}</span>
                                        <span className="font-mono text-slate-900 dark:text-white">{repair.serialNumber || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{isAr ? 'الضمان:' : 'Warranty:'}</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {repair.warrantyStatus === 'Under Warranty' ? (isAr ? 'تحت الضمان' : 'Under Warranty') : (isAr ? 'خارج الضمان' : 'Out of Warranty')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{isAr ? 'الفني المسند له:' : 'Technician:'}</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{repair.technicianName || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reported Issue Diagnosis */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                {isAr ? 'العطل المشخص / وصف المشكلة من العميل' : 'Reported Fault & Symptoms'}
                            </span>
                            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                                {repair.problemDescription || (isAr ? 'فحص شامل وتحديد العطل الفني' : 'General inspection')}
                            </p>
                            {repair.notes && (
                                <div className="pt-2 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700 mt-2">
                                    <b>{isAr ? 'ملاحظات:' : 'Notes:'}</b> {repair.notes}
                                </div>
                            )}
                        </div>

                        {/* Maintenance Camera Photo Documentation (Before & After) */}
                        <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent dark:from-teal-950/40 dark:via-emerald-950/40 p-4 rounded-2xl border border-teal-200 dark:border-teal-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                                        <Camera className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                            {isAr ? 'توثيق صور الصيانة بالكاميرا' : 'Maintenance Photo Documentation'}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            {isAr ? 'التقط صور الفحص المبدئي للعطل وصورة الجهاز بعد إتمام الإصلاح' : 'Capture initial inspection and completed repair photos'}
                                        </p>
                                    </div>
                                </div>
                                {isUploading && (
                                    <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 animate-pulse">
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>{isAr ? 'جارٍ المعالجة والرفع...' : 'Processing...'}</span>
                                    </div>
                                )}
                            </div>

                            {/* Two Photo Slots */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                
                                {/* Slot 1: Before Repair / Defect Photo */}
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                                            <span>{isAr ? 'صورة العطل والفحص (قبل)' : 'Before / Defect Photo'}</span>
                                        </span>
                                        {beforeImage && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxImage({ url: beforeImage, title: isAr ? 'صورة العطل والفحص المبدئي' : 'Before / Defect Photo' })}
                                                    className="p-1 text-slate-500 hover:text-teal-600 rounded transition"
                                                    title={isAr ? 'تكبير الصورة' : 'Zoom in'}
                                                >
                                                    <ZoomIn className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePhoto('before')}
                                                    className="p-1 text-red-500 hover:text-red-700 rounded transition"
                                                    title={isAr ? 'حذف الصورة' : 'Remove'}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <input 
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        ref={beforeInputRef}
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handlePhotoSelected(file, 'before');
                                            e.target.value = '';
                                        }}
                                    />

                                    {beforeImage ? (
                                        <div 
                                            className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video group cursor-pointer bg-slate-950 flex items-center justify-center"
                                            onClick={() => setLightboxImage({ url: beforeImage, title: isAr ? 'صورة العطل والفحص المبدئي' : 'Before / Defect Photo' })}
                                        >
                                            <img 
                                                src={beforeImage} 
                                                alt="Before Repair" 
                                                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white text-xs font-semibold">
                                                <Eye className="w-4 h-4" />
                                                <span>{isAr ? 'عرض بالحجم الكامل' : 'View Fullscreen'}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    beforeInputRef.current?.click();
                                                }}
                                                className="absolute bottom-2 start-2 px-2 py-1 bg-black/70 hover:bg-black/90 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition"
                                            >
                                                <Camera className="w-3 h-3" />
                                                <span>{isAr ? 'إعادة التقاط' : 'Retake'}</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => beforeInputRef.current?.click()}
                                            className="w-full aspect-video border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 rounded-lg flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-teal-600 transition p-3 bg-slate-50/50 dark:bg-slate-800/30"
                                        >
                                            <Camera className="w-6 h-6 text-slate-400 group-hover:text-teal-500" />
                                            <span className="text-xs font-semibold">{isAr ? 'التقاط صورة الفحص' : 'Take Before Photo'}</span>
                                            <span className="text-[10px] text-slate-400">{isAr ? 'كاميرا الجوال أو رفع ملف' : 'Camera or upload'}</span>
                                        </button>
                                    )}
                                </div>

                                {/* Slot 2: After Repair / Ready Photo */}
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                            <span>{isAr ? 'صورة الجهاز بعد الإصلاح (جاهز)' : 'After / Repaired Photo'}</span>
                                        </span>
                                        {afterImage && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxImage({ url: afterImage, title: isAr ? 'صورة الجهاز بعد الصيانة والإصلاح' : 'After / Repaired Photo' })}
                                                    className="p-1 text-slate-500 hover:text-emerald-600 rounded transition"
                                                    title={isAr ? 'تكبير الصورة' : 'Zoom in'}
                                                >
                                                    <ZoomIn className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePhoto('after')}
                                                    className="p-1 text-red-500 hover:text-red-700 rounded transition"
                                                    title={isAr ? 'حذف الصورة' : 'Remove'}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <input 
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        ref={afterInputRef}
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handlePhotoSelected(file, 'after');
                                            e.target.value = '';
                                        }}
                                    />

                                    {afterImage ? (
                                        <div 
                                            className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video group cursor-pointer bg-slate-950 flex items-center justify-center"
                                            onClick={() => setLightboxImage({ url: afterImage, title: isAr ? 'صورة الجهاز بعد الصيانة والإصلاح' : 'After / Repaired Photo' })}
                                        >
                                            <img 
                                                src={afterImage} 
                                                alt="After Repair" 
                                                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white text-xs font-semibold">
                                                <Eye className="w-4 h-4" />
                                                <span>{isAr ? 'عرض بالحجم الكامل' : 'View Fullscreen'}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    afterInputRef.current?.click();
                                                }}
                                                className="absolute bottom-2 start-2 px-2 py-1 bg-black/70 hover:bg-black/90 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition"
                                            >
                                                <Camera className="w-3 h-3" />
                                                <span>{isAr ? 'إعادة التقاط' : 'Retake'}</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => afterInputRef.current?.click()}
                                            className="w-full aspect-video border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-lg flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-emerald-600 transition p-3 bg-slate-50/50 dark:bg-slate-800/30"
                                        >
                                            <Camera className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
                                            <span className="text-xs font-semibold">{isAr ? 'التقاط صورة بعد الإصلاح' : 'Take After Photo'}</span>
                                            <span className="text-[10px] text-slate-400">{isAr ? 'كاميرا الجوال أو رفع ملف' : 'Camera or upload'}</span>
                                        </button>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* Items and Services Table */}
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                {isAr ? 'بنود الصيانة وقطع الغيار المركبة' : 'Repair Services & Spare Parts'}
                            </span>
                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                                <table className="w-full text-xs sm:text-sm text-start">
                                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold text-[11px] uppercase border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-4 py-2.5 text-start">{isAr ? 'البيان' : 'Description'}</th>
                                            <th className="px-4 py-2.5 text-end">{isAr ? 'التكلفة' : 'Cost'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {repair.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium">
                                                    {item.description}
                                                </td>
                                                <td className="px-4 py-2.5 text-end font-mono font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(item.cost)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 block">{isAr ? 'الإجمالي:' : 'Total Cost:'}</span>
                                <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(repair.totalAmount)}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 block">{isAr ? 'المدفوع:' : 'Paid:'}</span>
                                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(repair.paidAmount || 0)}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 block">{isAr ? 'المتبقي عند التسليم:' : 'Balance Due:'}</span>
                                <span className={`text-base font-bold font-mono ${remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                                    {formatCurrency(remainingBalance)}
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm(isAr ? 'هل أنت متأكد من حذف إيصال الصيانة هذا نهائياً؟' : 'Delete this repair record?')) {
                                    onDelete(repair.id);
                                    onClose();
                                }
                            }}
                            className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition flex items-center gap-1 font-semibold"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'حذف الإيصال' : 'Delete'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => printRepairInvoice(repair, customer, isAr, formatCurrency)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>{isAr ? 'طباعة السند' : 'Print Invoice'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-hover transition"
                            >
                                {isAr ? 'إغلاق' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div 
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <div className="absolute top-4 end-4 flex items-center gap-3 text-white">
                        <span className="text-sm font-semibold">{lightboxImage.title}</span>
                        <button
                            type="button"
                            onClick={() => setLightboxImage(null)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <img 
                        src={lightboxImage.url} 
                        alt="Zoomed View" 
                        className="max-w-[95vw] max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};
