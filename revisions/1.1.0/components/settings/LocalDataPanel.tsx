import React, { useState } from 'react';

export default function LocalDataPanel() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!window.omsDesktop) return null;
  const run = async (action: string) => {
    setBusy(true);
    setMessage('');
    try {
      const result = await window.omsDesktop!.call(action);
      if (action === 'backup' && result) setMessage(`تم حفظ النسخة: ${result}`);
    } catch (error) { setMessage(`تعذر إكمال العملية: ${(error as Error).message}`); }
    finally { setBusy(false); }
  };
  return <section dir="rtl" className="my-6 rounded-xl border border-border bg-card p-6 dark:bg-dark-card dark:border-dark-border">
    <h4 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">بيانات هذا الجهاز</h4>
    <p className="my-3 text-sm text-text-secondary">تُحفظ السجلات والصور المرفوعة والإعدادات محليًا. تُحفظ نسخة عند التشغيل، وكل 15 دقيقة بعد التعديلات، وعند الإغلاق المعتاد، مع الاحتفاظ بآخر 48 نسخة حديثة و14 نسخة يومية. احفظ نسخة خارج الجهاز لنقل بياناتك أو حمايتها من فقدان الجهاز.</p>
    <div className="flex flex-wrap gap-3">
      <button disabled={busy} onClick={() => run('backup')} className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50">حفظ نسخة احتياطية</button>
      <button disabled={busy} onClick={() => run('restore')} className="rounded-lg border border-border px-4 py-2 text-text-primary dark:text-dark-text-primary disabled:opacity-50">استعادة نسخة احتياطية</button>
      <button disabled={busy} onClick={() => run('dataFolder')} className="rounded-lg border border-border px-4 py-2 text-text-primary dark:text-dark-text-primary">فتح مجلد البيانات</button>
    </div>
    {message && <p role="status" className="mt-3 break-all text-sm text-text-primary dark:text-dark-text-primary">{message}</p>}
  </section>;
}
