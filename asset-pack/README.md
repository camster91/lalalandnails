# La La Land Nail Hub — 4K Campaign Asset Pack

## Usage boundary

These images are AI-generated campaign artwork. They may be used as art-directed brand imagery, but must not be described as Bianca Ashley's client work, a before-and-after result, or evidence of a specific service outcome.

## Deliverables

| Asset | 4K master | 4K WebP | Production derivative | Intended use |
|---|---|---|---|---|
| Campaign hero | `masters-4k/campaign-hero-4k.png` — 3840×2160 | `web-4k/campaign-hero-4k.webp` | `public/images/campaign/campaign-hero.webp` — 1920×1080 | Homepage hero and social crop |
| Precision process | `masters-4k/campaign-process-4k.png` — 3840×2160 | `web-4k/campaign-process-4k.webp` | `public/images/campaign/campaign-process.webp` — 1920×1080 | Process and editorial detail sections |
| Lacquer flow | `masters-4k/campaign-lacquer-flow-4k.png` — 3840×2160 | `web-4k/campaign-lacquer-flow-4k.webp` | `public/images/campaign/campaign-lacquer-flow.webp` — 1920×1080 | Parallax motion background |
| Editorial hand | `masters-4k/campaign-editorial-hand-4k.png` — 2160×3840 | `web-4k/campaign-editorial-hand-4k.webp` | `public/images/campaign/campaign-editorial-hand.webp` — 1080×1920 | Vertical campaign edit and social crop |

The untouched generated files are retained in `source/`. The PNG masters were enhanced to exact 4K dimensions with high-quality Lanczos resampling and restrained sharpening. WebP exports preserve the same compositions at smaller delivery sizes.

## Motion assets

- `public/motion/lacquer-orbit.json`: lightweight scroll-controlled Lottie artwork.
- GSAP ScrollTrigger: parallax, editorial word movement, image drift and section reveals.
- Motion loads only when the campaign section approaches the viewport.
- `prefers-reduced-motion` disables GSAP and Lottie movement while preserving all content.

## Generation prompts

### Campaign hero

Premium editorial beauty photograph of one elegant adult hand with short deep-burgundy nails on layered blush fabric; warm cream studio set; hand on the right with negative space on the left; La La Land burgundy, blush, cream and plum palette; no logos, words, jewelry, tools or extra hands.

### Precision process

Premium macro beauty photograph of a manicure preparation moment with one adult hand, short natural nails and one professional hand in a deep-burgundy glove using a minimal precision tool; clean blush and cream surface; no medical imagery, damaged skin, brands or clutter.

### Lacquer flow

Luxurious abstract macro composition of sculptural glossy lacquer ribbons over cream and blush architectural curves; broad flowing S-curve; deep burgundy, plum, blush and cream; no hands, products, text or metallic decoration.

### Editorial hand

Premium vertical beauty still life of one graceful adult hand with short burgundy and plum nails against layered blush paper arches and cream plinths; soft architectural shadows; no jewelry, products, tools, logos or extreme nails.
