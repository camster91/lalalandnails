# Meta ads — Reels

Vertical 9:16 ads (1080×1920, 30 fps, MP4) for Facebook and Instagram Reels and Stories.
Built only from Bianca's own photos and videos in `public/images` and `public/videos`. No AI or stock images.

| File | Length | Idea |
| --- | --- | --- |
| reel-1-now-booking | 17s | Launch: now booking, services, prices |
| reel-2-before-after | 15s | Two before-and-after sets |
| reel-3-meet-bianca | 16s | Bianca, then five finished sets |
| reel-4-question-hook | 15s | "Looking for a nail tech in Scarborough?" |
| reel-5-soft-gel-tips | 12s | Soft gel tips, starting at $65 |
| reel-6-structured-gel | 15s | Structured gel manicure, $75 |
| reel-7-nail-art | 16s | Nail art add-ons from +$10 |
| reel-8-one-a-day | 14s | One appointment per weekday |
| reel-9-short-story | 8s | Short cut for Stories |

Each reel has a matching `-cover.jpg`. The videos have a silent audio track; add music from Meta's library when creating the ad.

Prices and wording come from `src/data/pricing.ts` and `src/data/site.ts`. If those change, edit the text in `src/build_reels.py` and rebuild:

```sh
pip install pillow fonttools brotli
python3 marketing/meta-ads/src/build_reels.py /tmp/reel-work
```
