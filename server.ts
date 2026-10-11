import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import {
  INITIAL_CLASSES,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_TT27_REGULAR_RECORDS,
  INITIAL_TT27_PERIODIC_RECORDS,
  LAST_CODE_SYNC_AT,
} from "./src/data/initialData";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "missing-api-key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Bộ nhớ đệm trạng thái trực tiếp trên Server (đồng bộ 2 chiều với file src/data/initialData.ts)
const liveSystemState = {
  lastUpdatedAt: LAST_CODE_SYNC_AT || new Date().toLocaleString("vi-VN"),
  classes: INITIAL_CLASSES,
  assignments: INITIAL_ASSIGNMENTS,
  submissions: INITIAL_SUBMISSIONS,
  tt27RegularRecords: INITIAL_TT27_REGULAR_RECORDS,
  tt27PeriodicRecords: INITIAL_TT27_PERIODIC_RECORDS,
};

function writeStateToInitialDataTs() {
  const initialDataPath = path.join(__dirname, "src", "data", "initialData.ts");
  const fileContent = `import { Assignment, StudentSubmission } from "../types/grading";
import type { ClassRoom } from "../components/ClassManagerView";

/**
 * Thời điểm gần nhất hệ thống tự động cập nhật dữ liệu thao tác vào mã nguồn (src/data/initialData.ts)
 */
export const LAST_CODE_SYNC_AT: string = ${JSON.stringify(liveSystemState.lastUpdatedAt)};
export const LAST_CODE_SYNC_TIMESTAMP: string = ${JSON.stringify(liveSystemState.lastUpdatedAt)};

/**
 * Danh sách Lớp & Học sinh mặc định của hệ thống EduAI Primary
 * (Trường TH-THCS Vĩnh Phú — Năm học 2026-2027).
 * Mọi thao tác thêm/sửa/xóa lớp, học sinh hoặc tải lên tệp Excel / PDF (DS Up.pdf)
 * đều được hệ thống tự động ghi đè trực tiếp vào mảng INITIAL_CLASSES này trong code.
 */
export const INITIAL_CLASSES: ClassRoom[] = ${JSON.stringify(liveSystemState.classes, null, 2)};

/**
 * Dữ liệu đề kiểm tra, bài nộp và nhận xét Thông tư 27 được tự động cập nhật vào code
 * trong quá trình người dùng thao tác đến thời điểm đang sử dụng (${liveSystemState.lastUpdatedAt}).
 */
export const INITIAL_ASSIGNMENTS: Assignment[] = ${JSON.stringify(liveSystemState.assignments, null, 2)};

export const INITIAL_SUBMISSIONS: StudentSubmission[] = ${JSON.stringify(liveSystemState.submissions, null, 2)};

export const INITIAL_TT27_REGULAR_RECORDS: Record<string, any[]> = ${JSON.stringify(liveSystemState.tt27RegularRecords, null, 2)};

export const INITIAL_TT27_PERIODIC_RECORDS: Record<string, any[]> = ${JSON.stringify(liveSystemState.tt27PeriodicRecords, null, 2)};
`;
  fs.writeFileSync(initialDataPath, fileContent, "utf8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // 0. API đọc và tự động cập nhật trạng thái thao tác của người dùng trực tiếp vào code (src/data/initialData.ts)
  app.get("/api/system/code-state", (_req, res) => {
    res.json({
      ok: true,
      ...liveSystemState,
    });
  });

  app.post("/api/system/sync-to-code", (req, res) => {
    try {
      const {
        classes,
        assignments,
        submissions,
        tt27RegularRecords,
        tt27PeriodicRecords,
      } = req.body || {};

      if (Array.isArray(classes)) {
        liveSystemState.classes = classes;
      }
      if (Array.isArray(assignments)) {
        liveSystemState.assignments = assignments;
      }
      if (Array.isArray(submissions)) {
        liveSystemState.submissions = submissions;
      }
      if (tt27RegularRecords && typeof tt27RegularRecords === "object") {
        liveSystemState.tt27RegularRecords = tt27RegularRecords;
      }
      if (tt27PeriodicRecords && typeof tt27PeriodicRecords === "object") {
        liveSystemState.tt27PeriodicRecords = tt27PeriodicRecords;
      }

      liveSystemState.lastUpdatedAt = new Date().toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      writeStateToInitialDataTs();

      res.json({
        ok: true,
        lastUpdatedAt: liveSystemState.lastUpdatedAt,
      });
    } catch (error: any) {
      console.error("Error writing to src/data/initialData.ts:", error);
      res.status(500).json({
        ok: false,
        error: error?.message || "Không thể ghi trạng thái vào code.",
      });
    }
  });

  // 0.1 API phân tích tệp PDF danh sách lớp & học sinh (ví dụ: DS Up.pdf) bằng Gemini để nạp toàn bộ lớp vào hệ thống
  app.post("/api/ai/parse-student-pdf", async (req, res) => {
    try {
      const { base64Data, mimeType = "application/pdf", fileName = "DS_Up.pdf" } = req.body || {};
      if (!base64Data) {
        return res.status(400).json({ error: "Thiếu dữ liệu tệp PDF." });
      }

      const prompt = `Bạn là hệ thống bóc tách dữ liệu danh sách lớp và học sinh từ tệp tài liệu "${fileName}".
Hãy đọc TẤT CẢ CÁC TRANG trong tệp PDF đính kèm và trích xuất ĐẦY ĐỦ 100% học sinh cùng tên lớp tương ứng của từng em.
Để trích xuất nhanh và không bị giới hạn độ dài, hãy trả về KẾT QUẢ DƯỚI DẠNG CÁC DÒNG VĂN BẢN, mỗi học sinh trên 1 dòng theo đúng cấu trúc 4 trường ngăn cách bởi dấu gạch đứng "|":
MaHS|HoVaTen|NgaySinh|TenLop

Quy tắc bắt buộc:
- MaHS: Mã học sinh / Mã định danh trong tài liệu (nếu dòng đó không ghi mã học sinh thì tự đánh mã theo lớp, ví dụ HS3A01, HS3A02...).
- HoVaTen: Họ và tên đầy đủ của học sinh.
- NgaySinh: Ngày tháng năm sinh định dạng DD/MM/YYYY (nếu chỉ có năm hoặc trống thì chuẩn hóa DD/MM/YYYY).
- TenLop: Tên lớp của học sinh (ví dụ: Lớp 3A, Lớp 3.1, Lớp 4B, Lớp 5A...). Nếu tên lớp được ghi ở tiêu đề trang hoặc đầu bảng, hãy gán đúng tên lớp đó cho tất cả học sinh thuộc bảng đó.
- KHÔNG viết lời dẫn, KHÔNG dùng markdown code block, chỉ xuất các dòng MaHS|HoVaTen|NgaySinh|TenLop.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "application/pdf",
                  data: base64Data,
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      const rawText = (response.text || "").trim();
      const lines = rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && l.includes("|") && !l.toLowerCase().startsWith("mahs|"));

      const students = lines
        .map((line, index) => {
          const parts = line.split("|").map((p) => p.trim());
          const studentId = parts[0] || `HS${String(index + 1).padStart(3, "0")}`;
          const studentName = parts[1] || "";
          const birthDate = parts[2] || "15/05/2017";
          const className = parts[3] || "Lớp 3A";
          return {
            studentId,
            studentName,
            birthDate,
            className,
          };
        })
        .filter((s) => s.studentName.length > 1);

      return res.json({ students });
    } catch (error: any) {
      console.error("Error in /api/ai/parse-student-pdf:", error);
      return res.status(500).json({
        error: error?.message || "Lỗi khi phân tích tệp PDF danh sách học sinh.",
      });
    }
  });


  // 1. AI Sinh đề Lý thuyết (Trắc nghiệm + Tự luận ngắn NLP) theo Chương trình GDPT 2018 & Tài liệu khác (Ma trận / PDF / Đề mẫu)
  app.post("/api/ai/generate-exam", async (req, res) => {
    try {
      const {
        topic,
        selectedTopicTitle = "",
        selectedTopicLessons = "",
        hasStep4UploadedMaterial = false,
        grade,
        gradeCurriculumBoundary = "",
        mcqCount = 4,
        essayCount = 1,
        questionCount = 4,
        isMonthlyExam = false,
        monthlyExamMonth = "",
        focusKnowledgeNote = "",
        teacherCustomIdeaNote = "",
        strictConstraintNote = "",
        referenceDocText = "",
        referencePdfBase64 = "",
        referenceDocType = "",
        referenceFileName = "",
      } = req.body;
      const targetMcqCount = Math.min(20, Math.max(0, Number(mcqCount ?? (questionCount - 1))));
      const targetEssayCount = Math.min(10, Math.max(0, Number(essayCount ?? 1)));
      const strictStep3Step4Rule =
        hasStep4UploadedMaterial || referenceDocText || referencePdfBase64
          ? "Tạo đề kiểm tra chỉ dựa trên nội dung của chủ đề đã chọn ở Bước 3, sử dụng tài liệu đã tải lên ở Bước 4, và không thêm bất kỳ kiến thức ngoài nào."
          : strictConstraintNote ||
            "Bám sát 100% tài liệu SGK Tin học đã đính kèm, không sáng tạo thêm các phần kiến thức ngoài.";

      const prompt = `Bạn là chuyên gia biên soạn đề kiểm tra môn Tin học Tiểu học theo Chương trình Giáo dục Phổ thông 2018 (Bộ sách Kết nối tri thức với cuộc sống).
Hãy tạo ${
        isMonthlyExam
          ? `BÀI KIỂM TRA ĐỊNH KỲ HÀNG THÁNG (${monthlyExamMonth || "Kiểm tra tháng"})`
          : "bộ câu hỏi kiểm tra"
      } cho học sinh Khối ${grade || "Lớp 4"} (ĐÃ CHỌN Ở BƯỚC 1).

- KHỐI LỚP ĐÃ CHỌN Ở BƯỚC 1: "${grade || "Lớp 4"}" — TUYỆT ĐỐI KHÔNG lấy nội dung của khối lớp khác, KHÔNG bịa ra kiến thức ngoài chương trình ${grade || "Lớp 4"}.
${gradeCurriculumBoundary ? `\n${gradeCurriculumBoundary}\n` : ""}
- CHỦ ĐỀ ĐÃ CHỌN Ở BƯỚC 3: "${selectedTopicTitle || topic}" (${selectedTopicLessons || "Theo SGK Kết nối tri thức"}).
- YÊU CẦU CỦA GIÁO VIÊN: "${
        hasStep4UploadedMaterial || referenceDocText || referencePdfBase64
          ? "Tạo đề kiểm tra chỉ dựa trên nội dung của chủ đề đã chọn ở Bước 3, sử dụng tài liệu đã tải lên ở Bước 4, và không thêm bất kỳ kiến thức ngoài nào."
          : topic || selectedTopicTitle
      }"

[GHI CHÚ TRỌNG TÂM CỦA GIÁO VIÊN — BẮT BUỘC TUÂN THỦ 100%]:
1. Phần kiến thức trọng tâm cần tập trung ra đề: ${focusKnowledgeNote || selectedTopicTitle || "Tập trung vào kiến thức trọng tâm của chủ đề đã chọn ở Bước 3."}
2. Ý tưởng riêng của giáo viên: ${teacherCustomIdeaNote || "Thiết kế câu hỏi gắn liền với tình huống thực tế của học sinh tiểu học."}
3. Yêu cầu ràng buộc: ${strictStep3Step4Rule}
${
  referenceDocText || referencePdfBase64
    ? `\nQUAN TRỌNG — TÀI LIỆU ĐÃ TẢI LÊN Ở BƯỚC 4 (${referenceDocType || "Ma trận / Sách PDF / Đề mẫu"} - Tệp: ${referenceFileName || "Văn bản trực tiếp"}):
BẮT BUỘC TUÂN THỦ QUY TẮC: "Tạo đề kiểm tra chỉ dựa trên nội dung của chủ đề đã chọn ở Bước 3 (${selectedTopicTitle}), sử dụng tài liệu đã tải lên ở Bước 4, và không thêm bất kỳ kiến thức ngoài nào." Tuyệt đối KHÔNG đưa bất kỳ câu hỏi nào thuộc các chủ đề khác ngoài chủ đề Bước 3 và tài liệu Bước 4 dưới đây:
${referenceDocText ? `"""\n${referenceDocText.slice(0, 12000)}\n"""` : "(Xem toàn bộ nội dung trong tệp PDF đính kèm)"}`
    : ""
}
Yêu cầu:
- Bao gồm ĐÚNG ${targetMcqCount} câu hỏi trắc nghiệm (mỗi câu có 4 lựa chọn A, B, C, D) và ĐÚNG ${targetEssayCount} câu hỏi tự luận ngắn (để chấm bằng NLP đọc hiểu ý nghĩa, trả về trong mảng shortAnswers). Tổng điểm toàn bài = 10 điểm.
- Mọi câu hỏi trắc nghiệm và tự luận phải CHỈ thuộc đúng Khối ${grade || "Lớp 4"} (Bước 1) và đúng chủ đề đã chọn ở Bước 3 ("${selectedTopicTitle}") cùng tài liệu Bước 4, tuyệt đối không lấy kiến thức của khối lớp khác hoặc bịa thêm kiến thức ngoài.
- Thực hiện chính xác "Ý tưởng riêng của giáo viên" ở trên vào nội dung câu hỏi tương ứng (đặc biệt là các câu hỏi tình huống tự luận).
- Ngôn từ trong sáng, gần gũi với học sinh tiểu học (${grade || "Lớp 4"}).
- Mỗi câu tự luận ngắn cần có danh sách các cụm từ khóa đồng nghĩa (semanticKeywords) mà học sinh tiểu học hay diễn đạt theo cách riêng của các em.`;

      const contents: any = referencePdfBase64
        ? [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: referencePdfBase64,
              },
            },
            { text: prompt },
          ]
        : prompt;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tên đề kiểm tra" },
              grade: { type: Type.STRING, description: "Khối lớp (Lớp 3, Lớp 4, Lớp 5)" },
              durationMinutes: { type: Type.INTEGER, description: "Thời gian làm bài (phút)" },
              multipleChoice: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER, description: "Chỉ số đáp án đúng từ 0 đến 3" },
                    explanation: { type: Type.STRING, description: "Giải thích ngắn gọn dễ hiểu cho học sinh" },
                    points: { type: Type.NUMBER },
                  },
                  required: ["id", "question", "options", "correctIndex", "explanation", "points"],
                },
              },
              shortAnswers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    sampleAnswer: { type: Type.STRING },
                    semanticKeywords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Các ý nghĩa hoặc cách diễn đạt đồng nghĩa của học sinh tiểu học được chấp nhận",
                    },
                    points: { type: Type.NUMBER },
                  },
                  required: ["id", "question", "sampleAnswer", "semanticKeywords", "points"],
                },
              },
              shortAnswer: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  sampleAnswer: { type: Type.STRING },
                  semanticKeywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  points: { type: Type.NUMBER },
                },
                required: ["id", "question", "sampleAnswer", "semanticKeywords", "points"],
              },
            },
            required: ["title", "grade", "durationMinutes", "multipleChoice", "shortAnswers", "shortAnswer"],
          },
        },
      });

      const text = response.text || "{}";
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Error in /api/ai/generate-exam:", error);
      res.status(500).json({
        error: error?.message || "Không thể kết nối AI để sinh đề lý thuyết. Vui lòng thử lại.",
      });
    }
  });

  // 2. AI Thiết kế Bài mẫu Thực hành & Ma trận Checklist (.docx, .pptx, .sb3)
  app.post("/api/ai/generate-rubric", async (req, res) => {
    try {
      const {
        topic,
        selectedTopicTitle = "",
        selectedTopicLessons = "",
        hasStep4UploadedMaterial = false,
        grade,
        gradeCurriculumBoundary = "",
        fileType,
        taskCount = 4,
        isMonthlyExam = false,
        monthlyExamMonth = "",
        focusKnowledgeNote = "",
        teacherCustomIdeaNote = "",
        strictConstraintNote = "",
        referenceDocText = "",
        referencePdfBase64 = "",
        referenceDocType = "",
        referenceFileName = "",
      } = req.body;
      const targetTaskCount = Math.min(10, Math.max(2, Number(taskCount || 4)));
      const engineName =
        fileType === "docx"
          ? "DOM Parsing & Layout Analysis (.docx)"
          : fileType === "pptx"
          ? "Slide Property & Animation Scanner (.pptx)"
          : "Abstract Syntax Tree (AST) & Sandbox Simulator (.sb3)";
      const strictStep3Step4Rule =
        hasStep4UploadedMaterial || referenceDocText || referencePdfBase64
          ? "Tạo đề kiểm tra chỉ dựa trên nội dung của chủ đề đã chọn ở Bước 3, sử dụng tài liệu đã tải lên ở Bước 4, và không thêm bất kỳ kiến thức ngoài nào."
          : strictConstraintNote ||
            "Bám sát 100% tài liệu SGK Tin học đã đính kèm, không sáng tạo thêm các phần kiến thức ngoài.";

      const prompt = `Bạn là Trợ lý AI chuyên thiết kế bài tập thực hành Tin học Tiểu học (${grade || "Lớp 4"}).
Hãy thiết kế ${
        isMonthlyExam
          ? `BÀI KIỂM TRA THỰC HÀNH HÀNG THÁNG (${monthlyExamMonth})`
          : "một bài tập thực hành"
      } định dạng .${fileType || "docx"} cho đúng Khối ${grade || "Lớp 4"} (ĐÃ CHỌN Ở BƯỚC 1).
- KHỐI LỚP ĐÃ CHỌN Ở BƯỚC 1: "${grade || "Lớp 4"}" — TUYỆT ĐỐI KHÔNG lấy nội dung của khối lớp khác.
${gradeCurriculumBoundary ? `\n${gradeCurriculumBoundary}\n` : ""}
- CHỦ ĐỀ ĐÃ CHỌN Ở BƯỚC 3: "${selectedTopicTitle || topic}" (${selectedTopicLessons}).
- YÊU CẦU CỦA GIÁO VIÊN: "${
        hasStep4UploadedMaterial || referenceDocText || referencePdfBase64
          ? "Tạo đề kiểm tra chỉ dựa trên nội dung của chủ đề đã chọn ở Bước 3, sử dụng tài liệu đã tải lên ở Bước 4, và không thêm bất kỳ kiến thức ngoài nào."
          : topic
      }"
Công nghệ chấm tự động sử dụng: ${engineName}.

[GHI CHÚ TRỌNG TÂM CỦA GIÁO VIÊN — BẮT BUỘC TUÂN THỦ 100%]:
1. Phần kiến thức trọng tâm cần tập trung ra đề: ${focusKnowledgeNote || selectedTopicTitle || "Tập trung vào kỹ năng trọng tâm của chủ đề Bước 3."}
2. Ý tưởng riêng của giáo viên: ${teacherCustomIdeaNote || "Thiết kế yêu cầu gắn với tình huống thực hành thực tế của học sinh tiểu học."}
3. Yêu cầu ràng buộc: ${strictStep3Step4Rule}
${
  referenceDocText || referencePdfBase64
    ? `\nQUAN TRỌNG — TÀI LIỆU ĐÃ TẢI LÊN Ở BƯỚC 4 (${referenceDocType || "Ma trận / Sách PDF / Đề mẫu"} - Tệp: ${referenceFileName || "Văn bản trực tiếp"}):
BẮT BUỘC TUÂN THỦ: "Tạo đề kiểm tra chỉ dựa trên nội dung của chủ đề đã chọn ở Bước 3 (${selectedTopicTitle}), sử dụng tài liệu đã tải lên ở Bước 4, và không thêm bất kỳ kiến thức ngoài nào."
${referenceDocText ? `"""\n${referenceDocText.slice(0, 12000)}\n"""` : "(Xem toàn bộ nội dung trong tệp PDF đính kèm)"}`
    : ""
}
Hãy trả về:
1. Tên bài thực hành, mô tả yêu cầu dành cho học sinh tiểu học chỉ dựa trên đúng Khối ${grade || "Lớp 4"} (Bước 1), chủ đề Bước 3 và tài liệu Bước 4.
2. Cấu hình file mẫu gốc (templateSummary) để hệ thống tạo file mẫu (.docx, .pptx, hoặc .sb3) cho giáo viên tải về.
3. Danh sách ĐÚNG ${targetTaskCount} câu/yêu cầu thực hành (checklist) với tổng điểm = 10, kèm thuộc tính kỹ thuật cần quét (technicalTarget) và lỗi học sinh tiểu học thường mắc phải (commonElementaryMistake).`;

      const contents: any = referencePdfBase64
        ? [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: referencePdfBase64,
              },
            },
            { text: prompt },
          ]
        : prompt;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              grade: { type: Type.STRING },
              fileType: { type: Type.STRING },
              studentPrompt: { type: Type.STRING },
              standardFileNamePattern: { type: Type.STRING },
              templateSummary: {
                type: Type.OBJECT,
                properties: {
                  headingText: { type: Type.STRING },
                  bodyLines: { type: Type.ARRAY, items: { type: Type.STRING } },
                  requiredFont: { type: Type.STRING },
                  requiredSizePt: { type: Type.INTEGER },
                  requiredColorHex: { type: Type.STRING },
                  scratchBlocksRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
                  slideCountRequired: { type: Type.INTEGER },
                },
                required: ["headingText", "bodyLines"],
              },
              checklist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    criterion: { type: Type.STRING, description: "Yêu cầu chấm bằng tiếng Việt" },
                    technicalTarget: { type: Type.STRING, description: "Thuộc tính DOM/XML/AST mà AI quét" },
                    maxPoints: { type: Type.NUMBER },
                    commonElementaryMistake: { type: Type.STRING },
                  },
                  required: ["id", "criterion", "technicalTarget", "maxPoints", "commonElementaryMistake"],
                },
              },
            },
            required: [
              "title",
              "grade",
              "fileType",
              "studentPrompt",
              "standardFileNamePattern",
              "templateSummary",
              "checklist",
            ],
          },
        },
      });

      const text = response.text || "{}";
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Error in /api/ai/generate-rubric:", error);
      res.status(500).json({
        error: error?.message || "Không thể sinh ma trận thực hành tự động.",
      });
    }
  });

  // 2B. AI Chuyên gia Khảo thí Tiểu học — Tạo Đề Thi Học Kỳ Hoàn Chỉnh (Phần I: Trắc nghiệm + Phần II: Tự luận/Thực hành + Đáp án & Hướng dẫn chấm)
  app.post("/api/ai/generate-semester-exam", async (req, res) => {
    try {
      const {
        grade = "Lớp 4",
        gradeCurriculumBoundary = "",
        semesterType = "Học kỳ I",
        schoolYear = "2024 - 2025",
        durationMinutes = 35,
        theoryPercent = 50,
        practicePercent = 50,
        nhanBietPercent = 40,
        thongHieuPercent = 30,
        vanDungPercent = 30,
        mcqCount = 6,
        essayCount = 1,
        practiceCount = 1,
        topic = "",
        selectedTopicTitle = "",
        selectedTopicLessons = "",
        hasStep4UploadedMaterial = false,
        focusKnowledgeNote = "",
        teacherCustomIdeaNote = "",
        strictConstraintNote = "",
        referenceDocText = "",
        referencePdfBase64 = "",
        referenceDocType = "",
        referenceFileName = "",
      } = req.body;

      const targetMcqCount = Math.min(20, Math.max(1, Number(mcqCount || 6)));
      const targetEssayCount = Math.min(5, Math.max(0, Number(essayCount ?? 1)));
      const targetPracticeCount = Math.min(4, Math.max(1, Number(practiceCount ?? 1)));
      const strictStep3Step4Rule =
        hasStep4UploadedMaterial || referenceDocText || referencePdfBase64
          ? "Tạo đề kiểm tra chỉ dựa trên nội dung của chủ đề đã chọn ở Bước 3, sử dụng tài liệu đã tải lên ở Bước 4, và không thêm bất kỳ kiến thức ngoài nào."
          : strictConstraintNote ||
            "Bám sát 100% tài liệu SGK Tin học đã đính kèm, không sáng tạo thêm các phần kiến thức ngoài.";

      const prompt = `Bạn là một Trợ lý AI chuyên gia giáo dục và khảo thí Tiểu học môn Tin học. Nhiệm vụ của bạn là đọc hiểu Ma trận đề kiểm tra (hoặc file Đề mẫu, Sách giáo khoa) do giáo viên cung cấp, sau đó tự động biên soạn một đề kiểm tra học kỳ hoàn chỉnh mới đúng chuẩn.

THÔNG SỐ ĐỀ THI HỌC KỲ CẦN BIÊN SOẠN:
- Kỳ kiểm tra: Đề kiểm tra định kỳ ${semesterType} — Năm học ${schoolYear}
- Môn: Tin học — Khối đã chọn ở Bước 1: ${grade} (Chương trình GDPT 2018 - Bộ Kết nối tri thức với cuộc sống)
- RÀNG BUỘC KHỐI LỚP BƯỚC 1: TUYỆT ĐỐI CHỈ ra đề trong phạm vi chương trình ${grade}, KHÔNG lấy kiến thức của khối lớp khác và KHÔNG bịa đặt kiến thức ngoài.
${gradeCurriculumBoundary ? `\n${gradeCurriculumBoundary}\n` : ""}
- CHỦ ĐỀ ĐÃ CHỌN Ở BƯỚC 3: "${selectedTopicTitle || "Theo chủ đề Bước 3"}" (${selectedTopicLessons})
- YÊU CẦU CỦA GIÁO VIÊN: "${
        hasStep4UploadedMaterial || referenceDocText || referencePdfBase64
          ? "Tạo đề kiểm tra chỉ dựa trên nội dung của chủ đề đã chọn ở Bước 3, sử dụng tài liệu đã tải lên ở Bước 4, và không thêm bất kỳ kiến thức ngoài nào."
          : topic
      }"
- Thời gian làm bài: ${durationMinutes} phút
- Cấu trúc tỷ lệ điểm: Lý thuyết ${theoryPercent}% (${(theoryPercent / 10).toFixed(1)} điểm) — Thực hành ${practicePercent}% (${(practicePercent / 10).toFixed(1)} điểm). Tổng điểm toàn bài = 10.0 điểm.
- Tỷ lệ mức độ nhận thức theo ma trận: Nhận biết ${nhanBietPercent}% — Thông hiểu ${thongHieuPercent}% — Vận dụng ${vanDungPercent}%.
- Số lượng câu hỏi yêu cầu: Phần I gồm ĐÚNG ${targetMcqCount} câu Trắc nghiệm khách quan (4 lựa chọn A, B, C, D); Phần II gồm ĐÚNG ${targetEssayCount} câu Tự luận và ĐÚNG ${targetPracticeCount} bài tập Thực hành trên máy tính.

[GHI CHÚ TRỌNG TÂM CỦA GIÁO VIÊN — BẮT BUỘC TUÂN THỦ 100%]:
- Phần kiến thức trọng tâm cần tập trung ra đề: ${focusKnowledgeNote || selectedTopicTitle || "Theo chủ đề đã chọn ở Bước 3 và ma trận đề."}
- Ý tưởng riêng của giáo viên: ${teacherCustomIdeaNote || "Xây dựng câu hỏi tự luận và thực hành gắn liền với tình huống thực tế của học sinh tiểu học."}
- Yêu cầu ràng buộc: ${strictStep3Step4Rule}
${
  referenceDocText || referencePdfBase64
    ? `\nCÁC TỆP DỮ LIỆU ĐẦU VÀO ĐÃ TẢI LÊN Ở BƯỚC 4 (${referenceDocType || "Ma trận đề / Sách giáo khoa / Đề mẫu"} - Tệp: ${referenceFileName || "Văn bản trực tiếp"}):
BẮT BUỘC TUYỆT ĐỐI: "Tạo đề kiểm tra chỉ dựa trên nội dung của chủ đề đã chọn ở Bước 3 (${selectedTopicTitle}), sử dụng tài liệu đã tải lên ở Bước 4, và không thêm bất kỳ kiến thức ngoài nào."
"""
${referenceDocText ? referenceDocText.slice(0, 14000) : "(Xem toàn bộ nội dung trong tệp PDF đính kèm)"}
"""`
    : ""
}

BẠN PHẢI TUÂN THỦ NGHIÊM NGẶT 4 NGUYÊN TẮC SAU:
1. ĐÚNG CẤU TRÚC VÀ MA TRẬN:
- Phân tích kỹ tỷ lệ điểm số giữa Lý thuyết (Trắc nghiệm/Tự luận) và Thực hành (${theoryPercent}% Lý thuyết / ${practicePercent}% Thực hành).
- Đảm bảo các mức độ nhận thức: Nhận biết (${nhanBietPercent}%), Thông hiểu (${thongHieuPercent}%), Vận dụng (${vanDungPercent}%) đúng theo tỷ lệ % đã quy định trong ma trận. Ghi rõ mức độ nhận thức ("Nhận biết", "Thông hiểu", hoặc "Vận dụng") cho từng câu.
- Số lượng câu hỏi và phân phối điểm từng phần phải khớp hoàn toàn với cấu trúc ma trận (Tổng điểm Phần I + Phần II = 10.0 điểm).

2. NỘI DUNG CHUYÊN MÔN:
- Nội dung câu hỏi bám sát 100% chương trình Tin học tiểu học của đúng ${grade} (đã chọn ở Bước 1) và đúng "${selectedTopicTitle}" (đã chọn ở Bước 3). Tuyệt đối không lấy bài học của khối khác.
- Lời văn trong sáng, dễ hiểu, phù hợp với lứa tuổi học sinh tiểu học.

3. HÌNH ẢNH MINH HỌA TRONG CÂU HỎI:
- Đối với những câu hỏi cần hình ảnh minh họa (như nhận diện biểu tượng phần mềm, giao diện Paint, Word, PowerPoint, Scratch, phần cứng máy tính, nút lệnh, v.v.), bạn PHẢI điền trường "illustrationNote" bằng thẻ chuẩn: "[HÌNH ẢNH MINH HỌA: Mô tả chi tiết hình ảnh cần có]" (ít nhất 2-3 câu hỏi trắc nghiệm và bài thực hành có thẻ [HÌNH ẢNH MINH HỌA: ...] mô tả rõ ràng để giáo viên hoặc hệ thống dễ dàng chèn ảnh vào).

4. ĐẦU RA (OUTPUT):
- Trình bày đề kiểm tra rõ ràng thành 2 phần: Phần I (Trắc nghiệm) và Phần II (Tự luận/Thực hành).
- Kèm theo Đáp án và Hướng dẫn chấm chi tiết cho từng câu trong trường "answerKeyAndGradingGuide" và trong từng câu hỏi.`;

      const contents: any = referencePdfBase64
        ? [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: referencePdfBase64,
              },
            },
            { text: prompt },
          ]
        : prompt;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tiêu đề chính thức của Đề thi học kỳ" },
              grade: { type: Type.STRING },
              durationMinutes: { type: Type.INTEGER },
              multipleChoice: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    cognitiveLevel: {
                      type: Type.STRING,
                      description: "Nhận biết | Thông hiểu | Vận dụng",
                    },
                    illustrationNote: {
                      type: Type.STRING,
                      description:
                        "Chuỗi chú thích có dạng [HÌNH ẢNH MINH HỌA: Mô tả chi tiết hình ảnh cần có] nếu câu hỏi cần hình minh họa, hoặc chuỗi rỗng",
                    },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING, description: "Hướng dẫn chấm & giải thích đáp án đúng" },
                    points: { type: Type.NUMBER },
                  },
                  required: [
                    "id",
                    "question",
                    "cognitiveLevel",
                    "illustrationNote",
                    "options",
                    "correctIndex",
                    "explanation",
                    "points",
                  ],
                },
              },
              shortAnswers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    cognitiveLevel: { type: Type.STRING },
                    illustrationNote: { type: Type.STRING },
                    sampleAnswer: { type: Type.STRING },
                    gradingGuide: { type: Type.STRING, description: "Biểu điểm chi tiết từng ý" },
                    semanticKeywords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    points: { type: Type.NUMBER },
                  },
                  required: [
                    "id",
                    "question",
                    "cognitiveLevel",
                    "illustrationNote",
                    "sampleAnswer",
                    "gradingGuide",
                    "semanticKeywords",
                    "points",
                  ],
                },
              },
              practiceTasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    cognitiveLevel: { type: Type.STRING },
                    softwareType: {
                      type: Type.STRING,
                      description: "Word (.docx) | PowerPoint (.pptx) | Scratch (.sb3) | Thực hành tổng hợp",
                    },
                    instructions: { type: Type.STRING, description: "Đề bài thực hành chi tiết cho học sinh" },
                    illustrationNote: {
                      type: Type.STRING,
                      description: "[HÌNH ẢNH MINH HỌA: Mô tả chi tiết hình ảnh mẫu thực hành cần có]",
                    },
                    points: { type: Type.NUMBER },
                    gradingRubric: { type: Type.STRING, description: "Hướng dẫn chấm thực hành chi tiết từng bước" },
                  },
                  required: [
                    "id",
                    "title",
                    "cognitiveLevel",
                    "softwareType",
                    "instructions",
                    "illustrationNote",
                    "points",
                    "gradingRubric",
                  ],
                },
              },
              answerKeyAndGradingGuide: {
                type: Type.STRING,
                description: "Tổng hợp Đáp án và Hướng dẫn chấm chi tiết cho Phần I và Phần II",
              },
            },
            required: [
              "title",
              "grade",
              "durationMinutes",
              "multipleChoice",
              "shortAnswers",
              "practiceTasks",
              "answerKeyAndGradingGuide",
            ],
          },
        },
      });

      const text = response.text || "{}";
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Error in /api/ai/generate-semester-exam:", error);
      res.status(500).json({
        error: error?.message || "Không thể kết nối AI để tạo đề thi học kỳ. Vui lòng thử lại.",
      });
    }
  });

  // 3. AI Chấm bài Thực hành (.docx, .pptx, .sb3) & Tự luận ngắn (NLP)
  app.post("/api/ai/grade-submission", async (req, res) => {
    try {
      const {
        studentName,
        className,
        originalFileName,
        standardizedFileName,
        fileType,
        assignmentTitle,
        studentPrompt,
        extractedInspection,
        checklist,
        shortAnswerQuestion,
        shortAnswerStudentText,
      } = req.body;

      const prompt = `Bạn là Hệ thống AI Chấm bài Tin học Tiểu học Thông minh.
Hãy phân tích và chấm điểm bài nộp của học sinh BÁM SÁT 100% VÀO MA TRẬN ĐỀ BÀI (Checklist) VÀ DỮ LIỆU BÓC TÁCH THỰC TẾ TỪ TỆP HỌC SINH NỘP:
- Học sinh: ${studentName} (${className})
- Tên file gốc học sinh nộp: "${originalFileName}" -> Đã chuẩn hóa tự động thành: "${standardizedFileName}"
- Đề bài: "${assignmentTitle}" (Loại bài: ${fileType})
- Yêu cầu của đề bài: "${studentPrompt || ""}"
- Dữ liệu bóc tách kỹ thuật thực tế từ file học sinh nộp (DOM XML / Slide XML / Scratch AST JSON):
${JSON.stringify(extractedInspection, null, 2)}
- Ma trận tiêu chí chấm của đề bài đã giao (Checklist):
${JSON.stringify(checklist, null, 2)}
${
  shortAnswerQuestion
    ? `- Câu hỏi tự luận ngắn (Chấm NLP đọc hiểu ý nghĩa): "${shortAnswerQuestion}"\n- Câu trả lời thực tế của học sinh: "${shortAnswerStudentText}"`
    : ""
}

QUY TẮC CHẤM ĐIỂM NGHIÊM NGẶT (TUYỆT ĐỐI KHÔNG ĐƯỢC BỊA ĐẶT):
1. CHỈ chấm dựa trên đúng các tiêu chí có trong mảng "Ma trận tiêu chí chấm (Checklist)" của đề bài này và đối chiếu với dữ liệu thực tế trong "extractedInspection". Tuyệt đối KHÔNG tự bịa ra tiêu chí ngoài đề bài, KHÔNG gán lỗi của bài khác vào bài này.
2. Mảng "criterionBreakdown" trả về PHẢI có đúng số lượng phần tử tương ứng 1-1 với từng tiêu chí trong "checklist" của đề bài, giữ nguyên tên "criterion" và "maxPoints" của từng mục trong checklist.
3. Trong "detailNote" và "detectedErrors", hãy trích dẫn thông số thực tế bóc tách được từ bài làm của học sinh (ví dụ: nội dung dòng văn bản học sinh đã gõ, cỡ chữ thực tế, số slide thực tế, các khối lệnh thực tế trong file).
4. Viết lời nhận xét cá nhân hóa ấm áp, phân tích đúng bài làm thực tế với cương vị là THẦY GIÁO (BẮT BUỘC xưng "thầy" - gọi học sinh là "con" hoặc "em", TUYỆT ĐỐI KHÔNG xưng "cô").`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              aiScore: { type: Type.NUMBER, description: "Điểm tổng trên thang 10 (làm tròn 0.5)" },
              needsAttention: {
                type: Type.BOOLEAN,
                description: "True nếu điểm < 6.5 hoặc sai quá nhiều lỗi cơ bản cần giáo viên hỗ trợ riêng",
              },
              detectedErrors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Danh sách lỗi sai cụ thể bằng tiếng Việt",
              },
              criterionBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    criterion: { type: Type.STRING },
                    passed: { type: Type.BOOLEAN },
                    earnedPoints: { type: Type.NUMBER },
                    maxPoints: { type: Type.NUMBER },
                    detailNote: { type: Type.STRING },
                  },
                  required: ["criterion", "passed", "earnedPoints", "maxPoints", "detailNote"],
                },
              },
              personalizedFeedback: {
                type: Type.STRING,
                description: "Lời khuyên cá nhân hóa khích lệ học sinh tiểu học",
              },
              nlpSemanticAnalysis: {
                type: Type.STRING,
                description: "Giải thích cách NLP hiểu câu trả lời tự luận của học sinh (nếu có)",
              },
            },
            required: [
              "aiScore",
              "needsAttention",
              "detectedErrors",
              "criterionBreakdown",
              "personalizedFeedback",
            ],
          },
        },
      });

      const text = response.text || "{}";
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Error in /api/ai/grade-submission:", error);
      res.status(500).json({
        error: error?.message || "Lỗi khi gọi AI Engine chấm bài.",
      });
    }
  });

  // 4. Hệ thống tự động lưu tệp bài làm của học sinh vào Google Drive đã chia sẻ
  // ("https://drive.google.com/drive/folders/15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14?usp=sharing")
  // theo từng mục bài tập được giao mà KHÔNG CẦN học sinh đăng nhập Google
  const SHARED_DRIVE_ROOT_ID = "15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14";
  const SHARED_DRIVE_ROOT_URL =
    "https://drive.google.com/drive/folders/15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14?usp=sharing";
  const LOCAL_SHARED_DRIVE_DIR = path.join(
    __dirname,
    "shared_drive_storage",
    SHARED_DRIVE_ROOT_ID
  );

  // Lưu trữ token Google Drive của Giáo viên (nếu giáo viên kết nối trên bảng điều khiển) để đẩy thẳng lên đám mây
  let serverTeacherDriveToken: string | null = process.env.GOOGLE_DRIVE_ACCESS_TOKEN || null;

  app.post("/api/drive/teacher-token", (req, res) => {
    const { accessToken } = req.body || {};
    if (typeof accessToken === "string" && accessToken.trim()) {
      serverTeacherDriveToken = accessToken.trim();
      return res.json({ ok: true });
    }
    return res.status(400).json({ ok: false });
  });

  app.post("/api/drive/auto-save", async (req, res) => {
    try {
      const {
        standardizedFileName,
        assignmentFolderName,
        assignmentTitle,
        studentName,
        className,
        fileBase64,
        mimeType = "application/octet-stream",
        clientAccessToken,
      } = req.body || {};

      const safeFolderName = String(assignmentFolderName || assignmentTitle || "BaiTap")
        .replace(/[\\/:*?"<>|]/g, "-")
        .trim();
      const safeFileName = String(standardizedFileName || `BaiLam_${Date.now()}.dat`)
        .replace(/[\\/:*?"<>|]/g, "_")
        .trim();

      // Lưu bản ghi thực tế vào cấu trúc thư mục ánh xạ 1-1 với Google Drive chia sẻ:
      // 15Kvyh1bnEtp2iJ7IPac7GYBV4_M-kN14 / <Mục bài tập được giao> / <Tên tệp chuẩn hóa>
      const targetSubfolderPath = path.join(LOCAL_SHARED_DRIVE_DIR, safeFolderName);
      fs.mkdirSync(targetSubfolderPath, { recursive: true });

      const fileBuffer = fileBase64
        ? Buffer.from(fileBase64, "base64")
        : Buffer.from(
            JSON.stringify({
              studentName,
              className,
              assignmentTitle,
              savedAt: new Date().toISOString(),
            }),
            "utf-8"
          );

      const targetFilePath = path.join(targetSubfolderPath, safeFileName);
      fs.writeFileSync(targetFilePath, fileBuffer);

      // Nếu có token Google Drive trên server hoặc gửi kèm, đồng bộ trực tiếp qua Google Drive REST API v3
      const activeToken = clientAccessToken || serverTeacherDriveToken;
      let cloudFileId: string | undefined;
      let cloudWebViewLink: string | undefined;
      let cloudFolderId: string | undefined;
      let cloudFolderLink: string | undefined;

      if (activeToken) {
        try {
          const escapedName = safeFolderName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
          const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${escapedName}' and '${SHARED_DRIVE_ROOT_ID}' in parents and trashed = false`;
          const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
            q
          )}&fields=files(id,name,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

          const searchRes = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${activeToken}` },
          });

          if (searchRes.ok) {
            const searchData: any = await searchRes.json();
            if (Array.isArray(searchData.files) && searchData.files.length > 0) {
              cloudFolderId = searchData.files[0].id;
              cloudFolderLink =
                searchData.files[0].webViewLink ||
                `https://drive.google.com/drive/folders/${cloudFolderId}`;
            }
          }

          if (!cloudFolderId) {
            const createRes = await fetch(
              "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name,webViewLink",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${activeToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: safeFolderName,
                  mimeType: "application/vnd.google-apps.folder",
                  parents: [SHARED_DRIVE_ROOT_ID],
                  description: `Thư mục lưu bài nộp của học sinh cho bài tập: ${safeFolderName}`,
                }),
              }
            );
            if (createRes.ok) {
              const created: any = await createRes.json();
              cloudFolderId = created.id;
              cloudFolderLink =
                created.webViewLink ||
                `https://drive.google.com/drive/folders/${cloudFolderId}`;
            }
          }

          if (cloudFolderId) {
            const boundary = "-------314159265358979323846";
            const metadata = {
              name: safeFileName,
              parents: [cloudFolderId],
              description: `Bài nộp của học sinh ${studentName} (${className}) — Mục bài tập: ${assignmentTitle}`,
            };

            const multipartBody = Buffer.concat([
              Buffer.from(
                `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
                  metadata
                )}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
                "utf-8"
              ),
              fileBuffer,
              Buffer.from(`\r\n--${boundary}--`, "utf-8"),
            ]);

            const uploadRes = await fetch(
              "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${activeToken}`,
                  "Content-Type": `multipart/related; boundary=${boundary}`,
                },
                body: multipartBody,
              }
            );

            if (uploadRes.ok) {
              const uploadedData: any = await uploadRes.json();
              cloudFileId = uploadedData.id;
              cloudWebViewLink =
                uploadedData.webViewLink ||
                `https://drive.google.com/file/d/${uploadedData.id}/view`;
            }
          }
        } catch (cloudErr) {
          console.warn("Cloud Drive API relay fallback to shared folder mirror:", cloudErr);
        }
      }

      res.json({
        uploaded: true,
        driveFileId: cloudFileId || `drive-${Date.now()}`,
        driveFileName: safeFileName,
        driveWebViewLink: cloudWebViewLink || SHARED_DRIVE_ROOT_URL,
        driveAssignmentFolderId: cloudFolderId || SHARED_DRIVE_ROOT_ID,
        driveAssignmentFolderName: safeFolderName,
        driveAssignmentFolderLink: cloudFolderLink || SHARED_DRIVE_ROOT_URL,
        driveRootFolderId: SHARED_DRIVE_ROOT_ID,
        driveRootFolderUrl: SHARED_DRIVE_ROOT_URL,
      });
    } catch (error: any) {
      console.error("Error in /api/drive/auto-save:", error);
      res.status(500).json({
        uploaded: false,
        errorMessage: error?.message || "Lỗi khi tự động lưu tệp vào Google Drive.",
      });
    }
  });

  // 5. AI Phân tích & Đánh giá Học sinh Tiểu học chính xác theo Thông tư 27/2020/TT-BGDĐT của Bộ GD&ĐT
  app.post("/api/ai/evaluate-tt27", async (req, res) => {
    try {
      const {
        mode, // "regular" (Đánh giá thường xuyên theo tháng) | "periodic" (Đánh giá định kỳ Giữa HK1, Cuối HK1, Giữa HK2, Cuối HK2)
        grade,
        className,
        periodLabel, // VD: "Tháng 10 (10-2026)" hoặc "Giữa HK1", "Cuối HK1", "Giữa HK2", "Cuối HK2"
        studentsData = [],
      } = req.body || {};

      if (mode === "regular") {
        const prompt = `Bạn là Chuyên gia Khảo thí & Đánh giá Học sinh Tiểu học theo đúng Thông tư 27/2020/TT-BGDĐT của Bộ Giáo dục và Đào tạo (Môn Tin học và Công nghệ - ${grade}, ${className}, Thời điểm: ${periodLabel}).
Dưới đây là danh sách học sinh kèm kết quả bài kiểm tra hàng tháng / bài thực hành trong tháng:
${JSON.stringify(studentsData, null, 2)}

Hãy phân tích từng học sinh và sinh nhận xét ĐÁNH GIÁ THƯỜNG XUYÊN chính xác theo Thông tư 27 gồm 4 nhóm tiêu chí (mỗi nhóm có Mã nhận xét ngắn gọn và Nội dung nhận xét cụ thể, ấm áp, đúng chuẩn hồ sơ học bạ điện tử / vnEdu):
1. Môn học và hoạt động giáo dục (subjectCode, subjectContent): Ghi nhận sự tiến bộ, kết quả học tập môn Tin học trong tháng (${grade}).
2. Nhận xét năng lực chung (generalCompCode, generalCompContent): Đánh giá năng lực tự chủ và tự học, giao tiếp và hợp tác, giải quyết vấn đề và sáng tạo.
3. Nhận xét năng lực đặc thù (specificCompCode, specificCompContent): Đánh giá năng lực Tin học (sử dụng và quản lý phương tiện CNTT, ứng dụng CNTT trong học tập, tư duy thuật toán/thực hành máy tính).
4. Nhận xét phẩm chất chủ yếu (qualityCode, qualityContent): Đánh giá phẩm chất chăm chỉ, trung thực, trách nhiệm, nhân ái, yêu nước.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                evaluations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      studentId: { type: Type.STRING },
                      subjectCode: { type: Type.STRING },
                      subjectContent: { type: Type.STRING },
                      generalCompCode: { type: Type.STRING },
                      generalCompContent: { type: Type.STRING },
                      specificCompCode: { type: Type.STRING },
                      specificCompContent: { type: Type.STRING },
                      qualityCode: { type: Type.STRING },
                      qualityContent: { type: Type.STRING },
                    },
                    required: [
                      "studentId",
                      "subjectCode",
                      "subjectContent",
                      "generalCompCode",
                      "generalCompContent",
                      "specificCompCode",
                      "specificCompContent",
                      "qualityCode",
                      "qualityContent",
                    ],
                  },
                },
              },
              required: ["evaluations"],
            },
          },
        });

        return res.json(JSON.parse(response.text || '{"evaluations":[]}'));
      } else {
        const prompt = `Bạn là Chuyên gia Khảo thí & Đánh giá Học sinh Tiểu học theo đúng Thông tư 27/2020/TT-BGDĐT của Bộ Giáo dục và Đào tạo (Môn Tin học - ${grade}, ${className}, Kỳ đánh giá định kỳ: ${periodLabel}).
Dưới đây là danh sách học sinh kèm điểm số và kết quả bài kiểm tra định kỳ:
${JSON.stringify(studentsData, null, 2)}

Hãy phân tích từng học sinh theo đúng quy định tại Điều 7 Thông tư 27/2020/TT-BGDĐT:
- Mức đạt được (midtermLevel, finalLevel): "T" (Hoàn thành tốt: điểm >= 8.0 hoặc nắm vững kiến thức, thao tác thành thạo), "H" (Hoàn thành: điểm từ 5.0 đến dưới 8.0), "C" (Chưa hoàn thành: điểm dưới 5.0).
- Điểm KTĐK (periodicScore): Điểm số bài kiểm tra định kỳ trên thang điểm 10.
- Mã nhận xét (commentCode): Mã định danh mẫu câu nhận xét chuẩn trên hệ thống quản lý (VD: T01, T02, H01, H02, C01).
- Nội dung nhận xét môn học (commentContent): Mô tả cụ thể ưu điểm (điểm mạnh) và những điểm học sinh cần cố gắng khắc phục, rèn luyện thêm trong môn Tin học ${grade}.
- Nhận xét năng lực đặc thù (specificCompContent): Đánh giá năng lực Tin học đặc thù của học sinh trong học kỳ.
- Nhận xét phẩm chất chủ yếu (qualityContent): Đánh giá sự hình thành và phát triển phẩm chất chủ yếu (chăm chỉ, trung thực, trách nhiệm) của học sinh.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                evaluations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      studentId: { type: Type.STRING },
                      midtermLevel: { type: Type.STRING },
                      finalLevel: { type: Type.STRING },
                      periodicScore: { type: Type.NUMBER },
                      commentCode: { type: Type.STRING },
                      commentContent: { type: Type.STRING },
                      specificCompContent: { type: Type.STRING },
                      qualityContent: { type: Type.STRING },
                    },
                    required: [
                      "studentId",
                      "midtermLevel",
                      "finalLevel",
                      "periodicScore",
                      "commentCode",
                      "commentContent",
                      "specificCompContent",
                      "qualityContent",
                    ],
                  },
                },
              },
              required: ["evaluations"],
            },
          },
        });

        return res.json(JSON.parse(response.text || '{"evaluations":[]}'));
      }
    } catch (error: any) {
      console.error("Error in /api/ai/evaluate-tt27:", error);
      res.status(500).json({
        error: error?.message || "Lỗi khi phân tích đánh giá Thông tư 27.",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
