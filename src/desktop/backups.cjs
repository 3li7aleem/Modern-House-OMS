const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const DAILY_FILE = /^daily-\d{4}-\d{2}-\d{2}\.oms-backup\.json$/;
const SNAPSHOT_FILE = /^snapshot-\d{13,}-\d+\.oms-backup\.json$/;

function createBackupManager({
  directory,
  exportBackup,
  onError = error => console.error('Automatic backup failed:', error),
  now = () => new Date(),
  setInterval: schedule = global.setInterval,
  clearInterval: cancel = global.clearInterval,
  intervalMs = 15 * 60 * 1000,
}) {
  if (typeof directory !== 'string' || !directory || typeof exportBackup !== 'function') throw new TypeError('Backup directory and export function are required');
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) throw new TypeError('Invalid backup interval');
  let dirty = false;
  let started = false;
  let timer = null;
  let sequence = 0;

  const clock = () => {
    const date = new Date(now());
    if (!Number.isFinite(date.getTime())) throw new Error('Invalid backup date');
    return date;
  };
  const dailyFilename = date => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return path.join(directory, `daily-${date.getFullYear()}-${month}-${day}.oms-backup.json`);
  };
  const uniqueFilename = (prefix, date) => {
    let filename;
    do { filename = path.join(directory, `${prefix}-${date.getTime()}-${String(++sequence).padStart(4, '0')}.oms-backup.json`); }
    while (fs.existsSync(filename));
    return filename;
  };
  const writeData = (filename, data) => {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    const temporary = `${filename}.${randomUUID()}.tmp`;
    let descriptor;
    try {
      descriptor = fs.openSync(temporary, 'wx', 0o600);
      fs.writeFileSync(descriptor, JSON.stringify(data), 'utf8');
      fs.fsyncSync(descriptor);
      fs.closeSync(descriptor);
      descriptor = undefined;
      fs.renameSync(temporary, filename);
      return filename;
    } catch (error) {
      if (descriptor !== undefined) { try { fs.closeSync(descriptor); } catch {} }
      try { fs.unlinkSync(temporary); } catch {}
      throw error;
    }
  };
  const prune = (pattern, keep) => {
    const names = fs.readdirSync(directory).filter(name => pattern.test(name)).sort().reverse();
    for (const name of names.slice(keep)) {
      const filename = path.join(directory, name);
      // Never descend into a directory that happens to match a generated name.
      if (fs.lstatSync(filename).isFile()) fs.unlinkSync(filename);
    }
  };
  const ensureDaily = (date, data) => {
    fs.mkdirSync(directory, { recursive: true });
    const filename = dailyFilename(date);
    if (!fs.existsSync(filename)) writeData(filename, data === undefined ? exportBackup() : data);
    prune(DAILY_FILE, 14);
    return filename;
  };
  const report = error => {
    try { onError(error); } catch (callbackError) { console.error('Backup error reporting failed:', callbackError); }
  };
  const manager = {
    start() {
      if (started) return;
      started = true;
      // Schedule retries even if the startup export cannot be written.
      timer = schedule(() => {
        try { manager.flush('periodic'); } catch (error) { report(error); }
      }, intervalMs);
      if (timer && typeof timer.unref === 'function') timer.unref();
      dirty = true;
      try { manager.flush('startup'); } catch (error) { report(error); }
    },
    markDirty() { dirty = true; },
    flush(_reason = 'manual') {
      if (!dirty) return null;
      const date = clock();
      const data = exportBackup();
      ensureDaily(date, data);
      const filename = writeData(uniqueFilename('snapshot', date), data);
      prune(SNAPSHOT_FILE, 48);
      dirty = false;
      return filename;
    },
    daily() { return ensureDaily(clock()); },
    beforeRestore() { return writeData(uniqueFilename('before-restore', clock()), exportBackup()); },
    write(filename) { return writeData(filename, exportBackup()); },
    close() {
      if (started) {
        cancel(timer);
        timer = null;
        started = false;
      }
      return manager.flush('shutdown');
    },
  };
  return manager;
}

module.exports = { createBackupManager };
