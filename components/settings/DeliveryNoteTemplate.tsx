import React from 'react';
import { Delivery, Order, Customer } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { StorageImage } from '../StorageImage';

interface DeliveryNoteTemplateProps {
  delivery: Delivery;
  settings: ReturnType<typeof useSettings>['settings'];
  sampleOrder?: Order;
  sampleCustomer?: Customer;
}

const DeliveryNoteTemplate: React.FC<DeliveryNoteTemplateProps> = ({ delivery, settings, sampleOrder, sampleCustomer }) => {
  const { t, formatDate } = useTranslation();
  const { orders, customers, products, drivers } = useAppContext();

  const order = sampleOrder || orders.find(s => s.id === delivery.orderId);
  const customer = sampleCustomer || customers.find(c => c.id === delivery.customerId);
  const driver = drivers.find(d => d.id === delivery.driverId);

  if (!order || !customer) {
    return (
      <div className="p-6 text-black bg-white">
        <p>Error: Could not find order or customer details for this delivery.</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-black bg-white">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
                <img src={settings.logoUrl} alt="Company Logo" className="h-20 w-auto" />
                <div className="ms-2">
                    <h2 className="text-lg font-bold">{t('sidebar.title')}</h2>
                    <p className="text-xs">{t('delivery.print_modal.cr_number')}</p>
                </div>
            </div>
            <div className="text-xs text-right">
                <p className="font-bold">{t('sidebar.title')}</p>
                <p>{settings.footerText.split(':')[1]?.split('-')[0]?.trim()}</p>
                <p>{settings.footerText.split('-')[1]?.trim()}</p>
            </div>
        </div>
        
        <div className="text-center py-1 my-4" style={{ backgroundColor: settings.accentColor, color: 'white' }}>
            <h3 className="font-bold text-lg">{t('delivery.print_modal.delivery_note_title')} #{order.orderNumber} / {formatDate(order.date)}</h3>
        </div>

        <div className="mb-6">
            <p className="font-bold">{t('delivery.print_modal.deliver_to')}:</p>
            <p>{customer.name}</p>
            <p>{customer.address}</p>
            {customer.phone && <p dir="ltr" className="text-left rtl:text-right">{customer.phone}</p>}
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left mb-6 border-collapse">
                <thead className="border-2 border-black">
                    <tr>
                        <th className="p-2 border border-black w-16 text-center">{t('delivery.print_modal.sl_no')}</th>
                        <th className="p-2 border border-black w-24 text-center">Image</th>
                        <th className="p-2 border border-black">{t('delivery.print_modal.description')}</th>
                        <th className="p-2 border border-black w-24 text-center">{t('orders.print_modal.qty')}</th>
                    </tr>
                </thead>
                <tbody>
                {order.items.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                    <tr key={item.productId} className="border-b border-gray-300">
                        <td className="p-2 border border-black text-center">{index + 1}</td>
                        <td className="p-2 border border-black text-center">
                            {product?.imageUrl ? (
                                <StorageImage 
                                    src={product.imageUrl} 
                                    alt={product?.name}
                                    className="w-16 h-16 object-cover mx-auto"
                                    crossOrigin="anonymous"
                                />
                            ) : '-'}
                        </td>
                        <td className="p-2 border border-black">{product?.name || 'N/A'}</td>
                        <td className="p-2 border border-black text-center">{item.quantity}</td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
        </div>

        <div className="text-xs space-y-1 mb-10 whitespace-pre-wrap">
            {settings.deliveryNoteNotice}
        </div>

        <div className="flex flex-col sm:flex-row justify-between mt-12 pt-6 text-sm gap-12 sm:gap-4">
            <div className="text-center w-full sm:w-1/2">
                <p className="font-bold">{t('delivery.print_modal.received_by')}</p>
                <p className="border-b border-black mt-16"></p>
            </div>
            <div className="text-center w-full sm:w-1/2">
                <p className="font-bold">{t('delivery.print_modal.delivered_by')}</p>
                <p className="mt-2">{driver?.name || t('general.not_applicable')}</p>
                <p className="border-b border-black mt-12"></p>
            </div>
        </div>
        
        <div className="text-center mt-8 font-semibold">
          <p>{settings.deliveryNoteContact}</p>
          <p>{settings.deliveryNoteThankYou}</p>
        </div>
    </div>
  );
};

export default DeliveryNoteTemplate;