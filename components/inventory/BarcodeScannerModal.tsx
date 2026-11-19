import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { 
  X, 
  Scan, 
  Camera, 
  Search, 
  Package, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { StorageImage } from '../StorageImage';

interface BarcodeScannerModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  products,
  isOpen,
  onClose,
  onSelectProduct
}) => {
  const { language, formatCurrency } = useTranslation();
  const isAr = language === 'ar';

  const [inputCode, setInputCode] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setInputCode('');
      setMatchedProduct(null);
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(isAr ? 'الكاميرا غير مدعومة في هذا المتصفح' : 'Camera API not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Check if BarcodeDetector is supported natively in browser
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
        });

        const scanInterval = setInterval(async () => {
          if (!videoRef.current || !streamRef.current) {
            clearInterval(scanInterval);
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              handleCodeFound(rawValue);
              clearInterval(scanInterval);
            }
          } catch (e) {
            // ignore frame read errors
          }
        }, 500);
      }
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      setCameraError(isAr ? 'تعذر فتح الكاميرا، يرجى إدخال الباركود يدوياً بالأسفل.' : 'Could not access camera. Please enter barcode manually.');
      stopCamera();
    }
  };

  const handleCodeFound = (code: string) => {
    const clean = code.trim().toLowerCase();
    setInputCode(code);
    const found = products.find(p => 
      (p.barcode && p.barcode.toLowerCase() === clean) ||
      (p.sku && p.sku.toLowerCase() === clean) ||
      p.id.toLowerCase() === clean
    );

    if (found) {
      setMatchedProduct(found);
      stopCamera();
    } else {
      setMatchedProduct(null);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      handleCodeFound(inputCode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isAr ? 'ماسح الباركود و QR' : 'Barcode & QR Scanner'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'امسح باركود المنتج للوصول السريع' : 'Scan or type barcode to find product'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* Camera Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800">
            {cameraActive ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-32 border-2 border-primary/80 rounded-xl relative animate-pulse">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-6 space-y-3">
                <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 max-w-[200px] mx-auto">
                  {isAr ? 'استخدم كاميرا الجهاز لمسح باركود السلعة فورياً' : 'Use camera to scan barcode directly'}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isAr ? 'تشغيل الكاميرا' : 'Start Camera'}</span>
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl text-xs">
              {cameraError}
            </div>
          )}

          {/* Manual Input Form */}
          <form onSubmit={handleManualSearch} className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'أو أدخل رقم الباركود / SKU يدوياً:' : 'Or enter Barcode / SKU:'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                  placeholder={isAr ? 'مثال: 1234567890...' : 'e.g. 1234567890...'}
                  className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
              >
                {isAr ? 'بحث' : 'Find'}
              </button>
            </div>
          </form>

          {/* Matched Product Result */}
          {matchedProduct && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'تم العثور على الصنف في المخزون!' : 'Product Found in Inventory!'}</span>
              </div>

              <div className="flex items-center gap-3">
                {matchedProduct.imageUrl ? (
                  <StorageImage src={matchedProduct.imageUrl} alt={matchedProduct.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-emerald-200/50 flex items-center justify-center text-emerald-700">
                    <Package className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{matchedProduct.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">
                    SKU: {matchedProduct.sku} • {isAr ? 'الرصيد:' : 'Stock:'} <span className="font-bold">{matchedProduct.stock}</span>
                  </p>
                  <p className="text-xs font-bold text-emerald-700 font-mono mt-0.5">
                    {formatCurrency(matchedProduct.salePrice)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onSelectProduct(matchedProduct);
                  onClose();
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                {isAr ? 'عرض تفاصيل الصنف والإجراءات' : 'View Product Details & Actions'}
              </button>
            </div>
          )}

          {inputCode && !matchedProduct && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              <span>{isAr ? 'لم يتم العثور على منتج يطابق هذا الرمز.' : 'No product matching this barcode was found.'}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
