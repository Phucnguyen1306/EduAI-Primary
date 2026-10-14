import { createClient } from "@supabase/supabase-js";
import { Assignment, StudentSubmission } from "../types/grading";
import { ClassRoom } from "../components/ClassManagerView";
import { SystemCodeStatePayload } from "../utils/codeSyncEngine";
import { sendSyncBroadcast } from "../utils/broadcastSync";

export const SUPABASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" &&
    (process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) ||
  "https://mlhqpppvglhoivzrcyhz.supabase.co";

export const SUPABASE_KEY =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" &&
    (process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) ||
  "sb_publishable_WeqcBfP4EoyxIgTF9OIjSg_5lJ6mf13";

// Khởi tạo Supabase client chính thức
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

const LIVE_CHANNEL_NAME = "eduai_primary_realtime_sync";

// Kênh Realtime siêu tốc chia sẻ giữa Giáo viên và toàn bộ Học sinh
let liveChannel: ReturnType<typeof supabase.channel> | null = null;

function getOrCreateLiveChannel() {
  if (!liveChannel) {
    liveChannel = supabase.channel(LIVE_CHANNEL_NAME);
    liveChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("Supabase Realtime connected: Sẵn sàng đồng bộ trực tiếp không giới hạn!");
      }
    });
  }
  return liveChannel;
}

/**
 * Đăng ký lắng nghe Đề bài & Bài tập thời gian thực từ Supabase Realtime
 * Giúp học sinh nhận bài ngay lập tức mà không bao giờ bị giới hạn số lượt như Firebase!
 */
export function subscribeSupabaseAssignments(
  onUpdate: (assignments: Assignment[]) => void
): () => void {
  const channel = getOrCreateLiveChannel();

  const handleBroadcast = (payload: any) => {
    if (payload?.type === "ASSIGNMENTS_UPDATED" && Array.isArray(payload.data)) {
      onUpdate(payload.data);
    } else if (payload?.type === "ADD_ASSIGNMENT" && payload.assignment) {
      onUpdate([payload.assignment]);
    }
  };

  channel.on("broadcast", { event: "assignments_event" }, (event) => {
    handleBroadcast(event.payload);
  });

  // Tải trạng thái ban đầu từ Supabase Storage / Database nếu có
  fetchInitialSupabaseState().then((state) => {
    if (state?.assignments && state.assignments.length > 0) {
      onUpdate(state.assignments);
    }
  });

  return () => {
    // Keep channel alive for other listeners
  };
}

/**
 * Đăng ký lắng nghe Lớp học & Học sinh thời gian thực từ Supabase Realtime
 */
export function subscribeSupabaseClasses(
  onUpdate: (classes: ClassRoom[]) => void
): () => void {
  const channel = getOrCreateLiveChannel();

  channel.on("broadcast", { event: "classes_event" }, (event) => {
    if (event?.payload?.classes && Array.isArray(event.payload.classes)) {
      onUpdate(event.payload.classes);
    }
  });

  fetchInitialSupabaseState().then((state) => {
    if (state?.classes && state.classes.length > 0) {
      onUpdate(state.classes);
    }
  });

  return () => {};
}

/**
 * Đăng ký lắng nghe Bài nộp học sinh thời gian thực từ Supabase Realtime
 */
export function subscribeSupabaseSubmissions(
  onUpdate: (submissions: StudentSubmission[]) => void
): () => void {
  const channel = getOrCreateLiveChannel();

  channel.on("broadcast", { event: "submissions_event" }, (event) => {
    if (event?.payload?.submissions && Array.isArray(event.payload.submissions)) {
      onUpdate(event.payload.submissions);
    } else if (event?.payload?.newSubmission) {
      onUpdate([event.payload.newSubmission]);
    }
  });

  fetchInitialSupabaseState().then((state) => {
    if (state?.submissions && state.submissions.length > 0) {
      onUpdate(state.submissions);
    }
  });

  return () => {};
}

/**
 * Đăng ký lắng nghe Toàn bộ Trạng thái hệ thống (Lớp, Đề, Điểm, Nhận xét TT27) từ Supabase
 */
export function subscribeSupabaseSystemState(
  onUpdate: (state: Partial<SystemCodeStatePayload>) => void
): () => void {
  const channel = getOrCreateLiveChannel();

  channel.on("broadcast", { event: "system_state_event" }, (event) => {
    if (event?.payload?.state) {
      onUpdate(event.payload.state);
    }
  });

  return () => {};
}

/**
 * Phát bản tin đồng bộ khi Giáo viên giao đề bài mới
 */
export async function broadcastAssignmentToSupabase(assignment: Assignment): Promise<void> {
  try {
    const channel = getOrCreateLiveChannel();
    await channel.send({
      type: "broadcast",
      event: "assignments_event",
      payload: {
        type: "ADD_ASSIGNMENT",
        assignment,
        timestamp: new Date().toISOString(),
      },
    });

    // Thông báo thêm qua kênh cục bộ
    sendSyncBroadcast({ type: "ADD_ASSIGNMENT", payload: assignment });
  } catch (err) {
    console.warn("Supabase broadcast assignment warning:", err);
  }
}

/**
 * Phát bản tin khi Học sinh nộp bài tập hoặc bài kiểm tra
 */
export async function broadcastSubmissionToSupabase(
  submission: StudentSubmission
): Promise<void> {
  try {
    const channel = getOrCreateLiveChannel();
    await channel.send({
      type: "broadcast",
      event: "submissions_event",
      payload: {
        newSubmission: submission,
        timestamp: new Date().toISOString(),
      },
    });

    sendSyncBroadcast({ type: "NEW_SUBMISSION", payload: submission });
  } catch (err) {
    console.warn("Supabase broadcast submission warning:", err);
  }
}

/**
 * Đồng bộ toàn bộ dữ liệu hệ thống (Lớp, Đề, Bài nộp, Nhận xét Thông tư 27) lên Supabase
 */
export async function syncEntireStateToSupabase(
  payload: SystemCodeStatePayload
): Promise<boolean> {
  try {
    const channel = getOrCreateLiveChannel();
    await channel.send({
      type: "broadcast",
      event: "system_state_event",
      payload: {
        state: payload,
        timestamp: new Date().toISOString(),
      },
    });

    // Lưu vào bảng Key-Value trên Supabase nếu bảng tồn tại
    try {
      await supabase
        .from("eduai_system_state")
        .upsert({
          id: "primary",
          payload,
          updated_at: new Date().toISOString(),
        })
        .select();
    } catch {
      // Bỏ qua lỗi nếu bảng chưa tạo trên console
    }

    return true;
  } catch (err) {
    console.warn("Supabase sync warning:", err);
    return false;
  }
}

/**
 * Tải trạng thái ban đầu từ bảng Supabase nếu có
 */
export async function fetchInitialSupabaseState(): Promise<SystemCodeStatePayload | null> {
  try {
    const { data, error } = await supabase
      .from("eduai_system_state")
      .select("payload")
      .eq("id", "primary")
      .single();

    if (!error && data?.payload) {
      return data.payload as SystemCodeStatePayload;
    }
  } catch {
    // Ignore if table does not exist
  }
  return null;
}
