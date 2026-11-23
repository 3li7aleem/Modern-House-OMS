const fs = require('node:fs');
const path = require('node:path');

let firebaseConfig = null;
try {
  const localCfgPath = path.join(__dirname, 'firebase-applet-config.json');
  const rootCfgPath = path.resolve(__dirname, '../../firebase-applet-config.json');
  if (fs.existsSync(localCfgPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(localCfgPath, 'utf8'));
  } else if (fs.existsSync(rootCfgPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(rootCfgPath, 'utf8'));
  }
} catch (e) {
  console.warn('[CloudSync] Could not load firebase config:', e.message);
}

function parseFirestoreDoc(fields) {
  if (!fields) return null;
  const parseVal = (v) => {
    if (!v) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('doubleValue' in v) return Number(v.doubleValue);
    if ('integerValue' in v) return Number(v.integerValue);
    if ('booleanValue' in v) return Boolean(v.booleanValue);
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(parseVal);
    if ('mapValue' in v) {
      const res = {};
      for (const [k, val] of Object.entries(v.mapValue.fields || {})) {
        res[k] = parseVal(val);
      }
      return res;
    }
    return null;
  };
  const obj = {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = parseVal(v);
  }
  return obj;
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Pushes a local order to Firestore (Desktop -> Cloud)
 */
async function syncOrderToFirestore(order) {
  if (!firebaseConfig || !order) return false;
  try {
    const docId = order.id || order.orderNumber;
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/orders/${encodeURIComponent(docId)}?key=${firebaseConfig.apiKey}`;
    
    const payload = {
      fields: {
        userId: { stringValue: order.userId || 'local-admin' },
        orderNumber: { stringValue: order.orderNumber || docId },
        customerId: { stringValue: order.customerId || 'walk-in' },
        customerName: { stringValue: order.customerName || 'عميل نقدي' },
        items: toFirestoreValue(order.items || []),
        subtotal: { doubleValue: Number(order.subtotal || order.total || 0) },
        discount: { doubleValue: Number(order.discount || 0) },
        total: { doubleValue: Number(order.total || 0) },
        paymentMethod: { stringValue: order.paymentMethod || 'Cash' },
        employeeId: { stringValue: order.employeeId || order.userId || 'local-admin' },
        status: { stringValue: order.status || 'Completed' },
        date: { stringValue: order.date || new Date().toISOString() }
      }
    };

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log(`[CloudSync] Pushed order ${order.orderNumber} (${docId}) to Cloud.`);
      return true;
    } else {
      const errText = await res.text();
      console.warn(`[CloudSync] Failed to push order ${order.orderNumber}:`, errText);
      return false;
    }
  } catch (err) {
    console.warn(`[CloudSync] Push error:`, err.message);
    return false;
  }
}

/**
 * Updates a product's stock in Firestore (Desktop -> Cloud)
 */
async function syncProductStockToFirestore(productId, newStock) {
  if (!firebaseConfig || !productId) return false;
  try {
    const patchUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/products/${encodeURIComponent(productId)}?updateMask.fieldPaths=stock&key=${firebaseConfig.apiKey}`;
    const res = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          stock: { integerValue: String(Math.max(0, Math.floor(newStock))) }
        }
      })
    });
    if (res.ok) {
      console.log(`[CloudSync] Updated stock in Firestore for product ${productId} to ${newStock}.`);
      return true;
    }
  } catch (err) {
    console.warn(`[CloudSync] Stock sync error for ${productId}:`, err.message);
  }
  return false;
}

/**
 * Pulls all orders from Firestore into local SQLite (Cloud -> Desktop)
 */
async function pullOrdersFromFirestore(db, win) {
  if (!firebaseConfig || !db || !db.db) return 0;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents:runQuery?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'orders' }] } })
    });

    if (!res.ok) return 0;

    const data = await res.json();
    if (!Array.isArray(data)) return 0;

    const remoteOrders = data.filter(d => d.document).map(d => ({
      id: d.document.name.split('/').pop(),
      ...parseFirestoreDoc(d.document.fields)
    }));

    if (remoteOrders.length === 0) return 0;

    const localRows = db.db.prepare('SELECT id, data FROM records WHERE collection = ?').all('orders');
    const localMap = new Map();
    for (const r of localRows) {
      try {
        localMap.set(r.id, JSON.parse(r.data));
      } catch {}
    }

    let changedCount = 0;
    const insertStmt = db.db.prepare('INSERT OR REPLACE INTO records VALUES (?, ?, ?)');

    for (const rOrder of remoteOrders) {
      const existing = localMap.get(rOrder.id);
      
      // Check if order is new or updated
      if (!existing || existing.orderNumber !== rOrder.orderNumber || existing.status !== rOrder.status || Number(existing.total) !== Number(rOrder.total)) {
        insertStmt.run('orders', rOrder.id, JSON.stringify(rOrder));
        changedCount++;
      }
    }

    if (changedCount > 0) {
      console.log(`[CloudSync] Pulled and synced ${changedCount} orders from Cloud into local SQLite.`);
      if (win && !win.isDestroyed()) {
        win.webContents.send('oms:changed', 'orders');
        win.webContents.send('oms:changed', 'products');
      }
    }

    return changedCount;
  } catch (err) {
    console.warn('[CloudSync] Pull error:', err.message);
    return 0;
  }
}

/**
 * Synchronizes product stocks and catalog between Firestore and local SQLite
 */
async function syncProductsBidirectional(db, win) {
  if (!firebaseConfig || !db || !db.db) return;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents:runQuery?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'products' }], limit: 300 } })
    });

    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data)) return;

    const fireProds = data.filter(d => d.document).map(d => ({
      id: d.document.name.split('/').pop(),
      ...parseFirestoreDoc(d.document.fields)
    }));

    const localRows = db.db.prepare('SELECT id, data FROM records WHERE collection = ?').all('products');
    const localMap = new Map();
    for (const r of localRows) {
      try {
        localMap.set(r.id, JSON.parse(r.data));
      } catch {}
    }

    let productsUpdated = false;
    const updateStmt = db.db.prepare('INSERT OR REPLACE INTO records VALUES (?, ?, ?)');

    for (const fp of fireProds) {
      const lp = localMap.get(fp.id);
      if (lp) {
        if (Number(lp.stock) !== Number(fp.stock)) {
          lp.stock = Number(fp.stock);
          updateStmt.run('products', lp.id, JSON.stringify(lp));
          productsUpdated = true;
        }
      } else {
        updateStmt.run('products', fp.id, JSON.stringify(fp));
        productsUpdated = true;
      }
    }

    if (productsUpdated && win && !win.isDestroyed()) {
      win.webContents.send('oms:changed', 'products');
    }
  } catch (err) {
    console.warn('[CloudSync] syncProductsBidirectional error:', err.message);
  }
}

/**
 * Pushes any local orders that might be missing in Firestore
 */
async function syncAllLocalOrders(db) {
  if (!db || typeof db.raw !== 'function') return;
  try {
    const orders = db.raw('orders') || [];
    for (const order of orders) {
      await syncOrderToFirestore(order);
    }
  } catch (err) {
    console.warn('[CloudSync] syncAllLocalOrders error:', err.message);
  }
}

let syncInProgress = false;

/**
 * Full bidirectional sync cycle: Pulls orders & reconciles product stocks in real time
 */
async function syncBidirectional(db, win) {
  if (syncInProgress) return;
  syncInProgress = true;
  try {
    await pullOrdersFromFirestore(db, win);
    await syncProductsBidirectional(db, win);
    await syncAllLocalOrders(db);
  } catch (e) {
    console.warn('[CloudSync] Bidirectional sync cycle error:', e.message);
  } finally {
    syncInProgress = false;
  }
}

module.exports = {
  syncOrderToFirestore,
  syncProductStockToFirestore,
  pullOrdersFromFirestore,
  syncProductsBidirectional,
  syncAllLocalOrders,
  syncBidirectional
};
