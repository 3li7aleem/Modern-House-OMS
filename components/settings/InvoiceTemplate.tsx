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
  const { t, language, formatCurrency, formatNumber, formatDate, formatTime } = useTranslation();
  const { customers, products, employees } = useAppContext();

  const customer = customers.find(c => c.id === order.customerId);
  const salesperson = employees.find(e => e.id === order.employeeId);
  const isAr = language === 'ar';
  
  const { invoiceSettings, logoUrl, footerText, accentColor = '#4f46e5' } = settings;

  const {
    companyNameAr = 'مودرن هاوس للتجارة',
    companyNameEn = 'Modern House for Trading',
    crNumber = '147987-2',
    vatNumber = '',
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
    if (!base || base.includes('trycloudflare.com')) {
      if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.startsWith('file:')) {
        base = window.location.origin;
      } else {
        base = 'https://modern-house-oms.vercel.app';
      }
    }
    base = base.replace(/\/+$/, '');
    const invoiceNum = order.orderNumber || order.id;

    // Compact order snapshot for instant zero-dependency QR code verification
    let inlineData = '';
    try {
      const compact = {
        orderNumber: invoiceNum,
        date: order.date,
        customerName: customer?.name || order.customerName || 'عميل نقدي',
        customerPhone: customer?.phone || order.customerPhone || '',
        items: (order.items || []).map(it => {
          const prod = products.find(p => p.id === it.productId);
          return {
            name: prod?.name || it.name || 'صنف',
            sku: prod?.sku || '',
            price: it.price,
            quantity: it.quantity
          };
        }),
        subtotal: order.subtotal || order.total,
        discount: order.discount || 0,
        total: order.total,
        paymentMethod: order.paymentMethod || 'Cash'
      };
      inlineData = btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
    } catch {}

    const invoiceUrl = inlineData && inlineData.length < 1400
      ? `${base}/?invoice=${encodeURIComponent(invoiceNum)}&d=${encodeURIComponent(inlineData)}`
      : `${base}/?invoice=${encodeURIComponent(invoiceNum)}`;

    // Use direct clickable URL for the QR code so smartphone cameras immediately open the invoice web page
    QRCode.toDataURL(invoiceUrl, { 
      width: 140, 
      margin: 1, 
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(setQrCodeUrl)
      .catch(() => {});
  }, [order, publicServerUrl, products, customer]);

  return (
    <div
      className="w-full max-w-[210mm] min-h-[296mm] print:w-full print:max-w-none print:min-h-[275mm] mx-auto bg-white text-slate-900 font-sans p-8 sm:p-10 print:p-6 flex flex-col justify-between select-none box-border"
      style={{ direction: isAr ? 'rtl' : 'ltr' }}
    >
      <div className="flex-1 flex flex-col">
        {/* Top Header Banner */}
        <div className="flex justify-between items-start border-b-2 pb-6 mb-6 gap-6" style={{ borderColor: accentColor }}>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3.5">
              {logoUrl && (
                <img src={logoUrl} alt="Company Logo" className="h-16 w-auto object-contain shrink-0" />
              )}
              <div>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: accentColor }}>
                  {isAr ? (companyNameAr || 'مودرن هاوس للتجارة') : companyNameEn}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {address} • {isAr ? 'هاتف: ' : 'Tel: '}{phone} • {isAr ? 'س.ت: ' : 'CR: '}{crNumber}
                </p>
              </div>
            </div>
          </div>

          <div className="text-left rtl:text-left space-y-1 shrink-0">
            <div
              className="inline-block px-4 py-1.5 rounded-md text-white font-black text-sm uppercase tracking-wider mb-2 shadow-xs"
              style={{ backgroundColor: accentColor }}
            >
              {isAr ? 'فاتورة مبيعات' : 'SALES INVOICE'}
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
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 text-xs">
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
        <div className="flex-1 mb-6">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead>
                <tr style={{ backgroundColor: accentColor, color: 'white' }}>
                  <th className="px-3 py-3.5 w-10 text-center">#</th>
                  <th className="px-3 py-3.5">{isAr ? 'الصنف / الوصف' : 'Item Description'}</th>
                  {invoiceSettings?.showWarranty && (
                    <th className="px-3 py-3.5 text-center w-24">{isAr ? 'الضمان' : 'Warranty'}</th>
                  )}
                  <th className="px-3 py-3.5 text-center w-20">{isAr ? 'الكمية' : 'Qty'}</th>
                  <th className="px-3 py-3.5 text-right rtl:text-left w-24">{isAr ? 'السعر' : 'Price'}</th>
                  <th className="px-3 py-3.5 text-right rtl:text-left w-28">{isAr ? 'الإجمالي' : 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="px-3 py-3.5 text-center text-slate-400 font-semibold tabular-nums">{formatNumber(index + 1)}</td>
                      <td className="px-3 py-3.5 font-semibold text-slate-900">
                        <div>{product?.name || item.name || 'N/A'}</div>
                        {product?.sku && <div className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {product.sku}</div>}
                      </td>
                      {invoiceSettings?.showWarranty && (
                        <td className="px-3 py-3.5 text-center text-slate-600">
                          {product?.warrantyMonths ? `${formatNumber(product.warrantyMonths)} ${t('orders.print_modal.months')}` : '-'}
                        </td>
                      )}
                      <td className="px-3 py-3.5 text-center font-bold text-slate-800 tabular-nums">{formatNumber(item.quantity)}</td>
                      <td className="px-3 py-3.5 text-right rtl:text-left tabular-nums">{formatCurrency(item.price)}</td>
                      <td className="px-3 py-3.5 text-right rtl:text-left font-bold tabular-nums text-slate-900">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom A4 Anchored Section: Totals, QR, Signatures & Footer */}
      <div className="pt-4">
        {/* Summary and QR Code Section */}
        <div className="flex justify-between items-stretch mb-8 gap-6">
          {/* Verification QR Code */}
          {showQrCode !== false ? (
            <div className="flex items-center gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Tax Verification QR" className="w-24 h-24 rounded border border-slate-200 bg-white shrink-0" />
              ) : (
                <div className="w-24 h-24 bg-slate-200 animate-pulse rounded shrink-0" />
              )}
              <div className="text-[11px] text-slate-500 max-w-[180px] space-y-1">
                <p className="font-bold text-slate-700">{isAr ? 'امسح الرمز لعرض الفاتورة' : 'Scan to View Invoice'}</p>
                <p>{isAr ? 'امسح بكاميرا الجوال لعرض الفاتورة الرسمية الموثقة.' : 'Scan with phone camera to view full verified invoice.'}</p>
              </div>
            </div>
          ) : <div />}

          {/* Totals Breakdown */}
          <div className="w-72 text-xs space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-center">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">{t('orders.print_modal.subtotal')}:</span>
              <span className="font-semibold tabular-nums">{formatCurrency(order.subtotal)}</span>
            </div>
            {invoiceSettings?.showDiscount && order.discount > 0 && (
              <div className="flex justify-between py-0.5 text-rose-600">
                <span>{t('orders.print_modal.discount')} ({formatNumber(order.discount)}%):</span>
                <span className="tabular-nums">- {formatCurrency(order.subtotal * (order.discount / 100))}</span>
              </div>
            )}
            {vatAmount > 0 && (
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">{t('orders.print_modal.vat') || 'VAT'} ({formatNumber(vatPercent)}%):</span>
                <span className="font-semibold tabular-nums">{formatCurrency(vatAmount)}</span>
              </div>
            )}
            {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">{t('orders.print_modal.delivery_fee')}:</span>
                <span className="font-semibold tabular-nums">{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2.5 border-t-2 border-slate-900 font-black text-sm text-slate-900">
              <span>{t('orders.print_modal.grand_total')}:</span>
              <span className="tabular-nums" style={{ color: accentColor }}>{formatCurrency(order.total)}</span>
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
    </div>
  );
};

export default InvoiceTemplate;
