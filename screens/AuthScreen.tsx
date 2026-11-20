import React from 'react';
import LoginModal from '../components/auth/LoginModal';
import Logo from '../components/layout/Logo';
import { useTranslation } from '../contexts/LanguageContext';

const AuthScreen: React.FC = () => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  return (
    <div 
      className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950" 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Background ambient lighting and subtle textured grid */}
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Modern House Luxury Branding Header */}
      <div className="mb-6 flex flex-col items-center text-center z-10">
        <div className="mb-3 transform hover:scale-105 transition-transform duration-300">
          <Logo className="h-14 w-auto" showText={false} />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <span>{isAr ? 'مودرن هاوس للتجارة' : 'Modern House for Trading'}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
            OMS
          </span>
        </h1>
        <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">
          {isAr 
            ? 'إدارة مبيعات مودرن هاوس • أجهزة Built-in • إكسسوارات وأحواض المطابخ استانلس ستيل' 
            : 'Modern House Sales Management • Built-in Appliances • Kitchen Accessories & Stainless Sinks'}
        </p>
      </div>

      {/* Main Login Card Container */}
      <div className="w-full max-w-md z-10">
        <LoginModal 
          onClose={() => {}} 
          onLoginSuccess={() => {}} 
          isStandalone={true}
        />
      </div>

      {/* Footer System Info */}
      <div className="mt-8 text-center text-[11px] text-slate-500 z-10 flex items-center gap-3">
        <span>Modern House OMS v1.1</span>
        <span>•</span>
        <span>{isAr ? 'قاعدة بيانات محلية مؤمنة' : 'Secure Local Database'}</span>
      </div>
    </div>
  );
};

export default AuthScreen;
