import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import QRCode from 'qrcode';

interface InvoiceTemplateProps {
  order: Order;
  settings: ReturnType<typeof useSettings>['settings'];
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, settings }) => {
  const { t, language, formatCurrency, formatDate, formatTime } = useTranslation();
  const { customers, products, employees } = useAppContext();

  const customer = customers.find(c => c.id === order.customerId);
  const salesperson = employees.find(e => e.id === order.employeeId);
  const isAr = language === 'ar';
  
  const { invoiceSettings, logoUrl, footerText, accentColor = '#4f46e5' } = settings;

  const {
    companyNameAr = 'مؤسسة مودرن هاوس للتجارة',
    companyNameEn = 'Modern House for Trading',
    crNumber = '147987-2',
    vatNumber = '220000000000002',
    phone = '35965477 - 77905477',
    address = 'سوق واقف - مدينة حمد - مملكة البحرين',
    showWarranty = true,
    showSalesperson = true,
    showDiscount = true,
    showStampSignature = true,
    showQrCode = true,
    publicServerUrl,
    footerNote,
  } = (invoiceSettings as any) || {};

  const vatPercent = order.items[0]?.vatPercent || 10;
  const vatAmount = order.items.reduce((sum, item) => sum + (item.vatAmount || 0), 0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    let base = publicServerUrl?.trim();
    if (!base || base.includes('unless-tiffany-jill-converted') || base.includes('trials-jacob-ask-bridal') || base.includes('definitely-preceding-raise-clock')) {
      if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.startsWith('file:')) {
        base = window.location.origin;
      } else {
        base = 'https://exchanges-exclusively-cube-cayman.trycloudflare.com';
      }
    }
    base = base.replace(/\/+$/, '');
    const invoiceUrl = `${base}/invoice/${order.orderNumber || order.id}`;

    QRCode.toDataURL(invoiceUrl, { width: 110, margin: 1, errorCorrectionLevel: 'M' })
      .then(setQrCodeUrl)
      .catch(() => {});
  }, [order, publicServerUrl]);

  return (
    <div className="p-8 text-slate-900 bg-white font-sans max-w-[800px] mx-auto select-none print:p-4 print:max-w-none" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      {/* Top Header Banner */}
      <div className="flex justify-between items-start border-b-2 pb-6 mb-6" style={{ borderColor: accentColor }}>
        <div className="space-y-1">
          {logoUrl ? (
            <img src={logoUrl} alt="Company Logo" className="h-16 w-auto object-contain mb-2" />
          ) : (
            <h1 className="text-2xl font-black tracking-tight" style={{ color: accentColor }}>
              {isAr ? companyNameAr : companyNameEn}
            </h1>
          )}
          <p className="text-xs text-slate-500 font-medium">
            {address} • {isAr ? 'هاتف: ' : 'Tel: '}{phone} • {isAr ? 'س.ت: ' : 'CR: '}{crNumber}
          </p>
          <p className="text-xs text-slate-500 font-medium">
            {isAr ? 'الرقم الضريبي VAT: ' : 'VAT Reg. No: '}{vatNumber}
          </p>
        </div>

        <div className="text-left rtl:text-left space-y-1">
          <div 
            className="inline-block px-4 py-1.5 rounded-md text-white font-black text-sm uppercase tracking-wider mb-2 shadow-xs"
            style={{ backgroundColor: accentColor }}
          >
            {isAr ? 'فاتورة ضريبية رسمية' : 'TAX INVOICE'}
          </div>
          <div className="text-xs space-y-0.5 text-slate-600">
            <p><span className="font-bold text-slate-700">{isAr ? 'رقم الفاتورة: ' : 'Invoice No: '}</span><span className="font-mono font-bold text-slate-900">{order.orderNumber}</span></p>
            <p><span className="font-bold text-slate-700">{isAr ? 'تاريخ الإصدار: ' : 'Date: '}</span><span>{formatDate(order.date)}</span></p>
            <p><span className="font-bold text-slate-700">{isAr ? 'الوقت: ' : 'Time: '}</span><span>{formatTime(order.date)}</span></p>
            {invoiceSettings?.showSalesperson && salesperson && (
              <p><span className="font-bold text-slate-700">{isAr ? 'البائع: ' : 'Salesperson: '}</span><span>{salesperson.name}</span></p>
            )}
          </div>
        </div>
      </div>

      {/* Bill To Info Card */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            {isAr ? 'بيانات العميل (فاتورة إلى)' : 'Billed To (Customer)'}
          </span>
          <p className="font-bold text-sm text-slate-900">{customer?.name || t('general.not_applicable')}</p>
          {customer?.phone && <p className="text-slate-600 mt-0.5">{isAr ? 'الهاتف: ' : 'Phone: '} {customer.phone}</p>}
          {customer?.address && <p className="text-slate-600 mt-0.5">{isAr ? 'العنوان: ' : 'Address: '} {customer.address}</p>}
        </div>
        <div className="text-left rtl:text-left space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            {isAr ? 'طريقة السداد' : 'Payment Information'}
          </span>
          <p><span className="font-bold text-slate-700">{isAr ? 'طريقة الدفع: ' : 'Method: '}</span><span className="font-semibold text-slate-900">{t(`orders.payment_methods.${order.paymentMethod}`)}</span></p>
          {order.benefitPayRef && (
            <p><span className="font-bold text-slate-700">{isAr ? 'مرجع بنفت: ' : 'Benefit Ref: '}</span><span className="font-mono">{order.benefitPayRef}</span></p>
          )}
          <p><span className="font-bold text-slate-700">{isAr ? 'الحالة: ' : 'Status: '}</span><span className="text-emerald-600 font-bold">{isAr ? 'مدفوعة بالكامل' : 'Paid in Full'}</span></p>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 mb-6">
        <table className="w-full text-xs text-left rtl:text-right border-collapse">
          <thead>
            <tr style={{ backgroundColor: accentColor, color: 'white' }}>
              <th className="p-3 w-10 text-center">#</th>
              <th className="p-3">{isAr ? 'الصنف / الوصف' : 'Item Description'}</th>
              {invoiceSettings?.showWarranty && (
                <th className="p-3 text-center w-24">{isAr ? 'الضمان' : 'Warranty'}</th>
              )}
              <th className="p-3 text-center w-20">{isAr ? 'الكمية' : 'Qty'}</th>
              <th className="p-3 text-right rtl:text-left w-24">{isAr ? 'السعر' : 'Price'}</th>
              <th className="p-3 text-right rtl:text-left w-28">{isAr ? 'الإجمالي' : 'Total'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              return (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="p-3 text-center text-slate-400 font-semibold">{index + 1}</td>
                  <td className="p-3 font-semibold text-slate-900">
                    <div>{product?.name || item.name || 'N/A'}</div>
                    {product?.sku && <div className="text-[10px] text-slate-400 font-mono">SKU: {product.sku}</div>}
                  </td>
                  {invoiceSettings?.showWarranty && (
                    <td className="p-3 text-center text-slate-600">
                      {product?.warrantyMonths ? `${product.warrantyMonths} ${t('orders.print_modal.months')}` : '-'}
                    </td>
                  )}
                  <td className="p-3 text-center font-bold text-slate-800">{item.quantity}</td>
                  <td className="p-3 text-right rtl:text-left font-mono">{formatCurrency(item.price)}</td>
                  <td className="p-3 text-right rtl:text-left font-bold font-mono text-slate-900">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary and QR Code Section */}
      <div className="flex justify-between items-start mb-8 gap-6">
        {/* Verification QR Code */}
        {showQrCode !== false ? (
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Tax Verification QR" className="w-24 h-24 rounded border border-slate-200" />
            ) : (
              <div className="w-24 h-24 bg-slate-200 animate-pulse rounded" />
            )}
            <div className="text-[11px] text-slate-500 max-w-[170px] space-y-0.5">
              <p className="font-bold text-slate-700">{isAr ? 'امسح الرمز لعرض الفاتورة' : 'Scan to View Invoice'}</p>
              <p>{isAr ? 'امسح بكاميرا الجوال لعرض الفاتورة الرسمية الموثقة.' : 'Scan with phone camera to view full verified invoice.'}</p>
            </div>
          </div>
        ) : <div />}

        {/* Totals Breakdown */}
        <div className="w-64 text-xs space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between py-0.5">
            <span className="text-slate-600">{t('orders.print_modal.subtotal')}:</span>
            <span className="font-mono font-semibold">{formatCurrency(order.subtotal)}</span>
          </div>
          {invoiceSettings?.showDiscount && order.discount > 0 && (
            <div className="flex justify-between py-0.5 text-rose-600">
              <span>{t('orders.print_modal.discount')} ({order.discount}%):</span>
              <span className="font-mono">- {formatCurrency(order.subtotal * (order.discount / 100))}</span>
            </div>
          )}
          {vatAmount > 0 && (
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">{t('orders.print_modal.vat') || 'VAT'} ({vatPercent}%):</span>
              <span className="font-mono font-semibold">{formatCurrency(vatAmount)}</span>
            </div>
          )}
          {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">{t('orders.print_modal.delivery_fee')}:</span>
              <span className="font-mono font-semibold">{formatCurrency(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t-2 border-slate-900 font-black text-sm text-slate-900">
            <span>{t('orders.print_modal.grand_total')}:</span>
            <span className="font-mono" style={{ color: accentColor }}>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Signatures & Approvals */}
      {showStampSignature !== false && (
        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 mb-6 text-xs text-center">
          <div>
            <p className="font-semibold text-slate-600 mb-10">{isAr ? 'توقيع المستلم / العميل' : 'Customer Acceptance Signature'}</p>
            <div className="w-48 mx-auto border-b border-dashed border-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-600 mb-10">{isAr ? 'ختم وتوقيع الشركة المعتمد' : 'Authorized Stamp & Signature'}</p>
            <div className="w-48 mx-auto border-b border-dashed border-slate-400" />
          </div>
        </div>
      )}

      {/* Footer Notes */}
      <div className="text-center text-[11px] text-slate-400 pt-3 border-t border-slate-100">
        <p className="font-bold text-slate-600 mb-0.5">{t('orders.print_modal.thank_you') || 'شكراً لتعاملكم مع مودرن هاوس للتجارة'}</p>
        <p>{footerNote || footerText || (isAr ? 'البضاعة المباعة تخضع لشروط الضمان المعتمدة. يُرجى الاحتفاظ بالفاتورة الأصلية.' : 'Goods sold are subject to authorized warranty terms. Please keep the original invoice.')}</p>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
