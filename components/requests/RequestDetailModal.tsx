

import React from 'react';
import { Request } from '../../types';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';

interface RequestDetailModalProps {
  request: Request;
  onClose: () => void;
  onApprove: (request: Request) => void;
  onReject: (request: Request) => void;
}

const DetailRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-2">
        <dt className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{label}</dt>
        <dd className="mt-1 text-sm text-text-primary dark:text-dark-text-primary sm:mt-0 sm:col-span-2 font-semibold">{value}</dd>
    </div>
);

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, onClose, onApprove, onReject }) => {
  const { t, formatDate } = useTranslation();
  const { products } = useAppContext();

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'N/A';
  };
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl m-4 transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card">
        <div className="flex justify-between items-center p-5 border-b rounded-t dark:border-dark-border">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            {t('requests.detail_modal.title')}
          </h3>
          <button 
            type="button" 
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <dl className="mb-4">
            <DetailRow label={t('requests.detail_modal.customer_name')} value={request.customerName} />
            <DetailRow label={t('requests.detail_modal.customer_phone')} value={request.customerPhone} />
            {request.customerAddress && <DetailRow label={t('requests.detail_modal.customer_address')} value={request.customerAddress} />}
            <DetailRow label={t('requests.detail_modal.request_date')} value={formatDate(request.date)} />
          </dl>
          
          <h4 className="text-lg font-semibold mt-4 pt-4 border-t dark:border-dark-border">{t('requests.detail_modal.requested_items')}</h4>
          <table className="w-full text-sm text-left text-text-secondary dark:text-dark-text-secondary mt-2">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">{t('requests.detail_modal.product')}</th>
                <th scope="col" className="px-6 py-3 text-center">{t('requests.detail_modal.quantity')}</th>
              </tr>
            </thead>
            <tbody>
              {request.items.map((item, index) => (
                <tr key={index} className="bg-card border-b dark:bg-dark-card dark:border-dark-border">
                  <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap dark:text-white">{getProductName(item.productId)}</td>
                  <td className="px-6 py-4 text-center">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse">
            {request.status === 'Pending' && (
                <>
                    <button 
                        onClick={() => onReject(request)} 
                        type="button" 
                        className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900"
                    >
                        {t('requests.detail_modal.cancel_button')}
                    </button>
                    <button 
                        onClick={() => onApprove(request)} 
                        type="button" 
                        className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-800"
                    >
                        {t('requests.table.create_order')}
                    </button>
                </>
            )}
             <button 
                onClick={onClose} 
                type="button" 
                className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600"
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
