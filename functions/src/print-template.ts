/** A4 at 96dpi — same as apps/mobile lookbook-print-layout + Puppeteer viewport. */
const A4 = {
  widthPx: Math.round((210 / 25.4) * 96), // 794
  heightPx: Math.round((297 / 25.4) * 96), // 1123
  padTopPx: Math.round((18 / 25.4) * 96), // 68
  padXPx: Math.round((16 / 25.4) * 96), // 60
  padBottomPx: Math.round((20 / 25.4) * 96), // 76
};

/**
 * Layout CSS shared with the mobile editor sheet.
 * Keep in sync with apps/mobile/.../lookbook-print-layout.ts
 */
export function buildPrintContentCss(bodySel = '.doc-body'): string {
  return `
    ${bodySel} {
      word-break: break-word;
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 16px;
      line-height: 1.55;
      color: #16182a;
    }
    ${bodySel} p { margin: 0.45em 0; }
    ${bodySel} h1 {
      font-family: "Syne", system-ui, sans-serif;
      font-size: 1.7rem;
      margin: 0.6em 0 0.35em;
      font-weight: 800;
      clear: both;
    }
    ${bodySel} h2 {
      font-family: "Syne", system-ui, sans-serif;
      font-size: 1.35rem;
      margin: 0.55em 0 0.3em;
      font-weight: 750;
      clear: both;
    }
    ${bodySel} h3 {
      font-family: "Syne", system-ui, sans-serif;
      font-size: 1.15rem;
      margin: 0.5em 0 0.25em;
      font-weight: 700;
      clear: both;
    }
    ${bodySel} blockquote {
      margin: 0.6em 0;
      padding: 0.4em 0.8em;
      border-left: 4px solid #8a4fa0;
      background: rgba(138, 79, 160, 0.08);
      border-radius: 0 10px 10px 0;
    }
    ${bodySel} ul, ${bodySel} ol {
      padding-left: 1.4em;
      margin: 0.45em 0;
    }
    ${bodySel} img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      display: inline-block;
      vertical-align: middle;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    ${bodySel} img[style*="float: left"],
    ${bodySel} img[style*="float:left"],
    ${bodySel} img[style*="float: right"],
    ${bodySel} img[style*="float:right"] {
      display: block;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .lb-img-row {
      display: flex;
      flex-wrap: nowrap;
      gap: 8px;
      clear: both;
      width: 100%;
      margin: 0.5em 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .lb-img-row > img {
      float: none !important;
      display: block !important;
      flex: 0 0 auto;
      height: auto;
      border-radius: 12px;
    }
    .lb-tpl {
      clear: both !important;
      float: none !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0.85em 0;
      box-sizing: border-box;
      /* Continuous flow — same as editor page bands (every A4). Avoid
         page-break-inside:avoid which pushed blocks and desynced editor/PDF. */
      page-break-inside: auto;
      break-inside: auto;
    }
    .lb-tpl--split {
      display: flex !important;
      flex-direction: row;
      align-items: flex-start;
      gap: 14px;
    }
    .lb-tpl--text-right { flex-direction: row-reverse; }
    .lb-tpl__col--text { flex: 1 1 0; min-width: 0; }
    .lb-tpl__col--media { flex: 0 0 46%; max-width: 46%; }
    .lb-tpl__eyebrow {
      margin: 0 0 0.35em;
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #8a4fa0;
    }
    .lb-tpl__sub { margin: 0.15em 0 0.55em; color: #5c6178; font-size: 0.95rem; }
    .lb-tpl--article {
      display: block !important;
      overflow: visible !important;
    }
    .lb-tpl__article-content {
      display: flow-root;
      min-width: 0;
    }
    .lb-tpl__article-content > h2 {
      margin-top: 0.2em;
    }
    .lb-tpl__article-img,
    .lb-tpl__article-content > .lb-tpl__ph.lb-tpl__article-img {
      width: 40% !important;
      max-width: 280px !important;
      height: auto !important;
      max-height: 360px;
      object-fit: cover !important;
      object-position: center center !important;
      display: block !important;
      border-radius: 12px !important;
    }
    .lb-tpl--article-left .lb-tpl__article-img {
      float: left !important;
      margin: 0.25em 16px 0.65em 0 !important;
    }
    .lb-tpl--article-right .lb-tpl__article-img {
      float: right !important;
      margin: 0.25em 0 0.65em 16px !important;
    }
    .lb-tpl__article-content > .lb-tpl__ph.lb-tpl__article-img {
      min-height: 190px;
      background: linear-gradient(135deg, #e6e8f0, #d8dae3);
    }
    .lb-tpl__article-clear {
      clear: both;
      height: 0;
    }
    .lb-tpl--overlay3 {
      align-items: center !important;
      min-height: 430px;
    }
    .lb-tpl--overlay3 .lb-tpl__col--text {
      flex: 0 0 43%;
      max-width: 43%;
    }
    .lb-tpl--overlay3 .lb-tpl__col--media {
      flex: 0 0 55%;
      max-width: 55%;
    }
    .lb-tpl__overlay {
      position: relative;
      width: 100%;
      height: 430px;
      overflow: visible;
    }
    .lb-tpl__overlay > .lb-tpl__overlay-img,
    .lb-tpl__overlay > .lb-tpl__overlay-slot {
      position: absolute !important;
      display: block !important;
      margin: 0 !important;
      overflow: hidden;
      border-radius: 14px !important;
      background: #e6e8f0;
      box-shadow: 0 8px 22px rgba(22, 24, 42, 0.18);
    }
    .lb-tpl__overlay > .lb-tpl__overlay-img--1,
    .lb-tpl__overlay > .lb-tpl__overlay-slot--1 {
      z-index: 3;
      top: 0;
      right: 2%;
      width: 38% !important;
      height: 130px !important;
    }
    .lb-tpl__overlay > .lb-tpl__overlay-img--2,
    .lb-tpl__overlay > .lb-tpl__overlay-slot--2 {
      z-index: 2;
      top: 84px;
      left: 0;
      width: 58% !important;
      height: 190px !important;
    }
    .lb-tpl__overlay > .lb-tpl__overlay-img--3,
    .lb-tpl__overlay > .lb-tpl__overlay-slot--3 {
      z-index: 1;
      right: 0;
      bottom: 0;
      width: 72% !important;
      height: 240px !important;
    }
    .lb-tpl__overlay > img,
    .lb-tpl__overlay > .lb-tpl__ph,
    .lb-tpl__overlay-slot > img,
    .lb-tpl__overlay-slot > .lb-tpl__ph {
      object-fit: cover !important;
      object-position: center center !important;
      border-radius: inherit !important;
    }
    .lb-tpl__overlay-slot > img,
    .lb-tpl__overlay-slot > .lb-tpl__ph {
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
    }
    .lb-tpl--fan3 {
      min-height: 460px;
    }
    .lb-tpl__fan {
      position: relative;
      width: 100%;
      height: 460px;
      overflow: visible;
    }
    .lb-tpl__fan > .lb-tpl__fan-img,
    .lb-tpl__fan > .lb-tpl__fan-slot {
      position: absolute !important;
      bottom: 24px;
      display: block !important;
      width: 40% !important;
      height: 370px !important;
      margin: 0 !important;
      overflow: hidden;
      transform-origin: 50% 100%;
      border: 7px solid #fff !important;
      border-radius: 15px !important;
      background: #e6e8f0;
      box-shadow: 0 12px 28px rgba(22, 24, 42, 0.24);
    }
    .lb-tpl__fan > .lb-tpl__fan-img--1,
    .lb-tpl__fan > .lb-tpl__fan-slot--1 {
      z-index: 1;
      left: 7%;
      transform: rotate(-10deg);
    }
    .lb-tpl__fan > .lb-tpl__fan-img--2,
    .lb-tpl__fan > .lb-tpl__fan-slot--2 {
      z-index: 3;
      left: 30%;
      bottom: 8px;
      transform: rotate(0deg);
    }
    .lb-tpl__fan > .lb-tpl__fan-img--3,
    .lb-tpl__fan > .lb-tpl__fan-slot--3 {
      z-index: 2;
      right: 7%;
      transform: rotate(10deg);
    }
    .lb-tpl__fan > img,
    .lb-tpl__fan > .lb-tpl__ph,
    .lb-tpl__fan-slot > img,
    .lb-tpl__fan-slot > .lb-tpl__ph {
      object-fit: cover !important;
      object-position: center center !important;
      border-radius: 8px !important;
    }
    .lb-tpl__fan-slot > img,
    .lb-tpl__fan-slot > .lb-tpl__ph {
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
    }
    .lb-tpl__mosaic { display: flex; flex-direction: column; gap: 8px; }
    .lb-tpl__mosaic img,
    .lb-tpl__mosaic .lb-img-wrap,
    .lb-tpl__grid4 img,
    .lb-tpl__grid4 .lb-img-wrap,
    .lb-tpl__mosaic4 img,
    .lb-tpl__mosaic4 .lb-img-wrap,
    .lb-tpl--stack2 img,
    .lb-tpl--stack2 .lb-img-wrap,
    .lb-tpl--photo img,
    .lb-tpl--photo .lb-img-wrap,
    .lb-tpl__cover-media img {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 12px;
      float: none !important;
      margin: 0 !important;
    }
    .lb-tpl__mosaic .lb-img-wrap img,
    .lb-tpl__grid4 .lb-img-wrap img,
    .lb-tpl__mosaic4 .lb-img-wrap img,
    .lb-tpl--stack2 .lb-img-wrap img,
    .lb-tpl--photo .lb-img-wrap img {
      width: 100% !important;
      height: auto !important;
      display: block !important;
      margin: 0 !important;
      float: none !important;
    }
    .lb-tpl__mosaic--n2 > img:nth-child(2),
    .lb-tpl__mosaic--n2 > .lb-img-wrap:nth-child(2),
    .lb-tpl__mosaic--n3 > img:nth-child(2),
    .lb-tpl__mosaic--n3 > .lb-img-wrap:nth-child(2) { width: 88%; margin-left: auto !important; }
    .lb-tpl__mosaic--n3 > img:nth-child(3),
    .lb-tpl__mosaic--n3 > .lb-img-wrap:nth-child(3) { width: 92%; margin-left: 4% !important; }
    .lb-tpl__mosaic--fancy {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      grid-template-rows: auto auto;
      gap: 8px;
      align-items: start;
    }
    .lb-tpl__mosaic--fancy > img:nth-child(1),
    .lb-tpl__mosaic--fancy > .lb-img-wrap:nth-child(1) {
      grid-row: 1 / 3;
      width: 100% !important;
      height: auto !important;
      max-height: 420px !important;
      object-fit: contain !important;
      object-position: center center !important;
      border-radius: 12px;
    }
    .lb-tpl__mosaic--fancy > .lb-img-wrap:nth-child(1) img {
      max-height: 420px !important;
      object-fit: contain !important;
      object-position: center center !important;
    }
    .lb-tpl__mosaic--fancy > img,
    .lb-tpl__mosaic--fancy > .lb-img-wrap {
      width: 100% !important;
      height: auto !important;
      max-height: 220px !important;
      object-fit: contain !important;
      object-position: center center !important;
      border-radius: 12px;
    }
    .lb-tpl__mosaic--fancy > .lb-img-wrap img {
      max-height: 220px !important;
      object-fit: contain !important;
      object-position: center center !important;
    }
    .lb-tpl__mosaic img,
    .lb-tpl__mosaic .lb-img-wrap img {
      object-fit: contain !important;
      object-position: center center !important;
      height: auto !important;
    }
    .lb-tpl__grid4 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
      gap: 8px;
      align-items: start;
    }
    .lb-tpl__grid4 img,
    .lb-tpl__grid4 .lb-img-wrap,
    .lb-tpl__grid4 .lb-img-wrap img {
      width: 100% !important;
      height: auto !important;
      max-height: 280px !important;
      object-fit: contain !important;
      object-position: center center !important;
      border-radius: 12px;
    }
    .lb-tpl--stack2 {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .lb-tpl--stack2 img,
    .lb-tpl--stack2 .lb-img-wrap img {
      width: auto !important;
      height: auto !important;
      max-width: 100% !important;
      max-height: 420px !important;
      object-fit: contain !important;
      object-position: center center !important;
      display: block !important;
      margin: 0 auto !important;
      transform: none !important;
      border-radius: 12px;
    }
    .lb-tpl--stack2 .lb-img-wrap {
      width: 100% !important;
      max-height: 420px !important;
      overflow: hidden;
    }
    .lb-tpl__frame {
      position: relative !important;
      width: 100% !important;
      height: 0 !important;
      overflow: hidden !important;
      border-radius: 12px;
      background: #e6e8f0;
    }
    .lb-tpl__frame[data-lb-frame='16x9'] { padding-bottom: 56.25% !important; }
    .lb-tpl__frame[data-lb-frame='3x4'] { padding-bottom: 133.333% !important; }
    .lb-tpl__frame[data-lb-frame='1x1'] { padding-bottom: 100% !important; }
    .lb-tpl__frame > img,
    .lb-tpl__frame-img {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      object-position: center center !important;
      transform: none !important;
      border-radius: 12px;
      display: block !important;
    }
    .lb-tpl__mosaic4 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
      gap: 8px;
      align-items: start;
    }
    .lb-tpl__mosaic4 > img,
    .lb-tpl__mosaic4 > .lb-img-wrap,
    .lb-tpl__mosaic4 > .lb-img-wrap img {
      width: 100% !important;
      height: auto !important;
      max-height: 280px !important;
      object-fit: contain !important;
      object-position: center center !important;
      border-radius: 12px;
      grid-row: auto !important;
      grid-column: auto !important;
    }
    .lb-tpl--photo img,
    .lb-tpl--photo .lb-img-wrap img {
      width: auto !important;
      max-width: 100% !important;
      height: auto !important;
      max-height: 720px !important;
      aspect-ratio: auto !important;
      object-fit: contain !important;
      object-position: center center !important;
      border-radius: 12px;
      display: block !important;
      margin: 0 auto !important;
    }
    .lb-tpl--photo .lb-img-wrap {
      width: 100% !important;
      max-height: 720px !important;
    }
    .lb-tpl--cover {
      position: relative;
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0.85em 0;
      aspect-ratio: 1 / 1;
      min-height: 320px;
      border-radius: 14px;
      overflow: hidden;
      background: #2a2d3a;
    }
    .lb-tpl__cover-media {
      position: absolute !important;
      inset: 0;
      z-index: 0;
      overflow: hidden;
    }
    .lb-tpl__cover-media img,
    .lb-tpl__cover-media .lb-tpl__ph,
    .lb-tpl__cover-img {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
      object-position: center center !important;
      border-radius: 0 !important;
      margin: 0 !important;
      float: none !important;
      background: #2a2d3a;
    }
    .lb-tpl__cover-text {
      position: absolute !important;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 2;
      width: min(58%, 360px);
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.15em;
      padding: 28px 24px 28px 22px;
      color: #fff !important;
      background: linear-gradient(
        to right,
        rgba(22, 24, 42, 0.88) 0%,
        rgba(22, 24, 42, 0.55) 62%,
        rgba(22, 24, 42, 0) 100%
      );
      box-sizing: border-box;
    }
    .lb-tpl__cover-text .lb-tpl__eyebrow { color: rgba(255, 255, 255, 0.88) !important; }
    .lb-tpl__cover-text h1 {
      margin: 0.15em 0 0.35em !important;
      color: #fff !important;
      -webkit-text-fill-color: #fff !important;
      font-family: "Syne", system-ui, sans-serif !important;
      font-size: 1.7rem !important;
      font-weight: 800 !important;
      line-height: 1.2 !important;
    }
    .lb-tpl__cover-text p {
      margin: 0.25em 0 0 !important;
      color: rgba(255, 255, 255, 0.92) !important;
    }
    .lb-tpl--text { display: block !important; }
    .lb-tpl__ph {
      width: 100%;
      min-height: 120px;
      border-radius: 12px;
      background: linear-gradient(135deg, #e6e8f0, #d8dae3);
    }
    ${bodySel} hr {
      border: none;
      border-top: 1px solid rgba(22, 24, 42, 0.15);
      margin: 1em 0;
      clear: both;
    }
    .clearfix,
    ${bodySel} p[style*="clear:both"],
    ${bodySel} p[style*="clear: both"] {
      clear: both;
    }
  `;
}

/** Print document for Puppeteer — fonts match the mobile editor (Outfit/Syne). */
export function buildPrintDocument(opts: { title: string; bodyHtml: string }): string {
  const title = escapeHtml(opts.title || 'Lookbook');
  const body = opts.bodyHtml || '<p></p>';
  const { widthPx, heightPx, padTopPx, padXPx, padBottomPx } = A4;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=${widthPx}, initial-scale=1" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap" rel="stylesheet" />
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #16182a;
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 16px;
      line-height: 1.55;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      width: ${widthPx}px;
      min-height: ${heightPx}px;
      margin: 0 auto;
      padding: ${padTopPx}px ${padXPx}px ${padBottomPx}px;
      background: #fff;
    }
    .doc-header {
      margin: 0 0 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e6e8f0;
    }
    .doc-brand {
      margin: 0 0 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #8a4fa0;
      text-transform: uppercase;
      font-family: "Outfit", system-ui, sans-serif;
    }
    .doc-title {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      color: #16182a;
      line-height: 1.25;
      font-family: "Syne", system-ui, sans-serif;
    }
    ${buildPrintContentCss('.doc-body')}
  </style>
</head>
<body>
  <div class="sheet">
    <header class="doc-header">
      <p class="doc-brand">Rainbow Manager</p>
      <h1 class="doc-title">${title}</h1>
    </header>
    <main class="doc-body">${body}</main>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
