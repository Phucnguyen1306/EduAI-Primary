import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import {
  db,
  handleFirestoreError,
  OperationType,
  sanitizeForFirestore,
} from "../firebase";
import { Assignment, StudentSubmission } from "../types/grading";
import { ClassRoom } from "../components/ClassManagerView";
import { SystemCodeStatePayload } from "../utils/codeSyncEngine";
import { sendSyncBroadcast } from "../utils/broadcastSync";

const ASSIGNMENTS_COLLECTION = "assignments";
const CLASSES_COLLECTION = "classes";
const SUBMISSIONS_COLLECTION = "submissions";
const SYSTEM_STATE_COLLECTION = "system_state";
const SYSTEM_STATE_DOC_ID = "primary";

/**
 * Lắng nghe danh sách Đề thi / Bài tập thời gian thực qua Firestore onSnapshot
 */
export function subscribeAssignments(
  onUpdate: (assignments: Assignment[]) => void
): () => void {
  const colRef = collection(db, ASSIGNMENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Assignment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Assignment;
        if (data && data.id) {
          list.push(data);
        }
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, ASSIGNMENTS_COLLECTION);
    }
  );
}

/**
 * Lắng nghe danh sách Lớp học & Học sinh thời gian thực qua Firestore onSnapshot
 */
export function subscribeClasses(
  onUpdate: (classes: ClassRoom[]) => void
): () => void {
  const colRef = collection(db, CLASSES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ClassRoom[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ClassRoom;
        if (data && data.id) {
          list.push(data);
        }
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, CLASSES_COLLECTION);
    }
  );
}

/**
 * Lắng nghe danh sách Bài nộp của học sinh thời gian thực qua Firestore onSnapshot
 */
export function subscribeSubmissions(
  onUpdate: (submissions: StudentSubmission[]) => void
): () => void {
  const colRef = collection(db, SUBMISSIONS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: StudentSubmission[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as StudentSubmission;
        if (data && data.id) {
          list.push(data);
        }
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, SUBMISSIONS_COLLECTION);
    }
  );
}

/**
 * Lắng nghe cấu hình hệ thống & bản nháp thời gian thực
 */
export function subscribeSystemState(
  onUpdate: (state: any) => void
): () => void {
  const docRef = doc(db, SYSTEM_STATE_COLLECTION, SYSTEM_STATE_DOC_ID);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      }
    },
    (error) => {
      handleFirestoreError(
        error,
        OperationType.GET,
        `${SYSTEM_STATE_COLLECTION}/${SYSTEM_STATE_DOC_ID}`
      );
    }
  );
}

/**
 * Lưu 1 đề kiểm tra / bài tập lên Firestore & phát xung đồng bộ đa tab
 */
export async function saveAssignmentToFirestore(assignment: Assignment): Promise<void> {
  const clean = sanitizeForFirestore(assignment);
  const path = `${ASSIGNMENTS_COLLECTION}/${clean.id}`;
  try {
    await setDoc(doc(db, ASSIGNMENTS_COLLECTION, clean.id), clean);
    sendSyncBroadcast("ADD_ASSIGNMENT", clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Xóa 1 đề kiểm tra khỏi Firestore & phát xung đồng bộ đa tab
 */
export async function deleteAssignmentFromFirestore(id: string): Promise<void> {
  const path = `${ASSIGNMENTS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, ASSIGNMENTS_COLLECTION, id));
    sendSyncBroadcast("DELETE_ASSIGNMENT", { id });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Lưu 1 bài nộp của học sinh lên Firestore & phát xung đồng bộ đa tab
 */
export async function saveSubmissionToFirestore(submission: StudentSubmission): Promise<void> {
  const clean = sanitizeForFirestore(submission);
  const path = `${SUBMISSIONS_COLLECTION}/${clean.id}`;
  try {
    await setDoc(doc(db, SUBMISSIONS_COLLECTION, clean.id), clean);
    sendSyncBroadcast("NEW_SUBMISSION", clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Xóa 1 bài nộp khỏi Firestore & phát xung đồng bộ đa tab
 */
export async function deleteSubmissionFromFirestore(id: string): Promise<void> {
  const path = `${SUBMISSIONS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, id));
    sendSyncBroadcast("DELETE_SUBMISSION", { id });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Lưu 1 lớp học lên Firestore & phát xung đồng bộ đa tab
 */
export async function saveClassToFirestore(classroom: ClassRoom): Promise<void> {
  const clean = sanitizeForFirestore(classroom);
  const path = `${CLASSES_COLLECTION}/${clean.id}`;
  try {
    await setDoc(doc(db, CLASSES_COLLECTION, clean.id), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Lưu danh sách lớp học lên Firestore
 */
export async function saveClassesToFirestore(classes: ClassRoom[]): Promise<void> {
  try {
    for (const c of classes) {
      await saveClassToFirestore(c);
    }
    sendSyncBroadcast("UPDATE_CLASSES", classes);
  } catch (err) {
    console.warn("Lỗi lưu danh sách lớp học lên Firestore:", err);
  }
}

/**
 * Xóa 1 lớp học khỏi Firestore
 */
export async function deleteClassFromFirestore(id: string): Promise<void> {
  const path = `${CLASSES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, CLASSES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Lưu trạng thái nháp và lịch sử hoạt động lên Firestore
 */
export async function saveSystemStateToFirestore(state: any): Promise<void> {
  const clean = sanitizeForFirestore(state);
  const path = `${SYSTEM_STATE_COLLECTION}/${SYSTEM_STATE_DOC_ID}`;
  try {
    await setDoc(
      doc(db, SYSTEM_STATE_COLLECTION, SYSTEM_STATE_DOC_ID),
      {
        ...clean,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Đồng bộ toàn bộ trạng thái lên Firestore
 */
export async function syncEntireStateToFirestore(
  payload: SystemCodeStatePayload
): Promise<void> {
  try {
    const cleanPayload = sanitizeForFirestore(payload);
    const batch = writeBatch(db);

    // Đồng bộ đề thi
    if (Array.isArray(cleanPayload.assignments)) {
      for (const asg of cleanPayload.assignments) {
        if (asg && asg.id) {
          batch.set(doc(db, ASSIGNMENTS_COLLECTION, asg.id), asg);
        }
      }
    }

    // Đồng bộ lớp học
    if (Array.isArray(cleanPayload.classes)) {
      for (const cls of cleanPayload.classes) {
        if (cls && cls.id) {
          batch.set(doc(db, CLASSES_COLLECTION, cls.id), cls);
        }
      }
    }

    // Đồng bộ bài nộp
    if (Array.isArray(cleanPayload.submissions)) {
      for (const sub of cleanPayload.submissions) {
        if (sub && sub.id) {
          batch.set(doc(db, SUBMISSIONS_COLLECTION, sub.id), sub);
        }
      }
    }

    // Xử lý các mục đã xóa
    if (cleanPayload.deletedIds) {
      for (const id of cleanPayload.deletedIds.assignments || []) {
        batch.delete(doc(db, ASSIGNMENTS_COLLECTION, id));
      }
      for (const id of cleanPayload.deletedIds.classes || []) {
        batch.delete(doc(db, CLASSES_COLLECTION, id));
      }
      for (const id of cleanPayload.deletedIds.submissions || []) {
        batch.delete(doc(db, SUBMISSIONS_COLLECTION, id));
      }
    }

    // Đồng bộ trạng thái hệ thống
    batch.set(
      doc(db, SYSTEM_STATE_COLLECTION, SYSTEM_STATE_DOC_ID),
      {
        examBuilderDraft: cleanPayload.examBuilderDraft ?? null,
        tt27RegularRecords: cleanPayload.tt27RegularRecords ?? {},
        tt27PeriodicRecords: cleanPayload.tt27PeriodicRecords ?? {},
        operationHistory: cleanPayload.operationHistory ?? [],
        lastUpdatedAt: new Date().toLocaleString("vi-VN"),
      },
      { merge: true }
    );

    await batch.commit();
  } catch (error) {
    console.warn("Lỗi khi batch sync lên Firestore:", error);
  }
}

/**
 * Khởi tạo dữ liệu mẫu lên Firestore nếu cơ sở dữ liệu còn trống
 */
export async function seedInitialFirestoreDataIfEmpty(
  initialClasses: ClassRoom[],
  initialAssignments: Assignment[],
  initialSubmissions: StudentSubmission[]
): Promise<void> {
  try {
    const assignSnap = await getDocs(collection(db, ASSIGNMENTS_COLLECTION));
    if (assignSnap.empty) {
      console.log("Firestore trống: Đang nạp dữ liệu ban đầu lên Firestore...");
      const batch = writeBatch(db);

      for (const cls of initialClasses) {
        const c = sanitizeForFirestore(cls);
        batch.set(doc(db, CLASSES_COLLECTION, c.id), c);
      }
      for (const asg of initialAssignments) {
        const a = sanitizeForFirestore(asg);
        batch.set(doc(db, ASSIGNMENTS_COLLECTION, a.id), a);
      }
      for (const sub of initialSubmissions) {
        const s = sanitizeForFirestore(sub);
        batch.set(doc(db, SUBMISSIONS_COLLECTION, s.id), s);
      }

      await batch.commit();
      console.log("Đã khởi tạo dữ liệu Firestore thành công!");
    }
  } catch (err) {
    console.warn("Kiểm tra khởi tạo Firestore:", err);
  }
}
