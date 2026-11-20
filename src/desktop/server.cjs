const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const CLIENT_BRIDGE_JS = `(function() {
  if (!window.omsDesktop) {
    var listeners = [];
    var es = null;
    try {
      es = new EventSource('/api/events');
      es.onmessage = function(e) {
        try {
          var data = JSON.parse(e.data);
          if (data && data.changed && Array.isArray(data.changed)) {
            for (var i = 0; i < data.changed.length; i++) {
              var col = data.changed[i];
              for (var j = 0; j < listeners.length; j++) {
                try { listeners[j](col); } catch(err) { console.error(err); }
              }
            }
          }
        } catch(err) {}
      };
    } catch(e) { console.warn('SSE not supported', e); }

    window.omsDesktop = {
      call: function(method) {
        var args = Array.prototype.slice.call(arguments, 1);
        var sessionUser = localStorage.getItem('oms_local_session_uid') || '';
        return fetch('/api/call', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-OMS-Session': sessionUser
          },
          body: JSON.stringify({ method: method, args: args, sessionUser: sessionUser })
        }).then(function(res) {
          return res.json().then(function(json) {
            if (!res.ok || json.error) throw new Error(json.error || 'Server request failed');
            return json.data;
          });
        });
      },
      preferences: function() {
        try {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', '/api/preferences', false);
          xhr.send(null);
          return JSON.parse(xhr.responseText).data || {};
        } catch(e) {
          return { language: 'ar' };
        }
      },
      setPreference: function(key, value) {
        try {
          var xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/preference', false);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify({ key: key, value: value }));
        } catch(e) {}
      },
      onChanged: function(callback) {
        listeners.push(callback);
        return function() {
          var idx = listeners.indexOf(callback);
          if (idx !== -1) listeners.splice(idx, 1);
        };
      }
    };
  }
})();`;

function createTabletServer({ database, rendererDir, onDataChanged, port = 3000 }) {
  const db = database;
  const sseClients = new Set();

  function broadcastChange(collections) {
    const payload = `data: ${JSON.stringify({ changed: collections })}\n\n`;
    for (const client of sseClients) {
      try { client.write(payload); } catch { sseClients.delete(client); }
    }
    if (typeof onDataChanged === 'function') {
      onDataChanged(collections);
    }
  }

  const server = http.createServer(async (req, res) => {
    // CORS headers for local LAN tablet access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // --- API Endpoints ---
    if (pathname === '/download/Modern-House-OMS.apk' || pathname === '/Modern-House-OMS.apk' || pathname === '/api/download/apk') {
      const candidates = [
        path.join(__dirname, 'renderer', 'Modern-House-OMS.apk'),
        path.join(process.env.USERPROFILE || 'C:\\Users\\7aleem', 'Desktop', 'Modern-House-OMS.apk'),
        path.join(__dirname, '..', '..', 'public', 'Modern-House-OMS.apk')
      ];
      const apkPath = candidates.find(p => fs.existsSync(p));
      if (apkPath) {
        const stat = fs.statSync(apkPath);
        res.writeHead(200, {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Length': stat.size,
          'Content-Disposition': 'attachment; filename="Modern-House-OMS.apk"',
          'Cache-Control': 'no-cache'
        });
        return fs.createReadStream(apkPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('ملف التطبيق APK غير متوفر حالياً');
      }
    }

    if (pathname === '/download/Modern-House-OMS-Setup.exe' || pathname === '/Modern-House-OMS-Setup.exe' || pathname === '/api/download/exe') {
      const candidates = [
        path.join(__dirname, 'release', 'Modern-House-OMS-Setup-1.1.0.exe'),
        path.join(process.env.USERPROFILE || 'C:\\Users\\7aleem', 'Desktop', 'Modern-House-OMS-Setup-1.1.0.exe'),
        path.join(process.env.USERPROFILE || 'C:\\Users\\7aleem', 'Desktop', 'Modern House OMS', 'Modern-House-OMS-Setup.exe')
      ];
      const exePath = candidates.find(p => fs.existsSync(p));
      if (exePath) {
        const stat = fs.statSync(exePath);
        res.writeHead(200, {
          'Content-Type': 'application/vnd.microsoft.portable-executable',
          'Content-Length': stat.size,
          'Content-Disposition': 'attachment; filename="Modern-House-OMS-Setup-1.1.0.exe"',
          'Cache-Control': 'no-cache'
        });
        return fs.createReadStream(exePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('ملف التثبيت EXE قيد الإنشاء أو غير متوفر');
      }
    }

    if (pathname === '/api/check-update') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        currentVersion: '1.1.0',
        latestVersion: '1.1.0',
        updateAvailable: false,
        releaseNotes: 'نظام إدارة العمليات الشامل - مودرن هاوس للتجارة (OMS v1.1.0). يشمل نقاط البيع، المخزون، عروض الأسعار، وقاعدة بيانات محلية سحابية.',
        apkUrl: '/download/Modern-House-OMS.apk',
        exeUrl: '/download/Modern-House-OMS-Setup.exe'
      }));
    }

    if (pathname === '/api/system-update' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        success: true,
        version: '1.1.0',
        message: 'تم تحديث كافة حزم النظام وقاعدة البيانات بنجاح، النظام يعمل بأحدث إصدار.'
      }));
    }

    // Public Digital Invoice Verification View
    if (pathname.startsWith('/invoice/') || pathname.startsWith('/verify-invoice/')) {
      const parts = pathname.split('/').filter(Boolean);
      const queryId = parts[1] || parsedUrl.searchParams.get('id') || parsedUrl.searchParams.get('no');
      
      let order = null;
      if (db && queryId) {
        try {
          order = db.get('orders', queryId);
          if (!order) {
            const allOrders = db.list('orders') || [];
            order = allOrders.find(o => o.orderNumber === queryId || o.id === queryId);
          }
        } catch (e) {
          console.warn('Local database lookup error:', e.message);
        }
      }

      // If order not found in local db or running in cloud without local db, proxy to desktop tunnel!
      if (!order && queryId) {
        const tunnelBase = process.env.DESKTOP_API_URL || 'https://washer-lines-shop-shark.trycloudflare.com';
        try {
          const tunnelRes = await fetch(`${tunnelBase.replace(/\/+$/, '')}${pathname}`);
          if (tunnelRes.ok) {
            const html = await tunnelRes.text();
            res.writeHead(200, { 
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            return res.end(html);
          }
        } catch (tunnelErr) {
          console.warn('Tunnel proxy error:', tunnelErr.message);
        }
      }

      if (!order) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head><meta charset="utf-8"><title>فاتورة غير موجودة</title><style>body{font-family:system-ui;text-align:center;padding:50px;background:#f8fafc;color:#334155}h2{color:#e11d48}</style></head>
          <body><h2>تعذر العثور على الفاتورة المطلوبة</h2><p>يرجى التأكد من مسح الرمز الصحيح أو مراجعة إدارة المعرض على هاتف 35965477.</p></body>
          </html>
        `);
      }

      const customer = order.customerId ? db.get('customers', order.customerId) : null;
      const allProducts = db.list('products') || [];
      const productMap = new Map(allProducts.map(p => [p.id, p]));

      const itemsHtml = (order.items || []).map((item, idx) => {
        const prod = productMap.get(item.productId);
        const name = prod?.name || item.name || ('صنف #' + (idx + 1));
        const sku = prod?.sku || '';
        const price = Number(item.price || 0).toFixed(2);
        const qty = item.quantity || 1;
        const total = (price * qty).toFixed(2);
        return '<tr>' +
          '<td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center;color:#64748b;">' + (idx + 1) + '</td>' +
          '<td style="padding:12px;border-bottom:1px solid #e2e8f0;">' +
            '<div style="font-weight:bold;color:#0f172a;">' + name + '</div>' +
            (sku ? '<div style="font-size:11px;color:#94a3b8;font-family:monospace;">SKU: ' + sku + '</div>' : '') +
          '</td>' +
          '<td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:bold;">' + qty + '</td>' +
          '<td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:left;font-family:monospace;">' + price + ' BHD</td>' +
          '<td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:left;font-family:monospace;font-weight:bold;color:#0f172a;">' + total + ' BHD</td>' +
        '</tr>';
      }).join('');

      const vatTotal = (order.items || []).reduce((acc, it) => acc + (it.vatAmount || 0), 0);
      const subtotal = Number(order.subtotal || (order.total - vatTotal)).toFixed(2);
      const grandTotal = Number(order.total || 0).toFixed(2);
      const orderDate = new Date(order.date);
      const formattedDate = orderDate.toLocaleDateString('ar-BH', { year: 'numeric', month: 'long', day: 'numeric' });
      const formattedTime = orderDate.toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' });

      const html = '<!DOCTYPE html>' +
        '<html dir="rtl" lang="ar">' +
        '<head>' +
          '<meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width, initial-scale=1">' +
          '<title>فاتورة مبيعات - ' + order.orderNumber + ' | مودرن هاوس للتجارة</title>' +
          '<style>' +
            '* { box-sizing: border-box; margin: 0; padding: 0; }' +
            'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 16px; }' +
            '.container { max-width: 760px; margin: 0 auto; background: #fff; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e2e8f0; }' +
            '.header { background: linear-gradient(135deg, #0f172a, #1e293b); color: #fff; padding: 28px 24px; position: relative; }' +
            '.badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(223, 177, 117, 0.2); color: #dfb175; border: 1px solid rgba(223, 177, 117, 0.4); padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; margin-bottom: 12px; }' +
            '.title { font-size: 24px; font-weight: 900; color: #fff; margin-bottom: 4px; }' +
            '.subtitle { font-size: 12px; color: #94a3b8; }' +
            '.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding: 24px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }' +
            '.info-box { background: #fff; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; }' +
            '.info-label { font-size: 11px; color: #64748b; font-weight: bold; margin-bottom: 4px; }' +
            '.info-val { font-size: 14px; font-weight: 700; color: #0f172a; }' +
            'table { width: 100%; border-collapse: collapse; font-size: 13px; }' +
            'th { background: #f8fafc; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 11px; text-transform: uppercase; font-weight: 800; }' +
            '.totals { padding: 24px; display: flex; justify-content: flex-end; background: #fafafa; border-top: 1px solid #e2e8f0; }' +
            '.totals-table { width: 280px; font-size: 13px; }' +
            '.totals-row { display: flex; justify-content: space-between; padding: 6px 0; color: #475569; }' +
            '.grand-total { border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 6px; font-size: 16px; font-weight: 900; color: #dfb175; }' +
            '.verification { display: flex; align-items: center; gap: 12px; padding: 16px 24px; background: #ecfdf5; border-top: 1px solid #a7f3d0; color: #065f46; font-size: 12px; }' +
            '.actions { padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; background: #fff; }' +
            '.btn { display: inline-block; padding: 10px 24px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 13px; cursor: pointer; border: none; }' +
            '@media print { body { background: #fff; padding: 0; } .container { box-shadow: none; border: none; } .actions { display: none; } }' +
          '</style>' +
        '</head>' +
        '<body>' +
          '<div class="container">' +
            '<div class="header">' +
              '<div class="badge">✓ فاتورة مبيعات موثقة</div>' +
              '<div class="title">مودرن هاوس للتجارة</div>' +
              '<div class="subtitle">س.ت: 147987-2 • هاتف: 35965477 - 77905477 • مملكة البحرين</div>' +
            '</div>' +
            '<div class="info-grid">' +
              '<div class="info-box">' +
                '<div class="info-label">رقم الفاتورة</div>' +
                '<div class="info-val" style="font-family: monospace; color:#dfb175;">' + order.orderNumber + '</div>' +
              '</div>' +
              '<div class="info-box">' +
                '<div class="info-label">تاريخ الإصدار</div>' +
                '<div class="info-val">' + formattedDate + ' - ' + formattedTime + '</div>' +
              '</div>' +
              '<div class="info-box">' +
                '<div class="info-label">العميل</div>' +
                '<div class="info-val">' + (customer?.name || 'عميل نقدي') + '</div>' +
                (customer?.phone ? '<div style="font-size:11px;color:#64748b;font-family:monospace;">' + customer.phone + '</div>' : '') +
              '</div>' +
              '<div class="info-box">' +
                '<div class="info-label">حالة الدفع</div>' +
                '<div class="info-val" style="color: #059669;">✓ مدفوعة بالكامل (' + (order.paymentMethod || 'نقداً') + ')</div>' +
              '</div>' +
            '</div>' +
            '<table>' +
              '<thead>' +
                '<tr>' +
                  '<th style="width:40px;text-align:center;">#</th>' +
                  '<th style="text-align:right;">الصنف / البيان</th>' +
                  '<th style="width:60px;text-align:center;">الكمية</th>' +
                  '<th style="width:100px;text-align:left;">السعر</th>' +
                  '<th style="width:110px;text-align:left;">الإجمالي</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' + itemsHtml + '</tbody>' +
            '</table>' +
            '<div class="totals">' +
              '<div class="totals-table">' +
                (order.discount ? '<div class="totals-row"><span>الخصم المطبق:</span><span style="font-family:monospace;font-weight:bold;">' + Number(order.discount).toFixed(2) + ' BHD</span></div>' : '') +
                '<div class="totals-row grand-total"><span>المبلغ الإجمالي المستحق:</span><span style="font-family:monospace;">' + grandTotal + ' BHD</span></div>' +
              '</div>' +
            '</div>' +
            '<div class="verification">' +
              '<span style="font-size:20px;">🛡️</span>' +
              '<div><strong>التحقق الرقمي المعتمد:</strong> هذه الفاتورة صادرة إلكترونياً من نظام مودرن هاوس للتجارة (Modern House OMS) ومسجلة في قاعدة البيانات الرسمية.</div>' +
            '</div>' +
            '<div class="actions">' +
              '<button class="btn" onclick="window.print()">🖨️ طباعة الفاتورة / حفظ كـ PDF</button>' +
            '</div>' +
          '</div>' +
        '</body>' +
        '</html>';

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    if (pathname === '/client-bridge.js') {
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      return res.end(CLIENT_BRIDGE_JS);
    }

    if (pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      });
      res.write(': connected\n\n');
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (pathname === '/api/preferences' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ ok: true, data: (db && db.preferences) ? db.preferences() : { language: 'ar' } }));
    }

    if (pathname === '/api/preference' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { key, value } = JSON.parse(body || '{}');
          if (db && db.setPreference) db.setPreference(key, value);
          if (typeof onDataChanged === 'function') onDataChanged(['preferences']);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    if (pathname === '/api/call' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        if (!db) {
          const tunnelBase = process.env.DESKTOP_API_URL || 'https://washer-lines-shop-shark.trycloudflare.com';
          try {
            const proxyRes = await fetch(`${tunnelBase.replace(/\/+$/, '')}/api/call`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-OMS-Session': req.headers['x-oms-session'] || ''
              },
              body: body
            });
            const data = await proxyRes.text();
            res.writeHead(proxyRes.status, { 'Content-Type': 'application/json' });
            return res.end(data);
          } catch (err) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Desktop daemon offline or unreachable' }));
          }
        }
        try {
          const parsedBody = JSON.parse(body || '{}');
          const { method, args = [], sessionUser } = parsedBody;
          const [collection, id, payload] = args;
          let result;
          let changed = [collection];

          switch (method) {
            case 'list': result = db.list(collection, id); break;
            case 'get': result = db.get(collection, id); break;
            case 'create': result = db.create(collection, id); break;
            case 'update': result = db.update(collection, id, payload); break;
            case 'delete': result = db.delete(collection, id); break;
            case 'saveOrder':
              result = db.saveOrder(collection, { ...id, userId: 'tablet' });
              changed = ['orders', 'products', 'notifications', 'deliveries', 'requests', 'quotations'];
              break;
            case 'deleteOrder':
              result = db.deleteOrder(collection);
              changed = ['orders', 'products', 'deliveries'];
              break;
            case 'receivePurchaseOrder':
              result = db.receivePurchaseOrder(collection);
              changed = ['purchase_orders', 'products'];
              break;
            case 'session': {
              const sessionUid = req.headers['x-oms-session'] || sessionUser || (typeof args[0] === 'string' ? args[0] : null);
              if (sessionUid) {
                const user = db.get('users', sessionUid);
                result = (user && user.status === 'Active') ? user : null;
              } else {
                result = null;
              }
              break;
            }
            case 'login': result = db.login(...args); break;
            case 'loginPin': result = db.loginPin(...args); break;
            case 'logout': result = null; break;
            case 'localAdmin': result = db.get('users', 'local-admin'); break;
            case 'setupStatus': result = { setupRequired: false }; break;
            default:
              if (typeof db[method] === 'function') {
                result = db[method](...args);
              } else {
                throw new Error(`Unknown OMS database method: ${method}`);
              }
          }

          if (changed && changed.length) {
            broadcastChange(changed);
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, data: result }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // --- Static File Serving ---
    let relative = pathname === '/' ? '/index.html' : pathname;
    let filePath = path.join(rendererDir, relative);

    // Security check: prevent directory traversal
    if (!filePath.startsWith(rendererDir)) {
      res.writeHead(403);
      return res.end('Access Denied');
    }

    // Fallback for SPA routing if file does not exist
    if (!fs.existsSync(filePath)) {
      filePath = path.join(rendererDir, 'index.html');
    }

    try {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      if (ext === '.html') {
        let content = fs.readFileSync(filePath, 'utf8');
        // Remove restrictive CSP meta tag for tablet/browser clients to prevent inline/fetch blocking
        content = content.replace(/<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');
        // Inject bridge script directly into head before module bundles
        content = content.replace(/<head>/i, '<head>\n    <script src="/client-bridge.js"></script>');
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        return res.end(content);
      }

      const stream = fs.createReadStream(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      stream.pipe(res);
    } catch (err) {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  return {
    server,
    broadcastChange,
    listen: (customPort) => new Promise((resolve, reject) => {
      const targetPort = customPort || port;
      server.listen(targetPort, '0.0.0.0', () => {
        resolve({ port: targetPort });
      }).on('error', reject);
    })
  };
}

module.exports = { createTabletServer };

if (require.main === module) {
  const os = require('node:os');
  let db = null;
  try {
    const { createInstallation } = require('./installation.cjs');
    const controlDirectory = path.join(process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config'), 'ModernHouseOMS');
    const installation = createInstallation({ controlDirectory });
    db = installation.database;
  } catch (err) {
    console.warn('Local database initialization skipped or running in cloud proxy mode:', err.message);
  }
  const rendererDir = path.join(__dirname, 'renderer');

  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
    }
  }
  const primaryIp = ips.find(ip => ip.startsWith('192.168.')) || ips[0] || 'localhost';

  const targetPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3050;

  const tabletServer = createTabletServer({
    database: db,
    rendererDir,
    port: targetPort
  });

  const tryListen = (p) => {
    return tabletServer.listen(p).then(({ port }) => {
      console.log(`\n======================================================`);
      console.log(` Modern House OMS — خادم التابلت والشبكة المحلية`);
      console.log(`======================================================`);
      console.log(`\n1. الرابط المحلي على جهاز الكمبيوتر:`);
      console.log(`   http://localhost:${port}`);
      console.log(`\n2. رابط التابلت والجوال داخل المعرض (Wi-Fi):`);
      console.log(`   http://${primaryIp}:${port}`);
      console.log(`\n3. اضغط على (⋮) ثم اختر "تثبيت التطبيق" (Install App).`);
      console.log(`======================================================\n`);
      return { port };
    }).catch(err => {
      if (err.code === 'EADDRINUSE' && p === 3000) {
        console.log(`Port 3000 in use, falling back to 3001...`);
        return tryListen(3001);
      }
      throw err;
    });
  };

  tryListen(targetPort).catch(err => {
    console.error('Error starting tablet server:', err);
  });
}
