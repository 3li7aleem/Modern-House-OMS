import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  MonitorSmartphone, 
  FileText, 
  Box, 
  Menu,
  DollarSign,
  Truck,
  Wrench,
  Users
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { Screen } from '../../types';

interface NavActionCandidate {
  id: Screen;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}

const ALL_CANDIDATES: NavActionCandidate[] = [
  { id: 'dashboard', icon: Home, labelKey: 'sidebar.nav.dashboard' },
  { id: 'pos', icon: MonitorSmartphone, labelKey: 'sidebar.nav.pos' },
  { id: 'orders', icon: FileText, labelKey: 'sidebar.nav.orders' },
  { id: 'inventory', icon: Box, labelKey: 'sidebar.nav.inventory' },
  { id: 'customers', icon: Users, labelKey: 'sidebar.nav.customers' },
  { id: 'finance', icon: DollarSign, labelKey: 'sidebar.nav.finance' },
  { id: 'delivery', icon: Truck, labelKey: 'sidebar.nav.delivery' },
  { id: 'maintenance', icon: Wrench, labelKey: 'sidebar.nav.maintenance' },
];

const BottomNav: React.FC = () => {
  const { activeScreen, setActiveScreen, toggleMobileMenu, currentUser } = useAppContext();
  const { t, language } = useTranslation();

  const userPermissions = currentUser?.permissions || [];

  // Filter candidates that the user has permission to see, take up to 4 items
  const permittedActions = ALL_CANDIDATES.filter(item => userPermissions.includes(item.id)).slice(0, 4);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_30px_rgb(0,0,0,0.06)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {permittedActions.map((item) => {
          const isActive = activeScreen === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 transition-all group relative active:scale-95 touch-manipulation"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-primary/10 text-primary scale-110' 
                  : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 font-bold transition-all duration-300 truncate max-w-[64px] ${
                isActive ? 'text-primary opacity-100 font-extrabold' : 'text-slate-400 opacity-70'
              }`}>
                {t(item.labelKey)}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-1 w-8 h-1 bg-primary rounded-b-full shadow-xs"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
        
        {/* Menu / More button to trigger the mobile sidebar drawer */}
        <button
          onClick={toggleMobileMenu}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95 transition touch-manipulation"
          aria-label="Open Full Navigation Menu"
        >
          <div className="p-1.5 rounded-xl">
            <Menu className="w-5 h-5 stroke-[2px]" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold opacity-70">
            {language === 'ar' ? 'القائمة' : 'Menu'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
