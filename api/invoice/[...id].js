export default async function handler(req, res) {
  const targetBase = process.env.DESKTOP_API_URL || 'https://washer-lines-shop-shark.trycloudflare.com';
  const id = Array.isArray(req.query.id) ? req.query.id.join('/') : (req.query.id || '');
  const cleanBase = targetBase.replace(/\/+$/, '');
  const targetUrl = `${cleanBase}/invoice/${encodeURIComponent(id)}`;

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(response.status).send(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>فاتورة غير موجودة | مودرن هاوس للتجارة</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>لم يتم العثور على الفاتورة رقم ${id}</h2><p>تأكد من رقم الفاتورة أو تواصل مع إدارة مودرن هاوس للتجارة.</p></body></html>`);
    }

    const html = await response.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error proxying invoice request:', error);
    return res.status(502).send(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>خطأ في جلب الفاتورة | مودرن هاوس</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>تعذر الاتصال بخادم فواتير مودرن هاوس حالياً</h2><p>يُرجى التحقق من اتصال البرنامج المكتبي بالإنترنت.</p></body></html>`);
  }
}
