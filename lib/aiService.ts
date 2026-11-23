/**
 * Modern House OMS - Centralized AI Intelligence Engine (Google Gemini Powered)
 * Supports:
 * - Natural Language Business Copilot ("Chat with Your Store Data")
 * - Smart Voice/Text Quotation & Order Generation
 * - Real-Time POS Cross-Selling & Upselling Recommendations
 * - Computer Vision for Repair/Maintenance Diagnostics
 * - Computer Vision OCR for Vendor Invoice Parsing
 * - Predictive Inventory Reorder & Stock Run-out Forecasting
 * - Delivery Route Optimization for Bahrain Areas
 */

import { Product, Order, Customer, Supplier, Delivery, Driver, RepairInvoice, OrderItem } from '../types';

export interface AiConfig {
  apiKey: string;
  model: string;
  enabled: boolean;
  autoSuggestPos: boolean;
  temperature: number;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  apiKey: '',
  model: 'gemini-3.8-flash',
  enabled: true,
  autoSuggestPos: true,
  temperature: 0.2
};

export function getStoredAiConfig(): AiConfig {
  try {
    const saved = localStorage.getItem('settings:gemini_ai');
    if (saved) {
      const parsed = { ...DEFAULT_AI_CONFIG, ...JSON.parse(saved) };
      // Auto-migrate obsolete or deprecated models to gemini-3.8-flash
      if (!parsed.model || parsed.model === 'gemini-2.5-flash') {
        parsed.model = 'gemini-3.8-flash';
        try {
          localStorage.setItem('settings:gemini_ai', JSON.stringify(parsed));
        } catch {}
      }
      return parsed;
    }
  } catch {}
  return DEFAULT_AI_CONFIG;
}

export function saveStoredAiConfig(cfg: Partial<AiConfig>): AiConfig {
  const current = getStoredAiConfig();
  const updated = { ...current, ...cfg };
  try {
    localStorage.setItem('settings:gemini_ai', JSON.stringify(updated));
    if (updated.apiKey) {
      localStorage.setItem('settings:gemini_api_key', updated.apiKey);
    }
  } catch {}
  return updated;
}

export function getEffectiveApiKey(): string {
  const cfg = getStoredAiConfig();
  if (cfg.apiKey && cfg.apiKey.trim()) return cfg.apiKey.trim();
  try {
    const raw = localStorage.getItem('settings:gemini_api_key');
    if (raw && raw.trim()) return raw.trim();
  } catch {}
  // Check process env if injected by Vite
  if (typeof process !== 'undefined' && process.env && (process.env.GEMINI_API_KEY || process.env.API_KEY)) {
    const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (envKey && envKey !== 'undefined') return envKey;
  }
  return '';
}

/**
 * Core caller to Google Gemini REST API (v1beta)
 */
export async function callGeminiApi(
  prompt: string, 
  options: {
    systemInstruction?: string;
    images?: Array<{ mimeType: string; base64Data: string }>;
    responseSchema?: any;
    model?: string;
  } = {}
): Promise<string> {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) {
    throw new Error('مفتاح Gemini API غير محدد. يرجى إدخال مفتاح API في صفحة الإعدادات (قسم الذكاء الاصطناعي).');
  }

  const rawModel = options.model || getStoredAiConfig().model || 'gemini-3.8-flash';
  let model = rawModel.replace(/^models\//, '');
  if (model === 'gemini-2.5-flash') {
    model = 'gemini-3.8-flash';
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents: any[] = [];
  const parts: any[] = [];

  // Add images if provided
  if (options.images && options.images.length > 0) {
    for (const img of options.images) {
      let cleanData = img.base64Data;
      if (cleanData.includes('base64,')) {
        cleanData = cleanData.split('base64,')[1];
      }
      parts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/jpeg',
          data: cleanData
        }
      });
    }
  }

  // Add user prompt
  parts.push({ text: prompt });
  contents.push({ role: 'user', parts });

  const body: any = {
    contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
    }
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }]
    };
  }

  if (options.responseSchema) {
    body.generationConfig.responseMimeType = 'application/json';
    body.generationConfig.responseSchema = options.responseSchema;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const rawMsg = errorJson.error?.message || '';

    // If the requested model is deprecated or not available, gracefully try modern fallbacks
    if (rawMsg.includes('no longer available') || rawMsg.includes('not found') || rawMsg.includes('NOT_FOUND')) {
      const fallbacks = ['gemini-3.8-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const fb of fallbacks) {
        if (fb !== model) {
          try {
            const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${fb}:generateContent?key=${apiKey}`;
            const fbRes = await fetch(fallbackUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            if (fbRes.ok) {
              const fbData = await fbRes.json();
              saveStoredAiConfig({ model: fb });
              return fbData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
          } catch {}
        }
      }
    }

    const msg = rawMsg || `HTTP ${res.status}: فشل الاتصال بخدمة الذكاء الاصطناعي`;
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

// =========================================================================
// 1. Business Copilot ("Chat With Store Data")
// =========================================================================
export async function askBusinessCopilot(
  userQuery: string,
  storeContext: {
    products: Product[];
    orders: Order[];
    customers: Customer[];
    deliveries?: Delivery[];
    expenses?: any[];
  }
): Promise<string> {
  const { products = [], orders = [], customers = [], deliveries = [], expenses = [] } = storeContext;

  // Calculate quick metrics to ground the model
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrdersCount = orders.length;
  const lowStockCount = products.filter(p => p.stock <= (p.lowStockThreshold || 5)).length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'Pending' || d.status === 'Assigned').length;

  const summaryContext = {
    businessName: 'مودرن هاوس للتجارة (Modern House for Trading)',
    location: 'سوق واقف - مدينة حمد - مملكة البحرين',
    currency: 'دينار بحريني (BHD)',
    totalOrders: totalOrdersCount,
    totalRevenueBHD: totalRevenue.toFixed(3),
    totalCustomers: customers.length,
    totalProducts: products.length,
    lowStockItemsCount: lowStockCount,
    pendingDeliveriesCount: pendingDeliveries,
    topProductsSample: products.slice(0, 15).map(p => ({
      name: p.name,
      sku: p.sku,
      price: p.salePrice,
      stock: p.stock
    })),
    recentOrdersSample: orders.slice(0, 10).map(o => ({
      orderNumber: o.orderNumber,
      total: o.total,
      date: o.date,
      paymentMethod: o.paymentMethod,
      status: o.status
    }))
  };

  const systemInstruction = `أنت المساعد الإداري والتنفيذي الذكي لنظام إدارة العمليات (OMS) لمؤسسة "مودرن هاوس للتجارة" في مملكة البحرين.
عملك هو تحليل البيانات بدقة متناهية، وتقديم إجابات واضحة، محترفة، وموجزة باللغة العربية مع إحصاءات وأرقام حقيقية من البيانات المرفقة.
العملة هي الدينار البحريني (BHD).
استخدم الجداول والنقاط لتوضيح الحسابات، وقدم اقتراحات تنفيذية عملية للمدير العام.`;

  const prompt = `سياق بيانات المعرض الحالية:
${JSON.stringify(summaryContext, null, 2)}

سؤال المدير / المستخدم:
"${userQuery}"

أجب باحترافية، وقدم أرقاماً مباشرة وتوصيات قابلة للتنفيذ:`;

  return await callGeminiApi(prompt, { systemInstruction });
}

// =========================================================================
// 2. Smart Quotation & Order Generator
// =========================================================================
export interface GeneratedQuotationItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface GeneratedQuotationResult {
  customerName?: string;
  customerPhone?: string;
  items: GeneratedQuotationItem[];
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
  notes: string;
}

export async function generateQuotationFromPrompt(
  naturalText: string,
  catalog: Product[]
): Promise<GeneratedQuotationResult> {
  const compactCatalog = catalog.slice(0, 50).map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    price: p.salePrice,
    stock: p.stock
  }));

  const systemInstruction = `أنت خبير تسعير وإنشاء عروض أسعار وفواتير لنظام مودرن هاوس للتجارة في البحرين (مطابخ، أثاث، أجهزة، صحي).
وظيفتك تحويل طلب العميل الطبيعي المكتوب باللغة العربية إلى تفاصيل عرض سعر دقيقة ومطابقة للمنتجات المتوفرة قدر الإمكان.
العملة: دينار بحريني BHD. نسبة الضريبة VAT هي 10% إذا كانت مشمولة.
أخرج النتيجة حصراً بصيغة JSON مطابقة للشروط.`;

  const prompt = `كتالوج عينة من المنتجات المتوفرة:
${JSON.stringify(compactCatalog)}

طلب العميل / المبيعات:
"${naturalText}"

قم بمطابقة الأصناف، واستخراج اسم العميل ورقم الهاتف إن وُجد، وتحديد الأسعار والكميات المناسبة مع حساب الإجمالي.
أعد الناتج بتنسيق JSON حصراً:
{
  "customerName": "...",
  "customerPhone": "...",
  "items": [
    {
      "productId": "id أو فارغ إذا كان صنف مخصص",
      "name": "اسم المنتج",
      "quantity": 1,
      "unitPrice": 25.000,
      "total": 25.000,
      "notes": "ملاحظات التركيب أو المقاس"
    }
  ],
  "subtotal": 100.000,
  "discountAmount": 10.000,
  "vatAmount": 9.000,
  "total": 99.000,
  "notes": "شروط العرض والتركيب"
}`;

  const rawJson = await callGeminiApi(prompt, { systemInstruction });
  const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

// =========================================================================
// 3. POS Smart Cross-Selling & Recommendations
// =========================================================================
export interface CrossSellSuggestion {
  product: Product;
  reason: string;
  confidence: number;
}

export function getPosCrossSellSuggestions(
  cartItems: OrderItem[],
  allProducts: Product[]
): CrossSellSuggestion[] {
  if (!cartItems || cartItems.length === 0 || !allProducts || allProducts.length === 0) {
    return [];
  }

  const cartProductIds = new Set(cartItems.map(it => it.productId));
  const cartNames = cartItems.map(it => (it.name || '').toLowerCase()).join(' ');

  const suggestions: CrossSellSuggestion[] = [];

  // Rules based on kitchen & home interior logic
  for (const prod of allProducts) {
    if (cartProductIds.has(prod.id)) continue;
    if (prod.stock <= 0) continue;

    const pName = prod.name.toLowerCase();
    const pCat = (prod.category || '').toLowerCase();

    // Sinks & Mixers rule
    if ((cartNames.includes('مغسلة') || cartNames.includes('حوض') || cartNames.includes('sink')) && 
        (pName.includes('خلاط') || pName.includes('mixer') || pName.includes('سيليكون') || pName.includes('صفاية'))) {
      suggestions.push({
        product: prod,
        reason: 'موصى به كملحق أساسي لأحواض ومغاسل المطبخ',
        confidence: 0.95
      });
      continue;
    }

    // Cookers & Hoods rule
    if ((cartNames.includes('فرن') || cartNames.includes('طباخ') || cartNames.includes('cooker') || cartNames.includes('stove')) &&
        (pName.includes('شفاط') || pName.includes('hood') || pName.includes('غاز') || pName.includes('منظم'))) {
      suggestions.push({
        product: prod,
        reason: 'غالباً يتم شراؤه لشفط وتدوير الهواء مع الأفران والمواقد',
        confidence: 0.9
      });
      continue;
    }

    // Kitchen Cabinets & Handles rule
    if ((cartNames.includes('مطبخ') || cartNames.includes('دولاب') || cartNames.includes('cabinet')) &&
        (pName.includes('مقبض') || pName.includes('مفصلة') || pName.includes('إضاءة') || pName.includes('سبوت'))) {
      suggestions.push({
        product: prod,
        reason: 'إكسسوار تكميلي لمطابخ وخزائن مودرن هاوس',
        confidence: 0.85
      });
      continue;
    }
  }

  // Fallback: If no rule matched, suggest best-selling high-stock accessories
  if (suggestions.length === 0) {
    const accessories = allProducts
      .filter(p => !cartProductIds.has(p.id) && p.stock > 3 && p.salePrice < 40)
      .slice(0, 3);
    for (const acc of accessories) {
      suggestions.push({
        product: acc,
        reason: 'الأكثر طلباً كإضافة سريعة مع المشتريات',
        confidence: 0.7
      });
    }
  }

  return suggestions.slice(0, 3);
}

// =========================================================================
// 4. Vision Diagnostics for Maintenance & Repairs
// =========================================================================
export interface MaintenanceDiagnosisResult {
  detectedIssue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
  suggestedParts: Array<{ name: string; estimatedPrice: number; inStockMatch?: string }>;
  estimatedLaborHours: number;
  estimatedTotalBHD: number;
  safetyAdvice: string;
}

export async function diagnoseMaintenancePhoto(
  imageBase64: string,
  customerNotes: string,
  catalog: Product[]
): Promise<MaintenanceDiagnosisResult> {
  const partsCatalog = catalog.slice(0, 40).map(p => ({ id: p.id, name: p.name, price: p.salePrice }));

  const systemInstruction = `أنت مهندس صيانة وترميم خبير في شركة مودرن هاوس للتجارة بالبحرين.
تستلم صوراً لأعطال المطابخ، الأجهزة، الأدوات الصحية، والأثاث.
وظيفتك فحص الصورة بدقة، وتحديد سبب العطل، واقتراح خطة الإصلاح وقطع الغيار المطلوبة وتكلفتها بالدينار البحريني BHD.
أخرج الناتج بتنسيق JSON دقيق.`;

  const prompt = `ملاحظات العميل: "${customerNotes || 'يرجى فحص العطل في الصورة'}"
كتالوج قطع الغيار المتاحة:
${JSON.stringify(partsCatalog)}

افحص الصورة واشرح العطل وخطة الإصلاح بدقة:
{
  "detectedIssue": "وصف العطل بدقة واحترافية",
  "severity": "low / medium / high / critical",
  "recommendedActions": ["خطوة 1", "خطوة 2"],
  "suggestedParts": [
    { "name": "اسم القطعة", "estimatedPrice": 12.500, "inStockMatch": "اسم الصنف المطابق إن وُجد" }
  ],
  "estimatedLaborHours": 2,
  "estimatedTotalBHD": 35.000,
  "safetyAdvice": "نصائح وإرشادات السلامة"
}`;

  const rawJson = await callGeminiApi(prompt, {
    systemInstruction,
    images: [{ mimeType: 'image/jpeg', base64Data: imageBase64 }]
  });

  const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

// =========================================================================
// 5. Vision OCR for Vendor Invoices (سندات وفواتير الموردين)
// =========================================================================
export interface ParsedVendorInvoiceResult {
  supplierName: string;
  invoiceNumber: string;
  date: string;
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    purchasePrice: number;
    total: number;
  }>;
  totalAmount: number;
  currency: string;
  notes: string;
}

export async function parseVendorInvoicePhoto(
  imageBase64: string,
  knownSuppliers: Supplier[]
): Promise<ParsedVendorInvoiceResult> {
  const supplierList = knownSuppliers.map(s => s.name);

  const systemInstruction = `أنت مدقق ومحاسب مشتريات ذكي لنظام مودرن هاوس للتجارة في البحرين.
مهمتك فحص صور فواتير المشتريات الورقية أو الرقمية الصادرة من الموردين واستخراج البيانات كاملة بصيغة JSON منظمة.`;

  const prompt = `قائمة الموردين المعتمدين لدى المؤسسة:
${JSON.stringify(supplierList)}

قم بقراءة الفاتورة المرفقة بالكامل واستخرج:
1. اسم المورد (طابقه مع القائمة إذا أمكن).
2. رقم الفاتورة وتاريخها.
3. كل صنف، كميته، وسعر شرائه وإجمالي الصنف.
4. الإجمالي النهائي والعملة.

أخرج النتيجة بصيغة JSON حصراً:
{
  "supplierName": "اسم المورد",
  "invoiceNumber": "INV-12345",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "name": "اسم الصنف",
      "sku": "رمز الكود إن وُجد",
      "quantity": 10,
      "purchasePrice": 15.000,
      "total": 150.000
    }
  ],
  "totalAmount": 150.000,
  "currency": "BHD / SAR / USD",
  "notes": "ملاحظات الفاتورة إن وُجدت"
}`;

  const rawJson = await callGeminiApi(prompt, {
    systemInstruction,
    images: [{ mimeType: 'image/jpeg', base64Data: imageBase64 }]
  });

  const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

// =========================================================================
// 6. Predictive Inventory & Run-Out Date Forecasting
// =========================================================================
export interface InventoryForecastItem {
  product: Product;
  dailyVelocity: number;      // sales per day
  daysUntilStockout: number;  // estimated days left
  depletionDate: string;      // YYYY-MM-DD
  recommendedReorderQty: number;
  urgency: 'critical' | 'warning' | 'healthy' | 'overstocked';
  rationale: string;
}

export function calculateInventoryForecasts(
  products: Product[],
  orders: Order[]
): InventoryForecastItem[] {
  // Analyze last 60 days of sales
  const now = new Date();
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(now.getDate() - 60);

  const productSalesMap = new Map<string, number>();

  for (const order of orders) {
    const oDate = new Date(order.date || order.createdAt || now);
    if (oDate >= sixtyDaysAgo && order.status !== 'Cancelled') {
      for (const item of (order.items || [])) {
        if (item.productId) {
          const current = productSalesMap.get(item.productId) || 0;
          productSalesMap.set(item.productId, current + (item.quantity || 1));
        }
      }
    }
  }

  const results: InventoryForecastItem[] = [];

  for (const product of products) {
    const soldIn60Days = productSalesMap.get(product.id) || 0;
    const dailyVelocity = soldIn60Days / 60; // units per day
    const currentStock = Math.max(0, product.stock || 0);

    let daysUntilStockout = 999;
    let urgency: 'critical' | 'warning' | 'healthy' | 'overstocked' = 'healthy';
    let rationale = 'المخزون متوازن ومطابق لوتيرة الاستهلاك.';

    if (currentStock === 0) {
      daysUntilStockout = 0;
      urgency = 'critical';
      rationale = 'المنتج نافد تماماً حالياً من المعرض والمستودع.';
    } else if (dailyVelocity > 0) {
      daysUntilStockout = Math.round(currentStock / dailyVelocity);
      if (daysUntilStockout <= 7) {
        urgency = 'critical';
        rationale = `معدل بيع سريع (${soldIn60Days} قطعة آخر شهرين). سينفد خلال ${daysUntilStockout} أيام فقط.`;
      } else if (daysUntilStockout <= 20) {
        urgency = 'warning';
        rationale = `الرصيد يوشك على الوصول للحد الأدنى خلال ${daysUntilStockout} يوماً.`;
      } else if (daysUntilStockout > 180) {
        urgency = 'overstocked';
        rationale = 'مخزون راكد أو بطيء الحركة مقارنة بالكمية الحالية.';
      }
    } else {
      if (currentStock <= (product.lowStockThreshold || 3)) {
        urgency = 'warning';
        daysUntilStockout = 30;
        rationale = 'كمية المخزون منخفضة بالرغم من بطء الحركة مؤخراً.';
      } else if (currentStock > 30) {
        urgency = 'overstocked';
        rationale = 'لم يتم بيع أي قطعة خلال 60 يوماً؛ منتج راكد.';
      }
    }

    const depletion = new Date();
    depletion.setDate(now.getDate() + Math.min(daysUntilStockout, 365));
    const depletionDateStr = depletion.toISOString().split('T')[0];

    // Suggest 45-day supply as optimal reorder quantity
    const recommendedQty = Math.max(5, Math.ceil(dailyVelocity * 45) || (product.lowStockThreshold ? product.lowStockThreshold * 2 : 10));

    results.push({
      product,
      dailyVelocity: Number(dailyVelocity.toFixed(2)),
      daysUntilStockout,
      depletionDate: depletionDateStr,
      recommendedReorderQty: recommendedQty,
      urgency,
      rationale
    });
  }

  // Sort critical first, then warning
  return results.sort((a, b) => {
    const rank = { critical: 0, warning: 1, healthy: 2, overstocked: 3 };
    return rank[a.urgency] - rank[b.urgency] || a.daysUntilStockout - b.daysUntilStockout;
  });
}

// =========================================================================
// 7. Smart Delivery Route Optimization for Bahrain
// =========================================================================
export interface OptimizedDeliveryStop {
  delivery: Delivery;
  orderNumber: string;
  customerName: string;
  area: string;
  governorate: 'العاصمة' | 'المحرق' | 'الشمالية' | 'الجنوبية' | 'غير محدد';
  recommendedSequence: number;
  estimatedTimeSlot: string;
  whatsappEtaDraft: string;
}

const BAHRAIN_AREA_MAP: Record<string, 'العاصمة' | 'المحرق' | 'الشمالية' | 'الجنوبية'> = {
  'المنامة': 'العاصمة', 'الجفير': 'العاصمة', 'العدلية': 'العاصمة', 'أم الحصم': 'العاصمة', 'السلمانية': 'العاصمة', 'الماحوز': 'العاصمة', 'طوبلي': 'العاصمة', 'سند': 'العاصمة',
  'المحرق': 'المحرق', 'عراد': 'المحرق', 'الحد': 'المحرق', 'قلالي': 'المحرق', 'البسيتين': 'المحرق', 'ديار المحرق': 'المحرق', 'أمواج': 'المحرق',
  'سار': 'الشمالية', 'الجنبية': 'الشمالية', 'البديع': 'الشمالية', 'الهملة': 'الشمالية', 'الجسرة': 'الشمالية', 'الشاخورة': 'الشمالية', 'كرانة': 'الشمالية', 'جدحفص': 'الشمالية', 'مدينة حمد': 'الشمالية', 'سوق واقف': 'الشمالية',
  'الرفاع': 'الجنوبية', 'الرفاع الشرقي': 'الجنوبية', 'الرفاع الغربي': 'الجنوبية', 'البوكوارة': 'الجنوبية', 'الحنينية': 'الجنوبية', 'مدينة عيسى': 'الجنوبية', 'عوالي': 'الجنوبية', 'الصخير': 'الجنوبية'
};

export function optimizeBahrainDeliveryRoute(
  deliveries: Delivery[],
  orders: Order[],
  customers: Customer[]
): OptimizedDeliveryStop[] {
  const customerMap = new Map(customers.map(c => [c.id, c]));
  const orderMap = new Map(orders.map(o => [o.id, o]));

  const stops: OptimizedDeliveryStop[] = [];

  deliveries.forEach(del => {
    const cust = customerMap.get(del.customerId);
    const ord = orderMap.get(del.orderId);

    const address = (del.deliveryAddress || cust?.address || '').trim();
    let detectedArea = 'سوق واقف';
    let gov: any = 'الشمالية';

    for (const [keyArea, keyGov] of Object.entries(BAHRAIN_AREA_MAP)) {
      if (address.includes(keyArea)) {
        detectedArea = keyArea;
        gov = keyGov;
        break;
      }
    }

    stops.push({
      delivery: del,
      orderNumber: ord?.orderNumber || del.orderId,
      customerName: cust?.name || del.customerName || 'عميل مودرن هاوس',
      area: detectedArea,
      governorate: gov,
      recommendedSequence: 0,
      estimatedTimeSlot: '',
      whatsappEtaDraft: ''
    });
  });

  // Sort by governorate clustering (Central hub at Hamad Town/Souq Waqif -> Northern -> Capital -> Muharraq -> Southern)
  const govPriority: Record<string, number> = {
    'الشمالية': 1,
    'العاصمة': 2,
    'المحرق': 3,
    'الجنوبية': 4,
    'غير محدد': 5
  };

  stops.sort((a, b) => (govPriority[a.governorate] || 5) - (govPriority[b.governorate] || 5));

  // Assign sequences and time slots starting from 10:00 AM
  let startHour = 10;
  let startMin = 0;

  stops.forEach((stop, index) => {
    stop.recommendedSequence = index + 1;
    const timeFormatted = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
    stop.estimatedTimeSlot = `${timeFormatted} - ${(startHour + 1).toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
    
    stop.whatsappEtaDraft = `مرحباً ${stop.customerName}،\nطلبكم رقم (${stop.orderNumber}) من مودرن هاوس للتجارة في طريقه إليكم لمنطقة ${stop.area}.\nموعد الوصول المتوقع للمندوب: بين ${stop.estimatedTimeSlot}.\n\nشكراً لتعاملكم معنا! ✨`;

    startMin += 45;
    if (startMin >= 60) {
      startHour += Math.floor(startMin / 60);
      startMin = startMin % 60;
    }
  });

  return stops;
}
