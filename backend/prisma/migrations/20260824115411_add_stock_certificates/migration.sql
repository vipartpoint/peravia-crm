-- CreateTable
CREATE TABLE "StockCertificate" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shareholderName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "sharesCount" INTEGER NOT NULL,
    "shareValue" DECIMAL(20,4) NOT NULL,
    "totalAmount" DECIMAL(20,4) NOT NULL,
    "amountInWords" TEXT NOT NULL,
    "shareRangeFrom" INTEGER NOT NULL,
    "shareRangeTo" INTEGER NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "registrationDate" TEXT NOT NULL,
    "registrationLocation" TEXT NOT NULL,
    "registeredCapital" TEXT NOT NULL,
    "issuedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockCertificate_serialNumber_key" ON "StockCertificate"("serialNumber");

-- AddForeignKey
ALTER TABLE "StockCertificate" ADD CONSTRAINT "StockCertificate_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
