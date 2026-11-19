import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { User, Screen, UserRole } from '../types';
import AddEditUserModal from '../components/users/AddEditUserModal';
import { StorageImage } from '../components/StorageImage';
import { NAV_ITEMS, ROLE_PERMISSIONS } from '../constants';
import { 
    Users, 
    UserCheck, 
    UserX, 
    Shield, 
    ShieldCheck, 
    Key, 
    Lock, 
    Eye, 
    EyeOff, 
    Search, 
    Filter, 
    Download, 
    Plus, 
    Edit2, 
    Trash2, 
    CheckCircle2, 
    XCircle, 
    LayoutGrid, 
    List, 
    Copy, 
    Check, 
    Sparkles, 
    RefreshCw,
    AlertTriangle,
    X,
    MoreVertical,
    Briefcase,
    ShieldAlert,
    CheckSquare
} from 'lucide-react';

const userRoleColors: Record<UserRole, { bg: string; text: string; border: string }> = {
    'Admin': {
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800'
    },
    'Sales Manager': {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800'
    },
    'Salesperson': {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800'
    },
    'Accountant': {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800'
    },
    'Warehouse Staff': {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800'
    },
    'Delivery': {
        bg: 'bg-sky-50 dark:bg-sky-950/40',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-800'
    },
    'Maintenance': {
        bg: 'bg-teal-50 dark:bg-teal-950/40',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800'
    }
};

const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarBg = (name: string) => {
    const colors = [
        'bg-blue-600',
        'bg-purple-600',
        'bg-emerald-600',
        'bg-indigo-600',
        'bg-amber-600',
        'bg-rose-600',
        'bg-teal-600',
        'bg-cyan-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const UsersScreen: React.FC = () => {
    const { users, addUser, updateUser, deleteUser, currentUser } = useAppContext();
    const { t, language } = useTranslation();
    const isAr = language === 'ar';

    // Filters and View State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('All');
    const [selectedStatus, setSelectedStatus] = useState<string>('All');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

    // Modals state
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userForPinReset, setUserForPinReset] = useState<User | null>(null);
    const [newPinValue, setNewPinValue] = useState('');
    const [viewPermissionsUser, setViewPermissionsUser] = useState<User | null>(null);

    // State for toggling PIN visibility across rows
    const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
    const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

    const togglePinReveal = (userId: string) => {
        setRevealedPins(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    // Filter logic
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = 
                !searchQuery.trim() ||
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.role && user.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.pin && user.pin.includes(searchQuery.trim()));

            const matchesRole = selectedRole === 'All' || user.role === selectedRole;
            const matchesStatus = selectedStatus === 'All' || user.status === selectedStatus;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, selectedRole, selectedStatus]);

    // Statistics
    const stats = useMemo(() => {
        const total = users.length;
        const active = users.filter(u => u.status === 'Active').length;
        const inactive = users.filter(u => u.status === 'Inactive').length;
        const admins = users.filter(u => u.role === 'Admin' || u.role === 'Sales Manager').length;
        const salesAndOps = users.filter(u => u.role === 'Salesperson' || u.role === 'Warehouse Staff' || u.role === 'Delivery').length;
        return { total, active, inactive, admins, salesAndOps };
    }, [users]);

    // Handlers
    const handleOpenAddModal = () => {
        setUserToEdit(null);
        setIsAddEditModalOpen(true);
    };
    
    const handleOpenEditModal = (user: User) => {
        setUserToEdit(user);
        setIsAddEditModalOpen(true);
    };

    const handleCloseAddEditModal = () => {
        setIsAddEditModalOpen(false);
        setUserToEdit(null);
    };

    const handleSaveUser = async (userData: Omit<User, 'id'> & { password?: string }) => {
        try {
            if (userToEdit) {
                await updateUser(userToEdit.id, userData);
            } else {
                await addUser(userData);
            }
            handleCloseAddEditModal();
        } catch (error: any) {
            console.error("Failed to save user:", error);
            alert(error.message || (isAr ? "فشل حفظ بيانات المستخدم. يرجى مراجعة الصلاحيات." : "Failed to save user record. Check your permissions."));
        }
    };

    // Quick Status Toggle directly from table/card
    const handleToggleUserStatus = async (user: User) => {
        if (user.id === currentUser?.id) {
            alert(isAr ? "لا يمكنك تعطيل حسابك الخاص أثناء تسجيل الدخول." : "You cannot deactivate your own active session account.");
            return;
        }

        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        try {
            setStatusUpdatingId(user.id);
            await updateUser(user.id, { status: newStatus });
        } catch (err: any) {
            console.error("Failed to toggle status:", err);
            alert(isAr ? "تعذر تغيير حالة المستخدم." : "Failed to change user status.");
        } finally {
            setStatusUpdatingId(null);
        }
    };

    // Delete User
    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        if (userToDelete.id === currentUser?.id) {
            alert(isAr ? "لا يمكنك حذف حسابك الحالي أثناء تسجيل الدخول." : "You cannot delete your own active account.");
            setUserToDelete(null);
            return;
        }

        try {
            await deleteUser(userToDelete.id);
            setUserToDelete(null);
        } catch (error: any) {
            console.error("Failed to delete user:", error);
            alert(error.message || (isAr ? "فشل حذف المستخدم." : "Failed to delete user."));
        }
    };

    // Quick PIN update
    const handleSaveNewPin = async () => {
        if (!userForPinReset) return;
        if (newPinValue && (newPinValue.length < 4 || newPinValue.length > 6)) {
            alert(isAr ? "رمز PIN يجب أن يتكون من 4 إلى 6 أرقام." : "PIN must be 4 to 6 digits.");
            return;
        }

        try {
            await updateUser(userForPinReset.id, { pin: newPinValue });
            setUserForPinReset(null);
            setNewPinValue('');
        } catch (e) {
            console.error("Failed to update PIN:", e);
            alert(isAr ? "فشل تحديث رمز PIN." : "Failed to update PIN.");
        }
    };

    const handleExportCSV = () => {
        if (!filteredUsers.length) {
            alert(isAr ? "لا توجد بيانات مستخدمين للتصدير." : "No users to export.");
            return;
        }

        const headers = ["Name", "Email", "Role", "Status", "PIN", "Permissions Count"];
        const rows = filteredUsers.map(u => [
            `"${(u.name || '').replace(/"/g, '""')}"`,
            `"${(u.email || '').replace(/"/g, '""')}"`,
            `"${(u.role || '').replace(/"/g, '""')}"`,
            `"${(u.status || '').replace(/"/g, '""')}"`,
            `"${u.pin || ''}"`,
            (u.permissions || []).length
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 pb-12">
            
            {/* Header with Title & Action CTAs */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-inner">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {isAr ? 'إدارة المستخدمين والصلاحيات' : t('users.title')}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {isAr 
                                    ? 'التحكم بحسابات الموظفين، الأدوار، رموز الدخول السريع (PIN)، وصلاحيات الوصول لكل شاشة' 
                                    : 'Manage staff credentials, access roles, fast POS PINs, and screen permissions'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleExportCSV}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <Download className="w-4 h-4 text-slate-500" />
                        <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
                    </button>

                    <button 
                        type="button"
                        onClick={handleOpenAddModal}
                        className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm hover:shadow"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('users.add_user_button')}</span>
                    </button>
                </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isAr ? 'إجمالي المستخدمين' : 'Total Users'}
                        </p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {stats.total}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {isAr ? 'حسابات مسجلة بالنظام' : 'Registered staff accounts'}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                {/* Active Users */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isAr ? 'الحسابات النشطة' : 'Active Users'}
                        </p>
                        <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            {stats.active}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% {isAr ? 'من الإجمالي' : 'of total'}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <UserCheck className="w-6 h-6" />
                    </div>
                </div>

                {/* Inactive Users */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isAr ? 'الحسابات المعطلة' : 'Inactive Users'}
                        </p>
                        <h4 className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">
                            {stats.inactive}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {isAr ? 'تم إيقاف صلاحية الدخول' : 'Access currently disabled'}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                        <UserX className="w-6 h-6" />
                    </div>
                </div>

                {/* Admins & Managers */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {isAr ? 'المدراء والمشرفون' : 'Admins & Managers'}
                        </p>
                        <h4 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                            {stats.admins}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {isAr ? 'صلاحيات إدارة موسعة' : 'Elevated system access'}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    
                    {/* Live Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute top-3.5 start-3 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={isAr ? "البحث بالاسم، البريد، الدور، أو رمز PIN..." : "Search by name, email, role, or PIN..."}
                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-2.5 ps-9 pe-8 transition"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute top-3 end-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Selectors & View Mode Toggle */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Role Filter */}
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value)}
                                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                            >
                                <option value="All">{isAr ? 'كافة الأدوار' : 'All Roles'}</option>
                                <option value="Admin">{t('users.roles.Admin')}</option>
                                <option value="Sales Manager">{t('users.roles.Sales Manager')}</option>
                                <option value="Salesperson">{t('users.roles.Salesperson')}</option>
                                <option value="Accountant">{t('users.roles.Accountant')}</option>
                                <option value="Warehouse Staff">{t('users.roles.Warehouse Staff')}</option>
                                <option value="Delivery">{t('users.roles.Delivery')}</option>
                                <option value="Maintenance">{t('users.roles.Maintenance')}</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={selectedStatus}
                                onChange={e => setSelectedStatus(e.target.value)}
                                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                            >
                                <option value="All">{isAr ? 'كافة الحالات' : 'All Status'}</option>
                                <option value="Active">{t('users.status_labels.Active')}</option>
                                <option value="Inactive">{t('users.status_labels.Inactive')}</option>
                            </select>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-lg transition ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                                title={isAr ? "عرض جدول" : "Table View"}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('cards')}
                                className={`p-1.5 rounded-lg transition ${
                                    viewMode === 'cards'
                                        ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                                title={isAr ? "عرض بطاقات" : "Cards View"}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Summary & Results Count */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div>
                        {isAr ? 'عرض' : 'Showing'} <span className="font-bold text-slate-700 dark:text-slate-200">{filteredUsers.length}</span> {isAr ? 'من أصل' : 'of'} <span className="font-bold text-slate-700 dark:text-slate-200">{users.length}</span> {isAr ? 'مستخدم' : 'users'}
                    </div>
                    {(searchQuery || selectedRole !== 'All' || selectedStatus !== 'All') && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedRole('All');
                                setSelectedStatus('All');
                            }}
                            className="text-primary hover:underline text-xs font-semibold flex items-center gap-1"
                        >
                            <RefreshCw className="w-3 h-3" />
                            <span>{isAr ? 'إعادة ضبط التصفية' : 'Reset filters'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Users Display: Table View OR Cards View */}
            {filteredUsers.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-4">
                        <Users className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {isAr ? 'لم يتم العثور على مستخدمين' : 'No users found'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                        {searchQuery || selectedRole !== 'All' || selectedStatus !== 'All'
                            ? (isAr ? 'لا توجد نتائج تطابق معايير البحث أو التصفية الحالية. جرب تغيير كلمات البحث.' : 'No users match your active filters. Try adjusting your query.')
                            : (isAr ? 'ابدأ بإضافة موظف جديد لتسجيل بياناته وصلاحياته في النظام.' : 'Get started by creating your first staff user.')}
                    </p>
                    <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-hover transition inline-flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('users.add_user_button')}</span>
                    </button>
                </div>
            ) : viewMode === 'table' ? (
                /* Table View */
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start text-slate-600 dark:text-slate-300">
                            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-start font-semibold">{t('users.table.name')}</th>
                                    <th scope="col" className="px-6 py-4 text-start font-semibold">{t('users.table.role')}</th>
                                    <th scope="col" className="px-6 py-4 text-start font-semibold">{isAr ? 'رمز الدخول (PIN)' : 'Quick PIN'}</th>
                                    <th scope="col" className="px-6 py-4 text-start font-semibold">{t('users.table.permissions')}</th>
                                    <th scope="col" className="px-6 py-4 text-start font-semibold">{t('users.table.status')}</th>
                                    <th scope="col" className="px-6 py-4 text-center font-semibold">{t('users.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredUsers.map((user: User) => {
                                    const roleStyle = userRoleColors[user.role] || {
                                        bg: 'bg-slate-100 dark:bg-slate-800',
                                        text: 'text-slate-700 dark:text-slate-300',
                                        border: 'border-slate-200 dark:border-slate-700'
                                    };
                                    const isPinRevealed = !!revealedPins[user.id];
                                    const permissions = user.permissions || ROLE_PERMISSIONS[user.role] || [];
                                    const isCurrentUser = user.id === currentUser?.id;

                                    return (
                                        <tr 
                                            key={user.id} 
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            {/* User Info Column */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {user.imageUrl ? (
                                                        <StorageImage 
                                                            src={user.imageUrl} 
                                                            alt={user.name} 
                                                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                                                        />
                                                    ) : (
                                                        <div className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-xs ${getAvatarBg(user.name)}`}>
                                                            {getInitials(user.name)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-slate-900 dark:text-white">
                                                                {user.name}
                                                            </span>
                                                            {isCurrentUser && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                                                                    {isAr ? 'حسابك' : 'You'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                            <span>{user.email}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopyEmail(user.email)}
                                                                className="hover:text-primary transition p-0.5"
                                                                title={isAr ? "نسخ البريد" : "Copy email"}
                                                            >
                                                                {copiedEmail === user.email ? (
                                                                    <Check className="w-3 h-3 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="w-3 h-3 text-slate-400" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role Column */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                                                    <Shield className="w-3 h-3" />
                                                    <span>{t(`users.roles.${user.role}`)}</span>
                                                </span>
                                            </td>

                                            {/* PIN Column */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {user.pin ? (
                                                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                                            <span className="font-mono text-xs font-bold tracking-widest text-slate-800 dark:text-slate-200">
                                                                {isPinRevealed ? user.pin : '••••'}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => togglePinReveal(user.id)}
                                                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition"
                                                                title={isPinRevealed ? (isAr ? "إخفاء PIN" : "Hide PIN") : (isAr ? "إظهار PIN" : "Show PIN")}
                                                            >
                                                                {isPinRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">
                                                            {isAr ? 'غير محدد' : 'Not set'}
                                                        </span>
                                                    )}
                                                    
                                                    {/* Quick PIN change button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setUserForPinReset(user);
                                                            setNewPinValue(user.pin || '');
                                                        }}
                                                        className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                                        title={isAr ? "تعديل PIN السريع" : "Change PIN"}
                                                    >
                                                        <Key className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Permissions Column */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap items-center gap-1 max-w-xs">
                                                    {permissions.slice(0, 3).map(screen => (
                                                        <span 
                                                            key={screen}
                                                            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                                                        >
                                                            {t(`sidebar.nav.${screen}`)}
                                                        </span>
                                                    ))}
                                                    {permissions.length > 3 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewPermissionsUser(user)}
                                                            className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold hover:bg-primary/20 transition cursor-pointer"
                                                            title={isAr ? "عرض كافة الصلاحيات" : "View all permissions"}
                                                        >
                                                            +{permissions.length - 3} {isAr ? 'أخرى' : 'more'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status Toggle Column */}
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    disabled={statusUpdatingId === user.id || isCurrentUser}
                                                    onClick={() => handleToggleUserStatus(user)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition border ${
                                                        user.status === 'Active' 
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' 
                                                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                    } ${isCurrentUser ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                                    title={isCurrentUser ? (isAr ? "لا يمكنك تعطيل حسابك" : "Cannot toggle current session") : (isAr ? "انقر للتبديل بين نشط ومعطل" : "Click to toggle status")}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                    <span>{t(`users.status_labels.${user.status}`)}</span>
                                                </button>
                                            </td>

                                            {/* Actions Column */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleOpenEditModal(user)} 
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition"
                                                        title={t('users.table.edit')}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => setUserToDelete(user)} 
                                                        disabled={isCurrentUser}
                                                        className={`p-1.5 rounded-lg transition ${
                                                            isCurrentUser 
                                                                ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                                                                : 'text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                                                        }`}
                                                        title={isCurrentUser ? (isAr ? "لا يمكن حذف حسابك" : "Cannot delete active user") : t('users.table.delete')}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Grid Cards View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredUsers.map((user: User) => {
                        const roleStyle = userRoleColors[user.role] || {
                            bg: 'bg-slate-100',
                            text: 'text-slate-700',
                            border: 'border-slate-200'
                        };
                        const isPinRevealed = !!revealedPins[user.id];
                        const permissions = user.permissions || ROLE_PERMISSIONS[user.role] || [];
                        const isCurrentUser = user.id === currentUser?.id;

                        return (
                            <div 
                                key={user.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                            >
                                <div>
                                    {/* Card Header with Status & Role */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                                            <Shield className="w-3 h-3" />
                                            <span>{t(`users.roles.${user.role}`)}</span>
                                        </span>

                                        <button
                                            type="button"
                                            disabled={statusUpdatingId === user.id || isCurrentUser}
                                            onClick={() => handleToggleUserStatus(user)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition ${
                                                user.status === 'Active'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                            <span>{t(`users.status_labels.${user.status}`)}</span>
                                        </button>
                                    </div>

                                    {/* User Avatar and Info */}
                                    <div className="flex items-center gap-3.5 mb-4">
                                        {user.imageUrl ? (
                                            <StorageImage 
                                                src={user.imageUrl} 
                                                alt={user.name} 
                                                className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                                            />
                                        ) : (
                                            <div className={`w-12 h-12 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-xs ${getAvatarBg(user.name)}`}>
                                                {getInitials(user.name)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="font-bold text-slate-900 dark:text-white truncate">
                                                    {user.name}
                                                </h4>
                                                {isCurrentUser && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold flex-shrink-0">
                                                        {isAr ? 'حسابك' : 'You'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Security details (PIN & Permissions) */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2 mb-4">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <Key className="w-3.5 h-3.5 text-amber-500" />
                                                <span>{isAr ? 'رمز PIN:' : 'PIN:'}</span>
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-bold tracking-widest text-slate-800 dark:text-slate-200">
                                                    {user.pin ? (isPinRevealed ? user.pin : '••••') : (isAr ? 'غير محدد' : 'None')}
                                                </span>
                                                {user.pin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePinReveal(user.id)}
                                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                                                    >
                                                        {isPinRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setUserForPinReset(user);
                                                        setNewPinValue(user.pin || '');
                                                    }}
                                                    className="text-primary hover:underline text-[11px]"
                                                >
                                                    {isAr ? 'تغيير' : 'Edit'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700/50">
                                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>{isAr ? 'الصلاحيات:' : 'Permissions:'}</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setViewPermissionsUser(user)}
                                                className="text-primary hover:underline font-semibold"
                                            >
                                                {permissions.length} {isAr ? 'شاشات مصرح بها' : 'allowed screens'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <button 
                                        onClick={() => handleOpenEditModal(user)} 
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg text-primary hover:bg-primary/10 transition flex items-center gap-1"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>{t('users.table.edit')}</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => setUserToDelete(user)} 
                                        disabled={isCurrentUser}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                                            isCurrentUser 
                                                ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                                                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                                        }`}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>{t('users.table.delete')}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Quick PIN Reset Modal */}
            {userForPinReset && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-scale">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                    <Key className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white">
                                    {isAr ? 'تعديل رمز PIN السريع' : 'Update Quick PIN'}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setUserForPinReset(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                            {isAr 
                                ? `تعيين رمز مرور جديد للمستخدم ${userForPinReset.name} لاستخدامه في شاشات نقاط البيع والكاشير.` 
                                : `Set a new PIN code for ${userForPinReset.name} to sign in quickly at POS terminals.`}
                        </p>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {isAr ? 'الرمز (4-6 أرقام):' : 'PIN (4-6 digits):'}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setNewPinValue(Math.floor(1000 + Math.random() * 9000).toString())}
                                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>{isAr ? 'توليد عشوائي' : 'Generate random'}</span>
                                </button>
                            </div>

                            <input
                                type="text"
                                maxLength={6}
                                value={newPinValue}
                                onChange={e => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                                placeholder="1234"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-center font-mono text-xl font-bold tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setUserForPinReset(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                            >
                                {isAr ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveNewPin}
                                className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition"
                            >
                                {isAr ? 'حفظ الرمز' : 'Save PIN'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permissions Inspector Modal */}
            {viewPermissionsUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-scale">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">
                                        {isAr ? 'صلاحيات المستخدم' : 'User Permissions'}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        {viewPermissionsUser.name} ({t(`users.roles.${viewPermissionsUser.role}`)})
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setViewPermissionsUser(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto space-y-2 mb-6 pe-1">
                            {(viewPermissionsUser.permissions || ROLE_PERMISSIONS[viewPermissionsUser.role] || []).map(screen => {
                                const navItem = NAV_ITEMS.find(n => n.screen === screen);
                                return (
                                    <div 
                                        key={screen}
                                        className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                                    >
                                        <div className="text-primary">
                                            {navItem?.icon}
                                        </div>
                                        <span>{t(`sidebar.nav.${screen}`)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setViewPermissionsUser(null)}
                                className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition"
                            >
                                {isAr ? 'إغلاق' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Safe Delete Confirmation Dialog */}
            {userToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-scale">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        
                        <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
                            {isAr ? 'تأكيد حذف المستخدم' : 'Confirm User Deletion'}
                        </h3>
                        
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6">
                            {isAr 
                                ? `هل أنت متأكد من رغبتك في حذف حساب "${userToDelete.name}" (${userToDelete.email})؟ سيتم إلغاء صلاحية وصوله للنظام نهائياً.`
                                : `Are you sure you want to delete "${userToDelete.name}" (${userToDelete.email})? They will immediately lose access to the system.`}
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setUserToDelete(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                            >
                                {isAr ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition flex items-center gap-1.5"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>{isAr ? 'تأكيد الحذف' : 'Delete User'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit User Modal */}
            {isAddEditModalOpen && (
                <AddEditUserModal
                    onClose={handleCloseAddEditModal}
                    onSave={handleSaveUser}
                    userToEdit={userToEdit}
                />
            )}
        </div>
    );
};

export default UsersScreen;
