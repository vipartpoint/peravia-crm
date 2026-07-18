import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STAGES = [
  { name: 'Lead', prob: 10, status: 'Open' },
  { name: 'Qualified', prob: 30, status: 'Open' },
  { name: 'Proposal', prob: 50, status: 'Open' },
  { name: 'Negotiation', prob: 80, status: 'Open' },
  { name: 'Won', prob: 100, status: 'Won' },
  { name: 'Lost', prob: 0, status: 'Lost' }
];

const LOST_REASONS = ['Price', 'Competitor', 'Delivery Time', 'Product Availability'];
const COMPETITORS = ['Behran', 'Sepahan', 'Pars', 'Iranol'];

async function run() {
  console.log('--- STARTING SALES OPPORTUNITIES SEEDING ---');

  try {
    // 1. Get or Create User & Role
    const role = await prisma.role.findFirst() || await prisma.role.create({ data: { name: `Role_Sales_${Date.now()}` } });
    
    // Create multiple users
    const user1 = await prisma.user.create({ data: { username: `sales1_${Date.now()}`, passwordHash: 'hash', roleId: role.id } });
    const user2 = await prisma.user.create({ data: { username: `sales2_${Date.now()}`, passwordHash: 'hash', roleId: role.id } });
    const users = [user1, user2];

    // Create territories
    const t1 = await prisma.territory.create({ data: { name: 'Tehran', code: `THR_${Date.now()}`, type: 'Province', createdBy: user1.id } });
    const t2 = await prisma.territory.create({ data: { name: 'Isfahan', code: `ISF_${Date.now()}`, type: 'Province', createdBy: user1.id } });
    const territories = [t1, t2];

    // Create customers
    const c1 = await prisma.customer.create({ data: { name: 'Tehran Auto Fleet', customerType: 'B2B', brandScope: 'Pravia', loyaltyTier: 'Gold', createdBy: user1.id } });
    const c2 = await prisma.customer.create({ data: { name: 'Isfahan Transport Co', customerType: 'B2B', brandScope: 'Pravia', loyaltyTier: 'Silver', createdBy: user1.id } });
    const c3 = await prisma.customer.create({ data: { name: 'National Logistics', customerType: 'B2B', brandScope: 'Both', loyaltyTier: 'Gold', createdBy: user1.id } });
    const customers = [c1, c2, c3];

    // Create realistic Products
    const p20w50 = await prisma.product.create({ data: { sku: `20W50_${Date.now()}`, name: '20W50 Motor Oil', brand: 'Pravia', basePrice: 500000, createdBy: user1.id } });
    const p10w40 = await prisma.product.create({ data: { sku: `10W40_${Date.now()}`, name: '10W40 Premium Oil', brand: 'Pravia', basePrice: 650000, createdBy: user1.id } });
    const p5w30 = await prisma.product.create({ data: { sku: `5W30_${Date.now()}`, name: '5W30 Synthetic', brand: 'Pravia', basePrice: 800000, createdBy: user1.id } });
    const pATF = await prisma.product.create({ data: { sku: `ATF_${Date.now()}`, name: 'ATF Transmission Fluid', brand: 'Pravia', basePrice: 900000, createdBy: user1.id } });
    const products = [p20w50, p10w40, p5w30, pATF];

    console.log('Seeding 15 Realistic Opportunities...');

    const oppsToCreate = [
      { name: 'Tehran Fleet Renewal', c: c1, t: t1, u: user1, stage: STAGES[0] }, // Lead
      { name: 'Isfahan Buses Q3', c: c2, t: t2, u: user2, stage: STAGES[0] }, // Lead
      { name: 'National Logistics Hub', c: c3, t: t1, u: user1, stage: STAGES[0] }, // Lead
      
      { name: 'Tehran Taxis', c: c1, t: t1, u: user1, stage: STAGES[1] }, // Qualified
      { name: 'Isfahan Trucks', c: c2, t: t2, u: user2, stage: STAGES[1] }, // Qualified
      
      { name: 'National Highway Tender', c: c3, t: t1, u: user1, stage: STAGES[2] }, // Proposal
      { name: 'Tehran Transport Auth', c: c1, t: t1, u: user2, stage: STAGES[2] }, // Proposal
      
      { name: 'Isfahan Municipality Fleet', c: c2, t: t2, u: user2, stage: STAGES[3] }, // Negotiation
      { name: 'National Airport Vehicles', c: c3, t: t1, u: user1, stage: STAGES[3] }, // Negotiation
      
      // Won
      { name: 'Tehran VIP Transport', c: c1, t: t1, u: user1, stage: STAGES[4] },
      { name: 'Isfahan Heavy Trucks', c: c2, t: t2, u: user2, stage: STAGES[4] },
      { name: 'National Delivery Service', c: c3, t: t1, u: user1, stage: STAGES[4] },
      
      // Lost
      { name: 'Tehran South Fleet', c: c1, t: t1, u: user2, stage: STAGES[5], reason: 'Price', comp: 'Behran' },
      { name: 'Isfahan North Logistics', c: c2, t: t2, u: user1, stage: STAGES[5], reason: 'Competitor', comp: 'Sepahan' },
      { name: 'National Express Cargo', c: c3, t: t1, u: user2, stage: STAGES[5], reason: 'Delivery Time' }
    ];

    for (let i = 0; i < oppsToCreate.length; i++) {
      const o = oppsToCreate[i];
      
      // Generate 1-3 random items
      const numItems = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let totalEst = 0;
      
      for(let j=0; j<numItems; j++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 500) + 50; // 50 to 550
        const price = Number(prod.basePrice);
        items.push({
          productId: prod.id,
          quantity: qty,
          potentialVolume: qty,
          unitPrice: price,
        });
        totalEst += (qty * price);
      }

      await prisma.opportunity.create({
        data: {
          name: o.name,
          customerId: o.c.id,
          territoryId: o.t.id,
          ownerId: o.u.id,
          createdBy: o.u.id,
          stage: o.stage.name,
          status: o.stage.status,
          probability: o.stage.prob,
          totalEstimatedValue: totalEst,
          lostReason: o.reason,
          competitorName: o.comp,
          items: {
            create: items
          }
        }
      });
      console.log(`Created: ${o.name} [${o.stage.name}]`);
    }

    console.log('✅ SEEDING COMPLETED: 15 Opportunities generated successfully.');

  } catch (err) {
    console.error('❌ SEED ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
