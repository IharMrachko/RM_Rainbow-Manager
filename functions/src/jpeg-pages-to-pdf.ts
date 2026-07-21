/**
 * Build a multi-page PDF from JPEG buffers (one JPEG = one A4 page).
 * PDF matches preview screenshots and editor page bands exactly.
 */
export function jpegPagesToPdf(
  pages: Buffer[],
  pageWidthPx = 794,
  pageHeightPx = 1123,
): Buffer {
  if (!pages.length) {
    throw new Error('jpegPagesToPdf: no pages');
  }

  type Obj = { text: string } | { header: string; binary: Buffer; footer: string };
  const objs: Obj[] = [];
  const add = (obj: Obj): number => {
    objs.push(obj);
    return objs.length; // 1-based object number
  };

  const pageNums: number[] = [];

  for (const jpeg of pages) {
    const imgNum = add({
      header:
        `<< /Type /XObject /Subtype /Image /Width ${pageWidthPx} /Height ${pageHeightPx} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\n` +
        `stream\n`,
      binary: jpeg,
      footer: `\nendstream\n`,
    });

    const content = `q\n${pageWidthPx} 0 0 ${pageHeightPx} 0 0 cm\n/Im0 Do\nQ\n`;
    const contentNum = add({
      text: `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}endstream\n`,
    });

    // Parent patched after Pages object is known
    const pageNum = add({
      text:
        `<< /Type /Page /Parent __PAGES__ 0 R /MediaBox [0 0 ${pageWidthPx} ${pageHeightPx}] ` +
        `/Contents ${contentNum} 0 R /Resources << /XObject << /Im0 ${imgNum} 0 R >> >> >>\n`,
    });
    pageNums.push(pageNum);
  }

  const kids = pageNums.map((n) => `${n} 0 R`).join(' ');
  const pagesNum = add({
    text: `<< /Type /Pages /Kids [ ${kids} ] /Count ${pageNums.length} >>\n`,
  });

  for (const n of pageNums) {
    const page = objs[n - 1]!;
    if ('text' in page) {
      page.text = page.text.replace('__PAGES__', String(pagesNum));
    }
  }

  const catalogNum = add({
    text: `<< /Type /Catalog /Pages ${pagesNum} 0 R >>\n`,
  });

  const parts: Buffer[] = [Buffer.from('%PDF-1.4\n', 'utf8')];
  const offsets: number[] = [0];
  let pos = parts[0]!.length;

  for (let i = 0; i < objs.length; i++) {
    offsets.push(pos);
    const numHead = Buffer.from(`${i + 1} 0 obj\n`, 'utf8');
    parts.push(numHead);
    pos += numHead.length;

    const obj = objs[i]!;
    if ('text' in obj) {
      const body = Buffer.from(`${obj.text}endobj\n`, 'utf8');
      parts.push(body);
      pos += body.length;
    } else {
      const h = Buffer.from(obj.header, 'utf8');
      const f = Buffer.from(`${obj.footer}endobj\n`, 'utf8');
      parts.push(h, obj.binary, f);
      pos += h.length + obj.binary.length + f.length;
    }
  }

  const xrefStart = pos;
  let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  const xrefBuf = Buffer.from(xref, 'utf8');
  parts.push(xrefBuf);
  pos += xrefBuf.length;

  parts.push(
    Buffer.from(
      `trailer\n<< /Size ${objs.length + 1} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
      'utf8',
    ),
  );

  return Buffer.concat(parts);
}
