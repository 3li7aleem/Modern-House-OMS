const fs = require('node:fs');
const path = require('node:path');
const { LocalDatabase } = require('./database.cjs');

function validateLocalPath(dirPath) {
  if (typeof dirPath !== 'string' || !dirPath.trim()) {
    throw new Error('Database path must be an absolute local directory');
  }
  const clean = dirPath.trim();
  if (clean.startsWith('\\\\?\\') || clean.startsWith('\\\\.\\') || clean.startsWith('\\\\') || clean.startsWith('//')) {
    throw new Error('UNC and device paths are not supported; please choose a local path');
  }
  if (!path.isAbsolute(clean)) {
    throw new Error('Database path must be an absolute path');
  }
  // Check on Windows for drive letter followed by slash (e.g. C:\ or C:/), reject "C:relative"
  if (/^[a-zA-Z]:[^\\/]/.test(clean)) {
    throw new Error('Path must be an absolute directory, not a drive-relative path');
  }
  return path.resolve(clean);
}

function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = path.join(dir, `${path.basename(filePath)}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  try {
    fs.renameSync(tmpPath, filePath);
  } catch (error) {
    try { fs.rmSync(tmpPath, { force: true }); } catch {}
    throw error;
  }
}

class InstallationManager {
  constructor({ controlDirectory }) {
    this.controlDirectory = path.resolve(controlDirectory);
    this.configPath = path.join(this.controlDirectory, 'desktop-config.json');
    this.dataDirectory = this.controlDirectory;

    if (fs.existsSync(this.configPath)) {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      if (config.dataDirectory) {
        const resolved = path.resolve(config.dataDirectory);
        const dbFile = path.join(resolved, 'oms.sqlite');
        if (!fs.existsSync(dbFile)) {
          throw new Error(`Configured database file not found at: ${dbFile}`);
        }
        this.dataDirectory = resolved;
      }
    } else {
      fs.mkdirSync(this.controlDirectory, { recursive: true });
    }

    this.database = new LocalDatabase(path.join(this.dataDirectory, 'oms.sqlite'));
  }

  status() {
    const setupRequired = !this.database.hasLocalAdminCredentials();
    return {
      setupRequired,
      defaultDirectory: this.controlDirectory,
      currentDirectory: this.dataDirectory
    };
  }

  configure({ username, password, directory }) {
    if (this.database.hasLocalAdminCredentials()) {
      throw new Error('Local admin is already configured');
    }

    const targetDir = directory ? validateLocalPath(directory) : this.controlDirectory;
    const isMigration = targetDir !== this.dataDirectory;

    if (isMigration) {
      if (fs.existsSync(targetDir)) {
        const entries = fs.readdirSync(targetDir);
        if (entries.length > 0) {
          throw new Error('Target directory already exists and is not empty');
        }
      }

      const backup = this.database.exportBackup();
      const targetDbFile = path.join(targetDir, 'oms.sqlite');
      let newDb = null;
      let createdTarget = false;

      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
          createdTarget = true;
        }

        newDb = new LocalDatabase(targetDbFile);
        newDb.restoreBackup(backup);
        newDb.setLocalAdminCredentials(username, password);

        writeJsonAtomic(this.configPath, {
          version: 1,
          dataDirectory: targetDir
        });

        this.database.close();
        this.database = newDb;
        this.dataDirectory = targetDir;

        return { setupRequired: false };
      } catch (error) {
        if (newDb) {
          try { newDb.close(); } catch {}
        }
        try {
          if (fs.existsSync(targetDbFile)) fs.rmSync(targetDbFile, { force: true });
          if (fs.existsSync(`${targetDbFile}-wal`)) fs.rmSync(`${targetDbFile}-wal`, { force: true });
          if (fs.existsSync(`${targetDbFile}-shm`)) fs.rmSync(`${targetDbFile}-shm`, { force: true });
          if (createdTarget && fs.existsSync(targetDir) && fs.readdirSync(targetDir).length === 0) {
            fs.rmdirSync(targetDir);
          }
        } catch {}
        throw error;
      }
    } else {
      // Same directory configuration
      const oldAdmin = this.database.rawRecord('users', 'local-admin');
      const hadCredentials = this.database.hasLocalAdminCredentials();

      this.database.setLocalAdminCredentials(username, password);

      try {
        writeJsonAtomic(this.configPath, {
          version: 1,
          dataDirectory: this.controlDirectory
        });
        return { setupRequired: false };
      } catch (error) {
        // Rollback credentials
        if (!hadCredentials) {
          const revert = { ...oldAdmin };
          delete revert.passwordHash;
          delete revert.username;
          this.database.db.prepare('UPDATE records SET data = ? WHERE collection = ? AND id = ?')
            .run(JSON.stringify(revert), 'users', 'local-admin');
        }
        throw error;
      }
    }
  }

  close() {
    if (this.database) {
      try { this.database.close(); } catch {}
      this.database = null;
    }
  }
}

function createInstallation(options) {
  return new InstallationManager(options);
}

module.exports = { createInstallation, InstallationManager };
