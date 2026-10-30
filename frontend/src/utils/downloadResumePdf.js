// Match the uploaded resume's letter-size, serif, centered-header layout.
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT_MARGIN = 45;
const RIGHT_MARGIN = 45;
const TOP = 739;
const BOTTOM = 40;
const BODY_COLOR = "0.12 0.12 0.14";
const NAVY_COLOR = "0.10 0.20 0.36";
const MUTED_COLOR = "0.25 0.32 0.43";
const LINK_COLOR = "0.00 0.30 0.78";

const WIN_ANSI = new Map([
  ["€", 0x80], ["‚", 0x82], ["ƒ", 0x83], ["„", 0x84], ["…", 0x85],
  ["†", 0x86], ["‡", 0x87], ["ˆ", 0x88], ["‰", 0x89], ["Š", 0x8a],
  ["‹", 0x8b], ["Œ", 0x8c], ["Ž", 0x8e], ["‘", 0x91], ["’", 0x92],
  ["“", 0x93], ["”", 0x94], ["•", 0x95], ["–", 0x96], ["—", 0x97],
  ["˜", 0x98], ["™", 0x99], ["š", 0x9a], ["›", 0x9b], ["œ", 0x9c],
  ["ž", 0x9e], ["Ÿ", 0x9f],
]);

function toWinAnsiBytes(value) {
  const bytes = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint >= 32 && codePoint <= 126) {
      bytes.push(codePoint);
    } else if (codePoint >= 160 && codePoint <= 255) {
      bytes.push(codePoint);
    } else if (WIN_ANSI.has(character)) {
      bytes.push(WIN_ANSI.get(character));
    } else {
      const fallback = character.normalize("NFKD").replace(/\p{Diacritic}/gu, "");
      for (const part of fallback) {
        const point = part.codePointAt(0);
        bytes.push(point >= 32 && point <= 126 ? point : 63);
      }
    }
  }
  return bytes;
}

function pdfHex(value) {
  return `<${toWinAnsiBytes(value).map((byte) => byte.toString(16).padStart(2, "0")).join("")}>`;
}

function prepareLines(draft) {
  const lines = [];
  const rawLines = draft.replace(/\r/g, "").split("\n");
  const sourceLines = [];
  for (let index = 0; index < rawLines.length; index += 1) {
    const current = rawLines[index].trimEnd();
    const next = rawLines[index + 1]?.trim();
    if (/[–—-]\s*$/.test(current) && /^\d{4}$/.test(next || "")) {
      sourceLines.push(`${current} ${next}`);
      index += 1;
    } else {
      sourceLines.push(rawLines[index]);
    }
  }
  let hasTitle = false;
  let hasSection = false;
  let activeSection = "";

  for (const sourceLine of sourceLines) {
    const trimmed = sourceLine.trim();
    if (/^\d+\s*\/\s*\d+$/.test(trimmed)) continue;
    if (!trimmed) {
      if (lines.length && lines[lines.length - 1].type !== "space") {
        lines.push({ text: "", type: "space" });
      }
      continue;
    }

    const isMarkdownHeading = /^#{1,6}\s/.test(trimmed);
    const clean = trimmed.replace(/^#{1,6}\s*/, "").replace(/\*\*|__/g, "");
    const isBullet = /^(?:[-*•]\s*|\d+[.)]\s+)/.test(clean);
    const text = clean.replace(/^(?:[-*•]\s*|\d+[.)]\s+)/, "");
    const isSection =
      isMarkdownHeading ||
      /^(summary|professional summary|experience|work experience|employment|education|skills|technical skills|projects|certifications|additional information|awards|volunteer experience|positions of responsibility)$/i.test(text) ||
      (!isBullet && text.length < 48 && text === text.toUpperCase() && /[A-Z]/.test(text));

    if (!hasTitle) {
      lines.push({ text, type: "title" });
      hasTitle = true;
      continue;
    }

    if (!hasSection && !isSection && !isBullet) {
      lines.push({ text, type: "contact" });
      continue;
    }

    if (isSection) {
      hasSection = true;
      activeSection = text.toUpperCase();
      lines.push({ text: text.toUpperCase(), type: "section" });
      continue;
    }

    const isSubheading =
      !isBullet &&
      /\s\|\s/.test(text) &&
      text.length < 125 &&
      !/^(education|certifications)$/i.test(activeSection);
    const labelMatch = !isBullet && text.match(/^([A-Za-z][A-Za-z &/+#.-]{1,30}:)\s+(.+)$/);
    const type = isSubheading ? "subheading" : isBullet ? "bullet" : labelMatch ? "label" : "body";
    const maxCharacters = type === "bullet" ? 94 : 108;
    const words = text.split(/\s+/);
    const wrappedStart = lines.length;
    let current = "";
    let firstChunk = true;

    for (const word of words) {
      if (current && `${current} ${word}`.length > maxCharacters) {
        lines.push({ text: current, type, continuation: (type === "bullet" || type === "label") && !firstChunk });
        firstChunk = false;
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current) {
      lines.push({ text: current, type, continuation: (type === "bullet" || type === "label") && !firstChunk });
    }

    // Avoid leaving a single short word on a second line in long role/project
    // headings. Rebalance the final two chunks at a word boundary instead.
    const wrappedLines = lines.slice(wrappedStart);
    if (type === "subheading" && wrappedLines.length > 1) {
      const previous = wrappedLines.at(-2);
      const last = wrappedLines.at(-1);
      if (last.text.length < maxCharacters * 0.2 && previous.text.length > maxCharacters * 0.7) {
        const combinedWords = `${previous.text} ${last.text}`.split(/\s+/);
        let bestSplit = 1;
        let bestDifference = Infinity;
        for (let split = 1; split < combinedWords.length; split += 1) {
          const left = combinedWords.slice(0, split).join(" ");
          const right = combinedWords.slice(split).join(" ");
          if (left.length > maxCharacters || right.length > maxCharacters) continue;
          const difference = Math.abs(left.length - right.length);
          if (difference < bestDifference) {
            bestDifference = difference;
            bestSplit = split;
          }
        }
        const previousIndex = lines.length - 2;
        lines[previousIndex] = { ...previous, text: combinedWords.slice(0, bestSplit).join(" ") };
        lines[previousIndex + 1] = { ...last, text: combinedWords.slice(bestSplit).join(" ") };
      }
    }
  }

  while (lines.at(-1)?.type === "space") lines.pop();
  return lines;
}

function lineMetrics(line) {
  if (line.type === "title") return { size: 16, leading: 20, before: 0, after: 0 };
  if (line.type === "contact") return { size: 8.3, leading: 12, before: 0, after: 13 };
  if (line.type === "section") return { size: 10.5, leading: 13, before: 6, after: 3 };
  if (line.type === "subheading") return { size: 9.4, leading: 11, before: 2, after: line.continuation ? 0 : 1 };
  if (line.type === "space") return { size: 1, leading: 3, before: 0, after: 0 };
  return { size: 9.2, leading: 10.5, before: 0, after: line.continuation ? 0 : line.type === "bullet" ? 1 : 0.8 };
}

function centeredTextX(text, size, bold = false) {
  const averageCharacterWidth = bold ? 0.53 : 0.48;
  return Math.max(LEFT_MARGIN, (PAGE_WIDTH - text.length * size * averageCharacterWidth) / 2);
}

function lineHeight(line) {
  const metrics = lineMetrics(line);
  return metrics.before + metrics.leading + metrics.after;
}

function splitOversizedGroup(group, maxHeight) {
  const chunks = [];
  let chunk = [];
  let height = 0;
  for (const line of group) {
    const nextHeight = lineHeight(line);
    if (height + nextHeight > maxHeight && chunk.length) {
      chunks.push(chunk);
      chunk = [];
      height = 0;
    }
    chunk.push(line);
    height += nextHeight;
  }
  if (chunk.length) chunks.push(chunk);
  return chunks;
}

function paginate(lines) {
  const groups = [];
  let group = { lines: [], repeatSection: null, section: null };
  let activeSection = null;
  let hasSubheading = false;

  function finishGroup() {
    if (group.lines.length) groups.push(group);
  }

  for (const line of lines) {
    if (line.type === "section") {
      finishGroup();
      activeSection = line;
      hasSubheading = false;
      group = {
        lines: [line],
        repeatSection: null,
        section: line,
        pageBreakBefore: line.text === "EDUCATION",
      };
      continue;
    }
    if (line.type === "subheading" && hasSubheading) {
      finishGroup();
      group = {
        lines: [],
        repeatSection: activeSection,
        section: activeSection,
      };
    }
    group.lines.push(line);
    if (line.type === "subheading") hasSubheading = true;
  }
  finishGroup();

  const maxHeight = TOP - BOTTOM;
  const totalHeight = lines.reduce((sum, line) => sum + lineHeight(line), 0);
  if (totalHeight <= maxHeight) return [lines];

  const pages = [];
  let groupIndex = 0;
  const pageCount = Math.ceil(totalHeight / maxHeight);

  for (let pageIndex = 0; pageIndex < pageCount && groupIndex < groups.length; pageIndex += 1) {
    const page = [];
    let pageHeight = 0;

    while (groupIndex < groups.length) {
      const nextGroup = groups[groupIndex];
      const repeatedHeader = page.length === 0 && pageIndex > 0 && nextGroup.repeatSection
        ? { ...nextGroup.repeatSection, repeated: true }
        : null;
      const nextLines = repeatedHeader ? [repeatedHeader, ...nextGroup.lines] : nextGroup.lines;
      const nextHeight = nextLines.reduce((sum, line) => sum + lineHeight(line), 0);
      const pageAvailable = maxHeight;
      if (pageHeight && nextGroup.pageBreakBefore) break;
      if (pageHeight && pageHeight + nextHeight > pageAvailable) break;
      page.push(...nextLines);
      pageHeight += nextHeight;
      groupIndex += 1;
    }

    if (!page.length && groupIndex < groups.length) {
      const nextGroup = groups[groupIndex];
      const repeatedHeader = pageIndex > 0 && nextGroup.repeatSection
        ? { ...nextGroup.repeatSection, repeated: true }
        : null;
      const groupLines = repeatedHeader ? [repeatedHeader, ...nextGroup.lines] : nextGroup.lines;
      const chunks = splitOversizedGroup(groupLines, maxHeight);
      page.push(...chunks.shift());
      pageHeight = page.reduce((sum, line) => sum + lineHeight(line), 0);
      if (chunks.length) {
        groups.splice(groupIndex, 1, ...chunks.map((chunk) => ({ lines: chunk, repeatSection: null, section: nextGroup.section })));
      }
      else groupIndex += 1;
    }

    pages.push(page);
  }

  if (groupIndex < groups.length) {
    pages.push(...groups.slice(groupIndex).flatMap((leftover) => splitOversizedGroup(leftover.lines, maxHeight)));
  }
  return pages;
}

function makePageContent(lines) {
  const commands = [];
  let y = TOP;

  for (const line of lines) {
    const metrics = lineMetrics(line);
    if (line.type === "space") {
      y -= metrics.leading;
      continue;
    }
    y -= metrics.before;

    if (line.type === "section") {
      commands.push(`${NAVY_COLOR} rg`);
      commands.push(`${NAVY_COLOR} RG`);
      commands.push(`0.55 w ${LEFT_MARGIN} ${y - 3} m ${PAGE_WIDTH - RIGHT_MARGIN} ${y - 3} l S`);
      commands.push(`BT /F2 ${metrics.size} Tf ${LEFT_MARGIN} ${y} Td ${pdfHex(line.text)} Tj ET`);
    } else if (line.type === "title") {
      commands.push(`${NAVY_COLOR} rg`);
      const x = centeredTextX(line.text, metrics.size, true);
      commands.push(`BT /F2 ${metrics.size} Tf ${x} ${y} Td ${pdfHex(line.text)} Tj ET`);
    } else if (line.type === "contact") {
      let x = centeredTextX(line.text, metrics.size);
      const segments = line.text.split(/(\s*\|\s*)/);
      for (const segment of segments) {
        const isLink = /(linkedin|github|leetcode|portfolio|https?:\/\/|www\.)/i.test(segment);
        const width = segment.length * metrics.size * 0.48;
        commands.push(`${isLink ? LINK_COLOR : MUTED_COLOR} rg`);
        commands.push(`BT /F1 ${metrics.size} Tf ${x} ${y} Td ${pdfHex(segment)} Tj ET`);
        if (isLink) {
          commands.push(`${LINK_COLOR} RG`);
          commands.push(`0.35 w ${x} ${y - 2} m ${x + width} ${y - 2} l S`);
        }
        x += width;
      }
      commands.push(`${NAVY_COLOR} RG`);
      commands.push(`0.55 w ${LEFT_MARGIN} ${y - 12} m ${PAGE_WIDTH - RIGHT_MARGIN} ${y - 12} l S`);
    } else if (line.type === "label") {
      const label = line.text.match(/^([A-Za-z][A-Za-z &/+#.-]{1,30}:)\s+(.+)$/);
      if (label) {
        commands.push(`${BODY_COLOR} rg`);
        commands.push(`BT /F2 ${metrics.size} Tf ${LEFT_MARGIN} ${y} Td ${pdfHex(label[1])} Tj ET`);
        const labelWidth = label[1].length * metrics.size * 0.52;
        commands.push(`BT /F1 ${metrics.size} Tf ${LEFT_MARGIN + labelWidth} ${y} Td ${pdfHex(` ${label[2]}`)} Tj ET`);
      } else {
        commands.push(`${BODY_COLOR} rg`);
        commands.push(`BT /F1 ${metrics.size} Tf ${LEFT_MARGIN + 12} ${y} Td ${pdfHex(line.text)} Tj ET`);
      }
    } else {
      const color = line.type === "contact" ? MUTED_COLOR : BODY_COLOR;
      const font = line.type === "subheading" ? "F2" : "F1";
      const x = line.type === "bullet"
        ? line.continuation ? LEFT_MARGIN + 14 : LEFT_MARGIN + 12
        : LEFT_MARGIN + (line.type === "contact" ? 0 : line.continuation ? 12 : 0);
      commands.push(`${color} rg`);
      if (line.type === "bullet" && !line.continuation) {
        commands.push(`BT /F1 ${metrics.size} Tf ${LEFT_MARGIN} ${y} Td ${pdfHex("•")} Tj ET`);
      }
      commands.push(`BT /${font} ${metrics.size} Tf ${x} ${y} Td ${pdfHex(line.text)} Tj ET`);
    }

    y -= metrics.leading + metrics.after;
  }

  return commands.join("\n");
}

function createPdf(lines) {
  const pages = paginate(lines);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>",
  ];
  const pageObjectIds = [];
  pages.forEach((pageLines, index) => {
    const pageObjectId = objects.length + 1;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);
    const content = makePageContent(pageLines);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    );
    objects.push(`<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n%ResumeIQ\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

export function createResumePdf(draft) {
  return createPdf(prepareLines(draft));
}

export function downloadResumePdf(draft, fileName) {
  const pdf = createResumePdf(draft);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
