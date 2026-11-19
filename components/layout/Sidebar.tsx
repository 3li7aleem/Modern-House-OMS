import React from 'react';
import { NAV_ITEMS } from '../../constants';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import Logo from './Logo';

const Sidebar: React.FC = () => {
  const { t, language } = useTranslation();
  const { activeScreen, setActiveScreen, currentUser, isSidebarOpen, logout } = useAppContext();

  const userPermissions = currentUser.permissions || [];
  const visibleNavItems = NAV_ITEMS.filter(item => userPermissions.includes(item.screen));


  return (
    <div className="hidden md:flex md:flex-shrink-0 relative z-30">
      <div className={`flex flex-col glass-sidebar dark:glass-sidebar ${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-400 ease-in-out`}>
        <div className="flex items-center justify-center h-[72px] border-b border-white/20 dark:border-white/5 flex-shrink-0 p-2">
           <Logo className={isSidebarOpen ? "h-[50px] w-auto" : "h-[36px] w-auto"} showText={isSidebarOpen} />
        </div>
        <div className="flex flex-col overflow-y-auto">
          <nav className="px-3 py-6 space-y-1">
            {visibleNavItems.map((item) => (
              <a
                key={item.screen}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveScreen(item.screen);
                }}
                className={`group relative flex items-center py-2 text-sm font-medium transition-all duration-200 rounded-xl ${
                  activeScreen === item.screen 
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-950 font-semibold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isSidebarOpen ? 'px-3.5' : 'px-2 justify-center'}`}
              >
                <div className={`relative flex items-center justify-center transition-transform group-hover:scale-105 ${isSidebarOpen ? '' : 'mx-auto'}`}>
                  {item.icon}
                </div>

                {isSidebarOpen && <span className="mx-3 text-[13px] tracking-tight">{t(`sidebar.nav.${item.screen}`)}</span>}
              </a>
            ))}
          </nav>
        </div>

        {/* Quick Lock / Switch User via PIN */}
        <div className="mt-auto p-3 border-t border-white/20 dark:border-white/5">
          <button
            type="button"
            onClick={logout}
            title={t('sidebar.quick_lock') || 'قفل الشاشة / تبديل المستخدم'}
            className={`w-full flex items-center py-2.5 text-xs font-bold text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl transition-all duration-200 shadow-xs btn-press ${
              isSidebarOpen ? 'px-3 justify-start gap-2.5' : 'justify-center'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {isSidebarOpen && <span>{language === 'en' ? 'Quick Lock (PIN)' : 'قفل الشاشة (PIN Lock)'}</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
