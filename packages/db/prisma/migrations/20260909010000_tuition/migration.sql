CREATE TABLE course_offers (
 id TEXT PRIMARY KEY, teacher_id BIGINT NOT NULL REFERENCES teachers(id), title TEXT NOT NULL, description TEXT NOT NULL,
 sessions INTEGER NOT NULL CHECK(sessions BETWEEN 1 AND 100), minutes INTEGER NOT NULL DEFAULT 50 CHECK(minutes BETWEEN 15 AND 180),
 amount INTEGER NOT NULL CHECK(amount BETWEEN 1000 AND 5000000), fee_bps INTEGER NOT NULL CHECK(fee_bps BETWEEN 0 AND 10000),
 published BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX course_offers_teacher_id_idx ON course_offers(teacher_id);
CREATE TABLE course_applications (
 id TEXT PRIMARY KEY, offer_id TEXT NOT NULL REFERENCES course_offers(id), name TEXT NOT NULL, email_hash TEXT NOT NULL, email_enc BYTEA NOT NULL,
 language TEXT NOT NULL, timezone TEXT NOT NULL, goal TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', student_id BIGINT REFERENCES students(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(offer_id,email_hash)
);
CREATE TABLE tuition_enrollments (
 id TEXT PRIMARY KEY, application_id TEXT NOT NULL UNIQUE REFERENCES course_applications(id), order_id TEXT NOT NULL UNIQUE REFERENCES payment_orders(id),
 student_id BIGINT NOT NULL REFERENCES students(id), teacher_id BIGINT NOT NULL REFERENCES teachers(id),
 sessions INTEGER NOT NULL CHECK(sessions BETWEEN 1 AND 100), used INTEGER NOT NULL DEFAULT 0 CHECK(used >= 0 AND used <= sessions),
 fee_bps INTEGER NOT NULL CHECK(fee_bps BETWEEN 0 AND 10000), amount INTEGER NOT NULL CHECK(amount > 0),
 status TEXT NOT NULL DEFAULT 'pending', refund_amount INTEGER NOT NULL DEFAULT 0 CHECK(refund_amount >= 0 AND refund_amount <= amount),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tuition_enrollments_student_id_status_idx ON tuition_enrollments(student_id,status);
CREATE TABLE teacher_payouts (
 id TEXT PRIMARY KEY, teacher_id BIGINT NOT NULL REFERENCES teachers(id), amount INTEGER NOT NULL CHECK(amount > 0),
 status TEXT NOT NULL DEFAULT 'pending', transfer_reference TEXT UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), paid_at TIMESTAMPTZ
);
CREATE INDEX teacher_payouts_teacher_id_created_at_idx ON teacher_payouts(teacher_id,created_at);
CREATE TABLE tuition_usage (
 id TEXT PRIMARY KEY, enrollment_id TEXT NOT NULL REFERENCES tuition_enrollments(id), lesson_id BIGINT NOT NULL UNIQUE REFERENCES lessons(id),
 teacher_id BIGINT NOT NULL REFERENCES teachers(id), gross INTEGER NOT NULL CHECK(gross >= 0), fee INTEGER NOT NULL CHECK(fee >= 0), net INTEGER NOT NULL CHECK(net >= 0 AND gross = fee + net),
 status TEXT NOT NULL DEFAULT 'reserved', payout_id TEXT REFERENCES teacher_payouts(id), completed_at TIMESTAMPTZ
);
CREATE INDEX tuition_usage_teacher_id_status_payout_id_idx ON tuition_usage(teacher_id,status,payout_id);
