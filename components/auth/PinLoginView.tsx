import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import { KeyRound, Delete, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import Logo from '../layout/Logo';

interface PinLoginViewProps {
  onSuccess?: () => void;
  onSwitchToEmail?: () => void;
  isModal?: boolean;
}

const PinLoginView: React.FC<PinLoginViewProps> = ({ onSuccess, onSwitchToEmail, isModal = false }) => {
  const { t, language } = useTranslation();
  const { loginWithPin, users } = useAppContext();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const isRtl = language === 'ar';
  const MAX_PIN_LENGTH = 4;

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setError('');
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setError('');
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError('');
    setPin('');
  };

  // Check PIN automatically once 4 digits are entered
  useEffect(() => {
    if (pin.length >= 4 && !isLoading) {
      handlePinSubmit(pin);
    }
  }, [pin]);

  const handlePinSubmit = async (pinToSubmit: string) => {
    setIsLoading(true);
    setError('');

    try {
      await loginWithPin(pinToSubmit);
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 400);
    } catch (err: any) {
      setError(
        err.message || 
        (language === 'ar' ? 'رمز الـ PIN غير صحيح، يرجى المحاولة مرة أخرى.' : 'Invalid PIN code. Please try again.')
      );
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard support (0-9, Backspace, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  // List of active users with PIN or names for quick selection
  const activeStaff = users.filter(u => u.status === 'Active');

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto select-none">
      {/* Visual Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mb-3 shadow-inner ring-4 ring-primary/5">
          <KeyRound className="w-7 h-7 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {language === 'ar' ? 'الدخول السريع برمز PIN' : 'Quick PIN Login'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          {language === 'ar' 
            ? 'أدخل رمز المرور المكوّن من 4 أرقام للوصول إلى النظام' 
            : 'Enter your 4-digit security PIN to access the terminal'}
        </p>
      </div>

      {/* PIN Dots Indicator */}
      <div className={`flex items-center justify-center gap-3 my-4 py-2 transition-all ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((index) => {
          const isFilled = pin.length > index;
          return (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                isFilled
                  ? 'bg-primary border-primary scale-125 shadow-md shadow-primary/40'
                  : 'bg-transparent border-slate-300 dark:border-slate-700'
              }`}
            />
          );
        })}
      </div>

      {/* Error / Success Feedback */}
      <div className="h-7 mb-2 flex items-center justify-center">
        {error && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 dark:text-rose-400 animate-shake">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-bounce">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{language === 'ar' ? 'تم الدخول بنجاح!' : 'Access Granted!'}</span>
          </div>
        )}
      </div>

      {/* Numeric Keypad Grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleKeyPress(digit)}
            disabled={isLoading}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200/90 active:scale-95 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-white text-xl font-bold text-slate-800 transition-all shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center"
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading || pin.length === 0}
          className="h-14 rounded-2xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center uppercase tracking-wider"
        >
          {language === 'ar' ? 'مسح' : 'Clear'}
        </button>

        {/* '0' Button */}
        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          disabled={isLoading}
          className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200/90 active:scale-95 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-white text-xl font-bold text-slate-800 transition-all shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center"
        >
          0
        </button>

        {/* Delete Single Digit */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isLoading || pin.length === 0}
          className="h-14 rounded-2xl bg-slate-100/60 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {/* Switch to Email Login if requested */}
      {onSwitchToEmail && (
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 w-full text-center">
          <button
            type="button"
            onClick={onSwitchToEmail}
            className="text-xs font-semibold text-primary hover:text-primary-hover transition flex items-center justify-center gap-1.5 mx-auto"
          >
            <span>{language === 'ar' ? 'تسجيل الدخول بالبريد الإلكتروني وكلمة المرور' : 'Login with Email and Password'}</span>
            {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Staff Quick Avatars hint (if staff members exist) */}
      {activeStaff.length > 0 && (
        <div className="mt-4 flex items-center gap-2 overflow-x-auto max-w-full py-1">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
            {language === 'ar' ? 'المستخدمون النشطون:' : 'Active Staff:'}
          </span>
          <div className="flex items-center -space-x-1 rtl:space-x-reverse">
            {activeStaff.slice(0, 4).map((user) => (
              <div
                key={user.id}
                title={`${user.name} (${user.role})`}
                className="w-6 h-6 rounded-full bg-primary/20 text-primary border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold"
              >
                {user.name.charAt(0)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PinLoginView;
