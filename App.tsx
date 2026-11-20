import React, { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileSidebar from './components/layout/MobileSidebar';
import BottomNav from './components/layout/BottomNav';
import DashboardScreen from './screens/DashboardScreen';
import PosScreen from './screens/PosScreen';
import OrdersScreen from './screens/SalesScreen';
import InventoryScreen from './screens/InventoryScreen';
import FinanceScreen from './screens/FinanceScreen';
import CustomersScreen from './screens/CustomersScreen';
import SuppliersScreen from './screens/SuppliersScreen';
import DeliveryScreen from './screens/DeliveriesScreen';
import UsersScreen from './screens/UsersScreen';
import PurchaseOrdersScreen from './screens/PurchaseOrdersScreen';
import MaintenanceScreen from './screens/MaintenanceScreen';
import AuthScreen from './screens/AuthScreen';
import { PublicInvoiceScreen } from './components/public/PublicInvoiceScreen';
import RequestsScreen from './screens/RequestsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ReportsScreen from './screens/ReportsScreen';
import MarketingScreen from './screens/MarketingScreen';
import { QuotationsScreen } from './screens/QuotationsScreen';
import SetupWizardModal from './components/setup/SetupWizardModal';
import { useAppContext } from './contexts/AppContext';
import { useTranslation } from './contexts/LanguageContext';
import { useSettings } from './contexts/SettingsContext';
import { Bell, X, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-background dark:bg-dark-background">
    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-text-primary dark:text-dark-text-primary">Loading Data...</p>
  </div>
);

interface AppToast {
  id: string;
  message: string;
  customerName: string;
  requestId: string;
}

const App: React.FC = () => {
  const { 
    view, 
    activeScreen, 
    currentUser, 
    isMobileMenuOpen, 
    toggleMobileMenu, 
    setActiveScreen, 
    isLoading,
    requests
  } = useAppContext();

  const { t } = useTranslation();
  const { voiceGreetingEnabled, entranceSupplicationEnabled } = useSettings();
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [toasts, setToasts] = useState<AppToast[]>([]);
  const [seenRequestIds, setSeenRequestIds] = useState<Set<string>>(new Set());
  const [isFirstRequestsLoad, setIsFirstRequestsLoad] = useState(true);
  const [showSupplication, setShowSupplication] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (entranceSupplicationEnabled) {
        setShowSupplication(true);
      }
      try {
        if (voiceGreetingEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const greeting = new SpeechSynthesisUtterance(`أهلاً بك يا ${currentUser.name || 'المدير العام'}، تم تسجيل الدخول بنجاح. بارك الله في تجارتكم.`);
          greeting.lang = 'ar-SA';
          greeting.rate = 0.95;
          window.speechSynthesis.speak(greeting);
        }
      } catch {}
      const timer = setTimeout(() => setShowSupplication(false), 8000);
      return () => clearTimeout(timer);
    } else {
      setShowSupplication(false);
    }
  }, [currentUser?.id, voiceGreetingEnabled, entranceSupplicationEnabled]);

  useEffect(() => {
    // Session check bypassed to deactivate login
    setHasCheckedSession(true);

    if (window.omsDesktop) {
      window.omsDesktop.call('setupStatus').then((status: any) => {
        if (status?.setupRequired) {
          setSetupRequired(true);
        }
      }).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (requests && requests.length > 0) {
      if (isFirstRequestsLoad) {
        setSeenRequestIds(new Set(requests.map(r => r.id)));
        setIsFirstRequestsLoad(false);
      } else {
        const newRequests = requests.filter(r => !seenRequestIds.has(r.id));
        if (newRequests.length > 0) {
          newRequests.forEach(req => {
            const toastId = Math.random().toString();
            setToasts(prev => [
              ...prev,
              {
                id: toastId,
                customerName: req.customerName,
                message: t('header.notifications.new_website_request', { customerName: req.customerName }) || `New website request from ${req.customerName}.`,
                requestId: req.id
              }
            ]);

            // Auto-dismiss after 6 seconds
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== toastId));
            }, 6000);
          });

          // Play a standard tiny chime if audio context is supported:
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
          } catch (e) {
            console.log("No audio playback capability, skipping chime:", e);
          }

          setSeenRequestIds(prev => {
            const updated = new Set(prev);
            newRequests.forEach(r => updated.add(r.id));
            return updated;
          });
        }
      }
    } else if (requests && requests.length === 0 && isFirstRequestsLoad) {
      setIsFirstRequestsLoad(false);
    }
  }, [requests, isFirstRequestsLoad, seenRequestIds, t]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);
  
  useEffect(() => {
    if (currentUser) {
      const userPermissions = currentUser.permissions || [];
      if (!userPermissions.includes(activeScreen)) {
        const firstPermittedScreen = userPermissions[0];
        const defaultScreen = firstPermittedScreen || 'dashboard';
        setActiveScreen(defaultScreen);
      }
    }
  }, [currentUser, activeScreen, setActiveScreen]);

  if (setupRequired) {
    return <SetupWizardModal onComplete={() => setSetupRequired(false)} />;
  }

  if (isLoading || !hasCheckedSession) {
    return <LoadingSpinner />;
  }

  // Public Invoice View on Vercel without requiring authentication
  const isInvoiceRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/invoice/') ||
    window.location.search.includes('invoice=') ||
    window.location.hash.includes('invoice')
  );
  if (isInvoiceRoute) {
    return <PublicInvoiceScreen />;
  }

  // --- Require Login to Access OMS ---
  if (!currentUser) {
    return <AuthScreen />;
  }

  const userPermissions = currentUser.permissions || [];

  const renderScreen = () => {
    const userPermissions = currentUser?.permissions || [];
    
    // While useEffect updates the state, render the permitted fallback immediately to avoid rendering unauthorized screens for a frame.
    const screenToRender = userPermissions.includes(activeScreen) ? activeScreen : (userPermissions[0] || 'dashboard');

    return (
      <motion.div
        key={screenToRender}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full h-full"
      >
        {(() => {
          switch (screenToRender) {
            case 'dashboard': return <DashboardScreen />;
            case 'pos': return <PosScreen />;
            case 'orders': return <OrdersScreen />;
            case 'quotations': return <QuotationsScreen />;
            case 'inventory': return <InventoryScreen />;
            case 'finance': return <FinanceScreen />;
            case 'customers': return <CustomersScreen />;
            case 'suppliers': return <SuppliersScreen />;
            case 'delivery': return <DeliveryScreen />;
            case 'requests': return <RequestsScreen />;
            case 'users': return <UsersScreen />;
            case 'purchaseOrders': return <PurchaseOrdersScreen />;
            case 'maintenance': return <MaintenanceScreen />;
            case 'settings': return <SettingsScreen />;
            case 'reports': return <ReportsScreen />;
            case 'marketing': return <MarketingScreen />;
            default: return <DashboardScreen />;
          }
        })()}
      </motion.div>
    );
  };

  return (
    <>
      {showSupplication && entranceSupplicationEnabled && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[150] w-[92%] max-w-xl animate-fade-in-scale">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/60 text-white p-4 sm:p-5 rounded-3xl shadow-2xl shadow-amber-950/50 backdrop-blur-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shrink-0 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-400">دعاء دخول المنظومة والمعرض</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">مودرن هاوس</span>
                </div>
                <div className="text-sm sm:text-base font-black tracking-wide text-white font-sans leading-relaxed">
                  «بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا»
                </div>
              </div>
            </div>

            {/* Clear, Prominent Close Button */}
            <button 
              type="button"
              onClick={() => {
                setShowSupplication(false);
                try {
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                } catch {}
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 transition shrink-0 cursor-pointer"
              title="إغلاق التنبيه وإيقاف الصوت"
            >
              <span>إغلاق</span>
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}
      <div className="flex h-[100dvh] min-h-[100dvh] text-foreground font-sans relative overflow-hidden">
        <MobileSidebar isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
        <Sidebar />
        <div 
          className="flex-1 flex flex-col overflow-hidden relative z-10 md:pb-0"
          style={{
            paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))'
          }}
        >
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar scroll-smooth relative bg-slate-50/40 dark:bg-slate-950/40">
            {/* Subtle textured background pattern & soft ambient gradient overlay for visual depth */}
            <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25 bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]" />
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-primary/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-gradient-to-tr from-sky-500/8 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="container mx-auto px-2.5 sm:px-6 md:px-8 py-3 sm:py-6 lg:py-10 max-w-[1600px] relative z-10">
              {renderScreen()}
            </div>
          </main>
        </div>
        <BottomNav />
      </div>

      {/* Floating Real-time Toast Alerts */}
      <div 
        className="fixed bottom-20 sm:bottom-6 right-3 left-3 sm:left-auto sm:right-6 z-[80] flex flex-col gap-2.5 max-w-sm pointer-events-none"
      >
        {toasts.map(toast => (
          <div 
            key={toast.id}
            onClick={() => {
              setActiveScreen('requests');
              setToasts(prev => prev.filter(t => t.id !== toast.id));
            }}
            className="pointer-events-auto bg-card dark:bg-dark-card border-l-4 border-primary dark:border-primary shadow-2xl rounded-xl p-4 flex gap-3 items-start cursor-pointer hover:scale-102 transition transform duration-300 animate-slide-in-right relative"
            style={{ direction: t('general.direction') as any }}
          >
            <div className="p-2 bg-primary/10 rounded-full text-primary mt-0.5">
              <Bell className="w-5 h-5 animate-bounce text-primary" />
            </div>
            <div className="flex-1 min-w-0 pr-6 pl-1 text-left rtl:text-right">
              <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                {t('requests.new_alert_title') || 'New Order Alert!'}
              </h4>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">
                {toast.message}
              </p>
              <span className="text-[10px] text-primary font-medium hover:underline inline-block mt-2">
                {t('requests.view_now') || 'Click to view requests page →'}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setToasts(prev => prev.filter(t => t.id !== toast.id));
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>

      <Analytics />
    </>
  );
};

export default App;