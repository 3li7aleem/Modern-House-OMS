const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { transformSync, build } = require('esbuild');
const root = path.resolve(__dirname, '../..');
const user = { id: 'u1', name: 'Manager', email: 'manager@local', role: 'Admin', permissions: ['dashboard'], status: 'Active' };
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

function evaluate(relative, dependencies, globals = {}) {
  const filename = path.join(root, relative);
  const code = transformSync(fs.readFileSync(filename, 'utf8'), { loader: relative.endsWith('.tsx') ? 'tsx' : 'ts', format: 'cjs', jsx: 'transform', supported: { 'dynamic-import': false } }).code;
  const exports = {};
  const sandbox = { exports, module: { exports }, console: { error: () => {}, log: () => {} }, ...globals };
  sandbox.require = id => {
    if (Object.hasOwn(dependencies, id)) return dependencies[id];
    if (id === 'lucide-react') return new Proxy({}, { get: (_target, name) => String(name) });
    if (id.startsWith('../components/')) return { __esModule: true, default: id, StorageImage: 'StorageImage' };
    throw new Error(`Unexpected import ${id}`);
  };
  vm.runInNewContext(code, sandbox, { filename });
  return sandbox.module.exports;
}

function reactHarness(initial = {}) {
  let cursor = 0;
  const states = [], effects = [];
  const react = {
    createContext: () => ({ Provider: 'Provider' }),
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState: initialValue => { const key = cursor++; states[key] = Object.hasOwn(initial, key) ? initial[key] : typeof initialValue === 'function' ? initialValue() : initialValue; return [states[key], value => { states[key] = typeof value === 'function' ? value(states[key]) : value; }]; },
    useEffect: callback => effects.push(callback), useMemo: callback => callback(), useCallback: callback => callback,
    useRef: value => ({ current: value })
  };
  return { react, states, effects };
}

function providerHarness({ pinSession = null, profile = async () => user } = {}) {
  const initial = Object.fromEntries(Array.from({ length: 13 }, (_, index) => [index + 2, [{ id: 'private-data' }]]));
  const hooks = reactHarness({ ...initial, 0: user, 15: 'oms' });
  let session;
  const subscriptions = [], writes = [];
  const services = {
    authService: { onAuthStateChanged: callback => { session = callback; return () => {}; }, logout: async () => {}, loginWithPin: async pin => ({ ...user, pin }) },
    subscribeToCollection: (collection, setter) => { const record = { collection, setter, stopped: false }; subscriptions.push(record); return () => { record.stopped = true; }; },
    UserService: { getProfile: profile, add: async value => { writes.push(value); } }
  };
  const { AppProvider } = evaluate('contexts/AppContext.tsx', {
    react: hooks.react, '../constants': { ROLE_PERMISSIONS: { Admin: ['dashboard'] } },
    '../src/firebaseService': services, '../src/firebase': { auth: {} }, '../src/utils/imageUtils': {}
  }, { window: { omsDesktop: {} }, localStorage: { getItem: () => pinSession, removeItem: () => {} } });
  const value = AppProvider({ children: null }).props.value;
  const cleanup = hooks.effects[0]();
  return { ...hooks, value, session: value => session(value), subscriptions, writes, cleanup };
}

test('logged-out desktop sessions clear private data and never subscribe to public products', async () => {
  const app = providerHarness();
  await app.session(null);
  assert.equal(app.states[0], null);
  assert.equal(app.states[15], 'website');
  assert.equal(app.subscriptions.length, 0);
  for (let index = 2; index <= 14; index++) assert.equal(app.states[index].length, 0, `private state ${index}`);
  app.cleanup();
});

test('desktop ignores a stale browser PIN session instead of recreating an admin session', async () => {
  const app = providerHarness({ pinSession: 'admin_pin_user' });
  await app.session(null);
  assert.equal(app.states[0], null);
  assert.equal(app.subscriptions.length, 0);
  app.cleanup();
});

test('a delayed profile cannot restore a user or subscriptions after logout', async () => {
  const pending = deferred();
  const app = providerHarness({ profile: () => pending.promise });
  const sessionTask = app.session({ uid: 'u1', email: user.email });
  await app.session(null);
  pending.resolve(user);
  await sessionTask;
  assert.equal(app.states[0], null);
  assert.equal(app.states[15], 'website');
  assert.ok(app.subscriptions.every(subscription => subscription.stopped));
  for (const subscription of app.subscriptions) subscription.setter([{ id: 'stale-result' }]);
  for (let index = 2; index <= 14; index++) assert.equal(app.states[index].length, 0);
  app.cleanup();
});

test('explicit logout invalidates a pending profile even before auth callback delivery', async () => {
  const pending = deferred();
  const app = providerHarness({ profile: () => pending.promise });
  const sessionTask = app.session({ uid: 'u1' });
  await app.value.logout();
  pending.resolve(user);
  await sessionTask;
  assert.equal(app.states[0], null);
  app.cleanup();
});

test('desktop does not auto-create an administrator for a missing authenticated profile', async () => {
  const app = providerHarness({ profile: async () => null });
  await app.session({ uid: 'missing-user' });
  assert.equal(app.writes.length, 0);
  assert.equal(app.states[0], null);
  app.cleanup();
});

function localService(call) {
  const alerts = [], auth = { currentUser: null };
  const module = evaluate('src/desktop/localService.ts', { './localAuth': { auth } }, { window: { omsDesktop: { call }, alert: message => alerts.push(message) } });
  return { ...module, alerts, auth };
}

test('canonical auth notifications support login, logout and a second login', async () => {
  const auth = localService(async method => method === 'session' || method === 'logout' ? null : user);
  const states = [];
  const unsub = auth.authService.onAuthStateChanged(value => { states.push(value?.uid || null); });
  await tick();
  await auth.authService.login('manager', 'password');
  await auth.authService.logout();
  await auth.authService.login('manager', 'password');
  assert.deepEqual(states, [null, 'u1', null, 'u1']);
  unsub();
});

test('auth listeners handle rejected async callbacks without dropping other subscribers', async () => {
  const never = deferred();
  const auth = localService(async method => method === 'session' ? never.promise : user);
  const error = new Error('Async subscriber failed');
  const failed = Promise.reject(error); failed.catch(() => {});
  auth.authService.onAuthStateChanged(() => failed);
  let notified = false;
  auth.authService.onAuthStateChanged(() => { notified = true; });
  await auth.authService.login('manager', 'password');
  await tick();
  assert.equal(notified, true);
  assert.equal(auth.alerts.length, 1);
  assert.match(auth.alerts[0], /Async subscriber failed/);
});

test('desktop cannot enter an anonymous administrator session', async () => {
  const calls = [];
  const auth = localService(async method => { calls.push(method); return user; });
  await assert.rejects(auth.authService.signInAnonymously(), /password|كلمة|تسجيل الدخول/);
  assert.deepEqual(calls, []);
});

function find(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  for (const child of node.props?.children || []) for (const item of Array.isArray(child) ? child : [child]) { const match = find(item, predicate); if (match) return match; }
  return null;
}

test('logged-out website desktop button opens LoginModal and does not silently enter the app', async () => {
  const hooks = reactHarness();
  let anonymousCalls = 0;
  const { default: Website } = evaluate('screens/WebsiteScreen.tsx', {
    react: hooks.react,
    'motion/react': { motion: new Proxy({}, { get: (_target, name) => String(name) }), useScroll: () => ({ scrollYProgress: 0 }), useTransform: () => 0 },
    '../contexts/AppContext': { useAppContext: () => ({ products: [], currentUser: null }) },
    '../contexts/LanguageContext': { useTranslation: () => ({ t: key => key, language: 'en' }) },
    '../contexts/ThemeContext': { useTheme: () => ({ theme: 'light' }) },
    '../contexts/SettingsContext': { useSettings: () => ({ settings: {} }) },
    '../src/desktop/localService': { authService: { signInAnonymously: async () => { anonymousCalls++; } } }
  }, { window: { omsDesktop: {}, location: { pathname: '/' } } });
  const button = find(Website(), element => element.props?.['aria-label'] === 'Login / Dashboard');
  await button.props.onClick();
  assert.equal(hooks.states[5], true);
  assert.equal(anonymousCalls, 0);
});

test('desktop build aliases return canonical forward-slash module IDs', async () => {
  const captureKey = '__omsAuthBuildOptions';
  const filename = path.join(__dirname, 'build.mjs');
  const bundled = await build({
    entryPoints: [filename], bundle: true, write: false, format: 'esm', platform: 'node',
    define: { 'import.meta.url': JSON.stringify(pathToFileURL(filename).href) },
    plugins: [{ name: 'capture-config', setup(plugin) {
      plugin.onResolve({ filter: /^(?:vite|@vitejs\/plugin-react|tailwindcss|autoprefixer|node:fs)$/ }, args => ({ path: args.path, namespace: 'capture' }));
      plugin.onLoad({ filter: /.*/, namespace: 'capture' }, args => ({ contents:
        args.path === 'vite' ? `export const build = async options => { globalThis.${captureKey} = options; };`
          : args.path === 'node:fs' ? `export default { readFileSync: () => '<head><script>tailwind.config = { theme: {} }</script></head>' };`
          : 'export default () => ({});', loader: 'js' }));
    } }]
  });
  await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
  const plugin = globalThis[captureKey].plugins[0];
  delete globalThis[captureKey];
  assert.equal(plugin.resolveId('../src/firebaseService'), path.join(__dirname, 'localService.ts').replaceAll('\\', '/'));
  assert.equal(plugin.resolveId('../src/firebase'), path.join(__dirname, 'localAuth.ts').replaceAll('\\', '/'));
});
