


export const formatCurrency = (amount: number | null | undefined, language: 'en' | 'ar' = 'ar') => {
    const num = (typeof amount === 'number' && !isNaN(amount) && isFinite(amount)) ? amount : 0;
    const locale = language === 'ar' ? 'ar-BH' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'BHD', // Bahraini Dinar
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
    }).format(num);
};

export const formatDate = (dateString: string, language: 'en' | 'ar') => {
    const locale = language === 'ar' ? 'ar-BH' : 'en-GB';
    return new Date(dateString).toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export const formatTime = (dateString: string, language: 'en' | 'ar') => {
    const locale = language === 'ar' ? 'ar-BH' : 'en-US';
    return new Date(dateString).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};