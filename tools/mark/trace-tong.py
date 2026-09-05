# -*- coding: utf-8 -*-
"""훈민정음 해례본의 通 자를 누끼 따서 SVG 패스로 바꾼다.

원본은 84x82px 목판 인쇄본 스캔이다. 그대로 확대하면 종이 결과 잉크 번짐이
같이 커져서 지저분해진다. 그래서 먼저 크게 늘려 매끄럽게 만든 뒤
윤곽선만 따고, 종이는 버린다.
"""
import cv2
import numpy as np

SRC = 'haerye02.jpg'
BOX = (679, 511, 753, 583)  # 通 의 위치. 좌표는 block_grid.png 로 재서 잡았다
UP = 10                      # 확대 배수. 윤곽을 부드럽게 따려고 먼저 키운다

img = cv2.imread(SRC, cv2.IMREAD_GRAYSCALE)
x0, y0, x1, y1 = BOX
g = img[y0:y1, x0:x1]

# 1) 확대. LANCZOS 가 목판 글자의 각을 가장 덜 뭉갠다
g = cv2.resize(g, (g.shape[1] * UP, g.shape[0] * UP), interpolation=cv2.INTER_LANCZOS4)

# 2) 종이 결 제거. 글자 획보다 훨씬 가는 노이즈만 지운다
g = cv2.bilateralFilter(g, 15, 60, 60)

# 3) 이진화. 종이가 균일하지 않아 Otsu 로 자동 임계값을 잡는다
_, bw = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

# 4) 자잘한 얼룩과 획 안의 구멍을 정리한다
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
bw = cv2.morphologyEx(bw, cv2.MORPH_OPEN, k)
bw = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, k)

# 5) 티끌 제거 — 글자 획이 될 수 없는 작은 덩어리를 버린다
n, lab, stats, _ = cv2.connectedComponentsWithStats(bw, 8)
keep = np.zeros_like(bw)
MIN = (bw.shape[0] * bw.shape[1]) * 0.0015
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] >= MIN:
        keep[lab == i] = 255
bw = keep

cv2.imwrite('tong_mask.png', bw)

# 6) 윤곽선 추출. 획 안의 구멍(通 의 用 부분)도 살려야 하므로 계층 구조를 쓴다
contours, hier = cv2.findContours(bw, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)

H, W = bw.shape
paths = []
for c in contours:
    if cv2.contourArea(c) < MIN:
        continue
    # 점을 줄인다. 너무 줄이면 목판 특유의 삐뚤함이 사라져 폰트처럼 보인다
    eps = 0.0012 * cv2.arcLength(c, True)
    a = cv2.approxPolyDP(c, eps, True).reshape(-1, 2)
    pts = [f'{x / W * 100:.2f},{y / H * 100:.2f}' for x, y in a]
    paths.append('M' + 'L'.join(pts) + 'Z')

d = ''.join(paths)
print('윤곽 수', len(paths))
print('패스 길이', len(d), '자')
open('tong_path.txt', 'w').write(d)

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">'
    f'<rect width="100" height="100" fill="#f2f0ea"/>'
    f'<path d="{d}" fill="#14161c" fill-rule="evenodd"/></svg>'
)
open('tong.svg', 'w').write(svg)
print('viewBox 0 0 100 100 기준으로 정규화 완료')
