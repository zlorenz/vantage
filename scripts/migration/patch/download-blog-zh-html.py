#!/usr/bin/env python3
"""Download live ZH blog post HTML to migration-data/blog-zh-html/."""

from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
POSTS = json.loads((ROOT / "migration-data" / "blog-posts.json").read_text())
OUT = ROOT / "migration-data" / "blog-zh-html"
OUT.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"

# Prefer newest posts first (user examples), then the rest
PRIORITY = [
    "vantage-pictures-elevates-mammotion-luba-3-with-cinematic-product-first-campaign",
    "vantage-pictures-translates-next-gen-drone-tech-into-gritty-storytelling-for-brinc",
    "a-talking-dog-ai-and-everyday-chaos-behind-govees-new-campaign-via-vantage-pictures",
]


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return resp.read().decode("utf-8", "replace")


def main() -> None:
    ordered = sorted(
        POSTS,
        key=lambda p: (
            0 if p["slug"] in PRIORITY else 1,
            PRIORITY.index(p["slug"]) if p["slug"] in PRIORITY else 99,
        ),
    )

    ok = 0
    for post in ordered:
        out = OUT / f'{post["wpId"]}.html'
        if out.exists() and out.stat().st_size > 2000:
            print(f'skip existing {post["slug"]}')
            ok += 1
            continue

        url = f'https://vantage.pictures/zh/{post["slug"]}/'
        try:
            time.sleep(2.5)
            html = fetch(url)
            if "entry-content" not in html or len(html) < 2000:
                raise RuntimeError("blocked or empty")
            out.write_text(html)
            ok += 1
            print(f'OK {post["wpId"]} {post["slug"]} ({len(html)} bytes)')
        except Exception as exc:  # noqa: BLE001
            print(f'FAIL {post["slug"]}: {exc}')

    print(f"Done: {ok}/{len(POSTS)} html files")


if __name__ == "__main__":
    main()
