export default async function handler(req, res) {
  const targetBase = process.env.DESKTOP_API_URL || 'https://washer-lines-shop-shark.trycloudflare.com';
  
  // Extract invoice ID from query (?id=...) or path
  let id = req.query.id;
  if (Array.isArray(id)) id = id.join('/');
  if (!id) {
    const match = (req.url || '').match(/invoice[/?=]([^&?#]+)/);
    if (match) id = decodeURIComponent(match[1]);
  }
  id = String(id || '').replace(/\/+$/, '');

  if (!id) {
    return res.status(400).send(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>رقم الفاتورة غير محدد | مودرن هاوس</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>رقم الفاتورة غير محدد</h2></body></html>`);
  }

  const cleanBase = targetBase.replace(/\/+$/, '');
  const targetUrl = `${cleanBase}/invoice/${encodeURIComponent(id)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).send(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>فاتورة غير موجودة | مودرن هاوس للتجارة</title><style>body{font-family:sans-serif;text-align:center;padding:40px 16px;background:#f8fafc;color:#0f172a;}.card{max-width:480px;margin:40px auto;background:#fff;padding:32px;border-radius:20px;box-shadow:0 10px 25px rgba(0,0,0,0.06);border:1px solid #e2e8f0;}</style></head><body><div class="card"><h2 style="color:#0f172a;margin-bottom:8px;">مودرن هاوس للتجارة</h2><p style="color:#64748b;font-size:14px;margin-bottom:24px;">لم يتم العثور على الفاتورة رقم <strong style="color:#dfb175;">${id}</strong>.</p><p style="font-size:12px;color:#94a3b8;">تأكد من صحة رقم الفاتورة أو تواصل مع إدارة المعرض على هاتف: 35965477 - 77905477</p></div></body></html>`);
    }

    const html = await response.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(200).send(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>فاتورة مبيعات - ${id} | مودرن هاوس للتجارة</title><style>body{font-family:sans-serif;text-align:center;padding:40px 16px;background:#f8fafc;color:#0f172a;}.card{max-width:500px;margin:20px auto;background:#fff;padding:32px;border-radius:24px;box-shadow:0 10px 25px rgba(0,0,0,0.06);border:1px solid #e2e8f0;}.badge{display:inline-block;padding:6px 14px;background:#fef3c7;color:#92400e;border-radius:999px;font-size:12px;font-weight:bold;margin-bottom:16px;}.btn{display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;border-radius:14px;font-weight:bold;font-size:13px;margin-top:20px;}</style></head><body><div class="card"><div class="badge">مودرن هاوس للتجارة • إدارة المبيعات</div><h2 style="font-size:22px;margin-bottom:6px;">فاتورة مبيعات رقم ${id}</h2><p style="color:#64748b;font-size:13px;line-height:1.6;margin:16px 0;">الفاتورة مسجلة ومعتمدة في نظام مودرن هاوس للتجارة. جاري مزامنة السجل السحابي مع خادم المعرض الرئيسي.</p><div style="background:#f1f5f9;padding:16px;border-radius:16px;font-size:12px;color:#334155;text-align:right;margin:16px 0;"><div style="display:flex;justify-content:space-between;margin-bottom:6px;"><strong>رقم الفاتورة:</strong> <span style="font-family:monospace;color:#dfb175;font-weight:bold;">${id}</span></div><div style="display:flex;justify-content:space-between;margin-bottom:6px;"><strong>المؤسسة:</strong> <span>مودرن هاوس للتجارة</span></div><div style="display:flex;justify-content:space-between;"><strong>سجل تجاري:</strong> <span>147987-2</span></div></div><a href="tel:35965477" class="btn">اتصل بخدمة العملاء: 35965477</a></div></body></html>`);
  }
}
