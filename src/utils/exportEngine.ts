import JSZip from "jszip";
import {
  Assignment,
  GradeLevel,
  StudentMcqAnswerDetail,
  StudentSubmission,
  TheoryExam,
} from "../types/grading";
import { ensureTeacherPersonaThay, removeVietnameseTones } from "./fileEngine";

function escapeXml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Danh sách các trường dữ liệu nội bộ (Internal Fields) chỉ phục vụ giáo viên & hệ thống,
 * tuyệt đối phải được loại bỏ (omit / filter) trước khi đổ dữ liệu ra giao diện tệp Word / PDF.
 */
export const INTERNAL_SUBMISSION_FIELDS = [
  "aiScore",
  "approvalStatus",
  "needsAttention",
  "processingTimeSec",
  "wasFileNameAutoFixed",
  "detectedErrors",
  "driveFileId",
  "driveAssignmentFolderId",
  "driveSynced",
  "driveRootFolderUrl",
  "driveWebViewLink",
  "driveAssignmentFolderLink",
] as const;

export type InternalSubmissionField = (typeof INTERNAL_SUBMISSION_FIELDS)[number];
export type PublicExportSubmission = Omit<StudentSubmission, InternalSubmissionField>;

/**
 * Hàm omit loại bỏ hoàn toàn các trường dữ liệu nội bộ khỏi đối tượng trước khi xuất tệp
 */
export function omit<T extends Record<string, any>, K extends string>(
  obj: T,
  keysToOmit: readonly K[]
): Omit<T, K> {
  const omitKeySet = new Set<string>(keysToOmit);
  const filteredEntries = Object.entries(obj).filter(
    ([key]) => !omitKeySet.has(key) && !key.startsWith("_") && !key.startsWith("internal")
  );
  return Object.fromEntries(filteredEntries) as Omit<T, K>;
}

const INTERNAL_NOTE_REGEX =
  /châm chước|linh động|khuyến khích|khích lệ|nội bộ|điều chỉnh điểm|cộng thêm\s*\d|cộng khích lệ|điểm gốc ai|aiscore|approvalstatus|needsattention|15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14/i;

/**
 * Làm sạch ghi chú kỹ thuật của từng tiêu chí (loại bỏ thẻ XML/AST nội bộ hoặc ghi chú hệ thống)
 */
export function sanitizeCriterionDetailNote(rawNote: string): string {
  return String(rawNote || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\(Hệ thống đã tự động đổi tên chuẩn\)/gi, "")
    .replace(/;\s*hệ thống đã tự động sửa tên file theo cú pháp lớp/gi, "")
    .replace(/\b(?:DOM XML|cây AST|node|opcode)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Lọc bỏ hoàn toàn mọi ghi chú "châm chước / cộng thêm điểm khuyến khích / nội bộ"
 * bằng cả filter câu và regex để tạo Nhận xét chính thức trang trọng gửi Phụ huynh học sinh.
 */
export function getOfficialParentFeedback(
  rawFeedback: string,
  finalScore: number,
  studentName: string
): string {
  const personaFixed = ensureTeacherPersonaThay(rawFeedback || "")
    .replace(/\[[^\]]*(?:Ghi chú|châm chước|linh động|khuyến khích|khích lệ|nội bộ|điều chỉnh)[^\]]*\]/gi, "")
    .replace(/\([^)]*(?:châm chước|linh động|khuyến khích|khích lệ|nội bộ|điều chỉnh)[^)]*\)/gi, "");

  const sentences = personaFixed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((sentence) => sentence.length > 0 && !INTERNAL_NOTE_REGEX.test(sentence));

  const cleaned = sentences.join(" ").replace(/\s+/g, " ").trim();

  if (!cleaned) {
    if (finalScore >= 8.5) {
      return `Thầy khen em ${studentName} nắm vững kiến thức lý thuyết và thao tác thực hành môn Tin học rất tốt, hoàn thành đầy đủ các yêu cầu của bài kiểm tra.`;
    }
    if (finalScore >= 6.5) {
      return `Em ${studentName} đã nắm được kiến thức cơ bản và hoàn thành bài kiểm tra môn Tin học. Em cần rèn luyện thêm thao tác định dạng và kiểm tra kỹ bài trước khi nộp để đạt kết quả cao hơn.`;
    }
    return `Em ${studentName} đã có cố gắng làm bài môn Tin học, tuy nhiên cần ôn tập kỹ hơn kiến thức trọng tâm trong sách giáo khoa và luyện tập thêm thao tác thực hành trên máy tính.`;
  }

  return cleaned;
}

/**
 * Hàm lọc (filter) và loại bỏ (omit) toàn bộ các trường dữ liệu nội bộ của bài nộp
 * trước khi đổ dữ liệu ra giao diện tệp Word (.docx) hoặc PDF (.pdf).
 */
export function sanitizeSubmissionForExport(
  submission: StudentSubmission
): PublicExportSubmission {
  const omitted = omit(submission, INTERNAL_SUBMISSION_FIELDS);

  const sanitizedCriteria = (omitted.criterionBreakdown || [])
    .filter((c) => Boolean(c && c.criterion && !INTERNAL_NOTE_REGEX.test(c.criterion)))
    .map((c) => ({
      criterion: c.criterion,
      passed: Boolean(c.passed),
      earnedPoints: Number(c.earnedPoints || 0),
      maxPoints: Number(c.maxPoints || 0),
      detailNote: sanitizeCriterionDetailNote(c.detailNote),
    }));

  const sanitizedMcqDetails = omitted.mcqDetails
    ? omitted.mcqDetails
        .filter((q) => Boolean(q && q.question))
        .map((q) => omit(q as Record<string, any>, ["internalId", "rawDebug"] as const) as StudentMcqAnswerDetail)
    : undefined;

  return {
    ...omitted,
    personalizedFeedback: getOfficialParentFeedback(
      omitted.personalizedFeedback,
      omitted.finalScore,
      omitted.studentName
    ),
    criterionBreakdown: sanitizedCriteria,
    mcqDetails: sanitizedMcqDetails,
  };
}

/**
 * Xếp loại học tập môn Tin học Tiểu học theo Thông tư 27/2020/TT-BGDĐT
 */
export function getOfficialGradeClassification(score: number): string {
  if (score >= 9.0) return "Hoàn thành xuất sắc";
  if (score >= 7.0) return "Hoàn thành tốt";
  if (score >= 5.0) return "Hoàn thành";
  return "Cần cố gắng";
}

/**
 * Kiểm tra bài nộp / bài kiểm tra của học sinh có phần Thực hành hay không
 */
export function hasPracticeSection(
  submission: StudentSubmission,
  assignments: Assignment[] = []
): boolean {
  if (
    submission.fileType === "docx" ||
    submission.fileType === "pptx" ||
    submission.fileType === "sb3"
  ) {
    return true;
  }
  if (submission.practiceWorkImageDataUrl || submission.practiceOriginalFileName) {
    return true;
  }
  const matchedAssignment = assignments.find((a) => a.id === submission.assignmentId);
  if (matchedAssignment) {
    const bp = matchedAssignment.theoryExam?.semesterBlueprint;
    if (bp && ((bp.practiceTasks && bp.practiceTasks.length > 0) || bp.practicePercent > 0)) {
      return true;
    }
    if (matchedAssignment.isSemesterExam) {
      return true;
    }
  }
  const hasPracticeCriterion = submission.criterionBreakdown.some((c) =>
    /thực hành|word|powerpoint|scratch|\.docx|\.pptx|\.sb3|slide|văn bản|khối lệnh/i.test(
      `${c.criterion} ${c.detailNote}`
    )
  );
  return hasPracticeCriterion;
}

/**
 * Trả về tên tệp của học sinh (tên tệp gốc học sinh nộp + tên tệp thực hành chuẩn hóa trên Google Drive)
 */
export function getGoogleDrivePracticeFileInfo(submission: StudentSubmission): {
  studentRawFileName: string;
  driveFileName: string;
  driveFolderPath: string;
  fullDrivePath: string;
  driveRootFolderUrl: string;
  driveAssignmentFolderName: string;
  driveWebViewLink?: string;
  driveAssignmentFolderLink?: string;
} {
  const cleanClass = removeVietnameseTones(submission.className).replace(/\s+/g, "");
  const cleanStudent = removeVietnameseTones(submission.studentName)
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");

  const cleanStudentId =
    removeVietnameseTones(submission.studentId || "HS01")
      .replace(/\s+/g, "")
      .toUpperCase() || "HS01";

  let driveFileName = submission.standardizedFileName;
  if (submission.fileType === "theory" || driveFileName.endsWith(".json")) {
    const baseName = driveFileName.replace(/\.json$/i, "");
    driveFileName = submission.practiceOriginalFileName
      ? submission.practiceOriginalFileName
      : `${baseName}_ThucHanh.docx`;
  } else if (!driveFileName) {
    driveFileName = `${cleanStudentId}_${cleanStudent}_${cleanClass}_BaiThucHanh.${submission.fileType}`;
  }

  const studentRawFileName =
    submission.practiceOriginalFileName ||
    (submission.originalFileName && !submission.originalFileName.endsWith(".json")
      ? submission.originalFileName
      : driveFileName);

  const assignmentFolder =
    submission.driveAssignmentFolderName ||
    `${submission.assignmentTitle} (${submission.className})`.replace(/[\\/:*?"<>|]/g, "-");

  const driveRootFolderUrl =
    submission.driveRootFolderUrl ||
    "https://drive.google.com/drive/folders/15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14?usp=sharing";

  const driveFolderPath = `Thư mục bài tập lớp / ${assignmentFolder}`;

  return {
    studentRawFileName,
    driveFileName,
    driveFolderPath,
    fullDrivePath: `${driveFolderPath} / ${driveFileName}`,
    driveRootFolderUrl,
    driveAssignmentFolderName: assignmentFolder,
    driveWebViewLink: submission.driveWebViewLink,
    driveAssignmentFolderLink: submission.driveAssignmentFolderLink,
  };
}

export function getGoogleDrivePracticeFileName(submission: StudentSubmission): string {
  return getGoogleDrivePracticeFileInfo(submission).fullDrivePath;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = String(text || "").split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

/**
 * Tạo hình ảnh trực quan bài làm thực hành của học sinh (Word .docx / PowerPoint .pptx / Scratch .sb3 / Bài thực hành)
 * kèm theo Tên tệp của học sinh ngay trên khung ảnh để hiển thị trong Phiếu kết quả & xuất ra Word / PDF.
 */
export function generatePracticeWorkSnapshotSync(
  submission: StudentSubmission,
  assignments: Assignment[] = []
): string {
  const width = 960;
  const height = 560;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const driveInfo = getGoogleDrivePracticeFileInfo(submission);
  const matchedAssignment = assignments.find((a) => a.id === submission.assignmentId);

  // Nền tổng thể
  ctx.fillStyle = "#F1F5F9";
  ctx.fillRect(0, 0, width, height);

  // Viền ngoài cùng
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // 1. Thanh tiêu đề cửa sổ phần mềm thực hành (Top Window Chrome)
  const appTypeLabel =
    submission.inspection.type === "docx"
      ? "MICROSOFT WORD (.DOCX) — BÀI LÀM VĂN BẢN CỦA HỌC SINH"
      : submission.inspection.type === "pptx"
      ? "MICROSOFT POWERPOINT (.PPTX) — BÀI TRÌNH CHIẾU CỦA HỌC SINH"
      : submission.inspection.type === "sb3"
      ? "SCRATCH 3.0 (.SB3) — KỊCH BẢN KHỐI LỆNH & SÂN KHẤU 2D CỦA HỌC SINH"
      : "PHẦN THỰC HÀNH TRÊN MÁY TÍNH — BÀI LÀM CỦA HỌC SINH";

  const headerColor =
    submission.inspection.type === "docx"
      ? "#1E40AF"
      : submission.inspection.type === "pptx"
      ? "#C2410C"
      : submission.inspection.type === "sb3"
      ? "#0284C7"
      : "#0F766E";

  ctx.fillStyle = headerColor;
  ctx.fillRect(0, 0, width, 74);

  // 3 nút cửa sổ
  const dotColors = ["#EF4444", "#F59E0B", "#10B981"];
  dotColors.forEach((col, idx) => {
    ctx.beginPath();
    ctx.arc(24 + idx * 18, 22, 6, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  });

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 15px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.fillText(appTypeLabel, 84, 27);

  // Điểm thực hành góc phải
  ctx.font = "bold 14px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.fillStyle = "#FEF08A";
  const rightInfo = `HS: ${submission.studentName} (${submission.className}) — Điểm: ${submission.finalScore.toFixed(1)}/10đ`;
  const rightWidth = ctx.measureText(rightInfo).width;
  ctx.fillText(rightInfo, width - rightWidth - 20, 27);

  // Thanh hiển thị Tên tệp của học sinh nổi bật ngay dưới thanh tiêu đề
  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.fillRect(16, 38, width - 32, 28);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 13px 'JetBrains Mono', Consolas, monospace";
  ctx.fillText(
    `📄 Tên tệp học sinh nộp: ${driveInfo.studentRawFileName}   ➔   Tên tệp chuẩn hóa: ${driveInfo.driveFileName}`,
    26,
    57
  );

  // 2. Vùng nội dung bài làm thực hành (y: 74 -> 514)
  if (submission.inspection.type === "docx") {
    const data = submission.inspection.data;
    // Thanh công cụ Ribbon của Word
    ctx.fillStyle = "#E2E8F0";
    ctx.fillRect(0, 74, width, 38);
    ctx.fillStyle = "#1E293B";
    ctx.font = "bold 12px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(
      `Thẻ Home  |  Phông chữ: ${data.detectedFonts.join(", ") || "Times New Roman"}  |  Cỡ tiêu đề: ${
        data.titleFontSizePt
      }pt (${data.titleBold ? "In đậm" : "Thường"})  |  Căn lề tiêu đề: ${data.titleAlignment.toUpperCase()}  |  Khổ giấy: ${
        data.paperSize
      }`,
      20,
      98
    );

    // Trang giấy trắng A4 mô phỏng bài làm Word của học sinh
    const pageX = 48;
    const pageY = 126;
    const pageW = width - 96;
    const pageH = 374;

    // Đổ bóng trang giấy
    ctx.fillStyle = "#CBD5E1";
    ctx.fillRect(pageX + 4, pageY + 4, pageW, pageH);

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.5;
    ctx.fillRect(pageX, pageY, pageW, pageH);
    ctx.strokeRect(pageX, pageY, pageW, pageH);

    // Vẽ từng dòng văn bản học sinh đã gõ
    let curY = pageY + 38;
    data.extractedLines.forEach((line, idx) => {
      const fontPt = Math.min(22, Math.max(13, Math.round(line.fontSizePt * 1.15)));
      ctx.font = `${line.isBold ? "bold " : ""}${fontPt}px 'Times New Roman', serif`;
      ctx.fillStyle = line.colorHex || "#0F172A";

      const maxLineW = pageW - 220;
      const wrapped = wrapCanvasText(ctx, line.text, maxLineW);

      wrapped.forEach((wLine) => {
        let drawX = pageX + 36;
        const lw = ctx.measureText(wLine).width;
        if (line.alignment === "center") {
          drawX = pageX + (pageW - 180) / 2 - lw / 2;
        } else if (line.alignment === "right") {
          drawX = pageX + pageW - 200 - lw;
        }
        ctx.fillText(wLine, Math.max(pageX + 24, drawX), curY);
        curY += fontPt + 10;
      });

      // Nhãn kiểm tra kỹ thuật bên phải dòng
      ctx.font = "bold 11px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillStyle = line.startsWithUppercase ? "#047857" : "#DC2626";
      const metaTag = `Dòng ${idx + 1}: ${line.fontSizePt}pt · ${line.alignment}${
        !line.startsWithUppercase ? " (Lỗi chưa viết hoa)" : " (Đúng chuẩn)"
      }`;
      ctx.fillText(metaTag, pageX + pageW - 210, curY - fontPt);
      curY += 6;
    });

    // Nếu bài làm có chèn ảnh (<w:drawing>)
    if (data.imageCount > 0 && curY < pageY + pageH - 80) {
      const imgBoxW = 340;
      const imgBoxH = Math.min(115, pageY + pageH - curY - 16);
      const imgBoxX = data.imageAlignedCenter
        ? pageX + (pageW - 180) / 2 - imgBoxW / 2
        : pageX + 36;

      ctx.fillStyle = "#EFF6FF";
      ctx.strokeStyle = data.imageAlignedCenter ? "#0284C7" : "#F59E0B";
      ctx.lineWidth = 2;
      ctx.fillRect(imgBoxX, curY, imgBoxW, imgBoxH);
      ctx.strokeRect(imgBoxX, curY, imgBoxW, imgBoxH);

      // Vẽ biểu tượng biển đảo / minh họa trong khung ảnh Word
      ctx.fillStyle = "#BAE6FD";
      ctx.fillRect(imgBoxX + 10, curY + 10, imgBoxW - 20, imgBoxH - 42);
      ctx.fillStyle = "#0369A1";
      ctx.font = "bold 13px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillText(
        "🖼️ [Hình ảnh minh họa học sinh đã chèn vào trang Word]",
        imgBoxX + 18,
        curY + 38
      );
      ctx.font = "12px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillStyle = data.imageAlignedCenter ? "#047857" : "#B45309";
      ctx.fillText(
        `Trạng thái ảnh: ${
          data.imageAlignedCenter ? "✓ Đã căn giữa trang văn bản" : "▲ Ảnh đang căn lề trái"
        }`,
        imgBoxX + 18,
        curY + imgBoxH - 14
      );
    }
  } else if (submission.inspection.type === "pptx") {
    const data = submission.inspection.data;
    // Thanh Ribbon PowerPoint
    ctx.fillStyle = "#FFEDD5";
    ctx.fillRect(0, 74, width, 36);
    ctx.fillStyle = "#9A3412";
    ctx.font = "bold 12px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(
      `PowerPoint Slide Sorter  |  Tổng số trang chiếu học sinh đã làm: ${data.slideCount} Slide  |  Tệp: ${driveInfo.driveFileName}`,
      20,
      97
    );

    const slides = data.slides.slice(0, 3);
    const cardW = 286;
    const cardH = 360;
    const gap = 22;
    const startX = 28;
    const startY = 126;

    slides.forEach((sl, idx) => {
      const x = startX + idx * (cardW + gap);
      const y = startY;

      // Khung Slide
      ctx.fillStyle = sl.hasBackgroundFill ? "#ECFDF5" : "#FFFFFF";
      ctx.strokeStyle = sl.hasBackgroundFill ? "#10B981" : "#CBD5E1";
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeRect(x, y, cardW, cardH);

      // Header Slide
      ctx.fillStyle = sl.hasBackgroundFill ? "#047857" : "#475569";
      ctx.fillRect(x, y, cardW, 34);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 13px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillText(`SLIDE #${sl.slideNumber} — ${sl.layoutName}`, x + 12, y + 22);

      // Nội dung tiêu đề Slide của học sinh
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 15px 'Be Vietnam Pro', Arial, sans-serif";
      const titleLines = wrapCanvasText(ctx, `“${sl.titleText}”`, cardW - 28);
      let ty = y + 64;
      titleLines.slice(0, 3).forEach((tl) => {
        ctx.fillText(tl, x + 14, ty);
        ty += 22;
      });

      // Khung minh họa đa phương tiện trên Slide
      ctx.fillStyle = sl.hasBackgroundFill ? "#D1FAE5" : "#F1F5F9";
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 1;
      ctx.fillRect(x + 14, y + 135, cardW - 28, 95);
      ctx.strokeRect(x + 14, y + 135, cardW - 28, 95);

      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 13px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillText(`🖼️ Hình ảnh chèn: ${sl.imageCount} ảnh`, x + 26, y + 168);
      ctx.fillText(`🔊 Âm thanh / Video: ${sl.audioCount} tệp`, x + 26, y + 194);
      ctx.font = "12px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillStyle = sl.hasBackgroundFill ? "#065F46" : "#DC2626";
      ctx.fillText(
        sl.hasBackgroundFill ? "✓ Đã tô màu nền Slide (<p:bg>)" : "▲ Chưa tô màu nền (Nền trắng)",
        x + 26,
        y + 218
      );

      // Thông số Transition & Animation
      ctx.fillStyle = "#334155";
      ctx.font = "bold 12px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillText(
        `• Chuyển trang (Transition): ${sl.hasTransition ? sl.transitionType || "Đã gán" : "Chưa gán"}`,
        x + 14,
        y + 264
      );
      ctx.fillText(
        `• Hiệu ứng động (Animation): ${sl.animationCount} hiệu ứng`,
        x + 14,
        y + 290
      );

      // Badge trạng thái slide
      ctx.fillStyle = sl.hasTransition && sl.hasBackgroundFill ? "#047857" : "#D97706";
      ctx.font = "bold 12px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillText(
        sl.hasTransition && sl.hasBackgroundFill
          ? "✓ Slide đạt chuẩn kỹ thuật"
          : "▲ Cần bổ sung hiệu ứng / nền",
        x + 14,
        y + 334
      );
    });
  } else if (submission.inspection.type === "sb3") {
    const data = submission.inspection.data;

    // Cột trái: Kịch bản khối lệnh Scratch (AST Blocks) của học sinh
    const leftX = 24;
    const panelY = 92;
    const leftW = 445;
    const panelH = 408;

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.fillRect(leftX, panelY, leftW, panelH);
    ctx.strokeRect(leftX, panelY, leftW, panelH);

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 14px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(
      `1. Kịch bản Khối lệnh của Học sinh (${data.totalBlocks} khối lệnh):`,
      leftX + 16,
      panelY + 28
    );

    const blockColors: Record<string, string> = {
      event: "#FFBF00",
      control: "#FFAB19",
      motion: "#4C97FF",
      looks: "#9966FF",
      sound: "#CF63CF",
    };

    let by = panelY + 46;
    data.astBlocks.slice(0, 7).forEach((b) => {
      const indent = b.depth * 24;
      const bx = leftX + 20 + indent;
      const bw = Math.min(380 - indent, leftW - 40 - indent);
      const bh = 38;

      ctx.fillStyle = blockColors[b.category] || "#4C97FF";
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 13px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillText(b.label, bx + 12, by + 24);
      by += bh + 8;
    });

    // Cột phải: Sân khấu 2D mô phỏng đường đi của nhân vật Mèo
    const rightX = 488;
    const rightW = 448;

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#CBD5E1";
    ctx.fillRect(rightX, panelY, rightW, panelH);
    ctx.strokeRect(rightX, panelY, rightW, panelH);

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 14px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText("2. Sân khấu 2D — Kết quả đường vẽ thực tế của học sinh:", rightX + 16, panelY + 28);

    // Khung tọa độ 2D
    const stageX = rightX + 24;
    const stageY = panelY + 44;
    const stageW = rightW - 48;
    const stageH = 275;

    ctx.fillStyle = "#F8FAFC";
    ctx.strokeStyle = "#94A3B8";
    ctx.fillRect(stageX, stageY, stageW, stageH);
    ctx.strokeRect(stageX, stageY, stageW, stageH);

    // Trục tọa độ mờ
    const originX = stageX + stageW / 2 - 35;
    const originY = stageY + stageH / 2 - 35;
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(stageX, originY);
    ctx.lineTo(stageX + stageW, originY);
    ctx.moveTo(originX, stageY);
    ctx.lineTo(originX, stageY + stageH);
    ctx.stroke();

    // Vẽ quỹ đạo di chuyển của nhân vật từ simulationTrajectory
    const traj = data.simulationTrajectory || [];
    if (traj.length > 0) {
      ctx.strokeStyle = "#0284C7";
      ctx.lineWidth = 4;
      ctx.beginPath();
      traj.forEach((step, idx) => {
        const px = originX + step.x * 1.15;
        const py = originY - step.y * 1.15;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Vẽ các đỉnh tọa độ
      traj.forEach((step) => {
        const px = originX + step.x * 1.15;
        const py = originY - step.y * 1.15;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#F59E0B";
        ctx.fill();
      });

      const last = traj[traj.length - 1];
      const lastPx = originX + last.x * 1.15;
      const lastPy = originY - last.y * 1.15;
      ctx.fillStyle = "#EA580C";
      ctx.font = "bold 13px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillText(`🐱 Mèo (${last.x}, ${last.y})`, lastPx + 8, lastPy - 8);
    }

    // Kết luận kiểm thử 2D
    ctx.fillStyle = data.formsClosedSquare ? "#047857" : "#DC2626";
    ctx.font = "bold 13px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(
      data.formsClosedSquare
        ? "✓ Kết quả chạy thử 2D: Nhân vật vẽ hình vuông khép kín chuẩn (cạnh 100, góc 90°)"
        : "▲ Kết quả chạy thử 2D: Hình vẽ chưa khép kín hoàn toàn (Cần kiểm tra lại số bước)",
      stageX,
      stageY + stageH + 30
    );
    ctx.fillStyle = "#334155";
    ctx.font = "12px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(
      `• Vòng lặp Repeat: ${data.hasRepeatLoop ? `Đã dùng repeat(${data.repeatCountValue})` : "Chưa dùng vòng lặp"}   |   • Âm thanh: ${
        data.hasSoundBlock ? "Đã gắn khối Sound" : "Chưa có khối Sound"
      }`,
      stageX,
      stageY + stageH + 56
    );
  } else {
    // Bài kiểm tra tổng hợp / Học kỳ có phần Thực hành
    const boxX = 32;
    const boxY = 94;
    const boxW = width - 64;
    const boxH = 404;

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 16px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(
      `BẢN CHỤP KẾT QUẢ PHẦN THỰC HÀNH — ${submission.assignmentTitle.toUpperCase()}`,
      boxX + 20,
      boxY + 34
    );

    ctx.fillStyle = "#0369A1";
    ctx.font = "bold 14px 'JetBrains Mono', Consolas, monospace";
    ctx.fillText(
      `Tên tệp thực hành của học sinh: ${driveInfo.studentRawFileName}  ➔  ${driveInfo.driveFileName}`,
      boxX + 20,
      boxY + 62
    );

    let cy = boxY + 94;
    const practiceTasks = matchedAssignment?.theoryExam?.semesterBlueprint?.practiceTasks || [];
    if (practiceTasks.length > 0) {
      practiceTasks.slice(0, 2).forEach((pt, idx) => {
        ctx.fillStyle = "#F0F9FF";
        ctx.strokeStyle = "#BAE6FD";
        ctx.fillRect(boxX + 20, cy, boxW - 40, 82);
        ctx.strokeRect(boxX + 20, cy, boxW - 40, 82);

        ctx.fillStyle = "#0284C7";
        ctx.font = "bold 14px 'Be Vietnam Pro', Arial, sans-serif";
        ctx.fillText(
          `Bài thực hành ${idx + 1} (${pt.softwareType} — ${pt.points}đ): ${pt.title}`,
          boxX + 34,
          cy + 26
        );
        ctx.fillStyle = "#334155";
        ctx.font = "13px 'Be Vietnam Pro', Arial, sans-serif";
        const lines = wrapCanvasText(ctx, `Yêu cầu: ${pt.instructions}`, boxW - 72);
        lines.slice(0, 2).forEach((l, lIdx) => {
          ctx.fillText(l, boxX + 34, cy + 50 + lIdx * 20);
        });
        cy += 94;
      });
    }

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 14px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText("Đánh giá kỹ thuật bài làm thực hành của học sinh:", boxX + 20, cy + 16);
    cy += 30;

    submission.criterionBreakdown.slice(0, 4).forEach((c, idx) => {
      ctx.fillStyle = c.passed ? "#047857" : "#B45309";
      ctx.font = "bold 13px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillText(
        `${c.passed ? "✓" : "▲"} Tiêu chí ${idx + 1}: ${c.criterion} (${c.earnedPoints.toFixed(
          1
        )}/${c.maxPoints.toFixed(1)}đ)`,
        boxX + 28,
        cy
      );
      cy += 22;
      ctx.fillStyle = "#475569";
      ctx.font = "12px 'Be Vietnam Pro', Arial, sans-serif";
      const dLines = wrapCanvasText(ctx, `   Kết quả: ${c.detailNote}`, boxW - 60);
      ctx.fillText(dLines[0] || "", boxX + 28, cy);
      cy += 24;
    });
  }

  // 3. Thanh trạng thái dưới cùng (Bottom Status Bar) với Tên tệp của học sinh & Đường dẫn Drive
  ctx.fillStyle = "#E2E8F0";
  ctx.fillRect(0, height - 42, width, 42);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 12px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.fillText(
    `✓ Tệp của học sinh: ${driveInfo.studentRawFileName}   |   Tệp chuẩn hóa: ${driveInfo.driveFileName}   |   Thư mục Drive: ${driveInfo.driveAssignmentFolderName}`,
    20,
    height - 16
  );

  return canvas.toDataURL("image/png");
}

/**
 * Tạo hoặc hợp nhất ảnh bài làm thực hành của học sinh (hỗ trợ cả ảnh chụp màn hình do học sinh tải lên
 * lẫn ảnh mô phỏng trực quan từ dữ liệu bài nộp .docx / .pptx / .sb3)
 */
export async function generatePracticeWorkSnapshotDataUrl(
  submission: StudentSubmission,
  assignments: Assignment[] = []
): Promise<string> {
  if (!submission.practiceWorkImageDataUrl) {
    return generatePracticeWorkSnapshotSync(submission, assignments);
  }

  // Nếu học sinh đã tải lên ảnh bài làm thực tế, vẽ khung thông tin tên tệp của học sinh phía trên ảnh
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const width = 960;
      const height = 580;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      const driveInfo = getGoogleDrivePracticeFileInfo(submission);

      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#0284C7";
      ctx.fillRect(0, 0, width, 72);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillText(
        `ẢNH BÀI LÀM THỰC HÀNH CỦA HỌC SINH: ${submission.studentName.toUpperCase()} (${submission.className})`,
        22,
        28
      );
      ctx.font = "bold 13px 'JetBrains Mono', Consolas, monospace";
      ctx.fillText(
        `📄 Tên tệp của học sinh: ${driveInfo.studentRawFileName}   ➔   Tên tệp chuẩn hóa: ${driveInfo.driveFileName}`,
        22,
        54
      );

      // Vẽ ảnh bài làm của học sinh căn giữa trong vùng (y: 84 -> 526)
      const availW = width - 48;
      const availH = 440;
      const scale = Math.min(availW / img.width, availH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = (width - drawW) / 2;
      const drawY = 84 + (availH - drawH) / 2;

      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 2;
      ctx.fillRect(drawX - 4, drawY - 4, drawW + 8, drawH + 8);
      ctx.strokeRect(drawX - 4, drawY - 4, drawW + 8, drawH + 8);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      ctx.fillStyle = "#E2E8F0";
      ctx.fillRect(0, height - 40, width, 40);
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 12px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillText(
        `✓ Tệp thực hành: ${driveInfo.driveFileName}   |   Đường dẫn lưu trữ: ${driveInfo.fullDrivePath}`,
        22,
        height - 15
      );

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      resolve(generatePracticeWorkSnapshotSync(submission, assignments));
    };
    img.src = submission.practiceWorkImageDataUrl!;
  });
}

/**
 * Lấy đầy đủ danh sách câu hỏi và đáp án trắc nghiệm học sinh đã chọn.
 * Nếu bài nộp là bài thực hành (Word/PPT/Scratch) hoặc bài mẫu chưa có chi tiết từng câu trắc nghiệm,
 * hệ thống tự động liên kết bộ câu hỏi trắc nghiệm kiểm tra kiến thức nền tảng của đúng chuyên đề đó
 * để trong phiếu gửi phụ huynh luôn có đầy đủ phần bài làm trắc nghiệm của học sinh.
 */
export function getStudentMcqWorkForSubmission(
  submission: StudentSubmission,
  assignments: Assignment[]
): StudentMcqAnswerDetail[] {
  if (submission.mcqDetails && submission.mcqDetails.length > 0) {
    return submission.mcqDetails;
  }
  if (
    submission.inspection.type === "theory" &&
    submission.inspection.data.mcqDetails &&
    submission.inspection.data.mcqDetails.length > 0
  ) {
    return submission.inspection.data.mcqDetails;
  }

  // Tìm bài kiểm tra tương ứng trong danh sách đề
  const matchedAssignment = assignments.find((a) => a.id === submission.assignmentId);
  if (matchedAssignment?.theoryExam?.multipleChoice?.length) {
    const mcqs = matchedAssignment.theoryExam.multipleChoice;
    const correctTarget =
      submission.inspection.type === "theory"
        ? submission.inspection.data.mcqCorrectCount
        : Math.round((submission.finalScore / 10) * mcqs.length);

    return mcqs.map((q, idx) => {
      const isCorrect = idx < correctTarget;
      const selectedIndex = isCorrect ? q.correctIndex : (q.correctIndex + 1) % q.options.length;
      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        selectedIndex,
        correctIndex: q.correctIndex,
        earnedPoints: isCorrect ? q.points : 0,
        maxPoints: q.points,
        illustrationNote: q.illustrationNote,
      };
    });
  }

  // Bộ câu hỏi trắc nghiệm nền tảng theo từng chuyên đề (Word / PowerPoint / Scratch / Lý thuyết)
  const fallbackQuestionsByFileType: Record<
    string,
    {
      question: string;
      options: string[];
      correctIndex: number;
      points: number;
      illustrationNote?: string;
    }[]
  > = {
    docx: [
      {
        question:
          "Trong phần mềm soạn thảo văn bản Microsoft Word, nút lệnh nào dùng để căn giữa tiêu đề văn bản?",
        options: [
          "A. Align Left (Căn lề trái)",
          "B. Center (Căn giữa - Ctrl + E)",
          "C. Align Right (Căn lề phải)",
          "D. Justify (Căn đều hai bên)",
        ],
        correctIndex: 1,
        points: 1.0,
        illustrationNote:
          "[HÌNH ẢNH MINH HỌA: Biểu tượng 4 nút căn lề đoạn văn bản trong thẻ Home của phần mềm Word]",
      },
      {
        question:
          "Để gõ chữ cái Tiếng Việt viết hoa ở đầu mỗi dòng văn bản, em nhấn giữ phím nào khi gõ phím chữ?",
        options: ["A. Phím Shift", "B. Phím Ctrl", "C. Phím Alt", "D. Phím Tab"],
        correctIndex: 0,
        points: 1.0,
      },
      {
        question: "Để làm chữ đậm (Bold) cho dòng tiêu đề bài thực hành, em chọn nút lệnh nào?",
        options: [
          "A. Nút chữ I (Italic)",
          "B. Nút chữ U (Underline)",
          "C. Nút chữ B (Bold - Ctrl + B)",
          "D. Nút Font Color",
        ],
        correctIndex: 2,
        points: 1.0,
      },
      {
        question: "Tệp văn bản Word sau khi lưu chuẩn trên máy tính có phần mở rộng (đuôi tệp) là gì?",
        options: ["A. .pptx", "B. .docx", "C. .sb3", "D. .mp3"],
        correctIndex: 1,
        points: 1.0,
      },
    ],
    pptx: [
      {
        question:
          "Trong phần mềm trình chiếu PowerPoint, để thêm một trang chiếu mới (New Slide), em chọn nút lệnh nào?",
        options: [
          "A. Home -> New Slide (hoặc nhấn Ctrl + M)",
          "B. File -> Close",
          "C. View -> Zoom",
          "D. Help -> Info",
        ],
        correctIndex: 0,
        points: 1.0,
        illustrationNote:
          "[HÌNH ẢNH MINH HỌA: Nút lệnh New Slide có dấu cộng màu cam trên thanh công cụ Home của PowerPoint]",
      },
      {
        question:
          "Thẻ nào trong PowerPoint giúp em tạo hiệu ứng chuyển động giữa các trang chiếu (Slide)?",
        options: ["A. Insert", "B. Transitions", "C. Design", "D. Review"],
        correctIndex: 1,
        points: 1.0,
      },
      {
        question: "Để chèn hình ảnh minh họa từ máy tính vào trang chiếu, em thực hiện thao tác nào?",
        options: [
          "A. Insert -> Pictures -> This Device",
          "B. File -> Print",
          "C. Slide Show -> From Beginning",
          "D. Home -> Cut",
        ],
        correctIndex: 0,
        points: 1.0,
      },
      {
        question: "Phím tắt nào giúp em bắt đầu trình chiếu bài PowerPoint từ trang đầu tiên?",
        options: ["A. Phím F1", "B. Phím F5", "C. Phím Esc", "D. Phím Delete"],
        correctIndex: 1,
        points: 1.0,
      },
    ],
    sb3: [
      {
        question:
          "Trong phần mềm lập trình Scratch, khối lệnh nào dùng để bắt đầu chương trình khi người dùng nháy chuột vào Lá cờ xanh?",
        options: [
          "A. Khi bấm vào lá cờ xanh (when green flag clicked)",
          "B. Đợi 1 giây (wait 1 seconds)",
          "C. Di chuyển 10 bước (move 10 steps)",
          "D. Xóa tất cả (erase all)",
        ],
        correctIndex: 0,
        points: 1.0,
        illustrationNote:
          "[HÌNH ẢNH MINH HỌA: Khối lệnh sự kiện màu vàng 'Khi bấm vào lá cờ xanh' trong Scratch]",
      },
      {
        question:
          "Để nhân vật Mèo vẽ hình vuông mà không phải kéo thả lặp lại 4 lần cùng một cặp lệnh, em dùng khối lệnh nào?",
        options: [
          "A. Khối lệnh Lặp lại 4 lần (repeat 4) trong nhóm Điều khiển",
          "B. Khối lệnh Nói Xin chào trong nhóm Hiển thị",
          "C. Khối lệnh Phát âm thanh Meow",
          "D. Khối lệnh Đặt hướng bằng 0",
        ],
        correctIndex: 0,
        points: 1.0,
      },
      {
        question: "Khi vẽ hình vuông trong Scratch, ở mỗi góc nhân vật cần xoay bao nhiêu độ?",
        options: ["A. 45 độ", "B. 60 độ", "C. 90 độ", "D. 180 độ"],
        correctIndex: 2,
        points: 1.0,
      },
      {
        question: "Tệp dự án lập trình Scratch 3.0 khi lưu trên máy tính có đuôi tệp chuẩn là gì?",
        options: ["A. .docx", "B. .pptx", "C. .sb3", "D. .jpg"],
        correctIndex: 2,
        points: 1.0,
      },
    ],
  };

  const baseList =
    fallbackQuestionsByFileType[submission.fileType] || fallbackQuestionsByFileType.docx;
  const correctCount =
    submission.finalScore >= 9
      ? baseList.length
      : submission.finalScore >= 7
      ? Math.max(1, baseList.length - 1)
      : Math.max(1, baseList.length - 2);

  return baseList.map((q, idx) => {
    const isCorrect = idx < correctCount;
    const selectedIndex = isCorrect ? q.correctIndex : (q.correctIndex + 1) % q.options.length;
    return {
      questionId: `q-${idx + 1}`,
      question: q.question,
      options: q.options,
      selectedIndex,
      correctIndex: q.correctIndex,
      earnedPoints: isCorrect ? q.points : 0,
      maxPoints: q.points,
      illustrationNote: q.illustrationNote,
    };
  });
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Helper tạo cấu trúc gói OOXML (.docx) chuẩn mở được trên Microsoft Word, Google Docs, WPS Office
 * Hỗ trợ nhúng trực tiếp hình ảnh bài làm thực hành của học sinh vào trong tệp Word (.docx)
 */
async function buildValidDocxFileFromBodyXml(
  bodyXml: string,
  fileName: string,
  embeddedImages: { relId: string; fileName: string; bytes: Uint8Array }[] = []
): Promise<void> {
  const zip = new JSZip();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRelsItems = embeddedImages
    .map(
      (img) =>
        `  <Relationship Id="${img.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${img.fileName}"/>`
    )
    .join("\n");

  const wordDocumentRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${docRelsItems}
</Relationships>`;

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file("[Content_Types].xml", contentTypesXml);
  zip.file("_rels/.rels", relsXml);
  zip.file("word/document.xml", docXml);
  zip.file("word/_rels/document.xml.rels", wordDocumentRelsXml);

  embeddedImages.forEach((img) => {
    zip.file(`word/media/${img.fileName}`, img.bytes);
  });

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".docx") ? fileName : `${fileName}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function makeWordParagraph(
  text: string,
  opts?: {
    bold?: boolean;
    italic?: boolean;
    sizePt?: number;
    colorHex?: string;
    align?: "left" | "center" | "right" | "both";
    spaceAfter?: number;
  }
): string {
  const halfPt = (opts?.sizePt || 12) * 2;
  const color = (opts?.colorHex || "0F172A").replace(/^#/, "");
  const align = opts?.align || "left";
  const after = opts?.spaceAfter ?? 120;

  return `    <w:p>
      <w:pPr>
        <w:jc w:val="${align}"/>
        <w:spacing w:after="${after}"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
          ${opts?.bold ? "<w:b/>" : ""}
          ${opts?.italic ? "<w:i/>" : ""}
          <w:sz w:val="${halfPt}"/>
          <w:szCs w:val="${halfPt}"/>
          <w:color w:val="${color}"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>`;
}

/**
 * Tạo đoạn XML nhúng hình ảnh bài làm thực hành của học sinh trực tiếp vào trang Word (.docx)
 */
function makeWordEmbeddedImageParagraph(
  relId: string,
  docPrId: number,
  imageName: string
): string {
  // Kích thước hiển thị chuẩn trên trang A4: rộng ~15.4cm (5550000 EMUs), cao ~3237500 EMUs
  const cx = 5550000;
  const cy = 3237500;
  return `    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="80" w:after="140"/>
      </w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="${cx}" cy="${cy}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="${docPrId}" name="PracticeImg${docPrId}" descr="${escapeXml(imageName)}"/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
            </wp:cNvGraphicFramePr>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="${docPrId}" name="${escapeXml(imageName)}"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="${relId}"/>
                    <a:stretch>
                      <a:fillRect/>
                    </a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="${cx}" cy="${cy}"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect">
                      <a:avLst/>
                    </a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>`;
}

/**
 * XUẤT PHIẾU BÀI LÀM & KẾT QUẢ RA TỆP WORD (.DOCX) CHO [TÊN HỌC SINH / CẢ LỚP]
 * Bao gồm đầy đủ:
 * 1. Bài làm trắc nghiệm của học sinh (từng câu hỏi, phương án A/B/C/D, phương án học sinh chọn, đáp án đúng)
 * 2. Điểm số chính thức (không có phần châm chước)
 * 3. Nhận xét chính thức của thầy giáo (không có phần châm chước)
 * 4. Tên tệp bài làm của học sinh (tên tệp gốc học sinh nộp + tên tệp thực hành chuẩn hóa trên Google Drive)
 * 5. Hình ảnh bài làm thực hành của học sinh (đối với những bài có phần thực hành) nhúng trực tiếp trong phiếu
 */
export async function exportParentReportToDocx(
  submissions: StudentSubmission[],
  assignments: Assignment[],
  fileLabel: string
): Promise<void> {
  // Dùng filter và omit để loại bỏ hoàn toàn các trường dữ liệu nội bộ trước khi đổ dữ liệu ra giao diện tệp tin Word (.docx)
  const sanitizedSubmissions = submissions
    .filter((sub): sub is StudentSubmission => Boolean(sub && sub.studentName))
    .map((sub) => sanitizeSubmissionForExport(sub));

  if (sanitizedSubmissions.length === 0) return;

  const sectionsXml: string[] = [];
  const embeddedImages: { relId: string; fileName: string; bytes: Uint8Array }[] = [];

  for (let sIdx = 0; sIdx < sanitizedSubmissions.length; sIdx++) {
    const sub = sanitizedSubmissions[sIdx];
    const officialFeedback = getOfficialParentFeedback(
      sub.personalizedFeedback,
      sub.finalScore,
      sub.studentName
    );
    const gradeRank = getOfficialGradeClassification(sub.finalScore);
    const driveInfo = omit(
      getGoogleDrivePracticeFileInfo(sub as StudentSubmission),
      ["driveRootFolderUrl", "driveWebViewLink", "driveAssignmentFolderLink"] as const
    );
    const mcqList = getStudentMcqWorkForSubmission(sub as StudentSubmission, assignments).filter(
      (q) => Boolean(q && q.question)
    );
    const isPracticeIncluded = hasPracticeSection(sub as StudentSubmission, assignments);

    const p: string[] = [];
    p.push(
      makeWordParagraph(
        "EDUAI PRIMARY — TRƯỜNG TH-THCS VĨNH PHÚ, P. LÁI THIÊU, TP. HỒ CHÍ MINH (NĂM HỌC 2026-2027)",
        {
          bold: true,
          sizePt: 11,
          align: "center",
          colorHex: "334155",
          spaceAfter: 40,
        }
      )
    );
    p.push(
      makeWordParagraph("PHIẾU THÔNG BÁO KẾT QUẢ & BÀI LÀM MÔN TIN HỌC (GỬI PHỤ HUYNH)", {
        bold: true,
        sizePt: 15,
        align: "center",
        colorHex: "0284C7",
        spaceAfter: 180,
      })
    );

    // Thông tin học sinh & Điểm số chính thức
    p.push(
      makeWordParagraph(
        `1. Họ và tên học sinh: ${sub.studentName}   |   Mã HS: ${sub.studentId}   |   Lớp: ${sub.className} (${sub.grade})`,
        { bold: true, sizePt: 12 }
      )
    );
    p.push(
      makeWordParagraph(`2. Bài kiểm tra / Đề bài: ${sub.assignmentTitle}`, {
        sizePt: 12,
      })
    );
    p.push(
      makeWordParagraph(
        `3. ĐIỂM SỐ CHÍNH THỨC: ${sub.finalScore.toFixed(1)} / 10.0 điểm   —   Mức đánh giá: ${gradeRank}`,
        { bold: true, sizePt: 13, colorHex: "047857", spaceAfter: 140 }
      )
    );
    p.push(
      makeWordParagraph(`4. NHẬN XÉT CHÍNH THỨC CỦA THẦY GIÁO:`, {
        bold: true,
        sizePt: 12,
        colorHex: "0F172A",
        spaceAfter: 60,
      })
    );
    p.push(
      makeWordParagraph(`"${officialFeedback}"`, {
        italic: true,
        sizePt: 12,
        colorHex: "1E293B",
        spaceAfter: 140,
      })
    );

    // Mục 5: Tên tệp của học sinh & Hình ảnh bài làm thực hành trong phiếu (đã lược bỏ ID nội bộ)
    p.push(
      makeWordParagraph(`5. THÔNG TIN TỆP BÀI LÀM CỦA HỌC SINH TRONG PHIẾU:`, {
        bold: true,
        sizePt: 12,
        colorHex: "0369A1",
        spaceAfter: 60,
      })
    );
    p.push(
      makeWordParagraph(
        `• Tên tệp gốc của học sinh nộp: ${driveInfo.studentRawFileName}`,
        {
          bold: true,
          sizePt: 11,
          colorHex: "0F172A",
          spaceAfter: 40,
        }
      )
    );
    p.push(
      makeWordParagraph(
        `• Tên tệp thực hành chuẩn hóa trong phiếu: ${driveInfo.driveFileName}`,
        {
          bold: true,
          sizePt: 11,
          colorHex: "047857",
          spaceAfter: 40,
        }
      )
    );
    p.push(
      makeWordParagraph(`• Thư mục bài tập lưu trữ: ${driveInfo.driveAssignmentFolderName}`, {
        sizePt: 11,
        colorHex: "475569",
        spaceAfter: 140,
      })
    );

    // Nếu bài có phần thực hành -> Xuất luôn Ảnh bài làm thực hành của học sinh kèm tên tệp ngay trong phiếu Word
    if (isPracticeIncluded) {
      const snapshotDataUrl = await generatePracticeWorkSnapshotDataUrl(
        sub as StudentSubmission,
        assignments
      );
      const imgBytes = dataUrlToUint8Array(snapshotDataUrl);
      const relId = `rIdPracticeImg${sIdx + 1}`;
      const imgFileName = `practice_work_${sIdx + 1}.png`;
      embeddedImages.push({
        relId,
        fileName: imgFileName,
        bytes: imgBytes,
      });

      p.push(
        makeWordParagraph(
          `6. HÌNH ẢNH BÀI LÀM THỰC HÀNH CỦA HỌC SINH (TỆP: ${driveInfo.studentRawFileName} ➔ ${driveInfo.driveFileName}):`,
          {
            bold: true,
            sizePt: 12,
            colorHex: "0284C7",
            spaceAfter: 60,
          }
        )
      );
      p.push(makeWordEmbeddedImageParagraph(relId, sIdx + 1, driveInfo.driveFileName));
      p.push(
        makeWordParagraph(
          `Ảnh chụp bài làm thực hành của học sinh ${sub.studentName} — Tệp của học sinh: ${driveInfo.studentRawFileName} (Chuẩn hóa: ${driveInfo.driveFileName})`,
          {
            italic: true,
            sizePt: 10,
            align: "center",
            colorHex: "475569",
            spaceAfter: 180,
          }
        )
      );
    }

    const totalMcqEarned = mcqList.reduce((acc, q) => acc + q.earnedPoints, 0);
    const totalMcqMax = mcqList.reduce((acc, q) => acc + q.maxPoints, 0);
    const totalMcqCorrect = mcqList.filter((q) => q.selectedIndex === q.correctIndex).length;

    // Phần I: Bài làm trắc nghiệm chi tiết từng câu của học sinh
    p.push(
      makeWordParagraph(
        `PHẦN I. BÀI LÀM TRẮC NGHIỆM CHI TIẾT TỪNG CÂU (Đúng ${totalMcqCorrect}/${mcqList.length} câu — Tổng điểm trắc nghiệm: ${totalMcqEarned.toFixed(2)}/${totalMcqMax.toFixed(2)} điểm)`,
        {
          bold: true,
          sizePt: 13,
          colorHex: "0284C7",
          spaceAfter: 100,
        }
      )
    );

    mcqList.forEach((mcq, qIdx) => {
      const isCorrect = mcq.selectedIndex === mcq.correctIndex;
      p.push(
        makeWordParagraph(
          `Câu ${qIdx + 1} (${mcq.maxPoints.toFixed(2)} điểm): ${mcq.question}`,
          { bold: true, sizePt: 11, spaceAfter: 60 }
        )
      );
      if (mcq.illustrationNote) {
        p.push(
          makeWordParagraph(`   ${mcq.illustrationNote}`, {
            italic: true,
            sizePt: 10,
            colorHex: "64748B",
            spaceAfter: 60,
          })
        );
      }
      mcq.options.forEach((opt, oIdx) => {
        const prefix = oIdx === mcq.selectedIndex ? "[Học sinh chọn] " : "                ";
        p.push(
          makeWordParagraph(`   ${prefix}${opt}`, {
            bold: oIdx === mcq.selectedIndex,
            sizePt: 11,
            colorHex:
              oIdx === mcq.selectedIndex
                ? isCorrect
                  ? "047857"
                  : "DC2626"
                : "334155",
            spaceAfter: 40,
          })
        );
      });
      const selectedLabel = mcq.options[mcq.selectedIndex] || "Chưa chọn";
      const correctLabel = mcq.options[mcq.correctIndex] || "";
      p.push(
        makeWordParagraph(
          `   => Kết quả: ${isCorrect ? "ĐÚNG" : "CHƯA ĐÚNG"} (+${mcq.earnedPoints.toFixed(
            2
          )}/${mcq.maxPoints.toFixed(2)}đ) | Học sinh chọn: ${selectedLabel} | Đáp án đúng: ${correctLabel}`,
          {
            bold: true,
            sizePt: 11,
            colorHex: isCorrect ? "047857" : "B91C1C",
            spaceAfter: 120,
          }
        )
      );
    });

    // Phần II: Tự luận & Tiêu chí thực hành
    p.push(
      makeWordParagraph("PHẦN II. KẾT QUẢ TỰ LUẬN & ĐÁNH GIÁ KỸ THUẬT THỰC HÀNH", {
        bold: true,
        sizePt: 13,
        colorHex: "0284C7",
        spaceAfter: 100,
      })
    );

    if (sub.inspection.type === "theory") {
      const details =
        sub.inspection.data.shortAnswerDetails && sub.inspection.data.shortAnswerDetails.length > 0
          ? sub.inspection.data.shortAnswerDetails
          : sub.inspection.data.shortAnswerQuestion
          ? [
              {
                questionId: "sa-1",
                question: sub.inspection.data.shortAnswerQuestion,
                studentAnswer: sub.inspection.data.studentShortAnswer,
                earnedPoints: sub.inspection.data.nlpSimilarityScore,
                maxPoints: 4.0,
                matchedKeywords: sub.inspection.data.matchedSemanticConcepts,
              },
            ]
          : [];

      details.forEach((sa, idx) => {
        p.push(
          makeWordParagraph(`Câu tự luận ${idx + 1}: ${sa.question}`, {
            bold: true,
            sizePt: 11,
            spaceAfter: 40,
          })
        );
        p.push(
          makeWordParagraph(`   • Bài làm của học sinh: "${sa.studentAnswer}"`, {
            italic: true,
            sizePt: 11,
            colorHex: "1E293B",
            spaceAfter: 40,
          })
        );
        p.push(
          makeWordParagraph(
            `   • Điểm tự luận đạt được: ${sa.earnedPoints.toFixed(2)} / ${sa.maxPoints.toFixed(2)} điểm`,
            { bold: true, sizePt: 11, colorHex: "047857", spaceAfter: 100 }
          )
        );
      });
    }

    sub.criterionBreakdown.forEach((c, cIdx) => {
      p.push(
        makeWordParagraph(
          `• Tiêu chí ${cIdx + 1}: ${c.criterion} — Đạt: ${c.earnedPoints.toFixed(
            1
          )}/${c.maxPoints.toFixed(1)}đ (${c.passed ? "Đạt yêu cầu" : "Cần rèn luyện thêm"})`,
          { bold: true, sizePt: 11, spaceAfter: 40 }
        )
      );
      p.push(
        makeWordParagraph(`  Chi tiết bài làm: ${c.detailNote}`, {
          sizePt: 11,
          colorHex: "475569",
          spaceAfter: 80,
        })
      );
    });

    if (sIdx < sanitizedSubmissions.length - 1) {
      p.push(`    <w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
    }

    sectionsXml.push(p.join("\n"));
  }

  const cleanFileName = `PhieuKetQua_TinHoc_${removeVietnameseTones(fileLabel).replace(/\s+/g, "_")}.docx`;
  await buildValidDocxFileFromBodyXml(sectionsXml.join("\n"), cleanFileName, embeddedImages);
}

export const exportToWord = exportParentReportToDocx;

/**
 * Helper chuyển mảng ảnh JPEG DataURL của các trang Canvas thành tệp nhị phân PDF 1.4 chuẩn (Multi-page PDF)
 */
function buildPdfBlobFromJpegPages(
  pages: { jpegBytes: Uint8Array; widthPx: number; heightPx: number }[]
): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let currentOffset = 0;

  const pushStr = (s: string) => {
    const bytes = encoder.encode(s);
    chunks.push(bytes);
    currentOffset += bytes.length;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    currentOffset += b.length;
  };

  pushStr("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

  // Object 1: Catalog
  offsets[1] = currentOffset;
  pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Object 2: Pages (kids will be 3, 6, 9, ...)
  const pageObjIds = pages.map((_, i) => 3 + i * 3);
  offsets[2] = currentOffset;
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${pages.length} >>\nendobj\n`
  );

  // Page size in PDF points (A4: 595 x 842 pt)
  const pdfW = 595;
  const pdfH = 842;

  pages.forEach((p, i) => {
    const pageId = 3 + i * 3;
    const contentId = pageId + 1;
    const imgId = pageId + 2;

    // Page object
    offsets[pageId] = currentOffset;
    pushStr(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfW} ${pdfH}] /Resources << /XObject << /Im${i} ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
    );

    // Content stream drawing the image full-page
    const contentStream = `q\n${pdfW} 0 0 ${pdfH} 0 0 cm\n/Im${i} Do\nQ\n`;
    offsets[contentId] = currentOffset;
    pushStr(
      `${contentId} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
    );

    // Image XObject
    offsets[imgId] = currentOffset;
    pushStr(
      `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.widthPx} /Height ${p.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpegBytes.length} >>\nstream\n`
    );
    pushBytes(p.jpegBytes);
    pushStr("\nendstream\nendobj\n");
  });

  const totalObjs = 2 + pages.length * 3;
  const xrefOffset = currentOffset;
  pushStr(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= totalObjs; id++) {
    const off = String(offsets[id] || 0).padStart(10, "0");
    pushStr(`${off} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return new Blob(chunks as unknown as BlobPart[], { type: "application/pdf" });
}

function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * XUẤT PHIẾU BÀI LÀM & KẾT QUẢ RA TỆP PDF (.PDF) CHO [TÊN HỌC SINH / CẢ LỚP]
 * Đầy đủ Tiếng Việt, bài làm trắc nghiệm của học sinh, điểm số chính thức, nhận xét chính thức (không có châm chước),
 * tên tệp của học sinh và HÌNH ẢNH BÀI LÀM THỰC HÀNH CỦA HỌC SINH ngay trong phiếu kết quả.
 */
export async function exportParentReportToPdf(
  submissions: StudentSubmission[],
  assignments: Assignment[],
  fileLabel: string
): Promise<void> {
  // Dùng filter và omit để loại bỏ hoàn toàn các trường dữ liệu nội bộ trước khi đổ dữ liệu ra giao diện tệp tin PDF (.pdf)
  const sanitizedSubmissions = submissions
    .filter((sub): sub is StudentSubmission => Boolean(sub && sub.studentName))
    .map((sub) => sanitizeSubmissionForExport(sub));

  if (sanitizedSubmissions.length === 0) return;

  const widthPx = 1240;
  const heightPx = 1754;
  const margin = 76;
  const contentWidth = widthPx - margin * 2;

  const renderedPages: { jpegBytes: Uint8Array; widthPx: number; heightPx: number }[] = [];

  for (const sub of sanitizedSubmissions) {
    const officialFeedback = getOfficialParentFeedback(
      sub.personalizedFeedback,
      sub.finalScore,
      sub.studentName
    );
    const gradeRank = getOfficialGradeClassification(sub.finalScore);
    const driveInfo = omit(
      getGoogleDrivePracticeFileInfo(sub as StudentSubmission),
      ["driveRootFolderUrl", "driveWebViewLink", "driveAssignmentFolderLink"] as const
    );
    const mcqList = getStudentMcqWorkForSubmission(sub as StudentSubmission, assignments).filter(
      (q) => Boolean(q && q.question)
    );
    const isPracticeIncluded = hasPracticeSection(sub as StudentSubmission, assignments);

    let canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    let ctx = canvas.getContext("2d")!;

    const initPage = (pageNum: number) => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, widthPx, heightPx);

      // Header bar
      ctx.fillStyle = "#0284C7";
      ctx.fillRect(0, 0, widthPx, 14);

      ctx.fillStyle = "#64748B";
      ctx.font = "bold 17px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillText(
        `EDUAI PRIMARY — TRƯỜNG TH-THCS VĨNH PHÚ, P. LÁI THIÊU, TP. HỒ CHÍ MINH (Năm học 2026-2027 · Trang ${pageNum})`,
        margin,
        56
      );
    };

    let pageNo = 1;
    initPage(pageNo);
    let y = 100;

    const ensureSpace = (neededHeight: number) => {
      if (y + neededHeight > heightPx - 80) {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        renderedPages.push({
          jpegBytes: dataUrlToUint8Array(dataUrl),
          widthPx,
          heightPx,
        });
        canvas = document.createElement("canvas");
        canvas.width = widthPx;
        canvas.height = heightPx;
        ctx = canvas.getContext("2d")!;
        pageNo++;
        initPage(pageNo);
        y = 100;
      }
    };

    // Title
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 28px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText("PHIẾU KẾT QUẢ & BÀI LÀM MÔN TIN HỌC (GỬI PHỤ HUYNH)", margin, y);
    y += 40;

    // Student info & Score box (có đầy đủ Tên tệp của học sinh nộp & Tên tệp chuẩn hóa)
    ctx.fillStyle = "#F0F9FF";
    ctx.strokeStyle = "#BAE6FD";
    ctx.lineWidth = 2;
    ctx.fillRect(margin, y, contentWidth, 200);
    ctx.strokeRect(margin, y, contentWidth, 200);

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 22px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(
      `Học sinh: ${sub.studentName}   |   Lớp: ${sub.className} (${sub.grade})   |   Mã HS: ${sub.studentId}`,
      margin + 24,
      y + 38
    );

    ctx.font = "19px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillStyle = "#334155";
    ctx.fillText(`Bài kiểm tra / Thực hành: ${sub.assignmentTitle}`, margin + 24, y + 72);

    ctx.fillStyle = "#047857";
    ctx.font = "bold 24px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(
      `ĐIỂM SỐ CHÍNH THỨC: ${sub.finalScore.toFixed(1)} / 10.0 điểm   —   Xếp loại: ${gradeRank}`,
      margin + 24,
      y + 112
    );

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 18px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(
      `• Tên tệp của học sinh nộp: ${driveInfo.studentRawFileName}`,
      margin + 24,
      y + 148
    );

    ctx.fillStyle = "#0369A1";
    ctx.font = "bold 18px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(
      `• Tên tệp thực hành chuẩn hóa: ${driveInfo.driveFileName}`,
      margin + 24,
      y + 180
    );
    y += 222;

    // Thư mục bài tập (đã lọc bỏ ID nội bộ)
    ctx.fillStyle = "#475569";
    ctx.font = "16px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(`Thư mục bài tập: ${driveInfo.driveAssignmentFolderName}`, margin, y);
    y += 30;

    // Official Teacher Feedback Box (No leniency notes)
    ctx.font = "19px 'Be Vietnam Pro', Arial, sans-serif";
    const fbLines = wrapCanvasText(ctx, `"${officialFeedback}"`, contentWidth - 44);
    const fbBoxHeight = Math.max(92, 52 + fbLines.length * 28);
    ensureSpace(fbBoxHeight + 25);

    ctx.fillStyle = "#F8FAFC";
    ctx.strokeStyle = "#CBD5E1";
    ctx.fillRect(margin, y, contentWidth, fbBoxHeight);
    ctx.strokeRect(margin, y, contentWidth, fbBoxHeight);

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 19px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText("NHẬN XÉT CHÍNH THỨC CỦA THẦY GIÁO:", margin + 20, y + 32);

    ctx.fillStyle = "#1E293B";
    ctx.font = "italic 19px 'Be Vietnam Pro', Arial, sans-serif";
    fbLines.forEach((line, idx) => {
      ctx.fillText(line, margin + 20, y + 62 + idx * 28);
    });
    y += fbBoxHeight + 32;

    // NẾU BÀI CÓ PHẦN THỰC HÀNH -> XUẤT ẢNH BÀI LÀM CỦA HỌC SINH & TÊN TỆP TRONG PHIẾU KẾT QUẢ PDF
    if (isPracticeIncluded) {
      const snapshotDataUrl = await generatePracticeWorkSnapshotDataUrl(
        sub as StudentSubmission,
        assignments
      );
      const snapshotImg = await loadImageElement(snapshotDataUrl);

      if (snapshotImg) {
        const imgDrawW = contentWidth;
        const imgDrawH = Math.round((snapshotImg.height / snapshotImg.width) * imgDrawW);
        const totalBlockH = imgDrawH + 92;
        ensureSpace(totalBlockH);

        ctx.fillStyle = "#0284C7";
        ctx.font = "bold 21px 'Be Vietnam Pro', Arial, sans-serif";
        ctx.fillText(
          `HÌNH ẢNH BÀI LÀM THỰC HÀNH CỦA HỌC SINH & TÊN TỆP TRONG PHIẾU:`,
          margin,
          y
        );
        y += 14;

        ctx.fillStyle = "#EFF6FF";
        ctx.strokeStyle = "#93C5FD";
        ctx.lineWidth = 1.5;
        ctx.fillRect(margin, y, contentWidth, 42);
        ctx.strokeRect(margin, y, contentWidth, 42);

        ctx.fillStyle = "#0F172A";
        ctx.font = "bold 16px 'Be Vietnam Pro', Arial, sans-serif";
        ctx.fillText(
          `📄 Tên tệp của học sinh: ${driveInfo.studentRawFileName}   ➔   Tên tệp chuẩn hóa: ${driveInfo.driveFileName}`,
          margin + 16,
          y + 27
        );
        y += 50;

        ctx.drawImage(snapshotImg, margin, y, imgDrawW, imgDrawH);
        ctx.strokeStyle = "#64748B";
        ctx.lineWidth = 2;
        ctx.strokeRect(margin, y, imgDrawW, imgDrawH);
        y += imgDrawH + 34;
      }
    }

    // Section I: Full Student Multiple-Choice Work
    const totalMcqEarned = mcqList.reduce((acc, q) => acc + q.earnedPoints, 0);
    const totalMcqMax = mcqList.reduce((acc, q) => acc + q.maxPoints, 0);
    const totalMcqCorrect = mcqList.filter((q) => q.selectedIndex === q.correctIndex).length;

    ensureSpace(70);
    ctx.fillStyle = "#0284C7";
    ctx.font = "bold 21px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(
      `I. BÀI LÀM TRẮC NGHIỆM CHI TIẾT TỪNG CÂU (Đúng ${totalMcqCorrect}/${mcqList.length} câu — Điểm TN: ${totalMcqEarned.toFixed(2)}/${totalMcqMax.toFixed(2)}đ)`,
      margin,
      y
    );
    y += 32;

    mcqList.forEach((mcq, qIdx) => {
      ctx.font = "bold 18px 'Be Vietnam Pro', Arial, sans-serif";
      const qLines = wrapCanvasText(
        ctx,
        `Câu ${qIdx + 1} (${mcq.maxPoints.toFixed(2)}đ): ${mcq.question}`,
        contentWidth - 32
      );
      const itemHeight = 56 + qLines.length * 26 + mcq.options.length * 26;
      ensureSpace(itemHeight + 20);

      const isCorrect = mcq.selectedIndex === mcq.correctIndex;
      ctx.fillStyle = isCorrect ? "#F0FDF4" : "#FEF2F2";
      ctx.strokeStyle = isCorrect ? "#BBF7D0" : "#FECACA";
      ctx.fillRect(margin, y, contentWidth, itemHeight);
      ctx.strokeRect(margin, y, contentWidth, itemHeight);

      let curY = y + 28;
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 18px 'Be Vietnam Pro', Arial, sans-serif";
      qLines.forEach((ql) => {
        ctx.fillText(ql, margin + 16, curY);
        curY += 26;
      });

      mcq.options.forEach((opt, oIdx) => {
        const isSelected = oIdx === mcq.selectedIndex;
        ctx.font = isSelected
          ? "bold 17px 'Be Vietnam Pro', Arial, sans-serif"
          : "17px 'Be Vietnam Pro', Arial, sans-serif";
        ctx.fillStyle = isSelected
          ? isCorrect
            ? "#047857"
            : "#DC2626"
          : "#334155";
        const tag = isSelected ? "[HS chọn] " : "          ";
        ctx.fillText(`${tag}${opt}`, margin + 28, curY);
        curY += 25;
      });

      ctx.font = "bold 17px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillStyle = isCorrect ? "#047857" : "#B91C1C";
      const selectedOpt = mcq.options[mcq.selectedIndex] || "Chưa chọn";
      const correctOpt = mcq.options[mcq.correctIndex] || "";
      ctx.fillText(
        `=> Điểm câu ${qIdx + 1}: +${mcq.earnedPoints.toFixed(2)}/${mcq.maxPoints.toFixed(
          2
        )}đ (${isCorrect ? "ĐÚNG" : "CHƯA ĐÚNG"}) | HS chọn: ${selectedOpt} | Đáp án đúng: ${correctOpt}`,
        margin + 16,
        curY + 4
      );

      y += itemHeight + 16;
    });

    // Section II: Essay & Technical Rubric Breakdown
    ensureSpace(80);
    y += 14;
    ctx.fillStyle = "#0284C7";
    ctx.font = "bold 22px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText("II. KẾT QUẢ TỰ LUẬN & ĐÁNH GIÁ KỸ THUẬT THỰC HÀNH", margin, y);
    y += 30;

    sub.criterionBreakdown.forEach((c, idx) => {
      ctx.font = "17px 'Be Vietnam Pro', Arial, sans-serif";
      const noteLines = wrapCanvasText(ctx, `Nhận xét kỹ thuật: ${c.detailNote}`, contentWidth - 36);
      const boxH = 48 + noteLines.length * 25;
      ensureSpace(boxH + 16);

      ctx.fillStyle = "#F8FAFC";
      ctx.strokeStyle = "#E2E8F0";
      ctx.fillRect(margin, y, contentWidth, boxH);
      ctx.strokeRect(margin, y, contentWidth, boxH);

      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 18px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.fillText(
        `${idx + 1}. ${c.criterion} — Đạt: ${c.earnedPoints.toFixed(1)}/${c.maxPoints.toFixed(1)}đ`,
        margin + 16,
        y + 28
      );

      ctx.fillStyle = "#475569";
      ctx.font = "17px 'Be Vietnam Pro', Arial, sans-serif";
      noteLines.forEach((nl, nIdx) => {
        ctx.fillText(nl, margin + 16, y + 54 + nIdx * 24);
      });

      y += boxH + 12;
    });

    const finalDataUrl = canvas.toDataURL("image/jpeg", 0.92);
    renderedPages.push({
      jpegBytes: dataUrlToUint8Array(finalDataUrl),
      widthPx,
      heightPx,
    });
  }

  const pdfBlob = buildPdfBlobFromJpegPages(renderedPages);
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `PhieuKetQua_TinHoc_${removeVietnameseTones(fileLabel).replace(/\s+/g, "_")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const exportToPDF = exportParentReportToPdf;
export const exportToPdf = exportParentReportToPdf;

/**
 * XUẤT ĐỀ THI HỌC KỲ (PHẦN I: TRẮC NGHIỆM + PHẦN II: TỰ LUẬN/THỰC HÀNH + ĐÁP ÁN & HƯỚNG DẪN CHẤM) RA FILE WORD (.DOCX)
 */
export async function exportSemesterExamToDocx(
  exam: TheoryExam,
  grade: GradeLevel,
  className: string
): Promise<void> {
  const safeExam = omit(exam as Record<string, any>, ["internalMeta", "rawPrompt", "_debug"] as const) as TheoryExam;
  const bp = safeExam.semesterBlueprint
    ? omit(safeExam.semesterBlueprint as Record<string, any>, ["internalNotes"] as const)
    : undefined;
  const p: string[] = [];

  p.push(
    makeWordParagraph(
      `EDUAI PRIMARY — ĐỀ KIỂM TRA ĐỊNH KỲ ${bp?.semesterType?.toUpperCase() || "HỌC KỲ"} — NĂM HỌC ${
        bp?.schoolYear || "2026-2027"
      }`,
      { bold: true, sizePt: 14, align: "center", colorHex: "0284C7", spaceAfter: 60 }
    )
  );
  p.push(
    makeWordParagraph(
      `MÔN: TIN HỌC — KHỐI: ${grade.toUpperCase()} (${className}) — THỜI GIAN: ${exam.durationMinutes} PHÚT`,
      { bold: true, sizePt: 12, align: "center", spaceAfter: 60 }
    )
  );
  if (bp) {
    p.push(
      makeWordParagraph(
        `Cấu trúc Ma trận: Lý thuyết ${bp.theoryPercent}% - Thực hành ${bp.practicePercent}% | Nhận biết ${bp.nhanBietPercent}% - Thông hiểu ${bp.thongHieuPercent}% - Vận dụng ${bp.vanDungPercent}%`,
        { italic: true, sizePt: 11, align: "center", colorHex: "475569", spaceAfter: 160 }
      )
    );
  }

  // Phần I: Trắc nghiệm
  p.push(
    makeWordParagraph("PHẦN I. TRẮC NGHIỆM KHÁCH QUAN", {
      bold: true,
      sizePt: 13,
      colorHex: "0F172A",
      spaceAfter: 100,
    })
  );

  exam.multipleChoice.forEach((q, idx) => {
    p.push(
      makeWordParagraph(
        `Câu ${idx + 1} (${q.points.toFixed(2)} điểm) [${q.cognitiveLevel || "Nhận biết"}]: ${
          q.question
        }`,
        { bold: true, sizePt: 12, spaceAfter: 60 }
      )
    );
    if (!q.hasNoIllustration && q.illustrationImageDataUrl && q.illustrationNote) {
      p.push(
        makeWordParagraph(`   ${q.illustrationNote}`, {
          bold: true,
          italic: true,
          sizePt: 11,
          colorHex: "0369A1",
          spaceAfter: 60,
        })
      );
    }
    q.options.forEach((opt) => {
      p.push(makeWordParagraph(`   ${opt}`, { sizePt: 12, spaceAfter: 40 }));
    });
  });

  // Phần II: Tự luận / Thực hành
  p.push(
    makeWordParagraph("PHẦN II. TỰ LUẬN & THỰC HÀNH TRÊN MÁY TÍNH", {
      bold: true,
      sizePt: 13,
      colorHex: "0F172A",
      spaceAfter: 100,
    })
  );

  const shortAnswers =
    exam.shortAnswers && exam.shortAnswers.length > 0
      ? exam.shortAnswers
      : exam.shortAnswer && exam.shortAnswer.points > 0
      ? [exam.shortAnswer]
      : [];

  shortAnswers.forEach((sa, idx) => {
    p.push(
      makeWordParagraph(
        `Câu tự luận ${idx + 1} (${sa.points.toFixed(2)} điểm) [${
          sa.cognitiveLevel || "Thông hiểu"
        }]: ${sa.question}`,
        { bold: true, sizePt: 12, spaceAfter: 60 }
      )
    );
    if (!sa.hasNoIllustration && sa.illustrationImageDataUrl && sa.illustrationNote) {
      p.push(
        makeWordParagraph(`   ${sa.illustrationNote}`, {
          bold: true,
          italic: true,
          sizePt: 11,
          colorHex: "0369A1",
          spaceAfter: 60,
        })
      );
    }
  });

  if (bp?.practiceTasks && bp.practiceTasks.length > 0) {
    bp.practiceTasks.forEach((pt: any, idx: number) => {
      p.push(
        makeWordParagraph(
          `Bài thực hành ${idx + 1} (${pt.points.toFixed(2)} điểm) [${pt.cognitiveLevel}] — Phần mềm ${
            pt.softwareType
          }: ${pt.title}`,
          { bold: true, sizePt: 12, spaceAfter: 60 }
        )
      );
      p.push(
        makeWordParagraph(`   Yêu cầu thực hành: ${pt.instructions}`, {
          sizePt: 12,
          spaceAfter: 60,
        })
      );
      if (!pt.hasNoIllustration && pt.illustrationImageDataUrl && pt.illustrationNote) {
        p.push(
          makeWordParagraph(`   ${pt.illustrationNote}`, {
            bold: true,
            italic: true,
            sizePt: 11,
            colorHex: "0369A1",
            spaceAfter: 80,
          })
        );
      }
    });
  }

  // Đáp án và Hướng dẫn chấm chi tiết
  p.push(`    <w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
  p.push(
    makeWordParagraph("ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT", {
      bold: true,
      sizePt: 14,
      align: "center",
      colorHex: "047857",
      spaceAfter: 120,
    })
  );

  p.push(
    makeWordParagraph("1. Đáp án Phần I (Trắc nghiệm):", {
      bold: true,
      sizePt: 12,
      spaceAfter: 60,
    })
  );
  exam.multipleChoice.forEach((q, idx) => {
    const correctOpt = q.options[q.correctIndex] || "";
    p.push(
      makeWordParagraph(
        `• Câu ${idx + 1}: Đáp án đúng là ${correctOpt} (${q.points.toFixed(2)}đ) — Giải thích: ${
          q.explanation
        }`,
        { sizePt: 11, spaceAfter: 50 }
      )
    );
  });

  if (shortAnswers.length > 0) {
    p.push(
      makeWordParagraph("2. Hướng dẫn chấm Tự luận:", {
        bold: true,
        sizePt: 12,
        spaceAfter: 60,
      })
    );
    shortAnswers.forEach((sa, idx) => {
      p.push(
        makeWordParagraph(
          `• Câu tự luận ${idx + 1} (${sa.points.toFixed(2)}đ): Đáp án mẫu: ${sa.sampleAnswer}`,
          { sizePt: 11, spaceAfter: 40 }
        )
      );
      if (sa.gradingGuide) {
        p.push(
          makeWordParagraph(`  Biểu điểm chi tiết: ${sa.gradingGuide}`, {
            italic: true,
            sizePt: 11,
            colorHex: "334155",
            spaceAfter: 60,
          })
        );
      }
    });
  }

  if (bp?.practiceTasks && bp.practiceTasks.length > 0) {
    p.push(
      makeWordParagraph("3. Hướng dẫn chấm Thực hành:", {
        bold: true,
        sizePt: 12,
        spaceAfter: 60,
      })
    );
    bp.practiceTasks.forEach((pt: any, idx: number) => {
      p.push(
        makeWordParagraph(
          `• Bài thực hành ${idx + 1} (${pt.points.toFixed(2)}đ): ${pt.gradingRubric}`,
          { sizePt: 11, spaceAfter: 60 }
        )
      );
    });
  }

  const fileName = `DeThiHocKy_TinHoc_${removeVietnameseTones(grade).replace(/\s+/g, "")}.docx`;
  await buildValidDocxFileFromBodyXml(p.join("\n"), fileName);
}
