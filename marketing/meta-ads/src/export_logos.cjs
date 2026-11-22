// Export the vector logo as high-resolution transparent PNGs (and one combined SVG).
// Run from the repo root: node marketing/meta-ads/src/export_logos.cjs
// The layout matches src/components/BrandLogo.astro ("la la" over "Land.").
const { chromium } = require('playwright');
const fs = require('fs');
const out = 'marketing/meta-ads/brand';
const inner = f => fs.readFileSync(`public/brand/${f}.svg`, 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const lockup = c => `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="448" viewBox="0 0 880 448" fill="none">
<svg x="440" y="0" width="381.65" height="157.07" viewBox="0 0 381.739 157.229" preserveAspectRatio="none" overflow="visible">${inner('logo-top')}</svg>
<svg x="0" y="42.96" width="880" height="405.04" viewBox="0 0 880.121 405.473" preserveAspectRatio="none" overflow="visible">${inner('logo-main')}</svg>
</svg>`.replace(/#FFD2DE/gi, c);
const submark = c => fs.readFileSync('public/brand/submark.svg', 'utf8').replace(/#FFD2DE/gi, c).replace(/style="[^"]*"/, '');
const colours = { blush: '#FFD2DE', burgundy: '#330505', white: '#FFFAF5' };
(async () => {
  const b = await chromium.launch();
  for (const [name, c] of Object.entries(colours)) {
    fs.writeFileSync(`${out}/logo-${name}.svg`, lockup(c));
    for (const [kind, svg, w, h, scale] of [['logo', lockup(c), 880, 448, 5], ['submark', submark(c), 555, 514, 4]]) {
      const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
      await p.setContent(`<body style="margin:0;background:transparent"><div style="width:${w}px;height:${h}px">${svg.replace(/<svg /, `<svg style="display:block;width:${w}px;height:${h}px" `)}</div></body>`);
      await p.screenshot({ path: `${out}/${kind}-${name}.png`, omitBackground: true });
      await p.close();
    }
  }
  await b.close();
})();
