"""Render a contact sheet of every pet stage for visual checking."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from PIL import Image

from pets import DRAWERS, draw_egg, draw_overlay
from pixel import Canvas, upscale

out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("preview.png")
from pets import PETS as pets
cols = 5
sheet = Image.new("RGBA", (128 * cols, 128 * len(pets)), (240, 242, 235, 255))
for r, pet in enumerate(pets):
    for stage in range(5):
        c = Canvas()
        if stage == 0:
            draw_egg(c, pet, "idle")
        else:
            DRAWERS[pet](c, stage, 0, "open")
        sheet.alpha_composite(c.image(), (stage * 128, r * 128))
upscale(sheet, 3).save(out)
print("wrote", out)
