# -*- coding: utf-8 -*-
"""해례본 어제 서문 광곽을 통째로 누끼 딴다.

로고(通)는 벡터로 뽑았지만 이건 글자가 100자 가까이라 벡터로 만들면
패스가 수십만 자가 된다. 그래서 알파 PNG 로 만든다.

종이를 지우고 먹만 남기면 어느 바닥색 위에도 얹을 수 있다 —
한지 구간에도, 먹 구간에도 같은 파일 하나로 간다.
"""
import cv2
import numpy as np
from PIL import Image

SRC = 'haerye02.jpg'
# 광곽(테두리) 안쪽 본문. block_grid.png 로 재서 잡았다.
BOX = (330, 288, 936, 1096)

img = cv2.imread(SRC, cv2.IMREAD_GRAYSCALE)
x0, y0, x1, y1 = BOX
g = img[y0:y1, x0:x1]
print('원본 크롭', g.shape[::-1])

# 2배로 키운다. 원본이 작아서 그대로 쓰면 화면에서 흐리다
g = cv2.resize(g, (g.shape[1] * 2, g.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)

# 종이의 얼룩과 그림자를 지운다.
# 큰 커널로 흐린 배경을 만들어 나누면 조명 불균일이 사라진다 —
# 그냥 임계값을 걸면 페이지 가장자리 그늘이 통째로 먹으로 남는다.
bg = cv2.medianBlur(g, 151)
flat = cv2.divide(g, bg, scale=255)

# 먹의 진하기를 알파로 쓴다. 이진화하면 획 끝의 갈필이 사라져
# 목판 느낌이 죽는다 — 그래서 계조를 남긴다.
alpha = 255 - flat
alpha = cv2.normalize(alpha, None, 0, 255, cv2.NORM_MINMAX)

# 종이 결(옅은 회색)을 바닥으로 눌러 투명하게 만든다.
LO, HI = 60, 165
a = np.clip((alpha.astype(np.float32) - LO) * (255.0 / (HI - LO)), 0, 255).astype(np.uint8)

# 붉은 도장은 먹이 아니다. 그런데 도장이 글자 위에 겹쳐 찍힌 자리가 있어서,
# 붉다는 이유만으로 지우면 그 아래 글자까지 파인다(우하단 '字' 가 그랬다).
# 그래서 두 조건을 함께 본다 — 붉고, 그러면서 먹만큼 진하지 않은 화소만 지운다.
color = cv2.imread(SRC)[y0:y1, x0:x1]
color = cv2.resize(color, (a.shape[1], a.shape[0]), interpolation=cv2.INTER_LANCZOS4)
b, gg, r = color[:, :, 0].astype(np.int16), color[:, :, 1].astype(np.int16), color[:, :, 2].astype(np.int16)
redness = r - (gg + b) // 2          # 붉은 정도
ink = flat < 120                      # 먹으로 볼 만큼 진한가
seal = (redness > 28) & ~ink
a[seal] = 0
print('도장으로 지운 화소', int(seal.sum()), '/ 먹으로 지켜낸 화소', int((redness > 28).sum() - seal.sum()))

out = np.zeros((a.shape[0], a.shape[1], 4), np.uint8)
out[:, :, 0:3] = 20, 22, 28          # --ink. 어느 바닥에서도 이 색으로 찍힌다
out[:, :, 3] = a
Image.fromarray(out, 'RGBA').save('hunmin_nukki.png')
print('저장', out.shape[1], 'x', out.shape[0])

# 확인용 — 한지색과 먹색 위에 각각 얹어 본다
for name, bgc in [('on_hanji', (242, 240, 234)), ('on_ink', (20, 22, 28))]:
    base = Image.new('RGB', (out.shape[1], out.shape[0]), bgc)
    fg = Image.fromarray(out, 'RGBA')
    if name == 'on_ink':
        w = np.zeros_like(out)
        w[:, :, 0:3] = 255
        w[:, :, 3] = a
        fg = Image.fromarray(w, 'RGBA')
    base.paste(fg, (0, 0), fg)
    base.resize((base.width // 2, base.height // 2)).save(f'check_{name}.png')
print('확인 이미지 저장')
