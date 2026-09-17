-- 09번 문서 §6 — 관리자 2단계 인증(TOTP).
--
-- 관리자 판정은 여전히 ADMIN_EMAILS 가 한다. 이 컬럼들은 그 사람이
-- 관리자 화면에 들어올 때 통과해야 하는 두 번째 관문의 상태다.
-- 시크릿은 AES-256-GCM 으로 싸서 넣는다(students.email_enc 와 같은 형식).
ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS admin_totp_secret BYTEA,
  ADD COLUMN IF NOT EXISTS admin_totp_enrolled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_totp_last_step BIGINT;
