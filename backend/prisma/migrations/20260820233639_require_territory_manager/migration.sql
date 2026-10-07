/*
  Warnings:

  - Made the column `managerId` on table `Territory` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Territory" DROP CONSTRAINT "Territory_managerId_fkey";

-- AlterTable
ALTER TABLE "Territory" ALTER COLUMN "managerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Territory" ADD CONSTRAINT "Territory_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
