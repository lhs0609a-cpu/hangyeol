# 04 · API 명세

- Base: `https://api.hangyeol.app/v1`
- 인증: 강사 = Bearer JWT (access 30분 / refresh 30일) · 학생 = 매직링크 세션 쿠키
- 모든 시각 필드는 **ISO8601 UTC** (`2026-08-27T05:00:00Z`)
- 금액은 정수 KRW

## 공통 에러

```json
{ "error": { "code": "STUDENT_NOT_VERIFIED", "message": "…", "detail": {} } }
```

| HTTP | code | 상황 |
|---|---|---|
| 400 | VALIDATION_FAILED | 입력 검증 실패 |
| 401 | UNAUTHENTICATED | 토큰 없음/만료 |
| 403 | STUDENT_NOT_VERIFIED | 미인증 학생이 4차시 이상 자료 요청 |
| 403 | TEACHER_LOCKED | 결제 미납으로 잠금 |
| 403 | STUDENT_REQUIRED | 학생 컨텍스트 없이 자료 요청 |
| 404 | NOT_FOUND | — |
| 409 | DUPLICATE_STUDENT | 동일 이메일 존재 (기존 레코드 반환) |
| 422 | REPORT_LIMIT | 표현 5개 / 오답 3개 초과 |
| 429 | RATE_LIMITED | — |

---

## A. 인증

```
POST   /auth/signup            {email, password, name}
POST   /auth/login             {email, password} → {access, refresh, teacher}
POST   /auth/refresh           {refresh}
POST   /auth/verify-email      {token}
POST   /auth/logout
```

### 학생 (비밀번호 없음)

```
POST   /student-auth/magic-link   {student_token}     → 이메일 발송
GET    /student-auth/verify?t=… → 세션 쿠키 설정, student_activity(kind='verify') 기록
```

---

## B. 강사 프로필

```
GET    /me
PATCH  /me                  {name, timezone, spoken_langs, phone}
PATCH  /me/rate             {hourly_rate_usd, platform}
       → rate_tier 재산정. 응답에 next_cycle_price 포함
PATCH  /me/platforms        {italki_profile_url, italki_status, preply_…}
GET    /me/onboarding       → 단계별 체크리스트
```

**PATCH /me/rate 응답**
```json
{
  "hourly_rate_usd": 18.00,
  "rate_tier": "B",
  "current_cycle_price": 14900,
  "next_cycle_price": 14900,
  "note": "요금 변경은 다음 28일 주기부터 적용됩니다"
}
```

---

## C. 학생

```
GET    /students?status=&platform=&q=&page=
POST   /students
GET    /students/:id
PATCH  /students/:id
POST   /students/:id/resend-invite
POST   /students/:id/complete       과정 종료 → completed
POST   /students/:id/level-test     레벨 배정 결과 저장
```

**POST /students**
```json
{
  "name": "Maria Santos",
  "name_ko": "마리아",
  "email": "maria@example.com",
  "l1_code": "es",
  "country_code": "ES",
  "platform": "preply",
  "platform_url": "https://preply.com/…",
  "goal_track": "kcontent"
}
```
응답 `201`
```json
{
  "id": 1042,
  "status": "pending",
  "note_url": "https://note.hangyeol.app/s/xxxxx",
  "billing": { "charged_now": 0, "first_charge_at_lesson": 2 }
}
```
동일 email_hash 존재 시 `409` + 기존 레코드 반환 (**새 과금 없음**).

**GET /students/:id** 응답 요약
```json
{
  "id": 1042, "name_ko": "마리아", "flag": "ES",
  "status": "active", "verified_at": "2026-08-01T…",
  "level_code": "topik1", "current_lesson_no": 14,
  "speak_ratio_avg": 47, "vocab_count": 218, "streak_days": 12,
  "strands": {"input":21,"output":30,"form":27,"fluency":22},
  "strand_warnings": ["fluency_below_25","input_below_target"],
  "focus": "ㅓ/ㅗ 구분 · 을/를 누락",
  "last_report": {
    "expressions": ["-고 싶어요","그런데","-아/어 주세요"],
    "errors": ["학교를 갔어요 → 학교에 갔어요"]
  },
  "billing": { "cycle_no": 3, "period_end": "2026-09-06T…", "amount": 14900 }
}
```

---

## D. 수업

```
GET    /lessons/today                     오늘 예정 + imminent 플래그
POST   /lessons                           수업 시작
GET    /lessons/:id/prep                  지난 기록 + 복습 슬라이드 항목
POST   /lessons/:id/outcome               {outcome: "pass"|"repeat"}
POST   /lessons/:id/report                리포트 제출
POST   /lessons/:id/speak-ratio           {ratio: 0-100}   볼륨 기반, 음성인식 아님
GET    /lessons?student_id=&page=
```

**GET /lessons/today**
```json
{
  "items": [
    { "student_id": 1042, "name_ko": "마리아", "flag":"ES",
      "next_lesson_no": 15, "level_code": "topik1", "l1_code": "es",
      "scheduled_at": "2026-08-27T05:00:00Z", "minutes_until": 8,
      "imminent": true,
      "prev": { "expressions": ["-고 싶어요","그런데","-아/어 주세요"],
                "error": "학교를 갔어요 → 학교에 갔어요",
                "srs_completion": 0.33 } }
  ]
}
```
`imminent` = `minutes_until <= 15`. 프론트는 이때 출발 패널로 전환.

**POST /lessons** → `{ "lesson_id": 8801, "unit_id": 15, "billing": {"cycle_opened": false} }`
2차시 진입이면 `cycle_opened: true` 와 `amount` 를 함께 반환.

**POST /lessons/:id/report**
```json
{
  "expressions": ["-고 싶어요", "그런데", "-아/어 주세요"],
  "errors": ["학교를 갔어요 → 학교에 갔어요"],
  "outcome": "pass"
}
```
응답
```json
{
  "ok": true,
  "vocab_created": 3,
  "srs_scheduled": ["2026-08-28","2026-08-30","2026-09-03","2026-09-17","2026-10-26"],
  "next_review_slides": 3,
  "external_api_calls": 0
}
```
검증: expressions 1~5, errors 0~3, 초과 시 `422 REPORT_LIMIT`.

---

## E. 커리큘럼 자산 (뷰어)

```
GET    /units/:unitId/assets?student_id=&l1=      자산 목록 (서명 URL)
GET    /units/:unitId/slides?student_id=          슬라이드 페이지 데이터
POST   /assets/:assetId/view                      열람 로그 기록
```

**필수 규칙**

```
· student_id 파라미터 없으면 403 STUDENT_REQUIRED
· student.status='pending' AND current_lesson_no >= 4 → 403 STUDENT_NOT_VERIFIED
· teacher.billing_status='locked' → 403 TEACHER_LOCKED
· 응답 URL 은 TTL 300초 서명 URL. 정적 경로 절대 노출 금지
· 응답에 watermark 객체 필수 포함
```

```json
{
  "unit_id": 15,
  "goal_statement": "카페에서 주문하고 추가 요청까지 말할 수 있다",
  "l1_code": "es",
  "pages": [ { "no": 1, "url": "https://cdn…?sig=…&exp=…" } ],
  "watermark": {
    "line": "Maria Santos · 이지은 · 2026-08-27",
    "note": "다운로드 불가"
  }
}
```

---

## F. 학생 학습노트 (화이트라벨)

**응답 어디에도 서비스명·강사 외 브랜드가 포함되면 안 된다.**

```
GET    /note/home                     오늘 과제 + 진도 + 지난 수업
GET    /note/srs/due                  오늘 복습 카드
POST   /note/srs/:cardId/grade        {grade: "hard"|"good"|"easy"}
GET    /note/hvpt/contrasts           대립쌍 목록 (L1 우선순위 반영)
GET    /note/hvpt/next?contrast=      다음 문항 (토큰 + 화자 + 음원 URL)
POST   /note/hvpt/attempt             {token_id, chosen, response_ms}
POST   /note/fluency/round            {round: 1|2|3}
GET    /note/listening                다청 목록
POST   /note/listening/:id/progress   {played_sec, completed}
GET    /note/progress                 진도 대시보드
GET    /note/vocab?page=              개인 단어장
```

**GET /note/home**
```json
{
  "teacher_display_name": "이지은",
  "student_name_ko": "마리아",
  "streak_days": 12,
  "syllable_progress": { "done": 2, "total": 4 },
  "tasks": [
    {"id":"srs","label":"복습 카드","sub":"-고 싶어요 외 2개","minutes":3,"done":true},
    {"id":"hvpt","label":"소리 구분","sub":"ㄱ · ㅋ · ㄲ","minutes":4,"done":true},
    {"id":"fluency","label":"4·3·2 말하기","sub":"주말에 뭐 했어요?","minutes":9,"done":false},
    {"id":"listening","label":"그냥 듣기","sub":"주말에 뭐 했어요? · 2급","minutes":3,"done":false}
  ],
  "last_lesson": {
    "date": "2026-08-24",
    "expressions": ["-고 싶어요","그런데","-아/어 주세요","아직","메뉴"],
    "correction": {"before":"학교를 갔어요","after":"학교에 갔어요"}
  },
  "progress": {
    "topik_estimate": "topik1→topik2",
    "vocab_total": 218,
    "hvpt_score": {"from": 62, "to": 79},
    "speak_ratio": {"from": 31, "to": 47}
  }
}
```

**GET /note/hvpt/next**
```json
{
  "token_id": 9931,
  "contrast_id": "g3",
  "choices": ["개","캐","깨"],
  "talker_idx": 5,
  "audio_url": "https://cdn…/hvpt/g3/kae_t5_isolated.mp3?sig=…",
  "context": "isolated"
}
```
출제 규칙: 동일 talker_idx 연속 2회 금지 · 세션당 화자 8명 전원 최소 1회 · 음원은 **사전 생성 캐시만** 사용(런타임 TTS 호출 금지).

**POST /note/hvpt/attempt** 응답
```json
{ "correct": false, "answer": "깨", "replay_url": "https://cdn…?sig=…", "session": {"attempts": 7, "correct": 5} }
```
서버는 매 호출마다 `student_activity(kind='hvpt')` 를 기록한다.

---

## G. 과금

```
GET    /billing/summary              이번 달 예정 청구 + 학생별 라인
GET    /billing/invoices?page=
GET    /billing/invoices/:id
POST   /billing/card                 {pg_billing_key}
POST   /billing/credits/topup        {amount}
GET    /billing/pricing              티어 표 + 현재 적용 티어
```

**GET /billing/summary**
```json
{
  "billing_month": "2026-09-01",
  "total": 47400,
  "credit_balance": 0,
  "charge_amount": 47400,
  "active_count": 4,
  "lines": [
    {"student_id":1042,"name_ko":"마리아","amount":14900,"note":"14→18차시"},
    {"student_id":1043,"name_ko":"미사키","amount":14900,"note":"22→26차시"},
    {"student_id":1045,"name_ko":"민","amount":7900,"note":"6→9차시"},
    {"student_id":1046,"name_ko":"루카스","amount":9700,"note":"3→5차시 · 볼륨 할인"}
  ],
  "waived": [
    {"student_id":1044,"name_ko":"사라","reason":"28일간 수업 없음 · 휴면"}
  ]
}
```

---

## H. 창구 모니터

```
GET    /langgate/status              현재 italki 한국어 오픈 여부 + 최근 변화 이력
POST   /langgate/subscribe           {email}   비로그인도 허용 (리드 자석)
```

```json
{ "platform":"italki", "lang":"ko", "is_open": false,
  "checked_at":"2026-08-26T…", "last_open_at":"2026-07-14T…",
  "history":[{"date":"2026-07-14","open":true},{"date":"2026-07-21","open":false}] }
```

---

## I. 관리자

```
GET    /admin/metrics
GET    /admin/teachers?flag=
GET    /admin/flags                  우회 의심 목록 (자동 제재 없음)
POST   /admin/units                  커리큘럼 유닛 CRUD
POST   /admin/tts/generate           시나리오·HVPT 음원 배치 생성 (수동 트리거)
```

---

## J. 웹훅 (PG)

```
POST   /webhooks/pg/payment          결제 결과 수신
```
멱등키: `pg_tid`. 중복 수신 시 무시. 서명 검증 필수.

---

## K. 레이트 리밋

| 대상 | 제한 |
|---|---|
| 로그인 | 10회 / 10분 / IP |
| 매직링크 발송 | 5회 / 시간 / 학생 |
| 자산 서명 URL 발급 | 120회 / 분 / 강사 |
| HVPT next | 300회 / 분 / 학생 |
| 일반 | 600회 / 분 / 토큰 |
