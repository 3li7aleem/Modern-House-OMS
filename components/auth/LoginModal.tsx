import React, { useState } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import { Mail, Lock, User, Eye, EyeOff, X, ArrowRight, ArrowLeft, LogIn, UserPlus, KeyRound } from 'lucide-react';
import Logo from '../layout/Logo';
import PinLoginView from './PinLoginView';

interface LoginModalProps {
  onClose?: () => void;
  onLoginSuccess?: () => void;
  isStandalone?: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose = () => {}, onLoginSuccess = () => {}, isStandalone = false }) => {
    const { t, language } = useTranslation();
    const { login, register } = useAppContext();
    
    // Login method tab: 'pin' or 'password'
    const [authMode, setAuthMode] = useState<'pin' | 'password'>('pin');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!email.trim() || !password) {
            setError(language === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' : 'Please enter both email and password.');
            return;
        }

        if (isRegistering && !name.trim()) {
            setError(language === 'ar' ? 'يرجى إدخال الاسم الكامل.' : 'Please enter your full name.');
            return;
        }

        setIsLoading(true);

        try {
            if (isRegistering) {
                if (password !== confirmPassword) {
                    setError(language === 'ar' ? 'كلمات المرور غير متطابقة.' : "Passwords do not match.");
                    setIsLoading(false);
                    return;
                }
                const cred = await register(name, email, password);
                
                if (!cred.user) {
                    setError(language === 'ar' ? 'تعذر إنشاء الحساب.' : "Could not create user.");
                } else {
                    onLoginSuccess();
                }
            } else {
                await login(email, password);
                onLoginSuccess();
            }
        } catch (err: any) {
            setError(err.message || (language === 'ar' ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' : 'An unexpected error occurred. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(language === 'ar' ? 'تسجيل الدخول عبر Google قيد الإعداد حالياً. يرجى استخدام البريد الإلكتروني وكلمة المرور أو رمز الـ PIN.' : "Google Login is currently being reconfigured. Please use Email/Password or PIN.");
    };

    const toggleView = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setSuccessMessage('');
        setName('');
        setPassword('');
        setConfirmPassword('');
    };

    const isRtl = language === 'ar';

    const card = (
        <div 
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-fade-in-scale relative" 
            onClick={e => e.stopPropagation()}
        >
            {/* Subtle textured background pattern & soft gradient overlay for visual depth */}
            <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20 bg-[radial-gradient(#64748b_1.2px,transparent_1.2px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]" />
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-gradient-to-tr from-sky-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Header with Close */}
            <div className="relative px-7 pt-6 pb-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-2xl text-primary flex items-center justify-center">
                        {authMode === 'pin' ? <KeyRound className="w-5 h-5" /> : (isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />)}
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                            {authMode === 'pin'
                                ? (language === 'ar' ? 'الدخول السريع (PIN)' : 'Quick PIN Login')
                                : (isRegistering ? t('auth.register_title') : t('auth.login_title'))}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {authMode === 'pin' 
                                ? (language === 'ar' ? 'أدخل الرمز المكوّن من 4 أرقام' : 'Fast terminal access via 4-digit code')
                                : (isRegistering 
                                    ? (language === 'ar' ? 'أدخل بياناتك للبدء معنا' : 'Create an account to continue') 
                                    : (language === 'ar' ? 'مرحباً بعودتك! يرجى تسجيل الدخول' : 'Welcome back! Please enter your details'))}
                        </p>
                    </div>
                </div>
                {!isStandalone && (
                    <button 
                        type="button" 
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition" 
                        onClick={onClose}
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

                {/* Tab Switcher: PIN vs Email/Password */}
                <div className="px-7 pt-4 pb-1">
                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => { setAuthMode('pin'); setIsRegistering(false); setError(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                authMode === 'pin'
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'رمز الـ PIN' : 'PIN Code'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('password'); setError(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                authMode === 'password'
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'البريد وكلمة المرور' : 'Email & Password'}</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                {authMode === 'pin' ? (
                    <div className="p-7 pt-5">
                        <PinLoginView 
                            onSuccess={onLoginSuccess}
                            onSwitchToEmail={() => setAuthMode('password')}
                            isModal={true}
                        />
                    </div>
                ) : (
                    <div>
                        {successMessage && (
                            <div className="mx-7 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 text-center font-medium">
                                {successMessage}
                            </div>
                        )}

                        {error && (
                            <div className="mx-7 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 text-center font-medium">
                                {error}
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmit} className="p-7 pt-4">
                            <div className="space-y-4">
                                {isRegistering && (
                                    <div>
                                        <label htmlFor="name-register" className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                            {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <input
                                                id="name-register"
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder={language === 'ar' ? 'محمد علي' : 'John Doe'}
                                                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block w-full ps-10 p-3 transition shadow-sm placeholder:text-slate-400"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="email-login" className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        {language === 'ar' ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            id="email-login"
                                            type="text"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder={language === 'ar' ? 'admin أو user@modernhouse.bh' : 'admin or name@example.com'}
                                            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block w-full ps-10 p-3 transition shadow-sm placeholder:text-slate-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password-login" className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        {t('auth.password')}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            id="password-login"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block w-full ps-10 pe-10 p-3 transition shadow-sm placeholder:text-slate-400"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {isRegistering && (
                                    <div>
                                        <label htmlFor="confirm-password-register" className="block mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                            {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                            <input
                                                id="confirm-password-register"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block w-full ps-10 p-3 transition shadow-sm placeholder:text-slate-400"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={isLoading} 
                                        className="w-full text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary/20 font-bold rounded-xl text-sm py-3.5 px-5 text-center disabled:opacity-50 shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <span className="inline-flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                </svg>
                                                {language === 'ar' ? 'جارٍ التحقق...' : 'Processing...'}
                                            </span>
                                        ) : (
                                            <>
                                                <span>{isRegistering ? t('auth.register_button') : t('auth.login_button')}</span>
                                                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                                            </>
                                        )}
                                    </button>
                                </div>
                                
                                <div className="text-center pt-1">
                                    <button 
                                        type="button" 
                                        onClick={toggleView} 
                                        className="text-xs font-semibold text-primary hover:text-primary-hover transition"
                                    >
                                        {isRegistering ? t('auth.switch_to_login') : t('auth.switch_to_register')}
                                    </button>
                                </div>
                                
                                <div className="pt-2">
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs">
                                            <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 font-medium">
                                                {language === 'ar' ? 'أو المتابعة باستخدام' : 'Or continue with'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <button
                                            onClick={handleGoogleLogin}
                                            type="button"
                                            className="w-full flex items-center justify-center py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-slate-800/70 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                        >
                                            <svg className="w-4 h-4 me-2" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                            </svg>
                                            Google
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
                <style>{`
                    @keyframes fadeInScale {
                        from { transform: scale(0.96); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    .animate-fade-in-scale { animation: fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        20%, 60% { transform: translateX(-4px); }
                        40%, 80% { transform: translateX(4px); }
                    }
                    .animate-shake { animation: shake 0.35s ease-in-out; }
                `}</style>
            </div>
    );

    if (isStandalone) {
        return <div className="w-full flex justify-center">{card}</div>;
    }

    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-all duration-300" 
            onClick={onClose} 
            aria-modal="true" 
            role="dialog"
        >
            {card}
        </div>
    );
};

export default LoginModal;
