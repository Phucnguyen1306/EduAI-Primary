import * as XLSX from "xlsx";
import { GradeLevel } from "../types/grading";

export interface ImportedStudentRow {
  stt?: number | string;
  studentId: string;
  studentName: string;
  birthDate?: string;
  className: string;
}

export interface GroupedStudentClassFolder {
  className: string;
  normalizedClassKey: string;
  grade: GradeLevel;
  folderName: string;
  isNewClass: boolean;
  students: ImportedStudentRow[];
}

export function getDefaultBirthYearByGrade(grade: GradeLevel): number {
  if (grade === "Lớp 3") return 2018;
  if (grade === "Lớp 4") return 2017;
  return 2016;
}

/**
 * Chuẩn hóa mã lớp để đối chiếu (ví dụ: "Lớp 3A", "lớp 3a", "3A" -> "3A")
 */
export function normalizeClassKey(raw: string): string {
  return (raw || "")
    .trim()
    .toUpperCase()
    .replace(/^(KHỐI\s*)?(LỚP|LOP)\s*/i, "")
    .replace(/[\s\-_]+/g, "");
}

/**
 * Định dạng tên lớp hiển thị chuẩn (ví dụ: "3A" -> "Lớp 3A", "Lớp 4B" -> "Lớp 4B")
 */
export function formatStandardClassName(raw: string, fallback: string = "Lớp 3A"): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return fallback;
  const cleaned = trimmed.replace(/^(khối\s*)?(lớp|lop)\s*/i, "").trim();
  if (!cleaned) return fallback;
  return `Lớp ${cleaned.toUpperCase()}`;
}

/**
 * Suy luận Khối lớp (Lớp 3 / Lớp 4 / Lớp 5) từ tên lớp (ví dụ "3A" -> "Lớp 3", "4B" -> "Lớp 4")
 */
export function inferGradeFromClassName(
  className: string,
  fallbackGrade: GradeLevel = "Lớp 3"
): GradeLevel {
  const key = normalizeClassKey(className);
  if (key.startsWith("3")) return "Lớp 3";
  if (key.startsWith("4")) return "Lớp 4";
  if (key.startsWith("5")) return "Lớp 5";
  return fallbackGrade;
}

export function excelSerialToDateString(serial: number): string {
  const utcDays = Math.round(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const y = date.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

export function normalizeBirthDateValue(
  raw: unknown,
  grade: GradeLevel = "Lớp 3"
): string {
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const d = String(raw.getDate()).padStart(2, "0");
    const m = String(raw.getMonth() + 1).padStart(2, "0");
    const y = raw.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const trimmed = String(raw ?? "").trim();
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

  // Định dạng YYYY-MM-DD
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split(/[\/\-]/);
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }

  // Định dạng D/M/YYYY hoặc DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-]/);
    const d = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${d}/${m}/${y}`;
  }

  return trimmed;
}

/**
 * Tìm giá trị cột linh hoạt theo tên cột trong một dòng object từ XLSX
 */
function pickColumnValue(row: Record<string, any>, exactKeys: string[], keywordMatchers: RegExp[]): string {
  for (const key of exactKeys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  const rowKeys = Object.keys(row);
  for (const rk of rowKeys) {
    const normalizedKey = rk.trim().toLowerCase();
    if (keywordMatchers.some((regex) => regex.test(normalizedKey))) {
      const val = row[rk];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return String(val).trim();
      }
    }
  }
  return "";
}

/**
 * Đọc tệp Excel (.xlsx/.xls/.csv) danh sách học sinh do giáo viên tải lên
 * (ví dụ: 'Form_Mau_Danh_Sach_Hoc_Sinh.xlsx'), phân tích cấu trúc các cột:
 * Mã học sinh, Họ và tên học sinh, Ngày sinh, Lớp và tự động phân tách theo từng lớp.
 */
export async function parseStudentExcelFile(
  file: File,
  defaultClassName: string = "Lớp 3A"
): Promise<ImportedStudentRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Lấy tên sheet đầu tiên trong tệp Excel
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve([]);
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];

        // Chuyển đổi dữ liệu sheet thành mảng JSON
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
        });

        // Ánh xạ dữ liệu sang cấu trúc chuẩn của hệ thống EduAI Primary
        const students: ImportedStudentRow[] = rawRows
          .map((row, index) => {
            const rawClass =
              row["LỚP"] ||
              row["Lớp"] ||
              row["ClassName"] ||
              pickColumnValue(row, ["Tên lớp", "LỚP HỌC", "Lớp học"], [/^lớp/i, /^lop/i, /class/i]) ||
              defaultClassName;

            const formattedClass = formatStandardClassName(String(rawClass), defaultClassName);
            const inferredGrade = inferGradeFromClassName(formattedClass, "Lớp 3");
            const gradeDigit = inferredGrade === "Lớp 5" ? "5" : inferredGrade === "Lớp 4" ? "4" : "3";

            const rawStudentId =
              row["MÃ HỌC SINH"] ||
              row["Mã học sinh"] ||
              row["Mã Học sinh"] ||
              row["MaHS"] ||
              pickColumnValue(
                row,
                ["Mã HS", "MÃ HS", "StudentId", "StudentCode"],
                [/mã\s*học\s*sinh/i, /mã\s*hs/i, /mahs/i, /student\s*id/i, /student\s*code/i]
              ) ||
              `HS${gradeDigit}${String(index + 1).padStart(2, "0")}`;

            const rawStudentName =
              row["HỌ VÀ TÊN HỌC SINH"] ||
              row["Họ và tên học sinh"] ||
              row["Họ và Tên Học sinh"] ||
              row["HoTen"] ||
              pickColumnValue(
                row,
                ["Họ và tên", "HỌ VÀ TÊN", "Họ tên", "HỌ TÊN", "StudentName"],
                [/họ\s*(và\s*)?tên/i, /ho\s*(va\s*)?ten/i, /hoten/i, /student\s*name/i]
              ) ||
              "";

            const rawBirthDate =
              row["NGÀY SINH"] ||
              row["Ngày sinh"] ||
              row["Ngày sinh (DD/MM/YYYY)"] ||
              row["NgaySinh"] ||
              pickColumnValue(
                row,
                ["Ngày tháng năm sinh", "NGÀY SINH (DD/MM/YYYY)", "BirthDate", "DOB"],
                [/ngày\s*sinh/i, /ngay\s*sinh/i, /ngaysinh/i, /birth/i, /dob/i]
              ) ||
              "";

            return {
              stt: row["STT"] || row["stt"] || index + 1,
              studentId: String(rawStudentId).trim(),
              studentName: String(rawStudentName).trim(),
              birthDate: normalizeBirthDateValue(rawBirthDate, inferredGrade),
              className: formattedClass,
            };
          })
          .filter((s) => {
            const nameLower = s.studentName.trim().toLowerCase();
            if (!nameLower) return false;
            // Loại bỏ dòng tiêu đề lặp lại nếu có
            if (
              nameLower === "họ và tên học sinh" ||
              nameLower === "họ và tên" ||
              nameLower === "hoten"
            ) {
              return false;
            }
            return true;
          });

        resolve(students);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Tự động nhóm danh sách học sinh đã đọc từ Excel vào các thư mục Lớp tương ứng,
 * đồng thời đánh dấu các lớp chưa có trên hệ thống để tự động khởi tạo lớp mới.
 */
export function groupImportedStudentsByClassFolder(
  students: ImportedStudentRow[],
  existingClassNames: string[],
  defaultClassName: string = "Lớp 3A"
): GroupedStudentClassFolder[] {
  const existingKeyMap = new Map<string, string>();
  existingClassNames.forEach((cName) => {
    existingKeyMap.set(normalizeClassKey(cName), cName);
  });

  const buckets = new Map<string, GroupedStudentClassFolder>();

  students.forEach((student) => {
    const formattedClass = formatStandardClassName(student.className, defaultClassName);
    const classKey = normalizeClassKey(formattedClass);
    const matchedExistingName = existingKeyMap.get(classKey);
    const finalClassName = matchedExistingName || formattedClass;
    const isNewClass = !matchedExistingName;
    const grade = inferGradeFromClassName(finalClassName, "Lớp 3");
    const folderName = `ThuMuc_${finalClassName.replace(/\s+/g, "_")}`;

    const existingBucket = buckets.get(classKey);
    if (existingBucket) {
      existingBucket.students.push({
        ...student,
        className: finalClassName,
        birthDate: normalizeBirthDateValue(student.birthDate, grade),
      });
    } else {
      buckets.set(classKey, {
        className: finalClassName,
        normalizedClassKey: classKey,
        grade,
        folderName,
        isNewClass,
        students: [
          {
            ...student,
            className: finalClassName,
            birthDate: normalizeBirthDateValue(student.birthDate, grade),
          },
        ],
      });
    }
  });

  return Array.from(buckets.values());
}

/**
 * Tạo và tải xuống tệp Excel mẫu 'Form_Mau_Danh_Sach_Hoc_Sinh.xlsx' bằng thư viện XLSX
 * có đầy đủ các cột: STT, Mã học sinh, Họ và tên học sinh, Ngày sinh, Lớp.
 */
export function downloadStandardStudentExcelTemplate(defaultClassName: string = "Lớp 3A"): void {
  const sampleData = [
    {
      STT: 1,
      "Mã học sinh": "HS301",
      "Họ và tên học sinh": "Lê Ngọc Khánh An",
      "Ngày sinh": "15/02/2018",
      Lớp: defaultClassName,
    },
    {
      STT: 2,
      "Mã học sinh": "HS302",
      "Họ và tên học sinh": "Vũ Khánh An",
      "Ngày sinh": "02/03/2018",
      Lớp: defaultClassName,
    },
    {
      STT: 3,
      "Mã học sinh": "HS401",
      "Họ và tên học sinh": "Nguyễn Minh Khang",
      "Ngày sinh": "19/04/2017",
      Lớp: "Lớp 4B",
    },
    {
      STT: 4,
      "Mã học sinh": "HS415",
      "Họ và tên học sinh": "Trần Hoàng Minh",
      "Ngày sinh": "12/08/2017",
      Lớp: "Lớp 4C",
    },
    {
      STT: 5,
      "Mã học sinh": "HS501",
      "Họ và tên học sinh": "Phạm Gia Huy",
      "Ngày sinh": "22/07/2016",
      Lớp: "Lớp 5A",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachHocSinh");
  XLSX.writeFile(workbook, "Form_Mau_Danh_Sach_Hoc_Sinh.xlsx");
}

/**
 * Tạo đối tượng File mẫu 'Form_Mau_Danh_Sach_Hoc_Sinh.xlsx' ngay trong bộ nhớ
 * để giáo viên có thể bấm kiểm thử nhanh quy trình đọc & tự động chia thư mục lớp.
 */
export function createSampleStudentExcelFileObject(): File {
  const sampleData = [
    {
      STT: 1,
      "Mã học sinh": "HS315",
      "Họ và tên học sinh": "Đỗ Hoàng Gia Bảo",
      "Ngày sinh": "14/03/2018",
      Lớp: "Lớp 3A",
    },
    {
      STT: 2,
      "Mã học sinh": "HS316",
      "Họ và tên học sinh": "Nguyễn Bảo Ngọc",
      "Ngày sinh": "25/07/2018",
      Lớp: "Lớp 3A",
    },
    {
      STT: 3,
      "Mã học sinh": "HS412",
      "Họ và tên học sinh": "Lê Minh Khôi",
      "Ngày sinh": "09/11/2017",
      Lớp: "Lớp 4B",
    },
    {
      STT: 4,
      "Mã học sinh": "HS420",
      "Họ và tên học sinh": "Trần Tuệ Nhi",
      "Ngày sinh": "18/05/2017",
      Lớp: "Lớp 4C",
    },
    {
      STT: 5,
      "Mã học sinh": "HS421",
      "Họ và tên học sinh": "Võ Thành Đạt",
      "Ngày sinh": "30/09/2017",
      Lớp: "Lớp 4C",
    },
    {
      STT: 6,
      "Mã học sinh": "HS510",
      "Họ và tên học sinh": "Phan Thanh Trúc",
      "Ngày sinh": "11/12/2016",
      Lớp: "Lớp 5A",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachHocSinh");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  return new File([excelBuffer], "Form_Mau_Danh_Sach_Hoc_Sinh.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
