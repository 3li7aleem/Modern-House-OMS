import React, { useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { NAV_ITEMS } from '../../constants';
import { StorageImage } from '../StorageImage';
import Logo from './Logo';
import { 
  X, 
  Sun, 
  Moon, 
  Languages, 
  Globe, 
  LogOut, 
  ShieldCheck, 
  ChevronRight, 
  Lock 
} from 'lucide-react';

interface MobileSidebarProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isMobileMenuOpen, toggleMobileMenu }) => {
  const { t, language, changeLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { 
    currentUser, 
    activeScreen, 
    setActiveScreen, 
    setView, 
    logout 
  } = useAppContext();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        toggleMobileMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, toggleMobileMenu]);

  const userPermissions = currentUser?.permissions || [];
  const visibleNavItems = NAV_ITEMS.filter(item => userPermissions.includes(item.screen));

  const isRtl = language === 'ar';

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMobileMenu}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div 
        className={`fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} flex flex-col w-[85%] max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl z-[70] transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen 
            ? 'translate-x-0' 
            : (isRtl ? 'translate-x-full' : '-translate-x-full')
        }`}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center">
                {currentUser?.imageUrl ? (
                  <StorageImage src={currentUser.imageUrl} className="w-full h-full object-cover" alt={currentUser.name} />
                ) : (
                  <span className="text-primary font-bold text-base">
                    {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {currentUser?.name || 'User'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                  {currentUser?.role || 'Staff'}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={toggleMobileMenu}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Toolbar (Theme, Lang, Website) */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={changeLanguage}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs border border-slate-200/50 dark:border-slate-700 hover:bg-slate-50 transition"
          >
            <Languages className="w-4 h-4 text-primary" />
            <span>{language === 'ar' ? 'English' : 'عربي'}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs border border-slate-200/50 dark:border-slate-700 hover:bg-slate-50 transition"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>{language === 'ar' ? 'داكن' : 'Dark'}</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{language === 'ar' ? 'فاتح' : 'Light'}</span>
              </>
            )}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 px-2">
            {language === 'ar' ? 'أقسام النظام' : 'System Modules'}
          </p>
          {visibleNavItems.map((item) => {
            const isActive = activeScreen === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => {
                  setActiveScreen(item.screen);
                  toggleMobileMenu();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-start transition-all duration-200 rounded-xl group ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/25 font-bold' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`}>
                    {item.icon}
                  </div>
                  <span className="text-sm">{t(`sidebar.nav.${item.screen}`)}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / Lock Screen / Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                localStorage.removeItem('oms_pin_session_uid');
                window.location.reload();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'قفل PIN' : 'Lock PIN'}</span>
            </button>
            <button
              onClick={() => {
                toggleMobileMenu();
                logout();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('auth.logout') || 'Logout'}</span>
            </button>
          </div>
          <div className="text-center pt-1">
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider">
              Modern House OMS • v2.4.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
