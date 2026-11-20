import React, { useRef, useState, useEffect } from 'react';
import { Order, Customer, Employee, Product } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import QRCode from 'qrcode';
import { Printer, FileText, Share2, Check, X } from 'lucide-react';

interface PosThermalReceiptModalProps {
  order: Order;
  customer?: Customer | null;
  cashier?: Employee | null;
  products: Product[];
  amountTendered?: number;
  changeDue?: number;
  onClose: () => void;
  onOpenA4Invoice: () => void;
}

const PosThermalReceiptModal: React.FC<PosThermalReceiptModalProps> = ({
  order,
  customer,
  cashier,
  products,
  amountTendered,
  changeDue,
  onClose,
  onOpenA4Invoice,
}) => {
  const { t, formatCurrency, formatDate, formatTime, language } = useTranslation();
  const { settings } = useSettings();
  const invSettings = settings.invoiceSettings;
  const receiptRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Generate QR code with full items summary + digital invoice view link
    let base = invSettings?.publicServerUrl?.trim();
    if (!base || base.includes('trycloudflare.com')) {
      if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.startsWith('file:')) {
        base = window.location.origin;
      } else {
        base = 'https://modern-house-oms.vercel.app';
      }
    }
    base = base.replace(/\/+$/, '');
    const invoiceNum = order.orderNumber || order.id;
    const invoiceUrl = `${base}/?invoice=${encodeURIComponent(invoiceNum)}`;

    // Use direct clickable URL so mobile camera scan opens digital receipt immediately
    QRCode.toDataURL(invoiceUrl, { 
      width: 140, 
      margin: 1, 
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Failed to generate QR code', err));
  }, [order, invSettings?.publicServerUrl, products]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const phone = customer?.phone?.replace(/[^0-9]/g, '');
    if (!phone) {
      alert(language === 'ar' ? 'العميل لا يملك رقم هاتف مسجل.' : 'Customer has no recorded phone number.');
      return;
    }

    const itemsSummary = order.items
      .map(item => {
        const prod = products.find(p => p.id === item.productId);
        const name = prod ? prod.name : 'Item';
        return `• ${name} (x${item.quantity}) - ${formatCurrency(item.price * item.quantity)}`;
      })
      .join('\n');

    let base = invSettings?.publicServerUrl?.trim();
    if (!base || base.includes('trycloudflare.com')) {
      if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.startsWith('file:')) {
        base = window.location.origin;
      } else {
        base = 'https://modern-house-oms.vercel.app';
      }
    }
    base = base.replace(/\/+$/, '');
    const invoiceNum = order.orderNumber || order.id;
    const invoiceUrl = `${base}/?invoice=${encodeURIComponent(invoiceNum)}`;

    const message = language === 'ar'
      ? `مرحباً ${customer?.name || 'عزيزنا العميل'}،\nشكراً لتعاملك مع مودرن هاوس للتجارة!\n\n🧾 إيصال مبيعات #${order.orderNumber}:\n${itemsSummary}\n\n💰 الإجمالي: ${formatCurrency(order.total)}\n💳 طريقة الدفع: ${order.paymentMethod}\n📅 التاريخ: ${formatDate(order.date)}\n🔗 الرابط الرقمي: ${invoiceUrl}\n\nنتمنى لك يوماً سعيداً!`
      : `Hello ${customer?.name || 'Valued Customer'},\nThank you for shopping at Modern House for Trading!\n\n🧾 Sales Receipt #${order.orderNumber}:\n${itemsSummary}\n\n💰 Total: ${formatCurrency(order.total)}\n💳 Payment: ${order.paymentMethod}\n📅 Date: ${formatDate(order.date)}\n🔗 Digital Link: ${invoiceUrl}\n\nHave a wonderful day!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const vatTotal = order.items.reduce((acc, it) => acc + (it.vatAmount || 0), 0);

  return (
    <div
      id="pos-thermal-modal-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden flex flex-col max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-border dark:border-dark-border flex items-center justify-between bg-muted/40 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'إيصال نقطة البيع' : 'POS Sales Receipt'}
              </h3>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                #{order.orderNumber}
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

        {/* Action Controls */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-border dark:border-dark-border flex items-center justify-center gap-2 flex-wrap no-print">
          <button
            onClick={handlePrint}
            className="flex-1 min-w-[120px] py-2 px-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            {language === 'ar' ? 'طباعة حرارية (80mm)' : 'Print (80mm)'}
          </button>
          <button
            onClick={onOpenA4Invoice}
            className="py-2 px-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-text-primary dark:text-dark-text-primary border border-border dark:border-dark-border rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            {language === 'ar' ? 'فاتورة A4' : 'A4 Invoice'}
          </button>
          {customer?.phone && (
            <button
              onClick={handleWhatsAppShare}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {language === 'ar' ? 'واتساب' : 'WhatsApp'}
            </button>
          )}
        </div>

        {/* Printable 80mm Receipt Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-gray-100 dark:bg-black/30">
          <div
            ref={receiptRef}
            id="pos-thermal-receipt"
            className="w-[78mm] bg-white text-black p-4 font-mono text-[11px] leading-tight shadow-md border border-gray-200 select-text"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400">
              {settings.logoUrl && (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="h-10 mx-auto mb-1.5 object-contain"
                />
              )}
              <h1 className="text-sm font-bold tracking-tight">
                {language === 'ar' ? (invSettings?.companyNameAr || 'مودرن هاوس للتجارة') : (invSettings?.companyNameEn || 'MODERN HOUSE FOR TRADING')}
              </h1>
              <p className="text-[10px] text-gray-700 mt-0.5">
                {invSettings?.address || (language === 'ar' ? 'سوق واقف - مدينة حمد - البحرين' : 'Souq Waqif, Hamad Town - Bahrain')}
              </p>
              <p className="text-[10px] text-gray-700">
                {language === 'ar' ? 'هاتف: ' : 'Tel: '}{invSettings?.phone || '35965477 / 77905477'} {invSettings?.crNumber ? `• س.ت: ${invSettings.crNumber}` : ''}
              </p>
              {invSettings?.vatNumber && (
                <p className="text-[9px] text-gray-500 font-mono">
                  VAT: {invSettings.vatNumber}
                </p>
              )}
            </div>

            {/* Receipt Metadata */}
            <div className="py-2 text-[10px] space-y-0.5 border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span>Receipt:</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(order.date)} {formatTime(order.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{cashier?.name || 'Staff'}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="truncate max-w-[130px] font-medium">
                  {customer ? `${customer.name} (${customer.phone || ''})` : (language === 'ar' ? 'عميل نقدي عام' : 'Walk-in')}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between font-bold pb-1 text-[10px] border-b border-gray-300">
                <span className="w-1/2">ITEM</span>
                <span className="w-1/6 text-center">QTY</span>
                <span className="w-1/3 text-right">TOTAL</span>
              </div>
              <div className="pt-1.5 space-y-1.5">
                {order.items.map((item, idx) => {
                  const prod = products.find(p => p.id === item.productId);
                  const itemName = prod?.name || `Item #${idx + 1}`;
                  const itemTotal = item.price * item.quantity;
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-medium truncate">{itemName}</div>
                      <div className="flex justify-between text-gray-600 text-[10px]">
                        <span className="w-1/2">@{formatCurrency(item.price)}</span>
                        <span className="w-1/6 text-center font-bold">{item.quantity}</span>
                        <span className="w-1/3 text-right font-bold text-black">{formatCurrency(itemTotal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({order.discount}%):</span>
                  <span>-{formatCurrency(order.subtotal * (order.discount / 100))}</span>
                </div>
              )}
              {vatTotal > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>VAT (10%):</span>
                  <span>{formatCurrency(vatTotal)}</span>
                </div>
              )}
              {Boolean(order.deliveryFee && order.deliveryFee > 0) && (
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>{formatCurrency(order.deliveryFee!)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-gray-400">
                <span>GRAND TOTAL:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 text-[10px] space-y-1 border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold uppercase">{order.paymentMethod}</span>
              </div>
              {order.paymentMethod === 'BenefitPay' && order.benefitPayRef && (
                <div className="flex justify-between">
                  <span>BenefitPay Ref:</span>
                  <span className="font-mono">{order.benefitPayRef}</span>
                </div>
              )}
              {order.paymentMethod === 'Cash' && amountTendered !== undefined && amountTendered > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(amountTendered)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Change Due:</span>
                    <span>{formatCurrency(changeDue || 0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* QR Code & Footer */}
            {invSettings?.showQrCode !== false && (
              <div className="pt-3 text-center space-y-1.5">
                {qrCodeDataUrl && (
                  <img
                    src={qrCodeDataUrl}
                    alt="Invoice QR"
                    className="w-20 h-20 mx-auto rounded border border-gray-200"
                  />
                )}
                <div className="text-[9px] text-gray-600 font-bold">
                  {language === 'ar' ? 'امسح الرمز لعرض الفاتورة الرقمية الموثقة' : 'Scan QR to view verified digital invoice'}
                </div>
                <div className="text-[10px] text-gray-700 font-bold">
                  {language === 'ar' ? 'شكراً لزيارتكم ونسعد بخدمتكم دائماً' : 'THANK YOU FOR YOUR VISIT!'}
                </div>
                <div className="text-[9px] text-gray-500">
                  {invSettings?.footerNote || (language === 'ar' ? 'السلع المباعة ترد أو تستبدل خلال 3 أيام مع إبراز الإيصال' : 'Goods returnable/exchangeable within 3 days with receipt')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 bg-muted/30 border-t border-border dark:border-dark-border flex items-center justify-between no-print">
          <span className="text-xs text-text-secondary dark:text-dark-text-secondary">
            {language === 'ar' ? 'جاهز للطباعة أو المعاينة' : 'Ready to print or preview'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-text-primary dark:text-dark-text-primary text-xs font-semibold transition-colors"
          >
            {language === 'ar' ? 'إغلاق ومتابعة البيع' : 'Done & Next Sale'}
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          #pos-thermal-modal-backdrop {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            background: none !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          #pos-thermal-receipt {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 78mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            display: block !important;
          }
          #pos-thermal-receipt * {
            visibility: visible !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PosThermalReceiptModal;
