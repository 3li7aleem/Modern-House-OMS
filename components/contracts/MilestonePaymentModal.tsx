import React, { useState } from 'react';
import { KitchenContract, ContractMilestone } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { X, CheckCircle2, MessageCircle, DollarSign, Calendar, CreditCard } from 'lucide-react';

interface MilestonePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: KitchenContract;
  milestone: ContractMilestone;
}

export const MilestonePaymentModal: React.FC<MilestonePaymentModalProps> = ({
  isOpen,
  onClose,
  contract,
  milestone
}) => {
  const { recordMilestonePayment } = useAppContext();
  const { language, formatCurrency } = useTranslation();
  const isAr = language === 'ar';

  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'BenefitPay' | 'BankTransfer'>('BenefitPay');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const fullNotes = [reference.trim() ? `مرجع: ${reference.trim()}` : '', notes.trim()].filter(Boolean).join(' - ');
      await recordMilestonePayment(contract.id, milestone.id, paymentMethod, fullNotes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدفعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsAppReceipt = () => {
    const phone = contract.customerPhone.replace(/[^0-9]/g, '');
    const text = isAr 
      ? `تم استلام دفعة من مودرن هاوس للمطابخ ✨\n\nعزيزي العميل: ${contract.customerName}\nعقد رقم: ${contract.contractNumber}\nطراز المطبخ: ${contract.kitchenDesign}\n\nتم استلام: ${milestone.title}\nالمبلغ المستلم: ${formatCurrency(milestone.amount)}\nطريقة السداد: ${paymentMethod}\nالتاريخ: ${new Date().toLocaleDateString('ar-BH')}\n\nالمتبقي على العقد: ${formatCurrency(Math.max(0, contract.remainingAmount - milestone.amount))}\n\nنشكركم على ثقتكم بمودرن هاوس للمطابخ والتجارة.`
      : `Payment Receipt - Modern House Kitchens ✨\n\nDear ${contract.customerName},\nContract #: ${contract.contractNumber}\nReceived Milestone: ${milestone.title}\nAmount: ${formatCurrency(milestone.amount)}\nPayment Method: ${paymentMethod}\n\nRemaining Balance: ${formatCurrency(Math.max(0, contract.remainingAmount - milestone.amount))}\n\nThank you for choosing Modern House!`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-card dark:bg-dark-card border border-border dark:border-dark-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary dark:text-dark-text-primary">
                {isAr ? 'تسديد دفعة مرحلية للمطبخ' : 'Record Milestone Payment'}
              </h3>
              <p className="text-[11px] text-text-secondary">
                {contract.contractNumber} - {contract.customerName}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleRecord} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Milestone Details Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <span className="text-[11px] font-bold text-primary block">
              {milestone.title}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">{isAr ? 'المبلغ المستحق:' : 'Due Amount:'}</span>
              <span className="text-base font-extrabold text-emerald-600 font-mono">
                {formatCurrency(milestone.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>{isAr ? 'النسبة من العقد:' : 'Percentage:'}</span>
              <span className="font-mono font-bold">{milestone.percentage}%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              {isAr ? 'طريقة السداد' : 'Payment Method'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'BenefitPay', label: 'BenefitPay (بنفت)', icon: '📱' },
                { id: 'Card', label: 'بطاقة / مدى', icon: '💳' },
                { id: 'Cash', label: 'نقداً (كاش)', icon: '💵' },
                { id: 'BankTransfer', label: 'تحويل بنكي', icon: '🏦' },
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    paymentMethod === method.id
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border bg-background text-text-secondary hover:border-slate-400'
                  }`}
                >
                  <span>{method.icon}</span>
                  <span>{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              {isAr ? 'رقم المرجع / الإيصال البنكي' : 'Reference / Transaction ID'}
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="مثال: REF-987213"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              {isAr ? 'ملاحظات' : 'Notes'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="تم السداد عند معاينة المخطط في المعرض"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جاري التأكيد…' : 'Processing...') : (isAr ? 'تأكيد استلام الدفعة' : 'Confirm Payment')}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsAppReceipt}
              className="w-full py-2 rounded-xl border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isAr ? 'إرسال إيصال الدفعة عبر واتساب للعميل' : 'Send WhatsApp Receipt to Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
