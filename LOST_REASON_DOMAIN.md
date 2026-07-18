# Lost Reason & Reopen Reason Domains

## 1. LostReason Model

### Fields
- `id` (String, UUID, Primary Key)
- `code` (String, Unique) - e.g., 'PRICE', 'COMPETITOR'
- `nameEn` (String) - English display name
- `nameFa` (String) - Persian display name
- `description` (String, optional)
- `isActive` (Boolean, default: true)
- `sortOrder` (Int, default: 0)

### Initial Seed Data
1. `PRICE` (Price / قیمت بالا)
2. `COMPETITOR` (Lost to Competitor / پیروزی رقیب)
3. `NO_BUDGET` (No Budget / عدم بودجه کافی)
4. `NO_DECISION` (No Decision / عدم تصمیم‌گیری)
5. `DELIVERY_TIME` (Delivery Time / زمان تحویل طولانی)
6. `PRODUCT_AVAILABILITY` (Product Availability / عدم موجودی کالا)
7. `PAYMENT_TERMS` (Payment Terms / شرایط پرداخت نامناسب)
8. `CUSTOMER_CANCELLED` (Customer Cancelled / انصراف مشتری)
9. `NO_RESPONSE` (No Response / عدم پاسخگویی)
10. `OTHER` (Other / سایر موارد)

---

## 2. ReopenReason Model

### Fields
- `id` (String, UUID, Primary Key)
- `code` (String, Unique)
- `nameEn` (String)
- `nameFa` (String)
- `description` (String, optional)
- `isActive` (Boolean, default: true)
- `sortOrder` (Int, default: 0)

### Initial Seed Data
1. `CUSTOMER_RETURNED` (Customer Returned / بازگشت مشتری)
2. `PRICE_CHANGED` (Price Changed / تغییر در قیمت‌ها)
3. `NEW_REQUIREMENT` (New Requirement / نیازمندی جدید مشتری)
4. `NEW_BUDGET` (New Budget / تامین بودجه جدید)
5. `MANAGEMENT_REQUEST` (Management Request / درخواست مدیریت)
6. `FOLLOW_UP` (Follow Up / پیگیری موفق)
7. `OTHER` (Other / سایر موارد)
