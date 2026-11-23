import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Truck, 
  RefreshCw,
  Copy,
  Check,
  Zap,
  KeyRound
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { askBusinessCopilot, getEffectiveApiKey } from '../../lib/aiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({ isOpen, onClose }) => {
  const { products, orders, customers, deliveries, expenses, setActiveScreen } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `مرحباً بك! أنا **مساعد مودرن هاوس التنفيذي الذكي** ✨\nأنا مرتبط بقاعدة بيانات المعرض الحية لمساعدتك في:\n- تحليل المبيعات والإيرادات اليومية والشهرية.\n- فحص نواقص المخزون والتنبؤ بمواعيد النفاد.\n- متابعة التوصيلات وحسابات العملاء والموردين.\n\nكيف يمكنني خدمتك اليوم؟`,
      timestamp: new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasApiKey = Boolean(getEffectiveApiKey());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await askBusinessCopilot(q, {
        products,
        orders,
        customers,
        deliveries,
        expenses
      });

      const assistantMsg: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        role: 'assistant',
        content: `⚠️ تعذر إكمال الطلب: ${err.message || 'فشل الاتصال بالذكاء الاصطناعي'}`,
        timestamp: new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: '📊 تحليل مبيعات اليوم', query: 'أعطني ملخصاً تفصيلياً لمبيعات وأرباح اليوم وعدد الطلبات المكتملة مقارنة بالمعدل العام' },
    { label: '⚠️ أصناف المخزون الحرجة', query: 'ما هي الأصناف التي أوشكت على النفاد حالياً وكم الكميات المتبقية وتكلفة إعادة طلبها؟' },
    { label: '🏆 أفضل 5 منتجات مبيعاً', query: 'من هي أكثر 5 منتجات مبيعاً وأكثرها جلباً للإيرادات في المعرض؟' },
    { label: '🚚 موقف التوصيل اليوم', query: 'ما هو موقف طلبات التوصيل المعلقة اليوم وكيف توزعها على مناطق البحرين؟' }
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl h-[88vh] max-h-[750px] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-primary to-slate-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">مساعد مودرن هاوس التنفيذي (AI Copilot)</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Gemini 2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-300">مربوط لحظياً بقاعدة بيانات المبيعات والمخزون والتوصيل</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Missing API Key Warning Banner */}
        {!hasApiKey && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-between text-xs px-5">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>مفتاح Gemini API غير مضاف بعد. يمكنك إضافته من صفحة الإعدادات لتفعيل الذكاء الاصطناعي بشكل كامل.</span>
            </div>
            <button
              onClick={() => {
                onClose();
                setActiveScreen('settings');
              }}
              className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] hover:bg-amber-400 transition"
            >
              ضبط الإعدادات
            </button>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4 text-amber-400" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-none shadow-md font-medium'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-800 shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                
                <div className={`flex items-center justify-between gap-3 mt-2 pt-1.5 border-t ${
                  msg.role === 'user' ? 'border-white/10 text-slate-300' : 'border-slate-100 dark:border-slate-800 text-slate-400'
                } text-[10px]`}>
                  <span>{msg.timestamp}</span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="hover:text-primary dark:hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                      title="نسخ الإجابة"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500 font-bold">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-none p-3.5 flex items-center gap-2 shadow-sm text-xs text-slate-500">
                <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                <span>جاري استخراج وتحليل بيانات المعرض بواسطة الذكاء الاصطناعي...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
            <Zap className="w-3 h-3 text-amber-500" />
            استفسار سريع:
          </span>
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(qp.query)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700/80 hover:text-amber-600 dark:hover:text-amber-400 text-slate-700 dark:text-slate-300 text-[11px] font-bold whitespace-nowrap transition cursor-pointer border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="اكتب سؤالك حول المبيعات، المنتجات، النواقص، أو العملاء..."
              className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="p-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
