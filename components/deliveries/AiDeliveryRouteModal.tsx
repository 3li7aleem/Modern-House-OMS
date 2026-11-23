import React, { useState, useMemo } from 'react';
import { Delivery, Order, Customer, Driver } from '../../types';
import { optimizeBahrainDeliveryRoute, OptimizedDeliveryStop } from '../../lib/aiService';
import {
  Sparkles,
  X,
  MapPin,
  Clock,
  Navigation,
  Send,
  MessageSquare,
  Users,
  Compass,
  CheckCircle,
  Truck,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface AiDeliveryRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveries: Delivery[];
  orders: Order[];
  customers: Customer[];
  drivers: Driver[];
}

export const AiDeliveryRouteModal: React.FC<AiDeliveryRouteModalProps> = ({
  isOpen,
  onClose,
  deliveries,
  orders,
  customers,
  drivers
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Active (non-delivered) deliveries
  const activeDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      if (d.status === 'Delivered') return false;
      if (selectedDriverId !== 'all' && d.driverId !== selectedDriverId) return false;
      return true;
    });
  }, [deliveries, selectedDriverId]);

  // Compute optimized stops using AI algorithm
  const stops: OptimizedDeliveryStop[] = useMemo(() => {
    return optimizeBahrainDeliveryRoute(activeDeliveries, orders, customers);
  }, [activeDeliveries, orders, customers]);

  if (!isOpen) return null;

  // Grouping counts by Governorate
  const govCounts = stops.reduce((acc, stop) => {
    acc[stop.governorate] = (acc[stop.governorate] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSendToDriver = () => {
    let manifestText = `🗺️ *خطة المسار الذكي لتوصيل شحنات مودرن هاوس*\n`;
    manifestText += `التاريخ: ${new Date().toLocaleDateString('ar-BH')} | إجمالي الشحنات: ${stops.length}\n`;
    manifestText += `------------------------------------\n\n`;

    stops.forEach((s) => {
      manifestText += `*محطة #${s.recommendedSequence}* 🕒 ${s.estimatedTimeSlot}\n`;
      manifestText += `👤 العميل: ${s.customerName}\n`;
      manifestText += `📦 الطلب: ${s.orderNumber} | المنطقة: ${s.area} (${s.governorate})\n`;
      if (s.delivery.address) manifestText += `📍 العنوان: ${s.delivery.address}\n`;
      manifestText += `🗺️ خرائط Google: https://maps.google.com/?q=${encodeURIComponent(s.delivery.address || s.area)}\n\n`;
    });

    manifestText += `\n✨ تم التوليد بنظام الذكاء الاصطناعي - Modern House OMS`;

    const assignedDriver = drivers.find(d => d.id === selectedDriverId);
    const driverPhone = assignedDriver?.phone ? assignedDriver.phone.replace(/\D/g, '') : '';
    const url = driverPhone
      ? `https://wa.me/${driverPhone}?text=${encodeURIComponent(manifestText)}`
      : `https://wa.me/?text=${encodeURIComponent(manifestText)}`;
    window.open(url, '_blank');
  };

  const handleSendCustomerEta = (stop: OptimizedDeliveryStop) => {
    const cust = customers.find(c => c.id === stop.delivery.customerId);
    const phone = cust?.phone ? cust.phone.replace(/\D/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(stop.whatsappEtaDraft)}`
      : `https://wa.me/?text=${encodeURIComponent(stop.whatsappEtaDraft)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-indigo-700/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">ترتيب مسار التوصيل الذكي (AI Route Planner)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  مخصص لمملكة البحرين 🇧🇭
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 mt-0.5">
                تجميع جغرافي للشحنات، جدولة المواعيد التقديرية، وإرسال إشعارات ETA الفورية للعملاء والسائقين
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Summary Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">تصفية حسب السائق:</span>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">كل السائقين ({deliveries.filter(d => d.status !== 'Delivered').length} شحنة نشطة)</option>
              {drivers.map(drv => (
                <option key={drv.id} value={drv.id}>
                  {drv.name} ({deliveries.filter(d => d.driverId === drv.id && d.status !== 'Delivered').length} شحنة)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
              {stops.length} محطات توصيل
            </span>
            {Object.entries(govCounts).map(([gov, count]) => (
              <span key={gov} className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                {gov}: {count}
              </span>
            ))}
          </div>
        </div>

        {/* Stops List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {stops.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-base">لا توجد شحنات قيد التوصيل حالياً للمسار المختار.</p>
              <p className="text-xs mt-1">جميع الطلبات مكتملة أو لم يتم تعيين شحنات لهذا السائق.</p>
            </div>
          ) : (
            stops.map((stop, idx) => (
              <div
                key={stop.delivery.id}
                className="group relative bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Sequence + Info */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black flex items-center justify-center flex-shrink-0 shadow-md">
                    #{stop.recommendedSequence}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {stop.customerName}
                      </h4>
                      <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                        {stop.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        {stop.governorate} • {stop.area}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        الموعد التقديري: {stop.estimatedTimeSlot}
                      </span>
                      {stop.delivery.address && (
                        <span className="flex items-center gap-1 truncate max-w-[280px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {stop.delivery.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                  {/* Google Maps Nav */}
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(stop.delivery.address || stop.area)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                    title="فتح في خرائط Google"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-500" />
                    <span>ملاحة</span>
                  </a>

                  {/* Send ETA to Customer via WhatsApp */}
                  <button
                    onClick={() => handleSendCustomerEta(stop)}
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="إرسال رسالة الوصول المتوقع للعميل عبر الواتساب"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>إرسال موعد الوصول للعميل</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>تم بناء المسار الذكي بحسب القرب الجغرافي ونقاط الانطلاق بمعرض مودرن هاوس.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              إغلاق
            </button>

            {stops.length > 0 && (
              <button
                onClick={handleSendToDriver}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Send className="w-4 h-4 text-emerald-200" />
                <span>إرسال خطة المسار الكاملة للسائق (واتساب)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiDeliveryRouteModal;
