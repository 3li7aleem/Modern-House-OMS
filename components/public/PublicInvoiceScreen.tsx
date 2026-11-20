import React, { useEffect, useState } from 'react';
import { Printer, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const PublicInvoiceScreen: React.FC = () => {
  const [invoiceHtml, setInvoiceHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pathParts = window.location.pathname.split('/invoice/');
  const orderId = pathParts[1] ? decodeURIComponent(pathParts[1].replace(/\/+$/, '')) : '';

  useEffect(() => {
    if (!orderId) {
      setError('رقم الفاتورة غير محدد.');
      setLoading(false);
      return;
    }

    const tunnelBase = 'https://washer-lines-shop-shark.trycloudflare.com';
    
    // Fetch directly from the active live store daemon via CORS
    fetch(`${tunnelBase}/invoice/${encodeURIComponent(orderId)}`)
      .then(async res => {
        if (!res.ok) {
          throw new Error(`الفاتورة رقم ${orderId} غير متوفرة أو لم يتم رفعها بعد.`);
        }
        return res.text();
      })
      .then(html => {
        setInvoiceHtml(html);
        setLoading(false);
      })
      .catch(err => {
        console.error('Invoice fetch error:', err);
        setError('تعذر الاتصال بخادم المعرض لجلب الفاتورة. يرجى التأكد من تشغيل البرنامج المكتبي.');
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-bold text-sm">جاري جلب بيانات الفاتورة الموثقة...</p>
      </div>
    );
  }

  if (error || !invoiceHtml) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
            📄
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">مودرن هاوس للتجارة</h2>
          <p className="text-slate-600 text-sm mb-6">{error || 'لم يتم العثور على الفاتورة المطلوبة.'}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow"
          >
            <span>الانتقال للموقع الرئيسي</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </a>
        </div>
      </div>
    );
  }

  // Render the server-rendered HTML invoice safely inside an iframe or directly
  return (
    <div className="min-h-screen bg-slate-100 p-2 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl flex justify-between items-center mb-4 px-2 no-print" dir="rtl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">فاتورة مبيعات رقمية معتمدة — مودرن هاوس للتجارة</span>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow hover:bg-slate-800 transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة الفاتورة</span>
        </button>
      </div>
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
        dangerouslySetInnerHTML={{ __html: invoiceHtml }}
      />
    </div>
  );
};
export default PublicInvoiceScreen;
