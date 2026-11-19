import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Server, 
  Cloud, 
  Folder, 
  User, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  HardDrive,
  Globe
} from 'lucide-react';
import Logo from '../layout/Logo';
import { useAppContext } from '../../contexts/AppContext';

interface SetupWizardModalProps {
  onComplete: () => void;
}

const SetupWizardModal: React.FC<SetupWizardModalProps> = ({ onComplete }) => {
  const { setView } = useAppContext();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Admin Credentials
  const [adminName, setAdminName] = useState('مدير النظام');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('1234');

  // Step 2: Database Location
  const [defaultDir, setDefaultDir] = useState('');
  const [selectedDir, setSelectedDir] = useState('');

  // Step 3: Remote Server (Optional)
  const [enableRemoteServer, setEnableRemoteServer] = useState(false);
  const [serverMode, setServerMode] = useState<'later' | 'now'>('later');
  const [serverUrl, setServerUrl] = useState('');
  const [serverApiKey, setServerApiKey] = useState('');
  const [syncFrequency, setSyncFrequency] = useState('realtime');

  // Step 4: Google Drive Backup (Optional)
  const [enableGoogleDrive, setEnableGoogleDrive] = useState(false);
  const [googleAccountEmail, setGoogleAccountEmail] = useState('');
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState('');
  const [googleDriveApiKey, setGoogleDriveApiKey] = useState('');

  useEffect(() => {
    if (window.omsDesktop) {
      window.omsDesktop.call('setupStatus').then((status: any) => {
        if (status) {
          setDefaultDir(status.defaultDirectory || '');
          setSelectedDir(status.currentDirectory || status.defaultDirectory || '');
        }
      }).catch(console.error);
    }
  }, []);

  const handleSelectDirectory = async () => {
    if (!window.omsDesktop) return;
    try {
      const chosen = await window.omsDesktop.call('selectDirectory');
      if (chosen) {
        setSelectedDir(chosen);
      }
    } catch (err: any) {
      setError(err.message || 'تعذر اختيار المجلد');
    }
  };

  const validateStep1 = () => {
    setError('');
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 64) {
      setError('اسم المستخدم يجب أن يتراوح بين 3 و 64 حرفاً');
      return false;
    }
    if (/\s/.test(cleanUsername) || cleanUsername.includes('@')) {
      setError('اسم المستخدم لا يجب أن يحتوي على مسافات أو علامة @');
      return false;
    }
    if (!password || password.length < 8) {
      setError('كلمة المرور يجب ألا تقل عن 8 أحرف');
      return false;
    }
    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقين');
      return false;
    }
    if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
      setError('رمز PIN يجب أن يتكون من 4 أرقام');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleFinish = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (!window.omsDesktop) {
        throw new Error('بيئة سطح المكتب غير متوفرة');
      }

      const payload = {
        adminName: adminName.trim(),
        username: username.trim().toLowerCase(),
        password,
        adminPin: pin.trim() || undefined,
        directory: selectedDir !== defaultDir ? selectedDir : undefined,
        remoteServer: enableRemoteServer ? {
          configured: true,
          mode: serverMode,
          url: serverMode === 'now' ? serverUrl.trim() : '',
          apiKey: serverMode === 'now' ? serverApiKey.trim() : '',
          syncFrequency,
          status: serverMode === 'later' ? 'ready_to_connect' : 'configured'
        } : { configured: false },
        googleDrive: enableGoogleDrive ? {
          enabled: true,
          accountEmail: googleAccountEmail.trim(),
          folderId: googleDriveFolderId.trim(),
          apiKey: googleDriveApiKey.trim()
        } : { enabled: false }
      };

      await window.omsDesktop.call('configureSetup', payload);
      setView('oms');
      onComplete();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 bg-gradient-to-b from-primary/5 via-transparent to-transparent border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                معالج تهيئة وتثبيت النظام
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Modern House OMS — إعداد مدير الجهاز وقاعدة البيانات
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <Logo className="h-8 w-auto" showText={false} />
          </div>
        </div>

        {/* Steps Breadcrumbs */}
        <div className="px-8 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-500">
          <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-primary' : step > 1 ? 'text-emerald-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-primary text-white' : step > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>1</span>
            <span>حساب المدير</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">←</span>
          <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-primary' : step > 2 ? 'text-emerald-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-primary text-white' : step > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>2</span>
            <span>مكان الداتابيز</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">←</span>
          <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-primary' : step > 3 ? 'text-emerald-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-primary text-white' : step > 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>3</span>
            <span>السيرفر الخارجي</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">←</span>
          <div className={`flex items-center gap-1.5 ${step === 4 ? 'text-primary' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>4</span>
            <span>Google Drive</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Admin Credentials */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 mb-4">
                <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  بيانات حساب مدير النظام (لوحة التحكم)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  حدد اسم المستخدم وكلمة المرور الرئيسية للدخول للوحة التحكم وإدارة العمليات.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المدير / المسؤول
                  </label>
                  <div className="relative">
                    <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      value={adminName}
                      onChange={e => setAdminName(e.target.value)}
                      placeholder="مدير النظام"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المستخدم (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="admin"
                  />
                  <span className="text-[10px] text-slate-400">حروف وأرقام وشرطة فقط (بدون مسافات)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كلمة المرور * (8 أحرف فأكثر)
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تأكيد كلمة المرور *
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رمز PIN السريع (4 أرقام - اختياري لشاشات نقاط البيع والكاشير)
                  </label>
                  <div className="relative w-full sm:w-1/2">
                    <KeyRound className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      maxLength={4}
                      className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono tracking-widest focus:ring-2 focus:ring-primary focus:border-primary"
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Database Location */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-4">
                <h4 className="text-sm font-bold text-sky-700 dark:text-sky-300 flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4" />
                  قاعدة البيانات المحلية (Local Database)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  قاعدة البيانات المحلية هي الأساس في النظام وتعمل بدون إنترنت تماماً لضمان السرعة القصوى والخصوصية والاستمرارية.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  مكان تثبيت وحفظ ملف قاعدة البيانات:
                </label>
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Folder className="w-5 h-5 text-amber-500 shrink-0" />
                    <span className="text-xs font-mono text-slate-800 dark:text-slate-200 break-all">
                      {selectedDir || defaultDir || 'جاري التحميل...'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectDirectory}
                    className="shrink-0 px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition shadow-xs"
                  >
                    تغيير المجلد…
                  </button>
                </div>
              </div>

              {selectedDir && defaultDir && selectedDir !== defaultDir && (
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>تم اختيار مجلد مخصص</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDir(defaultDir)}
                    className="text-primary hover:underline"
                  >
                    استعادة المجلد الافتراضي
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Remote Server (Optional) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-4">
                <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4" />
                  المشاهدة من خارج الجهاز والربط بسيرفر خارجي (اختياري)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                  "هل لديك سيرفر أو استضافة تريد ربطها؟ سأجهّز الاتصال كخيار اختياري، وتبقى قاعدة البيانات المحلية هي الأساس."
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableRemoteServer}
                    onChange={e => setEnableRemoteServer(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    تفعيل إمكانية الربط بسيرفر خارجي للمشاهدة من أي مكان على الإنترنت
                  </span>
                </label>

                {enableRemoteServer && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="serverChoice"
                          checked={serverMode === 'later'}
                          onChange={() => setServerMode('later')}
                          className="text-primary"
                        />
                        <span className="font-bold">سأحدد السيرفر لاحقاً (تجهيز الربط في النظام الآن)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="serverChoice"
                          checked={serverMode === 'now'}
                          onChange={() => setServerMode('now')}
                          className="text-primary"
                        />
                        <span>إدخال بيانات السيرفر الآن</span>
                      </label>
                    </div>

                    {serverMode === 'now' && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            رابط السيرفر أو الاستضافة (Server API Endpoint)
                          </label>
                          <input
                            type="url"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                            value={serverUrl}
                            onChange={e => setServerUrl(e.target.value)}
                            placeholder="https://oms-api.yourserver.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            مفتاح المصادقة السري (API Key / Secret Token)
                          </label>
                          <input
                            type="text"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                            value={serverApiKey}
                            onChange={e => setServerApiKey(e.target.value)}
                            placeholder="oms_secret_key_••••••••"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Google Drive Backup */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <h4 className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-1">
                  <Cloud className="w-4 h-4" />
                  رفع قاعدة البيانات على Google Drive
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  يمكن رفع النسخ الاحتياطية لقاعدة البيانات إلى حساب Google Drive تلقائياً أو بضغطة زر لحماية بياناتك. وسيتم تحديد وتعديل الحساب من داخل البرنامج.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableGoogleDrive}
                    onChange={e => setEnableGoogleDrive(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    تفعيل خانة وخاصية رفع الداتابيز على Google Drive
                  </span>
                </label>

                {enableGoogleDrive && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        البريد الإلكتروني لحساب Google Drive
                      </label>
                      <input
                        type="email"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                        value={googleAccountEmail}
                        onChange={e => setGoogleAccountEmail(e.target.value)}
                        placeholder="your-company@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        معرّف المجلد في Google Drive (Folder ID - اختياري)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                        value={googleDriveFolderId}
                        onChange={e => setGoogleDriveFolderId(e.target.value)}
                        placeholder="1A2B3C4D5E6F..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 transition flex items-center gap-2"
              >
                <span>التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleFinish}
                className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isLoading ? 'جاري تهيئة النظام…' : 'إتمام الإعداد وبدء الاستخدام'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizardModal;
