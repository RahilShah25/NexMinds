/**
 * pdfExport.js
 * Publication-quality A4 PDF exporter for Cheatsheets.
 * Engineered for clean typography, proper card hierarchy, zero character-encoding artifacts,
 * and seamless offline study reference.
 */

import { jsPDF } from 'jspdf';

// ─── Unicode to Safe ASCII/Latin-1 Sanitizer ───────────────────────────────────
// Converts smart quotes, dashes, mathematical symbols, and arrows into safe
// characters that standard PDF engines can render without garbling or throwing errors.
export function toSafePdfText(str) {
  if (!str) return '';
  return String(str)
    // Smart quotes & apostrophes
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Dashes & hyphens
    .replace(/[\u2013\u2014\u2015]/g, '-')
    // Bullets & symbols
    .replace(/[\u2022\u25C6\u25CF\u25A0\u25AA\u2023]/g, '-')
    // Arrows
    .replace(/[\u2192\u279C\u2794]/g, '->')
    .replace(/[\u2190]/g, '<-')
    .replace(/[\u2194]/g, '<->')
    .replace(/[\u21D2]/g, '=>')
    // Common Math symbols
    .replace(/[\u2264]/g, '<=')
    .replace(/[\u2265]/g, '>=')
    .replace(/[\u2260]/g, '!=')
    .replace(/[\u2248]/g, '~=')
    .replace(/[\u00B1]/g, '+/-')
    .replace(/[\u00D7]/g, '*')
    .replace(/[\u00F7]/g, '/')
    .replace(/[\u00B2]/g, '^2')
    .replace(/[\u00B3]/g, '^3')
    .replace(/[\u221A]/g, 'sqrt')
    .replace(/[\u221E]/g, 'infinity')
    // Greek symbols commonly in CS/Engineering
    .replace(/[\u03B1]/g, 'alpha')
    .replace(/[\u03B2]/g, 'beta')
    .replace(/[\u03BB]/g, 'lambda')
    .replace(/[\u03BC]/g, 'mu')
    .replace(/[\u03C0]/g, 'pi')
    .replace(/[\u03B8]/g, 'theta')
    .replace(/[\u03A9]/g, 'Omega')
    .replace(/[\u2211]/g, 'sum')
    // Strip non-printable control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Generates and downloads a clean, multi-page vector A4 Cheatsheet PDF.
 */
export function exportCheatsheetToPDF(data) {
  if (!data) return false;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const bottomThreshold = pageHeight - 20;

  let y = margin;

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const drawPageHeaderBar = () => {
    // Top primary accent strip (Sky Blue #0284c7)
    doc.setFillColor(2, 132, 199);
    doc.rect(0, 0, pageWidth, 4, 'F');
  };

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > bottomThreshold) {
      doc.addPage();
      drawPageHeaderBar();
      y = margin + 5;
      return true;
    }
    return false;
  };

  // ─── 1. Header (Page 1) ─────────────────────────────────────────────────────
  drawPageHeaderBar();

  // Top pill badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(2, 132, 199); // #0284c7
  doc.text('NEXMINDS MASTER REVISION GUIDE  *  HIGH-YIELD CHEATSHEET', margin, y + 4);
  y += 9;

  // Title
  const rawTitle = toSafePdfText(data.title || 'Document Master Cheatsheet');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // #0f172a Slate 900
  const titleLines = doc.splitTextToSize(rawTitle, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6.5 + 2;

  // Date and Meta Row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // #64748b
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(`Generated: ${dateStr}  |  Complete Document Conceptual Synthesis`, margin, y);
  y += 4.5;

  // Dividing Rule
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ─── 2. Executive Summary Card ──────────────────────────────────────────────
  if (data.summary) {
    const rawSummary = toSafePdfText(data.summary);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);

    const summaryLines = doc.splitTextToSize(rawSummary, contentWidth - 10);
    const boxHeight = summaryLines.length * 4.2 + 7;

    checkPageBreak(boxHeight + 5);

    // Summary Card Background
    doc.setFillColor(248, 250, 252); // #f8fafc
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

    // Left indicator stripe
    doc.setFillColor(2, 132, 199);
    doc.rect(margin, y, 2.5, boxHeight, 'F');

    // Text
    doc.setTextColor(51, 65, 85); // #334155
    doc.text(summaryLines, margin + 6, y + 4.8);
    y += boxHeight + 5;
  }

  // ─── 3. Sections / Modules ──────────────────────────────────────────────────
  if (Array.isArray(data.sections) && data.sections.length > 0) {
    data.sections.forEach((sec, idx) => {
      const headingText = toSafePdfText(sec.heading || `Concept Module ${idx + 1}`);
      const headingFull = `${idx + 1}. ${headingText}`;

      checkPageBreak(18);

      // Section Header Banner Card
      doc.setFillColor(241, 245, 249); // #f1f5f9
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(headingFull, margin + 3.5, y + 4.8);
      y += 10;

      // Bullet Points
      if (Array.isArray(sec.points)) {
        sec.points.forEach((pt) => {
          const cleanPt = toSafePdfText(pt);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);

          const bulletLines = doc.splitTextToSize(cleanPt, contentWidth - 10);
          const itemHeight = bulletLines.length * 4 + 2;

          checkPageBreak(itemHeight);

          // Vector circle bullet (100% vector-sharp, zero font-encoding dependency)
          doc.setFillColor(2, 132, 199); // Sky blue
          doc.circle(margin + 3, y + 1.8, 0.75, 'F');

          // Bullet text
          doc.setTextColor(51, 65, 85);
          doc.text(bulletLines, margin + 7.5, y + 2.4);
          y += itemHeight;
        });
      }

      // Formula / Code Box (if present)
      if (sec.formula) {
        const cleanFormula = toSafePdfText(sec.formula);
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);

        const formulaLines = doc.splitTextToSize(cleanFormula, contentWidth - 12);
        const fBoxHeight = formulaLines.length * 4.2 + 5;

        checkPageBreak(fBoxHeight + 3);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225); // #cbd5e1
        doc.roundedRect(margin + 4, y, contentWidth - 8, fBoxHeight, 1.2, 1.2, 'FD');

        doc.setTextColor(15, 23, 42);
        doc.text(formulaLines, margin + 8, y + 4);
        y += fBoxHeight + 3.5;
      }

      y += 2.5; // Gap between sections
    });
  }

  // ─── 4. Essential Key Terms & Vocabulary ───────────────────────────────────
  if (Array.isArray(data.keyTerms) && data.keyTerms.length > 0) {
    checkPageBreak(22);

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(2, 132, 199);
    doc.text('Key Terms & Definitions', margin, y + 4);
    y += 6.5;

    doc.setDrawColor(186, 230, 253);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4.5;

    data.keyTerms.forEach((kt) => {
      const termName = toSafePdfText(kt.term);
      const defText = toSafePdfText(kt.definition);
      if (!termName) return;

      const fullLine = `${termName}: ${defText}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      const lines = doc.splitTextToSize(fullLine, contentWidth - 6);
      const rowHeight = lines.length * 4 + 2;

      checkPageBreak(rowHeight);

      // Render bold term prefix
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const termLabel = `${termName}: `;
      const termWidth = doc.getTextWidth(termLabel);
      doc.text(termLabel, margin + 2, y + 2.5);

      // Render definition
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      const firstLineBudget = contentWidth - termWidth - 8;
      const defLines = doc.splitTextToSize(defText, contentWidth - 6);

      if (defLines.length <= 1 && doc.getTextWidth(defText) <= firstLineBudget) {
        doc.text(defText, margin + 2 + termWidth, y + 2.5);
        y += 5.5;
      } else {
        // Multi-line definition with clean wrapping
        doc.text(lines[0].replace(termLabel, ''), margin + 2 + termWidth, y + 2.5);
        for (let li = 1; li < lines.length; li++) {
          doc.text(lines[li], margin + 6, y + 2.5 + li * 4);
        }
        y += lines.length * 4 + 2;
      }
    });

    y += 3;
  }

  // ─── 5. High-Yield Exam Facts ───────────────────────────────────────────────
  if (Array.isArray(data.quickFacts) && data.quickFacts.length > 0) {
    checkPageBreak(22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(217, 119, 6); // Amber #d97706
    doc.text('High-Yield Exam Takeaways', margin, y + 4);
    y += 6.5;

    doc.setDrawColor(254, 215, 170);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4.5;

    data.quickFacts.forEach((fact, fi) => {
      const cleanFact = toSafePdfText(fact);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      const numStr = `[${fi + 1}] `;
      doc.setFont('helvetica', 'bold');
      const numWidth = doc.getTextWidth(numStr);

      const factLines = doc.splitTextToSize(cleanFact, contentWidth - numWidth - 6);
      const itemH = factLines.length * 4 + 2.5;

      checkPageBreak(itemH);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(217, 119, 6);
      doc.text(numStr, margin + 2, y + 2.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(factLines, margin + 2 + numWidth, y + 2.5);

      y += itemH;
    });
  }

  // ─── 6. Running Footers on All Pages ────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Subtle divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    // Left brand note
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // #94a3b8
    doc.text('NexMinds Study Intelligence  *  Master Revision Cheatsheet', margin, pageHeight - 6.5);

    // Right page number
    const pageStr = `Page ${p} of ${totalPages}`;
    const pageStrWidth = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageWidth - margin - pageStrWidth, pageHeight - 6.5);
  }

  // ─── 7. Save & Trigger Download ─────────────────────────────────────────────
  const rawClean = toSafePdfText(data.title || 'Cheatsheet');
  const safeFilename = rawClean
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 50) || 'Cheatsheet';

  doc.save(`${safeFilename}_Cheatsheet.pdf`);
  return true;
}

/**
 * Triggers standard browser print dialog for native vector PDF export.
 */
export function printCheatsheet() {
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print();
    return true;
  }
  return false;
}
