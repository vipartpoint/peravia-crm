-- AlterTable
ALTER TABLE "ApprovalRequest" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'Medium',
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "title" TEXT;
