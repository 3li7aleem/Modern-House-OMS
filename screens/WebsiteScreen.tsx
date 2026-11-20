import React, { useState, useMemo, useEffect } from "react";
import { 
  Languages, LogIn, LayoutDashboard, ArrowRight, ShoppingBag, 
  Sparkles, KeyRound, CheckCircle2, ShieldCheck, Truck, 
  Ruler, Flame, HelpCircle, Phone, MapPin, MessageCircle, 
  Search, SlidersHorizontal, Eye, Heart, Star, ChevronLeft, ChevronRight,
  Layers, Package, Award
} from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useAppContext } from "../contexts/AppContext";
import { useTranslation } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSettings } from "../contexts/SettingsContext";
import { Product, RequestItem } from "../types";
import RequestCartModal from "../components/website/RequestCartModal";
import LoginModal from "../components/auth/LoginModal";
import ProductQuickViewModal from "../components/website/ProductQuickViewModal";
import { StorageImage } from "../components/StorageImage";
import Logo from "../components/layout/Logo";

// Toast component
const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-6 right-6 bg-amber-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs z-50 flex items-center gap-2 border border-amber-400"
    >
      <CheckCircle2 className="w-4 h-4 text-slate-950" />
      <span>{message}</span>
    </motion.div>
  );
};

// Luxury Product Card for Showroom Website
const ProductCard: React.FC<{
  product: Product;
  index: number;
  onAddToCart: (p: Product) => void;
  onQuickView: (p: Product) => void;
}> = ({ product, index, onAddToCart, onQuickView }) => {
  const { t, formatCurrency, language } = useTranslation();
  const isAr = language === 'ar';
  const isAvailable = (product.stock || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(0.3, index * 0.04), duration: 0.4 }}
      className="h-full"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 flex flex-col h-full group overflow-hidden">
        {/* Image Container */}
        <div className="relative aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-800 p-3">
          <div className="w-full h-full rounded-2xl overflow-hidden relative">
            <StorageImage
              src={product.imageUrl || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop"}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
            />
            {/* Dark gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="w-full py-2 px-3 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold text-xs backdrop-blur-md shadow-md hover:bg-amber-500 hover:text-slate-950 transition flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isAr ? 'معاينة سريعة' : 'Quick View'}</span>
              </button>
            </div>
          </div>

          {/* Category Badge */}
          {product.category && (
            <span className="absolute top-5 right-5 rtl:right-auto rtl:left-5 bg-slate-950/80 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/30 shadow-md">
              {product.category}
            </span>
          )}

          {/* Stock Status Pill */}
          <span className={`absolute bottom-5 right-5 rtl:right-auto rtl:left-5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isAvailable 
              ? 'bg-emerald-500/90 text-white' 
              : 'bg-rose-500/90 text-white'
          }`}>
            {isAvailable ? (isAr ? 'متوفر بالمعرض' : 'In Stock') : (isAr ? 'حسب الطلب' : 'Out of Stock')}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col flex-1 justify-between text-start" dir={isAr ? 'rtl' : 'ltr'}>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {product.name}
            </h3>
            {product.sku && (
              <p className="text-[11px] font-mono text-slate-400 mb-2">
                SKU: {product.sku}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-2">
            <div>
              <span className="text-[10px] text-slate-400 block">{isAr ? 'السعر' : 'Price'}</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                {formatCurrency(product.salePrice)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* WhatsApp Fast Inquiry Button */}
              <a
                href={`https://wa.me/97335965477?text=${encodeURIComponent(
                  `السلام عليكم مودرن هاوس للتجارة، أود الاستفسار عن توفر ومواصفات "${product.name}" (كود: ${product.sku || product.id}) المعروض بسعر ${product.salePrice} د.ب.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:text-slate-950 transition border border-emerald-500/30 flex items-center justify-center shadow-xs"
                title={isAr ? 'استفسار عبر واتساب' : 'Inquire via WhatsApp'}
              >
                <MessageCircle className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => onAddToCart(product)}
                disabled={!isAvailable}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-amber-600 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs transition shadow-sm disabled:opacity-40 flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isAr ? 'طلب' : 'Request'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const WebsiteScreen: React.FC = () => {
  const { products, addRequest, currentUser, setView } = useAppContext();
  const { settings } = useSettings();
  const { t, language, changeLanguage, formatCurrency } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isAr = language === 'ar';

  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [toastInfo, setToastInfo] = useState<{ message: string; key: number }>({ message: "", key: 0 });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => window.location.pathname === "/login");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const activeProducts = useMemo(() => products.filter(p => p.status !== 'Archived'), [products]);
  
  const cartItemCount = useMemo(() => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }, [cart]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [activeProducts, selectedCategory, searchQuery]);

  const handleAddToCart = (product: Product) => {
    setCart(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
    setToastInfo({
      message: isAr ? `تمت إضافة "${product.name}" إلى سلة الطلب` : `Added "${product.name}" to request`,
      key: Date.now()
    });
  };

  const handlePlaceOrder = async (
    items: RequestItem[],
    customerName: string,
    customerPhone: string,
    customerAddress: string,
  ) => {
    try {
      await addRequest({ customerName, customerPhone, customerAddress, items });
      setCart({});
    } catch (error) {
      console.error("Failed to send request:", error);
      throw error;
    }
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    setView("oms");
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden relative" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* ============================================================== */}
      {/* 1. TOP SHOWROOM NAVIGATION BAR                                 */}
      {/* ============================================================== */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 h-18 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-auto" showText={true} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Showroom Contact link */}
            <a 
              href="https://wa.me/97335965477?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AA%D8%AC%D9%87%D9%8A%D8%B2%D8%A7%D8%AA%20%D9%88%D9%85%D8%B7%D8%A7%D8%A8%D8%AE%20%D9%85%D9%88%D8%AF%D8%B1%D9%86%20%D9%87%D8%A7%D9%88%D8%B3" 
              target="_blank" 
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isAr ? 'واتساب المعرض' : 'WhatsApp'}</span>
            </a>

            {/* Cart Button */}
            {cartItemCount > 0 && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="h-10 px-3.5 flex items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black text-xs gap-1.5 shadow-md shadow-amber-500/20"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{cartItemCount}</span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              type="button"
              onClick={changeLanguage}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition text-xs font-bold"
              title="تغيير اللغة / Change Language"
            >
              <Languages className="w-4 h-4" />
            </button>

            {/* Login / Dashboard Button */}
            <button
              type="button"
              aria-label="Login / Dashboard"
              onClick={() => {
                if (currentUser) {
                  setView("oms");
                } else {
                  setIsLoginModalOpen(true);
                }
              }}
              className="px-4 py-2 flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold text-xs hover:brightness-110 shadow-sm transition"
            >
              {currentUser ? <LayoutDashboard className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{currentUser 
                ? (isAr ? 'لوحة التحكم' : 'Dashboard') 
                : (isAr ? 'دخول النظام (OMS)' : 'Staff Login')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. LUXURY SHOWROOM HERO BANNER                                 */}
      {/* ============================================================== */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 backdrop-blur-md mb-6 shadow-lg">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'مودرن هاوس للتجارة — مملكة البحرين' : 'Modern House for Trading — Bahrain'}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-white mb-6">
            {isAr ? (
              <>
                أرقى المطابخ العصرية الفاخرة<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                  والأجهزة البلت إن المتطورة
                </span>
              </>
            ) : (
              <>
                Luxury Modern Kitchens &<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                  Premium Built-in Appliances
                </span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
            {isAr 
              ? 'تصميم وتفصيل مطابخ حديثة بأعلى معايير الإتقان، مع تشكيلة متكاملة من أفران وشفاطات ومسطحات البلت إن، وأحواض النانو الألمانية، وإكسسوارات التخزين الذكي.'
              : 'Custom luxury kitchens with precision craftsmanship, paired with world-class built-in ovens, hoods, hobs, smart nano sinks, and modern accessories.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}
              className="px-6 sm:px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition active:scale-95"
            >
              {isAr ? 'تصفح كتالوج الأجهزة والمعرض' : 'Browse Showroom Catalog'}
            </button>

            <a
              href="https://wa.me/97335965477?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%AD%D8%AC%D8%B2%20%D9%85%D9%88%D8%B9%D8%AF%20%D8%A7%D8%B3%D8%AA%D8%B4%D8%A7%D8%B1%D8%A9%20%D9%88%D8%AA%D8%B5%D9%85%D9%8A%D9%85%20%D9%85%D8%B7%D8%A8%D8%AE%20%D9%85%D8%B9%20%D9%85%D9%88%D8%AF%D8%B1%D9%86%20%D9%87%D8%A7%D9%88%D8%B3"
              target="_blank"
              rel="noreferrer"
              className="px-6 sm:px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-sm transition flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'طلب تصميم وتفصيل مطبخ' : 'Request 3D Kitchen Design'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. SHOWROOM VALUE PILLARS (4 GUARANTEES)                       */}
      {/* ============================================================== */}
      <section className="py-8 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="space-y-1.5 p-3">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {isAr ? 'ضمان رسمي معتمد' : 'Official Warranty'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'ضمان شامل حتى 5 سنوات على الأجهزة' : 'Up to 5 years certified warranty'}
              </p>
            </div>

            <div className="space-y-1.5 p-3">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Ruler className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {isAr ? 'تصميم ثلاثي الأبعاد 3D' : 'Custom 3D Design'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'مقايسة وتخطيط دقيق لمطبخ أحلامك' : 'Tailored spatial layout & 3D render'}
              </p>
            </div>

            <div className="space-y-1.5 p-3">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {isAr ? 'توصيل وتركيب احترافي' : 'Expert Installation'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'فريق فني متخصص وضبط ميزان دقيق' : 'Specialized technicians & dispatch'}
              </p>
            </div>

            <div className="space-y-1.5 p-3">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {isAr ? 'دفعات إنجاز ميسرة' : 'Milestone Payments'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'دفعات مرحلية حسب مراحل التصنيع' : 'Structured progress-based payments'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. SHOWROOM PRODUCTS CATALOG SECTION                           */}
      {/* ============================================================== */}
      <main id="catalog" className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Package className="w-4 h-4" />
              <span>{isAr ? 'كتالوج المعرض المباشر' : 'Live Showroom Catalog'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {isAr ? 'تشكيلة الأجهزة وتجهيزات المطابخ' : 'Showroom Collection'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isAr ? `يتم عرض ${filteredProducts.length} من أصل ${activeProducts.length} صنف متوفر في المعرض` : `Showing ${filteredProducts.length} of ${activeProducts.length} items`}
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? "بحث بالاسم، الكود، أو الصنف..." : "Search name, SKU, or category..."}
              className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-400 outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            {isAr ? 'جميع الأجهزة والأصناف' : 'All Products'}
          </button>

          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
              {isAr ? 'لم يتم العثور على نتائج مطابقة' : 'No matching products found'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isAr ? 'جرب البحث بكلمة أخرى أو قم بإلغاء التصفية' : 'Try searching another keyword or clearing the filter'}
            </p>
            <button
              type="button"
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              {isAr ? 'إعادة ضبط البحث' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                index={idx}
                onAddToCart={handleAddToCart}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* 5. SHOWROOM FOOTER & LOCATION INFO                             */}
      {/* ============================================================== */}
      <footer className="bg-slate-950 text-white pt-16 pb-12 border-t border-slate-900">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">
          
          <div className="md:col-span-5 space-y-4">
            <Logo className="h-10 w-auto" showText={true} textColorClass="text-white" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {isAr 
                ? 'مودرن هاوس للتجارة — رواد تصميم وتفصيل المطابخ الفاخرة وأحدث أجهزة البلت إن وأحواض النانو في مملكة البحرين.' 
                : 'Modern House for Trading — Pioneers in luxury custom kitchens, built-in appliances, and designer sinks in Bahrain.'}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">
                {isAr ? 'المعرض مفتوح للزيارة والاستشارات' : 'Showroom Open for Consultations'}
              </span>
            </div>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-black tracking-widest uppercase text-amber-400">
              {isAr ? 'موقع المعرض والتواصل' : 'Location & Contact'}
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{isAr ? 'سوق واقف - مدينة حمد - مملكة البحرين' : 'Souq Waqif, Hamad Town, Bahrain'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span dir="ltr">+973 35965477 / 77905477</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a 
                  href="https://wa.me/97335965477" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-amber-400 transition underline"
                >
                  {isAr ? 'محادثة مباشرة عبر واتساب' : 'Direct WhatsApp Chat'}
                </a>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black tracking-widest uppercase text-amber-400 mb-3">
                {isAr ? 'منظومة الإدارة' : 'System Access'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  if (currentUser) {
                    setView("oms");
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-white hover:border-amber-500/40 transition text-xs font-bold flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'دخول لوحة تحكم المعرض (OMS)' : 'Staff OMS Login'}</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 mt-6 md:mt-0">
              &copy; {new Date().getFullYear()} {isAr ? 'مودرن هاوس للتجارة' : 'Modern House for Trading'}.
            </p>
          </div>

        </div>
      </footer>

      {/* Floating WhatsApp Consultation Button */}
      <a
        href="https://wa.me/97335965477?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%85%D9%88%D8%AF%D8%B1%D9%86%20%D9%87%D8%A7%D9%88%D8%B3%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AA%D8%AC%D9%87%D9%8A%D8%B2%D8%A7%D8%AA%20%D9%88%D9%85%D8%B7%D8%A7%D8%A8%D8%AE%20%D9%85%D9%88%D8%AF%D8%B1%D9%86%20%D9%87%D8%A7%D9%88%D8%B3"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-400/40 hover:scale-105 transition-all select-none"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
        <MessageCircle className="w-4 h-4" />
        <span>{isAr ? 'استشر خبير المطابخ واتساب' : 'Kitchen Consultation'}</span>
      </a>

      {/* Floating Request Cart Pill */}
      {cartItemCount > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 bg-amber-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 font-black text-xs border border-amber-400"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{isAr ? `سلة الطلب (${cartItemCount})` : `Cart (${cartItemCount})`}</span>
        </motion.button>
      )}

      {/* Modals */}
      {isCartOpen && <RequestCartModal cart={cart} onClose={() => setIsCartOpen(false)} onSubmit={handlePlaceOrder} setCart={setCart} />}
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} />}
      {quickViewProduct && <ProductQuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onAddToCart={handleAddToCart} />}
      
      {toastInfo.message && <Toast key={toastInfo.key} message={toastInfo.message} onClose={() => setToastInfo({ message: "", key: 0 })} />}
    </div>
  );
};

export default WebsiteScreen;
