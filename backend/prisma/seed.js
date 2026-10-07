"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = __importStar(require("bcryptjs"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var rolesData, roles, _i, rolesData_1, roleName, _a, _b, adminUsername, adminPassword, passwordHash, admin, iran, tehranProv, tehranNorth, fars, shiraz, products, productsList, _c, products_1, p, margin, prod, customer, inactiveCustomer, productU5W30, lastMonth, stages, _d, stages_1, s, leadStage, contactStage, crypto, algorithm, keyStr, encryptPhone, lead1, lead2, today, tomorrow, yesterday, nextWeek, startOfMonth, endOfMonth, mainWarehouse, _e, productsList_1, p, initialQty, categories, actions, createdPermissions, _f, categories_1, cat, _g, actions_1, act, perm, adminRole, _h, createdPermissions_1, perm, _j, _k, templates, _l, templates_1, t;
        var _m, _o;
        var _p;
        return __generator(this, function (_q) {
            switch (_q.label) {
                case 0:
                    console.log('Starting DB seed...');
                    rolesData = [
                        'SystemAdmin',
                        'CEO',
                        'SalesManager',
                        'RegionalManager',
                        'SalesRep',
                        'Finance',
                        'SupportOperator',
                        'WarehouseManager'
                    ];
                    roles = {};
                    _i = 0, rolesData_1 = rolesData;
                    _q.label = 1;
                case 1:
                    if (!(_i < rolesData_1.length)) return [3 /*break*/, 4];
                    roleName = rolesData_1[_i];
                    _a = roles;
                    _b = roleName;
                    return [4 /*yield*/, prisma.role.upsert({
                            where: { name: roleName },
                            update: {},
                            create: { name: roleName },
                        })];
                case 2:
                    _a[_b] = _q.sent();
                    _q.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    adminUsername = process.env.ADMIN_USERNAME || 'admin';
                    adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
                    return [4 /*yield*/, bcrypt.hash(adminPassword, 10)];
                case 5:
                    passwordHash = _q.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { username: adminUsername },
                            update: {},
                            create: {
                                username: adminUsername,
                                passwordHash: passwordHash,
                                roleId: roles['SystemAdmin'].id,
                                isActive: true,
                                mfaEnabled: false,
                            },
                        })];
                case 6:
                    admin = _q.sent();
                    console.log("Seed completed successfully. Admin created with username: ".concat(admin.username));
                    // 3. Setup Territories
                    console.log('Seeding Territories...');
                    return [4 /*yield*/, prisma.territory.upsert({
                            where: { code: 'IR' },
                            update: {},
                            create: { name: 'ایران', code: 'IR', type: 'Country', createdBy: admin.id, managerId: admin.id }
                        })];
                case 7:
                    iran = _q.sent();
                    return [4 /*yield*/, prisma.territory.upsert({
                            where: { code: 'THR' },
                            update: {},
                            create: { name: 'تهران', code: 'THR', type: 'Province', parentId: iran.id, createdBy: admin.id, managerId: admin.id }
                        })];
                case 8:
                    tehranProv = _q.sent();
                    return [4 /*yield*/, prisma.territory.upsert({
                            where: { code: 'THR-N' },
                            update: {},
                            create: { name: 'تهران شمال', code: 'THR-N', type: 'SalesRegion', parentId: tehranProv.id, createdBy: admin.id, managerId: admin.id }
                        })];
                case 9:
                    tehranNorth = _q.sent();
                    return [4 /*yield*/, prisma.territory.upsert({
                            where: { code: 'THR-N-1' },
                            update: {},
                            create: { name: 'مسیر ویزیت ۱ تهران شمال', code: 'THR-N-1', type: 'VisitRoute', parentId: tehranNorth.id, createdBy: admin.id, managerId: admin.id }
                        })];
                case 10:
                    _q.sent();
                    return [4 /*yield*/, prisma.territory.upsert({
                            where: { code: 'FRS' },
                            update: {},
                            create: { name: 'فارس', code: 'FRS', type: 'Province', parentId: iran.id, createdBy: admin.id, managerId: admin.id }
                        })];
                case 11:
                    fars = _q.sent();
                    return [4 /*yield*/, prisma.territory.upsert({
                            where: { code: 'SHZ' },
                            update: {},
                            create: { name: 'شیراز', code: 'SHZ', type: 'City', parentId: fars.id, createdBy: admin.id, managerId: admin.id }
                        })];
                case 12:
                    shiraz = _q.sent();
                    return [4 /*yield*/, prisma.territory.upsert({
                            where: { code: 'SHZ-C' },
                            update: {},
                            create: { name: 'شیراز مرکز', code: 'SHZ-C', type: 'SalesRegion', parentId: shiraz.id, createdBy: admin.id, managerId: admin.id }
                        })];
                case 13:
                    _q.sent();
                    console.log('Territories seeded.');
                    // 4. Setup Products
                    console.log('Seeding Products...');
                    products = [
                        { sku: 'PR-U-5W30', name: 'Pravia Ultra 5W-30', brand: 'Pravia', category: 'Passenger Car Motor Oil', viscosityGrade: '5W-30', apiStandard: 'SN/CF', volume: '4L', basePrice: 850000, estimatedCost: 650000 },
                        { sku: 'PR-D-15W40', name: 'Pravia Diesel 15W-40', brand: 'Pravia', category: 'Heavy Duty Diesel', viscosityGrade: '15W-40', apiStandard: 'CI-4', volume: '20L', basePrice: 3200000, estimatedCost: 2600000 },
                        { sku: 'GE-S-10W40', name: 'Gertex Super 10W-40', brand: 'Gertex', category: 'Passenger Car Motor Oil', viscosityGrade: '10W-40', apiStandard: 'SM', volume: '4L', basePrice: 650000, estimatedCost: 500000 },
                        { sku: 'GE-I-68', name: 'Gertex Industrial 68', brand: 'Gertex', category: 'Industrial Oil', viscosityGrade: 'ISO VG 68', apiStandard: 'HLP', volume: '208L', basePrice: 18000000, estimatedCost: 14000000 }
                    ];
                    productsList = [];
                    _c = 0, products_1 = products;
                    _q.label = 14;
                case 14:
                    if (!(_c < products_1.length)) return [3 /*break*/, 17];
                    p = products_1[_c];
                    margin = ((p.basePrice - p.estimatedCost) / p.basePrice) * 100;
                    return [4 /*yield*/, prisma.product.upsert({
                            where: { sku: p.sku },
                            update: {},
                            create: __assign(__assign({}, p), { estimatedProfitMargin: margin, createdBy: admin.id })
                        })];
                case 15:
                    prod = _q.sent();
                    productsList.push(prod);
                    _q.label = 16;
                case 16:
                    _c++;
                    return [3 /*break*/, 14];
                case 17:
                    console.log('Products seeded.');
                    // 5. Setup a Customer
                    console.log('Seeding Customers...');
                    return [4 /*yield*/, prisma.customer.create({
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
                        })];
                case 18:
                    customer = _q.sent();
                    return [4 /*yield*/, prisma.customer.create({
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
                        })];
                case 19:
                    inactiveCustomer = _q.sent();
                    console.log('Customers seeded.');
                    // 6. Setup Orders
                    console.log('Seeding Orders...');
                    productU5W30 = productsList.find(function (p) { return p.sku === 'PR-U-5W30'; });
                    lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    return [4 /*yield*/, prisma.order.upsert({
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
                                            productId: productU5W30.id,
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
                        })];
                case 20:
                    _q.sent();
                    return [4 /*yield*/, prisma.order.upsert({
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
                                            productId: productU5W30.id,
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
                        })];
                case 21:
                    _q.sent();
                    return [4 /*yield*/, prisma.order.upsert({
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
                                            productId: productU5W30.id,
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
                        })];
                case 22:
                    _q.sent();
                    console.log('Orders seeded.');
                    // 7. Setup Sales Funnel Stages
                    console.log('Seeding Sales Funnel Stages...');
                    stages = [
                        { name: 'Suspect (S)', order: 1 },
                        { name: 'Prospect (P)', order: 2 },
                        { name: 'Approach (A)', order: 3 },
                        { name: 'Negotiation (N)', order: 4 },
                        { name: 'Close (C)', order: 5 },
                        { name: 'Order (O)', order: 6 },
                        { name: 'Payment (P)', order: 7 },
                        { name: 'Lost', order: 8 }
                    ];
                    _d = 0, stages_1 = stages;
                    _q.label = 23;
                case 23:
                    if (!(_d < stages_1.length)) return [3 /*break*/, 26];
                    s = stages_1[_d];
                    return [4 /*yield*/, prisma.salesFunnelStage.upsert({
                            where: { name: s.name },
                            update: {},
                            create: s
                        })];
                case 24:
                    _q.sent();
                    _q.label = 25;
                case 25:
                    _d++;
                    return [3 /*break*/, 23];
                case 26: return [4 /*yield*/, prisma.salesFunnelStage.findUnique({ where: { name: 'Suspect (S)' } })];
                case 27:
                    leadStage = _q.sent();
                    return [4 /*yield*/, prisma.salesFunnelStage.findUnique({ where: { name: 'Prospect (P)' } })];
                case 28:
                    contactStage = _q.sent();
                    // 8. Setup Leads and Presentations
                    console.log('Seeding Leads and Presentations...');
                    crypto = require('crypto');
                    algorithm = 'aes-256-cbc';
                    keyStr = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
                    encryptPhone = function (text) {
                        var iv = crypto.randomBytes(16);
                        var cipher = crypto.createCipheriv(algorithm, Buffer.from(keyStr), iv);
                        var encrypted = cipher.update(text, 'utf8', 'hex');
                        encrypted += cipher.final('hex');
                        return "".concat(iv.toString('hex'), ":").concat(encrypted);
                    };
                    return [4 /*yield*/, prisma.lead.create({
                            data: {
                                name: 'تعویض روغنی برادران - جدید ' + Math.floor(Math.random() * 1000),
                                phone: encryptPhone('09121112233'),
                                source: 'Manual',
                                brandInterest: 'Pravia',
                                territoryId: tehranProv.id,
                                assignedTo: admin.id,
                                status: 'New',
                                currentStageId: leadStage.id,
                                createdBy: admin.id
                            }
                        })];
                case 29:
                    lead1 = _q.sent();
                    return [4 /*yield*/, prisma.leadStageHistory.create({
                            data: {
                                leadId: lead1.id,
                                stageId: leadStage.id,
                                changedBy: admin.id
                            }
                        })];
                case 30:
                    _q.sent();
                    return [4 /*yield*/, prisma.lead.create({
                            data: {
                                name: 'نمایندگی سایپا کاشانی - جدید ' + Math.floor(Math.random() * 1000),
                                phone: encryptPhone('09124445566'),
                                source: 'Exhibition',
                                brandInterest: 'Both',
                                territoryId: shiraz.id,
                                assignedTo: admin.id,
                                status: 'Contacted',
                                currentStageId: contactStage.id,
                                createdBy: admin.id
                            }
                        })];
                case 31:
                    lead2 = _q.sent();
                    return [4 /*yield*/, prisma.leadStageHistory.create({
                            data: {
                                leadId: lead2.id,
                                stageId: contactStage.id,
                                changedBy: admin.id
                            }
                        })];
                case 32:
                    _q.sent();
                    return [4 /*yield*/, prisma.presentation.create({
                            data: {
                                leadId: lead2.id,
                                userId: admin.id,
                                productId: productU5W30.id,
                                presentationType: 'InPerson',
                                durationMinutes: 45,
                                customerReaction: 'Positive',
                                rejectionReasons: [],
                                notes: 'مشتری بسیار راغب بود، نمونه تست برایشان ارسال شود.',
                                nextFollowUpAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                            }
                        })];
                case 33:
                    _q.sent();
                    // 9. Setup Visits and Tasks
                    console.log('Seeding Visits and Tasks...');
                    today = new Date();
                    tomorrow = new Date();
                    tomorrow.setDate(today.getDate() + 1);
                    yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);
                    return [4 /*yield*/, prisma.visit.create({
                            data: { customerId: customer.id, userId: admin.id, territoryId: tehranProv.id, visitType: 'Planned', status: 'Planned', scheduledAt: today, notes: 'ویزیت دوره‌ای' }
                        })];
                case 34:
                    _q.sent();
                    return [4 /*yield*/, prisma.task.create({
                            data: { title: 'تماس برای تأیید پیش‌فاکتور', relatedType: 'Customer', relatedId: customer.id, assignedTo: admin.id, createdBy: admin.id, dueAt: yesterday, priority: 'High', status: 'Open' }
                        })];
                case 35:
                    _q.sent();
                    // 10. Financials
                    console.log('Seeding Financials...');
                    nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 5);
                    return [4 /*yield*/, prisma.cheque.create({
                            data: { customerId: inactiveCustomer.id, chequeNumber: 'ENC:1111222233334444', bankName: 'بانک ملت', amount: 150000000, dueDate: nextWeek, status: 'NearDue', createdBy: admin.id }
                        })];
                case 36:
                    _q.sent();
                    return [4 /*yield*/, prisma.payment.create({
                            data: { customerId: customer.id, amount: 5000000, method: 'BankTransfer', status: 'Confirmed', referenceNumber: 'ENC:REF-001', confirmedBy: admin.id, createdBy: admin.id }
                        })];
                case 37:
                    _q.sent();
                    startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    return [4 /*yield*/, prisma.kPITarget.create({
                            data: { userId: admin.id, territoryId: tehranProv.id, periodType: 'Monthly', periodStart: startOfMonth, periodEnd: endOfMonth, targetSalesAmount: 100000000, targetCollectedAmount: 80000000, targetOrdersCount: 10, targetVisitsCount: 20, targetNewCustomers: 5, targetLeadConversions: 2, createdBy: admin.id }
                        })];
                case 38:
                    _q.sent();
                    console.log('KPI Targets seeded.');
                    return [4 /*yield*/, prisma.warehouse.findUnique({ where: { code: 'WH-MAIN' } })];
                case 39:
                    mainWarehouse = _q.sent();
                    if (!!mainWarehouse) return [3 /*break*/, 47];
                    return [4 /*yield*/, prisma.warehouse.create({
                            data: { name: 'انبار مرکزی تهران', code: 'WH-MAIN', location: 'تهران، جاده مخصوص کرج', createdBy: admin.id }
                        })];
                case 40:
                    mainWarehouse = _q.sent();
                    return [4 /*yield*/, prisma.warehouse.create({
                            data: { name: 'انبار توزیع شیراز', code: 'WH-SHZ', location: 'شیراز، شهرک صنعتی', createdBy: admin.id }
                        })];
                case 41:
                    _q.sent();
                    _e = 0, productsList_1 = productsList;
                    _q.label = 42;
                case 42:
                    if (!(_e < productsList_1.length)) return [3 /*break*/, 46];
                    p = productsList_1[_e];
                    initialQty = 1000;
                    return [4 /*yield*/, prisma.inventoryStock.create({
                            data: { warehouseId: mainWarehouse.id, productId: p.id, quantityOnHand: initialQty, availableQuantity: initialQty, minStockLevel: 50 }
                        })];
                case 43:
                    _q.sent();
                    return [4 /*yield*/, prisma.stockMovement.create({
                            data: { warehouseId: mainWarehouse.id, productId: p.id, movementType: 'Inbound', quantity: initialQty, relatedType: 'Manual', notes: 'موجودی اولیه سیستم (Seed)', createdBy: admin.id }
                        })];
                case 44:
                    _q.sent();
                    _q.label = 45;
                case 45:
                    _e++;
                    return [3 /*break*/, 42];
                case 46:
                    console.log('Warehouses and Inventory seeded.');
                    _q.label = 47;
                case 47:
                    // 13. Security & Permissions
                    console.log('Seeding Security & Permissions...');
                    categories = ['Users', 'Roles', 'Customers', 'Contacts', 'Orders', 'Payments', 'Products', 'PriceLists', 'Territories', 'Leads', 'Presentations', 'Visits', 'Tasks', 'Cheques', 'Receivables', 'KPIs', 'Commissions', 'Reports', 'FinancialReports', 'Warehouses', 'Inventory', 'Security'];
                    actions = ['View', 'Create', 'Edit', 'Delete', 'Export', 'RevealSensitiveData', 'Manage', 'Adjust', 'ViewMovements', 'ViewAuditLogs'];
                    createdPermissions = [];
                    _f = 0, categories_1 = categories;
                    _q.label = 48;
                case 48:
                    if (!(_f < categories_1.length)) return [3 /*break*/, 53];
                    cat = categories_1[_f];
                    _g = 0, actions_1 = actions;
                    _q.label = 49;
                case 49:
                    if (!(_g < actions_1.length)) return [3 /*break*/, 52];
                    act = actions_1[_g];
                    if ((cat === 'Security' && !['ManageSessions', 'ViewAuditLogs'].includes(act)) || (cat === 'Users' && act !== 'Manage') || (['Export', 'RevealSensitiveData'].includes(act) && !['Customers', 'Leads', 'Cheques', 'Reports', 'FinancialReports', 'Payments', 'Receivables'].includes(cat))) {
                        return [3 /*break*/, 51]; // skip illogical combos for speed
                    }
                    return [4 /*yield*/, prisma.permission.upsert({
                            where: { category_action: { category: cat, action: act } },
                            update: {},
                            create: { category: cat, action: act }
                        })];
                case 50:
                    perm = _q.sent();
                    createdPermissions.push(perm);
                    _q.label = 51;
                case 51:
                    _g++;
                    return [3 /*break*/, 49];
                case 52:
                    _f++;
                    return [3 /*break*/, 48];
                case 53: return [4 /*yield*/, prisma.role.findUnique({ where: { name: 'SystemAdmin' } })];
                case 54:
                    adminRole = _q.sent();
                    if (!adminRole) return [3 /*break*/, 58];
                    _h = 0, createdPermissions_1 = createdPermissions;
                    _q.label = 55;
                case 55:
                    if (!(_h < createdPermissions_1.length)) return [3 /*break*/, 58];
                    perm = createdPermissions_1[_h];
                    return [4 /*yield*/, prisma.rolePermission.upsert({
                            where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
                            update: {},
                            create: { roleId: adminRole.id, permissionId: perm.id }
                        })];
                case 56:
                    _q.sent();
                    _q.label = 57;
                case 57:
                    _h++;
                    return [3 /*break*/, 55];
                case 58: 
                // Create Active Session
                return [4 /*yield*/, prisma.activeSession.upsert({
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
                    })];
                case 59:
                    // Create Active Session
                    _q.sent();
                    _k = (_j = prisma.approvalRequest).create;
                    _m = {};
                    _o = {
                        entityType: 'Discount',
                        entityId: 'ORD-MOCK'
                    };
                    return [4 /*yield*/, prisma.user.findFirst({ where: { role: { name: 'SalesRep' } } })];
                case 60: 
                // Create Approval Request
                return [4 /*yield*/, _k.apply(_j, [(_m.data = (_o.requestedBy = ((_p = (_q.sent())) === null || _p === void 0 ? void 0 : _p.id) || admin.id,
                            _o.assignedApprover = admin.id,
                            _o.currentLevel = 1,
                            _o.requiredLevels = 1,
                            _o.status = 'Pending',
                            _o.reason = 'Requesting 15% discount for a high value order.',
                            _o),
                            _m)])];
                case 61:
                    // Create Approval Request
                    _q.sent();
                    console.log('Security seeded.');
                    // 14. Notifications & Automation Seeds
                    console.log('Seeding Notifications...');
                    return [4 /*yield*/, prisma.notificationPreference.upsert({
                            where: { userId: admin.id },
                            update: {},
                            create: { userId: admin.id }
                        })];
                case 62:
                    _q.sent();
                    return [4 /*yield*/, prisma.notification.createMany({
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
                        })];
                case 63:
                    _q.sent();
                    console.log('Notifications seeded.');
                    templates = [
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
                    _l = 0, templates_1 = templates;
                    _q.label = 64;
                case 64:
                    if (!(_l < templates_1.length)) return [3 /*break*/, 67];
                    t = templates_1[_l];
                    return [4 /*yield*/, prisma.notificationTemplate.upsert({
                            where: { code: t.code },
                            update: {},
                            create: t
                        })];
                case 65:
                    _q.sent();
                    _q.label = 66;
                case 66:
                    _l++;
                    return [3 /*break*/, 64];
                case 67:
                    console.log('Notification Templates seeded.');
                    console.log('\n\n🌱  The seed command has been executed.\n');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
