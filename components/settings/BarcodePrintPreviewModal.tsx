
import React, { useMemo, useRef } from 'react';
import { Product } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import Barcode from './Barcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface BarcodePrintPreviewModalProps {
  items: { product: Product; quantity: number }[];
  onClose: () => void;
}

const BarcodePrintPreviewModal: React.FC<BarcodePrintPreviewModalProps> = ({ items, onClose }) => {
  const { t, formatCurrency } = useTranslation();
  const printableContentRef = useRef<HTMLDivElement>(null);

  const labelsToPrint = useMemo(() => {
    const labels: Product[] = [];
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        labels.push(item.product);
      }
    });
    return labels;
  }, [items]);

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
        pdf.save(`barcodes.pdf`);
      }).catch((err) => {
        console.error('PDF Generation Error:', err);
      });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div id="print-modal-content" className="bg-card rounded-lg shadow-xl w-full max-w-4xl m-4 transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b rounded-t dark:border-dark-border no-print flex justify-between items-center">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            {t('settings.qr_code_modal.title')}
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>

        <div id="printable-barcodes" className="p-4 bg-white text-black max-h-[75vh] overflow-y-auto">
          <div ref={printableContentRef} className="grid grid-cols-4 gap-2">
            {labelsToPrint.map((product, index) => (
              <div key={index} className="border border-black p-2 flex flex-col items-center text-center text-xs break-words label-cell">
                <p className="font-bold">{t('settings.qr_code_modal.company_name')}</p>
                <p className="my-1 leading-tight">{product.name}</p>
                <p className="font-bold text-sm mb-1">{formatCurrency(product.salePrice)}</p>
                {product.barcode ? <Barcode value={product.barcode} size={60} /> : <p className="text-red-500">No barcode</p>}
                <p className="tracking-widest mt-1">{product.barcode}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end p-4 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse no-print">
          <button onClick={onClose} type="button" className="text-gray-500 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">{t('orders.print_modal.close_button')}</button>
          <button onClick={handleDownloadPdf} type="button" className="text-white bg-secondary hover:bg-opacity-90 font-medium rounded-lg text-sm px-5 py-2.5 text-center">{t('orders.print_modal.download_pdf_button')}</button>
          <button onClick={handlePrint} type="button" className="text-white bg-primary hover:bg-primary-hover font-medium rounded-lg text-sm px-5 py-2.5 text-center">{t('orders.print_modal.print_button')}</button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInScale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale { animation: fadeInScale 0.2s ease-out forwards; }
        
        .label-cell {
            page-break-inside: avoid;
        }

        @media print {
            body * {
                visibility: hidden;
            }
            .no-print {
                display: none !important;
            }
            #printable-barcodes, #printable-barcodes * {
                visibility: visible;
            }
            #printable-barcodes {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: auto;
                padding: 1cm;
                margin: 0;
                background: white;
            }
            #print-modal-content {
                box-shadow: none;
                border: none;
            }
        }
        @page {
            size: A4;
            margin: 0.5cm;
        }
      `}</style>
    </div>
  );
};

export default BarcodePrintPreviewModal;