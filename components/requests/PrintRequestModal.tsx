import React, { useRef, useState } from 'react';
import { Request } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { X, Printer, Download } from 'lucide-react';
import Logo from '../layout/Logo';

interface PrintRequestModalProps {
  request: Request;
  onClose: () => void;
}

const PrintRequestModal: React.FC<PrintRequestModalProps> = ({ request, onClose }) => {
  const { t, language, formatCurrency, formatNumber, formatDate } = useTranslation();
  const printableContentRef = useRef<HTMLDivElement>(null);
  const { products } = useAppContext();
  const { logoUrl, invoiceSettings } = useSettings();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const isAr = language === 'ar';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const input = printableContentRef.current;
    if (input) {
      setIsGeneratingPdf(true);
      html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then((canvas) => {
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
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

        while (heightLeft > 2) {
          position = -pageHeight * page;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
          page++;
        }

        pdf.save(`request-${request.customerName}-${request.id.slice(0, 5)}.pdf`);
      }).catch((err) => {
        console.error('PDF Generation Error:', err);
      }).finally(() => {
        setIsGeneratingPdf(false);
      });
    }
  };

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  const getRequestTotal = () => {
    return request.items.reduce((sum, item) => {
      const prod = getProduct(item.productId);
      const unitPrice = item.estimatedPrice ?? prod?.salePrice ?? 0;
      return sum + unitPrice * item.quantity;
    }, 0);
  };

  return (
    <div
      id="print-request-modal-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div id="print-request-modal-dialog" className="bg-card rounded-2xl shadow-2xl w-full max-w-[900px] transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b rounded-t dark:border-dark-border no-print flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">
            {t('requests.print_modal.title') || (isAr ? 'طباعة طلب العميل' : 'Print Customer Request')}
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto bg-slate-100/90 dark:bg-slate-950/70 p-4 sm:p-6 print:p-0 print:bg-white" id="printable-request-wrapper">
          <div
            ref={printableContentRef}
            id="printable-request"
            className="w-full max-w-[210mm] min-h-[280mm] mx-auto p-8 sm:p-10 bg-white text-slate-900 font-sans shadow-lg print:shadow-none print:max-w-none print:p-6 flex flex-col justify-between"
            style={{ direction: isAr ? 'rtl' : 'ltr' }}
          >
            <div>
              {/* Header / Modern House Branding */}
              <div className="flex justify-between items-start border-b-2 border-amber-500/60 pb-6 mb-6 gap-4">
                <div className="flex items-center gap-3.5">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="h-14 w-auto object-contain shrink-0" />
                  ) : (
                    <Logo showText={false} className="h-14 w-auto shrink-0" />
                  )}
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      {isAr ? (invoiceSettings?.companyNameAr || 'مودرن هاوس للتجارة') : (invoiceSettings?.companyNameEn || 'Modern House for Trading')}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {invoiceSettings?.address || (isAr ? 'سوق واقف - مدينة حمد - مملكة البحرين' : 'Souq Waqif, Hamad Town - Kingdom of Bahrain')}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isAr ? 'هاتف: ' : 'Tel: '}{invoiceSettings?.phone || '35965477 - 77905477'}
                      {invoiceSettings?.crNumber ? ` • ${isAr ? 'س.ت: ' : 'CR: '}${invoiceSettings.crNumber}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-start sm:text-end bg-slate-50 p-3.5 rounded-xl border border-slate-200 min-w-[190px]">
                  <span className="block text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                    {request.isOutOfStockRequest
                      ? (isAr ? 'طلب صنف غير متوفر بالمخزون' : 'Out-of-Stock / Special Request')
                      : (isAr ? 'طلب عميل' : 'Customer Request')}
                  </span>
                  <h2 className="text-base font-black text-slate-900 mt-0.5">
                    {isAr ? 'استمارة طلب عميل' : 'CUSTOMER REQUEST'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {isAr ? 'الحالة:' : 'Status:'} {t(`requests.status_labels.${request.status}`)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isAr ? 'التاريخ:' : 'Date:'} {formatDate(request.date)}
                  </p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
                <div>
                  <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {isAr ? 'بيانات العميل' : 'Customer Info'}
                  </h3>
                  <p className="text-sm font-bold text-slate-900">{request.customerName}</p>
                  <p className="text-slate-600 mt-0.5">{isAr ? 'الهاتف:' : 'Phone:'} <span className="font-mono">{request.customerPhone}</span></p>
                </div>
                {request.customerAddress && (
                  <div>
                    <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                      {isAr ? 'عنوان التوصيل' : 'Delivery Address'}
                    </h3>
                    <p className="text-slate-600 whitespace-pre-wrap">{request.customerAddress}</p>
                  </div>
                )}
              </div>

              {/* Table of Items */}
              <div className="overflow-hidden rounded-xl border border-slate-200 mb-6">
                <table className="w-full text-xs text-start border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 text-start">{isAr ? 'الصنف / المواصفات' : 'Product / Description'}</th>
                      <th className="p-3 text-end w-28">{isAr ? 'السعر التقديري' : 'Est. Price'}</th>
                      <th className="p-3 text-center w-20">{isAr ? 'الكمية' : 'Qty'}</th>
                      <th className="p-3 text-end w-28">{isAr ? 'الإجمالي' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {request.items.map((item, idx) => {
                      const prod = getProduct(item.productId);
                      const itemName = item.name || prod?.name || 'N/A';
                      const sku = item.sku || prod?.sku;
                      const price = item.estimatedPrice ?? prod?.salePrice ?? 0;
                      const amt = price * item.quantity;
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="p-3 text-center font-semibold text-slate-400 tabular-nums">{formatNumber(idx + 1)}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{itemName}</div>
                            {sku && <div className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {sku}</div>}
                            {item.notes && <div className="text-[11px] text-slate-500 mt-0.5">{item.notes}</div>}
                          </td>
                          <td className="p-3 text-end tabular-nums">{price > 0 ? formatCurrency(price) : '-'}</td>
                          <td className="p-3 text-center font-bold tabular-nums">{formatNumber(item.quantity)}</td>
                          <td className="p-3 text-end font-bold tabular-nums">{amt > 0 ? formatCurrency(amt) : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {request.notes && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700 mb-6">
                  <span className="font-bold block mb-1">{isAr ? 'ملاحظات إضافية:' : 'Request Notes:'}</span>
                  <p className="whitespace-pre-wrap">{request.notes}</p>
                </div>
              )}
            </div>

            {/* Bottom Summary & Footer */}
            <div>
              {getRequestTotal() > 0 && (
                <div className="flex justify-end pt-4 border-t border-slate-200 mb-6">
                  <div className="w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between py-1 font-bold text-sm text-slate-900">
                      <span>{isAr ? 'الإجمالي التقديري:' : 'Estimated Total:'}</span>
                      <span className="tabular-nums">{formatCurrency(getRequestTotal())}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 pt-4">
                {isAr
                  ? 'شكراً لتعاملكم مع مودرن هاوس للتجارة — مستند طلب عميل رسمي.'
                  : 'Thank you for choosing Modern House for Trading — Official Customer Request Document.'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse no-print flex-shrink-0">
          <button onClick={onClose} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none rounded-xl border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">
            {t('orders.print_modal.close_button') || (isAr ? 'إغلاق' : 'Close')}
          </button>
          <button disabled={isGeneratingPdf} onClick={handleDownloadPdf} type="button" className="flex items-center gap-1.5 text-white bg-secondary hover:bg-opacity-90 font-medium rounded-xl text-sm px-5 py-2.5 text-center disabled:opacity-60">
            <Download className="w-4 h-4" />
            <span>{t('orders.print_modal.download_pdf_button') || (isAr ? 'تحميل PDF' : 'Download PDF')}</span>
          </button>
          <button onClick={handlePrint} type="button" className="flex items-center gap-1.5 text-white bg-primary hover:bg-primary-hover font-medium rounded-xl text-sm px-5 py-2.5 text-center">
            <Printer className="w-4 h-4" />
            <span>{t('orders.print_modal.print_button') || (isAr ? 'طباعة' : 'Print')}</span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInScale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale { animation: fadeInScale 0.2s ease-out forwards; }

        @page {
            size: A4 portrait;
            margin: 10mm;
        }

        @media print {
            body * {
                visibility: hidden;
            }
            .no-print {
                display: none !important;
            }
            #print-request-modal-backdrop {
                visibility: visible;
                position: absolute !important;
                left: 0;
                top: 0;
                width: 100%;
                height: auto;
                background: none;
                display: block;
                padding: 0;
                margin: 0;
            }
            #print-request-modal-dialog {
                visibility: visible;
                position: static;
                transform: none !important;
                box-shadow: none;
                width: 100%;
                max-width: 100%;
                max-height: none;
                display: block;
                margin: 0;
            }
            #printable-request-wrapper, #printable-request-wrapper * {
                visibility: visible;
            }
            #printable-request-wrapper {
                position: static;
                width: 100%;
                height: auto;
                overflow: visible !important;
                padding: 0 !important;
                background: #fff !important;
            }
            #printable-request {
                visibility: visible;
                width: 100% !important;
                max-width: none !important;
                min-height: 275mm !important;
                box-shadow: none !important;
                color: #000;
                background: #fff;
            }
            tr, td, th {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
        }
      `}</style>
    </div>
  );
};

export default PrintRequestModal;
