import React, { useState } from 'react';
import { Quotation, QuotationStatus } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { 
  X, 
  Printer, 
  MessageSquare, 
  ShoppingCart, 
  Edit, 
  Trash2, 
  Copy, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileCheck,
  Send,
  Truck
} from 'lucide-react';

interface QuotationDetailsModalProps {
  quotation: Quotation | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (quotation: Quotation) => void;
  onPrint: (quotation: Quotation) => void;
  onDuplicate: (quotation: Quotation) => void;
}

export const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({
  quotation,
  isOpen,
  onClose,
  onEdit,
  onPrint,
  onDuplicate
}) => {
  const { 
    updateQuotationStatus, 
    convertQuotationToOrder, 
    deleteQuotation,
    setActiveScreen 
  } = useAppContext();
  const { language, formatCurrency, formatDate } = useTranslation();
  const isAr = language === 'ar';

  const [isConverting, setIsConverting] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<'none' | 'charge' | 'free'>('none');
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !quotation) return null;

  const isExpired = new Date(quotation.validUntil) < new Date() && quotation.status !== 'Converted' && quotation.status !== 'Accepted';

  // Status badge coloring
  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
      case 'Sent':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
      case 'Accepted':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200';
      case 'Expired':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
      case 'Converted':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: QuotationStatus) => {
    switch (status) {
      case 'Draft': return isAr ? 'مسودة' : 'Draft';
      case 'Sent': return isAr ? 'تم الإرسال للعميل' : 'Sent';
      case 'Accepted': return isAr ? 'مقبول من العميل' : 'Accepted';
      case 'Rejected': return isAr ? 'مرفوض' : 'Rejected';
      case 'Expired': return isAr ? 'منتهي الصلاحية' : 'Expired';
      case 'Converted': return isAr ? 'تم التحويل لطلب مبيعات' : 'Converted to Order';
    }
  };

  const handleStatusChange = async (newStatus: QuotationStatus) => {
    try {
      await updateQuotationStatus(quotation.id, newStatus);
      setActionSuccessMessage(isAr ? 'تم تحديث حالة العرض بنجاح' : 'Status updated successfully');
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConvert = async () => {
    try {
      setIsConverting(true);
      await convertQuotationToOrder(quotation.id, deliveryOption);
      setShowConvertConfirm(false);
      setActionSuccessMessage(isAr ? 'تم تحويل عرض السعر إلى طلب مبيعات بنجاح!' : 'Quotation converted to order successfully!');
      setTimeout(() => {
        onClose();
        setActiveScreen('orders');
      }, 1500);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Failed to convert');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQuotation(quotation.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  // Direct WhatsApp message formatting
  const handleSendWhatsApp = () => {
    const phone = (quotation.customerPhone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('973') ? phone : (phone.length === 8 ? `973${phone}` : phone);

    const message = isAr
      ? `السلام عليكم ${quotation.customerName}،\nيسرنا في مودرن هاوس للتجارة تقديم عرض السعر رقم: *${quotation.quotationNumber}*.\n\n` +
        `المبلغ الإجمالي: *${formatCurrency(quotation.total)}* شامل ضريبة القيمة المضافة.\n` +
        `صلاحية العرض لغاية: ${formatDate(quotation.validUntil)}.\n\n` +
        `الأصناف المشمولة:\n` +
        quotation.items.map(i => `• ${i.name} (الكمية: ${i.quantity}) - ${formatCurrency(i.total)}`).join('\n') +
        `\n\nنسعد بخدمتكم وتأكيد طلبكم في أي وقت!`
      : `Dear ${quotation.customerName},\nModern House for Trading is pleased to present Quotation *#${quotation.quotationNumber}*.\n\n` +
        `Total Amount: *${formatCurrency(quotation.total)}* (incl. VAT).\n` +
        `Valid until: ${formatDate(quotation.validUntil)}.\n\n` +
        `Items:\n` +
        quotation.items.map(i => `• ${i.name} (Qty: ${i.quantity}) - ${formatCurrency(i.total)}`).join('\n') +
        `\n\nThank you for choosing us!`;

    const encoded = encodeURIComponent(message);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {quotation.quotationNumber}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(quotation.status)}`}>
                  {getStatusLabel(quotation.status)}
                </span>
                {isExpired && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                    {isAr ? 'منتهي الصلاحية' : 'Expired'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr ? 'تاريخ الإصدار: ' : 'Issued: '}{formatDate(quotation.date)} • {isAr ? 'صالح لغاية: ' : 'Valid Until: '}{formatDate(quotation.validUntil)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(quotation)}
              title={isAr ? 'طباعة العرض' : 'Print Quote'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={handleSendWhatsApp}
              title={isAr ? 'إرسال عبر واتساب' : 'Send via WhatsApp'}
              className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={() => onEdit(quotation)}
              title={isAr ? 'تعديل' : 'Edit'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {actionSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* Quick Status Control Bar */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isAr ? 'تغيير حالة العرض السريعة:' : 'Quick Status Update:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(['Draft', 'Sent', 'Accepted', 'Rejected'] as QuotationStatus[]).map(st => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    quotation.status === st
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {getStatusLabel(st)}
                </button>
              ))}
            </div>
          </div>

          {/* Customer & Quote Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>{isAr ? 'بيانات العميل' : 'Customer Info'}</span>
              </h4>
              <p className="font-bold text-base text-slate-900 dark:text-white mb-2">{quotation.customerName}</p>
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {quotation.customerPhone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{quotation.customerPhone}</span>
                  </p>
                )}
                {quotation.customerEmail && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{quotation.customerEmail}</span>
                  </p>
                )}
                {quotation.customerAddress && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{quotation.customerAddress}</span>
                  </p>
                )}
                {quotation.taxNumber && (
                  <p className="text-[11px] text-slate-500">
                    <span className="font-bold">{isAr ? 'الرقم الضريبي/السجل: ' : 'Tax/CR: '}</span>
                    <span className="font-mono">{quotation.taxNumber}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quote details Box */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{isAr ? 'تفاصيل ومواعيد العرض' : 'Quotation Timeline'}</span>
              </h4>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'تاريخ التحرير:' : 'Issue Date:'}</span>
                  <span className="font-semibold">{formatDate(quotation.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'صالح لغاية:' : 'Expiration:'}</span>
                  <span className={`font-semibold ${isExpired ? 'text-rose-600 font-bold' : ''}`}>
                    {formatDate(quotation.validUntil)}
                  </span>
                </div>
                {quotation.preparedBy && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'حرر بواسطة:' : 'Prepared By:'}</span>
                    <span className="font-semibold">{quotation.preparedBy}</span>
                  </div>
                )}
                {quotation.convertedOrderId && (
                  <div className="flex justify-between text-purple-600 dark:text-purple-400 font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>{isAr ? 'طلب المبيعات المرتبط:' : 'Linked Order ID:'}</span>
                    <span className="font-mono">{quotation.convertedOrderId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
              {isAr ? 'الأصناف والتسعير' : 'Line Items & Pricing'}
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 w-8 text-center">#</th>
                    <th className="p-3">{isAr ? 'الصنف / البند' : 'Item / Description'}</th>
                    <th className="p-3 text-center w-20">{isAr ? 'الكمية' : 'Qty'}</th>
                    <th className="p-3 text-right rtl:text-left w-28">{isAr ? 'السعر' : 'Unit Price'}</th>
                    <th className="p-3 text-right rtl:text-left w-24">{isAr ? 'الضريبة' : 'VAT'}</th>
                    <th className="p-3 text-right rtl:text-left w-32">{isAr ? 'المجموع' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {quotation.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                        {item.description && <div className="text-[11px] text-slate-500">{item.description}</div>}
                        {item.sku && <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>}
                      </td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-right rtl:text-left font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-3 text-right rtl:text-left text-slate-500 font-mono">{formatCurrency(item.vatAmount || 0)}</td>
                      <td className="p-3 text-right rtl:text-left font-bold font-mono text-slate-900 dark:text-white">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals and Terms */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-3">
              {quotation.terms && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</h5>
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">{quotation.terms}</p>
                </div>
              )}

              {quotation.notes && (
                <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300">
                  <h5 className="font-bold mb-1">{isAr ? 'ملاحظات خاصة' : 'Notes'}</h5>
                  <p className="whitespace-pre-line leading-relaxed">{quotation.notes}</p>
                </div>
              )}
            </div>

            <div className="md:col-span-5">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                  <span className="font-mono font-semibold">{formatCurrency(quotation.subtotal)}</span>
                </div>
                {(quotation.discount || 0) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>{isAr ? 'الخصم الإجمالي:' : 'Total Discount:'}</span>
                    <span className="font-mono font-semibold">-{formatCurrency(quotation.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{isAr ? 'ضريبة القيمة المضافة (10%):' : 'VAT Total (10%):'}</span>
                  <span className="font-mono font-semibold">{formatCurrency(quotation.vatTotal)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{isAr ? 'المبلغ الإجمالي:' : 'Grand Total:'}</span>
                  <span className="font-black text-xl font-mono text-primary">{formatCurrency(quotation.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Convert confirmation panel if requested */}
          {showConvertConfirm && (
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-3">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold text-sm">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
                <span>{isAr ? 'تأكيد تحويل العرض إلى فاتورة وطلب مبيعات معتمد' : 'Convert Quotation to Sales Order'}</span>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                {isAr 
                  ? 'سيتم إنشاء طلب مبيعات جديد تلقائياً في النظام، وخصم الكميات من المخزون، وربط الطلب بهذا العرض.'
                  : 'A new active sales order will be registered in the system, stock updated, and linked to this quotation.'}
              </p>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>{isAr ? 'خيارات التوصيل:' : 'Delivery Option:'}</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryOption"
                    value="none"
                    checked={deliveryOption === 'none'}
                    onChange={() => setDeliveryOption('none')}
                  />
                  <span>{isAr ? 'بدون توصيل (استلام من المعرض)' : 'No delivery (Pickup)'}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryOption"
                    value="charge"
                    checked={deliveryOption === 'charge'}
                    onChange={() => setDeliveryOption('charge')}
                  />
                  <span>{isAr ? 'توصيل مع رسوم' : 'Delivery with charge'}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryOption"
                    value="free"
                    checked={deliveryOption === 'free'}
                    onChange={() => setDeliveryOption('free')}
                  />
                  <span>{isAr ? 'توصيل مجاني' : 'Free Delivery'}</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConvertConfirm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isConverting}
                  onClick={handleConvert}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {isConverting ? (isAr ? 'جاري التحويل...' : 'Converting...') : (isAr ? 'تأكيد التحويل الآن' : 'Confirm Conversion')}
                </button>
              </div>
            </div>
          )}

          {/* Delete confirmation panel */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
              <div className="flex items-center gap-2 text-rose-900 dark:text-rose-300 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>{isAr ? 'هل أنت متأكد من حذف عرض السعر؟' : 'Are you sure you want to delete this quote?'}</span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                {isAr ? 'لا يمكن التراجع عن هذه العملية بعد إتمامها.' : 'This action cannot be undone.'}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm"
                >
                  {isAr ? 'نعم، حذف' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDuplicate(quotation)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <Copy className="w-4 h-4" />
              <span>{isAr ? 'نسخ العرض' : 'Duplicate'}</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isAr ? 'حذف' : 'Delete'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {quotation.status !== 'Converted' ? (
              <button
                type="button"
                onClick={() => setShowConvertConfirm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md shadow-emerald-600/20"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isAr ? 'تحويل إلى طلب مبيعات' : 'Convert to Sales Order'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-purple-100 text-purple-800 rounded-xl text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تم التحويل إلى طلب سابقاً' : 'Already Converted to Order'}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => onPrint(quotation)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition shadow-md shadow-primary/20"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
