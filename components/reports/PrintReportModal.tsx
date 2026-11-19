import React, { useRef, useState } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAppContext } from '../../contexts/AppContext';
import { 
  Printer, 
  Download, 
  Share2, 
  X, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  Package, 
  Wallet, 
  Users 
} from 'lucide-react';
import Logo from '../layout/Logo';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type ReportType = 'sales' | 'inventory' | 'finance' | 'staff';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  timeframe: string;
  data: {
    title: string;
    periodLabel: string;
    summaryCards: { label: string; value: string; hint?: string }[];
    tableHeaders: string[];
    tableRows: (string | number)[][];
    totalsRow?: (string | number)[];
  };
}

const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  timeframe,
  data
}) => {
  const { t, language, formatCurrency, formatDate } = useTranslation();
  const { storeName } = useSettings();
  const { currentUser } = useAppContext();
  const isAr = language === 'ar';

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const now = new Date();
  const generationTimeStr = now.toLocaleDateString(isAr ? 'ar-BH' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Cross-platform print handler (Android, Electron, Browser)
  const handlePrint = async () => {
    // 1. Check if running inside Android APK with custom bridge
    const win = window as any;
    if (win.AndroidPrinter && typeof win.AndroidPrinter.printPage === 'function') {
      win.AndroidPrinter.printPage();
      return;
    }

    // 2. Check if running inside Electron Desktop with IPC call
    if (win.omsDesktop && typeof win.omsDesktop.call === 'function') {
      try {
        const res = await win.omsDesktop.call('print');
        if (res && res.ok) return;
      } catch (e) {
        console.warn('Native electron print failed, falling back to window.print:', e);
      }
    }

    // 3. Fallback to standard window.print
    window.print();
  };

  // Generate and download high-resolution PDF
  const handleDownloadPdf = async () => {
    const element = printableRef.current;
    if (!element) return;

    setIsGeneratingPdf(true);
    const win = window as any;
    const safeTitle = data.title.replace(/\s+/g, '_');

    // 1. If running in Electron Desktop, prefer native vector printToPDF
    if (win.omsDesktop && typeof win.omsDesktop.call === 'function') {
      try {
        const res = await win.omsDesktop.call('printToPDF', `Modern-House-${safeTitle}`);
        if (res && res.ok) {
          setIsGeneratingPdf(false);
          return;
        }
      } catch (e) {
        console.warn('Electron printToPDF fallback to canvas:', e);
      }
    }

    // 2. Browser & Web canvas-based PDF generation
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Modern-House-${safeTitle}-${now.toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert(isAr ? 'حدث خطأ أثناء إنشاء ملف PDF' : 'Error generating PDF report');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // CSV export handler
  const handleExportCsv = () => {
    const csvRows: string[] = [];
    csvRows.push(data.tableHeaders.map(h => `"${h}"`).join(','));
    data.tableRows.forEach(row => {
      csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    });
    if (data.totalsRow) {
      csvRows.push(data.totalsRow.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    }

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Modern-House-${data.title.replace(/\s+/g, '_')}-${now.toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      id="print-report-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div 
        id="print-report-modal-dialog"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'معاينة وطباعة التقرير الرسمي' : 'Official Report Print Preview'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {data.title} • {data.periodLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
              title={isAr ? 'تصدير إكسل / CSV' : 'Export CSV'}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white transition disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{isGeneratingPdf ? (isAr ? 'جاري التصدير...' : 'Exporting...') : 'PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة التقرير' : 'Print'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950/40 print:p-0 print:bg-white print:overflow-visible">
          <div 
            ref={printableRef}
            id="printable-report-document"
            className="bg-white text-slate-900 rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 max-w-3xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none"
          >
            {/* 1. Official Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-amber-500/40 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-md border border-amber-400/40">
                  MH
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {isAr ? 'مؤسسة البيت الحديث للتجارة' : 'Modern House for Trading'}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    {isAr ? 'المطابخ العصرية • الأجهزة المدمجة • سوق واقف' : 'Modern Kitchens • Built-in Appliances • Souq Waqif'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'هاتف: 35965477 (973+) • مملكة البحرين' : 'Tel: +973 35965477 • Kingdom of Bahrain'}
                  </p>
                </div>
              </div>

              <div className="text-start sm:text-end bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-[200px]">
                <span className="block text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  {isAr ? 'تقرير إداري رسمي' : 'Official Report'}
                </span>
                <span className="block text-sm font-black text-slate-900 mt-0.5">
                  {data.title}
                </span>
                <span className="block text-[11px] text-slate-500 mt-1">
                  {isAr ? 'الفترة:' : 'Period:'} {data.periodLabel}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  {isAr ? 'تاريخ الاستخراج:' : 'Generated:'} {generationTimeStr}
                </span>
              </div>
            </div>

            {/* 2. Executive Summary Cards */}
            {data.summaryCards && data.summaryCards.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                {data.summaryCards.map((card, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-start">
                    <span className="text-[11px] font-bold text-slate-500 block truncate">
                      {card.label}
                    </span>
                    <span className="text-lg font-black text-slate-900 block mt-1 font-mono">
                      {card.value}
                    </span>
                    {card.hint && (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {card.hint}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 3. Detailed Data Table */}
            <div className="my-6 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    {data.tableHeaders.map((head, hIdx) => (
                      <th 
                        key={hIdx} 
                        className={`p-3 font-bold ${hIdx === 0 ? 'text-start' : 'text-center'}`}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.tableRows.map((row, rIdx) => (
                    <tr 
                      key={rIdx} 
                      className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                    >
                      {row.map((cell, cIdx) => (
                        <td 
                          key={cIdx} 
                          className={`p-3 text-slate-800 ${cIdx === 0 ? 'text-start font-medium' : 'text-center font-mono'}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {data.tableRows.length === 0 && (
                    <tr>
                      <td colSpan={data.tableHeaders.length} className="p-8 text-center text-slate-400">
                        {isAr ? 'لا توجد بيانات مسجلة لهذه الفترة' : 'No records found for this period'}
                      </td>
                    </tr>
                  )}

                  {/* Totals Summary Row if provided */}
                  {data.totalsRow && (
                    <tr className="bg-amber-500/10 font-bold border-t-2 border-slate-300">
                      {data.totalsRow.map((tot, tIdx) => (
                        <td 
                          key={tIdx} 
                          className={`p-3 text-slate-900 font-black ${tIdx === 0 ? 'text-start' : 'text-center font-mono'}`}
                        >
                          {tot}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 4. Footer & Signature Block */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">
                  {isAr ? 'تم استخراج التقرير بواسطة:' : 'Report extracted by:'} {currentUser?.name || (isAr ? 'مدير النظام' : 'Admin')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Modern House OMS v1.1 • Automated Enterprise Report
                </p>
              </div>

              <div className="text-center w-48">
                <div className="border-b border-slate-300 pb-8 mb-1"></div>
                <span className="text-[11px] font-bold text-slate-600 block">
                  {isAr ? 'توقيع واعتماد الإدارة' : 'Management Authorization'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-report-document, #printable-report-document * {
            visibility: visible !important;
          }
          #printable-report-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 20px !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintReportModal;
