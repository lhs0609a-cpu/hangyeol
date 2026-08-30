# 한결 (Hangyeol)

한국어 강사가 italki·Preply에서 더 잘 가르치게 만들고, 그 학생의 실력을 실제로 올리는 도구.

명세는 [`docs/`](./docs) 에 있다. 읽는 순서는 [`docs/00-INDEX.md`](./docs/00-INDEX.md).

## 배포

| | |
|---|---|
| 저장소 | https://github.com/lhs0609a-cpu/hangyeol |
| Vercel 프로젝트 | `fewfs-projects-83cc0821/hangyeol` |
| 프로덕션 | https://hangyeol-8za1g1i1a-fewfs-projects-83cc0821.vercel.app |

`main` 에 push 하면 자동 배포된다. 빌드 설정은 루트 [`vercel.json`](./vercel.json) 에 있고,
워크스페이스 루트에서 `apps/teacher` 를 빌드한다.

> 현재 배포본은 Vercel Deployment Protection 이 켜져 있어 팀 계정으로 로그인해야 열린다.
> 공개하려면 프로젝트 Settings → Deployment Protection 에서 끈다.

---

## 현재 진행 상황

| 스프린트 | 내용 | 상태 |
|---|---|---|
| S1 | 인프라 · 인증 · DB 스키마 · 강사 가입/프로필/시급 | 스키마 · 배포 파이프라인 완료. 인증·API 미착수 |
| S2 | 학생 레코드 CRUD · 이메일 인증 · 중복 병합 | 도메인 규칙만 구현 |
| S3 | 슬라이드 뷰어 · 워터마크 · 서명 URL · 열람 로그 | 미착수 |
| **S4** | **과금 엔진 + TC 14개** | **완료** |
| S5~S8 | 수업 플로우 · 학습노트 · 결제 · 디자인 | 미착수 |

우선순위는 11번 문서를 따른다. **콘텐츠보다 잠금장치가 먼저다.**

---

## 구조

```
packages/
  shared/     타입 · UTC 시각 유틸 · 정수 KRW      ← 제약 C4
  billing/    과금 엔진 (05번 문서 구현체)          ← 순수 함수, DB 없음
  db/         Prisma 스키마 (03번 문서 구현체)
apps/
  teacher/    Next.js · T-01 오늘 화면 (목업 데이터, Vercel 배포 대상)
              note / admin / api 는 미착수
tools/        watermark / tts-batch / langgate    ← 미착수
docs/         명세 11종
```

`packages/billing` 에는 DB도 시계도 없다. 모든 함수가 `now` 를 인자로 받는다.
그래야 05번 문서의 TC 14개를 초 단위로 돌릴 수 있고, 배치 지연 시나리오를 그대로 재현할 수 있다.

---

## 시작하기

```bash
npm install
npm test              # 과금 TC-01~14 + 시각 유틸
npm run typecheck
```

DB 를 붙일 때:

```bash
cp .env.example .env  # DATABASE_URL 채우기
npm run -w @hangyeol/db generate
npm run -w @hangyeol/db migrate:dev
```

---

## 이 코드베이스에서 지켜야 하는 것

11번 문서의 출시 기준과 10번 문서의 제약에서 나온 규칙이다. 여기를 어기면 사업이 깨진다.

1. **금액은 정수 KRW.** `Decimal`·`Float` 금지. `assertKrw` 로 막아둔다.
2. **시각은 전부 UTC.** 28일은 정확히 28×24시간이다. 달력 연산 금지.
3. **주기 연속성.** 새 주기의 `period_start` 는 직전 `period_end` 다. `now()` 를 쓰면
   배치 지연만큼 주기가 밀려 연간 청구 횟수가 줄어든다.
4. **배치는 멱등.** 재실행해도 결과가 같아야 한다. `closeCycle` 은 이미 닫힌 주기를
   그대로 돌려준다.
5. **런타임 TTS 금지.** 음원은 전부 사전 생성. 학생 수에 비례하는 종량과금을 만들지 않는다.
6. **자료 열람에는 반드시 `student_id`.** 학생 없이 자료를 여는 경로는 존재하지 않는다.
7. **학생 앱(`apps/note`)에 브랜드 문자열 금지.** 빌드 파이프라인에서 grep 검사로 막는다.

PR 체크리스트에 "새 종량과금 API 추가 여부" 항목을 넣는다. 있으면 반려.

---

## 명세와 다르게 구현한 것

| 위치 | 내용 | 이유 |
|---|---|---|
| `students.status_before_lock` | 03번 문서에 없는 컬럼을 추가 | 05번 §6 "결제 성공 시 직전 상태로 복원" 을 구현하려면 잠금 직전 상태를 보관해야 한다. 없으면 dormant·completed 학생까지 active 로 되살아난다 |

### 명세 자체의 확인 필요 사항

- **05번 §5 예시의 볼륨 할인 금액.** 화면 예시에 "루카스 9,700원 · 볼륨 할인" 이라고
  적혀 있는데, 어느 티어에도 20% 차감으로 9,700원이 나오지 않는다
  (A 7,900→6,320 / B 14,900→11,920). 구현은 문서 §3.1 의 계산식을 따랐다.
  예시 숫자가 오기인지 확인 필요.

- **활성 판정 (A) 조건이 두 문서에서 다르다. 매출에 직결된다.**

  | 문서 | (A) 조건 |
  |---|---|
  | 05번 §3.2 (과금엔진) | 주기 내 `lessons` 레코드 ≥ 1 |
  | 02번 E-02 (기능명세) | 주기 내 **자료 열람** ≥ 1 |

  "수업은 했지만 자료를 안 연" 주기의 청구 여부가 갈린다.
  구현은 **05번을 따랐다**(`isCycleActive` 는 `lessonCount` 를 본다). 근거:
  05번이 스스로 "이 문서의 로직이 곧 매출"이라 선언했고, TC-05 가 "주기 내 수업 0회"
  기준이며, 03번 `billing_cycles` 에 열람 카운트 컬럼이 없다.
  02번 E-02 가 오기로 보이나 확인 필요.
