import React, { useState } from 'react';
import { Delivery, Order, Customer, Driver } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import {
  Truck,
  X,
  Phone,
  MessageSquare,
  Navigation,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Calendar,
  User,
  Printer,
  ChevronRight,
  ExternalLink,
  Edit2,
  Check,
  Camera,
  Eye,
  Trash2,
} from 'lucide-react';

interface DeliveryTrackingModalProps {
  delivery: Delivery;
  onClose: () => void;
  onPrintNote?: (delivery: Delivery) => void;
}

const DeliveryTrackingModal: React.FC<DeliveryTrackingModalProps> = ({
  delivery,
  onClose,
  onPrintNote,
}) => {
  const { t, formatTime, formatDate, formatCurrency, language } = useTranslation();
  const { orders, customers, drivers, products, updateDeliveryStatus, updateDelivery } = useAppContext();

  const order = orders.find(s => s.id === delivery.orderId);
  const customer = customers.find(c => c.id === delivery.customerId);
  const driver = drivers.find(d => d.id === delivery.driverId);

  const [currentStatus, setCurrentStatus] = useState<Delivery['status']>(delivery.status);
  const [selectedDriverId, setSelectedDriverId] = useState(delivery.driverId || '');
  const [isUpdatingDriver, setIsUpdatingDriver] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState(delivery.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<string | undefined>(delivery.proofImageUrl);
  const [isPreviewPhotoOpen, setIsPreviewPhotoOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setProofPhoto(compressedDataUrl);
          updateDelivery(delivery.id, {
            proofImageUrl: compressedDataUrl,
            status: 'Delivered',
            deliveredAt: new Date().toISOString()
          });
          setCurrentStatus('Delivered');
        }
        setIsUploadingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (confirm(language === 'ar' ? 'هل تريد حذف صورة إثبات التسليم؟' : 'Remove proof of delivery photo?')) {
      setProofPhoto(undefined);
      await updateDelivery(delivery.id, { proofImageUrl: undefined });
    }
  };

  const handleStatusChange = async (newStatus: Delivery['status']) => {
    setCurrentStatus(newStatus);
    await updateDeliveryStatus(delivery.id, newStatus);
  };

  const handleDriverChange = async (newDriverId: string) => {
    setSelectedDriverId(newDriverId);
    await updateDelivery(delivery.id, { driverId: newDriverId });
    setIsUpdatingDriver(false);
  };

  const handleSaveNotes = async () => {
    await updateDelivery(delivery.id, { notes: deliveryNotes.trim() });
    setIsEditingNotes(false);
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(delivery.address);
    window.open(`https://maps.google.com/?q=${query}`, '_blank');
  };

  const handleSendCustomerWhatsApp = () => {
    if (!customer?.phone) {
      alert(language === 'ar' ? 'لا يوجد رقم هاتف للعميل' : 'No phone number for customer');
      return;
    }
    const phone = customer.phone.replace(/\D/g, '');
    const orderNo = order?.orderNumber || 'N/A';
    let text = '';
    if (currentStatus === 'Delivered') {
      text = language === 'ar'
        ? `مرحباً ${customer.name}، يسعدنا إبلاغك بأنه تم تسليم طلبك رقم ${orderNo} بنجاح من متجر مودرن هاوس للتجارة. شكراً لاختياركم لنا!`
        : `Hello ${customer.name}, your order #${orderNo} has been delivered successfully. Thank you for shopping with Modern House for Trading!`;
    } else if (currentStatus === 'Out for Delivery') {
      text = language === 'ar'
        ? `مرحباً ${customer.name}، طلبك رقم ${orderNo} قيد التوصيل الآن مع السائق (${driver?.name || 'مندوب التوصيل'}${driver?.phone ? ` - هاتف: ${driver.phone}` : ''}). العنوان: ${delivery.address}. يرجى التكرم بالاستعداد لاستلام الطلب.`
        : `Hello ${customer.name}, your order #${orderNo} is out for delivery with ${driver?.name || 'our courier'}. Address: ${delivery.address}.`;
    } else {
      text = language === 'ar'
        ? `مرحباً ${customer.name}، طلبك رقم ${orderNo} قيد التجهيز للتوصيل إلى: ${delivery.address}.`
        : `Hello ${customer.name}, your order #${orderNo} is being prepared for delivery to: ${delivery.address}.`;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSendDriverWhatsApp = () => {
    const orderNo = order?.orderNumber || 'N/A';
    const locationLink = `https://maps.google.com/?q=${encodeURIComponent(delivery.address)}`;
    const itemsCount = order?.items.reduce((acc, it) => acc + it.quantity, 0) || 0;
    const totalAmount = order?.total ? formatCurrency(order.total) : '0';

    const text = language === 'ar'
      ? `📦 *مهمة توصيل جديدة*\n` +
        `• رقم الطلب: ${orderNo}\n` +
        `• اسم العميل: ${customer?.name || 'Walk-in'}\n` +
        `• هاتف العميل: ${customer?.phone || 'لا يوجد'}\n` +
        `• عدد الأصناف: ${itemsCount}\n` +
        `• المبلغ المطلوب تحصيله (إن وجد): ${totalAmount}\n` +
        `• العنوان: ${delivery.address}\n` +
        `• الموقع على الخريطة: ${locationLink}\n` +
        (delivery.notes ? `• ملاحظات خاصة: ${delivery.notes}\n` : '')
      : `📦 *Delivery Task*\n` +
        `• Order: #${orderNo}\n` +
        `• Customer: ${customer?.name || 'Walk-in'}\n` +
        `• Phone: ${customer?.phone || 'N/A'}\n` +
        `• Address: ${delivery.address}\n` +
        `• Map: ${locationLink}\n` +
        (delivery.notes ? `• Notes: ${delivery.notes}\n` : '');

    const driverPhone = driver?.phone ? driver.phone.replace(/\D/g, '') : '';
    const url = driverPhone
      ? `https://wa.me/${driverPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Steps definition for timeline
  const steps = [
    { key: 'Pending', label: language === 'ar' ? 'معلق / بانتظار الإسناد' : 'Pending Preparation' },
    { key: 'Out for Delivery', label: language === 'ar' ? 'قيد التوصيل مع السائق' : 'Out for Delivery' },
    { key: 'Delivered', label: language === 'ar' ? 'تم التسليم بنجاح' : 'Delivered' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStatus);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-dark-card w-full max-w-3xl rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border dark:border-dark-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-text-primary dark:text-dark-text-primary">
                  {language === 'ar' ? 'تتبع وتفاصيل التوصيل' : 'Delivery Tracking & Manifest'}
                </h3>
                <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                  #{order?.orderNumber || 'N/A'}
                </span>
              </div>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {delivery.deliveryDate
                  ? `${language === 'ar' ? 'تاريخ التسليم:' : 'Delivered on:'} ${formatDate(delivery.deliveryDate)}`
                  : `${language === 'ar' ? 'تاريخ الإنشاء:' : 'Date:'} ${formatDate(order?.date || new Date().toISOString())}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Status Progress Stepper */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-border dark:border-dark-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary dark:text-dark-text-secondary">
                {language === 'ar' ? 'مراحل حالة التوصيل' : 'Delivery Progress'}
              </h4>

              {/* Status quick changer */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-secondary dark:text-dark-text-secondary">
                  {language === 'ar' ? 'تحديث الحالة:' : 'Change:'}
                </span>
                <select
                  value={currentStatus}
                  onChange={e => handleStatusChange(e.target.value as any)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-gray-800 border border-border dark:border-dark-border outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="Pending">{language === 'ar' ? 'معلق (Pending)' : 'Pending'}</option>
                  <option value="Out for Delivery">{language === 'ar' ? 'قيد التوصيل (Out for Delivery)' : 'Out for Delivery'}</option>
                  <option value="Delivered">{language === 'ar' ? 'تم التسليم (Delivered)' : 'Delivered'}</option>
                </select>
              </div>
            </div>

            {/* Stepper Graphic */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {steps.map((st, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                return (
                  <div
                    key={st.key}
                    onClick={() => handleStatusChange(st.key as any)}
                    className={`cursor-pointer p-2.5 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-primary text-white border-primary shadow-xs font-bold'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-semibold'
                        : 'bg-white dark:bg-gray-800 text-gray-400 border-border dark:border-dark-border'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                    <span className="text-[11px] block leading-tight">{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer & Address Details Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="p-4 rounded-xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-text-secondary dark:text-dark-text-secondary flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  {language === 'ar' ? 'بيانات العميل' : 'Customer Info'}
                </span>
                {customer?.phone && (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${customer.phone}`}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                      title={language === 'ar' ? 'اتصال بالعميل' : 'Call customer'}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={handleSendCustomerWhatsApp}
                      className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      title={language === 'ar' ? 'مراسلة عبر واتساب' : 'WhatsApp'}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h5 className="font-bold text-sm text-text-primary dark:text-dark-text-primary">
                  {customer?.name || 'عميل نقدي عام (Walk-in)'}
                </h5>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary font-mono" dir="ltr">
                  {customer?.phone || 'No Phone Registered'}
                </p>
              </div>

              {/* Delivery Address */}
              <div className="pt-2 border-t border-border/70 dark:border-dark-border/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary dark:text-dark-text-secondary flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {language === 'ar' ? 'عنوان التوصيل:' : 'Delivery Address:'}
                  </span>
                  <button
                    onClick={openGoogleMaps}
                    className="text-primary hover:underline font-bold flex items-center gap-1 text-[11px]"
                  >
                    <span>{language === 'ar' ? 'فتح في خرائط جوجل' : 'Google Maps'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs font-semibold text-text-primary dark:text-dark-text-primary bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-lg border border-border/50 dark:border-dark-border/50">
                  {delivery.address || 'Bahrain'}
                </p>
              </div>
            </div>

            {/* Courier / Driver Assignment Card */}
            <div className="p-4 rounded-xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-text-secondary dark:text-dark-text-secondary flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  {language === 'ar' ? 'السائق المسؤول' : 'Assigned Courier'}
                </span>

                <button
                  onClick={() => setIsUpdatingDriver(prev => !prev)}
                  className="text-primary text-[11px] font-bold hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isUpdatingDriver ? (language === 'ar' ? 'إلغاء' : 'Cancel') : (language === 'ar' ? 'تغيير السائق' : 'Change')}</span>
                </button>
              </div>

              {isUpdatingDriver ? (
                <div className="space-y-2 pt-1">
                  <select
                    value={selectedDriverId}
                    onChange={e => handleDriverChange(e.target.value)}
                    className="w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">{language === 'ar' ? '-- بدون سائق --' : '-- Unassigned --'}</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.phone ? `(${d.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-text-primary dark:text-dark-text-primary">
                        {driver?.name || (language === 'ar' ? 'غير مسند لسائق بعد' : 'Unassigned')}
                      </h5>
                      {driver?.phone ? (
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary font-mono" dir="ltr">
                          {driver.phone}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          {language === 'ar' ? 'اضغط تغيير السائق لإسناد الطلب' : 'Assign a courier to start delivery'}
                        </p>
                      )}
                    </div>

                    {driver?.phone && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${driver.phone}`}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                          title="Call Driver"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={handleSendDriverWhatsApp}
                          className="p-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                          title="WhatsApp Driver"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dispatch to Driver Button */}
                  <button
                    onClick={handleSendDriverWhatsApp}
                    className="w-full py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'إرسال بيانات المهمة والموقع للسائق (واتساب)' : 'Send Task & GPS to Courier'}</span>
                  </button>
                </div>
              )}

              {/* Delivery Notes */}
              <div className="pt-2 border-t border-border/70 dark:border-dark-border/70 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary dark:text-dark-text-secondary">
                    {language === 'ar' ? 'تعليمات وملاحظات خاصة:' : 'Special Instructions:'}
                  </span>
                  {!isEditingNotes && (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="text-primary text-[10px] hover:underline"
                    >
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={deliveryNotes}
                      onChange={e => setDeliveryNotes(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل ملاحظات...' : 'Enter notes...'}
                      className="flex-1 px-2.5 py-1 text-xs bg-background border rounded-lg outline-none"
                    />
                    <button
                      onClick={handleSaveNotes}
                      className="px-2 py-1 bg-primary text-white rounded-lg text-xs font-bold"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-text-primary dark:text-dark-text-primary italic">
                    {deliveryNotes || (language === 'ar' ? 'لا توجد ملاحظات إضافية.' : 'No special instructions.')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Proof of Delivery Photo Card (Camera / Upload) */}
          <div className="p-4 rounded-xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-text-secondary dark:text-dark-text-secondary flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-primary" />
                {language === 'ar' ? 'توثيق وإثبات التسليم بالكاميرا (Proof of Delivery)' : 'Proof of Delivery Photo'}
              </span>
              {proofPhoto && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{language === 'ar' ? 'تم التوثيق بالصورة' : 'Photo Verified'}</span>
                </span>
              )}
            </div>

            {proofPhoto ? (
              <div className="space-y-3">
                <div className="relative group rounded-xl overflow-hidden border border-border/70 dark:border-dark-border max-h-64 bg-slate-950 flex items-center justify-center">
                  <img
                    src={proofPhoto}
                    alt="Proof of Delivery"
                    className="w-full h-auto max-h-64 object-cover cursor-pointer transition group-hover:scale-101"
                    onClick={() => setIsPreviewPhotoOpen(true)}
                  />
                  <div 
                    onClick={() => setIsPreviewPhotoOpen(true)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 cursor-pointer transition text-white text-xs font-bold"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{language === 'ar' ? 'عرض الصورة بالحجم الكامل' : 'View Full Image'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-text-primary dark:text-dark-text-primary text-xs font-semibold transition">
                    <Camera className="w-3.5 h-3.5 text-primary" />
                    <span>{language === 'ar' ? 'إعادة التقاط الصورة' : 'Retake Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleCapturePhoto}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'حذف الصورة' : 'Remove'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border dark:border-dark-border rounded-xl p-5 text-center space-y-2.5 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-text-primary dark:text-dark-text-primary">
                    {language === 'ar' ? 'لم يتم التقاط صورة إثبات التسليم بعد' : 'No proof of delivery photo uploaded'}
                  </h5>
                  <p className="text-[11px] text-text-secondary dark:text-dark-text-secondary mt-0.5">
                    {language === 'ar' 
                      ? 'يمكن للسائق فتح الكاميرا وتصوير المطبخ أو الأجهزة عند باب العميل لتوثيق التسليم فوراً'
                      : 'Take a photo of the delivered appliances/kitchen at the customer site'}
                  </p>
                </div>

                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition shadow-xs active:scale-98">
                  <Camera className="w-4 h-4" />
                  <span>{isUploadingPhoto ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? '📷 فتح الكاميرا وتوثيق التسليم' : 'Open Camera & Capture')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCapturePhoto}
                    disabled={isUploadingPhoto}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Order Items Table */}
          <div className="p-4 rounded-xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary dark:text-dark-text-secondary flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-primary" />
              {language === 'ar' ? 'أصناف ومحتويات الشحنة' : 'Manifest Package Items'}
            </h4>

            <div className="rounded-xl border border-border dark:border-dark-border overflow-hidden">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-gray-50 dark:bg-gray-800 text-text-secondary dark:text-dark-text-secondary border-b border-border dark:border-dark-border">
                  <tr>
                    <th className="px-3 py-2">{language === 'ar' ? 'الصنف' : 'Item'}</th>
                    <th className="px-3 py-2 text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                    <th className="px-3 py-2 text-right rtl:text-left">{language === 'ar' ? 'السعر' : 'Price'}</th>
                    <th className="px-3 py-2 text-right rtl:text-left">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                  {order?.items.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-3 py-2">
                          <span className="font-bold text-text-primary dark:text-dark-text-primary block">
                            {prod?.name || 'Custom Product'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {prod?.sku || ''}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-bold">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right rtl:text-left font-mono">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-3 py-2 text-right rtl:text-left font-mono font-bold text-text-primary dark:text-dark-text-primary">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                  {(!order?.items || order.items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-400">
                        {language === 'ar' ? 'لا توجد أصناف مسجلة لهذا الطلب' : 'No items found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            {order && (
              <div className="flex flex-wrap items-center justify-between pt-2 text-xs font-semibold">
                <div className="space-x-3 rtl:space-x-reverse text-text-secondary dark:text-dark-text-secondary">
                  <span>{language === 'ar' ? 'طريقة الدفع:' : 'Payment:'} <strong className="text-text-primary dark:text-dark-text-primary">{order.paymentMethod}</strong></span>
                  {order.deliveryFee !== undefined && (
                    <span>{language === 'ar' ? 'رسوم التوصيل:' : 'Delivery:'} <strong className="text-primary">{formatCurrency(order.deliveryFee)}</strong></span>
                  )}
                </div>
                <div className="text-right rtl:text-left text-sm">
                  <span className="text-text-secondary dark:text-dark-text-secondary">{language === 'ar' ? 'إجمالي الطلب: ' : 'Total: '}</span>
                  <span className="text-base font-extrabold text-primary">{formatCurrency(order.total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border dark:border-dark-border flex flex-wrap items-center justify-between gap-2 bg-muted/20">
          <div className="flex items-center gap-2">
            {onPrintNote && (
              <button
                type="button"
                onClick={() => onPrintNote(delivery)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-border dark:border-dark-border hover:bg-gray-100 text-text-primary dark:text-dark-text-primary rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-primary" />
                <span>{language === 'ar' ? 'طباعة سند التوصيل' : 'Print Note'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={openGoogleMaps}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-border dark:border-dark-border hover:bg-gray-100 text-text-primary dark:text-dark-text-primary rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-500" />
              <span>{language === 'ar' ? 'الملاحة' : 'Maps'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>

      {/* Full-Screen Proof of Delivery Photo Lightbox */}
      {isPreviewPhotoOpen && proofPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsPreviewPhotoOpen(false)}
        >
          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full text-white px-2">
              <span className="font-bold text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ar' ? 'صورة إثبات التسليم (Proof of Delivery)' : 'Proof of Delivery Photo'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewPhotoOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={proofPhoto}
              alt="Proof of Delivery Full"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl border border-white/10 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTrackingModal;
