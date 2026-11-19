const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { LocalDatabase } = require('./database.cjs');
const { createBackupManager } = require('./backups.cjs');
const smokeTest = process.argv.includes('--smoke-test');
if (smokeTest && !process.env.OMS_TEST_DATA_DIR) {
  console.error('Smoke tests require an isolated OMS_TEST_DATA_DIR.');
  app.exit(2);
}
// Stable location for both installed and portable editions, outside application files.
app.setPath('userData', process.env.OMS_TEST_DATA_DIR && process.argv.includes('--smoke-test')
  ? process.env.OMS_TEST_DATA_DIR : path.join(app.getPath('appData'), 'ModernHouseOMS'));
const locked = app.requestSingleInstanceLock();
if (!locked) app.quit();
let win, db, backups;
let backupErrorNotified = false;
let pendingBackupError = null;
let quitting = false;
let activeUser = 'local-admin';
const entry = path.join(__dirname, 'renderer', 'index.html');
const entryURL = pathToFileURL(entry).href;
const trusted = event => {
  if (!win || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame || event.senderFrame.url.split('#')[0] !== entryURL) throw new Error('Untrusted sender');
};
function writeBackup(filename) {
  return backups.write(filename);
}
function reportBackupError(error) {
  console.error('Automatic backup failed:', error);
  try { fs.appendFileSync(path.join(app.getPath('userData'), 'backup-error.log'), `${new Date().toISOString()} ${error.stack || error.message}\n`); } catch {}
  pendingBackupError = error;
  showPendingBackupError();
}
function showPendingBackupError() {
  if (pendingBackupError && win && !win.isDestroyed() && !smokeTest && !quitting && !backupErrorNotified) {
    pendingBackupError = null;
    backupErrorNotified = true;
    void dialog.showMessageBox(win, { type: 'warning', message: 'تعذر إنشاء النسخة الاحتياطية التلقائية', detail: 'تحقق من المساحة المتاحة وصلاحيات مجلد البيانات. سيحاول البرنامج مجددًا، ويمكنك حفظ نسخة يدويًا من قائمة البيانات المحلية.' }).catch(console.error);
  }
}
async function backup() {
  const result = await dialog.showSaveDialog(win, { title: 'حفظ نسخة احتياطية', defaultPath: `Modern-House-${new Date().toISOString().slice(0, 10)}.oms-backup.json`, filters: [{ name: 'OMS Backup', extensions: ['json'] }] });
  if (result.canceled || !result.filePath) return null;
  writeBackup(result.filePath);
  return result.filePath;
}
async function restore() {
  const result = await dialog.showOpenDialog(win, { title: 'استعادة نسخة احتياطية', properties: ['openFile'], filters: [{ name: 'OMS Backup', extensions: ['json'] }] });
  if (result.canceled) return false;
  const data = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
  const confirm = await dialog.showMessageBox(win, { type: 'warning', buttons: ['إلغاء', 'استعادة'], defaultId: 0, cancelId: 0, message: 'استبدال البيانات الحالية بهذه النسخة؟', detail: 'ستُحفظ نسخة من البيانات الحالية تلقائيًا قبل الاستعادة.' });
  if (confirm.response !== 1) return false;
  backups.beforeRestore();
  db.restoreBackup(data);
  backups.markDirty();
  activeUser = 'local-admin';
  win.webContents.reload();
  return true;
}
const runMenuAction = fn => () => Promise.resolve().then(fn).catch(error => dialog.showErrorBox('Modern House OMS', error.message));
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
if (locked) app.whenReady().then(async () => {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  db = new LocalDatabase(path.join(app.getPath('userData'), 'oms.sqlite'));
  backups = createBackupManager({ directory: path.join(app.getPath('userData'), 'backups'), exportBackup: () => db.exportBackup(), onError: reportBackupError, intervalMs: smokeTest ? 200 : 15 * 60 * 1000 });
  backups.start();
  win = new BrowserWindow({ width: 1440, height: 940, minWidth: 900, minHeight: 600, title: 'Modern House OMS — محلي', show: !process.argv.includes('--smoke-test'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true } });
  win.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  // The desktop renderer never connects to cloud services or remote scripts/images.
  win.webContents.session.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_details, callback) => callback({ cancel: true }));
  const external = url => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' && ['wa.me', 'maps.google.com', 'www.google.com'].includes(parsed.hostname)) return shell.openExternal(parsed.href);
    } catch {}
  };
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'about:blank') return { action: 'allow', overrideBrowserWindowOptions: { webPreferences: { preload: '', nodeIntegration: false, contextIsolation: true, sandbox: true } } };
    external(url); return { action: 'deny' };
  });
  win.webContents.on('did-create-window', child => {
    child.setMenu(null);
    child.webContents.on('will-navigate', event => event.preventDefault());
    child.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  });
  win.webContents.on('will-navigate', (event, url) => { if (url.split('#')[0] !== entryURL) { event.preventDefault(); external(url); } });
  ipcMain.on('oms:preferences', event => {
    try { trusted(event); event.returnValue = db.preferences(); } catch { event.returnValue = {}; }
  });
  ipcMain.on('oms:preference', (event, key, value) => {
    try { trusted(event); db.setPreference(key, value); backups.markDirty(); event.returnValue = { ok: true }; }
    catch (error) { event.returnValue = { error: error.message }; }
  });
  ipcMain.handle('oms:call', async (event, method, args) => {
    trusted(event);
    if (!Array.isArray(args)) throw new Error('Invalid arguments');
    const [collection, id, payload] = args;
    let result;
    let changed = [collection];
    switch (method) {
      case 'list': return db.list(collection, id);
      case 'get': return db.get(collection, id);
      case 'create': result = db.create(collection, id); break;
      case 'update': result = db.update(collection, id, payload); break;
      case 'delete': result = db.delete(collection, id); break;
      case 'saveOrder':
        result = db.saveOrder(collection, { ...id, userId: activeUser || 'local-admin' });
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
      case 'session': return activeUser ? db.get('users', activeUser) : null;
      case 'login': result = db.login(...args); activeUser = result.id; return result;
      case 'loginPin': result = db.loginPin(...args); activeUser = result.id; return result;
      case 'logout': activeUser = null; return null;
      case 'localAdmin': activeUser = 'local-admin'; return db.get('users', activeUser);
      case 'backup': return backup();
      case 'restore': return restore();
      case 'dataFolder': await shell.openPath(app.getPath('userData')); return app.getPath('userData');
      default: throw new Error('Unsupported operation');
    }
    backups.markDirty();
    for (const name of changed) win.webContents.send('oms:changed', name);
    return result;
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'البيانات المحلية', submenu: [
      { label: 'حفظ نسخة احتياطية…', click: runMenuAction(backup) },
      { label: 'استعادة نسخة احتياطية…', click: runMenuAction(restore) },
      { label: 'فتح مجلد البيانات', click: runMenuAction(() => shell.openPath(app.getPath('userData'))) },
      { type: 'separator' }, { role: 'quit', label: 'خروج' }
    ] },
    { label: 'تحرير', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'عرض', submenu: [{ role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'togglefullscreen' }] }
  ]));
  await win.loadFile(entry);
  showPendingBackupError();
  if (process.argv.includes('--smoke-test')) {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const report = await win.webContents.executeJavaScript(`(async () => {
        const before = await window.omsDesktop.call('list', 'products');
        let product = before.find(p => p.sku === 'SMOKE');
        if (!product) product = await window.omsDesktop.call('create', 'products', { name: 'Offline smoke test', sku: 'SMOKE', stock: 7, salePrice: 10, purchasePrice: 5, status: 'Active' });
        const orderData = { customerId: 'Walk-in', date: new Date().toISOString(), items: [{ productId: product.id, quantity: 1, price: 10 }, { productId: product.id, quantity: 1, price: 10 }], subtotal: 20, discount: 0, total: 20, paymentMethod: 'Cash', employeeId: 'local-admin' };
        const order = await window.omsDesktop.call('saveOrder', orderData, { deliveryOption: 'free' });
        if ((await window.omsDesktop.call('get', 'products', product.id)).stock !== 5) throw new Error('Order stock transaction failed');
        await window.omsDesktop.call('saveOrder', { ...orderData, items: [{ productId: product.id, quantity: 1, price: 10 }], subtotal: 10, total: 10 }, { id: order.id });
        if ((await window.omsDesktop.call('get', 'products', product.id)).stock !== 6) throw new Error('Order edit stock transaction failed');
        await window.omsDesktop.call('deleteOrder', order.id);
        if ((await window.omsDesktop.call('get', 'products', product.id)).stock !== 7 || await window.omsDesktop.call('get', 'orders', order.id)) throw new Error('Order delete transaction failed');
        const orderCount = (await window.omsDesktop.call('list', 'orders')).length;
        let rejected = false;
        try { await window.omsDesktop.call('saveOrder', { ...orderData, items: [{ productId: product.id, quantity: 9999, price: 10 }] }, {}); } catch { rejected = true; }
        if (!rejected || (await window.omsDesktop.call('list', 'orders')).length !== orderCount || (await window.omsDesktop.call('get', 'products', product.id)).stock !== 7) throw new Error('Invalid order was not rolled back');
        const purchase = await window.omsDesktop.call('create', 'purchase_orders', { items: [{ productId: product.id, quantity: 2, purchasePrice: 5 }], status: 'Pending' });
        await window.omsDesktop.call('receivePurchaseOrder', purchase.id);
        await window.omsDesktop.call('receivePurchaseOrder', purchase.id);
        if ((await window.omsDesktop.call('get', 'products', product.id)).stock !== 9) throw new Error('Purchase receipt must be applied once');
        await window.omsDesktop.call('delete', 'purchase_orders', purchase.id);
        await window.omsDesktop.call('update', 'products', product.id, { stock: 7 });
        window.omsDesktop.setPreference('settings:smoke', 'local-persistence');
        const transactions = { create: true, update: true, delete: true, rollback: true, receiveOnce: true, savedOrderNumber: order.orderNumber };
        const products = await window.omsDesktop.call('list', 'products');
        const navigation = [];
        for (const label of ['المخزون', 'العملاء', 'الطلبات', 'عروض الأسعار', 'الإصلاح والصيانة', 'التقارير', 'الإعدادات']) {
          const link = [...document.querySelectorAll('nav a')].find(a => a.textContent.trim() === label);
          if (!link) throw new Error('Missing navigation: ' + label);
          link.click();
          await new Promise(resolve => setTimeout(resolve, 200));
          navigation.push({ label, rendered: document.getElementById('root').childElementCount > 0 });
        }
        const localControls = document.body.innerText.includes('حفظ نسخة احتياطية') && document.body.innerText.includes('استعادة نسخة احتياطية');
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ name: 'اختبار', stock: 7 }]), 'Inventory');
        const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        const parsed = XLSX.read(bytes, { type: 'array' });
        const excel = XLSX.utils.sheet_to_json(parsed.Sheets.Inventory)[0].stock === 7;
        return { text: document.body.innerText.slice(0, 800), navigation, localControls, excel, transactions, rootChildren: document.getElementById('root').childElementCount, persisted: !!before.find(p => p.sku === 'SMOKE'), product: products.find(p => p.sku === 'SMOKE'), background: getComputedStyle(document.body).backgroundColor, bridge: !!window.omsDesktop, nodeExposed: typeof require !== 'undefined' };
      })()`);
      report.version = app.getVersion();
      const backupFolder = path.join(app.getPath('userData'), 'backups');
      const backupDeadline = Date.now() + 3000;
      while (Date.now() < backupDeadline) {
        report.periodicBackup = fs.readdirSync(backupFolder).filter(name => /^snapshot-.*\.oms-backup\.json$/.test(name)).some(name => {
          const data = JSON.parse(fs.readFileSync(path.join(backupFolder, name), 'utf8'));
          return data.preferences['settings:smoke'] === 'local-persistence' && data.collections.products.some(p => p.sku === 'SMOKE' && p.stock === 7);
        });
        if (report.periodicBackup) break;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      fs.writeFileSync(path.join(app.getPath('userData'), 'smoke-report.json'), JSON.stringify(report, null, 2));
      const image = await win.webContents.capturePage();
      fs.writeFileSync(path.join(app.getPath('userData'), 'smoke.png'), image.toPNG());
      const pdf = await win.webContents.printToPDF({ printBackground: true });
      fs.writeFileSync(path.join(app.getPath('userData'), 'smoke-print.pdf'), pdf);
      app.exit(report.rootChildren && report.product?.stock === 7 && report.localControls && report.excel && report.transactions?.rollback && report.periodicBackup && !report.nodeExposed ? 0 : 1);
    } catch (error) { fs.writeFileSync(path.join(app.getPath('userData'), 'smoke-error.txt'), error.stack); app.exit(1); }
  }
}).catch(error => { dialog.showErrorBox('تعذر فتح البرنامج', error.message); app.exit(1); });
app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => {
  quitting = true;
  try { if (backups) backups.close(); } catch (error) {
    reportBackupError(error);
    if (!smokeTest) dialog.showErrorBox('تعذر حفظ النسخة الاحتياطية الأخيرة', 'لم تكتمل النسخة الاحتياطية عند الإغلاق. افتح البرنامج واحفظ نسخة من قائمة البيانات المحلية. تفاصيل الخطأ: ' + error.message);
  }
  if (db) db.close();
});
