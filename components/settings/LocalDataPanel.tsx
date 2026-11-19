import React, { useState, useEffect } from 'react';
import { Database, Server, Cloud, Folder, Upload, CheckCircle2, AlertCircle, RefreshCw, Globe, KeyRound } from 'lucide-react';

export default function LocalDataPanel() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dataLocation, setDataLocation] = useState('');

  // Remote Server State
  const [remoteServerEnabled, setRemoteServerEnabled] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [serverApiKey, setServerApiKey] = useState('');
  const [serverStatus, setServerStatus] = useState('جاهز للربط');

  // Google Drive State
  const [googleDriveEnabled, setGoogleDriveEnabled] = useState(false);
  const [googleAccountEmail, setGoogleAccountEmail] = useState('');
  const [googleFolderId, setGoogleFolderId] = useState('');
  const [lastUploadTime, setLastUploadTime] = useState<string | null>(null);

  if (!window.omsDesktop) return null;

  useEffect(() => {
    try {
      const prefs = window.omsDesktop?.preferences() || {};
      
      // Load Remote Server Prefs
      if (prefs['settings:remoteServer']) {
        const rs = JSON.parse(prefs['settings:remoteServer']);
        setRemoteServerEnabled(Boolean(rs.configured));
        setServerUrl(rs.url || '');
        setServerApiKey(rs.apiKey || '');
        setServerStatus(rs.url ? 'تم تحديد السيرفر' : 'جاهز للربط (بانتظار تحديد السيرفر)');
      }

      // Load Google Drive Prefs
      if (prefs['settings:googleDrive']) {
        const gd = JSON.parse(prefs['settings:googleDrive']);
        setGoogleDriveEnabled(Boolean(gd.enabled));
        setGoogleAccountEmail(gd.accountEmail || '');
        setGoogleFolderId(gd.folderId || '');
      }

      if (prefs['settings:googleDriveLastUpload']) {
        setLastUploadTime(prefs['settings:googleDriveLastUpload']);
      }

      // Load Data Directory
      window.omsDesktop?.call('setupStatus').then((status: any) => {
        if (status?.currentDirectory) setDataLocation(status.currentDirectory);
      }).catch(console.error);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const run = async (action: string) => {
    setBusy(true);
    setMessage('');
    setErrorMessage('');
    try {
      const result = await window.omsDesktop!.call(action);
      if (action === 'backup' && result) setMessage(`تم حفظ النسخة بنجاح: ${result}`);
      if (action === 'dataFolder' && result) setMessage(`تم فتح مجلد البيانات: ${result}`);
    } catch (error) { 
      setErrorMessage(`تعذر إكمال العملية: ${(error as Error).message}`); 
    } finally { 
      setBusy(false); 
    }
  };

  const handleSaveRemoteServer = () => {
    try {
      const payload = {
        configured: remoteServerEnabled,
        url: serverUrl.trim(),
        apiKey: serverApiKey.trim(),
        status: serverUrl.trim() ? 'configured' : 'ready_to_connect'
      };
      window.omsDesktop?.setPreference('settings:remoteServer', JSON.stringify(payload));
      setServerStatus(serverUrl.trim() ? 'تم حفظ بيانات السيرفر' : 'جاهز للربط (سيتم تحديد السيرفر لاحقاً)');
      setMessage('تم حفظ إعدادات السيرفر الخارجي بنجاح');
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل حفظ إعدادات السيرفر');
    }
  };

  const handleSaveGoogleDrive = () => {
    try {
      const payload = {
        enabled: googleDriveEnabled,
        accountEmail: googleAccountEmail.trim(),
        folderId: googleFolderId.trim()
      };
      window.omsDesktop?.setPreference('settings:googleDrive', JSON.stringify(payload));
      setMessage('تم حفظ بيانات حساب Google Drive بنجاح');
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل حفظ إعدادات Google Drive');
    }
  };

  const handleUploadToGoogleDrive = async () => {
    setBusy(true);
    setMessage('');
    setErrorMessage('');
    try {
      const res = await window.omsDesktop?.call('googleDriveUpload');
      if (res?.ok) {
        setLastUploadTime(res.timestamp);
        setMessage(`تم رفع قاعدة البيانات بنجاح إلى حساب Google Drive (${res.accountEmail}) - حجم البيانات: ${(res.fileSize / 1024).toFixed(1)} KB`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر الرفع إلى Google Drive');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section dir="rtl" className="my-6 space-y-6">
      {/* 1. Local Database Management */}
      <div className="rounded-2xl border border-border bg-card p-6 dark:bg-dark-card dark:border-dark-border shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-text-primary dark:text-dark-text-primary">
              قاعدة البيانات المحلية (Local Database)
            </h4>
            <p className="text-xs text-text-secondary">
              قاعدة البيانات محلية وتعمل بدون إنترنت بالكامل. تُحفظ السجلات والصور محليًا في جهازك بأعلى سرعة وأمان.
            </p>
          </div>
        </div>

        {dataLocation && (
          <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium">مسار حفظ قاعدة البيانات:</span>
            <span className="font-mono text-primary font-bold break-all">{dataLocation}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5 mt-4">
          <button 
            disabled={busy} 
            onClick={() => run('backup')} 
            className="rounded-xl bg-primary hover:bg-primary-hover px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 shadow-xs"
          >
            حفظ نسخة احتياطية محلية
          </button>
          <button 
            disabled={busy} 
            onClick={() => run('restore')} 
            className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text-primary dark:text-dark-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            استعادة نسخة احتياطية
          </button>
          <button 
            disabled={busy} 
            onClick={() => run('dataFolder')} 
            className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text-primary dark:text-dark-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <span>فتح مجلد البيانات</span>
          </button>
        </div>
      </div>

      {/* 2. External Server / Remote Viewing */}
      <div className="rounded-2xl border border-border bg-card p-6 dark:bg-dark-card dark:border-dark-border shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-text-primary dark:text-dark-text-primary">
                الربط بسيرفر خارجي للمشاهدة عن بعد
              </h4>
              <p className="text-xs text-text-secondary">
                "للمشاهدة من خارج الجهاز: هل لديك سيرفر أو استضافة تريد ربطها؟ الاتصال مجهّز كخيار اختياري، وتبقى قاعدة البيانات المحلية هي الأساس."
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            {serverStatus}
          </span>
        </div>

        <div className="space-y-4 pt-2">
          <label className="flex items-center gap-2.5 text-xs font-bold text-text-primary dark:text-dark-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={remoteServerEnabled}
              onChange={e => setRemoteServerEnabled(e.target.checked)}
              className="w-4 h-4 text-primary rounded"
            />
            <span>تفعيل الربط بالسيرفر الخارجي (يمكنك تحديد السيرفر في أي وقت)</span>
          </label>

          {remoteServerEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  رابط السيرفر أو الاستضافة (Server URL)
                </label>
                <input
                  type="url"
                  placeholder="https://api.yourserver.com/sync"
                  value={serverUrl}
                  onChange={e => setServerUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background dark:bg-dark-background text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  مفتاح المصادقة (API Key / Auth Token)
                </label>
                <input
                  type="password"
                  placeholder="رمز الربط السري"
                  value={serverApiKey}
                  onChange={e => setServerApiKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background dark:bg-dark-background text-xs font-mono"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between">
                <span className="text-[11px] text-text-secondary">
                  * تم تجهيز كود الاتصال بالكامل، وسيبدأ النظام المزامنة بمجرد توفر السيرفر.
                </span>
                <button
                  type="button"
                  onClick={handleSaveRemoteServer}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs"
                >
                  حفظ إعدادات السيرفر
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Google Drive Cloud Backup */}
      <div className="rounded-2xl border border-border bg-card p-6 dark:bg-dark-card dark:border-dark-border shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-text-primary dark:text-dark-text-primary">
                النسخ الاحتياطي على Google Drive
              </h4>
              <p className="text-xs text-text-secondary">
                رفع قاعدة البيانات مباشرة إلى حساب Google Drive الخاص بك لحمايتها والوصول إليها عند الحاجة.
              </p>
            </div>
          </div>
          {lastUploadTime && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              آخر رفع: {new Date(lastUploadTime).toLocaleDateString('ar-BH')} {new Date(lastUploadTime).toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="space-y-4 pt-2">
          <label className="flex items-center gap-2.5 text-xs font-bold text-text-primary dark:text-dark-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={googleDriveEnabled}
              onChange={e => setGoogleDriveEnabled(e.target.checked)}
              className="w-4 h-4 text-primary rounded"
            />
            <span>تفعيل الرفع إلى Google Drive</span>
          </label>

          {googleDriveEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  البريد الإلكتروني لحساب Google Drive
                </label>
                <input
                  type="email"
                  placeholder="your-business@gmail.com"
                  value={googleAccountEmail}
                  onChange={e => setGoogleAccountEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background dark:bg-dark-background text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  معرّف مجلد الحفظ (Folder ID - اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مجلد النسخ الاحتياطي (اختياري)"
                  value={googleFolderId}
                  onChange={e => setGoogleFolderId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background dark:bg-dark-background text-xs font-mono"
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleUploadToGoogleDrive}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{busy ? 'جاري الرفع…' : 'رفع قاعدة البيانات الآن إلى Google Drive'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveGoogleDrive}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-text-primary dark:text-dark-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  حفظ بيانات حساب Google Drive
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="break-all">{message}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="break-all">{errorMessage}</span>
        </div>
      )}
    </section>
  );
}
