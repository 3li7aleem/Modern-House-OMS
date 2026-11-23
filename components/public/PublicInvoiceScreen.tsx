import React, { useEffect, useState } from 'react';
import { Printer, CheckCircle2, ShieldCheck, ArrowRight, Share2, Phone, Calendar, User, CreditCard } from 'lucide-react';

const FIREBASE_REST_BASE = 'https://firestore.googleapis.com/v1/projects/gen-lang-client-0614424142/databases/ai-studio-f833b07f-9a07-4ddd-a63f-6b1a71f36c61/documents';
const FIREBASE_API_KEY = 'AIzaSyABamXstcHvlPePlo0Agf5FFBY05Dx8FE8';

function parseFirestoreDoc(fields: any): any {
  if (!fields) return null;
  const parseVal = (v: any): any => {
    if (!v) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('doubleValue' in v) return Number(v.doubleValue);
    if ('integerValue' in v) return Number(v.integerValue);
    if ('booleanValue' in v) return Boolean(v.booleanValue);
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(parseVal);
    if ('mapValue' in v) {
      const res: any = {};
      for (const [k, val] of Object.entries(v.mapValue.fields || {})) {
        res[k] = parseVal(val);
      }
      return res;
    }
    return null;
  };
  const obj: any = {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = parseVal(v);
  }
  return obj;
}

export const PublicInvoiceScreen: React.FC = () => {
  const [invoiceHtml, setInvoiceHtml] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  let orderId = '';
  let hubUrl = '';
  let inlineData = '';

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('invoice') || params.get('id') || params.get('order');
    hubUrl = params.get('hub') || '';
    inlineData = params.get('d') || '';

    if (q) {
      orderId = q.trim();
    } else {
      const match = window.location.pathname.match(/\/invoice\/([^/?#]+)/) || window.location.hash.match(/invoice\/([^/?#]+)/);
      if (match) orderId = decodeURIComponent(match[1].trim());
    }
  }

  useEffect(() => {
    // 1. If inline compressed data is provided, decode immediately
    if (inlineData) {
      try {
        const decodedStr = decodeURIComponent(escape(atob(inlineData)));
        const parsed = JSON.parse(decodedStr);
        if (parsed && (parsed.orderNumber || parsed.total)) {
          setOrderData(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse inline invoice data:', e);
      }
    }

    if (!orderId) {
      setError('رقم الفاتورة غير محدد.');
      setLoading(false);
      return;
    }

    const tryFetchInvoice = async () => {
      // 2. Try Firestore lookup directly via REST API (synchronized with Desktop OMS)
      try {
        // Direct doc lookup by ID
        const directUrl = `${FIREBASE_REST_BASE}/orders/${encodeURIComponent(orderId)}?key=${FIREBASE_API_KEY}`;
        const directRes = await fetch(directUrl);
        if (directRes.ok) {
          const json = await directRes.json();
          if (json && json.fields) {
            const parsedOrder = parseFirestoreDoc(json.fields);
            setOrderData({ id: orderId, ...parsedOrder });
            setLoading(false);
            return;
          }
        }

        // Query by orderNumber field
        const queryUrl = `https://firestore.googleapis.com/v1/projects/gen-lang-client-0614424142/databases/ai-studio-f833b07f-9a07-4ddd-a63f-6b1a71f36c61/documents:runQuery?key=${FIREBASE_API_KEY}`;
        const queryRes = await fetch(queryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'orders' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'orderNumber' },
                  op: 'EQUAL',
                  value: { stringValue: orderId }
                }
              },
              limit: 1
            }
          })
        });

        if (queryRes.ok) {
          const results = await queryRes.json();
          if (Array.isArray(results) && results.length > 0 && results[0].document?.fields) {
            const parsedOrder = parseFirestoreDoc(results[0].document.fields);
            setOrderData({ id: results[0].document.name?.split('/').pop(), ...parsedOrder });
            setLoading(false);
            return;
          }
        }
      } catch (fireErr) {
        console.warn('Firestore invoice lookup error:', fireErr);
      }

      // 3. Try candidate endpoints (hub or local desktop server)
      const candidateBases = [
        hubUrl,
        'http://localhost:3050',
        'http://localhost:3051'
      ].filter(Boolean);

      for (const base of candidateBases) {
        try {
          const res = await fetch(`${base.replace(/\/+$/, '')}/invoice/${encodeURIComponent(orderId)}`);
          if (res.ok) {
            const html = await res.text();
            // Ensure this is not the Vite SPA index.html
            if (html && html.includes('فاتورة مبيعات') && !html.includes('<div id="root"></div>')) {
              setInvoiceHtml(html);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          // ignore candidate error
        }
      }

      setError(`تعذر العثور على الفاتورة رقم "${orderId}". يرجى التأكد من الرقم أو مراجعة إدارة المعرض.`);
      setLoading(false);
    };

    tryFetchInvoice();
  }, [orderId, hubUrl, inlineData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-bold text-sm">جاري جلب وتوثيق بيانات الفاتورة الرقمية...</p>
      </div>
    );
  }

  if (error || (!invoiceHtml && !orderData)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl shadow-inner">
            📄
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">مودرن هاوس للتجارة</h2>
          <p className="text-slate-600 text-sm mb-6">{error || 'لم يتم العثور على الفاتورة المطلوبة.'}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow"
            >
              <span>الانتقال للموقع الرئيسي</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </a>
            <a
              href="tel:35965477"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition shadow"
            >
              <Phone className="w-4 h-4" />
              <span>الاتصال بالمعرض</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // If server-rendered HTML was loaded, display it
  if (invoiceHtml) {
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
  }

  // Otherwise, render structured order data directly
  const order = orderData;
  const items = order.items || [];
  const orderDate = order.date ? new Date(order.date) : new Date();
  const formattedDate = orderDate.toLocaleDateString('ar-BH', { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = orderDate.toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' });
  const subtotal = Number(order.subtotal || order.total || 0).toFixed(3);
  const discount = Number(order.discount || 0).toFixed(3);
  const total = Number(order.total || 0).toFixed(3);
  const vatAmount = Number(order.vatAmount || (order.isVatEnabled !== false ? (Number(order.total || 0) * 0.1 / 1.1) : 0)).toFixed(3);

  const handleWhatsAppShare = () => {
    const text = `فاتورة مبيعات رقمية موثقة من مودرن هاوس للتجارة رقم ${order.orderNumber || order.id} بمبلغ ${total} د.ب.\nرابط الفاتورة المعتمدة:\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-2 sm:p-6 flex flex-col items-center font-sans selection:bg-amber-500 selection:text-slate-950" dir="rtl">
      {/* Top Action Bar */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-4 px-2 no-print">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            فاتورة مبيعات رقمية معتمدة — مودرن هاوس للتجارة
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">مشاركة واتساب</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* Main Invoice Card */}
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Brand Banner Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>فاتورة مبيعات ضريبية موثقة</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">مودرن هاوس للتجارة</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                أجهزة المطابخ البلت-إن • أحواض استانلس ستيل • إكسسوارات وخلاطات المطابخ
              </p>
            </div>
            <div className="text-left sm:text-right rtl:sm:text-left text-xs text-slate-300 border-t sm:border-t-0 sm:border-r rtl:sm:border-r-0 rtl:sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pr-4 rtl:sm:pr-0 rtl:sm:pl-4 space-y-1">
              <div>س.ت: <span className="font-mono font-bold text-white">147987-2</span></div>
              <div>الرقم الضريبي: <span className="font-mono font-bold text-amber-400">300012345600003</span></div>
              <div>هاتف المعرض: <span className="font-mono text-white">35965477 - 77905477</span></div>
              <div>مملكة البحرين</div>
            </div>
          </div>
        </div>

        {/* Invoice Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 text-[11px] block font-medium mb-1">رقم الفاتورة</span>
            <span className="font-mono font-black text-amber-600 text-sm">{order.orderNumber || order.id}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 text-[11px] block font-medium mb-1">تاريخ ووقت الإصدار</span>
            <span className="font-bold text-slate-800 text-[11px]">{formattedDate}</span>
            <span className="block font-mono text-[10px] text-slate-400">{formattedTime}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 text-[11px] block font-medium mb-1">العميل</span>
            <span className="font-bold text-slate-800 truncate block">{order.customerName || 'عميل نقدي'}</span>
            {order.customerPhone && <span className="font-mono text-[10px] text-slate-400">{order.customerPhone}</span>}
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 text-[11px] block font-medium mb-1">طريقة وسداد الدفع</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>مدفوعة ({order.paymentMethod === 'BenefitPay' ? 'بنفت بي' : order.paymentMethod === 'Card' ? 'بطاقة' : order.paymentMethod === 'Split' ? 'دفع مزدوج' : 'نقداً'})</span>
            </span>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">الصنف / البيان</th>
                <th className="py-3 px-4 text-center w-20">الكمية</th>
                <th className="py-3 px-4 text-left w-24">سعر الوحدة</th>
                <th className="py-3 px-4 text-left w-28">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item: any, idx: number) => {
                const itemPrice = Number(item.price || 0).toFixed(3);
                const itemTotal = (Number(item.price || 0) * (item.quantity || 1)).toFixed(3);
                return (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.name || item.productName || `صنف #${idx + 1}`}</div>
                      {item.sku && <div className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</div>}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{item.quantity || 1}</td>
                    <td className="py-3 px-4 text-left font-mono text-slate-700">{itemPrice} د.ب</td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-slate-900">{itemTotal} د.ب</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Financial Breakdown */}
        <div className="p-6 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-xs text-slate-500 max-w-sm">
            <p className="font-bold text-slate-700 mb-1">شروط الضمان وسياسة الاستبدال:</p>
            <p className="text-[11px] leading-relaxed">
              يسري الضمان لمدة سنتين ضد عيوب الصناعة مع إحضار هذه الفاتورة الرقمية الموثقة. الاستبدال والاسترجاع خلال 3 أيام بحالتها الأصلية.
            </p>
          </div>
          <div className="w-full sm:w-72 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>المجموع الفرعي:</span>
              <span className="font-mono font-bold text-slate-800">{subtotal} د.ب</span>
            </div>
            {Number(discount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>الخصم المطبق:</span>
                <span className="font-mono">-{discount} د.ب</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>ضريبة القيمة المضافة (10%):</span>
              <span className="font-mono font-semibold">{vatAmount} د.ب</span>
            </div>
            <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black">
              <span className="text-slate-900">المبلغ الإجمالي النهائي:</span>
              <span className="font-mono text-base text-amber-600">{total} د.ب</span>
            </div>
          </div>
        </div>

        {/* Official Verification Seal Footer */}
        <div className="p-4 bg-emerald-50 border-t border-emerald-200/80 text-emerald-900 flex items-center gap-3 text-xs">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold block">توثيق نظام Modern House OMS المعتمد:</span>
            <span className="text-[11px] text-emerald-800">
              تم إصدار وتوثيق هذه الفاتورة إلكترونياً وهي مسجلة في قاعدة البيانات الرسمية لمودرن هاوس للتجارة وتعتبر سنداً قانونياً معتمداً.
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: #fff !important; padding: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default PublicInvoiceScreen;
