import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { KitchenContract, ContractMilestone, KitchenContractStatus } from '../types';
import { AddEditContractModal } from '../components/contracts/AddEditContractModal';
import { MilestonePaymentModal } from '../components/contracts/MilestonePaymentModal';
import { ContractPrintModal } from '../components/contracts/ContractPrintModal';
import { 
  Layers, 
  Plus, 
  Search, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Printer, 
  MessageCircle, 
  Edit, 
  Trash2, 
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  User,
  Phone
} from 'lucide-react';

export const KitchenContractsScreen: React.FC = () => {
  const { contracts, deleteContract } = useAppContext();
  const { language, formatCurrency } = useTranslation();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | KitchenContractStatus>('All');
  const [selectedContractForEdit, setSelectedContractForEdit] = useState<KitchenContract | null>(null);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [selectedContractForPrint, setSelectedContractForPrint] = useState<KitchenContract | null>(null);
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    contract: KitchenContract | null;
    milestone: ContractMilestone | null;
  }>({
    isOpen: false,
    contract: null,
    milestone: null
  });

  // Calculate KPIs
  const kpis = useMemo(() => {
    let totalContracts = contracts.length;
    let activeContracts = 0;
    let totalValue = 0;
    let totalCollected = 0;
    let totalRemaining = 0;

    for (const c of contracts) {
      if (c.status !== 'Cancelled') {
        totalValue += Number(c.totalAmount) || 0;
        totalCollected += Number(c.paidAmount) || 0;
        totalRemaining += Number(c.remainingAmount) || 0;
        if (c.status === 'Active' || c.status === 'Manufacturing' || c.status === 'ReadyForInstallation') {
          activeContracts++;
        }
      }
    }

    return {
      totalContracts,
      activeContracts,
      totalValue,
      totalCollected,
      totalRemaining
    };
  }, [contracts]);

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        c.contractNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerPhone.includes(q) ||
        c.kitchenDesign.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [contracts, statusFilter, searchQuery]);

  const handleDelete = async (id: string, contractNumber: string) => {
    if (window.confirm(isAr ? `هل أنت متأكد من حذف العقد رقم ${contractNumber}؟` : `Are you sure you want to delete contract ${contractNumber}?`)) {
      try {
        await deleteContract(id);
      } catch (err: any) {
        alert(err.message || 'فشل حذف العقد');
      }
    }
  };

  const handleSendMilestoneReminderWhatsApp = (contract: KitchenContract, milestone: ContractMilestone) => {
    const phone = contract.customerPhone.replace(/[^0-9]/g, '');
    const text = isAr
      ? `السلام عليكم عزيزي العميل ${contract.customerName} ✨\nنود تذكيركم بموعد استحقاق الدفعة التالية لمطبخكم عقد رقم (${contract.contractNumber}):\n\n📌 الدفعة: ${milestone.title}\n💰 المبلغ المستحق: ${formatCurrency(milestone.amount)}\n📅 موعد الاستحقاق: ${milestone.dueDate || 'قريباً'}\n\nيمكنكم السداد عبر بنفت بي (BenefitPay) أو في المعرض.\nمودرن هاوس تشكركم ويسعدنا خدمتكم دائماً.`
      : `Hello ${contract.customerName} ✨\nFriendly reminder regarding your kitchen contract (${contract.contractNumber}):\n\nMilestone: ${milestone.title}\nDue Amount: ${formatCurrency(milestone.amount)}\nDue Date: ${milestone.dueDate || 'Soon'}\n\nThank you for choosing Modern House.`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getStatusBadge = (status: KitchenContractStatus) => {
    switch (status) {
      case 'Active':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">{isAr ? 'قيد التنفيذ' : 'Active'}</span>;
      case 'Manufacturing':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{isAr ? 'قيد التصنيع بالورشة' : 'Manufacturing'}</span>;
      case 'ReadyForInstallation':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">{isAr ? 'جاهز للتركيب' : 'Ready for Installation'}</span>;
      case 'Completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{isAr ? 'مكتمل ومسلّم' : 'Completed'}</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">{isAr ? 'ملغي' : 'Cancelled'}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary dark:text-dark-text-primary flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Layers className="w-6 h-6" />
            </span>
            <span>{isAr ? 'عقود ودفعات تفصيل المطابخ' : 'Kitchen Contracts & Milestone Installments'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {isAr 
              ? 'إدارة عقود المطابخ، مراحل التنفيذ، وجدولة الدفعات مع إشعارات واتساب تلقائية' 
              : 'Manage kitchen installation contracts, milestone payments, and WhatsApp payment notifications'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedContractForEdit(null);
            setIsAddEditOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary/25 transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? '+ عقد مطبخ جديد' : '+ New Kitchen Contract'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">{isAr ? 'إجمالي العقود' : 'Total Contracts'}</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-text-primary dark:text-dark-text-primary">
            {kpis.totalContracts}
          </div>
          <span className="text-[11px] text-text-secondary block mt-0.5">
            {isAr ? `${kpis.activeContracts} قيد التنفيذ والتصنيع` : `${kpis.activeContracts} in active stages`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">{isAr ? 'القيمة الإجمالية للعقود' : 'Total Contract Value'}</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {formatCurrency(kpis.totalValue)}
          </div>
          <span className="text-[11px] text-text-secondary block mt-0.5">
            {isAr ? 'قيمة المطابخ المتعاقد عليها' : 'Contracted kitchen value'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">{isAr ? 'المبالغ المحصلة' : 'Collected Amount'}</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(kpis.totalCollected)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
            {kpis.totalValue > 0 ? `${((kpis.totalCollected / kpis.totalValue) * 100).toFixed(1)}% تم تحصيلها` : '0%'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">{isAr ? 'المتبقي للاستحقاق' : 'Remaining Balance'}</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {formatCurrency(kpis.totalRemaining)}
          </div>
          <span className="text-[11px] text-text-secondary block mt-0.5">
            {isAr ? 'أقساط ودفعات قادمة' : 'Pending installments'}
          </span>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-secondary absolute right-3 top-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث برقم العقد، اسم العميل، الهاتف، أو تصميم المطبخ…' : 'Search by contract #, customer, phone, or design...'}
            className="w-full pl-3 pr-9 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 py-2 rounded-xl border border-border bg-background text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'All', label: isAr ? 'الكل' : 'All' },
            { id: 'Active', label: isAr ? 'ساري' : 'Active' },
            { id: 'Manufacturing', label: isAr ? 'قيد التصنيع' : 'Manufacturing' },
            { id: 'ReadyForInstallation', label: isAr ? 'جاهز للتركيب' : 'Ready' },
            { id: 'Completed', label: isAr ? 'مكتمل' : 'Completed' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-text-primary dark:text-dark-text-primary">
            {isAr ? 'لا توجد عقود مطابخ مسجلة حالياً' : 'No kitchen contracts found'}
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {isAr 
              ? 'اضغط على زر "+ عقد مطبخ جديد" بالأعلى لتوثيق عقد وتفصيل مطبخ لعميل مع جدولة دفعاته'
              : 'Click "+ New Kitchen Contract" above to record a new customer kitchen installation'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedContractForEdit(null);
              setIsAddEditOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition"
          >
            {isAr ? '+ إضافة أول عقد مطبخ' : '+ Add First Contract'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredContracts.map(contract => {
            const paidPct = contract.totalAmount > 0 
              ? Math.min(100, Math.round(((contract.paidAmount || 0) / contract.totalAmount) * 100))
              : 0;

            const nextPendingMilestone = contract.milestones?.find(m => m.status !== 'Paid');

            return (
              <div 
                key={contract.id}
                className="p-5 rounded-2xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs hover:border-primary/40 transition space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-slate-800 text-xs font-mono font-bold">
                      {contract.contractNumber}
                    </span>
                    {getStatusBadge(contract.status)}
                    <span className="text-sm font-bold text-text-primary dark:text-dark-text-primary">
                      {contract.customerName}
                    </span>
                    <a
                      href={`tel:${contract.customerPhone}`}
                      className="text-xs text-text-secondary hover:text-primary font-mono flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{contract.customerPhone}</span>
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedContractForPrint(contract)}
                      title={isAr ? 'معاينة وطباعة العقد' : 'Print Contract'}
                      className="p-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContractForEdit(contract);
                        setIsAddEditOpen(true);
                      }}
                      title={isAr ? 'تعديل بيانات العقد' : 'Edit Contract'}
                      className="p-2 rounded-xl border border-border text-text-secondary hover:text-primary hover:bg-primary/5 transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(contract.id, contract.contractNumber)}
                      title={isAr ? 'حذف العقد' : 'Delete Contract'}
                      className="p-2 rounded-xl border border-border text-text-secondary hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                  <div>
                    <span className="text-text-secondary block font-semibold">{isAr ? 'طراز المطبخ:' : 'Kitchen Design:'}</span>
                    <span className="font-bold text-text-primary dark:text-dark-text-primary">{contract.kitchenDesign}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block font-semibold">{isAr ? 'المقاسات:' : 'Dimensions:'}</span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{contract.dimensions || 'حسب المخطط'}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block font-semibold">{isAr ? 'الخشب والرخام:' : 'Materials:'}</span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">
                      {[contract.woodType, contract.countertopType].filter(Boolean).join(' | ') || 'معتمد بالعقد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary block font-semibold">{isAr ? 'التسليم المتوقع:' : 'Delivery Date:'}</span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-primary" />
                      <span>{contract.expectedDeliveryDate ? new Date(contract.expectedDeliveryDate).toLocaleDateString('ar-BH') : '-'}</span>
                    </span>
                  </div>
                </div>

                {/* Financial Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-text-primary dark:text-dark-text-primary">
                        {isAr ? 'إجمالي العقد:' : 'Total:'} <span className="font-mono text-primary">{formatCurrency(contract.totalAmount)}</span>
                      </span>
                      <span className="text-emerald-600 font-bold">
                        {isAr ? 'المدفوع:' : 'Paid:'} <span className="font-mono">{formatCurrency(contract.paidAmount)}</span>
                      </span>
                      <span className="text-amber-600 font-bold">
                        {isAr ? 'المتبقي:' : 'Pending:'} <span className="font-mono">{formatCurrency(contract.remainingAmount)}</span>
                      </span>
                    </div>
                    <span className="font-bold font-mono text-text-secondary">{paidPct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        paidPct === 100 ? 'bg-emerald-500' : 'bg-primary'
                      }`}
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                </div>

                {/* Milestones Horizontal Badges */}
                <div className="pt-2 border-t border-border/60">
                  <span className="text-[11px] font-bold text-text-secondary mb-2 block">
                    {isAr ? 'جدول الدفعات والمراحل المرحلية:' : 'Milestones Schedule:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {contract.milestones?.map((ms, idx) => (
                      <div 
                        key={ms.id} 
                        className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between gap-1.5 ${
                          ms.status === 'Paid'
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                            : 'bg-background border-border text-text-primary'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold truncate text-[11px]">{idx + 1}. {ms.title}</span>
                          {ms.status === 'Paid' ? (
                            <span className="p-0.5 rounded-full bg-emerald-500 text-white">
                              <CheckCircle2 className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40">
                              {ms.percentage}%
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between font-mono font-bold">
                          <span>{formatCurrency(ms.amount)}</span>
                          <span className="text-[10px] font-normal text-text-secondary">
                            {ms.dueDate ? ms.dueDate.slice(5) : '-'}
                          </span>
                        </div>

                        {ms.status !== 'Paid' && (
                          <div className="pt-1 border-t border-border/50 flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => setPaymentModalState({
                                isOpen: true,
                                contract,
                                milestone: ms
                              })}
                              className="w-full py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-xs"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>{isAr ? 'تسديد الدفعة' : 'Pay'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendMilestoneReminderWhatsApp(contract, ms)}
                              title={isAr ? 'تذكير العميل عبر واتساب' : 'WhatsApp Reminder'}
                              className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Contract Modal */}
      {isAddEditOpen && (
        <AddEditContractModal
          isOpen={isAddEditOpen}
          onClose={() => {
            setIsAddEditOpen(false);
            setSelectedContractForEdit(null);
          }}
          contract={selectedContractForEdit}
        />
      )}

      {/* Milestone Payment Modal */}
      {paymentModalState.isOpen && paymentModalState.contract && paymentModalState.milestone && (
        <MilestonePaymentModal
          isOpen={paymentModalState.isOpen}
          onClose={() => setPaymentModalState({ isOpen: false, contract: null, milestone: null })}
          contract={paymentModalState.contract}
          milestone={paymentModalState.milestone}
        />
      )}

      {/* Contract Print Modal */}
      {selectedContractForPrint && (
        <ContractPrintModal
          isOpen={Boolean(selectedContractForPrint)}
          onClose={() => setSelectedContractForPrint(null)}
          contract={selectedContractForPrint}
        />
      )}
    </div>
  );
};

export default KitchenContractsScreen;
