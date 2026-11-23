import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Mic, 
  MicOff, 
  Check, 
  ShoppingCart, 
  FileSpreadsheet, 
  RefreshCw, 
  Plus, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { generateQuotationFromPrompt, GeneratedQuotationResult, getEffectiveApiKey } from '../../lib/aiService';

interface AiQuotationGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToCart?: (items: Array<{ productId?: string; name: string; price: number; quantity: number }>, customerName?: string) => void;
  onApplyToQuotation?: (data: GeneratedQuotationResult) => void;
}

export const AiQuotationGeneratorModal: React.FC<AiQuotationGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyToCart,
  onApplyToQuotation
}) => {
  const { products } = useAppContext();
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedQuotationResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const generated = await generateQuotationFromPrompt(promptText, products);
      setResult(generated);
    } catch (err: any) {
      setError(err.message || 'فشل توليد عرض السعر');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('متصفحك لا يدعم التعرف الصوتي المباشر. يرجى كتابة الطلب.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-BH';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      setPromptText(prev => prev ? `${prev} ${speechText}` : speechText);
      setIsRecording(false);
    };

    recognition.start();
  };

  const examplePrompts = [
    'طقم مطبخ ألمنيوم 4 أمتار مع شفاط طباخ ومغسلة جرانيت للعميل عبدالله مع خصم 10%',
    'حوض غسيل ستانلس ستيل مع خلاط إيطالي وسيليكون تركي عدد 2 للعميل جاسم',
    'دولاب حمام مع مرآة LED وخلاط دش مخفي لفيلا في الهملة'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-primary to-slate-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">توليد عروض الأسعار الذكي (AI Smart Quote)</h3>
              <p className="text-[11px] text-slate-300">صف طلب العميل بالصوت أو النص، والذكاء الاصطناعي يستخرج الأصناف والأسعار فوراً</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Prompt Input Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                اكتب أو تحدث بطلب العميل:
              </label>
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  isRecording 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-amber-500" />}
                <span>{isRecording ? 'جاري الاستماع...' : 'تحدث صوتياً'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder="مثال: مطبخ تفصيل ألمنيوم 3 أمتار، مع مغسلة رخام أسود وخلاط ألماني، وشفاط هرمي مع تركيب مجاني للعميل خالد السبت..."
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
            />

            {/* Quick Example Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-bold">أمثلة سريعة:</span>
              {examplePrompts.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPromptText(ex)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] hover:bg-amber-100 dark:hover:bg-slate-700 transition"
                >
                  {ex.slice(0, 35)}...
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!promptText.trim() || loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري معالجة الطلب ومطابقة المنتجات...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>تحليل وتوليد الفاتورة / عرض السعر ✨</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Result Table */}
          {result && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">العميل المقترح:</span>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {result.customerName || 'عميل نقدي مباشر'}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-bold block">الإجمالي النهائي:</span>
                  <span className="font-black font-mono text-amber-500 text-sm">
                    {Number(result.total).toFixed(3)} د.ب
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {result.items.map((it, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">{it.name}</div>
                      {it.notes && <div className="text-[10px] text-slate-400">{it.notes}</div>}
                    </div>
                    <div className="text-left flex items-center gap-3">
                      <span className="text-[11px] text-slate-500">الكمية: {it.quantity}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {(Number(it.unitPrice) * it.quantity).toFixed(3)} د.ب
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Apply Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {onApplyToCart && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyToCart(result.items.map(it => ({
                        productId: it.productId,
                        name: it.name,
                        price: it.unitPrice,
                        quantity: it.quantity
                      })), result.customerName);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>إضافة مباشرة لسلة المبيعات (POS)</span>
                  </button>
                )}

                {onApplyToQuotation && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyToQuotation(result);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>اعتماد في عروض الأسعار</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
