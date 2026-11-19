import React, { useState } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { User } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { StorageImage } from '../StorageImage';
import { compressAndResizeImage } from '../../src/utils/imageUtils';
import { 
  X, 
  Camera, 
  User as UserIcon, 
  KeyRound, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Mail, 
  Eye, 
  EyeOff, 
  Lock,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedData: Partial<Omit<User, 'id'>>) => Promise<void> | void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const { t, language } = useTranslation();
  const { uploadProfilePicture, addToast } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'permissions'>('profile');
  
  // Profile state
  const [name, setName] = useState(user.name || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user.imageUrl || null);
  
  // PIN security state
  const [pin, setPin] = useState(user.pin || '');
  const [showPin, setShowPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState(user.pin || '');

  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setErrorMessage(null);
      try {
        setImageFile(file);
        // Pre-compress preview so memory footprint is tiny
        const compressedUrl = await compressAndResizeImage(file, {
          maxWidth: 320,
          maxHeight: 320,
          quality: 0.8,
          maxBytes: 80 * 1024
        });
        setImagePreview(compressedUrl);
      } catch (err) {
        console.error("Failed to process image:", err);
        setErrorMessage(language === 'ar' ? 'تعذر معالجة الصورة، يرجى اختيار صورة أخرى' : 'Failed to process image, please choose another.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage(language === 'ar' ? 'يرجى إدخال اسم المستخدم' : 'Name cannot be empty.');
      return;
    }

    if (pin && pin.length > 0) {
      if (!/^\d{4,6}$/.test(pin)) {
        setErrorMessage(language === 'ar' ? 'رمز PIN يجب أن يتكون من 4 إلى 6 أرقام فقط' : 'PIN must be between 4 and 6 numeric digits.');
        return;
      }
      if (pin !== confirmPin) {
        setErrorMessage(language === 'ar' ? 'رمز PIN وتأكيد الرمز غير متطابقين' : 'PIN and confirmation do not match.');
        return;
      }
    }
    
    setIsUploading(true);
    let finalImageUrl = user.imageUrl;

    try {
      if (imageFile) {
        finalImageUrl = await uploadProfilePicture(user.id, imageFile);
      } else if (finalImageUrl && finalImageUrl.startsWith('data:image') && finalImageUrl.length > 80000) {
        finalImageUrl = await compressAndResizeImage(finalImageUrl, {
          maxWidth: 320,
          maxHeight: 320,
          quality: 0.8,
          maxBytes: 80 * 1024
        });
      }

      await onSave({ 
        name: name.trim(), 
        imageUrl: finalImageUrl,
        pin: pin ? pin.trim() : undefined
      });

      if (addToast) {
        addToast(
          language === 'ar' ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully',
          'success'
        );
      }
      onClose();
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      const detail = error?.message || '';
      if (detail.includes('exceeds the maximum allowed size') || detail.includes('1,048,576 bytes')) {
        setErrorMessage(language === 'ar' ? 'حجم الصورة كبير جداً، تم تحسينها تلقائياً، يرجى المحاولة مرة أخرى' : 'Image size was too large, please select a smaller image.');
      } else {
        setErrorMessage(language === 'ar' ? 'فشل حفظ التغييرات، يرجى المحاولة مرة أخرى' : 'Failed to save changes. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex justify-center items-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose} 
      aria-modal="true" 
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl my-auto overflow-hidden border border-slate-200 dark:border-slate-800 transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with gradient banner */}
        <div className="relative bg-gradient-to-r from-primary to-indigo-600 p-6 text-white pb-14">
          <button 
            type="button" 
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              {language === 'ar' ? 'إعدادات الحساب الشخصي' : 'Account Profile'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black mt-1">
            {t('auth.edit_profile')}
          </h3>
        </div>

        {/* User Identity Overlap Card */}
        <div className="px-6 -mt-10 relative z-10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 ring-4 ring-white dark:ring-slate-900 shadow-xl flex items-center justify-center">
                <StorageImage 
                  src={imagePreview || "https://i.pravatar.cc/150"} 
                  alt="Profile Preview" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <label 
                htmlFor="profile-upload" 
                className="absolute -bottom-1.5 -right-1.5 p-2 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg cursor-pointer transition transform active:scale-90"
                title={language === 'ar' ? 'تغيير الصورة' : 'Change photo'}
              >
                <Camera className="w-4 h-4" />
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {name || user.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {user.status === 'Active' ? (language === 'ar' ? 'نشط' : 'Active') : user.status}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              {user.role}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 mt-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>{language === 'ar' ? 'المعلومات الشخصية' : 'Personal Info'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{language === 'ar' ? 'رمز PIN والأمان' : 'PIN & Security'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'permissions'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'ar' ? 'الصلاحيات' : 'Permissions'}</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error & Info Alerts */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900/40 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: Profile Info */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('users.modal.name')} *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'ar' ? 'اسم المستخدم الكامل' : 'Full Name'}
                    className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-primary rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('users.modal.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3.5" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'ar' ? 'البريد الإلكتروني مرتبط بتسجيل الدخول وحساب Firebase' : 'Email address is linked to your Firebase login account'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {language === 'ar' ? 'صورة الملف الشخصي' : 'Profile Picture'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'ar' ? 'يدعم تنسيقات JPG, PNG, WEBP حتى 5MB' : 'Supports JPG, PNG, WEBP up to 5MB'}
                  </p>
                </div>
                <label 
                  htmlFor="profile-upload" 
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer transition"
                >
                  {language === 'ar' ? 'اختر ملف' : 'Choose File'}
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: PIN & Fast Login Security */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-start gap-2.5">
                  <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      {language === 'ar' ? 'رمز PIN للدخول السريع ونقاط البيع POS' : 'Fast PIN for POS & Quick Unlock'}
                    </h5>
                    <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
                      {language === 'ar' 
                        ? 'يتيح لك رمز PIN تسجيل الدخول السريع أو فتح جلسة نقاط البيع دون كتابة كلمة المرور كل مرة.'
                        : 'Your PIN allows rapid login and quick lock/unlock on mobile & POS terminals without typing password.'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'رمز PIN الجديد (4-6 أرقام)' : 'New PIN (4-6 Digits)'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3.5" />
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full pl-10 pr-10 rtl:pl-10 rtl:pr-10 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-primary rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rtl:right-auto rtl:left-3"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'تأكيد رمز PIN' : 'Confirm PIN'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3.5" />
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-primary rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 dark:text-white transition"
                  />
                </div>
              </div>

              {pin && pin.length >= 4 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>{language === 'ar' ? 'الرمز صالح وجاهز للحفظ' : 'Valid PIN format'}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Permissions Summary */}
          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'ar' 
                  ? 'الصلاحيات الممنوحة لحسابك بناءً على دورك في النظام:' 
                  : 'Modules and features granted to your profile:'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                {(user.permissions || []).map((perm) => (
                  <div 
                    key={perm}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize truncate">
                      {t(`sidebar.nav.${perm}`) || perm}
                    </span>
                  </div>
                ))}
              </div>
              
              <p className="text-[10px] text-slate-400 italic pt-1">
                {language === 'ar' ? '* يتم تعديل الصلاحيات المتقدمة من قبل مسؤول النظام (Admin)' : '* Role permissions can be modified by the Administrator in Users module.'}
              </p>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={onClose} 
              type="button" 
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition"
            >
              {t('users.modal.cancel_button')}
            </button>
            <button 
              type="submit" 
              disabled={isUploading} 
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('users.modal.save_button')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
