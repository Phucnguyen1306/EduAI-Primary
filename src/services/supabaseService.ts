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
      eventsPerSecond: 20,
    },
  },
});

const LIVE_CHANNEL_NAME = "eduai_primary_realtime_sync";

// Kênh Realtime siêu tốc chia sẻ giữa Giáo viên và toàn bộ Học sinh
let liveChannel: ReturnType<typeof supabase.channel> | null = null;

// Callbacks lắng nghe
type AssignmentUpdateCallback = (assignments: Assignment[] | ((prev: Assignment[]) => Assignment[])) => void;
type ClassUpdateCallback = (classes: ClassRoom[] | ((prev: ClassRoom[]) => ClassRoom[])) => void;
type SubmissionUpdateCallback = (submissions: StudentSubmission[] | ((prev: StudentSubmission[]) => StudentSubmission[])) => void;

const assignmentSubscribers = new Set<AssignmentUpdateCallback>();
const classSubscribers = new Set<ClassUpdateCallback>();
const submissionSubscribers = new Set<SubmissionUpdateCallback>();
const systemStateSubscribers = new Set<(state: Partial<SystemCodeStatePayload>) => void>();

/**
 * Chuyển đổi dòng từ bảng 'assignments' thành Assignment object chuẩn
 */
export function parseAssignmentRow(row: any): Assignment {
  if (row.payload && typeof row.payload === "object" && row.payload.title) {
    return {
      ...row.payload,
      id: row.id || row.payload.id,
      code: row.code || row.payload.code || "",
      title: row.title || row.payload.title,
      grade: row.grade || row.payload.grade,
      className: row.class_name || row.payload.className || "",
    };
  }
  return {
    id: row.id,
    code: row.code || "",
    title: row.title,
    grade: row.grade,
    className: row.class_name || "",
    targetClassNames: row.target_class_names || [],
    fileType: row.file_type || "docx",
    studentPrompt: row.student_prompt || "",
    standardFileNamePattern: row.standard_file_name_pattern || "",
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    theoryExam: row.theory_exam || undefined,
    isSemesterExam: !!row.is_semester_exam,
    templateSummary: row.template_summary || undefined,
  };
}

/**
 * Chuyển đổi dòng từ bảng 'classes' thành ClassRoom object chuẩn
 */
export function parseClassRow(row: any): ClassRoom {
  if (row.payload && typeof row.payload === "object" && row.payload.name) {
    return {
      ...row.payload,
      id: row.id || row.payload.id,
      name: row.name || row.payload.name,
      grade: row.grade || row.payload.grade,
      students: Array.isArray(row.students)
        ? row.students
        : Array.isArray(row.payload.students)
        ? row.payload.students
        : [],
    };
  }
  return {
    id: row.id,
    name: row.name,
    grade: row.grade,
    schoolYear: row.school_year || "2026-2027",
    students: Array.isArray(row.students) ? row.students : [],
    folderPath: row.folder_path || undefined,
    rosterApproved: !!row.roster_approved,
    isAutoCreatedFromExcel: !!row.is_auto_created_from_excel,
  };
}

/**
 * Chuyển đổi dòng từ bảng 'submissions' thành StudentSubmission object chuẩn
 */
export function parseSubmissionRow(row: any): StudentSubmission {
  if (row.payload && typeof row.payload === "object" && row.payload.studentName) {
    return {
      ...row.payload,
      id: row.id || row.payload.id,
      studentName: row.student_name || row.payload.studentName,
      className: row.class_name || row.payload.className,
      assignmentId: row.assignment_id || row.payload.assignmentId,
      finalScore: typeof row.final_score === "number" ? row.final_score : row.payload.finalScore,
      aiScore: typeof row.ai_score === "number" ? row.ai_score : row.payload.aiScore,
      approvalStatus: row.approval_status || row.payload.approvalStatus || "pending",
      submittedAt: row.submitted_at || row.payload.submittedAt || new Date().toISOString(),
    };
  }
  return {
    id: row.id,
    studentId: row.student_id || "",
    studentName: row.student_name,
    className: row.class_name,
    grade: row.grade || "Lớp 4",
    assignmentId: row.assignment_id,
    assignmentTitle: row.assignment_title || "",
    fileType: row.file_type || "docx",
    originalFileName: row.original_file_name || "",
    standardizedFileName: row.standardized_file_name || "",
    wasFileNameAutoFixed: false,
    submittedAt: row.submitted_at || new Date().toISOString(),
    processingTimeSec: 0,
    aiScore: Number(row.ai_score || 0),
    finalScore: Number(row.final_score || 0),
    approvalStatus: row.approval_status || "pending",
    needsAttention: !!row.needs_attention,
    detectedErrors: row.detected_errors || [],
    criterionBreakdown: Array.isArray(row.criterion_breakdown) ? row.criterion_breakdown : [],
    personalizedFeedback: row.personalized_feedback || "",
    inspection: row.inspection || { type: "docx", data: {} as any },
    mcqDetails: row.mcq_details,
    practiceWorkImageDataUrl: row.practice_work_image_data_url,
    driveFileId: row.drive_file_id,
    driveWebViewLink: row.drive_web_view_link,
    driveAssignmentFolderId: row.drive_assignment_folder_id,
    driveAssignmentFolderName: row.drive_assignment_folder_name,
    driveAssignmentFolderLink: row.drive_assignment_folder_link,
    driveRootFolderUrl: row.drive_root_folder_url,
    driveSynced: !!row.drive_synced,
  };
}

/**
 * Khởi tạo kênh Realtime với cả Postgres Table Changes và Broadcast
 */
function getOrCreateLiveChannel() {
  if (!liveChannel) {
    liveChannel = supabase.channel(LIVE_CHANNEL_NAME);

    // 1. Lắng nghe thay đổi bảng 'assignments' theo thời gian thực (INSERT, UPDATE, DELETE)
    liveChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "assignments" },
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          const item = parseAssignmentRow(payload.new);
          assignmentSubscribers.forEach((cb) => cb([item]));
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const item = parseAssignmentRow(payload.new);
          assignmentSubscribers.forEach((cb) => cb([item]));
        } else if (payload.eventType === "DELETE" && payload.old) {
          const deletedId = (payload.old as any).id;
          if (deletedId) {
            assignmentSubscribers.forEach((cb) =>
              cb((prev: Assignment[]) => prev.filter((a) => a.id !== deletedId))
            );
          }
        }
      }
    );

    // 2. Lắng nghe thay đổi bảng 'classes' theo thời gian thực
    liveChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "classes" },
      (payload) => {
        if ((payload.eventType === "INSERT" || payload.eventType === "UPDATE") && payload.new) {
          const item = parseClassRow(payload.new);
          classSubscribers.forEach((cb) => cb([item]));
        } else if (payload.eventType === "DELETE" && payload.old) {
          const deletedId = (payload.old as any).id;
          if (deletedId) {
            classSubscribers.forEach((cb) =>
              cb((prev: ClassRoom[]) => prev.filter((c) => c.id !== deletedId))
            );
          }
        }
      }
    );

    // 3. Lắng nghe thay đổi bảng 'submissions' theo thời gian thực
    liveChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "submissions" },
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          const item = parseSubmissionRow(payload.new);
          submissionSubscribers.forEach((cb) => cb([item]));
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const item = parseSubmissionRow(payload.new);
          submissionSubscribers.forEach((cb) => cb([item]));
        } else if (payload.eventType === "DELETE" && payload.old) {
          const deletedId = (payload.old as any).id;
          if (deletedId) {
            submissionSubscribers.forEach((cb) =>
              cb((prev: StudentSubmission[]) => prev.filter((s) => s.id !== deletedId))
            );
          }
        }
      }
    );

    // 4. Lắng nghe thay đổi bảng 'eduai_system_state'
    liveChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "eduai_system_state" },
      (payload) => {
        if (payload.new && (payload.new as any).payload) {
          const st = (payload.new as any).payload as SystemCodeStatePayload;
          systemStateSubscribers.forEach((cb) => cb(st));
          if (Array.isArray(st.assignments) && st.assignments.length > 0) {
            assignmentSubscribers.forEach((cb) => cb(st.assignments!));
          }
          if (Array.isArray(st.classes) && st.classes.length > 0) {
            classSubscribers.forEach((cb) => cb(st.classes!));
          }
          if (Array.isArray(st.submissions)) {
            submissionSubscribers.forEach((cb) => cb(st.submissions!));
          }
        }
      }
    );

    // 5. Kênh phát thanh trực tiếp (Broadcast Events) để đồng bộ 0ms trễ
    liveChannel.on("broadcast", { event: "assignments_event" }, (event) => {
      const payload = event?.payload;
      if (payload?.type === "ASSIGNMENTS_UPDATED" && Array.isArray(payload.data)) {
        assignmentSubscribers.forEach((cb) => cb(payload.data));
      } else if (payload?.type === "ADD_ASSIGNMENT" && payload.assignment) {
        assignmentSubscribers.forEach((cb) => cb([payload.assignment]));
      } else if (payload?.type === "DELETE_ASSIGNMENT" && payload.assignmentId) {
        assignmentSubscribers.forEach((cb) =>
          cb((prev: Assignment[]) => prev.filter((a) => a.id !== payload.assignmentId))
        );
      }
    });

    liveChannel.on("broadcast", { event: "classes_event" }, (event) => {
      const classes = event?.payload?.classes;
      if (Array.isArray(classes)) {
        classSubscribers.forEach((cb) => cb(classes));
      }
    });

    liveChannel.on("broadcast", { event: "submissions_event" }, (event) => {
      const payload = event?.payload;
      if (Array.isArray(payload?.submissions)) {
        submissionSubscribers.forEach((cb) => cb(payload.submissions));
      } else if (payload?.newSubmission) {
        submissionSubscribers.forEach((cb) => cb([payload.newSubmission]));
      } else if (payload?.deletedSubmissionId) {
        submissionSubscribers.forEach((cb) =>
          cb((prev: StudentSubmission[]) => prev.filter((s) => s.id !== payload.deletedSubmissionId))
        );
      }
    });

    liveChannel.on("broadcast", { event: "system_state_event" }, (event) => {
      if (event?.payload?.state) {
        const st = event.payload.state as Partial<SystemCodeStatePayload>;
        systemStateSubscribers.forEach((cb) => cb(st));
      }
    });

    liveChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("Supabase Realtime connected: Bảng 'assignments', 'submissions', 'classes' đã kích hoạt!");
      }
    });
  }
  return liveChannel;
}

/**
 * Tải danh sách Đề bài & Bài kiểm tra từ bảng 'assignments' trên Supabase
 */
export async function fetchInitialSupabaseAssignments(): Promise<Assignment[] | null> {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(parseAssignmentRow);
    }
  } catch {
    // Bỏ qua nếu bảng chưa tạo
  }
  return null;
}

/**
 * Tải danh sách Lớp học & Học sinh từ bảng 'classes' trên Supabase
 */
export async function fetchInitialSupabaseClasses(): Promise<ClassRoom[] | null> {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("name", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(parseClassRow);
    }
  } catch {
    // Bỏ qua nếu bảng chưa tạo
  }
  return null;
}

/**
 * Tải danh sách Bài nộp học sinh từ bảng 'submissions' trên Supabase
 */
export async function fetchInitialSupabaseSubmissions(): Promise<StudentSubmission[] | null> {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(parseSubmissionRow);
    }
  } catch {
    // Bỏ qua nếu bảng chưa tạo
  }
  return null;
}

/**
 * Tải trạng thái ban đầu từ bảng 'eduai_system_state'
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

/**
 * Đăng ký lắng nghe Đề bài & Bài tập thời gian thực từ Supabase Realtime
 * Hỗ trợ nhận bài ngay lập tức khi giáo viên giao từ máy khác
 */
export function subscribeSupabaseAssignments(
  onUpdate: (assignments: Assignment[] | ((prev: Assignment[]) => Assignment[])) => void
): () => void {
  getOrCreateLiveChannel();
  assignmentSubscribers.add(onUpdate);

  // Tải dữ liệu ban đầu từ bảng 'assignments', nếu không có thì đọc từ 'eduai_system_state'
  fetchInitialSupabaseAssignments().then((asgs) => {
    if (asgs && asgs.length > 0) {
      onUpdate(asgs);
    } else {
      fetchInitialSupabaseState().then((state) => {
        if (state?.assignments && state.assignments.length > 0) {
          onUpdate(state.assignments);
        }
      });
    }
  });

  return () => {
    assignmentSubscribers.delete(onUpdate);
  };
}

/**
 * Đăng ký lắng nghe Lớp học & Học sinh thời gian thực từ Supabase Realtime
 */
export function subscribeSupabaseClasses(
  onUpdate: (classes: ClassRoom[] | ((prev: ClassRoom[]) => ClassRoom[])) => void
): () => void {
  getOrCreateLiveChannel();
  classSubscribers.add(onUpdate);

  fetchInitialSupabaseClasses().then((cls) => {
    if (cls && cls.length > 0) {
      onUpdate(cls);
    } else {
      fetchInitialSupabaseState().then((state) => {
        if (state?.classes && state.classes.length > 0) {
          onUpdate(state.classes);
        }
      });
    }
  });

  return () => {
    classSubscribers.delete(onUpdate);
  };
}

/**
 * Đăng ký lắng nghe Bài nộp học sinh thời gian thực từ Supabase Realtime
 */
export function subscribeSupabaseSubmissions(
  onUpdate: (submissions: StudentSubmission[] | ((prev: StudentSubmission[]) => StudentSubmission[])) => void
): () => void {
  getOrCreateLiveChannel();
  submissionSubscribers.add(onUpdate);

  fetchInitialSupabaseSubmissions().then((subs) => {
    if (subs && subs.length > 0) {
      onUpdate(subs);
    } else {
      fetchInitialSupabaseState().then((state) => {
        if (state?.submissions && state.submissions.length > 0) {
          onUpdate(state.submissions);
        }
      });
    }
  });

  return () => {
    submissionSubscribers.delete(onUpdate);
  };
}

/**
 * Đăng ký lắng nghe Toàn bộ Trạng thái hệ thống (Lớp, Đề, Điểm, Nhận xét TT27) từ Supabase
 */
export function subscribeSupabaseSystemState(
  onUpdate: (state: Partial<SystemCodeStatePayload>) => void
): () => void {
  getOrCreateLiveChannel();
  systemStateSubscribers.add(onUpdate);

  return () => {
    systemStateSubscribers.delete(onUpdate);
  };
}

/**
 * Lưu/Cập nhật một đề bài kiểm tra lên bảng 'assignments' và phát Realtime
 */
export async function saveAssignmentToSupabase(assignment: Assignment): Promise<void> {
  const channel = getOrCreateLiveChannel();
  const nowIso = new Date().toISOString();

  // 1. Lưu vào bảng 'assignments'
  try {
    await supabase.from("assignments").upsert({
      id: assignment.id,
      code: assignment.code || "",
      title: assignment.title,
      grade: assignment.grade,
      class_name: assignment.className || "",
      target_class_names: assignment.targetClassNames || [],
      file_type: assignment.fileType || "docx",
      student_prompt: assignment.studentPrompt || "",
      standard_file_name_pattern: assignment.standardFileNamePattern || "",
      checklist: assignment.checklist || [],
      theory_exam: assignment.theoryExam || null,
      is_semester_exam: !!assignment.isSemesterExam,
      template_summary: assignment.templateSummary || null,
      payload: assignment,
      updated_at: nowIso,
    });
  } catch (err) {
    console.warn("Lỗi lưu bảng assignments:", err);
  }

  // 2. Phát broadcast qua channel để học sinh nhận ngay
  try {
    await channel.send({
      type: "broadcast",
      event: "assignments_event",
      payload: {
        type: "ADD_ASSIGNMENT",
        assignment,
        timestamp: nowIso,
      },
    });
    sendSyncBroadcast("ADD_ASSIGNMENT", assignment);
  } catch (err) {
    console.warn("Lỗi broadcast assignment:", err);
  }
}

/**
 * Xóa một đề bài khỏi bảng 'assignments' trên Supabase và phát Realtime
 */
export async function deleteAssignmentFromSupabase(assignmentId: string): Promise<void> {
  const channel = getOrCreateLiveChannel();

  try {
    await supabase.from("assignments").delete().eq("id", assignmentId);
  } catch (err) {
    console.warn("Lỗi xóa từ bảng assignments:", err);
  }

  try {
    await channel.send({
      type: "broadcast",
      event: "assignments_event",
      payload: {
        type: "DELETE_ASSIGNMENT",
        assignmentId,
        timestamp: new Date().toISOString(),
      },
    });
    sendSyncBroadcast("DELETE_ASSIGNMENT", { id: assignmentId });
  } catch (err) {
    console.warn("Lỗi broadcast delete assignment:", err);
  }
}

/**
 * Lưu/Cập nhật một bài nộp học sinh lên bảng 'submissions' và phát Realtime
 */
export async function saveSubmissionToSupabase(submission: StudentSubmission): Promise<void> {
  const channel = getOrCreateLiveChannel();
  const nowIso = new Date().toISOString();

  // 1. Lưu vào bảng 'submissions'
  try {
    await supabase.from("submissions").upsert({
      id: submission.id,
      student_id: submission.studentId || "",
      student_name: submission.studentName,
      class_name: submission.className,
      grade: submission.grade || "Lớp 4",
      assignment_id: submission.assignmentId,
      assignment_title: submission.assignmentTitle || "",
      file_type: submission.fileType || "docx",
      original_file_name: submission.originalFileName || "",
      standardized_file_name: submission.standardizedFileName || "",
      submitted_at: submission.submittedAt || nowIso,
      ai_score: submission.aiScore || 0,
      final_score: submission.finalScore || 0,
      approval_status: submission.approvalStatus || "pending",
      needs_attention: !!submission.needsAttention,
      detected_errors: submission.detectedErrors || [],
      criterion_breakdown: submission.criterionBreakdown || [],
      personalized_feedback: submission.personalizedFeedback || "",
      inspection: submission.inspection || null,
      mcq_details: submission.mcqDetails || null,
      practice_work_image_data_url: submission.practiceWorkImageDataUrl || null,
      drive_file_id: submission.driveFileId || null,
      drive_web_view_link: submission.driveWebViewLink || null,
      drive_assignment_folder_id: submission.driveAssignmentFolderId || null,
      drive_assignment_folder_name: submission.driveAssignmentFolderName || null,
      drive_assignment_folder_link: submission.driveAssignmentFolderLink || null,
      drive_root_folder_url: submission.driveRootFolderUrl || null,
      drive_synced: !!submission.driveSynced,
      payload: submission,
      updated_at: nowIso,
    });
  } catch (err) {
    console.warn("Lỗi lưu bảng submissions:", err);
  }

  // 2. Phát broadcast qua channel để giáo viên và học sinh nhận ngay
  try {
    await channel.send({
      type: "broadcast",
      event: "submissions_event",
      payload: {
        newSubmission: submission,
        timestamp: nowIso,
      },
    });
    sendSyncBroadcast("NEW_SUBMISSION", submission);
  } catch (err) {
    console.warn("Lỗi broadcast submission:", err);
  }
}

/**
 * Xóa một bài nộp khỏi bảng 'submissions' trên Supabase và phát Realtime
 */
export async function deleteSubmissionFromSupabase(submissionId: string): Promise<void> {
  const channel = getOrCreateLiveChannel();

  try {
    await supabase.from("submissions").delete().eq("id", submissionId);
  } catch (err) {
    console.warn("Lỗi xóa từ bảng submissions:", err);
  }

  try {
    await channel.send({
      type: "broadcast",
      event: "submissions_event",
      payload: {
        deletedSubmissionId: submissionId,
        timestamp: new Date().toISOString(),
      },
    });
    sendSyncBroadcast("DELETE_SUBMISSION", { id: submissionId });
  } catch (err) {
    console.warn("Lỗi broadcast delete submission:", err);
  }
}

/**
 * Lưu danh sách lớp học lên bảng 'classes' và phát Realtime
 */
export async function saveClassesToSupabase(classes: ClassRoom[]): Promise<void> {
  const channel = getOrCreateLiveChannel();
  const nowIso = new Date().toISOString();

  // 1. Lưu vào bảng 'classes'
  try {
    const rows = classes.map((c) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      school_year: c.schoolYear || "2026-2027",
      students: c.students || [],
      folder_path: c.folderPath || null,
      roster_approved: !!c.rosterApproved,
      is_auto_created_from_excel: !!c.isAutoCreatedFromExcel,
      payload: c,
      updated_at: nowIso,
    }));
    await supabase.from("classes").upsert(rows);
  } catch (err) {
    console.warn("Lỗi lưu bảng classes:", err);
  }

  // 2. Phát broadcast
  try {
    await channel.send({
      type: "broadcast",
      event: "classes_event",
      payload: {
        classes,
        timestamp: nowIso,
      },
    });
  } catch (err) {
    console.warn("Lỗi broadcast classes:", err);
  }
}

/**
 * Đồng bộ toàn bộ dữ liệu hệ thống (Lớp, Đề, Bài nộp, Nhận xét TT27) lên các bảng chuyên biệt và bảng tổng hợp
 */
export async function syncEntireStateToSupabase(
  payload: SystemCodeStatePayload
): Promise<boolean> {
  try {
    const channel = getOrCreateLiveChannel();
    const nowIso = new Date().toISOString();

    // 1. Lưu vào các bảng chuyên biệt
    if (Array.isArray(payload.classes) && payload.classes.length > 0) {
      saveClassesToSupabase(payload.classes).catch(() => {});
    }

    if (Array.isArray(payload.assignments) && payload.assignments.length > 0) {
      try {
        const rows = payload.assignments.map((asg) => ({
          id: asg.id,
          code: asg.code || "",
          title: asg.title,
          grade: asg.grade,
          class_name: asg.className || "",
          target_class_names: asg.targetClassNames || [],
          file_type: asg.fileType || "docx",
          student_prompt: asg.studentPrompt || "",
          standard_file_name_pattern: asg.standardFileNamePattern || "",
          checklist: asg.checklist || [],
          theory_exam: asg.theoryExam || null,
          is_semester_exam: !!asg.isSemesterExam,
          template_summary: asg.templateSummary || null,
          payload: asg,
          updated_at: nowIso,
        }));
        await supabase.from("assignments").upsert(rows);
      } catch {}
    }

    if (Array.isArray(payload.submissions) && payload.submissions.length > 0) {
      try {
        const rows = payload.submissions.map((sub) => ({
          id: sub.id,
          student_id: sub.studentId || "",
          student_name: sub.studentName,
          class_name: sub.className,
          grade: sub.grade || "Lớp 4",
          assignment_id: sub.assignmentId,
          assignment_title: sub.assignmentTitle || "",
          file_type: sub.fileType || "docx",
          original_file_name: sub.originalFileName || "",
          standardized_file_name: sub.standardizedFileName || "",
          submitted_at: sub.submittedAt || nowIso,
          ai_score: sub.aiScore || 0,
          final_score: sub.finalScore || 0,
          approval_status: sub.approvalStatus || "pending",
          needs_attention: !!sub.needsAttention,
          detected_errors: sub.detectedErrors || [],
          criterion_breakdown: sub.criterionBreakdown || [],
          personalized_feedback: sub.personalizedFeedback || "",
          inspection: sub.inspection || null,
          mcq_details: sub.mcqDetails || null,
          practice_work_image_data_url: sub.practiceWorkImageDataUrl || null,
          drive_file_id: sub.driveFileId || null,
          drive_web_view_link: sub.driveWebViewLink || null,
          drive_assignment_folder_id: sub.driveAssignmentFolderId || null,
          drive_assignment_folder_name: sub.driveAssignmentFolderName || null,
          drive_assignment_folder_link: sub.driveAssignmentFolderLink || null,
          drive_root_folder_url: sub.driveRootFolderUrl || null,
          drive_synced: !!sub.driveSynced,
          payload: sub,
          updated_at: nowIso,
        }));
        await supabase.from("submissions").upsert(rows);
      } catch {}
    }

    // 2. Xử lý các ID bị xóa
    if (payload.deletedIds?.assignments?.length) {
      try {
        await supabase.from("assignments").delete().in("id", payload.deletedIds.assignments);
      } catch {}
    }
    if (payload.deletedIds?.submissions?.length) {
      try {
        await supabase.from("submissions").delete().in("id", payload.deletedIds.submissions);
      } catch {}
    }
    if (payload.deletedIds?.classes?.length) {
      try {
        await supabase.from("classes").delete().in("id", payload.deletedIds.classes);
      } catch {}
    }

    // 3. Lưu vào bảng trạng thái toàn diện eduai_system_state
    try {
      await supabase
        .from("eduai_system_state")
        .upsert({
          id: "primary",
          payload,
          updated_at: nowIso,
        })
        .select();
    } catch {}

    // 4. Phát các sự kiện Realtime đồng loạt
    await channel.send({
      type: "broadcast",
      event: "system_state_event",
      payload: {
        state: payload,
        timestamp: nowIso,
      },
    });

    if (Array.isArray(payload.assignments) && payload.assignments.length > 0) {
      await channel.send({
        type: "broadcast",
        event: "assignments_event",
        payload: {
          type: "ASSIGNMENTS_UPDATED",
          data: payload.assignments,
          timestamp: nowIso,
        },
      });
    }

    return true;
  } catch (err) {
    console.warn("Supabase sync warning:", err);
    return false;
  }
}

/**
 * Khởi tạo dữ liệu ban đầu lên Supabase nếu các bảng còn trống
 */
export async function seedInitialSupabaseDataIfEmpty(
  classes: ClassRoom[],
  assignments: Assignment[],
  submissions: StudentSubmission[]
): Promise<void> {
  try {
    const existingAsgs = await fetchInitialSupabaseAssignments();
    if (!existingAsgs || existingAsgs.length === 0) {
      await syncEntireStateToSupabase({
        classes,
        assignments,
        submissions,
      });
    }
  } catch {
    // Dự phòng
  }
}

// Aliases chuẩn cho Supabase Realtime & Database (Zero Quota Limit)
export const broadcastAssignmentToSupabase = saveAssignmentToSupabase;
export const broadcastSubmissionToSupabase = saveSubmissionToSupabase;
export const subscribeAssignments = subscribeSupabaseAssignments;
export const subscribeClasses = subscribeSupabaseClasses;
export const subscribeSubmissions = subscribeSupabaseSubmissions;
export const subscribeSystemState = subscribeSupabaseSystemState;
