# Meta ads — Reels

Vertical 9:16 ads (1080×1920, 30 fps, MP4) for Facebook and Instagram Reels and Stories.
Built only from Bianca's own photos and videos in `public/images` and `public/videos`. No AI or stock images.

| File | Length | Idea |
| --- | --- | --- |
| reel-1-now-booking | 14s | Launch: now booking, services, prices |
| reel-2-before-after | 12s | Two before-and-after sets |
| reel-3-meet-bianca | 14s | Bianca, then five finished looks |
| reel-4-question-hook | 13s | "Looking for a nail tech in Scarborough?" |
| reel-5-soft-gel-tips | 10s | Soft gel tips, from $65 |
| reel-6-structured-gel | 13s | Structured gel manicure, $75 |
| reel-7-nail-art | 14s | Nail art from $10 extra |
| reel-8-one-a-day | 12s | One client a day |
| reel-9-short-story | 7s | Short cut: soft gel tips from $65 |
| reel-10-how-booking-works | 14s | Booking in three steps |
| reel-11-prices | 13s | Price list across four looks |
| reel-12-classic-red | 10s | Red before and after, gel manicure $60 |
| reel-13-natural-nails | 10s | Short natural nails, dry manicure $45 |
| reel-14-weekdays | 10s | Weekday hours, Monday to Friday 10 to 3 |
| reel-15-short-french | 7s | Short cut: structured gel $75 |
| reel-16-short-red | 7s | Short cut: gel manicures from $60 |

Captions are small brand-coloured stickers written in Bianca's first-person voice in plain everyday sentences, with the logo on a burgundy tag at the top, kept clear of the nails and of the areas Instagram covers with its buttons.

Each reel has a matching `-cover.jpg`. The videos have a silent audio track; add music from Meta's library when creating the ad.

A price is only shown over the service it belongs to. Prices and wording come from `src/data/pricing.ts` and `src/data/site.ts`. If those change, edit the text in `src/build_reels.py` and rebuild:

## Logos

`brand/` holds the logo and the "L" submark as 4400px and 2220px transparent PNGs, plus SVGs, in blush, burgundy and white. They are exported from the vector files in `public/brand` by `src/export_logos.cjs`. The "Nail Hub" lockup used in the site header only exists as a 512px image, so it is not included.

## Rebuild

```sh
pip install pillow fonttools brotli
node marketing/meta-ads/src/export_logos.cjs
python3 marketing/meta-ads/src/build_reels.py /tmp/reel-work
```
