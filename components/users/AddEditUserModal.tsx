import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { User, Screen, UserRole } from '../../types';
import { NAV_ITEMS, ROLE_PERMISSIONS } from '../../constants';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Lock, 
  Key, 
  Shield, 
  Check, 
  Sparkles, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { StorageImage } from '../StorageImage';

interface AddEditUserModalProps {
  onClose: () => void;
  onSave: (userData: Omit<User, 'id'> & { password?: string }) => void;
  userToEdit: User | null;
}

const userRoles: UserRole[] = ['Admin', 'Sales Manager', 'Accountant', 'Warehouse Staff', 'Delivery', 'Salesperson', 'Maintenance'];

// Grouped permissions for better organization
const PERMISSION_GROUPS: {
  titleEn: string;
  titleAr: string;
  icon: string;
  screens: Screen[];
}[] = [
  {
    titleEn: 'Sales & POS',
    titleAr: 'المبيعات ونقاط البيع',
    icon: 'pos',
    screens: ['pos', 'orders', 'customers', 'requests', 'marketing']
  },
  {
    titleEn: 'Inventory & Operations',
    titleAr: 'المخزون والعمليات',
    icon: 'box',
    screens: ['inventory', 'purchaseOrders', 'suppliers', 'delivery', 'maintenance']
  },
  {
    titleEn: 'Finance & Analytics',
    titleAr: 'المالية والتقارير',
    icon: 'dollar',
    screens: ['finance', 'reports']
  },
  {
    titleEn: 'System & Control',
    titleAr: 'الإدارة والنظام',
    icon: 'settings',
    screens: ['dashboard', 'users', 'settings']
  }
];

const ROLE_DESCRIPTIONS: Record<UserRole, { ar: string; en: string; color: string }> = {
  'Admin': {
    ar: 'صلاحيات كاملة للوصول لكافة أقسام النظام والإعدادات والمستخدمين',
    en: 'Full access to all system sections, settings, and users',
    color: 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  },
  'Sales Manager': {
    ar: 'إدارة المبيعات والطلبات والمخزون والعملاء وتقارير المبيعات',
    en: 'Manage sales, orders, inventory, customers, and reports',
    color: 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
  },
  'Salesperson': {
    ar: 'إنشاء الفواتير والطلبات، نقاط البيع، وإدارة بيانات العملاء',
    en: 'Create orders, POS checkouts, and customer records',
    color: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  },
  'Accountant': {
    ar: 'لوحة التحكم، المالية والمصروفات، فواتير الشراء، والتقارير المالية',
    en: 'Dashboard, finance, expenses, purchase orders, and reports',
    color: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  },
  'Warehouse Staff': {
    ar: 'إدارة المخزون، استلام فواتير الشراء، ومتابعة التوصيل',
    en: 'Inventory control, receiving purchase orders, and delivery',
    color: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  },
  'Delivery': {
    ar: 'متابعة وتحديث حالات التوصيل وسندات التسليم فقط',
    en: 'Track deliveries and update delivery notes only',
    color: 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
  },
  'Maintenance': {
    ar: 'إدارة واستلام طلبات وتذاكر الصيانة، توثيق الفحص والإصلاح بالكاميرا والتواصل مع العملاء',
    en: 'Manage maintenance tickets, photo documentation of repairs, and customer communication',
    color: 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
  }
};

const AddEditUserModal: React.FC<AddEditUserModalProps> = ({ onClose, onSave, userToEdit }) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  
  const [activeTab, setActiveTab] = useState<'info' | 'permissions'>('info');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(true);

  const [userData, setUserData] = useState<Partial<Omit<User, 'id'> & { password?: string }>>({
    name: '',
    email: '',
    role: 'Salesperson',
    permissions: ROLE_PERMISSIONS['Salesperson'],
    status: 'Active',
    password: '',
    pin: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (userToEdit) {
      setUserData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        permissions: userToEdit.permissions || ROLE_PERMISSIONS[userToEdit.role] || [],
        status: userToEdit.status,
        imageUrl: userToEdit.imageUrl || '',
        pin: userToEdit.pin || '',
      });
    } else {
      // Generate default 4-digit PIN for new user
      const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
      setUserData(prev => ({ ...prev, pin: randomPin }));
    }
  }, [userToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'role') {
      const selectedRole = value as UserRole;
      setUserData(prev => ({ 
        ...prev, 
        role: selectedRole,
        permissions: ROLE_PERMISSIONS[selectedRole] || []
      }));
    } else {
      setUserData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setUserData(prev => ({ ...prev, pin: randomPin }));
  };

  const handlePermissionChange = (screen: Screen, isChecked: boolean) => {
    setUserData(prev => {
      const currentPermissions = prev.permissions || [];
      if (isChecked) {
        return { ...prev, permissions: [...new Set([...currentPermissions, screen])] };
      } else {
        return { ...prev, permissions: currentPermissions.filter(p => p !== screen) };
      }
    });
  };

  const handleSelectAllPermissions = () => {
    const allScreens = NAV_ITEMS.map(item => item.screen);
    setUserData(prev => ({ ...prev, permissions: allScreens }));
  };

  const handleDeselectAllPermissions = () => {
    setUserData(prev => ({ ...prev, permissions: [] }));
  };

  const handleResetToRoleDefaults = () => {
    const role = userData.role || 'Salesperson';
    setUserData(prev => ({
      ...prev,
      permissions: ROLE_PERMISSIONS[role] || []
    }));
  };

  const handleSubmit = () => {
    if (!userData.name?.trim() || !userData.email?.trim() || !userData.role) {
      alert(isAr ? 'الرجاء إدخال الاسم والبريد الإلكتروني والدور الوظيفي.' : 'Name, Email and Role are required.');
      return;
    }
    if (!userToEdit && !userData.password) {
      alert(isAr ? 'كلمة المرور مطلوبة لإنشاء حساب جديد.' : 'Password is required for new users.');
      return;
    }
    if (userData.pin && (userData.pin.length < 4 || userData.pin.length > 6)) {
      alert(isAr ? 'رمز PIN يجب أن يتكون من 4 إلى 6 أرقام.' : 'PIN code must be between 4 and 6 digits.');
      return;
    }
    onSave(userData as Omit<User, 'id'> & { password?: string });
  };

  const modalTitle = userToEdit ? t('users.modal.edit_title') : t('users.modal.add_title');
  const selectedRole = (userData.role || 'Salesperson') as UserRole;
  const currentPermissions = userData.permissions || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-3 sm:p-4 overflow-y-auto" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl my-auto overflow-hidden animate-fade-in-scale text-slate-800 dark:text-slate-100" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {modalTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'تعيين البيانات الشخصية، الدور، ورمز الدخول السريع والصلاحيات' : 'Configure user credentials, role, quick PIN, and screen access'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/30 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>{isAr ? 'البيانات الأساسية والأمان' : 'Basic Info & Security'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'permissions'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{isAr ? 'صلاحيات الشاشات' : 'Permissions'}</span>
            <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-bold">
              {currentPermissions.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'info' ? (
            <div className="space-y-5">
              {!userToEdit && (
                <div className="p-3.5 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-xl dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    {t('users.modal.add_note') || "Creating a user here will create a Firebase Auth account and database record."}
                  </div>
                </div>
              )}

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('users.modal.name')} *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute top-3.5 start-3 text-slate-400" />
                    <input 
                      type="text" 
                      name="name" 
                      value={userData.name || ''} 
                      onChange={handleChange} 
                      placeholder={isAr ? "مثال: أحمد عبد الله" : "e.g. Ahmed Abdullah"}
                      className="bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full p-2.5 ps-9 transition" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? 'البريد الإلكتروني' : 'Email'} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute top-3.5 start-3 text-slate-400" />
                    <input 
                      type="email" 
                      name="email" 
                      value={userData.email || ''} 
                      onChange={handleChange} 
                      placeholder="user@example.com"
                      className={`bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full p-2.5 ps-9 transition ${
                        userToEdit ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-800 opacity-70' : ''
                      }`} 
                      required 
                      disabled={!!userToEdit} 
                    />
                  </div>
                </div>
              </div>

              {/* Password for new users */}
              {!userToEdit && (
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('users.modal.password') || (isAr ? 'كلمة المرور' : 'Password')} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute top-3.5 start-3 text-slate-400" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password" 
                      value={userData.password || ''} 
                      onChange={handleChange} 
                      placeholder={isAr ? "6 أحرف أو أكثر" : "6 characters minimum"}
                      className="bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full p-2.5 ps-9 pe-10 transition" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-2.5 end-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Role Selection & Description */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('users.modal.role')} *
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute top-3.5 start-3 text-slate-400" />
                  <select 
                    name="role" 
                    value={userData.role} 
                    onChange={handleChange} 
                    className="bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full p-2.5 ps-9 transition appearance-none cursor-pointer"
                  >
                    {userRoles.map(role => (
                      <option key={role} value={role}>{t(`users.roles.${role}`)}</option>
                    ))}
                  </select>
                </div>
                {/* Role Description Card */}
                <div className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center justify-between ${ROLE_DESCRIPTIONS[selectedRole]?.color || 'bg-slate-50 border-slate-200'}`}>
                  <span>{isAr ? ROLE_DESCRIPTIONS[selectedRole]?.ar : ROLE_DESCRIPTIONS[selectedRole]?.en}</span>
                </div>
              </div>

              {/* Quick Login PIN */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-500" />
                    <span>{isAr ? 'رمز الدخول السريع (PIN)' : 'Quick Login PIN'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePin}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isAr ? 'توليد PIN عشوائي' : 'Generate Random PIN'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type={showPin ? 'text' : 'password'} 
                      name="pin" 
                      maxLength={6} 
                      placeholder="1234" 
                      value={userData.pin || ''} 
                      onChange={e => setUserData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))} 
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-base rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full p-2.5 tracking-widest font-mono text-center font-bold transition" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute top-2.5 end-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  {isAr 
                    ? 'رمز مكوّن من 4 إلى 6 أرقام يتيح للموظف تسجيل الدخول بضغطة زر دون كتابة كلمة المرور.'
                    : 'A 4-6 digit numeric code allowing fast PIN pad sign-in for POS and cashier stations.'}
                </p>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('users.modal.status')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserData(prev => ({ ...prev, status: 'Active' }))}
                    className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                      userData.status === 'Active'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>{t('users.status_labels.Active')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserData(prev => ({ ...prev, status: 'Inactive' }))}
                    className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                      userData.status === 'Inactive'
                        ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span>{t('users.status_labels.Inactive')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Permission Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {isAr ? 'إجراءات سريعة للصلاحيات:' : 'Quick Actions:'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition font-medium flex items-center gap-1"
                  >
                    <CheckSquare className="w-3 h-3 text-primary" />
                    <span>{isAr ? 'تحديد الكل' : 'Select All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllPermissions}
                    className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition font-medium flex items-center gap-1"
                  >
                    <Square className="w-3 h-3 text-slate-400" />
                    <span>{isAr ? 'إلغاء التحديد' : 'Deselect All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToRoleDefaults}
                    className="text-xs px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition font-medium flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isAr ? 'الافتراضي للدور' : 'Role Defaults'}</span>
                  </button>
                </div>
              </div>

              {/* Grouped Permissions Matrix */}
              <div className="space-y-4">
                {PERMISSION_GROUPS.map(group => (
                  <div key={group.titleEn} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>{isAr ? group.titleAr : group.titleEn}</span>
                      <span className="text-[11px] font-normal text-slate-400 lowercase">
                        {group.screens.filter(s => currentPermissions.includes(s)).length} / {group.screens.length}
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {group.screens.map(screen => {
                        const navItem = NAV_ITEMS.find(n => n.screen === screen);
                        const isChecked = currentPermissions.includes(screen);
                        return (
                          <label 
                            key={screen} 
                            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition select-none ${
                              isChecked 
                                ? 'border-primary/40 bg-primary/5 dark:bg-primary/10 text-slate-900 dark:text-white' 
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                              checked={isChecked}
                              onChange={(e) => handlePermissionChange(screen, e.target.checked)}
                            />
                            <div className="w-5 h-5 flex items-center justify-center text-slate-500">
                              {navItem?.icon}
                            </div>
                            <span className="text-xs font-medium">
                              {t(`sidebar.nav.${screen}`)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {activeTab === 'info' ? (
              <span>{isAr ? 'يمكنك تخصيص الصلاحيات في التبويب الآخر' : 'Custom screen permissions available in Permissions tab'}</span>
            ) : (
              <span>{currentPermissions.length} {isAr ? 'شاشات مصرح بها' : 'permitted screens'}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {t('users.modal.cancel_button')}
            </button>
            <button 
              onClick={handleSubmit} 
              type="button" 
              className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm hover:shadow transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{t('users.modal.save_button')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddEditUserModal;
