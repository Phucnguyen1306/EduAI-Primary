import React, { useState, useEffect } from "react";
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  Radio,
  Sparkles,
  Server,
  Zap,
} from "lucide-react";
import {
  checkSupabaseHealth,
  SupabaseHealthStatus,
  SUPABASE_SETUP_SQL,
  SUPABASE_URL,
  requestPeerSync,
} from "../services/supabaseService";

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [health, setHealth] = useState<SupabaseHealthStatus | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [manualSyncing, setManualSyncing] = useState<boolean>(false);

  const runCheck = async () => {
    setChecking(true);
    try {
      const res = await checkSupabaseHealth();
      setHealth(res);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runCheck();
    }
  }, [isOpen]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleForcePeerSync = async () => {
    setManualSyncing(true);
    try {
      await requestPeerSync();
      await runCheck();
    } finally {
      setTimeout(() => setManualSyncing(false), 600);
    }
  };

  if (!isOpen) return null;

  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-linear-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Trạng thái Supabase Realtime &amp; Cloud Database
              </h3>
              <p className="text-xs text-emerald-100">
                Đồng bộ đề kiểm tra &amp; bài nộp học sinh tức thì qua nhiều thiết bị
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1: Realtime Broadcast */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg mt-0.5">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-900">Kênh Realtime WebSocket</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                    SẴN SÀNG (0ms)
                  </span>
                </div>
                <p className="text-xs text-emerald-700">
                  Phát &amp; nhận bài ngay lập tức giữa máy Giáo viên và Học sinh đang mở.
                </p>
              </div>
            </div>

            {/* Card 2: Postgres Database Tables */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                health?.tablesReady
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-amber-200 bg-amber-50/60"
              }`}
            >
              <div
                className={`p-2 rounded-lg mt-0.5 ${
                  health?.tablesReady
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <Server className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      health?.tablesReady ? "text-emerald-900" : "text-amber-900"
                    }`}
                  >
                    Lưu trữ bảng PostgreSQL
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      health?.tablesReady
                        ? "bg-emerald-200 text-emerald-800"
                        : "bg-amber-200 text-amber-900"
                    }`}
                  >
                    {checking
                      ? "Đang kiểm tra..."
                      : health?.tablesReady
                      ? "ĐÃ KÍCH HOẠT"
                      : "CHƯA TẠO BẢNG"}
                  </span>
                </div>
                <p
                  className={`text-xs ${
                    health?.tablesReady ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {health?.tablesReady
                    ? "Đầy đủ 4 bảng: assignments, submissions, classes, eduai_system_state."
                    : "Cần chạy SQL 1 lần để lưu trữ vĩnh viễn ngay cả khi tắt toàn bộ trình duyệt."}
                </p>
              </div>
            </div>
          </div>

          {/* Table Breakdown */}
          {health && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-700">Chi tiết các bảng dữ liệu Supabase:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200">
                  {health.tableDetails.assignments ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span className="font-mono">assignments</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200">
                  {health.tableDetails.submissions ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span className="font-mono">submissions</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200">
                  {health.tableDetails.classes ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span className="font-mono">classes</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200">
                  {health.tableDetails.systemState ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span className="font-mono">system_state</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Activation Guide if tables are not yet created */}
          {!health?.tablesReady && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Hướng dẫn kích hoạt lưu trữ vĩnh viễn trên Supabase (30 giây)
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-amber-900">
                <li>
                  Nhấn nút <strong>"Sao chép mã SQL"</strong> bên dưới.
                </li>
                <li>
                  Mở <strong>Supabase SQL Editor</strong> (đường dẫn dự án <code>{projectRef}</code>).
                </li>
                <li>
                  Dán toàn bộ mã vừa sao chép vào ô soạn thảo và bấm nút <strong>"Run"</strong>.
                </li>
                <li>
                  Quay lại đây và nhấn <strong>"Kiểm tra kết nối"</strong>!
                </li>
              </ol>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Đã sao chép vào bộ nhớ tạm!" : "Sao chép mã SQL (1-Click)"}
                </button>
                <a
                  href={sqlEditorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  Mở Supabase SQL Editor
                </a>
              </div>
            </div>
          )}

          {/* Success notice when ready */}
          {health?.tablesReady && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-900 space-y-0.5">
                <div className="font-bold">Hệ thống đã kết nối hoàn hảo với Supabase Cloud!</div>
                <div>
                  Mọi đề bài bạn giao và mọi bài làm học sinh nộp sẽ được lưu trữ vĩnh viễn trên đám mây, tự động hiển thị trên tất cả các trình duyệt và thiết bị khác.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleForcePeerSync}
            disabled={manualSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0284C7] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Đồng bộ ngay đề và bài nộp từ các máy đang mở"
          >
            <Zap className={`w-3.5 h-3.5 ${manualSyncing ? "animate-spin" : ""}`} />
            {manualSyncing ? "Đang đồng bộ..." : "Phát sóng đồng bộ tức thì"}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runCheck}
              disabled={checking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
              Kiểm tra lại
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
