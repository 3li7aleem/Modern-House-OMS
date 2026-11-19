const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const modulePath = path.join(__dirname, 'backups.cjs');
function fixture(t, overrides = {}) {
  assert.ok(fs.existsSync(modulePath), 'Periodic backup manager must exist');
  const { createBackupManager } = require(modulePath);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oms-backups-test-'));
  let date = new Date(2026, 10, 4, 10, 0, 0);
  let version = 1;
  let exports = 0;
  let callback;
  let milliseconds;
  let clears = 0;
  let unrefs = 0;
  let fail = false;
  const errors = [];
  const content = () => ({ format: 'modern-house-oms', version: 1, collections: { products: [{ id: 'p1', name: 'حوض', stock: version, imageUrl: 'data:image/png;base64,abc' }], users: [{ id: 'local-admin' }] }, preferences: { language: 'ar' } });
  const manager = createBackupManager({
    directory,
    exportBackup: () => { exports++; if (fail) throw new Error('simulated export failure'); return content(); },
    onError: error => errors.push(error.message),
    now: () => date,
    setInterval: (fn, delay) => { callback = fn; milliseconds = delay; return { unref() { unrefs++; } }; },
    clearInterval: () => { clears++; callback = undefined; },
    ...overrides,
  });
  t.after(() => {
    fail = false;
    try { manager.close(); }
    finally { fs.rmSync(directory, { recursive: true, force: true }); }
  });
  return {
    directory, manager, errors, content,
    files: () => fs.readdirSync(directory).sort(),
    read: filename => JSON.parse(fs.readFileSync(filename, 'utf8')),
    tick: () => { assert.ok(callback); callback(); },
    setDate: value => { date = value; },
    change: () => { version++; manager.markDirty(); },
    failure: value => { fail = value; },
    stats: () => ({ exports, milliseconds, clears, unrefs }),
  };
}

test('startup saves local daily history and a fresh snapshot and starts one unref timer', t => {
  const f = fixture(t);
  f.manager.start();
  assert.ok(f.files().includes('daily-2026-11-04.oms-backup.json'));
  const snapshots = f.files().filter(name => name.startsWith('snapshot-'));
  assert.equal(snapshots.length, 1);
  assert.deepEqual(f.read(path.join(f.directory, snapshots[0])), f.content());
  assert.equal(f.stats().milliseconds, 15 * 60 * 1000);
  assert.equal(f.stats().unrefs, 1);
  const before = f.stats().exports;
  f.manager.start();
  assert.equal(f.stats().exports, before);
});

test('idle timer does not duplicate snapshots; dirty timer persists latest data once', t => {
  const f = fixture(t);
  f.manager.start();
  const initial = f.files().length;
  const exports = f.stats().exports;
  f.tick();
  assert.equal(f.files().length, initial);
  assert.equal(f.stats().exports, exports);
  f.change();
  f.change();
  f.tick();
  const snapshots = f.files().filter(name => name.startsWith('snapshot-'));
  assert.equal(snapshots.length, 2);
  assert.deepEqual(f.read(path.join(f.directory, snapshots.at(-1))), f.content());
  f.tick();
  assert.equal(f.files().length, initial + 1);
});

test('periodic backup failure reports error and retries dirty data on the next tick', t => {
  const f = fixture(t);
  f.manager.start();
  f.change();
  f.failure(true);
  assert.doesNotThrow(f.tick);
  assert.deepEqual(f.errors, ['simulated export failure']);
  assert.equal(f.files().filter(name => name.startsWith('snapshot-')).length, 1);
  f.failure(false);
  f.tick();
  assert.equal(f.files().filter(name => name.startsWith('snapshot-')).length, 2);
  f.tick();
  assert.equal(f.files().filter(name => name.startsWith('snapshot-')).length, 2);
});

test('startup export failure still starts retry timer and does not prevent using the app', t => {
  const f = fixture(t);
  f.failure(true);
  assert.doesNotThrow(() => f.manager.start());
  assert.equal(f.stats().milliseconds, 15 * 60 * 1000);
  assert.deepEqual(f.errors, ['simulated export failure']);
  assert.equal(f.files().length, 0);
  f.failure(false);
  f.tick();
  assert.equal(f.files().filter(name => name.startsWith('daily-')).length, 1);
  assert.equal(f.files().filter(name => name.startsWith('snapshot-')).length, 1);
  f.tick();
  assert.equal(f.files().length, 2);
});

test('shutdown clears the timer and saves dirty changes exactly once', t => {
  const f = fixture(t);
  f.manager.start();
  f.change();
  f.manager.close();
  assert.equal(f.stats().clears, 1);
  const snapshots = f.files().filter(name => name.startsWith('snapshot-'));
  assert.equal(snapshots.length, 2);
  assert.deepEqual(f.read(path.join(f.directory, snapshots.at(-1))), f.content());
  f.manager.close();
  assert.equal(f.files().filter(name => name.startsWith('snapshot-')).length, 2);
});

test('manual exports and pre-restore copies preserve format and do not hide dirty automatic data', t => {
  const f = fixture(t);
  f.manager.start();
  f.change();
  const manual = path.join(f.directory, 'my-manual-export.json');
  assert.equal(f.manager.write(manual), manual);
  assert.deepEqual(f.read(manual), f.content());
  const before = f.manager.beforeRestore();
  assert.match(path.basename(before), /^before-restore-.*\.oms-backup\.json$/);
  assert.deepEqual(f.read(before), f.content());
  assert.ok(f.manager.flush('test'));
  assert.equal(f.manager.flush('test'), null);
});

test('local calendar determines daily name and a new day is captured during the running session', t => {
  const f = fixture(t);
  // A local midnight date can belong to the previous UTC date on this machine.
  f.setDate(new Date(2026, 10, 5, 0, 1, 0));
  assert.match(path.basename(f.manager.daily()), /^daily-2026-11-05\.oms-backup\.json$/);
  f.manager.start();
  f.setDate(new Date(2026, 10, 6, 0, 1, 0));
  f.change();
  f.tick();
  assert.ok(f.files().includes('daily-2026-11-06.oms-backup.json'));
});

test('retention keeps 14 daily files and 48 snapshots and preserves manual and pre-restore files', t => {
  const f = fixture(t);
  const protectedFiles = ['manual.oms-backup.json', 'before-restore-123.oms-backup.json', 'daily-not-a-date.oms-backup.json', 'snapshot-not-generated.json'];
  for (const name of protectedFiles) fs.writeFileSync(path.join(f.directory, name), 'preserve');
  f.manager.start();
  for (let day = 1; day <= 20; day++) {
    f.setDate(new Date(2026, 11, day, 10, 0, 0));
    f.manager.daily();
  }
  for (let i = 0; i < 55; i++) { f.change(); f.manager.flush('test'); }
  const files = f.files();
  assert.equal(files.filter(name => /^daily-\d{4}-\d{2}-\d{2}\.oms-backup\.json$/.test(name)).length, 14);
  assert.equal(files.filter(name => /^snapshot-.*\.oms-backup\.json$/.test(name)).length, 48);
  assert.ok(files.includes('daily-2026-12-20.oms-backup.json'));
  assert.ok(!files.includes('daily-2026-12-01.oms-backup.json'));
  for (const name of protectedFiles) assert.equal(fs.readFileSync(path.join(f.directory, name), 'utf8'), 'preserve');
});

test('fresh manager preserves same-day daily file while creating a fresh startup snapshot', t => {
  const f = fixture(t);
  const existing = path.join(f.directory, 'daily-2026-11-04.oms-backup.json');
  fs.writeFileSync(existing, JSON.stringify({ previous: true }));
  fs.writeFileSync(path.join(f.directory, 'snapshot-1793786400000-0001.oms-backup.json'), JSON.stringify({ earlier: true }));
  f.manager.start();
  assert.deepEqual(f.read(existing), { previous: true });
  assert.equal(f.files().filter(name => name.startsWith('snapshot-')).length, 2);
});

test('failed atomic replacement preserves old export and cleans temporary file', t => {
  const f = fixture(t);
  const destination = path.join(f.directory, 'cannot-replace.json');
  fs.mkdirSync(destination);
  fs.writeFileSync(path.join(destination, 'sentinel'), 'keep');
  assert.throws(() => f.manager.write(destination));
  assert.equal(fs.readFileSync(path.join(destination, 'sentinel'), 'utf8'), 'keep');
  assert.ok(!f.files().some(name => name.endsWith('.tmp')));
  f.failure(true);
  assert.throws(() => f.manager.write(path.join(f.directory, 'manual.json')), /simulated export failure/);
});

test('failed shutdown keeps dirty state for an explicit retry', t => {
  const f = fixture(t);
  f.manager.start();
  f.change();
  f.failure(true);
  assert.throws(() => f.manager.close(), /simulated export failure/);
  f.failure(false);
  f.manager.close();
  assert.equal(f.files().filter(name => name.startsWith('snapshot-')).length, 2);
});
