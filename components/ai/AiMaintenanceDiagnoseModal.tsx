import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  X, 
  AlertTriangle, 
  Wrench, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  DollarSign 
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { diagnoseMaintenancePhoto, MaintenanceDiagnosisResult } from '../../lib/aiService';

interface AiMaintenanceDiagnoseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDiagnosis?: (diagnosis: MaintenanceDiagnosisResult) => void;
}

export const AiMaintenanceDiagnoseModal: React.FC<AiMaintenanceDiagnoseModalProps> = ({
  isOpen,
  onClose,
  onApplyDiagnosis
}) => {
  const { products } = useAppContext();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<MaintenanceDiagnosisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setDiagnosis(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDiagnose = async () => {
    if (!imagePreview) return;
    setLoading(true);
    setError(null);

    try {
      const res = await diagnoseMaintenancePhoto(imagePreview, customerNotes, products);
      setDiagnosis(res);
    } catch (err: any) {
      setError(err.message || 'تعذر تشخيص العطل بالذكاء الاصطناعي');
    } finally {
      setLoading(false);
    }
  };

  const severityBadges: Record<string, { label: string; bg: string; text: string }> = {
    critical: { label: 'حرج جداً (تدخل فوري)', bg: 'bg-rose-500/20 border-rose-500/40', text: 'text-rose-600 dark:text-rose-400' },
    high: { label: 'مرتفع الأهمية', bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-600 dark:text-amber-400' },
    medium: { label: 'متوسط', bg: 'bg-blue-500/20 border-blue-500/40', text: 'text-blue-600 dark:text-blue-400' },
    low: { label: 'بسيط / تجميلي', bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-600 dark:text-emerald-400' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-primary to-slate-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-inner">
              <Camera className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">فحص وتشخيص الأعطال بالذكاء الاصطناعي (AI Vision)</h3>
              <p className="text-[11px] text-slate-300">التقط صورة لعطل المطبخ أو الأجهزة، والذكاء الاصطناعي يحدد القطع والتكلفة</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Image Upload Area */}
          <div className="space-y-2">
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
                  انقر هنا لاختيار صورة أو التقاطها عبر الكاميرا
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  يدعم صور أعطال السباكة، تفصيل المطابخ، الأجهزة، والأدوات الصحية (JPEG, PNG)
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-56 bg-slate-950 flex items-center justify-center">
                <img src={imagePreview} alt="العطل المراد فحصه" className="max-h-56 w-auto object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setDiagnosis(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-900/80 text-white hover:bg-rose-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Notes Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              وصف العطل أو شكوى العميل (اختياري):
            </label>
            <input
              type="text"
              value={customerNotes}
              onChange={e => setCustomerNotes(e.target.value)}
              placeholder="مثال: تسريب مياه تحت حوض المطبخ أو صوت طقطقة في مفصلات الخزانة..."
              className="w-full py-2 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleDiagnose}
            disabled={!imagePreview || loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري تحليل الصورة هندسياً وتشخيص المشكلة...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>تشخيص العطل وتحديد قطع الغيار والتكلفة ✨</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Diagnosis Result Card */}
          {diagnosis && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    التشخيص: {diagnosis.detectedIssue}
                  </span>
                </div>
                {severityBadges[diagnosis.severity] && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${severityBadges[diagnosis.severity].bg} ${severityBadges[diagnosis.severity].text}`}>
                    {severityBadges[diagnosis.severity].label}
                  </span>
                )}
              </div>

              {/* Actions & Steps */}
              {diagnosis.recommendedActions && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 block">خطوات الإصلاح المقترحة:</span>
                  <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                    {diagnosis.recommendedActions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Parts */}
              {diagnosis.suggestedParts && diagnosis.suggestedParts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 block">قطع الغيار المطلوبة:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {diagnosis.suggestedParts.map((p, i) => (
                      <div key={i} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{p.name}</div>
                          {p.inStockMatch && <div className="text-[10px] text-emerald-600 dark:text-emerald-400">متطابق بالمخزون: {p.inStockMatch}</div>}
                        </div>
                        <span className="font-mono font-bold text-amber-500">{Number(p.estimatedPrice).toFixed(3)} د.ب</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost & Labor Estimate */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>الوقت المقدر: {diagnosis.estimatedLaborHours} ساعات عمل</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>إجمالي التكلفة التقديرية:</span>
                  <span className="font-mono text-base font-black text-amber-500">
                    {Number(diagnosis.estimatedTotalBHD).toFixed(3)} د.ب
                  </span>
                </div>
              </div>

              {onApplyDiagnosis && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyDiagnosis(diagnosis);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:opacity-90 transition mt-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>تحويل مباشرة لطلب صيانة رسمي</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
