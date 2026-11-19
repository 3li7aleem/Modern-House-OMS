export type TemplateCategory = 'orders' | 'promotions' | 'followup' | 'general' | 'custom';

export interface MarketingTemplate {
    id: string;
    category: TemplateCategory;
    nameAr: string;
    nameEn: string;
    descriptionAr: string;
    descriptionEn: string;
    badgeAr: string;
    badgeEn: string;
    contentAr: string;
    contentEn: string;
    tags: string[];
    isCustom?: boolean;
}

export const CATEGORY_INFO: Record<TemplateCategory, {
    titleAr: string;
    titleEn: string;
    color: string;
    icon: string;
}> = {
    'orders': {
        titleAr: 'تحديثات الطلبات والتوصيل',
        titleEn: 'Order Updates & Delivery',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
        icon: 'package'
    },
    'promotions': {
        titleAr: 'العروض والخصومات الترويجية',
        titleEn: 'Promotions & Discounts',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
        icon: 'tag'
    },
    'followup': {
        titleAr: 'متابعة وخدمة العملاء',
        titleEn: 'Customer Care & Follow-up',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
        icon: 'heart'
    },
    'general': {
        titleAr: 'رسائل عامة وترحيبية',
        titleEn: 'General & Greetings',
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
        icon: 'sparkles'
    },
    'custom': {
        titleAr: 'قوالبي المخصصة',
        titleEn: 'My Custom Templates',
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
        icon: 'bookmark'
    }
};

export const BUILTIN_MARKETING_TEMPLATES: MarketingTemplate[] = [
    // ==========================================
    // 1. تحديثات الطلبات وعروض الأسعار والفواتير
    // ==========================================
    {
        id: 'quotation_proposal_send',
        category: 'orders',
        nameAr: 'إرسال تفاصيل عرض سعر رسمي',
        nameEn: 'Send Official Price Quotation',
        descriptionAr: 'مشاركة ملخص عرض السعر وقيمته وتاريخ الصلاحية مع العميل',
        descriptionEn: 'Share commercial quote summary, amount, and validity date',
        badgeAr: 'عرض سعر',
        badgeEn: 'Quotation',
        contentAr: 'مرحباً [الاسم]، نتشرف بإرسال تفاصيل عرض السعر رقم: [رقم_العرض] الخاص بكم من [المتجر] بقيمة إجمالية [المبلغ] دينار، والعرض سارٍ لغاية [تاريخ_الصلاحية]. يسعدنا تواصلكم لأي استفسار أو لاعتماد الطلب والبدء بالتجهيز! 📋✨',
        contentEn: 'Hello [الاسم], we are pleased to share official quotation #[رقم_العرض] from Modern House for total amount of [المبلغ] BHD, valid until [تاريخ_الصلاحية]. Please contact us to confirm your order or for any adjustments! 📋✨',
        tags: ['عرض_سعر', 'تسعيرة', 'صلاحية', 'تجهيز']
    },
    {
        id: 'tax_invoice_sent',
        category: 'orders',
        nameAr: 'إشعار الفاتورة الضريبية وتأكيد السداد',
        nameEn: 'Tax Invoice & Payment Confirmation',
        descriptionAr: 'إرسال تفاصيل الفاتورة الضريبية ومبلغها الإجمالي ورقم المعاملة للعميل',
        descriptionEn: 'Send tax invoice details, total paid, and transaction reference',
        badgeAr: 'فاتورة ضريبية',
        badgeEn: 'Tax Invoice',
        contentAr: 'عزيزنا [الاسم]، نشكرك على تسوقك في [المتجر]! تم إصدار فاتورتك الضريبية رقم: [رقم_الطلب] بمبلغ إجمالي: [المبلغ] دينار مسددة بالكامل. مرفق تفاصيل طلبك ونسعد دائماً بخدمتك ونتمنى لك يوماً سعيداً! 🧾🤍',
        contentEn: 'Dear [الاسم], thank you for your business with Modern House! Your tax invoice #[رقم_الطلب] has been issued for total of [المبلغ] BHD (Paid). We appreciate your patronage and wish you a great day! 🧾🤍',
        tags: ['فاتورة', 'ضريبة', 'سداد', 'إيصال']
    },
    {
        id: 'payment_due_reminder',
        category: 'orders',
        nameAr: 'تذكير بسداد دفعة أو مستحقات طلب',
        nameEn: 'Payment Due & Installment Reminder',
        descriptionAr: 'تذكير محترم ولطيف للعميل بوجود دفعة مالية مستحقة مع بيانات التحويل',
        descriptionEn: 'Polite reminder regarding pending payment balance and transfer info',
        badgeAr: 'تذكير سداد',
        badgeEn: 'Payment Reminder',
        contentAr: 'مرحباً [الاسم]، نود تذكيرك بلطف بوجود دفعة مستحقة بمبلغ: [المبلغ] دينار مرتبطة بطلبك رقم: [رقم_الطلب] لدى [المتجر]. يمكنك السداد بسهولة عبر بنفت أو بزيارة المعرض. شاكرين ومقدرين حسن تعاونك الدائم معنا! 💳🤝',
        contentEn: 'Hello [الاسم], gentle reminder regarding your outstanding balance of [المبلغ] BHD for order #[رقم_الطلب] at Modern House. Payment can be settled via BenefitPay or at our branch. Thank you for your continued cooperation! 💳🤝',
        tags: ['سداد', 'دفعة', 'تذكير', 'مستحقات', 'بنفت']
    },
    {
        id: 'kitchen_delivery_installation',
        category: 'orders',
        nameAr: 'تحديد موعد توريد وتركيب المطابخ والأطقم',
        nameEn: 'Kitchen Delivery & Installation Schedule',
        descriptionAr: 'تأكيد موعد وصول فريق الفنيين والتركيب لعنوان العميل',
        descriptionEn: 'Confirm date and time for kitchen installation and delivery team',
        badgeAr: 'موعد تركيب',
        badgeEn: 'Installation',
        contentAr: 'عزيزنا [الاسم]، تم تحديد موعد توريد وتركيب مستلزمات مطبخك لطلب رقم: [رقم_الطلب] من قبل فريق فنيي [المتجر]. سيتواصل معك فريق التركيب للتنسيق النهائي قبل الوصول. نتمنى لك تجربة راقية وممتعة! 🛠️🚚',
        contentEn: 'Dear [الاسم], your delivery and installation schedule for order #[رقم_الطلب] has been set by Modern House technicians. Our team will contact you prior to arrival. Thank you! 🛠️🚚',
        tags: ['تركيب', 'فني', 'توريد', 'موعد']
    },
    {
        id: 'advance_deposit_receipt',
        category: 'orders',
        nameAr: 'إيصال استلام عربون / دفعة مقدمة',
        nameEn: 'Advance Deposit & Partial Payment Receipt',
        descriptionAr: 'تأكيد استلام دفعة مقدمة لتجهيز مطبخ أو حجز أجهزة ومستلزمات',
        descriptionEn: 'Confirm advance deposit received for custom kitchen or reserved items',
        badgeAr: 'استلام عربون',
        badgeEn: 'Deposit Paid',
        contentAr: 'عزيزنا [الاسم]، نؤكد استلام دفعة مقدمة بمبلغ [المبلغ] دينار لحساب طلبكم رقم [رقم_الطلب] لدى [المتجر]. تم اعتماد التجهيز وسنوافيكم بجدول التسليم فوراً. شكراً لثقتكم الغالية! 💳✨',
        contentEn: 'Dear [الاسم], we confirm receipt of an advance payment of [المبلغ] BHD for order #[رقم_الطلب] at Modern House. Your preparation is approved and scheduled. Thank you! 💳✨',
        tags: ['عربون', 'دفعة_مقدمة', 'إيصال', 'سداد']
    },
    {
        id: 'maintenance_status_ready',
        category: 'orders',
        nameAr: 'اكتمال فحص وصيانة الجهاز',
        nameEn: 'Maintenance & Repair Completed',
        descriptionAr: 'إبلاغ العميل بجاهزية جهازه للاستلام بعد الصيانة واختبارات الجودة',
        descriptionEn: 'Notify customer that appliance repair passed QC and is ready for pickup',
        badgeAr: 'جاهز بعد الصيانة',
        badgeEn: 'Repaired',
        contentAr: 'مرحباً [الاسم]، يسعدنا إبلاغك باكتمال صيانة وفحص جهازك بنجاح في مركز صيانة [المتجر] واجتيازه الفحص الفني. الجهاز جاهز الآن للاستلام من فرعنا. نتمنى لك تجربة موفقة! 🛠️✅',
        contentEn: 'Hello [الاسم], your appliance repair has been completed and passed quality inspection at Modern House service center. Ready for collection. Thank you! 🛠️✅',
        tags: ['صيانة', 'إصلاح', 'فحص', 'جاهز']
    },
    {
        id: 'custom_kitchen_measurement',
        category: 'orders',
        nameAr: 'تأكيد موعد رفع المقاسات والمعاينة',
        nameEn: 'Site Visit & Measurement Appointment',
        descriptionAr: 'تأكيد موعد زيارة الفني لرفع مقاسات المطبخ والموقع بدقة',
        descriptionEn: 'Confirm technician visit to take precise kitchen measurements',
        badgeAr: 'رفع المقاسات',
        badgeEn: 'Site Visit',
        contentAr: 'أهلاً بك [الاسم]، نود تأكيد موعد زيارة الفني المختص من [المتجر] لمعاينة ورفع مقاسات المطبخ والموقع بدقة تمهيداً لإعداد المخطط وعرض السعر. للتعديل أو الاستفسار يسعدنا تواصلكم دائماً! 📐🏡',
        contentEn: 'Hello [الاسم], confirming the scheduled visit of Modern House specialist to inspect and take precise kitchen measurements for your quotation. Contact us for any rescheduling! 📐🏡',
        tags: ['مقاسات', 'معاينة', 'فني', 'مخطط']
    },
    {
        id: 'order_received_processing',
        category: 'orders',
        nameAr: 'تأكيد استلام الطلب وتجهيزه',
        nameEn: 'Order Received & Processing',
        descriptionAr: 'إشعار فوري للعميل بتأكيد استلام طلبه والبدء في تجهيزه وتغليفه',
        descriptionEn: 'Instant confirmation that order was received and is being packed',
        badgeAr: 'تأكيد الطلب',
        badgeEn: 'Confirmed',
        contentAr: 'أهلاً بك [الاسم]، نود إعلامك بأنه تم تأكيد استلام طلبك رقم [رقم_الطلب] بنجاح في [المتجر]، وفريقنا يعمل حالياً على تجهيزه وتغليفه بكل عناية. سنوافيك بالتفاصيل فور اكتمال التجهيز. شكراً لاختيارك لنا! 🛍️✨',
        contentEn: 'Dear [الاسم], we are pleased to confirm that your order [رقم_الطلب] has been received successfully at Modern House. Our team is carefully preparing and packaging your items. We will keep you updated. Thank you for choosing us! 🛍️✨',
        tags: ['طلب', 'تأكيد', 'تجهيز', 'استلام']
    },
    {
        id: 'order_ready_pickup',
        category: 'orders',
        nameAr: 'الطلب جاهز للاستلام من المعرض',
        nameEn: 'Order Ready for Store Pickup',
        descriptionAr: 'إبلاغ العميل بجاهزية طلبه للاستلام من المعرض مع مواعيد العمل',
        descriptionEn: 'Notify customer that order is ready for in-store pickup',
        badgeAr: 'جاهز للاستلام',
        badgeEn: 'Ready for Pickup',
        contentAr: 'عزيزنا [الاسم]، يسعدنا إبلاغك بأن طلبك رقم [رقم_الطلب] جاهز الآن للاستلام من فرع [المتجر]. نتشرف بزيارتك في أي وقت خلال ساعات العمل الرسمية (من ٩ صباحاً حتى ١٠ مساءً). نسعد بخدمتك دائماً! 🏪📦',
        contentEn: 'Dear [الاسم], your order [رقم_الطلب] is now ready for in-store pickup at Modern House branch. We look forward to seeing you anytime during our business hours (9 AM - 10 PM). Always a pleasure serving you! 🏪📦',
        tags: ['استلام', 'معرض', 'جاهز', 'زيارة']
    },
    {
        id: 'order_out_for_delivery',
        category: 'orders',
        nameAr: 'الطلب قيد التوصيل مع المندوب',
        nameEn: 'Order Out for Delivery',
        descriptionAr: 'تنبيه العميل بأن المندوب في الطريق إليه مع توجيه بالجاهزية',
        descriptionEn: 'Alert customer that driver is en-route for delivery',
        badgeAr: 'قيد التوصيل',
        badgeEn: 'Out for Delivery',
        contentAr: 'مرحباً [الاسم]، طلبك رقم [رقم_الطلب] في طريقه إليك الآن مع مندوب التوصيل! 🚚 الرجاء التأكد من التواجد على العنوان المسجل وجاهزية استقبال الاتصال لتسهيل التسليم السريع. نتمنى لك تجربة ممتعة! 📦💨',
        contentEn: 'Hello [الاسم], your order [رقم_الطلب] is out for delivery with our courier right now! 🚚 Please keep your phone reachable at your registered address for smooth handover. Enjoy your purchase! 📦💨',
        tags: ['توصيل', 'مندوب', 'سائق', 'شحن']
    },
    {
        id: 'order_delivered_success',
        category: 'orders',
        nameAr: 'تم تسليم الطلب بنجاح',
        nameEn: 'Order Delivered Successfully',
        descriptionAr: 'رسالة تهنئة وشكر بعد إتمام تسليم الطلب للعميل',
        descriptionEn: 'Post-delivery confirmation and gratitude note',
        badgeAr: 'تم التسليم',
        badgeEn: 'Delivered',
        contentAr: 'عزيزنا [الاسم]، تم تسليم طلبك رقم [رقم_الطلب] بنجاح! نتمنى أن تنال المنتجات إعجابك وتلبي تطلعاتك. يسعدنا دائماً استقبال ملاحظاتك ومشاركتنا رأيك. دمت بود! 🤍🎉',
        contentEn: 'Dear [الاسم], your order [رقم_الطلب] has been delivered successfully! We hope you love your new kitchenware. We would love to hear your feedback anytime. Thank you! 🤍🎉',
        tags: ['تسليم', 'مكتمل', 'نجاح', 'شكر']
    },
    {
        id: 'back_in_stock_arrival',
        category: 'orders',
        nameAr: 'وصول بضاعة أو حجز مسبق',
        nameEn: 'Special Order / Item Back in Stock',
        descriptionAr: 'إشعار بوصول تشكيلة أو أطقم كان العميل بانتظارها',
        descriptionEn: 'Notify that awaited kitchen items are back in stock',
        badgeAr: 'توفر المنتجات',
        badgeEn: 'Back in Stock',
        contentAr: 'بشرى سارة [الاسم]! القطع المميزة ومستلزمات المطبخ التي كنت بانتظارها وصلت حديثاً لمعرض [المتجر]. يمكنك إتمام طلبك الآن أو زيارتنا للاطلاع عليها قبل نفاد الكمية! 🌟✨',
        contentEn: 'Great news [الاسم]! The exclusive kitchen items and collections you inquired about are now back in stock at Modern House. Reserve yours now before stock runs out! 🌟✨',
        tags: ['توفر', 'بضاعة', 'وصول', 'حجز']
    },

    // ==========================================
    // 2. العروض والخصومات الترويجية (Promotions)
    // ==========================================
    {
        id: 'exclusive_promo_offer',
        category: 'promotions',
        nameAr: 'عرض خصم ترويجي مميز (15%)',
        nameEn: 'Exclusive Promo Offer (15% Off)',
        descriptionAr: 'خصم خاص وحصري مع كود ترويجي لتشجيع العميل على الشراء',
        descriptionEn: 'Exclusive promo code for direct purchasing',
        badgeAr: 'خصم حصري',
        badgeEn: '15% Off',
        contentAr: 'أهلاً [الاسم]! يسعدنا تقديم عرض مميز وحصري لك اليوم من [المتجر]. احصل على خصم بقيمة 15% على مشترياتك القادمة باستخدام كود الخصم: [كود_الخصم]. العرض سارٍ لفترة محدودة، تسوق الآن وجدد مطبخك بأرقى الأدوات! 🛍️🔥',
        contentEn: 'Hi [الاسم]! Enjoy an exclusive 15% discount on your next kitchen supplies order at Modern House using coupon: [كود_الخصم]. Limited time offer, shop our finest collections today! 🛍️🔥',
        tags: ['خصم', 'كود', 'عرض', 'توفير']
    },
    {
        id: 'cookware_hospitality_promo',
        category: 'promotions',
        nameAr: 'عروض أطقم وأواني الضيافة والمطبخ',
        nameEn: 'Luxury Cookware & Hospitality Sets',
        descriptionAr: 'ترويج لأحدث أطقم الطهي والتقديم وأواني المائدة بأسعار خاصة',
        descriptionEn: 'Promote newest hospitality and dining sets',
        badgeAr: 'أطقم الضيافة',
        badgeEn: 'Cookware Special',
        contentAr: 'عزيزنا [الاسم]، أطقم الضيافة وأواني الطهي الفاخرة وصلت بتصاميم جديدة وعصرية في [المتجر]! استمتع بأسعار تفضيلية وخصومات تصل حتى 30% على تشكيلة مختارة لإضفاء لمسة فخامة على مائدتك. نتشرف بزيارتك! 🍽️✨',
        contentEn: 'Dear [الاسم], discover our brand-new cookware and luxury hospitality sets at Modern House! Enjoy discounts up to 30% on curated kitchenware to bring elegance to your table. 🍽️✨',
        tags: ['أواني', 'ضيافة', 'مطبخ', 'طقم']
    },
    {
        id: 'mega_clearance_sale',
        category: 'promotions',
        nameAr: 'تصفية كبرى وتخفيضات موسمية',
        nameEn: 'Clearance & Mega Seasonal Sale',
        descriptionAr: 'إعلان عن تصفيات كبرى بخصومات حتى 50% على الأجهزة والمستلزمات',
        descriptionEn: 'Announce massive seasonal clearance up to 50%',
        badgeAr: 'تصفية كبرى',
        badgeEn: 'Mega Sale',
        contentAr: 'مرحباً [الاسم]، التخفيضات الكبرى بدأت في [المتجر]! تشكيلة واسعة من مستلزمات المطبخ والأجهزة المنزلية بخصومات استثنائية تصل إلى 50%. الكميات محدودة، لا تفوت الفرصة وسارع بزيارتنا! 🏷️💥',
        contentEn: 'Hello [الاسم], our Mega Seasonal Sale has officially launched at Modern House! Grab top kitchenware, cookware, and accessories at up to 50% off. Limited quantities available! 🏷️💥',
        tags: ['تصفية', 'تخفيضات', 'موسم', 'خصم_كبير']
    },
    {
        id: 'welcome_gift_freeship',
        category: 'promotions',
        nameAr: 'هدية ترحيبية وتوصيل مجاني',
        nameEn: 'Welcome Gift & Free Delivery',
        descriptionAr: 'ترحيب بالعميل الجديد مع رمز للشحن المجاني على أول طلب',
        descriptionEn: 'Welcome greeting offering free shipping code',
        badgeAr: 'شحن مجاني',
        badgeEn: 'Free Delivery',
        contentAr: 'مرحباً بك [الاسم] في عائلة [المتجر]. يسعدنا انضمامك إلينا ونقدم لك هدية ترحيبية: توصيل مجاني لطلبك القادم باستخدام الرمز الترويجي: FREESHIP. أهلاً بك ونتطلع لخدمتك دائماً! 🎁🚚',
        contentEn: 'Welcome [الاسم] to Modern House family! As a welcome gesture, enjoy FREE delivery on your upcoming order with promo code: FREESHIP. We look forward to serving you! 🎁🚚',
        tags: ['ترحيب', 'شحن_مجاني', 'هدية', 'أول_طلب']
    },
    {
        id: 'promo_expiry_reminder',
        category: 'promotions',
        nameAr: 'تذكير باقتراب انتهاء كود الخصم',
        nameEn: 'Promo Code Expiry Reminder',
        descriptionAr: 'تنبيه سريع للعميل قبل انتهاء صلاحية الكوبون أو العرض',
        descriptionEn: 'Urgent reminder before coupon expiration',
        badgeAr: 'فرصة أخيرة',
        badgeEn: 'Last Chance',
        contentAr: 'تذكير لطيف [الاسم] ⏳ كود الخصم الحصري الخاص بك [كود_الخصم] يوشك على الانتهاء خلال ساعات قليلة! استغل الفرصة الآن لتسوق أواني ومستلزمات مطبخك المفضلة قبل انتهاء العرض. تسوق ممتع! 🛒✨',
        contentEn: 'Gentle reminder [الاسم] ⏳ Your exclusive discount code [كود_الخصم] expires soon! Don\'t miss out on grabbing your favorite kitchen supplies before it ends. Happy shopping! 🛒✨',
        tags: ['تذكير', 'انتهاء', 'كود', 'عاجل']
    },
    {
        id: 'ramadan_kitchen_festival',
        category: 'promotions',
        nameAr: 'عروض الموسم والضيافة الرمضانية',
        nameEn: 'Ramadan Hospitality & Kitchenware Sale',
        descriptionAr: 'عروض حصرية على أطقم الضيافة وسخانات الطعام وأواني التقديم',
        descriptionEn: 'Exclusive discounts on Ramadan cookware, warmers, and dining sets',
        badgeAr: 'عروض رمضان',
        badgeEn: 'Ramadan Offer',
        contentAr: 'مبارك عليكم شهر الخير والبركة [الاسم] 🌙 استقبلوا أجمل اللحظات بأفخم أواني التقديم والضيافة وأطقم الطهي الفاخرة من [المتجر]! خصومات حصرية تصل حتى 40% على تشكيلة رمضان المميزة. تفضلوا بزيارتنا أو اطلبوا مباشرة! 🍽️✨',
        contentEn: 'Blessed Ramadan [الاسم] 🌙 Welcome the holy month with luxury hospitality sets, food warmers, and cookware from Modern House! Enjoy up to 40% off our curated collections. 🍽️✨',
        tags: ['رمضان', 'ضيافة', 'أواني', 'عروض']
    },
    {
        id: 'national_day_sale',
        category: 'promotions',
        nameAr: 'عروض العيد الوطني لمملكة البحرين',
        nameEn: 'Bahrain National Day Celebration Sale',
        descriptionAr: 'تخفيضات احتفالية على أحواض المطبخ وأجهزة الطهي',
        descriptionEn: 'Special celebratory discounts for Bahrain National Day',
        badgeAr: 'العيد الوطني',
        badgeEn: 'National Day',
        contentAr: 'كل عام ومملكتنا الغالية بألف خير 🇧🇭 بمناسبة الأعياد الوطنية، يسر [المتجر] إطلاق تخفيضات استثنائية على تشكيلة مختارة من أحواض المطبخ وأجهزة الطهي الحديثة. شاركونا الفرحة واستفيدوا من العروض قبل نفاد الكمية! 🌟🇧🇭',
        contentEn: 'Happy National Day Bahrain 🇧🇭 Modern House celebrates with special discounts on premium sinks, hoods, and cooking appliances. Visit us to enjoy the celebration offers! 🌟🇧🇭',
        tags: ['العيد_الوطني', 'البحرين', 'تخفيضات', 'احتفال']
    },
    {
        id: 'bundle_package_offer',
        category: 'promotions',
        nameAr: 'باقة المطبخ المتكاملة للعرسان والبيوت الجديدة',
        nameEn: 'Complete New Home & Wedding Kitchen Bundle',
        descriptionAr: 'باقة شاملة (حوض جرانيت + خلاط ذكي + موقد) بخصم خاص وضمان شامل',
        descriptionEn: 'All-in-one kitchen setup bundle for new homeowners and newlyweds',
        badgeAr: 'باقة متكاملة',
        badgeEn: 'Kitchen Bundle',
        contentAr: 'تجهز بيتك الجديد أو تؤسس مطبخ العمر [الاسم]؟ 🏡 وفرنا لك باقة التجهيز الشاملة (حوض فاخر + خلاط ذكي + موقد ومستلزمات متكاملة) بسعر تفضيلي وضمان شامل وتوصيل مجاني من [المتجر]. تواصل معنا للاطلاع على التفاصيل! 🎁💎',
        contentEn: 'Building your dream home [الاسم]? 🏡 Check out Modern House complete bundle (luxury sink + smart mixer + hob) at exclusive package pricing with warranty and free delivery! 🎁💎',
        tags: ['باقة', 'عرسان', 'بيت_جديد', 'مطبخ_متكامل']
    },
    {
        id: 'sink_faucet_promo',
        category: 'promotions',
        nameAr: 'عرض أحواض الجرانيت والخلاطات الذكية',
        nameEn: 'Granite Sinks & Smart Mixers Special',
        descriptionAr: 'خصم 20% على أحواض الجرانيت والخلاطات الذكية المقاومة للحرارة',
        descriptionEn: 'Special 20% discount on heat-resistant granite sinks and mixers',
        badgeAr: 'أحواض وخلاطات',
        badgeEn: 'Sinks & Mixers',
        contentAr: 'جدد مطبخك بلمسة عصرية [الاسم] ✨ تشكيلة راقية من أحواض الجرانيت المقاومة للخدش والحرارة مع خلاطات مياه ذكية متعددة الاستخدامات بخصم خاص 20% هذا الأسبوع في [المتجر]. نتشرف بزيارتكم! 🚰🔥',
        contentEn: 'Upgrade your kitchen [الاسم] ✨ Luxury scratch-resistant granite sinks and multifunctional smart mixers at 20% off this week at Modern House! 🚰🔥',
        tags: ['أحواض', 'جرانيت', 'خلاط', 'ذكي']
    },
    {
        id: 'weekend_flash_sale',
        category: 'promotions',
        nameAr: 'تخفيضات نهاية الأسبوع الخاطفة (Flash Sale)',
        nameEn: 'Weekend Flash Sale',
        descriptionAr: 'خصم فوري خاطف ينتهي بنهاية عطلة نهاية الأسبوع',
        descriptionEn: 'Limited time flash sale valid until Saturday night',
        badgeAr: 'عرض خاطف',
        badgeEn: 'Flash Sale',
        contentAr: 'عرض الويكند الحصري ⚡ خصم فوري ومميز على كافة المشتريات خلال عطلة نهاية الأسبوع في معرض [المتجر] باستخدام كود الخصم: [كود_الخصم]. العرض سارٍ حتى مساء السبت فقط، لا تفوت الفرصة! ⏳🛒',
        contentEn: 'Exclusive Weekend Flash Sale ⚡ Instant discount on store purchases this weekend at Modern House with code: [كود_الخصم]. Ends Saturday night, don\'t miss out! ⏳🛒',
        tags: ['ويكند', 'فلاش_سيل', 'خاطف', 'عطلة']
    },

    // ==========================================
    // 3. متابعة وخدمة العملاء (Customer Follow-ups)
    // ==========================================
    {
        id: 'quotation_followup',
        category: 'followup',
        nameAr: 'متابعة عرض سعر سابق مع العميل',
        nameEn: 'Quotation Follow-up & Reassurance',
        descriptionAr: 'متابعة ودية بعد إرسال عرض السعر للرد على أي استفسارات وتسهيل إتمام الشراء',
        descriptionEn: 'Friendly check-in regarding a sent quotation to assist customer',
        badgeAr: 'متابعة تسعيرة',
        badgeEn: 'Quote Follow-up',
        contentAr: 'أهلاً [الاسم]، نود الاطمئنان بخصوص عرض السعر رقم: [رقم_العرض] المرسل من [المتجر]. هل لديك أي استفسارات بخصوص المواصفات أو المقاسات أو ترغب بتعديل أي صنف؟ فريقنا في خدمتك لمساعدتك في اعتماد أفضل خيار لمطبخك! 📞🌟',
        contentEn: 'Hi [الاسم], following up on quotation #[رقم_العرض] sent by Modern House. Do you have any questions regarding dimensions, specifications, or need any modifications? We are here to assist! 📞🌟',
        tags: ['متابعة', 'عرض_سعر', 'استفسار', 'خدمة']
    },
    {
        id: 'satisfaction_feedback',
        category: 'followup',
        nameAr: 'متابعة رضا العميل وتقييم الخدمة',
        nameEn: 'Customer Feedback & Satisfaction',
        descriptionAr: 'استطلاع رأي العميل حول جودة المنتجات وسرعة الخدمة',
        descriptionEn: 'Inquire about customer satisfaction and feedback',
        badgeAr: 'استبيان رضا',
        badgeEn: 'Feedback',
        contentAr: 'عزيزنا العميل [الاسم]، نود الاطمئنان على رضاك التام عن تجربتك الأخيرة وجودة المنتجات التي استلمتها من [المتجر]. رأيك يهمنا دائماً لتطوير خدماتنا، ويسعدنا مشاركتنا أي ملاحظات أو اقتراحات. طاب يومك! 🤍🌟',
        contentEn: 'Dear [الاسم], we would love to follow up on your recent experience and the quality of items received from Modern House. Your feedback inspires us to constantly improve! Have a wonderful day! 🤍🌟',
        tags: ['رضا', 'تقييم', 'جودة', 'متابعة']
    },
    {
        id: 'we_miss_you_reactivation',
        category: 'followup',
        nameAr: 'إعادة تواصل مع العملاء المنقطعين',
        nameEn: 'Customer Reactivation (We Miss You)',
        descriptionAr: 'رسالة ودية للعميل الذي لم يطلب منذ فترة مع كوبون خاص',
        descriptionEn: 'Warm reactivation message with special incentive',
        badgeAr: 'اشتقنا لك',
        badgeEn: 'We Miss You',
        contentAr: 'أهلاً [الاسم]، اشتقنا لك في [المتجر]! لاحظنا غيابك منذ فترة، ويسرنا دعوتك لتصفح أحدث التشكيلات العصرية التي أضفناها مؤخراً لمطبخك. ونقدم لك قسيمة خصم 10% رمز: MISSU. ننتظر زيارتك! 🌸☕',
        contentEn: 'Hello [الاسم], we miss you at Modern House! It has been a while since your last visit. Explore our new kitchenware arrivals and enjoy 10% off with coupon: MISSU. Looking forward to welcoming you! 🌸☕',
        tags: ['انقطاع', 'تواصل', 'اشتياق', 'عودة']
    },
    {
        id: 'warranty_care_guide',
        category: 'followup',
        nameAr: 'إرشادات العناية والضمان للأواني والأجهزة',
        nameEn: 'Kitchenware Care & Warranty Guide',
        descriptionAr: 'نصائح قيمة للحفاظ على الأواني وأدوات الطهي مع تذكير بخدمات الضمان',
        descriptionEn: 'Helpful care instructions and warranty reassurance',
        badgeAr: 'نصائح وضمان',
        badgeEn: 'Care & Warranty',
        contentAr: 'عزيزنا [الاسم]، حرصاً منا على استدامة أواني ومستلزمات مطبخك المشتراة من [المتجر]، نود تذكيرك باتباع إرشادات الاستخدام المرفقة مع المنتج للحفاظ على جودته، مع العلم أن فريق الصيانة والدعم في خدمتك لأي استفسار. 🛡️🍳',
        contentEn: 'Dear [الاسم], to ensure the longest lifespan of your kitchenware from Modern House, please follow the care instructions included. Our customer support and warranty team is always at your service! 🛡️🍳',
        tags: ['صيانة', 'ضمان', 'نصائح', 'عناية']
    },
    {
        id: 'holiday_greetings',
        category: 'followup',
        nameAr: 'تهنئة بالمناسبات والأعياد',
        nameEn: 'Holiday & Celebration Greetings',
        descriptionAr: 'مشاركة العميل التهاني في الأعياد والمواسم الرسمية',
        descriptionEn: 'Festive holiday greetings for clients and their families',
        badgeAr: 'تهنئة عيد',
        badgeEn: 'Holiday',
        contentAr: 'يسر أسرة [المتجر] أن ترفع لك أطيب التهاني وأصدق التبريكات بمناسبة حلول هذا العيد المبارك. أعاده الله عليك وعلى أسرتك بالخير واليمن والبركات ودوام الصحة والسعادة. كل عام وأنتم بخير! 🌙✨',
        contentEn: 'Modern House wishes you and your family warmest greetings and best wishes on this blessed festive occasion. May it bring health, prosperity, and joy to your home! 🌙✨',
        tags: ['عيد', 'مناسبة', 'تهنئة', 'مبارك']
    },
    {
        id: 'vip_exclusive_invitation',
        category: 'followup',
        nameAr: 'دعوة خاصة وحصرية لعملاء VIP',
        nameEn: 'Exclusive VIP Customer Private Preview',
        descriptionAr: 'دعوة خاصة للعملاء المميزين للاطلاع على المنتجات الجديدة قبل العرض العام',
        descriptionEn: 'Private preview invitation with VIP pricing for loyal customers',
        badgeAr: 'دعوة VIP',
        badgeEn: 'VIP Preview',
        contentAr: 'يسعدنا في [المتجر] أن نخصك [الاسم] بدعوة حصرية للاطلاع على أحدث تشكيلة عالمية من مستلزمات وتجهيزات المطابخ الفاخرة قبل طرحها العام، مع خصم خاص تقديراً لولائك الدائم كعميل مميز لدينا. نتشرف بحضوركم! 👑✨',
        contentEn: 'Dear [الاسم], Modern House is pleased to extend an exclusive VIP invitation to preview our upcoming luxury kitchen collections before general release, with privileged pricing. We look forward to welcoming you! 👑✨',
        tags: ['vip', 'دعوة', 'خاص', 'تميز']
    },
    {
        id: 'customer_birthday_greeting',
        category: 'followup',
        nameAr: 'تهنئة يوم الميلاد مع قسيمة هدية',
        nameEn: 'Birthday Greetings & Gift Voucher',
        descriptionAr: 'مشاركة العميل فرحة ميلاده وتقديم قسيمة خصم ترحيبية',
        descriptionEn: 'Warm birthday wishes with an exclusive celebration voucher',
        badgeAr: 'عيد ميلاد',
        badgeEn: 'Birthday',
        contentAr: 'كل عام وأنت بألف خير وصحة وسعادة [الاسم] 🎂🎈 تسعد أسرة [المتجر] بمشاركتك هذه المناسبة السعيدة وتقديم هدية خاصة: خصم بقيمة 20% بكود: BDAY صالحة للاستخدام خلال شهر ميلادك. نتمنى لك أياماً سعيدة دائماً! 🎁🎉',
        contentEn: 'Happy Birthday [الاسم] 🎂🎈 Modern House celebrates with you and presents a special 20% discount coupon: BDAY valid throughout your birthday month. Have a wonderful year! 🎁🎉',
        tags: ['ميلاد', 'هدية', 'كوبون', 'احتفال']
    },
    {
        id: 'after_installation_check',
        category: 'followup',
        nameAr: 'متابعة ما بعد التركيب والتوريد',
        nameEn: 'Post-Installation Check-in & Quality Assurance',
        descriptionAr: 'الاطمئنان على رضا العميل بعد انتهاء أعمال التركيب في منزله',
        descriptionEn: 'Follow up after installation to ensure flawless operation and satisfaction',
        badgeAr: 'جودة التركيب',
        badgeEn: 'After Install',
        contentAr: 'عزيزنا [الاسم]، نود الاطمئنان بعد إتمام تركيب وتجهيز طلبكم من قبل فريق [المتجر]. هل كل شيء يعمل بالشكل المثالي كما توقعتم؟ رضاكم هدفنا الأول ويسعدنا استقبال أي ملاحظات، وفريقنا دائماً في خدمتكم! 🤍🛠️',
        contentEn: 'Dear [الاسم], following up on the recent installation of your items by Modern House team. Is everything functioning to your highest satisfaction? Our team is always here to assist! 🤍🛠️',
        tags: ['تركيب', 'اطمئنان', 'جودة', 'رضا']
    },

    // ==========================================
    // 4. رسائل عامة وشكر (General & Gratitude)
    // ==========================================
    {
        id: 'general_thank_you',
        category: 'general',
        nameAr: 'شكر وتقدير عام لثقة العميل',
        nameEn: 'General Gratitude & Appreciation',
        descriptionAr: 'رسالة تقدير راقية لامتنان العميل على شراكته وتعامله الدائم',
        descriptionEn: 'Elegant thank-you note appreciating customer loyalty',
        badgeAr: 'شكر وتقدير',
        badgeEn: 'Thank You',
        contentAr: 'أهلاً بك [الاسم]، نشكرك جزيل الشكر على ثقتك بـ [المتجر] وتعاملك معنا. ثقتك هي الدافع الأكبر لتقديم الأفضل دائماً، ونتطلع لخدمتك في زياراتك القادمة! 🌸💫',
        contentEn: 'Hello [الاسم], thank you so much for choosing Modern House. We truly appreciate your trust and patronage, and look forward to serving you again soon! 🌸💫',
        tags: ['شكر', 'تقدير', 'وفاء', 'ثقة']
    },
    {
        id: 'store_location_hours',
        category: 'general',
        nameAr: 'موقع المعرض وساعات العمل وأرقام التواصل',
        nameEn: 'Showroom Location, Hours & Contact Details',
        descriptionAr: 'معلومات تفصيلية لعنوان الفرع وأوقات الدوام وأرقام الهواتف',
        descriptionEn: 'Detailed branch address, opening hours, and direct hotline',
        badgeAr: 'الموقع وساعات العمل',
        badgeEn: 'Location & Hours',
        contentAr: 'أهلاً بك [الاسم] في [المتجر] 📍 فرعنا: سوق واقف - مدينة حمد - مملكة البحرين. نرحب بكم يومياً: الفترة الصباحية (9:00 ص - 1:00 م) والفترة المسائية (4:00 م - 10:00 م). للتواصل والاستفسار: 35965477 / 77905477. نسعد بزيارتكم دائماً! 🏪✨',
        contentEn: 'Welcome [الاسم] to Modern House 📍 Souq Waqif, Hamad Town - Kingdom of Bahrain. Open daily: Morning (9:00 AM - 1:00 PM) & Evening (4:00 PM - 10:00 PM). Hotline: 35965477 / 77905477. Always delighted to welcome you! 🏪✨',
        tags: ['فرع', 'عنوان', 'مواعيد', 'هاتف', 'موقع']
    },
    {
        id: 'payment_methods_benefit',
        category: 'general',
        nameAr: 'بيانات الدفع والتحويل عبر بنفت بي',
        nameEn: 'Payment Options & BenefitPay Details',
        descriptionAr: 'توجيه العميل لطرق السداد الإلكتروني والتحويل السريع عبر BenefitPay',
        descriptionEn: 'Instructions for smooth payment settlements via BenefitPay and cards',
        badgeAr: 'الدفع وبنفت',
        badgeEn: 'Payment Info',
        contentAr: 'مرحباً [الاسم]، لتسهيل عمليات السداد لدى [المتجر]، يمكنكم التحويل عبر BenefitPay مباشرة على الرقم: 35965477، أو الدفع عند الاستلام ببطاقات مدى وفيزا أو نقداً في المعرض. يرجى تزويدنا بصورة الإشعار بعد التحويل. شاكرين تعاونكم! 📱💳',
        contentEn: 'Hello [الاسم], for convenient settlements with Modern House, you may transfer via BenefitPay to: 35965477, or pay upon receipt via cards or cash. Please share the confirmation receipt. Thank you! 📱💳',
        tags: ['بنفت', 'دفع', 'تحويل', 'سداد', 'حساب']
    }
];

export const TEMPLATE_VARIABLES = [
    { tag: '[الاسم]', labelAr: 'اسم العميل', labelEn: 'Customer Name', exampleAr: 'أحمد عبد الله', exampleEn: 'Ahmed Abdullah' },
    { tag: '[المتجر]', labelAr: 'اسم المتجر', labelEn: 'Store Name', exampleAr: 'مودرن هاوس', exampleEn: 'Modern House' },
    { tag: '[كود_الخصم]', labelAr: 'كود الخصم', labelEn: 'Promo Code', exampleAr: 'MH15', exampleEn: 'MH15' },
    { tag: '[رقم_الطلب]', labelAr: 'رقم الطلب / الفاتورة', labelEn: 'Order / Invoice ID', exampleAr: 'ORD-1082', exampleEn: 'ORD-1082' },
    { tag: '[رقم_العرض]', labelAr: 'رقم عرض السعر', labelEn: 'Quotation ID', exampleAr: 'QUO-2024-001', exampleEn: 'QUO-2024-001' },
    { tag: '[المبلغ]', labelAr: 'المبلغ الإجمالي', labelEn: 'Total Amount', exampleAr: '150.000', exampleEn: '150.000' },
    { tag: '[تاريخ_الصلاحية]', labelAr: 'صلاحية العرض', labelEn: 'Valid Until', exampleAr: '30/11/2026', exampleEn: '30/11/2026' },
    { tag: '[الهاتف]', labelAr: 'رقم الهاتف', labelEn: 'Phone Number', exampleAr: '+973 39000000', exampleEn: '+973 39000000' }
];
