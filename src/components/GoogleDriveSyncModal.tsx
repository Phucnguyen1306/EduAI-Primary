import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FolderSync,
  X,
  Database,
  Users,
  BookOpen,
  FileText,
  LogOut,
  FolderOpen,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  TARGET_DRIVE_FOLDER_ID,
  TARGET_DRIVE_FOLDER_URL,
  googleSignIn,
  logoutGoogleDrive,
  initAuth,
  syncSystemDataToGoogleDrive,
  pullSystemDataFromGoogleDrive,
  fetchGoogleDriveStatus,
  GoogleDriveStatusInfo,
} from "../utils/googleDriveService";

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreState: (state: any) => Promise<void>;
  currentStateStats: {
    classesCount: number;
    studentsCount: number;
    assignmentsCount: number;
    submissionsCount: number;
    regularRecordsCount: number;
    periodicRecordsCount: number;
  };
}

export function GoogleDriveSyncModal({
  isOpen,
  onClose,
  onRestoreState,
  currentStateStats,
}: GoogleDriveSyncModalProps) {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [driveStatus, setDriveStatus] = useState<GoogleDriveStatusInfo | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    fetchGoogleDriveStatus().then((status) => {
      if (status) setDriveStatus(status);
    });

    const unsub = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );

    return () => {
      unsub();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setNotice(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        setNotice({
          type: "success",
          message: `Đã kết nối tài khoản Google (${res.user.email}). Toàn bộ dữ liệu hệ thống sẵn sàng đồng bộ trực tiếp lên thư mục Google Drive đã chia sẻ!`,
        });
        const status = await fetchGoogleDriveStatus();
        if (status) setDriveStatus(status);
      }
    } catch (err: any) {
      setNotice({
        type: "error",
        message: err?.message || "Đăng nhập Google thất bại. Vui lòng thử lại!",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutGoogleDrive();
      setGoogleUser(null);
      setNotice({
        type: "info",
        message: "Đã ngắt kết nối tài khoản Google. Dữ liệu vẫn được lưu trữ trên máy chủ và mirror Google Drive cục bộ.",
      });
    } catch (err: any) {
      setNotice({ type: "error", message: err?.message || "Đăng xuất thất bại." });
    }
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    setNotice(null);
    try {
      const res = await syncSystemDataToGoogleDrive();
      if (res.ok) {
        setNotice({
          type: "success",
          message: res.message || "Đã đồng bộ toàn bộ dữ liệu thao tác của Giáo viên & Học sinh lên Google Drive thành công!",
        });
        const status = await fetchGoogleDriveStatus();
        if (status) setDriveStatus(status);
      } else {
        setNotice({
          type: "error",
          message: res.error || "Không thể đồng bộ lên Google Drive.",
        });
      }
    } catch (err: any) {
      setNotice({
        type: "error",
        message: err?.message || "Lỗi khi đồng bộ lên Google Drive.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfirmRestore = async () => {
    setConfirmRestoreOpen(false);
    setIsRestoring(true);
    setNotice(null);
    try {
      const res = await pullSystemDataFromGoogleDrive();
      if (res.ok && res.state) {
        await onRestoreState(res.state);
        setNotice({
          type: "success",
          message: `Đã khôi phục thành công toàn bộ dữ liệu từ ${
            res.source === "google_drive" ? "Google Drive Đám mây" : "Mirror Google Drive"
          } vào hệ thống!`,
        });
        const status = await fetchGoogleDriveStatus();
        if (status) setDriveStatus(status);
      } else {
        setNotice({
          type: "error",
          message: res.error || "Chưa tìm thấy bản sao lưu hệ thống trên Google Drive.",
        });
      }
    } catch (err: any) {
      setNotice({
        type: "error",
        message: err?.message || "Lỗi khi khôi phục dữ liệu từ Google Drive.",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-gradient-to-r from-sky-50 via-white to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Trung tâm Đồng bộ Google Drive
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full">
                  0đ Chi phí · Miễn phí 100%
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Tự động sao lưu và đồng bộ toàn bộ thao tác của Giáo viên &amp; Học sinh vào thư mục Google Drive đã chia sẻ.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Thông báo trả về */}
          {notice && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 border ${
                notice.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : notice.type === "error"
                  ? "bg-red-50 text-red-900 border-red-200"
                  : "bg-sky-50 text-sky-900 border-sky-200"
              }`}
            >
              {notice.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : notice.type === "error" ? (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Database className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">{notice.message}</div>
            </div>
          )}

          {/* Thẻ Kết nối Tài khoản Google */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {googleUser ? (
                <img
                  src={googleUser.photoURL || "https://lh3.googleusercontent.com/a/default-user"}
                  alt="Avatar"
                  className="w-11 h-11 rounded-full border-2 border-emerald-400 object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-400 shadow-xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-slate-900">
                    {googleUser ? googleUser.displayName || "Giáo viên Google" : "Chưa kết nối Google Drive"}
                  </div>
                  {googleUser ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      ● Đã kết nối
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500">
                      (Đăng nhập để đồng bộ trực tiếp lên mây)
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 font-mono">
                  {googleUser ? googleUser.email : "Nhấn nút đăng nhập bên phải để liên kết"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {googleUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  Đăng xuất
                </button>
              ) : (
                /* Nút Sign in with Google chuẩn Material Design theo quy định Skill */
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isSigningIn ? "Đang kết nối..." : "Đăng nhập với Google"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Thư mục Google Drive đã chia sẻ */}
          <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-[#0284C7]" />
                  <span className="text-xs font-bold text-slate-900">
                    Thư mục Google Drive đã chia sẻ đích:
                  </span>
                </div>
                <div className="text-xs font-mono text-sky-900 bg-sky-100/70 px-2 py-1 rounded inline-block">
                  ID: {TARGET_DRIVE_FOLDER_ID}
                </div>
                <p className="text-[11px] text-slate-600">
                  Mọi tệp bài làm của học sinh và bản sao lưu trạng thái thao tác của giáo viên được lưu trữ trực tiếp vào thư mục này.
                </p>
              </div>

              <a
                href={TARGET_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <span>Mở Thư mục Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Giải thích chi phí và cơ chế tự động đồng bộ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Không mất thêm bất kỳ chi phí nào (0đ)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Giải pháp tận dụng <strong>15GB lưu trữ miễn phí</strong> có sẵn của tài khoản Google Drive cá nhân/trường học. Không cần thuê thêm máy chủ, không cần đăng ký gói trả phí, dữ liệu luôn an toàn trên đám mây của Google.
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <FolderSync className="w-4 h-4 text-amber-600" />
                <span>Tự động đồng bộ 2 chiều tức thì</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Hệ thống <strong>tự động lưu</strong> mỗi khi giáo viên tạo đề, sửa lớp, duyệt bài, lưu nhận xét Thông tư 27; và mỗi khi học sinh nộp bài, tệp và kết quả sẽ tự động đẩy vào Google Drive.
              </p>
            </div>
          </div>

          {/* Cấu trúc dữ liệu được lưu trữ trên Google Drive */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Cấu trúc Dữ liệu được đồng bộ vào Thư mục Google Drive</span>
              <span className="text-[11px] text-slate-500 font-normal">Cập nhật tự động</span>
            </div>
            <div className="p-4 space-y-2.5 text-xs text-slate-700 font-mono bg-white">
              <div className="flex items-start gap-2 text-slate-900">
                <span className="font-bold text-blue-600">📁 [00_Du_Lieu_Dong_Bo_He_Thong]/</span>
                <span className="text-slate-500 text-[11px] font-sans">(Thư mục chứa bản sao lưu toàn hệ thống)</span>
              </div>
              <div className="pl-6 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-slate-800 font-semibold">eduai_toan_bo_du_lieu_he_thong.json</span>
                  <span className="text-slate-500 font-sans">
                    — Gồm {currentStateStats.classesCount} lớp, {currentStateStats.assignmentsCount} đề, {currentStateStats.submissionsCount} bài nộp, nhận xét TT27
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="text-slate-800 font-semibold">eduai_danh_sach_lop_hoc_sinh.json</span>
                  <span className="text-slate-500 font-sans">— Danh sách {currentStateStats.classesCount} lớp &amp; {currentStateStats.studentsCount} học sinh</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-slate-800 font-semibold">eduai_danh_sach_bai_tap_de_kiem_tra.json</span>
                  <span className="text-slate-500 font-sans">— Ngân hàng {currentStateStats.assignmentsCount} đề bài &amp; tiêu chí chấm</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="text-slate-800 font-semibold">eduai_ket_qua_nop_bai_hoc_sinh.json</span>
                  <span className="text-slate-500 font-sans">— Toàn bộ {currentStateStats.submissionsCount} bài nộp kèm điểm số</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="text-slate-800 font-semibold">eduai_nhan_xet_thong_tu_27.json</span>
                  <span className="text-slate-500 font-sans">— Nhận xét thường xuyên theo tháng &amp; định kỳ giữa/cuối kỳ</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-slate-900">
                <span className="font-bold text-emerald-600">📁 [Tên từng bài tập được giao]/</span>
                <span className="text-slate-500 text-[11px] font-sans">
                  — Lưu trực tiếp các tệp bài làm thực tế (.docx, .pptx, .sb3) của học sinh sau khi chuẩn hóa tên
                </span>
              </div>
            </div>
          </div>

          {/* Các nút hành động chính */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleManualSyncNow}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Đang đồng bộ lên Google Drive..." : "Đồng bộ toàn bộ lên Google Drive ngay"}</span>
              </button>

              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setConfirmRestoreOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#0284C7]" />
                <span>{isRestoring ? "Đang khôi phục..." : "Khôi phục dữ liệu từ Google Drive"}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 text-right">
              <div>Đồng bộ gần nhất: <strong className="font-mono text-slate-700">{driveStatus?.lastUpdatedAt || "Vừa xong"}</strong></div>
              <div className="text-emerald-700 font-medium">● Cơ chế tự động chạy nền kích hoạt</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog xác nhận khôi phục dữ liệu (User Confirmation Dialog theo quy định Skill) */}
      {confirmRestoreOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Xác nhận khôi phục từ Google Drive?
              </h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Thao tác này sẽ đọc tệp bản sao lưu mới nhất{" "}
              <code className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-slate-800">
                eduai_toan_bo_du_lieu_he_thong.json
              </code>{" "}
              từ thư mục Google Drive đã chia sẻ và hợp nhất vào ứng dụng. Bạn có chắc chắn muốn tiếp tục không?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRestoreOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg cursor-pointer shadow-xs"
              >
                Xác nhận Khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
