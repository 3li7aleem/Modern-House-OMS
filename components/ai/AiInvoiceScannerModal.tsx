import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Building2, 
  Hash, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { parseVendorInvoicePhoto, ParsedVendorInvoiceResult } from '../../lib/aiService';

interface AiInvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPurchaseOrder?: (data: ParsedVendorInvoiceResult) => void;
}

export const AiInvoiceScannerModal: React.FC<AiInvoiceScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyPurchaseOrder
}) => {
  const { suppliers } = useAppContext();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedInvoice, setParsedInvoice] = useState<ParsedVendorInvoiceResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setParsedInvoice(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imagePreview) return;
    setLoading(true);
    setError(null);

    try {
      const res = await parseVendorInvoicePhoto(imagePreview, suppliers);
      setParsedInvoice(res);
    } catch (err: any) {
      setError(err.message || 'تعذر استخراج بيانات الفاتورة بالذكاء الاصطناعي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-primary to-slate-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-inner">
              <FileText className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">مسح فواتير وسندات الموردين (AI Invoice OCR)</h3>
              <p className="text-[11px] text-slate-300">التقط صورة لفاتورة المورد الورقية، والذكاء الاصطناعي يقرأ الأصناف والأسعار تلقائياً</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {!imagePreview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition hover:bg-amber-500/5"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-amber-500 mx-auto flex items-center justify-center mb-2 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                انقر لاختيار صورة الفاتورة أو تصويرها بالكاميرا
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                يدعم فواتير الشراء وسندات التوريد الورقية والمطبوعة (JPEG, PNG, PDF screenshot)
              </p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-56 bg-slate-950 flex items-center justify-center">
              <img src={imagePreview} alt="فاتورة المورد" className="max-h-56 w-auto object-contain" />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setParsedInvoice(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-900/80 text-white hover:bg-rose-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleScan}
            disabled={!imagePreview || loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري قراءة الفاتورة واستخراج الأصناف والأسعار بالـ OCR...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>قراءة واستخراج بيانات الفاتورة بالذكاء الاصطناعي ✨</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Result */}
          {parsedInvoice && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2 border-b border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">المورد:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{parsedInvoice.supplierName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">رقم الفاتورة:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{parsedInvoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">التاريخ:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{parsedInvoice.date}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <span className="text-[11px] font-bold text-slate-500 block">الأصناف المستخرجة ({parsedInvoice.items.length}):</span>
                {parsedInvoice.items.map((it, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{it.name}</div>
                      {it.sku && <div className="text-[10px] font-mono text-slate-400">SKU: {it.sku}</div>}
                    </div>
                    <div className="text-left flex items-center gap-3">
                      <span className="text-[11px] text-slate-500">الكمية: {it.quantity}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {Number(it.purchasePrice).toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                <span>إجمالي الفاتورة:</span>
                <span className="font-mono text-base font-black text-amber-500">
                  {Number(parsedInvoice.totalAmount).toFixed(3)} {parsedInvoice.currency}
                </span>
              </div>

              {onApplyPurchaseOrder && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyPurchaseOrder(parsedInvoice);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:opacity-90 transition mt-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>اعتماد وإدراج في طلبات الشراء والمخزون</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
