import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const methods = [
    { code: 'InPerson', nameEn: 'In Person', nameFa: 'حضوری', sortOrder: 1, isSystem: true },
    { code: 'Phone', nameEn: 'Phone', nameFa: 'تلفنی', sortOrder: 2, isSystem: true },
    { code: 'Online', nameEn: 'Online', nameFa: 'آنلاین', sortOrder: 3, isSystem: true },
    { code: 'SampleSent', nameEn: 'Sample Sent', nameFa: 'ارسال نمونه', sortOrder: 4, isSystem: true },
  ];

  for (const m of methods) {
    await prisma.presentationMethod.upsert({
      where: { code: m.code },
      update: {},
      create: m,
    });
  }

  const reactions = [
    { code: 'Positive', nameEn: 'Positive', nameFa: 'مثبت (علاقه‌مند)', sortOrder: 1, isSystem: true },
    { code: 'Cautious', nameEn: 'Cautious', nameFa: 'محتاط (نیاز به پیگیری)', sortOrder: 2, isSystem: true },
    { code: 'Negative', nameEn: 'Negative', nameFa: 'منفی (عدم تمایل)', sortOrder: 3, isSystem: true },
  ];

  for (const r of reactions) {
    await prisma.customerReaction.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }

  console.log('Seed completed successfully.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
