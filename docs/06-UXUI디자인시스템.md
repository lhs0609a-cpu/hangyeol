# 06 · UX/UI 디자인 시스템

## 0. 설계 명제

> **한글은 발음기관을 본떠 조립되는 문자다.**
> 세계에서 유일하게 글자가 몸의 도해인 문자.
> 그러므로 이 인터페이스도 장식이 아니라 **획(劃)으로 짓는다.**

구분선·진행표시·로고·스텝퍼가 전부 선이고, 선은 전부 의미를 갖는다.
장식용 그라디언트·그림자·아이콘 남용 금지.

## 0.1 두 개의 레지스터

같은 제품이지만 사용자의 상태가 정반대다.

| | 강사 (콕핏) | 학생 (다이어리) |
|---|---|---|
| 상태 | 2분 뒤 카메라 앞 | 오늘 19분을 버티는 중 |
| 목표 | 생각 없이 수업에 진입 | 오늘치를 끝내고 내일 또 오기 |
| 캔버스 | `#FAFAFB` 차가운 회백 | `#F2F0EA` 한지 톤 |
| 밀도 | 고밀도. 한 줄에 4정보 | 한 화면에 한 가지 |
| 최대폭 | 1100px | 460px |
| 모션 | 최소 (120ms 상태 전환만) | 시그니처 1개 허용 |

타입 시스템은 **하나로 통일**해서 같은 제품임을 유지한다.

---

## 1. 컬러 토큰

한국 천연 염료 계열. AI 기본값(크림+테라코타, 검정+애시드그린)은 의도적으로 회피.

```css
/* 잉크 — 청색 기운이 도는 먹 */
--ink:        #14161C;
--ink-2:      #3B4254;
--ink-3:      #6B7284;
--ink-4:      #9BA1AF;

/* 선 */
--rule:       #E3E5EA;
--rule-soft:  #EFF0F3;

/* 캔버스 */
--canvas:     #FAFAFB;   /* 강사 */
--surface:    #FFFFFF;
--hanji:      #F2F0EA;   /* 학생 */
--hanji-card: #FBFAF7;
--hanji-rule: #E2DED2;

/* 쪽빛 — 주 강조 */
--indigo:     #26418F;
--indigo-2:   #3D5CCC;   /* 인터랙션 */
--indigo-w:   #EDF0FB;   /* 워시 */

/* 청자 — 성공 · 통과 */
--jade:       #1E7A5F;
--jade-w:     #E6F2ED;

/* 치자 — 경고 · 휴면 */
--chija:      #A9761A;
--chija-w:    #F7F0DF;

/* 홍화 — 오류 · 위험 */
--honghwa:    #B23A2E;
--honghwa-w:  #FAEBE8;
```

### 의미 매핑 (고정 · 변경 금지)

| 상태 | 색 |
|---|---|
| 활성 학생 · 통과 · 정답 | jade |
| 휴면 · 청구 없음 · 주의 | chija |
| 잠금 · 오답 · 기준 미달 | honghwa |
| 진행 중 · 선택됨 · 링크 | indigo |
| 중립 정보 | ink-3 / ink-4 |

**색만으로 의미를 전달하지 않는다.** 반드시 텍스트 라벨 또는 아이콘 병기(색각 이상 대응).

---

## 2. 타이포그래피

```css
--font-sans: 'IBM Plex Sans KR', system-ui, -apple-system, sans-serif;
--font-mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
```

**Noto Sans KR을 쓰지 않는다.** 모두가 쓰는 기본값이라 제품에 성격이 생기지 않는다.
IBM Plex Sans KR은 각진 종단부 때문에 "도구"처럼 읽힌다.

### 스케일

| 역할 | size / weight / tracking | 용도 |
|---|---|---|
| display | 38 / 500 / −.03em · mono | 청구 총액, 타이머 |
| h1 | 23 / 600 / −.02em | 화면 제목, 학생명(패널) |
| h2 | 17 / 600 / −.01em | 섹션 제목 |
| body-lg | 15 / 400 | 학습 예문 |
| body | 13.5 / 400 | 본문 기본 |
| body-sm | 12.5 / 400 | 보조 설명 |
| caption | 11.5 / 400 · ink-4 | 부가 정보 |
| eyebrow | 10 / 500 / .16em / UPPER · **mono** | 섹션 라벨 |
| data | 11–34 / 400–500 · **mono** | 모든 숫자 |

### 절대 규칙

```
· 숫자는 전부 mono. 차시·금액·비율·시간·통계 예외 없음.
  → 운영 도구의 성격을 드러내는 핵심 장치
· eyebrow 는 전부 mono + uppercase + letter-spacing .16em
· 한국어 본문에 letter-spacing 양수 금지 (가독성 저하)
· 학생 화면 최소 본문 13.5px, 강사 화면 최소 11px
```

---

## 3. 스페이싱 · 라운드

```
4 · 6 · 8 · 12 · 14 · 18 · 20 · 22 · 26 · 34 · 40   (4px 배수 기반, 시각 보정 포함)

radius
  3   태그
  5–6 작은 버튼 · 인풋 내부
  7–8 버튼 · 인풋 · 소형 카드
  10–11 패널 · 카드
  99  점 · 파일 · 진행바
```

그림자는 **한 종류만** 쓴다: `0 1px 2px rgba(20,22,28,.07)` (토글 선택 상태 전용).
카드에 그림자를 넣지 않는다. 구분은 1px 선으로 한다.

---

## 4. 컴포넌트

### 4.1 Panel

```
기본:  background surface, border 1px rule, radius 10, padding 20
dark:  background ink, border none        → 출발 패널 전용
warm:  background hanji-card, border 1px hanji-rule → 학생 화면 전용
```

### 4.2 Button

| kind | 배경 | 글자 | 용도 |
|---|---|---|---|
| primary | ink | #fff | 주 동작 |
| indigo | indigo | #fff | 학생 화면 주 동작 |
| ghost | surface + 1px rule | ink-2 | 보조 |
| quiet | 투명 | ink-3 | 뒤로가기 |

크기: 기본 `10px 16px / 13px` · sm `7px 12px / 12px`
비활성: ghost 스타일 + ink-4, cursor 유지 (disabled 커서 금지, 이유를 라벨에 쓴다)

> 버튼 라벨은 **결과를 말한다.** "제출" 금지 → "저장하고 학생에게 보내기"

### 4.3 Tag

```
높이 auto, padding 3px 7px, radius 3, mono 10px
톤: n(중립) / i(indigo) / j(jade) / c(chija) / h(honghwa)
배경 = 워시색, 글자 = 본색, 테두리 = 본색 15% 혼합
```

### 4.4 Eyebrow

섹션 라벨. mono · 10px · .16em · uppercase · ink-4.

### 4.5 Stepper (획 스텝퍼)

```
가로 균등 분할. 각 칸 = 높이 3px 막대 + mono 10px 라벨
완료/현재 = ink, 미도달 = rule
전환 background .3s
```

### 4.6 Strands 막대

```
4행. 각 행 = 라벨 + mono 수치 + 5px 막대
막대 폭 = value × 2 (%)  ← 25%가 중앙에 오도록
중앙에 1px × 11px 세로 획 = 균형점 25% 기준선
기준 이탈 시 수치를 honghwa + 600
하단 캡션: "중앙 획 = 균형점 25%"
```

### 4.7 SyllableProgress — **시그니처**

오늘 과제 4개가 '한' 글자를 획 단위로 완성한다.

```
viewBox 0 0 100 100, 외곽 rect radius 10 (자모 블록 은유)
6획을 4과제에 매핑: [0,0,1,2,2,3]

획 1  M30 13 H44        ㅎ 꼭지
획 2  M16 26 H56        ㅎ 가로획
획 3  circle 36,41 r13  ㅎ 원
획 4  M76 8 V60         ㅏ 세로획
획 5  M63 34 H76        ㅏ 짧은획
획 6  M16 66 V90 H84    ㄴ

stroke-width 7, linecap/linejoin round
완료: stroke ink, dashoffset 0, animation hg-write .5s ease-out (지연 = 과제index × .06s)
미완료: stroke hanji-rule, opacity .5, dashoffset = 전체 길이
```

**왜 링이 아닌가:** 한글이 조립되는 문자라는 사실 자체가 진도 표시가 된다. 부수 효과로 학생이 매일 초성·중성·종성 구조를 본다. 다른 제품은 이걸 못 쓴다.

### 4.8 LaunchPanel (출발 패널)

수업이 15분 이내로 들어오면 화면 최상단이 검은 패널로 전환된다.

```
background ink, radius 10
좌: 맥박 점(jade, hg-pulse 2s) + eyebrow "다음 수업 · 플랫폼"
    국기 + 학생명(23/600) + mono 보조정보
우: mono 34px 시각 + jade 11px "N분 뒤 시작"
하: 1px #262A35 구분선 → 지난 표현 태그 · 고칠 것
CTA: 흰 배경 + ink 글자, 폭 100%, 14px 세로 패딩
```

**근거:** 강사의 일은 이 순간 이진값이다 — 가르치기 직전이거나, 아니거나. 다른 정보는 전부 물러나야 한다.

### 4.9 SlideViewer

```
aspect-ratio 16/9, background canvas
우하단 워터마크: mono 9.5px, ink-4, opacity .8
   "{학생명} · {강사명} · {날짜} · 다운로드 불가"
user-select: none / -webkit-user-drag: none
컨텍스트 메뉴 · Ctrl+S · Ctrl+P 차단
```

---

## 5. 레이아웃

### 강사

```
sticky header 54px (surface, 1px rule, backdrop-blur 8px)
  좌: 로고(획 SVG) + 서비스명 · 내비 [오늘][청구]
  우: 역할 토글
main max-width 1100, padding 26px 20px 70px

학생 목록 행: grid  minmax(150px,1.5fr) 1fr 1fr auto
반응형 <760px: 카드형 2행 스택으로 전환
```

### 학생

```
header 54px (hanji 배경)
  우측에 mono 10px "화이트라벨" 표시는 데모 전용 — 실서비스 제거
main max-width 460, 중앙 정렬, 세로 gap 26
```

---

## 6. 모션

```css
@keyframes hg-write { to { stroke-dashoffset: 0 } }
@keyframes hg-rise  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
@keyframes hg-pulse { 0%,100%{opacity:.35} 50%{opacity:1} }

.hg-rise { animation: hg-rise .28s cubic-bezier(.2,.7,.3,1) both }
.hg-tap  { transition: transform .12s cubic-bezier(.2,.7,.3,1), background .12s, border-color .12s, color .12s }
.hg-tap:active { transform: scale(.985) }
```

**규칙**
```
· 오케스트레이션 모먼트는 딱 하나 — 획이 그어지는 순간
· 나머지는 전부 120~280ms 상태 전환
· 페이지 전체 페이드·슬라이드 금지
· prefers-reduced-motion 시 전부 0.01ms
```

---

## 7. 접근성 (릴리즈 게이트)

```
□ 본문 대비 4.5:1 이상, 큰 글씨 3:1 이상
□ :focus-visible → 2px indigo-2 아웃라인, offset 2px
□ 색만으로 의미 전달하는 곳 없음 (전부 텍스트 병기)
□ HVPT 정답/오답은 색 + 문구 + 테두리 3중 표기
□ 모든 인터랙션 요소 키보드 도달 가능
□ SVG 진도에 aria-label
□ prefers-reduced-motion 적용
□ 학생 화면 320px 폭에서 깨지지 않음
□ 터치 타겟 최소 44×44
```

---

## 8. 보이스 · 카피

```
· 버튼은 결과를 말한다
  ✕ 제출        ○ 저장하고 학생에게 보내기
  ✕ 확인        ○ 통과 — 다음 차시 열기

· 오류는 사과하지 않고 다음 행동을 말한다
  ✕ 죄송합니다. 오류가 발생했습니다
  ○ 학생 이메일 인증이 필요합니다. 인증 링크를 다시 보내세요

· 빈 화면은 초대다
  ○ 예약이 잡혔는데 목록에 없나요 — 새 학생 등록 · 30초

· 시스템 용어 금지. 사용자가 아는 말로
  ✕ 사이클 종료 배치     ○ 28일 주기가 끝났습니다

· 문장부호: 마침표는 두 문장 이상일 때만. 라벨에는 안 쓴다
· 숫자와 단위 사이 공백 없음 (14,900원 / 28일 / 47%)
```

### 학생 화면 금지어

```
사맛 · 한결(옛 이름) · 플랫폼 · 구독 · 결제 · 요금 · 예약 · 강사 검색
→ 화이트라벨. 학생에게는 "○○ 선생님의 학습 노트"만 존재한다
```

---

## 9. 아이콘

전용 아이콘 세트를 쓰지 않는다. 필요한 것은 **획으로 그린다.**

```
로고	훈민정음 해례본에서 떠 온 通 자를 벡터화한 패스
        (primitives.tsx 의 TONG_PATH · viewBox 0 0 100 100 · fill-rule evenodd)
        원문 「不相流通」 의 通 = 통하다. 이름이 나온 문장에서 글자를 그대로 뗐다
        currentColor 로 칠한다 — 먹 구간에서 흰색으로 뒤집힌다 (D-005)
재생     ▶ (텍스트)
완료     ✓ (텍스트)
맥박     원 + hg-pulse
```

이모지는 국기(학생 모국)에만 허용. 그 외 UI에 이모지 금지.
