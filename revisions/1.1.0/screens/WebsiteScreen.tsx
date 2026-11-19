import React, { useState, useMemo, useEffect, useRef } from "react";
import { Languages, LogIn, LayoutDashboard, ArrowRight, ShoppingBag, Utensils, ChefHat, CookingPot } from "lucide-react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "motion/react";
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

// 3D Tilt Wrapper Component (Enabled on Desktop, Clean pass-through on Mobile)
const TiltCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);
  }, []);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    x.set(0);
    y.set(0);
  };

  if (isTouchDevice) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </motion.div>
  );
};

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m8.66-15.66l-.707.707M4.04 19.96l-.707.707M21 12h-1M4 12H3m15.66 8.66l-.707-.707M4.04 4.04l-.707-.707"
    />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

// Toast component
const Toast: React.FC<{ message: string; onClose: () => void }> = ({
  message,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-24 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-30"
    >
      {message}
    </motion.div>
  );
};

// Animated Product Card
const ProductCard: React.FC<{
  product: Product;
  index: number;
  onAddToCart: (p: Product) => void;
  onQuickView: (p: Product) => void;
}> = ({ product, index, onAddToCart, onQuickView }) => {
  const { t, formatCurrency } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <TiltCard className="h-full">
        <div className="bg-white/60 dark:bg-black/60 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-3xl shadow-xl hover:shadow-2xl overflow-hidden flex flex-col h-full group transition-all duration-300">
          <div className="relative overflow-hidden p-4 pb-0">
            <div className="relative aspect-square overflow-hidden rounded-2xl">
              <StorageImage
                src={product.imageUrl || "https://via.placeholder.com/300"}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onQuickView(product)}
                  className="text-white font-bold tracking-wider border-2 border-white/50 bg-white/20 backdrop-blur-md rounded-full px-6 py-2.5 hover:bg-white hover:text-black transition-all"
                >
                  {t("website.quick_view")}
                </motion.button>
              </div>
            </div>
            {product.category && (
              <span className="absolute top-7 right-7 bg-white/90 dark:bg-black/80 backdrop-blur-md text-slate-800 dark:text-slate-100 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-lg">
                {product.category}
              </span>
            )}
          </div>
          <div className="p-6 flex flex-col flex-grow text-center">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2" style={{ transform: "translateZ(20px)" }}>
              {product.name}
            </h3>
            <p className="text-2xl font-black text-primary drop-shadow-sm mb-6" style={{ transform: "translateZ(30px)" }}>
              {formatCurrency(product.salePrice)}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAddToCart(product)}
              className="w-full mt-auto px-6 py-3.5 bg-slate-900 dark:bg-primary text-white rounded-2xl font-black tracking-widest uppercase text-xs shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={product.stock === 0}
            >
              {product.stock > 0
                ? t("website.add_to_request")
                : t("inventory.status_labels.out_of_stock")}
            </motion.button>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
};

const SocialIcons: React.FC = () => (
  <div className="flex justify-center md:justify-start space-x-6">
    {[1, 2].map((i) => (
      <motion.a
        key={i}
        href="#"
        whileHover={{ y: -5, scale: 1.1 }}
        className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white border border-white/10 hover:border-white/30 transition-all"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d={i === 1 ? "M12 2.163c3.204 0..." : "M22 12c0-5.523..."} />
        </svg>
      </motion.a>
    ))}
  </div>
);

const WebsiteScreen: React.FC = () => {
  const {
    products,
    addRequest,
    currentUser,
    setView,
  } = useAppContext();
  const { settings } = useSettings();
  const { t, language, changeLanguage, formatCurrency } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toastInfo, setToastInfo] = useState<{ message: string; key: number }>({
    message: "",
    key: 0,
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(
    () => window.location.pathname === "/login",
  );
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );

  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "Active"),
    [products],
  );
  const cartItemCount = useMemo(
    () =>
      Object.values(cart).reduce((sum: number, qty: number) => sum + qty, 0),
    [cart],
  );

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      activeProducts.map((p) => p.category).filter(Boolean),
    );
    return ["All", ...Array.from(uniqueCategories)];
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeProducts, searchQuery, selectedCategory]);

  const bestsellers = useMemo(
    () => activeProducts.slice(0, 4),
    [activeProducts],
  );

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const currentQty = prevCart[product.id] || 0;
      if (currentQty >= product.stock) return prevCart;
      return { ...prevCart, [product.id]: currentQty + 1 };
    });
    setToastInfo({
      message: t("website.added_to_request_toast", { name: product.name }),
      key: Date.now(),
    });
  };

  const handlePlaceOrder = async (
    items: RequestItem[],
    customerName: string,
    customerPhone: string,
    customerAddress: string,
  ) => {
    try {
      await addRequest({
        customerName,
        customerPhone,
        customerAddress,
        items,
      });
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
    <div className="bg-[#fcfcfd] dark:bg-slate-950 min-h-screen font-sans selection:bg-primary selection:text-white overflow-x-hidden relative">
      {/* Subtle textured dot grid & ambient gradient overlay for depth */}
      <div className="fixed inset-0 pointer-events-none opacity-30 dark:opacity-15 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:28px_28px] -z-10" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none -z-10" />
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-black/5 dark:border-white/5">
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex justify-between items-center">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <Logo className="h-8 sm:h-10 w-auto" showText={true} />
          </motion.div>
          
          <motion.div 
            initial={{ x: 20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1"
          >
            {cartItemCount > 0 && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="h-8 sm:h-10 px-2.5 sm:px-3 flex items-center justify-center rounded-xl bg-primary text-white font-bold text-xs gap-1.5 shadow-sm"
                aria-label="View Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{cartItemCount}</span>
              </button>
            )}
            <button
              onClick={changeLanguage}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300"
              aria-label="Toggle Language"
            >
              <Languages className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>
            <div className="w-px h-5 sm:h-6 bg-slate-300 dark:bg-slate-700 mx-0.5 sm:mx-1" />
            <button
              onClick={async () => {
                if (currentUser) setView("oms");
                else if (window.omsDesktop) {
                  const { authService } = await import('../src/desktop/localService');
                  await authService.signInAnonymously();
                } else setIsLoginModalOpen(true);
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all text-primary"
              aria-label="Login / Dashboard"
            >
              {currentUser ? <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" /> : <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </motion.div>
        </div>
      </header>

      <div className="relative min-h-[85vh] sm:h-[100vh] flex items-center justify-center perspective-deep overflow-hidden pt-20 pb-12 sm:py-0">
        <motion.div 
          style={{ y, scale, opacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(92,115,230,0.15)_0%,transparent_70%)]" />
          <img 
            src={settings.heroImageUrl || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop"} 
            className="w-full h-full object-cover opacity-80 dark:opacity-60 scale-110" 
            alt="حوض مطبخ فاخر وحديث" 
          />
        </motion.div>
        
        {/* Animated Kitchen Icons (3D World feel) */}
        <div className="absolute inset-0 pointer-events-none">
          {[ChefHat, Utensils, CookingPot].map((Icon, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0.15, 0.35, 0.15], 
                scale: [0.8, 1.2, 0.8],
                x: [0, idx % 2 === 0 ? 50 : -50, 0],
                y: [0, idx % 2 === 0 ? -50 : 50, 0],
                rotateZ: [0, 360],
              }}
              transition={{ duration: 15 + idx * 5, repeat: Infinity, ease: "linear" }}
              className="absolute text-primary/20 dark:text-white/10 hidden sm:block"
              style={{
                 top: `${20 + idx * 30}%`,
                 left: `${15 + idx * 40}%`,
              }}
            >
              <Icon size={120 + idx * 40} strokeWidth={0.5} />
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center">
            <motion.h1 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: "circOut" }}
              className="text-4xl sm:text-7xl md:text-9xl font-black tracking-tightest leading-tight text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-500 mb-4 sm:mb-8"
            >
              PREMIUM<br/>KITCHENS
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="text-sm sm:text-xl md:text-2xl max-w-2xl mx-auto dark:text-slate-400 text-slate-600 font-light tracking-widest uppercase mb-8 sm:mb-12 px-2"
            >
              Elite components for the heart of your home
            </motion.p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}
              className="group relative h-14 sm:h-16 w-56 sm:w-64 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black tracking-widest uppercase text-xs sm:text-sm rounded-full shadow-2xl transition-all"
            >
              <span className="relative z-10">Start Exploring</span>
              <div className="absolute inset-0 rounded-full bg-primary blur-xl opacity-0 group-hover:opacity-40 transition-opacity" />
            </motion.button>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-24 relative z-20">
        <section className="mb-20 sm:mb-32">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-center mb-10 sm:mb-16 dark:text-white"
          >
            COLLECTIONS
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 h-auto md:h-[600px] lg:h-[700px]">
             {/* Bestseller Spot */}
             <motion.div 
               whileHover={{ scale: 0.98 }}
               className="min-h-[280px] sm:min-h-[360px] md:min-h-0 md:col-span-8 group relative rounded-[28px] sm:rounded-[40px] overflow-hidden cursor-pointer shadow-3xl bg-slate-900"
               onClick={() => { setSelectedCategory("Sinks"); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}
             >
                <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-6 left-6 sm:bottom-12 sm:left-12">
                   <p className="text-primary font-black tracking-widest text-xs uppercase mb-2">Featured</p>
                   <h3 className="text-3xl sm:text-5xl md:text-7xl font-black text-white leading-none">LUXURY<br/>SINKS</h3>
                </div>
                <div className="absolute bottom-6 right-6 sm:bottom-12 sm:right-12 h-12 w-12 sm:h-16 sm:w-16 bg-white rounded-full flex items-center justify-center text-slate-900 transform md:translate-y-20 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500">
                  <ArrowRight size={24} />
                </div>
             </motion.div>

             <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 md:grid-rows-2 gap-6 md:gap-8">
                <motion.div 
                  whileHover={{ scale: 0.95 }}
                  className="min-h-[180px] sm:min-h-[200px] md:min-h-0 relative rounded-[28px] sm:rounded-[40px] overflow-hidden cursor-pointer bg-slate-200 dark:bg-slate-800"
                  onClick={() => { setSelectedCategory("Stoves"); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}
                >
                  <img src="https://images.unsplash.com/photo-1556697015-181cdca732a6?q=80&w=1470&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-black/20" />
                  <h4 className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 text-2xl sm:text-3xl font-black text-white">STOVES</h4>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 0.95 }}
                  className="min-h-[180px] sm:min-h-[200px] md:min-h-0 relative rounded-[28px] sm:rounded-[40px] overflow-hidden cursor-pointer bg-primary"
                  onClick={() => { setSelectedCategory("Microwaves"); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}
                >
                  <Utensils size={100} className="absolute -top-10 -right-10 text-white/20 rotate-12" />
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 sm:p-8">
                    <h4 className="text-2xl sm:text-3xl font-black text-white mb-2 underline decoration-4 underline-offset-8">ELECTRONICS</h4>
                    <span className="text-[10px] font-black tracking-widest text-white/70 uppercase">Explore Now</span>
                  </div>
                </motion.div>
             </div>
          </div>
        </section>

        <section id="shop" className="py-12 sm:py-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 sm:mb-20 gap-6 md:gap-8">
            <div>
              <h3 className="text-3xl sm:text-5xl md:text-6xl font-black dark:text-white mb-2 sm:mb-4">OUR SHOP</h3>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md font-medium">Fine tuned precision for the culinary expert. Quality is our obsession.</p>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4 w-full md:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("website.search_placeholder")}
                className="w-full md:w-80 px-4 sm:px-6 py-3 sm:py-4 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-primary dark:text-white text-sm"
              />
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 sm:px-6 py-2 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all ${selectedCategory === category ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                  >
                    {category === "All" ? "Everything" : category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                index={idx}
                product={product}
                onAddToCart={handleAddToCart}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        </section>

        <section className="mt-32 rounded-[60px] bg-slate-900 dark:bg-white p-12 md:p-24 overflow-hidden relative">
          <ChefHat size={300} className="absolute -bottom-20 -right-20 text-white/5 dark:text-slate-900/5 rotate-[-15deg] pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h3 className="text-5xl md:text-7xl font-black text-white dark:text-slate-900 mb-8 leading-tight">
              CRAFTED FOR<br/>EXCELLENCE
            </h3>
            <p className="text-slate-400 dark:text-slate-600 text-lg md:text-xl font-medium leading-relaxed">
              {t("website.about_us_content")}
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-white py-24">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-5">
             <Logo className="h-12 w-auto mb-8" showText={true} textColorClass="text-white" />
             <p className="text-slate-500 max-w-sm mb-12">Building the future of kitchen management and supply. Trusted Choice is your partner in excellence.</p>
             <SocialIcons />
          </div>
          <div className="md:col-span-3">
             <h4 className="text-xs font-black tracking-widest uppercase text-primary mb-8">Contact</h4>
             <p className="text-slate-300 font-medium mb-2">{t("website.footer_phone")}</p>
             <p className="text-slate-500 text-sm">{t("website.footer_address")}</p>
          </div>
          <div className="md:col-span-4 flex flex-col items-end">
             <h4 className="text-6xl font-black text-white/10 mb-8">TRUSTED</h4>
             <p className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
               &copy; {new Date().getFullYear()} {t("general.app_name")}. All Rights Reserved.
             </p>
          </div>
        </div>
      </footer>

      {cartItemCount > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-4 sm:bottom-10 sm:right-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-14 px-4 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl shadow-2xl flex items-center justify-center gap-2 z-50 border border-white/10"
          aria-label="Open Cart"
        >
          <ShoppingBag className="w-5 h-5 sm:w-8 sm:h-8" />
          <span className="sm:hidden text-xs font-black">{cartItemCount} {language === 'ar' ? 'عناصر' : 'items'}</span>
          <span className="hidden sm:flex absolute -top-2 -right-2 bg-primary text-white font-black text-[10px] h-8 w-8 rounded-2xl items-center justify-center border-4 border-slate-900 dark:border-white">
            {cartItemCount}
          </span>
        </motion.button>
      )}

      {isCartOpen && <RequestCartModal cart={cart} onClose={() => setIsCartOpen(false)} onSubmit={handlePlaceOrder} setCart={setCart} />}
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} />}
      {quickViewProduct && <ProductQuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onAddToCart={handleAddToCart} />}
      
      {toastInfo.message && <Toast key={toastInfo.key} message={toastInfo.message} onClose={() => setToastInfo({ message: "", key: 0 })} />}
    </div>
  );
};

export default WebsiteScreen;
