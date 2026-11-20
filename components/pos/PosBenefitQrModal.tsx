import React, { useState, useEffect } from 'react';
import { X, Check, QrCode, Phone, Copy, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';

interface PosBenefitQrModalProps {
  amount: number;
  formatCurrency: (val: number) => string;
  isAr: boolean;
  onConfirm: (ref: string) => void;
  onClose: () => void;
}

export const PosBenefitQrModal: React.FC<PosBenefitQrModalProps> = ({
  amount,
  formatCurrency,
  isAr,
  onConfirm,
  onClose,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [refNumber, setRefNumber] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const benefitPhone = '35965477';

  useEffect(() => {
    const payload = `BENEFITPAY:TO=973${benefitPhone}:AMOUNT=${amount.toFixed(3)}:CUR=BHD:MODERN_HOUSE`;
    QRCode.toDataURL(payload, {
      width: 200,
      margin: 1,
      color: {
        dark: '#be123c', // Rose/Red for BenefitPay
        light: '#ffffff',
      },
    })
      .then(setQrUrl)
      .catch(() => {});
  }, [amount]);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(benefitPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNumber.trim()) {
      alert(isAr ? 'يرجى إدخال رقم العملية المرجعي لتأكيد الدفع.' : 'Please enter reference number.');
      return;
    }
    onConfirm(refNumber.trim());
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
              BP
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {isAr ? 'الدفع عبر بنفت بي (BenefitPay)' : 'BenefitPay QR Checkout'}
              </h3>
              <p className="text-[11px] text-slate-500">مودرن هاوس للتجارة • البحرين</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
            {qrUrl ? (
              <img src={qrUrl} alt="BenefitPay QR" className="w-44 h-44 object-contain" />
            ) : (
              <div className="w-44 h-44 bg-slate-200 animate-pulse rounded-lg" />
            )}
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block font-bold">المبلغ المطلوب سداده</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {formatCurrency(amount)}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 max-w-xs">
            {isAr
              ? 'امسح الرمز بكاميرا تطبيق بنفت بي، أو حوّل عبر Fawri+ إلى الرقم التالي:'
              : 'Scan with BenefitPay App or transfer via Fawri+ to phone number:'}
          </p>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
            <Phone className="w-3.5 h-3.5 text-rose-500" />
            <span dir="ltr">{benefitPhone}</span>
            <button
              type="button"
              onClick={handleCopyPhone}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition text-slate-400 hover:text-slate-600"
              title="نسخ الرقم"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Input Reference & Confirm */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {isAr ? 'رقم العملية المرجعي (Ref Number) *' : 'BenefitPay Reference No. *'}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={refNumber}
              onChange={e => setRefNumber(e.target.value)}
              placeholder="مثال: 012345678"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-black shadow-lg transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'تأكيد استلام المبلغ وإتمام الفاتورة' : 'Confirm Payment & Complete'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default PosBenefitQrModal;
