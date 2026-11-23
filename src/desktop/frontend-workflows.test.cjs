const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('esbuild');

const root = path.resolve(__dirname, '../..');
const product = { id: 'p1', name: 'Lamp', sku: 'L1', barcode: '', category: 'Lights', supplierId: '', purchasePrice: 3, salePrice: 10, stock: 10, lowStockThreshold: 2, status: 'Active' };
const orderData = { date: '2026-11-03', customerId: 'c1', items: [{ productId: 'p1', quantity: 2, price: 10 }], subtotal: 20, discount: 0, total: 20, paymentMethod: 'Cash', employeeId: 'u1' };
const savedOrder = { ...orderData, id: 'o1', orderNumber: 'ORD-actual-123', status: 'Completed' };
const quotation = { id: 'q1', customerId: 'c1', customerName: 'Customer', customerPhone: '123', items: [{ productId: 'p1', quantity: 2, unitPrice: 10 }], subtotal: 20, discount: 0, total: 20, status: 'Accepted' };

function hooks(initial = {}) {
  const states = [];
  let index = 0;
  const react = {
    createContext: () => ({ Provider: 'Provider' }),
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState: value => {
      const key = index++;
      states[key] = Object.hasOwn(initial, key) ? initial[key] : typeof value === 'function' ? value() : value;
      return [states[key], next => { states[key] = typeof next === 'function' ? next(states[key]) : next; }];
    },
    useEffect: () => {},
    useMemo: callback => callback(),
    useCallback: callback => callback,
    useRef: value => ({ current: value }),
    useContext: () => { throw new Error('Unexpected useContext'); }
  };
  return { react, states };
}

function load(relative, dependencies, browser = {}) {
  const filename = path.join(root, relative);
  const code = transformSync(fs.readFileSync(filename, 'utf8'), { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code;
  const exports = {};
  const sandbox = {
    exports, module: { exports },
    require: id => {
      if (Object.hasOwn(dependencies, id)) return dependencies[id];
      if (id === 'lucide-react') return new Proxy({}, { get: (_target, name) => String(name) });
      if (id === 'motion/react') return { motion: new Proxy({}, { get: (_target, name) => String(name) }), AnimatePresence: 'AnimatePresence' };
      if (id.includes('aiService')) return new Proxy({}, { get: (_target, name) => () => [] });
      if (id.startsWith('../components/')) return new Proxy({ __esModule: true, default: id }, { get: (target, name) => target[name] || String(name) });
      throw new Error(`Unstubbed dependency ${id}`);
    },
    window: browser,
    localStorage: { getItem: () => null, setItem: () => {} },
    console: { error: () => {}, log: () => {} },
    alert: browser.alert || (message => { throw new Error(message); }),
    confirm: () => true
  };
  vm.runInNewContext(code, sandbox, { filename });
  return sandbox.module.exports;
}

function provider({ desktop = true, initial = {}, call = async () => savedOrder } = {}) {
  const calls = [];
  const serviceWrites = [];
  const { react } = hooks({ 2: [product], 3: [savedOrder], 4: [{ id: 'c1', name: 'Customer' }], 10: [{ id: 'po1', status: 'Pending', items: [{ productId: 'p1', quantity: 2 }] }], 14: [quotation], ...initial });
  const services = Object.fromEntries(['Product', 'Order', 'Customer', 'Expense', 'Supplier', 'Driver', 'Delivery', 'PurchaseOrder', 'Request', 'Repair', 'Quotation', 'KitchenContract', 'Notification', 'User'].map(name => [name + 'Service', Object.fromEntries(['add', 'update', 'delete'].map(method => [method, async (...args) => { serviceWrites.push([name, method, ...args]); return savedOrder; }]))]));
  const bridge = { call: async (...args) => { calls.push(args); return call(...args); } };
  const { AppProvider } = load('contexts/AppContext.tsx', {
    react,
    '../constants': { ROLE_PERMISSIONS: {} },
    '../src/firebaseService': services,
    '../src/firebase': { auth: {} },
    '../src/utils/imageUtils': {}
  }, desktop ? { omsDesktop: bridge } : {});
  const value = AppProvider({ children: null }).props.value;
  return { value, calls, serviceWrites };
}

const plain = value => JSON.parse(JSON.stringify(value));

test('desktop order creation makes one domain call with request and delivery options', async () => {
  const { value, calls, serviceWrites } = provider();
  assert.equal(await value.addOrder(orderData, 'charge', 'r1'), savedOrder.id);
  assert.deepEqual(plain(calls), [['saveOrder', orderData, { deliveryOption: 'charge', requestId: 'r1' }]]);
  assert.deepEqual(serviceWrites, []);
});

test('desktop update uses the database original order, without client stock writes', async () => {
  const { value, calls, serviceWrites } = provider();
  await value.updateOrder('o1', orderData, [{ productId: 'stale-product', quantity: 99, price: 1 }]);
  assert.deepEqual(plain(calls), [['saveOrder', orderData, { id: 'o1' }]]);
  assert.deepEqual(serviceWrites, []);
});

test('desktop delete and PO receipt each use one atomic operation', async () => {
  const { value, calls, serviceWrites } = provider();
  await value.deleteOrder('o1');
  await value.receivePurchaseOrder('po1');
  assert.deepEqual(plain(calls), [['deleteOrder', 'o1'], ['receivePurchaseOrder', 'po1']]);
  assert.deepEqual(serviceWrites, []);
});

test('desktop PO receipt propagates failed transactions to its caller', async () => {
  const { value } = provider({ call: async () => { throw new Error('Invalid stock'); } });
  await assert.rejects(value.receivePurchaseOrder('po1'), /Invalid stock/);
});

test('quotation conversion commits its linkage in saveOrder and skips separate updates', async () => {
  const { value, calls, serviceWrites } = provider();
  assert.equal(await value.convertQuotationToOrder('q1', 'free'), 'o1');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'saveOrder');
  assert.deepEqual(plain(calls[0][2]), { deliveryOption: 'free', quotationId: 'q1' });
  assert.deepEqual(serviceWrites, []);
});

test('repeated quotation conversion returns its existing order before customer creation', async () => {
  const { value, calls, serviceWrites } = provider({ initial: { 14: [{ ...quotation, customerId: undefined, status: 'Converted', convertedOrderId: 'existing-order' }] } });
  assert.equal(await value.convertQuotationToOrder('q1'), 'existing-order');
  assert.deepEqual(calls, []);
  assert.deepEqual(serviceWrites, []);
});

test('browser order creation keeps existing service workflow', async () => {
  const { value, calls, serviceWrites } = provider({ desktop: false });
  assert.equal(await value.addOrder(orderData, 'none'), savedOrder.id);
  assert.deepEqual(calls, []);
  assert.ok(serviceWrites.some(([name, method]) => name === 'Order' && method === 'add'));
  assert.ok(serviceWrites.some(([name, method]) => name === 'Product' && method === 'update'));
});

function findButton(node, callbackName) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'button' && node.props.onClick?.name === callbackName) return node;
  for (const child of node.props?.children || []) {
    for (const nested of Array.isArray(child) ? child : [child]) {
      const found = findButton(nested, callbackName);
      if (found) return found;
    }
  }
  return null;
}

test('POS prints the persisted desktop order number after checkout', async () => {
  const calls = [];
  const { react, states } = hooks({ 4: [{ product, quantity: 2 }], 8: 'u1' });
  const { default: PosScreen } = load('screens/POSScreen.tsx', {
    react,
    '../contexts/AppContext': { useAppContext: () => ({ products: [product], customers: [], employees: [{ id: 'u1', name: 'Cashier' }], orders: [], currentUser: { id: 'u1' }, addOrder: async () => 'o1' }) },
    '../contexts/LanguageContext': { useTranslation: () => ({ language: 'en', t: value => value, formatCurrency: value => String(value) }) },
    '../components/pos/posAudio': { getPosSoundEnabled: () => false, playSuccessChime: () => {}, playErrorTone: () => {} }
  }, { omsDesktop: { call: async (...args) => { calls.push(args); return savedOrder; } } });
  const checkout = findButton(PosScreen(), 'handleCheckout');
  assert.ok(checkout, 'Checkout button exists');
  await checkout.props.onClick();
  assert.deepEqual(plain(calls), [['get', 'orders', 'o1']]);
  assert.equal(states[29]?.order.orderNumber, savedOrder.orderNumber);
  assert.deepEqual(plain(states[29]?.order), savedOrder);
  assert.equal(states[4].length, 0);
});

for (const failure of ['read error', 'missing record']) {
  test(`POS clears a committed sale and explains receipt failure: ${failure}`, async () => {
    const alerts = [];
    const { react, states } = hooks({ 4: [{ product, quantity: 2 }], 8: 'u1' });
    const { default: PosScreen } = load('screens/POSScreen.tsx', {
      react,
      '../contexts/AppContext': { useAppContext: () => ({ products: [product], customers: [], employees: [{ id: 'u1', name: 'Cashier' }], orders: [], currentUser: { id: 'u1' }, addOrder: async () => 'o1' }) },
      '../contexts/LanguageContext': { useTranslation: () => ({ language: 'en', t: value => value, formatCurrency: value => String(value) }) },
      '../components/pos/posAudio': { getPosSoundEnabled: () => false, playSuccessChime: () => {}, playErrorTone: () => {} }
    }, {
      alert: message => alerts.push(message),
      omsDesktop: { call: async () => { if (failure === 'read error') throw new Error('Receipt read failed'); return null; } }
    });
    await findButton(PosScreen(), 'handleCheckout').props.onClick();
    assert.equal(states[4].length, 0, 'A saved order must not be submitted again from the same cart');
    assert.equal(states[29], null);
    assert.equal(alerts.length, 1);
    assert.match(alerts[0], /saved.*o1.*receipt/i);
  });
}
