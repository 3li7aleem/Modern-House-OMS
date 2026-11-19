import React, { useState } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAppContext } from '../../contexts/AppContext';

interface PasswordResetModalProps {
  onClose: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { sendPasswordResetEmail } = useAppContext();
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(email);
      setMessage(t('auth.reset_success'));
    } catch (err: any) {
      // Firebase often returns 'auth/invalid-email' but we don't want to confirm/deny emails.
      // So we show a generic success message for security.
      setMessage(t('auth.reset_success'));
      console.error("Password reset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md m-4 transform transition-all scale-95 opacity-0 animate-fade-in-scale dark:bg-dark-card" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b rounded-t dark:border-dark-border">
          <h3 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">{t('auth.reset_password_title')}</h3>
          <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {message ? (
                <p className="text-sm text-center text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-400 p-3 rounded-md">{message}</p>
            ) : (
                <>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{t('auth.reset_instructions')}</p>
                <div>
                    <label htmlFor="reset-email" className="sr-only">Email</label>
                    <input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-dark-background dark:border-dark-border dark:text-white"
                        placeholder="your@email.com"
                        required
                    />
                </div>
                </>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex items-center justify-end p-5 border-t border-border rounded-b dark:border-dark-border space-x-2 rtl:space-x-reverse">
               <button onClick={onClose} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-focus rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">{t('sales.modal.cancel_button')}</button>
               {!message && (
                <button
                    type="submit"
                    disabled={isLoading}
                    className="text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary-focus font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-400"
                >
                    {isLoading ? '...' : t('auth.send_reset_link')}
                </button>
               )}
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fadeInScale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale { animation: fadeInScale 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default PasswordResetModal;