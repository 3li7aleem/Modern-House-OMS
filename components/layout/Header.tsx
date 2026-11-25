import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { StorageImage } from '../StorageImage';
import { useAppContext } from '../../contexts/AppContext';
import { Screen, AppNotification } from '../../types';
import EditProfileModal from '../users/EditProfileModal';
import { SystemHealthModal } from './SystemHealthModal';
import { AiCopilotModal } from '../ai/AiCopilotModal';
import { 
  Sun, 
  Moon, 
  Menu, 
  Globe, 
  Bell, 
  Languages, 
  Search, 
  X, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck,
  ChevronDown,
  MessageSquareQuote,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Bot
} from 'lucide-react';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t, language, changeLanguage } = useTranslation();
  const isAr = language === 'ar';
  const { 
    currentUser, products, customers, orders, activeScreen, setActiveScreen, setSelectedItemId, 
    globalSearchQuery, setGlobalSearchQuery,
    isSidebarOpen, toggleSidebar, toggleMobileMenu, notifications, markNotificationAsRead,
    logout, updateUser, setView,
  } = useAppContext();
  
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K Global Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold);
  const unreadNotifications = notifications.filter(n => !n.read);
  
  const notificationCount = lowStockItems.length + unreadNotifications.length;

  const handleNotificationClick = (notification: AppNotification) => {
    markNotificationAsRead(notification.id);
    if(notification.relatedId) {
      setSelectedItemId(notification.relatedId);
    }
    setActiveScreen(notification.screen);
    setIsNotificationDropdownOpen(false);
  };
  
  const handleLowStockClick = () => {
    setActiveScreen('inventory');
    setIsNotificationDropdownOpen(false);
  };

  const searchResults = useMemo(() => {
    if (!globalSearchQuery || !globalSearchQuery.trim()) return [];
    
    const query = globalSearchQuery.toLowerCase();
    const results: Array<{type: string, id: string, label: string, sublabel: string}> = [];
    
    products.forEach(p => {
      if (p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query))) {
        results.push({ type: 'product', id: p.id, label: p.name, sublabel: `SKU: ${p.sku}` });
      }
    });
    
    customers.forEach(c => {
      if (c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query))) {
        results.push({ type: 'customer', id: c.id, label: c.name, sublabel: `Phone: ${c.phone}` });
      }
    });
    
    orders.forEach(o => {
      if (o.id.toLowerCase().includes(query) || (o.orderNumber && o.orderNumber.toLowerCase().includes(query))) {
        results.push({ type: 'order', id: o.id, label: `Order #${o.orderNumber || o.id.substring(0, 8)}`, sublabel: `Total: ${o.totalAmount} BHD` });
      }
    });
    
    return results.slice(0, 8);
  }, [globalSearchQuery, products, customers, orders]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isMobileSearchVisible && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isMobileSearchVisible]);

  const handleLogout = () => {
    setIsUserDropdownOpen(false);
    logout();
  };

  return (
    <>
      <header className="flex items-center justify-between px-3 sm:px-6 py-0 h-16 sm:h-[72px] glass-header dark:glass-header z-20 relative shadow-xs">
        {/* Left side: Mobile Hamburger / Desktop Toggle + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile menu toggle */}
          <button 
            onClick={toggleMobileMenu} 
            className="md:hidden p-2 -ml-1 rtl:-ml-0 rtl:-mr-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between items-start">
              <span className="h-0.5 w-5 bg-slate-800 dark:bg-slate-200 rounded-full transition-all" />
              <span className="h-0.5 w-3.5 bg-amber-500 rounded-full transition-all" />
              <span className="h-0.5 w-5 bg-slate-800 dark:bg-slate-200 rounded-full transition-all" />
            </div>
          </button>

          {/* Desktop sidebar collapse toggle */}
          <button 
            onClick={toggleSidebar} 
            className="hidden md:flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 border border-slate-200/80 dark:border-slate-700/80 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            title={isSidebarOpen ? (isAr ? 'طي القائمة الجانبية' : 'Collapse Sidebar') : (isAr ? 'توسيع القائمة الجانبية' : 'Expand Sidebar')}
            aria-label="Toggle Sidebar"
          >
            <div className="w-5 h-4 flex flex-col justify-between items-start">
              <span className={`h-0.5 bg-slate-700 dark:bg-slate-200 rounded-full transition-all duration-300 ${isSidebarOpen ? 'w-5' : 'w-3'}`} />
              <span className="h-0.5 w-3.5 bg-amber-500 rounded-full transition-all duration-300" />
              <span className={`h-0.5 bg-slate-700 dark:bg-slate-200 rounded-full transition-all duration-300 ${isSidebarOpen ? 'w-3' : 'w-5'}`} />
            </div>
          </button>
          
          <div className="flex flex-col min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <span>{isAr ? 'مودرن هاوس' : 'Modern House'}</span>
              <span>/</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{t(`sidebar.nav.${activeScreen}`)}</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
              {t(`sidebar.nav.${activeScreen}`)}
            </h1>
          </div>
        </div>
        
        {/* Desktop Global Search */}
        <div className="hidden md:flex flex-1 justify-center max-w-xl mx-4" ref={searchRef}>
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rtl:left-auto rtl:right-3.5" />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder={isAr ? 'البحث السريع في النظام (المنتجات، العملاء، الفواتير)... Ctrl+K' : 'Search globally (products, customers, orders)... Ctrl+K'}
              className="w-full pl-10 pr-16 rtl:pl-16 rtl:pr-10 py-2 bg-slate-100/80 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 focus:border-amber-500 dark:focus:border-amber-500 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/20 transition-all text-slate-900 dark:text-white"
              value={globalSearchQuery || ''}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
            <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold font-mono text-slate-400 bg-white dark:bg-slate-700/80 rounded-md border border-slate-200 dark:border-slate-600 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none shadow-2xs">
              Ctrl K
            </span>
            
            {isSearchOpen && globalSearchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-96 overflow-y-auto z-50">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-medium">No records found.</div>
                ) : (
                  <ul className="py-2">
                    {searchResults.map((res, idx) => (
                      <li key={`${res.type}-${res.id}-${idx}`}>
                        <button
                          className="w-full text-left rtl:text-right px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col items-start gap-1"
                          onClick={() => {
                            setIsSearchOpen(false);
                            if (res.type === 'product') {
                              setActiveScreen('inventory');
                            } else if (res.type === 'customer') {
                              setActiveScreen('customers');
                            } else if (res.type === 'order') {
                              setActiveScreen('orders');
                            }
                            setSelectedItemId(res.id);
                          }}
                        >
                          <div className="flex items-center gap-2 w-full justify-between">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{res.label}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{res.type}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">{res.sublabel}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right side Actions (Mobile & Desktop) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Executive AI Copilot Action Icon Button */}
          <button
            type="button"
            onClick={() => setIsAiCopilotOpen(true)}
            className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-500 focus:outline-none transition select-none cursor-pointer group"
            title={isAr ? 'المساعد التنفيذي الذكي (Gemini AI)' : 'Executive AI Copilot (Gemini)'}
            aria-label={isAr ? 'المساعد التنفيذي الذكي' : 'Executive AI Copilot'}
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
          </button>

          {/* Live Sync Status Pill */}
          <div 
            onClick={() => setIsHealthModalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold cursor-pointer hover:bg-emerald-500/20 transition select-none"
            title={isAr ? 'مركز صحة النظام والمزامنة' : 'System Health & Sync Center'}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isAr ? 'محلي وسحابي متصل' : 'Cloud & Local Synced'}</span>
          </div>

          {/* WhatsApp & MCP Quick Pill */}
          <button
            type="button"
            onClick={() => setActiveScreen('settings')}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition select-none"
            title={isAr ? 'إعدادات واتساب والذكاء الاصطناعي MCP' : 'WhatsApp & MCP Settings'}
          >
            <MessageSquareQuote className="w-3.5 h-3.5 text-amber-500" />
            <span>MCP WhatsApp</span>
          </button>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications Dropdown */}
          <div ref={notificationDropdownRef} className="relative">
            <button 
              onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)} 
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition focus:outline-none"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 sm:w-5 sm:h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {isNotificationDropdownOpen && (
              <div className="absolute end-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-card rounded-2xl shadow-2xl z-50 dark:bg-dark-card border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-3.5 font-bold border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white flex items-center justify-between text-sm">
                  <span>{t('header.notifications.title')}</span>
                  <span className="text-xs font-normal text-slate-400">{notificationCount}</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificationCount === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-500">{t('header.notifications.no_notifications')}</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {unreadNotifications.map(notification => (
                        <li key={notification.id}>
                          <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); handleNotificationClick(notification); }} 
                            className="block px-3.5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                          >
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {t(notification.messageKey, notification.messageParams)}
                            </p>
                          </a>
                        </li>
                      ))}
                      {lowStockItems.map(product => (
                        <li key={`low-stock-${product.id}`}>
                          <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); handleLowStockClick(); }} 
                            className="block px-3.5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                          >
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                              {t('header.notifications.low_stock_item', { name: product.name, stock: product.stock })}
                            </p>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Language Toggle (Desktop/Tablet) */}
          <button
            onClick={changeLanguage}
            className="hidden sm:flex p-2 text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition focus:outline-none"
            title={language === 'ar' ? 'English' : 'العربية'}
          >
            <Languages className="w-5 h-5" />
          </button>

          {/* Theme Toggle (Desktop/Tablet) */}
          <button 
            onClick={toggleTheme} 
            className="hidden sm:flex p-2 text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition focus:outline-none"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </button>

          {/* User Profile Avatar & Dropdown */}
          <div ref={userDropdownRef} className="relative">
            <button 
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} 
              className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
            >
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <StorageImage 
                  src={currentUser?.imageUrl || "https://i.pravatar.cc/150"} 
                  className="object-cover w-full h-full" 
                  alt={currentUser?.name || "avatar"} 
                />
              </div>
              {currentUser && (
                <div className="hidden lg:flex flex-col text-start">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[100px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    {currentUser.role}
                  </span>
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute end-0 mt-2 w-64 bg-card rounded-2xl shadow-2xl z-50 dark:bg-dark-card border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser?.name || 'User'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {currentUser?.email || ''}
                  </p>
                  <span className="inline-flex items-center text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1.5">
                    <ShieldCheck className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                    {currentUser?.role || 'Staff'}
                  </span>
                </div>

                {/* Dropdown Links */}
                <div className="p-1.5">
                  <button 
                    onClick={() => {
                      setIsEditProfileModalOpen(true);
                      setIsUserDropdownOpen(false);
                    }} 
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-start"
                  >
                    <UserIcon className="w-4 h-4 text-primary" />
                    <span>{t('auth.edit_profile')}</span>
                  </button>

                  {/* Mobile Quick switches */}
                  <div className="sm:hidden border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                    <button
                      onClick={changeLanguage}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Languages className="w-4 h-4 text-primary" />
                        <span>{language === 'ar' ? 'English' : 'عربي'}</span>
                      </div>
                    </button>
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    >
                      <div className="flex items-center gap-2.5">
                        {theme === 'light' ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
                        <span>{theme === 'light' ? (language === 'ar' ? 'الوضع الداكن' : 'Dark Mode') : (language === 'ar' ? 'الوضع الفاتح' : 'Light Mode')}</span>
                      </div>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                  <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition text-start"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('auth.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Global Search Bar Dropdown Overlay */}
      {isMobileSearchVisible && (
        <div className="md:hidden p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-md relative z-20">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rtl:left-auto rtl:right-3" />
            <input
              ref={mobileSearchInputRef}
              type="text"
              placeholder={t('header.search_placeholder') || 'Search globally...'}
              className="w-full pl-9 pr-9 rtl:pl-9 rtl:pr-9 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
              value={globalSearchQuery || ''}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
            />
            <button
              onClick={() => {
                setIsMobileSearchVisible(false);
                setGlobalSearchQuery('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search results overlay on mobile */}
          {globalSearchQuery && (
            <div className="mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 max-h-64 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 font-medium">No records found.</div>
              ) : (
                <ul className="py-1">
                  {searchResults.map((res, idx) => (
                    <li key={`m-${res.type}-${res.id}-${idx}`}>
                      <button
                        className="w-full text-left rtl:text-right px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col items-start gap-0.5"
                        onClick={() => {
                          setIsMobileSearchVisible(false);
                          if (res.type === 'product') {
                            setActiveScreen('inventory');
                          } else if (res.type === 'customer') {
                            setActiveScreen('customers');
                          } else if (res.type === 'order') {
                            setActiveScreen('orders');
                          }
                          setSelectedItemId(res.id);
                        }}
                      >
                        <div className="flex items-center gap-2 w-full justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{res.label}</span>
                          <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{res.type}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{res.sublabel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && currentUser && (
        <EditProfileModal
          user={currentUser}
          onClose={() => setIsEditProfileModalOpen(false)}
          onSave={async (updatedData) => {
            await updateUser(currentUser.id, updatedData);
          }}
        />
      )}

      {/* System Health & Sync Center Modal */}
      {isHealthModalOpen && (
        <SystemHealthModal onClose={() => setIsHealthModalOpen(false)} />
      )}

      {/* Executive AI Copilot Modal */}
      <AiCopilotModal
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
      />
    </>
  );
};

export default Header;
