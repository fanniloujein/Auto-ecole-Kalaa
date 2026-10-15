-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "retakeFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Les examens déjà échoués ou manqués reçoivent les frais de repassage du tarif en vigueur
UPDATE "exams" e SET "retakeFee" = CASE e."type"
    WHEN 'CODE' THEN COALESCE((SELECT "feeRetakeCode" FROM "settings" LIMIT 1), 50)
    WHEN 'PARK' THEN COALESCE((SELECT "feeRetakePark" FROM "settings" LIMIT 1), 100)
    WHEN 'CONDUITE' THEN COALESCE((SELECT "feeRetakeConduite" FROM "settings" LIMIT 1), 100)
  END
WHERE e."result" IN ('ECHOUE', 'ABSENT');
