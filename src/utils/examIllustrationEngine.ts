import {
  Assignment,
  MultipleChoiceQuestion,
  SemesterPracticeTask,
  ShortAnswerQuestion,
  TheoryExam,
} from "../types/grading";

/**
 * Làm sạch nội dung câu hỏi để CHỈ nêu đúng nội dung câu hỏi:
 * - Bỏ các tiền tố như "[Tin học 3 - Chủ đề 1]", "[Câu 1 - Chủ đề 2]", "[Lớp 4 - Chủ đề 1 (Theo tài liệu...)]"
 * - Bỏ các cụm dẫn thừa như "Câu hỏi tự luận tình huống:", "Câu 1:", "Câu hỏi 1:"
 */
export function cleanQuestionText(raw: string): string {
  if (!raw) return "";
  let text = String(raw).trim();

  // Loại bỏ các thẻ ngoặc vuông ở đầu câu (lặp nhiều lần nếu có nhiều thẻ)
  while (/^\[[^\]]+\]\s*/.test(text)) {
    text = text.replace(/^\[[^\]]+\]\s*/, "").trim();
  }

  // Loại bỏ tiền tố "Câu X:" hoặc "Câu hỏi X:" hoặc "Câu tự luận X:" ở đầu
  text = text
    .replace(/^(?:Câu\s*hỏi\s*tự\s*luận\s*tình\s*huống(?:\s*\([^)]*\))?\s*[:.-]\s*)/i, "")
    .replace(/^(?:Câu\s*tự\s*luận\s*\d*\s*[:.-]\s*)/i, "")
    .replace(/^(?:Câu\s*hỏi\s*\d+\s*[:.-]\s*)/i, "")
    .replace(/^(?:Câu\s*\d+\s*[:.-]\s*)/i, "")
    .trim();

  // Loại bỏ lại thẻ ngoặc vuông nếu nằm sau chữ "Câu 1:"
  while (/^\[[^\]]+\]\s*/.test(text)) {
    text = text.replace(/^\[[^\]]+\]\s*/, "").trim();
  }

  text = text.replace(
    /^(?:Câu\s*hỏi\s*tự\s*luận\s*tình\s*huống(?:\s*\([^)]*\))?\s*[:.-]\s*)/i,
    ""
  );

  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }
  return text;
}

/**
 * Làm sạch ghi chú mô tả hình ảnh minh họa (bỏ vỏ [HÌNH ẢNH MINH HỌA: ...])
 */
export function cleanIllustrationCaption(
  rawNote?: string,
  fallbackText?: string
): string {
  const source = rawNote && String(rawNote).trim() ? rawNote : fallbackText || "";
  if (!source) return "";
  return String(source)
    .replace(/^\[?\s*HÌNH\s*ẢNH\s*MINH\s*HỌA\s*[:.-]?\s*/i, "")
    .replace(/\]\s*$/, "")
    .trim();
}

function escapeSvgText(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface PaletteTheme {
  bgStart: string;
  bgEnd: string;
  border: string;
  accent: string;
  accentSoft: string;
  badgeBg: string;
  badgeText: string;
}

const PALETTES: PaletteTheme[] = [
  {
    bgStart: "#F0F9FF",
    bgEnd: "#E0F2FE",
    border: "#7DD3FC",
    accent: "#0284C7",
    accentSoft: "#BAE6FD",
    badgeBg: "#0284C7",
    badgeText: "#FFFFFF",
  },
  {
    bgStart: "#ECFDF5",
    bgEnd: "#D1FAE5",
    border: "#6EE7B7",
    accent: "#059669",
    accentSoft: "#A7F3D0",
    badgeBg: "#059669",
    badgeText: "#FFFFFF",
  },
  {
    bgStart: "#FFFBEB",
    bgEnd: "#FEF3C7",
    border: "#FCD34D",
    accent: "#D97706",
    accentSoft: "#FDE68A",
    badgeBg: "#D97706",
    badgeText: "#FFFFFF",
  },
  {
    bgStart: "#EEF2FF",
    bgEnd: "#E0E7FF",
    border: "#A5B4FC",
    accent: "#4F46E5",
    accentSoft: "#C7D2FE",
    badgeBg: "#4F46E5",
    badgeText: "#FFFFFF",
  },
  {
    bgStart: "#FDF2F8",
    bgEnd: "#FCE7F3",
    border: "#F9A8D4",
    accent: "#DB2777",
    accentSoft: "#FBCFE8",
    badgeBg: "#DB2777",
    badgeText: "#FFFFFF",
  },
];

/**
 * Hệ thống tự động tạo Hình ảnh minh họa trực quan (SVG Data URL) cho câu hỏi Tin học Tiểu học.
 * Hỗ trợ đổi mẫu hình khác thông qua tham số variantIndex (0, 1, 2, 3, 4...).
 */
export function generateIllustrationDataUrl(
  contextText: string,
  arg2?: number | string,
  arg3?: number | string,
  arg4?: number | string
): string {
  const variantIndex =
    typeof arg4 === "number"
      ? arg4
      : typeof arg3 === "number"
      ? arg3
      : typeof arg2 === "number"
      ? arg2
      : 0;
  const secondaryText = typeof arg2 === "string" ? arg2 : "";
  const tertiaryText = typeof arg3 === "string" ? arg3 : "";
  const combinedText = `${contextText || ""} ${secondaryText} ${tertiaryText}`.trim();
  const norm = String(combinedText || "").toLowerCase();
  const v = Math.abs(Math.floor(variantIndex || 0));
  const theme = PALETTES[v % PALETTES.length];
  const caption =
    cleanIllustrationCaption(contextText, secondaryText) ||
    "Hình minh họa câu hỏi Tin học";
  const shortCaption =
    caption.length > 78 ? caption.slice(0, 75).trim() + "..." : caption;

  // Chọn chủ đề đồ họa dựa theo nội dung câu hỏi/chú thích hoặc xoay vòng khi người dùng bấm "Đổi hình khác"
  type SceneType =
    | "desktop_pc"
    | "keyboard_fj"
    | "posture"
    | "mouse_actions"
    | "browser_internet"
    | "folder_tree"
    | "word_editor"
    | "powerpoint_slide"
    | "scratch_blocks"
    | "safety_copyright"
    | "info_types"
    | "shutdown_power";

  let detectedScene: SceneType = "desktop_pc";

  if (/hàng phím|phím f|phím j|bàn phím|10 ngón|gõ phím|caps lock|shift/.test(norm)) {
    detectedScene = "keyboard_fj";
  } else if (/tư thế ngồi|50\s*cm|80\s*cm|khoảng cách từ mắt|bảo vệ mắt/.test(norm)) {
    detectedScene = "posture";
  } else if (/thao tác chuột|nháy đúp|con trỏ chuột|nút trái|nút phải|cầm chuột/.test(norm)) {
    detectedScene = "mouse_actions";
  } else if (/scratch|lá cờ xanh|khối lệnh|nhân vật|repeat|forever|biến|chú mèo/.test(norm)) {
    detectedScene = "scratch_blocks";
  } else if (/powerpoint|trang chiếu|trình chiếu|slide|transition|f5/.test(norm)) {
    detectedScene = "powerpoint_slide";
  } else if (/word|soạn thảo|in đậm|căn giữa|căn đều|phông chữ|cỡ chữ|telex|vni/.test(norm)) {
    detectedScene = "word_editor";
  } else if (/thư mục|folder|cây thư mục|tệp|sao chép|di chuyển|đổi tên|file explorer/.test(norm)) {
    detectedScene = "folder_tree";
  } else if (/trình duyệt|chrome|edge|cốc cốc|internet|trang web|thời tiết|từ khóa|siêu liên kết/.test(norm)) {
    detectedScene = "browser_internet";
  } else if (/thông tin cá nhân|mật khẩu|bản quyền|tác giả|an toàn|người lạ/.test(norm)) {
    detectedScene = "safety_copyright";
  } else if (/3 dạng thông tin|dạng chữ|dạng âm thanh|đèn tín hiệu|thông tin và quyết định/.test(norm)) {
    detectedScene = "info_types";
  } else if (/shut down|tắt máy|nút nguồn|power/.test(norm)) {
    detectedScene = "shutdown_power";
  } else {
    detectedScene = "desktop_pc";
  }

  // Nếu giáo viên bấm "Đổi hình khác" nhiều lần (v >= 5), cho phép chuyển sang các mẫu biểu đồ/giao diện khác nhau
  const allScenes: SceneType[] = [
    detectedScene,
    "desktop_pc",
    "keyboard_fj",
    "browser_internet",
    "folder_tree",
    "word_editor",
    "powerpoint_slide",
    "scratch_blocks",
    "mouse_actions",
    "posture",
    "safety_copyright",
    "info_types",
  ];
  const activeScene = v === 0 ? detectedScene : allScenes[v % allScenes.length];

  let centerArt = "";

  if (activeScene === "desktop_pc") {
    const showNumbers = v % 2 === 0;
    centerArt = `
      <!-- Màn hình (1) -->
      <rect x="95" y="34" width="210" height="122" rx="10" fill="#1E293B" stroke="#0F172A" stroke-width="3"/>
      <rect x="105" y="44" width="190" height="96" rx="6" fill="#38BDF8"/>
      <rect x="120" y="58" width="90" height="14" rx="4" fill="#FFFFFF" opacity="0.9"/>
      <rect x="120" y="80" width="140" height="10" rx="3" fill="#E0F2FE"/>
      <rect x="120" y="96" width="115" height="10" rx="3" fill="#E0F2FE"/>
      <rect x="182" y="156" width="36" height="18" fill="#475569"/>
      <rect x="150" y="172" width="100" height="8" rx="4" fill="#334155"/>
      <circle cx="110" cy="48" r="12" fill="${theme.badgeBg}"/>
      <text x="110" y="53" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFF">${showNumbers ? "1" : "MH"}</text>

      <!-- Thân máy (2) -->
      <rect x="335" y="36" width="82" height="144" rx="8" fill="#334155" stroke="#0F172A" stroke-width="3"/>
      <rect x="349" y="52" width="54" height="12" rx="3" fill="#0F172A"/>
      <circle cx="376" cy="92" r="12" fill="#0EA5E9" stroke="#E0F2FE" stroke-width="2"/>
      <circle cx="376" cy="122" r="5" fill="#22C55E"/>
      <circle cx="402" cy="50" r="12" fill="${theme.badgeBg}"/>
      <text x="402" y="55" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFF">${showNumbers ? "2" : "TM"}</text>

      <!-- Bàn phím (3) -->
      <rect x="85" y="190" width="225" height="44" rx="7" fill="#E2E8F0" stroke="#334155" stroke-width="2.5"/>
      <g fill="#94A3B8">
        <rect x="97" y="198" width="16" height="8" rx="2"/><rect x="117" y="198" width="16" height="8" rx="2"/><rect x="137" y="198" width="16" height="8" rx="2"/><rect x="157" y="198" width="16" height="8" rx="2"/><rect x="177" y="198" width="16" height="8" rx="2"/><rect x="197" y="198" width="16" height="8" rx="2"/><rect x="217" y="198" width="16" height="8" rx="2"/><rect x="237" y="198" width="16" height="8" rx="2"/>
        <rect x="102" y="210" width="16" height="8" rx="2"/><rect x="122" y="210" width="16" height="8" rx="2"/><rect x="142" y="210" width="16" height="8" rx="2" fill="#F59E0B"/><rect x="162" y="210" width="16" height="8" rx="2"/><rect x="182" y="210" width="16" height="8" rx="2" fill="#F59E0B"/><rect x="202" y="210" width="16" height="8" rx="2"/><rect x="222" y="210" width="16" height="8" rx="2"/>
        <rect x="132" y="221" width="110" height="8" rx="2" fill="#64748B"/>
      </g>
      <circle cx="98" cy="196" r="12" fill="${theme.badgeBg}"/>
      <text x="98" y="201" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFF">${showNumbers ? "3" : "BP"}</text>

      <!-- Chuột máy tính (4) -->
      <rect x="445" y="176" width="46" height="62" rx="23" fill="#F8FAFC" stroke="#334155" stroke-width="2.5"/>
      <line x1="468" y1="176" x2="468" y2="202" stroke="#334155" stroke-width="2"/>
      <line x1="445" y1="202" x2="491" y2="202" stroke="#334155" stroke-width="2"/>
      <rect x="465" y="183" width="6" height="12" rx="3" fill="#0284C7"/>
      <circle cx="496" cy="182" r="12" fill="${theme.badgeBg}"/>
      <text x="496" y="187" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFF">${showNumbers ? "4" : "CM"}</text>
    `;
  } else if (activeScene === "keyboard_fj") {
    const keys = ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";"];
    const keyItems = keys
      .map((k, idx) => {
        const x = 68 + idx * 45;
        const isFJ = k === "F" || k === "J";
        return `
          <rect x="${x}" y="82" width="39" height="46" rx="7" fill="${
          isFJ ? "#FEF3C7" : "#FFFFFF"
        }" stroke="${isFJ ? "#D97706" : "#475569"}" stroke-width="${isFJ ? "3" : "2"}"/>
          <text x="${x + 19.5}" y="109" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${
          isFJ ? "#B45309" : "#1E293B"
        }">${k}</text>
          ${
            isFJ
              ? `<rect x="${x + 12}" y="118" width="15" height="4" rx="2" fill="#D97706"/>`
              : ""
          }
        `;
      })
      .join("");
    centerArt = `
      <rect x="48" y="42" width="484" height="175" rx="14" fill="#1E293B" stroke="#0F172A" stroke-width="3"/>
      <text x="290" y="66" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#E0F2FE">HÀNG PHÍM CƠ SỞ (HAI PHÍM CÓ GAI F VÀ J)</text>
      ${keyItems}
      <rect x="165" y="145" width="250" height="32" rx="7" fill="#E2E8F0" stroke="#475569" stroke-width="2"/>
      <text x="290" y="166" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#334155">PHÍM CÁCH (SPACEBAR)</text>
      <text x="215" y="202" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FDE68A">▲ Ngón trỏ trái (F)</text>
      <text x="395" y="202" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FDE68A">▲ Ngón trỏ phải (J)</text>
    `;
  } else if (activeScene === "posture") {
    centerArt = `
      <!-- Bàn học & Màn hình -->
      <line x1="80" y1="210" x2="500" y2="210" stroke="#475569" stroke-width="6" stroke-linecap="round"/>
      <rect x="355" y="78" width="105" height="82" rx="8" fill="#1E293B" stroke="#0F172A" stroke-width="3"/>
      <rect x="363" y="86" width="89" height="66" rx="4" fill="#38BDF8"/>
      <rect x="398" y="160" width="20" height="35" fill="#475569"/>
      <rect x="378" y="195" width="60" height="12" rx="4" fill="#334155"/>
      <!-- Học sinh ngồi thẳng lưng -->
      <circle cx="175" cy="92" r="22" fill="#FDE68A" stroke="#B45309" stroke-width="2.5"/>
      <line x1="175" y1="114" x2="175" y2="185" stroke="#0284C7" stroke-width="14" stroke-linecap="round"/>
      <line x1="175" y1="138" x2="250" y2="180" stroke="#0284C7" stroke-width="9" stroke-linecap="round"/>
      <!-- Đường đo khoảng cách 50 - 80 cm -->
      <line x1="205" y1="92" x2="345" y2="92" stroke="#DC2626" stroke-width="2.5" stroke-dasharray="6,4"/>
      <rect x="225" y="62" width="105" height="24" rx="6" fill="#FEE2E2" stroke="#DC2626" stroke-width="1.5"/>
      <text x="277" y="78" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#B91C1C">50 cm - 80 cm</text>
      <text x="175" y="232" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0F172A">Ngồi thẳng lưng · Mắt ngang màn hình</text>
    `;
  } else if (activeScene === "mouse_actions") {
    centerArt = `
      <rect x="215" y="38" width="150" height="190" rx="75" fill="#FFFFFF" stroke="#1E293B" stroke-width="4"/>
      <path d="M 215 115 L 290 115 L 290 38 A 75 75 0 0 0 215 115 Z" fill="#BAE6FD" stroke="#1E293B" stroke-width="3"/>
      <path d="M 290 115 L 365 115 A 75 75 0 0 0 290 38 Z" fill="#FED7AA" stroke="#1E293B" stroke-width="3"/>
      <rect x="280" y="62" width="20" height="38" rx="10" fill="#0284C7" stroke="#0F172A" stroke-width="2"/>
      <text x="130" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0369A1">Nút trái chuột</text>
      <line x1="180" y1="78" x2="245" y2="78" stroke="#0369A1" stroke-width="2.5"/>
      <text x="455" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#C2410C">Nút phải chuột</text>
      <line x1="335" y1="78" x2="400" y2="78" stroke="#C2410C" stroke-width="2.5"/>
      <text x="290" y="168" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#334155">Thân chuột máy tính</text>
    `;
  } else if (activeScene === "browser_internet") {
    centerArt = `
      <rect x="65" y="36" width="450" height="192" rx="12" fill="#FFFFFF" stroke="#334155" stroke-width="3"/>
      <rect x="65" y="36" width="450" height="36" rx="12" fill="#E2E8F0"/>
      <circle cx="88" cy="54" r="6" fill="#EF4444"/>
      <circle cx="108" cy="54" r="6" fill="#F59E0B"/>
      <circle cx="128" cy="54" r="6" fill="#22C55E"/>
      <rect x="150" y="43" width="290" height="22" rx="11" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.5"/>
      <text x="295" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0284C7">https://thieunhi.edu.vn - Tìm kiếm &amp; Học tập</text>
      <!-- Nút X góc phải -->
      <rect x="480" y="43" width="24" height="22" rx="5" fill="#EF4444"/>
      <text x="492" y="59" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF">X</text>
      <!-- Nội dung trang web -->
      <circle cx="145" cy="135" r="36" fill="#38BDF8" opacity="0.25"/>
      <circle cx="145" cy="135" r="24" fill="#0284C7"/>
      <text x="145" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF">WEB</text>
      <rect x="205" y="95" width="275" height="22" rx="6" fill="#F1F5F9" stroke="#CBD5E1"/>
      <text x="220" y="110" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0F172A">🔍 Nhập từ khóa tìm kiếm thông tin...</text>
      <rect x="205" y="130" width="130" height="72" rx="8" fill="#E0F2FE" stroke="#7DD3FC"/>
      <text x="270" y="162" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0369A1">☀️ Dự báo</text>
      <text x="270" y="182" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#0369A1">Thời tiết: 26°C</text>
      <rect x="350" y="130" width="130" height="72" rx="8" fill="#DCFCE7" stroke="#86EFAC"/>
      <text x="415" y="162" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#15803D">📚 Học tập</text>
      <text x="415" y="182" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#15803D">Siêu liên kết</text>
    `;
  } else if (activeScene === "folder_tree") {
    centerArt = `
      <rect x="65" y="36" width="450" height="192" rx="12" fill="#FFFFFF" stroke="#334155" stroke-width="2.5"/>
      <rect x="85" y="52" width="150" height="34" rx="7" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
      <text x="160" y="74" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#92400E">📁 Ổ đĩa (D:) Học tập</text>
      <line x1="140" y1="86" x2="140" y2="185" stroke="#64748B" stroke-width="2.5"/>
      <line x1="140" y1="120" x2="195" y2="120" stroke="#64748B" stroke-width="2.5"/>
      <line x1="140" y1="185" x2="195" y2="185" stroke="#64748B" stroke-width="2.5"/>

      <rect x="195" y="102" width="155" height="34" rx="7" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
      <text x="272" y="124" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#92400E">📁 Thư mục Tin học</text>

      <rect x="195" y="167" width="155" height="34" rx="7" fill="#E0F2FE" stroke="#0284C7" stroke-width="2"/>
      <text x="272" y="189" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0369A1">📄 BaiTap_Lop.docx</text>

      <rect x="372" y="72" width="122" height="128" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
      <text x="433" y="96" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#334155">Thao tác Thư mục</text>
      <text x="433" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#0284C7">• New Folder</text>
      <text x="433" y="142" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#059669">• Copy / Paste</text>
      <text x="433" y="164" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#D97706">• Rename / Delete</text>
    `;
  } else if (activeScene === "word_editor") {
    centerArt = `
      <rect x="65" y="34" width="450" height="194" rx="10" fill="#FFFFFF" stroke="#1E40AF" stroke-width="3"/>
      <rect x="65" y="34" width="450" height="42" rx="8" fill="#EFF6FF"/>
      <!-- Nút B I U và căn lề -->
      <rect x="82" y="43" width="28" height="24" rx="4" fill="#1D4ED8"/>
      <text x="96" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF">B</text>
      <rect x="116" y="43" width="28" height="24" rx="4" fill="#FFFFFF" stroke="#93C5FD"/>
      <text x="130" y="60" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-style="italic" font-weight="bold" fill="#1E3A8A">I</text>
      <rect x="150" y="43" width="28" height="24" rx="4" fill="#FFFFFF" stroke="#93C5FD"/>
      <text x="164" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" text-decoration="underline" font-weight="bold" fill="#1E3A8A">U</text>
      <rect x="190" y="43" width="110" height="24" rx="4" fill="#FFFFFF" stroke="#93C5FD"/>
      <text x="245" y="59" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#1E3A8A">Times New Roman · 18</text>
      <rect x="312" y="43" width="90" height="24" rx="4" fill="#FEE2E2" stroke="#EF4444"/>
      <text x="357" y="59" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#DC2626">Căn giữa</text>
      <!-- Trang soạn thảo -->
      <text x="290" y="106" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#DC2626">QUÊ HƯƠNG TƯƠI ĐẸP</text>
      <rect x="100" y="122" width="240" height="10" rx="3" fill="#94A3B8"/>
      <rect x="100" y="140" width="240" height="10" rx="3" fill="#94A3B8"/>
      <rect x="100" y="158" width="190" height="10" rx="3" fill="#94A3B8"/>
      <rect x="365" y="116" width="115" height="75" rx="8" fill="#E0F2FE" stroke="#0284C7" stroke-width="2"/>
      <text x="422" y="158" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0369A1">🖼️ Ảnh minh họa</text>
    `;
  } else if (activeScene === "powerpoint_slide") {
    centerArt = `
      <rect x="65" y="34" width="450" height="194" rx="10" fill="#FFFFFF" stroke="#C2410C" stroke-width="3"/>
      <rect x="65" y="34" width="450" height="34" rx="8" fill="#FFEDD5"/>
      <text x="175" y="56" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#9A3412">📊 PowerPoint · New Slide · Transitions · F5</text>
      <!-- Cột slide thu nhỏ bên trái -->
      <rect x="78" y="80" width="82" height="42" rx="5" fill="#FED7AA" stroke="#EA580C" stroke-width="2"/>
      <text x="119" y="105" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#9A3412">Slide 1</text>
      <rect x="78" y="130" width="82" height="42" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
      <text x="119" y="155" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#64748B">Slide 2</text>
      <!-- Trang chiếu chính -->
      <rect x="175" y="80" width="320" height="132" rx="8" fill="#FFF7ED" stroke="#FB923C" stroke-width="2"/>
      <text x="335" y="114" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#C2410C">CHỦ ĐỀ BÀI TRÌNH CHIẾU</text>
      <rect x="200" y="130" width="140" height="64" rx="6" fill="#FFFFFF" stroke="#FDBA74"/>
      <text x="270" y="166" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#9A3412">Nội dung văn bản</text>
      <rect x="355" y="130" width="120" height="64" rx="6" fill="#E0F2FE" stroke="#38BDF8"/>
      <text x="415" y="166" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0369A1">🖼️ Hình ảnh</text>
    `;
  } else if (activeScene === "scratch_blocks") {
    centerArt = `
      <!-- Khối lệnh Scratch bên trái -->
      <rect x="68" y="42" width="235" height="36" rx="8" fill="#F59E0B" stroke="#B45309" stroke-width="2"/>
      <text x="185" y="65" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">🚩 Khi bấm vào Lá cờ xanh</text>

      <rect x="68" y="84" width="235" height="34" rx="8" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2"/>
      <text x="185" y="106" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">Di chuyển (100) bước</text>

      <rect x="68" y="124" width="235" height="34" rx="8" fill="#8B5CF6" stroke="#6D28D9" stroke-width="2"/>
      <text x="185" y="146" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">Nói &quot;Xin chào!&quot; trong 2 giây</text>

      <rect x="68" y="164" width="235" height="34" rx="8" fill="#EC4899" stroke="#BE185D" stroke-width="2"/>
      <text x="185" y="186" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">🔊 Phát âm thanh Meow</text>

      <!-- Sân khấu nhân vật bên phải -->
      <rect x="325" y="42" width="188" height="162" rx="12" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.5"/>
      <rect x="342" y="54" width="120" height="28" rx="12" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5"/>
      <text x="402" y="72" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0369A1">Xin chào các bạn!</text>
      <circle cx="418" cy="138" r="34" fill="#F97316" stroke="#C2410C" stroke-width="2.5"/>
      <polygon points="392,112 402,88 414,108" fill="#F97316" stroke="#C2410C" stroke-width="2"/>
      <polygon points="444,112 434,88 422,108" fill="#F97316" stroke="#C2410C" stroke-width="2"/>
      <circle cx="406" cy="132" r="4" fill="#FFFFFF"/><circle cx="430" cy="132" r="4" fill="#FFFFFF"/>
      <text x="418" y="154" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">SCRATCH</text>
    `;
  } else if (activeScene === "safety_copyright") {
    centerArt = `
      <rect x="85" y="42" width="190" height="170" rx="14" fill="#ECFDF5" stroke="#059669" stroke-width="2.5"/>
      <circle cx="180" cy="95" r="28" fill="#10B981"/>
      <text x="180" y="103" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF">🔒</text>
      <text x="180" y="148" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#065F46">BẢO VỆ THÔNG TIN</text>
      <text x="180" y="168" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#047857">Không chia sẻ mật khẩu</text>
      <text x="180" y="186" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#047857">&amp; số điện thoại cho người lạ</text>

      <rect x="305" y="42" width="190" height="170" rx="14" fill="#EFF6FF" stroke="#0284C7" stroke-width="2.5"/>
      <circle cx="400" cy="95" r="28" fill="#0284C7"/>
      <text x="400" y="103" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF">©</text>
      <text x="400" y="148" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0369A1">TÔN TRỌNG BẢN QUYỀN</text>
      <text x="400" y="168" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#0369A1">Ghi rõ nguồn tác giả</text>
      <text x="400" y="186" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#0369A1">Dùng phần mềm hợp pháp</text>
    `;
  } else if (activeScene === "shutdown_power") {
    centerArt = `
      <rect x="135" y="40" width="310" height="175" rx="12" fill="#1E293B" stroke="#0F172A" stroke-width="3"/>
      <rect x="155" y="58" width="150" height="112" rx="8" fill="#334155" stroke="#64748B" stroke-width="2"/>
      <rect x="168" y="72" width="124" height="28" rx="5" fill="#EF4444"/>
      <text x="230" y="91" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">⏻ Shut down</text>
      <rect x="168" y="106" width="124" height="24" rx="5" fill="#475569"/>
      <text x="230" y="122" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#E2E8F0">Restart</text>
      <rect x="155" y="176" width="90" height="26" rx="6" fill="#0284C7"/>
      <text x="200" y="194" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">⊞ Start</text>
      <circle cx="375" cy="118" r="38" fill="#DCFCE7" stroke="#22C55E" stroke-width="3"/>
      <text x="375" y="114" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#15803D">TẮT MÁY</text>
      <text x="375" y="132" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#15803D">ĐÚNG CÁCH</text>
    `;
  } else {
    centerArt = `
      <!-- 3 dạng thông tin: Chữ - Hình ảnh - Âm thanh -->
      <rect x="65" y="50" width="135" height="150" rx="12" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.5"/>
      <text x="132" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#0284C7">Aa</text>
      <text x="132" y="138" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0F172A">1. Dạng Chữ</text>
      <text x="132" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#475569">Sách, báo, biển chữ</text>

      <rect x="222" y="50" width="135" height="150" rx="12" fill="#FFFFFF" stroke="#059669" stroke-width="2.5"/>
      <text x="290" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="28">🖼️</text>
      <text x="290" y="138" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0F172A">2. Dạng Hình ảnh</text>
      <text x="290" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#475569">Tranh vẽ, đèn tín hiệu</text>

      <rect x="380" y="50" width="135" height="150" rx="12" fill="#FFFFFF" stroke="#D97706" stroke-width="2.5"/>
      <text x="447" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="28">🔊</text>
      <text x="447" y="138" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0F172A">3. Dạng Âm thanh</text>
      <text x="447" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#475569">Tiếng trống, bài hát</text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="580" height="280" viewBox="0 0 580 280">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.bgStart}"/>
        <stop offset="100%" stop-color="${theme.bgEnd}"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="576" height="276" rx="16" fill="url(#bgGrad)" stroke="${theme.border}" stroke-width="3"/>
    ${centerArt}
    <rect x="16" y="242" width="548" height="26" rx="8" fill="#FFFFFF" opacity="0.92"/>
    <text x="290" y="259" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="${theme.accent}">
      ${escapeSvgText(shortCaption)}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Tự động làm sạch nội dung câu hỏi và đính kèm Hình ảnh minh họa tự động cho toàn bộ đề kiểm tra
 */
export function enrichExamWithAutoIllustrations(
  exam: TheoryExam,
  _grade?: string
): TheoryExam {
  const cleanedMcqs: MultipleChoiceQuestion[] = (exam.multipleChoice || []).map((q, idx) => {
    const cleanedQuestion = cleanQuestionText(q.question);
    const noteText =
      q.illustrationNote && q.illustrationNote.trim()
        ? q.illustrationNote
        : cleanedQuestion;
    const variant = typeof q.illustrationVariant === "number" ? q.illustrationVariant : idx;
    const autoImg =
      q.illustrationImageDataUrl && q.illustrationImageDataUrl.trim()
        ? q.illustrationImageDataUrl
        : generateIllustrationDataUrl(noteText, variant);

    return {
      ...q,
      question: cleanedQuestion,
      illustrationNote: cleanIllustrationCaption(q.illustrationNote) || cleanedQuestion,
      illustrationImageDataUrl: autoImg,
      illustrationVariant: variant,
    };
  });

  const rawEssays: ShortAnswerQuestion[] =
    exam.shortAnswers && exam.shortAnswers.length > 0
      ? exam.shortAnswers
      : exam.shortAnswer && exam.shortAnswer.points > 0
      ? [exam.shortAnswer]
      : [];

  const cleanedEssays: ShortAnswerQuestion[] = rawEssays.map((sa, idx) => {
    const cleanedQuestion = cleanQuestionText(sa.question);
    const noteText =
      sa.illustrationNote && sa.illustrationNote.trim()
        ? sa.illustrationNote
        : cleanedQuestion;
    const variant = typeof sa.illustrationVariant === "number" ? sa.illustrationVariant : idx;
    const autoImg =
      sa.illustrationImageDataUrl && sa.illustrationImageDataUrl.trim()
        ? sa.illustrationImageDataUrl
        : generateIllustrationDataUrl(noteText, variant);

    return {
      ...sa,
      question: cleanedQuestion,
      illustrationNote: cleanIllustrationCaption(sa.illustrationNote) || cleanedQuestion,
      illustrationImageDataUrl: autoImg,
      illustrationVariant: variant,
    };
  });

  const cleanedPracticeTasks: SemesterPracticeTask[] | undefined =
    exam.semesterBlueprint?.practiceTasks?.map((pt, idx) => {
      const noteText =
        pt.illustrationNote && pt.illustrationNote.trim()
          ? pt.illustrationNote
          : `${pt.softwareType} ${pt.title} ${pt.instructions}`;
      const variant = typeof pt.illustrationVariant === "number" ? pt.illustrationVariant : idx;
      const autoImg =
        pt.illustrationImageDataUrl && pt.illustrationImageDataUrl.trim()
          ? pt.illustrationImageDataUrl
          : generateIllustrationDataUrl(noteText, variant);
      return {
        ...pt,
        title: cleanQuestionText(pt.title),
        illustrationNote: cleanIllustrationCaption(pt.illustrationNote) || pt.title,
        illustrationImageDataUrl: autoImg,
        illustrationVariant: variant,
      };
    });

  return {
    ...exam,
    multipleChoice: cleanedMcqs,
    shortAnswers: cleanedEssays,
    shortAnswer: cleanedEssays[0] || {
      ...exam.shortAnswer,
      question: cleanQuestionText(exam.shortAnswer?.question || ""),
    },
    semesterBlueprint: exam.semesterBlueprint
      ? {
          ...exam.semesterBlueprint,
          practiceTasks: cleanedPracticeTasks || [],
        }
      : undefined,
  };
}

export interface ShuffledMcqOption {
  displayIndex: number; // 0 -> A, 1 -> B, 2 -> C, 3 -> D
  originalIndex: number; // chỉ số gốc trong q.options để chấm điểm
  displayLabel: string; // Chuỗi hiển thị đã gắn lại nhãn A., B., C., D. theo thứ tự mới
  cleanOptionText: string;
}

function hashSeedString(seedStr: string): number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Xáo trộn thứ tự các đáp án A, B, C, D cho từng học sinh khác nhau (vì học sinh ngồi gần nhau trong phòng máy)
 * nhưng giữ ổn định trong suốt lượt làm bài của học sinh đó.
 */
export function getShuffledMcqOptions(
  options: string[],
  seedKey: string
): ShuffledMcqOption[] {
  const letters = ["A", "B", "C", "D", "E", "F"];
  const items = (options || []).map((opt, idx) => {
    const cleanOptionText = String(opt || "")
      .replace(/^[A-F][.:)]\s*/i, "")
      .trim();
    return {
      originalIndex: idx,
      cleanOptionText,
    };
  });

  // Fisher-Yates shuffle dựa trên seedKey (Mã học sinh + Mã đề + Mã câu hỏi + Lượt làm bài)
  let seed = hashSeedString(seedKey || "default-seed");
  const nextRand = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }

  return shuffled.map((item, displayIdx) => {
    const letter = letters[displayIdx] || String(displayIdx + 1);
    return {
      displayIndex: displayIdx,
      originalIndex: item.originalIndex,
      cleanOptionText: item.cleanOptionText,
      displayLabel: `${letter}. ${item.cleanOptionText}`,
    };
  });
}

/**
 * Kiểm tra một đề kiểm tra/bài tập có được giao cho lớp học hiện tại hay không
 */
export function isAssignmentAssignedToClass(
  assignment: Assignment,
  className: string,
  classGrade: string
): boolean {
  if (assignment.grade !== classGrade) return false;

  if (Array.isArray(assignment.targetClassNames) && assignment.targetClassNames.length > 0) {
    return assignment.targetClassNames.includes(className);
  }

  const rawClassStr = String(assignment.className || "").trim();
  if (!rawClassStr) return true;

  if (
    rawClassStr.toLowerCase().includes("tất cả") ||
    rawClassStr.toLowerCase().includes("cả khối")
  ) {
    return true;
  }

  const classList = rawClassStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (classList.length > 1) {
    return classList.includes(className);
  }

  // Tương thích với các đề giao cho 1 lớp cụ thể hoặc cùng khối
  return classList.includes(className);
}

export function isAssignmentForClass(
  assignment: Assignment,
  className: string,
  classGrade?: string
): boolean {
  return isAssignmentAssignedToClass(
    assignment,
    className,
    classGrade || assignment.grade
  );
}

export function formatTargetClassesLabel(
  targetClassNames: string[],
  grade: string
): string {
  const unique = Array.from(
    new Set((targetClassNames || []).map((s) => s.trim()).filter(Boolean))
  );
  if (unique.length === 0) return grade;
  return unique.join(", ");
}

export function buildStudentShuffledMcqMap(
  mcqs: MultipleChoiceQuestion[],
  studentSeed: string
): Record<
  string,
  {
    shuffledOptions: string[];
    shuffledToOriginalIndex: number[];
    originalToShuffledIndex: number[];
  }
> {
  const map: Record<
    string,
    {
      shuffledOptions: string[];
      shuffledToOriginalIndex: number[];
      originalToShuffledIndex: number[];
    }
  > = {};

  (mcqs || []).forEach((q, qIdx) => {
    const qId = q.id || `mcq-${qIdx}`;
    const shuffledItems = getShuffledMcqOptions(
      q.options || [],
      `${studentSeed}_${qId}_${qIdx}`
    );
    const shuffledOptions = shuffledItems.map((item) => item.displayLabel);
    const shuffledToOriginalIndex = shuffledItems.map(
      (item) => item.originalIndex
    );
    const originalToShuffledIndex: number[] = [];
    shuffledToOriginalIndex.forEach((origIdx, dispIdx) => {
      originalToShuffledIndex[origIdx] = dispIdx;
    });
    map[qId] = {
      shuffledOptions,
      shuffledToOriginalIndex,
      originalToShuffledIndex,
    };
  });

  return map;
}

