import React, { useState, useMemo, useEffect } from "react";
import JSZip from "jszip";
import {
  Sparkles,
  Save,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Database,
  BookOpenCheck,
  Award,
  Calendar,
  AlertTriangle,
  Check,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Assignment, GradeLevel, StudentSubmission } from "../types/grading";
import { ClassRoom, StudentRecord } from "./ClassManagerView";
import {
  INITIAL_TT27_REGULAR_RECORDS,
  INITIAL_TT27_PERIODIC_RECORDS,
} from "../data/initialData";
import {
  fetchSystemStateFromCode,
  loadCachedLocalState,
  syncStateToCodebase,
} from "../utils/codeSyncEngine";

interface Circular27AssessmentViewProps {
  classes: ClassRoom[];
  assignments: Assignment[];
  submissions: StudentSubmission[];
  onCodeSyncSuccess?: (timestamp: string) => void;
}

export type Circular27SubTab = "regular_monthly" | "periodic_semester";

export type PeriodicTermKey = "mid_hk1" | "end_hk1" | "mid_hk2" | "end_hk2";

export interface RegularMonthlyEvaluationRow {
  studentId: string;
  studentCode: string;
  studentName: string;
  birthDate: string;
  monthlyScoreRef: number | null;
  monthlySourceTitle: string;
  // 1. Môn học và hoạt động giáo dục
  subjectCode: string;
  subjectContent: string;
  // 2. Nhận xét năng lực chung
  generalCompCode: string;
  generalCompContent: string;
  // 3. Nhận xét năng lực đặc thù
  specificCompCode: string;
  specificCompContent: string;
  // 4. Nhận xét phẩm chất chủ yếu
  qualityCode: string;
  qualityContent: string;
}

export interface PeriodicEvaluationRow {
  studentId: string;
  studentCode: string;
  studentName: string;
  birthDate: string;
  sourceExamTitle: string;
  // 2. Đánh giá Giữa học kỳ (T: Hoàn thành tốt, H: Hoàn thành, C: Chưa hoàn thành, "": Chưa đánh giá)
  midtermLevel: "T" | "H" | "C" | "";
  // 3. Đánh giá Cuối học kỳ
  finalLevel: "T" | "H" | "C" | "";
  periodicScore: number | null; // Điểm KTĐK (thang 10), null nếu chưa làm bài
  commentCode: string; // Mã nhận xét
  commentContent: string; // Nội dung nhận xét môn học
  evaluationPeriodCode: "GK1" | "CK1" | "GK2" | "CK2"; // Thời điểm đánh giá mặc định GK1, CK1, GK2, CK2
  specificCompContent: string; // Nhận xét năng lực đặc thù
  qualityContent: string; // Nhận xét phẩm chất chủ yếu
  isEligible?: boolean; // Cờ xác nhận đã có đủ bài KT giữa kì và kết quả học tập các tháng
}

const MONTH_OPTIONS = [
  { value: "09-2026", monthNum: "9", label: "09-2026 (Tháng 9)" },
  { value: "10-2026", monthNum: "10", label: "10-2026 (Tháng 10)" },
  { value: "11-2026", monthNum: "11", label: "11-2026 (Tháng 11)" },
  { value: "12-2026", monthNum: "12", label: "12-2026 (Tháng 12)" },
  { value: "01-2027", monthNum: "1", label: "01-2027 (Tháng 1)" },
  { value: "02-2027", monthNum: "2", label: "02-2027 (Tháng 2)" },
  { value: "03-2027", monthNum: "3", label: "03-2027 (Tháng 3)" },
  { value: "04-2027", monthNum: "4", label: "04-2027 (Tháng 4)" },
  { value: "05-2027", monthNum: "5", label: "05-2027 (Tháng 5)" },
];

const PERIODIC_TERM_OPTIONS: {
  value: PeriodicTermKey;
  periodCode: "GK1" | "CK1" | "GK2" | "CK2";
  label: string;
  semesterLabel: string;
  isEndTerm: boolean;
}[] = [
  {
    value: "mid_hk1",
    periodCode: "GK1",
    label: "Giữa HK1 (Giữa học kỳ I)",
    semesterLabel: "Học kỳ 1",
    isEndTerm: false,
  },
  {
    value: "end_hk1",
    periodCode: "CK1",
    label: "Cuối HK1 (Cuối học kỳ I)",
    semesterLabel: "Học kỳ 1",
    isEndTerm: true,
  },
  {
    value: "mid_hk2",
    periodCode: "GK2",
    label: "Giữa HK2 (Giữa học kỳ II)",
    semesterLabel: "Học kỳ 2",
    isEndTerm: false,
  },
  {
    value: "end_hk2",
    periodCode: "CK2",
    label: "Cuối HK2 (Cuối học kỳ II)",
    semesterLabel: "Học kỳ 2",
    isEndTerm: true,
  },
];

function escapeXml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getExcelColumnLetter(colIdxZeroBased: number): string {
  let temp = colIdxZeroBased + 1;
  let letter = "";
  while (temp > 0) {
    const rem = (temp - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    temp = Math.floor((temp - 1) / 26);
  }
  return letter;
}

/**
 * Tạo tệp Excel chuẩn OpenXML (.xlsx):
 * - Tên sheet bắt buộc: "TH-CN (Tin học)"
 * - Tất cả các cột và ô đều định dạng General (numFmtId="0")
 * - Tất cả các ô tiêu đề và dữ liệu đều được đóng khung (thin border 4 cạnh)
 */
async function generateCircular27ExcelBlob(params: {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
  colWidths: number[];
  centeredColIndices: number[];
}): Promise<Blob> {
  const { sheetName, headers, rows, colWidths, centeredColIndices } = params;
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`
  );

  // Tên sheet bắt buộc: "TH-CN (Tin học)"
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  // Styles: Tất cả các style (s=0, s=1, s=2, s=3) đều định dạng General (numFmtId="0")
  // s=1: Header (in đậm, căn giữa, đóng khung 4 cạnh, nền xanh nhạt)
  // s=2: Nội dung văn bản (General, căn trái, tự xuống dòng wrapText, đóng khung 4 cạnh)
  // s=3: Nội dung căn giữa (General, căn giữa, tự xuống dòng wrapText, đóng khung 4 cạnh)
  zip.file(
    "xl/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="11"/>
      <color rgb="FF000000"/>
      <name val="Times New Roman"/>
      <family val="1"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <color rgb="FF000000"/>
      <name val="Times New Roman"/>
      <family val="1"/>
    </font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FFD9E1F2"/>
        <bgColor indexed="64"/>
      </patternFill>
    </fill>
  </fills>
  <borders count="2">
    <border>
      <left/><right/><top/><bottom/><diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FF000000"/></left>
      <right style="thin"><color rgb="FF000000"/></right>
      <top style="thin"><color rgb="FF000000"/></top>
      <bottom style="thin"><color rgb="FF000000"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`
  );

  // Xây dựng bảng SharedStrings và dữ liệu sheet1.xml
  const sharedStringsList: string[] = [];
  const sharedStringIndexMap = new Map<string, number>();

  const getSharedStringIndex = (text: string): number => {
    const normalized = String(text ?? "");
    const existing = sharedStringIndexMap.get(normalized);
    if (existing !== undefined) return existing;
    const nextIdx = sharedStringsList.length;
    sharedStringsList.push(normalized);
    sharedStringIndexMap.set(normalized, nextIdx);
    return nextIdx;
  };

  const centeredSet = new Set(centeredColIndices);

  const colsXml = colWidths
    .map(
      (w, idx) =>
        `<col min="${idx + 1}" max="${idx + 1}" width="${w}" style="0" customWidth="1"/>`
    )
    .join("");

  let sheetDataXml = "";

  // Dòng 1: Header (s="1" - General, in đậm, căn giữa, đóng khung)
  const headerCellsXml = headers
    .map((h, cIdx) => {
      const cellRef = `${getExcelColumnLetter(cIdx)}1`;
      const sIdx = getSharedStringIndex(h);
      return `<c r="${cellRef}" s="1" t="s"><v>${sIdx}</v></c>`;
    })
    .join("");
  sheetDataXml += `<row r="1" ht="28" customHeight="1">${headerCellsXml}</row>`;

  // Các dòng dữ liệu học sinh (từ dòng 2 trở đi)
  rows.forEach((rowValues, rIdx) => {
    const excelRowNum = rIdx + 2;
    const rowCellsXml = headers
      .map((_, cIdx) => {
        const cellRef = `${getExcelColumnLetter(cIdx)}${excelRowNum}`;
        const rawVal = rowValues[cIdx] ?? "";
        const styleId = centeredSet.has(cIdx) ? "3" : "2";

        if (typeof rawVal === "number" && !Number.isNaN(rawVal)) {
          return `<c r="${cellRef}" s="${styleId}"><v>${rawVal}</v></c>`;
        }
        const sIdx = getSharedStringIndex(String(rawVal));
        return `<c r="${cellRef}" s="${styleId}" t="s"><v>${sIdx}</v></c>`;
      })
      .join("");

    sheetDataXml += `<row r="${excelRowNum}" ht="32" customHeight="1">${rowCellsXml}</row>`;
  });

  const lastColLetter = getExcelColumnLetter(Math.max(0, headers.length - 1));
  const lastRowNum = rows.length + 1;

  zip.file(
    "xl/worksheets/sheet1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:${lastColLetter}${lastRowNum}"/>
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0"/>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="24"/>
  <cols>${colsXml}</cols>
  <sheetData>${sheetDataXml}</sheetData>
</worksheet>`
  );

  const sstItemsXml = sharedStringsList
    .map((s) => `<si><t xml:space="preserve">${escapeXml(s)}</t></si>`)
    .join("");

  zip.file(
    "xl/sharedStrings.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStringsList.length}" uniqueCount="${sharedStringsList.length}">${sstItemsXml}</sst>`
  );

  return await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function parseMonthAndYear(monthValue: string): { month: number; year: number } {
  const parts = monthValue.split("-");
  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);
  return { month: isNaN(month) ? 10 : month, year: isNaN(year) ? 2026 : year };
}

function isSubmissionForMonth(
  sub: StudentSubmission,
  assignment: Assignment | undefined,
  monthValue: string
): boolean {
  const { month, year } = parseMonthAndYear(monthValue);
  const monthNumStr = String(month);
  const monthNumPadded = month < 10 ? `0${month}` : `${month}`;

  const titleToCheck = `${sub.assignmentTitle || ""} ${assignment?.title || ""} ${assignment?.code || ""}`.toLowerCase();
  
  if (
    titleToCheck.includes(monthValue.toLowerCase()) ||
    titleToCheck.includes(`tháng ${monthNumStr}`) ||
    titleToCheck.includes(`tháng ${monthNumPadded}`) ||
    titleToCheck.includes(`thang ${monthNumStr}`) ||
    titleToCheck.includes(`thang ${monthNumPadded}`)
  ) {
    if (month === 1 && (
      titleToCheck.includes("tháng 10") || titleToCheck.includes("tháng 11") || titleToCheck.includes("tháng 12") ||
      titleToCheck.includes("thang 10") || titleToCheck.includes("thang 11") || titleToCheck.includes("thang 12")
    )) {
      if (!titleToCheck.includes("tháng 1/") && !titleToCheck.includes("tháng 1 ") && !titleToCheck.includes("tháng 01") && !titleToCheck.includes("01-2027")) {
        return false;
      }
    }
    return true;
  }

  if (sub.submittedAt) {
    const dateObj = new Date(sub.submittedAt);
    if (!isNaN(dateObj.getTime())) {
      if (dateObj.getMonth() + 1 === month && dateObj.getFullYear() === year) {
        return true;
      }
    }
    if (
      sub.submittedAt.includes(`/${monthNumPadded}/${year}`) ||
      sub.submittedAt.includes(`/${monthNumStr}/${year}`) ||
      sub.submittedAt.includes(`-${monthNumPadded}-${year}`) ||
      sub.submittedAt.includes(`${year}-${monthNumPadded}`)
    ) {
      return true;
    }
  }

  return false;
}

function findMonthlySubmissionForStudent(
  student: StudentRecord,
  monthValue: string,
  submissions: StudentSubmission[],
  assignments: Assignment[]
): StudentSubmission | undefined {
  const studentSubs = submissions.filter(
    (s) =>
      s.studentId.trim().toLowerCase() === student.studentCode.trim().toLowerCase() ||
      s.studentName.trim().toLowerCase() === student.name.trim().toLowerCase()
  );

  return studentSubs.find((s) => {
    const asg = assignments.find((a) => a.id === s.assignmentId);
    return isSubmissionForMonth(s, asg, monthValue);
  });
}

function isSubmissionForPeriodicTerm(
  sub: StudentSubmission,
  assignment: Assignment | undefined,
  termKey: PeriodicTermKey
): boolean {
  const titleToCheck = `${sub.assignmentTitle || ""} ${assignment?.title || ""} ${assignment?.code || ""}`.toLowerCase();
  const semesterType = assignment?.theoryExam?.semesterBlueprint?.semesterType;

  if (termKey === "mid_hk1") {
    if (semesterType === "Giữa Học kỳ I") return true;
    return (
      titleToCheck.includes("giữa học kỳ i") ||
      titleToCheck.includes("giữa học kỳ 1") ||
      titleToCheck.includes("giữa hk1") ||
      titleToCheck.includes("giữa hk 1") ||
      titleToCheck.includes("gk1") ||
      titleToCheck.includes("giữa kì 1") ||
      titleToCheck.includes("giữa kỳ 1")
    );
  }

  if (termKey === "end_hk1") {
    if (semesterType === "Học kỳ I") return true;
    return (
      titleToCheck.includes("cuối học kỳ i") ||
      titleToCheck.includes("cuối học kỳ 1") ||
      titleToCheck.includes("cuối hk1") ||
      titleToCheck.includes("cuối hk 1") ||
      titleToCheck.includes("ck1") ||
      titleToCheck.includes("cuối kì 1") ||
      titleToCheck.includes("cuối kỳ 1") ||
      (titleToCheck.includes("học kỳ i") && !titleToCheck.includes("giữa")) ||
      (titleToCheck.includes("học kỳ 1") && !titleToCheck.includes("giữa"))
    );
  }

  if (termKey === "mid_hk2") {
    if (semesterType === "Giữa Học kỳ II") return true;
    return (
      titleToCheck.includes("giữa học kỳ ii") ||
      titleToCheck.includes("giữa học kỳ 2") ||
      titleToCheck.includes("giữa hk2") ||
      titleToCheck.includes("giữa hk 2") ||
      titleToCheck.includes("gk2") ||
      titleToCheck.includes("giữa kì 2") ||
      titleToCheck.includes("giữa kỳ 2")
    );
  }

  if (termKey === "end_hk2") {
    if (semesterType === "Học kỳ II") return true;
    return (
      titleToCheck.includes("cuối học kỳ ii") ||
      titleToCheck.includes("cuối học kỳ 2") ||
      titleToCheck.includes("cuối hk2") ||
      titleToCheck.includes("cuối hk 2") ||
      titleToCheck.includes("ck2") ||
      titleToCheck.includes("cuối kì 2") ||
      titleToCheck.includes("cuối kỳ 2") ||
      (titleToCheck.includes("học kỳ ii") && !titleToCheck.includes("giữa")) ||
      (titleToCheck.includes("học kỳ 2") && !titleToCheck.includes("giữa"))
    );
  }

  return false;
}

function findPeriodicSubmissionForStudent(
  student: StudentRecord,
  termKey: PeriodicTermKey,
  submissions: StudentSubmission[],
  assignments: Assignment[]
): StudentSubmission | undefined {
  const studentSubs = submissions.filter(
    (s) =>
      s.studentId.trim().toLowerCase() === student.studentCode.trim().toLowerCase() ||
      s.studentName.trim().toLowerCase() === student.name.trim().toLowerCase()
  );

  return studentSubs.find((s) => {
    const asg = assignments.find((a) => a.id === s.assignmentId);
    return isSubmissionForPeriodicTerm(s, asg, termKey);
  });
}

function getMonthlyStudySubmissionsForTerm(
  student: StudentRecord,
  termKey: PeriodicTermKey,
  submissions: StudentSubmission[],
  assignments: Assignment[]
): StudentSubmission[] {
  const isHk1 = termKey === "mid_hk1" || termKey === "end_hk1";
  const validMonths = isHk1
    ? ["09-2026", "10-2026", "11-2026", "12-2026"]
    : ["01-2027", "02-2027", "03-2027", "04-2027", "05-2027"];

  const studentSubs = submissions.filter(
    (s) =>
      s.studentId.trim().toLowerCase() === student.studentCode.trim().toLowerCase() ||
      s.studentName.trim().toLowerCase() === student.name.trim().toLowerCase()
  );

  return studentSubs.filter((sub) => {
    const asg = assignments.find((a) => a.id === sub.assignmentId);
    if (isSubmissionForPeriodicTerm(sub, asg, termKey)) {
      return false;
    }
    return validMonths.some((m) => isSubmissionForMonth(sub, asg, m)) ||
      (sub.assignmentTitle && !sub.assignmentTitle.toLowerCase().includes("định kỳ") && !sub.assignmentTitle.toLowerCase().includes("học kỳ"));
  });
}

/**
 * Ngân hàng phân tích Thông tư 27/2020/TT-BGDĐT chuẩn xác theo Khối lớp (Lớp 3, 4, 5) và điểm số thực tế
 * NGUYÊN TẮC: Nếu học sinh chưa làm bài kiểm tra của tháng -> KHÔNG CÓ DỮ LIỆU. AI không được tự bịa kết quả!
 */
function buildCircular27RegularEvaluationForStudent(params: {
  student: StudentRecord;
  studentIdx: number;
  grade: GradeLevel;
  monthValue: string;
  matchedSubmission?: StudentSubmission;
  matchedAssignment?: Assignment;
}): RegularMonthlyEvaluationRow {
  const {
    student,
    grade,
    monthValue,
    matchedSubmission,
  } = params;

  // QUY TẮC BẮT BUỘC THEO YÊU CẦU: Nếu học sinh chưa làm bài kiểm tra của tháng thì KHÔNG CÓ DỮ LIỆU.
  if (!matchedSubmission) {
    return {
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: student.name,
      birthDate: student.birthDate || "15/05/2018",
      monthlyScoreRef: null,
      monthlySourceTitle: `Chưa làm bài kiểm tra tháng ${monthValue}`,
      subjectCode: "",
      subjectContent: "",
      generalCompCode: "",
      generalCompContent: "",
      specificCompCode: "",
      specificCompContent: "",
      qualityCode: "",
      qualityContent: "",
    };
  }

  const score = matchedSubmission.finalScore;
  const sourceTitle = matchedSubmission.assignmentTitle;

  const gradeSkillText =
    grade === "Lớp 3"
      ? "nhận diện các bộ phận máy tính, rèn tư thế ngồi đúng, thao tác chuột và quản lý cây thư mục cá nhân"
      : grade === "Lớp 4"
      ? "soạn thảo văn bản Tiếng Việt có dấu trên Word, thiết kế slide trình chiếu PowerPoint và tìm kiếm thông tin an toàn"
      : "lập trình cấu trúc vòng lặp, điều kiện trong Scratch (.sb3) và trình bày sản phẩm số sáng tạo";

  if (score >= 8.5) {
    return {
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: student.name,
      birthDate: student.birthDate || "15/05/2018",
      monthlyScoreRef: score,
      monthlySourceTitle: sourceTitle,
      subjectCode: "MH-T01",
      subjectContent: `Nắm vững kiến thức môn Tin học ${grade} trong tháng; thao tác thành thạo ${gradeSkillText}, hoàn thành xuất sắc bài thực hành trên phòng máy.`,
      generalCompCode: "NLC-T01",
      generalCompContent:
        "Có năng lực tự chủ và tự học tốt; chủ động khám phá yêu cầu bài tập, tích cực hợp tác và hỗ trợ bạn cùng nhóm khi thực hành.",
      specificCompCode: "NLDT-T01",
      specificCompContent:
        "Sử dụng và quản lý phương tiện CNTT đúng quy trình; vận dụng linh hoạt phần mềm để giải quyết nhanh các nhiệm vụ thực hành được giao.",
      qualityCode: "PC-T01",
      qualityContent:
        "Chăm chỉ, tự giác hoàn thành nhiệm vụ học tập; trung thực trong làm bài và có ý thức bảo quản thiết bị phòng máy tính.",
    };
  }

  if (score >= 6.5) {
    return {
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: student.name,
      birthDate: student.birthDate || "15/05/2018",
      monthlyScoreRef: score,
      monthlySourceTitle: sourceTitle,
      subjectCode: "MH-H01",
      subjectContent: `Hoàn thành nội dung học tập môn Tin học ${grade} trong tháng; thực hiện được ${gradeSkillText}, cần rèn thêm thao tác kiểm tra định dạng và lưu tên tệp chuẩn.`,
      generalCompCode: "NLC-H01",
      generalCompContent:
        "Có ý thức tự học và tham gia hoạt động nhóm; biết trao đổi với giáo viên và bạn bè khi gặp tình huống mới trên máy tính.",
      specificCompCode: "NLDT-H01",
      specificCompContent:
        "Thực hiện được các thao tác cơ bản trên phần mềm học tập; cần rèn luyện thêm tốc độ gõ phím và thao tác lưu tệp đúng thư mục.",
      qualityCode: "PC-H01",
      qualityContent:
        "Chăm chỉ, nghiêm túc thực hiện nội quy phòng máy tính; có trách nhiệm hoàn thành bài tập được giao.",
    };
  }

  return {
    studentId: student.id,
    studentCode: student.studentCode,
    studentName: student.name,
    birthDate: student.birthDate || "15/05/2018",
    monthlyScoreRef: score,
    monthlySourceTitle: sourceTitle,
    subjectCode: "MH-C01",
    subjectContent: `Đã bước đầu làm quen với ${gradeSkillText}; em cần thực hành chậm rãi từng bước theo hướng dẫn để hoàn thiện đầy đủ các yêu cầu của bài.`,
    generalCompCode: "NLC-C01",
    generalCompContent:
      "Cần chủ động hơn trong việc đọc kỹ yêu cầu đề bài và mạnh dạn hỏi thầy khi gặp vướng mắc trong giờ thực hành.",
    specificCompCode: "NLDT-C01",
    specificCompContent:
      "Cần rèn luyện thêm thao tác chuột, bàn phím và cách lưu tệp bài làm đúng quy định trên máy tính.",
    qualityCode: "PC-H02",
    qualityContent:
      "Có cố gắng trong giờ học, ngoan ngoãn, biết giữ gìn vệ sinh và bảo quản thiết bị phòng máy.",
  };
}

function getDefaultPeriodCodeForTerm(
  termKey: PeriodicTermKey
): "GK1" | "CK1" | "GK2" | "CK2" {
  if (termKey === "mid_hk1") return "GK1";
  if (termKey === "end_hk1") return "CK1";
  if (termKey === "mid_hk2") return "GK2";
  return "CK2";
}

/**
 * Đánh giá định kỳ (Giữa HK1, Cuối HK1, Giữa HK2, Cuối HK2) theo Thông tư 27
 * NGUYÊN TẮC: Bắt buộc học sinh phải có kết quả làm bài giữa kì VÀ kết quả học tập trong các tháng của kì đó
 * thì mới phân tích và nhận xét chứ KHÔNG tự bịa ra kết quả cho học sinh!
 */
function buildCircular27PeriodicEvaluationForStudent(params: {
  student: StudentRecord;
  studentIdx: number;
  grade: GradeLevel;
  termKey: PeriodicTermKey;
  matchedSubmission?: StudentSubmission;
  monthlyStudySubmissions?: StudentSubmission[];
}): PeriodicEvaluationRow {
  const {
    student,
    grade,
    termKey,
    matchedSubmission,
    monthlyStudySubmissions = [],
  } = params;

  const evaluationPeriodCode = getDefaultPeriodCodeForTerm(termKey);
  const isMidterm = termKey.startsWith("mid");
  const termNameLabel = PERIODIC_TERM_OPTIONS.find((t) => t.value === termKey)?.label || termKey;

  const hasPeriodicExam = Boolean(matchedSubmission);
  const hasMonthlyStudy = monthlyStudySubmissions.length > 0;
  const isEligible = hasPeriodicExam && hasMonthlyStudy;

  if (!isEligible) {
    let reasonTitle = "Chưa có dữ liệu bài làm";
    if (!hasPeriodicExam && !hasMonthlyStudy) {
      reasonTitle = isMidterm
        ? "Chưa làm bài KT giữa kì & chưa có kết quả các tháng"
        : "Chưa làm bài KT cuối kì & chưa có kết quả các tháng";
    } else if (!hasPeriodicExam) {
      reasonTitle = isMidterm
        ? `Chưa làm bài kiểm tra giữa kì (${termNameLabel})`
        : `Chưa làm bài kiểm tra cuối kì (${termNameLabel})`;
    } else if (!hasMonthlyStudy) {
      reasonTitle = isMidterm
        ? `Chưa có kết quả học tập các tháng trước giữa kì`
        : `Chưa có kết quả học tập các tháng trong học kỳ`;
    }

    return {
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: student.name,
      birthDate: student.birthDate || "15/05/2018",
      sourceExamTitle: reasonTitle,
      midtermLevel: "",
      finalLevel: "",
      periodicScore: null,
      commentCode: "",
      commentContent: "",
      evaluationPeriodCode,
      specificCompContent: "",
      qualityContent: "",
      isEligible: false,
    };
  }

  const rawScore = matchedSubmission!.finalScore;
  const roundedScore = Math.round(rawScore * 2) / 2;

  const level: "T" | "H" | "C" =
    roundedScore >= 8.0 ? "T" : roundedScore >= 5.0 ? "H" : "C";

  const midtermLevel: "T" | "H" | "C" = level;
  const finalLevel: "T" | "H" | "C" = level;

  const sourceExamTitle = matchedSubmission!.assignmentTitle;

  const gradeTopicStrength =
    grade === "Lớp 3"
      ? "thao tác sử dụng chuột, bàn phím, tổ chức cây thư mục và vẽ hình cơ bản"
      : grade === "Lớp 4"
      ? "soạn thảo và định dạng văn bản Word (.docx), thiết kế bài trình chiếu PowerPoint (.pptx)"
      : "xây dựng kịch bản lập trình khối lệnh Scratch (.sb3), sử dụng cấu trúc lặp và điều kiện";

  if (level === "T") {
    return {
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: student.name,
      birthDate: student.birthDate || "15/05/2018",
      sourceExamTitle,
      midtermLevel,
      finalLevel,
      periodicScore: roundedScore,
      commentCode: termKey.startsWith("mid") ? "GK-T01" : "CK-T01",
      commentContent: `Nắm vững kiến thức và kỹ năng môn Tin học ${grade}, thực hành thành thạo ${gradeTopicStrength}, bài làm đạt kết quả tốt.`,
      evaluationPeriodCode,
      specificCompContent:
        "Sử dụng và quản lý phương tiện CNTT đúng quy trình; vận dụng linh hoạt phần mềm để hoàn thành tốt nhiệm vụ thực hành.",
      qualityContent:
        "Chăm chỉ, tự giác hoàn thành nhiệm vụ học tập; trung thực trong làm bài và có ý thức bảo quản thiết bị phòng máy tính.",
      isEligible: true,
    };
  }

  if (level === "H") {
    return {
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: student.name,
      birthDate: student.birthDate || "15/05/2018",
      sourceExamTitle,
      midtermLevel,
      finalLevel,
      periodicScore: roundedScore,
      commentCode: termKey.startsWith("mid") ? "GK-H01" : "CK-H01",
      commentContent: `Hoàn thành yêu cầu cơ bản về ${gradeTopicStrength}; cần kiểm tra kỹ định dạng trình bày và quy tắc đặt tên tệp trước khi nộp bài.`,
      evaluationPeriodCode,
      specificCompContent:
        "Thực hiện được các thao tác cơ bản trên phần mềm học tập; cần rèn luyện thêm tốc độ gõ phím và thao tác lưu tệp đúng thư mục.",
      qualityContent:
        "Chăm chỉ, nghiêm túc thực hiện nội quy phòng máy tính; có trách nhiệm hoàn thành bài tập được giao.",
      isEligible: true,
    };
  }

  return {
    studentId: student.id,
    studentCode: student.studentCode,
    studentName: student.name,
    birthDate: student.birthDate || "15/05/2018",
    sourceExamTitle,
    midtermLevel,
    finalLevel,
    periodicScore: roundedScore,
    commentCode: termKey.startsWith("mid") ? "GK-C01" : "CK-C01",
    commentContent: `Có cố gắng tham gia thực hành trên máy tính; cần ôn tập kỹ hơn các thao tác cơ bản về ${gradeTopicStrength}.`,
    evaluationPeriodCode,
    specificCompContent:
      "Cần rèn luyện thêm thao tác chuột, bàn phím và cách lưu tệp bài làm đúng quy định trên máy tính.",
    qualityContent:
      "Có cố gắng trong giờ học, ngoan ngoãn, biết giữ gìn vệ sinh và bảo quản thiết bị phòng máy.",
    isEligible: true,
  };
}

export const Circular27AssessmentView: React.FC<Circular27AssessmentViewProps> = ({
  classes,
  assignments,
  submissions,
  onCodeSyncSuccess,
}) => {
  const [subTab, setSubTab] = useState<Circular27SubTab>("regular_monthly");

  // Bộ lọc chung: Khối & Lớp
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    classes[0]?.grade || "Lớp 3"
  );
  const matchingClasses = useMemo(
    () => classes.filter((c) => c.grade === selectedGrade),
    [classes, selectedGrade]
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    matchingClasses[0]?.id || classes[0]?.id || ""
  );

  useEffect(() => {
    if (!matchingClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(matchingClasses[0]?.id || classes[0]?.id || "");
    }
  }, [matchingClasses, selectedClassId, classes]);

  const activeClass = useMemo(
    () =>
      classes.find((c) => c.id === selectedClassId) ||
      matchingClasses[0] ||
      classes[0],
    [classes, selectedClassId, matchingClasses]
  );

  // State cho Mục 1: Đánh giá thường xuyên hàng tháng (5.3.4)
  const [selectedMonth, setSelectedMonth] = useState<string>("10-2026");
  const [regularCategoryFilter, setRegularCategoryFilter] = useState<
    "all" | "subject" | "general_comp" | "specific_comp" | "quality"
  >("all");
  const [regularRecordsByMap, setRegularRecordsByMap] = useState<
    Record<string, RegularMonthlyEvaluationRow[]>
  >(() => {
    const cached = loadCachedLocalState();
    return {
      ...((INITIAL_TT27_REGULAR_RECORDS as Record<string, RegularMonthlyEvaluationRow[]>) || {}),
      ...((cached?.tt27RegularRecords as Record<string, RegularMonthlyEvaluationRow[]>) || {}),
    };
  });
  const [isFetchingRegularAI, setIsFetchingRegularAI] = useState<boolean>(false);
  const [regularSaveNotice, setRegularSaveNotice] = useState<string | null>(null);

  // State cho Mục 2: Đánh giá định kỳ (5.3.1 — Giữa HK1, Cuối HK1, Giữa HK2, Cuối HK2)
  const [selectedPeriodicTerm, setSelectedPeriodicTerm] =
    useState<PeriodicTermKey>("mid_hk1");
  const [periodicRecordsByMap, setPeriodicRecordsByMap] = useState<
    Record<string, PeriodicEvaluationRow[]>
  >(() => {
    const cached = loadCachedLocalState();
    return {
      ...((INITIAL_TT27_PERIODIC_RECORDS as Record<string, PeriodicEvaluationRow[]>) || {}),
      ...((cached?.tt27PeriodicRecords as Record<string, PeriodicEvaluationRow[]>) || {}),
    };
  });
  const [isFetchingPeriodicAI, setIsFetchingPeriodicAI] = useState<boolean>(false);
  const [periodicSaveNotice, setPeriodicSaveNotice] = useState<string | null>(null);

  // Đồng bộ 2 chiều nhận xét Thông tư 27 từ Server & bộ nhớ khi mở tab
  useEffect(() => {
    fetchSystemStateFromCode().then((remote) => {
      if (!remote) return;
      if (remote.tt27RegularRecords && Object.keys(remote.tt27RegularRecords).length > 0) {
        setRegularRecordsByMap((prev) => ({
          ...remote.tt27RegularRecords,
          ...prev,
        }));
      }
      if (remote.tt27PeriodicRecords && Object.keys(remote.tt27PeriodicRecords).length > 0) {
        setPeriodicRecordsByMap((prev) => ({
          ...remote.tt27PeriodicRecords,
          ...prev,
        }));
      }
    });
  }, []);

  const regularKey = `${activeClass?.id || "cls"}_${selectedMonth}`;
  const periodicKey = `${activeClass?.id || "cls"}_${selectedPeriodicTerm}`;

  const currentPeriodicTermMeta =
    PERIODIC_TERM_OPTIONS.find((t) => t.value === selectedPeriodicTerm) ||
    PERIODIC_TERM_OPTIONS[0];

  const currentMonthMeta =
    MONTH_OPTIONS.find((m) => m.value === selectedMonth) || MONTH_OPTIONS[1];

  // Khởi tạo hoặc lấy danh sách dòng Đánh giá thường xuyên cho Lớp + Tháng hiện tại
  const currentRegularRows: RegularMonthlyEvaluationRow[] = useMemo(() => {
    if (!activeClass) return [];
    const existing = regularRecordsByMap[regularKey];
    if (existing && existing.length === activeClass.students.length) {
      return activeClass.students.map((st, idx) => {
        const found = existing.find((r) => r.studentId === st.id) || existing[idx];
        return {
          ...found,
          studentId: st.id,
          studentCode: st.studentCode,
          studentName: st.name,
          birthDate: st.birthDate || found.birthDate,
        };
      });
    }

    const classSubmissions = submissions.filter(
      (s) => s.className.trim().toLowerCase() === activeClass.name.trim().toLowerCase()
    );
    const classAssignments = assignments.filter(
      (a) =>
        a.className.trim().toLowerCase() === activeClass.name.trim().toLowerCase() ||
        a.grade === activeClass.grade
    );

    return activeClass.students.map((st, idx) => {
      const matchedSub = findMonthlySubmissionForStudent(
        st,
        selectedMonth,
        classSubmissions,
        assignments
      );
      return buildCircular27RegularEvaluationForStudent({
        student: st,
        studentIdx: idx,
        grade: activeClass.grade,
        monthValue: selectedMonth,
        matchedSubmission: matchedSub,
      });
    });
  }, [
    activeClass,
    regularRecordsByMap,
    regularKey,
    submissions,
    assignments,
    selectedMonth,
  ]);

  // Khởi tạo hoặc lấy danh sách dòng Đánh giá định kỳ cho Lớp + Kỳ hiện tại
  const currentPeriodicRows: PeriodicEvaluationRow[] = useMemo(() => {
    if (!activeClass) return [];
    const defaultPeriodCode = getDefaultPeriodCodeForTerm(selectedPeriodicTerm);
    const classSubmissions = submissions.filter(
      (s) => s.className.trim().toLowerCase() === activeClass.name.trim().toLowerCase()
    );

    const existing = periodicRecordsByMap[periodicKey];
    if (existing && existing.length === activeClass.students.length) {
      return activeClass.students.map((st, idx) => {
        const found = existing.find((r) => r.studentId === st.id) || existing[idx];
        const periodicSub = findPeriodicSubmissionForStudent(
          st,
          selectedPeriodicTerm,
          classSubmissions,
          assignments
        );
        const monthlySubs = getMonthlyStudySubmissionsForTerm(
          st,
          selectedPeriodicTerm,
          classSubmissions,
          assignments
        );
        const fallbackRow = buildCircular27PeriodicEvaluationForStudent({
          student: st,
          studentIdx: idx,
          grade: activeClass.grade,
          termKey: selectedPeriodicTerm,
          matchedSubmission: periodicSub,
          monthlyStudySubmissions: monthlySubs,
        });
        return {
          ...fallbackRow,
          ...found,
          studentId: st.id,
          studentCode: st.studentCode,
          studentName: st.name,
          birthDate: st.birthDate || found.birthDate,
          evaluationPeriodCode: found.evaluationPeriodCode || defaultPeriodCode,
          specificCompContent:
            found.specificCompContent || fallbackRow.specificCompContent,
          qualityContent: found.qualityContent || fallbackRow.qualityContent,
        };
      });
    }

    return activeClass.students.map((st, idx) => {
      const periodicSub = findPeriodicSubmissionForStudent(
        st,
        selectedPeriodicTerm,
        classSubmissions,
        assignments
      );
      const monthlySubs = getMonthlyStudySubmissionsForTerm(
        st,
        selectedPeriodicTerm,
        classSubmissions,
        assignments
      );
      return buildCircular27PeriodicEvaluationForStudent({
        student: st,
        studentIdx: idx,
        grade: activeClass.grade,
        termKey: selectedPeriodicTerm,
        matchedSubmission: periodicSub,
        monthlyStudySubmissions: monthlySubs,
      });
    });
  }, [
    activeClass,
    periodicRecordsByMap,
    periodicKey,
    submissions,
    assignments,
    selectedPeriodicTerm,
  ]);

  // Nút "Lấy dữ liệu & AI Phân tích theo Thông tư 27" cho Đánh giá thường xuyên hàng tháng
  const handleFetchAndAnalyzeRegularMonthly = async () => {
    if (!activeClass) return;
    setIsFetchingRegularAI(true);
    setRegularSaveNotice(null);

    try {
      const classSubmissions = submissions.filter(
        (s) =>
          s.className.trim().toLowerCase() === activeClass.name.trim().toLowerCase()
      );

      const baseRows = activeClass.students.map((st, idx) => {
        const matchedSub = findMonthlySubmissionForStudent(
          st,
          selectedMonth,
          classSubmissions,
          assignments
        );
        return buildCircular27RegularEvaluationForStudent({
          student: st,
          studentIdx: idx,
          grade: activeClass.grade,
          monthValue: selectedMonth,
          matchedSubmission: matchedSub,
        });
      });

      const testedRows = baseRows.filter((r) => r.monthlyScoreRef !== null);

      if (testedRows.length === 0) {
        const nextMap = { ...regularRecordsByMap, [regularKey]: baseRows };
        setRegularRecordsByMap(nextMap);
        syncStateToCodebase({ tt27RegularRecords: nextMap }).then((r) => {
          if (r.ok && onCodeSyncSuccess) onCodeSyncSuccess(r.lastUpdatedAt);
        });
        setRegularSaveNotice(
          `⚠️ Lớp ${activeClass.name} chưa có học sinh nào làm bài kiểm tra của tháng ${selectedMonth}. Hệ thống giữ nguyên trạng thái không có dữ liệu và không tự bịa nhận xét!`
        );
        return;
      }

      try {
        const response = await fetch("/api/ai/evaluate-tt27", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "regular",
            grade: activeClass.grade,
            className: activeClass.name,
            periodLabel: selectedMonth,
            studentsData: testedRows.map((r) => ({
              studentId: r.studentId,
              studentName: r.studentName,
              birthDate: r.birthDate,
              monthlyScore: r.monthlyScoreRef,
              examTitle: r.monthlySourceTitle,
            })),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.evaluations) && data.evaluations.length > 0) {
            const merged = baseRows.map((row) => {
              if (row.monthlyScoreRef === null) return row;
              const aiItem = data.evaluations.find(
                (e: any) => e.studentId === row.studentId
              );
              if (!aiItem) return row;
              return {
                ...row,
                subjectCode: aiItem.subjectCode || row.subjectCode,
                subjectContent: aiItem.subjectContent || row.subjectContent,
                generalCompCode: aiItem.generalCompCode || row.generalCompCode,
                generalCompContent:
                  aiItem.generalCompContent || row.generalCompContent,
                specificCompCode: aiItem.specificCompCode || row.specificCompCode,
                specificCompContent:
                  aiItem.specificCompContent || row.specificCompContent,
                qualityCode: aiItem.qualityCode || row.qualityCode,
                qualityContent: aiItem.qualityContent || row.qualityContent,
              };
            });
            const nextMap = { ...regularRecordsByMap, [regularKey]: merged };
            setRegularRecordsByMap(nextMap);
            syncStateToCodebase({ tt27RegularRecords: nextMap }).then((r) => {
              if (r.ok && onCodeSyncSuccess) onCodeSyncSuccess(r.lastUpdatedAt);
            });
            setRegularSaveNotice(
              `Đã lấy dữ liệu bài kiểm tra tháng ${selectedMonth} cho ${testedRows.length}/${baseRows.length} học sinh đã làm bài (${baseRows.length - testedRows.length} học sinh chưa làm bài giữ nguyên không có dữ liệu, AI không tự bịa)!`
            );
            return;
          }
        }
      } catch {
        // Fallback sử dụng bộ quy tắc chuẩn Thông tư 27 đã tổng hợp cho học sinh đã làm bài
      }

      const nextMap = { ...regularRecordsByMap, [regularKey]: baseRows };
      setRegularRecordsByMap(nextMap);
      syncStateToCodebase({ tt27RegularRecords: nextMap }).then((r) => {
        if (r.ok && onCodeSyncSuccess) onCodeSyncSuccess(r.lastUpdatedAt);
      });
      setRegularSaveNotice(
        `Đã cập nhật bài kiểm tra tháng ${selectedMonth} cho ${testedRows.length}/${baseRows.length} học sinh đã làm bài (${baseRows.length - testedRows.length} học sinh chưa làm bài không có dữ liệu)!`
      );
    } finally {
      setIsFetchingRegularAI(false);
    }
  };

  // Lưu kết quả đánh giá thường xuyên cho tháng
  const handleSaveRegularMonthly = () => {
    if (!activeClass) return;
    const updatedMap = {
      ...regularRecordsByMap,
      [regularKey]: currentRegularRows,
    };
    setRegularRecordsByMap(updatedMap);
    syncStateToCodebase({
      tt27RegularRecords: updatedMap,
      actionLabel: `Lưu nhận xét thường xuyên TT27 (${activeClass.name} - Tháng ${selectedMonth})`,
      actionCategory: "tt27",
    }).then((r) => {
      if (r.ok && onCodeSyncSuccess) onCodeSyncSuccess(r.lastUpdatedAt);
    });
    setRegularSaveNotice(
      `Đã lưu (Ghi) kết quả đánh giá thường xuyên Tháng ${selectedMonth} cho ${activeClass.name} (${currentRegularRows.length} học sinh) trực tiếp vào hệ thống!`
    );
  };

  // Cập nhật từng ô trong bảng Đánh giá thường xuyên
  const handleUpdateRegularCell = (
    studentId: string,
    field: keyof RegularMonthlyEvaluationRow,
    value: string
  ) => {
    const nextRows = currentRegularRows.map((row) =>
      row.studentId === studentId ? { ...row, [field]: value } : row
    );
    const nextMap = { ...regularRecordsByMap, [regularKey]: nextRows };
    setRegularRecordsByMap(nextMap);
    syncStateToCodebase({ tt27RegularRecords: nextMap }).then((r) => {
      if (r.ok && onCodeSyncSuccess) onCodeSyncSuccess(r.lastUpdatedAt);
    });
    setRegularSaveNotice(null);
  };

  /**
   * Xuất Excel (.xlsx) nhận xét của tháng:
   * Các cột bắt buộc:
   * 1. STT
   * 2. Mã học sinh
   * 3. Họ và tên
   * 4. Ngày sinh
   * 5. Tháng
   * 6. Nội dung nhận xét môn học và hoạt động giáo dục
   * 7. Nhận xét năng lực đặc thù
   * 8. Nhận xét phẩm chất chủ yếu
   * Định dạng: General, đóng khung toàn bộ nội dung, tên sheet: "TH-CN (Tin học)", đuôi ".xlsx"
   */
  const handleExportRegularExcel = async () => {
    if (!activeClass) return;

    const headers = [
      "STT",
      "Mã học sinh",
      "Họ và tên",
      "Ngày sinh",
      "Tháng",
      "Nội dung nhận xét môn học và hoạt động giáo dục",
      "Nhận xét năng lực đặc thù",
      "Nhận xét phẩm chất chủ yếu",
    ];

    const monthDisplayValue = currentMonthMeta.monthNum || selectedMonth;

    const rows: (string | number)[][] = currentRegularRows.map((r, idx) => [
      idx + 1,
      r.studentCode,
      r.studentName,
      r.birthDate,
      monthDisplayValue,
      r.subjectContent,
      r.specificCompContent,
      r.qualityContent,
    ]);

    const blob = await generateCircular27ExcelBlob({
      sheetName: "TH-CN (Tin học)",
      headers,
      rows,
      colWidths: [8, 16, 26, 15, 10, 48, 44, 44],
      centeredColIndices: [0, 1, 3, 4],
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `NhanXetThang_${activeClass.name.replace(/\s+/g, "_")}_Thang_${selectedMonth}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Nút "Lấy dữ liệu & AI Phân tích theo Thông tư 27" cho Đánh giá định kỳ (Giữa HK1, Cuối HK1, Giữa HK2, Cuối HK2)
  const handleFetchAndAnalyzePeriodic = async () => {
    if (!activeClass) return;
    setIsFetchingPeriodicAI(true);
    setPeriodicSaveNotice(null);

    try {
      const classSubmissions = submissions.filter(
        (s) =>
          s.className.trim().toLowerCase() === activeClass.name.trim().toLowerCase()
      );

      const baseRows = activeClass.students.map((st, idx) => {
        const periodicSub = findPeriodicSubmissionForStudent(
          st,
          selectedPeriodicTerm,
          classSubmissions,
          assignments
        );
        const monthlySubs = getMonthlyStudySubmissionsForTerm(
          st,
          selectedPeriodicTerm,
          classSubmissions,
          assignments
        );
        return buildCircular27PeriodicEvaluationForStudent({
          student: st,
          studentIdx: idx,
          grade: activeClass.grade,
          termKey: selectedPeriodicTerm,
          matchedSubmission: periodicSub,
          monthlyStudySubmissions: monthlySubs,
        });
      });

      const eligibleRows = baseRows.filter(
        (r) => r.isEligible && r.periodicScore !== null
      );

      if (eligibleRows.length === 0) {
        const nextMap = { ...periodicRecordsByMap, [periodicKey]: baseRows };
        setPeriodicRecordsByMap(nextMap);
        syncStateToCodebase({ tt27PeriodicRecords: nextMap }).then((r) => {
          if (r.ok && onCodeSyncSuccess) onCodeSyncSuccess(r.lastUpdatedAt);
        });
        setPeriodicSaveNotice(
          `⚠️ Lớp ${activeClass.name} chưa có học sinh nào đủ điều kiện đánh giá định kỳ (${currentPeriodicTermMeta.label}). Bắt buộc phải có kết quả làm bài giữa kì và kết quả học tập các tháng. Hệ thống không tự bịa ra kết quả!`
        );
        return;
      }

      try {
        const response = await fetch("/api/ai/evaluate-tt27", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "periodic",
            grade: activeClass.grade,
            className: activeClass.name,
            periodLabel: currentPeriodicTermMeta.label,
            studentsData: eligibleRows.map((r) => {
              const st = activeClass.students.find((s) => s.id === r.studentId)!;
              const monthlySubs = getMonthlyStudySubmissionsForTerm(
                st,
                selectedPeriodicTerm,
                classSubmissions,
                assignments
              );
              return {
                studentId: r.studentId,
                studentName: r.studentName,
                birthDate: r.birthDate,
                periodicScore: r.periodicScore,
                examTitle: r.sourceExamTitle,
                monthlyLearningScores: monthlySubs.map((m) => ({
                  title: m.assignmentTitle,
                  score: m.finalScore,
                })),
              };
            }),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.evaluations) && data.evaluations.length > 0) {
            const merged = baseRows.map((row) => {
              if (!row.isEligible || row.periodicScore === null) return row;
              const aiItem = data.evaluations.find(
                (e: any) => e.studentId === row.studentId
              );
              if (!aiItem) return row;
              const validLevel = (val: any): "T" | "H" | "C" | "" =>
                val === "T" || val === "H" || val === "C" ? val : row.finalLevel;
              return {
                ...row,
                midtermLevel: validLevel(aiItem.midtermLevel),
                finalLevel: validLevel(aiItem.finalLevel),
                periodicScore:
                  typeof aiItem.periodicScore === "number"
                    ? aiItem.periodicScore
                    : row.periodicScore,
                commentCode: aiItem.commentCode || row.commentCode,
                commentContent: aiItem.commentContent || row.commentContent,
                specificCompContent:
                  aiItem.specificCompContent || row.specificCompContent,
                qualityContent: aiItem.qualityContent || row.qualityContent,
              };
            });
            const nextMap = { ...periodicRecordsByMap, [periodicKey]: merged };
            setPeriodicRecordsByMap(nextMap);
            syncStateToCodebase({ tt27PeriodicRecords: nextMap }).then((r) => {
              if (r.ok && onCodeSyncSuccess) onCodeSyncSuccess(r.lastUpdatedAt);
            });
            setPeriodicSaveNotice(
              `Đã lấy dữ liệu và AI phân tích Thông tư 27 (${currentPeriodicTermMeta.label}) cho ${eligibleRows.length}/${baseRows.length} học sinh đủ điều kiện (có bài KT giữa kì & kết quả học tập các tháng). ${baseRows.length - eligibleRows.length} học sinh chưa đủ điều kiện không có dữ liệu!`
            );
            return;
          }
        }
      } catch {
        // Fallback sử dụng kết quả chuẩn Thông tư 27 cho học sinh đủ điều kiện
      }

      const nextMap = { ...periodicRecordsByMap, [periodicKey]: baseRows };
      setPeriodicRecordsByMap(nextMap);
      syncStateToCodebase({ tt27PeriodicRecords: nextMap }).then((r) => {
        if (r.ok && onCodeSyncSuccess) onCodeSyncSuccess(r.lastUpdatedAt);
      });
      setPeriodicSaveNotice(
        `Đã cập nhật đánh giá định kỳ (${currentPeriodicTermMeta.label}) cho ${eligibleRows.length}/${baseRows.length} học sinh đủ điều kiện (${baseRows.length - eligibleRows.length} học sinh chưa đủ điều kiện giữ nguyên không có dữ liệu)!`
      );
    } finally {
      setIsFetchingPeriodicAI(false);
    }
  };

  // Lưu kết quả đánh giá định kỳ
  const handleSavePeriodic = () => {
    if (!activeClass) return;
    const updatedMap = {
      ...periodicRecordsByMap,
      [periodicKey]: currentPeriodicRows,
    };
    setPeriodicRecordsByMap(updatedMap);
    syncStateToCodebase({ tt27PeriodicRecords: updatedMap }).then((r) => {
      if (r.ok && onCodeSyncSuccess) onCodeSyncSuccess(r.lastUpdatedAt);
    });
    setPeriodicSaveNotice(
      `Đã lưu (Ghi) kết quả đánh giá định kỳ ${currentPeriodicTermMeta.label} cho ${activeClass.name} (${currentPeriodicRows.length} học sinh) trực tiếp vào code hệ thống!`
    );
  };

  // Cập nhật từng ô trong bảng Đánh giá định kỳ
  const handleUpdatePeriodicCell = (
    studentId: string,
    field: keyof PeriodicEvaluationRow,
    value: any
  ) => {
    const nextRows = currentPeriodicRows.map((row) => {
      if (row.studentId !== studentId) return row;
      const updated = { ...row, [field]: value };
      if (field === "periodicScore") {
        if (value === null || value === "" || value === undefined) {
          updated.periodicScore = null;
          updated.finalLevel = "";
          updated.midtermLevel = "";
        } else {
          const num = Number(value);
          if (!Number.isNaN(num)) {
            updated.periodicScore = num;
            const autoLevel: "T" | "H" | "C" =
              num >= 8.0 ? "T" : num >= 5.0 ? "H" : "C";
            updated.finalLevel = autoLevel;
            updated.midtermLevel = autoLevel;
          }
        }
      }
      return updated;
    });
    const nextMap = { ...periodicRecordsByMap, [periodicKey]: nextRows };
    setPeriodicRecordsByMap(nextMap);
    syncStateToCodebase({ tt27PeriodicRecords: nextMap }).then((r) => {
      if (r.ok && onCodeSyncSuccess) onCodeSyncSuccess(r.lastUpdatedAt);
    });
    setPeriodicSaveNotice(null);
  };

  /**
   * Xuất Excel (.xlsx) nhận xét của Đánh giá định kỳ (Giữa HK1, Cuối HK1, Giữa HK2, Cuối HK2):
   * Các cột bắt buộc (11 cột):
   * 1. STT
   * 2. Mã học sinh
   * 3. Họ và tên
   * 4. Ngày sinh
   * 5. Mức đạt được
   * 6. điểm KTĐK
   * 7. Mã nhận xét
   * 8. Nội dung nhận xét môn học
   * 9. Thời điểm đánh giá (mặc định "GK1" cho Giữa HK1, "CK1" cho Cuối HK1, "GK2" cho Giữa HK2, "CK2" cho Cuối HK2)
   * 10. Nhận xét năng lực đặc thù
   * 11. Nhận xét phẩm chất chủ yếu
   * Tất cả các cột đều định dạng General, đóng khung toàn bộ nội dung, tên sheet "TH-CN (Tin học)", đuôi ".xlsx"
   */
  const handleExportPeriodicExcel = async () => {
    if (!activeClass) return;

    const defaultPeriodCode = currentPeriodicTermMeta.periodCode; // "GK1" | "CK1" | "GK2" | "CK2"
    const isEnd = currentPeriodicTermMeta.isEndTerm;

    const headers = [
      "STT",
      "Mã học sinh",
      "Họ và tên",
      "Ngày sinh",
      "Mức đạt được",
      "điểm KTĐK",
      "Mã nhận xét",
      "Nội dung nhận xét môn học",
      "Thời điểm đánh giá",
      "Nhận xét năng lực đặc thù",
      "Nhận xét phẩm chất chủ yếu",
    ];

    const rows: (string | number)[][] = currentPeriodicRows.map((r, idx) => {
      const levelVal = isEnd ? r.finalLevel : r.midtermLevel;
      const periodCodeVal = defaultPeriodCode;
      return [
        idx + 1,
        r.studentCode,
        r.studentName,
        r.birthDate,
        levelVal || "",
        r.periodicScore !== null && r.periodicScore !== undefined ? r.periodicScore : "",
        r.commentCode || "",
        r.commentContent || "",
        periodCodeVal,
        r.specificCompContent || "",
        r.qualityContent || "",
      ];
    });

    const blob = await generateCircular27ExcelBlob({
      sheetName: "TH-CN (Tin học)",
      headers,
      rows,
      colWidths: [8, 16, 26, 15, 15, 13, 15, 45, 18, 42, 42],
      centeredColIndices: [0, 1, 3, 4, 5, 6, 8],
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `DanhGiaDinhKy_${defaultPeriodCode}_${activeClass.name.replace(/\s+/g, "_")}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0284C7]">
            <BookOpenCheck className="w-4 h-4" />
            <span>
              PHÂN HỆ NHẬN XÉT &amp; ĐÁNH GIÁ HỌC SINH TIỂU HỌC THEO THÔNG TƯ 27/2020/TT-BGDĐT
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Sổ Nhận Xét Đánh Giá Thường Xuyên (Tháng) &amp; Đánh Giá Định Kỳ (Học Kỳ)
          </h2>
          <p className="text-xs text-slate-600">
            Tự động lấy dữ liệu bài kiểm tra hàng tháng / định kỳ của lớp, AI phân tích chính xác theo Thông tư 27 của Bộ GD&amp;ĐT và xuất tệp Excel (.xlsx) chuẩn sheet <strong>&quot;TH-CN (Tin học)&quot;</strong> (định dạng General, đóng khung đầy đủ).
          </p>
        </div>

        {/* 2 Nút chuyển đổi: 1- Nhận xét đánh giá thường xuyên | 2- Đánh giá định kỳ */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0 self-start">
          <button
            type="button"
            onClick={() => setSubTab("regular_monthly")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              subTab === "regular_monthly"
                ? "bg-[#0E6BA8] text-white shadow-xs"
                : "text-slate-700 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Nhận xét đánh giá thường xuyên (Tháng)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("periodic_semester")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              subTab === "periodic_semester"
                ? "bg-[#0E6BA8] text-white shadow-xs"
                : "text-slate-700 hover:text-slate-900"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>2. Đánh giá định kỳ (Giữa HK1, Cuối HK1, Giữa HK2, Cuối HK2)</span>
          </button>
        </div>
      </div>

      {subTab === "regular_monthly" ? (
        /* =====================================================================
           MỤC 1: 5.3.4. NHẬP ĐÁNH GIÁ THƯỜNG XUYÊN (THEO THÁNG - THÔNG TƯ 27)
           ===================================================================== */
        <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs">
          {/* Thanh tiêu đề & nút hành động */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4 shrink-0">
                <span className="bg-orange-500 rounded-[1px]" />
                <span className="bg-emerald-500 rounded-[1px]" />
                <span className="bg-sky-500 rounded-[1px]" />
                <span className="bg-amber-400 rounded-[1px]" />
              </div>
              <h3 className="text-sm font-bold text-[#0E6BA8]">
                5.3.4. Nhập đánh giá thường xuyên (Theo Thông tư 27/2020/TT-BGDĐT)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isFetchingRegularAI}
                onClick={handleFetchAndAnalyzeRegularMonthly}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors cursor-pointer"
              >
                {isFetchingRegularAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lấy dữ liệu &amp; AI phân tích TT27...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Lấy dữ liệu bài KT tháng &amp; AI Phân tích TT27</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportRegularExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1D70B8] hover:bg-[#155996] rounded-md transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Xuất Excel (.xlsx - Sheet: TH-CN (Tin học))</span>
              </button>

              <button
                type="button"
                onClick={handleSaveRegularMonthly}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#1D70B8] hover:bg-[#155996] rounded-md transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu (Ghi)</span>
              </button>
            </div>
          </div>

          {/* Thanh bộ lọc: Khối | Lớp | Môn học | Tháng năm | Loại đánh giá */}
          <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 whitespace-nowrap">Khối:</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0E6BA8]"
              >
                <option value="Lớp 3">Khối 3</option>
                <option value="Lớp 4">Khối 4</option>
                <option value="Lớp 5">Khối 5</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 whitespace-nowrap">Lớp:</label>
              <select
                value={activeClass?.id || ""}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0E6BA8]"
              >
                {matchingClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.students.length} HS)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 whitespace-nowrap">Sheet Môn học:</label>
              <div className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-800">
                TH-CN (Tin học)
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 whitespace-nowrap">Tháng năm:</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setRegularSaveNotice(null);
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-[#0E6BA8] focus:outline-none focus:border-[#0E6BA8]"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 whitespace-nowrap">
                Loại đánh giá:
              </label>
              <select
                value={regularCategoryFilter}
                onChange={(e) => setRegularCategoryFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0E6BA8]"
              >
                <option value="all">Tất cả (4 nhóm tiêu chí Thông tư 27)</option>
                <option value="subject">1. Môn học và hoạt động giáo dục</option>
                <option value="general_comp">2. Nhận xét năng lực chung</option>
                <option value="specific_comp">3. Nhận xét năng lực đặc thù</option>
                <option value="quality">4. Nhận xét phẩm chất chủ yếu</option>
              </select>
            </div>
          </div>

          {/* Thanh thống kê trạng thái bài kiểm tra của tháng */}
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-semibold text-slate-700">Dữ liệu Tháng {selectedMonth}:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Đã có điểm KT tháng: {currentRegularRows.filter((r) => r.monthlyScoreRef !== null).length} / {currentRegularRows.length} HS
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Chưa làm bài KT tháng: {currentRegularRows.filter((r) => r.monthlyScoreRef === null).length} HS (Không có dữ liệu, AI không tự bịa)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 italic">
              * Học sinh chưa làm bài kiểm tra tháng sẽ không có dữ liệu; AI phân tích không tự bịa ra nhận xét.
            </div>
          </div>

          {regularSaveNotice && (
            <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{regularSaveNotice}</span>
            </div>
          )}

          {/* BẢNG ĐÁNH GIÁ THƯỜNG XUYÊN (4 NHÓM TIÊU CHÍ x 2 CỘT CON: MÃ NHẬN XÉT & NỘI DUNG) */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-[1400px]">
              <thead>
                <tr className="bg-[#0B6699] text-white text-center font-bold border-b border-[#09537d]">
                  <th
                    rowSpan={2}
                    className="py-3 px-2.5 border-r border-[#217db0] w-12"
                  >
                    STT
                  </th>
                  <th
                    rowSpan={2}
                    className="py-3 px-3 border-r border-[#217db0] text-left min-w-[170px]"
                  >
                    Họ và tên / Mã HS
                  </th>
                  <th
                    rowSpan={2}
                    className="py-3 px-3 border-r border-[#217db0] w-28"
                  >
                    Ngày sinh
                  </th>
                  {(regularCategoryFilter === "all" ||
                    regularCategoryFilter === "subject") && (
                    <th
                      colSpan={2}
                      className="py-2 px-3 border-r border-[#217db0]"
                    >
                      Môn học và hoạt động giáo dục
                    </th>
                  )}
                  {(regularCategoryFilter === "all" ||
                    regularCategoryFilter === "general_comp") && (
                    <th
                      colSpan={2}
                      className="py-2 px-3 border-r border-[#217db0]"
                    >
                      Nhận xét năng lực chung
                    </th>
                  )}
                  {(regularCategoryFilter === "all" ||
                    regularCategoryFilter === "specific_comp") && (
                    <th
                      colSpan={2}
                      className="py-2 px-3 border-r border-[#217db0]"
                    >
                      Nhận xét năng lực đặc thù
                    </th>
                  )}
                  {(regularCategoryFilter === "all" ||
                    regularCategoryFilter === "quality") && (
                    <th colSpan={2} className="py-2 px-3">
                      Nhận xét phẩm chất chủ yếu
                    </th>
                  )}
                </tr>
                <tr className="bg-[#0E6BA8] text-white text-center font-semibold border-b border-slate-300">
                  {(regularCategoryFilter === "all" ||
                    regularCategoryFilter === "subject") && (
                    <>
                      <th className="py-2 px-2 border-r border-[#217db0] w-24">
                        Mã nhận xét
                      </th>
                      <th className="py-2 px-3 border-r border-[#217db0] min-w-[240px]">
                        Nội dung nhận xét môn học và hoạt động giáo dục
                      </th>
                    </>
                  )}
                  {(regularCategoryFilter === "all" ||
                    regularCategoryFilter === "general_comp") && (
                    <>
                      <th className="py-2 px-2 border-r border-[#217db0] w-24">
                        Mã nhận xét
                      </th>
                      <th className="py-2 px-3 border-r border-[#217db0] min-w-[240px]">
                        Nội dung
                      </th>
                    </>
                  )}
                  {(regularCategoryFilter === "all" ||
                    regularCategoryFilter === "specific_comp") && (
                    <>
                      <th className="py-2 px-2 border-r border-[#217db0] w-24">
                        Mã nhận xét
                      </th>
                      <th className="py-2 px-3 border-r border-[#217db0] min-w-[240px]">
                        Nội dung nhận xét năng lực đặc thù
                      </th>
                    </>
                  )}
                  {(regularCategoryFilter === "all" ||
                    regularCategoryFilter === "quality") && (
                    <>
                      <th className="py-2 px-2 border-r border-[#217db0] w-24">
                        Mã nhận xét
                      </th>
                      <th className="py-2 px-3 min-w-[240px]">
                        Nội dung nhận xét phẩm chất chủ yếu
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentRegularRows.map((row, idx) => {
                  const isUntested = row.monthlyScoreRef === null;
                  return (
                    <tr
                      key={row.studentId}
                      className="hover:bg-sky-50/40 transition-colors align-top"
                    >
                      <td className="py-2.5 px-2.5 text-center font-mono text-slate-700 border-r border-slate-200 bg-slate-50/60">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 bg-slate-50/40">
                        <div className="font-semibold text-slate-900">
                          {row.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {row.studentCode}
                          {!isUntested ? (
                            <span className="ml-1.5 text-[#0E6BA8] font-semibold">
                              · ĐKT: {row.monthlyScoreRef?.toFixed(1)}đ
                            </span>
                          ) : (
                            <span className="ml-1.5 inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px] font-medium">
                              <AlertTriangle className="w-2.5 h-2.5" /> Chưa làm bài KT tháng
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700 border-r border-slate-200 bg-slate-50/40 whitespace-nowrap">
                        {row.birthDate}
                      </td>

                      {/* 1. Môn học và hoạt động giáo dục */}
                      {(regularCategoryFilter === "all" ||
                        regularCategoryFilter === "subject") && (
                        <>
                          <td className="p-2 border-r border-slate-200">
                            <input
                              type="text"
                              value={row.subjectCode}
                              placeholder={isUntested ? "—" : "Mã"}
                              onChange={(e) =>
                                handleUpdateRegularCell(
                                  row.studentId,
                                  "subjectCode",
                                  e.target.value
                                )
                              }
                              className={`w-full px-2 py-1.5 text-center font-mono text-xs rounded border focus:outline-none ${
                                isUntested
                                  ? "bg-slate-50 text-slate-400 border-slate-200 placeholder:text-slate-400"
                                  : "bg-white text-slate-900 border-slate-300 focus:border-[#0E6BA8]"
                              }`}
                            />
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <textarea
                              rows={3}
                              value={row.subjectContent}
                              placeholder={
                                isUntested
                                  ? `Chưa làm bài kiểm tra tháng (${selectedMonth}) — Không có dữ liệu đánh giá`
                                  : "Nội dung nhận xét môn học..."
                              }
                              onChange={(e) =>
                                handleUpdateRegularCell(
                                  row.studentId,
                                  "subjectContent",
                                  e.target.value
                                )
                              }
                              className={`w-full p-2 text-xs rounded leading-relaxed border focus:outline-none ${
                                isUntested
                                  ? "bg-slate-50/70 text-slate-500 border-slate-200 placeholder:text-slate-400 placeholder:italic"
                                  : "bg-white text-slate-900 border-slate-300 focus:border-[#0E6BA8]"
                              }`}
                            />
                          </td>
                        </>
                      )}

                      {/* 2. Nhận xét năng lực chung */}
                      {(regularCategoryFilter === "all" ||
                        regularCategoryFilter === "general_comp") && (
                        <>
                          <td className="p-2 border-r border-slate-200">
                            <input
                              type="text"
                              value={row.generalCompCode}
                              placeholder={isUntested ? "—" : "Mã"}
                              onChange={(e) =>
                                handleUpdateRegularCell(
                                  row.studentId,
                                  "generalCompCode",
                                  e.target.value
                                )
                              }
                              className={`w-full px-2 py-1.5 text-center font-mono text-xs rounded border focus:outline-none ${
                                isUntested
                                  ? "bg-slate-50 text-slate-400 border-slate-200 placeholder:text-slate-400"
                                  : "bg-white text-slate-900 border-slate-300 focus:border-[#0E6BA8]"
                              }`}
                            />
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <textarea
                              rows={3}
                              value={row.generalCompContent}
                              placeholder={
                                isUntested
                                  ? "Chưa có dữ liệu bài làm — Không có nhận xét"
                                  : "Nội dung nhận xét năng lực chung..."
                              }
                              onChange={(e) =>
                                handleUpdateRegularCell(
                                  row.studentId,
                                  "generalCompContent",
                                  e.target.value
                                )
                              }
                              className={`w-full p-2 text-xs rounded leading-relaxed border focus:outline-none ${
                                isUntested
                                  ? "bg-slate-50/70 text-slate-500 border-slate-200 placeholder:text-slate-400 placeholder:italic"
                                  : "bg-white text-slate-900 border-slate-300 focus:border-[#0E6BA8]"
                              }`}
                            />
                          </td>
                        </>
                      )}

                      {/* 3. Nhận xét năng lực đặc thù */}
                      {(regularCategoryFilter === "all" ||
                        regularCategoryFilter === "specific_comp") && (
                        <>
                          <td className="p-2 border-r border-slate-200">
                            <input
                              type="text"
                              value={row.specificCompCode}
                              placeholder={isUntested ? "—" : "Mã"}
                              onChange={(e) =>
                                handleUpdateRegularCell(
                                  row.studentId,
                                  "specificCompCode",
                                  e.target.value
                                )
                              }
                              className={`w-full px-2 py-1.5 text-center font-mono text-xs rounded border focus:outline-none ${
                                isUntested
                                  ? "bg-slate-50 text-slate-400 border-slate-200 placeholder:text-slate-400"
                                  : "bg-white text-slate-900 border-slate-300 focus:border-[#0E6BA8]"
                              }`}
                            />
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <textarea
                              rows={3}
                              value={row.specificCompContent}
                              placeholder={
                                isUntested
                                  ? "Chưa có dữ liệu bài làm — Không có nhận xét"
                                  : "Nội dung nhận xét năng lực đặc thù Tin học..."
                              }
                              onChange={(e) =>
                                handleUpdateRegularCell(
                                  row.studentId,
                                  "specificCompContent",
                                  e.target.value
                                )
                              }
                              className={`w-full p-2 text-xs rounded leading-relaxed border focus:outline-none ${
                                isUntested
                                  ? "bg-slate-50/70 text-slate-500 border-slate-200 placeholder:text-slate-400 placeholder:italic"
                                  : "bg-white text-slate-900 border-slate-300 focus:border-[#0E6BA8]"
                              }`}
                            />
                          </td>
                        </>
                      )}

                      {/* 4. Nhận xét phẩm chất chủ yếu */}
                      {(regularCategoryFilter === "all" ||
                        regularCategoryFilter === "quality") && (
                        <>
                          <td className="p-2 border-r border-slate-200">
                            <input
                              type="text"
                              value={row.qualityCode}
                              placeholder={isUntested ? "—" : "Mã"}
                              onChange={(e) =>
                                handleUpdateRegularCell(
                                  row.studentId,
                                  "qualityCode",
                                  e.target.value
                                )
                              }
                              className={`w-full px-2 py-1.5 text-center font-mono text-xs rounded border focus:outline-none ${
                                isUntested
                                  ? "bg-slate-50 text-slate-400 border-slate-200 placeholder:text-slate-400"
                                  : "bg-white text-slate-900 border-slate-300 focus:border-[#0E6BA8]"
                              }`}
                            />
                          </td>
                          <td className="p-2">
                            <textarea
                              rows={3}
                              value={row.qualityContent}
                              placeholder={
                                isUntested
                                  ? "Chưa có dữ liệu bài làm — Không có nhận xét"
                                  : "Nội dung nhận xét phẩm chất chủ yếu..."
                              }
                              onChange={(e) =>
                                handleUpdateRegularCell(
                                  row.studentId,
                                  "qualityContent",
                                  e.target.value
                                )
                              }
                              className={`w-full p-2 text-xs rounded leading-relaxed border focus:outline-none ${
                                isUntested
                                  ? "bg-slate-50/70 text-slate-500 border-slate-200 placeholder:text-slate-400 placeholder:italic"
                                  : "bg-white text-slate-900 border-slate-300 focus:border-[#0E6BA8]"
                              }`}
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Thanh chân trang chuẩn CSDL / vnEdu */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Cấu hình xuất Excel (.xlsx):</span>
              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-semibold text-slate-800">
                Sheet: TH-CN (Tin học) · Định dạng: General · Đóng khung 8 cột chuẩn
              </span>
            </div>
            <div className="font-semibold text-slate-700">
              Dòng 1 đến {currentRegularRows.length} / {currentRegularRows.length} học sinh
            </div>
          </div>
        </div>
      ) : (
        /* =====================================================================
           MỤC 2: 5.3.1. ĐÁNH GIÁ ĐỊNH KỲ MÔN HỌC VÀ HOẠT ĐỘNG GIÁO DỤC (THÔNG TƯ 27)
           (Giữa HK1 -> GK1, Cuối HK1 -> CK1, Giữa HK2 -> GK2, Cuối HK2 -> CK2)
           ===================================================================== */
        <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs">
          {/* Thanh tiêu đề & nút hành động */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4 shrink-0">
                <span className="bg-orange-500 rounded-[1px]" />
                <span className="bg-emerald-500 rounded-[1px]" />
                <span className="bg-sky-500 rounded-[1px]" />
                <span className="bg-amber-400 rounded-[1px]" />
              </div>
              <h3 className="text-sm font-bold text-[#0E6BA8]">
                5.3.1. Đánh giá định kỳ môn học và hoạt động giáo dục (Theo Thông tư 27/2020/TT-BGDĐT)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isFetchingPeriodicAI}
                onClick={handleFetchAndAnalyzePeriodic}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors cursor-pointer"
              >
                {isFetchingPeriodicAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lấy dữ liệu &amp; AI phân tích TT27...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Lấy dữ liệu KTĐK &amp; AI Phân tích TT27</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSavePeriodic}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#1D70B8] hover:bg-[#155996] rounded-md transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu (Ghi)</span>
              </button>

              <button
                type="button"
                onClick={handleExportPeriodicExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1D70B8] hover:bg-[#155996] rounded-md transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>
                  Xuất Excel (.xlsx - {currentPeriodicTermMeta.periodCode} - Sheet: TH-CN (Tin học))
                </span>
              </button>
            </div>
          </div>

          {/* Thanh bộ lọc: Khối | Lớp | Môn học | Học kỳ | Thời điểm đánh giá (Nút sổ Giữa HK1, Cuối HK1, Giữa HK2, Cuối HK2) */}
          <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 whitespace-nowrap">Khối:</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0E6BA8]"
              >
                <option value="Lớp 3">Khối 3</option>
                <option value="Lớp 4">Khối 4</option>
                <option value="Lớp 5">Khối 5</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 whitespace-nowrap">Lớp:</label>
              <select
                value={activeClass?.id || ""}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0E6BA8]"
              >
                {matchingClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.students.length} HS)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 whitespace-nowrap">Sheet Môn học:</label>
              <div className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-800">
                TH-CN (Tin học)
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 whitespace-nowrap">Học kỳ:</label>
              <div className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-700">
                {currentPeriodicTermMeta.semesterLabel}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 whitespace-nowrap">
                Kỳ đánh giá:
              </label>
              <select
                value={selectedPeriodicTerm}
                onChange={(e) => {
                  setSelectedPeriodicTerm(e.target.value as PeriodicTermKey);
                  setPeriodicSaveNotice(null);
                }}
                className="px-3 py-1.5 bg-white border-2 border-[#0E6BA8] rounded text-xs font-bold text-[#0E6BA8] focus:outline-none"
              >
                {PERIODIC_TERM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — Mặc định mã: {opt.periodCode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Thanh thống kê điều kiện đánh giá định kỳ */}
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-semibold text-slate-700">Điều kiện Đánh giá ({currentPeriodicTermMeta.label}):</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Đủ điều kiện: {currentPeriodicRows.filter((r) => r.isEligible !== false && r.periodicScore !== null).length} / {currentPeriodicRows.length} HS
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Chưa đủ điều kiện: {currentPeriodicRows.filter((r) => r.isEligible === false || r.periodicScore === null).length} HS (Không có dữ liệu, AI không tự bịa)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 italic">
              * Bắt buộc phải có cả bài kiểm tra định kỳ VÀ kết quả học tập các tháng trong học kỳ thì AI mới phân tích và nhận xét.
            </div>
          </div>

          {periodicSaveNotice && (
            <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{periodicSaveNotice}</span>
            </div>
          )}

          {/* BẢNG ĐÁNH GIÁ ĐỊNH KỲ (ĐẦY ĐỦ 11 CỘT CHUẨN KHI XUẤT EXCEL) */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-[1550px]">
              <thead>
                <tr className="bg-[#0B6699] text-white text-center font-bold border-b border-[#09537d]">
                  <th className="py-3 px-2.5 border-r border-[#217db0] w-12">
                    STT
                  </th>
                  <th className="py-3 px-3 border-r border-[#217db0] w-28">
                    Mã học sinh
                  </th>
                  <th className="py-3 px-3 border-r border-[#217db0] text-left min-w-[175px]">
                    Họ và tên
                  </th>
                  <th className="py-3 px-3 border-r border-[#217db0] w-28">
                    Ngày sinh
                  </th>
                  <th className="py-3 px-3 border-r border-[#217db0] w-36">
                    Mức đạt được
                  </th>
                  <th className="py-3 px-2.5 border-r border-[#217db0] w-24">
                    điểm KTĐK
                  </th>
                  <th className="py-3 px-2.5 border-r border-[#217db0] w-28">
                    Mã nhận xét
                  </th>
                  <th className="py-3 px-3 border-r border-[#217db0] min-w-[260px]">
                    Nội dung nhận xét môn học
                  </th>
                  <th className="py-3 px-2.5 border-r border-[#217db0] w-28">
                    Thời điểm đánh giá
                  </th>
                  <th className="py-3 px-3 border-r border-[#217db0] min-w-[240px]">
                    Nhận xét năng lực đặc thù
                  </th>
                  <th className="py-3 px-3 min-w-[240px]">
                    Nhận xét phẩm chất chủ yếu
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {currentPeriodicRows.map((row, idx) => {
                  const isEnd = currentPeriodicTermMeta.isEndTerm;
                  const activeLevelField = isEnd ? "finalLevel" : "midtermLevel";
                  const activeLevelValue = isEnd ? row.finalLevel : row.midtermLevel;
                  const isEligible = row.isEligible !== false && row.periodicScore !== null;

                  return (
                    <tr
                      key={row.studentId}
                      className="hover:bg-sky-50/40 transition-colors align-top"
                    >
                      <td className="py-2.5 px-2.5 text-center font-mono text-slate-700 border-r border-slate-200 bg-slate-50/60">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700 border-r border-slate-200 bg-slate-50/40">
                        {row.studentCode}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 bg-slate-50/40 font-semibold text-slate-900">
                        <div>{row.studentName}</div>
                        <div className="mt-1">
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-bold">
                              <Check className="w-2.5 h-2.5 text-emerald-600" /> Đủ điều kiện ({row.periodicScore}đ)
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px] font-medium"
                              title={row.sourceExamTitle}
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" /> {row.sourceExamTitle}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700 border-r border-slate-200 bg-slate-50/40 whitespace-nowrap">
                        {row.birthDate}
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <select
                          value={activeLevelValue}
                          onChange={(e) =>
                            handleUpdatePeriodicCell(
                              row.studentId,
                              activeLevelField,
                              e.target.value as "T" | "H" | "C" | ""
                            )
                          }
                          className={`w-full px-2 py-2 text-xs font-bold rounded border focus:outline-none ${
                            activeLevelValue === "T"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : activeLevelValue === "H"
                              ? "bg-sky-50 text-sky-900 border-sky-300"
                              : activeLevelValue === "C"
                              ? "bg-amber-50 text-amber-900 border-amber-300"
                              : "bg-slate-100 text-slate-500 border-slate-300"
                          }`}
                        >
                          <option value="">-- Chưa đánh giá --</option>
                          <option value="T">T (Hoàn thành tốt)</option>
                          <option value="H">H (Hoàn thành)</option>
                          <option value="C">C (Chưa hoàn thành)</option>
                        </select>
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.5}
                          value={row.periodicScore !== null && row.periodicScore !== undefined ? row.periodicScore : ""}
                          placeholder="—"
                          onChange={(e) =>
                            handleUpdatePeriodicCell(
                              row.studentId,
                              "periodicScore",
                              e.target.value === "" ? null : Number(e.target.value)
                            )
                          }
                          className={`w-full px-2 py-1.5 text-center font-mono text-sm font-bold border rounded focus:outline-none ${
                            row.periodicScore !== null
                              ? "text-[#0E6BA8] bg-white border-slate-300 focus:border-[#0E6BA8]"
                              : "text-slate-400 bg-slate-50 border-slate-200 placeholder:text-slate-400"
                          }`}
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={row.commentCode}
                          placeholder={!isEligible ? "—" : "Mã"}
                          onChange={(e) =>
                            handleUpdatePeriodicCell(
                              row.studentId,
                              "commentCode",
                              e.target.value
                            )
                          }
                          className={`w-full px-2 py-1.5 text-center font-mono text-xs rounded border focus:outline-none ${
                            !isEligible
                              ? "bg-slate-50 text-slate-400 border-slate-200 placeholder:text-slate-400"
                              : "bg-white text-slate-900 border-slate-300 focus:border-[#0E6BA8]"
                          }`}
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <textarea
                          rows={3}
                          value={row.commentContent}
                          placeholder={
                            !isEligible
                              ? `Chưa đủ điều kiện: ${row.sourceExamTitle} — Không có nhận xét`
                              : "Nội dung nhận xét môn học..."
                          }
                          onChange={(e) =>
                            handleUpdatePeriodicCell(
                              row.studentId,
                              "commentContent",
                              e.target.value
                            )
                          }
                          className={`w-full p-2 text-xs rounded leading-relaxed border focus:outline-none ${
                            !isEligible
                              ? "bg-slate-50/70 text-slate-500 border-slate-200 placeholder:text-slate-400 placeholder:italic"
                              : "bg-white text-slate-900 border-slate-300 focus:border-[#0E6BA8]"
                          }`}
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        <span className="inline-block px-2.5 py-1.5 font-mono text-xs font-bold bg-sky-50 text-[#0E6BA8] border border-sky-200 rounded">
                          {currentPeriodicTermMeta.periodCode}
                        </span>
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <textarea
                          rows={3}
                          value={row.specificCompContent}
                          placeholder={
                            !isEligible
                              ? "Chưa có dữ liệu bài làm — Không có nhận xét"
                              : "Nhận xét năng lực đặc thù..."
                          }
                          onChange={(e) =>
                            handleUpdatePeriodicCell(
                              row.studentId,
                              "specificCompContent",
                              e.target.value
                            )
                          }
                          className={`w-full p-2 text-xs rounded leading-relaxed border focus:outline-none ${
                            !isEligible
                              ? "bg-slate-50/70 text-slate-500 border-slate-200 placeholder:text-slate-400 placeholder:italic"
                              : "bg-white text-slate-900 border-slate-300 focus:border-[#0E6BA8]"
                          }`}
                        />
                      </td>
                      <td className="p-2">
                        <textarea
                          rows={3}
                          value={row.qualityContent}
                          placeholder={
                            !isEligible
                              ? "Chưa có dữ liệu bài làm — Không có nhận xét"
                              : "Nhận xét phẩm chất chủ yếu..."
                          }
                          onChange={(e) =>
                            handleUpdatePeriodicCell(
                              row.studentId,
                              "qualityContent",
                              e.target.value
                            )
                          }
                          className={`w-full p-2 text-xs rounded leading-relaxed border focus:outline-none ${
                            !isEligible
                              ? "bg-slate-50/70 text-slate-500 border-slate-200 placeholder:text-slate-400 placeholder:italic"
                              : "bg-white text-slate-900 border-slate-300 focus:border-[#0E6BA8]"
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Thanh chân trang */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Cấu hình xuất Excel (.xlsx):</span>
              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-semibold text-slate-800">
                Sheet: TH-CN (Tin học) · Thời điểm: {currentPeriodicTermMeta.periodCode} · Định dạng: General · Đóng khung 11 cột chuẩn
              </span>
            </div>
            <div className="font-semibold text-slate-700">
              Dòng 1 đến {currentPeriodicRows.length} / {currentPeriodicRows.length} học sinh
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
