#!/usr/bin/env bash
# Build 4:5 (1080x1350) feed versions from the finished 9:16 reels.
# Run from the repo root after build_reels.py:  bash marketing/meta-ads/src/build_feed.sh
# The crop keeps the logo, captions and nails, which all sit inside the Reels safe zone.
set -euo pipefail
cd marketing/meta-ads
CROP="crop=1080:1350:0:190"
for f in reels/reel-*.mp4; do
  ffmpeg -v error -y -i "$f" -vf "$CROP" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
    -c:a copy -movflags +faststart "feed/videos/$(basename "${f%.mp4}")-4x5.mp4"
done
still() { ffmpeg -v error -y -ss "$2" -i "reels/$1.mp4" -frames:v 1 -vf "$CROP" -q:v 2 "feed/$3.jpg"; }
# Swipeable before and after
still reel-2-before-after 1.0  carousel-before-after/1-before
still reel-2-before-after 3.3  carousel-before-after/2-after
still reel-2-before-after 4.9  carousel-before-after/3-before
still reel-2-before-after 7.0  carousel-before-after/4-after
still reel-2-before-after 9.6  carousel-before-after/5-price
still reel-2-before-after 11.4 carousel-before-after/6-book
# Swipeable looks
still reel-3-meet-bianca 2.6  carousel-looks/1-meet-bianca
still reel-3-meet-bianca 4.2  carousel-looks/2-cat-eye
still reel-3-meet-bianca 5.8  carousel-looks/3-pink-french
still reel-3-meet-bianca 7.5  carousel-looks/4-long-almond
still reel-3-meet-bianca 9.1  carousel-looks/5-nail-art
still reel-3-meet-bianca 11.4 carousel-looks/6-which-one
still reel-3-meet-bianca 13.0 carousel-looks/7-book
# Swipeable price list
still reel-11-prices 2.2  carousel-prices/1-dry-manicure-45
still reel-11-prices 4.8  carousel-prices/2-gel-manicure-60
still reel-11-prices 7.6  carousel-prices/3-structured-gel-75
still reel-11-prices 10.4 carousel-prices/4-soft-gel-tips-65
still reel-11-prices 12.0 carousel-prices/5-book
# Single image posts
still reel-1-now-booking 4.0    single/now-booking
still reel-4-question-hook 3.2  single/question-hook
still reel-8-one-a-day 4.0      single/one-client-a-day
still reel-16-short-red 4.6     single/gel-from-60
