const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { LocalDatabase, COLLECTIONS } = require('./database.cjs');

function withDatabase(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oms-transaction-test-'));
  const db = new LocalDatabase(path.join(dir, 'oms.sqlite'));
  try { return run(db); } finally { db.close(); fs.rmSync(dir, { recursive: true, force: true }); }
}
const product = (db, id = 'p1', stock = 10) => db.create('products', { name: id, stock, lowStockThreshold: 3 }, id);
const order = (items = [{ productId: 'p1', quantity: 2, price: 5 }]) => ({ date: '2026-11-03', customerId: 'c1', employeeId: 'local-admin', items, subtotal: 10, discount: 0, total: 10, paymentMethod: 'Cash' });
const collections = db => db.exportBackup().collections;

test('first-run administrator credentials use a normalized username and a hidden salted hash', () => withDatabase(db => {
  assert.equal(db.hasLocalAdminCredentials(), false);
  const admin = db.setLocalAdminCredentials('  Store.Admin  ', 'a-test-password-123');
  assert.equal(db.hasLocalAdminCredentials(), true);
  assert.equal(admin.username, 'store.admin');
  assert.equal(admin.role, 'Admin');
  assert.equal(admin.password, undefined);
  assert.equal(admin.passwordHash, undefined);
  assert.equal(db.login(' STORE.ADMIN ', 'a-test-password-123').id, 'local-admin');
  assert.equal(db.login('ADMIN@LOCAL', 'a-test-password-123').id, 'local-admin');
  assert.throws(() => db.login('store.admin', 'wrong'));
  const serialized = JSON.stringify(db.exportBackup());
  assert.equal(serialized.includes('a-test-password-123'), false);
  assert.match(db.rawRecord('users', 'local-admin').passwordHash, /^[a-f0-9]{32}:[a-f0-9]{64}$/);
  assert.throws(() => db.setLocalAdminCredentials('replacement', 'another-password'), /already configured/i);
  assert.equal(db.login('store.admin', 'a-test-password-123').id, 'local-admin');
}));

test('administrator setup validates username/password and rejects case-insensitive username conflicts', () => withDatabase(db => {
  for (const name of ['ab', 'name with spaces', 'a'.repeat(65), 'name@host']) assert.throws(() => db.setLocalAdminCredentials(name, 'valid-password'));
  for (const password of ['', '1234567', '        ', 12345678]) assert.throws(() => db.setLocalAdminCredentials('admin', password));
  db.create('users', { username: 'Other.Admin', email: 'other@local', password: 'staff-password', status: 'Active' });
  assert.throws(() => db.setLocalAdminCredentials(' OTHER.ADMIN ', 'valid-password'), /username/i);
  assert.equal(db.hasLocalAdminCredentials(), false);
  assert.equal(db.login('OTHER.ADMIN', 'staff-password').username, 'other.admin');
  db.setLocalAdminCredentials('مدير_المحل', 'valid-password');
  assert.equal(db.login('مدير_المحل', 'valid-password').id, 'local-admin');
}));

test('existing administrator password without a username is recognized and cannot be silently reset', () => withDatabase(db => {
  db.update('users', 'local-admin', { password: 'existing-password' });
  assert.equal(db.hasLocalAdminCredentials(), true);
  assert.throws(() => db.setLocalAdminCredentials('admin', 'replacement-password'), /already configured/i);
  assert.equal(db.login('admin@local', 'existing-password').id, 'local-admin');
}));
function failWhen(db, operation, collection) {
  db.db.exec(`CREATE TRIGGER fail_late BEFORE ${operation} ON records WHEN NEW.collection = '${collection}' BEGIN SELECT RAISE(ABORT, 'late failure'); END;`);
}

test('order creation aggregates duplicate products and commits delivery, request, quotation and notifications', () => withDatabase(db => {
  product(db);
  db.create('customers', { name: 'عميل', address: 'Bahrain', phone: '123' }, 'c1');
  db.create('requests', { status: 'Processing' }, 'r1');
  db.create('quotations', { status: 'Accepted' }, 'q1');
  const saved = db.saveOrder(order([{ productId: 'p1', quantity: 3, price: 5 }, { productId: 'p1', quantity: 4, price: 5 }]), { deliveryOption: 'charge', requestId: 'r1', quotationId: 'q1', userId: 'local-admin' });
  assert.match(saved.orderNumber, /^ORD-/);
  assert.equal(saved.status, 'Completed');
  assert.equal(db.get('products', 'p1').stock, 3);
  assert.equal(db.get('requests', 'r1').status, 'Completed');
  assert.equal(db.get('quotations', 'q1').convertedOrderId, saved.id);
  assert.equal(db.get('quotations', 'q1').status, 'Converted');
  const delivery = db.list('deliveries')[0];
  assert.equal(delivery.orderId, saved.id);
  assert.equal(delivery.customerId, 'c1');
  assert.equal(delivery.address, 'Bahrain');
  assert.deepEqual(db.list('notifications').map(n => n.messageKey).sort(), ['header.notifications.low_stock_item', 'header.notifications.new_delivery_request', 'header.notifications.new_order'].sort());
  assert.equal(db.get('customers', 'c1').totalSpent, undefined);
}));

test('late order notification failure rolls back order, stock and all linked changes', () => withDatabase(db => {
  product(db); db.create('requests', { status: 'Processing' }, 'r1'); db.create('quotations', { status: 'Accepted' }, 'q1');
  const before = collections(db);
  failWhen(db, 'INSERT', 'notifications');
  assert.throws(() => db.saveOrder(order(), { deliveryOption: 'free', requestId: 'r1', quotationId: 'q1' }), /late failure/);
  assert.deepEqual(collections(db), before);
}));

test('late quotation failure rolls back already written order, stock, request and delivery', () => withDatabase(db => {
  product(db); db.create('requests', { status: 'Processing' }, 'r1'); db.create('quotations', { status: 'Accepted' }, 'q1');
  const before = collections(db);
  failWhen(db, 'UPDATE', 'quotations');
  assert.throws(() => db.saveOrder(order(), { deliveryOption: 'free', requestId: 'r1', quotationId: 'q1' }), /late failure/);
  assert.deepEqual(collections(db), before);
}));

test('invalid quantities, missing products, aggregate overselling and invalid stock leave no partial order', () => {
  for (const quantity of [0, -1, NaN, Infinity, '2']) withDatabase(db => {
    product(db); const before = collections(db);
    assert.throws(() => db.saveOrder(order([{ productId: 'p1', quantity, price: 5 }])));
    assert.deepEqual(collections(db), before);
  });
  withDatabase(db => {
    product(db); const before = collections(db);
    assert.throws(() => db.saveOrder(order([{ productId: 'p1', quantity: 6 }, { productId: 'p1', quantity: 5 }])));
    assert.throws(() => db.saveOrder(order([{ productId: 'missing', quantity: 1 }])));
    assert.deepEqual(collections(db), before);
    db.update('products', 'p1', { stock: '10' });
    assert.throws(() => db.saveOrder(order()), /stock/i);
    assert.equal(db.list('orders').length, 0);
  });
});

test('custom quotation lines do not create stock records and repeated conversion returns the existing order', () => withDatabase(db => {
  product(db); db.create('quotations', { status: 'Accepted' }, 'q1');
  const input = order([{ productId: 'p1', quantity: 2 }, { productId: 'custom_quote_1', quantity: 4 }]);
  const first = db.saveOrder(input, { quotationId: 'q1', deliveryOption: 'free' });
  const before = collections(db);
  const repeated = db.saveOrder(input, { quotationId: 'q1', deliveryOption: 'free' });
  assert.equal(repeated.id, first.id);
  assert.deepEqual(collections(db), before);
  assert.equal(db.list('products').length, 1);
}));

test('converted quotation with a missing linked order is rejected instead of deducting twice', () => withDatabase(db => {
  product(db); db.create('quotations', { status: 'Converted', convertedOrderId: 'missing' }, 'q1');
  const before = collections(db);
  assert.throws(() => db.saveOrder(order(), { quotationId: 'q1' }), /Converted quotation order not found/);
  assert.deepEqual(collections(db), before);
}));

test('edits use stored original quantities and current stock, retaining the order number', () => withDatabase(db => {
  product(db); product(db, 'p2', 5);
  const saved = db.saveOrder(order());
  db.update('products', 'p1', { stock: 7 }); // independent inventory change after sale
  const edited = db.saveOrder({ ...order([{ productId: 'p1', quantity: 3 }, { productId: 'p1', quantity: 1 }, { productId: 'p2', quantity: 2 }]), orderNumber: 'overwrite-attempt' }, { id: saved.id });
  assert.equal(edited.orderNumber, saved.orderNumber);
  assert.equal(db.get('products', 'p1').stock, 5);
  assert.equal(db.get('products', 'p2').stock, 3);
  db.saveOrder(order([{ productId: 'p2', quantity: 1 }]), { id: saved.id });
  assert.equal(db.get('products', 'p1').stock, 9);
  assert.equal(db.get('products', 'p2').stock, 4);
  const before = collections(db);
  assert.throws(() => db.saveOrder(order([{ productId: 'p2', quantity: 10 }]), { id: saved.id }));
  assert.deepEqual(collections(db), before);
}));

test('order edit and delete failures roll back current stock and order', () => withDatabase(db => {
  product(db); const saved = db.saveOrder(order(), { deliveryOption: 'free' });
  const before = collections(db);
  failWhen(db, 'UPDATE', 'orders');
  assert.throws(() => db.saveOrder(order([{ productId: 'p1', quantity: 3 }]), { id: saved.id }), /late failure/);
  assert.deepEqual(collections(db), before);
  db.db.exec("DROP TRIGGER fail_late; CREATE TRIGGER fail_delete BEFORE DELETE ON records WHEN OLD.collection = 'orders' BEGIN SELECT RAISE(ABORT, 'late delete failure'); END;");
  assert.throws(() => db.deleteOrder(saved.id), /late delete failure/);
  assert.deepEqual(collections(db), before);
}));

test('delete restores aggregated quantities from stored order and current stock, removing linked deliveries once', () => withDatabase(db => {
  product(db); const saved = db.saveOrder(order([{ productId: 'p1', quantity: 2 }, { productId: 'p1', quantity: 3 }, { productId: 'custom_line', quantity: 1 }]), { deliveryOption: 'free' });
  db.update('products', 'p1', { stock: 4 });
  db.create('deliveries', { orderId: 'other' }, 'other-delivery');
  assert.equal(db.deleteOrder(saved.id).id, saved.id);
  assert.equal(db.get('products', 'p1').stock, 9);
  assert.equal(db.get('orders', saved.id), null);
  assert.deepEqual(db.list('deliveries').map(d => d.id), ['other-delivery']);
  assert.equal(db.deleteOrder(saved.id), null);
  assert.equal(db.get('products', 'p1').stock, 9);
}));

test('purchase receipt aggregates duplicate items and applies stock and status only once', () => withDatabase(db => {
  product(db); db.create('purchase_orders', { status: 'Pending', items: [{ productId: 'p1', quantity: 2 }, { productId: 'p1', quantity: 3 }] }, 'po1');
  assert.equal(db.receivePurchaseOrder('po1').status, 'Received');
  assert.equal(db.get('products', 'p1').stock, 15);
  const before = collections(db);
  db.receivePurchaseOrder('po1');
  assert.deepEqual(collections(db), before);
}));

test('purchase receipt rejects bad quantities, missing products and invalid stock, and rolls back late status failure', () => withDatabase(db => {
  product(db); db.create('purchase_orders', { status: 'Pending', items: [{ productId: 'p1', quantity: 2 }, { productId: 'missing', quantity: 1 }] }, 'po1');
  const before = collections(db);
  assert.throws(() => db.receivePurchaseOrder('po1'));
  assert.deepEqual(collections(db), before);
  for (const quantity of [0, -1, NaN, Infinity, '1']) {
    db.update('purchase_orders', 'po1', { items: [{ productId: 'p1', quantity }] });
    assert.throws(() => db.receivePurchaseOrder('po1'));
    assert.equal(db.get('products', 'p1').stock, 10);
  }
  db.update('purchase_orders', 'po1', { items: [{ productId: 'p1', quantity: 2 }] });
  db.update('products', 'p1', { stock: null });
  assert.throws(() => db.receivePurchaseOrder('po1'), /stock/i);
  assert.equal(db.get('purchase_orders', 'po1').status, 'Pending');
  db.update('products', 'p1', { stock: 10 });
  failWhen(db, 'UPDATE', 'purchase_orders');
  const validBefore = collections(db);
  assert.throws(() => db.receivePurchaseOrder('po1'), /late failure/);
  assert.deepEqual(collections(db), validBefore);
}));

test('empty, malformed or overflowing item totals are rejected without saving an order', () => withDatabase(db => {
  product(db);
  for (const items of [[], null, [{ quantity: 1 }], [{ productId: 'p1', quantity: Number.MAX_VALUE }, { productId: 'p1', quantity: Number.MAX_VALUE }]]) {
    assert.throws(() => db.saveOrder(order(items)), /items|product|quantity/i);
    assert.equal(db.list('orders').length, 0);
    assert.equal(db.get('products', 'p1').stock, 10);
  }
  assert.throws(() => db.saveOrder(order(), { id: 'missing' }), /Order not found/);
  assert.throws(() => db.saveOrder(order(), { requestId: 'missing' }), /Record not found/);
  assert.equal(db.get('products', 'p1').stock, 10);
  assert.equal(db.list('orders').length, 0);
}));

test('indexed updates avoid full collection reads and retain internal credential hashes', () => withDatabase(db => {
  product(db);
  const user = db.create('users', { name: 'Staff', email: 'indexed@test.local', password: 'secret', pin: '4321', status: 'Active' });
  db.raw = () => { throw new Error('Full collection scan'); };
  db.update('products', 'p1', { stock: 12 });
  const updated = db.update('users', user.id, { name: 'Renamed', passwordHash: 'injected', pinHash: 'injected' });
  assert.equal(updated.passwordHash, undefined);
  assert.equal(updated.pinHash, undefined);
  const stored = JSON.parse(db.db.prepare('SELECT data FROM records WHERE collection=? AND id=?').get('users', user.id).data);
  assert.match(stored.passwordHash, /^[a-f0-9]{32}:[a-f0-9]{64}$/);
  assert.match(stored.pinHash, /^[a-f0-9]{32}:[a-f0-9]{64}$/);
  delete db.raw;
  assert.equal(db.login('indexed@test.local', 'secret').id, user.id);
  assert.equal(db.loginPin('4321').id, user.id);
}));

test('legacy version 1 backup schema works with domain workflows and remains export-compatible', () => withDatabase(db => {
  const legacy = { format: 'modern-house-oms', version: 1, exportedAt: '2026-01-01', collections: Object.fromEntries(COLLECTIONS.map(c => [c, []])), preferences: { language: 'ar' } };
  legacy.collections.users.push({ id: 'local-admin', role: 'Admin', status: 'Active', name: 'مدير' });
  legacy.collections.products.push({ id: 'legacy-product', name: 'منتج', stock: 5, lowStockThreshold: 1 });
  db.restoreBackup(legacy);
  const saved = db.saveOrder(order([{ productId: 'legacy-product', quantity: 2 }]));
  db.deleteOrder(saved.id);
  assert.equal(db.get('products', 'legacy-product').stock, 5);
  assert.equal(db.exportBackup().version, 1);
  assert.equal(db.preferences().language, 'ar');
  assert.deepEqual(db.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(t => t.name), ['preferences', 'records']);
}));

test('desktop storage supports durable CRUD, settings, validated atomic restore and local credentials', async () => {
  const modulePath = path.join(__dirname, 'database.cjs');
  assert.ok(fs.existsSync(modulePath), 'Local database implementation must exist');
  const { LocalDatabase } = require(modulePath);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oms-db-test-'));
  const filename = path.join(dir, 'oms.sqlite');
  let db = new LocalDatabase(filename);
  try {
    const product = db.create('products', { name: 'حوض', stock: 5, imageUrl: 'data:image/png;base64,abc' });
    db.update('products', product.id, { stock: 8 });
    db.setPreference('language', 'ar');
    db.close();
    db = new LocalDatabase(filename);
    assert.equal(db.list('products')[0].stock, 8);
    assert.equal(db.preferences().language, 'ar');
    assert.equal(db.list('products')[0].imageUrl, 'data:image/png;base64,abc');
    const backup = db.exportBackup();
    db.delete('products', product.id);
    assert.equal(db.list('products').length, 0);
    db.restoreBackup(backup);
    assert.equal(db.list('products')[0].name, 'حوض');
    assert.throws(() => db.restoreBackup({ ...backup, collections: { products: [{ name: 'missing ID' }] } }));
    assert.equal(db.list('products')[0].stock, 8, 'invalid restore must preserve existing records');
    assert.throws(() => db.list('not_allowed'));
    assert.throws(() => db.update('products', 'missing', { stock: 1 }));
    const user = db.create('users', { name: 'Staff', email: 'staff@example.test', password: 'test-secret-123', pin: '8271', role: 'Salesperson', status: 'Active' });
    assert.equal(user.password, undefined);
    assert.equal(user.pin, undefined);
    assert.equal(db.login('STAFF@example.test', 'test-secret-123').id, user.id);
    assert.equal(db.loginPin('8271').id, user.id);
    assert.throws(() => db.loginPin('0000'));
    assert.throws(() => db.login('staff@example.test', 'bad'));
    db.update('users', user.id, { pin: '8272' });
    assert.throws(() => db.loginPin('8271'));
    assert.equal(db.loginPin('8272').id, user.id);
    db.update('users', user.id, { status: 'Inactive' });
    assert.throws(() => db.loginPin('8272'));
    db.restoreBackup(backup);
    assert.equal(db.list('users').length, 1);
  } finally {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
