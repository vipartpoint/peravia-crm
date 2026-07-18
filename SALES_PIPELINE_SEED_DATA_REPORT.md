# Sales Pipeline Seed Data Report

## Objective
To ensure that the Sales Pipeline Kanban and Dashboard could be properly tested visually and functionally, a dedicated database seeding script (`scripts/seed-opportunities.ts`) was created to populate the system with realistic data representing Peravia's actual business flow.

## Seeding Breakdown
The script successfully populated the Prisma database with the following dynamic entities:

### Entities Generated
- **Users**: 2 new Sales Representatives (`sales1_*`, `sales2_*`).
- **Territories**: Tehran, Isfahan.
- **Customers**: 3 simulated B2B companies (Tehran Auto Fleet, Isfahan Transport Co, National Logistics).
- **Products**: 20W50 Motor Oil, 10W40 Premium Oil, 5W30 Synthetic, ATF Transmission Fluid.

### Opportunities Generated (Total: 15)
15 opportunities were automatically generated and assigned randomized quantities of the above products, leading to dynamic calculated values and volumes.

| Stage | Opportunities | Distribution Examples |
|-------|---------------|-----------------------|
| Lead | 3 | Tehran Fleet Renewal, Isfahan Buses Q3 |
| Qualified | 2 | Tehran Taxis, Isfahan Trucks |
| Proposal | 2 | National Highway Tender |
| Negotiation | 2 | Isfahan Municipality Fleet |
| Won | 3 | Tehran VIP Transport, National Delivery Service |
| Lost | 3 | Tehran South Fleet (Price), Isfahan North Logistics (Competitor) |

### Validation
The UI `/opportunities` was reviewed, confirming all columns are populated, values are accurate, and drag-and-drop behaves reliably across a densely populated board.
