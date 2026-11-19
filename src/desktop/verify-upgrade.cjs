const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');

const [legacyModule, executable] = process.argv.slice(2);
if (!legacyModule || !executable) throw new Error('Usage: node verify-upgrade.cjs <v1.0 database.cjs> <new packaged EXE>');
const { LocalDatabase } = require(path.resolve(legacyModule));
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oms-legacy-upgrade-'));
const filename = path.join(directory, 'oms.sqlite');
const legacy = new LocalDatabase(filename);
const product = legacy.create('products', { name: 'منتج من الإصدار السابق', sku: 'LEGACY', stock: 23, salePrice: 10, purchasePrice: 5, status: 'Active', imageUrl: 'data:image/png;base64,fixture' }, 'legacy-product');
const customer = legacy.create('customers', { name: 'عميل تجريبي قديم', phone: 'fixture', joinDate: '2026-01-01' }, 'legacy-customer');
const order = legacy.create('orders', { orderNumber: 'LEGACY-0001', date: '2026-01-01', customerId: customer.id, items: [{ productId: product.id, quantity: 2, price: 10 }], subtotal: 20, discount: 0, total: 20, paymentMethod: 'Cash', employeeId: 'local-admin', status: 'Completed' }, 'legacy-order');
legacy.setPreference('settings:legacy', JSON.stringify({ name: 'إعدادات قديمة' }));
legacy.setPreference('language', 'ar');
const legacyPreferences = legacy.preferences();
legacy.close();

const env = { ...process.env, OMS_TEST_DATA_DIR: directory };
delete env.ELECTRON_RUN_AS_NODE;
const reports = [];
for (let run = 1; run <= 2; run++) {
  const result = spawnSync(path.resolve(executable), ['--smoke-test', '--proxy-server=http://127.0.0.1:1', '--proxy-bypass-list=<-loopback>', '--host-resolver-rules=MAP * ~NOTFOUND'], { env, windowsHide: true, timeout: 45000, encoding: 'utf8' });
  assert.equal(result.error, undefined, String(result.error));
  assert.equal(result.status, 0, result.stderr || 'Packaged upgrade run failed; see ' + directory);
  const report = JSON.parse(fs.readFileSync(path.join(directory, 'smoke-report.json'), 'utf8'));
  assert.equal(report.version, '1.1.0');
  assert.equal(report.periodicBackup, true);
  assert.equal(report.transactions.rollback, true);
  assert.equal(report.persisted, run === 2);
  reports.push(report);
}
const reader = new DatabaseSync(filename, { readOnly: true });
reader.exec('PRAGMA query_only=ON');
function get(collection, id) { return JSON.parse(reader.prepare('SELECT data FROM records WHERE collection=? AND id=?').get(collection, id).data); }
assert.deepEqual(get('products', product.id), product);
assert.deepEqual(get('customers', customer.id), customer);
assert.deepEqual(get('orders', order.id), order);
const preferences = Object.fromEntries(reader.prepare('SELECT key,value FROM preferences').all().map(row => [row.key, row.value]));
for (const [key, value] of Object.entries(legacyPreferences)) assert.equal(preferences[key], value);
assert.equal(reader.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
reader.close();
const summary = { passed: true, checkedAt: new Date().toISOString(), legacyModule: path.resolve(legacyModule), executable: path.resolve(executable), directory, oldRecordsAndPreferencesPreserved: true, integrity: 'ok', runs: reports };
fs.writeFileSync(path.join(__dirname, 'verification-upgrade.json'), JSON.stringify(summary, null, 2));
console.log('PASS: actual version 1.0 SQLite fixture opened twice by packaged 1.1.0; legacy product/customer/order and preferences unchanged; new transactional operations and snapshots verified.');
console.log('Isolated profile: ' + directory);
