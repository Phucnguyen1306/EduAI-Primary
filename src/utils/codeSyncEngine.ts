import { Assignment, StudentSubmission } from "../types/grading";
import type { ClassRoom } from "../components/ClassManagerView";

export interface SystemCodeStatePayload {
  classes?: ClassRoom[];
  assignments?: Assignment[];
  submissions?: StudentSubmission[];
  tt27RegularRecords?: Record<string, any[]>;
  tt27PeriodicRecords?: Record<string, any[]>;
  actionLabel?: string;
}

export interface SystemCodeStateResponse {
  ok: boolean;
  lastUpdatedAt: string;
  classes: ClassRoom[];
  assignments: Assignment[];
  submissions: StudentSubmission[];
  tt27RegularRecords: Record<string, any[]>;
  tt27PeriodicRecords: Record<string, any[]>;
}

const LOCAL_STORAGE_STATE_KEY = "eduai_primary_live_code_state_v2";

export function loadCachedLocalState(): Partial<SystemCodeStateResponse> | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCachedLocalState(partial: SystemCodeStatePayload, timestamp?: string): void {
  try {
    const current = loadCachedLocalState() || {};
    const merged = {
      ...current,
      ...(partial.classes !== undefined ? { classes: partial.classes } : {}),
      ...(partial.assignments !== undefined ? { assignments: partial.assignments } : {}),
      ...(partial.submissions !== undefined ? { submissions: partial.submissions } : {}),
      ...(partial.tt27RegularRecords !== undefined
        ? { tt27RegularRecords: partial.tt27RegularRecords }
        : {}),
      ...(partial.tt27PeriodicRecords !== undefined
        ? { tt27PeriodicRecords: partial.tt27PeriodicRecords }
        : {}),
      lastUpdatedAt: timestamp || new Date().toLocaleString("vi-VN"),
    };
    localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Lấy trạng thái hệ thống mới nhất đã được lưu trong code (src/data/initialData.ts) từ server.
 */
export async function fetchSystemStateFromCode(): Promise<SystemCodeStateResponse | null> {
  try {
    const res = await fetch("/api/system/code-state");
    if (!res.ok) return null;
    const data = (await res.json()) as SystemCodeStateResponse;
    if (data && data.ok) {
      saveCachedLocalState(
        {
          classes: data.classes,
          assignments: data.assignments,
          submissions: data.submissions,
          tt27RegularRecords: data.tt27RegularRecords,
          tt27PeriodicRecords: data.tt27PeriodicRecords,
        },
        data.lastUpdatedAt
      );
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Tự động ghi trực tiếp mọi thay đổi khi người dùng thao tác (Lớp & Học sinh, Đề kiểm tra, Bài nộp, Nhận xét TT27)
 * vào thẳng file mã nguồn `src/data/initialData.ts` đến đúng thời điểm đang sử dụng.
 */
export async function syncStateToCodebase(
  payload: SystemCodeStatePayload
): Promise<{ ok: boolean; lastUpdatedAt: string }> {
  const nowStr = new Date().toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  saveCachedLocalState(payload, nowStr);

  try {
    const res = await fetch("/api/system/sync-to-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        lastUpdatedAt: data.lastUpdatedAt || nowStr,
      };
    }
  } catch (err) {
    console.error("Sync to codebase warning:", err);
  }

  return { ok: false, lastUpdatedAt: nowStr };
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
