/*
  Warnings:

  - You are about to drop the column `approvalLevel` on the `ApprovalRequest` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `ApprovalRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ApprovalHistory" ADD COLUMN     "roleRequired" TEXT;

-- AlterTable
ALTER TABLE "ApprovalRequest" DROP COLUMN "approvalLevel",
DROP COLUMN "comments",
ADD COLUMN     "currentLevel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "decisionComment" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "requestType" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "requiredLevels" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "requiredRoles" JSONB NOT NULL DEFAULT '[]';
