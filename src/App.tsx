import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Check,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Sparkles,
  UserCheck,
  Users,
  Trash2,
  CheckSquare,
  Square,
  Lock,
  KeyRound,
  ShieldCheck,
  Download,
  FileText,
  HardDrive,
  History,
  RefreshCw,
  Upload,
  X,
  Clock,
  FolderSync,
} from "lucide-react";
import {
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_OPERATION_HISTORY,
  LAST_CODE_SYNC_AT,
} from "./data/initialData";
import {
  fetchSystemStateFromCode,
  loadCachedLocalState,
  mergeArrayById,
  OperationLogEntry,
  syncStateToCodebase,
} from "./utils/codeSyncEngine";
import {
  Assignment,
  PracticeFileType,
  StudentSubmission,
} from "./types/grading";
import {
  exportParentReportToDocx,
  exportParentReportToPdf,
  generatePracticeWorkSnapshotSync,
  getGoogleDrivePracticeFileInfo,
  getGoogleDrivePracticeFileName,
  getOfficialParentFeedback,
  hasPracticeSection,
} from "./utils/exportEngine";
import { SubmissionInspectorModal } from "./components/SubmissionInspectorModal";
import { AiExamBuilderView } from "./components/AiExamBuilderView";
import { StudentPortalView } from "./components/StudentPortalView";
import { ClassAnalyticsView } from "./components/ClassAnalyticsView";
import { ClassManagerView, INITIAL_CLASSES, ClassRoom } from "./components/ClassManagerView";
import { Circular27AssessmentView } from "./components/Circular27AssessmentView";
import { GoogleDriveSyncModal } from "./components/GoogleDriveSyncModal";
import { initAuth } from "./utils/googleDriveService";
import {
  subscribeAssignments,
  subscribeClasses,
  subscribeSubmissions,
  subscribeSystemState,
  seedInitialFirestoreDataIfEmpty,
  saveSubmissionToFirestore,
  saveAssignmentToFirestore,
  saveClassesToFirestore,
  deleteSubmissionFromFirestore,
  deleteAssignmentFromFirestore,
} from "./services/supabaseService";
import { subscribeSyncBroadcast } from "./utils/broadcastSync";

type ActiveTab =
  | "dashboard"
  | "classes"
  | "builder"
  | "analytics"
  | "tt27_comments"
  | "student_portal";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("student_portal");
  const initialCached = useMemo(() => loadCachedLocalState(), []);

  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    mergeArrayById(
      initialCached?.assignments || [],
      INITIAL_ASSIGNMENTS,
      initialCached?.deletedIds?.assignments || []
    )
  );
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() =>
    mergeArrayById(
      initialCached?.submissions || [],
      INITIAL_SUBMISSIONS,
      initialCached?.deletedIds?.submissions || []
    )
  );
  const [classesList, setClassesList] = useState<ClassRoom[]>(() =>
    initialCached?.classes && initialCached.classes.length > 0
      ? mergeArrayById(
          initialCached.classes,
          INITIAL_CLASSES,
          initialCached?.deletedIds?.classes || []
        )
      : INITIAL_CLASSES
  );
  const [operationHistory, setOperationHistory] = useState<OperationLogEntry[]>(() =>
    mergeArrayById(
      initialCached?.operationHistory || [],
      INITIAL_OPERATION_HISTORY || [],
      []
    )
  );
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    initialCached?.lastUpdatedAt || LAST_CODE_SYNC_AT || new Date().toLocaleString("vi-VN")
  );
  const [showHistorySyncModal, setShowHistorySyncModal] = useState<boolean>(false);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [syncModalNotice, setSyncModalNotice] = useState<string>("");

  // Quản lý Trạng thái & Hộp thoại Đồng bộ Google Drive (0đ chi phí)
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState<boolean>(false);
  const [googleDriveConnected, setGoogleDriveConnected] = useState<boolean>(false);

  useEffect(() => {
    const unsubDrive = initAuth(
      () => setGoogleDriveConnected(true),
      () => setGoogleDriveConnected(false)
    );
    return () => {
      unsubDrive();
    };
  }, []);

  const handleRestoreFromGoogleDrive = async (importedState: any) => {
    if (!importedState || typeof importedState !== "object") return;

    const nextClasses =
      Array.isArray(importedState.classes) && importedState.classes.length > 0
        ? mergeArrayById(importedState.classes, classesList, [])
        : classesList;
    const nextAssignments = Array.isArray(importedState.assignments)
      ? mergeArrayById(importedState.assignments, assignments, [])
      : assignments;
    const nextSubmissions = Array.isArray(importedState.submissions)
      ? mergeArrayById(importedState.submissions, submissions, [])
      : submissions;
    const nextHistory = Array.isArray(importedState.operationHistory)
      ? mergeArrayById(importedState.operationHistory, operationHistory, [])
      : operationHistory;

    setClassesList(nextClasses);
    setAssignments(nextAssignments);
    setSubmissions(nextSubmissions);
    setOperationHistory(nextHistory);

    const res = await syncStateToCodebase({
      classes: nextClasses,
      assignments: nextAssignments,
      submissions: nextSubmissions,
      tt27RegularRecords: importedState.tt27RegularRecords,
      tt27PeriodicRecords: importedState.tt27PeriodicRecords,
      operationHistory: nextHistory,
      examBuilderDraft: importedState.examBuilderDraft,
      actionLabel: "Khôi phục toàn bộ dữ liệu từ Google Drive chia sẻ",
      actionCategory: "sync",
    });
    applySyncResult(res);
  };

  const applySyncResult = (res: {
    ok: boolean;
    lastUpdatedAt: string;
    operationHistory?: OperationLogEntry[];
  }) => {
    if (res.lastUpdatedAt) setLastSyncTime(res.lastUpdatedAt);
    if (res.operationHistory) setOperationHistory(res.operationHistory);
  };

  // Tự động hợp nhất 2 chiều trạng thái mới nhất từ Server & trình duyệt khi khởi động hoặc chuyển tab
  useEffect(() => {
    fetchSystemStateFromCode().then((remote) => {
      if (!remote) return;
      if (Array.isArray(remote.classes) && remote.classes.length > 0) {
        setClassesList(remote.classes);
      }
      if (Array.isArray(remote.assignments)) {
        setAssignments(remote.assignments);
      }
      if (Array.isArray(remote.submissions)) {
        setSubmissions(remote.submissions);
      }
      if (Array.isArray(remote.operationHistory)) {
        setOperationHistory(remote.operationHistory);
      }
      if (remote.lastUpdatedAt) {
        setLastSyncTime(remote.lastUpdatedAt);
      }
    });
  }, [activeTab]);

  // Lắng nghe cơ sở dữ liệu Firebase Firestore thời gian thực (Realtime Multi-Device Sync)
  useEffect(() => {
    seedInitialFirestoreDataIfEmpty(INITIAL_CLASSES, INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS).catch(() => {});

    // Lắng nghe Đề thi thời gian thực
    const unsubAssignments = subscribeAssignments((remoteAssignments) => {
      if (Array.isArray(remoteAssignments) && remoteAssignments.length > 0) {
        setAssignments(remoteAssignments);
      }
    });

    // Lắng nghe Lớp học & Học sinh thời gian thực
    const unsubClasses = subscribeClasses((remoteClasses) => {
      if (Array.isArray(remoteClasses) && remoteClasses.length > 0) {
        setClassesList(remoteClasses);
      }
    });

    // Lắng nghe Bài nộp của học sinh thời gian thực
    const unsubSubmissions = subscribeSubmissions((remoteSubmissions) => {
      if (Array.isArray(remoteSubmissions)) {
        setSubmissions(remoteSubmissions);
      }
    });

    // Lắng nghe Trạng thái hệ thống thời gian thực
    const unsubSystemState = subscribeSystemState((remoteState) => {
      if (remoteState?.operationHistory && Array.isArray(remoteState.operationHistory)) {
        setOperationHistory(remoteState.operationHistory);
      }
      if ((remoteState as any)?.lastUpdatedAt) {
        setLastSyncTime((remoteState as any).lastUpdatedAt);
      }
    });

    // Lắng nghe kênh BroadcastChannel Realtime siêu tốc tức thì giữa các tab/cửa sổ
    const unsubBroadcast = subscribeSyncBroadcast((msg) => {
      if (msg.type === "NEW_SUBMISSION" && msg.payload) {
        setSubmissions((prev) => {
          const exists = prev.some((s) => s.id === msg.payload.id);
          return exists
            ? prev.map((s) => (s.id === msg.payload.id ? msg.payload : s))
            : [msg.payload, ...prev];
        });
      } else if (msg.type === "DELETE_SUBMISSION" && msg.payload?.id) {
        setSubmissions((prev) => prev.filter((s) => s.id !== msg.payload.id));
      } else if (msg.type === "ADD_ASSIGNMENT" && msg.payload) {
        setAssignments((prev) => {
          const exists = prev.some((a) => a.id === msg.payload.id);
          return exists
            ? prev.map((a) => (a.id === msg.payload.id ? msg.payload : a))
            : [msg.payload, ...prev];
        });
      } else if (msg.type === "DELETE_ASSIGNMENT" && msg.payload?.id) {
        setAssignments((prev) => prev.filter((a) => a.id !== msg.payload.id));
      } else if (msg.type === "UPDATE_CLASSES" && Array.isArray(msg.payload)) {
        setClassesList(msg.payload);
      }
    });

    return () => {
      unsubAssignments();
      unsubClasses();
      unsubSubmissions();
      unsubSystemState();
      unsubBroadcast();
    };
  }, []);

  // Filters on Teacher Dashboard
  const [classFilter, setClassFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | PracticeFileType>("all");
  const [attentionOnly, setAttentionOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selection state for single or batch Approve / Delete
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState<boolean>(false);
  const [confirmingSingleDeleteId, setConfirmingSingleDeleteId] = useState<string | null>(null);

  // Selected submission for Deep-Dive DOM / Slide XML / Scratch AST & 2D Sandbox Modal
  const [inspectedSubmission, setInspectedSubmission] = useState<StudentSubmission | null>(null);

  // Teacher PIN unlock state when in Student Portal mode (prevents students from entering Teacher pages)
  const [showTeacherUnlockPrompt, setShowTeacherUnlockPrompt] = useState<boolean>(false);
  const [teacherPinInput, setTeacherPinInput] = useState<string>("");
  const [teacherPinError, setTeacherPinError] = useState<string>("");

  // State cho chức năng Xuất Bài làm của lớp dưới dạng tệp Word / PDF cho [tên học sinh / cả lớp] gửi Phụ huynh
  const [parentExportTarget, setParentExportTarget] = useState<string>("all_approved");
  const [parentExportNotice, setParentExportNotice] = useState<string>("");

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (classFilter !== "all" && sub.className !== classFilter) return false;
      if (typeFilter !== "all" && sub.fileType !== typeFilter) return false;
      if (attentionOnly && !sub.needsAttention) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = sub.studentName.toLowerCase().includes(q);
        const matchFile = sub.standardizedFileName.toLowerCase().includes(q);
        const matchTitle = sub.assignmentTitle.toLowerCase().includes(q);
        if (!matchName && !matchFile && !matchTitle) return false;
      }
      return true;
    });
  }, [submissions, classFilter, typeFilter, attentionOnly, searchQuery]);

  const allFilteredSelected =
    filteredSubmissions.length > 0 &&
    filteredSubmissions.every((sub) => selectedSubIds.includes(sub.id));

  const handleToggleSelectOne = (id: string) => {
    setConfirmingBulkDelete(false);
    setSelectedSubIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllFiltered = () => {
    setConfirmingBulkDelete(false);
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredSubmissions.map((s) => s.id));
      setSelectedSubIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const merged = new Set([...selectedSubIds, ...filteredSubmissions.map((s) => s.id)]);
      setSelectedSubIds(Array.from(merged));
    }
  };

  const handleBulkApproveSelected = () => {
    if (selectedSubIds.length === 0) return;
    const selectedSet = new Set(selectedSubIds);
    setSubmissions((prev) => {
      const next = prev.map((s) =>
        selectedSet.has(s.id) ? { ...s, approvalStatus: "approved" as const } : s
      );
      syncStateToCodebase({
        submissions: next,
        actionLabel: `Duyệt hàng loạt ${selectedSubIds.length} bài nộp của học sinh`,
        actionCategory: "grading",
      }).then(applySyncResult);
      return next;
    });
    setSelectedSubIds([]);
    setConfirmingBulkDelete(false);
  };

  const handleBulkDeleteSelected = () => {
    if (selectedSubIds.length === 0) return;
    const selectedSet = new Set(selectedSubIds);
    setSubmissions((prev) => {
      const next = prev.filter((s) => !selectedSet.has(s.id));
      syncStateToCodebase({
        submissions: next,
        deletedIds: { submissions: selectedSubIds },
        actionLabel: `Xóa ${selectedSubIds.length} bài nộp đã chọn`,
        actionCategory: "submission",
      }).then(applySyncResult);
      return next;
    });
    if (inspectedSubmission && selectedSet.has(inspectedSubmission.id)) {
      setInspectedSubmission(null);
    }
    setSelectedSubIds([]);
    setConfirmingBulkDelete(false);
  };

  const handleDeleteSingleSubmission = (id: string) => {
    deleteSubmissionFromFirestore(id).catch(() => {});
    setSubmissions((prev) => {
      const targetSub = prev.find((s) => s.id === id);
      const next = prev.filter((s) => s.id !== id);
      syncStateToCodebase({
        submissions: next,
        deletedIds: { submissions: [id] },
        actionLabel: `Xóa bài nộp của học sinh ${targetSub?.studentName || id} (${targetSub?.className || ""})`,
        actionCategory: "submission",
      }).then(applySyncResult);
      return next;
    });
    setSelectedSubIds((prev) => prev.filter((item) => item !== id));
    if (inspectedSubmission?.id === id) {
      setInspectedSubmission(null);
    }
    setConfirmingSingleDeleteId(null);
  };

  const handleUpdateSubmission = (
    id: string,
    updates: Partial<Pick<StudentSubmission, "finalScore" | "approvalStatus" | "personalizedFeedback">>
  ) => {
    setSubmissions((prev) => {
      const targetSub = prev.find((s) => s.id === id);
      const next = prev.map((s) => {
        if (s.id !== id) return s;
        const nextScore = updates.finalScore !== undefined ? updates.finalScore : s.finalScore;
        return {
          ...s,
          ...updates,
          needsAttention: nextScore < 6.5,
        };
      });
      syncStateToCodebase({
        submissions: next,
        actionLabel: `Chấm & cập nhật điểm bài làm của ${targetSub?.studentName || id} (${targetSub?.className || ""})`,
        actionCategory: "grading",
      }).then(applySyncResult);
      return next;
    });
    if (inspectedSubmission?.id === id) {
      setInspectedSubmission((prev) =>
        prev
          ? {
              ...prev,
              ...updates,
              needsAttention:
                (updates.finalScore !== undefined ? updates.finalScore : prev.finalScore) < 6.5,
            }
          : null
      );
    }
  };

  const handleBatchApproveAllPending = () => {
    setSubmissions((prev) => {
      const pendingItems = prev.filter((s) => s.approvalStatus === "pending").length;
      const next = prev.map((s) =>
        s.approvalStatus === "pending" ? { ...s, approvalStatus: "approved" as const } : s
      );
      syncStateToCodebase({
        submissions: next,
        actionLabel: `Duyệt toàn bộ ${pendingItems} bài nộp đang chờ duyệt`,
        actionCategory: "grading",
      }).then(applySyncResult);
      return next;
    });
  };

  const handleAddAssignment = (newAsg: Assignment) => {
    saveAssignmentToFirestore(newAsg).catch((err) => {
      console.warn("Lưu đề thi lên Firestore:", err);
    });
    setAssignments((prev) => {
      const exists = prev.some((a) => a.id === newAsg.id);
      const next = exists
        ? prev.map((a) => (a.id === newAsg.id ? newAsg : a))
        : [newAsg, ...prev];
      syncStateToCodebase({
        assignments: next,
        actionLabel: exists
          ? `Chỉnh sửa & cập nhật đề "${newAsg.title}" (${newAsg.className})`
          : `Tạo & giao đề mới "${newAsg.title}" cho ${newAsg.className}`,
        actionCategory: "exam",
      }).then(applySyncResult);
      return next;
    });
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    deleteAssignmentFromFirestore(assignmentId).catch(() => {});
    setAssignments((prev) => {
      const targetAsg = prev.find((a) => a.id === assignmentId);
      const next = prev.filter((a) => a.id !== assignmentId);
      syncStateToCodebase({
        assignments: next,
        deletedIds: { assignments: [assignmentId] },
        actionLabel: `Xóa đề kiểm tra "${targetAsg?.title || assignmentId}"`,
        actionCategory: "exam",
      }).then(applySyncResult);
      return next;
    });
  };

  const handleNewStudentSubmission = (newSub: StudentSubmission) => {
    saveSubmissionToFirestore(newSub).catch((err) => {
      console.warn("Lưu bài nộp lên Firestore:", err);
    });
    setSubmissions((prev) => {
      const exists = prev.some((s) => s.id === newSub.id);
      const next = exists
        ? prev.map((s) => (s.id === newSub.id ? newSub : s))
        : [newSub, ...prev];
      syncStateToCodebase({
        submissions: next,
        actionLabel: `Học sinh ${newSub.studentName} (${newSub.className}) nộp bài "${newSub.assignmentTitle}" (${newSub.finalScore.toFixed(1)}đ)`,
        actionCategory: "submission",
      }).then(applySyncResult);
      return next;
    });
  };

  const handleUpdateClassesAndSync = (updatedClasses: ClassRoom[]) => {
    setClassesList(updatedClasses);
    saveClassesToFirestore(updatedClasses).catch((err) => {
      console.warn("Lưu danh sách lớp lên Firestore:", err);
    });
    const totalStudents = updatedClasses.reduce(
      (sum, c) => sum + (c.students?.length || 0),
      0
    );
    syncStateToCodebase({
      classes: updatedClasses,
      actionLabel: `Cập nhật danh sách Lớp & Học sinh (${updatedClasses.length} lớp · ${totalStudents} học sinh)`,
      actionCategory: "class",
    }).then(applySyncResult);
  };

  const handleManualTwoWaySync = async () => {
    setIsManualSyncing(true);
    setSyncModalNotice("");
    try {
      const remote = await fetchSystemStateFromCode();
      if (remote) {
        if (Array.isArray(remote.classes) && remote.classes.length > 0) {
          setClassesList(remote.classes);
        }
        if (Array.isArray(remote.assignments)) {
          setAssignments(remote.assignments);
        }
        if (Array.isArray(remote.submissions)) {
          setSubmissions(remote.submissions);
        }
        const synced = await syncStateToCodebase({
          classes: remote.classes || classesList,
          assignments: remote.assignments || assignments,
          submissions: remote.submissions || submissions,
          actionLabel: "Đồng bộ 2 chiều & xác thực toàn bộ dữ liệu lịch sử thao tác",
          actionCategory: "sync",
        });
        applySyncResult(synced);
        setSyncModalNotice(
          `Đã đồng bộ 2 chiều thành công lúc ${synced.lastUpdatedAt}! Toàn bộ lịch sử thao tác, đề thi, danh sách lớp và bài nộp đều được bảo toàn.`
        );
      }
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleExportFullBackupJson = () => {
    const cached = loadCachedLocalState() || {};
    const payload = {
      exportedAt: new Date().toLocaleString("vi-VN"),
      lastUpdatedAt: lastSyncTime,
      classes: classesList,
      assignments,
      submissions,
      tt27RegularRecords: cached.tt27RegularRecords || {},
      tt27PeriodicRecords: cached.tt27PeriodicRecords || {},
      operationHistory,
      examBuilderDraft: cached.examBuilderDraft || null,
      deletedIds: cached.deletedIds || { assignments: [], submissions: [], classes: [] },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SaoLuu_EduAI_Primary_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSyncModalNotice("Đã xuất tệp sao lưu toàn bộ dữ liệu & lịch sử thao tác (.json) thành công!");
  };

  const handleImportFullBackupJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!imported || typeof imported !== "object") {
        throw new Error("Tệp JSON không hợp lệ.");
      }
      const nextClasses =
        Array.isArray(imported.classes) && imported.classes.length > 0
          ? mergeArrayById(imported.classes, classesList, [])
          : classesList;
      const nextAssignments = Array.isArray(imported.assignments)
        ? mergeArrayById(imported.assignments, assignments, [])
        : assignments;
      const nextSubmissions = Array.isArray(imported.submissions)
        ? mergeArrayById(imported.submissions, submissions, [])
        : submissions;
      const nextHistory = Array.isArray(imported.operationHistory)
        ? mergeArrayById(imported.operationHistory, operationHistory, [])
        : operationHistory;

      setClassesList(nextClasses);
      setAssignments(nextAssignments);
      setSubmissions(nextSubmissions);
      setOperationHistory(nextHistory);

      const res = await syncStateToCodebase({
        classes: nextClasses,
        assignments: nextAssignments,
        submissions: nextSubmissions,
        tt27RegularRecords: imported.tt27RegularRecords,
        tt27PeriodicRecords: imported.tt27PeriodicRecords,
        operationHistory: nextHistory,
        examBuilderDraft: imported.examBuilderDraft,
        actionLabel: `Đồng bộ & khôi phục dữ liệu từ tệp sao lưu (${file.name})`,
        actionCategory: "sync",
      });
      applySyncResult(res);
      setSyncModalNotice(
        `Đã hợp nhất & đồng bộ dữ liệu từ tệp "${file.name}" thành công (${nextClasses.length} lớp, ${nextAssignments.length} đề, ${nextSubmissions.length} bài nộp)!`
      );
    } catch (err: any) {
      setSyncModalNotice(
        `Lỗi khi đọc tệp sao lưu: ${err?.message || "Định dạng không hợp lệ"}`
      );
    } finally {
      e.target.value = "";
    }
  };

  const handleSwitchToStudentPortal = () => {
    setInspectedSubmission(null);
    setShowTeacherUnlockPrompt(false);
    setTeacherPinInput("");
    setTeacherPinError("");
    setActiveTab("student_portal");
  };

  const handleUnlockTeacherMode = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherPinInput.trim() === "Phucnguyen79@") {
      setShowTeacherUnlockPrompt(false);
      setTeacherPinInput("");
      setTeacherPinError("");
      setInspectedSubmission(null);
      setActiveTab("dashboard");
    } else {
      setTeacherPinError("Mật khẩu mở khóa chưa đúng. Vui lòng thử lại!");
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Mã HS",
      "Họ và Tên Học sinh",
      "Lớp",
      "Bài tập",
      "Loại File",
      "Tên File Gốc",
      "Tên File Chuẩn Hóa",
      "Điểm AI Đề xuất",
      "Điểm Giáo Viên Duyệt",
      "Trạng thái",
      "Các Lỗi Sai AI Phát Hiện",
      "Lời Phê Cá Nhân Hóa",
    ];

    const rows = submissions.map((s) => [
      s.studentId,
      `"${s.studentName}"`,
      `"${s.className}"`,
      `"${s.assignmentTitle.replace(/"/g, '""')}"`,
      s.fileType.toUpperCase(),
      `"${s.originalFileName}"`,
      `"${s.standardizedFileName}"`,
      s.aiScore.toFixed(1),
      s.finalScore.toFixed(1),
      s.approvalStatus === "approved"
        ? "Đã duyệt"
        : s.approvalStatus === "adjusted"
        ? "Đã châm chước"
        : "Chờ duyệt",
      `"${s.detectedErrors.join("; ").replace(/"/g, '""')}"`,
      `"${s.personalizedFeedback.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BangDiem_EduAI_Primary_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const pendingCount = submissions.filter((s) => s.approvalStatus === "pending").length;
  const redAlertCount = submissions.filter((s) => s.needsAttention).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract — Enforces Role Separation between Teacher & Student */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            if (activeTab !== "student_portal") {
              setActiveTab("dashboard");
            }
          }}
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          {activeTab === "student_portal"
            ? "EduAI Primary — Cổng Học Sinh"
            : "EduAI Primary"}
        </a>

        {/* Zone 2: Navigation links — Hidden when in Student Mode so students CANNOT click Teacher Management pages */}
        {activeTab === "student_portal" ? (
          <div className="hidden md:flex items-center gap-3 text-xs font-medium text-slate-600 bg-sky-50 border border-sky-200 px-3.5 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-[#0284C7] shrink-0" />
            <span>
              Chế độ Học sinh: Chỉ cho phép <strong>Làm bài &amp; Nộp bài</strong> và{" "}
              <strong>Xem kết quả</strong> (Đã khóa các trang quản lý &amp; lệnh duyệt của Giáo viên)
            </span>
          </div>
        ) : (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activeTab === "dashboard"
                  ? "border-[#0284C7] text-slate-900 font-semibold"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              Bảng chấm &amp; Duyệt bài ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("classes")}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activeTab === "classes"
                  ? "border-[#0284C7] text-slate-900 font-semibold"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              Quản lý Lớp &amp; Học sinh
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("builder")}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activeTab === "builder"
                  ? "border-[#0284C7] text-slate-900 font-semibold"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              AI Ra đề &amp; Bài mẫu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activeTab === "analytics"
                  ? "border-[#0284C7] text-slate-900 font-semibold"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              Báo cáo Lớp học
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tt27_comments")}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activeTab === "tt27_comments"
                  ? "border-[#0284C7] text-slate-900 font-semibold"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              Nhận xét (Thông tư 27)
            </button>
          </nav>
        )}

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2.5 shrink-0 relative">
          {activeTab !== "student_portal" ? (
            <>
              <button
                type="button"
                onClick={() => setShowGoogleDriveModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0B6699] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                title="Đồng bộ toàn bộ dữ liệu thao tác của Giáo viên & Học sinh vào Google Drive chia sẻ (0đ)"
              >
                <FolderSync className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Google Drive</span>
                {googleDriveConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đã kết nối
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">0đ</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSyncModalNotice("");
                  setShowHistorySyncModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                title="Xem lịch sử thao tác tự động lưu và đồng bộ 2 chiều"
              >
                <History className="w-3.5 h-3.5 text-emerald-700" />
                <span>Lịch sử &amp; Đồng bộ ({operationHistory.length})</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                Xuất Excel
              </button>
              <button
                type="button"
                onClick={handleSwitchToStudentPortal}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Chuyển sang Cổng Học sinh
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {!showTeacherUnlockPrompt ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowTeacherUnlockPrompt(true);
                    setTeacherPinError("");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Dành riêng cho Giáo viên mở khóa quay lại trang quản lý"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Dành cho Giáo viên (Mở khóa)
                </button>
              ) : (
                <form
                  onSubmit={handleUnlockTeacherMode}
                  className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="password"
                    value={teacherPinInput}
                    onChange={(e) => {
                      setTeacherPinInput(e.target.value);
                      setTeacherPinError("");
                    }}
                    placeholder="Nhập mật khẩu GV..."
                    autoFocus
                    className="w-36 px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#0284C7]"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded cursor-pointer"
                  >
                    Mở
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeacherUnlockPrompt(false);
                      setTeacherPinInput("");
                      setTeacherPinError("");
                    }}
                    className="px-1.5 py-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Đóng
                  </button>
                </form>
              )}
              {teacherPinError && (
                <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                  {teacherPinError}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Navigation Bar — Only visible in Teacher Mode */}
      {activeTab !== "student_portal" && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              activeTab === "dashboard" ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
          >
            Bảng chấm
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("classes")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              activeTab === "classes" ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
          >
            Lớp &amp; HS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("builder")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              activeTab === "builder" ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
          >
            AI Ra đề
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              activeTab === "analytics" ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
          >
            Báo cáo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tt27_comments")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              activeTab === "tt27_comments" ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
          >
            Nhận xét (TT27)
          </button>
          <button
            type="button"
            onClick={handleSwitchToStudentPortal}
            className="px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap text-[#0284C7] bg-sky-50"
          >
            Cổng Học sinh
          </button>
        </div>
      )}

      {/* Main Content Container (1440px max-w-7xl presence) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Hero / Context Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#0284C7]">EduAI Primary</span>
                  <span>·</span>
                  <span>Trợ lý AI Tin học Tiểu học (Lớp 3, 4, 5)</span>
                  <span>·</span>
                  <span>DOM Word (.docx)</span>
                  <span>·</span>
                  <span>Slide XML (.pptx)</span>
                  <span>·</span>
                  <span>Scratch AST &amp; Giả lập 2D (.sb3)</span>
                  <span>·</span>
                  <span>Tự luận ngắn NLP</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
                  Bảng Điều Khiển Chấm Bài Tự Động &amp; Phê Duyệt Kết Quả
                </h1>
                <p className="text-sm text-slate-600">
                  Giải phóng 80% thời gian chấm bài thực hành phòng máy: Tự động chuẩn hóa tên file học sinh đặt sai, phân tích cây cú pháp Scratch, kiểm tra căn lề Word/PowerPoint và gợi ý lời phê khích lệ từng em.
                </p>
              </div>

              {/* Action Strip */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("classes")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Users className="w-3.5 h-3.5 text-[#0284C7]" />
                  Quản lý Lớp &amp; Học sinh
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("builder")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
                  AI Soạn đề &amp; File mẫu mới
                </button>
                {pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={handleBatchApproveAllPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <UserCheck className="w-4 h-4" />
                    Duyệt nhanh {pendingCount} bài chờ ({pendingCount})
                  </button>
                )}
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Class Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setClassFilter("all")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      classFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tất cả lớp
                  </button>
                  {classesList.map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setClassFilter(cls.name)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        classFilter === cls.name
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {cls.name}
                    </button>
                  ))}
                </div>

                {/* File Type Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
                  {[
                    { id: "all", label: "Mọi loại bài" },
                    { id: "docx", label: "Word (.docx)" },
                    { id: "pptx", label: "Slide (.pptx)" },
                    { id: "sb3", label: "Scratch (.sb3)" },
                    { id: "theory", label: "Lý thuyết & NLP" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTypeFilter(t.id as any)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        typeFilter === t.id
                          ? "bg-white text-slate-900 shadow-xs font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Red Alert Toggle */}
                <button
                  type="button"
                  onClick={() => setAttentionOnly(!attentionOnly)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                    attentionOnly
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white text-red-700 border-red-200 hover:bg-red-50"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Cần hỗ trợ riêng ({redAlertCount})
                </button>
              </div>

              {/* Search Input */}
              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên học sinh, tên file..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>

            {/* Thanh công cụ Chọn từng bài / Chọn hàng loạt để Duyệt hoặc Xóa */}
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleSelectAllFiltered}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#0284C7]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  <span>
                    {allFilteredSelected
                      ? `Bỏ chọn tất cả (${filteredSubmissions.length} bài)`
                      : `Chọn hàng loạt tất cả (${filteredSubmissions.length} bài)`}
                  </span>
                </button>

                <span className="text-xs text-slate-600">
                  Đã chọn:{" "}
                  <strong className="font-mono text-[#0284C7]">{selectedSubIds.length}</strong> bài nộp
                </span>

                {selectedSubIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubIds([]);
                      setConfirmingBulkDelete(false);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={selectedSubIds.length === 0}
                  onClick={handleBulkApproveSelected}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5" />
                  Duyệt các bài đã chọn ({selectedSubIds.length})
                </button>

                {!confirmingBulkDelete ? (
                  <button
                    type="button"
                    disabled={selectedSubIds.length === 0}
                    onClick={() => setConfirmingBulkDelete(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-40 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa các bài đã chọn ({selectedSubIds.length})
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-300 px-2.5 py-1 rounded-lg">
                    <span className="text-xs font-bold text-red-800">
                      Xác nhận xóa {selectedSubIds.length} bài?
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkDeleteSelected}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                    >
                      Có, xóa ngay
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingBulkDelete(false)}
                      className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Khung Xuất Bài làm của lớp dưới dạng tệp Word / PDF cho [tên học sinh / cả lớp] gửi Phụ huynh */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <HardDrive className="w-4 h-4 text-emerald-700" />
                    Xuất Bài làm gửi Phụ huynh tra cứu (Word .docx / PDF .pdf cho [Tên học sinh / Cả lớp])
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
                    Bản chính thức — Tự động ẩn phần châm chước
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Tệp xuất ra bao gồm đầy đủ: <strong>Bài làm trắc nghiệm từng câu của học sinh</strong>,{" "}
                  <strong>Điểm số chính thức</strong>, <strong>Nhận xét chính thức của Thầy</strong> (không hiển thị ghi chú châm chước nội bộ),{" "}
                  <strong>Hình ảnh bài làm thực hành của học sinh</strong> (đối với bài có phần thực hành) và{" "}
                  <strong>Tên tệp của học sinh trong phiếu</strong> để phụ huynh thuận tiện tra cứu.
                </p>
                {parentExportNotice && (
                  <p className="text-xs font-semibold text-emerald-800 bg-white/90 border border-emerald-300 px-3 py-1.5 rounded-lg mt-1">
                    ● {parentExportNotice}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <select
                  value={parentExportTarget}
                  onChange={(e) => setParentExportTarget(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-white border border-emerald-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                >
                  <optgroup label="Xuất theo Cả lớp / Hàng loạt">
                    <option value="all_approved">
                      Cả lớp — Tất cả bài Đã duyệt (
                      {
                        filteredSubmissions.filter(
                          (s) => s.approvalStatus === "approved" || s.approvalStatus === "adjusted"
                        ).length
                      }{" "}
                      HS)
                    </option>
                    <option value="all_filtered">
                      Cả lớp — Toàn bộ danh sách đang lọc ({filteredSubmissions.length} HS)
                    </option>
                    {selectedSubIds.length > 0 && (
                      <option value="selected_only">
                        Các học sinh đang tích chọn ({selectedSubIds.length} HS)
                      </option>
                    )}
                  </optgroup>
                  <optgroup label="Xuất riêng cho từng [Tên học sinh]">
                    {filteredSubmissions.map((sub) => (
                      <option key={sub.id} value={`student:${sub.id}`}>
                        HS: {sub.studentName} ({sub.className} — {sub.finalScore.toFixed(1)}đ)
                      </option>
                    ))}
                  </optgroup>
                </select>

                <button
                  type="button"
                  onClick={async () => {
                    let targetSubs: StudentSubmission[] = [];
                    let scopeLabel = "";
                    if (parentExportTarget.startsWith("student:")) {
                      const subId = parentExportTarget.replace("student:", "");
                      const found = submissions.find((s) => s.id === subId);
                      if (found) {
                        targetSubs = [found];
                        scopeLabel = `Học sinh ${found.studentName} (${found.className})`;
                      }
                    } else if (parentExportTarget === "selected_only" && selectedSubIds.length > 0) {
                      const setIds = new Set(selectedSubIds);
                      targetSubs = submissions.filter((s) => setIds.has(s.id));
                      scopeLabel = `Danh sách ${targetSubs.length} học sinh đã chọn`;
                    } else if (parentExportTarget === "all_approved") {
                      const approved = filteredSubmissions.filter(
                        (s) => s.approvalStatus === "approved" || s.approvalStatus === "adjusted"
                      );
                      targetSubs = approved.length > 0 ? approved : filteredSubmissions;
                      scopeLabel =
                        classFilter === "all"
                          ? `Cả khối / Tất cả lớp (${targetSubs.length} học sinh)`
                          : `Cả ${classFilter} (${targetSubs.length} học sinh)`;
                    } else {
                      targetSubs = filteredSubmissions;
                      scopeLabel =
                        classFilter === "all"
                          ? `Cả khối / Tất cả lớp (${targetSubs.length} học sinh)`
                          : `Cả ${classFilter} (${targetSubs.length} học sinh)`;
                    }

                    if (targetSubs.length === 0) {
                      setParentExportNotice("Chưa có bài nộp nào trong danh sách để xuất file!");
                      return;
                    }
                    await exportParentReportToDocx(targetSubs, assignments, scopeLabel);
                    setParentExportNotice(
                      `Đã xuất tệp Word (.docx) gửi phụ huynh cho: ${scopeLabel}!`
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Xuất Word (.docx)
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    let targetSubs: StudentSubmission[] = [];
                    let scopeLabel = "";
                    if (parentExportTarget.startsWith("student:")) {
                      const subId = parentExportTarget.replace("student:", "");
                      const found = submissions.find((s) => s.id === subId);
                      if (found) {
                        targetSubs = [found];
                        scopeLabel = `Học sinh ${found.studentName} (${found.className})`;
                      }
                    } else if (parentExportTarget === "selected_only" && selectedSubIds.length > 0) {
                      const setIds = new Set(selectedSubIds);
                      targetSubs = submissions.filter((s) => setIds.has(s.id));
                      scopeLabel = `Danh sách ${targetSubs.length} học sinh đã chọn`;
                    } else if (parentExportTarget === "all_approved") {
                      const approved = filteredSubmissions.filter(
                        (s) => s.approvalStatus === "approved" || s.approvalStatus === "adjusted"
                      );
                      targetSubs = approved.length > 0 ? approved : filteredSubmissions;
                      scopeLabel =
                        classFilter === "all"
                          ? `Cả khối / Tất cả lớp (${targetSubs.length} học sinh)`
                          : `Cả ${classFilter} (${targetSubs.length} học sinh)`;
                    } else {
                      targetSubs = filteredSubmissions;
                      scopeLabel =
                        classFilter === "all"
                          ? `Cả khối / Tất cả lớp (${targetSubs.length} học sinh)`
                          : `Cả ${classFilter} (${targetSubs.length} học sinh)`;
                    }

                    if (targetSubs.length === 0) {
                      setParentExportNotice("Chưa có bài nộp nào trong danh sách để xuất file!");
                      return;
                    }
                    await exportParentReportToPdf(targetSubs, assignments, scopeLabel);
                    setParentExportNotice(
                      `Đã xuất tệp PDF (.pdf) gửi phụ huynh cho: ${scopeLabel}!`
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Xuất PDF (.pdf)
                </button>
              </div>
            </div>

            {/* High-Density Teacher Grading Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={handleToggleSelectAllFiltered}
                          title="Chọn hoặc bỏ chọn tất cả bài nộp"
                          className="w-4 h-4 accent-[#0284C7] rounded cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Học sinh &amp; Lớp</th>
                      <th className="py-3 px-4">Bài thực hành &amp; Tên tệp chuẩn hóa</th>
                      <th className="py-3 px-4">Phân tích Bài làm &amp; Nhận xét của Thầy</th>
                      <th className="py-3 px-4 text-right">Điểm AI</th>
                      <th className="py-3 px-4 text-right">Điểm chốt</th>
                      <th className="py-3 px-4 text-right">Thao tác Duyệt / Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          Không tìm thấy bài nộp nào khớp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((sub) => {
                        const isSelected = selectedSubIds.includes(sub.id);
                        return (
                          <tr
                            key={sub.id}
                            className={`transition-colors ${
                              isSelected
                                ? "bg-sky-50/70 hover:bg-sky-50"
                                : sub.needsAttention
                                ? "bg-red-50/40 hover:bg-red-50/70"
                                : "hover:bg-slate-50/90"
                            }`}
                          >
                            {/* Col 0: Checkbox chọn từng bài */}
                            <td className="py-3.5 px-4 align-top text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectOne(sub.id)}
                                className="w-4 h-4 accent-[#0284C7] rounded cursor-pointer mt-0.5"
                              />
                            </td>

                            {/* Col 1: Student & Class */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="font-semibold text-slate-900">{sub.studentName}</div>
                              <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span>{sub.className}</span>
                                <span>·</span>
                                <span className="font-mono">
                                  {sub.submittedAt?.includes("T")
                                    ? new Date(sub.submittedAt).toLocaleString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        day: "2-digit",
                                        month: "2-digit",
                                      })
                                    : sub.submittedAt}
                                </span>
                              </div>
                              {sub.needsAttention && (
                                <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-red-700">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  ▲ CẦN HỖ TRỢ RIÊNG
                                </div>
                              )}
                            </td>

                            {/* Col 2: Assignment & Auto-Renamed File + Practice Work Image Preview + Google Drive Path */}
                            <td className="py-3.5 px-4 align-top max-w-xs">
                              <div className="font-semibold text-slate-800 line-clamp-1">
                                {sub.assignmentTitle}
                              </div>
                              <div className="text-[11px] text-slate-700 mt-0.5 truncate">
                                <span className="text-slate-500">Tệp HS:</span>{" "}
                                <span className="font-mono font-semibold">
                                  {getGoogleDrivePracticeFileInfo(sub).studentRawFileName}
                                </span>
                              </div>
                              <div className="font-mono text-[11px] text-[#0284C7] font-semibold mt-0.5 truncate">
                                <span className="font-sans font-normal text-slate-500">Chuẩn hóa:</span>{" "}
                                {getGoogleDrivePracticeFileInfo(sub).driveFileName}
                              </div>
                              {hasPracticeSection(sub, assignments) && (
                                <div className="mt-1.5 flex items-center gap-2">
                                  <img
                                    src={
                                      sub.practiceWorkImageDataUrl ||
                                      generatePracticeWorkSnapshotSync(sub, assignments)
                                    }
                                    alt={`Ảnh bài làm ${sub.studentName}`}
                                    onClick={() => setInspectedSubmission(sub)}
                                    className="w-28 h-16 object-cover rounded border border-slate-300 shadow-2xs cursor-pointer hover:opacity-90 bg-white shrink-0"
                                  />
                                  <span className="text-[10px] text-emerald-700 font-semibold leading-tight">
                                    ✓ Đã nhúng ảnh bài làm &amp; tên tệp vào phiếu kết quả
                                  </span>
                                </div>
                              )}
                              <div
                                className="text-[10px] text-emerald-800 font-mono mt-1 truncate"
                                title={getGoogleDrivePracticeFileName(sub)}
                              >
                                Drive: {getGoogleDrivePracticeFileName(sub)}
                              </div>
                            </td>

                            {/* Col 3: Detected Errors & Teacher Feedback */}
                            <td className="py-3.5 px-4 align-top max-w-md">
                              {sub.detectedErrors.length === 0 ? (
                                <div className="text-emerald-700 font-medium flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  <span>Đạt 100% tiêu chí kỹ thuật (Không có lỗi sai)</span>
                                </div>
                              ) : (
                                <ul className="space-y-1 text-slate-700">
                                  {sub.detectedErrors.map((err, idx) => (
                                    <li key={idx} className="leading-snug">
                                      • {err}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <p className="text-[11px] text-slate-600 italic mt-1.5 line-clamp-2">
                                <strong className="not-italic text-slate-800">Nhận xét chính thức:</strong> “
                                {getOfficialParentFeedback(
                                  sub.personalizedFeedback,
                                  sub.finalScore,
                                  sub.studentName
                                )}
                                ”
                              </p>
                            </td>

                            {/* Col 4: AI Proposed Score */}
                            <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums">
                              <span className="text-sm font-semibold text-slate-700">
                                {sub.aiScore.toFixed(1)}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {sub.processingTimeSec}s
                              </span>
                            </td>

                            {/* Col 5: Final Approved Score */}
                            <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums">
                              <span
                                className={`text-base font-bold ${
                                  sub.finalScore >= 8.5
                                    ? "text-emerald-700"
                                    : sub.finalScore >= 6.5
                                    ? "text-[#0284C7]"
                                    : "text-red-600"
                                }`}
                              >
                                {sub.finalScore.toFixed(1)}
                              </span>
                              <span className="block text-[11px] font-sans text-slate-500">
                                {sub.approvalStatus === "approved"
                                  ? "● Đã duyệt"
                                  : sub.approvalStatus === "adjusted"
                                  ? "● Đã châm chước"
                                  : "○ Chờ duyệt"}
                              </span>
                            </td>

                            {/* Col 6: 1-Click Teacher Actions */}
                            <td className="py-3.5 px-4 align-top text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {sub.approvalStatus === "pending" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSubmission(sub.id, {
                                        approvalStatus: "approved",
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Duyệt
                                  </button>
                                )}

                                {sub.finalScore < 10 && (
                                  <button
                                    type="button"
                                    title="Châm chước cộng +0.5đ khích lệ học sinh tiểu học"
                                    onClick={() =>
                                      handleUpdateSubmission(sub.id, {
                                        finalScore: Math.min(10, sub.finalScore + 0.5),
                                        approvalStatus: "adjusted",
                                      })
                                    }
                                    className="inline-flex items-center gap-0.5 px-2 py-1.5 text-xs font-mono font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3 text-emerald-600" />
                                    0.5đ
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setInspectedSubmission(sub)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0284C7] bg-sky-50 hover:bg-sky-100 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  {sub.fileType === "sb3" ? "Chạy thử 2D" : "Chi tiết"}
                                </button>

                                <button
                                  type="button"
                                  title={`Xuất tệp Word (.docx) bài làm của ${sub.studentName} gửi phụ huynh`}
                                  onClick={async () => {
                                    await exportParentReportToDocx(
                                      [sub],
                                      assignments,
                                      `Học sinh ${sub.studentName} (${sub.className})`
                                    );
                                    setParentExportNotice(
                                      `Đã xuất tệp Word (.docx) bài làm của ${sub.studentName} (${sub.className})!`
                                    );
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-[#0284C7] bg-white hover:bg-sky-50 border border-sky-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  Word
                                </button>

                                <button
                                  type="button"
                                  title={`Xuất tệp PDF (.pdf) bài làm của ${sub.studentName} gửi phụ huynh`}
                                  onClick={async () => {
                                    await exportParentReportToPdf(
                                      [sub],
                                      assignments,
                                      `Học sinh ${sub.studentName} (${sub.className})`
                                    );
                                    setParentExportNotice(
                                      `Đã xuất tệp PDF (.pdf) bài làm của ${sub.studentName} (${sub.className})!`
                                    );
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                                >
                                  <FileText className="w-3 h-3" />
                                  PDF
                                </button>

                                {confirmingSingleDeleteId === sub.id ? (
                                  <div className="inline-flex items-center gap-1 bg-red-50 border border-red-200 px-1.5 py-1 rounded-md">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSingleSubmission(sub.id)}
                                      className="px-2 py-0.5 text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                                    >
                                      Xóa
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmingSingleDeleteId(null)}
                                      className="px-1.5 py-0.5 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer"
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    title="Xóa bài nộp này"
                                    onClick={() => setConfirmingSingleDeleteId(sub.id)}
                                    className="inline-flex items-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "classes" && (
          <ClassManagerView
            classes={classesList}
            onUpdateClasses={handleUpdateClassesAndSync}
            onNavigateToStudentPortal={handleSwitchToStudentPortal}
          />
        )}

        {activeTab === "builder" && (
          <AiExamBuilderView
            assignments={assignments}
            classes={classesList}
            onAddAssignment={handleAddAssignment}
            onDeleteAssignment={handleDeleteAssignment}
          />
        )}

        {activeTab === "analytics" && (
          <ClassAnalyticsView
            submissions={submissions}
            classes={classesList}
            assignments={assignments}
            onExportCsv={handleExportCsv}
            onSelectSubmission={(sub) => setInspectedSubmission(sub)}
          />
        )}

        {activeTab === "tt27_comments" && (
          <Circular27AssessmentView
            classes={classesList}
            assignments={assignments}
            submissions={submissions}
          />
        )}

        {activeTab === "student_portal" && (
          <StudentPortalView
            assignments={assignments}
            classes={classesList}
            submissions={submissions}
            onNewSubmission={handleNewStudentSubmission}
            onInspectSubmissionReadOnly={(sub) => setInspectedSubmission(sub)}
          />
        )}
      </main>

      {/* Deep-Dive DOM / Slide XML / Scratch 2D Simulator Modal — readOnly in Student Mode */}
      <SubmissionInspectorModal
        submission={inspectedSubmission}
        assignments={assignments}
        onClose={() => setInspectedSubmission(null)}
        onUpdateSubmission={handleUpdateSubmission}
        readOnly={activeTab === "student_portal"}
      />

      {/* Trung tâm Tự động Lưu trữ, Lịch sử Thao tác & Đồng bộ 2 chiều */}
      {showHistorySyncModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Lịch sử Thao tác &amp; Tự động Lưu trữ Đồng bộ 2 Chiều
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Mọi thao tác tạo/chỉnh sửa đề, quản lý lớp, nộp bài và nhận xét Thông tư 27 đều được tự động lưu trữ &amp; giữ nguyên lịch sử khi chỉnh sửa hoặc đồng bộ.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistorySyncModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Thống kê trạng thái lưu trữ hiện tại */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5">
                  <div className="text-[11px] font-semibold text-sky-800 uppercase">
                    Lớp &amp; Học sinh
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {classesList.length} lớp ·{" "}
                    {classesList.reduce((sum, c) => sum + (c.students?.length || 0), 0)} HS
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Đã lưu cố định</div>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
                  <div className="text-[11px] font-semibold text-emerald-800 uppercase">
                    Ngân hàng Đề
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {assignments.length} đề kiểm tra
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Giữ nguyên khi sửa/đồng bộ
                  </div>
                </div>
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
                  <div className="text-[11px] font-semibold text-amber-800 uppercase">
                    Bài nộp Học sinh
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {submissions.length} bài nộp
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Tự động hợp nhất 2 chiều
                  </div>
                </div>
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5">
                  <div className="text-[11px] font-semibold text-slate-700 uppercase">
                    Cập nhật gần nhất
                  </div>
                  <div className="text-xs font-bold font-mono text-slate-900 mt-1.5">
                    {lastSyncTime}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    ● Tự động lưu kích hoạt
                  </div>
                </div>
              </div>

              {/* Thẻ Đồng bộ Đám mây Google Drive (0đ Phí) */}
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-[#0284C7] shadow-xs shrink-0">
                    <FolderSync className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Đồng bộ Đám mây Google Drive (Thư mục chia sẻ)
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 rounded-full border border-emerald-300">
                        0đ Phí · Miễn phí 100%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Tự động lưu lớp học, ngân hàng đề, bài nộp học sinh và nhận xét TT27 vào thư mục ID: <code className="font-mono text-slate-800 font-semibold bg-white/70 px-1 py-0.5 rounded">15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14</code>.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGoogleDriveModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  <FolderSync className="w-3.5 h-3.5" />
                  <span>Quản lý Đồng bộ Google Drive</span>
                </button>
              </div>

              {/* Thanh công cụ Đồng bộ & Sao lưu */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900">
                    Công cụ Đồng bộ 2 chiều &amp; Sao lưu Lịch sử Thao tác
                  </div>
                  <div className="text-xs text-slate-600">
                    Hợp nhất dữ liệu giữa trình duyệt và máy chủ mà không làm mất bất kỳ đề thi, bài nộp hay chỉnh sửa nào trước đó.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isManualSyncing}
                    onClick={handleManualTwoWaySync}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? "animate-spin" : ""}`} />
                    {isManualSyncing ? "Đang đồng bộ..." : "Đồng bộ 2 chiều ngay"}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportFullBackupJson}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0284C7]" />
                    Xuất tệp Đồng bộ (.json)
                  </button>
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Nhập / Đồng bộ tệp (.json)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFullBackupJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {syncModalNotice && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncModalNotice}</span>
                </div>
              )}

              {/* Danh sách Nhật ký lịch sử thao tác */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Nhật ký Lịch sử Thao tác đã lưu ({operationHistory.length} thao tác)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Tự động ghi nhận theo thời gian thực
                  </span>
                </div>

                {operationHistory.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-2">
                    <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                    <div className="text-xs font-semibold text-slate-700">
                      Chưa có thao tác mới nào được ghi nhận trong phiên này
                    </div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Khi Thầy tạo đề, chỉnh sửa ma trận, cập nhật danh sách lớp, duyệt điểm hoặc khi học sinh nộp bài, toàn bộ lịch sử thao tác sẽ tự động hiển thị tại đây.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 max-h-80 overflow-y-auto bg-white">
                    {operationHistory.map((item) => {
                      const badgeMap: Record<
                        OperationLogEntry["category"],
                        { label: string; cls: string }
                      > = {
                        exam: {
                          label: "Đề kiểm tra",
                          cls: "bg-sky-50 text-sky-800 border-sky-200",
                        },
                        class: {
                          label: "Lớp & Học sinh",
                          cls: "bg-indigo-50 text-indigo-800 border-indigo-200",
                        },
                        submission: {
                          label: "Bài nộp HS",
                          cls: "bg-amber-50 text-amber-800 border-amber-200",
                        },
                        grading: {
                          label: "Chấm & Duyệt",
                          cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
                        },
                        tt27: {
                          label: "Thông tư 27",
                          cls: "bg-purple-50 text-purple-800 border-purple-200",
                        },
                        draft: {
                          label: "Lưu nháp",
                          cls: "bg-slate-100 text-slate-700 border-slate-200",
                        },
                        sync: {
                          label: "Đồng bộ",
                          cls: "bg-teal-50 text-teal-800 border-teal-200",
                        },
                      };
                      const badge = badgeMap[item.category] || badgeMap.sync;
                      return (
                        <div
                          key={item.id}
                          className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded border ${badge.cls}`}
                              >
                                {badge.label}
                              </span>
                              <span className="text-xs font-semibold text-slate-900">
                                {item.actionLabel}
                              </span>
                            </div>
                            {item.stats && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                Trạng thái lưu: {item.stats.classesCount ?? classesList.length} lớp ·{" "}
                                {item.stats.assignmentsCount ?? assignments.length} đề ·{" "}
                                {item.stats.submissionsCount ?? submissions.length} bài nộp
                              </div>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 shrink-0">
                            {item.timestamp}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                Dữ liệu được lưu song song trên Trình duyệt, tệp trạng thái Server và mã nguồn hệ thống.
              </span>
              <button
                type="button"
                onClick={() => setShowHistorySyncModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quản lý Đồng bộ Google Drive (0đ Phí) */}
      <GoogleDriveSyncModal
        isOpen={showGoogleDriveModal}
        onClose={() => setShowGoogleDriveModal(false)}
        onRestoreState={handleRestoreFromGoogleDrive}
        currentStateStats={{
          classesCount: classesList.length,
          studentsCount: classesList.reduce(
            (sum, c) => sum + (c.students?.length || 0),
            0
          ),
          assignmentsCount: assignments.length,
          submissionsCount: submissions.length,
          regularRecordsCount: Object.keys(initialCached?.tt27RegularRecords || {}).length,
          periodicRecordsCount: Object.keys(initialCached?.tt27PeriodicRecords || {}).length,
        }}
      />

      {/* System Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-900">
              EduAI Primary — Hệ thống Quản lý &amp; Chấm bài Tin học Thông minh dành cho Tiểu học (Lớp 3, 4, 5)
            </div>
            <div className="text-xs font-medium text-slate-700">
              Được tạo bởi ý tưởng phần mềm của{" "}
              <strong className="text-[#0284C7]">Thầy Nguyễn Văn Phúc</strong> -{" "}
              <strong className="text-slate-900">
                Trường TH-THCS Vĩnh Phú, Phường Lái Thiêu, Thành phố Hồ Chí Minh
              </strong>
              . <strong className="text-emerald-700">Năm học 2026-2027</strong>
            </div>
          </div>
          <div className="text-xs text-slate-500 shrink-0">
            Hỗ trợ chấm tự động Word (.docx), PowerPoint (.pptx), Scratch (.sb3) &amp; Đánh giá Thông tư 27
          </div>
        </div>
      </footer>
    </div>
  );
}
