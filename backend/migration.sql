-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "isRead",
DROP COLUMN "relatedId",
DROP COLUMN "relatedType",
DROP COLUMN "targetUrl",
ADD COLUMN     "actionUrl" TEXT,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Unread';

