import React from 'react';
import { Order } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { X, Calendar, User, Phone, MapPin, CreditCard, Receipt, Printer, Trash2, Edit } from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onPrint?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdminUser: boolean;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ 
  order, 
  onClose, 
  onPrint, 
  onEdit, 
  onDelete,
  isAdminUser
}) => {
  const { t, formatCurrency, formatDate, formatTime } = useTranslation();
  const { customers, products, employees } = useAppContext();

  const customer = customers.find(c => c.id === order.customerId);
  const salesperson = employees.find(e => e.id === order.employeeId);

  // Extract VAT info
  const vatPercent = order.items[0]?.vatPercent || 0;
  const vatAmount = order.items.reduce((sum, item) => sum + (item.vatAmount || 0), 0);
  const discountAmount = order.subtotal * (order.discount / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-scale">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('orders.print_modal.invoice_title') || 'Invoice'}: {order.orderNumber}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDate(order.date)} &bull; {formatTime(order.date)}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Customer Info Card */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                {t('orders.print_modal.bill_to') || 'Bill To'}
              </span>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {customer?.name || order.customerId || t('general.not_applicable')}
                  </span>
                </div>
                {customer?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{customer.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment & Staff Card */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                {t('orders.print_modal.payment_method') || 'Payment & Staff'}
              </span>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span>
                    <strong>{t('orders.print_modal.payment_method') || 'Method'}:</strong>{' '}
                    {t(`orders.payment_methods.${order.paymentMethod}`) || order.paymentMethod}
                  </span>
                </div>
                {order.benefitPayRef && (
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-xs text-gray-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900">
                      Ref: {order.benefitPayRef}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>
                    <strong>{t('orders.print_modal.salesperson') || 'Salesperson'}:</strong>{' '}
                    {salesperson?.name || t('general.not_applicable')}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Items Table */}
          <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gray-50/50 dark:bg-gray-700/20 px-4 py-2 font-semibold text-sm border-b border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300">
              {t('orders.print_modal.item') || 'Products List'}
            </div>
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50/80 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3">{t('orders.print_modal.item') || 'Item'}</th>
                  <th className="px-4 py-3 text-center">{t('orders.print_modal.qty') || 'Qty'}</th>
                  <th className="px-4 py-3 text-right">{t('orders.print_modal.price') || 'Price'}</th>
                  {vatPercent > 0 && <th className="px-4 py-3 text-right">VAT ({vatPercent}%)</th>}
                  <th className="px-4 py-3 text-right">{t('orders.print_modal.total') || 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {order.items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  const itemNetTotal = item.price * item.quantity;
                  const itemVat = item.vatAmount || 0;
                  const itemWithVatTotal = itemNetTotal + itemVat;

                  return (
                    <tr key={index} className="hover:bg-gray-50/40 dark:hover:bg-gray-700/20">
                      <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">
                        {product?.name || item.name || 'Unknown Product'}
                      </td>
                      <td className="px-4 py-3.5 text-center text-gray-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {formatCurrency(item.price)}
                      </td>
                      {vatPercent > 0 && (
                        <td className="px-4 py-3.5 text-right text-gray-500">
                          {formatCurrency(itemVat)}
                        </td>
                      )}
                      <td className="px-4 py-3.5 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(itemWithVatTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals Card */}
          <div className="flex justify-end">
            <div className="w-full sm:w-80 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl space-y-2 border border-gray-100 dark:border-gray-700/50">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{t('orders.print_modal.subtotal') || 'Subtotal'}:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>{t('orders.print_modal.discount') || 'Discount'} ({order.discount}%):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {vatPercent > 0 && (
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{t('orders.print_modal.vat') || 'VAT'} ({vatPercent}%):</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(vatAmount)}
                  </span>
                </div>
              )}
              {order.deliveryFee !== undefined && (
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{t('orders.print_modal.delivery_fee') || 'Delivery fee'}:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(order.deliveryFee)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>{t('orders.print_modal.grand_total') || 'Grand Total'}:</span>
                <span className="text-green-600">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          
          <div className="flex items-center gap-1.5">
            {isAdminUser ? (
              <>
                {onEdit && (
                  <button 
                    onClick={onEdit}
                    className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg transition-all"
                    title={t('general.edit') || 'Edit'}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={onDelete}
                    className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-400">
                {t('orders.modal.manager_restricted') || 'Admin privilege required for edits.'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onPrint && (
              <button 
                onClick={onPrint}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>{t('orders.print_modal.print_button') || 'Print'}</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow-sm"
            >
              {t('general.close') || 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailsModal;
