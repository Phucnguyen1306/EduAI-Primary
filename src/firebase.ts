import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import firebaseConfig from "../firebase-applet-config.json";

// Khởi tạo ứng dụng Firebase với cấu hình tự động được cấp quyền từ AI Studio
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Khởi tạo Firestore với Database ID được chỉ định chính xác
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const VAPID_KEY =
  "BELAxAzXVvfiNrwJFsLQfwzlRPnqXejthqKevxeE4YBhIST85NAIo014pLAe1OO8qNocpQ9dPK28W99Jq16Rey0";

/**
 * Lấy token thiết bị của người dùng để gửi thông báo qua Firebase Cloud Messaging
 */
export async function requestNotificationToken(): Promise<string | null> {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return null;
    }
    const supported = await isSupported().catch(() => false);
    if (!supported) {
      console.log("Firebase Messaging: Trình duyệt không hỗ trợ Web Push Notification.");
      return null;
    }
    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (currentToken) {
      console.log("Token thiết bị:", currentToken);
      return currentToken;
    } else {
      console.log("Không tìm thấy token đăng ký.");
      return null;
    }
  } catch (err) {
    console.warn("Đã xảy ra lỗi khi lấy token Firebase Messaging: ", err);
    return null;
  }
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Kiểm tra kết nối Firestore khi ứng dụng khởi động
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore: Máy khách đang ngoại tuyến, dữ liệu sẽ được lưu cache cục bộ.");
      return false;
    }
    // Nếu tài liệu không tồn tại thì kết nối vẫn thành công
    return true;
  }
}

// Kích hoạt kiểm tra kết nối nền
testConnection().catch(() => {});
