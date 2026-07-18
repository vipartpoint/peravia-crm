# نقشه راه سیستم CRM - فاز اجرایی

این سند بر اساس آخرین توافقات و اصلاحات، به‌روزرسانی شده و مبنای شروع برنامه‌نویسی است.

## 1. تصمیمات تکنولوژی نهایی
- **Frontend**: Next.js, TypeScript, TailwindCSS, RTL Support, PWA-ready.
- **Backend**: NestJS, TypeScript, Modular Monolith, REST API.
- **ORM**: Prisma (انتخاب به دلیل Type-Safety قوی، مدیریت راحت‌تر اسکیما در دیتابیس‌های پیچیده و مایگریشن پایدارتر نسبت به TypeORM).
- **Database**: PostgreSQL
- **Cache/Queue**: Redis, BullMQ (جهت Jobها و ارتباط با AI).
- **Storage**: MinIO (فضای ذخیره‌سازی خصوصی).
- **AI Service**: Python FastAPI (درحال حاضر ساختار پایه).
- **Deployment**: Docker Compose.

## 2. ساختار دیتامدل (موارد اصلاح‌شده)
- **Soft Delete**: برای `Customers`, `Leads`, `Orders`, `Cheques`, `Payments`, `Contracts`, `Documents`, `Visits`, `Tasks` پیاده‌سازی می‌شود (`deleted_at`, `deleted_by`, `delete_reason`).
- **Customers**: افزوده شدن `brand_scope`, `customer_type`, `loyalty_tier`, `churn_status`, `assigned_user_id`, `created_by`, `status`, `source`.
- **Orders**: افزوده شدن فیلدهای جامع مالی و سودآوری (`discount_amount`, `net_amount`, `estimated_profit`, `real_profit`, `collected_amount`, `uncollected_amount`, ...).
- **AI_Insights**: `insight_type`, `entity_id`, `score`, `priority`, `recommended_action`, `input_snapshot_hash`, `status`, `reviewed_by` ...

## 3. امنیت و رمزنگاری نهایی
- **رمزنگاری می‌شود**: موبایل، کدملی، شماره حساب/شبا بانکی (در سطح اپلیکیشن و غیرقابل جستجو مستقیم بدون کلید).
- **رمزنگاری نمی‌شود (ذخیره عددی)**: مبلغ چک، مبالغ سفارش، قیمت‌ها، سقف اعتبار (جهت محاسبات و گزارش‌گیری).
- **محرمانگی**: دسترسی به فیلدهای مالی به شدت محدود به نقش کاربر است.

## 4. مستندسازی Audit Logs
ثبت اجباری لاگ برای عملکردهای حیاتی: احراز هویت (Login/Logout/Failed/MFA)، عملیات مشتریان (Create/Update/Archive)، تغییر کارشناس و سقف اعتبار، خواندن داده‌های رمزنگاری شده و اسناد، تغییرات مالی و چک، خروجی‌گرفتن، و تصمیمات مربوط به هوش مصنوعی.

## 5. محدودیت خروجی (Export)
- **کارشناس فروش**: دسترسی Export ندارد.
- **مدیر منطقه**: فقط گزارش خلاصه (بدون موبایل/دیتای حساس).
- **مدیر فروش**: محدود و لاگ‌شده.
- **مدیرعامل و مالی**: دسترسی کامل + ثبت لاگ + نیاز احتمالی به تایید MFA.

## 6. فاز اجرای MVP (درحال انجام)
مرحله کدنویسی اکنون شامل: راه‌اندازی زیرساخت Docker، بک‌اند NestJS، 프론트اند Next.js، ساختار Prisma، ماژول Auth، مدیریت کاربران و نقش‌ها، Audit Log و ماژول پایه Customers می‌باشد.

## License Management
- **Migrate to Asymmetric Licensing**: Transition from the current JWT-based license manager to an asymmetric signed license model (RSA or Ed25519) to ensure higher security cryptographically without shared secrets.
