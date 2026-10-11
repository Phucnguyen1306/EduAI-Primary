import JSZip from "jszip";
import {
  Assignment,
  DocxInspectionData,
  ExtractedInspection,
  PptxInspectionData,
  PracticeFileType,
  Sb3InspectionData,
  ScratchSimulationStep,
} from "../types/grading";

export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim();
}

export function toCleanPascalIdentifier(str: string, fallback: string = ""): string {
  const cleaned = removeVietnameseTones(str || "");
  if (!cleaned) return fallback;
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/**
 * Chuẩn hóa hàm sinh tên tệp tự động theo đúng quy ước: MaHS_HoTen_Lop_TenBaiTap.ext
 * ngay tại thời điểm học sinh nộp bài.
 */
export function generateStandardSubmissionFileName(params: {
  studentId?: string;
  studentName: string;
  className: string;
  assignmentCodeOrTitle: string;
  expectedExt: PracticeFileType | string;
}): string {
  const cleanMaHS =
    removeVietnameseTones(params.studentId || "HS01")
      .replace(/\s+/g, "")
      .toUpperCase() || "HS01";
  const cleanHoTen = toCleanPascalIdentifier(params.studentName, "HocSinh");
  const cleanLop =
    removeVietnameseTones(params.className || "Lop")
      .replace(/\s+/g, "") || "Lop";
  const cleanTenBaiTap =
    toCleanPascalIdentifier(params.assignmentCodeOrTitle, "BaiTap") || "BaiTap";
  const rawExt = String(params.expectedExt || "docx")
    .replace(/^\./, "")
    .toLowerCase();
  const ext = rawExt === "theory" ? "json" : rawExt;

  return `${cleanMaHS}_${cleanHoTen}_${cleanLop}_${cleanTenBaiTap}.${ext}`;
}

export function normalizeStudentFileName(
  studentName: string,
  className: string,
  assignmentCode: string,
  originalFileName: string,
  expectedExt: PracticeFileType,
  studentId: string = "HS01",
  uploadedFile?: File | null
): {
  standardizedName: string;
  wasAutoFixed: boolean;
  extensionIssue?: string;
  standardizedFile?: File;
} {
  const standardizedName = generateStandardSubmissionFileName({
    studentId,
    studentName,
    className,
    assignmentCodeOrTitle: assignmentCode,
    expectedExt,
  });

  const trimmedOriginal = (originalFileName || "").trim();
  const wasAutoFixed = trimmedOriginal.toLowerCase() !== standardizedName.toLowerCase();

  let extensionIssue: string | undefined;
  const parts = trimmedOriginal.split(".");
  const actualExt = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  if (expectedExt === "docx" && actualExt !== "docx" && actualExt !== "doc") {
    extensionIssue = `Lưu sai định dạng (.${actualExt || "không rõ"} thay vì .docx)`;
  } else if (expectedExt === "pptx" && actualExt !== "pptx" && actualExt !== "ppt") {
    extensionIssue = `Lưu sai định dạng (.${actualExt || "không rõ"} thay vì .pptx)`;
  } else if (expectedExt === "sb3" && actualExt !== "sb3") {
    extensionIssue = `Lưu sai định dạng (.${actualExt || "không rõ"} thay vì .sb3)`;
  }

  const standardizedFile = uploadedFile
    ? new File([uploadedFile], standardizedName, {
        type: uploadedFile.type || "application/octet-stream",
        lastModified: uploadedFile.lastModified || Date.now(),
      })
    : undefined;

  return { standardizedName, wasAutoFixed, extensionIssue, standardizedFile };
}

// Parse real .docx, .pptx, or .sb3 ZIP archive uploaded by the student using JSZip
// Đồng thời chuẩn hóa tên tệp tự động (MaHS_HoTen_Lop_TenBaiTap.ext) ngay tại thời điểm học sinh nộp bài
// Tuyệt đối không bịa đặt dữ liệu của bài khác khi đọc file học sinh nộp
export async function inspectUploadedFile(
  file: File,
  expectedType: PracticeFileType,
  submissionMeta?: {
    studentId?: string;
    studentName: string;
    className: string;
    assignmentCode: string;
  }
): Promise<ExtractedInspection> {
  const targetFile = submissionMeta
    ? normalizeStudentFileName(
        submissionMeta.studentName,
        submissionMeta.className,
        submissionMeta.assignmentCode,
        file.name,
        expectedType,
        submissionMeta.studentId || "HS01",
        file
      ).standardizedFile || file
    : file;

  try {
    const arrayBuffer = await targetFile.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Check if it is a Scratch .sb3 archive (contains project.json)
    const projectJsonFile = zip.file("project.json");
    if (projectJsonFile && (expectedType === "sb3" || !zip.file("word/document.xml"))) {
      const rawJson = await projectJsonFile.async("string");
      const project = JSON.parse(rawJson);
      return {
        type: "sb3",
        data: parseScratchProjectJson(project),
      };
    }

    // 2. Check if it is a Word .docx archive (contains word/document.xml)
    const wordDocXmlFile = zip.file("word/document.xml");
    if (wordDocXmlFile) {
      const xmlText = await wordDocXmlFile.async("string");
      return {
        type: "docx",
        data: parseWordDocumentXml(xmlText),
      };
    }

    // 3. Check if it is a PowerPoint .pptx archive (contains ppt/slides/slide1.xml)
    const slideFiles = Object.keys(zip.files)
      .filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || "0", 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || "0", 10);
        return numA - numB;
      });
    if (slideFiles.length > 0) {
      const slideXmls: string[] = [];
      for (const sf of slideFiles) {
        const content = await zip.file(sf)!.async("string");
        slideXmls.push(content);
      }
      return {
        type: "pptx",
        data: parsePptxSlidesXml(slideXmls),
      };
    }
  } catch {
    // Nếu tệp không phải nén ZIP chuẩn (ví dụ học sinh nộp tệp văn bản thô hoặc định dạng khác)
    try {
      const rawText = await file.text();
      if (expectedType === "docx" && rawText.trim().length > 0) {
        const lines = rawText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && !l.startsWith("PK"))
          .slice(0, 25);

        const extractedLines = lines.map((line, i) => {
          const firstChar = line.charAt(0);
          return {
            lineNumber: i + 1,
            text: line.slice(0, 200),
            startsWithUppercase:
              firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase(),
            alignment: "left",
            fontSizePt: 13,
            isBold: i === 0,
            colorHex: "#1E293B",
          };
        });

        return {
          type: "docx",
          data: {
            engine: "DOM Parsing & Layout Analysis (.docx)",
            paperSize: "A4 (210mm × 297mm)",
            detectedFonts: ["Times New Roman"],
            titleFontSizePt: extractedLines[0]?.fontSizePt || 12,
            titleColorHex: "#1E293B",
            titleBold: Boolean(extractedLines[0]?.isBold),
            titleAlignment: "left",
            paragraphCount: extractedLines.length,
            extractedLines,
            imageCount: 0,
            imageAlignedCenter: false,
            tableCount: 0,
          },
        };
      }
    } catch {
      // Ignore raw text read error
    }
  }

  // Nếu tệp tải lên trống hoặc không đúng cấu trúc của loại bài yêu cầu -> Trả về trạng thái thực tế của tệp (rỗng/không hợp lệ), tuyệt đối không bịa dữ liệu bài khác
  if (expectedType === "docx") {
    return {
      type: "docx",
      data: {
        engine: "DOM Parsing & Layout Analysis (.docx)",
        paperSize: "A4 (210mm × 297mm)",
        detectedFonts: [],
        titleFontSizePt: 0,
        titleColorHex: "#000000",
        titleBold: false,
        titleAlignment: "left",
        paragraphCount: 0,
        extractedLines: [],
        imageCount: 0,
        imageAlignedCenter: false,
        tableCount: 0,
      },
    };
  }
  if (expectedType === "pptx") {
    return {
      type: "pptx",
      data: {
        engine: "Slide Property & Multimedia Scanner (.pptx)",
        slideCount: 0,
        slides: [],
      },
    };
  }
  return {
    type: "sb3",
    data: {
      engine: "AST (Abstract Syntax Tree) & Sandbox Simulator (.sb3)",
      spriteCount: 0,
      totalBlocks: 0,
      hasWhenFlagClicked: false,
      hasRepeatLoop: false,
      repeatCountValue: 0,
      manualRepeatedMoveCount: 0,
      hasSoundBlock: false,
      astBlocks: [],
      simulationTrajectory: [],
      formsClosedSquare: false,
      soundTriggeredOnTime: false,
    },
  };
}

function parseWordDocumentXml(xml: string): DocxInspectionData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const paragraphs = Array.from(doc.getElementsByTagName("w:p"));

  const extractedLines: DocxInspectionData["extractedLines"] = [];
  const fontSet = new Set<string>();

  const rFontsEls = Array.from(doc.getElementsByTagName("w:rFonts"));
  rFontsEls.forEach((rf) => {
    const fName = rf.getAttribute("w:ascii") || rf.getAttribute("w:hAnsi");
    if (fName) fontSet.add(fName);
  });

  const imageCount =
    doc.getElementsByTagName("w:drawing").length +
    doc.getElementsByTagName("w:pict").length +
    doc.getElementsByTagName("v:imagedata").length;
  let imageAlignedCenter = false;
  const tableCount = doc.getElementsByTagName("w:tbl").length;

  paragraphs.forEach((p) => {
    const texts = Array.from(p.getElementsByTagName("w:t"))
      .map((t) => t.textContent || "")
      .join("");
    const jcEl = p.getElementsByTagName("w:jc")[0];
    const alignment = (jcEl?.getAttribute("w:val") || "left") as
      | "left"
      | "center"
      | "right"
      | "justify";

    const hasDrawing =
      p.getElementsByTagName("w:drawing").length > 0 ||
      p.getElementsByTagName("w:pict").length > 0;
    if (hasDrawing && (alignment === "center" || xml.includes('w:val="center"'))) {
      imageAlignedCenter = true;
    }

    if (texts.trim().length > 0) {
      const bEl = p.getElementsByTagName("w:b")[0];
      const szEl = p.getElementsByTagName("w:sz")[0];
      const colorEl = p.getElementsByTagName("w:color")[0];
      const halfPts = szEl?.getAttribute("w:val")
        ? parseInt(szEl.getAttribute("w:val")!, 10)
        : 28;
      const fontSizePt = Math.round(halfPts / 2);
      const rawColor = colorEl?.getAttribute("w:val");
      const colorHex =
        rawColor && rawColor !== "auto" ? `#${rawColor.replace(/^#/, "")}` : "#1E293B";
      const trimmed = texts.trim();
      const firstChar = trimmed.charAt(0);
      const startsWithUppercase =
        firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();

      extractedLines.push({
        lineNumber: extractedLines.length + 1,
        text: trimmed,
        startsWithUppercase,
        alignment,
        fontSizePt,
        isBold: Boolean(bEl),
        colorHex,
      });
    }
  });

  if (extractedLines.length === 0) {
    return {
      engine: "DOM Parsing & Layout Analysis (.docx)",
      paperSize: "A4 (210mm × 297mm)",
      detectedFonts: Array.from(fontSet),
      titleFontSizePt: 0,
      titleColorHex: "#1E293B",
      titleBold: false,
      titleAlignment: "left",
      paragraphCount: 0,
      extractedLines: [],
      imageCount,
      imageAlignedCenter,
      tableCount,
    };
  }

  const titleLine = extractedLines[0];
  return {
    engine: "DOM Parsing & Layout Analysis (.docx)",
    paperSize: "A4 (210mm × 297mm)",
    detectedFonts: fontSet.size > 0 ? Array.from(fontSet) : ["Times New Roman"],
    titleFontSizePt: titleLine.fontSizePt,
    titleColorHex: titleLine.colorHex,
    titleBold: titleLine.isBold,
    titleAlignment: (titleLine.alignment as any) || "left",
    paragraphCount: extractedLines.length,
    extractedLines,
    imageCount,
    imageAlignedCenter: imageCount > 0 ? imageAlignedCenter : false,
    tableCount,
  };
}

function parsePptxSlidesXml(slideXmls: string[]): PptxInspectionData {
  const parser = new DOMParser();
  const slides: PptxInspectionData["slides"] = slideXmls.map((xml, idx) => {
    const doc = parser.parseFromString(xml, "application/xml");
    const texts = Array.from(doc.getElementsByTagName("a:t"))
      .map((t) => t.textContent || "")
      .filter((t) => t.trim().length > 0);
    const hasBg =
      doc.getElementsByTagName("p:bg").length > 0 ||
      xml.includes("bgPr") ||
      xml.includes("solidFill") ||
      xml.includes("blipFill");
    const imageCount =
      doc.getElementsByTagName("p:pic").length +
      doc.getElementsByTagName("a:blip").length;
    const audioCount =
      doc.getElementsByTagName("a:audioFile").length + (xml.includes("audio") ? 1 : 0);
    const videoCount = doc.getElementsByTagName("a:videoFile").length;
    const transitionEl = doc.getElementsByTagName("p:transition")[0];
    const hasTransition = Boolean(transitionEl);
    const animationCount =
      doc.getElementsByTagName("p:anim").length +
      doc.getElementsByTagName("p:timing").length;

    return {
      slideNumber: idx + 1,
      layoutName:
        idx === 0
          ? "Title Slide (Trang tiêu đề)"
          : "Title & Content (Tiêu đề & Nội dung)",
      titleText: texts.join(" — ").slice(0, 120) || `Slide ${idx + 1} (Chưa có tiêu đề)`,
      hasBackgroundFill: hasBg,
      imageCount,
      audioCount,
      videoCount,
      hasTransition,
      transitionType: hasTransition ? "Fade / Push" : undefined,
      animationCount,
    };
  });

  return {
    engine: "Slide Property & Multimedia Scanner (.pptx)",
    slideCount: slides.length,
    slides,
  };
}

function parseScratchProjectJson(project: any): Sb3InspectionData {
  const targets = Array.isArray(project?.targets) ? project.targets : [];
  const sprites = targets.filter((t: any) => !t.isStage);
  const astBlocks: Sb3InspectionData["astBlocks"] = [];

  let hasWhenFlagClicked = false;
  let hasRepeatLoop = false;
  let repeatCountValue = 0;
  let manualRepeatedMoveCount = 0;
  let hasSoundBlock = false;

  const trajectorySteps: ScratchSimulationStep[] = [];
  let curX = 0;
  let curY = 0;
  let curDir = 90;

  sprites.forEach((sprite: any) => {
    curX = Number(sprite.x || 0);
    curY = Number(sprite.y || 0);
    curDir = Number(sprite.direction || 90);

    const blocksObj = sprite.blocks || {};
    Object.entries(blocksObj).forEach(([id, block]: [string, any]) => {
      if (!block || typeof block !== "object" || !block.opcode) return;
      const opcode: string = block.opcode;

      if (opcode === "event_whenflagclicked" || opcode.startsWith("event_when")) {
        if (opcode === "event_whenflagclicked") hasWhenFlagClicked = true;
        astBlocks.push({
          id,
          opcode,
          label:
            opcode === "event_whenflagclicked"
              ? "Khi bấm vào lá cờ xanh (when green flag clicked)"
              : `Sự kiện: ${opcode}`,
          category: "event",
          depth: 0,
        });
      } else if (
        opcode === "control_repeat" ||
        opcode === "control_forever" ||
        opcode === "control_if" ||
        opcode === "control_if_else"
      ) {
        if (opcode === "control_repeat" || opcode === "control_forever") {
          hasRepeatLoop = true;
        }
        const timesInput = block.inputs?.TIMES;
        const countVal = Number(timesInput?.[1]?.[1] || (opcode === "control_forever" ? 4 : 4));
        if (opcode === "control_repeat") {
          repeatCountValue = countVal;
        }
        astBlocks.push({
          id,
          opcode,
          label:
            opcode === "control_repeat"
              ? `Lặp lại (${countVal}) lần [repeat ${countVal}]`
              : opcode === "control_forever"
              ? "Liên tục [forever]"
              : "Nếu ... thì [if / else]",
          category: "control",
          depth: 1,
        });
      } else if (opcode === "motion_movesteps" || opcode === "motion_gotoxy") {
        manualRepeatedMoveCount++;
        const steps = Number(block.inputs?.STEPS?.[1]?.[1] || 100);
        astBlocks.push({
          id,
          opcode,
          label:
            opcode === "motion_movesteps"
              ? `Di chuyển (${steps}) bước [move ${steps} steps]`
              : "Đi tới điểm (x, y) [go to x y]",
          category: "motion",
          depth: hasRepeatLoop ? 2 : 1,
        });
      } else if (opcode === "motion_turnright" || opcode === "motion_turnleft") {
        const deg = Number(block.inputs?.DEGREES?.[1]?.[1] || 90);
        astBlocks.push({
          id,
          opcode,
          label: `${opcode === "motion_turnright" ? "Xoay phải" : "Xoay trái"} (${deg}) độ`,
          category: "motion",
          depth: hasRepeatLoop ? 2 : 1,
        });
      } else if (opcode.startsWith("looks_")) {
        const msg = block.inputs?.MESSAGE?.[1]?.[1] || "Xin chào!";
        astBlocks.push({
          id,
          opcode,
          label: `Hiển thị / Nói ("${msg}") [${opcode}]`,
          category: "looks",
          depth: 1,
        });
      } else if (opcode.startsWith("sound_")) {
        hasSoundBlock = true;
        astBlocks.push({
          id,
          opcode,
          label: "Phát âm thanh [sound block]",
          category: "sound",
          depth: 1,
        });
      } else {
        astBlocks.push({
          id,
          opcode,
          label: `Khối lệnh: ${opcode}`,
          category: "control",
          depth: 1,
        });
      }
    });
  });

  if (astBlocks.length === 0) {
    return {
      engine: "AST (Abstract Syntax Tree) & Sandbox Simulator (.sb3)",
      spriteCount: sprites.length,
      totalBlocks: 0,
      hasWhenFlagClicked: false,
      hasRepeatLoop: false,
      repeatCountValue: 0,
      manualRepeatedMoveCount: 0,
      hasSoundBlock: false,
      astBlocks: [],
      simulationTrajectory: [],
      formsClosedSquare: false,
      soundTriggeredOnTime: false,
    };
  }

  if (!hasRepeatLoop && manualRepeatedMoveCount >= 3) {
    astBlocks.forEach((b) => {
      if (b.opcode === "motion_movesteps") {
        b.warning = "Kéo thả khối di chuyển lặp lại thủ công — Nên gộp vào khối Lặp lại (repeat)";
      }
    });
  }

  // Tạo quỹ đạo mô phỏng từ chính các khối lệnh thực tế trong tệp
  trajectorySteps.push({
    stepIndex: 0,
    blockOpcode: hasWhenFlagClicked ? "event_whenflagclicked" : astBlocks[0].opcode,
    blockLabel: astBlocks[0].label,
    x: curX,
    y: curY,
    direction: curDir,
    penDown: true,
  });

  const loopIterations = hasRepeatLoop ? Math.max(1, Math.min(8, repeatCountValue || 4)) : 1;
  for (let iter = 0; iter < loopIterations; iter++) {
    astBlocks.forEach((b) => {
      if (b.opcode === "motion_movesteps") {
        const matchSteps = parseInt(b.label.match(/\((\d+)\)/)?.[1] || "100", 10);
        const rad = ((90 - curDir) * Math.PI) / 180;
        curX = Math.round(curX + matchSteps * Math.cos(rad));
        curY = Math.round(curY + matchSteps * Math.sin(rad));
        trajectorySteps.push({
          stepIndex: trajectorySteps.length,
          blockOpcode: b.opcode,
          blockLabel: hasRepeatLoop ? `[Lặp ${iter + 1}/${loopIterations}] ${b.label}` : b.label,
          x: curX,
          y: curY,
          direction: curDir,
          penDown: true,
        });
      } else if (b.opcode === "motion_turnright") {
        const matchDeg = parseInt(b.label.match(/\((\d+)\)/)?.[1] || "90", 10);
        curDir = (curDir + matchDeg) % 360;
      } else if (b.opcode === "motion_turnleft") {
        const matchDeg = parseInt(b.label.match(/\((\d+)\)/)?.[1] || "90", 10);
        curDir = (curDir - matchDeg + 360) % 360;
      }
    });
  }

  if (hasSoundBlock) {
    trajectorySteps.push({
      stepIndex: trajectorySteps.length,
      blockOpcode: "sound_playuntildone",
      blockLabel: "Phát âm thanh hoàn thành kịch bản",
      x: curX,
      y: curY,
      direction: curDir,
      penDown: true,
      soundPlayed: "Đã phát âm thanh",
      sayText: "Hoàn thành kịch bản!",
    });
  }

  const formsClosedSquare =
    (hasRepeatLoop && repeatCountValue === 4 && Math.abs(curX) <= 5 && Math.abs(curY) <= 5) ||
    manualRepeatedMoveCount >= 4;

  return {
    engine: "AST (Abstract Syntax Tree) & Sandbox Simulator (.sb3)",
    spriteCount: Math.max(1, sprites.length),
    totalBlocks: astBlocks.length,
    hasWhenFlagClicked,
    hasRepeatLoop,
    repeatCountValue,
    manualRepeatedMoveCount,
    hasSoundBlock,
    astBlocks,
    simulationTrajectory:
      trajectorySteps.length > 1
        ? trajectorySteps
        : buildSquareTrajectory(hasRepeatLoop, hasSoundBlock),
    formsClosedSquare,
    soundTriggeredOnTime: hasSoundBlock,
  };
}

export function buildSquareTrajectory(
  usesCleanLoop: boolean,
  hasSound: boolean
): ScratchSimulationStep[] {
  const steps: ScratchSimulationStep[] = [
    {
      stepIndex: 0,
      blockOpcode: "event_whenflagclicked",
      blockLabel: "Khi bấm vào lá cờ xanh",
      x: 0,
      y: 0,
      direction: 90,
      penDown: true,
    },
    {
      stepIndex: 1,
      blockOpcode: "motion_movesteps",
      blockLabel: usesCleanLoop
        ? "[Lặp 1/4] Di chuyển 100 bước & Xoay 90°"
        : "Di chuyển 100 bước (Thủ công #1)",
      x: 100,
      y: 0,
      direction: 180,
      penDown: true,
    },
    {
      stepIndex: 2,
      blockOpcode: "motion_movesteps",
      blockLabel: usesCleanLoop
        ? "[Lặp 2/4] Di chuyển 100 bước & Xoay 90°"
        : "Di chuyển 100 bước (Thủ công #2)",
      x: 100,
      y: -100,
      direction: 270,
      penDown: true,
    },
    {
      stepIndex: 3,
      blockOpcode: "motion_movesteps",
      blockLabel: usesCleanLoop
        ? "[Lặp 3/4] Di chuyển 100 bước & Xoay 90°"
        : "Di chuyển 100 bước (Thủ công #3)",
      x: 0,
      y: -100,
      direction: 0,
      penDown: true,
    },
  ];

  if (usesCleanLoop) {
    steps.push({
      stepIndex: 4,
      blockOpcode: "motion_movesteps",
      blockLabel: "[Lặp 4/4] Di chuyển 100 bước & Xoay 90° (Khép kín đường đi)",
      x: 0,
      y: 0,
      direction: 90,
      penDown: true,
      soundPlayed: hasSound ? "Meow! (Âm thanh chuẩn)" : undefined,
      sayText: "Em đã hoàn thành!",
    });
  } else {
    steps.push({
      stepIndex: 4,
      blockOpcode: "motion_movesteps",
      blockLabel: "Di chuyển lệch hướng (Thiếu khối xoay 90° ở cạnh thứ 4)",
      x: -60,
      y: -100,
      direction: 270,
      penDown: true,
      hitEdge: false,
      sayText: "Chưa khép kín hình!",
    });
  }

  return steps;
}

export function createDefaultDocxInspection(mode: "good" | "flawed"): DocxInspectionData {
  if (mode === "good") {
    return {
      engine: "DOM Parsing & Layout Analysis (.docx)",
      paperSize: "A4 (210mm × 297mm)",
      detectedFonts: ["Times New Roman"],
      titleFontSizePt: 18,
      titleColorHex: "#DC2626",
      titleBold: true,
      titleAlignment: "center",
      paragraphCount: 3,
      extractedLines: [
        {
          lineNumber: 1,
          text: "BÀI THỰC HÀNH: BIỂN ĐẢO QUÊ HƯƠNG EM",
          startsWithUppercase: true,
          alignment: "center",
          fontSizePt: 18,
          isBold: true,
          colorHex: "#DC2626",
        },
        {
          lineNumber: 2,
          text: "Quần đảo Hoàng Sa và Trường Sa là máu thịt thiêng liêng của Tổ quốc Việt Nam.",
          startsWithUppercase: true,
          alignment: "justify",
          fontSizePt: 14,
          isBold: false,
          colorHex: "#1E293B",
        },
        {
          lineNumber: 3,
          text: "Chúng em chăm ngoan học giỏi để mai sau xây dựng đất nước giàu đẹp.",
          startsWithUppercase: true,
          alignment: "justify",
          fontSizePt: 14,
          isBold: false,
          colorHex: "#1E293B",
        },
      ],
      imageCount: 1,
      imageAlignedCenter: true,
      tableCount: 0,
    };
  }

  return {
    engine: "DOM Parsing & Layout Analysis (.docx)",
    paperSize: "A4 (210mm × 297mm)",
    detectedFonts: ["Calibri", "Times New Roman"],
    titleFontSizePt: 12,
    titleColorHex: "#1E293B",
    titleBold: true,
    titleAlignment: "left",
    paragraphCount: 3,
    extractedLines: [
      {
        lineNumber: 1,
        text: "BÀI THỰC HÀNH: BIỂN ĐẢO QUÊ HƯƠNG EM",
        startsWithUppercase: true,
        alignment: "left",
        fontSizePt: 12,
        isBold: true,
        colorHex: "#1E293B",
      },
      {
        lineNumber: 2,
        text: "quần đảo Hoàng Sa và Trường Sa là máu thịt thiêng liêng của Tổ quốc Việt Nam.",
        startsWithUppercase: false,
        alignment: "left",
        fontSizePt: 12,
        isBold: false,
        colorHex: "#1E293B",
      },
      {
        lineNumber: 3,
        text: "Chúng em chăm ngoan học giỏi để mai sau xây dựng đất nước giàu đẹp.",
        startsWithUppercase: true,
        alignment: "left",
        fontSizePt: 12,
        isBold: false,
        colorHex: "#1E293B",
      },
    ],
    imageCount: 1,
    imageAlignedCenter: false,
    tableCount: 0,
  };
}

export function createDefaultPptxInspection(mode: "good" | "flawed"): PptxInspectionData {
  if (mode === "good") {
    return {
      engine: "Slide Property & Multimedia Scanner (.pptx)",
      slideCount: 3,
      slides: [
        {
          slideNumber: 1,
          layoutName: "Title Slide (Trang bìa)",
          titleText: "BẢO VỆ MÔI TRƯỜNG XANH - SẠCH - ĐẸP",
          hasBackgroundFill: true,
          imageCount: 1,
          audioCount: 0,
          videoCount: 0,
          hasTransition: true,
          transitionType: "Fade",
          animationCount: 2,
        },
        {
          slideNumber: 2,
          layoutName: "Title & Content",
          titleText: "1. Phân loại rác thải tại trường học",
          hasBackgroundFill: true,
          imageCount: 2,
          audioCount: 0,
          videoCount: 0,
          hasTransition: true,
          transitionType: "Push",
          animationCount: 2,
        },
        {
          slideNumber: 3,
          layoutName: "Title & Content",
          titleText: "2. Hành động nhỏ - Ý nghĩa lớn",
          hasBackgroundFill: true,
          imageCount: 1,
          audioCount: 1,
          videoCount: 0,
          hasTransition: true,
          transitionType: "Wipe",
          animationCount: 1,
        },
      ],
    };
  }

  return {
    engine: "Slide Property & Multimedia Scanner (.pptx)",
    slideCount: 2,
    slides: [
      {
        slideNumber: 1,
        layoutName: "Title Slide (Trang bìa)",
        titleText: "BẢO VỆ MÔI TRƯỜNG XANH - SẠCH - ĐẸP",
        hasBackgroundFill: true,
        imageCount: 1,
        audioCount: 0,
        videoCount: 0,
        hasTransition: true,
        transitionType: "Fade",
        animationCount: 1,
      },
      {
        slideNumber: 2,
        layoutName: "Blank Layout",
        titleText: "1. Phân loại rác thải tại trường học",
        hasBackgroundFill: false,
        imageCount: 1,
        audioCount: 0,
        videoCount: 0,
        hasTransition: false,
        animationCount: 0,
      },
    ],
  };
}

export function createDefaultSb3Inspection(mode: "good" | "flawed"): Sb3InspectionData {
  if (mode === "good") {
    return {
      engine: "AST (Abstract Syntax Tree) & Sandbox Simulator (.sb3)",
      spriteCount: 1,
      totalBlocks: 5,
      hasWhenFlagClicked: true,
      hasRepeatLoop: true,
      repeatCountValue: 4,
      manualRepeatedMoveCount: 1,
      hasSoundBlock: true,
      astBlocks: [
        {
          id: "b1",
          opcode: "event_whenflagclicked",
          label: "Khi bấm vào lá cờ xanh (when green flag clicked)",
          category: "event",
          depth: 0,
        },
        {
          id: "b2",
          opcode: "control_repeat",
          label: "Lặp lại (4) lần [repeat 4]",
          category: "control",
          depth: 1,
        },
        {
          id: "b3",
          opcode: "motion_movesteps",
          label: "Di chuyển (100) bước [move 100 steps]",
          category: "motion",
          depth: 2,
        },
        {
          id: "b4",
          opcode: "motion_turnright",
          label: "Xoay phải (90) độ [turn right 90 degrees]",
          category: "motion",
          depth: 2,
        },
        {
          id: "b5",
          opcode: "sound_playuntildone",
          label: "Phát âm thanh (Meow) đến hết [play sound Meow until done]",
          category: "sound",
          depth: 1,
        },
      ],
      simulationTrajectory: buildSquareTrajectory(true, true),
      formsClosedSquare: true,
      soundTriggeredOnTime: true,
    };
  }

  return {
    engine: "AST (Abstract Syntax Tree) & Sandbox Simulator (.sb3)",
    spriteCount: 1,
    totalBlocks: 8,
    hasWhenFlagClicked: true,
    hasRepeatLoop: false,
    repeatCountValue: 0,
    manualRepeatedMoveCount: 4,
    hasSoundBlock: false,
    astBlocks: [
      {
        id: "b1",
        opcode: "event_whenflagclicked",
        label: "Khi bấm vào lá cờ xanh (when green flag clicked)",
        category: "event",
        depth: 0,
      },
      {
        id: "b2",
        opcode: "motion_movesteps",
        label: "Di chuyển (100) bước [move 100 steps]",
        category: "motion",
        depth: 1,
        warning: "Kéo thả khối đơn lẻ #1 — Chưa dùng vòng lặp repeat(4)",
      },
      {
        id: "b3",
        opcode: "motion_turnright",
        label: "Xoay phải (90) độ [turn right 90 degrees]",
        category: "motion",
        depth: 1,
      },
      {
        id: "b4",
        opcode: "motion_movesteps",
        label: "Di chuyển (100) bước [move 100 steps]",
        category: "motion",
        depth: 1,
        warning: "Kéo thả khối đơn lẻ #2 — Lặp code thủ công",
      },
      {
        id: "b5",
        opcode: "motion_turnright",
        label: "Xoay phải (90) độ [turn right 90 degrees]",
        category: "motion",
        depth: 1,
      },
      {
        id: "b6",
        opcode: "motion_movesteps",
        label: "Di chuyển (100) bước [move 100 steps]",
        category: "motion",
        depth: 1,
        warning: "Kéo thả khối đơn lẻ #3 — Lặp code thủ công",
      },
      {
        id: "b7",
        opcode: "motion_turnright",
        label: "Xoay phải (90) độ [turn right 90 degrees]",
        category: "motion",
        depth: 1,
      },
      {
        id: "b8",
        opcode: "motion_movesteps",
        label: "Di chuyển (60) bước [move 60 steps]",
        category: "motion",
        depth: 1,
        warning: "Sai số bước ở cạnh thứ 4 (60 thay vì 100) & thiếu khối phát âm thanh",
      },
    ],
    simulationTrajectory: buildSquareTrajectory(false, false),
    formsClosedSquare: false,
    soundTriggeredOnTime: false,
  };
}

function escapeXmlText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Tạo File Gốc Mẫu (.docx, .pptx, .sb3) bám sát 100% nội dung đề bài và ma trận giáo viên đã thiết kế
export async function generateSamplePracticeFile(
  fileType: PracticeFileType,
  mode: "master_template" | "student_flawed" | "student_good",
  assignment?: Assignment
): Promise<File> {
  const zip = new JSZip();
  const isClean = mode === "master_template" || mode === "student_good";

  if (fileType === "sb3") {
    const blocks: Record<string, any> = {
      b_flag: {
        opcode: "event_whenflagclicked",
        next: "b_repeat",
        parent: null,
        inputs: {},
        fields: {},
        topLevel: true,
      },
      b_repeat: {
        opcode: "control_repeat",
        next: "b_sound",
        parent: "b_flag",
        inputs: {
          TIMES: [1, [6, "4"]],
          SUBSTACK: [2, "b_move"],
        },
        fields: {},
        topLevel: false,
      },
      b_move: {
        opcode: "motion_movesteps",
        next: "b_turn",
        parent: "b_repeat",
        inputs: { STEPS: [1, [4, "100"]] },
        fields: {},
        topLevel: false,
      },
      b_turn: {
        opcode: "motion_turnright",
        next: null,
        parent: "b_move",
        inputs: { DEGREES: [1, [4, "90"]] },
        fields: {},
        topLevel: false,
      },
      b_sound: {
        opcode: "sound_playuntildone",
        next: null,
        parent: "b_repeat",
        inputs: {},
        fields: {},
        topLevel: false,
      },
    };

    const projectJson = {
      targets: [
        { isStage: true, name: "Stage", variables: {}, lists: {}, blocks: {} },
        {
          isStage: false,
          name: assignment?.title || "Nhân vật Scratch",
          x: 0,
          y: 0,
          direction: 90,
          blocks,
        },
      ],
      meta: { semver: "3.0.0", vm: "0.2.0" },
    };

    zip.file("project.json", JSON.stringify(projectJson, null, 2));
    const blob = await zip.generateAsync({ type: "blob" });
    const fileName = `FileMau_${assignment?.code || "Scratch"}.sb3`;
    return new File([blob], fileName, { type: "application/x-scratch" });
  }

  if (fileType === "pptx") {
    const heading =
      assignment?.templateSummary?.headingText ||
      assignment?.title ||
      "BÀI TRÌNH CHIẾU THỰC HÀNH TIN HỌC";
    const bodyLines =
      assignment?.templateSummary?.bodyLines && assignment.templateSummary.bodyLines.length > 0
        ? assignment.templateSummary.bodyLines
        : assignment?.checklist.map((c, idx) => `Slide ${idx + 1}: ${c.criterion}`) || [
            "Slide 1: Trang tiêu đề bài trình chiếu",
            "Slide 2: Nội dung chính và hình ảnh minh họa",
            "Slide 3: Tổng kết bài học",
          ];

    const slideCount = Math.max(2, bodyLines.length);
    for (let i = 0; i < slideCount; i++) {
      const slideTitle = i === 0 ? heading : bodyLines[i] || `Slide ${i + 1}`;
      const slideSub = i === 0 ? bodyLines[0] || assignment?.studentPrompt || "" : "";
      const slideXml = `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    ${isClean ? "<p:bg><p:bgPr/></p:bg>" : ""}
    <p:spTree>
      <p:sp><p:txBody><a:p><a:r><a:t>${escapeXmlText(slideTitle)}</a:t></a:r></a:p></p:txBody></p:sp>
      ${slideSub ? `<p:sp><p:txBody><a:p><a:r><a:t>${escapeXmlText(slideSub)}</a:t></a:r></a:p></p:txBody></p:sp>` : ""}
      <p:pic/>
    </p:spTree>
  </p:cSld>
  ${isClean ? "<p:transition/><p:timing><p:anim/></p:timing>" : ""}
</p:sld>`;
      zip.file(`ppt/slides/slide${i + 1}.xml`, slideXml);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const fileName = `FileMau_${assignment?.code || "PowerPoint"}.pptx`;
    return new File([blob], fileName, {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });
  }

  // Default: .docx XML archive built dynamically from the assignment's templateSummary and checklist
  const heading =
    assignment?.templateSummary?.headingText ||
    assignment?.title?.toUpperCase() ||
    "BÀI THỰC HÀNH SOẠN THẢO VĂN BẢN";
  const bodyLines =
    assignment?.templateSummary?.bodyLines && assignment.templateSummary.bodyLines.length > 0
      ? assignment.templateSummary.bodyLines
      : [
          assignment?.studentPrompt || "Em hãy thực hiện các yêu cầu thực hành dưới đây:",
          ...(assignment?.checklist.map((c, idx) => `Yêu cầu ${idx + 1}: ${c.criterion}`) || []),
        ];

  const reqSizeHalfPt = (assignment?.templateSummary?.requiredSizePt || 18) * 2;
  const reqColor = (assignment?.templateSummary?.requiredColorHex || "#DC2626").replace(/^#/, "");

  const paragraphsXml = bodyLines
    .map(
      (line) => `    <w:p>
      <w:pPr><w:jc w:val="${isClean ? "justify" : "left"}"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="28"/><w:color w:val="1E293B"/></w:rPr>
        <w:t>${escapeXmlText(line)}</w:t>
      </w:r>
    </w:p>`
    )
    .join("\n");

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="${isClean ? "center" : "left"}"/></w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="${isClean ? reqSizeHalfPt : 24}"/>
          <w:color w:val="${isClean ? reqColor : "1E293B"}"/>
        </w:rPr>
        <w:t>${escapeXmlText(heading)}</w:t>
      </w:r>
    </w:p>
${paragraphsXml}
    <w:p>
      <w:pPr><w:jc w:val="${isClean ? "center" : "left"}"/></w:pPr>
      <w:r><w:drawing/></w:r>
    </w:p>
  </w:body>
</w:document>`;

  zip.file("word/document.xml", docXml);
  const blob = await zip.generateAsync({ type: "blob" });
  const fileName = `FileMau_${assignment?.code || "Word"}.docx`;
  return new File([blob], fileName, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

/**
 * Chuẩn hóa lời nhận xét luôn xưng "Thầy" (tuyệt đối không xưng "Cô")
 */
export function ensureTeacherPersonaThay(text: string): string {
  if (!text) return "";
  return text
    .replace(/\bThầy\/Cô\b/gi, "Thầy")
    .replace(/\bthầy\/cô\b/gi, "thầy")
    .replace(/\bCô khen\b/g, "Thầy khen")
    .replace(/\bcô khen\b/g, "thầy khen")
    .replace(/\bCô cộng\b/g, "Thầy cộng")
    .replace(/\bcô cộng\b/g, "thầy cộng")
    .replace(/\bCô thấy\b/g, "Thầy thấy")
    .replace(/\bcô thấy\b/g, "thầy thấy")
    .replace(/\bCô nhận xét\b/g, "Thầy nhận xét")
    .replace(/\bcô nhận xét\b/g, "thầy nhận xét")
    .replace(/\bCô rất vui\b/g, "Thầy rất vui")
    .replace(/\bcô rất vui\b/g, "thầy rất vui")
    .replace(/\bcô sẽ hướng dẫn\b/gi, "thầy sẽ hướng dẫn")
    .replace(/\bCô nhắc\b/g, "Thầy nhắc")
    .replace(/\bcô nhắc\b/g, "thầy nhắc")
    .replace(/\bthưa cô\b/gi, "thưa thầy");
}

/**
 * Phân tích CHÍNH XÁC bài làm thực tế của học sinh, BÁM SÁT 100% VÀO MA TRẬN ĐỀ BÀI (assignment.checklist)
 * Tuyệt đối không bịa đặt lỗi hoặc tiêu chí ngoài đề bài đã giao.
 */
export function analyzeSubmissionAndWriteTeacherFeedback(params: {
  studentId?: string;
  studentName: string;
  className?: string;
  originalFileName: string;
  wasFileNameAutoFixed?: boolean;
  assignment: Assignment;
  extractedInspection: ExtractedInspection;
}) {
  const {
    studentId = "HS01",
    studentName,
    className,
    originalFileName,
    assignment,
    extractedInspection,
  } = params;

  // Chuẩn hóa tên tệp tự động (MaHS_HoTen_Lop_TenBaiTap.ext) ngay tại thời điểm học sinh nộp bài
  const normalizedFileResult = normalizeStudentFileName(
    studentName,
    className || assignment.className,
    assignment.code || assignment.title,
    originalFileName,
    assignment.fileType,
    studentId
  );
  const standardizedFileName = normalizedFileResult.standardizedName;
  const wasFileNameAutoFixed =
    params.wasFileNameAutoFixed !== undefined
      ? params.wasFileNameAutoFixed
      : normalizedFileResult.wasAutoFixed;

  const nameParts = studentName.trim().split(/\s+/);
  const shortName =
    nameParts.length >= 2 ? nameParts.slice(-2).join(" ") : studentName.trim();

  const detectedErrors: string[] = [];
  let totalEarned = 0;
  const criterionBreakdown: {
    criterion: string;
    passed: boolean;
    earnedPoints: number;
    maxPoints: number;
    detailNote: string;
  }[] = [];

  // 1. CHẤM BÀI THỰC HÀNH WORD (.DOCX) BÁM SÁT TỪNG TIÊU CHÍ TRONG MA TRẬN CHECKLIST CỦA ĐỀ
  if (extractedInspection.type === "docx") {
    const d = extractedInspection.data;
    const isEmptyDoc = d.paragraphCount === 0 || d.extractedLines.length === 0;

    if (isEmptyDoc) {
      detectedErrors.push(
        `Tệp '${originalFileName}' chưa có nội dung văn bản hoặc không đúng cấu trúc Word (.docx)`
      );
    }

    const reqSize = assignment.templateSummary?.requiredSizePt || 16;
    const titleLine = d.extractedLines[0];
    const bodyLines = d.extractedLines.slice(1);
    const nonUppercaseLines = d.extractedLines.filter((l) => !l.startsWithUppercase);

    assignment.checklist.forEach((c, idx) => {
      const critLower = `${c.criterion} ${c.technicalTarget}`.toLowerCase();
      let passed = true;
      let ratio = 1;
      let detailNote = "";

      if (isEmptyDoc) {
        passed = false;
        ratio = 0;
        detailNote = `Không tìm thấy nội dung trong tệp '${originalFileName}' cho yêu cầu: "${c.criterion}".`;
      } else if (
        critLower.includes("tên file") ||
        critLower.includes("tên tệp") ||
        critLower.includes("lưu") ||
        critLower.includes("save") ||
        critLower.includes("content-type")
      ) {
        passed = !wasFileNameAutoFixed;
        ratio = wasFileNameAutoFixed ? 0.75 : 1;
        detailNote = wasFileNameAutoFixed
          ? `Tệp gốc '${originalFileName}' đặt chưa đúng mẫu '${assignment.standardFileNamePattern}' (Hệ thống đã tự động đổi tên chuẩn).`
          : `Đặt tên tệp '${originalFileName}' và lưu đúng định dạng .docx theo yêu cầu.`;
        if (wasFileNameAutoFixed) {
          detectedErrors.push(
            `Tiêu chí "${c.criterion}": Tên tệp gốc '${originalFileName}' chưa đúng quy tắc '${assignment.standardFileNamePattern}'`
          );
        }
      } else if (
        critLower.includes("tiêu đề") ||
        critLower.includes("heading") ||
        critLower.includes("cỡ chữ") ||
        critLower.includes("in đậm") ||
        critLower.includes("chữ đậm")
      ) {
        const sizeMatch = c.criterion.match(/(\d{2})\s*pt/i);
        const expectedPt = sizeMatch ? parseInt(sizeMatch[1], 10) : reqSize;
        const needCenter = critLower.includes("căn giữa") || critLower.includes("center");
        const needBold = critLower.includes("đậm") || critLower.includes("bold") || critLower.includes("w:b");

        const sizeOk = d.titleFontSizePt >= expectedPt - 2;
        const alignOk = !needCenter || d.titleAlignment === "center";
        const boldOk = !needBold || d.titleBold;

        passed = sizeOk && alignOk && boldOk;
        ratio = passed ? 1 : (sizeOk ? 0.4 : 0.2) + (alignOk ? 0.3 : 0) + (boldOk ? 0.3 : 0);
        detailNote = `Dòng tiêu đề thực tế: "${titleLine?.text || ""}" — Cỡ chữ: ${d.titleFontSizePt}pt, ${
          d.titleBold ? "Có in đậm" : "Chưa in đậm"
        }, Căn lề: ${d.titleAlignment}, Màu: ${d.titleColorHex}.`;

        if (!passed) {
          detectedErrors.push(
            `Tiêu chí "${c.criterion}": Tiêu đề "${(titleLine?.text || "").slice(0, 40)}" đang ở cỡ ${
              d.titleFontSizePt
            }pt, căn lề ${d.titleAlignment}${!d.titleBold && needBold ? ", chưa in đậm" : ""}`
          );
        }
      } else if (
        critLower.includes("ảnh") ||
        critLower.includes("hình") ||
        critLower.includes("minh họa") ||
        critLower.includes("drawing") ||
        critLower.includes("pict")
      ) {
        const needCenter = critLower.includes("căn giữa") || critLower.includes("center");
        if (d.imageCount === 0) {
          passed = false;
          ratio = 0;
          detailNote = `Quét DOM XML không tìm thấy hình ảnh (<w:drawing>) nào trong văn bản.`;
          detectedErrors.push(`Tiêu chí "${c.criterion}": Chưa chèn hình ảnh minh họa vào bài làm`);
        } else if (needCenter && !d.imageAlignedCenter) {
          passed = false;
          ratio = 0.65;
          detailNote = `Đã chèn ${d.imageCount} hình ảnh nhưng chưa căn giữa trang (đang để lệch lề).`;
          detectedErrors.push(`Tiêu chí "${c.criterion}": Đã chèn ${d.imageCount} ảnh nhưng chưa căn giữa`);
        } else {
          passed = true;
          ratio = 1;
          detailNote = `Đã chèn ${d.imageCount} hình ảnh minh họa${
            d.imageAlignedCenter ? " và căn giữa trang đúng yêu cầu" : ""
          }.`;
        }
      } else if (critLower.includes("bảng") || critLower.includes("table") || critLower.includes("w:tbl")) {
        passed = d.tableCount > 0;
        ratio = passed ? 1 : 0;
        detailNote = passed
          ? `Đã tạo ${d.tableCount} bảng biểu (<w:tbl>) trong tài liệu Word.`
          : `Chưa tìm thấy bảng biểu (<w:tbl>) trong tài liệu theo yêu cầu của ma trận.`;
        if (!passed) {
          detectedErrors.push(`Tiêu chí "${c.criterion}": Chưa tạo bảng biểu trong văn bản`);
        }
      } else {
        // Kiểm tra nội dung văn bản gõ vào, chính tả viết hoa đầu dòng và số đoạn văn theo đúng tiêu chí thứ idx
        const hasEnoughLines = d.paragraphCount >= Math.min(2, idx + 1);
        const uppercaseOk = nonUppercaseLines.length === 0;
        passed = hasEnoughLines && uppercaseOk;
        ratio = !hasEnoughLines ? 0.5 : !uppercaseOk ? 0.7 : 1;

        const sampleText =
          bodyLines[idx - 1]?.text ||
          bodyLines[0]?.text ||
          titleLine?.text ||
          "Chưa có đoạn văn tương ứng";

        detailNote = `Văn bản có ${d.paragraphCount} đoạn. Nội dung bóc tách: "${sampleText.slice(
          0,
          75
        )}"${
          !uppercaseOk
            ? ` (Dòng ${nonUppercaseLines.map((l) => l.lineNumber).join(", ")} chưa viết hoa chữ cái đầu)`
            : " (Gõ đúng chính tả và viết hoa đầu dòng)"
        }.`;

        if (!passed) {
          detectedErrors.push(
            !hasEnoughLines
              ? `Tiêu chí "${c.criterion}": Số đoạn văn bản còn ít (${d.paragraphCount} đoạn)`
              : `Tiêu chí "${c.criterion}": Dòng ${nonUppercaseLines
                  .map((l) => l.lineNumber)
                  .join(", ")} chưa viết hoa chữ cái đầu câu`
          );
        }
      }

      const earned = Math.round(c.maxPoints * ratio * 2) / 2;
      totalEarned += earned;
      criterionBreakdown.push({
        criterion: c.criterion,
        passed,
        earnedPoints: earned,
        maxPoints: c.maxPoints,
        detailNote,
      });
    });

    const aiScore = isEmptyDoc ? 0 : Math.min(10, Math.max(0, Math.round(totalEarned * 2) / 2));
    const passedList = criterionBreakdown.filter((c) => c.passed).map((c) => c.criterion);
    const failedList = criterionBreakdown.filter((c) => !c.passed).map((c) => c.criterion);

    const personalizedFeedback = isEmptyDoc
      ? `Thầy thấy tệp '${originalFileName}' của ${shortName} hiện chưa có nội dung văn bản theo đề bài "${assignment.title}". Con hãy mở phần mềm Word, làm theo các yêu cầu trong đề rồi lưu tệp và nộp lại cho thầy nhé!`
      : failedList.length === 0
      ? `Thầy khen ${shortName} đã hoàn thành xuất sắc bài thực hành "${assignment.title}"! Bài làm của con đạt trọn vẹn cả ${criterionBreakdown.length}/${criterionBreakdown.length} tiêu chí trong ma trận đề. Thầy rất tự hào về con!`
      : `Thầy khen ${shortName} đã nỗ lực làm bài "${assignment.title}"${
          passedList.length > 0 ? ` và hoàn thành tốt phần: ${passedList.slice(0, 2).join("; ")}` : ""
        }! Để bài đạt điểm 10 tuyệt đối theo ma trận đề, thầy nhắc con chỉnh sửa thêm ở mục: ${failedList.join(
          "; "
        )} nhé!`;

    return {
      aiScore,
      needsAttention: aiScore < 6.5,
      detectedErrors,
      criterionBreakdown,
      personalizedFeedback,
      standardizedFileName,
      wasFileNameAutoFixed,
    };
  }

  // 2. CHẤM BÀI THỰC HÀNH SCRATCH (.SB3) BÁM SÁT MA TRẬN CHECKLIST CỦA ĐỀ
  if (extractedInspection.type === "sb3") {
    const s = extractedInspection.data;
    const isEmptySb3 = s.totalBlocks === 0;

    if (isEmptySb3) {
      detectedErrors.push(
        `Tệp '${originalFileName}' chưa có khối lệnh Scratch nào hoặc không đúng định dạng .sb3`
      );
    }

    assignment.checklist.forEach((c) => {
      const critLower = `${c.criterion} ${c.technicalTarget}`.toLowerCase();
      let passed = true;
      let ratio = 1;
      let detailNote = "";

      if (isEmptySb3) {
        passed = false;
        ratio = 0;
        detailNote = `Không tìm thấy khối lệnh nào trong tệp '${originalFileName}' cho tiêu chí: "${c.criterion}".`;
      } else if (
        critLower.includes("cờ xanh") ||
        critLower.includes("whenflagclicked") ||
        critLower.includes("sự kiện") ||
        critLower.includes("event")
      ) {
        passed = s.hasWhenFlagClicked || s.astBlocks.some((b) => b.category === "event");
        ratio = passed ? 1 : 0;
        detailNote = passed
          ? `Đã sử dụng khối sự kiện khởi động (${
              s.astBlocks.find((b) => b.category === "event")?.label || "event_whenflagclicked"
            }).`
          : `Chưa gắn khối lệnh Sự kiện (ví dụ: Khi bấm vào lá cờ xanh) ở đầu kịch bản.`;
        if (!passed) {
          detectedErrors.push(`Tiêu chí "${c.criterion}": Thiếu khối lệnh Sự kiện mở đầu kịch bản`);
        }
      } else if (
        critLower.includes("lặp") ||
        critLower.includes("repeat") ||
        critLower.includes("forever") ||
        critLower.includes("điều khiển") ||
        critLower.includes("control")
      ) {
        passed = s.hasRepeatLoop;
        ratio = passed ? 1 : s.manualRepeatedMoveCount > 0 ? 0.45 : 0;
        detailNote = passed
          ? `Đã sử dụng cấu trúc điều khiển / vòng lặp (${
              s.astBlocks.find((b) => b.category === "control")?.label || `repeat(${s.repeatCountValue})`
            }) đúng yêu cầu ma trận.`
          : `Chưa dùng khối vòng lặp (repeat/forever); đang ghép ${s.manualRepeatedMoveCount} khối chuyển động đơn lẻ.`;
        if (!passed) {
          detectedErrors.push(
            `Tiêu chí "${c.criterion}": Chưa sử dụng khối lệnh Vòng lặp / Điều khiển theo yêu cầu đề bài`
          );
        }
      } else if (
        critLower.includes("âm thanh") ||
        critLower.includes("sound") ||
        critLower.includes("nói") ||
        critLower.includes("say") ||
        critLower.includes("hiển thị") ||
        critLower.includes("looks")
      ) {
        const hasLooksOrSound =
          s.hasSoundBlock || s.astBlocks.some((b) => b.category === "looks" || b.category === "sound");
        passed = hasLooksOrSound;
        ratio = passed ? 1 : 0;
        detailNote = passed
          ? `Đã gắn khối lệnh Âm thanh / Hiển thị (${
              s.astBlocks.find((b) => b.category === "sound" || b.category === "looks")?.label || "Hoạt động tốt"
            }).`
          : `Chưa tìm thấy khối lệnh Âm thanh hoặc Hiển thị lời nói trong kịch bản.`;
        if (!passed) {
          detectedErrors.push(
            `Tiêu chí "${c.criterion}": Còn thiếu khối lệnh Âm thanh / Hiển thị theo yêu cầu`
          );
        }
      } else {
        // Kiểm tra chuyển động / tọa độ / tổng thể khối lệnh theo tiêu chí
        const motionBlocks = s.astBlocks.filter((b) => b.category === "motion");
        passed = motionBlocks.length > 0 && (s.hasRepeatLoop || s.totalBlocks >= 3);
        ratio = passed ? 1 : motionBlocks.length > 0 ? 0.65 : 0;
        detailNote = `Kịch bản gồm ${s.totalBlocks} khối lệnh (${s.astBlocks
          .map((b) => b.opcode)
          .slice(0, 5)
          .join(" -> ")}).`;
        if (!passed) {
          detectedErrors.push(
            `Tiêu chí "${c.criterion}": Các khối lệnh chuyển động/logic trong kịch bản chưa đầy đủ (${s.totalBlocks} khối)`
          );
        }
      }

      const earned = Math.round(c.maxPoints * ratio * 2) / 2;
      totalEarned += earned;
      criterionBreakdown.push({
        criterion: c.criterion,
        passed,
        earnedPoints: earned,
        maxPoints: c.maxPoints,
        detailNote,
      });
    });

    const aiScore = isEmptySb3 ? 0 : Math.min(10, Math.max(0, Math.round(totalEarned * 2) / 2));
    const failedList = criterionBreakdown.filter((c) => !c.passed).map((c) => c.criterion);

    const personalizedFeedback = isEmptySb3
      ? `Thầy thấy tệp '${originalFileName}' của ${shortName} chưa có các khối lệnh Scratch theo đề bài "${assignment.title}". Con hãy kiểm tra và chọn đúng tệp dự án .sb3 đã lưu từ máy tính để nộp cho thầy nhé!`
      : failedList.length === 0
      ? `Xuất sắc lắm ${shortName}! Thầy khen con đã lập trình dự án "${assignment.title}" đạt 100% các tiêu chí trong ma trận đề (${s.totalBlocks} khối lệnh hoạt động chính xác).`
      : `Thầy khen ${shortName} đã biết lắp ghép ${s.totalBlocks} khối lệnh trong bài "${assignment.title}"! Để chương trình hoàn chỉnh đạt điểm tối đa theo ma trận đề, thầy hướng dẫn con bổ sung/chỉnh lại mục: ${failedList.join(
          "; "
        )} nhé!`;

    return {
      aiScore,
      needsAttention: aiScore < 6.5,
      detectedErrors,
      criterionBreakdown,
      personalizedFeedback,
      standardizedFileName,
      wasFileNameAutoFixed,
    };
  }

  // 3. CHẤM BÀI THỰC HÀNH POWERPOINT (.PPTX) BÁM SÁT MA TRẬN CHECKLIST CỦA ĐỀ
  if (extractedInspection.type === "pptx") {
    const p = extractedInspection.data;
    const isEmptyPptx = p.slideCount === 0;
    const reqSlides = assignment.templateSummary?.slideCountRequired || 3;

    if (isEmptyPptx) {
      detectedErrors.push(
        `Tệp '${originalFileName}' không có trang chiếu (Slide) nào hoặc không đúng định dạng PowerPoint (.pptx)`
      );
    }

    assignment.checklist.forEach((c) => {
      const critLower = `${c.criterion} ${c.technicalTarget}`.toLowerCase();
      let passed = true;
      let ratio = 1;
      let detailNote = "";

      if (isEmptyPptx) {
        passed = false;
        ratio = 0;
        detailNote = `Không tìm thấy trang chiếu nào trong tệp '${originalFileName}' cho tiêu chí: "${c.criterion}".`;
      } else if (
        critLower.includes("hiệu ứng") ||
        critLower.includes("transition") ||
        critLower.includes("animation") ||
        critLower.includes("chuyển trang")
      ) {
        const slidesWithEffects = p.slides.filter(
          (sl) => sl.hasTransition || sl.animationCount > 0
        ).length;
        passed = slidesWithEffects === p.slideCount && p.slideCount > 0;
        ratio = passed ? 1 : slidesWithEffects > 0 ? 0.65 : 0;
        detailNote = `Có ${slidesWithEffects}/${p.slideCount} trang chiếu được gán hiệu ứng Transition/Animation.`;
        if (!passed) {
          detectedErrors.push(
            `Tiêu chí "${c.criterion}": Mới gán hiệu ứng cho ${slidesWithEffects}/${p.slideCount} Slide`
          );
        }
      } else if (
        critLower.includes("ảnh") ||
        critLower.includes("hình") ||
        critLower.includes("nền") ||
        critLower.includes("background") ||
        critLower.includes("pic") ||
        critLower.includes("đa phương tiện")
      ) {
        const totalImages = p.slides.reduce((acc, sl) => acc + sl.imageCount, 0);
        const slidesWithBg = p.slides.filter((sl) => sl.hasBackgroundFill).length;
        passed = totalImages > 0 && slidesWithBg === p.slideCount;
        ratio = passed ? 1 : totalImages > 0 ? 0.75 : 0.3;
        detailNote = `Tổng số hình ảnh trên các Slide: ${totalImages} ảnh; số Slide có định dạng nền: ${slidesWithBg}/${p.slideCount} Slide.`;
        if (!passed) {
          detectedErrors.push(
            `Tiêu chí "${c.criterion}": Tổng ${totalImages} ảnh, ${slidesWithBg}/${p.slideCount} Slide có màu nền/hình minh họa`
          );
        }
      } else {
        // Kiểm tra số lượng Slide và nội dung tiêu đề trên các Slide
        const slideMatch = c.criterion.match(/(\d+)\s*slide/i);
        const targetCount = slideMatch ? parseInt(slideMatch[1], 10) : reqSlides;
        passed = p.slideCount >= targetCount;
        ratio = passed ? 1 : Math.max(0.4, p.slideCount / targetCount);
        const titlesPreview = p.slides.map((s) => `S${s.slideNumber}: "${s.titleText}"`).join(" | ");
        detailNote = `Tệp có ${p.slideCount} trang chiếu (${titlesPreview}).`;
        if (!passed) {
          detectedErrors.push(
            `Tiêu chí "${c.criterion}": Tệp hiện có ${p.slideCount}/${targetCount} Slide theo yêu cầu ma trận`
          );
        }
      }

      const earned = Math.round(c.maxPoints * ratio * 2) / 2;
      totalEarned += earned;
      criterionBreakdown.push({
        criterion: c.criterion,
        passed,
        earnedPoints: earned,
        maxPoints: c.maxPoints,
        detailNote,
      });
    });

    const aiScore = isEmptyPptx ? 0 : Math.min(10, Math.max(0, Math.round(totalEarned * 2) / 2));
    const failedList = criterionBreakdown.filter((c) => !c.passed).map((c) => c.criterion);

    const personalizedFeedback = isEmptyPptx
      ? `Thầy thấy tệp '${originalFileName}' của ${shortName} chưa có trang chiếu PowerPoint nào. Con hãy chọn đúng tệp bài làm .pptx trên máy tính rồi nộp lại cho thầy nhé!`
      : failedList.length === 0
      ? `Bài trình chiếu "${assignment.title}" của ${shortName} rất xuất sắc! Thầy khen con đã hoàn thành đầy đủ cả ${criterionBreakdown.length} tiêu chí trong ma trận đề (${p.slideCount} Slide sinh động).`
      : `Thầy khen ${shortName} đã thiết kế được ${p.slideCount} trang chiếu cho bài "${assignment.title}"! Để bài đạt điểm tối đa theo ma trận đề, thầy nhắc con hoàn thiện thêm mục: ${failedList.join(
          "; "
        )} nhé!`;

    return {
      aiScore,
      needsAttention: aiScore < 6.5,
      detectedErrors,
      criterionBreakdown,
      personalizedFeedback,
      standardizedFileName,
      wasFileNameAutoFixed,
    };
  }

  // 4. CHẤM ĐỀ KIỂM TRA LÝ THUYẾT & TỰ LUẬN NGẮN NLP BÁM SÁT CÂU HỎI TRONG ĐỀ
  const t = extractedInspection.data;
  const maxMcqPoints =
    assignment.theoryExam?.multipleChoice.reduce((acc, q) => acc + Number(q.points || 0), 0) || 6.0;

  if (t.mcqTotalCount > 0) {
    if (t.mcqCorrectCount < t.mcqTotalCount) {
      detectedErrors.push(
        `Phần Trắc nghiệm trả lời đúng ${t.mcqCorrectCount}/${t.mcqTotalCount} câu (đạt ${t.mcqScore.toFixed(
          1
        )}/${maxMcqPoints.toFixed(1)}đ)`
      );
    }
    criterionBreakdown.push({
      criterion: `Phần I — Trắc nghiệm khách quan (${t.mcqTotalCount} câu hỏi trong đề)`,
      passed: t.mcqCorrectCount === t.mcqTotalCount,
      earnedPoints: Number(t.mcqScore.toFixed(1)),
      maxPoints: Number(maxMcqPoints.toFixed(1)),
      detailNote: `Học sinh làm đúng ${t.mcqCorrectCount}/${t.mcqTotalCount} câu trắc nghiệm của đề "${assignment.title}".`,
    });
  }

  let totalEssayEarned = 0;

  if (t.shortAnswerDetails && t.shortAnswerDetails.length > 0) {
    t.shortAnswerDetails.forEach((saItem, idx) => {
      totalEssayEarned += saItem.earnedPoints;
      const passedSa = saItem.earnedPoints >= saItem.maxPoints * 0.7;
      if (!passedSa) {
        detectedErrors.push(
          `Câu tự luận ${idx + 1} ("${saItem.question}") đạt ${saItem.earnedPoints.toFixed(
            1
          )}/${saItem.maxPoints.toFixed(1)}đ — chưa nêu đủ ý khóa theo đáp án đề`
        );
      }
      criterionBreakdown.push({
        criterion:
          t.shortAnswerDetails!.length > 1
            ? `Phần II (Câu tự luận ${idx + 1}): ${saItem.question}`
            : `Phần II — Tự luận ngắn: ${saItem.question}`,
        passed: passedSa,
        earnedPoints: Number(saItem.earnedPoints.toFixed(1)),
        maxPoints: Number(saItem.maxPoints.toFixed(1)),
        detailNote: `Bài trả lời: "${saItem.studentAnswer || "(Bỏ trống)"}" — Khớp ý khóa: ${
          saItem.matchedKeywords.length > 0 ? saItem.matchedKeywords.join(", ") : "Chưa khớp từ khóa trọng tâm"
        }.`,
      });
    });
  } else if (assignment.theoryExam?.shortAnswer && assignment.theoryExam.shortAnswer.points > 0) {
    const maxShortPoints = Number(assignment.theoryExam.shortAnswer.points || 4.0);
    const nlpRatio =
      t.nlpSimilarityScore >= 85
        ? 1
        : t.nlpSimilarityScore >= 65
        ? 0.8
        : t.nlpSimilarityScore >= 40
        ? 0.5
        : 0;
    const nlpPoints = Math.round(maxShortPoints * nlpRatio * 2) / 2;
    totalEssayEarned = nlpPoints;

    if (t.nlpSimilarityScore < 75) {
      detectedErrors.push(
        `Câu tự luận ngắn ("${t.shortAnswerQuestion}") chưa nêu đủ các ý chính theo đáp án của đề`
      );
    }

    criterionBreakdown.push({
      criterion: `Phần II — Tự luận ngắn: ${t.shortAnswerQuestion}`,
      passed: t.nlpSimilarityScore >= 75,
      earnedPoints: nlpPoints,
      maxPoints: Number(maxShortPoints.toFixed(1)),
      detailNote: `Bài trả lời của học sinh: "${t.studentShortAnswer || "(Bỏ trống)"}" — Khớp ${
        t.matchedSemanticConcepts.length
      } ý khóa (${t.nlpSimilarityScore}%). ${t.nlpExplanation}`,
    });
  }

  const aiScore = Math.min(10, Math.max(0, Math.round((t.mcqScore + totalEssayEarned) * 2) / 2));

  const personalizedFeedback =
    aiScore >= 9.0
      ? `Thầy khen ${shortName} nắm rất vững kiến thức đề "${assignment.title}"! Con trả lời đúng ${t.mcqCorrectCount}/${t.mcqTotalCount} câu trắc nghiệm và diễn đạt phần tự luận rất rõ ý. Cố gắng phát huy con nhé!`
      : `Thầy ghi nhận sự cố gắng của ${shortName} trong bài "${assignment.title}" (Trắc nghiệm đúng ${t.mcqCorrectCount}/${t.mcqTotalCount} câu)! Con hãy xem lại các câu trắc nghiệm còn nhầm và bổ sung thêm các ý khóa cho phần tự luận nhé!`;

  return {
    aiScore,
    needsAttention: aiScore < 6.5,
    detectedErrors,
    criterionBreakdown,
    personalizedFeedback,
    standardizedFileName,
    wasFileNameAutoFixed,
  };
}

export {
  type ImportedStudentRow,
  type GroupedStudentClassFolder,
  parseStudentExcelFile,
  groupImportedStudentsByClassFolder,
  downloadStandardStudentExcelTemplate,
  createSampleStudentExcelFileObject,
} from "./studentExcelParser";

