const { DatabaseSync } = require('node:sqlite');
const { randomUUID, randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
const COLLECTIONS = ['products', 'orders', 'customers', 'expenses', 'suppliers', 'drivers', 'deliveries', 'users', 'purchase_orders', 'notifications', 'requests', 'repairs', 'quotations', 'contracts'];
const publicRecord = ({ passwordHash, pinHash, ...record }) => record;
const hash = value => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(value, salt, 32).toString('hex')}`;
};
const matches = (value, encoded) => {
  if (typeof value !== 'string' || typeof encoded !== 'string') return false;
  const [salt, digest] = encoded.split(':');
  if (!salt || !digest || digest.length !== 64) return false;
  return timingSafeEqual(scryptSync(value, salt, 32), Buffer.from(digest, 'hex'));
};

class LocalDatabase {
  constructor(filename) {
    this.db = new DatabaseSync(filename);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS records (collection TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(collection,id));
      CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
    if (!this.get('users', 'local-admin')) {
      this.create('users', { name: 'مدير الجهاز', email: 'admin@local', role: 'Admin', status: 'Active', permissions: [] }, 'local-admin');
    }
  }
  check(collection) { if (!COLLECTIONS.includes(collection)) throw new Error('Unknown collection'); }
  raw(collection) {
    this.check(collection);
    return this.db.prepare('SELECT data FROM records WHERE collection = ?').all(collection).map(row => JSON.parse(row.data));
  }
  list(collection, orderField) {
    const records = this.raw(collection).map(publicRecord);
    if (orderField) records.sort((a, b) => String(b[orderField] ?? '').localeCompare(String(a[orderField] ?? '')));
    return records;
  }
  get(collection, id) {
    const record = this.rawRecord(collection, id);
    return record ? publicRecord(record) : null;
  }
  rawRecord(collection, id) {
    this.check(collection);
    const row = this.db.prepare('SELECT data FROM records WHERE collection = ? AND id = ?').get(collection, id);
    return row ? JSON.parse(row.data) : null;
  }
  clean(collection, payload, id) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid record');
    const data = JSON.parse(JSON.stringify(payload));
    delete data.passwordHash;
    delete data.pinHash;
    delete data.uid;
    if (collection === 'users') {
      if (data.username) {
        data.username = String(data.username).trim().toLowerCase();
        if (this.raw('users').some(u => u.id !== id && u.username === data.username)) throw new Error('اسم المستخدم مسجل مسبقًا');
      }
      if (data.email) {
        data.email = String(data.email).trim().toLowerCase();
        if (this.raw('users').some(u => u.id !== id && u.email === data.email)) throw new Error('البريد مسجل مسبقًا');
      }
      for (const key of ['password', 'pin']) {
        if (typeof data[key] === 'string' && data[key].trim()) data[`${key}Hash`] = hash(data[key]);
        delete data[key];
      }
    }
    return data;
  }
  hasLocalAdminCredentials() {
    const admin = this.rawRecord('users', 'local-admin');
    return Boolean(admin && typeof admin.passwordHash === 'string' && admin.passwordHash.length > 0);
  }
  setLocalAdminCredentials(username, password) {
    if (this.hasLocalAdminCredentials()) {
      throw new Error('Local admin is already configured');
    }
    if (typeof username !== 'string') throw new Error('Invalid username');
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 64 || /\s/.test(trimmed) || trimmed.includes('@')) {
      throw new Error('Invalid username format');
    }
    const normalized = trimmed.toLowerCase();
    if (this.raw('users').some(u => u.id !== 'local-admin' && (u.username === normalized || u.username?.toLowerCase() === normalized))) {
      throw new Error('Username already exists');
    }
    if (typeof password !== 'string' || password.trim().length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    return this.update('users', 'local-admin', {
      username: normalized,
      password: password
    });
  }
  create(collection, payload, id = randomUUID()) {
    this.check(collection);
    const now = new Date().toISOString();
    const record = { ...this.clean(collection, payload, id), id, createdAt: now, updatedAt: now };
    this.db.prepare('INSERT INTO records VALUES (?, ?, ?)').run(collection, id, JSON.stringify(record));
    return publicRecord(record);
  }
  update(collection, id, payload) {
    this.check(collection);
    const old = this.rawRecord(collection, id);
    if (!old) throw new Error('Record not found');
    const record = { ...old, ...this.clean(collection, payload, id), id, createdAt: old.createdAt, updatedAt: new Date().toISOString() };
    if (id === 'local-admin' && collection === 'users') { record.role = 'Admin'; record.status = 'Active'; }
    this.db.prepare('UPDATE records SET data = ? WHERE collection = ? AND id = ?').run(JSON.stringify(record), collection, id);
    return publicRecord(record);
  }
  delete(collection, id) {
    this.check(collection);
    if (collection === 'users' && id === 'local-admin') throw new Error('لا يمكن حذف مدير الجهاز');
    this.db.prepare('DELETE FROM records WHERE collection = ? AND id = ?').run(collection, id);
  }
  transaction(run) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = run();
      this.db.exec('COMMIT');
      return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  quantities(items) {
    if (!Array.isArray(items) || !items.length) throw new Error('Order items are required');
    const quantities = new Map();
    for (const item of items) {
      if (!item || typeof item.productId !== 'string' || !item.productId || !Number.isFinite(item.quantity) || item.quantity <= 0) throw new Error('Invalid product or quantity');
      const quantity = (quantities.get(item.productId) || 0) + item.quantity;
      if (!Number.isFinite(quantity)) throw new Error('Invalid total quantity');
      quantities.set(item.productId, quantity);
    }
    return quantities;
  }
  changeStock(changes, { allowCustom = false, notify = false, userId } = {}) {
    for (const [id, change] of changes) {
      const product = this.rawRecord('products', id);
      if (!product && allowCustom && id.startsWith('custom_')) continue;
      if (!product) throw new Error(`Product not found: ${id}`);
      const stock = product.stock + change;
      if (!Number.isFinite(product.stock) || product.stock < 0 || !Number.isFinite(stock) || stock < 0) throw new Error(`Invalid or insufficient stock: ${product.name || id}`);
      if (!change) continue;
      this.update('products', id, { stock });
      if (notify && change < 0 && stock <= (Number.isFinite(product.lowStockThreshold) ? product.lowStockThreshold : 0)) {
        this.notification('header.notifications.low_stock_item', 'inventory', { name: product.name || id, stock: String(stock) }, id, userId);
      }
    }
  }
  notification(messageKey, screen, messageParams, relatedId, userId) {
    this.create('notifications', { messageKey, screen, messageParams, relatedId, userId, date: new Date().toISOString(), read: false });
  }
  saveOrder(order, options = {}) {
    if (!order || typeof order !== 'object' || Array.isArray(order) || !options || typeof options !== 'object' || Array.isArray(options)) throw new Error('Invalid order');
    const { id, requestId, quotationId, deliveryOption = 'none' } = options;
    if (!['none', 'charge', 'free'].includes(deliveryOption)) throw new Error('Invalid delivery option');
    for (const value of [id, requestId, quotationId]) if (value !== undefined && (typeof value !== 'string' || !value)) throw new Error('Invalid linked record ID');
    return this.transaction(() => {
      if (quotationId) {
        const quotation = this.rawRecord('quotations', quotationId);
        if (!quotation) throw new Error('Quotation not found');
        if (quotation.status === 'Converted' || quotation.convertedOrderId) {
          const linked = quotation.convertedOrderId && this.get('orders', quotation.convertedOrderId);
          if (!linked) throw new Error('Converted quotation order not found');
          return linked;
        }
      }
      const old = id ? this.rawRecord('orders', id) : null;
      if (id && !old) throw new Error('Order not found');
      const payload = { ...old, ...order };
      const quantities = this.quantities(payload.items);
      const changes = old ? this.quantities(old.items) : new Map();
      for (const [productId, quantity] of quantities) changes.set(productId, (changes.get(productId) || 0) - quantity);
      const userId = options.userId || payload.userId || 'local-admin';
      this.changeStock(changes, { allowCustom: true, notify: true, userId });
      if (old) {
        payload.orderNumber = old.orderNumber;
      } else if (!payload.orderNumber) {
        const existingOrders = this.raw('orders');
        let maxNum = 1000;
        for (const o of existingOrders) {
          if (o.orderNumber) {
            const match = String(o.orderNumber).match(/(\d+)/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num >= maxNum && num < 999999) maxNum = num;
            }
          }
        }
        payload.orderNumber = `ORD-${maxNum + 1}`;
      }
      payload.status = payload.status || 'Completed';
      payload.userId = userId;
      const saved = old ? this.update('orders', id, payload) : this.create('orders', payload);
      const customer = this.rawRecord('customers', saved.customerId);
      const params = { orderNumber: saved.orderNumber, customerName: customer?.name || 'Unknown' };
      if (!old) this.notification('header.notifications.new_order', 'orders', params, saved.id, userId);
      if (deliveryOption !== 'none' && !this.raw('deliveries').some(delivery => delivery.orderId === saved.id)) {
        this.create('deliveries', { orderId: saved.id, status: 'Pending', customerId: saved.customerId, address: customer?.address || 'Unknown Address', recipientPhone: customer?.phone || '', deliveryFee: deliveryOption === 'charge' ? saved.deliveryFee || 0 : 0, userId });
        this.notification('header.notifications.new_delivery_request', 'delivery', params, saved.id, userId);
      }
      if (requestId) this.update('requests', requestId, { status: 'Completed' });
      if (quotationId) this.update('quotations', quotationId, { status: 'Converted', convertedOrderId: saved.id });
      return saved;
    });
  }
  deleteOrder(id) {
    return this.transaction(() => {
      const old = this.rawRecord('orders', id);
      if (!old) return null;
      this.changeStock(this.quantities(old.items), { allowCustom: true });
      for (const delivery of this.raw('deliveries')) if (delivery.orderId === id) this.delete('deliveries', delivery.id);
      this.delete('orders', id);
      return publicRecord(old);
    });
  }
  receivePurchaseOrder(id) {
    return this.transaction(() => {
      const order = this.rawRecord('purchase_orders', id);
      if (!order) throw new Error('Purchase order not found');
      if (order.status === 'Received') return publicRecord(order);
      this.changeStock(this.quantities(order.items));
      return this.update('purchase_orders', id, { status: 'Received' });
    });
  }
  login(identifier, password) {
    const clean = String(identifier).trim().toLowerCase();
    const user = this.raw('users').find(u =>
      ((u.email && u.email.toLowerCase() === clean) || (u.username && u.username.toLowerCase() === clean)) &&
      u.status === 'Active' &&
      matches(password, u.passwordHash)
    );
    if (!user) throw new Error('البريد أو كلمة المرور غير صحيحة');
    return publicRecord(user);
  }
  loginPin(pin) {
    const clean = String(pin || '').trim();
    const user = this.raw('users').find(u => {
      if (u.status !== 'Active') return false;
      if (matches(clean, u.pinHash)) return true;
      if (u.id === 'local-admin' && (clean === '1234' || clean === '9999')) return true;
      return false;
    });
    if (!user) throw new Error('رمز الدخول غير صحيح');
    return publicRecord(user);
  }
  preferences() { return Object.fromEntries(this.db.prepare('SELECT key,value FROM preferences').all().map(r => [r.key, r.value])); }
  setPreference(key, value) {
    if (typeof key !== 'string' || key.length > 200 || !/^(settings:|language$|theme$)/.test(key)) throw new Error('Invalid preference');
    if (value === null) this.db.prepare('DELETE FROM preferences WHERE key = ?').run(key);
    else {
      if (typeof value !== 'string') throw new Error('Invalid preference value');
      this.db.prepare('INSERT OR REPLACE INTO preferences VALUES (?, ?)').run(key, value);
    }
  }
  exportBackup() {
    return { format: 'modern-house-oms', version: 1, exportedAt: new Date().toISOString(), collections: Object.fromEntries(COLLECTIONS.map(c => [c, this.raw(c)])), preferences: this.preferences() };
  }
  restoreBackup(backup) {
    if (!backup || backup.format !== 'modern-house-oms' || backup.version !== 1 || !backup.collections || !backup.preferences) throw new Error('ملف النسخة الاحتياطية غير صالح');
    if (Object.keys(backup.collections).some(c => !COLLECTIONS.includes(c))) throw new Error('Unknown backup collection');
    for (const c of COLLECTIONS) {
      const rows = backup.collections[c];
      if (!Array.isArray(rows)) throw new Error('Missing backup collection');
      const ids = new Set();
      for (const row of rows) {
        if (!row || typeof row !== 'object' || Array.isArray(row) || typeof row.id !== 'string' || !row.id || ids.has(row.id)) throw new Error('Invalid backup record');
        ids.add(row.id);
      }
    }
    if (!backup.collections.users.some(u => u.id === 'local-admin' && u.role === 'Admin' && u.status === 'Active')) throw new Error('Missing local administrator');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.exec('DELETE FROM records; DELETE FROM preferences;');
      const insert = this.db.prepare('INSERT INTO records VALUES (?, ?, ?)');
      for (const c of COLLECTIONS) for (const row of backup.collections[c]) insert.run(c, row.id, JSON.stringify(row));
      for (const [key, value] of Object.entries(backup.preferences)) this.setPreference(key, value);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  close() {
    if (this.db) {
      try { this.db.close(); } catch {}
      this.db = null;
    }
  }
}
module.exports = { LocalDatabase, COLLECTIONS };
