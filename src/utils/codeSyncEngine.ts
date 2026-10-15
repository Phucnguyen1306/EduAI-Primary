import { Assignment, StudentSubmission } from "../types/grading";
import type { ClassRoom } from "../components/ClassManagerView";
import { syncEntireStateToSupabase } from "../services/supabaseService";
import { syncSystemDataToGoogleDrive } from "./googleDriveService";

export interface OperationLogEntry {
  id: string;
  timestamp: string;
  epoch: number;
  actionLabel: string;
  category: "class" | "exam" | "submission" | "grading" | "tt27" | "sync" | "draft";
  details?: string;
  stats?: {
    classesCount?: number;
    studentsCount?: number;
    assignmentsCount?: number;
    submissionsCount?: number;
  };
}

export interface DeletedIdsState {
  assignments: string[];
  submissions: string[];
  classes: string[];
}

export interface SystemCodeStatePayload {
  classes?: ClassRoom[];
  assignments?: Assignment[];
  submissions?: StudentSubmission[];
  tt27RegularRecords?: Record<string, any[]>;
  tt27PeriodicRecords?: Record<string, any[]>;
  operationHistory?: OperationLogEntry[];
  examBuilderDraft?: any;
  deletedIds?: Partial<DeletedIdsState>;
  actionLabel?: string;
  actionCategory?: OperationLogEntry["category"];
  actionDetails?: string;
  replaceAll?: boolean;
}

export interface SystemCodeStateResponse {
  ok: boolean;
  lastUpdatedAt: string;
  lastUpdatedEpoch?: number;
  classes: ClassRoom[];
  assignments: Assignment[];
  submissions: StudentSubmission[];
  tt27RegularRecords: Record<string, any[]>;
  tt27PeriodicRecords: Record<string, any[]>;
  operationHistory?: OperationLogEntry[];
  examBuilderDraft?: any;
  deletedIds?: DeletedIdsState;
}

const LOCAL_STORAGE_STATE_KEY = "eduai_primary_live_code_state_v2";
const LOCAL_STORAGE_DRAFT_KEY = "eduai_exam_builder_draft_v1";

export function mergeArrayById<T extends { id: string }>(
  primary: T[] = [],
  secondary: T[] = [],
  deletedIds: string[] = []
): T[] {
  const deletedSet = new Set(deletedIds || []);
  const map = new Map<string, T>();
  for (const item of secondary || []) {
    if (item && item.id && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  }
  for (const item of primary || []) {
    if (item && item.id && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

export function loadCachedLocalState(): Partial<SystemCodeStateResponse> | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadExamBuilderDraft(): any | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
    if (raw) return JSON.parse(raw);
    const cached = loadCachedLocalState();
    return cached?.examBuilderDraft || null;
  } catch {
    return null;
  }
}

export function saveExamBuilderDraft(draft: any): void {
  try {
    if (draft === null) {
      localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(draft));
    }
  } catch {
    // Ignore storage quota errors
  }
}

function inferCategoryFromLabel(label?: string): OperationLogEntry["category"] {
  if (!label) return "sync";
  const lower = label.toLowerCase();
  if (lower.includes("nháp") || lower.includes("draft")) return "draft";
  if (lower.includes("thông tư 27") || lower.includes("tt27") || lower.includes("nhận xét")) return "tt27";
  if (lower.includes("nộp bài") || lower.includes("học sinh nộp")) return "submission";
  if (lower.includes("chấm") || lower.includes("duyệt kết quả")) return "grading";
  if (lower.includes("đề") || lower.includes("giao bài") || lower.includes("câu hỏi")) return "exam";
  if (lower.includes("lớp") || lower.includes("học sinh") || lower.includes("danh sách")) return "class";
  return "sync";
}

export function saveCachedLocalState(
  partial: SystemCodeStatePayload,
  timestamp?: string
): Partial<SystemCodeStateResponse> {
  const nowStr =
    timestamp ||
    new Date().toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const current = loadCachedLocalState() || {};
  const currentDeleted: DeletedIdsState = {
    assignments: Array.from(
      new Set([
        ...(current.deletedIds?.assignments || []),
        ...(partial.deletedIds?.assignments || []),
      ])
    ),
    submissions: Array.from(
      new Set([
        ...(current.deletedIds?.submissions || []),
        ...(partial.deletedIds?.submissions || []),
      ])
    ),
    classes: Array.from(
      new Set([
        ...(current.deletedIds?.classes || []),
        ...(partial.deletedIds?.classes || []),
      ])
    ),
  };

  const nextClasses =
    partial.classes !== undefined
      ? partial.replaceAll
        ? partial.classes
        : partial.classes.length > 0
        ? partial.classes
        : current.classes || []
      : current.classes;

  const nextAssignments =
    partial.assignments !== undefined
      ? partial.replaceAll
        ? partial.assignments
        : mergeArrayById(
            partial.assignments,
            current.assignments || [],
            currentDeleted.assignments
          )
      : current.assignments;

  const nextSubmissions =
    partial.submissions !== undefined
      ? partial.replaceAll
        ? partial.submissions
        : mergeArrayById(
            partial.submissions,
            current.submissions || [],
            currentDeleted.submissions
          )
      : current.submissions;

  const nextRegular =
    partial.tt27RegularRecords !== undefined
      ? partial.replaceAll
        ? partial.tt27RegularRecords
        : {
            ...(current.tt27RegularRecords || {}),
            ...partial.tt27RegularRecords,
          }
      : current.tt27RegularRecords;

  const nextPeriodic =
    partial.tt27PeriodicRecords !== undefined
      ? partial.replaceAll
        ? partial.tt27PeriodicRecords
        : {
            ...(current.tt27PeriodicRecords || {}),
            ...partial.tt27PeriodicRecords,
          }
      : current.tt27PeriodicRecords;

  let nextHistory = mergeArrayById(
    partial.operationHistory || [],
    current.operationHistory || [],
    []
  );

  if (partial.actionLabel) {
    const totalStudents = (nextClasses || []).reduce(
      (sum, c) => sum + (c.students?.length || 0),
      0
    );
    const newEntry: OperationLogEntry = {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: nowStr,
      epoch: Date.now(),
      actionLabel: partial.actionLabel,
      category: partial.actionCategory || inferCategoryFromLabel(partial.actionLabel),
      details: partial.actionDetails,
      stats: {
        classesCount: (nextClasses || []).length,
        studentsCount: totalStudents,
        assignmentsCount: (nextAssignments || []).length,
        submissionsCount: (nextSubmissions || []).length,
      },
    };
    nextHistory = [newEntry, ...nextHistory].slice(0, 200);
  }

  const nextDraft =
    partial.examBuilderDraft !== undefined
      ? partial.examBuilderDraft
      : current.examBuilderDraft !== undefined
      ? current.examBuilderDraft
      : loadExamBuilderDraft();

  if (partial.examBuilderDraft !== undefined) {
    saveExamBuilderDraft(partial.examBuilderDraft);
  }

  const merged: Partial<SystemCodeStateResponse> = {
    ...current,
    ...(nextClasses !== undefined ? { classes: nextClasses } : {}),
    ...(nextAssignments !== undefined ? { assignments: nextAssignments } : {}),
    ...(nextSubmissions !== undefined ? { submissions: nextSubmissions } : {}),
    ...(nextRegular !== undefined ? { tt27RegularRecords: nextRegular } : {}),
    ...(nextPeriodic !== undefined ? { tt27PeriodicRecords: nextPeriodic } : {}),
    operationHistory: nextHistory,
    examBuilderDraft: nextDraft,
    deletedIds: currentDeleted,
    lastUpdatedAt: nowStr,
    lastUpdatedEpoch: Date.now(),
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage quota errors
  }

  return merged;
}

/**
 * Lấy trạng thái hệ thống từ Server và hợp nhất 2 chiều thông minh (Smart Two-Way Merge)
 * với dữ liệu đã lưu trong trình duyệt để đảm bảo KHÔNG BAO GIỜ mất dữ liệu lịch sử thao tác
 * khi khởi động lại server, chuyển trang hay đồng bộ lại.
 */
export async function fetchSystemStateFromCode(): Promise<SystemCodeStateResponse | null> {
  const local = loadCachedLocalState();
  try {
    const res = await fetch("/api/system/code-state");
    if (!res.ok) {
      if (local) {
        return {
          ok: true,
          lastUpdatedAt: local.lastUpdatedAt || new Date().toLocaleString("vi-VN"),
          classes: local.classes || [],
          assignments: local.assignments || [],
          submissions: local.submissions || [],
          tt27RegularRecords: local.tt27RegularRecords || {},
          tt27PeriodicRecords: local.tt27PeriodicRecords || {},
          operationHistory: local.operationHistory || [],
          examBuilderDraft: local.examBuilderDraft || loadExamBuilderDraft(),
          deletedIds: local.deletedIds || { assignments: [], submissions: [], classes: [] },
        };
      }
      return null;
    }

    const serverData = (await res.json()) as SystemCodeStateResponse;
    if (!serverData || !serverData.ok) return null;

    const mergedDeleted: DeletedIdsState = {
      assignments: Array.from(
        new Set([
          ...(serverData.deletedIds?.assignments || []),
          ...(local?.deletedIds?.assignments || []),
        ])
      ),
      submissions: Array.from(
        new Set([
          ...(serverData.deletedIds?.submissions || []),
          ...(local?.deletedIds?.submissions || []),
        ])
      ),
      classes: Array.from(
        new Set([
          ...(serverData.deletedIds?.classes || []),
          ...(local?.deletedIds?.classes || []),
        ])
      ),
    };

    const localEpoch = local?.lastUpdatedEpoch || 0;
    const serverEpoch = serverData.lastUpdatedEpoch || 0;
    const preferLocal = localEpoch >= serverEpoch;

    const mergedClasses =
      preferLocal && local?.classes && local.classes.length > 0
        ? mergeArrayById(local.classes, serverData.classes || [], mergedDeleted.classes)
        : mergeArrayById(serverData.classes || [], local?.classes || [], mergedDeleted.classes);

    const mergedAssignments = preferLocal
      ? mergeArrayById(
          local?.assignments || [],
          serverData.assignments || [],
          mergedDeleted.assignments
        )
      : mergeArrayById(
          serverData.assignments || [],
          local?.assignments || [],
          mergedDeleted.assignments
        );

    const mergedSubmissions = preferLocal
      ? mergeArrayById(
          local?.submissions || [],
          serverData.submissions || [],
          mergedDeleted.submissions
        )
      : mergeArrayById(
          serverData.submissions || [],
          local?.submissions || [],
          mergedDeleted.submissions
        );

    const mergedRegular = preferLocal
      ? {
          ...(serverData.tt27RegularRecords || {}),
          ...(local?.tt27RegularRecords || {}),
        }
      : {
          ...(local?.tt27RegularRecords || {}),
          ...(serverData.tt27RegularRecords || {}),
        };

    const mergedPeriodic = preferLocal
      ? {
          ...(serverData.tt27PeriodicRecords || {}),
          ...(local?.tt27PeriodicRecords || {}),
        }
      : {
          ...(local?.tt27PeriodicRecords || {}),
          ...(serverData.tt27PeriodicRecords || {}),
        };

    const mergedHistory = mergeArrayById(
      local?.operationHistory || [],
      serverData.operationHistory || [],
      []
    )
      .sort((a, b) => (b.epoch || 0) - (a.epoch || 0))
      .slice(0, 200);

    const mergedDraft =
      loadExamBuilderDraft() || local?.examBuilderDraft || serverData.examBuilderDraft || null;

    const mergedTimestamp =
      preferLocal && local?.lastUpdatedAt ? local.lastUpdatedAt : serverData.lastUpdatedAt;

    const finalState: SystemCodeStateResponse = {
      ok: true,
      lastUpdatedAt: mergedTimestamp,
      lastUpdatedEpoch: Math.max(localEpoch, serverEpoch, Date.now()),
      classes: mergedClasses,
      assignments: mergedAssignments,
      submissions: mergedSubmissions,
      tt27RegularRecords: mergedRegular,
      tt27PeriodicRecords: mergedPeriodic,
      operationHistory: mergedHistory,
      examBuilderDraft: mergedDraft,
      deletedIds: mergedDeleted,
    };

    saveCachedLocalState(
      {
        classes: finalState.classes,
        assignments: finalState.assignments,
        submissions: finalState.submissions,
        tt27RegularRecords: finalState.tt27RegularRecords,
        tt27PeriodicRecords: finalState.tt27PeriodicRecords,
        operationHistory: finalState.operationHistory,
        examBuilderDraft: finalState.examBuilderDraft,
        deletedIds: finalState.deletedIds,
      },
      finalState.lastUpdatedAt
    );

    // Nếu trình duyệt có dữ liệu mới hơn hoặc nhiều đề/bài nộp hơn trên server, tự động đồng bộ ngược lên Server
    const serverNeedsCatchup =
      mergedAssignments.length > (serverData.assignments?.length || 0) ||
      mergedSubmissions.length > (serverData.submissions?.length || 0) ||
      Object.keys(mergedRegular).length > Object.keys(serverData.tt27RegularRecords || {}).length ||
      Object.keys(mergedPeriodic).length > Object.keys(serverData.tt27PeriodicRecords || {}).length ||
      mergedHistory.length > (serverData.operationHistory?.length || 0);

    if (serverNeedsCatchup) {
      fetch("/api/system/sync-to-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classes: finalState.classes,
          assignments: finalState.assignments,
          submissions: finalState.submissions,
          tt27RegularRecords: finalState.tt27RegularRecords,
          tt27PeriodicRecords: finalState.tt27PeriodicRecords,
          operationHistory: finalState.operationHistory,
          examBuilderDraft: finalState.examBuilderDraft,
          deletedIds: finalState.deletedIds,
        }),
      }).catch(() => {});
    }

    return finalState;
  } catch {
    if (local) {
      return {
        ok: true,
        lastUpdatedAt: local.lastUpdatedAt || new Date().toLocaleString("vi-VN"),
        classes: local.classes || [],
        assignments: local.assignments || [],
        submissions: local.submissions || [],
        tt27RegularRecords: local.tt27RegularRecords || {},
        tt27PeriodicRecords: local.tt27PeriodicRecords || {},
        operationHistory: local.operationHistory || [],
        examBuilderDraft: local.examBuilderDraft || loadExamBuilderDraft(),
        deletedIds: local.deletedIds || { assignments: [], submissions: [], classes: [] },
      };
    }
    return null;
  }
}

/**
 * Tự động ghi trực tiếp mọi thay đổi khi người dùng thao tác (Lớp & Học sinh, Đề kiểm tra, Bài nộp, Nhận xét TT27, Bản nháp)
 * vào cả bộ nhớ trình duyệt và thẳng file mã nguồn `src/data/initialData.ts` + `.eduai-persistent-state.json`.
 */
export async function syncStateToCodebase(
  payload: SystemCodeStatePayload
): Promise<{
  ok: boolean;
  lastUpdatedAt: string;
  operationHistory?: OperationLogEntry[];
}> {
  const nowStr = new Date().toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const mergedLocal = saveCachedLocalState(payload, nowStr);

  // Đồng bộ thời gian thực lên Supabase Realtime (Không giới hạn lượt, miễn phí 100%)
  syncEntireStateToSupabase({
    ...payload,
    classes: mergedLocal.classes,
    assignments: mergedLocal.assignments,
    submissions: mergedLocal.submissions,
    tt27RegularRecords: mergedLocal.tt27RegularRecords,
    tt27PeriodicRecords: mergedLocal.tt27PeriodicRecords,
    operationHistory: mergedLocal.operationHistory,
    examBuilderDraft: mergedLocal.examBuilderDraft,
    deletedIds: mergedLocal.deletedIds,
  }).catch((err) => {
    console.warn("Lỗi đồng bộ Supabase:", err);
  });

  // Tự động sao lưu và đồng bộ toàn bộ dữ liệu thao tác của Giáo viên & Học sinh lên Google Drive chia sẻ (0đ phí)
  syncSystemDataToGoogleDrive({
    ...payload,
    classes: mergedLocal.classes,
    assignments: mergedLocal.assignments,
    submissions: mergedLocal.submissions,
    tt27RegularRecords: mergedLocal.tt27RegularRecords,
    tt27PeriodicRecords: mergedLocal.tt27PeriodicRecords,
    operationHistory: mergedLocal.operationHistory,
    examBuilderDraft: mergedLocal.examBuilderDraft,
    deletedIds: mergedLocal.deletedIds,
  }).catch((err) => {
    console.warn("Lỗi đồng bộ Google Drive:", err);
  });

  try {
    const res = await fetch("/api/system/sync-to-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        classes: mergedLocal.classes,
        assignments: mergedLocal.assignments,
        submissions: mergedLocal.submissions,
        tt27RegularRecords: mergedLocal.tt27RegularRecords,
        tt27PeriodicRecords: mergedLocal.tt27PeriodicRecords,
        operationHistory: mergedLocal.operationHistory,
        examBuilderDraft: mergedLocal.examBuilderDraft,
        deletedIds: mergedLocal.deletedIds,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        lastUpdatedAt: data.lastUpdatedAt || nowStr,
        operationHistory: mergedLocal.operationHistory,
      };
    }
  } catch (err) {
    console.error("Sync to codebase warning:", err);
  }

  return {
    ok: false,
    lastUpdatedAt: nowStr,
    operationHistory: mergedLocal.operationHistory,
  };
}

/**
 * Đọc tệp PDF danh sách lớp & học sinh (ví dụ: DS Up.pdf) bằng AI trên Server
 * để tự động bóc tách toàn bộ các lớp và học sinh rồi cập nhật thẳng vào code.
 */
export async function parseStudentRosterPdfViaServer(file: File): Promise<{
  students: {
    studentId: string;
    studentName: string;
    birthDate: string;
    className: string;
  }[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const base64Data = btoa(binary);

  const response = await fetch("/api/ai/parse-student-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || "application/pdf",
      base64Data,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Không thể phân tích tệp PDF danh sách học sinh.");
  }

  return response.json();
}

