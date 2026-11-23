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
  console.warn('Could not load firebase config for cloud sync:', e.message);
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

async function syncOrderToFirestore(order) {
  if (!firebaseConfig || !order) return false;
  try {
    const docId = order.id || order.orderNumber;
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/orders/${encodeURIComponent(docId)}?key=${firebaseConfig.apiKey}`;
    
    // Ensure all required fields for isValidOrder are present
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
      console.log(`[CloudSync] Synced order ${order.orderNumber || docId} to Firestore.`);
      return true;
    } else {
      const errText = await res.text();
      console.warn(`[CloudSync] Failed to sync order ${order.orderNumber}:`, errText);
      return false;
    }
  } catch (err) {
    console.warn(`[CloudSync] Network offline or sync error:`, err.message);
    return false;
  }
}

async function syncAllLocalOrders(db) {
  if (!db || typeof db.list !== 'function') return;
  try {
    const orders = db.list('orders') || [];
    console.log(`[CloudSync] Starting background sync for ${orders.length} orders...`);
    for (const order of orders) {
      await syncOrderToFirestore(order);
    }
  } catch (err) {
    console.warn('[CloudSync] syncAllLocalOrders error:', err.message);
  }
}

module.exports = {
  syncOrderToFirestore,
  syncAllLocalOrders
};
