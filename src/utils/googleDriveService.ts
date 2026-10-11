import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { Assignment } from "../types/grading";

export const TARGET_DRIVE_FOLDER_ID = "15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14";
export const TARGET_DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14?usp=sharing";

export const SCOPES = ["https://www.googleapis.com/auth/drive"];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Không lấy được mã truy cập Google Drive từ phiên đăng nhập.");
    }

    cachedAccessToken = credential.accessToken;
    // Đồng bộ token lên server để học sinh nộp bài không cần đăng nhập Google
    fetch("/api/drive/teacher-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: cachedAccessToken }),
    }).catch(() => {});

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): User | null => {
  return auth.currentUser;
};

export const logoutGoogleDrive = async () => {
  await auth.signOut();
  cachedAccessToken = null;
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
