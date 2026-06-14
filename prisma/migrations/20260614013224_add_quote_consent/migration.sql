-- Согласие на обработку ПДн (ФЗ-152): момент согласия как доказательство.
-- DropIndex/DropDefault для Product.searchVector убраны вручную — это
-- generated-колонка под raw SQL, Prisma не должен ею управлять.
ALTER TABLE "QuoteRequest" ADD COLUMN     "consentAt" TIMESTAMP(3);
