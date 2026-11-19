import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { Driver } from '../../types';
import { Truck, Phone, Plus, Trash2, X, MessageSquare, CheckCircle, Car } from 'lucide-react';

interface DriversManagementModalProps {
  onClose: () => void;
}

const DriversManagementModal: React.FC<DriversManagementModalProps> = ({ onClose }) => {
  const { drivers, deliveries, addDriver, deleteDriver, currentUser } = useAppContext();
  const { t, language } = useTranslation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('Car');
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Count active deliveries per driver
  const getActiveDeliveriesCount = (driverId: string) => {
    return deliveries.filter(d => d.driverId === driverId && d.status !== 'Delivered').length;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال اسم السائق' : 'Driver name is required');
      return;
    }
    setErrorMsg('');
    setIsAdding(true);
    try {
      await addDriver(name.trim(), phone.trim(), vehicle);
      setName('');
      setPhone('');
      setVehicle('Car');
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to add driver');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (driver: Driver) => {
    if (currentUser?.role !== 'Admin') {
      alert(language === 'ar' ? 'مطلوب صلاحية مدير النظام لحذف السائقين.' : 'Admin permission required.');
      return;
    }
    const activeCount = getActiveDeliveriesCount(driver.id);
    if (activeCount > 0) {
      if (
        !confirm(
          language === 'ar'
            ? `هذا السائق لديه ${activeCount} طلب توصيل قيد التنفيذ حالياً. هل أنت متأكد من الحذف؟`
            : `This driver has ${activeCount} active deliveries. Are you sure you want to delete?`
        )
      ) {
        return;
      }
    } else if (
      !confirm(
        language === 'ar'
          ? `هل أنت متأكد من حذف السائق (${driver.name})؟`
          : `Delete driver (${driver.name})?`
      )
    ) {
      return;
    }

    try {
      await deleteDriver(driver.id);
    } catch (e: any) {
      alert(e.message || 'Failed to delete driver');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-dark-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border dark:border-dark-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'إدارة السائقين والمناديب' : 'Drivers & Couriers Management'}
              </h3>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {language === 'ar'
                  ? `إجمالي السائقين المسجلين: ${drivers.length}`
                  : `Total registered drivers: ${drivers.length}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Add Driver Card */}
          <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-border/80 dark:border-dark-border/80">
            <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary dark:text-dark-text-secondary mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-primary" />
              {language === 'ar' ? 'إضافة مندوب / سائق جديد' : 'Add New Driver / Courier'}
            </h4>

            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-text-primary dark:text-dark-text-primary">
                  {language === 'ar' ? 'اسم السائق *' : 'Driver Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: علاء، حسن...' : 'e.g., Alaa, Hassan...'}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-text-primary dark:text-dark-text-primary">
                  {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+973 3xxxxxxx"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-text-primary dark:text-dark-text-primary">
                  {language === 'ar' ? 'نوع المركبة' : 'Vehicle Type'}
                </label>
                <div className="flex gap-2">
                  <select
                    value={vehicle}
                    onChange={e => setVehicle(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-border dark:border-dark-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="Car">{language === 'ar' ? 'سيارة (Car)' : 'Car'}</option>
                    <option value="Van">{language === 'ar' ? 'فان / باص (Van)' : 'Van'}</option>
                    <option value="Pickup">{language === 'ar' ? 'بيك آب (Pickup)' : 'Pickup'}</option>
                    <option value="Motorcycle">{language === 'ar' ? 'دراجة (Motorcycle)' : 'Motorcycle'}</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isAdding}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 disabled:opacity-50 flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
                  </button>
                </div>
              </div>
            </form>

            {errorMsg && (
              <p className="text-xs text-red-500 mt-2 font-medium">{errorMsg}</p>
            )}
          </div>

          {/* Drivers List */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary dark:text-dark-text-secondary">
              {language === 'ar' ? 'قائمة السائقين' : 'Registered Drivers'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {drivers.map(driver => {
                const activeCount = getActiveDeliveriesCount(driver.id);
                return (
                  <div
                    key={driver.id}
                    className="p-3.5 rounded-xl bg-card dark:bg-dark-card border border-border dark:border-dark-border shadow-xs hover:border-primary/40 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {driver.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-sm text-text-primary dark:text-dark-text-primary truncate">
                          {driver.name}
                        </h5>
                        <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-dark-text-secondary mt-0.5">
                          {driver.phone ? (
                            <span dir="ltr" className="font-mono text-[11px] text-gray-500">
                              {driver.phone}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">
                              {language === 'ar' ? 'بدون هاتف' : 'No phone'}
                            </span>
                          )}
                          <span>•</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              activeCount > 0
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                          >
                            {activeCount > 0
                              ? language === 'ar'
                                ? `${activeCount} طلب نشط`
                                : `${activeCount} active`
                              : language === 'ar'
                              ? 'متاح'
                              : 'Available'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {driver.phone && (
                        <>
                          <a
                            href={`tel:${driver.phone}`}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title={language === 'ar' ? 'اتصال' : 'Call'}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              const cleaned = driver.phone?.replace(/\D/g, '') || '';
                              window.open(`https://wa.me/${cleaned}`, '_blank');
                            }}
                            className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(driver)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        title={language === 'ar' ? 'حذف السائق' : 'Delete driver'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {drivers.length === 0 && (
                <div className="col-span-full py-8 text-center text-text-secondary dark:text-dark-text-secondary text-xs">
                  {language === 'ar'
                    ? 'لم يتم تسجيل أي سائقين بعد. استخدم النموذج أعلاه لإضافة سائق.'
                    : 'No drivers registered yet. Use the form above to add a driver.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border dark:border-dark-border flex justify-end bg-muted/20">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs"
          >
            {language === 'ar' ? 'تم / إغلاق' : 'Done / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriversManagementModal;
