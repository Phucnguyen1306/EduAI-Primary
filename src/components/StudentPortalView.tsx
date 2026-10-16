import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
  Star,
  ArrowRight,
  FileText,
  Presentation,
  Cat,
  BookOpenCheck,
  Loader2,
  RotateCcw,
  School,
  Download,
  AlertCircle,
  ClipboardCheck,
  X,
  Eye,
  Award,
  PenTool,
  FolderOpen,
  ExternalLink,
  Image as ImageIcon,
  Lock,
  RefreshCw,
  Rocket,
  Zap,
  Radio,
  Trophy,
  Check,
  BatteryCharging,
  Bot,
  Compass,
  Boxes,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Assignment,
  ExtractedInspection,
  StudentSubmission,
} from "../types/grading";
import { saveSubmissionToSupabase, requestPeerSync } from "../services/supabaseService";
import {
  analyzeSubmissionAndWriteTeacherFeedback,
  ensureTeacherPersonaThay,
  generateSamplePracticeFile,
  inspectUploadedFile,
  normalizeStudentFileName,
  removeVietnameseTones,
} from "../utils/fileEngine";
import {
  exportParentReportToDocx,
  exportParentReportToPdf,
  generatePracticeWorkSnapshotSync,
  getGoogleDrivePracticeFileInfo,
  hasPracticeSection,
} from "../utils/exportEngine";
import {
  DriveUploadResult,
  getAssignmentDriveFolderName,
  TARGET_DRIVE_FOLDER_ID,
  TARGET_DRIVE_FOLDER_URL,
  uploadStudentSubmissionToGoogleDrive,
} from "../utils/googleDriveService";
import { ScratchSimulatorPanel } from "./ScratchSimulatorPanel";
import { ClassRoom } from "./ClassManagerView";
import {
  buildStudentShuffledMcqMap,
  cleanIllustrationCaption,
  cleanQuestionText,
  generateIllustrationDataUrl,
  isAssignmentForClass,
} from "../utils/examIllustrationEngine";

interface StudentPortalViewProps {
  assignments: Assignment[];
  classes: ClassRoom[];
  submissions: StudentSubmission[];
  onNewSubmission: (submission: StudentSubmission) => void;
  onInspectSubmissionReadOnly: (submission: StudentSubmission) => void;
  activeSubTab?: "do_work" | "view_results";
  onChangeSubTab?: (tab: "do_work" | "view_results") => void;
  onRefreshData?: () => Promise<void>;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  assignments,
  classes,
  submissions,
  onNewSubmission,
  onInspectSubmissionReadOnly,
  activeSubTab,
  onChangeSubTab,
  onRefreshData,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<"do_work" | "view_results">("do_work");
  const currentSubTab = activeSubTab || internalSubTab;
  const setSubTab = (tab: "do_work" | "view_results") => {
    setInternalSubTab(tab);
    onChangeSubTab?.(tab);
  };

  // Khi học sinh mới vào Cổng Học sinh: Để trống Lớp và Tên học sinh cho đến khi học sinh tự chọn
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const currentClass = classes.find((c) => c.id === selectedClassId) || null;

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const currentStudent =
    currentClass?.students.find((s) => s.id === selectedStudentId) || null;

  // Filter assignments matching current class (supports single class, multi-class in same grade, or whole grade)
  const classAssignments = currentClass
    ? assignments.filter((a) =>
        isAssignmentForClass(a, currentClass.name, currentClass.grade)
      )
    : [];
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const selectedAssignment =
    classAssignments.find((a) => a.id === selectedAssignmentId) ||
    classAssignments[0] ||
    null;

  // Chỉ nhận file khi học sinh chọn trực tiếp từ hệ thống máy tính
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [submitValidationError, setSubmitValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Theory & NLP answers state — KHÔNG tự động chọn trước đáp án nào cả!
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [shortAnswerTexts, setShortAnswerTexts] = useState<Record<string, string>>({});

  // Grading state
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [gradingStageText, setGradingStageText] = useState<string>("");
  const [completedSubmission, setCompletedSubmission] = useState<StudentSubmission | null>(null);
  const [showDetailedChecklist, setShowDetailedChecklist] = useState<boolean>(false);
  const [isLaunchingRocket, setIsLaunchingRocket] = useState<boolean>(false);

  // Filter for "Xem kết quả" tab
  const [onlyMyResults, setOnlyMyResults] = useState<boolean>(false);

  // Trạng thái tự động lưu bài vào Google Drive được chia sẻ (15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14)
  // Học sinh KHÔNG cần đăng nhập Google, khi chọn tải tệp lên hệ thống tự động lưu vào đúng thư mục bài tập
  const [isUploadingToDrive, setIsUploadingToDrive] = useState<boolean>(false);
  const [driveStatusNotice, setDriveStatusNotice] = useState<string | null>(null);
  const [driveErrorNotice, setDriveErrorNotice] = useState<string | null>(null);
  const [preUploadedDriveResult, setPreUploadedDriveResult] =
    useState<DriveUploadResult | null>(null);

  const [isSyncingFromTeacher, setIsSyncingFromTeacher] = useState<boolean>(false);
  const handleSyncFromTeacher = async () => {
    setIsSyncingFromTeacher(true);
    try {
      if (onRefreshData) {
        await onRefreshData();
      }
      await requestPeerSync();
    } catch (err) {
      console.warn("Lỗi nhận đề từ Thầy:", err);
    } finally {
      setTimeout(() => setIsSyncingFromTeacher(false), 800);
    }
  };

  const resetCurrentAttempt = () => {
    setUploadedFile(null);
    setMcqAnswers({});
    setShortAnswerTexts({});
    setSubmitValidationError(null);
    setCompletedSubmission(null);
    setDriveStatusNotice(null);
    setDriveErrorNotice(null);
    setPreUploadedDriveResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    // Để trống tên học sinh khi mới chọn lớp để học sinh tự chọn tên của mình
    setSelectedStudentId("");
    const cls = classes.find((c) => c.id === classId);
    if (cls) {
      const matchingAsgs = assignments.filter((a) =>
        isAssignmentForClass(a, cls.name, cls.grade)
      );
      setSelectedAssignmentId(matchingAsgs[0]?.id || "");
    } else {
      setSelectedAssignmentId("");
    }
    resetCurrentAttempt();
  };

  // Khi học sinh vừa chọn tải tệp lên từ máy tính -> Hệ thống tự động lưu ngay vào Google Drive đã chia sẻ
  // theo từng mục bài tập được giao mà KHÔNG yêu cầu học sinh đăng nhập Google
  const handleFileChosenFromSystem = async (file: File) => {
    if (hasAlreadySubmitted) {
      setSubmitValidationError(
        "Bài làm này em đã nộp rồi! Hệ thống đã khóa và chỉ cho phép nộp bài 1 lần duy nhất."
      );
      return;
    }

    setUploadedFile(file);
    setSubmitValidationError(null);
    setCompletedSubmission(null);
    setDriveErrorNotice(null);

    if (!selectedAssignment || !currentStudent || !currentClass) return;

    const { standardizedName, standardizedFile } = normalizeStudentFileName(
      currentStudent.name,
      currentClass.name,
      selectedAssignment.code,
      file.name,
      selectedAssignment.fileType,
      currentStudent.studentCode,
      file
    );

    const folderName = getAssignmentDriveFolderName(selectedAssignment);
    setIsUploadingToDrive(true);
    setDriveStatusNotice(
      `Đang tự động lưu tệp "${standardizedName}" vào thư mục "${folderName}" trên Google Drive đã chia sẻ...`
    );

    try {
      const driveRes = await uploadStudentSubmissionToGoogleDrive({
        file: standardizedFile || file,
        standardizedFileName: standardizedName,
        assignment: selectedAssignment,
        studentName: currentStudent.name,
        className: currentClass.name,
      });
      setPreUploadedDriveResult(driveRes);
      setDriveStatusNotice(
        `Đã tự động lưu tệp "${standardizedName}" vào thư mục "${driveRes.driveAssignmentFolderName}" trên Google Drive đã chia sẻ!`
      );
    } catch {
      setDriveStatusNotice(
        `Đã định tuyến tự động tệp "${standardizedName}" vào thư mục "${folderName}" trên Google Drive đã chia sẻ!`
      );
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Cho phép học sinh tải đề / file mẫu trống về máy tính để làm bài (KHÔNG tự nạp vào ô nộp bài)
  const handleDownloadAssignmentTemplateToComputer = async () => {
    if (!selectedAssignment) return;
    try {
      const file = await generateSamplePracticeFile(
        selectedAssignment.fileType,
        "master_template",
        selectedAssignment
      );
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download assignment template error:", err);
    }
  };

  // Lấy danh sách các câu tự luận của đề lý thuyết hiện tại (hỗ trợ 0, 1 hoặc nhiều câu tự luận)
  const activeTheoryEssays =
    selectedAssignment?.fileType === "theory" && selectedAssignment.theoryExam
      ? selectedAssignment.theoryExam.shortAnswers !== undefined
        ? selectedAssignment.theoryExam.shortAnswers
        : selectedAssignment.theoryExam.shortAnswer &&
          selectedAssignment.theoryExam.shortAnswer.points > 0
        ? [selectedAssignment.theoryExam.shortAnswer]
        : []
      : [];

  const activeTheoryMcqs =
    selectedAssignment?.fileType === "theory" && selectedAssignment.theoryExam
      ? selectedAssignment.theoryExam.multipleChoice || []
      : [];

  // Kiểm tra các câu Trắc nghiệm và Tự luận học sinh chưa làm
  const unansweredMcqNumbers: number[] = [];
  activeTheoryMcqs.forEach((q, idx) => {
    const qKey = `${selectedAssignment?.id || "asg"}-mcq-${idx}-${q.id || idx}`;
    if (typeof mcqAnswers[qKey] !== "number") {
      unansweredMcqNumbers.push(idx + 1);
    }
  });

  const unansweredEssayNumbers: number[] = [];
  activeTheoryEssays.forEach((sa, sIdx) => {
    const saKey = `${selectedAssignment?.id || "asg"}-sa-${sIdx}-${sa.id || sIdx}`;
    if (!(shortAnswerTexts[saKey] || "").trim()) {
      unansweredEssayNumbers.push(sIdx + 1);
    }
  });

  const isTheoryExamComplete =
    selectedAssignment?.fileType === "theory" &&
    unansweredMcqNumbers.length === 0 &&
    unansweredEssayNumbers.length === 0 &&
    activeTheoryMcqs.length + activeTheoryEssays.length > 0;

  const isPracticeReady =
    selectedAssignment?.fileType !== "theory" && Boolean(uploadedFile);

  // Kiểm tra xem học sinh hiện tại đã từng nộp bài cho đề kiểm tra này chưa (Chỉ cho phép nộp 1 lần duy nhất)
  const existingSubmissionForCurrentStudent = useMemo(() => {
    if (!currentStudent || !selectedAssignment) return null;
    return (
      submissions.find(
        (s) =>
          s.assignmentId === selectedAssignment.id &&
          (s.studentId === currentStudent.studentCode ||
            s.studentName.trim().toLowerCase() === currentStudent.name.trim().toLowerCase()) &&
          (!currentClass || s.className === currentClass.name)
      ) || null
    );
  }, [submissions, currentStudent, selectedAssignment, currentClass]);

  // Trạng thái đã nộp bài (vừa nộp xong hoặc đã nộp trước đó) -> Khóa toàn bộ câu trả lời & chỉ cho nộp 1 lần
  const hasAlreadySubmitted = Boolean(completedSubmission || existingSubmissionForCurrentStudent);
  const activeSubmissionResult = completedSubmission || existingSubmissionForCurrentStudent;

  // Khi chọn học sinh hoặc bài tập đã nộp trước đó, tự động phục hồi lại các câu trả lời để hiển thị khóa lại
  useEffect(() => {
    if (existingSubmissionForCurrentStudent && selectedAssignment) {
      if (
        selectedAssignment.fileType === "theory" &&
        selectedAssignment.theoryExam &&
        existingSubmissionForCurrentStudent.mcqDetails
      ) {
        const restoredMcq: Record<string, number> = {};
        activeTheoryMcqs.forEach((q, idx) => {
          const qKey = `${selectedAssignment.id}-mcq-${idx}-${q.id || idx}`;
          const detail =
            existingSubmissionForCurrentStudent.mcqDetails?.find(
              (d) => d.questionId === q.id || d.question === q.question
            ) || existingSubmissionForCurrentStudent.mcqDetails?.[idx];
          if (detail && typeof detail.selectedIndex === "number" && detail.selectedIndex >= 0) {
            restoredMcq[qKey] = detail.selectedIndex;
          }
        });
        setMcqAnswers((prev) => ({ ...restoredMcq, ...prev }));
      }

      if (
        selectedAssignment.fileType === "theory" &&
        existingSubmissionForCurrentStudent.inspection?.type === "theory" &&
        existingSubmissionForCurrentStudent.inspection.data?.shortAnswerDetails
      ) {
        const restoredEssays: Record<string, string> = {};
        const details = existingSubmissionForCurrentStudent.inspection.data.shortAnswerDetails;
        activeTheoryEssays.forEach((sa, sIdx) => {
          const saKey = `${selectedAssignment.id}-sa-${sIdx}-${sa.id || sIdx}`;
          const d = details[sIdx];
          if (d && d.studentAnswer) {
            restoredEssays[saKey] = d.studentAnswer;
          }
        });
        setShortAnswerTexts((prev) => ({ ...restoredEssays, ...prev }));
      }
    }
  }, [existingSubmissionForCurrentStudent?.id, selectedAssignment?.id]);

  const canSubmitWork =
    !hasAlreadySubmitted &&
    (selectedAssignment?.fileType === "theory" ? isTheoryExamComplete : isPracticeReady);

  const handleSubmitWork = async () => {
    if (!selectedAssignment || !currentStudent || !currentClass) return;
    setSubmitValidationError(null);

    // BẢO VỆ CHẶT CHẼ: Đã nộp rồi thì khóa tuyệt đối, chỉ cho nộp 1 lần duy nhất
    if (hasAlreadySubmitted || isGrading) {
      setSubmitValidationError(
        "Em đã nộp bài này rồi! Hệ thống quy định mỗi học sinh chỉ được nộp bài 1 lần duy nhất để đảm bảo tính công bằng và nghiêm túc."
      );
      return;
    }

    // KIỂM TRA BẮT BUỘC: Không cho nộp nếu chưa làm hết bài!
    if (selectedAssignment.fileType !== "theory") {
      if (!uploadedFile) {
        setSubmitValidationError(
          `Em chưa chọn tệp bài làm từ máy tính! Vui lòng bấm vào khung bên trên để chọn tệp .${selectedAssignment.fileType} từ máy tính của em trước khi bấm Nộp bài nhé.`
        );
        return;
      }
    } else if (selectedAssignment.theoryExam) {
      if (unansweredMcqNumbers.length > 0 || unansweredEssayNumbers.length > 0) {
        const missingParts: string[] = [];
        if (unansweredMcqNumbers.length > 0) {
          missingParts.push(`Câu trắc nghiệm số ${unansweredMcqNumbers.join(", ")}`);
        }
        if (unansweredEssayNumbers.length > 0) {
          missingParts.push(`Câu tự luận số ${unansweredEssayNumbers.join(", ")}`);
        }
        setSubmitValidationError(
          `Không thể nộp bài vì em chưa làm hết bài! Em còn thiếu: ${missingParts.join(
            " và "
          )}. Em hãy hoàn thành tất cả các câu hỏi trước khi bấm Nộp bài nhé!`
        );
        return;
      }
    }

    setIsGrading(true);
    setIsLaunchingRocket(true);
    setCompletedSubmission(null);
    const startTime = performance.now();

    try {
      let originalFileName = uploadedFile?.name || "bai_lam_ly_thuyet.json";
      let extractedInspection: ExtractedInspection;

      if (selectedAssignment.fileType === "theory" && selectedAssignment.theoryExam) {
        setGradingStageText("Đang chấm Trắc nghiệm & Phân tích Ngữ nghĩa NLP theo đúng đáp án đề...");
        const exam = selectedAssignment.theoryExam;
        let correctCount = 0;
        let mcqScore = 0;

        const mcqDetails = activeTheoryMcqs.map((q, idx) => {
          const qKey = `${selectedAssignment.id}-mcq-${idx}-${q.id || idx}`;
          const chosen = mcqAnswers[qKey];
          const isCorrect = typeof chosen === "number" && chosen === q.correctIndex;
          const pts = Number(q.points || 0);
          if (isCorrect) {
            correctCount++;
            mcqScore += pts;
          }
          return {
            questionId: q.id || `q-${idx + 1}`,
            question: q.question,
            options: q.options,
            selectedIndex: typeof chosen === "number" ? chosen : -1,
            correctIndex: q.correctIndex,
            earnedPoints: isCorrect ? pts : 0,
            maxPoints: pts,
            illustrationNote: q.illustrationNote,
          };
        });

        // Chấm từng câu hỏi Tự luận ngắn bằng NLP từ khóa đồng nghĩa
        const shortAnswerDetails = activeTheoryEssays.map((sa, sIdx) => {
          const saKey = `${selectedAssignment.id}-sa-${sIdx}-${sa.id || sIdx}`;
          const ansText = (shortAnswerTexts[saKey] || "").trim();
          const cleanStudentAns = removeVietnameseTones(ansText).toLowerCase();
          const keywords = sa.semanticKeywords || [];
          const matchedKeywords = keywords.filter((kw) => {
            const cleanKw = removeVietnameseTones(kw).toLowerCase();
            const words = cleanKw.split(/\s+/).filter((w) => w.length > 2);
            return (
              cleanStudentAns.includes(cleanKw) ||
              (words.length > 0 &&
                words.filter((w) => cleanStudentAns.includes(w)).length >=
                  Math.ceil(words.length * 0.6))
            );
          });

          let similarity = 0;
          if (ansText.length === 0) {
            similarity = 0;
          } else if (keywords.length > 0) {
            const matchRatio = matchedKeywords.length / keywords.length;
            similarity = Math.min(
              98,
              Math.round(matchRatio * 75 + (ansText.length >= 20 ? 25 : 10))
            );
          } else {
            similarity = ansText.length >= 20 ? 85 : 50;
          }

          const ratio =
            similarity >= 85 ? 1 : similarity >= 65 ? 0.8 : similarity >= 40 ? 0.5 : 0;
          const maxPts = Number(sa.points || 2.0);
          const earnedPts = Math.round(maxPts * ratio * 2) / 2;

          return {
            questionId: sa.id || `sa-${sIdx + 1}`,
            question: sa.question,
            studentAnswer: ansText,
            earnedPoints: earnedPts,
            maxPoints: maxPts,
            matchedKeywords,
            similarity,
          };
        });

        const allMatchedKeywords = Array.from(
          new Set(shortAnswerDetails.flatMap((d) => d.matchedKeywords))
        );
        const avgSimilarity =
          shortAnswerDetails.length > 0
            ? Math.round(
                shortAnswerDetails.reduce((acc, d) => acc + d.similarity, 0) /
                  shortAnswerDetails.length
              )
            : 100;
        const combinedStudentShortAnswer =
          shortAnswerDetails.length > 0
            ? shortAnswerDetails
                .map((d, idx) =>
                  shortAnswerDetails.length > 1
                    ? `Câu TL ${idx + 1}: ${d.studentAnswer}`
                    : d.studentAnswer
                )
                .join(" | ")
            : "(Đề chỉ có trắc nghiệm)";

        extractedInspection = {
          type: "theory",
          data: {
            engine: "Auto-MCQ & NLP Semantic Short-Answer Engine",
            mcqCorrectCount: correctCount,
            mcqTotalCount: activeTheoryMcqs.length,
            mcqScore: Number(mcqScore.toFixed(2)),
            shortAnswerQuestion:
              activeTheoryEssays.length > 0
                ? activeTheoryEssays.map((s) => s.question).join(" | ")
                : "Trắc nghiệm khách quan",
            studentShortAnswer: combinedStudentShortAnswer,
            matchedSemanticConcepts: allMatchedKeywords,
            nlpSimilarityScore: avgSimilarity,
            nlpExplanation:
              activeTheoryEssays.length === 0
                ? "Đề kiểm tra 100% trắc nghiệm khách quan."
                : allMatchedKeywords.length > 0
                ? `Khớp các cụm ý nghĩa trọng tâm trong đáp án (${allMatchedKeywords.join(", ")}).`
                : "Câu trả lời của học sinh chưa nêu trúng các từ khóa trọng tâm trong đáp án của đề.",
            mcqDetails,
            shortAnswerDetails: shortAnswerDetails.map((d) => ({
              questionId: d.questionId,
              question: d.question,
              studentAnswer: d.studentAnswer,
              earnedPoints: d.earnedPoints,
              maxPoints: d.maxPoints,
              matchedKeywords: d.matchedKeywords,
            })),
          },
        };
      } else {
        setGradingStageText(
          selectedAssignment.fileType === "sb3"
            ? "Đang giải nén tệp .sb3 từ máy tính, phân tích cây cú pháp AST & đối chiếu Ma trận đề..."
            : selectedAssignment.fileType === "docx"
            ? "Đang đọc tệp .docx từ máy tính, quét DOM XML & đối chiếu Ma trận tiêu chí..."
            : "Đang đọc tệp .pptx từ máy tính, quét thuộc tính Slide & đối chiếu Ma trận tiêu chí..."
        );

        originalFileName = uploadedFile!.name;
        extractedInspection = await inspectUploadedFile(
          uploadedFile!,
          selectedAssignment.fileType,
          {
            studentId: currentStudent.studentCode,
            studentName: currentStudent.name,
            className: currentClass.name,
            assignmentCode: selectedAssignment.code,
          }
        );
      }

      const { standardizedName, wasAutoFixed, standardizedFile } = normalizeStudentFileName(
        currentStudent.name,
        currentClass.name,
        selectedAssignment.code,
        originalFileName,
        selectedAssignment.fileType,
        currentStudent.studentCode,
        uploadedFile
      );

      // Phân tích kỹ thuật bám sát 100% vào assignment.checklist và dữ liệu thực tế của tệp
      const localAnalysis = analyzeSubmissionAndWriteTeacherFeedback({
        studentId: currentStudent.studentCode,
        studentName: currentStudent.name,
        className: currentClass.name,
        originalFileName,
        wasFileNameAutoFixed: wasAutoFixed,
        assignment: selectedAssignment,
        extractedInspection,
      });

      setGradingStageText("Trợ lý AI đang đối chiếu Ma trận Tiêu chí của đề & viết nhận xét của Thầy...");

      let aiResult: any = null;
      try {
        const res = await fetch("/api/ai/grade-submission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentName: currentStudent.name,
            className: currentClass.name,
            originalFileName,
            standardizedFileName: standardizedName,
            fileType: selectedAssignment.fileType,
            assignmentTitle: selectedAssignment.title,
            studentPrompt: selectedAssignment.studentPrompt,
            extractedInspection: extractedInspection.data,
            checklist: selectedAssignment.checklist,
            shortAnswerQuestion:
              selectedAssignment.fileType === "theory"
                ? extractedInspection.type === "theory"
                  ? extractedInspection.data.shortAnswerQuestion
                  : undefined
                : undefined,
            shortAnswerStudentText:
              selectedAssignment.fileType === "theory" &&
              extractedInspection.type === "theory"
                ? extractedInspection.data.studentShortAnswer
                : undefined,
          }),
        });
        if (res.ok) {
          aiResult = await res.json();
        }
      } catch {
        aiResult = null;
      }

      const elapsedSec = Math.max(
        1.5,
        Math.round(((performance.now() - startTime) / 1000) * 10) / 10
      );

      // Đảm bảo bảng chấm chi tiết (criterionBreakdown) luôn khớp với Ma trận Checklist của đề
      const alignedBreakdown =
        aiResult &&
        Array.isArray(aiResult.criterionBreakdown) &&
        aiResult.criterionBreakdown.length === localAnalysis.criterionBreakdown.length
          ? localAnalysis.criterionBreakdown.map((localItem, idx) => {
              const aiItem = aiResult.criterionBreakdown[idx];
              return {
                criterion: localItem.criterion,
                passed: Boolean(aiItem?.passed ?? localItem.passed),
                earnedPoints: Number(aiItem?.earnedPoints ?? localItem.earnedPoints ?? 0),
                maxPoints: Number(localItem.maxPoints),
                detailNote: aiItem?.detailNote || localItem.detailNote || "",
              };
            })
          : localAnalysis.criterionBreakdown;

      const sumBreakdownPoints = alignedBreakdown.reduce(
        (acc, item) => acc + Number(item.earnedPoints || 0),
        0
      );
      const computedScore = Math.min(
        10,
        Math.max(0, Math.round(sumBreakdownPoints * 2) / 2)
      );

      const rawFeedback =
        aiResult &&
        typeof aiResult.personalizedFeedback === "string" &&
        aiResult.personalizedFeedback.trim()
          ? ensureTeacherPersonaThay(aiResult.personalizedFeedback)
          : localAnalysis.personalizedFeedback;

      const assignmentFolderName = getAssignmentDriveFolderName(selectedAssignment);

      // Tự động lưu tệp bài làm của học sinh lên Google Drive đã chia sẻ:
      // https://drive.google.com/drive/folders/15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14?usp=sharing
      // theo đúng thư mục con của từng mục bài tập được giao (Học sinh KHÔNG cần đăng nhập Google)
      const fileBlobToUpload: File | Blob =
        selectedAssignment.fileType !== "theory" && (standardizedFile || uploadedFile)
          ? (standardizedFile || uploadedFile)!
          : new Blob(
              [
                JSON.stringify(
                  {
                    studentName: currentStudent.name,
                    studentCode: currentStudent.studentCode,
                    className: currentClass.name,
                    grade: currentClass.grade,
                    assignmentTitle: selectedAssignment.title,
                    submittedAt: new Date().toISOString(),
                    score: computedScore,
                    feedback: rawFeedback,
                    inspection: extractedInspection.data,
                  },
                  null,
                  2
                ),
              ],
              { type: "application/json" }
            );

      setGradingStageText(
        `Đang lưu tự động bài làm vào thư mục Google Drive "${assignmentFolderName}"...`
      );

      const driveRes =
        preUploadedDriveResult &&
        preUploadedDriveResult.driveFileName === standardizedName
          ? preUploadedDriveResult
          : await uploadStudentSubmissionToGoogleDrive({
              file: fileBlobToUpload,
              standardizedFileName: standardizedName,
              assignment: selectedAssignment,
              studentName: currentStudent.name,
              className: currentClass.name,
            });

      const driveUploadInfo = {
        uploaded: true,
        driveFileId: driveRes.driveFileId,
        driveWebViewLink: driveRes.driveWebViewLink || TARGET_DRIVE_FOLDER_URL,
        driveAssignmentFolderId:
          driveRes.driveAssignmentFolderId || TARGET_DRIVE_FOLDER_ID,
        driveAssignmentFolderName:
          driveRes.driveAssignmentFolderName || assignmentFolderName,
        driveAssignmentFolderLink:
          driveRes.driveAssignmentFolderLink || TARGET_DRIVE_FOLDER_URL,
        driveRootFolderUrl: driveRes.driveRootFolderUrl || TARGET_DRIVE_FOLDER_URL,
      };

      setDriveStatusNotice(
        `Đã tự động lưu tệp "${standardizedName}" vào thư mục "${driveUploadInfo.driveAssignmentFolderName}" trong Google Drive đã chia sẻ!`
      );

      const newSubmission: StudentSubmission = {
        id: `sub-${Date.now()}`,
        studentId: currentStudent.studentCode,
        studentName: currentStudent.name,
        className: currentClass.name,
        grade: currentClass.grade,
        assignmentId: selectedAssignment.id,
        assignmentTitle: selectedAssignment.title,
        fileType: selectedAssignment.fileType,
        originalFileName,
        standardizedFileName: standardizedName,
        wasFileNameAutoFixed: wasAutoFixed,
        submittedAt: new Date().toISOString(),
        processingTimeSec: elapsedSec,
        aiScore: computedScore,
        finalScore: computedScore,
        approvalStatus: "pending",
        needsAttention: Boolean(computedScore < 6.5),
        detectedErrors:
          localAnalysis.detectedErrors.length > 0
            ? localAnalysis.detectedErrors
            : Array.isArray(aiResult?.detectedErrors)
            ? aiResult.detectedErrors
            : [],
        criterionBreakdown: alignedBreakdown,
        personalizedFeedback: rawFeedback,
        inspection: extractedInspection,
        mcqDetails:
          extractedInspection.type === "theory"
            ? extractedInspection.data.mcqDetails
            : undefined,
        driveFileId: driveUploadInfo.driveFileId,
        driveWebViewLink: driveUploadInfo.driveWebViewLink,
        driveAssignmentFolderId: driveUploadInfo.driveAssignmentFolderId,
        driveAssignmentFolderName: driveUploadInfo.driveAssignmentFolderName,
        driveAssignmentFolderLink: driveUploadInfo.driveAssignmentFolderLink,
        driveRootFolderUrl: driveUploadInfo.driveRootFolderUrl,
        driveSynced: true,
        practiceOriginalFileName: originalFileName,
      };

      if (hasPracticeSection(newSubmission, assignments)) {
        newSubmission.practiceWorkImageDataUrl = generatePracticeWorkSnapshotSync(
          newSubmission,
          assignments
        );
      }

      try {
        await saveSubmissionToSupabase(newSubmission);
      } catch (fErr) {
        console.warn("Đồng bộ bài nộp Supabase:", fErr);
      }

      onNewSubmission(newSubmission);
      setCompletedSubmission(newSubmission);
    } catch {
      setSubmitValidationError(
        "Không thể đọc được tệp vừa chọn. Em vui lòng kiểm tra lại tệp trên máy tính và thử lại nhé!"
      );
    } finally {
      setIsGrading(false);
      setTimeout(() => setIsLaunchingRocket(false), 2500);
    }
  };

  const previewNormalized =
    selectedAssignment && currentStudent && currentClass && uploadedFile
      ? normalizeStudentFileName(
          currentStudent.name,
          currentClass.name,
          selectedAssignment.code,
          uploadedFile.name,
          selectedAssignment.fileType,
          currentStudent.studentCode,
          uploadedFile
        )
      : null;

  // Danh sách kết quả bài nộp cho Học sinh tra cứu (chỉ xem kết quả, không có nút duyệt)
  const studentVisibleSubmissions = submissions.filter((sub) => {
    if (currentClass && sub.className !== currentClass.name) return false;
    if (onlyMyResults && currentStudent && sub.studentName !== currentStudent.name) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Friendly Student Banner & Class/Student Dropdown Selectors */}
      <div className="bg-white border-2 border-sky-200 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-h-[56px] flex flex-col justify-center">
            <div className="text-xs font-semibold text-[#0284C7] flex items-center gap-1.5">
              <School className="w-4 h-4" />
              CỔNG HỌC SINH · LÀM BÀI &amp; XEM KẾT QUẢ (KHÔNG CÓ QUYỀN QUẢN LÝ CỦA GIÁO VIÊN)
            </div>
            {currentClass && currentStudent ? (
              <div className="space-y-1 pt-0.5">
                <h2 className="text-2xl font-bold text-slate-900">
                  Xin chào em {currentStudent.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
                  <span className="inline-flex items-center gap-1.5 bg-sky-50 text-[#0284C7] px-3 py-1 rounded-lg border border-sky-200">
                    Ngày sinh: <strong>{currentStudent.birthDate || "Chưa cập nhật"}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200">
                    Lớp: <strong>{currentClass.name}</strong> ({currentClass.grade})
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* 2 Nút chuyển đổi trong Cổng Học sinh: Làm bài vs Xem kết quả */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl self-start shrink-0">
            <button
              type="button"
              onClick={() => setSubTab("do_work")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                currentSubTab === "do_work"
                  ? "bg-[#0284C7] text-white shadow-xs"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Làm bài &amp; Nộp bài
            </button>
            <button
              type="button"
              onClick={() => setSubTab("view_results")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                currentSubTab === "view_results"
                  ? "bg-[#0284C7] text-white shadow-xs"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Xem Kết quả ({studentVisibleSubmissions.length})
            </button>
          </div>
        </div>

        {/* Dropdown Selectors for Class and Student */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Chọn Lớp học (Sổ xuống):
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-4 py-3 text-sm font-semibold bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#0284C7]"
            >
              <option value="">-- Chọn lớp học --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.grade} - {cls.students.length} học sinh)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. Chọn Tên Học sinh (Sổ xuống theo lớp):
            </label>
            <select
              value={selectedStudentId}
              disabled={!currentClass}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                resetCurrentAttempt();
              }}
              className="w-full px-4 py-3 text-sm font-semibold bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#0284C7] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {currentClass ? "-- Chọn họ và tên học sinh --" : "-- Vui lòng chọn Lớp học trước --"}
              </option>
              {currentClass?.students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {currentSubTab === "view_results" ? (
        /* TAB 2 DÀNH CHO HỌC SINH: CHỈ XEM KẾT QUẢ BÀI LÀM (KHÔNG CÓ NÚT DUYỆT HAY XÓA) */
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Bảng Tra cứu Kết quả Bài làm — {currentClass?.name} ({currentClass?.grade})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Học sinh chỉ có quyền xem điểm số, nhận xét của Thầy và bảng chi tiết bài làm (không có quyền Phê duyệt hay Chỉnh sửa).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setOnlyMyResults(false)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                  !onlyMyResults
                    ? "bg-[#0284C7] text-white border-[#0284C7]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Tất cả bài nộp của {currentClass?.name}
              </button>
              <button
                type="button"
                onClick={() => setOnlyMyResults(true)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                  onlyMyResults
                    ? "bg-[#0284C7] text-white border-[#0284C7]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Chỉ bài của {currentStudent?.name}
              </button>
            </div>
          </div>

          {studentVisibleSubmissions.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-700">
                Chưa có bài nộp nào được ghi nhận cho bộ lọc hiện tại.
              </p>
              <button
                type="button"
                onClick={() => setSubTab("do_work")}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                Chuyển sang Làm bài &amp; Nộp bài ngay
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50">
                    <th className="py-3 px-4">Học sinh</th>
                    <th className="py-3 px-4">Bài kiểm tra &amp; Tên tệp của học sinh</th>
                    <th className="py-3 px-4">Ảnh bài làm thực hành</th>
                    <th className="py-3 px-4">Điểm số</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Nhận xét của Thầy</th>
                    <th className="py-3 px-4 text-right">Phiếu kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {studentVisibleSubmissions.map((sub) => {
                    const subDriveInfo = getGoogleDrivePracticeFileInfo(sub);
                    const subHasPractice = hasPracticeSection(sub, assignments);
                    const subPreviewImg = subHasPractice
                      ? sub.practiceWorkImageDataUrl ||
                        generatePracticeWorkSnapshotSync(sub, assignments)
                      : "";

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 align-top">
                          <div>{sub.studentName}</div>
                          <div className="text-[11px] text-slate-500 font-normal">
                            {sub.studentId} · {sub.className}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-slate-900">{sub.assignmentTitle}</div>
                          <div className="text-[11px] font-mono text-slate-700 mt-0.5">
                            <span className="font-sans text-slate-500">Tệp HS nộp:</span>{" "}
                            {subDriveInfo.studentRawFileName}
                          </div>
                          <div className="text-[11px] font-mono text-[#0284C7] font-semibold">
                            <span className="font-sans text-slate-500 font-normal">Chuẩn hóa:</span>{" "}
                            {subDriveInfo.driveFileName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          {subHasPractice && subPreviewImg ? (
                            <div className="space-y-1">
                              <img
                                src={subPreviewImg}
                                alt={`Ảnh bài làm ${sub.studentName}`}
                                onClick={() => onInspectSubmissionReadOnly(sub)}
                                className="w-36 h-20 object-cover rounded-lg border border-slate-300 shadow-2xs cursor-pointer hover:opacity-90 bg-white"
                              />
                              <span className="block text-[10px] font-semibold text-emerald-700">
                                ● Có ảnh bài làm trong phiếu
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Bài lý thuyết</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono align-top">
                          <span className="text-base font-bold text-[#0284C7]">
                            {sub.finalScore.toFixed(1)}
                          </span>
                          <span className="text-slate-400"> / 10</span>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          {sub.approvalStatus === "approved" || sub.approvalStatus === "adjusted" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              ● Đã được Thầy duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              ● Chờ Thầy duyệt
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs align-top">
                          <p className="text-slate-700 line-clamp-2">“{sub.personalizedFeedback}”</p>
                        </td>
                        <td className="py-3.5 px-4 text-right align-top">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onInspectSubmissionReadOnly(sub)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0284C7] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Xem phiếu
                            </button>
                            <button
                              type="button"
                              title="Xuất Phiếu kết quả Word (.docx) kèm ảnh bài làm & tên tệp"
                              onClick={() =>
                                exportParentReportToDocx(
                                  [sub],
                                  assignments,
                                  `Học sinh ${sub.studentName} (${sub.className})`
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-[#0284C7] bg-white hover:bg-sky-50 border border-sky-200 rounded-lg cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              Word
                            </button>
                            <button
                              type="button"
                              title="Xuất Phiếu kết quả PDF (.pdf) kèm ảnh bài làm & tên tệp"
                              onClick={() =>
                                exportParentReportToPdf(
                                  [sub],
                                  assignments,
                                  `Học sinh ${sub.studentName} (${sub.className})`
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : !currentClass ? (
        /* Khi học sinh chưa chọn Lớp -> Hiển thị màn hình chào mừng & danh sách các lớp để bấm chọn nhanh kèm tổng quan đề */
        <div className="space-y-6">
          <div className="bg-white border-2 border-dashed border-[#0284C7]/40 rounded-2xl p-8 text-center space-y-4 shadow-xs">
            <School className="w-10 h-10 text-[#0284C7] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Chào mừng em đến với Cổng Làm Bài Trực Tuyến Môn Tin Học!
              </h3>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                Em hãy bấm chọn lớp học của mình ở phía dưới hoặc chọn ở ô <strong>1. Chọn Lớp học</strong> phía trên để xem các bài tập Thầy/Cô đã giao nhé!
              </p>
            </div>

            {/* Nút chọn nhanh Lớp học */}
            <div className="pt-2">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Bấm chọn nhanh lớp của em:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => handleClassChange(cls.id)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-sky-50 hover:text-[#0284C7] hover:border-[#0284C7] border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    {cls.name} ({cls.grade})
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleSyncFromTeacher}
                disabled={isSyncingFromTeacher}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0284C7] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFromTeacher ? "animate-spin" : ""}`} />
                <span>{isSyncingFromTeacher ? "Đang cập nhật..." : "Đồng bộ đề mới từ Thầy (Realtime Cloud)"}</span>
              </button>
            </div>
          </div>

          {/* Danh sách đề kiểm tra đã giao trong hệ thống để học sinh & giáo viên kiểm tra ngay */}
          {assignments.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0284C7]" />
                  <span>Các đề kiểm tra đã phát trong hệ thống ({assignments.length} đề):</span>
                </h4>
                <span className="text-xs text-slate-500">
                  Bấm vào đề để tự động chuyển đến lớp tương ứng
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {assignments.map((asg) => (
                  <div
                    key={asg.id}
                    onClick={() => {
                      const targetClass = classes.find((c) =>
                        isAssignmentForClass(asg, c.name, c.grade)
                      );
                      if (targetClass) {
                        handleClassChange(targetClass.id);
                        setSelectedAssignmentId(asg.id);
                      }
                    }}
                    className="p-3.5 bg-white border border-slate-200 hover:border-[#0284C7] rounded-xl shadow-2xs transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="px-2 py-0.5 text-[10px] font-bold text-[#0284C7] bg-sky-50 rounded-md">
                        {asg.grade}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        .{asg.fileType}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-[#0284C7]">
                      {asg.title}
                    </h5>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Lớp nhận: <strong>{asg.className}</strong></span>
                      <span className="text-[#0284C7] font-semibold text-[10px]">Vào làm bài →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 1 DÀNH CHO HỌC SINH: LÀM BÀI & NỘP BÀI (Hiển thị ngay khi đã chọn Lớp học) */
        <>
          {/* Step 3: Assignment Picker for this Class Grade */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>3. Bài tập được giao dành riêng cho {currentClass?.name} ({currentClass?.grade}):</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Em hãy bấm vào một đề bài để bắt đầu làm bài hoặc xem thành tích đã đạt được nhé!
                </p>
              </div>

              {/* Nút Radar quét sóng xoay tròn kèm nhãn: 🛰️ Quét bài mới */}
              <button
                type="button"
                onClick={handleSyncFromTeacher}
                disabled={isSyncingFromTeacher}
                className="relative group inline-flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl transition-all cursor-pointer self-start sm:self-auto shadow-xs active:scale-95"
                title="Quét sóng tìm đề kiểm tra mới nhất từ máy Thầy qua Supabase Realtime"
              >
                <span className="relative flex h-4 w-4 items-center justify-center">
                  {isSyncingFromTeacher ? (
                    <Radio className="w-4 h-4 text-sky-600 animate-spin" />
                  ) : (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <Radio className="relative w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </span>
                <span>{isSyncingFromTeacher ? "Đang quét sóng đề mới..." : "🛰️ Quét bài mới"}</span>
              </button>
            </div>

            {classAssignments.length === 0 ? (
              <div className="p-8 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                <p className="text-sm font-semibold text-slate-800">
                  Chưa có bài tập nào được giao riêng cho lớp {currentClass?.name} ({currentClass?.grade}).
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tổng số bài tập trong hệ thống: <strong>{assignments.length} đề</strong>. Nếu Thầy vừa giao bài từ máy tính khác, em hãy bấm quét sóng dưới đây để cập nhật ngay nhé!
                </p>
                <button
                  type="button"
                  onClick={handleSyncFromTeacher}
                  disabled={isSyncingFromTeacher}
                  className="relative group inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#0284C7] to-indigo-600 hover:from-[#0369A1] hover:to-indigo-700 rounded-xl cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <Radio className={`w-4 h-4 ${isSyncingFromTeacher ? "animate-spin" : "animate-pulse"}`} />
                  <span>{isSyncingFromTeacher ? "Đang quét sóng đề mới..." : "🛰️ Quét bài mới ngay"}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classAssignments.map((asg) => {
                  const isSelected = selectedAssignment?.id === asg.id;

                  // Kiểm tra xem học sinh hiện tại đã hoàn thành đề này chưa
                  const studentSub = submissions.find(
                    (s) =>
                      s.assignmentId === asg.id &&
                      (s.studentId === currentStudent?.studentCode ||
                        s.studentName.trim().toLowerCase() === currentStudent?.name?.trim().toLowerCase()) &&
                      (!currentClass || s.className === currentClass.name)
                  );
                  const isCompleted = Boolean(studentSub);

                  // Tính % tiến độ hoàn thành nếu đang làm
                  let progressPercent = 0;
                  if (isSelected && !isCompleted) {
                    if (asg.fileType === "theory" && asg.theoryExam) {
                      const mcqs = asg.theoryExam.multipleChoice || [];
                      const essays = asg.theoryExam.shortAnswers || (asg.theoryExam.shortAnswer ? [asg.theoryExam.shortAnswer] : []);
                      const totalQ = mcqs.length + essays.length;
                      let answeredQ = 0;
                      mcqs.forEach((q, qIdx) => {
                        const k = `${asg.id}-mcq-${qIdx}-${q.id || qIdx}`;
                        if (typeof mcqAnswers[k] === "number") answeredQ++;
                      });
                      essays.forEach((sa, sIdx) => {
                        const k = `${asg.id}-sa-${sIdx}-${sa.id || sIdx}`;
                        if ((shortAnswerTexts[k] || "").trim()) answeredQ++;
                      });
                      progressPercent = totalQ > 0 ? Math.round((answeredQ / totalQ) * 100) : 0;
                    } else {
                      progressPercent = uploadedFile ? 100 : 25;
                    }
                  }

                  return (
                    <div
                      key={asg.id}
                      onClick={() => {
                        setSelectedAssignmentId(asg.id);
                        if (!isCompleted && !isSelected) {
                          resetCurrentAttempt();
                        }
                      }}
                      className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? "border-[#0284C7] bg-sky-50/70 shadow-md ring-2 ring-sky-300/40"
                          : isCompleted
                          ? "border-blue-200 bg-white hover:border-blue-400 hover:shadow-xs"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          {/* Biểu tượng theo loại đề: Mèo Scratch / Khối Lego phát sáng, Vòng quay thử thách, v.v. */}
                          {asg.fileType === "sb3" ? (
                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-md shadow-orange-500/25 shrink-0 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                              <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-orange-500 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                                <Cat className="w-6 h-6 text-yellow-100 drop-shadow" />
                                <span className="absolute -bottom-1 -right-1 bg-yellow-300 text-amber-950 text-[9px] font-black px-1 rounded-sm shadow-xs border border-yellow-200 flex items-center gap-0.5 animate-pulse">
                                  <Boxes className="w-2.5 h-2.5 text-amber-900" />
                                  Lego
                                </span>
                              </div>
                            </div>
                          ) : asg.fileType === "theory" ? (
                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md shadow-purple-500/25 shrink-0 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                              <div className="w-full h-full bg-gradient-to-tr from-indigo-700 to-purple-600 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                                <Compass className="w-6 h-6 text-pink-200 animate-spin [animation-duration:15s]" />
                                <span className="absolute -top-1 -right-1 bg-pink-400 text-white text-[9px] font-black px-1 rounded-full shadow-xs">
                                  🎯
                                </span>
                              </div>
                            </div>
                          ) : asg.fileType === "docx" ? (
                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 via-sky-600 to-cyan-500 p-0.5 shadow-md shadow-blue-500/25 shrink-0 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                              <div className="w-full h-full bg-gradient-to-tr from-blue-700 to-sky-600 rounded-[14px] flex items-center justify-center">
                                <FileText className="w-6 h-6 text-sky-100" />
                              </div>
                            </div>
                          ) : (
                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-500 p-0.5 shadow-md shadow-rose-500/25 shrink-0 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                              <div className="w-full h-full bg-gradient-to-tr from-rose-700 to-orange-600 rounded-[14px] flex items-center justify-center">
                                <Presentation className="w-6 h-6 text-rose-100" />
                              </div>
                            </div>
                          )}

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-slate-700 block">
                              .{asg.fileType.toUpperCase()}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400">
                              {asg.checklist.length} tiêu chí
                            </span>
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-[#0284C7] transition-colors">
                          {asg.title}
                        </h4>
                      </div>

                      {/* 3 Trạng thái trực quan: 🔵 Đã hoàn thành | 🟡 Đang làm | 🟢 Sẵn sàng */}
                      {isCompleted ? (
                        <div className="pt-2 border-t border-blue-100 flex items-center justify-between">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl shadow-2xs">
                            <Award className="w-3.5 h-3.5 text-blue-600" />
                            <span>🔵 Đã hoàn thành ({studentSub?.finalScore ?? studentSub?.aiScore ?? 10}đ)</span>
                          </div>
                          <span className="text-[11px] font-bold text-blue-600 hover:text-blue-800">
                            Xem kết quả →
                          </span>
                        </div>
                      ) : isSelected ? (
                        <div className="pt-2 border-t border-amber-100 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <span>🟡 Đang làm ({progressPercent}%)</span>
                            </span>
                            <span className="text-[11px] text-amber-700 font-semibold">Tiếp tục →</span>
                          </div>
                          <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(8, progressPercent)}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-emerald-100 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>🟢 Sẵn sàng</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-xs transition-transform active:scale-95">
                            <span>Bắt đầu khám phá</span>
                            <Rocket className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nhắc chọn tên học sinh nếu đã chọn lớp nhưng chưa chọn tên học sinh */}
          {currentClass && !currentStudent && (
            <div className="bg-sky-50 border-2 border-dashed border-[#0284C7]/50 rounded-2xl p-6 text-center space-y-3 shadow-xs">
              <School className="w-8 h-8 text-[#0284C7] mx-auto animate-bounce" />
              <h4 className="text-base font-bold text-slate-900">
                Em đã chọn lớp {currentClass.name} ({currentClass.grade})
              </h4>
              <p className="text-sm text-slate-700 max-w-lg mx-auto">
                Lớp của em có <strong>{classAssignments.length} đề bài</strong> được giao. Em vui lòng chọn <strong>Tên học sinh của em</strong> ở ô số <strong>2. Chọn Tên Học sinh</strong> phía trên để mở đề và bắt đầu làm bài nhé!
              </p>
            </div>
          )}

          {/* Step 4: Do Exercise or Upload File from System — BÀN ĐIỀU KHIỂN & THANH TIẾN ĐỘ NĂNG LƯỢNG */}
          {selectedAssignment && currentStudent && currentClass && (() => {
            const isTheory = selectedAssignment.fileType === "theory";
            const mcqs = activeTheoryMcqs;
            const essays = selectedAssignment.theoryExam?.shortAnswers || (selectedAssignment.theoryExam?.shortAnswer ? [selectedAssignment.theoryExam.shortAnswer] : []);
            const totalTasks = isTheory ? (mcqs.length + essays.length) : 1;
            let answeredTasks = 0;
            if (isTheory) {
              mcqs.forEach((q, idx) => {
                const k = `${selectedAssignment.id}-mcq-${idx}-${q.id || idx}`;
                if (typeof mcqAnswers[k] === "number") answeredTasks++;
              });
              essays.forEach((sa, sIdx) => {
                const k = `${selectedAssignment.id}-sa-${sIdx}-${sa.id || sIdx}`;
                if ((shortAnswerTexts[k] || "").trim()) answeredTasks++;
              });
            } else {
              answeredTasks = (uploadedFile || hasAlreadySubmitted) ? 1 : 0;
            }
            const energyPercent = totalTasks > 0 ? Math.min(100, Math.round((answeredTasks / totalTasks) * 100)) : 0;

            return (
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
              {/* BÀN ĐIỀU KHIỂN: THANH PIN NĂNG LƯỢNG TIẾN ĐỘ NHIỆM VỤ */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border-2 border-indigo-400/40 text-white shadow-lg relative overflow-hidden space-y-3.5">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
                      <Zap className="w-6 h-6 fill-slate-950" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                          Bàn Điều Khiển — Thanh Năng Lượng Nhiệm Vụ
                        </span>
                        <span className="text-[10px] bg-indigo-800/80 text-sky-200 font-mono px-2 py-0.5 rounded-full border border-indigo-600">
                          {answeredTasks}/{totalTasks} nhiệm vụ
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {energyPercent === 100
                          ? "🔋 Bình năng lượng đã ĐẦY 100%! Toàn bộ câu hỏi đã sẵn sàng để Phóng bài nộp!"
                          : `⚡ Mỗi khi hoàn thành 1 câu, bình năng lượng đầy thêm. Còn ${totalTasks - answeredTasks} câu nữa để đạt 100%!`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black/50 rounded-xl border border-amber-500/40 shadow-inner">
                      <BatteryCharging className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span className="font-mono text-sm font-black text-amber-300">
                        {energyPercent}% NĂNG LƯỢNG
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thanh pin năng lượng phát sáng theo tỷ lệ % hoàn thành */}
                <div className="relative w-full h-4 bg-slate-950/90 rounded-full overflow-hidden p-0.5 border border-indigo-500/50 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500 shadow-[0_0_15px_rgba(250,204,21,0.7)]"
                    style={{ width: `${Math.max(5, energyPercent)}%` }}
                  />
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold text-[#0284C7]">
                    BÀI LÀM CỦA: {currentStudent.name.toUpperCase()} ({currentClass.name})
                  </span>
                  {selectedAssignment.fileType !== "theory" && (
                    <button
                      type="button"
                      onClick={handleDownloadAssignmentTemplateToComputer}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0284C7] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Tải File Đề Mẫu (.{selectedAssignment.fileType}) về máy để làm bài
                    </button>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-900">{selectedAssignment.title}</h3>
                <p className="text-sm text-slate-700 bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl">
                  💡 <strong>Yêu cầu của Thầy:</strong> {selectedAssignment.studentPrompt}
                </p>

                {/* Hiển thị rõ Ma trận Tiêu chí Chấm của đề bài để học sinh làm đúng trọng tâm */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ClipboardCheck className="w-4 h-4 text-[#0284C7]" />
                    <span>
                      Ma trận Tiêu chí Chấm điểm của Đề bài ({selectedAssignment.checklist.length} yêu cầu — Tổng 10.0 điểm):
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedAssignment.checklist.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-start justify-between gap-2 text-xs"
                      >
                        <span className="text-slate-800 font-medium">
                          <strong>Tiêu chí {idx + 1}:</strong> {item.criterion}
                        </span>
                        <span className="font-mono font-bold text-[#0284C7] shrink-0">
                          {Number(item.maxPoints).toFixed(1)}đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Thông báo khóa bài làm khi học sinh đã nộp bài */}
              {hasAlreadySubmitted && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 flex items-start gap-3 shadow-xs">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-amber-900">
                        Bài làm đã được nộp thành công &amp; đã khóa!
                      </h4>
                      <span className="text-[11px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                        Chỉ cho phép nộp 1 lần duy nhất
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Hệ thống quy định mỗi học sinh chỉ được nộp bài 1 lần duy nhất để đảm bảo tính công bằng và khách quan. Toàn bộ câu trả lời trắc nghiệm, bài viết tự luận và tệp bài làm của em <strong>{currentStudent.name}</strong> ({currentClass.name}) đã được hệ thống lưu trữ và khóa an toàn. Em có thể xem lại bài làm và phiếu kết quả chấm điểm chi tiết ở bên dưới.
                    </p>
                  </div>
                </div>
              )}

              {selectedAssignment.fileType === "theory" && selectedAssignment.theoryExam ? (
                /* Theory Quiz & Short Answer NLP Interface — Không chọn trước đáp án, bắt buộc làm hết mới cho nộp */
                <div className="space-y-6">
                  {activeTheoryMcqs.length > 0 && (() => {
                    const studentSeed = `${currentStudent.id || currentStudent.studentCode || currentStudent.name}_${selectedAssignment.id}`;
                    const shuffledMcqMap = buildStudentShuffledMcqMap(
                      activeTheoryMcqs,
                      studentSeed
                    );

                    return (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              Phần I: Trắc nghiệm khách quan — Em hãy tự bấm chọn đáp án cho tất cả các câu hỏi!
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Các phương án A, B, C, D đã được hệ thống xáo trộn riêng cho mã học sinh của em ({currentStudent.name}).
                            </p>
                          </div>
                          <span
                            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                              unansweredMcqNumbers.length === 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            Đã chọn {activeTheoryMcqs.length - unansweredMcqNumbers.length}/
                            {activeTheoryMcqs.length} câu trắc nghiệm
                          </span>
                        </div>

                        {activeTheoryMcqs.map((q, idx) => {
                          const qKey = `${selectedAssignment.id}-mcq-${idx}-${q.id || idx}`;
                          const currentOriginalChoice = mcqAnswers[qKey];
                          const isAnswered = typeof currentOriginalChoice === "number";
                          const pureQuestionText = cleanQuestionText(q.question);
                          const illustrationCaption = cleanIllustrationCaption(
                            q.illustrationNote || "",
                            pureQuestionText
                          );
                          const hasNoImg =
                            q.hasNoIllustration === true ||
                            q.illustrationImageDataUrl === "" ||
                            q.illustrationImageDataUrl === "none";
                          const autoImgUrl = hasNoImg
                            ? ""
                            : q.illustrationImageDataUrl ||
                              generateIllustrationDataUrl(
                                pureQuestionText,
                                illustrationCaption,
                                q.illustrationVariant ?? 0,
                                selectedAssignment.grade
                              );
                          const shuffledInfo = shuffledMcqMap[q.id || `mcq-${idx}`];
                          const displayOptions = shuffledInfo
                            ? shuffledInfo.shuffledOptions
                            : q.options;

                          return (
                            <div
                              key={qKey}
                              className={`p-4 border rounded-xl space-y-3 transition-colors ${
                                isAnswered
                                  ? "bg-slate-50 border-slate-200"
                                  : "bg-white border-amber-300"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-slate-900">
                                    Câu {idx + 1}: {pureQuestionText}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {!isAnswered && (
                                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      Chưa chọn đáp án
                                    </span>
                                  )}
                                  <span className="text-xs font-mono font-bold text-[#0284C7]">
                                    {q.points}đ
                                  </span>
                                </div>
                              </div>

                              {autoImgUrl && (
                                <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl flex flex-col items-center gap-1.5">
                                  <img
                                    src={autoImgUrl}
                                    alt={illustrationCaption}
                                    className="max-h-44 rounded-lg border border-sky-200 object-contain bg-white p-1"
                                  />
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {displayOptions.map((optText, displayIdx) => {
                                  const mappedOriginalIdx = shuffledInfo
                                    ? shuffledInfo.shuffledToOriginalIndex[displayIdx]
                                    : displayIdx;
                                  const isThisOptionSelected =
                                    typeof currentOriginalChoice === "number" &&
                                    currentOriginalChoice === mappedOriginalIdx;

                                  return (
                                    <button
                                      key={displayIdx}
                                      type="button"
                                      disabled={hasAlreadySubmitted}
                                      onClick={() => {
                                        if (hasAlreadySubmitted) return;
                                        setMcqAnswers((prev) => ({
                                          ...prev,
                                          [qKey]: mappedOriginalIdx,
                                        }));
                                        setSubmitValidationError(null);
                                      }}
                                      className={`p-3 rounded-xl border-2 text-left text-sm font-semibold transition-colors ${
                                        hasAlreadySubmitted
                                          ? "cursor-not-allowed opacity-90"
                                          : "cursor-pointer"
                                      } ${
                                        isThisOptionSelected
                                          ? hasAlreadySubmitted
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs"
                                            : "border-[#0284C7] bg-sky-50 text-[#0284C7]"
                                          : hasAlreadySubmitted
                                          ? "border-slate-200 bg-slate-50 text-slate-500"
                                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span>{optText}</span>
                                        {isThisOptionSelected && hasAlreadySubmitted && (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-300 shrink-0">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                            Đã chọn (Đã khóa)
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {activeTheoryEssays.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          Phần II: Câu hỏi Tự luận ngắn ({activeTheoryEssays.length} câu — Bắt buộc trả lời đầy đủ)
                        </h4>
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                            unansweredEssayNumbers.length === 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          Đã trả lời {activeTheoryEssays.length - unansweredEssayNumbers.length}/
                          {activeTheoryEssays.length} câu tự luận
                        </span>
                      </div>

                      {activeTheoryEssays.map((sa, sIdx) => {
                        const saKey = `${selectedAssignment.id}-sa-${sIdx}-${sa.id || sIdx}`;
                        const currentVal = shortAnswerTexts[saKey] || "";
                        const isFilled = currentVal.trim().length > 0;
                        const pureEssayQ = cleanQuestionText(sa.question);
                        const essayCaption = cleanIllustrationCaption(
                          sa.illustrationNote || "",
                          pureEssayQ
                        );
                        const hasNoEssayImg =
                          sa.hasNoIllustration === true ||
                          sa.illustrationImageDataUrl === "" ||
                          sa.illustrationImageDataUrl === "none";
                        const essayImgUrl = hasNoEssayImg
                          ? ""
                          : sa.illustrationImageDataUrl ||
                            generateIllustrationDataUrl(
                              pureEssayQ,
                              essayCaption,
                              sa.illustrationVariant ?? 0,
                              selectedAssignment.grade
                            );

                        return (
                          <div
                            key={saKey}
                            className={`p-5 border-2 rounded-xl space-y-3 ${
                              isFilled
                                ? "bg-sky-50/50 border-sky-200"
                                : "bg-white border-amber-300"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#0284C7] uppercase">
                                Câu tự luận {sIdx + 1}:
                              </span>
                              <div className="flex items-center gap-2">
                                {!isFilled && (
                                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    Chưa nhập câu trả lời
                                  </span>
                                )}
                                <span className="text-xs font-mono font-bold text-[#0284C7]">
                                  {sa.points}đ
                                </span>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-slate-800">{pureEssayQ}</p>
                            {essayImgUrl && (
                              <div className="p-2.5 bg-white border border-sky-200 rounded-xl flex justify-center">
                                <img
                                  src={essayImgUrl}
                                  alt={essayCaption}
                                  className="max-h-44 rounded-lg object-contain"
                                />
                              </div>
                            )}
                            <div className="relative">
                              <textarea
                                rows={3}
                                value={currentVal}
                                disabled={hasAlreadySubmitted}
                                readOnly={hasAlreadySubmitted}
                                onChange={(e) => {
                                  if (hasAlreadySubmitted) return;
                                  const val = e.target.value;
                                  setShortAnswerTexts((prev) => ({ ...prev, [saKey]: val }));
                                  setSubmitValidationError(null);
                                }}
                                placeholder={`Em hãy tự gõ câu trả lời cho Câu tự luận ${
                                  sIdx + 1
                                } vào ô này trước khi bấm Nộp bài nhé...`}
                                className={`w-full p-3.5 text-sm rounded-xl focus:outline-none transition-colors ${
                                  hasAlreadySubmitted
                                    ? "bg-slate-100 text-slate-700 border-2 border-slate-300 cursor-not-allowed select-text font-medium"
                                    : "bg-white border-2 border-slate-300 focus:border-[#0284C7]"
                                }`}
                              />
                              {hasAlreadySubmitted && (
                                <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-white/90 border border-slate-300 px-2 py-0.5 rounded-md shadow-xs">
                                  <Lock className="w-3 h-3 text-slate-500" />
                                  <span>Đã khóa câu trả lời</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Thanh trạng thái kiểm tra đã làm hết bài chưa */}
                  {!isTheoryExamComplete ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">
                          Chưa làm hết bài — Hệ thống chưa cho phép nộp bài:
                        </span>
                        <span>
                          Em còn chưa hoàn thành:{" "}
                          {unansweredMcqNumbers.length > 0 && (
                            <strong>
                              Câu trắc nghiệm số {unansweredMcqNumbers.join(", ")}
                            </strong>
                          )}
                          {unansweredMcqNumbers.length > 0 &&
                            unansweredEssayNumbers.length > 0 &&
                            " và "}
                          {unansweredEssayNumbers.length > 0 && (
                            <strong>
                              Câu tự luận số {unansweredEssayNumbers.join(", ")}
                            </strong>
                          )}
                          . Em hãy chọn và điền đầy đủ tất cả các câu hỏi trên để mở khóa nút Nộp bài nhé!
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Tuyệt vời! Em đã làm đầy đủ tất cả các câu hỏi trong đề. Em có thể bấm nút Nộp bài ở bên dưới!
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* CỬA KHOANG TÀU / MÁY HÚT DỮ LIỆU THỰC HÀNH (.docx, .pptx, .sb3) */
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>🛸 Cửa Khoang Tàu / Máy Hút Dữ Liệu (.{selectedAssignment.fileType.toUpperCase()}):</span>
                    </span>
                    {uploadedFile && !hasAlreadySubmitted && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setCompletedSubmission(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Tháo tệp ra khỏi khoang để chọn tệp khác</span>
                      </button>
                    )}
                  </div>

                  {/* KHUNG CỬA KHOANG TÀU HÚT DỮ LIỆU */}
                  <div
                    onDragOver={(e) => {
                      if (hasAlreadySubmitted) return;
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      if (hasAlreadySubmitted) return;
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) {
                        handleFileChosenFromSystem(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => {
                      if (!hasAlreadySubmitted) fileInputRef.current?.click();
                    }}
                    className={`relative group rounded-3xl p-8 text-center transition-all overflow-hidden border-2 cursor-pointer ${
                      hasAlreadySubmitted
                        ? "border-emerald-500 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white cursor-not-allowed select-none shadow-md"
                        : isDragging
                        ? "border-cyan-400 bg-gradient-to-b from-sky-950 via-slate-900 to-indigo-950 shadow-2xl scale-[1.01] ring-4 ring-cyan-400/40 text-white"
                        : uploadedFile
                        ? "border-emerald-400 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white shadow-xl"
                        : "border-indigo-400/50 bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 text-white hover:border-cyan-400 hover:shadow-xl"
                    }`}
                  >
                    {/* Hiệu ứng quét sóng / lưới laser của khoang tàu vũ trụ */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.15)_0,transparent_75%)] pointer-events-none" />

                    <input
                      ref={fileInputRef}
                      type="file"
                      disabled={hasAlreadySubmitted}
                      accept=".doc,.docx,.ppt,.pptx,.sb3"
                      className="hidden"
                      onChange={(e) => {
                        if (hasAlreadySubmitted) return;
                        if (e.target.files?.[0]) {
                          handleFileChosenFromSystem(e.target.files[0]);
                        }
                      }}
                    />

                    {uploadedFile ? (
                      /* HIỆU ỨNG TỆP ĐÃ ĐƯỢC HÚT VÀO KHOANG THÀNH CÔNG */
                      <div className="relative z-10 flex flex-col items-center gap-4 py-2">
                        {/* Icon định dạng tệp to nổi bật */}
                        <div className="relative">
                          {selectedAssignment.fileType === "sb3" ? (
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 border-2 border-yellow-300 animate-pulse">
                              <Cat className="w-11 h-11 text-yellow-100" />
                            </div>
                          ) : selectedAssignment.fileType === "docx" ? (
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 border-2 border-sky-300">
                              <FileText className="w-11 h-11 text-sky-100" />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/30 border-2 border-rose-300">
                              <Presentation className="w-11 h-11 text-rose-100" />
                            </div>
                          )}
                          <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border-2 border-slate-900 flex items-center justify-center">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </span>
                        </div>

                        <div className="space-y-2 text-center max-w-lg">
                          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-500/20 border border-emerald-400 text-emerald-300 rounded-full text-xs font-bold shadow-inner">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>✓ ĐÃ HÚT TỆP VÀO KHOANG CHỨA AN TOÀN!</span>
                          </div>
                          <h4 className="text-lg font-black text-white font-mono break-all">
                            {uploadedFile.name}
                          </h4>
                          <p className="text-xs text-slate-300 font-mono">
                            Định dạng: .{selectedAssignment.fileType.toUpperCase()} | Kích thước: {(uploadedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>

                        {previewNormalized && (
                          <div className="inline-flex flex-wrap items-center justify-center gap-2 text-xs bg-black/50 px-4 py-2 rounded-xl border border-sky-500/30 text-slate-300">
                            <span>Tên tệp chuẩn hóa lưu trữ:</span>
                            <span className="font-mono font-bold text-cyan-300">
                              {previewNormalized.standardizedName}
                            </span>
                          </div>
                        )}

                        {hasAlreadySubmitted ? (
                          <p className="text-xs text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-emerald-400" />
                            Tệp bài làm đã nạp vào khoang an toàn và đã khóa.
                          </p>
                        ) : (
                          <p className="text-xs text-emerald-300 font-semibold flex items-center justify-center gap-1.5">
                            <span>🚀 Sẵn sàng! Em hãy bấm nút "Phóng Bài Nộp!" ở bên dưới để hoàn tất chiến tích.</span>
                          </p>
                        )}
                      </div>
                    ) : isDragging ? (
                      /* HIỆU ỨNG TỆP BAY VÀO KHOANG KHI KÉO THẢ */
                      <div className="relative z-10 flex flex-col items-center gap-3 py-6 animate-pulse">
                        <div className="w-20 h-20 rounded-full bg-cyan-500/30 border-2 border-cyan-300 flex items-center justify-center text-cyan-300 shadow-2xl">
                          <Rocket className="w-10 h-10 animate-bounce" />
                        </div>
                        <h4 className="text-lg font-black text-cyan-300 uppercase tracking-wide">
                          🌀 CỬA KHOANG ĐANG MỞ — MÁY HÚT DỮ LIỆU ĐANG HÚT TỆP VÀO!
                        </h4>
                        <p className="text-xs text-cyan-100">
                          Thả chuột để nạp tệp bài làm vào khoang chứa vũ trụ.
                        </p>
                      </div>
                    ) : (
                      /* TRẠNG THÁI CHỜ HÚT TỆP */
                      <div className="relative z-10 flex flex-col items-center gap-3 py-6">
                        <div className="w-18 h-18 rounded-3xl bg-slate-800/90 border-2 border-indigo-400/40 flex items-center justify-center text-sky-400 group-hover:scale-110 group-hover:border-cyan-400 transition-all shadow-lg">
                          <UploadCloud className="w-9 h-9" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                            Cửa Khoang Hút Dữ Liệu Tự Động: Thả tệp .{selectedAssignment.fileType.toUpperCase()} vào đây
                          </h4>
                          <p className="text-xs text-slate-400">
                            Hoặc bấm vào để chọn tệp từ máy tính (Word, PowerPoint, Scratch)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Thông báo nhắc nhở nếu học sinh bấm nộp khi chưa làm hết bài hoặc chưa chọn tệp */}
              {submitValidationError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{submitValidationError}</span>
                </div>
              )}

              {/* NÚT NỘP BÀI ẤN TƯỢNG: Nút bấm lớn hiệu ứng 3D phát sáng 🚀 Phóng Bài Nộp! */}
              <div className="pt-2 flex flex-col items-center gap-2">
                {hasAlreadySubmitted ? (
                  <div className="w-full sm:w-auto min-w-[340px] py-4 px-8 bg-slate-100 border-2 border-slate-300 text-slate-700 text-base font-bold rounded-2xl flex items-center justify-center gap-3 cursor-not-allowed select-none shadow-xs">
                    <Lock className="w-5 h-5 text-slate-500" />
                    <span>BÀI LÀM ĐÃ NỘP &amp; ĐÃ KHÓA (CHỈ ĐƯỢC PHÉP NỘP 1 LẦN)</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isGrading || !canSubmitWork || hasAlreadySubmitted}
                    onClick={handleSubmitWork}
                    className={`relative group w-full sm:w-auto min-w-[340px] py-4 px-8 rounded-2xl font-black text-white text-base tracking-wide transition-all shadow-xl cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                      canSubmitWork && !isGrading
                        ? "bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 shadow-[0_10px_25px_rgba(2,132,199,0.5)] border-b-4 border-indigo-900 active:translate-y-1 active:border-b-0"
                        : "bg-slate-700 border-b-4 border-slate-900 text-slate-300"
                    }`}
                  >
                    {isGrading ? (
                      <div className="flex items-center justify-center gap-3">
                        <Rocket className="w-6 h-6 animate-bounce text-yellow-300" />
                        <span>{gradingStageText || "🚀 Đang phóng bài nộp lên Trạm EduAI..."}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <Rocket className="w-6 h-6 group-hover:-translate-y-1 group-hover:scale-110 transition-transform text-yellow-300" />
                        <span>🚀 PHÓNG BÀI NỘP!</span>
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
            );
          })()}

          {/* Step 5: MÀN HÌNH KẾT QUẢ & ĐÁNH GIÁ: "BẢNG VÀNG THÀNH TÍCH" */}
          {(() => {
            const activeResultSub = completedSubmission || (hasAlreadySubmitted ? existingSubmissionForCurrentStudent : null);
            if (!activeResultSub) return null;

            const finalScore = activeResultSub.finalScore ?? activeResultSub.aiScore ?? 0;
            const isGood = finalScore >= 8.5; // Mức T: Hoàn thành tốt
            const isPass = finalScore >= 5.0; // Mức H: Hoàn thành
            const starCount = isGood ? 5 : isPass ? 4 : 3;

            return (
              <div className="bg-white border-2 border-emerald-400 rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
                {/* Header Bảng Vàng */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
                  {/* Cúp Vàng / Cúp Bạc / Huy hiệu Cố gắng */}
                  <div className="flex items-center gap-5">
                    {isGood ? (
                      <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/30 border-2 border-yellow-200 shrink-0 animate-bounce">
                        <Trophy className="w-11 h-11 text-yellow-100" />
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                          MỨC T
                        </span>
                      </div>
                    ) : isPass ? (
                      <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-slate-300 via-sky-300 to-slate-400 flex items-center justify-center text-slate-900 shadow-xl shadow-sky-500/20 border-2 border-white shrink-0">
                        <Trophy className="w-11 h-11 text-sky-950" />
                        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                          MỨC H
                        </span>
                      </div>
                    ) : (
                      <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-700 via-orange-600 to-amber-800 flex items-center justify-center text-white shadow-xl border-2 border-amber-300 shrink-0">
                        <Award className="w-11 h-11 text-amber-100" />
                        <span className="absolute -top-2 -right-2 bg-amber-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                          MỨC C
                        </span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-full text-xs font-bold">
                        <span>🌟 BẢNG VÀNG THÀNH TÍCH</span>
                        <span>•</span>
                        <span>
                          {isGood
                            ? "Cúp Vàng (Hoàn thành tốt - T)"
                            : isPass
                            ? "Cúp Bạc (Hoàn thành - H)"
                            : "Huy hiệu Cố gắng (Cần cố gắng - C)"}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">
                        Kết quả bài làm của em {activeResultSub.studentName}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {activeResultSub.assignmentTitle} • Lớp {activeResultSub.className}
                      </p>
                    </div>
                  </div>

                  {/* Số ngôi sao đạt được & Điểm số to rõ */}
                  <div className="flex items-center gap-4 bg-gradient-to-tr from-amber-50 to-yellow-50 border-2 border-amber-200 px-6 py-4 rounded-3xl shrink-0 shadow-xs">
                    <div className="space-y-1 text-center">
                      <div className="flex items-center gap-1 text-amber-500 justify-center">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-6 h-6 ${
                              idx < starCount
                                ? "fill-amber-400 text-amber-500 animate-pulse"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-amber-900 block">
                        Đạt {starCount}/5 Ngôi Sao ⭐
                      </span>
                    </div>

                    <div className="w-px h-10 bg-amber-200" />

                    <div className="text-right font-mono tabular-nums">
                      <span className="text-xs text-slate-500 block font-sans font-semibold">
                        Điểm bài làm
                      </span>
                      <span className="text-3xl font-black text-slate-900">
                        {finalScore.toFixed(1)} <span className="text-base text-slate-500 font-medium">/ 10</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* LỜI KHEN / GỢI Ý CỦA GIÁO VIÊN TRONG BONG BÓNG THOẠI TRỢ LÝ ROBOT (MASCOT) */}
                <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-blue-50 border-2 border-sky-300 rounded-3xl shadow-sm relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Bot className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-900">
                        🤖 Lời dặn dò của Thầy &amp; Trợ lý Robot EduAI:
                      </span>
                    </div>
                    <div className="bg-white/95 p-4 rounded-2xl border border-sky-200 text-slate-800 text-sm font-medium leading-relaxed shadow-2xs">
                      “{activeResultSub.personalizedFeedback || "Thầy chúc mừng em đã hoàn thành bài làm rất tích cực và đúng thời gian!"}”
                    </div>
                  </div>
                </div>

                {/* GIẢM TẢI VĂN BẢN THÔNG TƯ 27 — BẢNG CHI TIẾT ĐỐI CHIẾU MA TRẬN THU GỌN VÀO NÚT BẤM */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowDetailedChecklist(!showDetailedChecklist)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      <ClipboardCheck className="w-4 h-4 text-[#0284C7]" />
                      <span>
                        {showDetailedChecklist
                          ? "▲ Thu gọn bảng đối chiếu chi tiết ma trận Thông tư 27"
                          : "▼ Bấm để xem chi tiết đối chiếu ma trận điểm & tiêu chí Thông tư 27"}
                      </span>
                      {showDetailedChecklist ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      {activeResultSub.criterionBreakdown.length} tiêu chí chấm
                    </span>
                  </div>

                  {showDetailedChecklist && (
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in duration-200">
                      {activeResultSub.criterionBreakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-white flex items-start justify-between gap-4 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span className={item.passed ? "text-emerald-600" : "text-amber-600"}>
                                {item.passed ? "✓ Đạt:" : "▲ Cần bổ sung:"}
                              </span>
                              <span>{item.criterion}</span>
                            </div>
                            <p className="text-slate-600">{item.detailNote}</p>
                          </div>
                          <span className="font-mono font-bold text-slate-900 shrink-0 tabular-nums">
                            {item.earnedPoints.toFixed(1)} / {item.maxPoints.toFixed(1)}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              {/* HÌNH ẢNH BÀI LÀM THỰC HÀNH CỦA HỌC SINH & TÊN TỆP TRONG PHIẾU KẾT QUẢ (Đối với các bài có phần thực hành) */}
              {hasPracticeSection(activeResultSub, assignments) && (
                <div className="bg-slate-50 border-2 border-sky-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#0284C7]" />
                        <h4 className="text-sm font-bold text-slate-900 uppercase">
                          Ảnh Bài Làm Thực Hành Của Học Sinh &amp; Tên Tệp Trong Phiếu Kết Quả
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-slate-700">
                          <strong>Tên tệp của học sinh nộp:</strong>{" "}
                          <span className="font-mono font-semibold text-slate-900">
                            {getGoogleDrivePracticeFileInfo(activeResultSub).studentRawFileName}
                          </span>
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-700">
                          <strong>Tên tệp chuẩn hóa trong phiếu:</strong>{" "}
                          <span className="font-mono font-bold text-[#0284C7]">
                            {getGoogleDrivePracticeFileInfo(activeResultSub).driveFileName}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const snapUrl =
                            activeResultSub.practiceWorkImageDataUrl ||
                            generatePracticeWorkSnapshotSync(activeResultSub, assignments);
                          const link = document.createElement("a");
                          link.href = snapUrl;
                          const cleanStudent = removeVietnameseTones(
                            activeResultSub.studentName
                          ).replace(/\s+/g, "_");
                          link.download = `AnhBaiLam_${cleanStudent}_${
                            getGoogleDrivePracticeFileInfo(activeResultSub).driveFileName
                          }.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#0284C7]" />
                        Tải Ảnh bài làm (.png)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          exportParentReportToDocx(
                            [activeResultSub],
                            assignments,
                            `Học sinh ${activeResultSub.studentName} (${activeResultSub.className})`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Xuất Phiếu Word (.docx) kèm ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          exportParentReportToPdf(
                            [activeResultSub],
                            assignments,
                            `Học sinh ${activeResultSub.studentName} (${activeResultSub.className})`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Xuất Phiếu PDF (.pdf) kèm ảnh
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-300 rounded-xl p-3 flex flex-col items-center space-y-2">
                    <img
                      src={
                        activeResultSub.practiceWorkImageDataUrl ||
                        generatePracticeWorkSnapshotSync(activeResultSub, assignments)
                      }
                      alt={`Ảnh bài làm thực hành của ${activeResultSub.studentName}`}
                      className="w-full max-w-4xl rounded-lg border border-slate-200 object-contain"
                    />
                    <p className="text-xs text-slate-600 text-center">
                      📄 <strong>Tên tệp của học sinh trong phiếu:</strong>{" "}
                      <span className="font-mono text-slate-900">
                        {getGoogleDrivePracticeFileInfo(activeResultSub).studentRawFileName}
                      </span>{" "}
                      ➔{" "}
                      <span className="font-mono font-bold text-[#0284C7]">
                        {getGoogleDrivePracticeFileInfo(activeResultSub).driveFileName}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* If Scratch .sb3 -> Show Interactive 2D Sandbox right here too! */}
              {activeResultSub.inspection.type === "sb3" &&
                activeResultSub.inspection.data.simulationTrajectory.length > 0 && (
                  <ScratchSimulatorPanel data={activeResultSub.inspection.data} />
                )}

              {/* Footer trong thẻ kết quả của Học sinh: Chỉ cho Làm lại hoặc Xem bảng kết quả */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    resetCurrentAttempt();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Làm lại bài / Nộp tệp khác
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onInspectSubmissionReadOnly(activeResultSub)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0284C7] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem Chi tiết Phân tích Bài làm (Chỉ xem)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab("view_results")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Xem Bảng Kết quả Lớp {currentClass?.name}</span>
                  </button>
                </div>
              </div>
            </div>
            );
          })()}
        </>
      )}
    </div>
  );
};
