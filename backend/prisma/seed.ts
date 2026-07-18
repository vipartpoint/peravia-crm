import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting DB seed...');

  // 1. Setup Roles
  const rolesData = [
    'SystemAdmin',
    'CEO',
    'SalesManager',
    'RegionalManager',
    'SalesRep',
    'Finance',
    'SupportOperator',
    'WarehouseManager'
  ];

  const roles: Record<string, any> = {};
  for (const roleName of rolesData) {
    roles[roleName] = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  // 2. Setup System Admin User
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      passwordHash,
      roleId: roles['SystemAdmin'].id,
      isActive: true,
      mfaEnabled: false,
    },
  });

  console.log(`Seed completed successfully. Admin created with username: ${admin.username}`);

  // 3. Setup Territories
  console.log('Seeding Territories...');
  const iran = await prisma.territory.upsert({
    where: { code: 'IR' },
    update: {},
    create: { name: 'ایران', code: 'IR', type: 'Country', createdBy: admin.id }
  });

  const tehranProv = await prisma.territory.upsert({
    where: { code: 'THR' },
    update: {},
    create: { name: 'تهران', code: 'THR', type: 'Province', parentId: iran.id, createdBy: admin.id }
  });

  const tehranNorth = await prisma.territory.upsert({
    where: { code: 'THR-N' },
    update: {},
    create: { name: 'تهران شمال', code: 'THR-N', type: 'SalesRegion', parentId: tehranProv.id, createdBy: admin.id }
  });

  await prisma.territory.upsert({
    where: { code: 'THR-N-1' },
    update: {},
    create: { name: 'مسیر ویزیت ۱ تهران شمال', code: 'THR-N-1', type: 'VisitRoute', parentId: tehranNorth.id, createdBy: admin.id }
  });

  const fars = await prisma.territory.upsert({
    where: { code: 'FRS' },
    update: {},
    create: { name: 'فارس', code: 'FRS', type: 'Province', parentId: iran.id, createdBy: admin.id }
  });

  const shiraz = await prisma.territory.upsert({
    where: { code: 'SHZ' },
    update: {},
    create: { name: 'شیراز', code: 'SHZ', type: 'City', parentId: fars.id, createdBy: admin.id }
  });

  await prisma.territory.upsert({
    where: { code: 'SHZ-C' },
    update: {},
    create: { name: 'شیراز مرکز', code: 'SHZ-C', type: 'SalesRegion', parentId: shiraz.id, createdBy: admin.id }
  });

  console.log('Territories seeded.');

  // 4. Setup Products
  console.log('Seeding Products...');
  
  const products = [
    { sku: 'PR-U-5W30', name: 'Pravia Ultra 5W-30', brand: 'Pravia', category: 'Passenger Car Motor Oil', viscosityGrade: '5W-30', apiStandard: 'SN/CF', volume: '4L', basePrice: 850000, estimatedCost: 650000 },
    { sku: 'PR-D-15W40', name: 'Pravia Diesel 15W-40', brand: 'Pravia', category: 'Heavy Duty Diesel', viscosityGrade: '15W-40', apiStandard: 'CI-4', volume: '20L', basePrice: 3200000, estimatedCost: 2600000 },
    { sku: 'GE-S-10W40', name: 'Gertex Super 10W-40', brand: 'Gertex', category: 'Passenger Car Motor Oil', viscosityGrade: '10W-40', apiStandard: 'SM', volume: '4L', basePrice: 650000, estimatedCost: 500000 },
    { sku: 'GE-I-68', name: 'Gertex Industrial 68', brand: 'Gertex', category: 'Industrial Oil', viscosityGrade: 'ISO VG 68', apiStandard: 'HLP', volume: '208L', basePrice: 18000000, estimatedCost: 14000000 }
  ];

  const productsList = [];
  for (const p of products) {
    const margin = ((p.basePrice - p.estimatedCost) / p.basePrice) * 100;
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        ...p,
        estimatedProfitMargin: margin,
        createdBy: admin.id
      }
    });
    productsList.push(prod);
  }

  console.log('Products seeded.');

  // 5. Setup a Customer
  console.log('Seeding Customers...');
  const customer = await prisma.customer.create({
    data: {
      name: 'فروشگاه روغن موتور امیری (تست)',
      customerType: 'Retail',
      brandScope: 'Gertex',
      loyaltyTier: 'Gold',
      phone: '09120000000',
      territoryId: tehranProv.id,
      createdBy: admin.id,
      assignedUserId: admin.id
    }
  });

  const inactiveCustomer = await prisma.customer.create({
    data: {
      name: 'اتوسرویس قدیمی (غیرفعال)',
      customerType: 'Retail',
      brandScope: 'Pravia',
      loyaltyTier: 'None',
      phone: '09129999999',
      territoryId: shiraz.id,
      createdBy: admin.id,
      assignedUserId: admin.id
    }
  });

  console.log('Customers seeded.');

  // 6. Setup Orders
  console.log('Seeding Orders...');
  
  const productU5W30 = productsList.find(p => p.sku === 'PR-U-5W30');

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  await prisma.order.upsert({
    where: { orderNumber: 'ORD-260501-0001' },
    update: {},
    create: {
      orderNumber: 'ORD-260501-0001',
      customerId: inactiveCustomer.id,
      userId: admin.id,
      territoryId: shiraz.id,
      brand: 'Pravia',
      status: 'Delivered',
      totalAmount: 5000000,
      netAmount: 5000000,
      estimatedProfit: 1000000,
      uncollectedAmount: 0,
      createdBy: admin.id,
      createdAt: lastMonth,
      items: {
        create: [
          {
            productId: productU5W30!.id,
            quantity: 5,
            unitPrice: 1000000,
            finalUnitPrice: 1000000,
            totalPrice: 5000000,
            estimatedCost: 800000,
            estimatedProfit: 1000000
          }
        ]
      }
    }
  });
  
  await prisma.order.upsert({
    where: { orderNumber: 'ORD-260609-0001' },
    update: {},
    create: {
      orderNumber: 'ORD-260609-0001',
      customerId: customer.id,
      userId: admin.id,
      territoryId: tehranProv.id,
      brand: 'Pravia',
      status: 'Draft',
      totalAmount: 8500000,
      netAmount: 8500000,
      estimatedProfit: 2000000,
      uncollectedAmount: 8500000,
      createdBy: admin.id,
      items: {
        create: [
          {
            productId: productU5W30!.id,
            quantity: 10,
            unitPrice: 850000,
            finalUnitPrice: 850000,
            totalPrice: 8500000,
            estimatedCost: 650000,
            estimatedProfit: 2000000
          }
        ]
      }
    }
  });

  await prisma.order.upsert({
    where: { orderNumber: 'ORD-260609-0002' },
    update: {},
    create: {
      orderNumber: 'ORD-260609-0002',
      customerId: customer.id,
      userId: admin.id,
      territoryId: tehranProv.id,
      brand: 'Pravia',
      status: 'Approved',
      totalAmount: 17000000,
      discountAmount: 850000,
      netAmount: 16150000,
      estimatedProfit: 3150000,
      uncollectedAmount: 16150000,
      createdBy: admin.id,
      approvedBy: admin.id,
      items: {
        create: [
          {
            productId: productU5W30!.id,
            quantity: 20,
            unitPrice: 850000,
            discountPercent: 5,
            finalUnitPrice: 807500,
            totalPrice: 16150000,
            estimatedCost: 650000,
            estimatedProfit: 3150000
          }
        ]
      }
    }
  });

  console.log('Orders seeded.');

  // 7. Setup Sales Funnel Stages
  console.log('Seeding Sales Funnel Stages...');
  const stages = [
    { name: 'Lead', order: 1 },
    { name: 'Initial Contact', order: 2 },
    { name: 'Need Analysis', order: 3 },
    { name: 'Presentation', order: 4 },
    { name: 'Price Negotiation', order: 5 },
    { name: 'Proforma', order: 6 },
    { name: 'Won / Order', order: 7 },
    { name: 'Lost', order: 8 }
  ];

  for (const s of stages) {
    await prisma.salesFunnelStage.upsert({
      where: { name: s.name },
      update: {},
      create: s
    });
  }
  const leadStage = await prisma.salesFunnelStage.findUnique({ where: { name: 'Lead' } });
  const contactStage = await prisma.salesFunnelStage.findUnique({ where: { name: 'Initial Contact' } });

  // 8. Setup Leads and Presentations
  console.log('Seeding Leads and Presentations...');
  
  const crypto = require('crypto');
  const algorithm = 'aes-256-cbc';
  const keyStr = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
  const encryptPhone = (text: string) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(keyStr), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  };

  const lead1 = await prisma.lead.create({
    data: {
      name: 'تعویض روغنی برادران - جدید ' + Math.floor(Math.random()*1000),
      phone: encryptPhone('09121112233'),
      source: 'Manual',
      brandInterest: 'Pravia',
      territoryId: tehranProv.id,
      assignedTo: admin.id,
      status: 'New',
      currentStageId: leadStage!.id,
      createdBy: admin.id
    }
  });

  await prisma.leadStageHistory.create({
    data: {
      leadId: lead1.id,
      stageId: leadStage!.id,
      changedBy: admin.id
    }
  });

  const lead2 = await prisma.lead.create({
    data: {
      name: 'نمایندگی سایپا کاشانی - جدید ' + Math.floor(Math.random()*1000),
      phone: encryptPhone('09124445566'),
      source: 'Exhibition',
      brandInterest: 'Both',
      territoryId: shiraz.id,
      assignedTo: admin.id,
      status: 'Contacted',
      currentStageId: contactStage!.id,
      createdBy: admin.id
    }
  });

  await prisma.leadStageHistory.create({
    data: {
      leadId: lead2.id,
      stageId: contactStage!.id,
      changedBy: admin.id
    }
  });

  await prisma.presentation.create({
    data: {
      leadId: lead2.id,
      userId: admin.id,
      productId: productU5W30!.id,
      presentationType: 'InPerson',
      durationMinutes: 45,
      customerReaction: 'Positive',
      rejectionReasons: [],
      notes: 'مشتری بسیار راغب بود، نمونه تست برایشان ارسال شود.',
      nextFollowUpAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  // 9. Setup Visits and Tasks
  console.log('Seeding Visits and Tasks...');
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);

  await prisma.visit.create({
    data: { customerId: customer.id, userId: admin.id, territoryId: tehranProv.id, visitType: 'Planned', status: 'Planned', scheduledAt: today, notes: 'ویزیت دوره‌ای' }
  });

  await prisma.task.create({
    data: { title: 'تماس برای تأیید پیش‌فاکتور', relatedType: 'Customer', relatedId: customer.id, assignedTo: admin.id, createdBy: admin.id, dueAt: yesterday, priority: 'High', status: 'Open' }
  });

  // 10. Financials
  console.log('Seeding Financials...');
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 5);
  
  await prisma.cheque.create({
    data: { customerId: inactiveCustomer.id, chequeNumber: 'ENC:1111222233334444', bankName: 'بانک ملت', amount: 150000000, dueDate: nextWeek, status: 'NearDue', createdBy: admin.id }
  });

  await prisma.payment.create({
    data: { customerId: customer.id, amount: 5000000, method: 'BankTransfer', status: 'Confirmed', referenceNumber: 'ENC:REF-001', confirmedBy: admin.id, createdBy: admin.id }
  });

  // 11. KPI Targets
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  await prisma.kPITarget.create({
    data: { userId: admin.id, territoryId: tehranProv.id, periodType: 'Monthly', periodStart: startOfMonth, periodEnd: endOfMonth, targetSalesAmount: 100000000, targetCollectedAmount: 80000000, targetOrdersCount: 10, targetVisitsCount: 20, targetNewCustomers: 5, targetLeadConversions: 2, createdBy: admin.id }
  });
  console.log('KPI Targets seeded.');

  // 12. Warehouses & Inventory
  let mainWarehouse = await prisma.warehouse.findUnique({ where: { code: 'WH-MAIN' } });
  if (!mainWarehouse) {
    mainWarehouse = await prisma.warehouse.create({
      data: { name: 'انبار مرکزی تهران', code: 'WH-MAIN', location: 'تهران، جاده مخصوص کرج', createdBy: admin.id }
    });
    
    await prisma.warehouse.create({
      data: { name: 'انبار توزیع شیراز', code: 'WH-SHZ', location: 'شیراز، شهرک صنعتی', createdBy: admin.id }
    });

    for (const p of productsList) {
      const initialQty = 1000;
      await prisma.inventoryStock.create({
        data: { warehouseId: mainWarehouse.id, productId: p.id, quantityOnHand: initialQty, availableQuantity: initialQty, minStockLevel: 50 }
      });
      await prisma.stockMovement.create({
        data: { warehouseId: mainWarehouse.id, productId: p.id, movementType: 'Inbound', quantity: initialQty, relatedType: 'Manual', notes: 'موجودی اولیه سیستم (Seed)', createdBy: admin.id }
      });
    }
    console.log('Warehouses and Inventory seeded.');
  }

  // 13. Security & Permissions
  console.log('Seeding Security & Permissions...');
  const categories = ['Users', 'Roles', 'Customers', 'Contacts', 'Orders', 'Payments', 'Products', 'PriceLists', 'Territories', 'Leads', 'Presentations', 'Visits', 'Tasks', 'Cheques', 'Receivables', 'KPIs', 'Commissions', 'Reports', 'FinancialReports', 'Warehouses', 'Inventory', 'Security'];
  const actions = ['View', 'Create', 'Edit', 'Delete', 'Export', 'RevealSensitiveData', 'Manage', 'Adjust', 'ViewMovements', 'ViewAuditLogs'];

  const createdPermissions = [];
  for (const cat of categories) {
    for (const act of actions) {
      if ((cat === 'Security' && !['ManageSessions', 'ViewAuditLogs'].includes(act)) || (cat === 'Users' && act !== 'Manage') || (['Export', 'RevealSensitiveData'].includes(act) && !['Customers', 'Leads', 'Cheques', 'Reports', 'FinancialReports', 'Payments', 'Receivables'].includes(cat))) {
        continue; // skip illogical combos for speed
      }
      const perm = await prisma.permission.upsert({
        where: { category_action: { category: cat, action: act } },
        update: {},
        create: { category: cat, action: act }
      });
      createdPermissions.push(perm);
    }
  }

  // Assign to Admin Role
  const adminRole = await prisma.role.findUnique({ where: { name: 'SystemAdmin' } });
  if (adminRole) {
    for (const perm of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: perm.id }
      });
    }
  }

  // Create Active Session
  await prisma.activeSession.upsert({
    where: { jti: 'mock-jwt-id-12345' },
    update: {},
    create: {
      jti: 'mock-jwt-id-12345',
      userId: admin.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 Chrome MVP',
      device: 'Desktop',
      isValid: true
    }
  });

  // Create Approval Request
  await prisma.approvalRequest.create({
    data: {
      entityType: 'Discount',
      entityId: 'ORD-MOCK',
      requestedBy: (await prisma.user.findFirst({where: {role: {name: 'SalesRep'}}}))?.id || admin.id,
      assignedApprover: admin.id,
      currentLevel: 1,
      requiredLevels: 1,
      status: 'Pending',
      reason: 'Requesting 15% discount for a high value order.'
    }
  });

  console.log('Security seeded.');

  // 14. Notifications & Automation Seeds
  console.log('Seeding Notifications...');

  await prisma.notificationPreference.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id }
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        title: 'هشدار چک برگشتی',
        message: 'چک مشتری (اتوسرویس قدیمی) به مبلغ ۳۰۰,۰۰۰,۰۰۰ ریال برگشت خورد.',
        type: 'Alert',
        priority: 'Critical',
        entityType: 'Cheque',
        actionUrl: '/cheques'
      },
      {
        userId: admin.id,
        title: 'اتمام موجودی کالا',
        message: 'موجودی کالای Pravia Ultra 5W-30 در انبار مرکزی به زیر حد مجاز رسید.',
        type: 'System',
        priority: 'Warning',
        entityType: 'Inventory',
        actionUrl: '/inventory/alerts'
      },
      {
        userId: admin.id,
        title: 'تسک عقب‌افتاده',
        message: 'تسک "تماس برای تأیید پیش‌فاکتور" از موعد خود گذشته است.',
        type: 'Reminder',
        priority: 'Warning',
        entityType: 'Task',
        actionUrl: '/tasks'
      },
      {
        userId: admin.id,
        title: 'ریزش مشتری احتمالی',
        message: 'مشتری "فروشگاه روغن موتور امیری" بر اساس مدل هوش مصنوعی در معرض خطر ریزش قرار دارد.',
        type: 'Alert',
        priority: 'Critical',
        entityType: 'Customer',
        actionUrl: '/customers'
      }
    ]
  });

  console.log('Notifications seeded.');

  const templates = [
    { code: 'ORDER_CREATED', name: 'ثبت سفارش جدید', channel: 'SMS', category: 'Order', content: 'مشتری گرامی، سفارش شما با شماره {orderNumber} با موفقیت ثبت شد.', variables: ['orderNumber'] },
    { code: 'PAYMENT_CONFIRMED', name: 'تایید پرداخت', channel: 'SMS', category: 'Finance', content: 'مشتری گرامی، پرداخت شما به مبلغ {amount} ریال برای فاکتور {orderNumber} تایید شد.', variables: ['amount', 'orderNumber'] },
    { code: 'ORDER_APPROVED', name: 'تایید سفارش', channel: 'SMS', category: 'Order', content: 'سفارش شما با شماره {orderNumber} تایید شد و در صف پردازش قرار گرفت.', variables: ['orderNumber'] },
    { code: 'READY_TO_SHIP', name: 'آماده ارسال', channel: 'SMS', category: 'Order', content: 'سفارش {orderNumber} آماده ارسال می‌باشد.', variables: ['orderNumber'] },
    { code: 'ORDER_SHIPPED', name: 'ارسال سفارش', channel: 'SMS', category: 'Order', content: 'سفارش {orderNumber} شما از طریق {carrier} ارسال شد.', variables: ['orderNumber', 'carrier'] },
    { code: 'ORDER_DELIVERED', name: 'تحویل سفارش', channel: 'SMS', category: 'Order', content: 'سفارش {orderNumber} به شما تحویل داده شد. از خرید شما متشکریم.', variables: ['orderNumber'] },
    { code: 'CHEQUE_DUE', name: 'یادآوری سررسید چک', channel: 'SMS', category: 'Finance', content: 'مشتری گرامی، چک شما به شماره {chequeNumber} در تاریخ {dueDate} سررسید می‌شود.', variables: ['chequeNumber', 'dueDate'] },
    { code: 'CHEQUE_BOUNCED', name: 'برگشت چک', channel: 'SMS', category: 'Finance', content: 'مشتری گرامی، چک شما به شماره {chequeNumber} برگشت خورده است. لطفا در اسرع وقت پیگیری نمایید.', variables: ['chequeNumber'] },
    { code: 'CREDIT_LIMIT_EXCEEDED', name: 'اتمام سقف اعتبار', channel: 'SMS', category: 'Finance', content: 'سقف اعتبار شما ({creditLimit}) به پایان رسیده است. جهت ثبت سفارش جدید اعتبار خود را افزایش دهید.', variables: ['creditLimit'] },
    { code: 'APPROVAL_REQUIRED', name: 'درخواست تاییدیه', channel: 'SMS', category: 'Approval', content: 'همکار گرامی، درخواست تایید جدیدی در سیستم برای شما ثبت شده است.', variables: [] },
    { code: 'APPROVAL_APPROVED', name: 'تایید درخواست', channel: 'SMS', category: 'Approval', content: 'درخواست شما مربوط به {entityType} تایید شد.', variables: ['entityType'] },
    { code: 'APPROVAL_REJECTED', name: 'رد درخواست', channel: 'SMS', category: 'Approval', content: 'درخواست شما مربوط به {entityType} رد شد.', variables: ['entityType'] },
    { code: 'MFA_ENABLED', name: 'فعال‌سازی MFA', channel: 'SMS', category: 'Security', content: 'احراز هویت دو مرحله‌ای (MFA) برای حساب کاربری شما با موفقیت فعال شد.', variables: [] },
    { code: 'MFA_DISABLED', name: 'غیرفعال‌سازی MFA', channel: 'SMS', category: 'Security', content: 'هشدار امنیتی: احراز هویت دو مرحله‌ای حساب شما غیرفعال شد.', variables: [] },
    { code: 'MFA_RESET', name: 'بازنشانی MFA', channel: 'SMS', category: 'Security', content: 'تنظیمات MFA حساب شما توسط مدیر سیستم بازنشانی شد. لطفاً مجددا آن را فعال کنید.', variables: [] }
  ];

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { code: t.code },
      update: {},
      create: t
    });
  }

  console.log('Notification Templates seeded.');

  console.log('\n\n🌱  The seed command has been executed.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
