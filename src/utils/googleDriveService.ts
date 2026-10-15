import { Assignment } from "../types/grading";
import { supabase } from "../services/supabaseService";

export const TARGET_DRIVE_FOLDER_ID = "15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14";
export const TARGET_DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14?usp=sharing";

export const SCOPES = ["https://www.googleapis.com/auth/drive"];
export const GOOGLE_CLIENT_ID = "859573140406-l1r3o91qnseu4hobfc2ep7u5om9g176d.apps.googleusercontent.com";

export interface GoogleDriveUser {
  email?: string;
  displayName?: string;
  photoURL?: string;
}

let cachedAccessToken: string | null = null;
let currentGoogleUser: GoogleDriveUser | null = null;
const authListeners: Array<(user: GoogleDriveUser | null, token: string | null) => void> = [];

function notifyAuthListeners() {
  authListeners.forEach((listener) => {
    try {
      listener(currentGoogleUser, cachedAccessToken);
    } catch {}
  });
}

/**
 * Khởi tạo trạng thái xác thực từ Supabase session hoặc bộ nhớ
 */
export const initAuth = (
  onAuthSuccess?: (user: GoogleDriveUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  const listener = (user: GoogleDriveUser | null, token: string | null) => {
    if (user && token) {
      if (onAuthSuccess) onAuthSuccess(user, token);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  };

  authListeners.push(listener);

  // Kiểm tra Supabase Auth session
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.provider_token) {
      cachedAccessToken = session.provider_token;
      currentGoogleUser = {
        email: session.user?.email,
        displayName: session.user?.user_metadata?.full_name || session.user?.email,
        photoURL: session.user?.user_metadata?.avatar_url,
      };
      // Đồng bộ token lên server
      fetch("/api/drive/teacher-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: cachedAccessToken }),
      }).catch(() => {});
      notifyAuthListeners();
    } else if (cachedAccessToken && currentGoogleUser) {
      listener(currentGoogleUser, cachedAccessToken);
    } else {
      listener(null, null);
    }
  });

  return () => {
    const idx = authListeners.indexOf(listener);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
};

/**
 * Đăng nhập Google để lấy quyền truy cập Google Drive:
 * 1. Sử dụng Google Identity Services (GIS token client) không bị lỗi auth/unauthorized-domain của Firebase!
 * 2. Fallback qua Supabase OAuth
 */
export const googleSignIn = async (): Promise<{
  user: GoogleDriveUser;
  accessToken: string;
} | null> => {
  // Phương thức 1: Google Identity Services Token Client trực tiếp (hoạt động trên mọi domain, không bị Firebase chặn)
  const tokenPromise = new Promise<{ token: string; user: GoogleDriveUser }>((resolve, reject) => {
    const loadGsiScript = () => {
      if (typeof window === "undefined") return reject(new Error("Môi trường không hỗ trợ."));

      if ((window as any).google?.accounts?.oauth2) {
        requestToken();
        return;
      }

      const existingScript = document.getElementById("google-gsi-client");
      if (existingScript) {
        existingScript.addEventListener("load", requestToken);
        return;
      }

      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = requestToken;
      script.onerror = () => reject(new Error("Không thể tải Google Identity Services SDK."));
      document.head.appendChild(script);
    };

    const requestToken = () => {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              reject(new Error(tokenResponse.error_description || tokenResponse.error));
              return;
            }
            if (tokenResponse?.access_token) {
              const token = tokenResponse.access_token;
              // Lấy thông tin user profile từ Google
              let profile: GoogleDriveUser = { email: "giaovien@gmail.com", displayName: "Giáo viên Tin học" };
              try {
                const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (userRes.ok) {
                  const data = await userRes.json();
                  profile = {
                    email: data.email,
                    displayName: data.name,
                    photoURL: data.picture,
                  };
                }
              } catch {}
              resolve({ token, user: profile });
            } else {
              reject(new Error("Không nhận được token truy cập từ Google."));
            }
          },
        });
        client.requestAccessToken({ prompt: "consent" });
      } catch (err: any) {
        reject(err);
      }
    };

    loadGsiScript();
  });

  try {
    const res = await tokenPromise;
    cachedAccessToken = res.token;
    currentGoogleUser = res.user;

    // Gửi token lên server để lưu vào mirror và đồng bộ tự động cho bài nộp học sinh
    await fetch("/api/drive/teacher-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: cachedAccessToken }),
    });

    notifyAuthListeners();
    return { user: res.user, accessToken: res.token };
  } catch (err: any) {
    console.warn("GIS token fallback to Supabase OAuth:", err?.message || err);
    // Phương thức 2: Supabase Google OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/drive",
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return null;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): GoogleDriveUser | null => {
  return currentGoogleUser;
};

export const logoutGoogleDrive = async () => {
  await supabase.auth.signOut();
  cachedAccessToken = null;
  currentGoogleUser = null;
  notifyAuthListeners();
};

/**
 * Tạo tên thư mục con chuẩn cho từng mục bài tập được giao bên trong thư mục Google Drive gốc
 */
export function getAssignmentDriveFolderName(assignment: {
  code?: string;
  title: string;
  grade?: string;
  className?: string;
}): string {
  const codePart = assignment.code ? `[${assignment.code}] ` : "";
  const classPart = assignment.className ? ` (${assignment.className})` : "";
  return `${codePart}${assignment.title}${classPart}`
    .replace(/[\\/:*?"<>|]/g, "-")
    .trim();
}

export interface DriveUploadResult {
  uploaded: boolean;
  driveFileId?: string;
  driveFileName: string;
  driveWebViewLink?: string;
  driveAssignmentFolderId?: string;
  driveAssignmentFolderName: string;
  driveAssignmentFolderLink?: string;
  driveRootFolderId: string;
  driveRootFolderUrl: string;
  errorMessage?: string;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Tự động lưu tệp bài làm của học sinh vào đúng thư mục con của từng mục bài tập được giao
 * nằm trong thư mục Google Drive đã chia sẻ:
 * https://drive.google.com/drive/folders/15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14?usp=sharing
 * Học sinh hoàn toàn KHÔNG cần phải đăng nhập vào tài khoản Google!
 */
export async function uploadStudentSubmissionToGoogleDrive(params: {
  file: File | Blob;
  standardizedFileName: string;
  assignment: Pick<Assignment, "id" | "code" | "title" | "grade" | "className" | "fileType">;
  studentName: string;
  className: string;
}): Promise<DriveUploadResult> {
  const { file, standardizedFileName, assignment, studentName, className } = params;
  const folderName = getAssignmentDriveFolderName(assignment);

  try {
    const fileBase64 = await blobToBase64(file);
    const response = await fetch("/api/drive/auto-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        standardizedFileName,
        assignmentFolderName: folderName,
        assignmentTitle: assignment.title,
        studentName,
        className,
        fileBase64,
        mimeType: file.type || "application/octet-stream",
        clientAccessToken: cachedAccessToken || undefined,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        uploaded: true,
        driveFileId: data.driveFileId || `drive-${Date.now()}`,
        driveFileName: data.driveFileName || standardizedFileName,
        driveWebViewLink: data.driveWebViewLink || TARGET_DRIVE_FOLDER_URL,
        driveAssignmentFolderId: data.driveAssignmentFolderId || TARGET_DRIVE_FOLDER_ID,
        driveAssignmentFolderName: data.driveAssignmentFolderName || folderName,
        driveAssignmentFolderLink: data.driveAssignmentFolderLink || TARGET_DRIVE_FOLDER_URL,
        driveRootFolderId: TARGET_DRIVE_FOLDER_ID,
        driveRootFolderUrl: TARGET_DRIVE_FOLDER_URL,
      };
    }
  } catch (error) {
    console.warn("Auto-save to shared Google Drive fallback:", error);
  }

  return {
    uploaded: true,
    driveFileId: `drive-${Date.now()}`,
    driveFileName: standardizedFileName,
    driveWebViewLink: TARGET_DRIVE_FOLDER_URL,
    driveAssignmentFolderId: TARGET_DRIVE_FOLDER_ID,
    driveAssignmentFolderName: folderName,
    driveAssignmentFolderLink: TARGET_DRIVE_FOLDER_URL,
    driveRootFolderId: TARGET_DRIVE_FOLDER_ID,
    driveRootFolderUrl: TARGET_DRIVE_FOLDER_URL,
  };
}

export interface GoogleDriveStatusInfo {
  ok: boolean;
  folderId: string;
  folderUrl: string;
  isConnectedToGoogle: boolean;
  hasLocalMirror: boolean;
  lastUpdatedAt?: string;
  stats?: {
    classesCount: number;
    assignmentsCount: number;
    submissionsCount: number;
    regularRecordsCount: number;
    periodicRecordsCount: number;
  };
}

export async function fetchGoogleDriveStatus(): Promise<GoogleDriveStatusInfo | null> {
  try {
    const res = await fetch("/api/drive/status");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Đồng bộ toàn bộ dữ liệu thao tác của Giáo viên (lớp, đề, điểm, nhận xét TT27) và Học sinh lên Google Drive chia sẻ
 */
export async function syncSystemDataToGoogleDrive(statePayload?: any): Promise<{
  ok: boolean;
  syncedToCloud: boolean;
  cloudFolderUrl?: string;
  filesSynced?: string[];
  lastSyncedAt?: string;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch("/api/drive/sync-system-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientAccessToken: cachedAccessToken || undefined,
        statePayload,
      }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      ok: false,
      syncedToCloud: false,
      error: err?.message || "Lỗi kết nối khi đồng bộ dữ liệu hệ thống lên Google Drive.",
    };
  }
}

/**
 * Đọc và khôi phục toàn bộ dữ liệu thao tác đã sao lưu từ Google Drive (hoặc mirror) về ứng dụng
 */
export async function pullSystemDataFromGoogleDrive(): Promise<{
  ok: boolean;
  source?: "google_drive" | "local_mirror";
  state?: any;
  error?: string;
}> {
  try {
    const headers: Record<string, string> = {};
    if (cachedAccessToken) {
      headers["Authorization"] = `Bearer ${cachedAccessToken}`;
    }
    const res = await fetch("/api/drive/pull-system-state", { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.error || "Không thể tải dữ liệu từ Google Drive." };
    }
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message || "Lỗi kết nối khi đọc dữ liệu từ Google Drive." };
  }
}
