export interface TourStep {
  target: string;
  title: string;
  description: string;
  importance: string;
  responsibility: string;
  proTip: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export type RoleTours = Record<string, TourStep[]>;

// Base Tours that apply to all if a specific role doesn't override
const BASE_TOURS: RoleTours = {
  dashboard: [
    {
      target: 'tour-dashboard',
      title: 'داشبورد عملیاتی',
      description: 'اینجا نمای کلی از وضعیت عملیاتی کسب‌وکار شماست.',
      importance: 'داشبورد به شما کمک می‌کند مسائل مهم را در لحظه تشخیص دهید.',
      responsibility: 'هر روز کاری خود را با بررسی این داشبورد شروع کنید.',
      proTip: 'شخصی‌سازی داشبورد برای نمایش اطلاعات مهم، کارایی شما را بالا می‌برد.',
      position: 'bottom'
    }
  ],
  customers: [
    {
      target: 'tour-customers-list',
      title: 'پایگاه داده مشتریان',
      description: 'دسترسی سریع به سوابق تمامی مشتریان.',
      importance: 'حفظ ارتباط پایدار با مشتری نیازمند دسترسی به سوابق گذشته است.',
      responsibility: 'اطلاعات مشتریان را به‌روز نگه دارید.',
      proTip: 'ثبت جزئیات تعاملات، وفاداری مشتری را افزایش می‌دهد.',
      position: 'bottom'
    }
  ]
};

export const TOURS_DATA: Record<string, RoleTours> = {
  SystemAdmin: {
    dashboard: [
      {
        target: 'tour-dashboard',
        title: 'پنل ادمین',
        description: 'نمای کلی از وضعیت سیستم و کاربران.',
        importance: 'مدیریت صحیح دسترسی‌ها امنیت سیستم را تضمین می‌کند.',
        responsibility: 'مانیتور کردن ورودهای ناموفق و مدیریت کاربران.',
        proTip: 'از گزارش‌های لاگ برای ردیابی تغییرات مهم استفاده کنید.',
        position: 'bottom'
      }
    ],
    customers: BASE_TOURS.customers,
  },
  CEO: {
    dashboard: [
      {
        target: 'tour-dashboard',
        title: 'داشبورد مدیریت ارشد',
        description: 'دیدگاه کلان از شاخص‌های کلیدی عملکرد (KPIs).',
        importance: 'تصمیم‌گیری استراتژیک نیازمند داده‌های دقیق و لحظه‌ای است.',
        responsibility: 'رصد روند فروش، نرخ تبدیل و وضعیت کلی شرکت.',
        proTip: 'به هشدارهای "کالای رو به اتمام" و "ریسک ریزش مشتری" بیشترین توجه را داشته باشید.',
        position: 'bottom'
      }
    ]
  },
  SalesManager: {
    dashboard: [
      {
        target: 'tour-dashboard',
        title: 'داشبورد مدیریت فروش',
        description: 'مانیتورینگ عملکرد تیم فروش و قیف سرنخ‌ها.',
        importance: 'تشخیص گلوگاه‌های فروش (مثل توقف در مرحله مذاکره) حیاتی است.',
        responsibility: 'بررسی تارگت‌های فروشنده و راهبری تیم برای رسیدن به اهداف.',
        proTip: 'نرخ تبدیل (Conversion Rate) هر فروشنده را به صورت هفتگی پایش کنید.',
        position: 'bottom'
      }
    ],
    leads: [
      {
        target: 'tour-leads-list',
        title: 'نظارت بر سرنخ‌ها',
        description: 'بررسی نحوه پیگیری سرنخ‌ها توسط کارشناسان.',
        importance: 'سرنخ‌های رها شده مستقیماً باعث هدر رفت بودجه مارکتینگ می‌شوند.',
        responsibility: 'تخصیص عادلانه سرنخ‌ها و پیگیری دلیل Lost شدن آنها.',
        proTip: 'سرنخ‌های بدون فعالیت بیش از ۳ روز را فوراً بررسی کنید.',
        position: 'bottom'
      }
    ]
  },
  SalesRep: {
    dashboard: [
      {
        target: 'tour-dashboard',
        title: 'داشبورد کارشناس فروش',
        description: 'پیگیری تسک‌های روزانه و تارگت فروش شما.',
        importance: 'سرعت در پیگیری، عامل اصلی موفقیت در فروش B2B است.',
        responsibility: 'بررسی وظایف امروز و ثبت پیگیری‌های انجام شده.',
        proTip: 'روز خود را با پیگیری مشتریانی که قرار قبلی دارند شروع کنید.',
        position: 'bottom'
      }
    ],
    leads: [
      {
        target: 'tour-leads-list',
        title: 'ثبت و پیگیری سرنخ',
        description: 'مدیریت مذاکرات و فرصت‌های فروش شخصی شما.',
        importance: 'هر سرنخ یک فرصت طلایی است که نباید فراموش شود.',
        responsibility: 'تغییر مرحله سرنخ پس از هر تماس و ثبت نتیجه مذاکره.',
        proTip: 'همیشه یک Task (وظیفه پیگیری بعدی) برای هر سرنخ باز تعیین کنید.',
        position: 'bottom'
      }
    ]
  },
  Finance: {
    dashboard: [
      {
        target: 'tour-dashboard',
        title: 'داشبورد مالی',
        description: 'نظارت بر مطالبات، فاکتورهای سررسید شده و چک‌ها.',
        importance: 'جریان نقدینگی (Cash Flow) قلب تپنده کسب‌وکار است.',
        responsibility: 'پایش پرداخت‌های تأخیری و تأیید پیش‌فاکتورها.',
        proTip: 'هشدارهای وصول مطالبات را به صورت روزانه از طریق هوش مصنوعی پایش کنید.',
        position: 'bottom'
      }
    ],
    orders: [
      {
        target: 'tour-orders-list',
        title: 'بررسی مالی سفارشات',
        description: 'تأییدیه مالی قبل از ارسال کالا به انبار.',
        importance: 'ارسال کالا بدون تأیید وضعیت حساب مشتری، ریسک مالی دارد.',
        responsibility: 'چک کردن سقف اعتبار مشتری پیش از تأیید فاکتور فروش.',
        proTip: 'مشتریان خوش‌حساب را در سیستم نشانه‌گذاری کنید تا تأییدیه‌ها سریع‌تر انجام شود.',
        position: 'bottom'
      }
    ]
  },
  WarehouseManager: {
    dashboard: [
      {
        target: 'tour-dashboard',
        title: 'داشبورد انبار',
        description: 'نمای وضعیت ارسال‌ها و هشدارهای کمبود کالا.',
        importance: 'تأمین به‌موقع کالا ضامن اعتبار برند است.',
        responsibility: 'بررسی کالاهای رو به اتمام و سفارشات در انتظار بسته‌بندی.',
        proTip: 'هشدارهای "حداقل موجودی" را قبل از پایان ماه بررسی کنید.',
        position: 'bottom'
      }
    ],
    inventory: [
      {
        target: 'tour-inventory-list',
        title: 'مدیریت موجودی کالا',
        description: 'مرکز کنترل و پایش وضعیت فیزیکی محصولات در انبار.',
        importance: 'فروش کالایی که در انبار موجود نیست، اعتبار شرکت را به شدت مخدوش می‌کند.',
        responsibility: 'به‌طور مداوم هشدارهای کمبود موجودی را مانیتور کرده و از اتمام موجودی کالاهای پرفروش جلوگیری کنید.',
        proTip: 'مبنای فروش خود را همیشه روی "موجودی قابل فروش" بگذارید، نه کل موجودی فیزیکی.',
        position: 'bottom'
      }
    ]
  }
};

export const getToursForRole = (role: string): RoleTours => {
  return TOURS_DATA[role] || TOURS_DATA['SystemAdmin'];
};
