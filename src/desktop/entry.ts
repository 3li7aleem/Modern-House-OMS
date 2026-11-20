import './offline.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/600.css';
import * as XLSX from 'xlsx';

(window as any).XLSX = XLSX;
const bridge = window.omsDesktop;
if (!bridge) throw new Error('Open this application through Modern House OMS.exe');
const preferences = bridge.preferences();
const isPreference = (key: string) => /^(settings:|language$|theme$)/.test(key);
for (const key of Object.keys(localStorage)) if (isPreference(key)) localStorage.removeItem(key);
for (const [key, value] of Object.entries(preferences)) localStorage.setItem(key, value);
if (!localStorage.getItem('language')) localStorage.setItem('language', 'ar');
localStorage.removeItem('oms_pin_session_uid');
localStorage.removeItem('oms_local_session_uid');
const originalSet = Storage.prototype.setItem;
const originalRemove = Storage.prototype.removeItem;
Storage.prototype.setItem = function(key, value) {
  if (this === localStorage && isPreference(key)) bridge.setPreference(key, String(value));
  originalSet.call(this, key, value);
};
Storage.prototype.removeItem = function(key) {
  if (this === localStorage && isPreference(key)) bridge.setPreference(key, null);
  originalRemove.call(this, key);
};
// Local placeholder for missing/remote images. Uploaded data URLs remain available offline.
document.addEventListener('error', event => {
  const target = event.target;
  if (target instanceof HTMLImageElement && !target.dataset.localFallback) {
    target.dataset.localFallback = 'true';
    target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="20">Modern House</text></svg>');
  }
}, true);
import('../../index');
