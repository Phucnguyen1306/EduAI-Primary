/**
 * EduAI Primary - Cloud Sync Service
 * Đã chuyển đổi toàn bộ sang Supabase Realtime & Database (Zero Quota Limit)
 * Tương thích 100% với các component trong hệ thống
 */

export {
  supabase,
  subscribeSupabaseAssignments as subscribeAssignments,
  subscribeSupabaseClasses as subscribeClasses,
  subscribeSupabaseSubmissions as subscribeSubmissions,
  subscribeSupabaseSystemState as subscribeSystemState,
  broadcastAssignmentToSupabase as saveAssignmentToFirestore,
  broadcastSubmissionToSupabase as saveSubmissionToFirestore,
  syncEntireStateToSupabase as syncEntireStateToFirestore,
} from "./supabaseService";

import { Assignment, StudentSubmission } from "../types/grading";
import { ClassRoom } from "../components/ClassManagerView";
import {
  broadcastAssignmentToSupabase,
  broadcastSubmissionToSupabase,
  syncEntireStateToSupabase,
} from "./supabaseService";

export async function saveClassesToFirestore(classes: ClassRoom[]): Promise<void> {
  await syncEntireStateToSupabase({ classes });
}

export async function deleteSubmissionFromFirestore(id: string): Promise<void> {
  await syncEntireStateToSupabase({
    deletedIds: { submissions: [id] },
  });
}

export async function deleteAssignmentFromFirestore(id: string): Promise<void> {
  await syncEntireStateToSupabase({
    deletedIds: { assignments: [id] },
  });
}

export async function seedInitialFirestoreDataIfEmpty(
  classes: ClassRoom[],
  assignments: Assignment[],
  submissions: StudentSubmission[]
): Promise<void> {
  await syncEntireStateToSupabase({
    classes,
    assignments,
    submissions,
  });
}
