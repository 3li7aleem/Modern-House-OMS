/**
 * Modern House WhatsApp & MCP Communication Engine
 * Supports:
 * - Direct wa.me link generation (Universal zero-cost)
 * - UltraMsg REST API (Instance ID + Token)
 * - Green API (idInstance + apiTokenInstance)
 * - WhatsApp Cloud API (Meta Graph API)
 * - Automatic phone number normalization for Bahrain (+973) and GCC
 */

export interface WhatsAppConfig {
  provider: 'direct' | 'ultramsg' | 'greenapi' | 'meta_cloud';
  senderPhone: string;
  autoSendInvoice: boolean;
  autoSendTracking: boolean;
  instanceId?: string;
  token?: string;
  greenIdInstance?: string;
  greenApiToken?: string;
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
  invoiceMessageTemplate?: string;
  trackingMessageTemplate?: string;
}

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  provider: 'direct',
  senderPhone: '35965477',
  autoSendInvoice: true,
  autoSendTracking: true,
  instanceId: '',
  token: '',
  greenIdInstance: '',
  greenApiToken: '',
  metaPhoneNumberId: '',
  metaAccessToken: '',
  invoiceMessageTemplate: 'مرحباً {{customerName}}،\nشكراً لتسوقك من مودرن هاوس للتجارة!\n🧾 فاتورة رقم: {{orderNumber}}\n💰 الإجمالي: {{total}} د.ب\n🔗 رابط الفاتورة الرقمية: {{invoiceUrl}}\n\nيسعدنا خدمتكم دائماً! ✨',
  trackingMessageTemplate: 'عزيزنا العميل {{customerName}}،\nتم تجهيز وتوجيه طلبك رقم {{orderNumber}} مع مندوب التوصيل ({{driverName}}).\n🚚 تتبع طلبك مباشرة: {{trackingUrl}}\n\nمودرن هاوس للتجارة 🤍'
};

/**
 * Normalizes phone numbers to international format.
 * Prepend Bahrain code 973 if 8 digits starting with 1, 3, 6, 7.
 */
export function cleanPhoneForWhatsApp(phone: string | number | undefined | null): string {
  if (!phone) return '';
  let clean = String(phone).replace(/[^\d]/g, '');
  if (clean.startsWith('00')) clean = clean.slice(2);
  if (clean.length === 8 && /^[1367]/.test(clean)) {
    clean = '973' + clean;
  }
  return clean;
}

export function getStoredWhatsAppConfig(): WhatsAppConfig {
  try {
    const saved = localStorage.getItem('settings:whatsapp');
    if (saved) {
      return { ...DEFAULT_WHATSAPP_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to parse saved whatsapp settings', e);
  }
  return DEFAULT_WHATSAPP_CONFIG;
}

export function saveStoredWhatsAppConfig(config: Partial<WhatsAppConfig>): WhatsAppConfig {
  const current = getStoredWhatsAppConfig();
  const updated: WhatsAppConfig = { ...current, ...config };
  localStorage.setItem('settings:whatsapp', JSON.stringify(updated));
  
  // If desktop bridge is available, sync to SQLite preferences
  try {
    const bridge = (window as any).omsDesktop;
    if (bridge?.setPreference) {
      bridge.setPreference('settings:whatsapp', JSON.stringify(updated));
    }
  } catch (e) {
    console.warn('Could not sync whatsapp settings to desktop preference', e);
  }
  return updated;
}

export interface SendWhatsAppResult {
  success: boolean;
  method: 'api' | 'wa.me';
  url?: string;
  error?: string;
  provider: string;
}

/**
 * Sends a WhatsApp message using the active provider (UltraMsg, GreenAPI, Meta Cloud, or Direct wa.me).
 */
export async function sendWhatsAppMessage(options: {
  phone: string;
  message: string;
  config?: WhatsAppConfig;
  fallbackToWaMe?: boolean;
}): Promise<SendWhatsAppResult> {
  const config = options.config || getStoredWhatsAppConfig();
  const formattedPhone = cleanPhoneForWhatsApp(options.phone);
  const waUrl = formattedPhone 
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(options.message)}`
    : `https://wa.me/?text=${encodeURIComponent(options.message)}`;

  // 1. Direct wa.me mode
  if (config.provider === 'direct') {
    if (options.fallbackToWaMe !== false && typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }
    return { success: true, method: 'wa.me', url: waUrl, provider: 'direct' };
  }

  // First try the local backend route /api/whatsapp/send (avoids CORS)
  try {
    const backendRes = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formattedPhone,
        message: options.message,
        config
      })
    });
    if (backendRes.ok) {
      const backendData = await backendRes.json();
      if (backendData.ok) {
        return { success: true, method: 'api', provider: config.provider };
      }
    }
  } catch {
    // If backend route not reachable (e.g. static web), proceed to client-side API calls
  }

  // 2. UltraMsg API (Client-side)
  if (config.provider === 'ultramsg' && config.instanceId && config.token) {
    try {
      const endpoint = `https://api.ultramsg.com/${config.instanceId}/messages/chat`;
      const params = new URLSearchParams();
      params.append('token', config.token);
      params.append('to', formattedPhone);
      params.append('body', options.message);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
      const data = await res.json();
      if (data && (data.sent === 'true' || data.sent === true || data.id)) {
        return { success: true, method: 'api', provider: 'ultramsg' };
      } else {
        throw new Error(data?.message || 'UltraMsg API rejected message');
      }
    } catch (err: any) {
      console.warn('UltraMsg API failed, falling back to wa.me:', err);
      if (options.fallbackToWaMe !== false && typeof window !== 'undefined') {
        window.open(waUrl, '_blank');
      }
      return { success: false, method: 'wa.me', url: waUrl, error: err.message, provider: 'ultramsg' };
    }
  }

  // 3. Green API (Client-side)
  if (config.provider === 'greenapi' && config.greenIdInstance && config.greenApiToken) {
    try {
      const endpoint = `https://api.green-api.com/waInstance${config.greenIdInstance}/sendMessage/${config.greenApiToken}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${formattedPhone}@c.us`,
          message: options.message
        })
      });
      const data = await res.json();
      if (data && data.idMessage) {
        return { success: true, method: 'api', provider: 'greenapi' };
      } else {
        throw new Error(data?.message || 'Green API rejected message');
      }
    } catch (err: any) {
      console.warn('Green API failed, falling back to wa.me:', err);
      if (options.fallbackToWaMe !== false && typeof window !== 'undefined') {
        window.open(waUrl, '_blank');
      }
      return { success: false, method: 'wa.me', url: waUrl, error: err.message, provider: 'greenapi' };
    }
  }

  // Fallback to wa.me
  if (options.fallbackToWaMe !== false && typeof window !== 'undefined') {
    window.open(waUrl, '_blank');
  }
  return { success: true, method: 'wa.me', url: waUrl, provider: 'direct' };
}
