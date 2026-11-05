"""Lee límites alfa de las celdas sin alterar la imagen generada."""
import json
import sys
from collections import deque
from PIL import Image

image = Image.open(sys.argv[1]).convert("RGBA")
columns, rows = int(sys.argv[2]), int(sys.argv[3])
alpha = image.getchannel("A").tobytes()
visited = bytearray(len(alpha))
components = []
for seed in range(len(alpha)):
    if visited[seed] or alpha[seed] <= 16:
        continue
    queue, points = deque([seed]), []
    visited[seed] = 1
    while queue:
        position = queue.popleft()
        points.append(position)
        x, y = position % image.width, position // image.width
        neighbours = ([position - 1] if x else []) + ([position + 1] if x < image.width - 1 else []) + ([position - image.width] if y else []) + ([position + image.width] if y < image.height - 1 else [])
        for other in neighbours:
            if not visited[other] and alpha[other] > 16:
                visited[other] = 1
                queue.append(other)
    if len(points) > 1000:
        components.append(points)
if len(components) != columns * rows:
    raise ValueError("Cada pose debe formar una silueta conectada, incluida la espada.")
components.sort(key=lambda points: min(position // image.width for position in points))
ordered = []
for row in range(rows):
    ordered.extend(sorted(components[row * columns:(row + 1) * columns], key=lambda points: min(position % image.width for position in points)))
cells = []
for points in ordered:
    left = max(0, min(position % image.width for position in points) - 2)
    top = max(0, min(position // image.width for position in points) - 2)
    right = min(image.width, max(position % image.width for position in points) + 3)
    bottom = min(image.height, max(position // image.width for position in points) + 3)
    scanlines = {}
    for position in points:
        y, x = divmod(position, image.width)
        scanlines.setdefault(y, []).append(x)
    spans = []
    for y, xs in scanlines.items():
        xs.sort()
        start = end = xs[0]
        for x in xs[1:]:
            if x > end + 1:
                spans.append([y - top, start - left, end - left])
                start = x
            end = x
        spans.append([y - top, start - left, end - left])
    cells.append({"x": left, "y": top, "width": right - left, "height": bottom - top, "spans": spans})
print(json.dumps(cells))
