/** Shared docx-js building blocks for the GiftCompass reports. */
const {
  Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
} = require('docx');

const TOTAL = 9000;

const t = (text, o = {}) => new TextRun({ text, ...o });

const P = (text, o = {}) => new Paragraph({
  children: Array.isArray(text) ? text : [t(text, o.run || {})],
  spacing: { after: o.after === undefined ? 120 : o.after, before: o.before || 0 },
  alignment: o.align,
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
});

const H = (text, level) => new Paragraph({
  text, heading: level, spacing: { before: 280, after: 140 },
});

const bullet = (text) => new Paragraph({
  children: Array.isArray(text) ? text : [t(text)],
  bullet: { level: 0 },
  spacing: { after: 80 },
});

const code = (lines) => lines.map((ln, i) => new Paragraph({
  children: [t(ln === '' ? ' ' : ln, { font: 'Consolas', size: 15 })],
  spacing: { after: 0, before: i === 0 ? 60 : 0 },
  shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
}));

function table(headers, rows, widths) {
  const w = widths || headers.map(() => Math.floor(TOTAL / headers.length));
  const cell = (text, width, opts = {}) => new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: opts.head ? { type: ShadingType.CLEAR, fill: 'E2E8F0' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: String(text).split('\n').map((line) => new Paragraph({
      children: [t(line, { bold: !!opts.head, size: 19 })],
      spacing: { after: 0 },
    })),
  });
  return new Table({
    columnWidths: w,
    width: { size: TOTAL, type: WidthType.DXA },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, w[i], { head: true })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, w[i])) })),
    ],
  });
}

function titleBlock(title, subtitle, strap) {
  return [
    new Paragraph({
      children: [t(title, { bold: true, size: 56, color: '1E3A8A' })],
      alignment: AlignmentType.CENTER, spacing: { after: 60 },
    }),
    new Paragraph({
      children: [t(subtitle, { size: 30, color: '334155' })],
      alignment: AlignmentType.CENTER, spacing: { after: 40 },
    }),
    new Paragraph({
      children: [t(strap, { size: 20, color: '64748B', italics: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1', space: 8 } },
    }),
  ];
}

const note = (text) => new Paragraph({
  children: [t(text, { italics: true, size: 18, color: '64748B' })],
  spacing: { before: 100, after: 120 },
});

const docStyles = {
  default: { document: { run: { font: 'Calibri', size: 22 }, paragraph: { spacing: { line: 276 } } } },
  paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 30, bold: true, color: '1E3A8A' } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 25, bold: true, color: '334155' } },
  ],
};

const pageMargins = { properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } } };

module.exports = { t, P, H, bullet, code, table, titleBlock, note, docStyles, pageMargins, TOTAL, HeadingLevel, AlignmentType, ShadingType };
