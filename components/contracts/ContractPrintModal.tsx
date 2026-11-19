import React from 'react';
import { KitchenContract } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { X, Printer, MessageCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ContractPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: KitchenContract;
}

export const ContractPrintModal: React.FC<ContractPrintModalProps> = ({
  isOpen,
  onClose,
  contract
}) => {
  const { language, formatCurrency } = useTranslation();
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const phone = contract.customerPhone.replace(/[^0-9]/g, '');
    const milestonesSummary = contract.milestones
      .map((m, i) => `${i + 1}. ${m.title}: ${formatCurrency(m.amount)} (${m.percentage}%) - [${m.status === 'Paid' ? 'مدفوعة ✅' : 'مستحقة ⏳'}]`)
      .join('\n');

    const text = isAr
      ? `عقد تفصيل وتركيب مطبخ - مودرن هاوس للمطابخ ✨\n\nعزيزي العميل: ${contract.customerName}\nرقم العقد: ${contract.contractNumber}\nطراز المطبخ: ${contract.kitchenDesign}\nالمقاسات: ${contract.dimensions || 'حسب المخطط'}\nالخشب/الهيكل: ${contract.woodType || 'HPL عالي الجودة'}\nالرخام: ${contract.countertopType || 'كوارتز نانو'}\nالأجهزة المتضمنة: ${contract.appliancesIncluded || 'حسب الاتفاق'}\n\nإجمالي العقد: ${formatCurrency(contract.totalAmount)}\nالمدفوع: ${formatCurrency(contract.paidAmount)}\nالمتبقي: ${formatCurrency(contract.remainingAmount)}\nمدة الضمان: ${contract.warrantyYears || 10} سنوات\nتاريخ التسليم المتوقع: ${contract.expectedDeliveryDate || '35 يوم من التوقيع'}\n\nجدولة الدفعات المرحلية:\n${milestonesSummary}\n\nمودرن هاوس تتمنى لكم تجربة مميزة.`
      : `Kitchen Installation Contract - Modern House ✨\n\nDear ${contract.customerName},\nContract #: ${contract.contractNumber}\nDesign: ${contract.kitchenDesign}\nTotal: ${formatCurrency(contract.totalAmount)}\nPaid: ${formatCurrency(contract.paidAmount)}\nRemaining: ${formatCurrency(contract.remainingAmount)}\nWarranty: ${contract.warrantyYears || 10} Years\nDelivery Date: ${contract.expectedDeliveryDate}\n\nMilestones:\n${milestonesSummary}`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-card dark:bg-dark-card border border-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto animate-scale-up"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Controls (Not printed) */}
        <div className="px-6 py-3.5 border-b border-border flex items-center justify-between bg-slate-100 dark:bg-slate-900 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">
              {isAr ? `معاينة وطباعة عقد المطبخ (${contract.contractNumber})` : `Contract Preview (${contract.contractNumber})`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isAr ? 'إرسال العقد للعميل واتساب' : 'Send via WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Contract Document */}
        <div id="printable-contract" className="p-8 sm:p-12 bg-white text-slate-900 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:m-0">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">MODERN HOUSE</h1>
              <h2 className="text-base font-bold text-primary mt-0.5">مودرن هاوس للمطابخ والتجارة</h2>
              <p className="text-xs text-slate-600 mt-1">
                سجل تجاري: 12345-6 | الرقم الضريبي: 200012345600003
              </p>
              <p className="text-xs text-slate-600">
                مملكة البحرين | هاتف: +973 1700 0000 | واتساب: +973 3900 0000
              </p>
            </div>

            <div className="text-left rtl:text-right">
              <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-md mb-2">
                عقد تفصيل وتوريد مطبخ معتمد
              </div>
              <p className="text-xs font-mono font-bold text-slate-900">
                رقم العقد: <span className="text-primary">{contract.contractNumber}</span>
              </p>
              <p className="text-xs text-slate-600">
                تاريخ العقد: {new Date(contract.contractDate).toLocaleDateString('ar-BH')}
              </p>
              <p className="text-xs text-slate-600">
                تاريخ التسليم المتوقع: {contract.expectedDeliveryDate ? new Date(contract.expectedDeliveryDate).toLocaleDateString('ar-BH') : '35 يوم'}
              </p>
            </div>
          </div>

          {/* Customer Details Box */}
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block font-semibold">اسم العميل (الطرف الثاني):</span>
              <span className="font-bold text-slate-900 text-sm">{contract.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold">رقم الهاتف / واتساب:</span>
              <span className="font-mono font-bold text-slate-900">{contract.customerPhone}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold">مكان وموقع التركيب:</span>
              <span className="font-medium text-slate-800">{contract.customerAddress || 'مملكة البحرين'}</span>
            </div>
          </div>

          {/* Kitchen Specifications Table */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 p-2 rounded-t-lg border-x border-t border-slate-200">
              أولاً: المواصفات الفنية المعتمدة للمطبخ
            </h3>
            <table className="w-full text-xs border border-slate-200">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-1/3 p-2.5 font-bold bg-slate-50 text-slate-700">طراز وتصميم المطبخ:</td>
                  <td className="p-2.5 font-semibold text-slate-900">{contract.kitchenDesign}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50 text-slate-700">المقاسات والأبعاد الإجمالية:</td>
                  <td className="p-2.5 text-slate-900">{contract.dimensions || 'حسب المخطط الفني المرفق'}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50 text-slate-700">خامات الهيكل والخزائن:</td>
                  <td className="p-2.5 text-slate-900">{contract.woodType || 'صاج حراري / HPL ألماني عالي المقاومة'}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50 text-slate-700">الكاونتر وسطح الرخام:</td>
                  <td className="p-2.5 text-slate-900">{contract.countertopType || 'رخام صناعي كوارتز نانو'}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50 text-slate-700">المفصلات والإكسسوارات:</td>
                  <td className="p-2.5 text-slate-900">{contract.accessories || 'مفصلات بلوم نمساوي هيدروليك + إضاءة LED'}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold bg-slate-50 text-slate-700">الأجهزة الكهربائية المتضمنة:</td>
                  <td className="p-2.5 text-slate-900">{contract.appliancesIncluded || 'حسب قائمة الأجهزة المرفقة بالعقد'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Milestone Payment Schedule Table */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 p-2 rounded-t-lg border-x border-t border-slate-200">
              ثانياً: جدول الدفعات المالية المرحلية
            </h3>
            <table className="w-full text-xs border border-slate-200 text-center">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <th className="p-2 text-right"># المرحلة / استحقاق الدفعة</th>
                  <th className="p-2">النسبة</th>
                  <th className="p-2">المبلغ (د.ب)</th>
                  <th className="p-2">تاريخ الاستحقاق</th>
                  <th className="p-2">حالة السداد</th>
                </tr>
              </thead>
              <tbody>
                {contract.milestones.map((ms, idx) => (
                  <tr key={ms.id} className="border-b border-slate-100">
                    <td className="p-2.5 font-semibold text-slate-900 text-right">
                      {idx + 1}. {ms.title}
                    </td>
                    <td className="p-2.5 font-mono font-bold">{ms.percentage}%</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">{formatCurrency(ms.amount)}</td>
                    <td className="p-2.5 text-slate-600">{ms.dueDate || '-'}</td>
                    <td className="p-2.5">
                      {ms.status === 'Paid' ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          مدفوعة ({ms.paidMethod || 'مسددة'})
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">
                          مستحقة عند المرحلة
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="mb-6 p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">إجمالي قيمة العقد</span>
              <span className="text-xl font-black font-mono">{formatCurrency(contract.totalAmount)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">إجمالي المسدد</span>
              <span className="text-xl font-black font-mono text-emerald-400">{formatCurrency(contract.paidAmount)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">المبلغ المتبقي</span>
              <span className="text-xl font-black font-mono text-amber-400">{formatCurrency(contract.remainingAmount)}</span>
            </div>
            <div className="border-r border-slate-700 pr-4">
              <span className="text-slate-400 block">مدة الضمان المعتمد</span>
              <span className="text-base font-bold text-white flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>{contract.warrantyYears || 10} سنوات شاملة</span>
              </span>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mb-8 text-[11px] text-slate-600 space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-xs mb-1">الشروط والأحكام العامة:</h4>
            <p>1. يلتزم الطرف الأول (مودرن هاوس) بتنفيذ المطبخ وفق المواصفات والمخطط المتفق عليه وبالمواعيد المحددة أعلاه.</p>
            <p>2. يلتزم الطرف الثاني (العميل) بسداد الدفعات المالية في مواعيد استحقاقها فور إنجاز كل مرحلة.</p>
            <p>3. يسري الضمان المعتمد من تاريخ التسليم النهائي واستلام شهادة الإنجاز.</p>
            {contract.notes && <p className="font-semibold text-slate-800 mt-1">ملاحظات خاصة: {contract.notes}</p>}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-6 border-t border-slate-300 text-xs text-center">
            <div>
              <p className="font-bold text-slate-900 mb-12">توقيع وختم الطرف الأول (مودرن هاوس)</p>
              <div className="border-t border-dashed border-slate-400 w-48 mx-auto pt-1 text-slate-500">
                إدارة المعرض والتركيبات
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-12">توقيع الطرف الثاني (العميل)</p>
              <div className="border-t border-dashed border-slate-400 w-48 mx-auto pt-1 text-slate-500">
                الاسم: {contract.customerName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
