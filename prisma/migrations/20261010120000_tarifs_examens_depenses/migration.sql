-- Suppression des formules : tarification à l'heure + frais d'inscription, examens, dépenses

-- CreateEnum
CREATE TYPE "PaymentCategory" AS ENUM ('INSCRIPTION', 'CONDUITE', 'CODE', 'EXAMEN');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('CODE', 'PARK', 'CONDUITE');

-- CreateEnum
CREATE TYPE "ExamResult" AS ENUM ('PROGRAMME', 'REUSSI', 'ECHOUE', 'ABSENT');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('CARBURANT', 'ENTRETIEN', 'ASSURANCE', 'SALAIRE', 'LOYER', 'FACTURES', 'FRAIS_EXAMEN', 'TAXES', 'FOURNITURES', 'AUTRE');

-- Les séances "examen blanc" deviennent des séances de code (les examens officiels sont désormais gérés à part)
UPDATE "sessions" SET "type" = 'CODE' WHERE "type" = 'EXAMEN_BLANC';

-- AlterEnum
BEGIN;
CREATE TYPE "SessionType_new" AS ENUM ('CONDUITE', 'PARK', 'CODE', 'AUTRE');
ALTER TABLE "sessions" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "sessions" ALTER COLUMN "type" TYPE "SessionType_new" USING ("type"::text::"SessionType_new");
ALTER TYPE "SessionType" RENAME TO "SessionType_old";
ALTER TYPE "SessionType_new" RENAME TO "SessionType";
DROP TYPE "SessionType_old";
ALTER TABLE "sessions" ALTER COLUMN "type" SET DEFAULT 'CONDUITE';
COMMIT;

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_packageId_fkey";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "doneSessions",
DROP COLUMN "packageId",
DROP COLUMN "paidAmount",
DROP COLUMN "totalPrice",
DROP COLUMN "totalSessions",
ADD COLUMN     "feeInscriptionCode" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "feeInscriptionConduite" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "feeInscriptionPark" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "registeredCode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registeredConduite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registeredPark" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "category" "PaymentCategory" NOT NULL DEFAULT 'CONDUITE';

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Applique les tarifs par défaut aux séances existantes
UPDATE "sessions" SET "hourlyRate" = 28 WHERE "type" IN ('CONDUITE', 'PARK');
UPDATE "sessions" SET "hourlyRate" = 10 WHERE "type" = 'CODE';

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "feeInscriptionCode" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "feeInscriptionConduite" DOUBLE PRECISION NOT NULL DEFAULT 200,
ADD COLUMN     "feeInscriptionPark" DOUBLE PRECISION NOT NULL DEFAULT 200,
ADD COLUMN     "priceHourCode" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN     "priceHourConduite" DOUBLE PRECISION NOT NULL DEFAULT 28;

-- DropTable
DROP TABLE "packages";

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "ExamType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "result" "ExamResult" NOT NULL DEFAULT 'PROGRAMME',
    "fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'AUTRE',
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "PaymentMethod" NOT NULL DEFAULT 'ESPECES',
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exams_clientId_type_idx" ON "exams"("clientId", "type");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

