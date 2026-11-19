import React, { useState, useEffect } from 'react';
import { KitchenContract, ContractMilestone, KitchenContractStatus } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { X, Plus, Trash2, Calendar, DollarSign, Shield, Layers, User, Phone, MapPin, CheckCircle2 } from 'lucide-react';

interface AddEditContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract?: KitchenContract | null;
}

const DEFAULT_MILESTONE_PRESETS = [
  {
    name: 'جدولة قياسية (4 مراحل: 40% - 30% - 20% - 10%)',
    milestones: [
      { title: 'الدفعة الأولى: اعتماد التصميم والبدء', percentage: 40 },
      { title: 'الدفعة الثانية: اعتماد المقاسات والتصنيع', percentage: 30 },
      { title: 'الدفعة الثالثة: توريد وتركيب الهياكل والرخام', percentage: 20 },
      { title: 'الدفعة الرابعة: التسليم النهائي والتشغيل', percentage: 10 },
    ]
  },
  {
    name: 'جدولة متقدمة (5 مراحل: 30% - 25% - 25% - 15% - 5%)',
    milestones: [
      { title: 'دفعة العربون وحجز الموعد', percentage: 30 },
      { title: 'دفعة رفع المقاسات واعتماد المخطط التنفيذي', percentage: 25 },
      { title: 'دفعة اكتمال التصنيع بالمصنع والجاهزية', percentage: 25 },
      { title: 'دفعة التوريد والتركيب الميداني', percentage: 15 },
      { title: 'دفعة الاستلام النهائي وشهادة الضمان', percentage: 5 },
    ]
  }
];

export const AddEditContractModal: React.FC<AddEditContractModalProps> = ({
  isOpen,
  onClose,
  contract
}) => {
  const { customers, addContract, updateContract } = useAppContext();
  const { language, formatCurrency } = useTranslation();
  const isAr = language === 'ar';

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [kitchenDesign, setKitchenDesign] = useState('مطبخ مودرن ألمنيوم وخشب نانو');
  const [dimensions, setDimensions] = useState('');
  const [woodType, setWoodType] = useState('صاج ألماني مقاوم للرطوبة');
  const [countertopType, setCountertopType] = useState('رخام صناعي كوارتز نانو');
  const [accessories, setAccessories] = useState('مفصلات بلوم نمساوي هيدروليك + إضاءة LED');
  const [appliancesIncluded, setAppliancesIncluded] = useState('');
  const [contractDate, setContractDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 35);
    return d.toISOString().slice(0, 10);
  });
  const [totalAmount, setTotalAmount] = useState<number>(2500);
  const [warrantyYears, setWarrantyYears] = useState<number>(10);
  const [technicianName, setTechnicianName] = useState('فريق التركيبات المتخصص - مودرن هاوس');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<KitchenContractStatus>('Active');
  const [milestones, setMilestones] = useState<ContractMilestone[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with contract when editing
  useEffect(() => {
    if (contract) {
      setCustomerId(contract.customerId || '');
      setCustomerName(contract.customerName || '');
      setCustomerPhone(contract.customerPhone || '');
      setCustomerAddress(contract.customerAddress || '');
      setKitchenDesign(contract.kitchenDesign || '');
      setDimensions(contract.dimensions || '');
      setWoodType(contract.woodType || '');
      setCountertopType(contract.countertopType || '');
      setAccessories(contract.accessories || '');
      setAppliancesIncluded(contract.appliancesIncluded || '');
      setContractDate(contract.contractDate ? contract.contractDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setExpectedDeliveryDate(contract.expectedDeliveryDate ? contract.expectedDeliveryDate.slice(0, 10) : '');
      setTotalAmount(contract.totalAmount || 0);
      setWarrantyYears(contract.warrantyYears || 10);
      setTechnicianName(contract.technicianName || '');
      setNotes(contract.notes || '');
      setStatus(contract.status || 'Active');
      setMilestones(contract.milestones || []);
    } else {
      // Default new contract
      setCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setKitchenDesign('مطبخ مودرن ألمنيوم وخشب نانو');
      setDimensions('4.20m x 3.10m');
      setWoodType('صاج ألماني مقاوم للرطوبة والحرارة');
      setCountertopType('رخام صناعي كوارتز نانو');
      setAccessories('مفصلات بلوم نمساوي هيدروليك + إضاءة LED مخفية');
      setAppliancesIncluded('شفاط 90 سم + مسطح غاز 5 عيون + حوض جرانيت');
      setContractDate(new Date().toISOString().slice(0, 10));
      const exp = new Date();
      exp.setDate(exp.getDate() + 35);
      setExpectedDeliveryDate(exp.toISOString().slice(0, 10));
      setTotalAmount(2500);
      setWarrantyYears(10);
      setTechnicianName('فريق التركيبات المعتمد - مودرن هاوس');
      setNotes('شامل التوصيل والتركيب وضمان 10 سنوات على الهياكل ومفصلات بلوم');
      setStatus('Active');
      applyPreset(0, 2500);
    }
  }, [contract]);

  const applyPreset = (presetIndex: number, currentTotal: number) => {
    const preset = DEFAULT_MILESTONE_PRESETS[presetIndex];
    if (!preset) return;
    const baseDate = new Date();
    const newMilestones: ContractMilestone[] = preset.milestones.map((p, idx) => {
      const due = new Date(baseDate);
      due.setDate(due.getDate() + (idx * 10));
      return {
        id: `ms_${Date.now()}_${idx}`,
        title: p.title,
        percentage: p.percentage,
        amount: Number(((currentTotal * p.percentage) / 100).toFixed(3)),
        dueDate: due.toISOString().slice(0, 10),
        status: idx === 0 ? 'Pending' : 'Pending',
        notes: ''
      };
    });
    setMilestones(newMilestones);
  };

  const handleTotalChange = (newTotal: number) => {
    setTotalAmount(newTotal);
    setMilestones(prev =>
      prev.map(m => ({
        ...m,
        amount: Number(((newTotal * m.percentage) / 100).toFixed(3))
      }))
    );
  };

  const handleMilestoneChange = (id: string, field: keyof ContractMilestone, value: any) => {
    setMilestones(prev =>
      prev.map(m => {
        if (m.id !== id) return m;
        const updated = { ...m, [field]: value };
        if (field === 'percentage') {
          updated.amount = Number(((totalAmount * Number(value)) / 100).toFixed(3));
        } else if (field === 'amount') {
          updated.percentage = totalAmount > 0 ? Number(((Number(value) / totalAmount) * 100).toFixed(1)) : 0;
        }
        return updated;
      })
    );
  };

  const addCustomMilestone = () => {
    const remainingPercentage = Math.max(0, 100 - milestones.reduce((sum, m) => sum + (m.percentage || 0), 0));
    const newM: ContractMilestone = {
      id: `ms_${Date.now()}_${milestones.length}`,
      title: `دفعة مرحلية إضافية رقم ${milestones.length + 1}`,
      percentage: remainingPercentage,
      amount: Number(((totalAmount * remainingPercentage) / 100).toFixed(3)),
      dueDate: expectedDeliveryDate,
      status: 'Pending'
    };
    setMilestones(prev => [...prev, newM]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCustomerId(selectedId);
    const cust = customers.find(c => c.id === selectedId);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone || '');
      setCustomerAddress(cust.address || cust.region || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setError(isAr ? 'يرجى إدخال اسم العميل ورقم هاتفه.' : 'Customer name and phone are required.');
      return;
    }

    if (totalAmount <= 0) {
      setError(isAr ? 'يرجى إدخال إجمالي قيمة العقد بشكل صحيح.' : 'Total contract amount must be greater than zero.');
      return;
    }

    if (milestones.length === 0) {
      setError(isAr ? 'يرجى إضافة دفعة واحدة على الأقل لجدولة العقد.' : 'At least one milestone is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const contractPayload = {
        customerId: customerId || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim() || undefined,
        kitchenDesign: kitchenDesign.trim(),
        dimensions: dimensions.trim() || undefined,
        woodType: woodType.trim() || undefined,
        countertopType: countertopType.trim() || undefined,
        accessories: accessories.trim() || undefined,
        appliancesIncluded: appliancesIncluded.trim() || undefined,
        contractDate,
        expectedDeliveryDate,
        totalAmount,
        status,
        milestones,
        warrantyYears,
        technicianName: technicianName.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (contract?.id) {
        await updateContract(contract.id, contractPayload);
      } else {
        await addContract(contractPayload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ عقد المطبخ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalPercentage = milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
  const totalMilestonesAmount = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-card dark:bg-dark-card border border-border dark:border-dark-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto animate-scale-up"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border dark:border-dark-border flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary dark:text-dark-text-primary">
                {contract ? (isAr ? `تعديل عقد المطبخ (${contract.contractNumber})` : `Edit Contract ${contract.contractNumber}`) : (isAr ? 'إنشاء عقد تفصيل مطبخ جديد' : 'New Kitchen Installation Contract')}
              </h3>
              <p className="text-xs text-text-secondary">
                {isAr ? 'توثيق مواصفات المطبخ وجدولة الدفعات المرحلية وتواريخ الاستحقاق' : 'Kitchen specifications, payment milestones and warranty details'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Section 1: Customer Info */}
          <div>
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{isAr ? 'بيانات العميل' : 'Customer Details'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'اختيار عميل مسجل' : 'Select Customer'}
                </label>
                <select
                  value={customerId}
                  onChange={handleCustomerSelect}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                >
                  <option value="">{isAr ? '-- عميل جديد / غير مسجل --' : '-- New / Unregistered Customer --'}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'اسم العميل *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="محمد أحمد الجابر"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'رقم الهاتف (واتساب) *' : 'Phone Number (WhatsApp) *'}
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="97339123456"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'عنوان الموقع ومكان التركيب' : 'Installation Site Address'}
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="الرفاع الغربي - فيلا 123 طريق 45 مجمع 987"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kitchen Specifications */}
          <div className="pt-2 border-t border-border">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>{isAr ? 'مواصفات وتفاصيل تفصيل المطبخ' : 'Kitchen Specifications'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'طراز وتصميم المطبخ *' : 'Kitchen Style / Design *'}
                </label>
                <input
                  type="text"
                  required
                  value={kitchenDesign}
                  onChange={e => setKitchenDesign(e.target.value)}
                  placeholder="مطبخ مودرن ألمنيوم L-Shape"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'المقاسات والأبعاد' : 'Dimensions'}
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={e => setDimensions(e.target.value)}
                  placeholder="4.50m × 3.20m + جزيرة 2m"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'نوع الخشب / الهيكل' : 'Wood / Cabinet Material'}
                </label>
                <input
                  type="text"
                  value={woodType}
                  onChange={e => setWoodType(e.target.value)}
                  placeholder="HPL ألماني / صاج حراري مقاوم"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'نوع الرخام / الكاونتر' : 'Countertop Type'}
                </label>
                <input
                  type="text"
                  value={countertopType}
                  onChange={e => setCountertopType(e.target.value)}
                  placeholder="رخام صناعي كوارتز نانو تركي"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'المفصلات والإكسسوارات' : 'Hardware & Accessories'}
                </label>
                <input
                  type="text"
                  value={accessories}
                  onChange={e => setAccessories(e.target.value)}
                  placeholder="مفصلات بلوم نمساوي هيدروليك + إضاءة LED"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'الأجهزة المتضمنة' : 'Appliances Included'}
                </label>
                <input
                  type="text"
                  value={appliancesIncluded}
                  onChange={e => setAppliancesIncluded(e.target.value)}
                  placeholder="شفاط 90سم + فرن بلت إن + مسطح غاز"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Value, Dates, Warranty */}
          <div className="pt-2 border-t border-border">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>{isAr ? 'القيمة المالية وتواريخ العقد' : 'Financial Value & Dates'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">
                  {isAr ? 'إجمالي قيمة العقد (د.ب) *' : 'Total Contract (BHD) *'}
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="1"
                  required
                  value={totalAmount}
                  onChange={e => handleTotalChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-primary bg-primary/5 text-sm font-bold text-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'تاريخ توقيع العقد' : 'Contract Date'}
                </label>
                <input
                  type="date"
                  value={contractDate}
                  onChange={e => setContractDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'التاريخ المتوقع للتسليم' : 'Expected Delivery'}
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={e => setExpectedDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? 'مدة الضمان (سنوات)' : 'Warranty (Years)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={warrantyYears}
                  onChange={e => setWarrantyYears(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Milestone Installments Schedule */}
          <div className="pt-2 border-t border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{isAr ? 'جدولة دفعات المطبخ المرحلية' : 'Milestone Installment Schedule'}</span>
                </h4>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {isAr 
                    ? `إجمالي النسب: ${totalPercentage}% | إجمالي مبالغ الدفعات: ${formatCurrency(totalMilestonesAmount)}` 
                    : `Total: ${totalPercentage}% | Sum: ${formatCurrency(totalMilestonesAmount)}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset(0, totalAmount)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                >
                  {isAr ? 'قالب 4 مراحل' : '4-Stage Preset'}
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(1, totalAmount)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                >
                  {isAr ? 'قالب 5 مراحل' : '5-Stage Preset'}
                </button>
                <button
                  type="button"
                  onClick={addCustomMilestone}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة دفعة' : 'Add Milestone'}</span>
                </button>
              </div>
            </div>

            {/* Milestones List */}
            <div className="space-y-2.5">
              {milestones.map((ms, index) => (
                <div 
                  key={ms.id} 
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-3 transition ${
                    ms.status === 'Paid' 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
                      : 'bg-card dark:bg-dark-card border-border dark:border-dark-border'
                  }`}
                >
                  <div className="w-7 h-7 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-text-secondary">
                    #{index + 1}
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={ms.title}
                      onChange={e => handleMilestoneChange(ms.id, 'title', e.target.value)}
                      placeholder="عنوان الدفعة"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          max="100"
                          value={ms.percentage}
                          onChange={e => handleMilestoneChange(ms.id, 'percentage', parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-border bg-background text-xs font-mono font-bold text-center"
                        />
                        <span className="absolute left-2 top-2 text-xs text-text-secondary">%</span>
                      </div>
                    </div>

                    <div className="w-28">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.001"
                          value={ms.amount}
                          onChange={e => handleMilestoneChange(ms.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-mono font-bold text-primary"
                        />
                      </div>
                    </div>

                    <div className="w-32">
                      <input
                        type="date"
                        value={ms.dueDate || ''}
                        onChange={e => handleMilestoneChange(ms.id, 'dueDate', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-[11px]"
                      />
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {ms.status === 'Paid' ? (
                        <span className="px-2 py-1 rounded-md bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isAr ? 'مدفوعة' : 'Paid'}</span>
                        </span>
                      ) : (
                        <select
                          value={ms.status}
                          onChange={e => handleMilestoneChange(ms.id, 'status', e.target.value)}
                          className="px-2 py-1 rounded-md border border-border bg-background text-[11px]"
                        >
                          <option value="Pending">{isAr ? 'قيد الانتظار' : 'Pending'}</option>
                          <option value="Paid">{isAr ? 'مدفوعة' : 'Paid'}</option>
                          <option value="Overdue">{isAr ? 'مستحقة' : 'Overdue'}</option>
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={() => removeMilestone(ms.id)}
                        className="p-1.5 text-text-secondary hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Notes & Additional Terms */}
          <div className="pt-2 border-t border-border">
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              {isAr ? 'شروط وملاحظات إضافية في العقد' : 'Additional Terms & Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="مثال: يلتزم الطرف الأول بتوفير نقاط الكهرباء والسباكة في الموقع قبل تاريخ التركيب بـ 3 أيام..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-lg shadow-primary/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جاري الحفظ…' : 'Saving...') : (contract ? (isAr ? 'تحديث العقد' : 'Update Contract') : (isAr ? 'اعتماد وحفظ العقد' : 'Save Kitchen Contract'))}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
