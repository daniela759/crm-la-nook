-- ─── Task: tipologie (categorie) ─────────────────────────────────────────────
ALTER TABLE "Task" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'OPERATIONAL';

-- Backfill pe baza tipului existent (idempotent; sigur și dacă există deja taskuri).
UPDATE "Task" SET "category" = 'SALES'
  WHERE "type" IN ('LEAD_FOLLOWUP','CALL_CONTACT','OFFER_SUBSCRIPTION','RENEW_SUBSCRIPTION','RECOVER_NO_SHOW');
UPDATE "Task" SET "category" = 'OPERATIONAL'
  WHERE "type" IN ('CONFIRM_RESERVATION','EVENT_PREP');
UPDATE "Task" SET "category" = 'ADMINISTRATIVE'
  WHERE "type" = 'OTHER';

CREATE INDEX "Task_category_idx" ON "Task"("category");

-- ─── User: 3 roluri noi (SUPER_ADMIN / MARKETING / OPERATIONAL) ───────────────
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPERATIONAL';

-- Redenumire valori existente.
UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN';
UPDATE "User" SET "role" = 'OPERATIONAL' WHERE "role" = 'USER';

-- Ela și Flaviu = super-admini (Ela era pe rol de USER).
UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE "email" IN ('ela.zapca@gmail.com','zflaviu@gmail.com');
