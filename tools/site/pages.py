"""
Renders the plain web pages that sit next to the app on the website:
  public/privacy.html  from docs/PRIVACY.md   (the URL both stores ask for)
  public/support.html  a short support page
Run: python3 tools/site/pages.py   (the Pages workflow runs it before the export)
No dependencies: the Markdown subset used by the docs is headings,
paragraphs, bullet lists, italics and inline code.
"""
from __future__ import annotations

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"

STYLE = """
:root { color-scheme: light; }
body { margin: 0; background: #FAF9F6; color: #20231F; font: 17px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
main { max-width: 680px; margin: 0 auto; padding: 40px 20px 64px; }
h1 { font-size: 30px; line-height: 1.2; margin: 0 0 8px; }
h2 { font-size: 20px; margin: 32px 0 8px; }
p, li { color: #4B4F47; }
em { color: #666B62; }
code { background: #ECEBE4; padding: 1px 5px; border-radius: 5px; font-size: 15px; }
a { color: #5F7A62; }
.brand { display: inline-block; margin-bottom: 28px; font-weight: 800; letter-spacing: 0.04em; text-decoration: none; color: #20231F; }
footer { margin-top: 48px; font-size: 14px; color: #666B62; }
"""


def inline(text: str) -> str:
    text = html.escape(text, quote=False)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    text = re.sub(r"_([^_]+)_", r"<em>\1</em>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    return text


def markdown(md: str) -> str:
    out: list[str] = []
    paragraph: list[str] = []
    in_list = False

    def flush():
        nonlocal paragraph
        if paragraph:
            out.append(f"<p>{inline(' '.join(paragraph))}</p>")
            paragraph = []

    for raw in md.splitlines():
        line = raw.rstrip()
        if line.startswith("- "):
            flush()
            if not in_list:
                out.append("<ul>")
                in_list = True
            out.append(f"<li>{inline(line[2:])}</li>")
            continue
        if in_list:
            out.append("</ul>")
            in_list = False
        if line.startswith("# "):
            flush()
            out.append(f"<h1>{inline(line[2:])}</h1>")
        elif line.startswith("## "):
            flush()
            out.append(f"<h2>{inline(line[3:])}</h2>")
        elif not line:
            flush()
        else:
            paragraph.append(line)
    flush()
    if in_list:
        out.append("</ul>")
    return "\n".join(out)


def page(title: str, body: str, description: str) -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(description, quote=True)}">
<link rel="icon" href="favicon.ico">
<style>{STYLE}</style>
</head>
<body>
<main>
<a class="brand" href="./">YOUchi</a>
{body}
<footer>YOUchi · Build habits. Level up. · <a href="./">Open the app</a> · <a href="privacy.html">Privacy</a> · <a href="support.html">Support</a></footer>
</main>
</body>
</html>
"""


SUPPORT = """# YOUchi Support

YOUchi is a pocket habit game: three daily goals, a pixel pet that grows, no account needed. Everything is stored on your phone.

## Common questions

- **My pet is asleep.** It dozes off after about a day and a half without you. Tap it to wake it up; logging any goal does the same.
- **I missed a day. Did I lose progress?** No. XP, coins and gear never go down. A missed day only ends a streak, and a streak freeze (earned every seven days or bought with coins) covers one missed day automatically.
- **Movement did not complete from my steps.** Turn on sync in Settings → Steps and workouts, then check that YOUchi is allowed to read steps and workouts in the Health app (iOS) or Health Connect (Android). The goal completes when today's steps reach your step target or a workout reaches your movement minutes.
- **The widget shows an old pet or nothing.** Open the app once; the widget refreshes whenever you log something and on the system's own schedule.
- **How do I move to a new phone?** Settings → Backup → Export, send the file to yourself, then Import on the new phone. The backup includes your progress photos, so keep it private.
- **How do I delete everything?** Settings → Reset all progress, or uninstall the app. Nothing is kept anywhere else.

## Contact

Questions: [youchiapp@gmail.com](mailto:youchiapp@gmail.com)
"""


def build() -> None:
    PUBLIC.mkdir(exist_ok=True)
    privacy_md = (ROOT / "docs" / "PRIVACY.md").read_text(encoding="utf-8")
    (PUBLIC / "privacy.html").write_text(page("YOUchi Privacy Policy", markdown(privacy_md), "What YOUchi stores on your phone and what it never does."), encoding="utf-8")
    (PUBLIC / "support.html").write_text(page("YOUchi Support", markdown(SUPPORT), "Help with YOUchi: pets, streaks, health sync, widgets, backups."), encoding="utf-8")
    print("wrote public/privacy.html and public/support.html")


if __name__ == "__main__":
    build()
