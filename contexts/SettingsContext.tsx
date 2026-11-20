import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { WhatsAppConfig, DEFAULT_WHATSAPP_CONFIG, getStoredWhatsAppConfig, saveStoredWhatsAppConfig } from '../lib/whatsappService';

const RAW_SVG_LOGO = `<svg viewBox="0 0 400 360" xmlns="http://www.w3.org/2000/svg">
  <polygon points="200,30 70,250 200,250" fill="#dfb175" stroke="#dfb175" stroke-width="1" />
  <polygon points="200,30 200,250 330,250" fill="#bc955d" stroke="#bc955d" stroke-width="1" />
  <line x1="200" y1="30" x2="200" y2="250" stroke="#a47d47" stroke-width="2" opacity="0.2" />
  <polygon points="70,251 200,251 330,251 200,254" fill="#3e2d14" opacity="0.3" />
  <g>
    <path d="M 132,215 L 132,142 L 158,170 L 184,142 L 184,215 L 172,215 L 172,168 L 158,182 L 144,168 L 144,215 Z" fill="#ffffff" stroke="#111111" stroke-width="5" stroke-linejoin="miter" />
    <path d="M 196,215 L 196,155 L 210,135 L 224,155 L 224,185 L 238,185 L 238,142 L 250,142 L 250,215 L 238,215 L 238,197 L 224,197 L 224,215 Z" fill="#ffffff" stroke="#111111" stroke-width="5" stroke-linejoin="miter" />
    <rect x="203" y="160" width="14" height="14" fill="#ffffff" stroke="#111111" stroke-width="2.5" />
    <line x1="210" y1="160" x2="210" y2="174" stroke="#111111" stroke-width="1.5" />
    <line x1="203" y1="167" x2="217" y2="167" stroke="#111111" stroke-width="1.5" />
  </g>
</svg>`;

const DEFAULT_LOGO_URL = 'data:image/svg+xml;base64,' + btoa(RAW_SVG_LOGO);
const DEFAULT_FOOTER_TEXT = "Modern House for Trading: Hamad Town, Souq Waqif - Bahrain. Phones: 35965477 - 77905477";
const DEFAULT_ACCENT_COLOR = '#4a5568'; // gray-700
const DEFAULT_DELIVERY_NOTICE = "IMPORTANT NOTICE:\n1. PLEASE CHECK THE ITEMS BEFORE SIGNING.\n2. ITEMS SOLD ARE NOT REFUNDABLE.\n3. FOR WARRANTY CLAIMS, PLEASE PRESENT THIS DELIVERY NOTE.";
const DEFAULT_DELIVERY_CONTACT = "Contact us: 35965477 - 77905477";
const DEFAULT_DELIVERY_THANK_YOU = "THANK YOU FOR YOUR BUSINESS";
const DEFAULT_HERO_IMAGE_URL = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop";


export interface InvoiceSettings {
    companyNameAr: string;
    companyNameEn: string;
    crNumber: string;
    vatNumber: string;
    phone: string;
    address: string;
    showWarranty: boolean;
    showSalesperson: boolean;
    showDiscount: boolean;
    showStampSignature: boolean;
    showQrCode: boolean;
    publicServerUrl: string;
    footerNote: string;
    warrantyTerms?: string;
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
    companyNameAr: 'مودرن هاوس للتجارة',
    companyNameEn: 'Modern House for Trading',
    crNumber: '147987-2',
    vatNumber: '',
    phone: '35965477 - 77905477',
    address: 'سوق واقف - مدينة حمد - مملكة البحرين',
    showWarranty: true,
    showSalesperson: true,
    showDiscount: true,
    showStampSignature: true,
    showQrCode: true,
    publicServerUrl: '',
    footerNote: 'البضاعة المباعة تخضع لشروط الضمان المعتمدة. يُرجى الاحتفاظ بالفاتورة الأصلية.',
    warrantyTerms: 'ضمان شامل على الأجهزة حسب بطاقة الوكيل المعتمدة'
};

interface SettingsContextType {
    logoUrl: string;
    updateLogoUrl: (url: string) => void;
    footerText: string;
    updateFooterText: (text: string) => void;
    accentColor: string;
    updateAccentColor: (color: string) => void;
    invoiceSettings: InvoiceSettings;
    updateInvoiceSettings: (settings: Partial<InvoiceSettings>) => void;
    deliveryNoteNotice: string;
    updateDeliveryNoteNotice: (text: string) => void;
    deliveryNoteContact: string;
    updateDeliveryNoteContact: (text: string) => void;
    deliveryNoteThankYou: string;
    updateDeliveryNoteThankYou: (text: string) => void;
    heroImageUrl: string;
    updateHeroImageUrl: (url: string) => void;
    voiceGreetingEnabled: boolean;
    updateVoiceGreetingEnabled: (enabled: boolean) => void;
    entranceSupplicationEnabled: boolean;
    updateEntranceSupplicationEnabled: (enabled: boolean) => void;
    whatsAppSettings: WhatsAppConfig;
    updateWhatsAppSettings: (settings: Partial<WhatsAppConfig>) => void;
    settings: SettingsContextType; // For easy passing
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_URL);
    const [footerText, setFooterText] = useState(DEFAULT_FOOTER_TEXT);
    const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
    const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
    const [deliveryNoteNotice, setDeliveryNoteNotice] = useState(DEFAULT_DELIVERY_NOTICE);
    const [deliveryNoteContact, setDeliveryNoteContact] = useState(DEFAULT_DELIVERY_CONTACT);
    const [deliveryNoteThankYou, setDeliveryNoteThankYou] = useState(DEFAULT_DELIVERY_THANK_YOU);
    const [heroImageUrl, setHeroImageUrl] = useState(DEFAULT_HERO_IMAGE_URL);
    const [voiceGreetingEnabled, setVoiceGreetingEnabled] = useState(true);
    const [entranceSupplicationEnabled, setEntranceSupplicationEnabled] = useState(true);
    const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppConfig>(DEFAULT_WHATSAPP_CONFIG);

    useEffect(() => {
        setWhatsAppSettings(getStoredWhatsAppConfig());
        const savedLogo = localStorage.getItem('settings:logoUrl');
        const savedFooter = localStorage.getItem('settings:footerText');
        const savedColor = localStorage.getItem('settings:accentColor');
        const savedInvoiceSettings = localStorage.getItem('settings:invoice');
        const savedNotice = localStorage.getItem('settings:deliveryNotice');
        const savedContact = localStorage.getItem('settings:deliveryContact');
        const savedThankYou = localStorage.getItem('settings:deliveryThankYou');
        const savedHeroImage = localStorage.getItem('settings:heroImageUrl');
        const savedVoiceGreeting = localStorage.getItem('settings:voiceGreetingEnabled');
        const savedSupplication = localStorage.getItem('settings:entranceSupplicationEnabled');

        if (savedLogo) setLogoUrl(savedLogo);
        if (savedFooter) setFooterText(savedFooter);
        if (savedColor) setAccentColor(savedColor);
        if (savedInvoiceSettings) {
            try {
                const parsed = JSON.parse(savedInvoiceSettings);
                setInvoiceSettings({ ...DEFAULT_INVOICE_SETTINGS, ...parsed });
            } catch {
                setInvoiceSettings(DEFAULT_INVOICE_SETTINGS);
            }
        }
        if (savedNotice) setDeliveryNoteNotice(savedNotice);
        if (savedContact) setDeliveryNoteContact(savedContact);
        if (savedThankYou) setDeliveryNoteThankYou(savedThankYou);
        if (savedHeroImage && savedHeroImage !== 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop') {
            setHeroImageUrl(savedHeroImage);
        } else {
            setHeroImageUrl(DEFAULT_HERO_IMAGE_URL);
            localStorage.setItem('settings:heroImageUrl', DEFAULT_HERO_IMAGE_URL);
        }
        if (savedVoiceGreeting !== null) {
            setVoiceGreetingEnabled(savedVoiceGreeting === 'true');
        }
        if (savedSupplication !== null) {
            setEntranceSupplicationEnabled(savedSupplication === 'true');
        }
    }, []);

    const updateLogoUrl = (url: string) => {
        setLogoUrl(url);
        localStorage.setItem('settings:logoUrl', url);
    };
    
    const updateFooterText = (text: string) => {
        setFooterText(text);
        localStorage.setItem('settings:footerText', text);
    };

    const updateAccentColor = (color: string) => {
        setAccentColor(color);
        localStorage.setItem('settings:accentColor', color);
    };

    const updateInvoiceSettings = (newSettings: Partial<InvoiceSettings>) => {
        setInvoiceSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('settings:invoice', JSON.stringify(updated));
            return updated;
        });
    };

    const updateDeliveryNoteNotice = (text: string) => {
        setDeliveryNoteNotice(text);
        localStorage.setItem('settings:deliveryNotice', text);
    };
    const updateDeliveryNoteContact = (text: string) => {
        setDeliveryNoteContact(text);
        localStorage.setItem('settings:deliveryContact', text);
    };
    const updateDeliveryNoteThankYou = (text: string) => {
        setDeliveryNoteThankYou(text);
        localStorage.setItem('settings:deliveryThankYou', text);
    };

    const updateHeroImageUrl = (url: string) => {
        setHeroImageUrl(url);
        localStorage.setItem('settings:heroImageUrl', url);
    };

    const updateVoiceGreetingEnabled = (enabled: boolean) => {
        setVoiceGreetingEnabled(enabled);
        localStorage.setItem('settings:voiceGreetingEnabled', String(enabled));
    };

    const updateEntranceSupplicationEnabled = (enabled: boolean) => {
        setEntranceSupplicationEnabled(enabled);
        localStorage.setItem('settings:entranceSupplicationEnabled', String(enabled));
    };

    const updateWhatsAppSettings = (newSettings: Partial<WhatsAppConfig>) => {
        const updated = saveStoredWhatsAppConfig(newSettings);
        setWhatsAppSettings(updated);
    };

    const value = useMemo(() => {
        const self: SettingsContextType = {
            logoUrl,
            updateLogoUrl,
            footerText,
            updateFooterText,
            accentColor,
            updateAccentColor,
            invoiceSettings,
            updateInvoiceSettings,
            deliveryNoteNotice,
            updateDeliveryNoteNotice,
            deliveryNoteContact,
            updateDeliveryNoteContact,
            deliveryNoteThankYou,
            updateDeliveryNoteThankYou,
            heroImageUrl,
            updateHeroImageUrl,
            voiceGreetingEnabled,
            updateVoiceGreetingEnabled,
            entranceSupplicationEnabled,
            updateEntranceSupplicationEnabled,
            whatsAppSettings,
            updateWhatsAppSettings,
            get settings() { return self; }
        };
        return self;
    }, [
        logoUrl,
        footerText,
        accentColor,
        invoiceSettings,
        deliveryNoteNotice,
        deliveryNoteContact,
        deliveryNoteThankYou,
        heroImageUrl,
        voiceGreetingEnabled,
        entranceSupplicationEnabled,
        whatsAppSettings
    ]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};