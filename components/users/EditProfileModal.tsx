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
  Smartphone,
  Upload
} from 'lucide-react';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedData: Partial<Omit<User, 'id'>>) => Promise<void> | void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
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
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-[90] flex justify-center items-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose} 
      aria-modal="true" 
      role="dialog"
      aria-labelledby="edit-profile-title"
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl my-auto overflow-hidden border border-slate-200/90 dark:border-slate-800 transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Modern House Navy Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B132B] via-[#14213D] to-[#1E293B] px-6 pt-5 pb-12 text-white">
          <div className="pointer-events-none absolute -top-10 -end-10 w-40 h-40 rounded-full bg-amber-500/15 blur-2xl" />
          <button 
            type="button" 
            className="absolute top-4 end-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white focus-visible:ring-2 focus-visible:ring-amber-400 focus:outline-none transition-colors cursor-pointer"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
          
          <div className="relative flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span className="text-xs font-bold tracking-wide text-amber-300/90">
              {isAr ? 'إعدادات الحساب الشخصي' : 'Account Profile'}
            </span>
          </div>
          <h3 id="edit-profile-title" className="relative text-xl sm:text-2xl font-black mt-1 text-white">
            {t('auth.edit_profile')}
          </h3>
        </div>

        {/* Avatar Overlap + User Identity Summary (cleanly inside white card body) */}
        <div className="px-6 pt-0 pb-4 bg-white dark:bg-slate-900">
          <div className="-mt-10 relative z-10 flex items-end justify-between gap-4">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 ring-4 ring-white dark:ring-slate-900 shadow-lg flex items-center justify-center">
                <StorageImage 
                  src={imagePreview || "https://i.pravatar.cc/150"} 
                  alt={name || user.name || 'Profile'} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <label 
                htmlFor="profile-upload" 
                className="absolute -bottom-1.5 -end-1.5 w-8 h-8 flex items-center justify-center bg-[#14213D] hover:bg-[#1F2E4D] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white rounded-xl ring-2 ring-white dark:ring-slate-900 shadow-md cursor-pointer transition transform active:scale-95"
                title={isAr ? 'تغيير الصورة' : 'Change photo'}
              >
                <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {user.status === 'Active' ? (isAr ? 'نشط' : 'Active') : user.status}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-amber-300 bg-slate-100 dark:bg-amber-500/15 px-3 py-1 rounded-full border border-slate-200 dark:border-amber-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                {user.role}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug truncate">
              {name || user.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
              <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 px-6 gap-2 bg-slate-50/50 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus:outline-none transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-amber-500 text-slate-900 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <UserIcon className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'المعلومات الشخصية' : 'Personal Info'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus:outline-none transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'border-amber-500 text-slate-900 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'رمز PIN والأمان' : 'PIN & Security'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus:outline-none transition-all cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-amber-500 text-slate-900 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'الصلاحيات' : 'Permissions'}</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Error Alert */}
            {errorMessage && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900/40">
                <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: Profile Info */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="profile-name" className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('users.modal.name')} *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3.5" aria-hidden="true" />
                    <input
                      id="profile-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isAr ? 'اسم المستخدم الكامل' : 'Full Name'}
                      className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-[#14213D] dark:focus:border-amber-400 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#14213D]/15 dark:focus:ring-amber-400/20 outline-none text-slate-900 dark:text-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-email" className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3.5" aria-hidden="true" />
                    <input
                      id="profile-email"
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    {isAr ? 'البريد الإلكتروني مرتبط بتسجيل الدخول وحساب Firebase' : 'Email address is linked to your Firebase login account'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500/60 transition flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAr ? 'صورة الملف الشخصي' : 'Profile Picture'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr ? 'يدعم تنسيقات JPG, PNG, WEBP حتى 5MB' : 'Supports JPG, PNG, WEBP up to 5MB'}
                    </p>
                  </div>
                  <label 
                    htmlFor="profile-upload" 
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs cursor-pointer transition shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    <span>{isAr ? 'اختر ملف' : 'Choose File'}</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: PIN & Fast Login Security */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
                  <div className="flex items-start gap-2.5">
                    <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-amber-200">
                        {isAr ? 'رمز PIN للدخول السريع ونقاط البيع POS' : 'Fast PIN for POS & Quick Unlock'}
                      </h5>
                      <p className="text-[11px] text-slate-600 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                        {isAr 
                          ? 'يتيح لك رمز PIN تسجيل الدخول السريع أو فتح جلسة نقاط البيع دون كتابة كلمة المرور كل مرة.'
                          : 'Your PIN allows rapid login and quick lock/unlock on mobile & POS terminals without typing password.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-pin" className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'رمز PIN الجديد (4-6 أرقام)' : 'New PIN (4-6 Digits)'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3.5" aria-hidden="true" />
                    <input
                      id="profile-pin"
                      type={showPin ? "text" : "password"}
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full pl-10 pr-10 rtl:pl-10 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-[#14213D] dark:focus:border-amber-400 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-[#14213D]/15 dark:focus:ring-amber-400/20 outline-none text-slate-900 dark:text-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rtl:right-auto rtl:left-3 focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg focus:outline-none cursor-pointer"
                      aria-label={isAr ? (showPin ? 'إخفاء رمز PIN' : 'إظهار رمز PIN') : (showPin ? 'Hide PIN' : 'Show PIN')}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-confirm-pin" className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'تأكيد رمز PIN' : 'Confirm PIN'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:left-auto rtl:right-3.5" aria-hidden="true" />
                    <input
                      id="profile-confirm-pin"
                      type={showPin ? "text" : "password"}
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-[#14213D] dark:focus:border-amber-400 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-[#14213D]/15 dark:focus:ring-amber-400/20 outline-none text-slate-900 dark:text-white transition"
                    />
                  </div>
                </div>

                {pin && pin.length >= 4 && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>{isAr ? 'الرمز صالح وجاهز للحفظ' : 'Valid PIN format'}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Permissions Summary */}
            {activeTab === 'permissions' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isAr 
                    ? 'الصلاحيات الممنوحة لحسابك بناءً على دورك في النظام:' 
                    : 'Modules and features granted to your profile:'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-0.5">
                  {(user.permissions || []).map((perm) => (
                    <div 
                      key={perm}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize truncate">
                        {t(`sidebar.nav.${perm}`) || perm}
                      </span>
                    </div>
                  ))}
                </div>
                
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  {isAr ? '* يتم تعديل الصلاحيات المتقدمة من قبل مسؤول النظام (Admin)' : '* Role permissions can be modified by the Administrator in Users module.'}
                </p>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50/80 dark:bg-slate-800/30 border-t border-slate-200/80 dark:border-slate-800">
            <button 
              onClick={onClose} 
              type="button" 
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold focus-visible:ring-2 focus-visible:ring-amber-500 focus:outline-none transition cursor-pointer"
            >
              {t('users.modal.cancel_button')}
            </button>
            <button 
              type="submit" 
              disabled={isUploading} 
              className="px-6 py-2.5 rounded-xl bg-[#14213D] hover:bg-[#1F2E4D] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs sm:text-sm font-bold transition shadow-lg shadow-slate-900/15 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500 focus:outline-none flex items-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>{isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
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
