# 표식과 서문 이미지를 뜨는 방법

빌드에 들어가지 않는다. 자산을 **다시 뜰 때만** 쓰는 일회성 스크립트다.
결과물은 이미 저장소에 있으므로 평소에는 실행할 일이 없다.

그런데도 남겨 두는 이유: 좌표와 임계값이 이 파일에만 있다.
없으면 다음 사람이 "이 通 자를 어디서 어떻게 떴는지" 를 처음부터 다시 찾아야 한다.

## 원본

| | |
|---|---|
| 파일 | `Hunminjeongeum_Haerye_02.jpg` (1920×1280) |
| 출처 | https://commons.wikimedia.org/wiki/File:Hunminjeongeum_Haerye_02.jpg |
| 소장 | 서울대학교 규장각한국학연구원 |
| 라이선스 | `PD-1923` · `PD-South Korea` — 저작권 소멸 |

> **주의** 같은 문서라도 촬영물마다 라이선스가 다르다.
> 국립한글박물관 전시 사진(`훈민정음 해례본 (1).jpg`, 5312×2988)은 해상도가
> 훨씬 좋지만 **CC BY-SA 4.0** 이라 로고에 쓰면 동일조건변경허락이 파생물에 전염된다.
> 반드시 PD 태그가 붙은 판본만 쓴다. 판단 기록은 `licenses.ts` 의
> `hunminjeongeum-haerye-scan` 과 12번 D-005 에 있다.

## 실행

파이썬과 opencv 가 필요하다. 이 저장소의 의존성이 아니라 이 스크립트만의 것이다.

```bash
pip install opencv-python numpy pillow
cd <원본 jpg 가 있는 디렉터리>
python <저장소>/tools/mark/trace-tong.py       # → tong_path_*.txt
python <저장소>/tools/mark/cutout-preface.py   # → hunmin_nukki.png
```

## 나오는 것

| 스크립트 | 결과 | 어디로 |
|---|---|---|
| `trace-tong.py` | 通 자의 SVG 패스 문자열 | `packages/ui/src/primitives.tsx` 의 `TONG_PATH` |
| `cutout-preface.py` | 서문 광곽 누끼 (알파 PNG) | `apps/teacher/public/photos/hunmin-preface.png` |

`cutout-preface.py` 의 결과는 1212×1616 이다. 저장소에는 900px 폭으로 줄여
`sharp` 로 팔레트 압축한 것(158KB)이 들어 있다.

## 손대게 될 값들

```
trace-tong.py
  BOX      通 자의 위치. 다른 판본을 쓰면 다시 재야 한다
  eps      윤곽 단순화. 0.0025 를 골랐다 —
           더 줄이면(0.004) 목판 특유의 삐뚤함이 사라져 명조체처럼 보인다.
           그 삐뚤함이 이 표식의 전부다

cutout-preface.py
  BOX      광곽(테두리) 바깥 경계
  LO, HI   종이를 투명하게, 먹을 불투명하게 만드는 구간
  redness  장서인을 지우는 기준.
           붉다는 이유만으로 지우면 도장 아래 글자까지 파인다 —
           실제로 우하단 '字' 가 그렇게 됐었다.
           그래서 "붉고, 그러면서 먹만큼 진하지 않은" 화소만 지운다
```

## 이진화하지 않는 이유

`cutout-preface.py` 는 알파에 계조를 남긴다. 이진화하면 획 끝의 갈필이
사라져서 목판이 아니라 폰트처럼 보인다. 종이만 지우고 먹의 농담은 살린다.
