import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Customer } from '../../types';
import { User, Phone, Mail, Building, MapPin, FileText, Tag, ShieldCheck, X, Check } from 'lucide-react';

interface AddCustomerModalProps {
  onClose: () => void;
  onSave?: (customerData: Omit<Customer, 'id' | 'joinDate'>) => void | Promise<void>;
  customerToEdit?: Customer | null;
  onUpdate?: (customerId: string, updatedData: Partial<Customer>) => void | Promise<void>;
}

const BAHRAIN_AREAS = [
  'سوق واقف / مدينة حمد (Souq Waqif / Hamad Town)',
  'المنامة (Manama)',
  'الرفاع الشرقي (East Riffa)',
  'الرفاع الغربي (West Riffa)',
  'المحرق (Muharraq)',
  'مدينة عيسى (Isa Town)',
  'سترة (Sitra)',
  'سلماباد (Salmabad)',
  'توبلي (Tubli)',
  'البديع (Budaiya)',
  'سار (Saar)',
  'الجنبية (Janabiya)',
  'الهملة (Hamala)',
  'الحد (Hidd)',
  'سند (Sanad)',
  'أم الحصم (Umm Al Hassam)',
  'الجفير (Juffair)',
  'السيف (Seef)',
  'عراد (Arad)',
  'الزلاق (Zallaq)',
  'درة البحرين (Durrat Al Bahrain)'
];

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ 
  onClose, 
  onSave, 
  customerToEdit, 
  onUpdate 
}) => {
  const { t, language } = useTranslation();
  const isEditing = Boolean(customerToEdit);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    category: 'Individual' as 'Individual' | 'Commercial' | 'VIP' | 'Wholesale',
    commercialRegister: '',
    taxNumber: '',
    creditLimit: '',
    notes: '',
  });

  const [addressComponents, setAddressComponents] = useState({
    flat: '',
    building: '',
    road: '',
    block: '',
    area: '',
  });

  const [customArea, setCustomArea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill if editing
  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        name: customerToEdit.name || '',
        phone: customerToEdit.phone || '',
        email: customerToEdit.email || '',
        category: (customerToEdit.category as any) || 'Individual',
        commercialRegister: customerToEdit.commercialRegister || '',
        taxNumber: customerToEdit.taxNumber || '',
        creditLimit: customerToEdit.creditLimit ? String(customerToEdit.creditLimit) : '',
        notes: customerToEdit.notes || '',
      });

      // Try to parse existing address if it was combined
      if (customerToEdit.address) {
        setAddressComponents(prev => ({
          ...prev,
          area: customerToEdit.region || '',
        }));
      }
    }
  }, [customerToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddressComponents(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert(language === 'ar' ? 'يرجى إدخال اسم العميل ورقم الهاتف.' : 'Name and Phone are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedArea = addressComponents.area === 'OTHER' ? customArea.trim() : addressComponents.area;
      const { flat, building, road, block } = addressComponents;

      const addressParts = [
        flat ? `${language === 'ar' ? 'شقة/محل' : 'Flat/Shop'} ${flat}` : '',
        building ? `${language === 'ar' ? 'مبنى' : 'Bldg'} ${building}` : '',
        road ? `${language === 'ar' ? 'طريق' : 'Road'} ${road}` : '',
        block ? `${language === 'ar' ? 'مجمع' : 'Block'} ${block}` : '',
        selectedArea ? `${language === 'ar' ? 'المنطقة' : 'Area'}: ${selectedArea}` : '',
      ].filter(Boolean);

      const combinedAddress = addressParts.length > 0 
        ? addressParts.join(', ') 
        : (customerToEdit?.address || '');

      const payload: Partial<Customer> = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        category: formData.category,
        commercialRegister: formData.commercialRegister.trim() || undefined,
        taxNumber: formData.taxNumber.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
        region: selectedArea || undefined,
        address: combinedAddress || undefined,
      };

      if (isEditing && customerToEdit && onUpdate) {
        await onUpdate(customerToEdit.id, payload);
      } else if (onSave) {
        await onSave(payload as Omit<Customer, 'id' | 'joinDate'>);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save customer:", err);
      alert(language === 'ar' ? 'حدث خطأ أثناء حفظ بيانات العميل.' : 'Failed to save customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto transform transition-all animate-fade-in-scale" 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-border dark:border-dark-border bg-gray-50/70 dark:bg-gray-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">
                {isEditing 
                  ? (language === 'ar' ? `تعديل بيانات العميل: ${customerToEdit?.name}` : `Edit Customer: ${customerToEdit?.name}`)
                  : (language === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer')}
              </h3>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {language === 'ar' ? 'سجل تفاصيل العميل، تصنيفه، وعنوانه بدقة' : 'Register customer details, category, and address'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'اسم العميل / المؤسسة' : 'Customer / Company Name'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute top-3 start-3 text-gray-400" />
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder={language === 'ar' ? 'مثال: محمد عبدالله / مطبخ الأصالة' : 'e.g. Mohammed Ali'} 
                  className="ps-10 w-full py-2.5 px-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-sm text-text-primary dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-semibold text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'رقم الهاتف / الواتساب' : 'Phone / WhatsApp'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute top-3 start-3 text-gray-400" />
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="35965477 / 33123456" 
                  className="ps-10 w-full py-2.5 px-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-sm text-text-primary dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Category & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'تصنيف العميل' : 'Customer Category'}
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute top-3 start-3 text-gray-400" />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="ps-10 w-full py-2.5 px-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-sm text-text-primary dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                >
                  <option value="Individual">{language === 'ar' ? 'أفراد (Individual)' : 'Individual'}</option>
                  <option value="Commercial">{language === 'ar' ? 'تجاري / شركات ومطابخ (Commercial)' : 'Commercial'}</option>
                  <option value="VIP">{language === 'ar' ? 'عميل مميز (VIP Client)' : 'VIP Client'}</option>
                  <option value="Wholesale">{language === 'ar' ? 'مبيعات جملة (Wholesale)' : 'Wholesale'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-semibold text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} <span className="text-gray-400 text-xs">({language === 'ar' ? 'اختياري' : 'Optional'})</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute top-3 start-3 text-gray-400" />
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="customer@example.com" 
                  className="ps-10 w-full py-2.5 px-3 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-sm text-text-primary dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" 
                />
              </div>
            </div>
          </div>

          {/* Commercial & VAT details (if Commercial or Wholesale) */}
          {(formData.category === 'Commercial' || formData.category === 'Wholesale' || formData.category === 'VIP') && (
            <div className="p-3.5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'ar' ? 'بيانات التسجيل التجاري والضريبة للمؤسسات' : 'Commercial Registration & Tax Data'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                    {language === 'ar' ? 'رقم السجل التجاري (C.R.)' : 'Commercial Register (C.R.)'}
                  </label>
                  <input 
                    type="text" 
                    name="commercialRegister" 
                    value={formData.commercialRegister} 
                    onChange={handleChange} 
                    placeholder="e.g. 147987-2" 
                    className="w-full py-2 px-3 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-sm text-text-primary dark:text-white outline-none" 
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                    {language === 'ar' ? 'الرقم الضريبي (VAT No.)' : 'VAT / Tax Number'}
                  </label>
                  <input 
                    type="text" 
                    name="taxNumber" 
                    value={formData.taxNumber} 
                    onChange={handleChange} 
                    placeholder="20000XXXXX00002" 
                    className="w-full py-2 px-3 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-sm text-text-primary dark:text-white outline-none" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Structured Address */}
          <div className="border border-border dark:border-dark-border rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/20 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold text-text-primary dark:text-dark-text-primary uppercase tracking-wide">
                {language === 'ar' ? 'تفاصيل العنوان في البحرين' : 'Detailed Address (Bahrain)'}
              </h4>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                {language === 'ar' ? 'المنطقة / المحافظة' : 'Area / Municipality'}
              </label>
              <select
                name="area"
                value={addressComponents.area}
                onChange={handleAddressChange}
                className="w-full py-2 px-3 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-sm text-text-primary dark:text-white outline-none"
              >
                <option value="">{language === 'ar' ? '-- اختر المنطقة --' : '-- Select Area --'}</option>
                {BAHRAIN_AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
                <option value="OTHER">{language === 'ar' ? 'منطقة أخرى (كتابة يدوية)' : 'Other Area (Custom)'}</option>
              </select>
            </div>

            {addressComponents.area === 'OTHER' && (
              <div>
                <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                  {language === 'ar' ? 'اسم المنطقة' : 'Custom Area Name'}
                </label>
                <input
                  type="text"
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل اسم المنطقة' : 'Enter area name'}
                  className="w-full py-2 px-3 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-sm text-text-primary dark:text-white outline-none"
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                  {language === 'ar' ? 'شقة / محل' : 'Flat / Shop'}
                </label>
                <input 
                  type="text" 
                  name="flat" 
                  value={addressComponents.flat} 
                  onChange={handleAddressChange} 
                  placeholder="12 / Shop 4"
                  className="w-full py-2 px-2.5 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs text-text-primary dark:text-white outline-none" 
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                  {language === 'ar' ? 'مبنى / فيلا' : 'Building / Villa'}
                </label>
                <input 
                  type="text" 
                  name="building" 
                  value={addressComponents.building} 
                  onChange={handleAddressChange} 
                  placeholder="345"
                  className="w-full py-2 px-2.5 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs text-text-primary dark:text-white outline-none" 
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                  {language === 'ar' ? 'طريق / شارع' : 'Road / Street'}
                </label>
                <input 
                  type="text" 
                  name="road" 
                  value={addressComponents.road} 
                  onChange={handleAddressChange} 
                  placeholder="2314"
                  className="w-full py-2 px-2.5 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs text-text-primary dark:text-white outline-none" 
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                  {language === 'ar' ? 'المجمع' : 'Block'}
                </label>
                <input 
                  type="text" 
                  name="block" 
                  value={addressComponents.block} 
                  onChange={handleAddressChange} 
                  placeholder="1204"
                  className="w-full py-2 px-2.5 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs text-text-primary dark:text-white outline-none" 
                />
              </div>
            </div>

            {customerToEdit?.address && !addressComponents.flat && !addressComponents.building && (
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary italic">
                {language === 'ar' ? 'العنوان الحالي المسجل:' : 'Current address:'} {customerToEdit.address}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-text-primary dark:text-dark-text-primary">
              {language === 'ar' ? 'ملاحظات وتفضيلات خاصة' : 'Notes & Preferences'}
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder={language === 'ar' ? 'مثال: يفضل التوصيل بالفترة الصباحية، عميل دائم لمعارض المطابخ...' : 'Special notes...'}
              className="w-full p-2.5 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl text-sm text-text-primary dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-dark-border">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-border dark:border-dark-border text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                  : (isEditing ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (language === 'ar' ? 'إضافة العميل' : 'Add Customer'))}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;
