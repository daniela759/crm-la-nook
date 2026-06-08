-- Deadline opțional (îl setează adminii / agenția).
ALTER TABLE "Task" ALTER COLUMN "dueDate" DROP NOT NULL;

-- Statusuri noi: NEW | IN_PROGRESS | POSTPONED | DONE.
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'NEW';
UPDATE "Task" SET "status" = 'NEW' WHERE "status" = 'TODO';
