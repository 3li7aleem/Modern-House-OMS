import React from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Keyboard, X } from 'lucide-react';

interface PosShortcutsModalProps {
  onClose: () => void;
}

const PosShortcutsModal: React.FC<PosShortcutsModalProps> = ({ onClose }) => {
  const { language } = useTranslation();

  const shortcuts = [
    { key: 'F2 / /', desc: language === 'ar' ? 'التركيز على خانة البحث السريع' : 'Focus search input' },
    { key: 'F4 / Ctrl+Enter', desc: language === 'ar' ? 'إتمام البيع والدفع الفوري' : 'Complete sale / Pay' },
    { key: 'F8', desc: language === 'ar' ? 'تعليق السلة الحالية (Park Order)' : 'Hold / Park current cart' },
    { key: 'F9', desc: language === 'ar' ? 'مسح وإفراغ السلة' : 'Clear current cart' },
    { key: 'F1', desc: language === 'ar' ? 'فتح دليل اختصارات لوحة المفاتيح' : 'Open keyboard shortcuts' },
    { key: 'ESC', desc: language === 'ar' ? 'إغلاق أي نافذة منبثقة مفتوحة' : 'Close any open modal' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl border border-border dark:border-dark-border overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border dark:border-dark-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary dark:text-dark-text-primary">
                {language === 'ar' ? 'اختصارات الكاشير السريعة' : 'POS Keyboard Shortcuts'}
              </h3>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {language === 'ar' ? 'لتسريع عمليات البيع دون استخدام الفأرة' : 'Speed up checkout operations'}
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

        <div className="p-4 space-y-2">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border/50 dark:border-dark-border/50 text-xs"
            >
              <span className="text-text-primary dark:text-dark-text-primary font-medium">
                {sc.desc}
              </span>
              <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-xs font-mono font-bold text-primary">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 bg-muted/20 border-t border-border dark:border-dark-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
          >
            {language === 'ar' ? 'فهمت ذلك' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosShortcutsModal;
