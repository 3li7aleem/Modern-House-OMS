const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { LocalDatabase } = require('./database.cjs');

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oms-installation-test-'));
  const controlDirectory = path.join(root, 'control');
  const instances = [];
  const open = () => {
    const installation = require('./installation.cjs').createInstallation({ controlDirectory });
    instances.push(installation);
    return installation;
  };
  try { return run({ root, controlDirectory, open }); }
  finally {
    for (const instance of instances) instance.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
}
const credentials = { username: 'store.admin', password: 'installation-test-password' };

test('fresh setup defaults to the legacy directory and persists credentials across restart without config secrets', () => fixture(({ controlDirectory, open }) => {
  let app = open();
  assert.equal(app.status().setupRequired, true);
  assert.equal(app.dataDirectory, controlDirectory);
  assert.equal(app.status().defaultDirectory, controlDirectory);
  const result = app.configure(credentials);
  assert.equal(result.setupRequired, false);
  const config = JSON.parse(fs.readFileSync(path.join(controlDirectory, 'desktop-config.json'), 'utf8'));
  assert.deepEqual(config, { version: 1, dataDirectory: controlDirectory });
  assert.equal(JSON.stringify(config).includes(credentials.password), false);
  app.close();
  app = open();
  assert.equal(app.status().setupRequired, false);
  assert.equal(app.database.login('STORE.ADMIN', credentials.password).id, 'local-admin');
}));

test('legacy business data is preserved by setup and a configured legacy administrator cannot be reset', () => fixture(({ controlDirectory, open }) => {
  fs.mkdirSync(controlDirectory);
  const legacy = new LocalDatabase(path.join(controlDirectory, 'oms.sqlite'));
  legacy.create('products', { name: 'منتج قديم', stock: 9 }, 'legacy');
  legacy.setPreference('language', 'ar');
  legacy.close();
  const app = open();
  assert.equal(app.status().setupRequired, true);
  app.configure(credentials);
  assert.equal(app.database.get('products', 'legacy').stock, 9);
  assert.equal(app.database.preferences().language, 'ar');
  assert.throws(() => app.configure({ username: 'other', password: 'another-password' }), /already configured/i);
}));

test('legacy administrator with an existing password and no config file is adopted without a reset', () => fixture(({ controlDirectory, open }) => {
  fs.mkdirSync(controlDirectory);
  const legacy = new LocalDatabase(path.join(controlDirectory, 'oms.sqlite'));
  legacy.update('users', 'local-admin', { password: 'existing-legacy-password' });
  legacy.close();
  const app = open();
  assert.equal(app.status().setupRequired, false);
  assert.throws(() => app.configure(credentials), /already configured/i);
  assert.equal(app.database.login('admin@local', 'existing-legacy-password').id, 'local-admin');
  assert.equal(fs.existsSync(path.join(controlDirectory, 'desktop-config.json')), false);
}));

test('choosing an empty directory migrates every collection and preference while retaining the original database', () => fixture(({ root, controlDirectory, open }) => {
  let app = open();
  app.database.create('products', { name: 'منتج', stock: 4, imageUrl: 'data:image/png;base64,abc' }, 'p1');
  app.database.create('customers', { name: 'عميل' }, 'c1');
  app.database.create('orders', { items: [{ productId: 'p1', quantity: 1 }], orderNumber: 'LEGACY' }, 'o1');
  app.database.setPreference('settings:shop', 'اسم المحل');
  const before = app.database.exportBackup();
  const target = path.join(root, 'selected-data');
  app.configure({ ...credentials, directory: target });
  assert.equal(app.dataDirectory, target);
  for (const [collection, records] of Object.entries(before.collections)) if (collection !== 'users') assert.deepEqual(app.database.list(collection), records);
  assert.deepEqual(app.database.preferences(), before.preferences);
  assert.equal(fs.existsSync(path.join(controlDirectory, 'oms.sqlite')), true);
  const recovery = new LocalDatabase(path.join(controlDirectory, 'oms.sqlite'));
  assert.deepEqual(recovery.exportBackup().collections, before.collections);
  assert.equal(recovery.hasLocalAdminCredentials(), false);
  recovery.close();
  app.close();
  app = open();
  assert.equal(app.dataDirectory, target);
  assert.equal(app.database.login(credentials.username, credentials.password).id, 'local-admin');
  assert.equal(app.database.get('products', 'p1').stock, 4);
}));

test('existing target data and nonempty directories are rejected without overwrite or adoption', () => fixture(({ root, open }) => {
  const app = open();
  const target = path.join(root, 'occupied'); fs.mkdirSync(target);
  const existing = new LocalDatabase(path.join(target, 'oms.sqlite'));
  existing.create('products', { name: 'Existing target' }, 'target-product'); existing.close();
  const contents = fs.readFileSync(path.join(target, 'oms.sqlite'));
  assert.throws(() => app.configure({ ...credentials, directory: target }), /empty|exists|existing/i);
  assert.deepEqual(fs.readFileSync(path.join(target, 'oms.sqlite')), contents);
  const unrelated = path.join(root, 'unrelated'); fs.mkdirSync(unrelated); fs.writeFileSync(path.join(unrelated, 'keep.txt'), 'keep');
  assert.throws(() => app.configure({ ...credentials, directory: unrelated }), /empty/i);
  assert.equal(fs.readFileSync(path.join(unrelated, 'keep.txt'), 'utf8'), 'keep');
  assert.equal(app.status().setupRequired, true);
}));

test('relative, UNC and device paths are rejected before switching databases', () => fixture(({ open }) => {
  const app = open(); const original = app.database;
  for (const directory of ['relative-data', '..\\data', '\\\\server\\share\\data', '//server/share/data', '\\\\?\\C:\\data', '\\\\.\\C:\\data', 'C:relative']) {
    assert.throws(() => app.configure({ ...credentials, directory }), /absolute|local|path/i);
    assert.equal(app.database, original);
    assert.equal(app.status().setupRequired, true);
  }
}));

test('failed config persistence rolls back same-directory credentials and cleans migrated files safely', () => fixture(({ root, controlDirectory, open }) => {
  const app = open();
  app.database.create('products', { name: 'Protected', stock: 5 }, 'protected');
  const original = app.database; const before = original.exportBackup();
  const configPath = path.join(controlDirectory, 'desktop-config.json');
  const rename = fs.renameSync;
  fs.renameSync = function (source, destination) { if (destination === configPath) throw new Error('Simulated config write failure'); return rename.call(fs, source, destination); };
  const target = path.join(root, 'migration-failure');
  try {
    assert.throws(() => app.configure(credentials), /config write failure/);
    assert.equal(app.database.hasLocalAdminCredentials(), false);
    assert.throws(() => app.configure({ ...credentials, directory: target }), /config write failure/);
  } finally { fs.renameSync = rename; }
  assert.equal(app.database, original);
  assert.deepEqual(app.database.exportBackup().collections, before.collections);
  assert.deepEqual(app.database.preferences(), before.preferences);
  assert.equal(fs.existsSync(configPath), false);
  assert.equal(fs.existsSync(target) && fs.readdirSync(target).length > 0, false);
  assert.equal(fs.readdirSync(controlDirectory).some(name => name.endsWith('.tmp')), false);
  app.configure(credentials);
  assert.equal(app.database.login(credentials.username, credentials.password).id, 'local-admin');
}));

test('an invalid migration backup leaves the original database open and untouched', () => fixture(({ root, open }) => {
  const app = open(); const original = app.database;
  app.database.create('products', { name: 'Protected', stock: 7 }, 'p1');
  const exportBackup = original.exportBackup.bind(original);
  original.exportBackup = () => ({ ...exportBackup(), preferences: { 'invalid-key': 'fail restore' } });
  const target = path.join(root, 'invalid-migration');
  assert.throws(() => app.configure({ ...credentials, directory: target }), /Invalid preference/);
  assert.equal(app.database, original);
  assert.equal(app.database.get('products', 'p1').stock, 7);
  assert.equal(app.database.hasLocalAdminCredentials(), false);
  assert.equal(fs.existsSync(target) && fs.readdirSync(target).length > 0, false);
}));

test('a missing configured database fails explicitly instead of silently creating an empty replacement', () => fixture(({ root, controlDirectory, open }) => {
  fs.mkdirSync(controlDirectory);
  const missing = path.join(root, 'missing-data');
  fs.writeFileSync(path.join(controlDirectory, 'desktop-config.json'), JSON.stringify({ version: 1, dataDirectory: missing }));
  assert.throws(open, /not found|missing/i);
  assert.equal(fs.existsSync(path.join(missing, 'oms.sqlite')), false);
}));
