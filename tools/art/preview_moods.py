import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from PIL import Image
from pets import DRAWERS, MOODS, PETS
from pixel import Canvas, upscale
out = Path(sys.argv[1]); stage = int(sys.argv[2]) if len(sys.argv) > 2 else 2
sheet = Image.new("RGBA", (128 * 5, 128 * len(PETS)), (240, 242, 235, 255))
for r, pet in enumerate(PETS):
    for i, mood in enumerate([None] + MOODS):
        c = Canvas(); DRAWERS[pet](c, stage, 0, "open", mood)
        sheet.alpha_composite(c.image(), (i * 128, r * 128))
upscale(sheet, 2).save(out)
