import React from 'react';
import { Request } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';
import { PackageX, FileText, X } from 'lucide-react';

interface RequestDetailModalProps {
  request: Request;
  onClose: () => void;
  onApprove: (request: Request) => void;
  onReject: (request: Request) => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-border/40 dark:border-dark-border/40 last:border-b-0">
    <dt className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{label}</dt>
    <dd className="text-sm text-text-primary dark:text-dark-text-primary sm:col-span-2 font-semibold">{value}</dd>
  </div>
);

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, onClose, onApprove, onReject }) => {
  const { t, formatDate, formatCurrency, formatNumber, language } = useTranslation();
  const { products } = useAppContext();
  const isAr = language === 'ar';

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-center items-center p-3 sm:p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card border border-border dark:border-dark-border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-border dark:border-dark-border bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">
              {t('requests.detail_modal.title')}
            </h3>
            {request.isOutOfStockRequest && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <PackageX className="w-3.5 h-3.5" />
                <span>{t('requests.out_of_stock_badge') || (isAr ? 'غير متوفر بالمخزون' : 'Out of Stock')}</span>
              </span>
            )}
          </div>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-700 dark:hover:text-white"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <dl className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200/70 dark:border-slate-700/60">
            <DetailRow label={t('requests.detail_modal.customer_name')} value={request.customerName} />
            <DetailRow label={t('requests.detail_modal.customer_phone')} value={<span className="font-mono">{request.customerPhone}</span>} />
            {request.customerAddress && (
              <DetailRow label={t('requests.detail_modal.customer_address')} value={request.customerAddress} />
            )}
            <DetailRow label={t('requests.detail_modal.request_date')} value={formatDate(request.date)} />
            {request.notes && (
              <DetailRow
                label={t('requests.detail_modal.notes') || (isAr ? 'ملاحظات' : 'Notes')}
                value={<span className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{request.notes}</span>}
              />
            )}
          </dl>

          <div>
            <h4 className="text-base font-bold text-text-primary dark:text-dark-text-primary mb-2.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>{t('requests.detail_modal.requested_items')}</span>
            </h4>
            <div className="overflow-hidden rounded-xl border border-border dark:border-dark-border">
              <table className="w-full text-sm text-start text-text-secondary dark:text-dark-text-secondary">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-start">{t('requests.detail_modal.product')}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('requests.detail_modal.quantity')}</th>
                    <th scope="col" className="px-4 py-3 text-end">{t('requests.detail_modal.estimated_price') || (isAr ? 'السعر التقديري' : 'Est. Price')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-dark-border">
                  {request.items.map((item, index) => {
                    const prod = products.find(p => p.id === item.productId);
                    const itemName = item.name || prod?.name || 'N/A';
                    const isCustomOrOut = item.isCustom || item.productId?.startsWith('custom_') || !prod || (prod.stock ?? 0) <= 0;
                    const price = item.estimatedPrice ?? prod?.salePrice;
                    return (
                      <tr key={index} className="bg-card dark:bg-dark-card">
                        <td className="px-4 py-3 font-medium text-text-primary dark:text-white">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{itemName}</span>
                            {isCustomOrOut && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                {item.isCustom || !prod
                                  ? (t('requests.custom_item_badge') || (isAr ? 'غير مدرج بالمخزون' : 'Not in Inventory'))
                                  : (t('requests.out_of_stock_badge') || (isAr ? 'نفد من المخزون' : 'Out of Stock'))}
                              </span>
                            )}
                          </div>
                          {(item.sku || prod?.sku) && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {item.sku || prod?.sku}</p>
                          )}
                          {item.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold tabular-nums text-text-primary dark:text-white">
                          {formatNumber(item.quantity)}
                        </td>
                        <td className="px-4 py-3 text-end tabular-nums font-medium">
                          {price !== undefined ? formatCurrency(price) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
          {request.status === 'Pending' && (
            <>
              <button
                onClick={() => onReject(request)}
                type="button"
                className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-xl text-sm px-5 py-2.5 text-center"
              >
                {t('requests.detail_modal.cancel_button')}
              </button>
              <button
                onClick={() => onApprove(request)}
                type="button"
                className="text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:outline-none focus:ring-emerald-300 font-medium rounded-xl text-sm px-5 py-2.5 text-center"
              >
                {t('requests.table.create_order')}
              </button>
            </>
          )}
          <button
            onClick={onClose}
            type="button"
            className="text-gray-600 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-xl border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-600"
          >
            {t('requests.detail_modal.close')}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInScale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RequestDetailModal;
