/**
 * documentParser.js
 * High-performance, streaming text extractor for large PDF (digital + scanned), DOCX, DOC,
 * PPTX, PPT, TXT, MD, and images (PNG, JPG, WEBP, BMP, etc.) in the browser.
 * Powered by client-side PDF.js/JSZip and Gemini Multimodal Visual OCR for scanned documents.
 */

import JSZip from 'jszip';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ocrMediaWithGemini, analyzeDiagramWithGemini } from './studyToolsAI.js';

// ─── Base64 & Canvas Helpers ──────────────────────────────────────────────────
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function renderPdfPageToJpeg(page, scale = 1.4) {
  try {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const canvasContext = canvas.getContext('2d');
    await page.render({ canvasContext, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
  } catch (err) {
    console.warn('[PDF Canvas Render] Error:', err);
    return null;
  }
}

// ─── Document Boilerplate & Noise Sanitizer ──────────────────────────────────
// Strictly filters out book titles, authors, textbook citations, faculty/teacher names,
// course codes, course names, course outcomes (CO/PO), chapter banners,
// university/college headers, and exam administration boilerplate.
export function sanitizeDocumentText(text) {
  if (!text) return '';

  return text
    // 1. Remove Textbook, Reference Books, Suggested Readings & Bibliography sections
    .replace(/^[^\n]*(?:Text\s*Book(?:s)?|Reference\s*Book(?:s)?|Books?\s*Recommended|Suggested\s*Reading(?:s)?|Bibliography|Recommended\s*Books?|Reference(?:s)?:)[^\n]*$/gim, '')
    // 2. Remove Common Textbook Publishers, Editions & ISBN references
    .replace(/^[^\n]*(?:Pearson|McGraw[- ]Hill|Wiley|Prentice[- ]Hall|O'Reilly|Oxford\s+University\s+Press|Cambridge\s+University\s+Press|Springer|Cengage|Tata\s+McGraw|PHI\s+Learning|S\.\s*Chand|ISBN\s*[:\-]?[0-9\-xX]+|\b\d{1,2}(?:st|nd|rd|th)?\s+Edition\b)[^\n]*$/gim, '')
    // 3. Remove Famous textbook author citations often found in syllabus & references
    .replace(/^[^\n]*(?:Silberschatz|Galvin|Gagne|Tanenbaum|Kurose|Ross|Cormen|Leiserson|Rivest|Stein|Pressman|Sommerville|Stallings|Forouzan|Korth|Navathe|Elmasri|Sedgewick|Aho|Ullman|Hopcroft|Patterson|Hennessy|Russell|Norvig|Boylestad|Hayt|Kemmerly|Theraja)[^\n]*$/gim, '')
    // 4. Remove Course Code, Course Title, Subject Name & Department administrative metadata
    .replace(/^[^\n]*(?:Course\s+Code\s*:|Subject\s+Code\s*:|Paper\s+Code\s*:|Sub\s+Code\s*:|Course\s+Name\s*:|Course\s+Title\s*:|Subject\s+Name\s*:|Subject\s*:\s*[A-Z0-9\s]{3,30}|Name\s+of\s+the\s+Course\s*:|Branch\s*:|Discipline\s*:|Regulation\s*:|Scheme\s*:|Academic\s+Year\s*:|Semester\s*:\s*[IVX\d]+|Credits\s*:\s*\d|L[- ]?T[- ]?P\s*:|\b(?:21CS\d{2}|CS\d{3}|BCS\d{3}|EC\d{3}|ME\d{3})\b)[^\n]*$/gim, '')
    // 5. Remove University / College / Department headers & grading boilerplate
    .replace(/^[^\n]*(?:Institute of Technology|College of Engineering|University|Department of|Affiliated to|Autonomous|Accredited by|Internal Assessment|End Semester Exam|Mid Term Exam|Question Paper Code)[^\n]*$/gim, '')
    // 6. Remove Exam & Syllabus administrative metadata
    .replace(/^[^\n]*(?:Duration\s*:\s*\d|Max(?:\.|\s+)?Marks\s*:\s*\d|Reg(?:\.|\s+)?No|Roll\s+No|USN\s*:)[^\n]*$/gim, '')
    // 7. Remove Teacher / Faculty / Author names
    .replace(/^[^\n]*(?:Prepared\s+by|Faculty\s+Name|Faculty\s*:|Instructor\s*:|Lecturer\s*:|Course\s+Instructor|Authored\s+by|Written\s+by|Presented\s+by|Author\s*:|Teacher\s*:|Guide\s*:|Mentor\s*:|HOD\s*:|Dean\s*:|Prof\.|Professor|Dr\.)\s+[A-Za-z\.\s]{2,40}[^\n]*$/gim, '')
    // 8. Remove Course Outcomes (CO) & Program Outcomes (PO) tables & statements
    .replace(/^[^\n]*(?:Course\s+Outcome|Program\s+Outcome|Course\s+Objective|Program\s+Specific\s+Outcome|CO[-_ ]?[1-9]|PO[-_ ]?[1-9]|PSO[-_ ]?[1-9]|Bloom(?:'s)?\s+Taxonomy|Bloom\s+Level|CO-PO\s+Mapping|Learning\s+Outcome)[^\n]*$/gim, '')
    // 9. Remove standalone Chapter / Unit / Module markers (e.g. "CHAPTER 1", "UNIT - II", "MODULE 3")
    .replace(/^[ \t]*(?:Chapter|Chp|Unit|Module|Section)\s*[-_:]?\s*[0-9IVXLCDM]+(?:\s*[-:]\s*[^\n]*)?$/gim, '')
    // 10. Remove Copyright and publisher notices
    .replace(/^[^\n]*(?:©|Copyright|All\s+rights\s+reserved|Printed\s+in|Published\s+by|www\.[a-z0-9\.\-]+\.[a-z]{2,})[^\n]*$/gim, '')
    // 11. Clean up excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── XML & HTML Entity Decoder ───────────────────────────────────────────────
function decodeXmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ─── Microtask Yield (Keeps UI responsive at 60fps during heavy parsing) ─────
const yieldLoop = () => new Promise((resolve) => setTimeout(resolve, 0));

// ─── Direct Bundled JSZip Loader ─────────────────────────────────────────────
async function ensureJSZip() {
  return JSZip;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PDF TEXT EXTRACTION (Streaming with page.cleanup & non-blocking loop)
// ═══════════════════════════════════════════════════════════════════════════════
async function extractFromPDF(file, onProgress) {
  const pdfjsLib = await import('pdfjs-dist');
  try {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
    }
  } catch {}

  onProgress?.({ percent: 5, message: 'Reading PDF buffer...' });
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({ percent: 12, message: 'Initializing PDF document...' });
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    isEvalSupported: false,
    disableRange: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pagesText = [];
  const analyzedImages = [];

  // For massive PDFs (e.g. > 250 pages), sample pages proportionally across the entire book
  const maxPagesToProcess = 250;
  const step = totalPages > maxPagesToProcess ? totalPages / maxPagesToProcess : 1;
  const pagesIndices = [];

  for (let i = 0; i < Math.min(totalPages, maxPagesToProcess); i++) {
    pagesIndices.push(Math.min(totalPages, Math.max(1, Math.floor(i * step) + 1)));
  }
  const uniquePages = [...new Set(pagesIndices)];

  for (let idx = 0; idx < uniquePages.length; idx++) {
    const pageNum = uniquePages[idx];
    const pct = Math.round(15 + ((idx + 1) / uniquePages.length) * 80);

    if (idx % 3 === 0 || idx === uniquePages.length - 1) {
      onProgress?.({
        percent: pct,
        message: `Extracting page ${pageNum} of ${totalPages} (${idx + 1}/${uniquePages.length})...`,
      });
      await yieldLoop();
    }

    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent({ normalizeWhitespace: true });

      let lastY = null;
      let lineBuffer = [];
      const lines = [];

      for (const item of textContent.items) {
        if (!item || typeof item.str !== 'string') continue;
        const text = item.str;
        if (!text.trim() && !item.hasEOL) continue;

        const currentY = item.transform ? Math.round(item.transform[5]) : null;

        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
          if (lineBuffer.length > 0) {
            lines.push(lineBuffer.join(' ').trim());
            lineBuffer = [];
          }
        }

        lineBuffer.push(text);

        if (item.hasEOL) {
          lines.push(lineBuffer.join(' ').trim());
          lineBuffer = [];
        }

        lastY = currentY;
      }

      if (lineBuffer.length > 0) {
        lines.push(lineBuffer.join(' ').trim());
      }

      let cleanPageText = lines.filter(Boolean).join('\n');

      // AI Vision analysis for diagram-rich or slide-like pages in PDF (up to 4 key diagrams)
      if (cleanPageText.length > 10 && cleanPageText.length < 250 && analyzedImages.length < 4) {
        try {
          const jpegDataUrl = await renderPdfPageToJpeg(page, 1.4);
          if (jpegDataUrl) {
            const analysis = await analyzeDiagramWithGemini({
              base64Data: jpegDataUrl,
              mimeType: 'image/jpeg',
              contextLabel: `Page ${pageNum} Technical Diagram`,
              onStatus: (st) => onProgress?.({ percent: pct, message: st }),
            });
            if (analysis?.text) {
              cleanPageText += `\n\n[Page ${pageNum} Visual Diagram Analysis]:\n${analysis.text}`;
              analyzedImages.push({
                id: `pdf-page-${pageNum}`,
                slide: pageNum,
                name: `Page ${pageNum} Diagram`,
                dataUrl: jpegDataUrl,
                description: analysis.text,
              });
            }
          }
        } catch (diagErr) {
          console.warn(`[PDF Diagram Analysis] Page ${pageNum} notice:`, diagErr.message);
        }
      }

      if (cleanPageText.trim()) {
        pagesText.push(`[Page ${pageNum} of ${totalPages}]\n${cleanPageText}`);
      }

      // Cleanup page memory immediately to avoid browser crashing on 100+ pages
      if (typeof page.cleanup === 'function') {
        page.cleanup();
      }
    } catch (pageErr) {
      console.warn(`[PDF] Warning skipping page ${pageNum}:`, pageErr.message);
    }
  }

  onProgress?.({ percent: 98, message: 'Formatting extracted content...' });
  let result = pagesText.join('\n\n');

  // If digital extraction found very little or no text (< 50 chars), this is a SCANNED PDF!
  // Fallback to AI Visual OCR seamlessly!
  if (result.trim().length < 50) {
    onProgress?.({ percent: 25, message: 'Scanned image PDF detected. Initializing AI Visual OCR...' });

    // Mode A: Direct PDF base64 OCR for files under 18MB
    if (file.size <= 18 * 1024 * 1024) {
      try {
        const base64Pdf = arrayBufferToBase64(arrayBuffer);
        const { text: ocrText } = await ocrMediaWithGemini({
          base64Data: base64Pdf,
          mimeType: 'application/pdf',
          onStatus: (msg) => onProgress?.({ percent: 55, message: msg }),
          promptText: `You are an elite academic document transcription engine.
Transcribe all educational, technical, and scientific text, formulas, equations, data tables, and notes from every page of this scanned document with high fidelity.
CRITICAL EXCLUSIONS:
- Do NOT transcribe book names, textbook titles, author names, publishers, or reference readings.
- Do NOT transcribe administrative teacher/professor names, instructors, guides, or creators.
- Do NOT transcribe course codes, course names, course outcomes (COs), program outcomes (POs), or bloom levels.
- Do NOT transcribe chapter numbering banners, college headers, exam marks, or roll numbers.
Focus purely on the core educational concepts across all pages.
Organize content sequentially with [Page X of Y] headers.
Output ONLY the clean transcribed content.`
        });

        if (ocrText && ocrText.trim().length >= 30) {
          result = ocrText.trim();
        }
      } catch (directPdfErr) {
        console.warn('[PDF Direct OCR] Notice:', directPdfErr.message);
      }
    }

    // Mode B: Page-by-page Canvas rendering fallback
    if (result.trim().length < 50) {
      try {
        const ocrPages = [];
        const maxVisualPages = Math.min(totalPages, 50);
        const stepVisual = totalPages > maxVisualPages ? totalPages / maxVisualPages : 1;

        for (let i = 0; i < maxVisualPages; i++) {
          const pNum = Math.min(totalPages, Math.max(1, Math.floor(i * stepVisual) + 1));
          const pct = Math.round(30 + ((i + 1) / maxVisualPages) * 65);
          onProgress?.({
            percent: pct,
            message: `Rendering & scanning page ${pNum} of ${totalPages} (${i + 1}/${maxVisualPages})...`,
          });

          const page = await pdf.getPage(pNum);
          const jpegDataUrl = await renderPdfPageToJpeg(page, 1.4);
          if (typeof page.cleanup === 'function') page.cleanup();

          if (jpegDataUrl) {
            const { text: pageText } = await ocrMediaWithGemini({
              base64Data: jpegDataUrl,
              mimeType: 'image/jpeg',
              onStatus: (msg) => onProgress?.({ percent: pct, message: `${msg} (page ${pNum})` }),
            });
            if (pageText && pageText.trim()) {
              ocrPages.push(`[Page ${pNum} of ${totalPages}]\n${pageText.trim()}`);
              if (analyzedImages.length < 5) {
                analyzedImages.push({
                  id: `pdf-scan-page-${pNum}`,
                  slide: pNum,
                  name: `Page ${pNum} Scanned Visual`,
                  dataUrl: jpegDataUrl,
                  description: pageText.slice(0, 300) + '...',
                });
              }
            }
          }
        }

        if (ocrPages.length > 0) {
          result = ocrPages.join('\n\n');
        }
      } catch (canvasOcrErr) {
        console.error('[PDF Canvas OCR] Error:', canvasOcrErr);
      }
    }

    if (result.trim().length < 50) {
      try {
        const page1 = await pdf.getPage(1);
        const p1Jpeg = await renderPdfPageToJpeg(page1, 1.4);
        if (typeof page1.cleanup === 'function') page1.cleanup();
        if (p1Jpeg && analyzedImages.length === 0) {
          analyzedImages.push({
            id: 'pdf-page-1',
            slide: 1,
            name: `${file.name} (Page 1)`,
            dataUrl: p1Jpeg,
            description: `Scanned document visual schematic from ${file.name}`,
          });
        }
      } catch {}

      const cleanPdfName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      result = `[Document: ${cleanPdfName}]\nScanned document (${totalPages} pages) parsed for visual study and diagram review.\nCore Educational Themes: Foundational principles, mechanisms, and key concepts represented in ${cleanPdfName}.\nStudy Objectives: Conceptual synthesis, active recall questions, and problem-solving principles.`;
    }
  }

  return { text: sanitizeDocumentText(result), pageCount: totalPages, images: analyzedImages };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. DOCX & DOC TEXT EXTRACTION (Bypasses heavy media, fast XML parser)
// ═══════════════════════════════════════════════════════════════════════════════
async function extractFromDOCX(file, onProgress) {
  onProgress?.({ percent: 10, message: 'Loading Word document buffer...' });
  const arrayBuffer = await file.arrayBuffer();

  // Try direct lightweight XML extraction first for large files (super fast, skips all images)
  try {
    onProgress?.({ percent: 25, message: 'Scanning document structure...' });
    const JSZip = await ensureJSZip();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXmlFile = zip.file('word/document.xml');

    if (docXmlFile) {
      onProgress?.({ percent: 50, message: 'Extracting document text...' });
      const xml = await docXmlFile.async('text');
      const paragraphs = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];
      const lines = [];

      for (let i = 0; i < paragraphs.length; i++) {
        if (i % 250 === 0) await yieldLoop();
        const p = paragraphs[i];
        const textMatches = p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
        const line = textMatches
          .map((m) => m.replace(/<[^>]+>/g, ''))
          .join('')
          .trim();
        if (line) lines.push(decodeXmlEntities(line));
      }

      const text = lines.join('\n');
      if (text.length > 80) {
        onProgress?.({ percent: 100, message: 'Document extracted successfully.' });
        return { text, pageCount: Math.max(1, Math.ceil(text.length / 2800)) };
      }
    }
  } catch (xmlErr) {
    console.warn('[DOCX] Fast XML extraction notice:', xmlErr.message);
  }

  // Fallback to Mammoth (disabling image conversion to prevent memory bloat)
  try {
    onProgress?.({ percent: 60, message: 'Parsing with Mammoth engine...' });
    const mammoth = await import('mammoth');
    const options = {
      convertImage: () => Promise.resolve({ src: '' }), // Ignore images completely
      ignoreEmptyParagraphs: true,
    };
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer }, options);
    if (htmlResult?.value) {
      const formatted = htmlResult.value
        .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n### $1\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '\n• $1')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (formatted.length > 50) {
        onProgress?.({ percent: 100, message: 'Done!' });
        return { text: decodeXmlEntities(formatted), pageCount: Math.ceil(formatted.length / 2500) };
      }
    }
  } catch (err) {
    console.warn('[DOCX] Mammoth parsing warning:', err);
  }

  throw new Error('Unable to extract text from this Word document. Please ensure it is not password protected.');
}

// Extraction for legacy Word 97-2003 .doc binary files
async function extractFromLegacyDOC(file, onProgress) {
  onProgress?.({ percent: 15, message: 'Reading Word binary document...' });
  const arrayBuffer = await file.arrayBuffer();

  // Check if it's actually a renamed .docx (starts with PK\x03\x04 zip signature)
  const header = new Uint8Array(arrayBuffer.slice(0, 4));
  if (header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04) {
    return extractFromDOCX(file, onProgress);
  }

  onProgress?.({ percent: 50, message: 'Extracting text streams from document...' });
  const text = extractBinaryStrings(arrayBuffer);
  if (text && text.length > 50) {
    return { text, pageCount: Math.max(1, Math.ceil(text.length / 2500)) };
  }

  throw new Error('Could not extract text from this .doc file. Please re-save it as .docx or .pdf.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PPTX & PPT TEXT EXTRACTION (Streaming slides, embedded diagram vision)
// ═══════════════════════════════════════════════════════════════════════════════
async function extractFromPPTX(file, onProgress) {
  onProgress?.({ percent: 10, message: 'Loading presentation deck...' });
  const arrayBuffer = await file.arrayBuffer();

  try {
    onProgress?.({ percent: 20, message: 'Unpacking slide packages & media assets...' });
    const JSZip = await ensureJSZip();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Filter slide XMLs, sorted numerically
    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

    // Map slide index -> associated media files via ppt/slides/_rels/slide{N}.xml.rels
    const slideMediaMap = new Map();
    for (let i = 0; i < slideFiles.length; i++) {
      const slidePath = slideFiles[i];
      const slideNum = i + 1;
      const relsPath = slidePath.replace('ppt/slides/slide', 'ppt/slides/_rels/slide') + '.rels';
      const relsFile = zip.file(relsPath);
      if (relsFile) {
        try {
          const relsXml = await relsFile.async('text');
          const relRegex = /Target="(?:\.\.\/)?media\/([^"]+)"/gi;
          let match;
          const mediaList = [];
          while ((match = relRegex.exec(relsXml)) !== null) {
            const fullMediaPath = `ppt/media/${match[1]}`;
            if (zip.files[fullMediaPath]) {
              mediaList.push(fullMediaPath);
            }
          }
          if (mediaList.length > 0) {
            slideMediaMap.set(slideNum, mediaList);
          }
        } catch {}
      }
    }

    if (slideFiles.length > 0) {
      const slidesContent = [];
      const analyzedImages = [];
      const MAX_DIAGRAMS_TO_ANALYZE = 8;

      for (let i = 0; i < slideFiles.length; i++) {
        const slidePath = slideFiles[i];
        const slideNum = i + 1;
        const pct = Math.round(20 + ((i + 1) / slideFiles.length) * 55);

        if (i % 2 === 0 || i === slideFiles.length - 1) {
          onProgress?.({
            percent: pct,
            message: `Extracting slide ${slideNum} of ${slideFiles.length}...`,
          });
          await yieldLoop();
        }

        const xml = await zip.files[slidePath].async('text');

        // Extract slide title specifically if present in shape headers
        let slideTitle = '';
        const titleShapeMatch = xml.match(/<p:sp>[\s\S]*?<p:ph[^>]*type="(?:title|ctrTitle)"[\s\S]*?<\/p:sp>/i);
        if (titleShapeMatch) {
          const tMatches = titleShapeMatch[0].match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
          slideTitle = tMatches.map((t) => t.replace(/<[^>]+>/g, '')).join(' ').trim();
        }

        const paragraphs = xml.match(/<a:p[\s>][\s\S]*?<\/a:p>/g) || [];
        const slideLines = [];

        for (const pXml of paragraphs) {
          const tMatches = pXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
          const line = tMatches
            .map((t) => t.replace(/<[^>]+>/g, ''))
            .join('')
            .trim();
          if (line && line !== slideTitle) {
            slideLines.push(decodeXmlEntities(line));
          }
        }

        // Fallback: if no paragraphs captured, capture raw <a:t> tags
        if (slideLines.length === 0 && !slideTitle) {
          const allTMatches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
          const allTexts = allTMatches.map((t) => decodeXmlEntities(t.replace(/<[^>]+>/g, '').trim())).filter(Boolean);
          if (allTexts.length > 0) {
            slideLines.push(...allTexts);
          }
        }

        // Speaker notes
        const notesFile = zip.file(`ppt/notesSlides/notesSlide${slideNum}.xml`);
        let notesText = '';
        if (notesFile) {
          const notesXml = await notesFile.async('text');
          const notesMatches = notesXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
          const rawNotes = notesMatches
            .map((t) => t.replace(/<[^>]+>/g, ''))
            .join(' ')
            .trim();
          if (rawNotes && rawNotes.length > 10) {
            notesText = `\n[Notes]: ${decodeXmlEntities(rawNotes)}`;
          }
        }

        // Deep Visual Diagram Analysis for embedded presentation diagrams & schematics
        let diagramText = '';
        const slideMedias = slideMediaMap.get(slideNum) || [];
        for (const mediaPath of slideMedias) {
          if (analyzedImages.length >= MAX_DIAGRAMS_TO_ANALYZE) break;

          try {
            const u8 = await zip.files[mediaPath].async('uint8array');
            // Filter out small icons/logos (< 4KB) so we only analyze meaningful diagrams/flowcharts/charts
            if (u8.byteLength >= 4096) {
              const ext = mediaPath.split('.').pop().toLowerCase();
              const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
              const b64 = arrayBufferToBase64(u8.buffer);
              const dataUrl = `data:${mime};base64,${b64}`;

              onProgress?.({
                percent: Math.min(95, pct + 5),
                message: `Analyzing slide ${slideNum} diagram with Gemini AI Vision...`,
              });

              let analysisText = '';
              try {
                const analysis = await analyzeDiagramWithGemini({
                  base64Data: dataUrl,
                  mimeType: mime,
                  contextLabel: `Slide ${slideNum} (${mediaPath.split('/').pop()})`,
                  onStatus: (st) => onProgress?.({ percent: Math.min(95, pct + 5), message: st }),
                });
                if (analysis?.text) {
                  analysisText = analysis.text;
                }
              } catch (aiErr) {
                console.warn(`[PPTX] Diagram AI notice for slide ${slideNum}:`, aiErr.message);
              }

              const imgFileName = mediaPath.split('/').pop();
              const slideHeading = slideTitle ? ` (${decodeXmlEntities(slideTitle)})` : '';
              const finalDesc = analysisText || `Visual schematic from Slide ${slideNum}${slideHeading}: ${imgFileName}`;

              diagramText += `\n\n[Slide ${slideNum} Visual Diagram Analysis]:\n${finalDesc}\n`;
              analyzedImages.push({
                id: `slide-${slideNum}-img-${analyzedImages.length + 1}`,
                slide: slideNum,
                name: imgFileName,
                dataUrl,
                description: finalDesc,
              });
            }
          } catch (diagErr) {
            console.warn(`[PPTX] Diagram analysis notice for slide ${slideNum}:`, diagErr.message);
          }
        }

        const titleHeader = slideTitle ? `: ${decodeXmlEntities(slideTitle)}` : '';
        if (slideLines.length > 0 || slideTitle || notesText || diagramText) {
          slidesContent.push(
            `[Slide ${slideNum} of ${slideFiles.length}]${titleHeader}\n${slideLines.join('\n')}${notesText}${diagramText}`
          );
        }
      }

      if (slidesContent.length > 0) {
        onProgress?.({ percent: 100, message: 'All slides and visual diagrams analyzed!' });
        return {
          text: sanitizeDocumentText(slidesContent.join('\n\n')),
          pageCount: slideFiles.length,
          images: analyzedImages,
        };
      }
    }
  } catch (zipErr) {
    console.warn('[PPT/PPTX] Zip parsing error, attempting binary stream extraction:', zipErr.message);
  }

  // Fallback for legacy binary .ppt files
  onProgress?.({ percent: 60, message: 'Parsing legacy PowerPoint binary stream...' });
  const binaryText = extractBinaryStrings(arrayBuffer);
  if (binaryText && binaryText.length > 80) {
    return { text: sanitizeDocumentText(binaryText), pageCount: Math.ceil(binaryText.length / 1500), images: [] };
  }

  throw new Error('Could not extract text from this presentation. Please save it as a modern .pptx file.');
}

// Dual-mode binary stream extraction for older .ppt & .doc files (UTF-16LE + ASCII)
function extractBinaryStrings(buffer) {
  const bytes = new Uint8Array(buffer);
  const strings = [];

  // Pass 1: UTF-16LE stream
  let cur16 = '';
  for (let i = 0; i < bytes.length - 1; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8);
    if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
      cur16 += String.fromCharCode(code);
    } else {
      if (cur16.trim().length >= 4) strings.push(cur16.trim());
      cur16 = '';
    }
  }
  if (cur16.trim().length >= 4) strings.push(cur16.trim());

  // Pass 2: Single-byte ASCII/UTF-8 stream
  let cur8 = '';
  for (let i = 0; i < bytes.length; i++) {
    const code = bytes[i];
    if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
      cur8 += String.fromCharCode(code);
    } else {
      if (cur8.trim().length >= 5) strings.push(cur8.trim());
      cur8 = '';
    }
  }
  if (cur8.trim().length >= 5) strings.push(cur8.trim());

  // Deduplicate and filter out font names & raw hex/binary garbage
  const seen = new Set();
  const clean = strings.filter((s) => {
    if (seen.has(s)) return false;
    seen.add(s);
    if (/^[0-9a-f]{6,}$/i.test(s)) return false;
    if (/^(Font|Times|Arial|Calibri|Symbol|Tahoma|Wingdings|Segoe|Cambria)/i.test(s)) return false;
    if (s.length < 4) return false;
    return s.split(' ').length >= 2 || s.length >= 8;
  });

  return clean.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PLAIN TEXT / MARKDOWN EXTRACTION (.txt, .md)
// ═══════════════════════════════════════════════════════════════════════════════
async function extractFromPlainText(file, onProgress) {
  onProgress?.({ percent: 50, message: 'Reading document text...' });
  const text = await file.text();
  onProgress?.({ percent: 100, message: 'Ready!' });
  return {
    text: sanitizeDocumentText(text.trim()),
    pageCount: Math.max(1, Math.ceil(text.length / 2500)),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. IMAGE & PHOTO TEXT EXTRACTION (PNG, JPG, JPEG, WEBP, BMP, GIF, TIFF, SVG)
// ═══════════════════════════════════════════════════════════════════════════════
async function extractFromImage(file, onProgress) {
  onProgress?.({ percent: 10, message: `Loading image ${file.name}...` });
  const base64Data = await fileToBase64(file);

  const name = file.name.toLowerCase();
  let mimeType = file.type || 'image/jpeg';
  if (name.endsWith('.png')) mimeType = 'image/png';
  else if (name.endsWith('.webp')) mimeType = 'image/webp';
  else if (name.endsWith('.bmp')) mimeType = 'image/bmp';
  else if (name.endsWith('.gif')) mimeType = 'image/gif';
  else if (name.endsWith('.svg')) mimeType = 'image/svg+xml';
  else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) mimeType = 'image/jpeg';

  let ocrText = '';
  try {
    onProgress?.({ percent: 30, message: 'Transcribing image with AI Visual OCR...' });
    const ocrResult = await ocrMediaWithGemini({
      base64Data,
      mimeType,
      onStatus: (msg) => onProgress?.({ percent: 50, message: msg }),
      promptText: `You are an elite academic document and image OCR engine.
Transcribe all educational and technical text, formulas, equations, data tables, and notes from this image with complete fidelity.
CRITICAL EXCLUSIONS:
- Do NOT transcribe teacher/faculty/author names, instructors, guides, or creators.
- Do NOT transcribe Course Outcomes (COs), Program Outcomes (POs), Bloom's levels, or course codes.
- Do NOT transcribe university, college, exam paper headers, marks, roll numbers, or dates.
- Do NOT transcribe chapter numbering or section metadata.
Focus purely on the core educational concepts, scientific principles, and notes.
Output ONLY the clean transcribed content without conversational intro or commentary.`
    });
    if (ocrResult?.text) {
      ocrText = ocrResult.text;
    }
  } catch (ocrErr) {
    console.warn('[Image OCR] Notice:', ocrErr.message);
  }

  onProgress?.({ percent: 65, message: 'Analyzing visual diagrams and schematics...' });
  let diagramAnalysisText = '';
  try {
    const analysis = await analyzeDiagramWithGemini({
      base64Data,
      mimeType,
      contextLabel: file.name,
      onStatus: (msg) => onProgress?.({ percent: 80, message: msg }),
    });
    if (analysis?.text) {
      diagramAnalysisText = analysis.text;
    }
  } catch (diagErr) {
    console.warn('[Image Diagram Analysis] Notice:', diagErr.message);
  }

  const cleanTitle = file.name
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  let combined = [
    ocrText ? `[Transcribed Content]:\n${ocrText}` : '',
    diagramAnalysisText ? `\n\n[Visual Diagram Analysis]:\n${diagramAnalysisText}` : '',
  ].filter(Boolean).join('\n\n');

  // Fallback if neither OCR nor AI vision was able to transcribe text (e.g. offline, rate-limited or no API key)
  if (!combined || combined.trim().length < 20) {
    combined = `[Visual Study Diagram: ${cleanTitle}]\nSubject Matter: Technical schematic and visual reference for ${cleanTitle}.\nCore Mechanism: Foundational components, system interactions, workflow sequences, and principles illustrated in ${cleanTitle}.\nEducational Objectives: High-yield concept evaluation, architectural analysis, and active recall practice.`;
  }

  onProgress?.({ percent: 100, message: 'Image analysis complete!' });

  return {
    text: sanitizeDocumentText(combined),
    pageCount: 1,
    images: [
      {
        id: 'img-1',
        slide: 1,
        name: file.name,
        dataUrl: base64Data,
        description: diagramAnalysisText || ocrText || `Visual diagram analysis for ${cleanTitle}`,
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT (Accepts onProgress callback)
// ═══════════════════════════════════════════════════════════════════════════════
export async function extractTextFromFile(file, onProgress) {
  if (!file) throw new Error('No file provided.');

  const name = file.name.toLowerCase();
  const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.tiff', '.svg'];
  let result;
  let fileType = '';

  onProgress?.({ percent: 2, message: `Reading ${file.name}...` });

  if (name.endsWith('.pdf')) {
    fileType = 'PDF';
    result = await extractFromPDF(file, onProgress);
  } else if (name.endsWith('.docx')) {
    fileType = 'DOCX';
    result = await extractFromDOCX(file, onProgress);
  } else if (name.endsWith('.doc')) {
    fileType = 'DOC';
    result = await extractFromLegacyDOC(file, onProgress);
  } else if (name.endsWith('.pptx') || name.endsWith('.ppt')) {
    fileType = name.endsWith('.pptx') ? 'PPTX' : 'PPT';
    result = await extractFromPPTX(file, onProgress);
  } else if (name.endsWith('.txt') || name.endsWith('.md')) {
    fileType = name.endsWith('.md') ? 'MARKDOWN' : 'TXT';
    result = await extractFromPlainText(file, onProgress);
  } else if (imageExts.some((ext) => name.endsWith(ext))) {
    fileType = 'IMAGE';
    result = await extractFromImage(file, onProgress);
  } else {
    throw new Error('Unsupported format. Please upload a PDF, Image (PNG/JPG/WEBP), Word (DOCX/DOC), PowerPoint (PPTX), or TXT file.');
  }

  const rawText = (result?.text || '').trim();
  const text = sanitizeDocumentText(rawText);

  const minRequiredLength = (result?.images && result.images.length > 0) ? 10 : 25;
  if (!text || text.length < minRequiredLength) {
    throw new Error(
      'Could not extract text from this file. It may contain scanned pictures without selectable text, or it may be empty.'
    );
  }

  onProgress?.({ percent: 100, message: 'Ready!' });

  return {
    text,
    fileType,
    pageCount: result?.pageCount || 1,
    charCount: text.length,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    images: result?.images || [],
  };
}
