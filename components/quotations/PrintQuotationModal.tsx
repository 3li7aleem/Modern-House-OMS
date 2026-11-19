import React, { useRef, useState } from 'react';
import { Quotation } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Printer, Download, X, CheckCircle, FileText, Phone, Mail, MapPin, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintQuotationModalProps {
  quotation: Quotation;
  onClose: () => void;
}

export const PrintQuotationModal: React.FC<PrintQuotationModalProps> = ({ quotation, onClose }) => {
  const { t, language, formatCurrency, formatDate } = useTranslation();
  const { customers } = useAppContext();
  const { settings } = useSettings();
  const isAr = language === 'ar';

  const printableRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const customer = customers.find(c => c.id === quotation.customerId);
  const { logoUrl, accentColor } = settings;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const rawPhone = quotation.customerPhone || customer?.phone || '';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    const itemsList = quotation.items
      .map(item => `• ${item.name} (x${item.quantity}) - ${formatCurrency(item.total)}`)
      .join('\n');

    const message = isAr
      ? `مرحباً ${quotation.customerName || customer?.name || 'عزيزنا العميل'}،\nيسعدنا إرسال تفاصيل عرض السعر رقم: *${quotation.quotationNumber}* من شركة مودرن هاوس للتجارة.\n\n📋 *تفاصيل الأصناف:*\n${itemsList}\n\n💰 *المبلغ الإجمالي:* *${formatCurrency(quotation.total)}*\n⏳ *صالح لغاية:* ${formatDate(quotation.validUntil)}\n\nيسعدنا دائماً استقبال استفساراتك واعتماد طلبك للبدء في التجهيز! 🌟✨`
      : `Hello ${quotation.customerName || customer?.name || 'Valued Customer'},\nWe are pleased to share official Quotation *#${quotation.quotationNumber}* from Modern House for Trading.\n\n📋 *Quotation Summary:*\n${itemsList}\n\n💰 *Grand Total:* *${formatCurrency(quotation.total)}*\n⏳ *Valid Until:* ${formatDate(quotation.validUntil)}\n\nLooking forward to assisting you and confirming your order! 🌟✨`;

    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleDownloadPdf = async () => {
    const input = printableRef.current;
    if (!input) return;

    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;
      let page = 1;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -pageHeight * page;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
        page++;
      }

      pdf.save(`Quotation-${quotation.quotationNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                {isAr ? `عرض سعر: ${quotation.quotationNumber}` : `Price Quotation: ${quotation.quotationNumber}`}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'معاينة العرض الرسمي للطباعة والتصدير' : 'Official commercial quotation preview'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm"
              title={isAr ? 'مشاركة عبر واتساب' : 'Share via WhatsApp'}
            >
              <Share2 className="w-4 h-4" />
              <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة' : 'Print'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? (isAr ? 'جاري التحميل...' : 'Downloading...') : (isAr ? 'تحميل PDF' : 'Download PDF')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 dark:bg-slate-950 flex justify-center">
          <div
            ref={printableRef}
            className="w-full max-w-[800px] bg-white text-slate-900 p-8 sm:p-10 shadow-lg rounded-sm text-sm font-sans"
            style={{ minHeight: '1050px', direction: isAr ? 'rtl' : 'ltr' }}
          >
            {/* Top Company Banner */}
            <div className="flex justify-between items-start border-b-2 pb-6 mb-6" style={{ borderColor: accentColor || '#0284c7' }}>
              <div>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain mb-2" />
                ) : (
                  <h1 className="text-2xl font-black tracking-tight" style={{ color: accentColor || '#0284c7' }}>
                    {isAr ? 'مودرن هاوس للتجارة' : 'Modern House for Trading'}
                  </h1>
                )}
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? 'مملكة البحرين • هاتف: 97317000000+ • س.ت: 12345-1' : 'Kingdom of Bahrain • Tel: +973 17000000 • CR: 12345-1'}
                </p>
                <p className="text-xs text-slate-500">
                  {isAr ? 'الرقم الضريبي VAT: 220000000000002' : 'VAT Reg. No: 220000000000002'}
                </p>
              </div>

              <div className="text-right sm:text-left rtl:sm:text-left rtl:text-left">
                <div
                  className="inline-block px-4 py-1.5 rounded text-white font-bold text-base mb-2 uppercase tracking-wide"
                  style={{ backgroundColor: accentColor || '#0284c7' }}
                >
                  {isAr ? 'عرض سعر رسمي' : 'PRICE QUOTATION'}
                </div>
                <div className="space-y-1 text-xs">
                  <p><span className="font-bold text-slate-600">{isAr ? 'رقم العرض: ' : 'Quote No: '}</span><span className="font-mono font-bold">{quotation.quotationNumber}</span></p>
                  <p><span className="font-bold text-slate-600">{isAr ? 'تاريخ الإصدار: ' : 'Date: '}</span>{formatDate(quotation.date)}</p>
                  <p><span className="font-bold text-rose-600">{isAr ? 'صالح لغاية: ' : 'Valid Until: '}</span><span className="font-semibold text-rose-600">{formatDate(quotation.validUntil)}</span></p>
                  {quotation.preparedBy && (
                    <p><span className="font-bold text-slate-600">{isAr ? 'المسؤول: ' : 'Prepared By: '}</span>{quotation.preparedBy}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bill To Customer Card */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <div>
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                  {isAr ? 'موجّه إلى (العميل)' : 'Quotation Prepared For'}
                </span>
                <p className="font-bold text-base text-slate-900">{quotation.customerName || customer?.name}</p>
                <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                  {(quotation.customerPhone || customer?.phone) && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{quotation.customerPhone || customer?.phone}</span>
                    </p>
                  )}
                  {(quotation.customerEmail || customer?.email) && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{quotation.customerEmail || customer?.email}</span>
                    </p>
                  )}
                  {(quotation.customerAddress || customer?.address) && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{quotation.customerAddress || customer?.address}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="text-left rtl:text-left space-y-1 text-xs">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                  {isAr ? 'تفاصيل العرض' : 'Quotation Summary'}
                </span>
                <p><span className="font-bold text-slate-600">{isAr ? 'الرقم الضريبي/السجل: ' : 'Tax / CR No: '}</span>{quotation.taxNumber || '-'}</p>
                <p><span className="font-bold text-slate-600">{isAr ? 'حالة العرض: ' : 'Status: '}</span>{quotation.status}</p>
                <p><span className="font-bold text-slate-600">{isAr ? 'العملة: ' : 'Currency: '}</span>{isAr ? 'دينار بحريني (BHD)' : 'Bahraini Dinar (BHD)'}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left rtl:text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">{isAr ? 'الوصف / الصنف' : 'Description / Item'}</th>
                    <th className="p-3 text-center w-20">{isAr ? 'الكمية' : 'Qty'}</th>
                    <th className="p-3 text-right rtl:text-left w-24">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                    {quotation.items.some(i => (i.discount || 0) > 0) && (
                      <th className="p-3 text-center w-20">{isAr ? 'الخصم' : 'Disc.'}</th>
                    )}
                    <th className="p-3 text-right rtl:text-left w-24">{isAr ? 'ض.ق.م 10%' : 'VAT 10%'}</th>
                    <th className="p-3 text-right rtl:text-left w-28">{isAr ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quotation.items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center text-slate-400 font-semibold">{index + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                        )}
                        {item.sku && (
                          <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">{item.quantity}</td>
                      <td className="p-3 text-right rtl:text-left font-mono">{formatCurrency(item.unitPrice)}</td>
                      {quotation.items.some(i => (i.discount || 0) > 0) && (
                        <td className="p-3 text-center text-rose-500 font-mono">
                          {item.discount ? `${formatCurrency(item.discount)}` : '-'}
                        </td>
                      )}
                      <td className="p-3 text-right rtl:text-left text-slate-500 font-mono">
                        {formatCurrency(item.vatAmount || 0)}
                      </td>
                      <td className="p-3 text-right rtl:text-left font-bold font-mono text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Notes Section */}
            <div className="grid grid-cols-12 gap-6 mb-8">
              {/* Terms and conditions */}
              <div className="col-span-7 space-y-3">
                <div className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/50 text-xs">
                  <h4 className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    <span>{isAr ? 'شروط وأحكام العرض' : 'Terms & Conditions'}</span>
                  </h4>
                  <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                    {quotation.terms || (isAr 
                      ? '1. الأسعار سارية حتى التاريخ الموضح أعلاه.\n2. يتم الدفع وفقاً للاتفاق المعتمد.\n3. التسليم والتركيب وفق جدول المواعيد المعتمد.' 
                      : '1. Prices valid until the date shown above.\n2. Payment terms as agreed upon.\n3. Delivery and installation per confirmed schedule.')}
                  </p>
                </div>

                {quotation.notes && (
                  <div className="border border-amber-200 bg-amber-50/50 p-3 rounded-xl text-xs text-amber-900">
                    <span className="font-bold block mb-1">{isAr ? 'ملاحظات إضافية:' : 'Additional Notes:'}</span>
                    <p className="whitespace-pre-line leading-relaxed">{quotation.notes}</p>
                  </div>
                )}
              </div>

              {/* Totals Box */}
              <div className="col-span-5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                    <span className="font-mono font-semibold">{formatCurrency(quotation.subtotal)}</span>
                  </div>

                  {(quotation.discount || 0) > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>{isAr ? 'الخصم الإجمالي:' : 'Total Discount:'}</span>
                      <span className="font-mono font-semibold">-{formatCurrency(quotation.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? 'ضريبة القيمة المضافة (10%):' : 'VAT (10%):'}</span>
                    <span className="font-mono font-semibold">{formatCurrency(quotation.vatTotal)}</span>
                  </div>

                  <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-baseline">
                    <span className="font-bold text-sm text-slate-900">{isAr ? 'المبلغ الإجمالي:' : 'Grand Total:'}</span>
                    <span className="font-black text-lg font-mono text-primary">{formatCurrency(quotation.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature & Stamp Section */}
            <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-200 mt-auto text-xs text-center">
              <div>
                <p className="font-bold text-slate-700 mb-12">{isAr ? 'ختم وتوقيع الشركة' : 'Company Authorized Signature'}</p>
                <div className="border-t border-dashed border-slate-400 mx-8"></div>
                <p className="text-[11px] text-slate-400 mt-1">{isAr ? 'مودرن هاوس للتجارة' : 'Modern House for Trading'}</p>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-12">{isAr ? 'توقيع وقبول العميل' : 'Customer Acceptance Signature'}</p>
                <div className="border-t border-dashed border-slate-400 mx-8"></div>
                <p className="text-[11px] text-slate-400 mt-1">{isAr ? 'الاسم والتاريخ' : 'Name & Date'}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
