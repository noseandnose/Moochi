import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from PIL import Image
from pets import DRAWERS, draw_overlay
from pixel import Canvas, upscale
out = Path(sys.argv[1]); pet = sys.argv[2]
kinds = ["hydration", "active", "nourished", "cap", "bow", "glasses", "scarf", "crown"]
sheet = Image.new("RGBA", (128 * len(kinds), 128 * 4), (240, 242, 235, 255))
for r, stage in enumerate(range(1, 5)):
    for i, k in enumerate(kinds):
        c = Canvas(); DRAWERS[pet](c, stage, 0, "open" if i % 2 == 0 else "happy")
        o = Canvas(); draw_overlay(o, pet, stage, k); c.blit(o)
        sheet.alpha_composite(c.image(), (i * 128, r * 128))
upscale(sheet, 2).save(out)
