-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateTable
CREATE TABLE "teachers" (
    "id" BIGSERIAL NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified_at" TIMESTAMPTZ(6),
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "phone" TEXT,
    "country_code" CHAR(2) NOT NULL DEFAULT 'KR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "spoken_langs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hourly_rate_usd" DECIMAL(6,2),
    "rate_tier" CHAR(1),
    "italki_profile_url" TEXT,
    "italki_status" TEXT NOT NULL DEFAULT 'none',
    "preply_profile_url" TEXT,
    "preply_status" TEXT NOT NULL DEFAULT 'none',
    "approval_status" TEXT NOT NULL DEFAULT 'pending',
    "approved_at" TIMESTAMPTZ(6),
    "rejected_reason" TEXT,
    "apply_note" TEXT,
    "onboarding_stage" TEXT NOT NULL DEFAULT 'signup',
    "certified_at" TIMESTAMPTZ(6),
    "pg_customer_id" TEXT,
    "card_last4" CHAR(4),
    "billing_status" TEXT NOT NULL DEFAULT 'none',
    "credit_balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" BIGSERIAL NOT NULL,
    "teacher_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ko" TEXT,
    "email_hash" TEXT NOT NULL,
    "email_enc" BYTEA NOT NULL,
    "l1_code" CHAR(2) NOT NULL,
    "country_code" CHAR(2),
    "platform" TEXT NOT NULL,
    "platform_url" TEXT,
    "level_code" TEXT NOT NULL DEFAULT 'topik1',
    "goal_track" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verified_at" TIMESTAMPTZ(6),
    "status_before_lock" TEXT,
    "current_lesson_no" INTEGER NOT NULL DEFAULT 0,
    "first_lesson_at" TIMESTAMPTZ(6),
    "last_lesson_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "teacher_id" BIGINT NOT NULL,
    "lesson_no" INTEGER NOT NULL,
    "unit_id" BIGINT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "outcome" TEXT,
    "speak_ratio" SMALLINT,
    "report_submitted_at" TIMESTAMPTZ(6),
    "plan_allocation" JSONB,
    "billing_cycle_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_report_items" (
    "id" BIGSERIAL NOT NULL,
    "lesson_id" BIGINT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ord" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "lesson_report_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocab_cards" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "source_lesson_id" BIGINT,
    "term" TEXT NOT NULL,
    "gloss_l1" TEXT,
    "example" TEXT,
    "audio_key" TEXT,
    "ease" DECIMAL(4,2) NOT NULL DEFAULT 2.50,
    "interval_days" INTEGER NOT NULL DEFAULT 1,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'learning',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocab_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_activity" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "kind" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "student_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hvpt_contrasts" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "tokens" TEXT[],
    "l1_priority" JSONB,

    CONSTRAINT "hvpt_contrasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hvpt_tokens" (
    "id" BIGSERIAL NOT NULL,
    "contrast_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "talker_idx" SMALLINT NOT NULL,
    "context" TEXT NOT NULL,
    "audio_key" TEXT NOT NULL,

    CONSTRAINT "hvpt_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hvpt_sessions" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "contrast_id" TEXT NOT NULL,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "correct" SMALLINT NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "hvpt_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hvpt_attempts" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "token_id" BIGINT NOT NULL,
    "chosen" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "response_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hvpt_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fluency_sessions" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "topic_id" BIGINT,
    "r1_done_at" TIMESTAMPTZ(6),
    "r2_done_at" TIMESTAMPTZ(6),
    "r3_done_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fluency_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_logs" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "audio_id" BIGINT NOT NULL,
    "played_sec" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listening_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strand_weekly" (
    "student_id" BIGINT NOT NULL,
    "week_start" DATE NOT NULL,
    "input_min" INTEGER NOT NULL DEFAULT 0,
    "output_min" INTEGER NOT NULL DEFAULT 0,
    "form_min" INTEGER NOT NULL DEFAULT 0,
    "fluency_min" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "strand_weekly_pkey" PRIMARY KEY ("student_id","week_start")
);

-- CreateTable
CREATE TABLE "lesson_schedules" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "teacher_id" BIGINT NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "duration_min" SMALLINT NOT NULL DEFAULT 50,
    "lesson_id" BIGINT,
    "canceled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_tests" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "level_code" TEXT NOT NULL,
    "correct" SMALLINT NOT NULL,
    "asked" SMALLINT NOT NULL,
    "answers" JSONB NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "level_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_units" (
    "id" BIGSERIAL NOT NULL,
    "level_code" TEXT NOT NULL,
    "unit_no" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "goal_statement" TEXT NOT NULL,
    "target_forms" JSONB NOT NULL,
    "target_vocab" JSONB NOT NULL,
    "recycle_from" INTEGER[] DEFAULT ARRAY[]::INTEGER[],

    CONSTRAINT "curriculum_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_assets" (
    "id" BIGSERIAL NOT NULL,
    "unit_id" BIGINT NOT NULL,
    "l1_code" CHAR(2) NOT NULL,
    "kind" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "page_count" SMALLINT,
    "duration_sec" INTEGER,

    CONSTRAINT "curriculum_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" BIGSERIAL NOT NULL,
    "unit_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "tree" JSONB NOT NULL,
    "tts_generated_at" TIMESTAMPTZ(6),

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_cycles" (
    "id" BIGSERIAL NOT NULL,
    "student_id" BIGINT NOT NULL,
    "teacher_id" BIGINT NOT NULL,
    "cycle_no" INTEGER NOT NULL,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "tier" CHAR(1) NOT NULL,
    "base_amount" INTEGER NOT NULL,
    "discount_pct" SMALLINT NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL,
    "lesson_count" SMALLINT NOT NULL DEFAULT 0,
    "activity_count" SMALLINT NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "billing_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" BIGSERIAL NOT NULL,
    "teacher_id" BIGINT NOT NULL,
    "billing_month" DATE NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "credit_applied" INTEGER NOT NULL DEFAULT 0,
    "charge_amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "pg_tid" TEXT,
    "paid_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "retry_count" SMALLINT NOT NULL DEFAULT 0,
    "grace_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "billing_cycle_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_topups" (
    "id" BIGSERIAL NOT NULL,
    "teacher_id" BIGINT NOT NULL,
    "paid_amount" INTEGER NOT NULL,
    "granted_amount" INTEGER NOT NULL,
    "bonus_pct" SMALLINT NOT NULL,
    "pg_tid" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_topups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_views" (
    "id" BIGSERIAL NOT NULL,
    "teacher_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "unit_id" BIGINT NOT NULL,
    "asset_id" BIGINT,
    "opened_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_hash" TEXT,
    "ua_hash" TEXT,

    CONSTRAINT "asset_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" BIGINT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "sent_at" TIMESTAMPTZ(6),
    "channel" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lang_gate_snapshots" (
    "id" BIGSERIAL NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'italki',
    "lang_code" CHAR(2) NOT NULL DEFAULT 'ko',
    "is_open" BOOLEAN NOT NULL,
    "checked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lang_gate_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" BIGINT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entity_id" BIGINT,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_key" ON "teachers"("email");

-- CreateIndex
CREATE INDEX "idx_teachers_billing" ON "teachers"("billing_status");

-- CreateIndex
CREATE INDEX "idx_students_teacher_status" ON "students"("teacher_id", "status");

-- CreateIndex
CREATE INDEX "idx_students_last_lesson" ON "students"("last_lesson_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_student_email" ON "students"("teacher_id", "email_hash");

-- CreateIndex
CREATE INDEX "idx_lessons_student" ON "lessons"("student_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "idx_lessons_cycle" ON "lessons"("billing_cycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_lesson_no" ON "lessons"("student_id", "lesson_no", "started_at");

-- CreateIndex
CREATE INDEX "idx_report_lesson" ON "lesson_report_items"("lesson_id", "kind");

-- CreateIndex
CREATE INDEX "idx_vocab_due" ON "vocab_cards"("student_id", "due_at");

-- CreateIndex
CREATE INDEX "idx_activity_student_time" ON "student_activity"("student_id", "occurred_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_hvpt_token" ON "hvpt_tokens"("contrast_id", "token", "talker_idx", "context");

-- CreateIndex
CREATE INDEX "idx_schedule_teacher_time" ON "lesson_schedules"("teacher_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "idx_schedule_student_time" ON "lesson_schedules"("student_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "idx_level_test_student" ON "level_tests"("student_id", "completed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_unit_no" ON "curriculum_units"("unit_no");

-- CreateIndex
CREATE UNIQUE INDEX "uq_asset" ON "curriculum_assets"("unit_id", "l1_code", "kind");

-- CreateIndex
CREATE INDEX "idx_cycle_close" ON "billing_cycles"("status", "period_end");

-- CreateIndex
CREATE INDEX "idx_cycle_teacher" ON "billing_cycles"("teacher_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cycle" ON "billing_cycles"("student_id", "cycle_no");

-- CreateIndex
CREATE UNIQUE INDEX "uq_invoice" ON "invoices"("teacher_id", "billing_month");

-- CreateIndex
CREATE INDEX "idx_views_student_time" ON "asset_views"("student_id", "opened_at" DESC);

-- CreateIndex
CREATE INDEX "idx_notif_due" ON "notifications"("scheduled_at");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "curriculum_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_billing_cycle_id_fkey" FOREIGN KEY ("billing_cycle_id") REFERENCES "billing_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_report_items" ADD CONSTRAINT "lesson_report_items_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocab_cards" ADD CONSTRAINT "vocab_cards_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocab_cards" ADD CONSTRAINT "vocab_cards_source_lesson_id_fkey" FOREIGN KEY ("source_lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_activity" ADD CONSTRAINT "student_activity_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hvpt_tokens" ADD CONSTRAINT "hvpt_tokens_contrast_id_fkey" FOREIGN KEY ("contrast_id") REFERENCES "hvpt_contrasts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hvpt_sessions" ADD CONSTRAINT "hvpt_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hvpt_sessions" ADD CONSTRAINT "hvpt_sessions_contrast_id_fkey" FOREIGN KEY ("contrast_id") REFERENCES "hvpt_contrasts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hvpt_attempts" ADD CONSTRAINT "hvpt_attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "hvpt_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hvpt_attempts" ADD CONSTRAINT "hvpt_attempts_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "hvpt_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluency_sessions" ADD CONSTRAINT "fluency_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_logs" ADD CONSTRAINT "listening_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strand_weekly" ADD CONSTRAINT "strand_weekly_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_schedules" ADD CONSTRAINT "lesson_schedules_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_schedules" ADD CONSTRAINT "lesson_schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_tests" ADD CONSTRAINT "level_tests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_assets" ADD CONSTRAINT "curriculum_assets_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "curriculum_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "curriculum_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_cycles" ADD CONSTRAINT "billing_cycles_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_cycles" ADD CONSTRAINT "billing_cycles_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_billing_cycle_id_fkey" FOREIGN KEY ("billing_cycle_id") REFERENCES "billing_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_topups" ADD CONSTRAINT "credit_topups_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_views" ADD CONSTRAINT "asset_views_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_views" ADD CONSTRAINT "asset_views_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_views" ADD CONSTRAINT "asset_views_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "curriculum_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_views" ADD CONSTRAINT "asset_views_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "curriculum_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

