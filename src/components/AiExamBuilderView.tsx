import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Download,
  PlusCircle,
  FileText,
  Presentation,
  Cat,
  BookOpenCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Upload,
  Layers,
  Trash2,
  Edit3,
  FileUp,
  FileCheck,
  Save,
  GraduationCap,
  Image as ImageIcon,
  FileSpreadsheet,
  Calendar,
  RefreshCw,
  CheckSquare,
  Square,
  Shuffle,
} from "lucide-react";
import {
  Assignment,
  CognitiveLevel,
  GradeLevel,
  PracticeFileType,
  SemesterPracticeTask,
  TheoryExam,
} from "../types/grading";
import { generateSamplePracticeFile } from "../utils/fileEngine";
import { exportSemesterExamToDocx } from "../utils/exportEngine";
import {
  getDefaultStep4NotesForGradeAndTopic,
  getGradeAndTopicPureBank,
} from "../utils/gradeCurriculumBank";
import {
  cleanIllustrationCaption,
  cleanQuestionText,
  enrichExamWithAutoIllustrations,
  formatTargetClassesLabel,
  generateIllustrationDataUrl,
} from "../utils/examIllustrationEngine";
import { ensureExamReserveQuestions } from "../utils/reserveQuestionEngine";
import {
  loadExamBuilderDraft,
  saveExamBuilderDraft,
  syncStateToCodebase,
} from "../utils/codeSyncEngine";
import { ClassRoom } from "./ClassManagerView";

function getGradeCurriculumBoundaryPrompt(grade: GradeLevel): string {
  if (grade === "Lớp 3") {
    return "Chuẩn kiến thức Khối Lớp 3 (SGK Tin học 3 Kết nối tri thức): Chỉ hỏi kiến thức cơ bản Lớp 3 (thông tin và quyết định, các bộ phận máy tính, chuột, bàn phím, làm quen thư mục, xem tin tức/giải trí trên mạng, an toàn thông tin cá nhân, làm quen bài trình chiếu đơn giản, bước đầu suy nghĩ theo các bước tuần tự). Không hỏi kiến thức Lớp 4, 5.";
  }
  if (grade === "Lớp 4") {
    return "Chuẩn kiến thức Khối Lớp 4 (SGK Tin học 4 Kết nối tri thức): Chỉ hỏi kiến thức Lớp 4 (phần cứng và phần mềm, gõ bàn phím đúng cách, tìm kiếm thông tin bằng từ khóa trên Internet, tôn trọng bản quyền phần mềm, soạn thảo Word cơ bản, trình chiếu PowerPoint có hiệu ứng, làm quen Scratch cơ bản). Không hỏi kiến thức Lớp 3, 5.";
  }
  return "Chuẩn kiến thức Khối Lớp 5 (SGK Tin học 5 Kết nối tri thức): Chỉ hỏi kiến thức Lớp 5 (lợi ích máy tính, tìm kiếm/tổ chức cây thư mục hợp lý, bản quyền nội dung thông tin, định dạng trang văn bản nâng cao/đồ họa/đa phương tiện, lập trình Scratch nâng cao với biến nhớ, cấu trúc lặp và rẽ nhánh). Không lấy bài sơ cấp Lớp 3, 4.";
}

interface AiExamBuilderViewProps {
  assignments: Assignment[];
  classes?: ClassRoom[];
  onAddAssignment: (newAssignment: Assignment) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
}

export interface KnttTopicConfig {
  id: string;
  code: string;
  title: string;
  subtracks?: {
    id: string;
    label: string;
    theoryPrompt: string;
    practicePrompt: string;
    recommendedFileType: PracticeFileType;
  }[];
  theoryPrompt: string;
  practicePrompt: string;
  recommendedFileType: PracticeFileType;
  lessonsSummary: string;
}

export const KNTT_CURRICULUM: Record<GradeLevel, KnttTopicConfig[]> = {
  "Lớp 3": [
    {
      id: "k3-cd1",
      code: "Chủ đề 1",
      title: "Chủ đề 1: Máy tính và em",
      lessonsSummary: "Thông tin và quyết định, các bộ phận của máy tính, làm việc với máy tính, tư thế ngồi và gõ bàn phím hàng cơ sở.",
      theoryPrompt:
        "SGK Tin học 3 Kết nối tri thức - Chủ đề 1: Máy tính và em (Nhận biết thông tin và quyết định, 4 bộ phận cơ bản của máy tính để bàn, thao tác chuột và tư thế ngồi đúng bảo vệ mắt).",
      practicePrompt:
        "SGK Tin học 3 Kết nối tri thức - Chủ đề 1: Máy tính và em (Thực hành gõ các phím ở hàng phím cơ sở, hàng phím trên, hàng phím dưới và gõ họ tên học sinh).",
      recommendedFileType: "docx",
    },
    {
      id: "k3-cd2",
      code: "Chủ đề 2",
      title: "Chủ đề 2: Mạng máy tính và Internet",
      lessonsSummary: "Xem tin tức và giải trí trên trang web, biểu tượng trình duyệt web, thông tin trên Internet.",
      theoryPrompt:
        "SGK Tin học 3 Kết nối tri thức - Chủ đề 2: Mạng máy tính và Internet (Nhận biết biểu tượng trình duyệt web, cách truy cập xem tin tức, dự báo thời tiết và giải trí lành mạnh trên Internet).",
      practicePrompt:
        "SGK Tin học 3 Kết nối tri thức - Chủ đề 2: Mạng máy tính và Internet (Thực hành ghi lại thông tin dự báo thời tiết hoặc tin tức thiếu nhi tìm được từ Internet vào trang văn bản).",
      recommendedFileType: "docx",
    },
    {
      id: "k3-cd3",
      code: "Chủ đề 3",
      title: "Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin",
      lessonsSummary: "Sắp xếp để dễ tìm, sơ đồ hình cây, làm quen với thư mục và tệp tin trên máy tính.",
      theoryPrompt:
        "SGK Tin học 3 Kết nối tri thức - Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin (Cách sắp xếp đồ vật hợp lý, sơ đồ hình cây, thao tác tạo mới, đặt tên và mở thư mục trong máy tính).",
      practicePrompt:
        "SGK Tin học 3 Kết nối tri thức - Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin (Thực hành tạo tệp văn bản và lưu đúng vào thư mục Học tập theo quy tắc đặt tên không dấu).",
      recommendedFileType: "docx",
    },
    {
      id: "k3-cd4",
      code: "Chủ đề 4",
      title: "Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số",
      lessonsSummary: "Bảo vệ thông tin cá nhân và gia đình khi sử dụng máy tính, Internet.",
      theoryPrompt:
        "SGK Tin học 3 Kết nối tri thức - Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số (Nhận biết thông tin cá nhân và gia đình, tác hại khi lộ thông tin và cách nhờ người lớn giúp đỡ khi gặp rủi ro trên mạng).",
      practicePrompt:
        "SGK Tin học 3 Kết nối tri thức - Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số (Soạn bảng quy tắc bảo vệ thông tin cá nhân của em và gia đình khi dùng Internet).",
      recommendedFileType: "docx",
    },
    {
      id: "k3-cd5",
      code: "Chủ đề 5",
      title: "Chủ đề 5: Ứng dụng tin học",
      lessonsSummary: "Làm quen với phần mềm trình chiếu, tạo trang trình chiếu có văn bản và hình ảnh minh họa.",
      theoryPrompt:
        "SGK Tin học 3 Kết nối tri thức - Chủ đề 5: Ứng dụng tin học (Nhận diện biểu tượng phần mềm trình chiếu PowerPoint, cách thêm trang chiếu mới, gõ chữ, chèn ảnh và lưu bài trình chiếu).",
      practicePrompt:
        "SGK Tin học 3 Kết nối tri thức - Chủ đề 5: Ứng dụng tin học (Thực hành tạo bài trình chiếu PowerPoint gồm 2-3 trang giới thiệu về bản thân hoặc loài vật em yêu thích có chèn ảnh).",
      recommendedFileType: "pptx",
    },
    {
      id: "k3-cd6",
      code: "Chủ đề 6",
      title: "Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính",
      lessonsSummary: "Thực hiện công việc theo từng bước, chia việc lớn thành việc nhỏ, thực hiện nhiệm vụ theo điều kiện (Nếu... thì...).",
      theoryPrompt:
        "SGK Tin học 3 Kết nối tri thức - Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính (Nêu các bước tuần tự đánh răng/rửa tay, cách chia việc lớn thành việc nhỏ và câu lệnh điều kiện Nếu... thì...).",
      practicePrompt:
        "SGK Tin học 3 Kết nối tri thức - Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính (Lập trình kịch bản khối lệnh cơ bản theo từng bước tuần tự điều khiển nhân vật di chuyển và nói xin chào).",
      recommendedFileType: "sb3",
    },
  ],
  "Lớp 4": [
    {
      id: "k4-cd1",
      code: "Chủ đề 1",
      title: "Chủ đề 1: Máy tính và em",
      lessonsSummary: "Phần cứng và phần mềm máy tính, lợi ích của việc gõ bàn phím đúng cách (10 ngón).",
      theoryPrompt:
        "SGK Tin học 4 Kết nối tri thức - Chủ đề 1: Máy tính và em (Phân biệt phần cứng và phần mềm máy tính, nêu ví dụ cụ thể và giải thích lợi ích của việc gõ bàn phím bằng 10 ngón đúng cách).",
      practicePrompt:
        "SGK Tin học 4 Kết nối tri thức - Chủ đề 1: Máy tính và em (Thực hành gõ đoạn văn bản nhanh và chính xác bằng 10 ngón tay, trình bày danh sách thiết bị phần cứng và phần mềm).",
      recommendedFileType: "docx",
    },
    {
      id: "k4-cd2",
      code: "Chủ đề 2",
      title: "Chủ đề 2: Mạng máy tính và Internet",
      lessonsSummary: "Các loại thông tin chính trên trang web (văn bản, hình ảnh, âm thanh, video, siêu liên kết) và tác hại khi xem nội dung không phù hợp.",
      theoryPrompt:
        "SGK Tin học 4 Kết nối tri thức - Chủ đề 2: Mạng máy tính và Internet (Nhận biết các dạng thông tin trên trang web, khái niệm siêu liên kết và cách phòng tránh trang web có nội dung xấu, không phù hợp lứa tuổi).",
      practicePrompt:
        "SGK Tin học 4 Kết nối tri thức - Chủ đề 2: Mạng máy tính và Internet (Tổng hợp các dạng thông tin văn bản, hình ảnh thu thập từ trang web giáo dục vào tài liệu Word).",
      recommendedFileType: "docx",
    },
    {
      id: "k4-cd3",
      code: "Chủ đề 3",
      title: "Chủ đề 3: Lưu trữ, tìm kiếm, trao đổi thông tin",
      lessonsSummary: "Tìm kiếm thông tin trên Internet bằng từ khóa, thực hành sao chép, di chuyển, đổi tên và xóa thư mục/tệp.",
      theoryPrompt:
        "SGK Tin học 4 Kết nối tri thức - Chủ đề 3: Lưu trữ, tìm kiếm, trao đổi thông tin (Cách sử dụng máy tìm kiếm với từ khóa phù hợp, các bước sao chép, đổi tên và xóa thư mục/tệp an toàn).",
      practicePrompt:
        "SGK Tin học 4 Kết nối tri thức - Chủ đề 3: Lưu trữ, tìm kiếm, trao đổi thông tin (Tìm kiếm thông tin về Danh lam thắng cảnh Việt Nam trên Internet và lưu tệp văn bản đúng quy cách tên tệp).",
      recommendedFileType: "docx",
    },
    {
      id: "k4-cd4",
      code: "Chủ đề 4",
      title: "Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số",
      lessonsSummary: "Tôn trọng bản quyền phần mềm, phần mềm miễn phí và phần mềm có bản quyền.",
      theoryPrompt:
        "SGK Tin học 4 Kết nối tri thức - Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số (Phân biệt phần mềm miễn phí và phần mềm không miễn phí, vì sao chỉ nên sử dụng phần mềm được phép).",
      practicePrompt:
        "SGK Tin học 4 Kết nối tri thức - Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số (Thiết kế bản thông điệp Tôn trọng bản quyền phần mềm và thông tin số trên Word).",
      recommendedFileType: "docx",
    },
    {
      id: "k4-cd5",
      code: "Chủ đề 5",
      title: "Chủ đề 5: Ứng dụng tin học (Soạn thảo Word & Trình chiếu PowerPoint)",
      lessonsSummary: "Tạo bài trình chiếu có hiệu ứng chuyển trang, soạn thảo văn bản tiếng Việt có dấu, định dạng chữ và chèn ảnh.",
      theoryPrompt:
        "SGK Tin học 4 Kết nối tri thức - Chủ đề 5: Ứng dụng tin học (Quy tắc gõ chữ tiếng Việt Telex/VNI, các nút lệnh định dạng phông chữ, cỡ chữ, kiểu chữ đậm/nghiêng, màu chữ và hiệu ứng chuyển trang chiếu).",
      practicePrompt:
        "SGK Tin học 4 Kết nối tri thức - Chủ đề 5: Ứng dụng tin học (Soạn thảo văn bản tiếng Việt có dấu chủ đề Quê hương, định dạng tiêu đề chữ đậm màu đỏ cỡ 18pt căn giữa, chèn hình ảnh minh họa hoặc thiết kế 3 Slide có hiệu ứng).",
      recommendedFileType: "docx",
    },
    {
      id: "k4-cd6",
      code: "Chủ đề 6",
      title: "Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính (Scratch)",
      lessonsSummary: "Làm quen với môi trường lập trình trực quan Scratch, điều khiển nhân vật di chuyển trên sân khấu, thay đổi phông nền.",
      theoryPrompt:
        "SGK Tin học 4 Kết nối tri thức - Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính (Nhận diện các nhóm lệnh Sự kiện, Chuyển động, Hiển thị, Âm thanh trong Scratch và cách ghép khối lệnh).",
      practicePrompt:
        "SGK Tin học 4 Kết nối tri thức - Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính (Lập trình Scratch điều khiển nhân vật di chuyển trên sân khấu, phát âm thanh và nói câu chào khi bấm Lá cờ xanh).",
      recommendedFileType: "sb3",
    },
  ],
  "Lớp 5": [
    {
      id: "k5-cd1",
      code: "Chủ đề 1",
      title: "Chủ đề 1: Máy tính và em",
      lessonsSummary: "Máy tính giúp em làm những việc gì (học tập, giải trí, liên lạc, tạo sản phẩm số).",
      theoryPrompt:
        "SGK Tin học 5 Kết nối tri thức - Chủ đề 1: Máy tính và em (Nêu các công việc máy tính giúp con người thực hiện và các sản phẩm số em có thể tự tạo ra trên máy tính).",
      practicePrompt:
        "SGK Tin học 5 Kết nối tri thức - Chủ đề 1: Máy tính và em (Tạo sản phẩm văn bản số trình bày kế hoạch học tập môn Tin học lớp 5 của em).",
      recommendedFileType: "docx",
    },
    {
      id: "k5-cd2",
      code: "Chủ đề 2",
      title: "Chủ đề 2: Mạng máy tính và Internet",
      lessonsSummary: "Tìm kiếm thông tin trên website bằng từ khóa nâng cao, chọn lọc thông tin phục vụ giải quyết vấn đề.",
      theoryPrompt:
        "SGK Tin học 5 Kết nối tri thức - Chủ đề 2: Mạng máy tính và Internet (Cách xác định từ khóa tìm kiếm chính xác, đánh giá độ phù hợp của thông tin tìm được trên website và hợp tác trao đổi thông tin).",
      practicePrompt:
        "SGK Tin học 5 Kết nối tri thức - Chủ đề 2: Mạng máy tính và Internet (Tìm kiếm thông tin, hình ảnh trên Internet và thiết kế bài trình chiếu 3 Slide tổng hợp kết quả).",
      recommendedFileType: "pptx",
    },
    {
      id: "k5-cd3",
      code: "Chủ đề 3",
      title: "Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin",
      lessonsSummary: "Tạo cấu trúc cây thư mục hợp lý, tìm kiếm tệp và thư mục nhanh chóng trên máy tính.",
      theoryPrompt:
        "SGK Tin học 5 Kết nối tri thức - Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin (Cách thiết kế cây thư mục khoa học, sử dụng công cụ Search trong File Explorer để tìm tệp và thư mục).",
      practicePrompt:
        "SGK Tin học 5 Kết nối tri thức - Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin (Thực hành tạo sản phẩm và đặt tên tệp chuẩn hóa theo cấu trúc thư mục lớp học).",
      recommendedFileType: "docx",
    },
    {
      id: "k5-cd4",
      code: "Chủ đề 4",
      title: "Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số",
      lessonsSummary: "Bản quyền nội dung thông tin (văn bản, hình ảnh, video), ghi nguồn tác giả khi sử dụng thông tin của người khác.",
      theoryPrompt:
        "SGK Tin học 5 Kết nối tri thức - Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số (Tôn trọng bản quyền nội dung thông tin, những việc nên làm và không nên làm khi sử dụng bài viết, hình ảnh của người khác).",
      practicePrompt:
        "SGK Tin học 5 Kết nối tri thức - Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số (Soạn văn bản giới thiệu di tích lịch sử có chèn ảnh và ghi rõ nguồn trích dẫn tác giả đúng quy định bản quyền).",
      recommendedFileType: "docx",
    },
    {
      id: "k5-cd5",
      code: "Chủ đề 5",
      title: "Chủ đề 5: Ứng dụng tin học (Soạn thảo nâng cao & 2 Mạch phân hóa 5A / 5B)",
      lessonsSummary: "Định dạng trang văn bản nâng cao; Phân hóa 2 mạch lựa chọn: 5A (Phần mềm đồ họa) và 5B (Công cụ đa phương tiện).",
      theoryPrompt:
        "SGK Tin học 5 Kết nối tri thức - Chủ đề 5: Ứng dụng tin học (Định dạng văn bản nâng cao, chèn bảng/ảnh và kiến thức về phần mềm đồ họa hoặc công cụ biên tập đa phương tiện).",
      practicePrompt:
        "SGK Tin học 5 Kết nối tri thức - Chủ đề 5: Ứng dụng tin học (Thực hành trình bày văn bản nhiều đoạn có tiêu đề nổi bật, căn lề chuẩn và chèn sản phẩm đồ họa/đa phương tiện).",
      recommendedFileType: "docx",
      subtracks: [
        {
          id: "5-common",
          label: "Chung: Soạn thảo & Định dạng Văn bản Word nâng cao",
          theoryPrompt:
            "SGK Tin học 5 Kết nối tri thức - Chủ đề 5: Soạn thảo văn bản nâng cao (Căn lề đoạn văn, khoảng cách dòng, chèn và căn chỉnh hình ảnh minh họa, kiểm tra lỗi chính tả).",
          practicePrompt:
            "SGK Tin học 5 Kết nối tri thức - Chủ đề 5: Thực hành soạn thảo văn bản nhiều đoạn, tiêu đề chữ đậm màu đỏ cỡ 18pt căn giữa, căn đều hai bên và chèn ảnh căn giữa.",
          recommendedFileType: "docx",
        },
        {
          id: "5A-graphic",
          label: "Mạch lựa chọn 5A: Sử dụng phần mềm đồ họa",
          theoryPrompt:
            "SGK Tin học 5 Kết nối tri thức - Chủ đề 5A: Sử dụng phần mềm đồ họa (Các công cụ vẽ hình cơ bản, tô màu, ghép các chi tiết đồ họa tạo sản phẩm hoàn chỉnh).",
          practicePrompt:
            "SGK Tin học 5 Kết nối tri thức - Chủ đề 5A: Thiết kế bài trình chiếu hoặc tài liệu giới thiệu sản phẩm đồ họa do em vẽ bằng phần mềm máy tính.",
          recommendedFileType: "pptx",
        },
        {
          id: "5B-multimedia",
          label: "Mạch lựa chọn 5B: Sử dụng công cụ đa phương tiện",
          theoryPrompt:
            "SGK Tin học 5 Kết nối tri thức - Chủ đề 5B: Sử dụng công cụ đa phương tiện (Cách thu thập ảnh, âm thanh, sắp xếp chuỗi hình ảnh và hiệu ứng tạo sản phẩm đa phương tiện).",
          practicePrompt:
            "SGK Tin học 5 Kết nối tri thức - Chủ đề 5B: Tạo sản phẩm trình chiếu đa phương tiện gồm 3 Slide có hình ảnh, âm thanh và hiệu ứng chuyển cảnh sinh động.",
          recommendedFileType: "pptx",
        },
      ],
    },
    {
      id: "k5-cd6",
      code: "Chủ đề 6",
      title: "Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính (Scratch)",
      lessonsSummary: "Cấu trúc tuần tự, cấu trúc lặp (repeat, forever), cấu trúc rẽ nhánh (if-then-else), biến và biểu thức trong Scratch.",
      theoryPrompt:
        "SGK Tin học 5 Kết nối tri thức - Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính (Phân biệt khối lệnh lặp có số lần biết trước repeat, lặp liên tục forever, câu lệnh rẽ nhánh và sử dụng biến nhớ trong Scratch).",
      practicePrompt:
        "SGK Tin học 5 Kết nối tri thức - Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính (Lập trình Scratch sử dụng vòng lặp repeat(4) điều khiển nhân vật di chuyển vẽ hình vuông cạnh 100 bước, xoay 90 độ và phát âm thanh).",
      recommendedFileType: "sb3",
    },
  ],
};

export function buildTheoryChecklistFromExam(exam: TheoryExam) {
  const items: Assignment["checklist"] = [];
  const mcqs = exam.multipleChoice || [];
  if (mcqs.length > 0) {
    const mcqTotal = Number(
      mcqs.reduce((acc, q) => acc + Number(q.points || 0), 0).toFixed(2)
    );
    items.push({
      id: "c-mcq",
      criterion: `Trắc nghiệm khách quan (${mcqs.length} câu hỏi)`,
      technicalTarget: "Auto-Grader 100% Instant Match",
      maxPoints: mcqTotal > 0 ? mcqTotal : 6.0,
      commonElementaryMistake: "Đọc lướt câu hỏi nên chọn nhầm phương án nhiễu",
    });
  }

  const essays =
    exam.shortAnswers && exam.shortAnswers.length > 0
      ? exam.shortAnswers
      : exam.shortAnswer && exam.shortAnswer.points > 0
      ? [exam.shortAnswer]
      : [];

  essays.forEach((sa, idx) => {
    items.push({
      id: `c-nlp-${idx + 1}`,
      criterion:
        essays.length > 1
          ? `Tự luận câu ${idx + 1}: ${sa.question}`
          : `Tự luận ngắn NLP: ${sa.question}`,
      technicalTarget: "NLP Semantic Equivalence (Nhận diện câu trả lời đồng nghĩa)",
      maxPoints: Number(sa.points || 2.0),
      commonElementaryMistake: "Diễn đạt theo ngôn ngữ nói tự nhiên của học sinh tiểu học",
    });
  });

  if (exam.semesterBlueprint?.practiceTasks?.length) {
    exam.semesterBlueprint.practiceTasks.forEach((pt, idx) => {
      items.push({
        id: `c-prac-${idx + 1}`,
        criterion: `Phần II - Thực hành ${idx + 1} (${pt.softwareType}): ${pt.title}`,
        technicalTarget: `DOM/XML/AST Scanner (${pt.softwareType})`,
        maxPoints: Number(pt.points || 4.0),
        commonElementaryMistake: "Chưa lưu đúng tên tệp hoặc thiếu định dạng theo yêu cầu",
      });
    });
  }

  return items;
}

export const STRICT_STEP3_STEP4_DIRECTIVE =
  "Tạo đề kiểm tra chỉ dựa trên nội dung của chủ đề đã chọn ở Bước 3, sử dụng tài liệu đã tải lên ở Bước 4, và không thêm bất kỳ kiến thức ngoài nào.";

interface TopicPureQuestionItem {
  question: string;
  cognitiveLevel: CognitiveLevel;
  illustrationNote: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface TopicPureEssayItem {
  question: string;
  cognitiveLevel: CognitiveLevel;
  illustrationNote: string;
  sampleAnswer: string;
  gradingGuide: string;
  semanticKeywords: string[];
}

function getTopicPureBank(
  grade: GradeLevel,
  topicObj: KnttTopicConfig,
  focusKnowledgeNote: string,
  teacherCustomIdeaNote: string,
  referenceDocText: string,
  referenceFileName?: string | null,
  subtrackId: string = "5-common"
) {
  return getGradeAndTopicPureBank(
    grade,
    topicObj,
    focusKnowledgeNote,
    teacherCustomIdeaNote,
    referenceDocText,
    referenceFileName,
    subtrackId
  );
}

// Bộ sinh Đề Thi Học Kỳ chuẩn 4 nguyên tắc khảo thí Tiểu học (Bám sát các Chủ đề Bước 3 & Tài liệu Bước 4)
function buildFallbackSemesterExam(params: {
  grade: GradeLevel;
  semesterType: "Học kỳ I" | "Học kỳ II" | "Giữa Học kỳ I" | "Giữa Học kỳ II";
  schoolYear: string;
  durationMinutes: number;
  theoryPercent: number;
  practicePercent: number;
  nhanBietPercent: number;
  thongHieuPercent: number;
  vanDungPercent: number;
  mcqCount: number;
  essayCount: number;
  practiceCount: number;
  topicPrompt: string;
  topicObj?: KnttTopicConfig;
  topicObjs?: KnttTopicConfig[];
  focusKnowledgeNote?: string;
  teacherCustomIdeaNote?: string;
  referenceDocText?: string;
  referenceFileName?: string | null;
  subtrackId?: string;
}): TheoryExam {
  const {
    grade,
    semesterType,
    schoolYear,
    durationMinutes,
    theoryPercent,
    practicePercent,
    nhanBietPercent,
    thongHieuPercent,
    vanDungPercent,
    mcqCount,
    essayCount,
    practiceCount,
    topicObj = KNTT_CURRICULUM[grade]?.[0] || KNTT_CURRICULUM["Lớp 4"][0],
    topicObjs,
    focusKnowledgeNote = "",
    teacherCustomIdeaNote = "",
    referenceDocText = "",
    referenceFileName = null,
    subtrackId = "5-common",
  } = params;

  const activeTopics =
    topicObjs && topicObjs.length > 0 ? topicObjs : [topicObj];
  const combinedTopicsLabel =
    activeTopics.length === 1
      ? activeTopics[0].title
      : activeTopics.map((t) => t.code).join(", ");

  const targetMcq = Math.min(20, Math.max(1, mcqCount));
  const targetEssay = Math.min(5, Math.max(0, essayCount));
  const targetPractice = Math.min(4, Math.max(1, practiceCount));

  const totalTheoryPoints = Number(((theoryPercent / 100) * 10).toFixed(2));
  const totalPracticePoints = Number((10.0 - totalTheoryPoints).toFixed(2));

  const essayPointsTotal =
    targetEssay > 0 ? Math.min(2.5, Number((totalTheoryPoints * 0.35).toFixed(2))) : 0;
  const mcqPointsTotal = Number((totalTheoryPoints - essayPointsTotal).toFixed(2));
  const ptPerMcq = Number((mcqPointsTotal / targetMcq).toFixed(2));
  const ptPerEssay = targetEssay > 0 ? Number((essayPointsTotal / targetEssay).toFixed(2)) : 0;
  const ptPerPractice = Number((totalPracticePoints / targetPractice).toFixed(2));

  const topicBanks = activeTopics.map((t) =>
    getTopicPureBank(
      grade,
      t,
      focusKnowledgeNote,
      teacherCustomIdeaNote,
      referenceDocText,
      referenceFileName,
      subtrackId
    )
  );

  const multipleChoice = Array.from({ length: targetMcq }, (_, idx) => {
    const bank = topicBanks[idx % topicBanks.length];
    const itemIdx = Math.floor(idx / topicBanks.length) % bank.mcqs.length;
    const item = bank.mcqs[itemIdx];
    const cleanQ = cleanQuestionText(item.question);
    const note = cleanIllustrationCaption(item.illustrationNote) || cleanQ;
    return {
      id: `sem-mcq-${idx + 1}-${Date.now()}`,
      question: cleanQ,
      cognitiveLevel: item.cognitiveLevel,
      illustrationNote: note,
      illustrationImageDataUrl: generateIllustrationDataUrl(note, idx),
      illustrationVariant: idx,
      options: item.options,
      correctIndex: item.correctIndex,
      explanation: item.explanation,
      points: ptPerMcq,
    };
  });

  const shortAnswers = Array.from({ length: targetEssay }, (_, idx) => {
    const bank = topicBanks[idx % topicBanks.length];
    const saIdx = Math.floor(idx / topicBanks.length) % bank.essays.length;
    const sa = bank.essays[saIdx];
    const cleanQ = cleanQuestionText(sa.question);
    const note = cleanIllustrationCaption(sa.illustrationNote) || cleanQ;
    return {
      id: `sem-sa-${idx + 1}-${Date.now()}`,
      question: cleanQ,
      cognitiveLevel: sa.cognitiveLevel,
      illustrationNote: note,
      illustrationImageDataUrl: generateIllustrationDataUrl(note, idx),
      illustrationVariant: idx,
      sampleAnswer: sa.sampleAnswer,
      gradingGuide: sa.gradingGuide,
      semanticKeywords: sa.semanticKeywords,
      points: ptPerEssay,
    };
  });

  const practiceTasks: SemesterPracticeTask[] = Array.from(
    { length: targetPractice },
    (_, idx) => {
      const bank = topicBanks[idx % topicBanks.length];
      const note =
        cleanIllustrationCaption(bank.practiceTask.illustrationNote) ||
        bank.practiceTask.title;
      return {
        id: `sem-prac-${idx + 1}-${Date.now()}`,
        title: `Bài thực hành ${idx + 1}: ${bank.practiceTask.title}`,
        cognitiveLevel: bank.practiceTask.cognitiveLevel,
        softwareType: bank.practiceTask.softwareType,
        instructions: bank.practiceTask.instructions,
        illustrationNote: note,
        illustrationImageDataUrl: generateIllustrationDataUrl(note, idx),
        illustrationVariant: idx,
        points: ptPerPractice,
        gradingRubric: bank.practiceTask.gradingRubric,
      };
    }
  );

  const answerKeyLines = [
    `I. ĐÁP ÁN PHẦN I — TRẮC NGHIỆM KHÁCH QUAN (${mcqPointsTotal.toFixed(2)} điểm — Bám sát ${combinedTopicsLabel}):`,
    ...multipleChoice.map(
      (q, i) =>
        `- Câu ${i + 1} [${q.cognitiveLevel}]: Đáp án đúng là ${
          q.options[q.correctIndex]
        } (${q.points.toFixed(2)} điểm). Giải thích: ${q.explanation}`
    ),
    "",
    `II. HƯỚNG DẪN CHẤM PHẦN II — TỰ LUẬN & THỰC HÀNH (${(
      essayPointsTotal + totalPracticePoints
    ).toFixed(2)} điểm):`,
    ...shortAnswers.map(
      (sa, i) =>
        `- Câu tự luận ${i + 1} (${sa.points.toFixed(2)} điểm) [${sa.cognitiveLevel}]: ${
          sa.sampleAnswer
        } (${sa.gradingGuide || ""})`
    ),
    ...practiceTasks.map(
      (pt, i) =>
        `- Bài thực hành ${i + 1} (${pt.points.toFixed(2)} điểm) [${pt.cognitiveLevel} - ${
          pt.softwareType
        }]:\n${pt.gradingRubric}`
    ),
  ];

  return enrichExamWithAutoIllustrations({
    id: `sem-exam-${Date.now()}`,
    title: `Đề Kiểm tra Định kỳ ${semesterType} Môn Tin học ${grade} — ${combinedTopicsLabel}${
      referenceFileName ? ` (Tài liệu: ${referenceFileName})` : ""
    }`,
    grade,
    durationMinutes,
    multipleChoice,
    shortAnswer: shortAnswers[0] || {
      id: `sa-empty-${Date.now()}`,
      question: "Không có câu hỏi tự luận.",
      sampleAnswer: "",
      semanticKeywords: [],
      points: 0,
    },
    shortAnswers,
    semesterBlueprint: {
      isSemesterExam: true,
      semesterType,
      schoolYear,
      theoryPercent,
      practicePercent,
      nhanBietPercent,
      thongHieuPercent,
      vanDungPercent,
      practiceTasks,
      answerKeyAndGradingGuide: answerKeyLines.join("\n"),
    },
  });
}

// Local fallback builder in case AI server is busy after 3 retries — Bám sát 100% các Chủ đề Bước 3 & Tài liệu Bước 4
function buildFallbackExam(
  grade: GradeLevel,
  topicTitle: string,
  promptText: string,
  mcqCount: number = 4,
  essayCount: number = 1,
  topicObj?: KnttTopicConfig,
  focusKnowledgeNote: string = "",
  teacherCustomIdeaNote: string = "",
  referenceDocText: string = "",
  referenceFileName?: string | null,
  subtrackId: string = "5-common",
  topicObjs?: KnttTopicConfig[]
): TheoryExam {
  const targetCount = Math.min(20, Math.max(0, mcqCount));
  const targetEssayCount = Math.min(10, Math.max(0, essayCount));

  const resolvedTopicObj =
    topicObj ||
    (KNTT_CURRICULUM[grade] || KNTT_CURRICULUM["Lớp 4"]).find((t) =>
      topicTitle.includes(t.code)
    ) ||
    (KNTT_CURRICULUM[grade] || KNTT_CURRICULUM["Lớp 4"])[0];

  const activeTopics =
    topicObjs && topicObjs.length > 0 ? topicObjs : [resolvedTopicObj];

  const topicBanks = activeTopics.map((t) =>
    getTopicPureBank(
      grade,
      t,
      focusKnowledgeNote,
      teacherCustomIdeaNote,
      referenceDocText,
      referenceFileName,
      subtrackId
    )
  );

  const totalMcqPoints =
    targetEssayCount === 0
      ? 10.0
      : targetCount === 0
      ? 0
      : Math.max(4.0, Number((10.0 - Math.min(6.0, targetEssayCount * 2.0)).toFixed(2)));
  const totalEssayPoints = Number((10.0 - totalMcqPoints).toFixed(2));

  const pointPerMcq = targetCount > 0 ? Number((totalMcqPoints / targetCount).toFixed(2)) : 0;
  const generatedMcqs = Array.from({ length: targetCount }, (_, idx) => {
    const bank = topicBanks[idx % topicBanks.length];
    const itemIdx = Math.floor(idx / topicBanks.length) % bank.mcqs.length;
    const template = bank.mcqs[itemIdx];
    const cleanQ = cleanQuestionText(template.question);
    const note = cleanIllustrationCaption(template.illustrationNote) || cleanQ;
    return {
      id: `mcq-${idx + 1}-${Date.now()}`,
      question: cleanQ,
      cognitiveLevel: template.cognitiveLevel,
      illustrationNote: note,
      illustrationImageDataUrl: generateIllustrationDataUrl(note, idx),
      illustrationVariant: idx,
      options: template.options,
      correctIndex: template.correctIndex,
      explanation: template.explanation,
      points: pointPerMcq,
    };
  });

  const pointPerEssay =
    targetEssayCount > 0 ? Number((totalEssayPoints / targetEssayCount).toFixed(2)) : 0;
  const generatedEssays = Array.from({ length: targetEssayCount }, (_, idx) => {
    const bank = topicBanks[idx % topicBanks.length];
    const saIdx = Math.floor(idx / topicBanks.length) % bank.essays.length;
    const item = bank.essays[saIdx];
    const cleanQ = cleanQuestionText(item.question);
    const note = cleanIllustrationCaption(item.illustrationNote) || cleanQ;
    return {
      id: `sa-${idx + 1}-${Date.now()}`,
      question: cleanQ,
      cognitiveLevel: item.cognitiveLevel,
      illustrationNote: note,
      illustrationImageDataUrl: generateIllustrationDataUrl(note, idx),
      illustrationVariant: idx,
      sampleAnswer: item.sampleAnswer,
      gradingGuide: item.gradingGuide,
      semanticKeywords: item.semanticKeywords,
      points: pointPerEssay,
    };
  });

  const defaultShortAnswer = generatedEssays[0] || {
    id: `sa-empty-${Date.now()}`,
    question: "Không có câu hỏi tự luận trong đề này.",
    sampleAnswer: "",
    semanticKeywords: [],
    points: 0,
  };

  return enrichExamWithAutoIllustrations({
    id: `exam-${Date.now()}`,
    title: `Đề Kiểm tra (${grade}) — ${topicTitle}`,
    grade,
    durationMinutes: Math.max(15, (targetCount + targetEssayCount * 2) * 3),
    multipleChoice: generatedMcqs,
    shortAnswer: defaultShortAnswer,
    shortAnswers: generatedEssays,
  });
}

function buildFallbackPracticeAssignment(
  grade: GradeLevel,
  className: string,
  fileType: PracticeFileType,
  topicTitle: string,
  promptText: string,
  indexNum: number,
  taskCount: number = 4,
  topicObj?: KnttTopicConfig,
  subtrackId: string = "5-common"
): Assignment {
  const targetTasks = Math.min(10, Math.max(2, taskCount));
  const pointsPerTask = Number((10.0 / targetTasks).toFixed(1));
  const resolvedTopic =
    topicObj ||
    (KNTT_CURRICULUM[grade] || KNTT_CURRICULUM["Lớp 4"])[0];
  const pureBank = getTopicPureBank(
    grade,
    resolvedTopic,
    "",
    "",
    "",
    null,
    subtrackId
  );

  if (fileType === "sb3") {
    const sb3Pool =
      grade === "Lớp 3"
        ? [
            {
              criterion: `Câu 1: [${grade} - ${resolvedTopic.code}] Sắp xếp đúng thứ tự các bước thực hiện công việc tuần tự từ bước đầu đến bước cuối`,
              technicalTarget: "AST Opcode: event_whenflagclicked & Sequential Block Order",
              commonElementaryMistake: "Sắp xếp nhầm thứ tự bước sau lên trước bước đầu",
            },
            {
              criterion: `Câu 2: [${grade} - ${resolvedTopic.code}] Xác định đúng Điều kiện và Hành động trong quy tắc "Nếu... thì..."`,
              technicalTarget: "AST Opcode: looks_sayforsecs & Conditional Step Check",
              commonElementaryMistake: "Nhầm lẫn giữa phần điều kiện và phần hành động thực hiện",
            },
            {
              criterion: `Câu 3: [${grade} - ${resolvedTopic.code}] Chia việc lớn thành các việc nhỏ hơn, dễ thực hiện theo đúng bài học ${grade}`,
              technicalTarget: "Block Sequence & Sprite Action Verification",
              commonElementaryMistake: "Bỏ sót bước kiểm tra kết quả sau khi hoàn thành",
            },
            {
              criterion: `Câu 4: [${grade} - ${resolvedTopic.code}] Lưu tệp bài làm đúng tên theo quy định của lớp ${className}`,
              technicalTarget: "File Header & ZIP project.json Validation",
              commonElementaryMistake: "Để tên mặc định mà chưa đổi tên theo cú pháp",
            },
          ]
        : grade === "Lớp 5"
        ? [
            {
              criterion: `Câu 1: [Lớp 5 - ${resolvedTopic.code}] Khởi tạo sự kiện Lá cờ xanh và tạo biến nhớ (Variables: Điểm / Thời gian) đặt giá trị ban đầu = 0`,
              technicalTarget: "AST Opcode: event_whenflagclicked & data_setvariableto (0)",
              commonElementaryMistake: "Quên đặt lại giá trị biến Điểm = 0 khi bắt đầu chương trình",
            },
            {
              criterion: `Câu 2: [Lớp 5 - ${resolvedTopic.code}] Sử dụng cấu trúc lặp (forever / repeat) kết hợp khối rẽ nhánh có điều kiện (if...then / if...then...else)`,
              technicalTarget: "AST Opcode: control_forever / control_repeat & control_if",
              commonElementaryMistake: "Đặt khối kiểm tra điều kiện if ở ngoài vòng lặp nên chỉ kiểm tra 1 lần",
            },
            {
              criterion: `Câu 3: [Lớp 5 - ${resolvedTopic.code}] Sử dụng phép toán so sánh/cộng trừ và thay đổi giá trị biến số khi thỏa mãn điều kiện`,
              technicalTarget: "AST Opcode: data_changevariableby & operator_gt / operator_equals",
              commonElementaryMistake: "Dùng nhầm khối Đặt biến (set) thay vì Thay đổi biến (change)",
            },
            {
              criterion: `Câu 4: [Lớp 5 - ${resolvedTopic.code}] Sử dụng công cụ Bút vẽ (Pen) hoặc vòng lặp lồng nhau để vẽ hình trang trí / thông báo kết quả`,
              technicalTarget: "AST Opcode: pen_penDown & looks_sayforsecs",
              commonElementaryMistake: "Quên đặt lệnh Đặt bút (Pen Down) hoặc nhập sai góc xoay",
            },
            {
              criterion: `Câu 5: [Lớp 5 - ${resolvedTopic.code}] Chạy thử, gỡ lỗi (Debug) kịch bản và lưu tệp dự án Scratch (.sb3) đúng quy định`,
              technicalTarget: "File Header & ZIP project.json Validation",
              commonElementaryMistake: "Để tên mặc định Untitled.sb3 mà chưa đổi tên theo cú pháp",
            },
          ]
        : [
            {
              criterion: `Câu 1: [Lớp 4 - ${resolvedTopic.code}] Khởi tạo sự kiện Khi bấm vào lá cờ xanh (when green flag clicked)`,
              technicalTarget: "AST Opcode: event_whenflagclicked (topLevel: true)",
              commonElementaryMistake: "Kéo khối lệnh chuyển động nhưng quên gắn khối Lá cờ xanh ở đầu",
            },
            {
              criterion: `Câu 2: [Lớp 4 - ${resolvedTopic.code}] Ghép các khối lệnh Chuyển động (Di chuyển, Xoay góc) đúng thứ tự tuần tự để điều khiển nhân vật`,
              technicalTarget: "AST Opcode: motion_movesteps & motion_turnright",
              commonElementaryMistake: "Nhập sai góc xoay hoặc số bước khiến nhân vật đi lệch hướng",
            },
            {
              criterion: `Câu 3: [Lớp 4 - ${resolvedTopic.code}] Sử dụng khối lệnh Hiển thị (Nói "Xin chào!" trong 2 giây) và Đợi (wait 1 seconds)`,
              technicalTarget: "AST Opcode: looks_sayforsecs & control_wait",
              commonElementaryMistake: "Quên thêm khối lệnh Đợi (wait) giữa các hành động liên tiếp",
            },
            {
              criterion: `Câu 4: [Lớp 4 - ${resolvedTopic.code}] Phát âm thanh chúc mừng và lưu tệp dự án Scratch (.sb3) đúng tên quy định`,
              technicalTarget: "AST Opcode: sound_playuntildone & File Header Validation",
              commonElementaryMistake: "Để tên mặc định Untitled.sb3 mà chưa đổi tên theo cú pháp",
            },
          ];

    const checklist = Array.from({ length: targetTasks }, (_, idx) => {
      const item = sb3Pool[idx % sb3Pool.length];
      return {
        id: `s-${idx + 1}-${Date.now()}`,
        criterion:
          idx < sb3Pool.length
            ? item.criterion
            : `Câu ${idx + 1}: [${grade} - ${resolvedTopic.code}] ${item.criterion.replace(/^Câu \d+:\s*(\[[^\]]+\]\s*)?/, "")}`,
        technicalTarget: item.technicalTarget,
        maxPoints: pointsPerTask,
        commonElementaryMistake: item.commonElementaryMistake,
      };
    });

    return {
      id: `asg-${Date.now()}`,
      code: `BaiScratch_${grade.replace(/\s+/g, "")}_${indexNum}`,
      title: `${topicTitle} (${grade} - SGK KNTT - ${targetTasks} câu thực hành)`,
      grade,
      className,
      fileType: "sb3",
      studentPrompt: `${pureBank.practiceTask.instructions} (Hoàn thành đủ ${targetTasks} tiêu chí thực hành của ${grade}).`,
      standardFileNamePattern: `MaHS_HoTen_${className.replace(/\s+/g, "")}_BaiScratch${indexNum}.sb3`,
      templateSummary: {
        headingText: `DỰ ÁN THỰC HÀNH (${grade.toUpperCase()}): ${topicTitle.toUpperCase()}`,
        bodyLines: checklist.map((c) => c.criterion),
        scratchBlocksRequired:
          grade === "Lớp 5"
            ? ["event_whenflagclicked", "control_forever", "control_if", "data_changevariableby"]
            : ["event_whenflagclicked", "motion_movesteps", "motion_turnright", "looks_sayforsecs"],
      },
      checklist,
    };
  }

  if (fileType === "pptx") {
    const pptxPool =
      grade === "Lớp 3"
        ? [
            {
              criterion: `Câu 1: [Lớp 3 - ${resolvedTopic.code}] Tạo bài trình chiếu gồm 2–3 trang chiếu (Slide) giới thiệu chủ đề gần gũi (Gia đình / Em yêu thiên nhiên)`,
              technicalTarget: "ppt/slides/slide1..N.xml & Layout Schema",
              commonElementaryMistake: "Mới tạo 1 trang chiếu hoặc để trống tiêu đề",
            },
            {
              criterion: `Câu 2: [Lớp 3 - ${resolvedTopic.code}] Gõ tiêu đề và họ tên học sinh trên trang chiếu mở đầu rõ ràng`,
              technicalTarget: "Slide 1 <a:t> Title & Subtitle Text Nodes",
              commonElementaryMistake: "Quên ghi họ tên và lớp trên trang chiếu đầu tiên",
            },
            {
              criterion: `Câu 3: [Lớp 3 - ${resolvedTopic.code}] Chèn hình ảnh minh họa (Insert -> Pictures) vào trang chiếu nội dung và thay đổi kích thước hợp lý`,
              technicalTarget: "<p:pic> XML nodes & Image Bounding Box",
              commonElementaryMistake: "Chèn ảnh quá to che mất phần chữ trên trang chiếu",
            },
            {
              criterion: `Câu 4: [Lớp 3 - ${resolvedTopic.code}] Trình chiếu toàn màn hình (F5) kiểm tra và lưu tệp đúng định dạng .pptx`,
              technicalTarget: "OOXML Presentation Content-Type & Filename Regex",
              commonElementaryMistake: "Lưu nhầm tên Presentation1.pptx mặc định",
            },
          ]
        : [
            {
              criterion: `Câu 1: [${grade} - ${resolvedTopic.code}] Tạo đủ số lượng Slide theo yêu cầu và chọn bố cục (Layout) hợp lý`,
              technicalTarget: "ppt/slides/slide1..N.xml & Layout Schema",
              commonElementaryMistake: "Mới tạo 1-2 slide hoặc để trống khung tiêu đề",
            },
            {
              criterion: `Câu 2: [${grade} - ${resolvedTopic.code}] Trình bày Slide Tiêu đề nổi bật kèm Họ tên và Lớp của học sinh`,
              technicalTarget: "Slide 1 <a:t> Title & Subtitle Text Nodes",
              commonElementaryMistake: "Quên ghi họ tên học sinh trên trang chiếu mở đầu",
            },
            {
              criterion: `Câu 3: [${grade} - ${resolvedTopic.code}] Chèn hình ảnh minh họa rõ nét và định dạng màu chữ tương phản với nền Slide`,
              technicalTarget: "<p:bg> & <p:pic> XML nodes",
              commonElementaryMistake: "Chọn màu chữ trùng với màu nền hoặc quên chèn ảnh",
            },
            {
              criterion: `Câu 4: [${grade} - ${resolvedTopic.code}] Gán hiệu ứng chuyển trang (Transitions) và hiệu ứng động (Animations) cho đối tượng`,
              technicalTarget: "<p:transition> & <p:timing><p:anim> XML Properties",
              commonElementaryMistake: "Chỉ gán hiệu ứng cho Slide 1 mà quên gán cho các slide còn lại",
            },
            {
              criterion: `Câu 5: [${grade} - ${resolvedTopic.code}] Lưu bài trình chiếu đúng định dạng .pptx và đặt tên tệp đúng cú pháp`,
              technicalTarget: "OOXML Presentation Content-Type & Filename Regex",
              commonElementaryMistake: "Lưu nhầm tên Presentation1.pptx mặc định",
            },
          ];

    const checklist = Array.from({ length: targetTasks }, (_, idx) => {
      const item = pptxPool[idx % pptxPool.length];
      return {
        id: `p-${idx + 1}-${Date.now()}`,
        criterion:
          idx < pptxPool.length
            ? item.criterion
            : `Câu ${idx + 1}: [${grade} - ${resolvedTopic.code}] ${item.criterion.replace(/^Câu \d+:\s*(\[[^\]]+\]\s*)?/, "")}`,
        technicalTarget: item.technicalTarget,
        maxPoints: pointsPerTask,
        commonElementaryMistake: item.commonElementaryMistake,
      };
    });

    return {
      id: `asg-${Date.now()}`,
      code: `BaiPPT_${grade.replace(/\s+/g, "")}_${indexNum}`,
      title: `${topicTitle} (${grade} - SGK KNTT - ${targetTasks} câu thực hành)`,
      grade,
      className,
      fileType: "pptx",
      studentPrompt: `${pureBank.practiceTask.instructions} (Thực hiện đủ ${targetTasks} yêu cầu thực hành của ${grade}).`,
      standardFileNamePattern: `MaHS_HoTen_${className.replace(/\s+/g, "")}_BaiPPT${indexNum}.pptx`,
      templateSummary: {
        headingText: `${topicTitle.toUpperCase()} - ${grade} (${targetTasks} CÂU THỰC HÀNH)`,
        bodyLines: checklist.map((c) => c.criterion),
        slideCountRequired: grade === "Lớp 3" ? 3 : Math.max(3, targetTasks - 1),
      },
      checklist,
    };
  }

  // Default: Word (.docx) theo đúng khối Lớp 3 / Lớp 4 / Lớp 5
  const docxPool =
    grade === "Lớp 3"
      ? [
          {
            criterion: `Câu 1: [Lớp 3 - ${resolvedTopic.code}] Tạo thư mục / tệp bài làm đúng tên quy định của học sinh Lớp 3`,
            technicalTarget: "File Header & ZIP/OOXML Content-Type",
            commonElementaryMistake: "Đặt tên tệp chưa đúng quy tắc HọTên_Lớp",
          },
          {
            criterion: `Câu 2: [Lớp 3 - ${resolvedTopic.code}] Đặt ngón tay đúng hàng phím cơ sở (F, J) và gõ đúng các dòng văn bản thực hành theo chủ đề`,
            technicalTarget: "DOM Text Node Regex & Content Completeness",
            commonElementaryMistake: "Gõ thiếu dòng nội dung hoặc chưa dùng phím Enter để xuống dòng",
          },
          {
            criterion: `Câu 3: [Lớp 3 - ${resolvedTopic.code}] Viết hoa chữ cái đầu câu và tên riêng đúng quy tắc`,
            technicalTarget: "Unicode Uppercase First Letter Check",
            commonElementaryMistake: "Quên nhấn giữ phím Shift hoặc Caps Lock khi gõ chữ hoa đầu câu",
          },
          {
            criterion: `Câu 4: [Lớp 3 - ${resolvedTopic.code}] Lưu tệp bài làm an toàn vào đúng thư mục học tập trên máy tính`,
            technicalTarget: "OOXML Document Structure Integrity",
            commonElementaryMistake: "Đóng cửa sổ phần mềm mà quên bấm lệnh Save (Lưu)",
          },
        ]
      : grade === "Lớp 5"
      ? [
          {
            criterion: `Câu 1: [Lớp 5 - ${resolvedTopic.code}] Đặt tên tệp chuẩn quy ước và thiết lập bố cục trang văn bản đa phương tiện (.docx)`,
            technicalTarget: "File Header & Page Layout XML Check",
            commonElementaryMistake: "Đặt sai tên tệp hoặc lưu nhầm thư mục",
          },
          {
            criterion: `Câu 2: [Lớp 5 - ${resolvedTopic.code}] Định dạng Tiêu đề lớn nổi bật (Bold, cỡ chữ 16–18pt, màu sắc hài hòa, căn giữa)`,
            technicalTarget: "<w:b/>, <w:color/>, <w:sz/>, <w:jc w:val='center'/>",
            commonElementaryMistake: "Quên căn giữa tiêu đề hoặc chọn cỡ chữ quá nhỏ",
          },
          {
            criterion: `Câu 3: [Lớp 5 - ${resolvedTopic.code}] Tạo bảng biểu (Insert Table) hoặc chia cột và điền đầy đủ thông tin, căn chỉnh độ rộng cột đẹp mắt`,
            technicalTarget: "<w:tbl>, <w:tr>, <w:tc> & Paragraph Alignment",
            commonElementaryMistake: "Tạo bảng thiếu hàng/cột hoặc chưa định dạng hàng tiêu đề bảng",
          },
          {
            criterion: `Câu 4: [Lớp 5 - ${resolvedTopic.code}] Chèn hình ảnh minh họa và thiết lập chế độ bố trí ảnh (Wrap Text: Square/Tight) hài hòa với chữ`,
            technicalTarget: "<w:drawing> / <wp:wrapSquare> / <wp:wrapTight>",
            commonElementaryMistake: "Chèn ảnh nhưng chưa chỉnh Wrap Text khiến ảnh đẩy lệch dòng chữ",
          },
          {
            criterion: `Câu 5: [Lớp 5 - ${resolvedTopic.code}] Kiểm tra chính tả Tiếng Việt có dấu, căn đều hai bên (Justify) và lưu tệp hoàn chỉnh`,
            technicalTarget: "<w:jc w:val='both'/> & Unicode NFC Check",
            commonElementaryMistake: "Đặt dấu câu cách xa từ đứng trước hoặc quên căn lề đoạn văn",
          },
        ]
      : [
          {
            criterion: `Câu 1: [Lớp 4 - ${resolvedTopic.code}] Đặt tên tệp & Lưu đúng định dạng văn bản chuẩn (.docx)`,
            technicalTarget: "File Header & ZIP/OOXML Content-Type",
            commonElementaryMistake: "Đặt sai tên tệp hoặc lưu nhầm định dạng",
          },
          {
            criterion: `Câu 2: [Lớp 4 - ${resolvedTopic.code}] Định dạng Tiêu đề chữ đậm (Bold), màu đỏ (#DC2626), cỡ chữ 16–18pt, căn giữa`,
            technicalTarget: "<w:b/>, <w:color w:val='DC2626'/>, <w:sz w:val='36'/>, <w:jc w:val='center'/>",
            commonElementaryMistake: "Quên đổi cỡ chữ tiêu đề hoặc quên căn giữa",
          },
          {
            criterion: `Câu 3: [Lớp 4 - ${resolvedTopic.code}] Gõ đúng chính tả Tiếng Việt có dấu (Telex/VNI) & Viết hoa chữ cái đầu mỗi dòng`,
            technicalTarget: "DOM Text Node Regex & Unicode NFC Check",
            commonElementaryMistake: "Quên nhấn giữ phím Shift để viết hoa chữ cái đầu dòng",
          },
          {
            criterion: `Câu 4: [Lớp 4 - ${resolvedTopic.code}] Chèn hình ảnh minh họa (Insert -> Pictures) và căn giữa trang văn bản`,
            technicalTarget: "<w:drawing> / <w:pict> kèm thuộc tính <w:jc w:val='center'/>",
            commonElementaryMistake: "Chèn ảnh xong để lệch trái, chưa bấm nút Center",
          },
          {
            criterion: `Câu 5: [Lớp 4 - ${resolvedTopic.code}] Căn đều hai bên (Justify) cho đoạn văn nội dung và định dạng chữ nghiêng (Italic) dòng tác giả`,
            technicalTarget: "<w:jc w:val='both'/> & <w:i/>",
            commonElementaryMistake: "Quên bôi đen văn bản trước khi bấm nút lệnh chữ nghiêng I",
          },
        ];

  const checklist = Array.from({ length: targetTasks }, (_, idx) => {
    const item = docxPool[idx % docxPool.length];
    return {
      id: `w-${idx + 1}-${Date.now()}`,
      criterion:
        idx < docxPool.length
          ? item.criterion
          : `Câu ${idx + 1}: [${grade} - ${resolvedTopic.code}] ${item.criterion.replace(/^Câu \d+:\s*(\[[^\]]+\]\s*)?/, "")}`,
      technicalTarget: item.technicalTarget,
      maxPoints: pointsPerTask,
      commonElementaryMistake: item.commonElementaryMistake,
    };
  });

  return {
    id: `asg-${Date.now()}`,
    code: `BaiWord_${grade.replace(/\s+/g, "")}_${indexNum}`,
    title: `${topicTitle} (${grade} - SGK KNTT - ${targetTasks} câu thực hành)`,
    grade,
    className,
    fileType: "docx",
    studentPrompt: `${pureBank.practiceTask.instructions} (Thực hiện đủ ${targetTasks} yêu cầu thực hành của ${grade}).`,
    standardFileNamePattern: `MaHS_HoTen_${className.replace(/\s+/g, "")}_BaiWord${indexNum}.docx`,
    templateSummary: {
      headingText: `BÀI THỰC HÀNH ${grade.toUpperCase()}: ${topicTitle.toUpperCase()} (${targetTasks} CÂU)`,
      bodyLines: checklist.map((c) => c.criterion),
      requiredFont: "Times New Roman",
      requiredSizePt: 18,
      requiredColorHex: "#DC2626",
    },
    checklist,
  };
}

export const AiExamBuilderView: React.FC<AiExamBuilderViewProps> = ({
  assignments,
  classes = [],
  onAddAssignment,
  onDeleteAssignment,
}) => {
  const savedDraft = loadExamBuilderDraft();
  const initialGrade: GradeLevel = savedDraft?.grade || "Lớp 4";
  const initialTopic =
    (KNTT_CURRICULUM[initialGrade] || KNTT_CURRICULUM["Lớp 4"]).find(
      (t) => t.id === savedDraft?.selectedTopicId
    ) || (KNTT_CURRICULUM[initialGrade] || KNTT_CURRICULUM["Lớp 4"])[4] || KNTT_CURRICULUM["Lớp 4"][0];
  const initialNotes = getDefaultStep4NotesForGradeAndTopic(
    initialGrade,
    initialTopic,
    savedDraft?.selectedSubtrackId || "5-common"
  );

  // Bước 1: Chọn Khối lớp & Chọn nhiều lớp giao bài trong cùng khối lớp
  const [grade, setGrade] = useState<GradeLevel>(initialGrade);
  const initialGradeClassNames = classes
    .filter((c) => c.grade === initialGrade)
    .map((c) => c.name);
  const [selectedClassNames, setSelectedClassNames] = useState<string[]>(
    Array.isArray(savedDraft?.selectedClassNames) && savedDraft.selectedClassNames.length > 0
      ? savedDraft.selectedClassNames
      : initialGradeClassNames.length > 0
      ? [initialGradeClassNames[0]]
      : ["Lớp 4/1"]
  );
  const [className, setClassName] = useState<string>(
    savedDraft?.className || initialGradeClassNames[0] || "Lớp 4/1"
  );

  // Bước 3: Chọn 1 hoặc nhiều Chủ đề SGK Tin học KNTT đúng theo Khối lớp Bước 1
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    savedDraft?.selectedTopicId || initialTopic.id
  );
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    Array.isArray(savedDraft?.selectedTopicIds) && savedDraft.selectedTopicIds.length > 0
      ? savedDraft.selectedTopicIds
      : [initialTopic.id]
  );
  const [selectedSubtrackId, setSelectedSubtrackId] = useState<string>(
    savedDraft?.selectedSubtrackId || "5-common"
  );

  // Bước 2: Chọn Loại đề (Thực hành / Lý thuyết / Bài kiểm tra hàng tháng / Đề thi Học kỳ)
  const [builderMode, setBuilderMode] = useState<
    "practice" | "theory" | "monthly" | "semester"
  >(savedDraft?.builderMode || "semester");
  const [monthlyExamMonth, setMonthlyExamMonth] = useState<string>(
    savedDraft?.monthlyExamMonth || "Tháng 10 (Chủ đề 1 & 2)"
  );
  const [monthlyExamFormat, setMonthlyExamFormat] = useState<
    "combined" | "theory_only" | "practice_only"
  >(savedDraft?.monthlyExamFormat || "combined");
  const [fileType, setFileType] = useState<PracticeFileType>(
    savedDraft?.fileType || "theory"
  );
  const [theoryQuestionCount, setTheoryQuestionCount] = useState<number>(
    savedDraft?.theoryQuestionCount ?? 6
  );
  const [theoryEssayCount, setTheoryEssayCount] = useState<number>(
    savedDraft?.theoryEssayCount ?? 1
  );
  const [practiceTaskCount, setPracticeTaskCount] = useState<number>(
    savedDraft?.practiceTaskCount ?? 4
  );

  // Cấu hình riêng cho Chuyên gia Khảo thí — Tạo Đề Thi Học Kỳ
  const [semesterType, setSemesterType] = useState<
    "Học kỳ I" | "Học kỳ II" | "Giữa Học kỳ I" | "Giữa Học kỳ II"
  >(savedDraft?.semesterType || "Học kỳ I");
  const [semesterSchoolYear, setSemesterSchoolYear] = useState<string>(
    savedDraft?.semesterSchoolYear || "2026 - 2027"
  );
  const [semesterDuration, setSemesterDuration] = useState<number>(
    savedDraft?.semesterDuration ?? 35
  );
  const [semesterTheoryPercent, setSemesterTheoryPercent] = useState<number>(
    savedDraft?.semesterTheoryPercent ?? 50
  );
  const [semesterPracticePercent, setSemesterPracticePercent] = useState<number>(
    savedDraft?.semesterPracticePercent ?? 50
  );
  const [semesterNhanBietPercent, setSemesterNhanBietPercent] = useState<number>(
    savedDraft?.semesterNhanBietPercent ?? 40
  );
  const [semesterThongHieuPercent, setSemesterThongHieuPercent] = useState<number>(
    savedDraft?.semesterThongHieuPercent ?? 30
  );
  const [semesterVanDungPercent, setSemesterVanDungPercent] = useState<number>(
    savedDraft?.semesterVanDungPercent ?? 30
  );
  const [semesterPracticeCount, setSemesterPracticeCount] = useState<number>(
    savedDraft?.semesterPracticeCount ?? 1
  );

  const [topicInput, setTopicInput] = useState<string>(
    savedDraft?.topicInput ||
      `Đề thi định kỳ Học kỳ I môn Tin học ${initialGrade} — ${initialTopic.title}: ${initialTopic.theoryPrompt}`
  );

  // [GHI CHÚ TRỌNG TÂM] trong Bước 4 — tự động đồng bộ chuẩn theo Khối lớp (Bước 1) & Chủ đề (Bước 3)
  const [focusKnowledgeNote, setFocusKnowledgeNote] = useState<string>(
    savedDraft?.focusKnowledgeNote || initialNotes.focusNote
  );
  const [teacherCustomIdeaNote, setTeacherCustomIdeaNote] = useState<string>(
    savedDraft?.teacherCustomIdeaNote || initialNotes.customIdeaNote
  );
  const [strictConstraintNote, setStrictConstraintNote] = useState<string>(
    savedDraft?.strictConstraintNote ||
      "Bám sát 100% tài liệu SGK Tin học đã đính kèm, không sáng tạo thêm các phần kiến thức ngoài."
  );

  // Nguồn "Từ Tài liệu khác" (Ma trận dạng văn bản, File Sách PDF, Đề thi mẫu)
  const [referenceDocType, setReferenceDocType] = useState<string>(
    savedDraft?.referenceDocType || "Ma trận / Đặc tả đề kiểm tra (Văn bản)"
  );
  const [uploadedDataFileName, setUploadedDataFileName] = useState<string | null>(
    savedDraft?.uploadedDataFileName || null
  );
  const [referenceDocText, setReferenceDocText] = useState<string>(
    savedDraft?.referenceDocText || ""
  );
  const [referencePdfBase64, setReferencePdfBase64] = useState<string>("");

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedAssignment, setGeneratedAssignment] = useState<Assignment | null>(
    savedDraft?.generatedAssignment || null
  );
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [confirmingDeleteAsgId, setConfirmingDeleteAsgId] = useState<string | null>(null);
  const [generatingIllustrationMap, setGeneratingIllustrationMap] = useState<Record<string, boolean>>({});

  // Tự động lưu nháp cấu hình & đề đang soạn/chỉnh sửa mỗi khi giáo viên thao tác
  useEffect(() => {
    const draftPayload = {
      grade,
      selectedClassNames,
      className,
      selectedTopicId,
      selectedTopicIds,
      selectedSubtrackId,
      builderMode,
      monthlyExamMonth,
      monthlyExamFormat,
      fileType,
      theoryQuestionCount,
      theoryEssayCount,
      practiceTaskCount,
      semesterType,
      semesterSchoolYear,
      semesterDuration,
      semesterTheoryPercent,
      semesterPracticePercent,
      semesterNhanBietPercent,
      semesterThongHieuPercent,
      semesterVanDungPercent,
      semesterPracticeCount,
      topicInput,
      focusKnowledgeNote,
      teacherCustomIdeaNote,
      strictConstraintNote,
      referenceDocType,
      uploadedDataFileName,
      referenceDocText,
      generatedAssignment,
      savedAt: new Date().toLocaleString("vi-VN"),
    };
    saveExamBuilderDraft(draftPayload);
    const timer = setTimeout(() => {
      syncStateToCodebase({ examBuilderDraft: draftPayload });
    }, 600);
    return () => clearTimeout(timer);
  }, [
    grade,
    selectedClassNames,
    className,
    selectedTopicId,
    selectedTopicIds,
    selectedSubtrackId,
    builderMode,
    monthlyExamMonth,
    monthlyExamFormat,
    fileType,
    theoryQuestionCount,
    theoryEssayCount,
    practiceTaskCount,
    semesterType,
    semesterSchoolYear,
    semesterDuration,
    semesterTheoryPercent,
    semesterPracticePercent,
    semesterNhanBietPercent,
    semesterThongHieuPercent,
    semesterVanDungPercent,
    semesterPracticeCount,
    topicInput,
    focusKnowledgeNote,
    teacherCustomIdeaNote,
    strictConstraintNote,
    referenceDocType,
    uploadedDataFileName,
    referenceDocText,
    generatedAssignment,
  ]);

  const currentGradeTopics = KNTT_CURRICULUM[grade] || KNTT_CURRICULUM["Lớp 4"];
  const selectedTopicObjs: KnttTopicConfig[] = (() => {
    const matched = currentGradeTopics.filter((t) => selectedTopicIds.includes(t.id));
    if (matched.length > 0) return matched;
    const single = currentGradeTopics.find((t) => t.id === selectedTopicId) || currentGradeTopics[0];
    return [single];
  })();
  const activeTopicObj = selectedTopicObjs[0] || currentGradeTopics[0];
  const selectedTopicsTitleSummary =
    selectedTopicObjs.length === 1
      ? activeTopicObj.title
      : selectedTopicObjs.map((t) => t.title).join(" + ");
  const selectedTopicsShortCodes =
    selectedTopicObjs.length === 1
      ? activeTopicObj.code
      : selectedTopicObjs.map((t) => t.code).join(", ");
  const selectedTopicsLessonsSummary =
    selectedTopicObjs.length === 1
      ? activeTopicObj.lessonsSummary
      : selectedTopicObjs.map((t) => `[${t.code}] ${t.lessonsSummary}`).join(" | ");
  const topicWithSubtracks = selectedTopicObjs.find(
    (t) => t.subtracks && t.subtracks.length > 0
  );

  const matchingClassesForGrade = classes.filter((c) => c.grade === grade);
  const toggleTargetClass = (clsName: string) => {
    setSelectedClassNames((prev) => {
      const exists = prev.includes(clsName);
      const next = exists
        ? prev.length > 1
          ? prev.filter((c) => c !== clsName)
          : prev
        : [...prev, clsName];
      const nextLabel = formatTargetClassesLabel(next, grade);
      setClassName(nextLabel);
      setGeneratedAssignment((curr) =>
        curr && curr.grade === grade
          ? { ...curr, className: nextLabel, targetClassNames: next }
          : curr
      );
      return next;
    });
  };
  const selectAllClassesInGrade = () => {
    const allNames = matchingClassesForGrade.map((c) => c.name);
    if (allNames.length === 0) return;
    const nextLabel = formatTargetClassesLabel(allNames, grade);
    setSelectedClassNames(allNames);
    setClassName(nextLabel);
    setGeneratedAssignment((curr) =>
      curr && curr.grade === grade
        ? { ...curr, className: nextLabel, targetClassNames: allNames }
        : curr
    );
  };
  const selectSingleFirstClassInGrade = () => {
    const first = matchingClassesForGrade[0]?.name || className;
    setSelectedClassNames([first]);
    setClassName(first);
    setGeneratedAssignment((curr) =>
      curr && curr.grade === grade
        ? { ...curr, className: first, targetClassNames: [first] }
        : curr
    );
  };
  const hasStep4Material = Boolean(
    uploadedDataFileName || referenceDocText.trim() || referencePdfBase64
  );

  const applyStep4StrictDirective = (
    topicTitleForFocus?: string,
    targetGrade: GradeLevel = grade,
    targetTopicObj: KnttTopicConfig = activeTopicObj,
    targetSubtrackId: string = selectedSubtrackId
  ) => {
    const targetTopicTitle = topicTitleForFocus || selectedTopicsTitleSummary || targetTopicObj.title;
    const syncedNotes = getDefaultStep4NotesForGradeAndTopic(
      targetGrade,
      targetTopicObj,
      targetSubtrackId
    );
    setStrictConstraintNote(STRICT_STEP3_STEP4_DIRECTIVE);
    setFocusKnowledgeNote(
      `${STRICT_STEP3_STEP4_DIRECTIVE} (Khối ${targetGrade} — Chủ đề Bước 3: ${targetTopicTitle})`
    );
    setTeacherCustomIdeaNote(syncedNotes.customIdeaNote);
    setTopicInput(STRICT_STEP3_STEP4_DIRECTIVE);
  };

  // Nạp nhanh Ma trận Đề thi Học kỳ Mẫu chuẩn BGD&ĐT để Giáo viên test 1 click
  const handleLoadSampleSemesterMatrix = () => {
    setReferenceDocType("Ma trận / Đặc tả đề kiểm tra (Văn bản)");
    const sampleFileName = `MaTran_DeThi_${semesterType.replace(/\s+/g, "")}_${grade.replace(
      /\s+/g,
      ""
    )}.txt`;
    setUploadedDataFileName(sampleFileName);
    const sampleMatrix = `MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ ${semesterType.toUpperCase()} — MÔN TIN HỌC ${grade.toUpperCase()} (SÁCH KẾT NỐI TRI THỨC)
- Khối lớp đã chọn ở Bước 1: ${grade}
- Các chủ đề trọng tâm đã chọn ở Bước 3 (${selectedTopicObjs.length} chủ đề): ${selectedTopicsTitleSummary} (${selectedTopicsLessonsSummary})
1. Tỷ lệ điểm số:
- Phần Lý thuyết (Trắc nghiệm + Tự luận): ${semesterTheoryPercent}% (${(
      semesterTheoryPercent / 10
    ).toFixed(1)} điểm)
- Phần Thực hành trên máy tính: ${semesterPracticePercent}% (${(
      semesterPracticePercent / 10
    ).toFixed(1)} điểm)
2. Tỷ lệ mức độ nhận thức:
- Mức 1 (Nhận biết): ${semesterNhanBietPercent}% — Nhận diện biểu tượng, khái niệm cơ bản của ${grade} thuộc ${selectedTopicsShortCodes} (Có hình ảnh minh họa).
- Mức 2 (Thông hiểu): ${semesterThongHieuPercent}% — Hiểu thao tác và quy tắc thực hiện của ${grade} thuộc ${selectedTopicsShortCodes}.
- Mức 3 (Vận dụng): ${semesterVanDungPercent}% — Vận dụng xử lý tình huống thực tế và thực hành của ${grade} thuộc ${selectedTopicsShortCodes}.
3. Cấu trúc đề:
- PHẦN I: TRẮC NGHIỆM (${theoryQuestionCount} câu) — Bắt buộc có thẻ [HÌNH ẢNH MINH HỌA: ...].
- PHẦN II: TỰ LUẬN & THỰC HÀNH (${theoryEssayCount} câu tự luận + ${semesterPracticeCount} bài thực hành) — Kèm Đáp án và Hướng dẫn chấm chi tiết từng câu.`;
    setReferenceDocText(sampleMatrix);
    applyStep4StrictDirective(selectedTopicsTitleSummary, grade, activeTopicObj, selectedSubtrackId);
  };

  const syncNotesAndPromptForTopics = (
    nextTopics: KnttTopicConfig[],
    targetGrade: GradeLevel = grade,
    targetSubtrackId: string = selectedSubtrackId
  ) => {
    if (nextTopics.length === 0) return;
    const primaryTopic = nextTopics[0];
    const combinedTitles = nextTopics.map((t) => t.title).join(" + ");
    const combinedFocusNotes = nextTopics
      .map(
        (t) =>
          getDefaultStep4NotesForGradeAndTopic(targetGrade, t, targetSubtrackId).focusNote
      )
      .join(" | ");
    const primaryCustomNote = getDefaultStep4NotesForGradeAndTopic(
      targetGrade,
      primaryTopic,
      targetSubtrackId
    ).customIdeaNote;

    if (builderMode === "monthly" && monthlyExamFormat === "practice_only") {
      setFileType(primaryTopic.recommendedFileType);
    } else if (builderMode === "practice") {
      setFileType(primaryTopic.recommendedFileType);
    }

    if (hasStep4Material) {
      applyStep4StrictDirective(combinedTitles, targetGrade, primaryTopic, targetSubtrackId);
    } else {
      setFocusKnowledgeNote(combinedFocusNotes);
      setTeacherCustomIdeaNote(primaryCustomNote);
      const combinedTheoryPrompt = nextTopics.map((t) => t.theoryPrompt).join(" Kết hợp: ");
      const combinedPracticePrompt = nextTopics
        .map((t) => t.practicePrompt)
        .join(" Kết hợp: ");
      if (builderMode === "monthly") {
        setTopicInput(
          `Bài kiểm tra định kỳ hàng tháng (${monthlyExamMonth}) môn Tin học ${targetGrade} — ${combinedTitles}: ${combinedTheoryPrompt}`
        );
      } else if (builderMode === "semester") {
        setTopicInput(
          `Đề thi định kỳ ${semesterType} môn Tin học ${targetGrade} — Trọng tâm (${nextTopics.length} chủ đề: ${combinedTitles}): ${combinedTheoryPrompt}`
        );
      } else {
        setTopicInput(
          builderMode === "theory" ? combinedTheoryPrompt : combinedPracticePrompt
        );
      }
    }
    setErrorMsg(null);
    setSavedNotice(null);
  };

  // Khi đổi Khối lớp (Bước 1) -> Tự động đồng bộ Chủ đề Bước 3, Danh sách lớp trong khối và Ghi chú trọng tâm Bước 4 đúng theo Khối mới
  const handleGradeChange = (newGrade: GradeLevel) => {
    setGrade(newGrade);
    const matchingClsList = classes.filter((c) => c.grade === newGrade);
    const defaultClsName =
      matchingClsList[0]?.name ||
      (newGrade === "Lớp 3"
        ? "Lớp 3/1"
        : newGrade === "Lớp 4"
        ? "Lớp 4/1"
        : "Lớp 5/1");
    setSelectedClassNames([defaultClsName]);
    setClassName(defaultClsName);

    const topicsOfGrade = KNTT_CURRICULUM[newGrade];
    const selectedIndices = selectedTopicIds
      .map((id) => currentGradeTopics.findIndex((t) => t.id === id))
      .filter((idx) => idx >= 0);
    const mappedTopics =
      selectedIndices.length > 0
        ? selectedIndices.map((idx) => topicsOfGrade[idx] || topicsOfGrade[0])
        : [topicsOfGrade[0]];
    const uniqueMappedIds = Array.from(new Set(mappedTopics.map((t) => t.id)));
    const defaultTopic = mappedTopics[0] || topicsOfGrade[0];
    setSelectedTopicId(defaultTopic.id);
    setSelectedTopicIds(uniqueMappedIds);
    setSelectedSubtrackId("5-common");

    syncNotesAndPromptForTopics(mappedTopics, newGrade, "5-common");
  };

  // Chọn / bỏ chọn nhiều chủ đề cùng lúc ở Bước 3
  const handleToggleTopicSelection = (topicId: string) => {
    const exists = selectedTopicIds.includes(topicId);
    const nextIds = exists
      ? selectedTopicIds.length > 1
        ? selectedTopicIds.filter((id) => id !== topicId)
        : selectedTopicIds
      : [...selectedTopicIds, topicId];

    // Giữ đúng thứ tự Chủ đề 1 -> 6
    const orderedTopics = currentGradeTopics.filter((t) => nextIds.includes(t.id));
    const orderedIds = orderedTopics.map((t) => t.id);

    setSelectedTopicIds(orderedIds);
    setSelectedTopicId(orderedIds[0] || topicId);
    syncNotesAndPromptForTopics(orderedTopics, grade, selectedSubtrackId);
  };

  const handleSelectTopicPreset = (preset: "all" | "hk1" | "hk2" | "single", singleId?: string) => {
    let targetTopics: KnttTopicConfig[] = [];
    if (preset === "all") {
      targetTopics = [...currentGradeTopics];
    } else if (preset === "hk1") {
      targetTopics = currentGradeTopics.slice(0, 3);
    } else if (preset === "hk2") {
      targetTopics = currentGradeTopics.slice(3, 6);
    } else if (preset === "single") {
      const found =
        currentGradeTopics.find((t) => t.id === singleId) || currentGradeTopics[0];
      targetTopics = [found];
    }
    if (targetTopics.length === 0) return;
    const ids = targetTopics.map((t) => t.id);
    setSelectedTopicIds(ids);
    setSelectedTopicId(ids[0]);
    syncNotesAndPromptForTopics(targetTopics, grade, selectedSubtrackId);
  };

  // Khi chọn Mạch phân hóa 5A / 5B ở Chủ đề 5 Lớp 5
  const handleSubtrackChange = (subId: string) => {
    setSelectedSubtrackId(subId);
    const sub = topicWithSubtracks?.subtracks?.find((s) => s.id === subId);
    if (!sub) return;
    if (builderMode === "monthly" && monthlyExamFormat === "practice_only") {
      setFileType(sub.recommendedFileType);
    } else if (builderMode === "practice") {
      setFileType(sub.recommendedFileType);
    }
    syncNotesAndPromptForTopics(selectedTopicObjs, grade, subId);
  };

  // Khi chuyển đổi giữa Loại đề Thực hành, Lý thuyết, Bài kiểm tra hàng tháng và Đề Thi Học Kỳ (Bước 2)
  const handleModeChange = (nextMode: "practice" | "theory" | "monthly" | "semester") => {
    setBuilderMode(nextMode);
    const activeSub = activeTopicObj.subtracks?.find((s) => s.id === selectedSubtrackId);

    if (nextMode === "semester") {
      setFileType("theory");
      setTheoryQuestionCount(6);
      setTheoryEssayCount(1);
      if (hasStep4Material) {
        applyStep4StrictDirective(activeTopicObj.title);
      } else {
        setTopicInput(
          `Đề thi định kỳ ${semesterType} môn Tin học ${grade} — ${activeTopicObj.title}: Đảm bảo đúng tỷ lệ Lý thuyết ${semesterTheoryPercent}% - Thực hành ${semesterPracticePercent}%, mức độ Nhận biết ${semesterNhanBietPercent}% - Thông hiểu ${semesterThongHieuPercent}% - Vận dụng ${semesterVanDungPercent}%, có thẻ [HÌNH ẢNH MINH HỌA: ...] và Đáp án hướng dẫn chấm chi tiết.`
        );
      }
    } else if (nextMode === "monthly") {
      setTheoryQuestionCount(5);
      setTheoryEssayCount(2);
      setPracticeTaskCount(3);
      if (monthlyExamFormat === "practice_only") {
        setFileType(
          activeSub ? activeSub.recommendedFileType : activeTopicObj.recommendedFileType
        );
      } else {
        setFileType("theory");
      }
      if (hasStep4Material) {
        applyStep4StrictDirective(activeTopicObj.title);
      } else {
        setTopicInput(
          `Bài kiểm tra định kỳ hàng tháng (${monthlyExamMonth}) môn Tin học ${grade} — ${
            activeSub ? activeSub.label : activeTopicObj.title
          }: Đánh giá kiến thức trọng tâm trong tháng kết hợp câu hỏi tình huống thực tế của học sinh.`
        );
      }
    } else if (nextMode === "theory") {
      setFileType("theory");
      if (hasStep4Material) {
        applyStep4StrictDirective(activeTopicObj.title);
      } else {
        setTopicInput(
          activeSub ? activeSub.theoryPrompt : activeTopicObj.theoryPrompt
        );
      }
    } else {
      setFileType(
        activeSub ? activeSub.recommendedFileType : activeTopicObj.recommendedFileType
      );
      if (hasStep4Material) {
        applyStep4StrictDirective(activeTopicObj.title);
      } else {
        setTopicInput(
          activeSub ? activeSub.practicePrompt : activeTopicObj.practicePrompt
        );
      }
    }
    setErrorMsg(null);
    setSavedNotice(null);
  };

  // Xử lý tải lên "Từ Tài liệu khác" ở Bước 4 (Ma trận dạng văn bản, File Sách PDF, Đề thi mẫu)
  const handleReferenceDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedDataFileName(file.name);
    setErrorMsg(null);

    // Khi có tải lên ở Bước 4 -> Bắt buộc áp dụng quy tắc nghiêm ngặt cho cả "Ghi chú trọng tâm" và "Yêu cầu của giáo viên"
    applyStep4StrictDirective(activeTopicObj.title);

    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (ext === "pdf") {
      setReferenceDocType("File Sách giáo khoa / Tài liệu PDF (.pdf)");
    } else if (ext === "txt" || ext === "csv" || ext === "md") {
      setReferenceDocType("Ma trận / Đặc tả đề kiểm tra (Văn bản)");
    } else {
      setReferenceDocType("Đề thi mẫu / Bài thực hành mẫu (.docx, .pptx, .sb3)");
    }

    try {
      if (ext === "pdf") {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        const base64Str = btoa(binary);
        setReferencePdfBase64(base64Str);

        const rawLatin = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        const readableMatches = rawLatin.match(/\(([^()]{4,120})\)/g);
        const extractedPreview = readableMatches
          ? readableMatches
              .map((m) => m.slice(1, -1))
              .filter((s) => /[a-zA-Z0-9À-ỹ]/.test(s))
              .slice(0, 40)
              .join(" ")
          : "";

        setReferenceDocText(
          extractedPreview.length > 30
            ? `[Tệp PDF: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]\n${extractedPreview.slice(0, 2000)}`
            : `[Đã đính kèm tệp PDF nguyên bản: ${file.name} (${(file.size / 1024).toFixed(
                1
              )} KB) — AI sẽ đọc toàn bộ các trang trong tệp PDF này để ra đề và ma trận chấm]`
        );
      } else if (ext === "docx" || ext === "pptx" || ext === "sb3") {
        setReferencePdfBase64("");
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        let extractedText = "";

        if (ext === "docx" && zip.file("word/document.xml")) {
          const xml = await zip.file("word/document.xml")!.async("string");
          const parser = new DOMParser();
          const doc = parser.parseFromString(xml, "application/xml");
          const paragraphs = Array.from(doc.getElementsByTagName("w:p"))
            .map((p) =>
              Array.from(p.getElementsByTagName("w:t"))
                .map((t) => t.textContent || "")
                .join("")
                .trim()
            )
            .filter((line) => line.length > 0);
          extractedText = paragraphs.join("\n");
        } else if (ext === "pptx") {
          const slideKeys = Object.keys(zip.files)
            .filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
            .sort();
          const parts: string[] = [];
          for (const k of slideKeys) {
            const xml = await zip.file(k)!.async("string");
            const slideText = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            parts.push(slideText);
          }
          extractedText = parts.join("\n---\n");
        } else if (ext === "sb3" && zip.file("project.json")) {
          const jsonStr = await zip.file("project.json")!.async("string");
          extractedText = `Đề mẫu dự án Scratch (.sb3) từ tệp ${file.name}:\n${jsonStr.slice(0, 3000)}`;
        }

        const fullSnippet = (extractedText || `Tài liệu mẫu: ${file.name}`).slice(0, 8000);
        setReferenceDocText(fullSnippet);
      } else {
        setReferencePdfBase64("");
        const text = await file.text();
        setReferenceDocText(text.trim().slice(0, 8000));
      }
    } catch {
      setReferenceDocText(
        `Tài liệu tham khảo đính kèm từ máy: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      );
    }
  };

  // Gọi AI tạo đề với Retry 3 lần + Fallback thông minh bám sát cả Tài liệu khác & [GHI CHÚ TRỌNG TÂM]
  const handleGenerateWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !topicInput.trim() &&
      !focusKnowledgeNote.trim() &&
      !teacherCustomIdeaNote.trim() &&
      !referenceDocText.trim() &&
      !referencePdfBase64
    )
      return;

    setIsGenerating(true);
    setErrorMsg(null);
    setSavedNotice(null);

    const effectiveStrictRule = hasStep4Material
      ? STRICT_STEP3_STEP4_DIRECTIVE
      : strictConstraintNote.trim() ||
        "Bám sát 100% tài liệu SGK Tin học đã đính kèm, không sáng tạo thêm các phần kiến thức ngoài.";

    const effectiveTeacherRequest = hasStep4Material
      ? `${STRICT_STEP3_STEP4_DIRECTIVE} (Các chủ đề đã chọn ở Bước 3: ${selectedTopicsTitleSummary} — ${selectedTopicsLessonsSummary})`
      : topicInput;

    const structuredFocusNotesBlock = `[GHI CHÚ TRỌNG TÂM]:
- Các chủ đề đã chọn ở Bước 3 (${selectedTopicObjs.length} chủ đề): ${selectedTopicsTitleSummary} (${selectedTopicsLessonsSummary})
- Phần kiến thức trọng tâm cần tập trung ra đề: ${
      hasStep4Material
        ? `${STRICT_STEP3_STEP4_DIRECTIVE} — ${focusKnowledgeNote.trim()}`
        : focusKnowledgeNote.trim() || selectedTopicsTitleSummary
    }
- Ý tưởng riêng của giáo viên: ${
      teacherCustomIdeaNote.trim() ||
      "Tạo câu hỏi gắn với tình huống thực tế của học sinh tiểu học"
    }
- Yêu cầu ràng buộc: ${effectiveStrictRule}`;

    const fullTopicWithNotes = `${
      builderMode === "monthly" ? `[BÀI KIỂM TRA HÀNG THÁNG - ${monthlyExamMonth}] ` : ""
    }[YÊU CẦU CỦA GIÁO VIÊN]: ${effectiveTeacherRequest}\n\n${structuredFocusNotesBlock}`;

    const combinedTopicPrompt = referenceDocText.trim()
      ? `${fullTopicWithNotes}\n[Tài liệu đã tải lên ở Bước 4 (${referenceDocType}${
          uploadedDataFileName ? ` - ${uploadedDataFileName}` : ""
        })]: ${referenceDocText.slice(0, 4000)}`
      : fullTopicWithNotes;

    const isPracticeGeneration =
      builderMode === "practice" ||
      (builderMode === "monthly" && monthlyExamFormat === "practice_only");

    const maxRetries = 3;
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
      attempt++;
      try {
        if (builderMode === "semester") {
          const res = await fetch("/api/ai/generate-semester-exam", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              grade,
              gradeCurriculumBoundary: getGradeCurriculumBoundaryPrompt(grade),
              semesterType,
              schoolYear: semesterSchoolYear,
              durationMinutes: semesterDuration,
              theoryPercent: semesterTheoryPercent,
              practicePercent: semesterPracticePercent,
              nhanBietPercent: semesterNhanBietPercent,
              thongHieuPercent: semesterThongHieuPercent,
              vanDungPercent: semesterVanDungPercent,
              mcqCount: theoryQuestionCount,
              essayCount: theoryEssayCount,
              practiceCount: semesterPracticeCount,
              topic: fullTopicWithNotes,
              selectedTopicTitle: selectedTopicsTitleSummary,
              selectedTopicLessons: selectedTopicsLessonsSummary,
              selectedSubtrackId,
              hasStep4UploadedMaterial: hasStep4Material,
              focusKnowledgeNote: hasStep4Material
                ? `${STRICT_STEP3_STEP4_DIRECTIVE} ${focusKnowledgeNote}`
                : focusKnowledgeNote,
              teacherCustomIdeaNote,
              strictConstraintNote: effectiveStrictRule,
              referenceDocText,
              referencePdfBase64,
              referenceDocType,
              referenceFileName: uploadedDataFileName || "",
            }),
          });

          if (res.status === 503 || res.status === 429) {
            if (attempt < maxRetries) {
              await new Promise((r) => setTimeout(r, 1200 * attempt));
              continue;
            }
          }

          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || "Máy chủ AI đang bận.");
          }

          const normalizedMcqs = (data.multipleChoice || []).map((q: any, idx: number) => ({
            id: q.id || `sem-mcq-${idx + 1}-${Date.now()}`,
            question: q.question || `Câu trắc nghiệm ${idx + 1}`,
            cognitiveLevel: (q.cognitiveLevel as CognitiveLevel) || "Nhận biết",
            illustrationNote: q.illustrationNote || "",
            options: Array.isArray(q.options) ? q.options : ["A", "B", "C", "D"],
            correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
            explanation: q.explanation || "",
            points: Number(q.points || 1.0),
          }));

          const rawEssays = Array.isArray(data.shortAnswers)
            ? data.shortAnswers.slice(0, theoryEssayCount)
            : [];

          const normalizedEssays = rawEssays.map((sa: any, idx: number) => ({
            id: sa.id || `sem-sa-${idx + 1}-${Date.now()}`,
            question: sa.question || `Câu tự luận ${idx + 1}`,
            cognitiveLevel: (sa.cognitiveLevel as CognitiveLevel) || "Thông hiểu",
            illustrationNote: sa.illustrationNote || "",
            sampleAnswer: sa.sampleAnswer || "",
            gradingGuide: sa.gradingGuide || "",
            semanticKeywords: Array.isArray(sa.semanticKeywords) ? sa.semanticKeywords : [],
            points: Number(sa.points || 1.5),
          }));

          const normalizedPracticeTasks: SemesterPracticeTask[] = Array.isArray(data.practiceTasks)
            ? data.practiceTasks.map((pt: any, idx: number) => ({
                id: pt.id || `sem-prac-${idx + 1}-${Date.now()}`,
                title: pt.title || `Bài thực hành ${idx + 1}`,
                cognitiveLevel: (pt.cognitiveLevel as CognitiveLevel) || "Vận dụng",
                softwareType: pt.softwareType || "Word (.docx)",
                instructions: pt.instructions || "",
                illustrationNote: pt.illustrationNote || "",
                points: Number(pt.points || 4.0),
                gradingRubric: pt.gradingRubric || "",
              }))
            : [];

          const semExam: TheoryExam = {
            id: `sem-exam-${Date.now()}`,
            title:
              data.title ||
              `Đề Kiểm tra Định kỳ ${semesterType} Môn Tin học ${grade} (${selectedTopicsShortCodes} · Năm học ${semesterSchoolYear})`,
            grade,
            durationMinutes: Number(data.durationMinutes || semesterDuration),
            multipleChoice: normalizedMcqs,
            shortAnswer: normalizedEssays[0] || {
              id: `sa-empty-${Date.now()}`,
              question: "Không có câu hỏi tự luận.",
              sampleAnswer: "",
              semanticKeywords: [],
              points: 0,
            },
            shortAnswers: normalizedEssays,
            semesterBlueprint: {
              isSemesterExam: true,
              semesterType,
              schoolYear: semesterSchoolYear,
              theoryPercent: semesterTheoryPercent,
              practicePercent: semesterPracticePercent,
              nhanBietPercent: semesterNhanBietPercent,
              thongHieuPercent: semesterThongHieuPercent,
              vanDungPercent: semesterVanDungPercent,
              practiceTasks: normalizedPracticeTasks,
              answerKeyAndGradingGuide: data.answerKeyAndGradingGuide || "",
            },
          };

          const enrichedSemExam = ensureExamReserveQuestions(
            enrichExamWithAutoIllustrations(semExam, grade),
            grade,
            selectedTopicIds
          );
          const targetClsList =
            selectedClassNames.length > 0 ? selectedClassNames : [className];
          const formattedClsLabel = formatTargetClassesLabel(targetClsList, grade);

          const newAsg: Assignment = {
            id: `asg-sem-${Date.now()}`,
            code: `DeThi_${semesterType.replace(/\s+/g, "")}_${grade.replace(/\s+/g, "")}`,
            title: enrichedSemExam.title,
            grade,
            className: formattedClsLabel,
            targetClassNames: targetClsList,
            fileType: "theory",
            isSemesterExam: true,
            studentPrompt: `ĐỀ THI ĐỊNH KỲ ${semesterType.toUpperCase()} (${semesterDuration} phút) — Phần I: Trắc nghiệm (${
              enrichedSemExam.multipleChoice.length
            } câu); Phần II: Tự luận (${
              (enrichedSemExam.shortAnswers || []).length
            } câu) & Thực hành (${
              normalizedPracticeTasks.length
            } bài). Em hãy hoàn thành tất cả các câu hỏi trước khi bấm Nộp bài nhé!`,
            standardFileNamePattern: `MaHS_HoTen_${formattedClsLabel.replace(/\s+/g, "")}_DeThiHocKy.json`,
            checklist: buildTheoryChecklistFromExam(enrichedSemExam),
            theoryExam: enrichedSemExam,
          };

          setGeneratedAssignment(newAsg);
          onAddAssignment(newAsg);
          success = true;
        } else if (!isPracticeGeneration) {
          const res = await fetch("/api/ai/generate-exam", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic: fullTopicWithNotes,
              selectedTopicTitle: selectedTopicsTitleSummary,
              selectedTopicLessons: selectedTopicsLessonsSummary,
              selectedSubtrackId,
              hasStep4UploadedMaterial: hasStep4Material,
              grade,
              gradeCurriculumBoundary: getGradeCurriculumBoundaryPrompt(grade),
              mcqCount: theoryQuestionCount,
              essayCount: theoryEssayCount,
              questionCount: theoryQuestionCount + theoryEssayCount,
              isMonthlyExam: builderMode === "monthly",
              monthlyExamMonth: builderMode === "monthly" ? monthlyExamMonth : "",
              focusKnowledgeNote: hasStep4Material
                ? `${STRICT_STEP3_STEP4_DIRECTIVE} ${focusKnowledgeNote}`
                : focusKnowledgeNote,
              teacherCustomIdeaNote,
              strictConstraintNote: effectiveStrictRule,
              referenceDocText,
              referencePdfBase64,
              referenceDocType,
              referenceFileName: uploadedDataFileName || "",
            }),
          });

          if (res.status === 503 || res.status === 429) {
            if (attempt < maxRetries) {
              await new Promise((r) => setTimeout(r, 1200 * attempt));
              continue;
            }
          }

          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || "Máy chủ AI đang bận.");
          }

          const rawEssays =
            Array.isArray(data.shortAnswers) && data.shortAnswers.length > 0
              ? data.shortAnswers.slice(0, theoryEssayCount)
              : theoryEssayCount > 0 && data.shortAnswer
              ? [data.shortAnswer]
              : [];

          const normalizedEssays = rawEssays.map((sa: any, idx: number) => ({
            id: sa.id || `sa-${idx + 1}-${Date.now()}`,
            question: sa.question || `Câu tự luận ${idx + 1}`,
            sampleAnswer: sa.sampleAnswer || "",
            semanticKeywords: Array.isArray(sa.semanticKeywords) ? sa.semanticKeywords : [],
            points: Number(sa.points || 2.0),
          }));

          const normalizedMcqs = (data.multipleChoice || []).map((q: any, idx: number) => ({
            id: q.id || `mcq-${idx + 1}-${Date.now()}`,
            question: q.question || `Câu trắc nghiệm ${idx + 1}`,
            options: Array.isArray(q.options) ? q.options : ["A", "B", "C", "D"],
            correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
            explanation: q.explanation || "",
            points: Number(q.points || 1.5),
          }));

          const exam: TheoryExam = {
            id: `exam-${Date.now()}`,
            title:
              data.title ||
              (builderMode === "monthly"
                ? `Bài Kiểm tra Hàng tháng (${monthlyExamMonth}) — Tin học ${grade}: ${selectedTopicsShortCodes}`
                : uploadedDataFileName
                ? `Đề Kiểm tra ${grade} — ${selectedTopicsShortCodes} (Tài liệu: ${uploadedDataFileName})`
                : `Đề Kiểm tra ${grade} — ${selectedTopicsTitleSummary}`),
            grade,
            durationMinutes:
              data.durationMinutes ||
              Math.max(15, (theoryQuestionCount + theoryEssayCount * 2) * 3),
            multipleChoice: normalizedMcqs,
            shortAnswer: normalizedEssays[0] || {
              id: `sa-empty-${Date.now()}`,
              question: "Không có câu hỏi tự luận trong đề này.",
              sampleAnswer: "",
              semanticKeywords: [],
              points: 0,
            },
            shortAnswers: normalizedEssays,
          };

          const enrichedExam = ensureExamReserveQuestions(
            enrichExamWithAutoIllustrations(exam, grade),
            grade,
            selectedTopicIds
          );
          const targetClsList =
            selectedClassNames.length > 0 ? selectedClassNames : [className];
          const formattedClsLabel = formatTargetClassesLabel(targetClsList, grade);

          const newAsg: Assignment = {
            id: `asg-${Date.now()}`,
            code:
              builderMode === "monthly"
                ? `KiemTraThang_${assignments.length + 1}`
                : `BaiLyThuyet${assignments.length + 1}`,
            title: enrichedExam.title,
            grade,
            className: formattedClsLabel,
            targetClassNames: targetClsList,
            fileType: "theory",
            studentPrompt:
              theoryEssayCount > 0
                ? `Em hãy chọn đáp án đúng cho ${enrichedExam.multipleChoice.length} câu hỏi trắc nghiệm và trả lời đầy đủ ${(enrichedExam.shortAnswers || []).length} câu hỏi tự luận bên dưới trước khi bấm Nộp bài nhé!`
                : `Em hãy chọn đáp án đúng cho tất cả ${enrichedExam.multipleChoice.length} câu hỏi trắc nghiệm bên dưới trước khi bấm Nộp bài nhé!`,
            standardFileNamePattern:
              builderMode === "monthly"
                ? `MaHS_HoTen_${formattedClsLabel.replace(/\s+/g, "")}_KiemTraHangThang.json`
                : `MaHS_HoTen_${formattedClsLabel.replace(/\s+/g, "")}_BaiLyThuyet.json`,
            checklist: buildTheoryChecklistFromExam(enrichedExam),
            theoryExam: enrichedExam,
          };

          setGeneratedAssignment(newAsg);
          onAddAssignment(newAsg);
          success = true;
        } else {
          const res = await fetch("/api/ai/generate-rubric", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic: fullTopicWithNotes,
              selectedTopicTitle: selectedTopicsTitleSummary,
              selectedTopicLessons: selectedTopicsLessonsSummary,
              selectedSubtrackId,
              hasStep4UploadedMaterial: hasStep4Material,
              grade,
              gradeCurriculumBoundary: getGradeCurriculumBoundaryPrompt(grade),
              fileType,
              taskCount: practiceTaskCount,
              isMonthlyExam: builderMode === "monthly",
              monthlyExamMonth: builderMode === "monthly" ? monthlyExamMonth : "",
              focusKnowledgeNote: hasStep4Material
                ? `${STRICT_STEP3_STEP4_DIRECTIVE} ${focusKnowledgeNote}`
                : focusKnowledgeNote,
              teacherCustomIdeaNote,
              strictConstraintNote: effectiveStrictRule,
              referenceDocText,
              referencePdfBase64,
              referenceDocType,
              referenceFileName: uploadedDataFileName || "",
            }),
          });

          if (res.status === 503 || res.status === 429) {
            if (attempt < maxRetries) {
              await new Promise((r) => setTimeout(r, 1200 * attempt));
              continue;
            }
          }

          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || "Máy chủ AI đang bận.");
          }

          const newAsg: Assignment = {
            id: `asg-${Date.now()}`,
            code: `Bai${fileType.toUpperCase()}${assignments.length + 1}`,
            title:
              data.title ||
              (uploadedDataFileName
                ? `${selectedTopicsTitleSummary} (${grade} - Theo ${uploadedDataFileName})`
                : `${selectedTopicsTitleSummary} (${grade})`),
            grade,
            className,
            fileType,
            studentPrompt: data.studentPrompt || combinedTopicPrompt.slice(0, 300),
            standardFileNamePattern:
              data.standardFileNamePattern ||
              `MaHS_HoTen_${className.replace(/\s+/g, "")}_BaiTap.${fileType}`,
            templateSummary: data.templateSummary || {
              headingText: data.title || selectedTopicsTitleSummary,
              bodyLines: (data.checklist || []).map((c: any) => c.criterion),
            },
            checklist: data.checklist || [],
          };

          setGeneratedAssignment(newAsg);
          onAddAssignment(newAsg);
          success = true;
        }
      } catch {
        if (attempt >= maxRetries) {
          const fallbackTitle = uploadedDataFileName
            ? `${selectedTopicsTitleSummary} (Tài liệu Bước 4: ${uploadedDataFileName})`
            : selectedTopicsTitleSummary;

          if (builderMode === "semester") {
            const fallbackSemExam = buildFallbackSemesterExam({
              grade,
              semesterType,
              schoolYear: semesterSchoolYear,
              durationMinutes: semesterDuration,
              theoryPercent: semesterTheoryPercent,
              practicePercent: semesterPracticePercent,
              nhanBietPercent: semesterNhanBietPercent,
              thongHieuPercent: semesterThongHieuPercent,
              vanDungPercent: semesterVanDungPercent,
              mcqCount: theoryQuestionCount,
              essayCount: theoryEssayCount,
              practiceCount: semesterPracticeCount,
              topicPrompt: combinedTopicPrompt,
              topicObj: activeTopicObj,
              topicObjs: selectedTopicObjs,
              focusKnowledgeNote,
              teacherCustomIdeaNote,
              referenceDocText,
              referenceFileName: uploadedDataFileName,
              subtrackId: selectedSubtrackId,
            });
            const enrichedFallbackSem = ensureExamReserveQuestions(
              enrichExamWithAutoIllustrations(
                fallbackSemExam,
                grade
              ),
              grade,
              selectedTopicIds
            );
            const targetClsList =
              selectedClassNames.length > 0 ? selectedClassNames : [className];
            const formattedClsLabel = formatTargetClassesLabel(targetClsList, grade);
            const fallbackSemAsg: Assignment = {
              id: `asg-sem-${Date.now()}`,
              code: `DeThi_${semesterType.replace(/\s+/g, "")}_${grade.replace(/\s+/g, "")}`,
              title: enrichedFallbackSem.title,
              grade,
              className: formattedClsLabel,
              targetClassNames: targetClsList,
              fileType: "theory",
              isSemesterExam: true,
              studentPrompt: `ĐỀ THI ĐỊNH KỲ ${semesterType.toUpperCase()} (${semesterDuration} phút — ${selectedTopicsShortCodes}) — Phần I: Trắc nghiệm (${
                enrichedFallbackSem.multipleChoice.length
              } câu); Phần II: Tự luận & Thực hành. Em hãy hoàn thành tất cả các câu hỏi trước khi bấm Nộp bài nhé!`,
              standardFileNamePattern: `MaHS_HoTen_${formattedClsLabel.replace(/\s+/g, "")}_DeThiHocKy.json`,
              checklist: buildTheoryChecklistFromExam(enrichedFallbackSem),
              theoryExam: enrichedFallbackSem,
            };
            setGeneratedAssignment(fallbackSemAsg);
            onAddAssignment(fallbackSemAsg);
          } else if (!isPracticeGeneration) {
            const monthlyOrTheoryTitle =
              builderMode === "monthly"
                ? `Bài Kiểm tra Hàng tháng (${monthlyExamMonth}) — ${fallbackTitle}`
                : fallbackTitle;
            const fallbackExam = ensureExamReserveQuestions(
              enrichExamWithAutoIllustrations(
                buildFallbackExam(
                  grade,
                  monthlyOrTheoryTitle,
                  combinedTopicPrompt,
                  theoryQuestionCount,
                  theoryEssayCount,
                  activeTopicObj,
                  focusKnowledgeNote,
                  teacherCustomIdeaNote,
                  referenceDocText,
                  uploadedDataFileName,
                  selectedSubtrackId,
                  selectedTopicObjs
                ),
                grade
              ),
              grade,
              selectedTopicIds
            );
            const targetClsList =
              selectedClassNames.length > 0 ? selectedClassNames : [className];
            const formattedClsLabel = formatTargetClassesLabel(targetClsList, grade);
            const fallbackAsg: Assignment = {
              id: `asg-${Date.now()}`,
              code:
                builderMode === "monthly"
                  ? `KiemTraThang_${assignments.length + 1}`
                  : `BaiLyThuyet${assignments.length + 1}`,
              title: fallbackExam.title,
              grade,
              className: formattedClsLabel,
              targetClassNames: targetClsList,
              fileType: "theory",
              studentPrompt:
                theoryEssayCount > 0
                  ? `Em hãy chọn đáp án đúng cho ${fallbackExam.multipleChoice.length} câu hỏi trắc nghiệm và trả lời đầy đủ ${theoryEssayCount} câu hỏi tự luận bên dưới trước khi bấm Nộp bài nhé!`
                  : `Em hãy chọn đáp án đúng cho tất cả ${fallbackExam.multipleChoice.length} câu hỏi trắc nghiệm bên dưới trước khi bấm Nộp bài nhé!`,
              standardFileNamePattern:
                builderMode === "monthly"
                  ? `MaHS_HoTen_${formattedClsLabel.replace(/\s+/g, "")}_KiemTraHangThang.json`
                  : `MaHS_HoTen_${formattedClsLabel.replace(/\s+/g, "")}_BaiLyThuyet.json`,
              checklist: buildTheoryChecklistFromExam(fallbackExam),
              theoryExam: fallbackExam,
            };
            setGeneratedAssignment(fallbackAsg);
            onAddAssignment(fallbackAsg);
          } else {
            const targetClsList =
              selectedClassNames.length > 0 ? selectedClassNames : [className];
            const formattedClsLabel = formatTargetClassesLabel(targetClsList, grade);
            const fallbackPractice = buildFallbackPracticeAssignment(
              grade,
              formattedClsLabel,
              fileType,
              builderMode === "monthly"
                ? `Kiểm tra Hàng tháng (${monthlyExamMonth}) - ${fallbackTitle}`
                : fallbackTitle,
              combinedTopicPrompt,
              assignments.length + 1,
              practiceTaskCount,
              activeTopicObj,
              selectedSubtrackId
            );
            const assignedPractice = {
              ...fallbackPractice,
              targetClassNames: targetClsList,
            };
            setGeneratedAssignment(assignedPractice);
            onAddAssignment(assignedPractice);
          }
          setErrorMsg(
            `Đã biên soạn Đề kiểm tra bám sát 100% chương trình ${grade} (Bước 1) và nội dung "${selectedTopicsTitleSummary}" đã chọn ở Bước 3${
              hasStep4Material ? " cùng tài liệu Bước 4 (không thêm kiến thức ngoài hoặc lẫn khối lớp khác)" : ""
            }. Thầy có thể xem và chỉnh sửa chi tiết ở cột bên phải trước khi bấm Giao đề!`
          );
          success = true;
        } else {
          await new Promise((r) => setTimeout(r, 1200 * attempt));
        }
      }
    }

    setIsGenerating(false);
  };

  // ================= CÁC HÀM CHỈNH SỬA CHI TIẾT ĐỀ TRƯỚC KHI GIAO =================

  const getActiveShortAnswers = (exam: TheoryExam) => {
    if (exam.shortAnswers !== undefined) return exam.shortAnswers;
    return exam.shortAnswer && exam.shortAnswer.points > 0 ? [exam.shortAnswer] : [];
  };

  const syncTheoryExamAndChecklist = (updatedExam: TheoryExam) => {
    if (!generatedAssignment) return;
    const nextAsg: Assignment = {
      ...generatedAssignment,
      theoryExam: updatedExam,
      checklist: buildTheoryChecklistFromExam(updatedExam),
    };
    setGeneratedAssignment(nextAsg);
    if (assignments.some((a) => a.id === nextAsg.id)) {
      onAddAssignment(nextAsg);
    }
  };

  const handleAddMoreTheoryQuestion = () => {
    if (!generatedAssignment || !generatedAssignment.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const currentMcqs = exam.multipleChoice;
    const nextIdx = currentMcqs.length + 1;
    const essays = getActiveShortAnswers(exam);
    const essaySum = essays.reduce((acc, s) => acc + Number(s.points || 0), 0);
    const practiceSum =
      exam.semesterBlueprint?.practiceTasks?.reduce((acc, p) => acc + Number(p.points || 0), 0) ||
      0;
    const targetMcqTotal = Math.max(2.0, Number((10.0 - essaySum - practiceSum).toFixed(2)));
    const ptPerMcq = Number((targetMcqTotal / nextIdx).toFixed(2));

    const defaultQuestionText = "Em hãy nhập nội dung câu hỏi trắc nghiệm tại đây?";
    const defaultNote = "Biểu tượng phần mềm và giao diện máy tính";
    const newMcq = {
      id: `mcq-extra-${Date.now()}`,
      question: defaultQuestionText,
      cognitiveLevel: "Nhận biết" as CognitiveLevel,
      illustrationNote: defaultNote,
      illustrationVariant: 0,
      illustrationImageDataUrl: generateIllustrationDataUrl(
        defaultQuestionText,
        defaultNote,
        0,
        generatedAssignment.grade
      ),
      options: [
        "A. Phương án trả lời A (Đúng)",
        "B. Phương án trả lời B",
        "C. Phương án trả lời C",
        "D. Phương án trả lời D",
      ],
      correctIndex: 0,
      explanation: "Giải thích ngắn gọn vì sao phương án này đúng.",
      points: ptPerMcq,
    };
    const updatedMcqs = [...currentMcqs, newMcq].map((q) => ({
      ...q,
      points: ptPerMcq,
    }));

    const nextExam = ensureExamReserveQuestions(
      {
        ...exam,
        multipleChoice: updatedMcqs,
      },
      generatedAssignment.grade,
      selectedTopicIds
    );

    syncTheoryExamAndChecklist(nextExam);
  };

  const handleRemoveTheoryQuestion = (indexToRemove: number) => {
    if (!generatedAssignment || !generatedAssignment.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const currentMcqs = exam.multipleChoice;
    if (currentMcqs.length <= 1) return;
    const filtered = currentMcqs.filter((_, idx) => idx !== indexToRemove);
    const nextCount = filtered.length;
    const essays = getActiveShortAnswers(exam);
    const essaySum = essays.reduce((acc, s) => acc + Number(s.points || 0), 0);
    const practiceSum =
      exam.semesterBlueprint?.practiceTasks?.reduce((acc, p) => acc + Number(p.points || 0), 0) ||
      0;
    const targetMcqTotal = Math.max(2.0, Number((10.0 - essaySum - practiceSum).toFixed(2)));
    const ptPerMcq = Number((targetMcqTotal / nextCount).toFixed(2));

    const updatedMcqs = filtered.map((q) => ({
      ...q,
      points: ptPerMcq,
    }));

    syncTheoryExamAndChecklist({
      ...exam,
      multipleChoice: updatedMcqs,
    });
  };

  const handleUpdateMcqField = (
    qIndex: number,
    field:
      | "question"
      | "correctIndex"
      | "explanation"
      | "points"
      | "illustrationNote"
      | "cognitiveLevel"
      | "illustrationImageDataUrl"
      | "hasNoIllustration",
    value: string | number | boolean
  ) => {
    if (!generatedAssignment || !generatedAssignment.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const updatedMcqs = exam.multipleChoice.map((q, idx) =>
      idx === qIndex ? { ...q, [field]: value } : q
    );
    syncTheoryExamAndChecklist({
      ...exam,
      multipleChoice: updatedMcqs,
    });
  };

  const handleUploadMcqIllustrationImage = (
    qIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !generatedAssignment?.theoryExam) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const exam = generatedAssignment.theoryExam!;
        const updatedMcqs = exam.multipleChoice.map((q, idx) =>
          idx === qIndex
            ? {
                ...q,
                illustrationImageDataUrl: reader.result as string,
                hasNoIllustration: false,
              }
            : q
        );
        syncTheoryExamAndChecklist({
          ...exam,
          multipleChoice: updatedMcqs,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveMcqIllustration = (qIdx: number) => {
    if (!generatedAssignment?.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const nextMcqs = exam.multipleChoice.map((q, idx) =>
      idx === qIdx
        ? {
            ...q,
            illustrationImageDataUrl: "",
            hasNoIllustration: true,
          }
        : q
    );
    syncTheoryExamAndChecklist({ ...exam, multipleChoice: nextMcqs });
  };

  const handleRestoreMcqIllustration = (qIdx: number) => {
    if (!generatedAssignment?.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const targetQ = exam.multipleChoice[qIdx];
    if (!targetQ) return;
    const variant = targetQ.illustrationVariant ?? 0;
    const caption = cleanIllustrationCaption(
      targetQ.illustrationNote || "",
      targetQ.question
    );
    const dataUrl = generateIllustrationDataUrl(
      targetQ.question,
      caption,
      variant,
      generatedAssignment.grade
    );
    const nextMcqs = exam.multipleChoice.map((q, idx) =>
      idx === qIdx
        ? {
            ...q,
            hasNoIllustration: false,
            illustrationNote: caption,
            illustrationImageDataUrl: dataUrl,
          }
        : q
    );
    syncTheoryExamAndChecklist({ ...exam, multipleChoice: nextMcqs });
  };

  const handleUpdateMcqOption = (qIndex: number, optIndex: number, textValue: string) => {
    if (!generatedAssignment || !generatedAssignment.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const updatedMcqs = exam.multipleChoice.map((q, idx) => {
      if (idx !== qIndex) return q;
      const nextOpts = [...q.options];
      nextOpts[optIndex] = textValue;
      return { ...q, options: nextOpts };
    });
    syncTheoryExamAndChecklist({
      ...exam,
      multipleChoice: updatedMcqs,
    });
  };

  const handleSwapMcqWithReserve = (qIdx: number) => {
    if (!generatedAssignment || !generatedAssignment.theoryExam) return;
    let exam = generatedAssignment.theoryExam;
    const targetQ = exam.multipleChoice[qIdx];
    if (!targetQ) return;

    if (!targetQ.reserveQuestions || targetQ.reserveQuestions.length === 0) {
      exam = ensureExamReserveQuestions(exam, generatedAssignment.grade, selectedTopicIds);
    }

    const currentQ = exam.multipleChoice[qIdx];
    const reserves =
      currentQ.reserveQuestions && currentQ.reserveQuestions.length > 0
        ? [...currentQ.reserveQuestions]
        : [];
    if (reserves.length === 0) return;

    const currentIndex = (currentQ.reserveIndex ?? 0) % reserves.length;
    const pickedReserve = reserves[currentIndex];

    const oldAsReserve = {
      question: currentQ.question,
      options: [...currentQ.options],
      correctIndex: currentQ.correctIndex,
      explanation: currentQ.explanation,
      cognitiveLevel: currentQ.cognitiveLevel,
      illustrationNote: currentQ.illustrationNote,
      illustrationImageDataUrl: currentQ.illustrationImageDataUrl,
      illustrationVariant: currentQ.illustrationVariant,
      hasNoIllustration: currentQ.hasNoIllustration,
    };

    reserves[currentIndex] = oldAsReserve;
    const nextReserveIndex = (currentIndex + 1) % reserves.length;

    const updatedMcqs = exam.multipleChoice.map((q, idx) => {
      if (idx !== qIdx) return q;
      return {
        ...q,
        question: pickedReserve.question,
        options: [...pickedReserve.options],
        correctIndex: pickedReserve.correctIndex,
        explanation: pickedReserve.explanation,
        cognitiveLevel: pickedReserve.cognitiveLevel || q.cognitiveLevel,
        illustrationNote: pickedReserve.illustrationNote || pickedReserve.question,
        illustrationImageDataUrl: pickedReserve.illustrationImageDataUrl || "",
        illustrationVariant: pickedReserve.illustrationVariant ?? idx,
        hasNoIllustration: pickedReserve.hasNoIllustration ?? false,
        reserveQuestions: reserves,
        reserveIndex: nextReserveIndex,
      };
    });

    const nextExam = {
      ...exam,
      multipleChoice: updatedMcqs,
    };
    syncTheoryExamAndChecklist(nextExam);
    setSavedNotice(`Đã đổi sang câu hỏi trắc nghiệm dự trù (${currentIndex + 1}/5) cho Câu ${qIdx + 1}!`);
  };

  const handleAddMoreEssayQuestion = () => {
    if (!generatedAssignment || !generatedAssignment.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const currentEssays = getActiveShortAnswers(exam);
    const nextIdx = currentEssays.length + 1;
    const defaultEssayQ = "Em hãy nhập nội dung câu hỏi tự luận ngắn tại đây?";
    const defaultEssayNote = "Tình huống thực hành trên máy tính";
    const newEssay = {
      id: `sa-extra-${Date.now()}-${nextIdx}`,
      question: defaultEssayQ,
      cognitiveLevel: "Thông hiểu" as CognitiveLevel,
      illustrationNote: defaultEssayNote,
      illustrationVariant: 0,
      illustrationImageDataUrl: generateIllustrationDataUrl(
        defaultEssayQ,
        defaultEssayNote,
        0,
        generatedAssignment.grade
      ),
      sampleAnswer: "Nhập đáp án chuẩn mẫu để AI đối chiếu...",
      gradingGuide: "Biểu điểm chi tiết từng ý...",
      semanticKeywords: ["từ khóa 1", "từ khóa 2"],
      points: 2.0,
    };
    const nextEssays = [...currentEssays, newEssay];
    const nextExam = ensureExamReserveQuestions(
      {
        ...exam,
        shortAnswers: nextEssays,
        shortAnswer: nextEssays[0],
      },
      generatedAssignment.grade,
      selectedTopicIds
    );
    syncTheoryExamAndChecklist(nextExam);
  };

  const handleSwapEssayWithReserve = (sIdx: number) => {
    if (!generatedAssignment || !generatedAssignment.theoryExam) return;
    let exam = generatedAssignment.theoryExam;
    const activeEssays = getActiveShortAnswers(exam);
    const targetEssay = activeEssays[sIdx];
    if (!targetEssay) return;

    if (!targetEssay.reserveQuestions || targetEssay.reserveQuestions.length === 0) {
      exam = ensureExamReserveQuestions(exam, generatedAssignment.grade, selectedTopicIds);
    }

    const currentEssays = getActiveShortAnswers(exam);
    const currentEssay = currentEssays[sIdx];
    const reserves =
      currentEssay.reserveQuestions && currentEssay.reserveQuestions.length > 0
        ? [...currentEssay.reserveQuestions]
        : [];
    if (reserves.length === 0) return;

    const currentIndex = (currentEssay.reserveIndex ?? 0) % reserves.length;
    const pickedReserve = reserves[currentIndex];

    const oldAsReserve = {
      question: currentEssay.question,
      sampleAnswer: currentEssay.sampleAnswer,
      gradingGuide: currentEssay.gradingGuide,
      semanticKeywords: [...currentEssay.semanticKeywords],
      cognitiveLevel: currentEssay.cognitiveLevel,
      illustrationNote: currentEssay.illustrationNote,
      illustrationImageDataUrl: currentEssay.illustrationImageDataUrl,
      illustrationVariant: currentEssay.illustrationVariant,
      hasNoIllustration: currentEssay.hasNoIllustration,
    };

    reserves[currentIndex] = oldAsReserve;
    const nextReserveIndex = (currentIndex + 1) % reserves.length;

    const updatedEssays = currentEssays.map((sa, idx) => {
      if (idx !== sIdx) return sa;
      return {
        ...sa,
        question: pickedReserve.question,
        sampleAnswer: pickedReserve.sampleAnswer,
        gradingGuide: pickedReserve.gradingGuide || sa.gradingGuide,
        semanticKeywords: [...pickedReserve.semanticKeywords],
        cognitiveLevel: pickedReserve.cognitiveLevel || sa.cognitiveLevel,
        illustrationNote: pickedReserve.illustrationNote || pickedReserve.question,
        illustrationImageDataUrl: pickedReserve.illustrationImageDataUrl || "",
        illustrationVariant: pickedReserve.illustrationVariant ?? idx,
        hasNoIllustration: pickedReserve.hasNoIllustration ?? false,
        reserveQuestions: reserves,
        reserveIndex: nextReserveIndex,
      };
    });

    const nextExam = {
      ...exam,
      shortAnswers: updatedEssays,
      shortAnswer: updatedEssays[0] || exam.shortAnswer,
    };
    syncTheoryExamAndChecklist(nextExam);
    setSavedNotice(`Đã đổi sang câu hỏi tự luận dự trù (${currentIndex + 1}/5) cho Câu tự luận ${sIdx + 1}!`);
  };

  const handleRemoveEssayQuestion = (idxToRemove: number) => {
    if (!generatedAssignment || !generatedAssignment.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const currentEssays = getActiveShortAnswers(exam);
    const nextEssays = currentEssays.filter((_, idx) => idx !== idxToRemove);
    syncTheoryExamAndChecklist({
      ...exam,
      shortAnswers: nextEssays,
      shortAnswer: nextEssays[0] || {
        id: `sa-empty-${Date.now()}`,
        question: "Không có câu hỏi tự luận.",
        sampleAnswer: "",
        semanticKeywords: [],
        points: 0,
      },
    });
  };

  const handleUpdateEssayField = (
    essayIdx: number,
    field:
      | "question"
      | "sampleAnswer"
      | "points"
      | "semanticKeywords"
      | "illustrationNote"
      | "gradingGuide",
    value: any
  ) => {
    if (!generatedAssignment || !generatedAssignment.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const currentEssays = getActiveShortAnswers(exam);
    const nextEssays = currentEssays.map((sa, idx) =>
      idx === essayIdx ? { ...sa, [field]: value } : sa
    );
    syncTheoryExamAndChecklist({
      ...exam,
      shortAnswers: nextEssays,
      shortAnswer: nextEssays[0] || exam.shortAnswer,
    });
  };

  const handleUpdateSemesterPracticeTask = (
    pIdx: number,
    field: keyof SemesterPracticeTask,
    value: any
  ) => {
    if (
      !generatedAssignment ||
      !generatedAssignment.theoryExam ||
      !generatedAssignment.theoryExam.semesterBlueprint
    )
      return;
    const exam = generatedAssignment.theoryExam;
    const bp = exam.semesterBlueprint!;
    const nextTasks = bp.practiceTasks.map((pt, idx) =>
      idx === pIdx ? { ...pt, [field]: value } : pt
    );
    syncTheoryExamAndChecklist({
      ...exam,
      semesterBlueprint: {
        ...bp,
        practiceTasks: nextTasks,
      },
    });
  };

  const handleAddSemesterPracticeTask = () => {
    if (
      !generatedAssignment ||
      !generatedAssignment.theoryExam ||
      !generatedAssignment.theoryExam.semesterBlueprint
    )
      return;
    const exam = generatedAssignment.theoryExam;
    const bp = exam.semesterBlueprint!;
    const nextIdx = bp.practiceTasks.length + 1;
    const defaultTitle = `Bài thực hành ${nextIdx}: Nhập tên yêu cầu thực hành`;
    const defaultNote = "Giao diện phần mềm thực hành trên máy tính";
    const newTask: SemesterPracticeTask = {
      id: `sem-prac-manual-${Date.now()}-${nextIdx}`,
      title: defaultTitle,
      cognitiveLevel: "Vận dụng",
      softwareType:
        generatedAssignment.grade === "Lớp 5"
          ? "Scratch (.sb3)"
          : "Word (.docx)",
      instructions:
        "Em hãy nhập nội dung hướng dẫn và các bước thực hành trên máy tính cho học sinh tại đây...",
      illustrationNote: defaultNote,
      illustrationVariant: 0,
      illustrationImageDataUrl: generateIllustrationDataUrl(
        defaultTitle,
        defaultNote,
        0,
        generatedAssignment.grade
      ),
      points: 3.0,
      gradingRubric:
        "- Thực hiện đúng yêu cầu định dạng / kịch bản: 2.0 điểm.\n- Lưu tệp đúng tên quy định: 1.0 điểm.",
    };
    const nextTasks = [...bp.practiceTasks, newTask];
    syncTheoryExamAndChecklist({
      ...exam,
      semesterBlueprint: {
        ...bp,
        practiceTasks: nextTasks,
      },
    });
  };

  const handleRemoveSemesterPracticeTask = (idxToRemove: number) => {
    if (
      !generatedAssignment ||
      !generatedAssignment.theoryExam ||
      !generatedAssignment.theoryExam.semesterBlueprint
    )
      return;
    const exam = generatedAssignment.theoryExam;
    const bp = exam.semesterBlueprint!;
    if (bp.practiceTasks.length <= 1) return;
    const nextTasks = bp.practiceTasks.filter((_, idx) => idx !== idxToRemove);
    syncTheoryExamAndChecklist({
      ...exam,
      semesterBlueprint: {
        ...bp,
        practiceTasks: nextTasks,
      },
    });
  };

  const handleCreateManualSemesterExam = () => {
    setErrorMsg(null);
    setSavedNotice(null);

    const targetMcq = Math.min(20, Math.max(1, theoryQuestionCount));
    const targetEssay = Math.min(5, Math.max(0, theoryEssayCount));
    const targetPractice = Math.min(4, Math.max(1, semesterPracticeCount));

    const totalTheoryPoints = Number(((semesterTheoryPercent / 100) * 10).toFixed(2));
    const totalPracticePoints = Number((10.0 - totalTheoryPoints).toFixed(2));

    const essayPointsTotal =
      targetEssay > 0 ? Math.min(2.5, Number((totalTheoryPoints * 0.35).toFixed(2))) : 0;
    const mcqPointsTotal = Number((totalTheoryPoints - essayPointsTotal).toFixed(2));
    const ptPerMcq = Number((mcqPointsTotal / targetMcq).toFixed(2));
    const ptPerEssay =
      targetEssay > 0 ? Number((essayPointsTotal / targetEssay).toFixed(2)) : 0;
    const ptPerPractice = Number((totalPracticePoints / targetPractice).toFixed(2));

    const multipleChoice = Array.from({ length: targetMcq }, (_, idx) => {
      const topicForQ = selectedTopicObjs[idx % selectedTopicObjs.length] || activeTopicObj;
      const level: CognitiveLevel =
        idx < Math.ceil(targetMcq * 0.5)
          ? "Nhận biết"
          : idx < Math.ceil(targetMcq * 0.85)
          ? "Thông hiểu"
          : "Vận dụng";
      const qText = `Nhập nội dung câu hỏi trắc nghiệm ${idx + 1} (${topicForQ.code} - ${grade})?`;
      const note = `${topicForQ.title}`;
      return {
        id: `sem-mcq-manual-${idx + 1}-${Date.now()}`,
        question: qText,
        cognitiveLevel: level,
        illustrationNote: note,
        illustrationImageDataUrl: generateIllustrationDataUrl(qText, note, idx, grade),
        illustrationVariant: idx % 5,
        options: [
          "A. Nhập phương án A (Đáp án đúng)",
          "B. Nhập phương án B",
          "C. Nhập phương án C",
          "D. Nhập phương án D",
        ],
        correctIndex: 0,
        explanation: `Giải thích đáp án đúng cho câu ${idx + 1}.`,
        points: ptPerMcq,
      };
    });

    const shortAnswers = Array.from({ length: targetEssay }, (_, idx) => {
      const topicForSa = selectedTopicObjs[idx % selectedTopicObjs.length] || activeTopicObj;
      const qText = `Nhập nội dung câu hỏi tự luận ${idx + 1} (${topicForSa.code} - ${grade})?`;
      const note = `Tình huống thực tế ${topicForSa.code}`;
      return {
        id: `sem-sa-manual-${idx + 1}-${Date.now()}`,
        question: qText,
        cognitiveLevel: "Thông hiểu" as CognitiveLevel,
        illustrationNote: note,
        illustrationImageDataUrl: generateIllustrationDataUrl(qText, note, idx, grade),
        illustrationVariant: idx % 5,
        sampleAnswer: "Nhập đáp án mẫu và biểu điểm chấm chi tiết cho câu tự luận này...",
        gradingGuide: "Nêu đúng ý chính đạt điểm tối đa.",
        semanticKeywords: ["từ khóa 1", "từ khóa 2"],
        points: ptPerEssay,
      };
    });

    const defaultSoftware =
      activeTopicObj.recommendedFileType === "sb3"
        ? "Scratch (.sb3)"
        : activeTopicObj.recommendedFileType === "pptx"
        ? "PowerPoint (.pptx)"
        : "Word (.docx)";

    const practiceTasks: SemesterPracticeTask[] = Array.from(
      { length: targetPractice },
      (_, idx) => {
        const topicForPt = selectedTopicObjs[idx % selectedTopicObjs.length] || activeTopicObj;
        const title = `Bài thực hành ${idx + 1}: Nhập tên bài thực hành (${topicForPt.code})`;
        const note = `Thực hành ${defaultSoftware} - ${topicForPt.code}`;
        return {
          id: `sem-prac-manual-${idx + 1}-${Date.now()}`,
          title,
          cognitiveLevel: "Vận dụng",
          softwareType: defaultSoftware,
          instructions:
            "Nhập yêu cầu đề bài thực hành trên máy tính cho học sinh (Ví dụ: Tạo tệp mới, thực hiện định dạng/lập trình theo yêu cầu và lưu tệp đúng quy định)...",
          illustrationNote: note,
          illustrationImageDataUrl: generateIllustrationDataUrl(title, note, idx, grade),
          illustrationVariant: idx % 5,
          points: ptPerPractice,
          gradingRubric: `- Thực hiện đúng các yêu cầu kỹ thuật chính: ${(
            ptPerPractice * 0.75
          ).toFixed(2)} điểm.\n- Lưu tệp đúng tên quy định và trình bày khoa học: ${(
            ptPerPractice * 0.25
          ).toFixed(2)} điểm.`,
        };
      }
    );

    const manualExam: TheoryExam = {
      id: `sem-exam-manual-${Date.now()}`,
      title: `Đề Kiểm tra Định kỳ ${semesterType} Môn Tin học ${grade} (${selectedTopicsShortCodes} · Năm học ${semesterSchoolYear})`,
      grade,
      durationMinutes: semesterDuration,
      multipleChoice,
      shortAnswer: shortAnswers[0] || {
        id: `sa-empty-${Date.now()}`,
        question: "Không có câu hỏi tự luận.",
        sampleAnswer: "",
        semanticKeywords: [],
        points: 0,
      },
      shortAnswers,
      semesterBlueprint: {
        isSemesterExam: true,
        semesterType,
        schoolYear: semesterSchoolYear,
        theoryPercent: semesterTheoryPercent,
        practicePercent: semesterPracticePercent,
        nhanBietPercent: semesterNhanBietPercent,
        thongHieuPercent: semesterThongHieuPercent,
        vanDungPercent: semesterVanDungPercent,
        practiceTasks,
        answerKeyAndGradingGuide: `I. ĐÁP ÁN PHẦN I — TRẮC NGHIỆM (${mcqPointsTotal.toFixed(
          2
        )} điểm): Giáo viên chọn đáp án đúng ở từng câu.\nII. HƯỚNG DẪN CHẤM PHẦN II — TỰ LUẬN & THỰC HÀNH (${(
          essayPointsTotal + totalPracticePoints
        ).toFixed(2)} điểm): Chấm theo đáp án mẫu và biểu điểm thực hành từng câu.`,
      },
    };

    const targetClsList =
      selectedClassNames.length > 0 ? selectedClassNames : [className];
    const formattedClsLabel = formatTargetClassesLabel(targetClsList, grade);

    const newAsg: Assignment = {
      id: `asg-sem-manual-${Date.now()}`,
      code: `DeThi_${semesterType.replace(/\s+/g, "")}_${grade.replace(/\s+/g, "")}`,
      title: manualExam.title,
      grade,
      className: formattedClsLabel,
      targetClassNames: targetClsList,
      fileType: "theory",
      isSemesterExam: true,
      studentPrompt: `ĐỀ THI ĐỊNH KỲ ${semesterType.toUpperCase()} (${semesterDuration} phút) — Phần I: Trắc nghiệm (${
        manualExam.multipleChoice.length
      } câu); Phần II: Tự luận (${shortAnswers.length} câu) & Thực hành (${
        practiceTasks.length
      } bài). Em hãy hoàn thành tất cả các câu hỏi trước khi bấm Nộp bài nhé!`,
      standardFileNamePattern: `MaHS_HoTen_${formattedClsLabel.replace(
        /\s+/g,
        ""
      )}_DeThiHocKy.json`,
      checklist: buildTheoryChecklistFromExam(manualExam),
      theoryExam: manualExam,
    };

    setGeneratedAssignment(newAsg);
    setSavedNotice(
      "Đã khởi tạo Khung Đề Thi Học Kỳ Nhập Tay theo đúng tỷ lệ LT/TH đã chọn! Thầy có thể gõ nội dung từng câu hỏi trắc nghiệm, tự luận, bài thực hành ở khung bên phải rồi bấm Xác nhận & Giao đề."
    );
  };

  const handleAddMorePracticeTask = () => {
    if (!generatedAssignment || generatedAssignment.fileType === "theory") return;
    const currentList = generatedAssignment.checklist;
    const nextIdx = currentList.length + 1;
    const newPoints = Number((10.0 / nextIdx).toFixed(1));
    const newItem = {
      id: `task-extra-${Date.now()}`,
      criterion: `Câu ${nextIdx}: Nhập yêu cầu thực hành / tiêu chí chấm thứ ${nextIdx}`,
      technicalTarget:
        generatedAssignment.fileType === "sb3"
          ? "AST Block Logic & Sprite Position Check"
          : generatedAssignment.fileType === "pptx"
          ? "Slide Layout & Transition Property Check"
          : "DOM Paragraph Formatting & UTF-8 Check",
      maxPoints: newPoints,
      commonElementaryMistake: "Quên kiểm tra lại định dạng trước khi lưu tệp",
    };
    const updatedList = [...currentList, newItem].map((item) => ({
      ...item,
      maxPoints: newPoints,
    }));

    setGeneratedAssignment({
      ...generatedAssignment,
      checklist: updatedList,
    });
  };

  const handleRemovePracticeTask = (indexToRemove: number) => {
    if (!generatedAssignment || generatedAssignment.fileType === "theory") return;
    if (generatedAssignment.checklist.length <= 1) return;
    const filtered = generatedAssignment.checklist.filter((_, idx) => idx !== indexToRemove);
    setGeneratedAssignment({
      ...generatedAssignment,
      checklist: filtered,
    });
  };

  const handleUpdateChecklistItem = (
    cIndex: number,
    field: "criterion" | "technicalTarget" | "maxPoints" | "commonElementaryMistake",
    value: string | number
  ) => {
    if (!generatedAssignment) return;
    const updatedChecklist = generatedAssignment.checklist.map((item, idx) =>
      idx === cIndex ? { ...item, [field]: value } : item
    );
    setGeneratedAssignment({
      ...generatedAssignment,
      checklist: updatedChecklist,
    });
  };

  const handleRebalanceChecklistPoints = () => {
    if (!generatedAssignment || generatedAssignment.checklist.length === 0) return;
    const count = generatedAssignment.checklist.length;
    const basePt = Math.floor((10 / count) * 2) / 2;
    let remainder = Number((10 - basePt * count).toFixed(1));
    const updated = generatedAssignment.checklist.map((item) => {
      let pt = basePt;
      if (remainder >= 0.5) {
        pt = Number((pt + 0.5).toFixed(1));
        remainder = Number((remainder - 0.5).toFixed(1));
      }
      return { ...item, maxPoints: pt };
    });
    setGeneratedAssignment({
      ...generatedAssignment,
      checklist: updated,
    });
  };

  const handleDownloadMasterTemplate = async (asg: Assignment) => {
    try {
      const file = await generateSamplePracticeFile(asg.fileType, "master_template", asg);
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download template error:", err);
    }
  };

  const handleCycleMcqIllustration = (qIdx: number) => {
    if (!generatedAssignment?.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const targetQ = exam.multipleChoice[qIdx];
    if (!targetQ) return;
    const nextVariant = ((targetQ.illustrationVariant ?? 0) + 1) % 5;
    const nextCaption = cleanIllustrationCaption(
      targetQ.illustrationNote || "",
      targetQ.question
    );
    const nextDataUrl = generateIllustrationDataUrl(
      targetQ.question,
      nextCaption,
      nextVariant,
      generatedAssignment.grade
    );
    const nextMcqs = exam.multipleChoice.map((q, idx) =>
      idx === qIdx
        ? {
            ...q,
            illustrationNote: nextCaption,
            illustrationVariant: nextVariant,
            illustrationImageDataUrl: nextDataUrl,
            hasNoIllustration: false,
          }
        : q
    );
    syncTheoryExamAndChecklist({ ...exam, multipleChoice: nextMcqs });
  };

  /**
   * ĐỌC VĂN BẢN TRONG Ô GỢI Ý (Web Speech API) & THÔNG BÁO CHO NGƯỜI DÙNG
   */
  const speakIllustrationPrompt = (promptText: string, contextTitle: string = "") => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const trimmed = promptText.trim();
        const textToRead = trimmed
          ? `Đang đọc gợi ý tạo ảnh: ${trimmed}`
          : `Đang đọc nội dung ${contextTitle || "câu hỏi"} để tạo ảnh`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = "vi-VN";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn("Speech synthesis error:", err);
    }
  };

  /**
   * TẠO LẠI ẢNH THEO GỢI Ý CỦA GIÁO VIÊN (Trắc nghiệm)
   * Đọc nội dung văn bản đang nằm trong ô gợi ý, AI tự động tạo ra hình mới theo gợi ý
   */
  const handleRegenerateMcqIllustrationFromPrompt = async (qIdx: number, customPrompt?: string) => {
    if (!generatedAssignment?.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const targetQ = exam.multipleChoice[qIdx];
    if (!targetQ) return;
    const promptText = (customPrompt !== undefined ? customPrompt : targetQ.illustrationNote || "").trim();
    const effectivePrompt = promptText || targetQ.question;
    const cleanNote = cleanIllustrationCaption(effectivePrompt, targetQ.question);
    const key = `mcq-${qIdx}`;

    // Đọc nội dung gợi ý bằng giọng nói và hiển thị thanh thông báo trực quan
    speakIllustrationPrompt(cleanNote, `Câu ${qIdx + 1}`);

    setGeneratingIllustrationMap((prev) => ({ ...prev, [key]: true }));
    setSavedNotice(`AI đang đọc gợi ý: "${cleanNote}" và vẽ ảnh mới cho Câu ${qIdx + 1}...`);

    let nextDataUrl = "";
    try {
      const res = await fetch("/api/ai/generate-illustration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText: cleanNote,
          contextText: targetQ.question,
          grade: generatedAssignment.grade,
          variant: (targetQ.illustrationVariant ?? 0) + 1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.dataUrl) {
          nextDataUrl = data.dataUrl;
        }
      }
    } catch (err) {
      console.warn("AI generation network error, using local illustration engine:", err);
    }

    const nextVariant = ((targetQ.illustrationVariant ?? 0) + 1) % 5;
    if (!nextDataUrl) {
      nextDataUrl = generateIllustrationDataUrl(
        targetQ.question,
        cleanNote,
        nextVariant,
        generatedAssignment.grade
      );
    }

    const nextMcqs = exam.multipleChoice.map((q, idx) =>
      idx === qIdx
        ? {
            ...q,
            illustrationNote: cleanNote,
            illustrationVariant: nextVariant,
            illustrationImageDataUrl: nextDataUrl,
            hasNoIllustration: false,
          }
        : q
    );
    syncTheoryExamAndChecklist({ ...exam, multipleChoice: nextMcqs });
    setGeneratingIllustrationMap((prev) => ({ ...prev, [key]: false }));
    setSavedNotice(`AI đã tạo thành công ảnh minh họa mới cho Câu ${qIdx + 1} theo gợi ý: "${cleanNote}"!`);
  };

  const handleCycleEssayIllustration = (eIdx: number) => {
    if (!generatedAssignment?.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const currentEssays = getActiveShortAnswers(exam);
    const targetEq = currentEssays[eIdx];
    if (!targetEq) return;
    const nextVariant = ((targetEq.illustrationVariant ?? 0) + 1) % 5;
    const nextCaption = cleanIllustrationCaption(
      targetEq.illustrationNote || "",
      targetEq.question
    );
    const nextDataUrl = generateIllustrationDataUrl(
      targetEq.question,
      nextCaption,
      nextVariant,
      generatedAssignment.grade
    );
    const nextEssays = currentEssays.map((eq, idx) =>
      idx === eIdx
        ? {
            ...eq,
            illustrationNote: nextCaption,
            illustrationVariant: nextVariant,
            illustrationImageDataUrl: nextDataUrl,
            hasNoIllustration: false,
          }
        : eq
    );
    syncTheoryExamAndChecklist({
      ...exam,
      shortAnswers: nextEssays,
      shortAnswer: nextEssays[0] || exam.shortAnswer,
    });
  };

  const handleRemoveEssayIllustration = (eIdx: number) => {
    if (!generatedAssignment?.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const currentEssays = getActiveShortAnswers(exam);
    const nextEssays = currentEssays.map((eq, idx) =>
      idx === eIdx
        ? {
            ...eq,
            illustrationImageDataUrl: "",
            hasNoIllustration: true,
          }
        : eq
    );
    syncTheoryExamAndChecklist({
      ...exam,
      shortAnswers: nextEssays,
      shortAnswer: nextEssays[0] || exam.shortAnswer,
    });
  };

  const handleRestoreEssayIllustration = (eIdx: number) => {
    if (!generatedAssignment?.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const currentEssays = getActiveShortAnswers(exam);
    const targetEq = currentEssays[eIdx];
    if (!targetEq) return;
    const variant = targetEq.illustrationVariant ?? 0;
    const caption = cleanIllustrationCaption(
      targetEq.illustrationNote || "",
      targetEq.question
    );
    const dataUrl = generateIllustrationDataUrl(
      targetEq.question,
      caption,
      variant,
      generatedAssignment.grade
    );
    const nextEssays = currentEssays.map((eq, idx) =>
      idx === eIdx
        ? {
            ...eq,
            hasNoIllustration: false,
            illustrationNote: caption,
            illustrationImageDataUrl: dataUrl,
          }
        : eq
    );
    syncTheoryExamAndChecklist({
      ...exam,
      shortAnswers: nextEssays,
      shortAnswer: nextEssays[0] || exam.shortAnswer,
    });
  };

  /**
   * TẠO LẠI ẢNH THEO GỢI Ý CỦA GIÁO VIÊN (Tự luận)
   * Đọc nội dung văn bản đang nằm trong ô gợi ý, AI tự động tạo ra hình mới theo gợi ý
   */
  const handleRegenerateEssayIllustrationFromPrompt = async (eIdx: number, customPrompt?: string) => {
    if (!generatedAssignment?.theoryExam) return;
    const exam = generatedAssignment.theoryExam;
    const currentEssays = getActiveShortAnswers(exam);
    const targetEq = currentEssays[eIdx];
    if (!targetEq) return;
    const promptText = (customPrompt !== undefined ? customPrompt : targetEq.illustrationNote || "").trim();
    const effectivePrompt = promptText || targetEq.question;
    const cleanNote = cleanIllustrationCaption(effectivePrompt, targetEq.question);
    const key = `essay-${eIdx}`;

    // Đọc nội dung gợi ý bằng giọng nói và hiển thị thanh thông báo trực quan
    speakIllustrationPrompt(cleanNote, `Câu Tự luận ${eIdx + 1}`);

    setGeneratingIllustrationMap((prev) => ({ ...prev, [key]: true }));
    setSavedNotice(`AI đang đọc gợi ý: "${cleanNote}" và vẽ ảnh mới cho Câu Tự luận ${eIdx + 1}...`);

    let nextDataUrl = "";
    try {
      const res = await fetch("/api/ai/generate-illustration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText: cleanNote,
          contextText: targetEq.question,
          grade: generatedAssignment.grade,
          variant: (targetEq.illustrationVariant ?? 0) + 1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.dataUrl) {
          nextDataUrl = data.dataUrl;
        }
      }
    } catch (err) {
      console.warn("AI generation network error, using local illustration engine:", err);
    }

    const nextVariant = ((targetEq.illustrationVariant ?? 0) + 1) % 5;
    if (!nextDataUrl) {
      nextDataUrl = generateIllustrationDataUrl(
        targetEq.question,
        cleanNote,
        nextVariant,
        generatedAssignment.grade
      );
    }

    const nextEssays = currentEssays.map((eq, idx) =>
      idx === eIdx
        ? {
            ...eq,
            illustrationNote: cleanNote,
            illustrationVariant: nextVariant,
            illustrationImageDataUrl: nextDataUrl,
            hasNoIllustration: false,
          }
        : eq
    );
    syncTheoryExamAndChecklist({
      ...exam,
      shortAnswers: nextEssays,
      shortAnswer: nextEssays[0] || exam.shortAnswer,
    });
    setGeneratingIllustrationMap((prev) => ({ ...prev, [key]: false }));
    setSavedNotice(`AI đã tạo thành công ảnh minh họa mới cho Câu Tự luận ${eIdx + 1} theo gợi ý: "${cleanNote}"!`);
  };

  const handleUploadEssayCustomImage = (
    eIdx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !generatedAssignment?.theoryExam) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const exam = generatedAssignment.theoryExam!;
        const currentEssays = getActiveShortAnswers(exam);
        const nextEssays = currentEssays.map((eq, idx) =>
          idx === eIdx
            ? {
                ...eq,
                illustrationImageDataUrl: reader.result as string,
                hasNoIllustration: false,
              }
            : eq
        );
        syncTheoryExamAndChecklist({
          ...exam,
          shortAnswers: nextEssays,
          shortAnswer: nextEssays[0] || exam.shortAnswer,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCyclePracticeIllustration = (pIdx: number) => {
    if (!generatedAssignment?.theoryExam?.semesterBlueprint) return;
    const exam = generatedAssignment.theoryExam;
    const bp = exam.semesterBlueprint!;
    const targetPt = bp.practiceTasks[pIdx];
    if (!targetPt) return;
    const nextVariant = ((targetPt.illustrationVariant ?? 0) + 1) % 5;
    const nextCaption = cleanIllustrationCaption(
      targetPt.illustrationNote || "",
      `${targetPt.title} ${targetPt.instructions}`
    );
    const nextDataUrl = generateIllustrationDataUrl(
      `${targetPt.title} ${targetPt.instructions}`,
      nextCaption,
      nextVariant,
      generatedAssignment.grade
    );
    const nextTasks = bp.practiceTasks.map((pt, idx) =>
      idx === pIdx
        ? {
            ...pt,
            illustrationNote: nextCaption,
            illustrationVariant: nextVariant,
            illustrationImageDataUrl: nextDataUrl,
            hasNoIllustration: false,
          }
        : pt
    );
    syncTheoryExamAndChecklist({
      ...exam,
      semesterBlueprint: {
        ...bp,
        practiceTasks: nextTasks,
      },
    });
  };

  const handleRemovePracticeIllustration = (pIdx: number) => {
    if (!generatedAssignment?.theoryExam?.semesterBlueprint) return;
    const exam = generatedAssignment.theoryExam;
    const bp = exam.semesterBlueprint!;
    const nextTasks = bp.practiceTasks.map((pt, idx) =>
      idx === pIdx
        ? {
            ...pt,
            illustrationImageDataUrl: "",
            hasNoIllustration: true,
          }
        : pt
    );
    syncTheoryExamAndChecklist({
      ...exam,
      semesterBlueprint: {
        ...bp,
        practiceTasks: nextTasks,
      },
    });
  };

  const handleRestorePracticeIllustration = (pIdx: number) => {
    if (!generatedAssignment?.theoryExam?.semesterBlueprint) return;
    const exam = generatedAssignment.theoryExam;
    const bp = exam.semesterBlueprint!;
    const targetPt = bp.practiceTasks[pIdx];
    if (!targetPt) return;
    const variant = targetPt.illustrationVariant ?? 0;
    const caption = cleanIllustrationCaption(
      targetPt.illustrationNote || "",
      `${targetPt.title} ${targetPt.instructions}`
    );
    const dataUrl = generateIllustrationDataUrl(
      `${targetPt.title} ${targetPt.instructions}`,
      caption,
      variant,
      generatedAssignment.grade
    );
    const nextTasks = bp.practiceTasks.map((pt, idx) =>
      idx === pIdx
        ? {
            ...pt,
            hasNoIllustration: false,
            illustrationNote: caption,
            illustrationImageDataUrl: dataUrl,
          }
        : pt
    );
    syncTheoryExamAndChecklist({
      ...exam,
      semesterBlueprint: {
        ...bp,
        practiceTasks: nextTasks,
      },
    });
  };

  /**
   * TẠO LẠI ẢNH THEO GỢI Ý CỦA GIÁO VIÊN (Thực hành)
   * Đọc nội dung văn bản đang nằm trong ô gợi ý, AI tự động tạo ra hình mới theo gợi ý
   */
  const handleRegeneratePracticeIllustrationFromPrompt = async (pIdx: number, customPrompt?: string) => {
    if (!generatedAssignment?.theoryExam?.semesterBlueprint) return;
    const exam = generatedAssignment.theoryExam;
    const bp = exam.semesterBlueprint!;
    const targetPt = bp.practiceTasks[pIdx];
    if (!targetPt) return;
    const promptText = (customPrompt !== undefined ? customPrompt : targetPt.illustrationNote || "").trim();
    const effectivePrompt = promptText || `${targetPt.title} ${targetPt.instructions}`;
    const cleanNote = cleanIllustrationCaption(effectivePrompt, targetPt.title);
    const key = `practice-${pIdx}`;

    // Đọc nội dung gợi ý bằng giọng nói và hiển thị thanh thông báo trực quan
    speakIllustrationPrompt(cleanNote, `Bài thực hành ${pIdx + 1}`);

    setGeneratingIllustrationMap((prev) => ({ ...prev, [key]: true }));
    setSavedNotice(`AI đang đọc gợi ý: "${cleanNote}" và vẽ ảnh mới cho Bài thực hành ${pIdx + 1}...`);

    let nextDataUrl = "";
    try {
      const res = await fetch("/api/ai/generate-illustration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText: cleanNote,
          contextText: `${targetPt.title} - ${targetPt.instructions}`,
          grade: generatedAssignment.grade,
          variant: (targetPt.illustrationVariant ?? 0) + 1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.dataUrl) {
          nextDataUrl = data.dataUrl;
        }
      }
    } catch (err) {
      console.warn("AI generation network error, using local illustration engine:", err);
    }

    const nextVariant = ((targetPt.illustrationVariant ?? 0) + 1) % 5;
    if (!nextDataUrl) {
      nextDataUrl = generateIllustrationDataUrl(
        `${targetPt.title} ${targetPt.instructions}`,
        cleanNote,
        nextVariant,
        generatedAssignment.grade
      );
    }

    const nextTasks = bp.practiceTasks.map((pt, idx) =>
      idx === pIdx
        ? {
            ...pt,
            illustrationNote: cleanNote,
            illustrationVariant: nextVariant,
            illustrationImageDataUrl: nextDataUrl,
            hasNoIllustration: false,
          }
        : pt
    );
    syncTheoryExamAndChecklist({
      ...exam,
      semesterBlueprint: {
        ...bp,
        practiceTasks: nextTasks,
      },
    });
    setGeneratingIllustrationMap((prev) => ({ ...prev, [key]: false }));
    setSavedNotice(`AI đã tạo thành công ảnh minh họa mới cho Bài thực hành ${pIdx + 1} theo gợi ý: "${cleanNote}"!`);
  };

  const handleUploadPracticeCustomImage = (
    pIdx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !generatedAssignment?.theoryExam?.semesterBlueprint) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const exam = generatedAssignment.theoryExam!;
        const bp = exam.semesterBlueprint!;
        const nextTasks = bp.practiceTasks.map((pt, idx) =>
          idx === pIdx
            ? {
                ...pt,
                illustrationImageDataUrl: reader.result as string,
                hasNoIllustration: false,
              }
            : pt
        );
        syncTheoryExamAndChecklist({
          ...exam,
          semesterBlueprint: {
            ...bp,
            practiceTasks: nextTasks,
          },
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAssignToClass = () => {
    if (!generatedAssignment) return;
    const finalTargets =
      selectedClassNames.length > 0 && generatedAssignment.grade === grade
        ? selectedClassNames
        : generatedAssignment.targetClassNames && generatedAssignment.targetClassNames.length > 0
        ? generatedAssignment.targetClassNames
        : [generatedAssignment.className];
    const finalClassLabel = formatTargetClassesLabel(
      finalTargets,
      generatedAssignment.grade
    );
    const updatedAsg: Assignment = {
      ...generatedAssignment,
      className: finalClassLabel,
      targetClassNames: finalTargets,
    };
    setGeneratedAssignment(updatedAsg);
    const alreadyInBank = assignments.some((a) => a.id === updatedAsg.id);
    onAddAssignment(updatedAsg);
    setSavedNotice(
      alreadyInBank
        ? `Đã lưu cập nhật nội dung & ma trận đề "${updatedAsg.title}" (Giao cho: ${finalTargets.join(", ")})!`
        : `Đã xác nhận & giao đề "${updatedAsg.title}" cho ${finalTargets.length} lớp (${finalTargets.join(", ")})! Học sinh thuộc các lớp này có thể làm bài ngay bên Cổng Học sinh.`
    );
  };

  const totalChecklistPoints = generatedAssignment
    ? generatedAssignment.checklist.reduce((acc, c) => acc + Number(c.maxPoints || 0), 0)
    : 0;

  const isEditingExistingInBank = Boolean(
    generatedAssignment && assignments.some((a) => a.id === generatedAssignment.id)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono text-slate-500">
            PHÂN HỆ 01 · TRỢ LÝ AI CHUYÊN GIA KHẢO THÍ TIỂU HỌC MÔN TIN HỌC (LỚP 3, 4, 5)
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1 text-balance">
            Tạo Đề Thi Học Kỳ Chuẩn Ma Trận, Đề Lý Thuyết &amp; Bài Thực Hành
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleModeChange("semester")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border-2 transition-all cursor-pointer ${
              builderMode === "semester"
                ? "bg-[#0284C7] text-white border-[#0284C7] shadow-xs"
                : "bg-sky-50 text-[#0284C7] border-sky-200 hover:bg-sky-100"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Chế độ: Tạo Đề Thi Học Kỳ (Chuẩn 4 Nguyên Tắc Khảo Thí)
          </button>
        </div>
      </div>

      {/* Main Two-Column Generator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Guided Form + Reference Document Upload (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-6 self-start">
          <form onSubmit={handleGenerateWithAI} className="space-y-6">
            {/* BƯỚC 1: CHỌN KHỐI LỚP & LỚP GIAO BÀI */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Bước 1: Chọn Khối lớp (SGK Kết nối tri thức)
                </label>
                <span className="text-xs font-mono text-[#0284C7]">{grade}</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {(["Lớp 3", "Lớp 4", "Lớp 5"] as GradeLevel[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGradeChange(g)}
                    className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                      grade === g
                        ? "border-[#0284C7] bg-sky-50 text-[#0284C7]"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Tin học {g}
                  </button>
                ))}
              </div>

              <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-lg text-[11px] text-slate-700">
                <span className="font-bold text-[#0284C7]">
                  Phạm vi chương trình {grade} (Bước 1) · Đang chọn {selectedTopicObjs.length} chủ đề ({selectedTopicsShortCodes}) ở Bước 3:
                </span>{" "}
                <span>{selectedTopicsLessonsSummary}</span>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-medium text-slate-600">
                    Click chọn các lớp nhận đề trong cùng {grade}:
                  </label>
                  {matchingClassesForGrade.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={selectAllClassesInGrade}
                        className="text-[11px] font-bold text-[#0284C7] hover:underline cursor-pointer"
                      >
                        Chọn cả khối ({matchingClassesForGrade.length} lớp)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={selectSingleFirstClassInGrade}
                        className="text-[11px] font-semibold text-slate-600 hover:underline cursor-pointer"
                      >
                        Chọn 1 lớp
                      </button>
                    </div>
                  )}
                </div>
                {matchingClassesForGrade.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {matchingClassesForGrade.map((c) => {
                        const isChecked = selectedClassNames.includes(c.name);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleTargetClass(c.name)}
                            className={`px-2.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isChecked
                                ? "border-[#0284C7] bg-sky-50 text-[#0284C7] shadow-2xs"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="px-2.5 py-1.5 bg-sky-50/70 border border-sky-200 rounded-lg text-[11px] text-slate-700">
                      Đang chọn giao:{" "}
                      <strong className="text-[#0284C7]">
                        {selectedClassNames.length}/{matchingClassesForGrade.length} lớp
                      </strong>{" "}
                      ({selectedClassNames.join(", ")})
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => {
                      setClassName(e.target.value);
                      setSelectedClassNames([e.target.value]);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                  />
                )}
              </div>
            </div>

            {/* BƯỚC 2: CHỌN CHẾ ĐỘ RA ĐỀ (TẠO ĐỀ THI HỌC KỲ / TẠO BÀI KIỂM TRA HÀNG THÁNG / ĐỀ LÝ THUYẾT / BÀI THỰC HÀNH) */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Bước 2: Chọn Loại đề cần biên soạn
              </label>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleModeChange("semester")}
                  className={`p-3.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer text-left flex items-center justify-between ${
                    builderMode === "semester"
                      ? "border-[#0284C7] bg-sky-50/90 text-[#0284C7]"
                      : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <div>
                    <span className="flex items-center gap-1.5 text-sm">
                      <GraduationCap className="w-4 h-4 text-[#0284C7]" />
                      🎓 Tạo Đề Thi Học Kỳ (Từ Ma Trận / SGK / Đề Mẫu)
                    </span>
                    <span className="text-[11px] font-normal text-slate-600 block mt-0.5">
                      Phần I (Trắc nghiệm) + Phần II (Tự luận/Thực hành) + Thẻ [HÌNH ẢNH MINH HỌA] + Đáp án chi tiết
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-[#0284C7] text-white rounded shrink-0">
                    CHUẨN KTĐK
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("monthly")}
                  className={`p-3.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer text-left flex items-center justify-between ${
                    builderMode === "monthly"
                      ? "border-[#0284C7] bg-sky-50/90 text-[#0284C7]"
                      : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <div>
                    <span className="flex items-center gap-1.5 text-sm">
                      <Calendar className="w-4 h-4 text-[#0284C7]" />
                      📅 Tạo Bài Kiểm Tra Hàng Tháng (Đánh giá định kỳ theo Tháng)
                    </span>
                    <span className="text-[11px] font-normal text-slate-600 block mt-0.5">
                      Kiểm tra kiến thức trọng tâm từng tháng (Tháng 9 → Tháng 5) kết hợp tình huống thực tế của học sinh
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-600 text-white rounded shrink-0">
                    HÀNG THÁNG
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange("practice")}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer text-left ${
                      builderMode === "practice"
                        ? "border-[#0284C7] bg-sky-50 text-[#0284C7]"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="block">🛠 Bài Thực hành</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      File Mẫu (.docx, .pptx, .sb3)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange("theory")}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer text-left ${
                      builderMode === "theory"
                        ? "border-[#0284C7] bg-sky-50 text-[#0284C7]"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="block">📝 Đề Lý thuyết &amp; NLP</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Trắc nghiệm + Tự luận ngắn
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* BƯỚC 3: CẤU HÌNH MA TRẬN ĐỀ THI HỌC KỲ HOẶC CHỦ ĐỀ SGK */}
            {builderMode === "semester" ? (
              <div className="p-4 bg-sky-50/70 border-2 border-sky-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#0284C7]" />
                    Bước 3: Chọn Chủ đề &amp; Cấu hình Ma trận Đề thi Học kỳ ({grade})
                  </span>
                  <button
                    type="button"
                    onClick={handleLoadSampleSemesterMatrix}
                    className="text-[11px] font-bold text-[#0284C7] bg-white hover:bg-sky-100 border border-sky-300 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    + Nạp Ma trận Mẫu
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Click chọn 1 hoặc nhiều Chủ đề ở Bước 3 ({grade}):
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectTopicPreset("all")}
                        className="text-[11px] font-bold text-[#0284C7] hover:underline cursor-pointer"
                      >
                        Chọn cả 6 chủ đề
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleSelectTopicPreset("hk1")}
                        className="text-[11px] font-semibold text-slate-700 hover:underline cursor-pointer"
                      >
                        HK I (CĐ 1–3)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleSelectTopicPreset("hk2")}
                        className="text-[11px] font-semibold text-slate-700 hover:underline cursor-pointer"
                      >
                        HK II (CĐ 4–6)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {currentGradeTopics.map((topic) => {
                      const isChecked = selectedTopicIds.includes(topic.id);
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => handleToggleTopicSelection(topic.id)}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-start gap-2 ${
                            isChecked
                              ? "border-[#0284C7] bg-white text-slate-900 shadow-2xs"
                              : "border-sky-200/80 bg-white/60 text-slate-600 hover:bg-white"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900">{topic.title}</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {topic.lessonsSummary}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-[11px] text-slate-700">
                    Đang chọn:{" "}
                    <strong className="text-[#0284C7]">
                      {selectedTopicObjs.length}/{currentGradeTopics.length} chủ đề
                    </strong>{" "}
                    ({selectedTopicsShortCodes})
                  </div>

                  {topicWithSubtracks && topicWithSubtracks.subtracks && (
                    <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg space-y-1.5">
                      <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        Phân hóa Chủ đề 5 (Lớp 5 - Chọn mạch nội dung):
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {topicWithSubtracks.subtracks.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleSubtrackChange(sub.id)}
                            className={`w-full p-1.5 rounded border text-left text-[11px] font-semibold transition-colors cursor-pointer ${
                              selectedSubtrackId === sub.id
                                ? "border-amber-600 bg-white text-amber-950"
                                : "border-transparent bg-amber-100/50 text-amber-900 hover:bg-amber-100"
                            }`}
                          >
                            ● {sub.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Kỳ kiểm tra:
                    </label>
                    <select
                      value={semesterType}
                      onChange={(e) => setSemesterType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-sky-300 rounded-lg text-slate-900"
                    >
                      <option value="Học kỳ I">Cuối Học kỳ I</option>
                      <option value="Học kỳ II">Cuối Học kỳ II</option>
                      <option value="Giữa Học kỳ I">Giữa Học kỳ I</option>
                      <option value="Giữa Học kỳ II">Giữa Học kỳ II</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Thời gian làm bài (phút):
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={60}
                      value={semesterDuration}
                      onChange={(e) => setSemesterDuration(Number(e.target.value) || 35)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-sky-300 rounded-lg text-[#0284C7]"
                    />
                  </div>
                </div>

                {/* Tỷ lệ Lý thuyết - Thực hành */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700">
                    1. Tỷ lệ điểm Lý thuyết / Thực hành (Tổng = 100%):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { lt: 70, th: 30, label: "70% LT - 30% TH" },
                      { lt: 60, th: 40, label: "60% LT - 40% TH" },
                      { lt: 50, th: 50, label: "50% LT - 50% TH" },
                      { lt: 40, th: 60, label: "40% LT - 60% TH" },
                      { lt: 30, th: 70, label: "30% LT - 70% TH" },
                    ].map((ratio) => (
                      <button
                        key={ratio.label}
                        type="button"
                        onClick={() => {
                          setSemesterTheoryPercent(ratio.lt);
                          setSemesterPracticePercent(ratio.th);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                          semesterTheoryPercent === ratio.lt &&
                          semesterPracticePercent === ratio.th
                            ? "bg-[#0284C7] text-white border-[#0284C7]"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-white px-2.5 py-1.5 rounded-lg border border-sky-200 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-600">
                        Nhập % Lý thuyết:
                      </span>
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          min={10}
                          max={90}
                          step={5}
                          value={semesterTheoryPercent}
                          onChange={(e) => {
                            const lt = Math.min(
                              90,
                              Math.max(10, Number(e.target.value) || 50)
                            );
                            setSemesterTheoryPercent(lt);
                            setSemesterPracticePercent(100 - lt);
                          }}
                          className="w-12 text-right text-xs font-mono font-bold text-[#0284C7] focus:outline-none"
                        />
                        <span className="text-[10px] font-mono text-slate-500">%</span>
                      </div>
                    </div>
                    <div className="bg-white px-2.5 py-1.5 rounded-lg border border-sky-200 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-600">
                        Nhập % Thực hành:
                      </span>
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          min={10}
                          max={90}
                          step={5}
                          value={semesterPracticePercent}
                          onChange={(e) => {
                            const th = Math.min(
                              90,
                              Math.max(10, Number(e.target.value) || 50)
                            );
                            setSemesterPracticePercent(th);
                            setSemesterTheoryPercent(100 - th);
                          }}
                          className="w-12 text-right text-xs font-mono font-bold text-emerald-700 focus:outline-none"
                        />
                        <span className="text-[10px] font-mono text-slate-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tỷ lệ Mức độ nhận thức: Nhận biết - Thông hiểu - Vận dụng */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700">
                    2. Ma trận Mức độ nhận thức (% Nhận biết - Thông hiểu - Vận dụng):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-2 rounded-lg border border-sky-200">
                      <span className="block text-[10px] text-slate-500 font-semibold">
                        Nhận biết (%)
                      </span>
                      <input
                        type="number"
                        min={10}
                        max={80}
                        value={semesterNhanBietPercent}
                        onChange={(e) => setSemesterNhanBietPercent(Number(e.target.value) || 40)}
                        className="w-full text-xs font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-sky-200">
                      <span className="block text-[10px] text-slate-500 font-semibold">
                        Thông hiểu (%)
                      </span>
                      <input
                        type="number"
                        min={10}
                        max={80}
                        value={semesterThongHieuPercent}
                        onChange={(e) => setSemesterThongHieuPercent(Number(e.target.value) || 30)}
                        className="w-full text-xs font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-sky-200">
                      <span className="block text-[10px] text-slate-500 font-semibold">
                        Vận dụng (%)
                      </span>
                      <input
                        type="number"
                        min={10}
                        max={80}
                        value={semesterVanDungPercent}
                        onChange={(e) => setSemesterVanDungPercent(Number(e.target.value) || 30)}
                        className="w-full text-xs font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Số lượng câu hỏi Phần I & Phần II */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-white p-2 rounded-lg border border-sky-200">
                    <label className="block text-[10px] font-semibold text-slate-600">
                      Phần I (Số câu TN):
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={theoryQuestionCount}
                      onChange={(e) =>
                        setTheoryQuestionCount(Math.min(20, Math.max(2, Number(e.target.value) || 6)))
                      }
                      className="w-full mt-0.5 text-xs font-mono font-bold text-[#0284C7] focus:outline-none"
                    />
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-sky-200">
                    <label className="block text-[10px] font-semibold text-slate-600">
                      Phần II (Số câu TL):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={theoryEssayCount}
                      onChange={(e) =>
                        setTheoryEssayCount(Math.min(5, Math.max(0, Number(e.target.value) || 0)))
                      }
                      className="w-full mt-0.5 text-xs font-mono font-bold text-[#0284C7] focus:outline-none"
                    />
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-sky-200">
                    <label className="block text-[10px] font-semibold text-slate-600">
                      Phần II (Bài TH):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={3}
                      value={semesterPracticeCount}
                      onChange={(e) =>
                        setSemesterPracticeCount(
                          Math.min(3, Math.max(1, Number(e.target.value) || 1))
                        )
                      }
                      className="w-full mt-0.5 text-xs font-mono font-bold text-[#0284C7] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* CHỌN CHỦ ĐỀ SGK KHI Ở CHẾ ĐỘ BÀI KIỂM TRA HÀNG THÁNG / BÀI THỰC HÀNH / ĐỀ LÝ THUYẾT THƯỜNG */
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {builderMode === "monthly"
                    ? `Bước 3: Chọn Tháng kiểm tra, Chủ đề SGK ${grade} & Số lượng câu`
                    : `Bước 3: Chọn Chủ đề SGK Tin học ${grade} & Số lượng câu`}
                </label>

                {builderMode === "monthly" && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                          Tháng kiểm tra định kỳ:
                        </label>
                        <select
                          value={monthlyExamMonth}
                          onChange={(e) => {
                            const nextMonth = e.target.value;
                            setMonthlyExamMonth(nextMonth);
                            setTopicInput(
                              `Bài kiểm tra định kỳ hàng tháng (${nextMonth}) môn Tin học ${grade} — ${activeTopicObj.title}: Đánh giá kiến thức trọng tâm trong tháng kết hợp câu hỏi tình huống thực tế của học sinh.`
                            );
                          }}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-emerald-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                        >
                          <option value="Tháng 9 (Chủ đề 1: Máy tính và em)">
                            Tháng 9 (Chủ đề 1: Máy tính và em)
                          </option>
                          <option value="Tháng 10 (Chủ đề 1 & 2)">
                            Tháng 10 (Chủ đề 1 &amp; 2)
                          </option>
                          <option value="Tháng 11 (Chủ đề 2 & 3)">
                            Tháng 11 (Chủ đề 2 &amp; 3)
                          </option>
                          <option value="Tháng 12 (Ôn tập & Kiểm tra cuối HK I)">
                            Tháng 12 (Tổng hợp Chủ đề 3 &amp; 4)
                          </option>
                          <option value="Tháng 1 (Chủ đề 4 & 5)">
                            Tháng 1 (Chủ đề 4 &amp; 5)
                          </option>
                          <option value="Tháng 2 (Chủ đề 5: Ứng dụng tin học)">
                            Tháng 2 (Chủ đề 5: Ứng dụng tin học)
                          </option>
                          <option value="Tháng 3 (Chủ đề 5 & 6)">
                            Tháng 3 (Chủ đề 5 &amp; 6)
                          </option>
                          <option value="Tháng 4 (Chủ đề 6: Giải quyết vấn đề)">
                            Tháng 4 (Chủ đề 6: Giải quyết vấn đề)
                          </option>
                          <option value="Tháng 5 (Tổng kết năm học)">
                            Tháng 5 (Tổng hợp cuối năm)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                          Hình thức Bài kiểm tra tháng:
                        </label>
                        <select
                          value={monthlyExamFormat}
                          onChange={(e) => {
                            const fmt = e.target.value as
                              | "combined"
                              | "theory_only"
                              | "practice_only";
                            setMonthlyExamFormat(fmt);
                            if (fmt === "practice_only") {
                              setFileType(activeTopicObj.recommendedFileType);
                            } else {
                              setFileType("theory");
                            }
                          }}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-emerald-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                        >
                          <option value="combined">
                            Trắc nghiệm + Tự luận tình huống (Khuyên dùng)
                          </option>
                          <option value="theory_only">
                            Chỉ Trắc nghiệm khách quan nhanh (15 phút)
                          </option>
                          <option value="practice_only">
                            Bài Kiểm tra Thực hành trên máy (.docx/.pptx/.sb3)
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700">
                      Click chọn 1 hoặc nhiều Chủ đề SGK {grade}:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectTopicPreset("all")}
                        className="text-[11px] font-bold text-[#0284C7] hover:underline cursor-pointer"
                      >
                        Chọn cả 6 chủ đề
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleSelectTopicPreset("hk1")}
                        className="text-[11px] font-semibold text-slate-700 hover:underline cursor-pointer"
                      >
                        HK I (CĐ 1–3)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleSelectTopicPreset("hk2")}
                        className="text-[11px] font-semibold text-slate-700 hover:underline cursor-pointer"
                      >
                        HK II (CĐ 4–6)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {currentGradeTopics.map((topic) => {
                      const isChecked = selectedTopicIds.includes(topic.id);
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => handleToggleTopicSelection(topic.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-start gap-2 ${
                            isChecked
                              ? "border-[#0284C7] bg-sky-50/70 text-slate-900 shadow-2xs"
                              : "border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900">{topic.title}</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {topic.lessonsSummary}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-2.5 py-1.5 bg-sky-50/70 border border-sky-200 rounded-lg text-[11px] text-slate-700">
                    Đang chọn:{" "}
                    <strong className="text-[#0284C7]">
                      {selectedTopicObjs.length}/{currentGradeTopics.length} chủ đề
                    </strong>{" "}
                    ({selectedTopicsShortCodes})
                  </div>
                </div>

                {topicWithSubtracks && topicWithSubtracks.subtracks && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      Phân hóa Chủ đề 5 (Lớp 5 - Chọn mạch nội dung):
                    </span>
                    <div className="space-y-1.5">
                      {topicWithSubtracks.subtracks.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSubtrackChange(sub.id)}
                          className={`w-full p-2 rounded-lg border text-left text-xs font-semibold transition-colors cursor-pointer ${
                            selectedSubtrackId === sub.id
                              ? "border-amber-600 bg-white text-amber-950"
                              : "border-transparent bg-amber-100/50 text-amber-900 hover:bg-amber-100"
                          }`}
                        >
                          ● {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {builderMode === "practice" ||
                (builderMode === "monthly" && monthlyExamFormat === "practice_only") ? (
                  <div className="space-y-3">
                    <div>
                      <span className="block text-xs font-medium text-slate-600 mb-1.5">
                        Chọn định dạng File Mẫu Thực hành cần tạo:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setFileType("docx")}
                          className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                            fileType === "docx"
                              ? "border-[#0284C7] bg-sky-50/70 text-[#0284C7]"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          <span>Word (.docx)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFileType("pptx")}
                          className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                            fileType === "pptx"
                              ? "border-[#0284C7] bg-sky-50/70 text-[#0284C7]"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <Presentation className="w-4 h-4" />
                          <span>Slide (.pptx)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFileType("sb3")}
                          className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                            fileType === "sb3"
                              ? "border-[#0284C7] bg-sky-50/70 text-[#0284C7]"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <Cat className="w-4 h-4" />
                          <span>Scratch (.sb3)</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">
                          Số lượng câu / yêu cầu thực hành:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={2}
                            max={10}
                            value={practiceTaskCount}
                            onChange={(e) =>
                              setPracticeTaskCount(
                                Math.min(10, Math.max(2, Number(e.target.value) || 2))
                              )
                            }
                            className="w-16 px-2 py-1 text-xs font-mono font-bold text-center bg-white border border-sky-300 rounded-lg text-[#0284C7]"
                          />
                          <span className="text-xs font-semibold text-slate-600">câu (2–10)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        1. Số lượng câu hỏi Trắc nghiệm:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={theoryQuestionCount}
                        onChange={(e) =>
                          setTheoryQuestionCount(
                            Math.min(20, Math.max(1, Number(e.target.value) || 1))
                          )
                        }
                        className="w-16 px-2 py-1 text-xs font-mono font-bold text-center bg-white border border-sky-300 rounded-lg text-[#0284C7]"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-sky-200/80">
                      <label className="text-xs font-bold text-slate-800">
                        2. Số lượng câu hỏi Tự luận (Chấm NLP):
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={theoryEssayCount}
                        onChange={(e) =>
                          setTheoryEssayCount(
                            Math.min(10, Math.max(0, Number(e.target.value) || 0))
                          )
                        }
                        className="w-16 px-2 py-1 text-xs font-mono font-bold text-center bg-white border border-sky-300 rounded-lg text-[#0284C7]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BƯỚC 4: TẢI LÊN CÁC TỆP DỮ LIỆU (MA TRẬN ĐỀ, SÁCH GIÁO KHOA PDF, HOẶC ĐỀ MẪU) */}
            <div className="p-4 bg-amber-50/60 border-2 border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase tracking-wider">
                  <FileUp className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Bước 4: Cung cấp Tệp dữ liệu (Ma trận đề, Sách giáo khoa PDF, hoặc Đề mẫu)
                  </span>
                </div>
                {(uploadedDataFileName || referenceDocText || referencePdfBase64) && (
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedDataFileName(null);
                      setReferenceDocText("");
                      setReferencePdfBase64("");
                    }}
                    className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer shrink-0"
                  >
                    Xóa tài liệu
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Loại tệp dữ liệu cung cấp cho Trợ lý AI Khảo thí:
                </label>
                <select
                  value={referenceDocType}
                  onChange={(e) => setReferenceDocType(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                >
                  <option value="Ma trận / Đặc tả đề kiểm tra (Văn bản)">
                    1. Ma trận đề kiểm tra / Bản đặc tả (.docx, .pdf, .txt, .csv)
                  </option>
                  <option value="File Sách giáo khoa / Tài liệu PDF (.pdf)">
                    2. File Sách giáo khoa Tin học / Tài liệu PDF (.pdf)
                  </option>
                  <option value="Đề thi mẫu / Bài thực hành mẫu (.pdf, .docx, .pptx, .sb3)">
                    3. Đề thi mẫu / Bài thực hành mẫu (.pdf, .docx, .pptx, .sb3)
                  </option>
                </select>
              </div>

              <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white border-2 border-dashed border-amber-400 hover:bg-amber-50 hover:border-[#0284C7] text-xs font-bold rounded-xl cursor-pointer text-slate-800 transition-colors">
                <Upload className="w-4 h-4 text-[#0284C7] shrink-0" />
                <span className="truncate">
                  {uploadedDataFileName
                    ? `Đã tải lên: ${uploadedDataFileName}`
                    : "Bấm tải lên Ma trận đề (.docx/.txt/.pdf), Sách giáo khoa (.pdf), hoặc Đề mẫu"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.txt,.csv,.md,.doc,.docx,.ppt,.pptx,.sb3"
                  onChange={handleReferenceDocumentUpload}
                  className="hidden"
                />
              </label>

              {referencePdfBase64 && (
                <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-[11px] text-emerald-800 font-semibold">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Đã nạp tệp PDF ({uploadedDataFileName}) — AI sẽ đọc hiểu trực tiếp Ma trận / Đề mẫu trong PDF!
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nội dung Ma trận đề / Tài liệu Bước 4 (Tự động trích xuất khi tải tệp hoặc dán trực tiếp):
                </label>
                <textarea
                  rows={3}
                  value={referenceDocText}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setReferenceDocText(nextVal);
                    if (nextVal.trim()) {
                      applyStep4StrictDirective(activeTopicObj.title);
                    }
                  }}
                  placeholder="Tải tệp ở trên hoặc bấm '+ Nạp Ma trận Mẫu' ở Bước 3, hoặc dán trực tiếp nội dung Ma trận đề kiểm tra vào đây..."
                  className="w-full p-2.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              {/* PHẦN "GHI CHÚ TRỌNG TÂM" ([GHI CHÚ TRỌNG TÂM]) TRONG BƯỚC 4 */}
              <div className="pt-3 border-t border-amber-300/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    📌 Ghi chú trọng tâm ([GHI CHÚ TRỌNG TÂM])
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasStep4Material) {
                        applyStep4StrictDirective(activeTopicObj.title, grade, activeTopicObj, selectedSubtrackId);
                      } else {
                        const synced = getDefaultStep4NotesForGradeAndTopic(
                          grade,
                          activeTopicObj,
                          selectedSubtrackId
                        );
                        setFocusKnowledgeNote(synced.focusNote);
                        setTeacherCustomIdeaNote(synced.customIdeaNote);
                        setStrictConstraintNote(
                          "Bám sát 100% tài liệu SGK Tin học đã đính kèm, không sáng tạo thêm các phần kiến thức ngoài."
                        );
                      }
                    }}
                    className="text-[11px] font-semibold text-[#0284C7] hover:underline cursor-pointer shrink-0"
                  >
                    {hasStep4Material
                      ? "Áp dụng chuẩn Bước 3 & Bước 4"
                      : `Điền mẫu gợi ý chuẩn ${grade} (${activeTopicObj.code})`}
                  </button>
                </div>

                {hasStep4Material && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-[11px] font-bold text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Đã tải lên tài liệu ở Bước 4 — Tự động áp dụng vào &ldquo;Ghi chú trọng tâm&rdquo; &amp; &ldquo;Yêu cầu của giáo viên&rdquo;:{" "}
                      <span className="underline">
                        &ldquo;{STRICT_STEP3_STEP4_DIRECTIVE}&rdquo;
                      </span>
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    1. Phần kiến thức trọng tâm cần tập trung ra đề:
                  </label>
                  <textarea
                    rows={2}
                    value={focusKnowledgeNote}
                    onChange={(e) => setFocusKnowledgeNote(e.target.value)}
                    placeholder="Ví dụ: Tập trung vào phần Thư mục và Quản lý tệp tin ở Chủ đề 1, hạn chế hỏi phần lý thuyết lịch sử máy tính."
                    className="w-full p-2.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    2. Yêu cầu ràng buộc:
                  </label>
                  <input
                    type="text"
                    value={strictConstraintNote}
                    onChange={(e) => setStrictConstraintNote(e.target.value)}
                    placeholder={STRICT_STEP3_STEP4_DIRECTIVE}
                    className="w-full px-2.5 py-2 text-xs font-semibold bg-white border border-amber-300 rounded-lg text-red-800 focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              {/* PHẦN "YÊU CẦU CỦA GIÁO VIÊN" TRONG BƯỚC 4 */}
              <div className="pt-3 border-t border-amber-300/80 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                    📝 Yêu cầu của giáo viên:
                  </label>
                  {hasStep4Material && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      BÁM SÁT BƯỚC 3 &amp; BƯỚC 4
                    </span>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder={STRICT_STEP3_STEP4_DIRECTIVE}
                  className="w-full p-3 text-xs font-semibold bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3.5 px-4 bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {builderMode === "semester"
                        ? "Chuyên gia AI đang đọc Ma trận & biên soạn Đề thi học kỳ..."
                        : builderMode === "monthly"
                        ? `Trợ lý AI đang biên soạn Bài kiểm tra ${monthlyExamMonth}...`
                        : "Trợ lý AI đang thiết kế đề & ma trận chấm..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {builderMode === "semester"
                        ? `Tạo đề thi học kỳ bằng AI (${semesterType} - ${grade})`
                        : builderMode === "monthly"
                        ? `Tạo Bài Kiểm Tra Hàng Tháng (${monthlyExamMonth.split("(")[0].trim()} - ${grade})`
                        : builderMode === "practice"
                        ? `Tạo Bản Nháp File Mẫu (.${fileType.toUpperCase()}) & ${practiceTaskCount} Câu Thực Hành`
                        : `Tạo Bản Nháp Đề Lý Thuyết (${theoryQuestionCount} Câu TN + ${theoryEssayCount} Tự Luận)`}
                    </span>
                  </>
                )}
              </button>

              {builderMode === "semester" && (
                <button
                  type="button"
                  onClick={handleCreateManualSemesterExam}
                  className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-emerald-700" />
                  <span>
                    ✍️ Tự nhập tay Đề thi học kỳ ({theoryQuestionCount} câu TN, {theoryEssayCount} câu TL, {semesterPracticeCount} bài TH · {semesterTheoryPercent}% LT - {semesterPracticePercent}% TH)
                  </span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Interactive Editor Before Assigning + Assignment Bank (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {savedNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}

          {generatedAssignment ? (
            <div className="bg-white border-2 border-[#0284C7] rounded-xl p-6 space-y-6 shadow-xs">
              {/* Top Action Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 text-[#0284C7] text-xs font-bold">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>
                      {generatedAssignment.theoryExam?.semesterBlueprint
                        ? `ĐỀ THI ĐỊNH KỲ ${generatedAssignment.theoryExam.semesterBlueprint.semesterType.toUpperCase()} — ${generatedAssignment.grade} (${generatedAssignment.className})`
                        : `KHUNG XEM & CHỈNH SỬA CHI TIẾT ĐỀ TRƯỚC KHI BẤM GIAO (${generatedAssignment.grade} · ${generatedAssignment.className})`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Trình bày chuẩn 2 phần: Phần I (Trắc nghiệm) và Phần II (Tự luận/Thực hành), có chú thích [HÌNH ẢNH MINH HỌA: ...] và Đáp án &amp; Hướng dẫn chấm chi tiết.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {generatedAssignment.theoryExam && (
                    <button
                      type="button"
                      onClick={() =>
                        exportSemesterExamToDocx(
                          generatedAssignment.theoryExam!,
                          generatedAssignment.grade,
                          generatedAssignment.className
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0284C7] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Xuất Đề thi &amp; Đáp án (.docx)
                    </button>
                  )}
                  {generatedAssignment.fileType !== "theory" && (
                    <button
                      type="button"
                      onClick={() => handleDownloadMasterTemplate(generatedAssignment)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5 text-[#0284C7]" />
                      Tải File Gốc Mẫu (.{generatedAssignment.fileType})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAssignToClass}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    {isEditingExistingInBank
                      ? `Lưu Cập nhật Đề (${generatedAssignment.className})`
                      : `Xác nhận & Giao đề cho ${generatedAssignment.className}`}
                  </button>
                </div>
              </div>

              {/* Nếu là Đề Thi Học Kỳ -> Hiển thị Bảng Đối Chiếu Cấu Trúc & Ma Trận Nhận Thức */}
              {generatedAssignment.theoryExam?.semesterBlueprint && (
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                      📊 Bảng Chuẩn Ma Trận Đề Thi Học Kỳ ({generatedAssignment.theoryExam.semesterBlueprint.semesterType})
                    </span>
                    <span className="text-xs font-mono font-bold text-[#0284C7]">
                      Thời gian: {generatedAssignment.theoryExam.durationMinutes} phút · Tổng: 10.0 điểm
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-lg border border-sky-200">
                      <span className="text-[10px] text-slate-500 block">Lý thuyết</span>
                      <span className="font-mono font-bold text-slate-900">
                        {generatedAssignment.theoryExam.semesterBlueprint.theoryPercent}%
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-sky-200">
                      <span className="text-[10px] text-slate-500 block">Thực hành</span>
                      <span className="font-mono font-bold text-slate-900">
                        {generatedAssignment.theoryExam.semesterBlueprint.practicePercent}%
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-sky-200">
                      <span className="text-[10px] text-slate-500 block">Mức 1: Nhận biết</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {generatedAssignment.theoryExam.semesterBlueprint.nhanBietPercent}%
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-sky-200">
                      <span className="text-[10px] text-slate-500 block">Mức 2: Thông hiểu</span>
                      <span className="font-mono font-bold text-[#0284C7]">
                        {generatedAssignment.theoryExam.semesterBlueprint.thongHieuPercent}%
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-sky-200">
                      <span className="text-[10px] text-slate-500 block">Mức 3: Vận dụng</span>
                      <span className="font-mono font-bold text-amber-700">
                        {generatedAssignment.theoryExam.semesterBlueprint.vanDungPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PHẦN 1: CHỈNH SỬA THÔNG TIN CHUNG CỦA ĐỀ */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Thông tin chung của Đề kiểm tra (Có thể sửa trực tiếp):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tên đề bài / Bài kiểm tra:
                    </label>
                    <input
                      type="text"
                      value={generatedAssignment.title}
                      onChange={(e) =>
                        setGeneratedAssignment({
                          ...generatedAssignment,
                          title: e.target.value,
                          theoryExam: generatedAssignment.theoryExam
                            ? { ...generatedAssignment.theoryExam, title: e.target.value }
                            : undefined,
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Click chọn các lớp nhận đề ({generatedAssignment.grade}):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {classes
                        .filter((c) => c.grade === generatedAssignment.grade)
                        .map((cls) => {
                          const currentTargets =
                            generatedAssignment.targetClassNames &&
                            generatedAssignment.targetClassNames.length > 0
                              ? generatedAssignment.targetClassNames
                              : selectedClassNames;
                          const isChecked = currentTargets.includes(cls.name);
                          return (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={() => {
                                const exists = currentTargets.includes(cls.name);
                                const nextTargets = exists
                                  ? currentTargets.length > 1
                                    ? currentTargets.filter((n) => n !== cls.name)
                                    : currentTargets
                                  : [...currentTargets, cls.name];
                                setSelectedClassNames(nextTargets);
                                setGeneratedAssignment({
                                  ...generatedAssignment,
                                  targetClassNames: nextTargets,
                                  className: formatTargetClassesLabel(
                                    nextTargets,
                                    generatedAssignment.grade
                                  ),
                                });
                              }}
                              className={`px-2 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                isChecked
                                  ? "border-[#0284C7] bg-sky-50 text-[#0284C7]"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-3 h-3 text-[#0284C7]" />
                              ) : (
                                <Square className="w-3 h-3 text-slate-400" />
                              )}
                              <span>{cls.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN I & PHẦN II CỦA ĐỀ THI HỌC KỲ / ĐỀ LÝ THUYẾT */}
              {generatedAssignment.theoryExam ? (
                <div className="space-y-6">
                  {/* PHẦN I: TRẮC NGHIỆM */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl">
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        PHẦN I. TRẮC NGHIỆM KHÁCH QUAN ({generatedAssignment.theoryExam.multipleChoice.length} câu)
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddMoreTheoryQuestion}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-[#0284C7]" />
                        + Thêm câu trắc nghiệm
                      </button>
                    </div>

                    {generatedAssignment.theoryExam.multipleChoice.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1 min-w-[220px]">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold text-slate-800">
                                  Câu {idx + 1}:
                                </label>
                                <select
                                  value={q.cognitiveLevel || "Nhận biết"}
                                  onChange={(e) =>
                                    handleUpdateMcqField(idx, "cognitiveLevel", e.target.value)
                                  }
                                  className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-slate-300 rounded text-[#0284C7]"
                                >
                                  <option value="Nhận biết">Mức 1: Nhận biết</option>
                                  <option value="Thông hiểu">Mức 2: Thông hiểu</option>
                                  <option value="Vận dụng">Mức 3: Vận dụng</option>
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSwapMcqWithReserve(idx)}
                                title="Đổi sang câu hỏi khác trong bộ 5 câu dự trù sẵn (không trùng lặp với các câu khác trong đề)"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-xs"
                              >
                                <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                                <span>
                                  Đổi câu hỏi khác (Dự trù {((q.reserveIndex ?? 0) % (q.reserveQuestions?.length || 5)) + 1}/5)
                                </span>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={q.question}
                              onChange={(e) =>
                                handleUpdateMcqField(idx, "question", e.target.value)
                              }
                              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                            />
                          </div>

                          <div className="w-24 shrink-0">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Điểm số:
                            </label>
                            <input
                              type="number"
                              step="0.25"
                              min="0.25"
                              max="10"
                              value={q.points}
                              onChange={(e) =>
                                handleUpdateMcqField(
                                  idx,
                                  "points",
                                  Number(e.target.value) || 0.5
                                )
                              }
                              className="w-full px-2.5 py-2 text-xs font-mono font-bold text-center bg-white border border-slate-300 rounded-lg text-[#0284C7]"
                            />
                          </div>

                          {generatedAssignment.theoryExam!.multipleChoice.length > 1 && (
                            <button
                              type="button"
                              title="Xóa câu hỏi này"
                              onClick={() => handleRemoveTheoryQuestion(idx)}
                              className="mt-5 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* HÌNH ẢNH MINH HỌA TỰ ĐỘNG CỦA HỆ THỐNG + NÚT ĐỔI HÌNH KHÁC + NÚT XÓA HÌNH */}
                        <div
                          className={`p-3 rounded-xl space-y-2 border ${
                            q.hasNoIllustration || !q.illustrationImageDataUrl
                              ? "bg-slate-50/90 border-dashed border-slate-300"
                              : "bg-sky-50/80 border-dashed border-sky-300"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label
                              className={`text-[11px] font-bold flex items-center gap-1.5 ${
                                q.hasNoIllustration || !q.illustrationImageDataUrl
                                  ? "text-slate-600"
                                  : "text-[#0284C7]"
                              }`}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              {q.hasNoIllustration || !q.illustrationImageDataUrl ? (
                                <span>
                                  Hình minh họa Câu {idx + 1}:{" "}
                                  <span className="font-normal text-slate-500 italic">
                                    (Đã xóa / Không dùng hình minh họa)
                                  </span>
                                </span>
                              ) : (
                                <span>
                                  Hình ảnh minh họa tự động cho Câu {idx + 1} (Có thể đổi hình hoặc xóa nếu không cần):
                                </span>
                              )}
                            </label>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {q.hasNoIllustration || !q.illustrationImageDataUrl ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleRestoreMcqIllustration(idx)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#0284C7] bg-white hover:bg-sky-100 border border-sky-300 rounded-lg transition-colors cursor-pointer"
                                    title="Tạo lại hình minh họa cho câu hỏi này"
                                  >
                                    <Sparkles className="w-3 h-3 text-[#0284C7]" />
                                    Khôi phục / Thêm hình ảnh
                                  </button>
                                  <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer">
                                    <Upload className="w-3 h-3 text-[#0284C7]" />
                                    <span>Tải ảnh từ máy</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleUploadMcqIllustrationImage(idx, e)}
                                      className="hidden"
                                    />
                                  </label>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleCycleMcqIllustration(idx)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#0284C7] bg-white hover:bg-sky-100 border border-sky-300 rounded-lg transition-colors cursor-pointer"
                                    title="Đổi kiểu hình minh họa khác trong bộ 5 mẫu vẽ"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    Đổi hình khác (Mẫu {((q.illustrationVariant ?? 0) % 5) + 1}/5)
                                  </button>
                                  <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-sky-300 rounded-lg cursor-pointer">
                                    <Upload className="w-3 h-3 text-[#0284C7]" />
                                    <span>Tải ảnh từ máy</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleUploadMcqIllustrationImage(idx, e)}
                                      className="hidden"
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMcqIllustration(idx)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                    title="Xóa hình minh họa này nếu câu hỏi không cần thiết phải có hình"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-500" />
                                    Xóa hình minh họa
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {!q.hasNoIllustration && (q.illustrationImageDataUrl || generatingIllustrationMap[`mcq-${idx}`]) && (
                            <div className="relative group flex items-center justify-center bg-white p-2 rounded-lg border border-sky-200 min-h-[140px]">
                              {generatingIllustrationMap[`mcq-${idx}`] ? (
                                <div className="flex flex-col items-center justify-center p-6 space-y-2 text-sky-700 animate-in fade-in duration-200">
                                  <Loader2 className="w-8 h-8 animate-spin text-[#0284C7]" />
                                  <span className="text-xs font-bold animate-pulse text-center">
                                    AI đang đọc gợi ý và vẽ ảnh minh họa mới...
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <img
                                    src={q.illustrationImageDataUrl}
                                    alt="Minh họa câu hỏi"
                                    className="max-h-40 rounded-lg object-contain"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMcqIllustration(idx)}
                                    className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-sm transition-opacity opacity-90 group-hover:opacity-100 cursor-pointer"
                                    title="Xóa hình minh họa cho câu hỏi này"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Xóa hình này
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* VÙNG GỢI Ý TẠO ẢNH & NÚT LỆNH TẠO LẠI ẢNH THEO GỢI Ý */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-[11px] font-bold text-sky-950 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
                                <span>Gợi ý nội dung tạo ảnh minh họa cho câu hỏi:</span>
                              </label>
                              <span className="text-[10px] text-slate-500 hidden sm:inline">
                                Gõ mô tả và bấm nút để AI tự động vẽ lại hình mới theo gợi ý
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <input
                                type="text"
                                value={q.illustrationNote || ""}
                                onChange={(e) => {
                                  const nextNote = e.target.value;
                                  const exam = generatedAssignment.theoryExam!;
                                  const nextMcqs = exam.multipleChoice.map((item, qI) =>
                                    qI === idx ? { ...item, illustrationNote: nextNote } : item
                                  );
                                  syncTheoryExamAndChecklist({ ...exam, multipleChoice: nextMcqs });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleRegenerateMcqIllustrationFromPrompt(idx);
                                  }
                                }}
                                placeholder="Nhập hoặc dán gợi ý tạo ảnh (VD: thao tác nháy đúp chuột, hàng phím cơ sở phím F và J, vẽ hình trong Paint...)"
                                className="w-full px-3 py-2 text-xs bg-white border border-sky-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7] shadow-2xs font-medium"
                              />
                              <button
                                type="button"
                                disabled={Boolean(generatingIllustrationMap[`mcq-${idx}`])}
                                onClick={() => handleRegenerateMcqIllustrationFromPrompt(idx)}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
                                title="Bấm để AI đọc nội dung trong ô gợi ý và tạo lại ảnh mới"
                              >
                                {generatingIllustrationMap[`mcq-${idx}`] ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>AI đang tạo ảnh...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Tạo lại ảnh theo gợi ý</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-semibold text-slate-600">
                            Các phương án trả lời (Tích chọn nút tròn ở phương án ĐÚNG):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = oIdx === q.correctIndex;
                              return (
                                <div
                                  key={oIdx}
                                  className={`flex items-center gap-2 p-2 rounded-lg border ${
                                    isCorrect
                                      ? "bg-emerald-50/80 border-emerald-400"
                                      : "bg-white border-slate-200"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`correct-mcq-${q.id || idx}`}
                                    checked={isCorrect}
                                    onChange={() =>
                                      handleUpdateMcqField(idx, "correctIndex", oIdx)
                                    }
                                    className="w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) =>
                                      handleUpdateMcqOption(idx, oIdx, e.target.value)
                                    }
                                    className="w-full text-xs bg-transparent border-b border-transparent focus:border-slate-400 focus:outline-none text-slate-900 font-medium"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Hướng dẫn chấm &amp; Giải thích đáp án đúng:
                          </label>
                          <input
                            type="text"
                            value={q.explanation}
                            onChange={(e) =>
                              handleUpdateMcqField(idx, "explanation", e.target.value)
                            }
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#0284C7]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PHẦN II: TỰ LUẬN & THỰC HÀNH */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl">
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        PHẦN II. TỰ LUẬN &amp; THỰC HÀNH ({getActiveShortAnswers(generatedAssignment.theoryExam).length} câu Tự luận
                        {generatedAssignment.theoryExam.semesterBlueprint?.practiceTasks?.length
                          ? ` + ${generatedAssignment.theoryExam.semesterBlueprint.practiceTasks.length} bài Thực hành`
                          : ""}
                        )
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleAddMoreEssayQuestion}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-[#0284C7]" />
                          + Thêm câu tự luận
                        </button>
                        {generatedAssignment.theoryExam.semesterBlueprint && (
                          <button
                            type="button"
                            onClick={handleAddSemesterPracticeTask}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
                            + Thêm bài thực hành
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Danh sách câu hỏi Tự luận */}
                    {getActiveShortAnswers(generatedAssignment.theoryExam).map((sa, sIdx) => (
                      <div
                        key={sa.id || sIdx}
                        className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl text-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                              <label className="text-[11px] font-bold text-slate-700">
                                Câu hỏi Tự luận {sIdx + 1} ({sa.cognitiveLevel || "Thông hiểu"}):
                              </label>
                              <button
                                type="button"
                                onClick={() => handleSwapEssayWithReserve(sIdx)}
                                title="Đổi sang câu tự luận khác trong bộ 5 câu dự trù sẵn (không trùng lặp với các câu khác trong đề)"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-xs"
                              >
                                <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                                <span>
                                  Đổi câu hỏi khác (Dự trù {((sa.reserveIndex ?? 0) % (sa.reserveQuestions?.length || 5)) + 1}/5)
                                </span>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={sa.question}
                              onChange={(e) =>
                                handleUpdateEssayField(sIdx, "question", e.target.value)
                              }
                              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-sky-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                            />
                          </div>

                          <div className="w-24 shrink-0">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Điểm tự luận:
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="10"
                              value={sa.points}
                              onChange={(e) =>
                                handleUpdateEssayField(
                                  sIdx,
                                  "points",
                                  Number(e.target.value) || 1
                                )
                              }
                              className="w-full px-2 py-2 text-xs font-mono font-bold text-center bg-white border border-sky-300 rounded-lg text-[#0284C7]"
                            />
                          </div>

                          <button
                            type="button"
                            title="Xóa câu tự luận này"
                            onClick={() => handleRemoveEssayQuestion(sIdx)}
                            className="mt-5 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div
                          className={`p-3 rounded-xl space-y-2 border ${
                            sa.hasNoIllustration || !sa.illustrationImageDataUrl
                              ? "bg-slate-50/90 border-dashed border-slate-300"
                              : "bg-white border border-sky-200"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label
                              className={`text-[11px] font-bold flex items-center gap-1.5 ${
                                sa.hasNoIllustration || !sa.illustrationImageDataUrl
                                  ? "text-slate-600"
                                  : "text-[#0284C7]"
                              }`}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              {sa.hasNoIllustration || !sa.illustrationImageDataUrl ? (
                                <span>
                                  Hình minh họa Câu tự luận {sIdx + 1}:{" "}
                                  <span className="font-normal text-slate-500 italic">
                                    (Đã xóa / Không dùng hình minh họa)
                                  </span>
                                </span>
                              ) : (
                                <span>
                                  Hình ảnh minh họa tự động cho câu tự luận {sIdx + 1} (Có thể đổi hình hoặc xóa nếu không cần):
                                </span>
                              )}
                            </label>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {sa.hasNoIllustration || !sa.illustrationImageDataUrl ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleRestoreEssayIllustration(sIdx)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#0284C7] bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg transition-colors cursor-pointer"
                                    title="Tạo lại hình minh họa cho câu tự luận này"
                                  >
                                    <Sparkles className="w-3 h-3 text-[#0284C7]" />
                                    Khôi phục / Thêm hình ảnh
                                  </button>
                                  <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer">
                                    <Upload className="w-3 h-3 text-slate-600" />
                                    <span>Tải ảnh từ máy</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleUploadEssayCustomImage(sIdx, e)}
                                      className="hidden"
                                    />
                                  </label>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleCycleEssayIllustration(sIdx)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#0284C7] bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    Đổi hình khác (Mẫu {((sa.illustrationVariant ?? 0) % 5) + 1}/5)
                                  </button>
                                  <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer">
                                    <Upload className="w-3 h-3 text-slate-600" />
                                    <span>Tải ảnh từ máy</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleUploadEssayCustomImage(sIdx, e)}
                                      className="hidden"
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEssayIllustration(sIdx)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                    title="Xóa hình minh họa này nếu câu hỏi không cần thiết phải có hình"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-500" />
                                    Xóa hình minh họa
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {!sa.hasNoIllustration && (sa.illustrationImageDataUrl || generatingIllustrationMap[`essay-${sIdx}`]) && (
                            <div className="relative group bg-slate-50 p-2 rounded-lg border border-sky-200 flex items-center justify-center min-h-[140px]">
                              {generatingIllustrationMap[`essay-${sIdx}`] ? (
                                <div className="flex flex-col items-center justify-center p-6 space-y-2 text-sky-700 animate-in fade-in duration-200">
                                  <Loader2 className="w-8 h-8 animate-spin text-[#0284C7]" />
                                  <span className="text-xs font-bold animate-pulse text-center">
                                    AI đang đọc gợi ý và vẽ ảnh minh họa mới...
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <img
                                    src={sa.illustrationImageDataUrl}
                                    alt={`Minh họa tự luận ${sIdx + 1}`}
                                    className="max-h-40 rounded-lg object-contain"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEssayIllustration(sIdx)}
                                    className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-sm transition-opacity opacity-90 group-hover:opacity-100 cursor-pointer"
                                    title="Xóa hình minh họa cho câu hỏi này"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Xóa hình này
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* VÙNG GỢI Ý TẠO ẢNH & NÚT LỆNH TẠO LẠI ẢNH THEO GỢI Ý (TỰ LUẬN) */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-[11px] font-bold text-sky-950 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
                                <span>Gợi ý nội dung tạo ảnh minh họa cho câu tự luận:</span>
                              </label>
                              <span className="text-[10px] text-slate-500 hidden sm:inline">
                                Gõ mô tả và bấm nút để AI tự động vẽ lại hình mới theo gợi ý
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <input
                                type="text"
                                value={sa.illustrationNote || ""}
                                onChange={(e) => {
                                  const nextNote = e.target.value;
                                  const exam = generatedAssignment.theoryExam!;
                                  const currentEssays = getActiveShortAnswers(exam);
                                  const nextEssays = currentEssays.map((item, eI) =>
                                    eI === sIdx ? { ...item, illustrationNote: nextNote } : item
                                  );
                                  syncTheoryExamAndChecklist({
                                    ...exam,
                                    shortAnswers: nextEssays,
                                    shortAnswer: nextEssays[0] || exam.shortAnswer,
                                  });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleRegenerateEssayIllustrationFromPrompt(sIdx);
                                  }
                                }}
                                placeholder="Nhập gợi ý tạo ảnh (VD: các bộ phận máy tính, tư thế ngồi học đúng, thư mục tệp...)"
                                className="w-full px-3 py-2 text-xs bg-white border border-sky-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7] shadow-2xs font-medium"
                              />
                              <button
                                type="button"
                                disabled={Boolean(generatingIllustrationMap[`essay-${sIdx}`])}
                                onClick={() => handleRegenerateEssayIllustrationFromPrompt(sIdx)}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
                                title="Bấm để AI đọc nội dung trong ô gợi ý và tạo lại ảnh mới"
                              >
                                {generatingIllustrationMap[`essay-${sIdx}`] ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>AI đang tạo ảnh...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Tạo lại ảnh theo gợi ý</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Đáp án &amp; Hướng dẫn chấm chi tiết (Câu tự luận {sIdx + 1}):
                          </label>
                          <textarea
                            rows={2}
                            value={sa.sampleAnswer}
                            onChange={(e) =>
                              handleUpdateEssayField(sIdx, "sampleAnswer", e.target.value)
                            }
                            className="w-full p-2.5 text-xs bg-white border border-sky-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Các cụm từ khóa đồng nghĩa để AI chấm điểm NLP (ngăn cách bằng dấu phẩy):
                          </label>
                          <input
                            type="text"
                            value={(sa.semanticKeywords || []).join(", ")}
                            onChange={(e) =>
                              handleUpdateEssayField(
                                sIdx,
                                "semanticKeywords",
                                e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                              )
                            }
                            className="w-full px-3 py-2 text-xs font-mono bg-white border border-sky-300 rounded-lg text-slate-800"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Danh sách Bài tập Thực hành trong Phần II của Đề thi Học kỳ */}
                    {generatedAssignment.theoryExam.semesterBlueprint?.practiceTasks?.map(
                      (pt, pIdx) => (
                        <div
                          key={pt.id || pIdx}
                          className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex-1 min-w-[220px] space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-block text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                  PHẦN II — BÀI TẬP THỰC HÀNH {pIdx + 1}
                                </span>
                                <select
                                  value={pt.softwareType || "Word (.docx)"}
                                  onChange={(e) =>
                                    handleUpdateSemesterPracticeTask(
                                      pIdx,
                                      "softwareType",
                                      e.target.value as SemesterPracticeTask["softwareType"]
                                    )
                                  }
                                  className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-emerald-300 rounded text-emerald-800"
                                >
                                  <option value="Word (.docx)">Word (.docx)</option>
                                  <option value="PowerPoint (.pptx)">PowerPoint (.pptx)</option>
                                  <option value="Scratch (.sb3)">Scratch (.sb3)</option>
                                  <option value="Thực hành tổng hợp">Thực hành tổng hợp</option>
                                </select>
                                <select
                                  value={pt.cognitiveLevel || "Vận dụng"}
                                  onChange={(e) =>
                                    handleUpdateSemesterPracticeTask(
                                      pIdx,
                                      "cognitiveLevel",
                                      e.target.value
                                    )
                                  }
                                  className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-emerald-300 rounded text-emerald-800"
                                >
                                  <option value="Nhận biết">Mức 1: Nhận biết</option>
                                  <option value="Thông hiểu">Mức 2: Thông hiểu</option>
                                  <option value="Vận dụng">Mức 3: Vận dụng</option>
                                </select>
                              </div>
                              <input
                                type="text"
                                value={pt.title}
                                onChange={(e) =>
                                  handleUpdateSemesterPracticeTask(pIdx, "title", e.target.value)
                                }
                                placeholder="Nhập tiêu đề bài thực hành..."
                                className="w-full px-3 py-2 text-xs font-bold bg-white border border-emerald-300 rounded-lg text-slate-900"
                              />
                            </div>
                            <div className="w-24 shrink-0">
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Điểm TH:
                              </label>
                              <input
                                type="number"
                                step="0.25"
                                min="0.25"
                                max="10"
                                value={pt.points}
                                onChange={(e) =>
                                  handleUpdateSemesterPracticeTask(
                                    pIdx,
                                    "points",
                                    Number(e.target.value) || 4
                                  )
                                }
                                className="w-full px-2 py-2 text-xs font-mono font-bold text-center bg-white border border-emerald-300 rounded-lg text-emerald-700"
                              />
                            </div>
                            {(generatedAssignment.theoryExam?.semesterBlueprint?.practiceTasks
                              ?.length || 0) > 1 && (
                              <button
                                type="button"
                                title="Xóa bài thực hành này"
                                onClick={() => handleRemoveSemesterPracticeTask(pIdx)}
                                className="mt-5 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Yêu cầu đề bài thực hành cho học sinh:
                            </label>
                            <textarea
                              rows={2}
                              value={pt.instructions}
                              onChange={(e) =>
                                handleUpdateSemesterPracticeTask(
                                  pIdx,
                                  "instructions",
                                  e.target.value
                                )
                              }
                              className="w-full p-2.5 text-xs bg-white border border-emerald-300 rounded-lg text-slate-900"
                            />
                          </div>

                          <div
                            className={`p-3 rounded-xl space-y-2 border ${
                              pt.hasNoIllustration || !pt.illustrationImageDataUrl
                                ? "bg-slate-50/90 border-dashed border-slate-300"
                                : "bg-white border border-emerald-200"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label
                                className={`text-[11px] font-bold flex items-center gap-1.5 ${
                                  pt.hasNoIllustration || !pt.illustrationImageDataUrl
                                    ? "text-slate-600"
                                    : "text-emerald-800"
                                }`}
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                                {pt.hasNoIllustration || !pt.illustrationImageDataUrl ? (
                                  <span>
                                    Hình minh họa Bài thực hành {pIdx + 1}:{" "}
                                    <span className="font-normal text-slate-500 italic">
                                      (Đã xóa / Không dùng hình minh họa)
                                    </span>
                                  </span>
                                ) : (
                                  <span>
                                    Hình ảnh minh họa mẫu bài thực hành (Có thể đổi hình hoặc xóa nếu không cần):
                                  </span>
                                )}
                              </label>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {pt.hasNoIllustration || !pt.illustrationImageDataUrl ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleRestorePracticeIllustration(pIdx)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                                      title="Tạo lại hình minh họa cho bài thực hành này"
                                    >
                                      <Sparkles className="w-3 h-3 text-emerald-700" />
                                      Khôi phục / Thêm hình ảnh
                                    </button>
                                    <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer">
                                      <Upload className="w-3 h-3 text-slate-600" />
                                      <span>Tải ảnh từ máy</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleUploadPracticeCustomImage(pIdx, e)}
                                        className="hidden"
                                      />
                                    </label>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleCyclePracticeIllustration(pIdx)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      Đổi hình khác (Mẫu {((pt.illustrationVariant ?? 0) % 5) + 1}/5)
                                    </button>
                                    <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer">
                                      <Upload className="w-3 h-3 text-slate-600" />
                                      Tải ảnh từ máy
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleUploadPracticeCustomImage(pIdx, e)}
                                        className="hidden"
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePracticeIllustration(pIdx)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                      title="Xóa hình minh họa này nếu bài thực hành không cần thiết phải có hình"
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-500" />
                                      Xóa hình minh họa
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {!pt.hasNoIllustration && pt.illustrationImageDataUrl && (
                              <div className="relative group bg-slate-50 p-2 rounded-lg border border-emerald-200 flex justify-center">
                                <img
                                  src={pt.illustrationImageDataUrl}
                                  alt={`Minh họa thực hành ${pIdx + 1}`}
                                  className="max-h-44 w-auto rounded-lg object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemovePracticeIllustration(pIdx)}
                                  className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-sm transition-opacity opacity-90 group-hover:opacity-100 cursor-pointer"
                                  title="Xóa hình minh họa cho bài thực hành này"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Xóa hình này
                                </button>
                              </div>
                            )}

                            {/* VÙNG GỢI Ý TẠO ẢNH & NÚT LỆNH TẠO LẠI ẢNH THEO GỢI Ý (THỰC HÀNH) */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between gap-2">
                                <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Gợi ý nội dung tạo ảnh minh họa cho bài thực hành:</span>
                                </label>
                                <span className="text-[10px] text-slate-500 hidden sm:inline">
                                  Gõ mô tả bài tập thực hành và bấm nút để hệ thống tự động vẽ lại hình
                                </span>
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <input
                                  type="text"
                                  value={pt.illustrationNote || ""}
                                  onChange={(e) =>
                                    handleUpdateSemesterPracticeTask(
                                      pIdx,
                                      "illustrationNote",
                                      e.target.value
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleRegeneratePracticeIllustrationFromPrompt(pIdx);
                                    }
                                  }}
                                  placeholder="Nhập gợi ý tạo ảnh thực hành (VD: vẽ hình ngôi nhà trong Paint, bảng tính Excel, giao diện Scratch...)"
                                  className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs font-medium"
                                />
                                <button
                                  type="button"
                                  disabled={Boolean(generatingIllustrationMap[`practice-${pIdx}`])}
                                  onClick={() => handleRegeneratePracticeIllustrationFromPrompt(pIdx)}
                                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
                                  title="Bấm để AI đọc nội dung trong ô gợi ý và tạo lại ảnh thực hành mới"
                                >
                                  {generatingIllustrationMap[`practice-${pIdx}`] ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>AI đang tạo ảnh...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>Tạo lại ảnh theo gợi ý</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Hướng dẫn chấm &amp; Biểu điểm thực hành chi tiết:
                            </label>
                            <textarea
                              rows={3}
                              value={pt.gradingRubric}
                              onChange={(e) =>
                                handleUpdateSemesterPracticeTask(
                                  pIdx,
                                  "gradingRubric",
                                  e.target.value
                                )
                              }
                              className="w-full p-2.5 text-xs bg-white border border-emerald-300 rounded-lg text-slate-800"
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* BẢNG TỔNG HỢP ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT CHO TỪNG CÂU */}
                  {generatedAssignment.theoryExam.semesterBlueprint && (
                    <div className="p-4 bg-amber-50/70 border-2 border-amber-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                          📌 ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT CHO TỪNG CÂU (KÈM THEO ĐỀ THI HỌC KỲ)
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            exportSemesterExamToDocx(
                              generatedAssignment.theoryExam!,
                              generatedAssignment.grade,
                              generatedAssignment.className
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          Tải Đề &amp; Đáp án (.docx)
                        </button>
                      </div>
                      <textarea
                        rows={6}
                        value={
                          generatedAssignment.theoryExam.semesterBlueprint.answerKeyAndGradingGuide
                        }
                        onChange={(e) => {
                          const exam = generatedAssignment.theoryExam!;
                          syncTheoryExamAndChecklist({
                            ...exam,
                            semesterBlueprint: {
                              ...exam.semesterBlueprint!,
                              answerKeyAndGradingGuide: e.target.value,
                            },
                          });
                        }}
                        className="w-full p-3 text-xs font-mono bg-white border border-amber-300 rounded-lg text-slate-800 leading-relaxed focus:outline-none focus:border-[#0284C7]"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* PHẦN 2B: NẾU LÀ BÀI THỰC HÀNH -> CHỈNH SỬA CẤU TRÚC FILE MẪU & MA TRẬN CHECKLIST */
                <div className="space-y-5">
                  {generatedAssignment.templateSummary && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3">
                      <span className="font-bold text-slate-900 block uppercase tracking-wider">
                        2. Chỉnh sửa Nội dung File Gốc Mẫu (.{generatedAssignment.fileType}):
                      </span>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Tiêu đề chính trong File Mẫu:
                        </label>
                        <input
                          type="text"
                          value={generatedAssignment.templateSummary.headingText}
                          onChange={(e) =>
                            setGeneratedAssignment({
                              ...generatedAssignment,
                              templateSummary: {
                                ...generatedAssignment.templateSummary!,
                                headingText: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Các dòng nội dung / cấu trúc Slide trong File Mẫu (mỗi dòng 1 ý):
                        </label>
                        <textarea
                          rows={3}
                          value={(generatedAssignment.templateSummary.bodyLines || []).join("\n")}
                          onChange={(e) =>
                            setGeneratedAssignment({
                              ...generatedAssignment,
                              templateSummary: {
                                ...generatedAssignment.templateSummary!,
                                bodyLines: e.target.value.split("\n"),
                              },
                            })
                          }
                          className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          3. Chỉnh sửa Ma trận Checklist Chấm Thực hành ({generatedAssignment.checklist.length} câu thực hành):
                        </h4>
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            Math.abs(totalChecklistPoints - 10) < 0.05
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          Tổng điểm Ma trận hiện tại: {totalChecklistPoints.toFixed(1)} / 10.0 điểm
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {Math.abs(totalChecklistPoints - 10) >= 0.05 && (
                          <button
                            type="button"
                            onClick={handleRebalanceChecklistPoints}
                            className="px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Cân đối về 10.0đ
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleAddMorePracticeTask}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0284C7] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          + Thêm câu thực hành
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {generatedAssignment.checklist.map((item, i) => (
                        <div
                          key={item.id || i}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Tiêu chí / Câu thực hành {i + 1}:
                              </label>
                              <input
                                type="text"
                                value={item.criterion}
                                onChange={(e) =>
                                  handleUpdateChecklistItem(i, "criterion", e.target.value)
                                }
                                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0284C7]"
                              />
                            </div>

                            <div className="w-24 shrink-0">
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Điểm tối đa:
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="10"
                                value={item.maxPoints}
                                onChange={(e) =>
                                  handleUpdateChecklistItem(
                                    i,
                                    "maxPoints",
                                    Number(e.target.value) || 1
                                  )
                                }
                                className="w-full px-2.5 py-2 text-xs font-mono font-bold text-center bg-white border border-slate-300 rounded-lg text-[#0284C7]"
                              />
                            </div>

                            {generatedAssignment.checklist.length > 1 && (
                              <button
                                type="button"
                                title="Xóa tiêu chí này"
                                onClick={() => handleRemovePracticeTask(i)}
                                className="mt-5 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Confirm & Assign Bar */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-600">
                  Sau khi kiểm tra và chỉnh sửa xong, bấm nút bên phải để chính thức giao đề cho lớp.
                </span>
                <button
                  type="button"
                  onClick={handleAssignToClass}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  {isEditingExistingInBank
                    ? `Lưu Cập nhật Đề & Ma trận (${generatedAssignment.className})`
                    : `Xác nhận & Giao đề cho ${generatedAssignment.className}`}
                </button>
              </div>
            </div>
          ) : null}

          {/* Danh sách Ngân hàng Đề & Bài mẫu hiện có (Có nút Xóa đề) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Ngân hàng Đề Thi Học Kỳ, Đề Lý Thuyết &amp; Bài Thực Hành ({assignments.length} đề)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bấm "Xem &amp; Sửa đề / Ma trận" để chỉnh sửa chi tiết, xuất Word (.docx) hoặc bấm "Xóa đề" để xóa khỏi Ngân hàng.
                </p>
              </div>
            </div>

            {assignments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Ngân hàng đề hiện đang trống. Thầy hãy sử dụng bảng bên trái để tạo đề mới nhé!
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {assignments.map((asg) => (
                  <div
                    key={asg.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-[#0284C7]">{asg.grade}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-800">{asg.className}</span>
                        <span>·</span>
                        <span className="font-mono">.{asg.fileType.toUpperCase()}</span>
                        <span>·</span>
                        <span className="font-mono">{asg.checklist.length} tiêu chí</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">{asg.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{asg.studentPrompt}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {asg.fileType !== "theory" && (
                        <button
                          type="button"
                          onClick={() => handleDownloadMasterTemplate(asg)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Tải File Mẫu (.{asg.fileType})
                        </button>
                      )}
                      {asg.theoryExam && (
                        <button
                          type="button"
                          onClick={() =>
                            exportSemesterExamToDocx(asg.theoryExam!, asg.grade, asg.className)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Download className="w-3.5 h-3.5 text-[#0284C7]" />
                          Tải Word (.docx)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const enrichedAsg = asg.theoryExam
                            ? {
                                ...asg,
                                theoryExam: ensureExamReserveQuestions(
                                  enrichExamWithAutoIllustrations(
                                    asg.theoryExam,
                                    asg.grade
                                  ),
                                  asg.grade
                                ),
                              }
                            : asg;
                          setGrade(asg.grade);
                          const restoredClasses =
                            asg.targetClassNames && asg.targetClassNames.length > 0
                              ? asg.targetClassNames
                              : [asg.className];
                          setSelectedClassNames(restoredClasses);
                          setClassName(asg.className);
                          setGeneratedAssignment(enrichedAsg);
                          setSavedNotice(
                            `Đang mở chế độ chỉnh sửa đề "${asg.title}". Mọi thay đổi được lưu nháp tự động — bấm "Lưu Cập nhật Đề & Ma trận" để cập nhật chính thức.`
                          );
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0284C7] bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Xem &amp; Sửa đề / Ma trận
                      </button>

                      {onDeleteAssignment && (
                        <>
                          {confirmingDeleteAsgId === asg.id ? (
                            <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteAssignment(asg.id);
                                  if (generatedAssignment?.id === asg.id) {
                                    setGeneratedAssignment(null);
                                  }
                                  setConfirmingDeleteAsgId(null);
                                  setSavedNotice(`Đã xóa đề "${asg.title}" khỏi Ngân hàng đề.`);
                                }}
                                className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer whitespace-nowrap"
                              >
                                Xác nhận xóa
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingDeleteAsgId(null)}
                                className="px-1.5 py-0.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              title="Xóa đề này khỏi Ngân hàng đề"
                              onClick={() => setConfirmingDeleteAsgId(asg.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50/70 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Xóa đề
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
