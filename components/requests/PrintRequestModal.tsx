import React, { useRef } from 'react';
import { Request } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { X, Printer, Download } from 'lucide-react';

interface PrintRequestModalProps {
  request: Request;
  onClose: () => void;
}

const PrintRequestModal: React.FC<PrintRequestModalProps> = ({ request, onClose }) => {
  const { t, formatCurrency, formatDate } = useTranslation();
  const printableContentRef = useRef<HTMLDivElement>(null);
  const { products } = useAppContext();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const input = printableContentRef.current;
    if (input) {
      html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then((canvas) => {
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
        
        pdf.save(`request-${request.customerName}-${request.id.slice(0, 5)}.pdf`);
      }).catch((err) => {
          console.error("PDF Generation Error:", err);
      });
    }
  };

  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  // Calculate estimated total based on product sale prices:
  const getRequestTotal = () => {
    return request.items.reduce((sum, item) => {
      const prod = getProduct(item.productId);
      return sum + (prod ? prod.salePrice * item.quantity : 0);
    }, 0);
  };

  return (
    <div
      id="print-request-modal-backdrop"
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div id="print-request-modal-dialog" className="bg-card rounded-lg shadow-xl w-full max-w-2xl transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b rounded-t dark:border-dark-border no-print flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            {t('requests.print_modal.title') || 'Print Customer Order'}
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto" id="printable-request-wrapper">
          <div ref={printableContentRef} id="printable-request" className="p-8 bg-white text-black font-sans">
            {/* Header / Company Branding */}
            <div className="flex justify-between items-start border-b-2 border-gray-300 pb-6 mb-6">
              <div>
                <h1 className="text-3xl font-bold uppercase tracking-wider text-primary">TRUSTED CHOICE</h1>
                <p className="text-sm text-gray-500 mt-1">Order Management System</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-semibold text-gray-700">CUSTOMER ORDER</h2>
                <p className="text-sm text-gray-500 mt-1">Status: {request.status}</p>
                <p className="text-xs text-gray-400">Date: {formatDate(request.date)}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mb-6">
              <div>
                <h3 className="text-xs uppercase font-semibold text-gray-500 mb-1">Customer Info:</h3>
                <p className="text-md font-bold text-gray-800">{request.customerName}</p>
                <p className="text-sm text-gray-600">Phone: {request.customerPhone}</p>
              </div>
              {request.customerAddress && (
                <div>
                  <h3 className="text-xs uppercase font-semibold text-gray-500 mb-1">Shipping Address:</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.customerAddress}</p>
                </div>
              )}
            </div>

            {/* Table of Items */}
            <table className="w-full text-sm text-left border-collapse mb-6">
              <thead>
                <tr className="border-b-2 border-gray-300 text-gray-700 font-semibold uppercase text-xs">
                  <th className="py-2">Product Name</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item, idx) => {
                  const prod = getProduct(item.productId);
                  const price = prod ? prod.salePrice : 0;
                  const amt = price * item.quantity;
                  return (
                    <tr key={idx} className="border-b border-gray-200 text-gray-800">
                      <td className="py-3 font-semibold">{prod ? prod.name : 'N/A'}</td>
                      <td className="py-3 text-right">{formatCurrency(price)}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right">{formatCurrency(amt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary Block */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <div className="w-64">
                <div className="flex justify-between py-2 text-gray-600">
                  <span>Subtotal Estimated:</span>
                  <span>{formatCurrency(getRequestTotal())}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-300 text-lg font-bold text-gray-800 mt-2">
                  <span>Grand Total Est. :</span>
                  <span>{formatCurrency(getRequestTotal())}</span>
                </div>
              </div>
            </div>

            {/* Footnote */}
            <div className="mt-12 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
              Thank you for choosing Trusted Choice! This is a print receipt for the customer order.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse no-print flex-shrink-0">
          <button onClick={onClose} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">
            {t('orders.print_modal.close_button') || 'Close'}
          </button>
          <button onClick={handleDownloadPdf} type="button" className="flex items-center gap-1.5 text-white bg-secondary hover:bg-opacity-90 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
            <Download className="w-4 h-4" />
            <span>{t('orders.print_modal.download_pdf_button') || 'Download PDF'}</span>
          </button>
          <button onClick={handlePrint} type="button" className="flex items-center gap-1.5 text-white bg-primary hover:bg-primary-hover font-medium rounded-lg text-sm px-5 py-2.5 text-center">
            <Printer className="w-4 h-4" />
            <span>{t('orders.print_modal.print_button') || 'Print Invoice'}</span>
          </button>
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
            #print-request-modal-backdrop {
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
            #print-request-modal-dialog {
                visibility: visible;
                position: static;
                transform: none !important;
                box-shadow: none;
                width: 100%;
                max-width: 100%;
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
            }
            #printable-request {
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

export default PrintRequestModal;
