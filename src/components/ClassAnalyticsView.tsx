import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  FileSpreadsheet,
  Filter,
  UserX,
  UserCheck,
  FileText,
  Presentation,
  Cat,
  BookOpenCheck,
  School,
  ClipboardList,
  Download,
} from "lucide-react";
import { Assignment, PracticeFileType, StudentSubmission } from "../types/grading";
import { exportParentReportToDocx, exportParentReportToPdf } from "../utils/exportEngine";
import { ClassRoom, StudentRecord } from "./ClassManagerView";

interface ClassAnalyticsViewProps {
  submissions: StudentSubmission[];
  classes: ClassRoom[];
  assignments: Assignment[];
  onExportCsv: () => void;
  onSelectSubmission: (submission: StudentSubmission) => void;
}

type ExamCategoryFilter = "all" | "practice_all" | PracticeFileType;

const EXAM_CATEGORY_LABELS: Record<ExamCategoryFilter, string> = {
  all: "Tất cả loại bài kiểm tra (Thực hành & Lý thuyết)",
  practice_all: "Tất cả Bài Thực hành (.docx, .pptx, .sb3)",
  theory: "Đề Kiểm tra Lý thuyết (Trắc nghiệm & Tự luận ngắn)",
  docx: "Thực hành Soạn thảo Văn bản Word (.docx)",
  pptx: "Thực hành Bài Trình chiếu PowerPoint (.pptx)",
  sb3: "Thực hành Lập trình Khối lệnh Scratch (.sb3)",
};

function getExamTypeBadgeLabel(fileType: PracticeFileType): string {
  switch (fileType) {
    case "docx":
      return "Thực hành Word (.docx)";
    case "pptx":
      return "Thực hành PowerPoint (.pptx)";
    case "sb3":
      return "Thực hành Scratch (.sb3)";
    case "theory":
      return "Kiểm tra Lý thuyết";
  }
}

export const ClassAnalyticsView: React.FC<ClassAnalyticsViewProps> = ({
  submissions,
  classes,
  assignments,
  onSelectSubmission,
}) => {
  // Bộ lọc Lớp học, Loại bài kiểm tra và Bài kiểm tra cụ thể
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<ExamCategoryFilter>("all");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("all");
  // Bộ lọc lớp riêng ngay tại bảng Học sinh chưa làm bài
  const [missingListClassFilterId, setMissingListClassFilterId] = useState<string>("all");

  // Lớp học đang chọn (nếu không phải "all")
  const activeClassObj = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  // Danh sách các bài kiểm tra phù hợp với Lớp học và Loại bài đang chọn
  const availableAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      // Lọc theo lớp / khối lớp
      if (activeClassObj) {
        const matchClassOrGrade =
          asg.className.toLowerCase() === activeClassObj.name.toLowerCase() ||
          asg.grade === activeClassObj.grade;
        if (!matchClassOrGrade) return false;
      }

      // Lọc theo loại bài kiểm tra
      if (selectedCategory === "practice_all") {
        if (asg.fileType === "theory") return false;
      } else if (selectedCategory !== "all") {
        if (asg.fileType !== selectedCategory) return false;
      }

      return true;
    });
  }, [assignments, activeClassObj, selectedCategory]);

  // Tự động reset selectedAssignmentId nếu không còn nằm trong danh sách khả dụng
  React.useEffect(() => {
    if (
      selectedAssignmentId !== "all" &&
      !availableAssignments.some((a) => a.id === selectedAssignmentId)
    ) {
      setSelectedAssignmentId("all");
    }
  }, [availableAssignments, selectedAssignmentId]);

  const activeAssignmentObj = useMemo(
    () => availableAssignments.find((a) => a.id === selectedAssignmentId) || null,
    [availableAssignments, selectedAssignmentId]
  );

  // Lọc danh sách bài nộp (submissions) theo Lớp, Loại bài kiểm tra và Đề bài cụ thể
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Lọc theo lớp
      if (activeClassObj) {
        const matchClass =
          sub.className.trim().toLowerCase() === activeClassObj.name.trim().toLowerCase();
        if (!matchClass) return false;
      } else if (activeAssignmentObj) {
        // Nếu chọn "Tất cả các lớp" nhưng chọn 1 đề cụ thể, chỉ tính các bài nộp của đề đó
        if (sub.assignmentId !== activeAssignmentObj.id) return false;
      }

      // 2. Lọc theo loại bài kiểm tra
      if (selectedCategory === "practice_all") {
        if (sub.fileType === "theory") return false;
      } else if (selectedCategory !== "all") {
        if (sub.fileType !== selectedCategory) return false;
      }

      // 3. Lọc theo đề bài cụ thể
      if (activeAssignmentObj && sub.assignmentId !== activeAssignmentObj.id) {
        return false;
      }

      return true;
    });
  }, [submissions, activeClassObj, selectedCategory, activeAssignmentObj]);

  // Danh sách các lớp áp dụng trong phạm vi thống kê hiện tại
  const targetClasses = useMemo(() => {
    if (activeClassObj) return [activeClassObj];
    if (activeAssignmentObj) {
      // Nếu đang chọn 1 bài kiểm tra cụ thể mà để "Tất cả các lớp", ưu tiên các lớp cùng khối với bài kiểm tra
      const sameGradeClasses = classes.filter((c) => c.grade === activeAssignmentObj.grade);
      return sameGradeClasses.length > 0 ? sameGradeClasses : classes;
    }
    return classes;
  }, [classes, activeClassObj, activeAssignmentObj]);

  // Tính toán danh sách Học sinh ĐÃ LÀM BÀI và CHƯA LÀM BÀI dựa trên danh sách học sinh của các lớp
  const studentCompletionReport = useMemo(() => {
    interface StudentStatusRow {
      student: StudentRecord;
      classRoom: ClassRoom;
      completedSubmissions: StudentSubmission[];
      missingAssignments: Assignment[];
      hasCompletedAllTarget: boolean;
      hasSubmittedAny: boolean;
    }

    const rows: StudentStatusRow[] = [];

    for (const cls of targetClasses) {
      // Các bài kiểm tra giao cho lớp/khối này nằm trong bộ lọc hiện tại
      const classAssignments = activeAssignmentObj
        ? [activeAssignmentObj]
        : availableAssignments.filter(
            (asg) =>
              asg.className.trim().toLowerCase() === cls.name.trim().toLowerCase() ||
              asg.grade === cls.grade
          );

      for (const st of cls.students) {
        const normalizedName = st.name.trim().toLowerCase();
        const normalizedCode = st.studentCode.trim().toLowerCase();

        // Tìm tất cả bài nộp của học sinh này trong filteredSubmissions
        const stSubs = filteredSubmissions.filter((sub) => {
          const sameClass =
            sub.className.trim().toLowerCase() === cls.name.trim().toLowerCase();
          const matchCode = sub.studentId.trim().toLowerCase() === normalizedCode;
          const matchName = sub.studentName.trim().toLowerCase() === normalizedName;
          return sameClass && (matchCode || matchName);
        });

        // Kiểm tra những bài kiểm tra nào của lớp mà học sinh này chưa nộp
        const missingAsgs = classAssignments.filter(
          (asg) => !stSubs.some((sub) => sub.assignmentId === asg.id)
        );

        const hasSubmittedAny = stSubs.length > 0;
        const hasCompletedAllTarget =
          classAssignments.length > 0 ? missingAsgs.length === 0 : hasSubmittedAny;

        rows.push({
          student: st,
          classRoom: cls,
          completedSubmissions: stSubs,
          missingAssignments: missingAsgs,
          hasCompletedAllTarget,
          hasSubmittedAny,
        });
      }
    }

    // Học sinh chưa làm bài:
    // - Nếu đang chọn 1 bài kiểm tra cụ thể: những em chưa nộp bài kiểm tra đó
    // - Nếu chọn "Tất cả bài kiểm tra": những em còn thiếu ít nhất 1 bài kiểm tra thuộc bộ lọc (hoặc chưa nộp bài nào)
    const missingStudents = rows.filter((r) =>
      activeAssignmentObj ? !r.hasSubmittedAny : r.missingAssignments.length > 0 || !r.hasSubmittedAny
    );

    const submittedStudents = rows.filter((r) => r.hasSubmittedAny);

    return {
      allRows: rows,
      totalStudentsCount: rows.length,
      submittedStudents,
      missingStudents,
    };
  }, [targetClasses, activeAssignmentObj, availableAssignments, filteredSubmissions]);

  // Các chỉ số thống kê điểm số trên tập bài nộp đã lọc
  const totalSubs = filteredSubmissions.length;
  const safeDivisor = totalSubs || 1;
  const tierACount = filteredSubmissions.filter((s) => s.finalScore >= 8.5).length;
  const tierBCount = filteredSubmissions.filter(
    (s) => s.finalScore >= 6.5 && s.finalScore < 8.5
  ).length;
  const tierCCount = filteredSubmissions.filter((s) => s.finalScore < 6.5).length;

  const wrongFileNameCount = filteredSubmissions.filter((s) => s.wasFileNameAutoFixed).length;
  const wordFormatErrorCount = filteredSubmissions.filter(
    (s) => s.fileType === "docx" && s.detectedErrors.length > 0
  ).length;
  const scratchLoopErrorCount = filteredSubmissions.filter(
    (s) =>
      s.fileType === "sb3" &&
      s.inspection.type === "sb3" &&
      !s.inspection.data.hasRepeatLoop
  ).length;
  const pptEffectErrorCount = filteredSubmissions.filter(
    (s) => s.fileType === "pptx" && s.detectedErrors.length > 0
  ).length;

  const avgScore =
    totalSubs > 0
      ? (
          filteredSubmissions.reduce((acc, s) => acc + s.finalScore, 0) / totalSubs
        ).toFixed(1)
      : "0.0";

  const studentsNeedingSupport = filteredSubmissions.filter(
    (s) => s.needsAttention || s.finalScore < 6.5
  );

  const errorCategories = [
    {
      title: "Đặt sai tên file khi lưu (Đã được hệ thống Auto-Rename sửa)",
      count: wrongFileNameCount,
      total: safeDivisor,
      advice:
        "Đầu giờ thực hành tới, thầy dành 3 phút chiếu mẫu thao tác File -> Save As và quy tắc gõ HoTen_Lop_TenBai không dấu.",
    },
    {
      title: "Word (.docx): Quên viết hoa đầu dòng, sai cỡ chữ tiêu đề hoặc ảnh lệch trái",
      count: wordFormatErrorCount,
      total: safeDivisor,
      advice:
        "Thầy nhắc học sinh giữ phím Shift khi gõ chữ cái đầu dòng và bôi đen tiêu đề trước khi bấm chọn cỡ chữ 18pt, nút Center.",
    },
    {
      title: "Scratch (.sb3): Kéo thả khối lệnh rời rạc, chưa biết gộp vào vòng lặp repeat",
      count: scratchLoopErrorCount,
      total: safeDivisor,
      advice:
        "Thầy mở Trình giả lập 2D trên máy chiếu để học sinh thấy việc đặt 2 khối (Di chuyển 100 + Xoay 90°) vào trong khối Lặp lại 4 lần giúp code ngắn gọn hơn gấp 4 lần.",
    },
    {
      title: "PowerPoint (.pptx): Thiếu số lượng Slide hoặc quên gán Transition cho trang 2, 3",
      count: pptEffectErrorCount,
      total: safeDivisor,
      advice:
        "Thầy hướng dẫn học sinh nút 'Apply To All' trong thẻ Transitions để áp dụng hiệu ứng chuyển trang đồng bộ cho toàn bộ bài trình chiếu.",
    },
  ];

  // Xuất file CSV theo đúng bộ lọc đang chọn (bao gồm cả học sinh ĐÃ LÀM và CHƯA LÀM BÀI)
  const handleExportFilteredReportCsv = () => {
    const headers = [
      "Mã HS",
      "Họ và Tên Học Sinh",
      "Lớp",
      "Khối",
      "Trạng thái Làm bài",
      "Loại Bài Kiểm Tra",
      "Tên Bài Kiểm Tra / Bài Tập",
      "Điểm Chốt",
      "Mức Đạt",
      "Bài Kiểm Tra Còn Thiếu (Chưa nộp)",
      "Nhận xét của Thầy",
    ];

    const csvRows: (string | number)[][] = [];

    for (const row of studentCompletionReport.allRows) {
      if (row.completedSubmissions.length > 0) {
        for (const sub of row.completedSubmissions) {
          const tier =
            sub.finalScore >= 8.5
              ? "Hoàn thành tốt (A)"
              : sub.finalScore >= 6.5
              ? "Hoàn thành (B)"
              : "Cần hỗ trợ (C)";
          csvRows.push([
            row.student.studentCode,
            `"${row.student.name}"`,
            `"${row.classRoom.name}"`,
            `"${row.classRoom.grade}"`,
            `"Đã làm bài"`,
            `"${getExamTypeBadgeLabel(sub.fileType)}"`,
            `"${sub.assignmentTitle}"`,
            sub.finalScore.toFixed(1),
            `"${tier}"`,
            `"${
              row.missingAssignments.length > 0
                ? row.missingAssignments.map((m) => m.title).join("; ")
                : "Đã hoàn thành đủ"
            }"`,
            `"${sub.personalizedFeedback.replace(/"/g, '""')}"`,
          ]);
        }
      } else {
        const missingTitles =
          row.missingAssignments.length > 0
            ? row.missingAssignments.map((m) => m.title).join("; ")
            : activeAssignmentObj
            ? activeAssignmentObj.title
            : "Chưa nộp bài kiểm tra nào";
        csvRows.push([
          row.student.studentCode,
          `"${row.student.name}"`,
          `"${row.classRoom.name}"`,
          `"${row.classRoom.grade}"`,
          `"CHƯA LÀM BÀI"`,
          `"${EXAM_CATEGORY_LABELS[selectedCategory]}"`,
          `"${activeAssignmentObj ? activeAssignmentObj.title : "Tất cả bài kiểm tra"}"`,
          "",
          `"Chưa có điểm"`,
          `"${missingTitles}"`,
          `"Thầy nhắc con hoàn thành và nộp bài sớm nhé!"`,
        ]);
      }
    }

    const csvContent =
      "\uFEFF" + [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const classSlug = activeClassObj
      ? activeClassObj.name.replace(/\s+/g, "")
      : "TatCaLop";
    link.setAttribute("download", `BaoCao_ThongKe_${classSlug}_TinHocTieuHoc.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Danh sách học sinh chưa làm bài đã áp dụng thêm nút lọc lớp trực tiếp tại bảng
  const filteredMissingStudents = useMemo(() => {
    const effectiveClassId =
      missingListClassFilterId !== "all" ? missingListClassFilterId : selectedClassId;
    if (effectiveClassId === "all") {
      return studentCompletionReport.missingStudents;
    }
    return studentCompletionReport.missingStudents.filter(
      (item) => item.classRoom.id === effectiveClassId
    );
  }, [studentCompletionReport.missingStudents, missingListClassFilterId, selectedClassId]);

  // Xuất Excel danh sách Học sinh chưa làm bài theo lớp đang lọc
  const handleExportMissingStudentsExcel = () => {
    const headers = [
      "STT",
      "Mã Học sinh",
      "Họ và Tên Học sinh",
      "Ngày sinh",
      "Lớp",
      "Khối",
      "Bài kiểm tra / Bài tập chưa hoàn thành",
      "Trạng thái",
    ];

    const rows = filteredMissingStudents.map((item, idx) => {
      const missingTitles =
        item.missingAssignments.length > 0
          ? item.missingAssignments
              .map((m) => `[${getExamTypeBadgeLabel(m.fileType)}] ${m.title}`)
              .join("; ")
          : activeAssignmentObj
          ? activeAssignmentObj.title
          : "Chưa nộp bài kiểm tra nào";
      return [
        idx + 1,
        `"${item.student.studentCode}"`,
        `"${item.student.name}"`,
        `"${item.student.birthDate || ""}"`,
        `"${item.classRoom.name}"`,
        `"${item.classRoom.grade}"`,
        `"${missingTitles.replace(/"/g, '""')}"`,
        `"Chưa làm bài"`,
      ];
    });

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const targetCls = classes.find(
      (c) =>
        c.id ===
        (missingListClassFilterId !== "all"
          ? missingListClassFilterId
          : selectedClassId)
    );
    const classSlug = targetCls ? targetCls.name.replace(/\s+/g, "") : "TatCaLop";
    link.setAttribute(
      "download",
      `DS_HocSinh_ChuaLamBai_${classSlug}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono text-slate-500">
            PHÂN HỆ 04 · BÁO CÁO THỐNG KÊ THEO LỚP, LOẠI BÀI KIỂM TRA &amp; TIẾN ĐỘ NỘP BÀI
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1 text-balance">
            Báo cáo Thống kê Lớp học &amp; Danh sách Học sinh Chưa làm bài
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            type="button"
            disabled={filteredSubmissions.length === 0}
            onClick={() =>
              exportParentReportToDocx(
                filteredSubmissions,
                assignments,
                activeClassObj
                  ? `Cả ${activeClassObj.name} (${filteredSubmissions.length} học sinh)`
                  : `Tất cả lớp (${filteredSubmissions.length} học sinh)`
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-[#0284C7] bg-sky-50 hover:bg-sky-100 border border-sky-200 disabled:opacity-40 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Xuất Bài làm gửi PH (.DOCX)
          </button>

          <button
            type="button"
            disabled={filteredSubmissions.length === 0}
            onClick={() =>
              exportParentReportToPdf(
                filteredSubmissions,
                assignments,
                activeClassObj
                  ? `Cả ${activeClassObj.name} (${filteredSubmissions.length} học sinh)`
                  : `Tất cả lớp (${filteredSubmissions.length} học sinh)`
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-40 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            Xuất Bài làm gửi PH (.PDF)
          </button>

          <button
            type="button"
            onClick={handleExportFilteredReportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Xuất Báo cáo Lớp &amp; DS Chưa làm bài (.CSV)
          </button>
        </div>
      </div>

      {/* BỘ LỌC TÙY CHỌN: CHỌN LỚP HỌC - CHỌN LOẠI BÀI KIỂM TRA - CHỌN ĐỀ BÀI CỤ THỂ */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[#0284C7]" />
            <span>Tùy chọn Xem Báo cáo Thống kê (Chọn Lớp &amp; Loại bài kiểm tra)</span>
          </div>
          {(selectedClassId !== "all" ||
            selectedCategory !== "all" ||
            selectedAssignmentId !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSelectedClassId("all");
                setSelectedCategory("all");
                setSelectedAssignmentId("all");
              }}
              className="text-xs font-semibold text-[#0284C7] hover:underline cursor-pointer"
            >
              Đặt lại xem tất cả
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Chọn Lớp học */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. Chọn Lớp học cần xem thống kê:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7] focus:bg-white"
            >
              <option value="all">
                Tất cả các lớp ({classes.length} lớp —{" "}
                {classes.reduce((acc, c) => acc + c.students.length, 0)} học sinh)
              </option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.grade} — Sĩ số: {cls.students.length} học sinh)
                </option>
              ))}
            </select>
          </div>

          {/* 2. Chọn Loại bài kiểm tra */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              2. Chọn Loại bài kiểm tra:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ExamCategoryFilter)}
              className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7] focus:bg-white"
            >
              <option value="all">{EXAM_CATEGORY_LABELS.all}</option>
              <option value="practice_all">{EXAM_CATEGORY_LABELS.practice_all}</option>
              <option value="theory">{EXAM_CATEGORY_LABELS.theory}</option>
              <option value="docx">{EXAM_CATEGORY_LABELS.docx}</option>
              <option value="pptx">{EXAM_CATEGORY_LABELS.pptx}</option>
              <option value="sb3">{EXAM_CATEGORY_LABELS.sb3}</option>
            </select>
          </div>

          {/* 3. Chọn Bài kiểm tra / Đề bài cụ thể */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              3. Chọn Bài kiểm tra / Bài thực hành cụ thể:
            </label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7] focus:bg-white"
            >
              <option value="all">
                Tất cả bài kiểm tra phù hợp ({availableAssignments.length} đề)
              </option>
              {availableAssignments.map((asg) => (
                <option key={asg.id} value={asg.id}>
                  [{getExamTypeBadgeLabel(asg.fileType)}] {asg.title} ({asg.className})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tóm tắt Phạm vi Báo cáo đang hiển thị */}
        <div className="bg-sky-50/90 border border-sky-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5 text-slate-800">
              <School className="w-4 h-4 text-[#0284C7] shrink-0" />
              <span className="text-slate-500">Lớp thống kê:</span>
              <strong className="text-slate-900">
                {activeClassObj
                  ? `${activeClassObj.name} (${activeClassObj.grade} · Sĩ số ${activeClassObj.students.length} HS)`
                  : `Tất cả các lớp áp dụng (${targetClasses
                      .map((c) => c.name)
                      .join(", ")} · Tổng ${studentCompletionReport.totalStudentsCount} HS)`}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 text-slate-800">
              <ClipboardList className="w-4 h-4 text-[#0284C7] shrink-0" />
              <span className="text-slate-500">Loại bài kiểm tra:</span>
              <strong className="text-[#0284C7]">
                {activeAssignmentObj
                  ? getExamTypeBadgeLabel(activeAssignmentObj.fileType)
                  : EXAM_CATEGORY_LABELS[selectedCategory]}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 text-slate-800">
              <span className="text-slate-500">Đề bài:</span>
              <strong className="text-slate-900">
                {activeAssignmentObj
                  ? activeAssignmentObj.title
                  : `Tổng hợp ${availableAssignments.length} bài kiểm tra`}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Top Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Sĩ số & Tiến độ làm bài */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-500 block">
            Tiến độ Học sinh Đã làm bài
          </span>
          <div className="mt-2 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-3xl font-bold text-emerald-600">
              {studentCompletionReport.submittedStudents.length}
            </span>
            <span className="text-xs text-slate-500">
              / {studentCompletionReport.totalStudentsCount} học sinh (
              {studentCompletionReport.totalStudentsCount > 0
                ? Math.round(
                    (studentCompletionReport.submittedStudents.length /
                      studentCompletionReport.totalStudentsCount) *
                      100
                  )
                : 0}
              %)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Tổng cộng {filteredSubmissions.length} bài nộp trong bộ lọc hiện tại
          </p>
        </div>

        {/* Card 2: Số học sinh CHƯA LÀM BÀI */}
        <div className="bg-white border border-amber-300 rounded-xl p-5">
          <span className="text-xs font-semibold text-amber-800 block">
            Học sinh Chưa làm bài / Còn thiếu bài
          </span>
          <div className="mt-2 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-3xl font-bold text-amber-600">
              {studentCompletionReport.missingStudents.length}
            </span>
            <span className="text-xs text-slate-500">
              / {studentCompletionReport.totalStudentsCount} học sinh
            </span>
          </div>
          <p className="text-xs text-amber-800 mt-2">
            {studentCompletionReport.missingStudents.length === 0
              ? "100% học sinh trong lớp đã nộp bài đầy đủ!"
              : "Xem danh sách chi tiết các em chưa làm bài ở bảng bên dưới"}
          </p>
        </div>

        {/* Card 3: Điểm trung bình */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-500 block">
            Điểm trung bình các bài đã nộp
          </span>
          <div className="mt-2 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-3xl font-bold text-slate-900">{avgScore}</span>
            <span className="text-xs text-slate-500">/ 10.0 điểm</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Đạt Mức A (8.5–10đ): {tierACount}/{totalSubs} bài (
            {totalSubs > 0 ? Math.round((tierACount / safeDivisor) * 100) : 0}%)
          </p>
        </div>

        {/* Card 4: Học sinh cần kèm riêng */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <span className="text-xs font-medium text-slate-500 block">
            Đã nộp nhưng cần Thầy kèm thêm
          </span>
          <div className="mt-2 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-3xl font-bold text-red-600">
              {studentsNeedingSupport.length}
            </span>
            <span className="text-xs text-slate-500">bài cảnh báo (&lt; 6.5đ)</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Cần thầy hướng dẫn lại thao tác vào đầu tiết học tới
          </p>
        </div>
      </div>

      {/* BẢNG THỐNG KÊ HỌC SINH CHƯA LÀM BÀI & ĐÃ LÀM BÀI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái (7 cols): Danh sách Học sinh CHƯA LÀM BÀI (Có nút Lọc theo lớp & Xuất Excel riêng) */}
        <div className="lg:col-span-7 bg-white border border-amber-300 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-amber-50/80 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Danh sách Học sinh Chưa làm bài / Chưa nộp đủ bài (
                  {filteredMissingStudents.length} học sinh)
                </h3>
                <p className="text-[11px] text-slate-600">
                  Lọc nhanh theo lớp và tải xuống danh sách học sinh chưa làm bài ra file Excel
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={missingListClassFilterId}
                onChange={(e) => setMissingListClassFilterId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                title="Lọc học sinh chưa làm bài theo lớp"
              >
                <option value="all">Lọc: Tất cả lớp ({studentCompletionReport.missingStudents.length} HS)</option>
                {classes.map((cls) => {
                  const countInCls = studentCompletionReport.missingStudents.filter(
                    (m) => m.classRoom.id === cls.id
                  ).length;
                  return (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({countInCls} HS chưa làm)
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                disabled={filteredMissingStudents.length === 0}
                onClick={handleExportMissingStudentsExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Xuất Excel (DS Chưa làm)
              </button>
            </div>
          </div>

          {filteredMissingStudents.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-sm font-bold text-slate-900">
                Tuyệt vời! Không còn học sinh nào chưa làm bài trong lớp đang chọn.
              </div>
              <p className="text-xs text-slate-500">
                Tất cả học sinh thuộc phạm vi lọc hiện tại đều đã hoàn thành và nộp bài đầy đủ.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                    <th className="py-2.5 px-4 w-10 text-center">STT</th>
                    <th className="py-2.5 px-4">Mã HS &amp; Họ tên</th>
                    <th className="py-2.5 px-4">Ngày sinh</th>
                    <th className="py-2.5 px-4">Lớp</th>
                    <th className="py-2.5 px-4">Bài kiểm tra chưa làm</th>
                    <th className="py-2.5 px-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMissingStudents.map((item, idx) => (
                    <tr key={`${item.classRoom.id}-${item.student.id}`} className="hover:bg-amber-50/40">
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.student.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          Mã HS: {item.student.studentCode}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {item.student.birthDate || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{item.classRoom.name}</span>
                        <span className="block text-[11px] text-slate-500">
                          {item.classRoom.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.missingAssignments.length > 0 ? (
                          <ul className="space-y-1">
                            {item.missingAssignments.map((asg) => (
                              <li key={asg.id} className="text-slate-800 leading-snug">
                                <span className="font-semibold text-[#0284C7]">
                                  [{getExamTypeBadgeLabel(asg.fileType)}]
                                </span>{" "}
                                {asg.title}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-600 italic">
                            Chưa có bài nộp nào trong loại bài đang chọn
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-100 rounded-md whitespace-nowrap">
                          ● Chưa làm bài
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cột Phải (5 cols): Danh sách Học sinh ĐÃ LÀM BÀI trong bộ lọc */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-emerald-50/70 border-b border-emerald-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Học sinh Đã làm bài ({studentCompletionReport.submittedStudents.length} HS)
                </h3>
                <p className="text-[11px] text-slate-600">
                  Bấm vào từng bài để xem chi tiết nhận xét của Thầy
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-emerald-100 text-emerald-900 rounded-md">
              Đã nộp: {filteredSubmissions.length} bài
            </span>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Chưa có bài nộp nào cho lớp và loại bài kiểm tra đang chọn.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
              {filteredSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 hover:bg-slate-50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900">{sub.studentName}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-medium text-slate-600">{sub.className}</span>
                    </div>
                    <div className="text-[11px] text-[#0284C7] font-medium truncate">
                      [{getExamTypeBadgeLabel(sub.fileType)}] {sub.assignmentTitle}
                    </div>
                    <p className="text-[11px] text-slate-500 italic line-clamp-1">
                      Thầy nhận xét: “{sub.personalizedFeedback}”
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`font-mono text-sm font-bold ${
                        sub.finalScore >= 8.5
                          ? "text-emerald-700"
                          : sub.finalScore >= 6.5
                          ? "text-[#0284C7]"
                          : "text-red-600"
                      }`}
                    >
                      {sub.finalScore.toFixed(1)}đ
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectSubmission(sub)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#0284C7] bg-sky-50 hover:bg-sky-100 rounded transition-colors cursor-pointer"
                    >
                      Xem bài
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thống kê số lượng bài theo Loại bài kiểm tra trong phạm vi lớp đang chọn */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Thống kê Số lượng Bài nộp theo Loại Bài Kiểm Tra (
          {activeClassObj ? activeClassObj.name : "Tất cả các lớp"})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#0284C7]" />
              <div>
                <div className="font-semibold text-slate-900">Thực hành Word (.docx)</div>
                <div className="text-[11px] text-slate-500">Soạn thảo văn bản</div>
              </div>
            </div>
            <span className="font-mono text-base font-bold text-slate-900">
              {filteredSubmissions.filter((s) => s.fileType === "docx").length} bài
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Presentation className="w-4 h-4 text-orange-600" />
              <div>
                <div className="font-semibold text-slate-900">Thực hành PowerPoint (.pptx)</div>
                <div className="text-[11px] text-slate-500">Bài trình chiếu đa phương tiện</div>
              </div>
            </div>
            <span className="font-mono text-base font-bold text-slate-900">
              {filteredSubmissions.filter((s) => s.fileType === "pptx").length} bài
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cat className="w-4 h-4 text-amber-600" />
              <div>
                <div className="font-semibold text-slate-900">Thực hành Scratch (.sb3)</div>
                <div className="text-[11px] text-slate-500">Lập trình kéo thả khối lệnh</div>
              </div>
            </div>
            <span className="font-mono text-base font-bold text-slate-900">
              {filteredSubmissions.filter((s) => s.fileType === "sb3").length} bài
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpenCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="font-semibold text-slate-900">Kiểm tra Lý thuyết</div>
                <div className="text-[11px] text-slate-500">Trắc nghiệm &amp; Tự luận ngắn</div>
              </div>
            </div>
            <span className="font-mono text-base font-bold text-slate-900">
              {filteredSubmissions.filter((s) => s.fileType === "theory").length} bài
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Breakdown: Grade Distribution + Common Elementary Mistakes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Grade Distribution & Red-Alert Students (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              Phân bố Xếp loại Năng lực ({activeClassObj ? activeClassObj.name : "Các bài đã nộp"})
            </h3>

            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-emerald-700">
                    ● Mức A — Hoàn thành Tốt (8.5 – 10đ)
                  </span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {tierACount} HS ({totalSubs > 0 ? Math.round((tierACount / safeDivisor) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${totalSubs > 0 ? Math.round((tierACount / safeDivisor) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#0284C7]">
                    ● Mức B — Hoàn thành (6.5 – 8.0đ)
                  </span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {tierBCount} HS ({totalSubs > 0 ? Math.round((tierBCount / safeDivisor) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0284C7] rounded-full"
                    style={{
                      width: `${totalSubs > 0 ? Math.round((tierBCount / safeDivisor) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-red-600">
                    ▲ Mức C — Cần hỗ trợ thêm (&lt; 6.5đ)
                  </span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {tierCCount} HS ({totalSubs > 0 ? Math.round((tierCCount / safeDivisor) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{
                      width: `${totalSubs > 0 ? Math.round((tierCCount / safeDivisor) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Red Alert List */}
          <div className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Học sinh Đã làm bài nhưng Cần Thầy Kèm Riêng ({studentsNeedingSupport.length})
              </h3>
            </div>
            {studentsNeedingSupport.length === 0 ? (
              <p className="text-xs text-slate-600">
                Tất cả học sinh đã nộp bài trong danh sách lọc đều đạt mức Hoàn thành trở lên!
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {studentsNeedingSupport.map((st) => (
                  <div key={st.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900">
                        {st.studentName} · {st.className}
                      </div>
                      <p className="text-red-700">
                        Lỗi chính: {st.detectedErrors[0] || "Sai nhiều thao tác cơ bản"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectSubmission(st)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-[#0284C7] bg-sky-50 hover:bg-sky-100 rounded-md whitespace-nowrap cursor-pointer"
                    >
                      Mở bài ({st.finalScore.toFixed(1)}đ)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Common Error Breakdown & Next Lesson Recommendations (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0284C7]" />
                Thống kê Lỗi sai Điển hình &amp; Gợi ý Thầy Hướng dẫn Lại ở Tiết học tới
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng hợp tự động từ kết quả phân tích bài làm của{" "}
                {activeClassObj ? activeClassObj.name : "các lớp đang chọn"}.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {errorCategories.map((err, idx) => {
              const pct = totalSubs > 0 ? Math.round((err.count / safeDivisor) * 100) : 0;
              return (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="font-semibold text-slate-900">{err.title}</span>
                    <span className="font-mono font-bold text-slate-900 whitespace-nowrap tabular-nums">
                      {err.count} / {totalSubs} bài ({pct}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-start gap-2 pt-1 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                    <span>
                      <strong>Đề xuất tiết tới:</strong> {err.advice}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
