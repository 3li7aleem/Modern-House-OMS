import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Product } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { QrCode, Download, Printer, Copy, Check, X, Tag } from 'lucide-react';

interface ProductQrModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductQrModal: React.FC<ProductQrModalProps> = ({ product, onClose }) => {
  const { language, formatCurrency } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printLabelRef = useRef<HTMLDivElement>(null);

  const scanValue = product.barcode || product.sku || product.id;

  useEffect(() => {
    let isMounted = true;
    if (scanValue) {
      QRCode.toDataURL(scanValue, {
        width: 600,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
        .then((url) => {
          if (isMounted) setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('QR code generation error:', err);
          if (isMounted) {
            setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(scanValue)}&size=600x600&margin=2`);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [scanValue]);

  const handleCopy = () => {
    if (!scanValue) return;
    navigator.clipboard.writeText(scanValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${product.sku || product.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const isRtl = language === 'ar';

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        id="qr-modal-card" 
        className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-scale text-text-primary dark:text-dark-text-primary"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-border dark:border-dark-border flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/50 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">
                {isRtl ? 'رمز QR للمنتج' : 'Product QR Code'}
              </h3>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {isRtl ? 'للمسح السريع في المخزن ونقاط البيع' : 'For quick scanning in POS & inventory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Printable Label */}
        <div className="p-6 flex flex-col items-center">
          <div
            ref={printLabelRef}
            id="printable-single-qr"
            className="w-full bg-white text-black p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col items-center text-center"
          >
            {/* Header info on label */}
            <div className="w-full mb-3 pb-2 border-b border-gray-200">
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <span>{product.category || (isRtl ? 'منتج' : 'Product')}</span>
                <span className="text-primary font-bold">{formatCurrency(product.salePrice)}</span>
              </div>
              <h4 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                {product.name}
              </h4>
            </div>

            {/* QR Code */}
            <div className="bg-white p-2.5 rounded-lg border border-gray-200 inline-block my-1 shadow-2xs">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${product.name}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 animate-pulse rounded flex items-center justify-center text-gray-400 text-xs">
                  {isRtl ? 'جارٍ الإنشاء...' : 'Generating...'}
                </div>
              )}
            </div>

            {/* Scan Value / Barcode text */}
            <div className="mt-3 flex flex-col items-center gap-1 w-full">
              <div className="font-mono text-sm font-bold tracking-widest text-gray-800 bg-gray-100 px-3 py-1 rounded-md border border-gray-200 max-w-full truncate">
                {scanValue}
              </div>
              <div className="flex items-center justify-center gap-3 text-[11px] text-gray-500 mt-1">
                {product.sku && (
                  <span>
                    <strong>SKU:</strong> {product.sku}
                  </span>
                )}
                {product.barcode && product.barcode !== product.sku && (
                  <span>
                    <strong>Barcode:</strong> {product.barcode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Value copy helper */}
          <div className="w-full mt-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 border border-border dark:border-dark-border px-3.5 py-2.5 rounded-xl no-print">
            <div className="flex items-center gap-2 overflow-hidden text-xs">
              <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-text-secondary dark:text-dark-text-secondary truncate">
                {isRtl ? 'القيمة المشفرة:' : 'Encoded value:'} <strong className="font-mono text-text-primary dark:text-white">{scanValue}</strong>
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover px-2 py-1 rounded-md hover:bg-primary/10 transition shrink-0"
              title={isRtl ? 'نسخ القيمة' : 'Copy value'}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600">{isRtl ? 'تم النسخ' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'نسخ' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-border dark:border-dark-border flex items-center justify-end gap-2.5 bg-gray-50/50 dark:bg-gray-800/30 no-print">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-text-primary dark:text-white transition"
          >
            <Download className="w-4 h-4" />
            <span>{isRtl ? 'تحميل صورة QR' : 'Download PNG'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary hover:bg-primary-hover text-white transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{isRtl ? 'طباعة الملصق' : 'Print Label'}</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale { animation: fadeInScale 0.15s ease-out forwards; }

        @media print {
          body * {
            visibility: hidden !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-single-qr, #printable-single-qr * {
            visibility: visible !important;
          }
          #printable-single-qr {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 80mm !important;
            max-width: 80mm !important;
            box-shadow: none !important;
            border: 1px dashed #333 !important;
            background: white !important;
            color: black !important;
            padding: 4mm !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductQrModal;
