/**
 * Hệ thống đồng bộ Realtime đa tab & đa thiết bị qua BroadcastChannel và LocalStorage
 * Giúp giáo viên và học sinh lập tức nhận được bài nộp, đề thi mới ngay tức thì
 */

export type SyncEventType =
  | "NEW_SUBMISSION"
  | "UPDATE_SUBMISSION"
  | "DELETE_SUBMISSION"
  | "ADD_ASSIGNMENT"
  | "DELETE_ASSIGNMENT"
  | "UPDATE_CLASSES"
  | "FULL_SYNC_REQUEST"
  | "FULL_SYNC_RESPONSE";

export interface SyncMessage<T = any> {
  type: SyncEventType;
  payload: T;
  timestamp: number;
  senderId: string;
}

const CHANNEL_NAME = "edu_ai_primary_realtime_channel";
const CLIENT_ID = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (err) {
    console.warn("BroadcastChannel không khả dụng:", err);
  }
}

export function sendSyncBroadcast<T>(type: SyncEventType, payload: T): void {
  const message: SyncMessage<T> = {
    type,
    payload,
    timestamp: Date.now(),
    senderId: CLIENT_ID,
  };

  // 1. Gửi qua BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message);
    } catch (err) {
      console.warn("Lỗi gửi BroadcastChannel:", err);
    }
  }

  // 2. Ghi vào LocalStorage để kích hoạt StorageEvent trên các tab khác (kể cả iframe)
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(
        "edu_ai_sync_pulse",
        JSON.stringify({
          t: message.type,
          ts: message.timestamp,
          sid: message.senderId,
        })
      );
    } catch {}
  }
}

export function subscribeSyncBroadcast(
  handler: (msg: SyncMessage) => void
): () => void {
  const onBroadcastMessage = (event: MessageEvent) => {
    if (event.data && typeof event.data === "object" && event.data.type) {
      if (event.data.senderId !== CLIENT_ID) {
        handler(event.data as SyncMessage);
      }
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener("message", onBroadcastMessage);
  }

  // Lắng nghe storage event cho các trình duyệt hoặc ngữ cảnh cũ
  const onStorageChange = (e: StorageEvent) => {
    if (e.key === "edu_ai_sync_pulse" && e.newValue) {
      try {
        const pulse = JSON.parse(e.newValue);
        if (pulse.sid !== CLIENT_ID) {
          handler({
            type: pulse.t,
            payload: null,
            timestamp: pulse.ts,
            senderId: pulse.sid,
          });
        }
      } catch {}
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorageChange);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener("message", onBroadcastMessage);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorageChange);
    }
  };
}
