import React, { useRef } from 'react';
import { Order } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import InvoiceTemplate from '../settings/InvoiceTemplate';
import { useSettings } from '../../contexts/SettingsContext';
import { Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintOrderModalProps {
  order: Order;
  onClose: () => void;
}

const PrintOrderModal: React.FC<PrintOrderModalProps> = ({ order, onClose }) => {
  const { t, language, formatCurrency, formatDate } = useTranslation();
  const { customers, products } = useAppContext();
  const printableContentRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  const isAr = language === 'ar';
  const customer = customers.find(c => c.id === order.customerId);

  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const rawPhone = customer?.phone || '';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    const itemsList = order.items
      .map((item, idx) => {
        const prod = products.find(p => p.id === item.productId);
        const name = prod?.name || `صنف #${idx + 1}`;
        return `• ${name} (x${item.quantity}) - ${formatCurrency(item.price * item.quantity)}`;
      })
      .join('\n');

    const message = isAr
      ? `مرحباً ${customer?.name || 'عزيزنا العميل'}،\nشكراً لتسوقك وثقتك بـ شركة مودرن هاوس للتجارة!\n\n🧾 *تفاصيل الفاتورة الضريبية رقم:* *${order.orderNumber}*\n${itemsList}\n\n💰 *المبلغ الإجمالي:* *${formatCurrency(order.total)}*\n💳 *طريقة الدفع:* ${order.paymentMethod}\n📅 *تاريخ الفاتورة:* ${formatDate(order.date)}\n\nنتمنى لك يوماً سعيداً ويسعدنا دائماً خدمتك! 🤍✨`
      : `Hello ${customer?.name || 'Valued Customer'},\nThank you for shopping with Modern House for Trading!\n\n🧾 *Tax Invoice Details #:* *${order.orderNumber}*\n${itemsList}\n\n💰 *Grand Total:* *${formatCurrency(order.total)}*\n💳 *Payment Method:* ${order.paymentMethod}\n📅 *Date:* ${formatDate(order.date)}\n\nHave a wonderful day and always happy to serve you! 🤍✨`;

    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleDownloadPdf = () => {
    const input = printableContentRef.current;
    if (input) {
      setIsGeneratingPdf(true);
      html2canvas(input, { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/jpeg', 0.7);
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
        
        pdf.save(`invoice-${order.orderNumber}.pdf`);
      }).catch((err) => {
          console.error("PDF Generation Error:", err);
      }).finally(() => {
          setIsGeneratingPdf(false);
      });
    }
  };

  return (
    <div
      id="print-modal-backdrop"
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div id="print-modal-dialog" className="bg-card rounded-lg shadow-xl w-full max-w-4xl transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b rounded-t dark:border-dark-border no-print flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            {t('orders.print_modal.title')}
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>

        <div className="overflow-y-auto" id="printable-invoice-wrapper">
          <div ref={printableContentRef} id="printable-invoice">
              <InvoiceTemplate order={order} settings={settings} />
          </div>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse no-print flex-shrink-0">
          <button onClick={onClose} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-focus rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">{t('orders.print_modal.close_button')}</button>
          
          <button
            onClick={handleWhatsAppShare}
            type="button"
            className="inline-flex items-center gap-2 text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:outline-none focus:ring-emerald-300 font-semibold rounded-lg text-sm px-4 py-2.5 text-center shadow-sm transition"
            title={isAr ? 'مشاركة عبر واتساب' : 'Share via WhatsApp'}
          >
            <Share2 className="w-4 h-4" />
            <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
          </button>

          <button disabled={isGeneratingPdf} onClick={handleDownloadPdf} type="button" className={`text-white bg-secondary hover:bg-opacity-90 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center ${isGeneratingPdf ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {isGeneratingPdf ? (t('language') === 'ar' ? 'جاري إنشاء PDF...' : 'Generating PDF...') : t('orders.print_modal.download_pdf_button')}
          </button>
          <button onClick={handlePrint} type="button" className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary-focus font-medium rounded-lg text-sm px-5 py-2.5 text-center">{t('orders.print_modal.print_button')}</button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInScale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale { animation: fadeInScale 0.2s ease-out forwards; }
        
        @media print {
            body * {
                visibility: hidden;
            }
            .no-print {
                display: none !important;
            }
            #print-modal-backdrop {
                visibility: visible;
                position: absolute !important;
                left: 0;
                top: 0;
                width: 100vw;
                height: auto;
                background: none;
                display: block;
                padding: 0;
            }
            #print-modal-dialog {
                visibility: visible;
                position: static;
                transform: none !important;
                box-shadow: none;
                width: 100%;
                max-width: 100%;
                display: block;
                margin: 0;
            }
            #printable-invoice-wrapper, #printable-invoice-wrapper * {
                visibility: visible;
            }
             #printable-invoice-wrapper {
                position: static;
                width: 100%;
                height: auto;
                overflow: visible !important;
            }
            #printable-invoice {
                visibility: visible;
                width: 100%;
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

export default PrintOrderModal;