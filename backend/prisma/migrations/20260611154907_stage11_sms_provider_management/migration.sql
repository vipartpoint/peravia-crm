-- CreateTable
CREATE TABLE "SmsProviderConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "senderNumber" TEXT,
    "baseUrl" TEXT,
    "encryptedApiKey" TEXT,
    "encryptedUsername" TEXT,
    "encryptedPassword" TEXT,
    "customHeadersEncrypted" TEXT,
    "customPayloadTemplate" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsProviderConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SmsProviderConfig" ADD CONSTRAINT "SmsProviderConfig_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
