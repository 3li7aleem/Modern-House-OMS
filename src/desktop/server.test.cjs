const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createTabletServer } = require('./server.cjs');

test('tablet server serves index.html with bridge script and handles API calls', async () => {
  const fakeDb = {
    list: (col) => [{ id: '1', name: 'Item 1' }],
    preferences: () => ({ language: 'ar' })
  };

  const rendererDir = path.join(__dirname, 'renderer');
  const tabletServer = createTabletServer({ database: fakeDb, rendererDir, port: 3999 });
  await tabletServer.listen(3999);

  try {
    // 1. Test index.html contains bridge script
    const resHtml = await fetch('http://127.0.0.1:3999/');
    assert.equal(resHtml.status, 200);
    const html = await resHtml.text();
    assert.ok(html.includes('window.omsDesktop = {'));
    assert.ok(html.includes("connect-src 'self'"));

    // 2. Test preferences API
    const resPref = await fetch('http://127.0.0.1:3999/api/preferences');
    assert.equal(resPref.status, 200);
    const prefJson = await resPref.json();
    assert.deepEqual(prefJson.data, { language: 'ar' });

    // 3. Test database list call
    const resCall = await fetch('http://127.0.0.1:3999/api/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'list', args: ['products'] })
    });
    assert.equal(resCall.status, 200);
    const callJson = await resCall.json();
    assert.deepEqual(callJson.data, [{ id: '1', name: 'Item 1' }]);
  } finally {
    tabletServer.server.close();
  }
});
