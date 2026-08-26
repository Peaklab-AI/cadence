import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./currency";
import { formatDuration } from "./history";
import type { ReportSection } from "./history";

const FOOTER_TEXT = "Generated using https://cadence.peaklab.ai";
const FOOTER_URL = "https://cadence.peaklab.ai";
const DEFAULT_TITLE = "Time report";
const TITLE_FONT_SIZE = 14;
const TITLE_COLOR = 60;
// Helvetica's cap height is ~0.72em; used to find the title text's visual
// vertical center for aligning it against the logo (jsPDF only exposes the
// baseline, not glyph bounds).
const TITLE_CAP_HEIGHT_EM = 0.72;
const LOGO_MAX_HEIGHT = 40;
const LOGO_MAX_WIDTH = 125;
// Source logos can be uploaded at arbitrary resolution (e.g. a 3000px PNG),
// which bloats the PDF if embedded as-is even though it's displayed at a few
// dozen points. Rasterizing it down to a fixed multiple of its display size
// keeps it crisp while keeping the embedded file small.
const LOGO_RENDER_SCALE = 3;

function formatReportDate(date: Date): string {
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

interface PreparedLogo {
  dataUrl: string;
  width: number;
  height: number;
}

/** Loads a logo data URL, scales its display size to fit
 * `LOGO_MAX_WIDTH`/`LOGO_MAX_HEIGHT` without distorting its aspect ratio,
 * and re-rasterizes it at that size (times `LOGO_RENDER_SCALE` for print
 * sharpness) so the PDF embeds a right-sized image rather than whatever
 * resolution the user originally uploaded. */
function prepareLogo(dataUrl: string): Promise<PreparedLogo | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      const scale = Math.min(LOGO_MAX_WIDTH / naturalWidth, LOGO_MAX_HEIGHT / naturalHeight, 1);
      const width = naturalWidth * scale;
      const height = naturalHeight * scale;

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * LOGO_RENDER_SCALE));
      canvas.height = Math.max(1, Math.round(height * LOGO_RENDER_SCALE));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ dataUrl, width, height });
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ dataUrl: canvas.toDataURL("image/png"), width, height });
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export interface ReportBranding {
  title: string | null;
  logoDataUrl: string | null;
}

/** Renders a report's itemized sections to PDF bytes — one table per
 * client/project, in the order buildReportRows() already sorted them. Pure
 * layout: all filtering/grouping happens upstream in buildReportRows(). */
export async function buildTimeLogPdf(
  sections: ReportSection[],
  range: { start: Date; end: Date },
  branding: ReportBranding = { title: null, logoDataUrl: null },
  includePricing = false,
): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "pt" });
  const margin = 40;

  const pageWidth = doc.internal.pageSize.getWidth();
  const headerCenterY = margin + LOGO_MAX_HEIGHT / 2;
  const headerY = headerCenterY + (TITLE_FONT_SIZE * TITLE_CAP_HEIGHT_EM) / 2;

  if (branding.logoDataUrl) {
    const logo = await prepareLogo(branding.logoDataUrl);
    if (logo) {
      doc.addImage(logo.dataUrl, margin, headerCenterY - logo.height / 2, logo.width, logo.height);
    }
  }

  doc.setFontSize(TITLE_FONT_SIZE);
  doc.setTextColor(TITLE_COLOR);
  doc.text(branding.title?.trim() || DEFAULT_TITLE, pageWidth - margin, headerY, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(100);
  const dateY = headerY + 18;
  const rangeEnd = new Date(range.end.getTime() - 1);
  doc.text(`${formatReportDate(range.start)} – ${formatReportDate(rangeEnd)}`, pageWidth - margin, dateY, {
    align: "right",
  });
  doc.setTextColor(0);

  let cursorY = Math.max(dateY, margin + LOGO_MAX_HEIGHT) + 16;
  let grandTotalSeconds = 0;

  for (const section of sections) {
    const includeAmount = includePricing && section.rows.some((row) => row.amount !== null);
    const columns = ["Date", "Start", "End", ...(includeAmount ? ["Amount"] : []), "Notes", "Duration"];
    const amountColumnIndex = includeAmount ? 3 : null;
    const durationColumnIndex = columns.length - 1;
    const head = [columns];
    const body = section.rows.map((row) => [
      row.date,
      row.start,
      row.end,
      ...(includeAmount ? [row.amount !== null ? formatCurrency(row.amount, section.currency) : ""] : []),
      row.note,
      row.duration,
    ]);

    const sectionTotalSeconds = section.rows.reduce((sum, row) => sum + row.durationSeconds, 0);
    const sectionTotalAmount = section.rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
    grandTotalSeconds += sectionTotalSeconds;
    const foot = [
      [
        "Total",
        "",
        "",
        ...(includeAmount ? [formatCurrency(sectionTotalAmount, section.currency)] : []),
        "",
        formatDuration(sectionTotalSeconds),
      ],
    ];

    if (cursorY > doc.internal.pageSize.getHeight() - 100) {
      doc.addPage();
      cursorY = margin;
    }

    doc.setFontSize(11);
    doc.text(`${section.clientName} — ${section.projectName}`, margin, cursorY);

    autoTable(doc, {
      startY: cursorY + 8,
      margin: { left: margin, right: margin },
      head,
      body,
      foot,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [51, 65, 85] },
      footStyles: { fillColor: [226, 232, 240], textColor: 0, fontStyle: "bold" },
      // columnStyles only applies to body cells in jspdf-autotable, so head/foot
      // cells (e.g. the "Total" row) need this hook to pick up the same alignment.
      didParseCell: (data) => {
        if (data.column.index === durationColumnIndex || data.column.index === amountColumnIndex) {
          data.cell.styles.halign = "right";
        }
      },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  }

  if (sections.length === 0) {
    doc.setFontSize(11);
    doc.text("No entries in this date range.", margin, cursorY);
  } else {
    if (cursorY > doc.internal.pageSize.getHeight() - 70) {
      doc.addPage();
      cursorY = margin;
    }
    doc.setFontSize(11);
    doc.text("Summary", margin, cursorY);

    autoTable(doc, {
      startY: cursorY + 8,
      margin: { left: margin, right: margin },
      body: [["Total hours", formatDuration(grandTotalSeconds)]],
      styles: { fontSize: 10, cellPadding: 6 },
      bodyStyles: { fillColor: [226, 232, 240], textColor: 0, fontStyle: "bold" },
      columnStyles: { 1: { halign: "right" } },
    });
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.textWithLink(FOOTER_TEXT, margin, pageHeight - 20, { url: FOOTER_URL });
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 20, { align: "right" });
  }
  doc.setTextColor(0);

  return new Uint8Array(doc.output("arraybuffer"));
}
