#!/usr/bin/env node
/**
 * Modern House WhatsApp & Marketing MCP Server
 * Model Context Protocol (MCP) server for WhatsApp automation, invoice dispatches, 
 * marketing campaign broadcasts, and customer communications in Modern House OMS.
 */

const { DatabaseSync } = require('node:sqlite');
const readline = require('node:readline');
const path = require('node:path');
const fs = require('fs');
const { exec } = require('node:child_process');

const DB_PATH = process.env.OMS_DATABASE_PATH || 'D:/oms/oms.sqlite';
const STORE_NAME = 'مودرن هاوس للتجارة';
const STORE_PHONE = '+973 35965477';
const CLOUD_BASE_URL = 'https://modern-house-oms.vercel.app';

let db = null;
try {
  if (fs.existsSync(DB_PATH)) {
    db = new DatabaseSync(DB_PATH);
  }
} catch (e) {
  process.stderr.write(`Failed to open SQLite database at ${DB_PATH}: ${e.message}\n`);
}

function getCustomers(search = '', limit = 50) {
  if (!db) return [];
  try {
    const rows = db.prepare("SELECT data FROM records WHERE collection = 'customers'").all();
    let customers = rows.map(r => JSON.parse(r.data));
    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) || 
        (c.phone && c.phone.includes(q))
      );
    }
    return customers.slice(0, limit);
  } catch (err) {
    process.stderr.write(`Error fetching customers: ${err.message}\n`);
    return [];
  }
}

function getOrder(orderIdOrNumber) {
  if (!db) return null;
  try {
    const rows = db.prepare("SELECT data FROM records WHERE collection = 'orders'").all();
    for (const r of rows) {
      const o = JSON.parse(r.data);
      if (o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber) {
        return o;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function getProducts() {
  if (!db) return [];
  try {
    const rows = db.prepare("SELECT data FROM records WHERE collection = 'products'").all();
    return rows.map(r => JSON.parse(r.data));
  } catch {
    return [];
  }
}

function getWhatsAppSettings() {
  if (!db) return null;
  try {
    const row = db.prepare("SELECT value FROM preferences WHERE key = 'settings:whatsapp'").get();
    if (row && row.value) return JSON.parse(row.value);
  } catch {}
  return null;
}

function formatPhone(phone) {
  let clean = String(phone || '').replace(/[+\s-]/g, '');
  if (clean.startsWith('00')) clean = clean.slice(2);
  if (clean.length === 8 && !clean.startsWith('973')) clean = '973' + clean;
  return clean;
}

const TEMPLATES = [
  {
    id: 'sales_invoice',
    name: 'فاتورة مبيعات رقمية',
    content: (custName, orderNum, items, total, link) =>
      `مرحباً ${custName || 'عزيزنا العميل'}،\nشكراً لتسوقك وثقتك بـ ${STORE_NAME}!\n\n🧾 *تفاصيل فاتورة المبيعات رقم:* *${orderNum}*\n${items}\n\n💰 *المبلغ الإجمالي:* *${total} د.ب*\n🔗 *رابط الفاتورة السحابية:* ${link}\n\nيسعدنا دائماً خدمتكم! 🤍✨`
  },
  {
    id: 'builtin_appliances',
    name: 'عروض أجهزة Built-in',
    content: (custName, promoCode) =>
      `أهلاً بك ${custName || 'عزيزنا العميل'} ✨ ميز مطبخك بأحدث أجهزة الـ Built-in المتطورة (أفران بلت إن، مسطحات سيراميك وغاز، وشفاطات ديكورية) من ${STORE_NAME} بأسعار حصرية مع ضمان شامل وتركيب معتمد. كود الخصم: ${promoCode || 'MH15'}. تفضل بزيارة فرعنا بسوق واقف! 🔥🍳`
  },
  {
    id: 'stainless_sinks',
    name: 'عروض أحواض استانلس ستيل نانو والإكسسوارات',
    content: (custName, promoCode) =>
      `مرحباً ${custName || 'عزيزنا العميل'} 🚰 اكتشف تشكيلة ${STORE_NAME} الحصرية من أحواض المطابخ استانلس ستيل المقاومة للخدش بتقنية النانو مع إكسسوارات المطابخ الحديثة بأسعار تفضيلية وجودة تدوم. كود الخصم: ${promoCode || 'MH15'}. نسعد بخدمتك دائماً! ✨🏡`
  },
  {
    id: 'order_status',
    name: 'حالة الطلب والتوصيل',
    content: (custName, orderNum, status) =>
      `عزيزنا ${custName || 'العميل'}، نود إبلاغك بأن طلبك رقم ${orderNum} لدى ${STORE_NAME} أصبحت حالته: *${status || 'قيد التجهيز'}*. يسعدنا دائماً تواصلكم معنا على ${STORE_PHONE}. 📦🚚`
  }
];

const TOOLS = [
  {
    name: 'whatsapp_send_message',
    description: 'Format a WhatsApp message, generate a direct wa.me link, and optionally open it directly on Windows.',
    inputSchema: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Customer phone number (e.g. 35965477 or +97335965477)' },
        message: { type: 'string', description: 'The text message to send' },
        openUrl: { type: 'boolean', description: 'Whether to open the WhatsApp URL in the default browser/desktop app immediately' }
      },
      required: ['phone', 'message']
    }
  },
  {
    name: 'whatsapp_send_invoice',
    description: 'Fetch an order by number or ID, format a professional itemized sales invoice (without VAT), generate the digital invoice link, and create the WhatsApp dispatch URL.',
    inputSchema: {
      type: 'object',
      properties: {
        orderNumber: { type: 'string', description: 'The order number (e.g. ORD-2026-0001) or order ID' },
        openUrl: { type: 'boolean', description: 'Whether to open WhatsApp directly' }
      },
      required: ['orderNumber']
    }
  },
  {
    name: 'whatsapp_broadcast_campaign',
    description: 'Prepare a personalized WhatsApp marketing campaign message for customers or customer segments with variable substitution.',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', enum: ['builtin_appliances', 'stainless_sinks', 'order_status'], description: 'The marketing template ID' },
        promoCode: { type: 'string', description: 'Promo code to insert (default: MH15)' },
        searchQuery: { type: 'string', description: 'Optional customer search query to target specific customers' },
        limit: { type: 'number', description: 'Maximum number of customer links to generate (default: 20)' }
      },
      required: ['templateId']
    }
  },
  {
    name: 'whatsapp_list_templates',
    description: 'List all available WhatsApp templates in Modern House OMS with their categories and sample text.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'whatsapp_list_customers',
    description: 'List customers with contact phone numbers from Modern House OMS database for marketing communication.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Filter by name or phone substring' },
        limit: { type: 'number', description: 'Max customers to return (default 50)' }
      }
    }
  }
];

function handleToolCall(name, args = {}) {
  const settings = getWhatsAppSettings() || { provider: 'direct' };
  switch (name) {
    case 'whatsapp_send_message': {
      const { phone, message, openUrl } = args;
      const formatted = formatPhone(phone);
      const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
      if (openUrl) {
        exec(`start "" "${url}"`);
      }
      return {
        phone: formatted,
        message,
        url,
        opened: !!openUrl,
        activeProvider: settings.provider || 'direct',
        gatewayStatus: settings.provider !== 'direct' ? 'API Enabled' : 'Direct Link'
      };
    }

    case 'whatsapp_send_invoice': {
      const { orderNumber, openUrl } = args;
      const order = getOrder(orderNumber);
      if (!order) {
        return { error: `Order '${orderNumber}' not found in database.` };
      }
      const products = getProducts();
      const customers = getCustomers();
      const customer = customers.find(c => c.id === order.customerId);
      const custPhone = customer?.phone || '';
      const formattedPhone = formatPhone(custPhone);

      const itemsSummary = (order.items || []).map((it, idx) => {
        const prod = products.find(p => p.id === it.productId);
        const name = prod?.name || `صنف #${idx + 1}`;
        return `• ${name} (${it.quantity}x) = ${(it.price * it.quantity).toFixed(2)} د.ب`;
      }).join('\n');

      const invoiceNum = order.orderNumber || order.id;
      const invoiceUrl = `${CLOUD_BASE_URL}/?invoice=${encodeURIComponent(invoiceNum)}`;
      const tmpl = TEMPLATES.find(t => t.id === 'sales_invoice');
      const message = tmpl.content(
        customer?.name,
        order.orderNumber,
        itemsSummary,
        order.total,
        invoiceUrl
      );

      const url = formattedPhone 
        ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;

      if (openUrl && formattedPhone) {
        exec(`start "" "${url}"`);
      }

      return {
        orderNumber: order.orderNumber,
        customerName: customer?.name || 'عميل نقدي',
        phone: formattedPhone,
        total: order.total,
        itemsCount: (order.items || []).length,
        invoiceUrl,
        whatsappUrl: url,
        messagePreview: message
      };
    }

    case 'whatsapp_broadcast_campaign': {
      const { templateId, promoCode = 'MH15', searchQuery = '', limit = 20 } = args;
      const tmpl = TEMPLATES.find(t => t.id === templateId);
      if (!tmpl) {
        return { error: `Template '${templateId}' not found. Available: ${TEMPLATES.map(t => t.id).join(', ')}` };
      }
      const customers = getCustomers(searchQuery, limit);
      const results = customers.filter(c => c.phone).map(c => {
        const phone = formatPhone(c.phone);
        const text = tmpl.content(c.name, promoCode);
        return {
          customerName: c.name,
          phone,
          url: `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
          preview: text
        };
      });

      return {
        template: tmpl.name,
        targetedCount: results.length,
        queue: results
      };
    }

    case 'whatsapp_list_templates': {
      return {
        store: STORE_NAME,
        templates: TEMPLATES.map(t => ({ id: t.id, name: t.name }))
      };
    }

    case 'whatsapp_list_customers': {
      const customers = getCustomers(args.search || '', args.limit || 50);
      return {
        total: customers.length,
        customers: customers.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          formattedPhone: formatPhone(c.phone),
          address: c.address || ''
        }))
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// JSON-RPC 2.0 stdio engine
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on('line', line => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let request;
  try {
    request = JSON.parse(trimmed);
  } catch (err) {
    const errorResponse = { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
    return;
  }

  const { id, method, params } = request;

  if (method === 'notifications/initialized') {
    return; // Notification, no response
  }

  if (method === 'initialize') {
    const response = {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'modern-house-whatsapp-mcp',
          version: '1.0.0'
        }
      }
    };
    process.stdout.write(JSON.stringify(response) + '\n');
    return;
  }

  if (method === 'ping') {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: {} }) + '\n');
    return;
  }

  if (method === 'tools/list') {
    const response = {
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS
      }
    };
    process.stdout.write(JSON.stringify(response) + '\n');
    return;
  }

  if (method === 'tools/call') {
    try {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const data = handleToolCall(toolName, toolArgs);
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ]
        }
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (err) {
      const response = {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: err.message
        }
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    }
    return;
  }

  // Fallback for unknown methods
  process.stdout.write(JSON.stringify({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` }
  }) + '\n');
});
