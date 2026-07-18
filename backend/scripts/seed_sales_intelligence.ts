import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Lost Reasons...');
  const lostReasons = [
    { code: 'PRICE', nameEn: 'Price', nameFa: 'قیمت بالا', isSystem: true, sortOrder: 1 },
    { code: 'COMPETITOR', nameEn: 'Lost to Competitor', nameFa: 'پیروزی رقیب', isSystem: true, sortOrder: 2 },
    { code: 'NO_BUDGET', nameEn: 'No Budget', nameFa: 'عدم بودجه کافی', isSystem: true, sortOrder: 3 },
    { code: 'NO_DECISION', nameEn: 'No Decision', nameFa: 'عدم تصمیم‌گیری', isSystem: true, sortOrder: 4 },
    { code: 'DELIVERY_TIME', nameEn: 'Delivery Time', nameFa: 'زمان تحویل طولانی', isSystem: true, sortOrder: 5 },
    { code: 'PRODUCT_AVAILABILITY', nameEn: 'Product Availability', nameFa: 'عدم موجودی کالا', isSystem: true, sortOrder: 6 },
    { code: 'PAYMENT_TERMS', nameEn: 'Payment Terms', nameFa: 'شرایط پرداخت نامناسب', isSystem: true, sortOrder: 7 },
    { code: 'CUSTOMER_CANCELLED', nameEn: 'Customer Cancelled', nameFa: 'انصراف مشتری', isSystem: true, sortOrder: 8 },
    { code: 'NO_RESPONSE', nameEn: 'No Response', nameFa: 'عدم پاسخگویی', isSystem: true, sortOrder: 9 },
    { code: 'OTHER', nameEn: 'Other', nameFa: 'سایر موارد', isSystem: true, sortOrder: 99 },
  ];

  for (const lr of lostReasons) {
    await prisma.lostReason.upsert({
      where: { code: lr.code },
      update: {},
      create: lr,
    });
  }

  console.log('Seeding Reopen Reasons...');
  const reopenReasons = [
    { code: 'CUSTOMER_RETURNED', nameEn: 'Customer Returned', nameFa: 'بازگشت مشتری', isSystem: true, sortOrder: 1 },
    { code: 'PRICE_CHANGED', nameEn: 'Price Changed', nameFa: 'تغییر در قیمت‌ها', isSystem: true, sortOrder: 2 },
    { code: 'NEW_REQUIREMENT', nameEn: 'New Requirement', nameFa: 'نیازمندی جدید مشتری', isSystem: true, sortOrder: 3 },
    { code: 'NEW_BUDGET', nameEn: 'New Budget', nameFa: 'تامین بودجه جدید', isSystem: true, sortOrder: 4 },
    { code: 'MANAGEMENT_REQUEST', nameEn: 'Management Request', nameFa: 'درخواست مدیریت', isSystem: true, sortOrder: 5 },
    { code: 'FOLLOW_UP', nameEn: 'Follow Up', nameFa: 'پیگیری موفق', isSystem: true, sortOrder: 6 },
    { code: 'OTHER', nameEn: 'Other', nameFa: 'سایر موارد', isSystem: true, sortOrder: 99 },
  ];

  for (const rr of reopenReasons) {
    await prisma.reopenReason.upsert({
      where: { code: rr.code },
      update: {},
      create: rr,
    });
  }

  console.log('Seeding Initial Competitors (Optional)...');
  // Just seed one basic competitor to ensure the table works
  await prisma.competitor.upsert({
    where: { name: 'Unknown Competitor' },
    update: {},
    create: {
      name: 'Unknown Competitor',
      notes: 'Fallback for migrated records missing explicit competitor details',
    },
  });

  console.log('Sales Intelligence Seeding Complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
