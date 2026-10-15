-- CreateEnum
CREATE TYPE "PaymentDetail" AS ENUM ('CODE', 'CONDUITE', 'PARK');

-- AlterEnum
ALTER TYPE "PaymentCategory" ADD VALUE 'PARK';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "detail" "PaymentDetail";

-- Paiements d'inscription existants : précision déduite quand le client n'a qu'une seule inscription
UPDATE "payments" p SET "detail" = CASE
    WHEN c."registeredCode" THEN 'CODE'::"PaymentDetail"
    WHEN c."registeredConduite" THEN 'CONDUITE'::"PaymentDetail"
    ELSE 'PARK'::"PaymentDetail"
  END
FROM "clients" c
WHERE p."clientId" = c."id"
  AND p."category" = 'INSCRIPTION'
  AND (c."registeredCode"::int + c."registeredConduite"::int + c."registeredPark"::int) = 1;
