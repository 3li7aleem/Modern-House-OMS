import React, { useState } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import { Screen } from '../../types';
import Logo from './Logo';
import { 
  Home, 
  MonitorSmartphone, 
  FileText, 
  FileSpreadsheet, 
  PhoneCall, 
  Box, 
  ShoppingCart, 
  Briefcase, 
  Truck, 
  Wrench, 
  Layers, 
  Users, 
  MessageCircle, 
  DollarSign, 
  BarChart, 
  Shield, 
  Settings, 
  Globe, 
  ChevronDown, 
  Lock
} from 'lucide-react';

export interface NavItemConfig {
  screen: Screen;
  icon: React.ReactElement;
}

export interface NavGroupConfig {
  id: string;
  titleAr: string;
  titleEn: string;
  items: NavItemConfig[];
}

export const SIDEBAR_GROUPS: NavGroupConfig[] = [
  {
    id: 'sales_operations',
    titleAr: 'المبيعات والعمليات',
    titleEn: 'Sales & Operations',
    items: [
      { screen: 'dashboard', icon: <Home className="w-4 h-4 shrink-0" /> },
      { screen: 'pos', icon: <MonitorSmartphone className="w-4 h-4 shrink-0" /> },
      { screen: 'orders', icon: <FileText className="w-4 h-4 shrink-0" /> },
      { screen: 'quotations', icon: <FileSpreadsheet className="w-4 h-4 shrink-0" /> },
      { screen: 'requests', icon: <PhoneCall className="w-4 h-4 shrink-0" /> },
    ]
  },
  {
    id: 'inventory_purchasing',
    titleAr: 'المخزون والمشتريات',
    titleEn: 'Inventory & Purchasing',
    items: [
      { screen: 'inventory', icon: <Box className="w-4 h-4 shrink-0" /> },
      { screen: 'purchaseOrders', icon: <ShoppingCart className="w-4 h-4 shrink-0" /> },
      { screen: 'suppliers', icon: <Briefcase className="w-4 h-4 shrink-0" /> },
    ]
  },
  {
    id: 'services',
    titleAr: 'الخدمات',
    titleEn: 'Services',
    items: [
      { screen: 'delivery', icon: <Truck className="w-4 h-4 shrink-0" /> },
      { screen: 'maintenance', icon: <Wrench className="w-4 h-4 shrink-0" /> },
      { screen: 'contracts', icon: <Layers className="w-4 h-4 shrink-0" /> },
    ]
  },
  {
    id: 'customers_business',
    titleAr: 'العملاء والأعمال',
    titleEn: 'Customers & Business',
    items: [
      { screen: 'customers', icon: <Users className="w-4 h-4 shrink-0" /> },
      { screen: 'marketing', icon: <MessageCircle className="w-4 h-4 shrink-0" /> },
      { screen: 'finance', icon: <DollarSign className="w-4 h-4 shrink-0" /> },
      { screen: 'reports', icon: <BarChart className="w-4 h-4 shrink-0" /> },
    ]
  },
  {
    id: 'system_management',
    titleAr: 'إدارة النظام',
    titleEn: 'System Management',
    items: [
      { screen: 'users', icon: <Shield className="w-4 h-4 shrink-0" /> },
      { screen: 'settings', icon: <Settings className="w-4 h-4 shrink-0" /> },
      { screen: 'website', icon: <Globe className="w-4 h-4 shrink-0" /> },
    ]
  }
];

const Sidebar: React.FC = () => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const { activeScreen, setActiveScreen, currentUser, isSidebarOpen, logout } = useAppContext();

  const [collapsedGroups, setCollapsedGroups] = useState<{ [groupId: string]: boolean }>({});

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const userPermissions: Screen[] = currentUser?.permissions || [];

  return (
    <aside className="hidden md:flex md:flex-shrink-0 relative z-30 select-none">
      <div className={`flex flex-col bg-white dark:bg-slate-900 border-r rtl:border-r-0 rtl:border-l border-slate-200 dark:border-slate-800 ${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out h-screen sticky top-0`}>
        
        {/* Brand Header */}
        <div className="flex items-center justify-center h-16 sm:h-[72px] border-b border-slate-100 dark:border-slate-800 flex-shrink-0 px-3">
          <Logo className={isSidebarOpen ? "h-10 w-auto" : "h-8 w-auto"} showText={isSidebarOpen} />
        </div>

        {/* Grouped Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-4 scrollbar-thin">
          {SIDEBAR_GROUPS.map((group) => {
            // Filter group items according to user permissions
            const visibleItems = group.items.filter(it => 
              userPermissions.length === 0 || userPermissions.includes(it.screen)
            );
            if (visibleItems.length === 0) return null;

            const isGroupCollapsed = !!collapsedGroups[group.id];
            const hasActiveItem = visibleItems.some(it => it.screen === activeScreen);

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Heading (Visible only when sidebar is expanded) */}
                {isSidebarOpen ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <span>{isAr ? group.titleAr : group.titleEn}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isGroupCollapsed ? '-rotate-90 rtl:rotate-90' : 'rotate-0'}`} />
                  </button>
                ) : (
                  <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-2" />
                )}

                {/* Group Items */}
                {(!isGroupCollapsed || !isSidebarOpen) && (
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const isActive = activeScreen === item.screen;
                      const label = t(`sidebar.nav.${item.screen}`);

                      return (
                        <a
                          key={item.screen}
                          href="#"
                          title={!isSidebarOpen ? label : undefined}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveScreen(item.screen);
                          }}
                          className={`group relative flex items-center py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-sm dark:bg-amber-500 dark:text-slate-950 font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                          } ${isSidebarOpen ? 'px-3 gap-3' : 'px-2 justify-center'}`}
                        >
                          <div className={`transition-transform duration-150 group-hover:scale-110 ${isActive ? 'text-amber-400 dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'}`}>
                            {item.icon}
                          </div>

                          {isSidebarOpen && (
                            <span className="truncate leading-none">
                              {label}
                            </span>
                          )}

                          {/* Subtle Active Indicator Dot in Compact Mode */}
                          {!isSidebarOpen && isActive && (
                            <span className="absolute top-1 right-1 rtl:right-auto rtl:left-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom PIN Lock & Session Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={logout}
            title={isAr ? 'قفل الجلسة (PIN Lock)' : 'Quick Lock (PIN)'}
            className={`w-full flex items-center py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 ${
              isSidebarOpen ? 'px-3 justify-start gap-2.5' : 'justify-center'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>{isAr ? 'قفل الجلسة (PIN)' : 'Lock Session (PIN)'}</span>}
          </button>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
