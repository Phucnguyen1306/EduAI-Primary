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
} from "lucide-react";
import {
  Assignment,
  ExtractedInspection,
  StudentSubmission,
} from "../types/grading";
import { saveSubmissionToFirestore } from "../services/firebaseService";
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
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  assignments,
  classes,
  submissions,
  onNewSubmission,
  onInspectSubmissionReadOnly,
  activeSubTab,
  onChangeSubTab,
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

  // Filter for "Xem kết quả" tab
  const [onlyMyResults, setOnlyMyResults] = useState<boolean>(false);

  // Trạng thái tự động lưu bài vào Google Drive được chia sẻ (15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14)
  // Học sinh KHÔNG cần đăng nhập Google, khi chọn tải tệp lên hệ thống tự động lưu vào đúng thư mục bài tập
  const [isUploadingToDrive, setIsUploadingToDrive] = useState<boolean>(false);
  const [driveStatusNotice, setDriveStatusNotice] = useState<string | null>(null);
  const [driveErrorNotice, setDriveErrorNotice] = useState<string | null>(null);
  const [preUploadedDriveResult, setPreUploadedDriveResult] =
    useState<DriveUploadResult | null>(null);

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
        await saveSubmissionToFirestore(newSubmission);
      } catch (fErr) {
        console.warn("Đồng bộ bài nộp Firestore:", fErr);
      }

      onNewSubmission(newSubmission);
      setCompletedSubmission(newSubmission);
    } catch {
      setSubmitValidationError(
        "Không thể đọc được tệp vừa chọn. Em vui lòng kiểm tra lại tệp trên máy tính và thử lại nhé!"
      );
    } finally {
      setIsGrading(false);
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
      ) : !currentClass || !currentStudent ? (
        /* Khi học sinh chưa chọn đủ Lớp và Tên học sinh -> Giữ trống vùng bài tập, nhắc học sinh chọn Lớp & Tên trước */
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-2">
          <School className="w-8 h-8 text-[#0284C7] mx-auto" />
          <p className="text-base font-bold text-slate-800">
            Em vui lòng chọn Lớp học và chọn Tên của em ở phía trên để bắt đầu làm bài nhé!
          </p>
        </div>
      ) : (
        /* TAB 1 DÀNH CHO HỌC SINH: LÀM BÀI & NỘP BÀI (Chỉ hiển thị sau khi đã chọn Lớp và Tên học sinh) */
        <>
          {/* Step 3: Assignment Picker for this Class Grade */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              3. Bài tập được giao dành riêng cho {currentClass?.name} ({currentClass?.grade}):
            </h3>

            {classAssignments.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-500 text-xs">
                Chưa có bài tập nào được giao cho khối {currentClass?.grade}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classAssignments.map((asg) => {
                  const isSelected = selectedAssignment?.id === asg.id;
                  const Icon =
                    asg.fileType === "docx"
                      ? FileText
                      : asg.fileType === "pptx"
                      ? Presentation
                      : asg.fileType === "sb3"
                      ? Cat
                      : BookOpenCheck;

                  return (
                    <button
                      key={asg.id}
                      type="button"
                      onClick={() => {
                        setSelectedAssignmentId(asg.id);
                        resetCurrentAttempt();
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? "border-[#0284C7] bg-sky-50/60 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isSelected ? "bg-[#0284C7] text-white" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-mono font-semibold text-slate-500">
                            .{asg.fileType.toUpperCase()} · {asg.checklist.length} tiêu chí
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                          {asg.title}
                        </h4>
                      </div>
                      <span className="text-xs font-semibold text-[#0284C7]">
                        {isSelected ? "● Đang làm bài này" : "Bấm để chọn làm bài →"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 4: Do Exercise or Upload File from System */}
          {selectedAssignment && currentStudent && currentClass && (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-6">
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
                /* Practice File Dropzone (.docx, .pptx, .sb3) — Bắt buộc chọn tệp từ máy tính */
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      Chọn tệp bài làm (.{selectedAssignment.fileType}) từ máy tính của em để nộp:
                    </span>
                    {uploadedFile && !hasAlreadySubmitted && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setCompletedSubmission(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Bỏ tệp đã chọn
                      </button>
                    )}
                  </div>

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
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                      hasAlreadySubmitted
                        ? "border-emerald-400 bg-emerald-50/50 cursor-not-allowed select-none"
                        : isDragging
                        ? "border-[#0284C7] bg-sky-50 cursor-pointer"
                        : uploadedFile
                        ? "border-emerald-500 bg-emerald-50/40 cursor-pointer"
                        : "border-slate-300 bg-slate-50 hover:bg-slate-100/70 cursor-pointer"
                    }`}
                  >
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
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 text-[#0284C7]">
                      {hasAlreadySubmitted ? (
                        <Lock className="w-7 h-7 text-emerald-600" />
                      ) : (
                        <UploadCloud className="w-7 h-7" />
                      )}
                    </div>

                    {uploadedFile ? (
                      <div className="space-y-2">
                        <p className="text-base font-bold text-slate-900">
                          {hasAlreadySubmitted ? "Tệp bài làm đã nộp & đã khóa: " : "Đã chọn tệp từ máy tính: "}
                          <span className="font-mono text-[#0284C7]">{uploadedFile.name}</span>{" "}
                          <span className="text-xs font-normal text-slate-500">
                            ({(uploadedFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </p>
                        {previewNormalized && (
                          <div className="inline-flex flex-wrap items-center justify-center gap-2 text-xs bg-white px-4 py-2 rounded-xl border border-slate-200">
                            <span className="text-slate-500">Tự động chuẩn hóa tên tệp thành:</span>
                            <span className="font-mono font-bold text-emerald-700">
                              {previewNormalized.standardizedName}
                            </span>
                          </div>
                        )}
                        {hasAlreadySubmitted ? (
                          <p className="text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-emerald-700" />
                            Tệp bài làm đã được lưu an toàn và khóa lại. Không thể tải tệp mới lên.
                          </p>
                        ) : (
                          <p className="text-xs text-emerald-700 font-semibold">
                            ✓ Đã sẵn sàng! Em hãy bấm nút "NỘP BÀI CHO THẦY &amp; XEM ĐIỂM NGAY" ở phía dưới.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-base font-bold text-slate-800">
                          Bấm vào đây để chọn tệp bài làm .{selectedAssignment.fileType} từ máy tính của em (hoặc kéo thả tệp vào ô này)
                        </p>
                        <p className="text-xs text-slate-500">
                          Hệ thống chỉ bắt đầu chấm điểm sau khi em đã chọn tệp thực tế từ máy tính và bấm nút Nộp bài.
                        </p>
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

              {/* Big Friendly Submit Button — Khóa tuyệt đối nếu đã nộp bài (chỉ cho nộp 1 lần) hoặc chưa làm hết bài */}
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
                    className="w-full sm:w-auto min-w-[320px] py-4 px-8 bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-sm"
                  >
                    {isGrading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{gradingStageText || "Trợ lý AI đang chấm theo Ma trận đề..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>
                          {selectedAssignment.fileType !== "theory" && !uploadedFile
                            ? `VUI LÒNG CHỌN TỆP .${selectedAssignment.fileType.toUpperCase()} TỪ MÁY TÍNH ĐỂ NỘP`
                            : selectedAssignment.fileType === "theory" && !isTheoryExamComplete
                            ? "VUI LÒNG LÀM HẾT TẤT CẢ CÁC CÂU HỎI ĐỂ NỘP BÀI"
                            : "NỘP BÀI CHO THẦY & XEM KẾT QUẢ NGAY!"}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Gamified Celebration & Instant Matrix-Aligned AI Result Card (Read-Only for Student) */}
          {completedSubmission && (
            <div className="bg-white border-2 border-emerald-400 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    ĐÃ CHẤM XONG BÁM SÁT MA TRẬN ĐỀ TRONG {completedSubmission.processingTimeSec} GIÂY!
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Kết quả bài làm của em {completedSubmission.studentName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-600">
                    <span>Tên file nộp: {completedSubmission.originalFileName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[#0284C7] font-semibold">
                      Đã lưu chuẩn: {completedSubmission.standardizedFileName}
                    </span>
                  </div>
                </div>

                {/* Star Rating & Score */}
                <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 px-5 py-3 rounded-2xl shrink-0">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-5 h-5 ${
                          idx < Math.round(completedSubmission.aiScore / 2)
                            ? "fill-amber-400 text-amber-500"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <span className="text-xs text-slate-500 block font-sans">
                      Điểm chấm theo Ma trận
                    </span>
                    <span className="text-2xl font-bold text-slate-900">
                      {completedSubmission.aiScore.toFixed(1)} / 10
                    </span>
                  </div>
                </div>
              </div>

              {/* Personalized Encouraging Feedback from Thầy */}
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-[#0284C7] block">
                  💬 Nhận xét của Thầy dành riêng cho {completedSubmission.studentName}:
                </span>
                <p className="text-sm font-medium text-slate-900">
                  “{completedSubmission.personalizedFeedback}”
                </p>
              </div>

              {/* Bảng Kết quả Đối chiếu Chi tiết từng Tiêu chí trong Ma trận Đề */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bảng Chấm Chi tiết theo Ma trận Đề bài ({completedSubmission.assignmentTitle}):
                </h4>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {completedSubmission.criterionBreakdown.map((item, idx) => (
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
              </div>

              {/* HÌNH ẢNH BÀI LÀM THỰC HÀNH CỦA HỌC SINH & TÊN TỆP TRONG PHIẾU KẾT QUẢ (Đối với các bài có phần thực hành) */}
              {hasPracticeSection(completedSubmission, assignments) && (
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
                            {getGoogleDrivePracticeFileInfo(completedSubmission).studentRawFileName}
                          </span>
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-700">
                          <strong>Tên tệp chuẩn hóa trong phiếu:</strong>{" "}
                          <span className="font-mono font-bold text-[#0284C7]">
                            {getGoogleDrivePracticeFileInfo(completedSubmission).driveFileName}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const snapUrl =
                            completedSubmission.practiceWorkImageDataUrl ||
                            generatePracticeWorkSnapshotSync(completedSubmission, assignments);
                          const link = document.createElement("a");
                          link.href = snapUrl;
                          const cleanStudent = removeVietnameseTones(
                            completedSubmission.studentName
                          ).replace(/\s+/g, "_");
                          link.download = `AnhBaiLam_${cleanStudent}_${
                            getGoogleDrivePracticeFileInfo(completedSubmission).driveFileName
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
                            [completedSubmission],
                            assignments,
                            `Học sinh ${completedSubmission.studentName} (${completedSubmission.className})`
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
                            [completedSubmission],
                            assignments,
                            `Học sinh ${completedSubmission.studentName} (${completedSubmission.className})`
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
                        completedSubmission.practiceWorkImageDataUrl ||
                        generatePracticeWorkSnapshotSync(completedSubmission, assignments)
                      }
                      alt={`Ảnh bài làm thực hành của ${completedSubmission.studentName}`}
                      className="w-full max-w-4xl rounded-lg border border-slate-200 object-contain"
                    />
                    <p className="text-xs text-slate-600 text-center">
                      📄 <strong>Tên tệp của học sinh trong phiếu:</strong>{" "}
                      <span className="font-mono text-slate-900">
                        {getGoogleDrivePracticeFileInfo(completedSubmission).studentRawFileName}
                      </span>{" "}
                      ➔{" "}
                      <span className="font-mono font-bold text-[#0284C7]">
                        {getGoogleDrivePracticeFileInfo(completedSubmission).driveFileName}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* If Scratch .sb3 -> Show Interactive 2D Sandbox right here too! */}
              {completedSubmission.inspection.type === "sb3" &&
                completedSubmission.inspection.data.simulationTrajectory.length > 0 && (
                  <ScratchSimulatorPanel data={completedSubmission.inspection.data} />
                )}

              {/* Footer trong thẻ kết quả của Học sinh: Chỉ cho Làm lại hoặc Xem bảng kết quả (Không có nút sang trang quản lý/duyệt của Giáo viên) */}
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
                    onClick={() => onInspectSubmissionReadOnly(completedSubmission)}
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
          )}
        </>
      )}
    </div>
  );
};
