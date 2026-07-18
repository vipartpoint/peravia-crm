-- AlterTable
ALTER TABLE "InventoryShortageRequest" ADD COLUMN     "additiveAvailability" BOOLEAN,
ADD COLUMN     "estimatedDeliveryTime" TIMESTAMP(3),
ADD COLUMN     "rawMaterialAvailability" BOOLEAN;

-- AlterTable
ALTER TABLE "ProductionBatch" ADD COLUMN     "wasteQuantity" INTEGER DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'Planned';
