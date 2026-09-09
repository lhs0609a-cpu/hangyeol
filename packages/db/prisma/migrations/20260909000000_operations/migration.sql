-- Fails intentionally if legacy duplicate transaction IDs require reconciliation.
CREATE UNIQUE INDEX "credit_topups_pg_tid_key" ON "credit_topups"("pg_tid");
CREATE UNIQUE INDEX "invoices_pg_tid_key" ON "invoices"("pg_tid");
ALTER TABLE "notifications" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "locked_until" TIMESTAMPTZ(6), ADD COLUMN "last_error" TEXT;
CREATE TABLE "payment_orders" (
  "id" TEXT PRIMARY KEY, "teacher_id" BIGINT NOT NULL, "student_id" BIGINT,
  "invoice_id" BIGINT UNIQUE, "kind" TEXT NOT NULL, "name" TEXT NOT NULL,
  "amount" INTEGER NOT NULL CHECK (amount > 0), "status" TEXT NOT NULL DEFAULT 'pending',
  "payment_key" TEXT UNIQUE, "request_key" TEXT NOT NULL, "refund_key" TEXT NOT NULL,
  "paid_at" TIMESTAMPTZ(6), "refunded_at" TIMESTAMPTZ(6), "refund_reason" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "payment_orders_teacher_id_created_at_idx" ON "payment_orders"("teacher_id", "created_at");
CREATE INDEX "payment_orders_student_id_created_at_idx" ON "payment_orders"("student_id", "created_at");
CREATE TABLE "billing_mandates" (
  "teacher_id" BIGINT PRIMARY KEY, "customer_key" TEXT NOT NULL UNIQUE,
  "billing_key" TEXT, "accepted_at" TIMESTAMPTZ(6)
);
CREATE TABLE "learning_progress" (
  "student_id" BIGINT PRIMARY KEY, "completed" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes" JSONB NOT NULL DEFAULT '{}', "updated_at" TIMESTAMPTZ(6) NOT NULL
);
CREATE TABLE "teacher_training" (
  "teacher_id" BIGINT PRIMARY KEY, "completed" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "updated_at" TIMESTAMPTZ(6) NOT NULL
);
