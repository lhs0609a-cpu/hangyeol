-- 09번 문서 §4 — 개인정보 동의와 철회.
--
-- 강사 확인(teacher_consent_at)과 학생 본인 동의(consent_at)를 따로 둔다.
-- 강사는 남의 정보를 대신 입력하고, 학생은 그 사실을 모른 채 등록될 수 있다.
-- 기존 학생은 둘 다 NULL 로 남는다 — 학습노트 첫 진입에서 다시 받는다.
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS teacher_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS consent_locale TEXT,
  ADD COLUMN IF NOT EXISTS withdraw_requested_at TIMESTAMPTZ;

-- 파기 배치가 매번 전건을 훑지 않도록. 값이 있는 행만 인덱스에 들어간다.
CREATE INDEX IF NOT EXISTS idx_students_withdraw
  ON students(withdraw_requested_at)
  WHERE withdraw_requested_at IS NOT NULL;

-- 강사 탈퇴 표시. 09번 §4 "학생 데이터는 강사 탈퇴 후 90일".
-- 즉시 지우지 않고 기한을 세기 위한 시각이다.
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_teachers_withdrawn
  ON teachers(withdrawn_at)
  WHERE withdrawn_at IS NOT NULL;
