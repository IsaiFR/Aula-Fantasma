"""Convierte la imagen suministrada, ya opaca sobre negro, a iconos de la app."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / "assets"
image = Image.open(assets / "icon-source.png")
assert image.mode == "RGB", "El icono original debe ser opaco."
assert image.getpixel((0, 0)) == (0, 0, 0), "El fondo debe ser #000000."
image = image.resize((256, 256), Image.Resampling.LANCZOS)
image.save(assets / "app-icon.png")
image.save(assets / "app-icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
image.resize((32, 32), Image.Resampling.LANCZOS).save(assets / "tray-icon.png")
(root / "web" / "favicon.ico").write_bytes((assets / "app-icon.ico").read_bytes())
print("Iconos PNG, ICO y favicon creados a partir de la imagen original.")
