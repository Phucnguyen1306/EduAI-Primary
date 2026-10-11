import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  Presentation,
  Cat,
  BookOpenCheck,
  ArrowRight,
  Check,
  Plus,
  Download,
  HardDrive,
  Image as ImageIcon,
} from "lucide-react";
import { Assignment, StudentSubmission } from "../types/grading";
import { ensureTeacherPersonaThay, removeVietnameseTones } from "../utils/fileEngine";
import {
  exportParentReportToDocx,
  exportParentReportToPdf,
  generatePracticeWorkSnapshotDataUrl,
  generatePracticeWorkSnapshotSync,
  getGoogleDrivePracticeFileInfo,
  getGoogleDrivePracticeFileName,
  getOfficialParentFeedback,
  hasPracticeSection,
} from "../utils/exportEngine";
import { ScratchSimulatorPanel } from "./ScratchSimulatorPanel";

interface SubmissionInspectorModalProps {
  submission: StudentSubmission | null;
  assignments?: Assignment[];
  onClose: () => void;
  onUpdateSubmission: (
    id: string,
    updates: Partial<Pick<StudentSubmission, "finalScore" | "approvalStatus" | "personalizedFeedback">>
  ) => void;
  readOnly?: boolean;
}

export const SubmissionInspectorModal: React.FC<SubmissionInspectorModalProps> = ({
  submission,
  assignments = [],
  onClose,
  onUpdateSubmission,
  readOnly = false,
}) => {
  const [feedbackText, setFeedbackText] = useState(
    submission ? ensureTeacherPersonaThay(submission.personalizedFeedback) : ""
  );
  const [customScore, setCustomScore] = useState<number>(submission ? submission.finalScore : 0);
  const [exportStatusMsg, setExportStatusMsg] = useState<string>("");
  const [practiceSnapshotUrl, setPracticeSnapshotUrl] = useState<string>("");

  useEffect(() => {
    if (submission) {
      setFeedbackText(ensureTeacherPersonaThay(submission.personalizedFeedback));
      setCustomScore(submission.finalScore);
      if (hasPracticeSection(submission, assignments)) {
        const syncSnap = generatePracticeWorkSnapshotSync(submission, assignments);
        setPracticeSnapshotUrl(syncSnap);
        generatePracticeWorkSnapshotDataUrl(submission, assignments).then((asyncSnap) => {
          setPracticeSnapshotUrl(asyncSnap);
        });
      } else {
        setPracticeSnapshotUrl("");
      }
    }
  }, [submission, assignments]);

  if (!submission) return null;

  const shortName = submission.studentName.trim().split(/\s+/).slice(-2).join(" ");
  const isPracticeIncluded = hasPracticeSection(submission, assignments);
  const driveInfo = getGoogleDrivePracticeFileInfo(submission);

  const generateAccurateThayComment = () => {
    if (submission.detectedErrors.length === 0) {
      return `Thầy khen ${shortName} hoàn thành xuất sắc bài "${submission.assignmentTitle}"! Con thực hiện đúng tất cả các tiêu chí kỹ thuật và đặt tên tệp đúng quy định. Thầy rất tự hào về con!`;
    }
    const errSummary = submission.detectedErrors
      .slice(0, 2)
      .map((e) => e.toLowerCase())
      .join("; ");
    return `Thầy ghi nhận sự cố gắng của ${shortName} trong bài "${submission.assignmentTitle}"! Tuy nhiên qua phân tích bài làm, thầy lưu ý con cần khắc phục: ${errSummary}. Buổi thực hành tới thầy sẽ hướng dẫn thêm để con đạt điểm 10 nhé!`;
  };

  const handleApprove = (scoreToSave: number, status: "approved" | "adjusted") => {
    const clamped = Math.min(10, Math.max(0, Math.round(scoreToSave * 2) / 2));
    const cleanFeedback = ensureTeacherPersonaThay(feedbackText);
    setCustomScore(clamped);
    setFeedbackText(cleanFeedback);
    onUpdateSubmission(submission.id, {
      finalScore: clamped,
      approvalStatus: status,
      personalizedFeedback: cleanFeedback,
    });
  };

  const handleDownloadPracticeImage = () => {
    if (!practiceSnapshotUrl) return;
    const link = document.createElement("a");
    link.href = practiceSnapshotUrl;
    const cleanName = removeVietnameseTones(submission.studentName).replace(/\s+/g, "_");
    link.download = `AnhBaiLamThucHanh_${cleanName}_${driveInfo.driveFileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportStatusMsg(
      `Đã tải xuống ảnh bài làm thực hành của học sinh ${submission.studentName} (Tệp: ${driveInfo.driveFileName})!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-900">{submission.studentName}</span>
              <span>·</span>
              <span>{submission.className}</span>
              <span>·</span>
              <span className="font-mono">Chấm tự động trong {submission.processingTimeSec}s</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{submission.assignmentTitle}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* File Name Normalization Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">
                Tên tệp bài làm của học sinh trong Phiếu kết quả (Auto-Rename Syntax)
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-slate-700 font-semibold">
                  Tệp học sinh nộp: {driveInfo.studentRawFileName}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#0284C7] font-bold">
                  Tệp chuẩn hóa: {driveInfo.driveFileName}
                </span>
                {submission.wasFileNameAutoFixed ? (
                  <span className="text-amber-700 font-sans font-medium">
                    · ▲ Đã tự động sửa tên file học sinh đặt sai
                  </span>
                ) : (
                  <span className="text-emerald-700 font-sans font-medium">
                    · ● Học sinh đặt đúng cú pháp chuẩn
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono tabular-nums">
              <div className="text-right">
                <span className="text-xs text-slate-500 block font-sans">Điểm AI đề xuất</span>
                <span className="text-xl font-bold text-slate-800">{submission.aiScore.toFixed(1)} / 10</span>
              </div>
              <div className="text-right pl-6 border-l border-slate-200">
                <span className="text-xs text-slate-500 block font-sans">Điểm Giáo viên chốt</span>
                <span className="text-2xl font-bold text-[#0284C7]">{customScore.toFixed(1)} / 10</span>
              </div>
            </div>
          </div>

          {/* ẢNH BÀI LÀM THỰC HÀNH CỦA HỌC SINH & TÊN TỆP TRONG PHIẾU KẾT QUẢ (Đối với các bài có phần thực hành) */}
          {isPracticeIncluded && practiceSnapshotUrl && (
            <div className="bg-white border-2 border-sky-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#0284C7]" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Ảnh Bài Làm Thực Hành Của Học Sinh &amp; Tên Tệp Trong Phiếu Kết Quả
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-[#0284C7] rounded border border-sky-200">
                      Tự động nhúng vào Phiếu Word (.docx) &amp; PDF (.pdf)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-slate-700">
                      <strong>Tên tệp học sinh nộp:</strong>{" "}
                      <span className="font-mono font-semibold text-slate-900">
                        {driveInfo.studentRawFileName}
                      </span>
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-700">
                      <strong>Tên tệp chuẩn hóa trong phiếu:</strong>{" "}
                      <span className="font-mono font-bold text-[#0284C7]">
                        {driveInfo.driveFileName}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPracticeImage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0284C7]" />
                    Xuất Ảnh bài làm (.png)
                  </button>
                </div>
              </div>

              <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 flex flex-col items-center space-y-2">
                <img
                  src={practiceSnapshotUrl}
                  alt={`Ảnh bài làm thực hành của học sinh ${submission.studentName} - ${driveInfo.driveFileName}`}
                  className="w-full max-w-4xl rounded-lg border border-slate-300 shadow-xs bg-white object-contain"
                />
                <p className="text-xs font-medium text-slate-600 text-center">
                  📄 <strong>Tên tệp của học sinh trong phiếu:</strong>{" "}
                  <span className="font-mono text-slate-900">{driveInfo.studentRawFileName}</span>{" "}
                  ➔{" "}
                  <span className="font-mono font-bold text-[#0284C7]">
                    {driveInfo.driveFileName}
                  </span>{" "}
                  (Khi bấm Xuất Word/PDF, hình ảnh bài làm và tên tệp này được xuất trực tiếp xuống phiếu kết quả).
                </p>
              </div>
            </div>
          )}

          {/* Specialized Engine Deep-Dive View */}
          {submission.inspection.type === "sb3" && (
            <ScratchSimulatorPanel data={submission.inspection.data} />
          )}

          {submission.inspection.type === "docx" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0284C7]" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    {submission.inspection.data.engine} — Quét cấu trúc XML Văn bản Word
                  </h4>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Khổ giấy: {submission.inspection.data.paperSize} · Font:{" "}
                  {submission.inspection.data.detectedFonts.join(", ")}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Tiêu đề (Cỡ chữ &amp; Màu)</span>
                  <span className="font-mono font-semibold text-slate-900 mt-1 block">
                    {submission.inspection.data.titleFontSizePt}pt ·{" "}
                    {submission.inspection.data.titleColorHex} ·{" "}
                    {submission.inspection.data.titleBold ? "In đậm" : "Thường"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Căn lề Tiêu đề</span>
                  <span className="font-mono font-semibold text-slate-900 mt-1 block uppercase">
                    {submission.inspection.data.titleAlignment}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Hình ảnh chèn (&lt;w:drawing&gt;)</span>
                  <span className="font-mono font-semibold text-slate-900 mt-1 block">
                    {submission.inspection.data.imageCount} ảnh ·{" "}
                    {submission.inspection.data.imageAlignedCenter ? "● Đã căn giữa" : "▲ Lệch trái"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Số đoạn văn (&lt;w:p&gt;)</span>
                  <span className="font-mono font-semibold text-slate-900 mt-1 block">
                    {submission.inspection.data.paragraphCount} dòng
                  </span>
                </div>
              </div>

              {/* Line-by-line DOM preview */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Phân tích chi tiết từng dòng văn bản:
                </span>
                {submission.inspection.data.extractedLines.map((line) => (
                  <div
                    key={line.lineNumber}
                    className={`p-3 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2 ${
                      !line.startsWithUppercase
                        ? "bg-red-50/60 border-red-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400">Dòng {line.lineNumber}</span>
                      <span
                        className="text-slate-900"
                        style={{
                          fontWeight: line.isBold ? 700 : 400,
                          color: line.colorHex,
                        }}
                      >
                        “{line.text}”
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-600">
                      <span>{line.fontSizePt}pt</span>
                      <span>·</span>
                      <span>Căn lề: {line.alignment}</span>
                      <span>·</span>
                      {line.startsWithUppercase ? (
                        <span className="text-emerald-700 font-sans font-medium">● Viết hoa đầu dòng</span>
                      ) : (
                        <span className="text-red-700 font-sans font-semibold">
                          ▲ Lỗi: Chưa viết hoa đầu dòng
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submission.inspection.type === "pptx" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Presentation className="w-4 h-4 text-[#0284C7]" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    {submission.inspection.data.engine} — Quét thuộc tính Slide &amp; Hiệu ứng
                  </h4>
                </div>
                <span className="text-xs font-mono text-slate-600">
                  Tổng số Slide phát hiện: {submission.inspection.data.slideCount} slide
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {submission.inspection.data.slides.map((sl) => (
                  <div key={sl.slideNumber} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-slate-900">SLIDE #{sl.slideNumber}</span>
                      <span className="text-slate-500">{sl.layoutName}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">“{sl.titleText}”</p>
                    <div className="pt-2 border-t border-slate-200 space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Hình nền (&lt;p:bg&gt;):</span>
                        <span className={sl.hasBackgroundFill ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>
                          {sl.hasBackgroundFill ? "● Đã chèn" : "▲ Nền trắng"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Đa phương tiện:</span>
                        <span className="font-mono">
                          {sl.imageCount} ảnh · {sl.audioCount} âm thanh
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chuyển trang (Transition):</span>
                        <span className={sl.hasTransition ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>
                          {sl.hasTransition ? `● ${sl.transitionType || "Có"}` : "▲ Chưa gán"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hiệu ứng động (Animation):</span>
                        <span className="font-mono">{sl.animationCount} hiệu ứng</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submission.inspection.type === "theory" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="w-4 h-4 text-[#0284C7]" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    {submission.inspection.data.engine} — Đọc hiểu Ngữ nghĩa Tự luận ngắn (NLP)
                  </h4>
                </div>
                <span className="text-xs font-mono text-emerald-700 font-semibold">
                  Độ tương đồng ngữ nghĩa NLP: {submission.inspection.data.nlpSimilarityScore}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <span className="text-slate-500 font-medium block">
                    Câu hỏi: {submission.inspection.data.shortAnswerQuestion}
                  </span>
                  <p className="text-slate-900 font-medium text-sm bg-white p-3 rounded border border-slate-200">
                    “{submission.inspection.data.studentShortAnswer}”
                  </p>
                </div>
                <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-lg space-y-2">
                  <span className="text-sky-900 font-semibold block">
                    Nhận diện Khái niệm Đồng nghĩa của Học sinh Tiểu học:
                  </span>
                  <ul className="space-y-1 text-slate-700">
                    {submission.inspection.data.matchedSemanticConcepts.map((concept, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{concept}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-slate-600 pt-1 border-t border-sky-200/60">
                    {submission.inspection.data.nlpExplanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rubric Checklist Breakdown & AI Personalized Comment */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Checklist Table (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-200">
                Bảng đối chiếu Ma trận Tiêu chí Chấm điểm
              </h4>
              <div className="divide-y divide-slate-200">
                {submission.criterionBreakdown.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {item.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-900">{item.criterion}</span>
                      </div>
                      <p className="text-slate-600 pl-6">{item.detailNote}</p>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                      {item.earnedPoints.toFixed(1)} / {item.maxPoints.toFixed(1)}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Approval & Leniency Controls OR Student Read-Only Result Card (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
              {readOnly ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#0284C7]" />
                      Nhận xét của Thầy dành cho {submission.studentName}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                        submission.approvalStatus === "approved" ||
                        submission.approvalStatus === "adjusted"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {submission.approvalStatus === "approved" ||
                      submission.approvalStatus === "adjusted"
                        ? "● Thầy đã duyệt điểm"
                        : "● Đang chờ Thầy duyệt"}
                    </span>
                  </div>

                  <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-slate-800 leading-relaxed font-medium">
                    “{feedbackText}”
                  </div>

                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1 text-xs">
                    <div className="font-bold text-emerald-900">
                      Thông tin Tệp thực hành trong Phiếu kết quả:
                    </div>
                    <p className="text-[11px] text-slate-700">
                      <strong>Tên tệp của học sinh:</strong>{" "}
                      <span className="font-mono">{driveInfo.studentRawFileName}</span>
                    </p>
                    <p className="text-[11px] text-slate-700">
                      <strong>Tên tệp chuẩn hóa:</strong>{" "}
                      <span className="font-mono text-[#0284C7] font-semibold">
                        {driveInfo.driveFileName}
                      </span>
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Chế độ xem dành cho Học sinh: Em có thể xem chi tiết điểm số, ảnh bài làm thực hành, tên tệp và tải xuống Phiếu kết quả Word/PDF.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#0284C7]" />
                      Nhận xét của Thầy (Phân tích theo bài làm)
                    </span>
                    <button
                      type="button"
                      onClick={() => setFeedbackText(generateAccurateThayComment())}
                      className="text-[11px] font-semibold text-[#0284C7] bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-md border border-sky-200 transition-colors cursor-pointer"
                    >
                      Viết lại theo lỗi bài làm
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full p-3 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0284C7]"
                  />

                  {/* 1-Click Elementary Leniency Adjustments */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-500 block">
                      Châm chước / Khích lệ học sinh tiểu học (1-Click):
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(submission.aiScore + 0.5, "adjusted")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" /> Cộng +0.5đ khích lệ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(submission.aiScore + 1.0, "adjusted")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" /> Cộng +1.0đ châm chước
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(submission.aiScore, "approved")}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer whitespace-nowrap"
                      >
                        Giữ nguyên điểm AI ({submission.aiScore.toFixed(1)}đ)
                      </button>
                    </div>
                  </div>
                  {/* Xem trước Nhận xét chính thức & Tên tệp Google Drive khi Xuất cho Phụ huynh */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
                        Thông tin Phiếu Kết Quả (Word / PDF):
                      </span>
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        Có ảnh bài làm &amp; Tên tệp
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700">
                      <strong>Nhận xét chính thức:</strong> “
                      {getOfficialParentFeedback(feedbackText, customScore, submission.studentName)}”
                    </p>
                    <p className="text-[11px] text-slate-700">
                      <strong>Tên tệp của học sinh:</strong>{" "}
                      <span className="font-mono">{driveInfo.studentRawFileName}</span> ➔{" "}
                      <span className="font-mono font-bold text-[#0284C7]">
                        {driveInfo.driveFileName}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-700 font-mono truncate">
                      <strong className="font-sans">Đường dẫn Drive:</strong>{" "}
                      {getGoogleDrivePracticeFileName(submission)}
                    </p>
                  </div>
                </div>
              )}

              {exportStatusMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-semibold text-emerald-800">
                  {exportStatusMsg}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      const updatedSub: StudentSubmission = {
                        ...submission,
                        finalScore: customScore,
                        personalizedFeedback: ensureTeacherPersonaThay(feedbackText),
                      };
                      await exportParentReportToDocx(
                        [updatedSub],
                        assignments,
                        `Học sinh ${submission.studentName} (${submission.className})`
                      );
                      setExportStatusMsg(
                        `Đã tải xuống Phiếu kết quả Word (.docx) kèm ảnh bài làm & tên tệp của ${submission.studentName}!`
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0284C7] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Xuất Phiếu Word (.docx)
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const updatedSub: StudentSubmission = {
                        ...submission,
                        finalScore: customScore,
                        personalizedFeedback: ensureTeacherPersonaThay(feedbackText),
                      };
                      await exportParentReportToPdf(
                        [updatedSub],
                        assignments,
                        `Học sinh ${submission.studentName} (${submission.className})`
                      );
                      setExportStatusMsg(
                        `Đã tải xuống Phiếu kết quả PDF (.pdf) kèm ảnh bài làm & tên tệp của ${submission.studentName}!`
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Xuất Phiếu PDF (.pdf)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Đóng cửa sổ
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        handleApprove(
                          customScore,
                          customScore === submission.aiScore ? "approved" : "adjusted"
                        );
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      Duyệt &amp; Lưu Kết quả ({customScore.toFixed(1)}đ)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
