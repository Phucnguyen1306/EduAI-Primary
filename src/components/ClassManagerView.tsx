import React, { useState, useRef } from "react";
import JSZip from "jszip";
import {
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  UploadCloud,
  X,
  School,
  UserPlus,
  Calendar,
  Download,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertTriangle,
  FolderCheck,
  FolderPlus,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { GradeLevel } from "../types/grading";
import {
  ImportedStudentRow,
  GroupedStudentClassFolder,
  parseStudentExcelFile,
  groupImportedStudentsByClassFolder,
  createSampleStudentExcelFileObject,
} from "../utils/studentExcelParser";
import { INITIAL_CLASSES } from "../data/initialData";
import { parseStudentRosterPdfViaServer } from "../utils/codeSyncEngine";

export { INITIAL_CLASSES };
export type { ImportedStudentRow, GroupedStudentClassFolder };

export interface StudentRecord {
  id: string;
  name: string;
  studentCode: string;
  birthDate: string; // Định dạng DD/MM/YYYY (ví dụ: "02/03/2018")
}

export interface ClassRoom {
  id: string;
  name: string; // e.g., "Lớp 4B"
  grade: GradeLevel; // e.g., "Lớp 4"
  schoolYear: string; // e.g., "2026-2027"
  students: StudentRecord[];
  folderPath?: string; // Thư mục lớp tương ứng (ví dụ: "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_4B")
  rosterApproved?: boolean; // Trạng thái giáo viên đã kiểm tra & duyệt danh sách trước khi làm bài
  isAutoCreatedFromExcel?: boolean; // Đánh dấu lớp được tự động tạo thêm khi tải tệp Excel
}

export interface ParsedStudentRow {
  student: StudentRecord;
  targetClassName: string; // Tên lớp đọc từ cột "Lớp" trong file Excel (nếu có)
}

function getDefaultBirthYearByGrade(grade: GradeLevel): number {
  if (grade === "Lớp 3") return 2018;
  if (grade === "Lớp 4") return 2017;
  return 2016;
}

/**
 * Chuẩn hóa mã lớp để đối chiếu (ví dụ: "Lớp 3A", "lớp 3a", "3A" -> "3A")
 */
function normalizeClassKey(raw: string): string {
  return (raw || "")
    .trim()
    .toUpperCase()
    .replace(/^(KHỐI\s*)?(LỚP|LOP)\s*/i, "")
    .replace(/[\s\-_]+/g, "");
}

/**
 * Định dạng tên lớp hiển thị chuẩn (ví dụ: "3A" -> "Lớp 3A", "Lớp 4B" -> "Lớp 4B")
 */
function formatStandardClassName(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  const cleaned = trimmed.replace(/^(khối\s*)?(lớp|lop)\s*/i, "").trim();
  if (!cleaned) return trimmed;
  return `Lớp ${cleaned.toUpperCase()}`;
}

/**
 * Suy luận Khối lớp (Lớp 3 / Lớp 4 / Lớp 5) từ tên lớp (ví dụ "3A" -> "Lớp 3", "4B" -> "Lớp 4")
 */
function inferGradeFromClassName(
  className: string,
  fallbackGrade: GradeLevel
): GradeLevel {
  const key = normalizeClassKey(className);
  if (key.startsWith("3")) return "Lớp 3";
  if (key.startsWith("4")) return "Lớp 4";
  if (key.startsWith("5")) return "Lớp 5";
  return fallbackGrade;
}

function excelSerialToDateString(serial: number): string {
  const utcDays = Math.round(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const y = date.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

function normalizeBirthDateInput(raw: string, grade: GradeLevel): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) {
    const year = getDefaultBirthYearByGrade(grade);
    return `15/05/${year}`;
  }
  // Nếu là số serial ngày tháng của Excel (ví dụ: 43146)
  if (/^\d{5}(\.\d+)?$/.test(trimmed)) {
    const serial = parseFloat(trimmed);
    if (serial >= 35000 && serial <= 55000) {
      return excelSerialToDateString(serial);
    }
  }
  // Nếu là định dạng YYYY-MM-DD
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split(/[\/\-]/);
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  // Nếu là định dạng D/M/YYYY hoặc DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-]/);
    const d = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${d}/${m}/${y}`;
  }
  return trimmed;
}

function escapeXml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isDateLikeCell(val: string): boolean {
  const v = (val || "").trim();
  if (!v) return false;
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(v)) return true;
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(v)) return true;
  if (/^\d{5}(\.\d+)?$/.test(v)) {
    const num = parseFloat(v);
    return num >= 35000 && num <= 55000;
  }
  return false;
}

function isClassLikeCell(val: string): boolean {
  const v = (val || "").trim();
  if (!v) return false;
  if (/^(khối\s*)?(lớp|lop)\s*[1-5][a-zA-Z0-9]*$/i.test(v)) return true;
  if (/^[1-5][a-zA-Z]\d*$/i.test(v)) return true;
  return false;
}

function isHeaderOrGuideRow(cols: string[]): boolean {
  const joined = cols.join(" ").toLowerCase().trim();
  if (!joined) return true;
  if (
    joined.includes("họ và tên") ||
    joined.includes("họ tên") ||
    joined.includes("ho va ten") ||
    joined.includes("ho ten") ||
    joined.includes("mã học sinh") ||
    joined.includes("mã hs") ||
    joined.includes("ngày sinh") ||
    joined.includes("danh sách học sinh") ||
    joined.includes("biểu mẫu") ||
    joined.includes("form mẫu") ||
    joined.includes("hướng dẫn") ||
    (cols[0]?.toLowerCase().trim() === "stt" && cols.length >= 2)
  ) {
    return true;
  }
  return false;
}

/**
 * Phân tích 1 dòng từ Excel / CSV thành thông tin Học sinh + Lớp đích (nếu có cột Lớp)
 * Chuẩn Form mẫu 5 cột: [STT, Mã Học sinh, Họ và Tên Học sinh, Ngày sinh (DD/MM/YYYY), Lớp]
 */
function parseStudentColumns(
  rawCols: string[],
  idx: number,
  defaultGrade: GradeLevel
): ParsedStudentRow | null {
  const cols = rawCols.map((c) => c.trim().replace(/^["']|["']$/g, ""));
  // Xóa các cột rỗng ở cuối
  while (cols.length > 0 && !cols[cols.length - 1]) {
    cols.pop();
  }
  if (cols.length === 0 || cols.every((c) => !c)) return null;
  if (isHeaderOrGuideRow(cols)) return null;

  let name = "";
  let studentCode = "";
  let rawBirthDate = "";
  let targetClassName = "";

  // Trường hợp 5 cột trở lên theo đúng Form mẫu: [STT, Mã HS, Họ và Tên, Ngày sinh, Lớp]
  if (cols.length >= 5 && /^\d{1,3}$/.test(cols[0])) {
    const c1 = cols[1];
    const c2 = cols[2];
    const c3 = cols[3];
    const c4 = cols[4];

    if (isDateLikeCell(c2)) {
      // [STT, Họ và Tên, Ngày sinh, Mã HS, Lớp]
      name = c1;
      rawBirthDate = c2;
      studentCode = c3;
      targetClassName = c4;
    } else if (isClassLikeCell(c2) && isDateLikeCell(c3)) {
      // [STT, Họ và Tên, Lớp, Ngày sinh, Mã HS]
      name = c1;
      targetClassName = c2;
      rawBirthDate = c3;
      studentCode = c4;
    } else {
      // Chuẩn Form mẫu 5 cột: [STT, Mã Học sinh, Họ và Tên Học sinh, Ngày sinh, Lớp]
      studentCode = c1;
      name = c2;
      rawBirthDate = c3;
      targetClassName = c4;
    }
  } else if (cols.length === 4 && /^\d{1,3}$/.test(cols[0])) {
    // 4 cột bắt đầu bằng STT:
    // Có thể là [STT, Mã HS, Họ và Tên, Ngày sinh] hoặc [STT, Họ và Tên, Ngày sinh, Lớp]
    const c1 = cols[1];
    const c2 = cols[2];
    const c3 = cols[3];

    if (isDateLikeCell(c2) && isClassLikeCell(c3)) {
      // [STT, Họ và Tên, Ngày sinh, Lớp]
      name = c1;
      rawBirthDate = c2;
      targetClassName = c3;
    } else if (isDateLikeCell(c2)) {
      // [STT, Họ và Tên, Ngày sinh, Mã HS]
      name = c1;
      rawBirthDate = c2;
      studentCode = c3;
    } else if (isClassLikeCell(c3) && !isDateLikeCell(c3)) {
      // [STT, Mã HS, Họ và Tên, Lớp]
      studentCode = c1;
      name = c2;
      targetClassName = c3;
    } else {
      // [STT, Mã HS, Họ và Tên, Ngày sinh]
      studentCode = c1;
      name = c2;
      rawBirthDate = c3;
    }
  } else if (cols.length >= 4 && !/^\d{1,3}$/.test(cols[0])) {
    // 4 cột không có STT: [Mã HS, Họ và Tên, Ngày sinh, Lớp]
    studentCode = cols[0];
    name = cols[1];
    rawBirthDate = cols[2];
    targetClassName = cols[3];
  } else if (cols.length === 3 && /^\d{1,3}$/.test(cols[0])) {
    // [STT, Họ và Tên, Ngày sinh] hoặc [STT, Họ và Tên, Lớp]
    name = cols[1];
    if (isClassLikeCell(cols[2]) && !isDateLikeCell(cols[2])) {
      targetClassName = cols[2];
    } else {
      rawBirthDate = cols[2];
    }
  } else if (cols.length === 3) {
    // 3 cột không có STT: [Họ và Tên, Ngày sinh, Lớp] hoặc [Mã HS, Họ và Tên, Ngày sinh]
    if (isDateLikeCell(cols[1])) {
      name = cols[0];
      rawBirthDate = cols[1];
      if (isClassLikeCell(cols[2])) {
        targetClassName = cols[2];
      } else {
        studentCode = cols[2];
      }
    } else if (
      cols[0].length <= 10 &&
      !cols[0].includes(" ") &&
      cols[1].includes(" ")
    ) {
      studentCode = cols[0];
      name = cols[1];
      if (isClassLikeCell(cols[2]) && !isDateLikeCell(cols[2])) {
        targetClassName = cols[2];
      } else {
        rawBirthDate = cols[2];
      }
    } else {
      name = cols[0];
      studentCode = cols[1];
      rawBirthDate = cols[2];
    }
  } else if (cols.length === 2) {
    if (/^\d{1,3}$/.test(cols[0])) {
      name = cols[1];
    } else if (isDateLikeCell(cols[1])) {
      name = cols[0];
      rawBirthDate = cols[1];
    } else if (isClassLikeCell(cols[1])) {
      name = cols[0];
      targetClassName = cols[1];
    } else {
      name = cols[0];
      studentCode = cols[1];
    }
  } else {
    name = cols[0];
  }

  if (!name || /^\d+$/.test(name)) return null;

  const effectiveGrade = targetClassName
    ? inferGradeFromClassName(targetClassName, defaultGrade)
    : defaultGrade;

  return {
    student: {
      id: `stu-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      studentCode:
        studentCode.trim() || `HS${String(idx + 1).padStart(2, "0")}`,
      birthDate: normalizeBirthDateInput(rawBirthDate, effectiveGrade),
    },
    targetClassName: targetClassName.trim(),
  };
}

/**
 * Tạo tệp Form mẫu Excel (.xlsx chuẩn OpenXML) có cột "Lớp" để Giáo viên tải về,
 * khi úp lên nếu có học sinh lớp khác sẽ tự động phân bổ vào đúng lớp trên hệ thống.
 */
async function downloadStudentExcelTemplate(
  className: string,
  grade: GradeLevel
): Promise<void> {
  const zip = new JSZip();
  const birthYear = getDefaultBirthYearByGrade(grade);

  const sampleRows = [
    ["1", "HS301", "Lê Ngọc Khánh An", `15/02/${birthYear}`, className],
    ["2", "HS302", "Vũ Khánh An", `02/03/${birthYear}`, className],
    ["3", "HS401", "Nguyễn Minh Khang", "19/04/2017", "Lớp 4B"],
    ["4", "HS420", "Trần Tuệ Nhi", "18/05/2017", "Lớp 4C"],
    ["5", "HS501", "Phạm Gia Huy", "22/07/2016", "Lớp 5A"],
  ];

  const headers = [
    "STT",
    "Mã học sinh",
    "Họ và tên học sinh",
    "Ngày sinh",
    "Lớp",
  ];

  const colLetters = ["A", "B", "C", "D", "E"];

  let sheetRowsXml = "";

  // Dòng 1: Tiêu đề cột
  sheetRowsXml += `<row r="1" ht="26" customHeight="1">`;
  headers.forEach((h, cIdx) => {
    const cellRef = `${colLetters[cIdx]}1`;
    sheetRowsXml += `<c r="${cellRef}" s="1" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`;
  });
  sheetRowsXml += `</row>`;

  // Các dòng dữ liệu mẫu
  sampleRows.forEach((row, rIdx) => {
    const rowNum = rIdx + 2;
    sheetRowsXml += `<row r="${rowNum}" ht="22" customHeight="1">`;
    row.forEach((val, cIdx) => {
      const cellRef = `${colLetters[cIdx]}${rowNum}`;
      sheetRowsXml += `<c r="${cellRef}" s="2" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
    });
    sheetRowsXml += `</row>`;
  });

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="DanhSachHocSinh" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Times New Roman"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Times New Roman"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0284C7"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="49" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`;

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="8" customWidth="1"/>
    <col min="2" max="2" width="16" customWidth="1"/>
    <col min="3" max="3" width="32" customWidth="1"/>
    <col min="4" max="4" width="24" customWidth="1"/>
    <col min="5" max="5" width="16" customWidth="1"/>
  </cols>
  <sheetData>
    ${sheetRowsXml}
  </sheetData>
</worksheet>`;

  zip.file("[Content_Types].xml", contentTypesXml);
  zip.file("_rels/.rels", rootRelsXml);
  zip.file("xl/workbook.xml", workbookXml);
  zip.file("xl/_rels/workbook.xml.rels", workbookRelsXml);
  zip.file("xl/styles.xml", stylesXml);
  zip.file("xl/worksheets/sheet1.xml", sheetXml);

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const safeClass = className.replace(/\s+/g, "_");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Form_Mau_Danh_Sach_Hoc_Sinh_${safeClass}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Đọc tệp Excel (.xlsx) do Giáo viên tải lên bằng JSZip (hỗ trợ cột Lớp)
 */
async function parseExcelXlsxFile(
  file: File,
  defaultGrade: GradeLevel
): Promise<ParsedStudentRow[]> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  // 1. Đọc bảng chuỗi dùng chung (sharedStrings.xml) nếu có
  const sharedStrings: string[] = [];
  const sharedStringsFile = zip.file("xl/sharedStrings.xml");
  if (sharedStringsFile) {
    const sharedXml = await sharedStringsFile.async("string");
    const parser = new DOMParser();
    const doc = parser.parseFromString(sharedXml, "application/xml");
    const siNodes = Array.from(doc.getElementsByTagName("si"));
    siNodes.forEach((si) => {
      const tNodes = Array.from(si.getElementsByTagName("t"));
      const combined = tNodes.map((t) => t.textContent || "").join("");
      sharedStrings.push(combined);
    });
  }

  // 2. Tìm sheet đầu tiên trong xl/worksheets/
  let sheetFile = zip.file("xl/worksheets/sheet1.xml");
  if (!sheetFile) {
    const worksheetPaths = Object.keys(zip.files).filter((p) =>
      /^xl\/worksheets\/sheet\d+\.xml$/i.test(p)
    );
    if (worksheetPaths.length > 0) {
      sheetFile = zip.file(worksheetPaths[0]);
    }
  }
  if (!sheetFile) return [];

  const sheetXml = await sheetFile.async("string");
  const parser = new DOMParser();
  const doc = parser.parseFromString(sheetXml, "application/xml");
  const rowNodes = Array.from(doc.getElementsByTagName("row"));

  const colRefToIndex = (cellRef: string): number => {
    const match = cellRef.match(/^[A-Z]+/i);
    if (!match) return 0;
    const letters = match[0].toUpperCase();
    let idx = 0;
    for (let i = 0; i < letters.length; i++) {
      idx = idx * 26 + (letters.charCodeAt(i) - 64);
    }
    return idx - 1;
  };

  const results: ParsedStudentRow[] = [];

  rowNodes.forEach((rowNode, rIdx) => {
    const cNodes = Array.from(rowNode.getElementsByTagName("c"));
    const cols: string[] = [];

    cNodes.forEach((cNode, fallbackIdx) => {
      const ref = cNode.getAttribute("r") || "";
      const colIdx = ref ? colRefToIndex(ref) : fallbackIdx;
      const cellType = cNode.getAttribute("t") || "";

      let val = "";
      if (cellType === "s") {
        const vNode = cNode.getElementsByTagName("v")[0];
        const sIdx = parseInt(vNode?.textContent || "-1", 10);
        if (sIdx >= 0 && sIdx < sharedStrings.length) {
          val = sharedStrings[sIdx];
        }
      } else if (cellType === "inlineStr") {
        const tNodes = Array.from(cNode.getElementsByTagName("t"));
        val = tNodes.map((t) => t.textContent || "").join("");
      } else {
        const vNode = cNode.getElementsByTagName("v")[0];
        val = vNode?.textContent || "";
      }

      cols[colIdx] = val;
    });

    const normalizedCols: string[] = [];
    for (let i = 0; i < Math.max(cols.length, 5); i++) {
      normalizedCols.push(cols[i] || "");
    }

    const parsed = parseStudentColumns(normalizedCols, rIdx, defaultGrade);
    if (parsed) {
      results.push(parsed);
    }
  });

  return results;
}

interface ExcelImportReviewSummary {
  fileName: string;
  importedAt: string;
  totalStudents: number;
  analyzedColumns: string[];
  classFolders: {
    classId: string;
    className: string;
    grade: GradeLevel;
    folderPath: string;
    importedCount: number;
    totalCountInClass: number;
    isNewClass: boolean;
    rosterApproved: boolean;
  }[];
}

interface ClassManagerViewProps {
  classes: ClassRoom[];
  onUpdateClasses: (classes: ClassRoom[]) => void;
  onNavigateToStudentPortal?: () => void;
}

export const ClassManagerView: React.FC<ClassManagerViewProps> = ({
  classes,
  onUpdateClasses,
  onNavigateToStudentPortal,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || "");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState<boolean>(false);
  const [importFeedback, setImportFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [excelImportReview, setExcelImportReview] =
    useState<ExcelImportReviewSummary | null>(null);

  React.useEffect(() => {
    if (!classes.some((c) => c.id === selectedClassId) && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Xóa danh sách chọn khi chuyển lớp
  React.useEffect(() => {
    setSelectedStudentIds([]);
    setShowBulkDeleteConfirm(false);
  }, [activeClass?.id]);

  // Modals state
  const [showAddClassModal, setShowAddClassModal] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>("");
  const [newClassGrade, setNewClassGrade] = useState<GradeLevel>("Lớp 4");
  const [newClassYear, setNewClassYear] = useState<string>("2026-2027");

  // Sửa thông tin lớp (Tên lớp + Khối lớp + Năm học)
  const [showEditClassModal, setShowEditClassModal] = useState<boolean>(false);
  const [editClassName, setEditClassName] = useState<string>("");
  const [editClassGrade, setEditClassGrade] = useState<GradeLevel>("Lớp 4");
  const [editClassYear, setEditClassYear] = useState<string>("2026-2027");

  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [studentNameInput, setStudentNameInput] = useState<string>("");
  const [studentCodeInput, setStudentCodeInput] = useState<string>("");
  const [studentBirthDateInput, setStudentBirthDateInput] = useState<string>("");

  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [editStudentName, setEditStudentName] = useState<string>("");
  const [editStudentCode, setEditStudentCode] = useState<string>("");
  const [editStudentBirthDate, setEditStudentBirthDate] = useState<string>("");
  const [editStudentTargetClassId, setEditStudentTargetClassId] = useState<string>("");

  const [showCsvImportModal, setShowCsvImportModal] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [csvText, setCsvText] = useState<string>(
    "1\tHS315\tNguyễn Văn An\t02/03/2018\tLớp 3A\n2\tHS415\tTrần Thị Bình\t15/08/2017\tLớp 4B\n3\tHS425\tLê Hoàng Minh\t19/05/2017\tLớp 4C\n4\tHS515\tLê Vĩnh Cường\t20/11/2016\tLớp 5A"
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);

  // Handlers for Classes
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newClass: ClassRoom = {
      id: `cls-${Date.now()}`,
      name: newClassName.trim(),
      grade: newClassGrade,
      schoolYear: newClassYear.trim() || "2025 - 2026",
      students: [],
    };

    onUpdateClasses([...classes, newClass]);
    setSelectedClassId(newClass.id);
    setNewClassName("");
    setShowAddClassModal(false);
  };

  const handleUpdateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClassName.trim() || !activeClass) return;

    const updated = classes.map((c) =>
      c.id === activeClass.id
        ? {
            ...c,
            name: editClassName.trim(),
            grade: editClassGrade,
            schoolYear: editClassYear.trim() || c.schoolYear || "2025 - 2026",
          }
        : c
    );
    onUpdateClasses(updated);
    setShowEditClassModal(false);
    setImportFeedback({
      type: "success",
      message: `Đã cập nhật thông tin lớp "${editClassName.trim()}" (${editClassGrade} · Năm học: ${editClassYear.trim() || "2025 - 2026"}).`,
    });
  };

  const handleDeleteClass = (classId: string) => {
    if (classes.length <= 1) {
      return;
    }
    const remaining = classes.filter((c) => c.id !== classId);
    onUpdateClasses(remaining);
    setSelectedClassId(remaining[0]?.id || "");
  };

  // Handlers for Students
  const handleAddStudentManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNameInput.trim() || !activeClass) return;

    const newStudent: StudentRecord = {
      id: `stu-${Date.now()}`,
      name: studentNameInput.trim(),
      studentCode:
        studentCodeInput.trim() || `HS${Math.floor(100 + Math.random() * 900)}`,
      birthDate: normalizeBirthDateInput(studentBirthDateInput, activeClass.grade),
    };

    const updated = classes.map((c) =>
      c.id === activeClass.id ? { ...c, students: [...c.students, newStudent] } : c
    );
    onUpdateClasses(updated);
    setStudentNameInput("");
    setStudentCodeInput("");
    setStudentBirthDateInput("");
    setShowAddStudentModal(false);
  };

  const handleSaveEditedStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !activeClass || !editStudentName.trim()) return;

    const targetClsId = editStudentTargetClassId || activeClass.id;
    const targetCls = classes.find((c) => c.id === targetClsId) || activeClass;

    const updatedStudent: StudentRecord = {
      ...editingStudent,
      name: editStudentName.trim(),
      studentCode: editStudentCode.trim() || editingStudent.studentCode,
      birthDate: normalizeBirthDateInput(editStudentBirthDate, targetCls.grade),
    };

    if (targetCls.id === activeClass.id) {
      const updated = classes.map((c) =>
        c.id === activeClass.id
          ? {
              ...c,
              students: c.students.map((s) =>
                s.id === editingStudent.id ? updatedStudent : s
              ),
            }
          : c
      );
      onUpdateClasses(updated);
    } else {
      // Chuyển học sinh sang thư mục lớp khác
      const updated = classes.map((c) => {
        if (c.id === activeClass.id) {
          return {
            ...c,
            students: c.students.filter((s) => s.id !== editingStudent.id),
          };
        }
        if (c.id === targetCls.id) {
          return {
            ...c,
            students: [...c.students, updatedStudent],
          };
        }
        return c;
      });
      onUpdateClasses(updated);
      setImportFeedback({
        type: "success",
        message: `Đã cập nhật và chuyển học sinh "${updatedStudent.name}" sang thư mục ${targetCls.name}.`,
      });
    }

    setEditingStudent(null);
  };

  // Duyệt danh sách học sinh của lớp hiện tại trước khi cho học sinh làm bài kiểm tra
  const handleApproveClassRoster = (classId: string) => {
    const target = classes.find((c) => c.id === classId);
    if (!target) return;
    const updated = classes.map((c) =>
      c.id === classId ? { ...c, rosterApproved: true } : c
    );
    onUpdateClasses(updated);
    setExcelImportReview((prev) =>
      prev
        ? {
            ...prev,
            classFolders: prev.classFolders.map((cf) =>
              cf.classId === classId ? { ...cf, rosterApproved: true } : cf
            ),
          }
        : null
    );
    setImportFeedback({
      type: "success",
      message: `Đã duyệt danh sách chính thức của ${target.name} (${target.students.length} học sinh). Học sinh của lớp đã sẵn sàng làm bài kiểm tra!`,
    });
  };

  // Duyệt toàn bộ các lớp vừa được phân nhóm từ tệp Excel
  const handleApproveAllImportedClasses = () => {
    const updated = classes.map((c) => ({ ...c, rosterApproved: true }));
    onUpdateClasses(updated);
    setExcelImportReview((prev) =>
      prev
        ? {
            ...prev,
            classFolders: prev.classFolders.map((cf) => ({
              ...cf,
              rosterApproved: true,
            })),
          }
        : null
    );
    setImportFeedback({
      type: "success",
      message: `Đã duyệt toàn bộ danh sách học sinh của ${classes.length} lớp học! Học sinh có thể vào Cổng Học sinh để làm bài kiểm tra.`,
    });
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!activeClass) return;
    const updated = classes.map((c) =>
      c.id === activeClass.id
        ? { ...c, students: c.students.filter((s) => s.id !== studentId) }
        : c
    );
    onUpdateClasses(updated);
    setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
  };

  // Chọn / Bỏ chọn từng học sinh
  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
    setShowBulkDeleteConfirm(false);
  };

  // Chọn tất cả / Bỏ chọn tất cả học sinh trong lớp hiện tại
  const isAllSelected =
    Boolean(activeClass) &&
    activeClass.students.length > 0 &&
    selectedStudentIds.length === activeClass.students.length;

  const handleToggleSelectAll = () => {
    if (!activeClass || activeClass.students.length === 0) return;
    if (isAllSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(activeClass.students.map((s) => s.id));
    }
    setShowBulkDeleteConfirm(false);
  };

  // Xóa hàng loạt học sinh đã chọn
  const handleConfirmBulkDelete = () => {
    if (!activeClass || selectedStudentIds.length === 0) return;
    const selectedSet = new Set(selectedStudentIds);
    const deletedCount = selectedSet.size;

    const updated = classes.map((c) =>
      c.id === activeClass.id
        ? {
            ...c,
            students: c.students.filter((s) => !selectedSet.has(s.id)),
          }
        : c
    );
    onUpdateClasses(updated);
    setSelectedStudentIds([]);
    setShowBulkDeleteConfirm(false);
    setImportFeedback({
      type: "success",
      message: `Đã xóa thành công ${deletedCount} học sinh khỏi ${activeClass.name}.`,
    });
  };

  const parseStudentTextLine = (
    line: string,
    idx: number,
    grade: GradeLevel
  ): ParsedStudentRow | null => {
    const delimiter = line.includes("\t")
      ? "\t"
      : line.includes(";")
      ? ";"
      : ",";
    const parts = line.split(delimiter);
    return parseStudentColumns(parts, idx, grade);
  };

  /**
   * Phân bổ danh sách học sinh vừa nhập từ Excel vào đúng các thư mục lớp trên hệ thống dựa theo cột "Lớp".
   * - Đọc và phân tích cấu trúc 4 cột: Mã học sinh, Họ và tên học sinh, Ngày sinh, Lớp.
   * - Tự động nhóm học sinh vào đúng các thư mục lớp tương ứng; nếu chưa có lớp đó thì tự động tạo lớp thêm.
   * - Hiển thị danh sách lên giao diện "Quản lý Lớp & Học sinh" để giáo viên kiểm tra, thêm bớt hoặc duyệt danh sách trước khi cho học sinh làm bài kiểm tra.
   */
  const applyImportedStudents = (
    parsedRows: ParsedStudentRow[],
    sourceLabel: string,
    uploadedFileName?: string
  ) => {
    if (!activeClass) return;
    if (parsedRows.length === 0) {
      setImportFeedback({
        type: "error",
        message: `Không tìm thấy dòng dữ liệu học sinh hợp lệ từ ${sourceLabel}. Vui lòng kiểm tra lại đúng Form mẫu Excel (gồm các cột: Mã học sinh, Họ và tên học sinh, Ngày sinh, Lớp).`,
      });
      return;
    }

    const updatedClasses: ClassRoom[] = classes.map((c) => ({
      ...c,
      students: [...c.students],
      folderPath:
        c.folderPath ||
        `Drive_GiaoVien/DanhSachLop/ThuMuc_${c.name.replace(/\s+/g, "_")}`,
      rosterApproved: c.rosterApproved ?? true,
    }));

    // Map theo dõi các học sinh được phân về từng thư mục lớp (theo id lớp)
    const groupedByClassId = new Map<string, StudentRecord[]>();
    const newlyCreatedClassIds = new Set<string>();
    const classSummaryCount = new Map<string, number>();

    parsedRows.forEach((row, idx) => {
      const rawClassCell = (row.targetClassName || "").trim();
      let targetClass: ClassRoom | undefined;

      if (rawClassCell) {
        const targetKey = normalizeClassKey(rawClassCell);
        targetClass = updatedClasses.find(
          (c) =>
            normalizeClassKey(c.name) === targetKey ||
            c.name.trim().toLowerCase() === rawClassCell.toLowerCase()
        );

        // Nếu trong file Excel có học sinh thuộc lớp chưa tồn tại trên hệ thống -> tự động tạo thư mục lớp mới
        if (!targetClass) {
          const formattedName = formatStandardClassName(rawClassCell);
          const inferredGrade = inferGradeFromClassName(
            rawClassCell,
            activeClass.grade
          );
          const newClsId = `cls-auto-${Date.now()}-${idx}`;
          const newCls: ClassRoom = {
            id: newClsId,
            name: formattedName,
            grade: inferredGrade,
            schoolYear: activeClass.schoolYear || "2026-2027",
            students: [],
            folderPath: `Drive_GiaoVien/DanhSachLop/ThuMuc_${formattedName.replace(
              /\s+/g,
              "_"
            )}`,
            rosterApproved: false,
            isAutoCreatedFromExcel: true,
          };
          updatedClasses.push(newCls);
          newlyCreatedClassIds.add(newClsId);
          targetClass = newCls;
        }
      } else {
        targetClass =
          updatedClasses.find((c) => c.id === activeClass.id) ||
          updatedClasses[0];
      }

      if (!targetClass) return;

      const list = groupedByClassId.get(targetClass.id) || [];
      // Tránh trùng lặp Mã học sinh + Họ tên nếu ở chế độ nối tiếp (append)
      const existingInTarget =
        importMode === "replace" ? [] : targetClass.students;
      const alreadyExists = [...existingInTarget, ...list].some(
        (s) =>
          s.studentCode.toLowerCase() === row.student.studentCode.toLowerCase() &&
          s.name.toLowerCase() === row.student.name.toLowerCase()
      );
      if (!alreadyExists) {
        list.push(row.student);
      }
      groupedByClassId.set(targetClass.id, list);

      classSummaryCount.set(
        targetClass.name,
        (classSummaryCount.get(targetClass.name) || 0) + 1
      );
    });

    // Cập nhật danh sách học sinh cho từng thư mục lớp có trong file Excel
    const finalClasses = updatedClasses.map((cls) => {
      const incoming = groupedByClassId.get(cls.id);
      if (!incoming) return cls;
      return {
        ...cls,
        rosterApproved: false, // Đặt trạng thái chờ giáo viên kiểm tra & duyệt sau khi tải tệp Excel mới
        students:
          importMode === "replace" ? incoming : [...cls.students, ...incoming],
      };
    });

    onUpdateClasses(finalClasses);
    setShowCsvImportModal(false);

    // Chuyển lớp đang chọn sang lớp đầu tiên có trong tệp Excel để giáo viên kiểm tra ngay
    const firstImportedClassId = Array.from(groupedByClassId.keys())[0];
    if (firstImportedClassId) {
      setSelectedClassId(firstImportedClassId);
    }

    // Tạo báo cáo phân tích cấu trúc cột & phân nhóm thư mục lớp để hiển thị trên giao diện
    const folderSummaries = Array.from(groupedByClassId.entries())
      .map(([clsId, addedList]) => {
        const clsObj = finalClasses.find((c) => c.id === clsId);
        if (!clsObj) return null;
        return {
          classId: clsObj.id,
          className: clsObj.name,
          grade: clsObj.grade,
          folderPath:
            clsObj.folderPath ||
            `Drive_GiaoVien/DanhSachLop/ThuMuc_${clsObj.name.replace(/\s+/g, "_")}`,
          importedCount: addedList.length || classSummaryCount.get(clsObj.name) || 0,
          totalCountInClass: clsObj.students.length,
          isNewClass: newlyCreatedClassIds.has(clsObj.id),
          rosterApproved: Boolean(clsObj.rosterApproved),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    setExcelImportReview({
      fileName: uploadedFileName || sourceLabel,
      importedAt: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      totalStudents: parsedRows.length,
      analyzedColumns: [
        "Mã học sinh",
        "Họ và tên học sinh",
        "Ngày sinh",
        "Lớp",
      ],
      classFolders: folderSummaries,
    });

    const breakdownText = Array.from(classSummaryCount.entries())
      .map(([cName, count]) => {
        const clsObj = finalClasses.find((c) => c.name === cName);
        const newTag =
          clsObj && newlyCreatedClassIds.has(clsObj.id) ? " - Tự động tạo lớp mới" : "";
        return `${cName} (${count} em${newTag})`;
      })
      .join(", ");

    setImportFeedback({
      type: "success",
      message: `Đã đọc & phân tích 4 cột [Mã học sinh, Họ và tên học sinh, Ngày sinh, Lớp] từ ${sourceLabel}. Tự động phân nhóm ${parsedRows.length} học sinh vào các thư mục lớp: ${breakdownText}. Mời Thầy/Cô kiểm tra, thêm bớt hoặc bấm "Duyệt danh sách" bên dưới!`,
    });
  };

  const handleImportCsvText = () => {
    if (!activeClass || !csvText.trim()) return;
    const lines = csvText.split(/\r\n|\n/);
    const parsedRows: ParsedStudentRow[] = [];

    lines.forEach((line, idx) => {
      if (!line.trim()) return;
      const parsed = parseStudentTextLine(line, idx, activeClass.grade);
      if (parsed) parsedRows.push(parsed);
    });

    applyImportedStudents(
      parsedRows,
      "dữ liệu dán từ Excel",
      "Du_Lieu_Dan_Tu_Excel.xlsx"
    );
  };

  const processExcelFileObject = async (file: File) => {
    if (!activeClass) return;
    const lowerName = file.name.toLowerCase();

    try {
      // 1. Hỗ trợ đọc tệp PDF danh sách lớp & học sinh (ví dụ: DS Up.pdf) bằng AI
      if (lowerName.endsWith(".pdf")) {
        setImportFeedback({
          type: "success",
          message: `Đang phân tích toàn bộ các trang trong tệp PDF "${file.name}" và tự động cập nhật danh sách lớp & học sinh vào code...`,
        });
        const pdfResult = await parseStudentRosterPdfViaServer(file);
        if (pdfResult.students && pdfResult.students.length > 0) {
          const parsedRows: ParsedStudentRow[] = pdfResult.students.map((r, idx) => {
            const targetClass = r.className || activeClass.name;
            const inferredGrade = inferGradeFromClassName(
              targetClass,
              activeClass.grade
            );
            return {
              student: {
                id: `stu-pdf-${Date.now()}-${idx}`,
                name: r.studentName.trim(),
                studentCode:
                  r.studentId.trim() || `HS${String(idx + 1).padStart(3, "0")}`,
                birthDate: normalizeBirthDateInput(
                  r.birthDate || "",
                  inferredGrade
                ),
              },
              targetClassName: targetClass.trim(),
            };
          });
          applyImportedStudents(
            parsedRows,
            `tệp PDF "${file.name}"`,
            file.name
          );
          return;
        }
      }

      // 2. Ưu tiên đọc tệp .xlsx / .xls / .csv bằng thư viện chuẩn XLSX (parseStudentExcelFile)
      if (
        lowerName.endsWith(".xlsx") ||
        lowerName.endsWith(".xls") ||
        lowerName.endsWith(".csv")
      ) {
        const importedRows = await parseStudentExcelFile(file, activeClass.name);
        if (importedRows.length > 0) {
          const parsedRows: ParsedStudentRow[] = importedRows.map((r, idx) => {
            const targetClass = r.className || activeClass.name;
            const inferredGrade = inferGradeFromClassName(
              targetClass,
              activeClass.grade
            );
            return {
              student: {
                id: `stu-${Date.now()}-${idx}-${Math.random()
                  .toString(36)
                  .slice(2, 6)}`,
                name: r.studentName.trim(),
                studentCode:
                  r.studentId.trim() || `HS${String(idx + 1).padStart(2, "0")}`,
                birthDate: normalizeBirthDateInput(
                  r.birthDate || "",
                  inferredGrade
                ),
              },
              targetClassName: targetClass.trim(),
            };
          });
          applyImportedStudents(
            parsedRows,
            `tệp Excel "${file.name}"`,
            file.name
          );
          return;
        }
      }

      // 3. Fallback đọc bằng JSZip nếu file .xlsx có cấu trúc bảng đặc biệt
      if (lowerName.endsWith(".xlsx")) {
        const parsedRows = await parseExcelXlsxFile(file, activeClass.grade);
        applyImportedStudents(
          parsedRows,
          `tệp Excel "${file.name}"`,
          file.name
        );
        return;
      }

      // 4. Fallback đọc dạng văn bản (.csv / .txt)
      const text = await file.text();
      if (!text) return;

      const lines = text.split(/\r\n|\n/);
      const parsedRows: ParsedStudentRow[] = [];

      lines.forEach((line, idx) => {
        if (!line.trim()) return;
        const parsed = parseStudentTextLine(line, idx, activeClass.grade);
        if (parsed) parsedRows.push(parsed);
      });

      applyImportedStudents(parsedRows, `tệp "${file.name}"`, file.name);
    } catch {
      setImportFeedback({
        type: "error",
        message: `Không thể đọc tệp "${file.name}". Vui lòng sử dụng đúng Form mẫu Excel (.xlsx) hoặc tệp PDF danh sách học sinh.`,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeClass) return;
    await processExcelFileObject(file);
  };

  // Cho phép giáo viên bấm kiểm thử nhanh quy trình tải tệp 'Form_Mau_Danh_Sach_Hoc_Sinh.xlsx'
  const handleQuickDemoSampleExcelUpload = async () => {
    const sampleFile = createSampleStudentExcelFileObject();
    await processExcelFileObject(sampleFile);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono text-slate-500">
            PHÂN HỆ QUẢN LÝ LỚP HỌC &amp; HỒ SƠ HỌC SINH TIỂU HỌC
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1 text-balance">
            Quản lý Lớp &amp; Học sinh (Tự động phân nhóm Thư mục Lớp từ Excel)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            type="button"
            onClick={handleQuickDemoSampleExcelUpload}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            title="Kiểm thử tự động đọc tệp Form_Mau_Danh_Sach_Hoc_Sinh.xlsx, phân nhóm thư mục lớp và tự tạo lớp mới (ví dụ Lớp 4C)"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Tải mẫu &lsquo;Form_Mau_Danh_Sach_Hoc_Sinh.xlsx&rsquo;
          </button>

          <button
            type="button"
            onClick={() => setShowAddClassModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tạo lớp mới
          </button>
        </div>
      </div>

      {/* BẢNG KIỂM TRA, THÊM BỚT & DUYỆT DANH SÁCH HỌC SINH TỪ TỆP EXCEL */}
      {excelImportReview && (
        <div className="bg-white border-2 border-[#0284C7]/30 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-sky-100 text-[#0284C7]">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Tệp đã tải lên: {excelImportReview.fileName}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Lúc {excelImportReview.importedAt} · Tổng số:{" "}
                  <strong className="text-slate-900">
                    {excelImportReview.totalStudents} học sinh
                  </strong>
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Kết quả Đọc cấu trúc cột &amp; Tự động nhóm Học sinh vào các Thư mục Lớp
              </h3>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-600 font-medium">
                  Đã phân tích chuẩn 4 cột:
                </span>
                {excelImportReview.analyzedColumns.map((colName) => (
                  <span
                    key={colName}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {colName}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleApproveAllImportedClasses}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                Duyệt toàn bộ danh sách ({excelImportReview.classFolders.length} lớp)
              </button>

              {onNavigateToStudentPortal && (
                <button
                  type="button"
                  onClick={() => {
                    handleApproveAllImportedClasses();
                    onNavigateToStudentPortal();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <span>Duyệt &amp; Mở Cổng Học sinh làm bài</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setExcelImportReview(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                title="Ẩn bảng tóm tắt này"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Danh sách các Thư mục Lớp đã được tự động phân nhóm / tạo mới */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">
              Chọn thư mục lớp bên dưới để kiểm tra, thêm bớt hoặc duyệt danh sách học sinh của từng lớp:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {excelImportReview.classFolders.map((cf) => {
                const liveClass = classes.find((c) => c.id === cf.classId);
                const isSelected = activeClass?.id === cf.classId;
                const isApproved = liveClass
                  ? Boolean(liveClass.rosterApproved)
                  : cf.rosterApproved;
                const currentTotal = liveClass
                  ? liveClass.students.length
                  : cf.totalCountInClass;

                return (
                  <div
                    key={cf.classId}
                    onClick={() => setSelectedClassId(cf.classId)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "border-[#0284C7] bg-sky-50/80 ring-2 ring-[#0284C7]/20"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-bold text-sm text-slate-900">
                          {cf.isNewClass ? (
                            <FolderPlus className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <FolderCheck className="w-4 h-4 text-[#0284C7] shrink-0" />
                          )}
                          {cf.className}
                        </span>
                        {cf.isNewClass ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded-md">
                            Tự động tạo lớp mới
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-200 text-slate-700 rounded-md">
                            Thư mục lớp sẵn có
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate">
                        📁 {cf.folderPath}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                      <span className="text-slate-700">
                        Mới thêm:{" "}
                        <strong className="text-[#0284C7]">+{cf.importedCount}</strong>{" "}
                        (Tổng: <strong>{currentTotal} HS</strong>)
                      </span>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã duyệt
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700">
                          Chờ duyệt
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Class Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4 self-start">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <School className="w-4 h-4 text-[#0284C7]" />
              Thư mục các Lớp học ({classes.length})
            </h3>
          </div>

          <div className="space-y-2">
            {classes.map((cls) => {
              const isSelected = cls.id === activeClass?.id;
              const isApproved = cls.rosterApproved ?? true;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "border-[#0284C7] bg-sky-50/70 text-[#0284C7]"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{cls.name}</span>
                      {cls.isAutoCreatedFromExcel && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded">
                          Tự động tạo
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{cls.grade}</span>
                      <span>·</span>
                      <span>{cls.students.length} học sinh</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate max-w-[210px]">
                      📁{" "}
                      {cls.folderPath ||
                        `Drive_GiaoVien/DanhSachLop/ThuMuc_${cls.name.replace(
                          /\s+/g,
                          "_"
                        )}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-mono font-semibold">
                      {cls.schoolYear}
                    </span>
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã duyệt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Chờ duyệt
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Class Student Roster (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          {activeClass ? (
            <>
              {/* Class Header Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-[#0284C7]">{activeClass.grade}</span>
                    <span>·</span>
                    <span>Năm học: {activeClass.schoolYear}</span>
                    <span>·</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      📁{" "}
                      {activeClass.folderPath ||
                        `Drive_GiaoVien/DanhSachLop/ThuMuc_${activeClass.name.replace(
                          /\s+/g,
                          "_"
                        )}`}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-xl font-bold text-slate-900">{activeClass.name}</h3>
                    {(activeClass.rosterApproved ?? true) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã duyệt danh sách — Sẵn sàng làm bài kiểm tra
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Chờ giáo viên kiểm tra &amp; duyệt danh sách
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApproveClassRoster(activeClass.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      activeClass.rosterApproved ?? true
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {activeClass.rosterApproved ?? true
                      ? "Xác nhận duyệt lại danh sách"
                      : `Duyệt danh sách ${activeClass.name}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditClassName(activeClass.name);
                      setEditClassGrade(activeClass.grade);
                      setEditClassYear(activeClass.schoolYear || "2026-2027");
                      setShowEditClassModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Sửa tên lớp &amp; năm học
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClass(activeClass.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa lớp
                  </button>
                </div>
              </div>

              {/* Thông báo kết quả Nhập / Xóa */}
              {importFeedback && (
                <div
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${
                    importFeedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {importFeedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{importFeedback.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportFeedback(null)}
                    className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Student Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    Danh sách Học sinh ({activeClass.students.length} em)
                  </h4>

                  {activeClass.students.length > 0 && (
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        isAllSelected
                          ? "bg-sky-50 border-[#0284C7] text-[#0284C7]"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#0284C7]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStudentBirthDateInput(
                        `15/05/${getDefaultBirthYearByGrade(activeClass.grade)}`
                      );
                      setShowAddStudentModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <UserPlus className="w-4 h-4" />
                    Thêm học sinh
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadStudentExcelTemplate(activeClass.name, activeClass.grade)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    title="Tải biểu mẫu Excel chuẩn (có cột Lớp) về máy để nhập danh sách học sinh"
                  >
                    <Download className="w-4 h-4 text-emerald-700" />
                    Tải Form mẫu Excel (.xlsx)
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt,.pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    title="Tải file Excel (.xlsx, .csv) hoặc PDF (DS Up.pdf) lên hệ thống — tự động thêm học sinh vào đúng lớp và cập nhật thẳng vào code"
                  >
                    <UploadCloud className="w-4 h-4 text-[#0284C7]" />
                    Úp file Excel (.xlsx) / PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCsvImportModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    Nhập từ Excel
                  </button>
                </div>
              </div>

              {/* Thanh công cụ Xóa hàng loạt khi có chọn học sinh */}
              {selectedStudentIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-rose-50/90 border border-rose-200 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-900">
                    <CheckSquare className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      Đã chọn{" "}
                      <strong className="font-bold underline">
                        {selectedStudentIds.length}
                      </strong>{" "}
                      / {activeClass.students.length} học sinh trong {activeClass.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentIds([]);
                        setShowBulkDeleteConfirm(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Bỏ chọn
                    </button>

                    {!showBulkDeleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa {selectedStudentIds.length} học sinh đã chọn
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-rose-300">
                        <span className="text-[11px] font-bold text-rose-700">
                          Xác nhận xóa {selectedStudentIds.length} em?
                        </span>
                        <button
                          type="button"
                          onClick={handleConfirmBulkDelete}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md cursor-pointer"
                        >
                          Đồng ý xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBulkDeleteConfirm(false)}
                          className="px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Student Table with Select All Checkbox, BirthDate & Class Column */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
                      <th className="py-3 px-3 w-11 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          disabled={activeClass.students.length === 0}
                          onChange={handleToggleSelectAll}
                          title="Chọn tất cả học sinh trong lớp"
                          className="w-4 h-4 rounded border-slate-300 text-[#0284C7] focus:ring-[#0284C7] cursor-pointer accent-[#0284C7]"
                        />
                      </th>
                      <th className="py-3 px-3 w-12 text-center">STT</th>
                      <th className="py-3 px-4">Mã Học sinh</th>
                      <th className="py-3 px-4">Họ và Tên Học sinh</th>
                      <th className="py-3 px-4">Ngày sinh</th>
                      <th className="py-3 px-4">Lớp</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {activeClass.students.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          Lớp chưa có học sinh nào. Thầy/Cô có thể bấm &ldquo;Tải Form mẫu Excel (.xlsx)&rdquo; để nhập danh sách và bấm &ldquo;Úp file Excel lên&rdquo;.
                        </td>
                      </tr>
                    ) : (
                      activeClass.students.map((st, idx) => {
                        const isChecked = selectedStudentIds.includes(st.id);
                        return (
                          <tr
                            key={st.id}
                            className={`transition-colors ${
                              isChecked
                                ? "bg-sky-50/70 hover:bg-sky-100/60"
                                : "hover:bg-slate-50/80"
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelectStudent(st.id)}
                                className="w-4 h-4 rounded border-slate-300 text-[#0284C7] focus:ring-[#0284C7] cursor-pointer accent-[#0284C7]"
                              />
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-[#0284C7]">
                              {st.studentCode}
                            </td>
                            <td
                              onClick={() => handleToggleSelectStudent(st.id)}
                              className="py-3 px-4 font-semibold text-slate-900 cursor-pointer"
                            >
                              {st.name}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                {st.birthDate ||
                                  `15/05/${getDefaultBirthYearByGrade(activeClass.grade)}`}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-[#0284C7] border border-sky-200">
                                {activeClass.name}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStudent(st);
                                    setEditStudentName(st.name);
                                    setEditStudentCode(st.studentCode);
                                    setEditStudentBirthDate(
                                      st.birthDate ||
                                        `15/05/${getDefaultBirthYearByGrade(activeClass.grade)}`
                                    );
                                    setEditStudentTargetClassId(activeClass.id);
                                  }}
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                  title="Sửa thông tin, ngày sinh hoặc chuyển lớp"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(st.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                  title="Xóa học sinh"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-500">
              Chưa chọn lớp học nào. Vui lòng tạo lớp mới ở cột bên trái.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Tạo lớp mới */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tạo Lớp học mới</h3>
              <button
                type="button"
                onClick={() => setShowAddClassModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên lớp học
                </label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Ví dụ: Lớp 4C hoặc Lớp 5B"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Khối lớp
                </label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value as GradeLevel)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                >
                  <option value="Lớp 3">Khối Lớp 3</option>
                  <option value="Lớp 4">Khối Lớp 4</option>
                  <option value="Lớp 5">Khối Lớp 5</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Năm học
                </label>
                <input
                  type="text"
                  value={newClassYear}
                  onChange={(e) => setNewClassYear(e.target.value)}
                  placeholder="2025 - 2026"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg cursor-pointer"
                >
                  Tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Chỉnh sửa Tên lớp, Khối lớp & Năm học */}
      {showEditClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Chỉnh sửa Tên lớp &amp; Năm học
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật tên lớp, khối lớp và năm học cho lớp đang chọn
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditClassModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên lớp học
                </label>
                <input
                  type="text"
                  required
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  placeholder="Ví dụ: Lớp 4B"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Khối lớp
                </label>
                <select
                  value={editClassGrade}
                  onChange={(e) => setEditClassGrade(e.target.value as GradeLevel)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                >
                  <option value="Lớp 3">Khối Lớp 3</option>
                  <option value="Lớp 4">Khối Lớp 4</option>
                  <option value="Lớp 5">Khối Lớp 5</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Năm học
                </label>
                <input
                  type="text"
                  required
                  value={editClassYear}
                  onChange={(e) => setEditClassYear(e.target.value)}
                  placeholder="Ví dụ: 2025 - 2026"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500">Chọn nhanh:</span>
                  {["2025-2026", "2026-2027", "2027-2028", "2028-2029"].map(
                    (yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setEditClassYear(yr)}
                        className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                          editClassYear === yr
                            ? "bg-sky-50 border-[#0284C7] text-[#0284C7] font-semibold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {yr}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditClassModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Thêm học sinh thủ công (Có cột Ngày sinh) */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Thêm Học sinh vào {activeClass?.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentManual} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Họ và tên học sinh
                </label>
                <input
                  type="text"
                  required
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  placeholder="Ví dụ: Lê Ngọc Khánh An"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ngày tháng năm sinh (DD/MM/YYYY)
                </label>
                <input
                  type="text"
                  required
                  value={studentBirthDateInput}
                  onChange={(e) => setStudentBirthDateInput(e.target.value)}
                  placeholder="Ví dụ: 02/03/2018"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mã học sinh (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={studentCodeInput}
                  onChange={(e) => setStudentCodeInput(e.target.value)}
                  placeholder="Ví dụ: HS01 (Hệ thống tự sinh nếu để trống)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg cursor-pointer"
                >
                  Thêm học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3B: Chỉnh sửa thông tin & Ngày sinh học sinh */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Cập nhật Hồ sơ Học sinh
              </h3>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Họ và tên học sinh
                </label>
                <input
                  type="text"
                  required
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ngày tháng năm sinh (DD/MM/YYYY)
                </label>
                <input
                  type="text"
                  required
                  value={editStudentBirthDate}
                  onChange={(e) => setEditStudentBirthDate(e.target.value)}
                  placeholder="02/03/2018"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mã học sinh
                </label>
                <input
                  type="text"
                  value={editStudentCode}
                  onChange={(e) => setEditStudentCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Thư mục Lớp học
                </label>
                <select
                  value={editStudentTargetClassId || activeClass?.id || ""}
                  onChange={(e) => setEditStudentTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg cursor-pointer"
                >
                  Lưu cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Tải Form Mẫu Excel (có cột Lớp) & Nhập danh sách từ Excel */}
      {showCsvImportModal && activeClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Nhập danh sách học sinh từ Excel (Tự động phân đúng Lớp)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Form mẫu có cột <strong>Lớp</strong>: nếu trong file có học sinh thuộc lớp khác sẽ được thêm vào đúng lớp tương ứng trên hệ thống
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvImportModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bước 1: Tải Form mẫu Excel & Bước 2: Tải file Excel lên */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    Bước 1: Tải Form mẫu Excel
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    File mẫu gồm 5 cột: <strong>STT, Mã HS, Họ và Tên, Ngày sinh, Lớp</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadStudentExcelTemplate(activeClass.name, activeClass.grade)
                  }
                  className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Tải Form mẫu Excel (.xlsx)
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="text-xs font-bold text-sky-900">
                    Bước 2: Úp file Excel đã nhập lên
                  </div>
                  <p className="text-[11px] text-sky-700 mt-0.5">
                    Hệ thống tự động kiểm tra cột <strong>Lớp</strong> và thêm học sinh vào đúng lớp.
                  </p>
                </div>
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => modalFileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  Chọn file Excel (.xlsx / .csv) tải lên
                </button>
              </div>
            </div>

            {/* Chế độ nhập: Thêm nối tiếp hoặc Thay thế */}
            <div className="flex flex-wrap items-center gap-4 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="font-semibold text-slate-700">Chế độ nhập:</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === "append"}
                  onChange={() => setImportMode("append")}
                  className="accent-[#0284C7]"
                />
                <span>Thêm nối tiếp vào danh sách hiện có</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                  className="accent-[#0284C7]"
                />
                <span>Thay thế danh sách cũ của các lớp được nhập</span>
              </label>
            </div>

            {/* Hoặc dán trực tiếp từ bảng Excel */}
            <div className="space-y-2 text-xs text-slate-600">
              <p className="font-medium text-slate-700">
                Hoặc copy trực tiếp các dòng từ file Excel (gồm STT, Mã HS, Họ và Tên, Ngày sinh, Lớp) và dán vào ô bên dưới:
              </p>
              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="1   HS01   Nguyễn Văn An   02/03/2018   Lớp 3A"
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCsvImportModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleImportCsvText}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg cursor-pointer"
              >
                Xác nhận Nhập từ ô văn bản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
