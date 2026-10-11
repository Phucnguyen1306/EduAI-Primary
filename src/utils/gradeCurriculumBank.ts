import {
  CognitiveLevel,
  GradeLevel,
  SemesterPracticeTask,
} from "../types/grading";

export interface KnttSubtrackConfig {
  id: string;
  label: string;
  theoryPrompt: string;
  practicePrompt: string;
  recommendedFileType: "docx" | "pptx" | "sb3" | "theory";
}

export interface KnttTopicConfigMinimal {
  id: string;
  code: string;
  title: string;
  lessonsSummary: string;
  theoryPrompt: string;
  practicePrompt: string;
  recommendedFileType: "docx" | "pptx" | "sb3" | "theory";
  subtracks?: KnttSubtrackConfig[];
}

export interface TopicPureQuestionItem {
  question: string;
  cognitiveLevel: CognitiveLevel;
  illustrationNote: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TopicPureEssayItem {
  question: string;
  cognitiveLevel: CognitiveLevel;
  illustrationNote: string;
  sampleAnswer: string;
  gradingGuide: string;
  semanticKeywords: string[];
}

export function getDefaultStep4NotesForGradeAndTopic(
  grade: GradeLevel,
  topicObj: KnttTopicConfigMinimal,
  subtrackId?: string
): {
  focusNote: string;
  customIdeaNote: string;
  gradeBoundarySummary: string;
} {
  const activeSub = topicObj.subtracks?.find((s) => s.id === subtrackId);
  const subLabel = activeSub ? ` (${activeSub.label})` : "";

  if (grade === "Lớp 3") {
    const mapL3: Record<string, { focusNote: string; customIdeaNote: string }> = {
      "k3-cd1": {
        focusNote:
          "Tập trung đúng chương trình Tin học Lớp 3 - Chủ đề 1 (Máy tính và em): Nhận biết 3 dạng thông tin (chữ, hình ảnh, âm thanh), 4 bộ phận cơ bản của máy tính để bàn, các thao tác chuột, tư thế ngồi đúng (50-80cm) và hàng phím cơ sở (phím có gai F, J). Tuyệt đối không hỏi khái niệm Phần cứng/Phần mềm của Lớp 4.",
        customIdeaNote:
          "Câu hỏi tự luận tình huống: Trong giờ học thực hành Lớp 3, bạn Nam ngồi cúi sát mắt vào màn hình máy tính và chỉ dùng 1 ngón tay để tìm phím. Em hãy khuyên bạn cách ngồi đúng tư thế và cách đặt tay lên hàng phím cơ sở (hai ngón trỏ đặt ở phím F và J).",
      },
      "k3-cd2": {
        focusNote:
          "Tập trung đúng chương trình Tin học Lớp 3 - Chủ đề 2 (Mạng máy tính và Internet): Nhận biết biểu tượng trình duyệt web trên màn hình nền, thao tác nháy đúp chuột mở trình duyệt để xem tin tức thiếu nhi, dự báo thời tiết và giải trí lành mạnh. Tuyệt đối không hỏi Siêu liên kết hay Máy tìm kiếm của Lớp 4, 5.",
        customIdeaNote:
          "Câu hỏi tự luận tình huống: Cuối tuần gia đình em dự định đi dã ngoại. Em hãy nêu cách mở trình duyệt web trên máy tính để xem thông tin dự báo thời tiết giúp bố mẹ chuẩn bị trang phục phù hợp.",
      },
      "k3-cd3": {
        focusNote:
          "Tập trung đúng chương trình Tin học Lớp 3 - Chủ đề 3 (Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin): Cách phân loại và sắp xếp đồ vật để dễ tìm, đọc sơ đồ hình cây, nhận diện biểu tượng Thư mục (Folder) và thao tác tạo mới, đặt tên, mở, đóng thư mục ở Lớp 3. Tuyệt đối không hỏi lệnh Cut/Copy/Paste tệp của Lớp 4.",
        customIdeaNote:
          "Câu hỏi tự luận tình huống: Trên máy tính phòng Tin học, em muốn tạo một thư mục riêng mang tên mình (ví dụ: NguyenVanAn_Lop3A) để lưu bài học. Em hãy nêu các bước thực hiện tạo thư mục mới và đặt tên đúng quy tắc.",
      },
      "k3-cd4": {
        focusNote:
          "Tập trung đúng chương trình Tin học Lớp 3 - Chủ đề 4 (Đạo đức, pháp luật và văn hóa trong môi trường số): Nhận biết thông tin cá nhân và gia đình (họ tên, địa chỉ nhà, số điện thoại bố mẹ, mật khẩu), tác hại khi bị lộ thông tin và cách bảo vệ thông tin cá nhân khi dùng Internet. Không hỏi bản quyền phần mềm của Lớp 4.",
        customIdeaNote:
          "Câu hỏi tự luận tình huống: Khi đang xem trang web thiếu nhi, có một cửa sổ lạ hiện lên yêu cầu em nhập địa chỉ nhà riêng và số điện thoại của bố mẹ để nhận đồ chơi miễn phí. Em sẽ xử lý như thế nào để bảo vệ thông tin gia đình?",
      },
      "k3-cd5": {
        focusNote:
          "Tập trung đúng chương trình Tin học Lớp 3 - Chủ đề 5 (Ứng dụng tin học): Làm quen với phần mềm trình chiếu PowerPoint, nhận diện biểu tượng PowerPoint, tạo trang chiếu mới (New Slide), gõ chữ đơn giản, chèn ảnh minh họa (Insert -> Pictures) và nhấn F5 trình chiếu. Tuyệt đối không hỏi phần mềm Word hay gõ Telex của Lớp 4.",
        customIdeaNote:
          "Câu hỏi tự luận tình huống: Em muốn tạo một bài trình chiếu PowerPoint gồm 2 trang chiếu để giới thiệu về bản thân và loài vật em yêu thích có kèm ảnh minh họa. Em hãy nêu các bước thêm trang chiếu mới, chèn ảnh và lưu bài.",
      },
      "k3-cd6": {
        focusNote:
          "Tập trung đúng chương trình Tin học Lớp 3 - Chủ đề 6 (Giải quyết vấn đề với sự trợ giúp của máy tính): Thực hiện công việc theo từng bước tuần tự trong đời sống, chia việc lớn thành các việc nhỏ dễ thực hiện và cách nói câu điều kiện 'Nếu... thì...' trong sinh hoạt hằng ngày. Tuyệt đối không hỏi lập trình Scratch của Lớp 4, 5.",
        customIdeaNote:
          "Câu hỏi tự luận tình huống: Em hãy nêu thứ tự từng bước để thực hiện công việc 'Chuẩn bị sách vở trước khi đi học' (hoặc rửa tay sạch) và đặt một câu có cấu trúc 'Nếu... thì...' phù hợp với việc đi học hằng ngày của học sinh Lớp 3.",
      },
    };
    const picked = mapL3[topicObj.id] || mapL3["k3-cd1"];
    return {
      ...picked,
      gradeBoundarySummary:
        "Chuẩn kiến thức Khối Lớp 3 (SGK Tin học 3 Kết nối tri thức): Chỉ kiểm tra đúng bài học của Lớp 3; tuyệt đối KHÔNG lấy kiến thức Lớp 4 (Phần cứng/phần mềm, Word Telex, Cut/Copy tệp, Scratch cơ bản) hoặc Lớp 5 (Bản quyền nội dung, Đồ họa 5A/Đa phương tiện 5B, Scratch vòng lặp/biến).",
    };
  }

  if (grade === "Lớp 4") {
    const mapL4: Record<string, { focusNote: string; customIdeaNote: string }> = {
      "k4-cd1": {
        focusNote:
          "Tập trung đúng chương trình Tin học Lớp 4 - Chủ đề 1 (Máy tính và em): Phân biệt rõ Phần cứng (Hardware) và Phần mềm (Software) máy tính, lấy ví dụ cụ thể từng loại; giải thích lợi ích và quy tắc gõ bàn phím đúng cách bằng 10 ngón tay.",
        customIdeaNote:
          "Câu hỏi tự luận tình huống: Bạn Minh nói rằng 'Chỉ cần có màn hình, thân máy, bàn phím và chuột là máy tính tự soạn thảo văn bản được mà không cần cài phần mềm'. Theo em bạn Minh nói đúng hay sai? Hãy giải thích vai trò của phần cứng và phần mềm.",
      },
      "k4-cd2": {
        focusNote:
          "Tập trung đúng chương trình Tin học Lớp 4 - Chủ đề 2 (Mạng máy tính và Internet): Nhận biết các loại thông tin chính trên trang web (văn bản, hình ảnh, âm thanh, video, siêu liên kết Hyperlink) và tác hại khi truy cập trang web có nội dung xấu, không phù hợp lứa tuổi.",
        customIdeaNote:
          "Câu hỏi tự luận tình huống: Khi đang đọc bài báo thiếu nhi trên trang web, em thấy con trỏ chuột biến thành hình bàn tay khi di chuyển vào một dòng chữ màu xanh; đồng thời góc màn hình hiện một quảng cáo có nội dung không phù hợp với lứa tuổi. Em hãy giải thích dòng chữ đó là gì và cách xử lý với quảng cáo xấu.",
      },
      "k4-cd3": {
        focusNote:
          "Tập trung đúng chương trình Tin học Lớp 4 - Chủ đề 3 (Lưu trữ, tìm kiếm, trao đổi thông tin): Sử dụng máy tìm kiếm thông tin trên Internet bằng từ khóa; các thao tác Sao chép (Copy), Di chuyển (Cut -> Paste), Đổi tên (Rename), Xóa (Delete) thư mục và tệp tin an toàn.",
        customIdeaNote:
          "Câu hỏi tự luận tình huống: Trong giờ thực hành Lớp 4, bạn An lưu nhầm tệp bài làm ra ngoài màn hình nền Desktop thay vì lưu vào thư mục cá nhân của mình trong ổ đĩa D:. Em hãy hướng dẫn bạn An các bước xử lý để di chuyển tệp về đúng thư mục cá nhân.",
      },
      "k4-cd4": {
        focusNote:
          "Tập trung đúng chương trình Tin học Lớp 4 - Chủ đề 4 (Đạo đức, pháp luật và văn hóa trong môi trường số): Phân biệt phần mềm miễn phí và phần mềm không miễn phí (có bản quyền); giải thích vì sao chỉ được sử dụng phần mềm khi được phép của tác giả.",
        customIdeaNote:
          "Câu hỏi tự luận tình huống: Bạn Hùng muốn tải một phần mềm trò chơi trả phí nhưng đã bị người khác bẻ khóa (crack) trên mạng về cài vào máy tính. Em hãy khuyên bạn Hùng và giải thích vì sao chúng ta chỉ nên sử dụng phần mềm miễn phí hoặc phần mềm có bản quyền hợp pháp.",
      },
      "k4-cd5": {
        focusNote:
          "Tập trung đúng chương trình Tin học Lớp 4 - Chủ đề 5 (Ứng dụng tin học): Quy tắc gõ chữ tiếng Việt có dấu (kiểu Telex/VNI), các nút lệnh định dạng phông chữ, cỡ chữ, kiểu chữ đậm (B), nghiêng (I), gạch chân (U), màu chữ, chèn ảnh trong Word và tạo hiệu ứng chuyển trang (Transition) trong PowerPoint.",
        customIdeaNote:
          "Câu hỏi tự luận tình huống: Em cần soạn thảo đoạn văn bản chủ đề 'Cảnh đẹp quê hương em' bằng tiếng Việt có dấu trên phần mềm Word, trong đó dòng tiêu đề cần in đậm, cỡ chữ 18, màu đỏ và căn giữa. Em hãy nêu quy tắc gõ dấu tiếng Việt kiểu Telex và các bước định dạng dòng tiêu đề đó.",
      },
      "k4-cd6": {
        focusNote:
          "Tập trung đúng chương trình Tin học Lớp 4 - Chủ đề 6 (Giải quyết vấn đề với sự trợ giúp của máy tính - Làm quen với Scratch): Nhận diện giao diện Scratch, các nhóm lệnh Sự kiện (Khi bấm vào lá cờ xanh), Chuyển động, Hiển thị (Nói, Đổi phông nền), Âm thanh và ghép khối lệnh tuần tự điều khiển nhân vật kể chuyện. Không hỏi vòng lặp repeat hay biến nhớ của Lớp 5.",
        customIdeaNote:
          "Câu hỏi tự luận tình huống: Trong phần mềm Scratch Lớp 4, em muốn lập trình kịch bản để khi bấm vào Lá cờ xanh, nhân vật chú Mèo tiến về phía trước 50 bước, phát âm thanh 'Meow' và nói câu 'Xin chào các bạn Lớp 4!' trong 2 giây. Em hãy nêu thứ tự các khối lệnh cần ghép.",
      },
    };
    const picked = mapL4[topicObj.id] || mapL4["k4-cd5"];
    return {
      ...picked,
      gradeBoundarySummary:
        "Chuẩn kiến thức Khối Lớp 4 (SGK Tin học 4 Kết nối tri thức): Chỉ kiểm tra đúng bài học của Lớp 4; tuyệt đối KHÔNG lấy kiến thức nâng cao của Lớp 5 (Cấu trúc lặp repeat/forever, rẽ nhánh if-then, Biến nhớ trong Scratch; Mạch phân hóa Đồ họa 5A / Đa phương tiện 5B).",
    };
  }

  // Lớp 5
  const mapL5: Record<string, { focusNote: string; customIdeaNote: string }> = {
    "k5-cd1": {
      focusNote:
        "Tập trung đúng chương trình Tin học Lớp 5 - Chủ đề 1 (Máy tính và em): Nêu các công việc máy tính giúp con người thực hiện trong học tập, giải trí, liên lạc và kể tên các sản phẩm số mà học sinh Lớp 5 có thể tự tạo ra trên máy tính.",
      customIdeaNote:
        "Câu hỏi tự luận tình huống: Nhân dịp kỷ niệm Ngày Nhà giáo Việt Nam 20/11, lớp em muốn sử dụng máy tính để tạo ra các sản phẩm số chúc mừng thầy cô. Em hãy kể tên ít nhất 3 sản phẩm số em có thể tự làm trên máy tính và nêu phần mềm tương ứng để tạo sản phẩm đó.",
    },
    "k5-cd2": {
      focusNote:
        "Tập trung đúng chương trình Tin học Lớp 5 - Chủ đề 2 (Mạng máy tính và Internet): Cách xác định từ khóa tìm kiếm chính xác trên website, đánh giá và chọn lọc thông tin phù hợp để giải quyết vấn đề và hợp tác trao đổi thông tin với bạn bè.",
      customIdeaNote:
        "Câu hỏi tự luận tình huống: Nhóm của em được giao nhiệm vụ làm bài giới thiệu về 'Di tích lịch sử của địa phương'. Em hãy nêu cách chọn từ khóa tìm kiếm trên website, cách chọn lọc thông tin đáng tin cậy và chia sẻ kết quả tìm được cho các bạn trong nhóm.",
    },
    "k5-cd3": {
      focusNote:
        "Tập trung đúng chương trình Tin học Lớp 5 - Chủ đề 3 (Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin): Cách thiết kế cấu trúc cây thư mục hợp lý, khoa học cho nhiều môn học và sử dụng công cụ Tìm kiếm (Search) trong File Explorer để tìm nhanh tệp và thư mục trên máy tính.",
      customIdeaNote:
        "Câu hỏi tự luận tình huống: Bạn Lan đã tạo tệp bài trình chiếu 'BaoVeMoiTruong.pptx' từ tuần trước nhưng hôm nay quên mất đã lưu ở thư mục nào trong ổ đĩa D:. Em hãy hướng dẫn bạn Lan cách sử dụng công cụ Tìm kiếm (Search) trên máy tính để tìm lại tệp nhanh nhất và cách tổ chức cây thư mục hợp lý để không bị quên.",
    },
    "k5-cd4": {
      focusNote:
        "Tập trung đúng chương trình Tin học Lớp 5 - Chủ đề 4 (Đạo đức, pháp luật và văn hóa trong môi trường số): Bản quyền nội dung thông tin (văn bản, hình ảnh, âm thanh, video); những việc nên làm và không nên làm để tôn trọng bản quyền tác giả và cách ghi rõ nguồn trích dẫn khi sử dụng thông tin của người khác.",
      customIdeaNote:
        "Câu hỏi tự luận tình huống: Khi thiết kế bài trình chiếu dự thi của Lớp 5, bạn Khoa tải một bức ảnh chụp danh lam thắng cảnh và một đoạn bài viết của tác giả khác trên mạng về chèn vào bài rồi ghi tên tác giả là chính mình. Em hãy nhận xét việc làm của bạn Khoa và hướng dẫn bạn cách ghi nguồn trích dẫn đúng quy định bản quyền.",
    },
    "k5-cd5": {
      focusNote: `Tập trung đúng chương trình Tin học Lớp 5 - Chủ đề 5${subLabel}: Định dạng trang văn bản nâng cao (căn lề đoạn văn, căn đều hai bên Justify, khoảng cách dòng, chèn và bố trí ảnh, sửa lỗi chính tả) và kiến thức chuyên sâu theo mạch lựa chọn 5A (Phần mềm đồ họa) hoặc 5B (Công cụ đa phương tiện).`,
      customIdeaNote:
        subtrackId === "5A-graphic"
          ? "Câu hỏi tự luận tình huống (Mạch 5A - Đồ họa Lớp 5): Em muốn sử dụng phần mềm đồ họa để vẽ biển báo 'Giữ gìn vệ sinh trường học' gồm các hình cơ bản, tô màu và ghép các chi tiết lại với nhau. Em hãy nêu các bước thực hiện để tạo ra sản phẩm đồ họa hoàn chỉnh."
          : subtrackId === "5B-multimedia"
          ? "Câu hỏi tự luận tình huống (Mạch 5B - Đa phương tiện Lớp 5): Em muốn tạo một sản phẩm đa phương tiện giới thiệu trường tiểu học của em từ các bức ảnh chụp, đoạn nhạc nền và lời thuyết minh. Em hãy nêu các bước thu thập tư liệu, sắp xếp chuỗi hình ảnh và thêm hiệu ứng chuyển cảnh."
          : "Câu hỏi tự luận tình huống (Soạn thảo nâng cao Lớp 5): Khi trình bày tờ báo tường điện tử nhiều đoạn văn trên Word, em thấy mép phải của các đoạn văn bị thò thụt không đều và hình ảnh minh họa đang bị lệch sang một bên. Em hãy nêu cách căn đều hai bên (Justify), chỉnh khoảng cách dòng và căn chỉnh bức ảnh hài hòa với văn bản.",
    },
    "k5-cd6": {
      focusNote:
        "Tập trung đúng chương trình Tin học Lớp 5 - Chủ đề 6 (Giải quyết vấn đề với sự trợ giúp của máy tính - Scratch nâng cao): Phân biệt cấu trúc tuần tự, cấu trúc lặp (Lặp lại ... lần / repeat, Liên tục / forever), cấu trúc rẽ nhánh (Nếu... thì... / if-then-else) và cách sử dụng Biến nhớ (Variables) cùng biểu thức toán học trong Scratch.",
      customIdeaNote:
        "Câu hỏi tự luận tình huống: Trong trò chơi Scratch 'Hứng táo tính điểm' của Lớp 5, mỗi khi nhân vật cái Giỏ chạm vào quả Táo thì biến 'Điểm' tăng thêm 1 đơn vị và phát âm thanh. Em hãy nêu cách tạo biến 'Điểm', sử dụng khối lệnh rẽ nhánh 'Nếu... thì...' đặt trong vòng lặp 'Liên tục' để kiểm tra điều kiện chạm và tăng điểm.",
    },
  };
  const picked = mapL5[topicObj.id] || mapL5["k5-cd5"];
  return {
    ...picked,
    gradeBoundarySummary:
      "Chuẩn kiến thức Khối Lớp 5 (SGK Tin học 5 Kết nối tri thức): Chỉ kiểm tra đúng bài học của Lớp 5 theo chủ đề đã chọn ở Bước 3; không lấy bài học sơ cấp của Lớp 3, 4 làm lạc trọng tâm.",
  };
}

export function parseMcqsFromUploadedText(
  rawText: string,
  grade: GradeLevel,
  topicCode: string
): TopicPureQuestionItem[] {
  if (!rawText || rawText.trim().length < 40) return [];
  const parsed: TopicPureQuestionItem[] = [];
  const blocks = rawText.split(/(?=(?:Câu|Question)\s*\d+\s*[:.])/i);

  for (const block of blocks) {
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;

    const qMatch = lines[0].match(/^(?:Câu|Question)\s*\d+\s*[:.]\s*(.+)/i);
    if (!qMatch) continue;

    const fullBlockText = lines.join("\n");
    const optA = fullBlockText.match(/(?:^|\n|\s)A[.:)]\s*([^\n]+?)(?=(?:\s+[B-D][.:)]|\n|$))/i);
    const optB = fullBlockText.match(/(?:^|\n|\s)B[.:)]\s*([^\n]+?)(?=(?:\s+[C-D][.:)]|\n|$))/i);
    const optC = fullBlockText.match(/(?:^|\n|\s)C[.:)]\s*([^\n]+?)(?=(?:\s+D[.:)]|\n|$))/i);
    const optD = fullBlockText.match(/(?:^|\n|\s)D[.:)]\s*([^\n]+)/i);

    if (optA && optB && optC && optD) {
      parsed.push({
        question: `[${grade} - ${topicCode}] ${qMatch[1].trim()}`,
        cognitiveLevel:
          parsed.length % 3 === 0
            ? "Nhận biết"
            : parsed.length % 3 === 1
            ? "Thông hiểu"
            : "Vận dụng",
        illustrationNote: "",
        options: [
          `A. ${optA[1].trim()}`,
          `B. ${optB[1].trim()}`,
          `C. ${optC[1].trim()}`,
          `D. ${optD[1].trim()}`,
        ],
        correctIndex: 0,
        explanation: `Đáp án chuẩn theo tài liệu Bước 4 (${grade} - ${topicCode}).`,
      });
    }
  }
  return parsed;
}

export function getGradeAndTopicPureBank(
  grade: GradeLevel,
  topicObj: KnttTopicConfigMinimal,
  focusKnowledgeNote: string,
  teacherCustomIdeaNote: string,
  referenceDocText: string,
  referenceFileName?: string | null,
  subtrackId: string = "5-common"
): {
  mcqs: TopicPureQuestionItem[];
  essays: TopicPureEssayItem[];
  practiceTask: Omit<SemesterPracticeTask, "id" | "points">;
} {
  const docTag = referenceFileName
    ? ` (Theo tài liệu Bước 4: ${referenceFileName})`
    : referenceDocText.trim()
    ? " (Theo tài liệu tải lên ở Bước 4)"
    : "";

  const defaultNotes = getDefaultStep4NotesForGradeAndTopic(grade, topicObj, subtrackId);
  const customIdeaText =
    teacherCustomIdeaNote.trim() &&
    (!teacherCustomIdeaNote.includes("Desktop thay vì thư mục cá nhân") ||
      topicObj.id === "k4-cd3")
      ? teacherCustomIdeaNote.trim()
      : defaultNotes.customIdeaNote;

  let mcqs: TopicPureQuestionItem[] = [];
  let essays: TopicPureEssayItem[] = [];
  let practiceTask: Omit<SemesterPracticeTask, "id" | "points"> = {
    title: `Thực hành ${grade} - ${topicObj.title}${docTag}`,
    cognitiveLevel: "Vận dụng",
    softwareType:
      topicObj.recommendedFileType === "sb3"
        ? "Scratch (.sb3)"
        : topicObj.recommendedFileType === "pptx"
        ? "PowerPoint (.pptx)"
        : "Word (.docx)",
    instructions: `${topicObj.practicePrompt} Thực hiện đúng theo chương trình ${grade} (${topicObj.code}) đã chọn ở Bước 1 & Bước 3.`,
    illustrationNote: `[HÌNH ẢNH MINH HỌA: Giao diện thực hành chuẩn SGK Tin học ${grade} — ${topicObj.title}]`,
    gradingRubric: `- Thực hiện đúng thao tác trọng tâm của ${grade} - ${topicObj.code} (${topicObj.title}): 50% số điểm\n- Trình bày kết quả đúng yêu cầu đề bài và hoàn thành đầy đủ các bước: 30% số điểm\n- Đặt tên tệp và lưu đúng thư mục quy định của ${grade}: 20% số điểm`,
  };

  if (grade === "Lớp 3") {
    if (topicObj.id === "k3-cd1") {
      mcqs = [
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Quan sát hình minh họa máy tính để bàn dưới đây, một bộ máy tính để bàn thông thường gồm 4 bộ phận cơ bản nào?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Bộ máy tính để bàn SGK Tin học 3 gồm 4 bộ phận được đánh số 1. Màn hình, 2. Thân máy, 3. Bàn phím, 4. Chuột]",
          options: [
            "A. Màn hình, Thân máy, Bàn phím và Chuột máy tính",
            "B. Ti vi, Tủ lạnh, Bàn phím và Chuột",
            "C. Chỉ có Màn hình và Chuột máy tính",
            "D. Máy giặt, Quạt điện và Bàn phím",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 3 (Bài 2: Khám phá máy tính), máy tính để bàn gồm 4 bộ phận cơ bản: Màn hình, Thân máy, Bàn phím và Chuột.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Hằng ngày em tiếp nhận thông tin từ thế giới xung quanh dưới 3 dạng thông tin thường gặp nào?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Trang sách (dạng chữ), bức tranh bông hoa (dạng hình ảnh) và tiếng trống trường (dạng âm thanh)]",
          options: [
            "A. Dạng chữ, dạng hình ảnh và dạng âm thanh",
            "B. Chỉ có duy nhất dạng âm thanh",
            "C. Chỉ có dạng bàn phím và chuột",
            "D. Không có dạng hình ảnh",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 3 (Bài 1: Thông tin và quyết định), ba dạng thông tin thường gặp là dạng chữ, dạng hình ảnh và dạng âm thanh.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Khi đi bộ đến ngã tư đường phố, em nhìn thấy đèn tín hiệu giao thông dành cho người đi bộ bật màu đỏ nên em dừng lại. Trong tình huống này, đâu là "Thông tin" và đâu là "Quyết định"?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Thông tin là 'Đèn tín hiệu màu đỏ'; Quyết định là 'Dừng lại không sang đường'",
            "B. Thông tin là 'Dừng lại'; Quyết định là 'Đèn màu đỏ'",
            "C. Cả hai đều là bộ phận của máy tính",
            "D. Không có thông tin nào trong tình huống này",
          ],
          correctIndex: 0,
          explanation:
            "Hình ảnh đèn tín hiệu màu đỏ là thông tin em nhận được bằng mắt, từ đó em đưa ra quyết định dừng lại để đảm bảo an toàn.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Trên khu vực chính của bàn phím máy tính (SGK Tin học 3), hai phím có gai ở hàng phím cơ sở dùng để đặt hai ngón tay trỏ là hai phím nào?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Hàng phím cơ sở A S D F G H J K L ; trên bàn phím với hai phím F và J có gai nổi rõ]",
          options: [
            "A. Phím F (ngón trỏ tay trái) và phím J (ngón trỏ tay phải)",
            "B. Phím A và phím L",
            "C. Phím Q và phím P ở hàng phím trên",
            "D. Phím Z và phím M ở hàng phím dưới",
          ],
          correctIndex: 0,
          explanation:
            "Trên hàng phím cơ sở, hai phím F và J có gai nhỏ giúp em nhận biết vị trí đặt hai ngón tay trỏ.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Khi ngồi học với máy tính, tư thế ngồi và khoảng cách từ mắt đến màn hình như thế nào là đúng để bảo vệ sức khỏe của học sinh Lớp 3?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Học sinh Lớp 3 ngồi thẳng lưng trước máy tính, mắt cách màn hình từ 50 cm đến 80 cm]",
          options: [
            "A. Ngồi thẳng lưng, vai thả lỏng, mắt hướng ngang tầm màn hình và cách màn hình từ 50 cm đến 80 cm",
            "B. Cúi sát mắt cách màn hình 10 cm",
            "C. Nằm dài lên bàn phím khi học",
            "D. Ngồi vẹo lưng sang một bên",
          ],
          correctIndex: 0,
          explanation:
            "Ngồi thẳng lưng và giữ khoảng cách từ mắt đến màn hình 50 cm - 80 cm giúp phòng tránh cận thị và cong vẹo cột sống.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Để tắt máy tính đúng cách sau khi học xong và đảm bảo an toàn về điện, em thực hiện thao tác nào?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Nút Start -> Power -> Shut down trên màn hình Windows]",
          options: [
            "A. Đóng các phần mềm đang mở rồi chọn Start -> Power -> Shut down (tuyệt đối không tự ý rút phích cắm điện bằng tay ướt)",
            "B. Cầm dây điện giật mạnh ra khỏi ổ cắm khi máy đang chạy",
            "C. Dùng vật kim loại chọc vào ổ cắm điện",
            "D. Đập mạnh vào màn hình để tắt máy",
          ],
          correctIndex: 0,
          explanation:
            "Tắt máy tính bằng lệnh Shut down giúp bảo vệ máy tính, và không chạm vào ổ điện giúp phòng tránh tai nạn điện giật.",
        },
      ];
      essays = [
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Em hãy kể tên 4 bộ phận cơ bản của máy tính để bàn và nêu chức năng của từng bộ phận đó?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "4 bộ phận cơ bản của máy tính để bàn là: 1. Màn hình (hiển thị kết quả làm việc của máy tính); 2. Thân máy (chứa bộ xử lý thông tin, điều khiển máy tính); 3. Bàn phím (dùng để gõ chữ, số đưa thông tin vào máy); 4. Chuột (giúp điều khiển máy tính nhanh chóng, thuận tiện).",
          gradingGuide:
            "Kể đúng tên 4 bộ phận (50% điểm); nêu đúng chức năng cơ bản của từng bộ phận (50% điểm).",
          semanticKeywords: [
            "màn hình thân máy bàn phím chuột",
            "hiển thị kết quả",
            "xử lý thông tin điều khiển",
            "gõ chữ nhập thông tin",
          ],
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Em khuyên bạn Nam cần ngồi thẳng lưng, giữ khoảng cách từ mắt đến màn hình từ 50 cm đến 80 cm để bảo vệ mắt. Khi gõ phím, bạn cần đặt nhẹ hai bàn tay lên hàng phím cơ sở: ngón trỏ tay trái đặt lên phím có gai F, ngón trỏ tay phải đặt lên phím có gai J, các ngón còn lại đặt đúng các phím A S D và K L ;.",
          gradingGuide:
            "Nêu đúng tư thế ngồi và khoảng cách 50-80cm (50% điểm); nêu đúng cách đặt tay lên hàng phím cơ sở F và J (50% điểm).",
          semanticKeywords: [
            "ngồi thẳng lưng cách 50 đến 80 cm",
            "bảo vệ mắt và cột sống",
            "hàng phím cơ sở",
            "phím có gai F và J",
          ],
        },
      ];
    } else if (topicObj.id === "k3-cd2") {
      mcqs = [
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Quan sát các biểu tượng dưới đây, đâu là biểu tượng của phần mềm Trình duyệt web giúp học sinh Lớp 3 xem thông tin trên Internet?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Biểu tượng trình duyệt web Google Chrome, Microsoft Edge và Cốc Cốc trên màn hình nền]",
          options: [
            "A. Google Chrome, Microsoft Edge hoặc Cốc Cốc",
            "B. Thùng rác Recycle Bin",
            "C. Nút tắt nguồn Shut down",
            "D. Bàn phím máy tính",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 3 (Bài 5: Thông tin trên trang web), Google Chrome, Microsoft Edge, Cốc Cốc là các trình duyệt web giúp truy cập trang web.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Để mở phần mềm trình duyệt web có biểu tượng trên màn hình nền (Desktop), em thực hiện thao tác chuột nào?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Con trỏ chuột nháy đúp vào biểu tượng trình duyệt Google Chrome trên màn hình nền]",
          options: [
            "A. Nháy đúp chuột (nháy nhanh 2 lần nút trái chuột) vào biểu tượng trình duyệt web",
            "B. Nhấn nút tắt màn hình máy tính",
            "C. Rút dây chuột ra khỏi thân máy",
            "D. Kéo biểu tượng trình duyệt bỏ vào thùng rác",
          ],
          correctIndex: 0,
          explanation:
            "Nháy đúp chuột vào biểu tượng trình duyệt web trên màn hình nền để khởi động trình duyệt.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Trên các trang web dành cho thiếu nhi và học tập, em có thể xem được những thông tin bổ ích nào?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Xem tin tức thiếu nhi, bài học trực tuyến, dự báo thời tiết, nghe bài hát và xem truyện cổ tích",
            "B. Không thể xem được hình ảnh hay nghe âm thanh",
            "C. Chỉ xem được bàn phím máy tính",
            "D. Không có thông tin dự báo thời tiết",
          ],
          correctIndex: 0,
          explanation:
            "Trên Internet có nhiều trang web bổ ích giúp em đọc tin tức thiếu nhi, xem dự báo thời tiết, học tập và giải trí lành mạnh.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Khi xem trang web dự báo thời tiết thấy thông báo "Ngày mai trời mưa to và lạnh", thông tin trên Internet đó giúp em đưa ra quyết định gì?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Trang web dự báo thời tiết hiển thị đám mây mưa và nhiệt độ 18°C]",
          options: [
            "A. Chuẩn bị sẵn áo mưa, ô (dù) và mặc áo ấm khi đi học vào ngày mai",
            "B. Không mang áo mưa và mặc quần áo mùa hè",
            "C. Xóa trình duyệt web khỏi máy tính",
            "D. Tắt đèn trong phòng học",
          ],
          correctIndex: 0,
          explanation:
            "Thông tin dự báo thời tiết trên Internet giúp em và gia đình chủ động chuẩn bị trang phục, áo mưa phù hợp.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Sau khi xem xong tin tức hoặc dự báo thời tiết trên trang web, muốn đóng cửa sổ trình duyệt web lại, em nháy chuột vào nút nào ở góc trên bên phải cửa sổ?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Ba nút điều khiển cửa sổ ở góc trên bên phải trình duyệt với nút Close (dấu X) được khoanh đỏ]",
          options: [
            "A. Nút Close (có dấu nhân X ở góc trên bên phải cửa sổ)",
            "B. Phím Space (phím cách dài nhất)",
            "C. Phím Caps Lock",
            "D. Nút tăng âm lượng loa",
          ],
          correctIndex: 0,
          explanation:
            "Nháy chuột vào nút Close (dấu X) ở góc trên bên phải để đóng cửa sổ trình duyệt web.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Khi học sinh Lớp 3 truy cập Internet để xem tin tức và giải trí, việc làm nào dưới đây là ĐÚNG?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Chỉ xem các trang web học tập, giải trí lành mạnh phù hợp lứa tuổi dưới sự hướng dẫn của thầy giáo hoặc bố mẹ",
            "B. Tự ý bấm vào mọi trang web lạ không rõ nguồn gốc",
            "C. Ngồi xem Internet liên tục suốt đêm không nghỉ",
            "D. Tự ý tải các chương trình lạ về máy tính",
          ],
          correctIndex: 0,
          explanation:
            "Học sinh Lớp 3 cần xem các trang web phù hợp lứa tuổi với sự đồng hành, hướng dẫn của bố mẹ và thầy cô.",
        },
      ];
      essays = [
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Em hãy kể tên 2 trình duyệt web mà em biết và cho biết em có thể xem được những thông tin bổ ích gì trên trang web?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Hai trình duyệt web thông dụng là Google Chrome và Microsoft Edge (hoặc Cốc Cốc). Trên trang web, em có thể xem dự báo thời tiết, đọc báo thiếu nhi, học bài trực tuyến, xem tranh ảnh và nghe nhạc thiếu nhi bổ ích.",
          gradingGuide:
            "Kể đúng tên trình duyệt web (50% điểm); nêu đúng các thông tin bổ ích xem được trên trang web (50% điểm).",
          semanticKeywords: [
            "Google Chrome Microsoft Edge Cốc Cốc",
            "xem dự báo thời tiết",
            "đọc tin tức thiếu nhi học tập giải trí",
          ],
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Em nháy đúp chuột vào biểu tượng trình duyệt web (như Google Chrome) trên màn hình nền, mở trang web dự báo thời tiết để xem ngày cuối tuần trời nắng hay mưa, nhiệt độ bao nhiêu, rồi báo cho bố mẹ chuẩn bị mũ nón hoặc áo mưa phù hợp.",
          gradingGuide:
            "Nêu đúng thao tác mở trình duyệt web (50% điểm); nêu đúng cách xem dự báo thời tiết để chuẩn bị đồ dùng (50% điểm).",
          semanticKeywords: [
            "nháy đúp chuột mở trình duyệt web",
            "xem dự báo thời tiết",
            "chuẩn bị trang phục áo mưa phù hợp",
          ],
        },
      ];
    } else if (topicObj.id === "k3-cd3") {
      mcqs = [
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Vì sao em nên phân loại và sắp xếp sách vở, đồ dùng học tập gọn gàng vào từng ngăn cặp hoặc giá sách?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Giá sách học sinh Lớp 3 được phân thành ngăn Sách giáo khoa, ngăn Vở ghi và ngăn Truyện thiếu nhi]",
          options: [
            "A. Để góc học tập ngăn nắp và giúp em tìm thấy đồ vật, sách vở nhanh chóng khi cần",
            "B. Để làm mất nhiều thời gian tìm kiếm hơn",
            "C. Để sách vở bị lẫn lộn vào nhau",
            "D. Không có tác dụng gì",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 3 (Bài 6: Sắp xếp để dễ tìm), việc phân loại và sắp xếp hợp lý giúp tìm kiếm đồ vật nhanh và dễ dàng hơn.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Cách trình bày các mục thông tin đã được phân loại thành các nhánh từ mục lớn đến các mục nhỏ hơn như hình dưới đây được gọi là gì?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Sơ đồ hình cây 'Tủ sách của em' gồm 2 nhánh con: 'Sách giáo khoa' (Toán, Tiếng Việt, Tin học) và 'Truyện đọc']",
          options: [
            "A. Sơ đồ hình cây",
            "B. Bàn phím máy tính",
            "C. Trình duyệt web",
            "D. Loa máy tính",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 3 (Bài 7: Sơ đồ hình cây), sơ đồ hình cây giúp biểu diễn trực quan cách phân loại thông tin thành các nhánh.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Trên màn hình máy tính, biểu tượng hình chiếc cặp giấy màu vàng dùng để lưu trữ tài liệu ngăn nắp được gọi là gì?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Biểu tượng Thư mục (Folder) màu vàng trong máy tính]",
          options: [
            "A. Thư mục (Folder)",
            "B. Con trỏ chuột",
            "C. Nút tắt máy tính",
            "D. Màn hình nền",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 3 (Bài 8: Làm quen với thư mục), biểu tượng chiếc cặp màu vàng là Thư mục (Folder).",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Quan sát sơ đồ cây thư mục của khối Lớp 3 dưới đây, thư mục "Lop3A" chứa hai thư mục "To1" và "To2" bên trong. Vậy "To1" và "To2" được gọi là gì của thư mục "Lop3A"?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Sơ đồ cây thư mục Lớp 3 gồm thư mục Lop3A chứa các thư mục To1, To2, To3 bên trong]",
          options: [
            "A. Là các thư mục con của thư mục Lop3A",
            "B. Là màn hình máy tính",
            "C. Là trình duyệt Internet",
            "D. Là bàn phím máy tính",
          ],
          correctIndex: 0,
          explanation:
            "Thư mục nằm bên trong một thư mục khác được gọi là thư mục con.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Để tạo một thư mục mới lưu bài học của em trên máy tính, em nháy chuột chọn nút lệnh nào trên dải lệnh Home (hoặc trong bảng chọn chuột phải)?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Nút lệnh New folder trên thanh công cụ cửa sổ quản lý thư mục]",
          options: [
            "A. Chọn New folder (hoặc nháy phải chuột chọn New -> Folder), gõ tên thư mục rồi nhấn Enter",
            "B. Nhấn nút tắt nguồn màn hình",
            "C. Nháy chuột vào nút Close (X)",
            "D. Nhấn phím Caps Lock",
          ],
          correctIndex: 0,
          explanation: "Nút lệnh New folder dùng để tạo thư mục mới trên máy tính.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Muốn mở một thư mục để xem các thư mục con bên trong, em thực hiện thao tác nào?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Nháy đúp chuột vào biểu tượng thư mục cần mở (hoặc chọn thư mục rồi nhấn phím Enter)",
            "B. Nhấn phím Delete để xóa thư mục",
            "C. Tắt máy tính",
            "D. Kéo thư mục vào thùng rác",
          ],
          correctIndex: 0,
          explanation:
            "Nháy đúp chuột vào thư mục là thao tác nhanh nhất để mở thư mục đó.",
        },
      ];
      essays = [
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Vì sao việc sắp xếp đồ vật theo phân loại và biểu diễn bằng sơ đồ hình cây lại giúp chúng ta tìm kiếm nhanh hơn?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Khi đồ vật và thông tin được phân loại theo từng nhóm rõ ràng trên sơ đồ hình cây, em chỉ cần nhìn vào nhánh lớn tương ứng rồi tìm đến nhánh con nên tìm thấy ngay mà không phải lục tìm tất cả mọi thứ.",
          gradingGuide:
            "Giải thích đúng ý nghĩa phân loại theo nhóm/nhánh (50% điểm); nêu đúng lợi ích tìm kiếm nhanh và ngăn nắp (50% điểm).",
          semanticKeywords: [
            "phân loại sắp xếp theo nhóm",
            "sơ đồ hình cây rõ ràng",
            "tìm kiếm nhanh chóng dễ dàng",
          ],
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Bước 1: Mở ổ đĩa D: (hoặc thư mục Lớp 3A). Bước 2: Nháy chuột vào nút lệnh New folder (hoặc nháy phải chuột chọn New -> Folder). Bước 3: Gõ tên thư mục không dấu theo quy tắc (ví dụ: NguyenVanAn_Lop3A) rồi nhấn phím Enter.",
          gradingGuide:
            "Nêu đúng thao tác chọn New folder (50% điểm); nêu đúng bước gõ tên thư mục và nhấn Enter (50% điểm).",
          semanticKeywords: [
            "chọn New folder tạo thư mục mới",
            "gõ tên thư mục không dấu",
            "nhấn phím Enter",
          ],
        },
      ];
    } else if (topicObj.id === "k3-cd4") {
      mcqs = [
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Những thông tin nào dưới đây là thông tin cá nhân và gia đình của học sinh Lớp 3 cần được bảo vệ?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Biểu tượng chiếc khiên bảo vệ thông tin: Họ tên, Ngày sinh, Địa chỉ nhà, Số điện thoại bố mẹ]",
          options: [
            "A. Họ và tên, ngày sinh, địa chỉ nhà riêng, số điện thoại của bố mẹ và mật khẩu tài khoản",
            "B. Tên các bộ phận của máy tính để bàn",
            "C. Dự báo thời tiết trên đài truyền hình",
            "D. Tên các phím trên hàng phím cơ sở",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 3 (Bài 9), họ tên, ngày sinh, địa chỉ nhà, số điện thoại gia đình và mật khẩu là thông tin cá nhân và gia đình cần bảo vệ.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Điều gì có thể xảy ra nếu kẻ xấu biết được thông tin cá nhân của em và số điện thoại, địa chỉ nhà của bố mẹ?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Kẻ xấu có thể nhắn tin làm phiền, giả mạo người quen để lừa đảo hoặc gây mất an toàn cho em và gia đình",
            "B. Máy tính của em sẽ chạy nhanh hơn",
            "C. Giúp em gõ bàn phím nhanh hơn",
            "D. Không có bất kỳ tác hại nào",
          ],
          correctIndex: 0,
          explanation:
            "Khi lộ thông tin cá nhân và gia đình, kẻ xấu có thể lợi dụng để quấy rối, lừa đảo hoặc mạo danh.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Khi sử dụng máy tính có kết nối Internet, em NÊN làm điều gì để bảo vệ thông tin cá nhân của mình?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Giữ bí mật mật khẩu và không tự ý đăng thông tin cá nhân, số điện thoại của bố mẹ lên mạng",
            "B. Cho tất cả người lạ trên mạng biết địa chỉ nhà và giờ bố mẹ đi vắng",
            "C. Viết mật khẩu tài khoản dán lên màn hình máy tính công cộng",
            "D. Bấm vào mọi đường dẫn lạ gửi qua tin nhắn",
          ],
          correctIndex: 0,
          explanation:
            "Giữ bí mật thông tin cá nhân và không chia sẻ cho người lạ giúp em và gia đình an toàn trên môi trường mạng.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Nếu đang học trên máy tính mà gặp một thông báo lạ hoặc có người lạ trên mạng nhắn tin hỏi thông tin gia đình, học sinh Lớp 3 cần làm gì ngay?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Không trả lời người lạ và báo ngay cho bố mẹ hoặc thầy cô giáo để được giúp đỡ",
            "B. Tự ý cung cấp hết họ tên, địa chỉ nhà cho người lạ",
            "C. Giấu bố mẹ và làm theo lời người lạ trên mạng",
            "D. Gửi ảnh thẻ ngân hàng của bố mẹ cho người lạ",
          ],
          correctIndex: 0,
          explanation:
            "Học sinh Lớp 3 cần báo ngay cho người lớn đáng tin cậy (bố mẹ, thầy cô) khi gặp tình huống bất thường trên mạng.",
        },
      ];
      essays = [
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Em hãy kể tên 3 thông tin cá nhân/gia đình cần giữ bí mật và cho biết vì sao cần bảo vệ những thông tin đó?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Ba thông tin cần giữ bí mật là: Địa chỉ nhà riêng, số điện thoại của bố mẹ và mật khẩu tài khoản học tập. Cần bảo vệ vì nếu kẻ xấu biết được có thể làm phiền, lừa đảo hoặc gây nguy hiểm cho em và gia đình.",
          gradingGuide:
            "Kể đúng ít nhất 3 thông tin cá nhân/gia đình (50% điểm); giải thích đúng lý do bảo vệ an toàn (50% điểm).",
          semanticKeywords: [
            "địa chỉ nhà số điện thoại bố mẹ mật khẩu",
            "thông tin cá nhân gia đình",
            "tránh bị kẻ xấu lừa đảo làm phiền",
          ],
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Em tuyệt đối không nhập địa chỉ nhà và số điện thoại của bố mẹ vào cửa sổ lạ đó, đóng ngay trang web lại và gọi bố mẹ hoặc thầy cô giáo để báo lại sự việc.",
          gradingGuide:
            "Khẳng định không nhập thông tin gia đình (50% điểm); nêu đúng hành động đóng cửa sổ và báo cho bố mẹ/thầy cô (50% điểm).",
          semanticKeywords: [
            "không nhập địa chỉ số điện thoại",
            "đóng cửa sổ trang web lạ",
            "báo ngay cho bố mẹ thầy cô",
          ],
        },
      ];
    } else if (topicObj.id === "k3-cd5") {
      mcqs = [
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Quan sát biểu tượng dưới đây, đâu là biểu tượng của phần mềm trình chiếu Microsoft PowerPoint mà học sinh Lớp 3 được học?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Biểu tượng phần mềm trình chiếu Microsoft PowerPoint hình tròn màu cam đỏ có chữ P]",
          options: [
            "A. Biểu tượng màu cam đỏ có chữ P (Microsoft PowerPoint)",
            "B. Biểu tượng thùng rác Recycle Bin",
            "C. Biểu tượng trình duyệt web Google Chrome",
            "D. Biểu tượng thư mục màu vàng Folder",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 3 (Bài 10: Trang trình chiếu của em), biểu tượng chữ P màu cam đỏ là phần mềm trình chiếu PowerPoint.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Trong phần mềm trình chiếu PowerPoint, để thêm một trang chiếu mới (Slide mới) vào bài trình chiếu, em nháy chuột chọn nút lệnh nào?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Dải lệnh Home trong PowerPoint với nút lệnh New Slide được khoanh tròn đỏ]",
          options: [
            "A. Nút lệnh New Slide trên dải lệnh Home",
            "B. Nút đóng cửa sổ Close (X)",
            "C. Phím xóa Delete",
            "D. Nút tắt máy tính Shut down",
          ],
          correctIndex: 0,
          explanation:
            "Nháy chuột vào nút lệnh New Slide để tạo thêm một trang chiếu mới.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Để chèn một bức ảnh có sẵn trong máy tính vào trang trình chiếu giới thiệu loài vật em yêu thích (SGK Tin học 3 Bài 11), em thực hiện theo thứ tự nào?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Thẻ Insert -> nút Pictures trong phần mềm trình chiếu PowerPoint]",
          options: [
            "A. Chọn thẻ Insert -> chọn Pictures -> chọn tệp ảnh trong máy tính -> nháy nút Insert",
            "B. Chọn thẻ File -> Close",
            "C. Nhấn phím Esc trên bàn phím",
            "D. Nháy chuột vào thùng rác",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 3 (Bài 11: Bài trình chiếu của em), chọn Insert -> Pictures để thêm hình ảnh minh họa vào trang chiếu.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Khi muốn bật chế độ trình chiếu toàn màn hình để giới thiệu bài trình chiếu của em trước lớp, em nhấn phím nào trên bàn phím?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Phím F5 trên bàn phím và biểu tượng chiếc cốc Slide Show ở góc dưới cửa sổ PowerPoint]",
          options: [
            "A. Nhấn phím F5 (hoặc nháy vào biểu tượng Slide Show)",
            "B. Nhấn phím cách Space để xóa bài",
            "C. Nhấn nút nguồn tắt màn hình",
            "D. Nhấn phím Caps Lock",
          ],
          correctIndex: 0,
          explanation:
            "Phím F5 hoặc nút Slide Show giúp hiển thị trang chiếu toàn màn hình; nhấn phím Esc để thoát chế độ trình chiếu.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Để lưu bài trình chiếu vừa tạo vào thư mục của em trên máy tính, em chọn lệnh nào?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Chọn File -> Save (hoặc nháy biểu tượng đĩa mềm Save), chọn thư mục lưu, đặt tên tệp rồi nháy Save",
            "B. Nháy nút Don't Save khi đóng phần mềm",
            "C. Rút dây điện máy tính",
            "D. Xóa hết các trang chiếu",
          ],
          correctIndex: 0,
          explanation:
            "Chọn File -> Save giúp lưu lại bài trình chiếu trên máy tính để lần sau có thể mở lại.",
        },
      ];
      essays = [
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Em hãy nêu các bước cơ bản để chèn một bức ảnh có sẵn trong máy tính vào trang trình chiếu PowerPoint và bật trình chiếu toàn màn hình?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Bước 1: Trên trang chiếu, chọn thẻ Insert rồi nháy nút Pictures. Bước 2: Chọn bức ảnh trong thư mục máy tính rồi nháy nút Insert để đưa ảnh vào trang chiếu. Bước 3: Nhấn phím F5 (hoặc nút Slide Show) để trình chiếu toàn màn hình.",
          gradingGuide:
            "Nêu đúng các bước Insert -> Pictures chèn ảnh (60% điểm); nêu đúng cách nhấn F5 / Slide Show để trình chiếu (40% điểm).",
          semanticKeywords: [
            "Insert Pictures chèn ảnh",
            "chọn ảnh trong máy tính",
            "nhấn phím F5 hoặc Slide Show",
          ],
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Bước 1: Mở PowerPoint, gõ tên của em vào trang tiêu đề. Bước 2: Nháy nút New Slide để thêm trang chiếu thứ 2, gõ tên loài vật em yêu thích và chọn Insert -> Pictures để chèn ảnh minh họa. Bước 3: Chọn File -> Save, đặt tên tệp và lưu vào thư mục của em.",
          gradingGuide:
            "Nêu đúng bước tạo trang chiếu mới New Slide và nhập nội dung (40% điểm); chèn ảnh Insert -> Pictures (30% điểm); lưu tệp File -> Save (30% điểm).",
          semanticKeywords: [
            "New Slide thêm trang chiếu",
            "Insert Pictures chèn ảnh",
            "File Save lưu bài trình chiếu",
          ],
        },
      ];
    } else {
      // k3-cd6: Giải quyết vấn đề với sự trợ giúp của máy tính (Lớp 3)
      mcqs = [
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Khi thực hiện một công việc như "Đánh răng buổi sáng" hoặc "Rửa tay bằng xà phòng", vì sao em cần thực hiện lần lượt theo đúng thứ tự từng bước?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Sơ đồ 4 bước đánh răng đúng cách theo thứ tự Bước 1 -> Bước 2 -> Bước 3 -> Bước 4 trong SGK Tin học 3]",
          options: [
            "A. Để công việc thực hiện suôn sẻ, không bỏ sót việc và đạt kết quả đúng như mong muốn",
            "B. Để không cần phải làm bước nào cả",
            "C. Làm bước cuối cùng trước rồi mới lấy bàn chải",
            "D. Thứ tự các bước không ảnh hưởng gì đến kết quả",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 3 (Bài 12: Thực hiện công việc theo từng bước), làm đúng thứ tự từng bước giúp hoàn thành tốt công việc.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Để giải quyết một công việc lớn như "Dọn dẹp góc học tập gọn gàng", cách làm nào sau đây là hợp lý nhất theo bài học Lớp 3?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Chia công việc lớn thành các việc nhỏ hơn (Xếp sách giáo khoa -> Xếp vở ghi -> Cất bút thước vào hộp -> Lau mặt bàn) và thực hiện lần lượt",
            "B. Bỏ mặc không làm vì thấy công việc nhiều",
            "C. Ném tất cả sách vở và bút thước chung vào một túi",
            "D. Chỉ lau bàn mà không xếp sách vở",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 3 (Bài 13: Chia việc lớn thành việc nhỏ để giải quyết), chia nhỏ công việc giúp dễ hiểu và dễ hoàn thành hơn.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Câu nói: "Nếu trời mưa thì em mặc áo mưa khi đến trường" thể hiện cách thực hiện công việc như thế nào?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Sơ đồ điều kiện SGK Tin học 3: Trời mưa (Điều kiện) -> Mặc áo mưa (Việc được thực hiện)]",
          options: [
            "A. Thực hiện công việc phụ thuộc vào điều kiện (theo mẫu câu 'Nếu ... thì ...')",
            "B. Thực hiện công việc không cần lý do",
            "C. Là tên của một bộ phận máy tính",
            "D. Là thao tác tắt máy tính",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 3 (Bài 14: Thực hiện công việc theo điều kiện), việc mặc áo mưa chỉ thực hiện khi điều kiện 'trời mưa' xảy ra.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Trong câu: "Nếu chiếc bút chì bị gãy ngòi thì em dùng cái gọt bút chì để gọt lại", đâu là phần ĐIỀU KIỆN?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Chiếc bút chì bị gãy ngòi",
            "B. Dùng cái gọt bút chì để gọt lại",
            "C. Mua cặp sách mới",
            "D. Mở phần mềm trình chiếu",
          ],
          correctIndex: 0,
          explanation:
            "Phần đứng sau từ 'Nếu' ('chiếc bút chì bị gãy ngòi') là điều kiện; phần đứng sau từ 'thì' là việc được thực hiện.",
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Hãy sắp xếp đúng thứ tự các bước để tạo và lưu một trang trình chiếu trên máy tính (SGK Tin học 3 Bài 15: Công việc của em và sự trợ giúp của máy tính)?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Bước 1: Nháy đúp mở phần mềm trình chiếu -> Bước 2: Gõ nội dung và chèn ảnh vào trang chiếu -> Bước 3: Lưu tệp vào thư mục",
            "B. Bước 1: Tắt máy tính -> Bước 2: Gõ nội dung -> Bước 3: Mở phần mềm",
            "C. Bước 1: Lưu tệp khi chưa mở máy -> Bước 2: Bật máy tính",
            "D. Không cần thực hiện theo bước nào",
          ],
          correctIndex: 0,
          explanation:
            "Thực hiện nhiệm vụ với sự trợ giúp của máy tính cũng cần tuân theo thứ tự từng bước: Mở phần mềm -> Tạo nội dung -> Lưu kết quả.",
        },
      ];
      essays = [
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] Em hãy chia công việc "Vẽ và tô màu bức tranh ngôi nhà của em" thành 3 bước nhỏ theo thứ tự hợp lý?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Bước 1: Vẽ khung ngôi nhà và mái nhà. Bước 2: Vẽ thêm cửa chính, cửa sổ và cây xanh xung quanh. Bước 3: Tô màu cho ngôi nhà và cảnh vật hoàn chỉnh.",
          gradingGuide:
            "Chia được công việc thành các bước nhỏ hợp lý theo đúng trình tự trước sau đạt tối đa điểm.",
          semanticKeywords: [
            "bước 1 vẽ khung ngôi nhà",
            "bước 2 vẽ cửa sổ chi tiết",
            "bước 3 tô màu hoàn chỉnh",
          ],
        },
        {
          question: `[Tin học 3 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Các bước chuẩn bị sách vở: Bước 1: Xem thời khóa biểu của ngày mai; Bước 2: Lấy đủ sách giáo khoa và vở ghi của các môn học xếp vào cặp; Bước 3: Kiểm tra hộp bút, thước kẻ. Ví dụ câu điều kiện: 'Nếu ngày mai có tiết Tin học thì em mang theo sách giáo khoa và vở Tin học 3'.",
          gradingGuide:
            "Nêu đúng các bước tuần tự chuẩn bị sách vở (50% điểm); đặt đúng 1 câu theo cấu trúc 'Nếu... thì...' (50% điểm).",
          semanticKeywords: [
            "xem thời khóa biểu",
            "xếp sách vở vào cặp",
            "nếu ... thì ...",
          ],
        },
      ];
      practiceTask = {
        title: `Thực hành Tin học 3 - ${topicObj.title}${docTag}`,
        cognitiveLevel: "Vận dụng",
        softwareType: "PowerPoint (.pptx)",
        instructions:
          "Thực hành với sự trợ giúp của máy tính (SGK Tin học 3 Chủ đề 6): Em hãy thực hiện lần lượt theo từng bước để tạo 2 trang trình chiếu mô tả các bước 'Rửa tay đúng cách' hoặc 'Chuẩn bị sách vở đi học' kèm câu điều kiện 'Nếu... thì...'.",
        illustrationNote:
          "[HÌNH ẢNH MINH HỌA: Trang chiếu trình bày 3 bước thực hiện công việc theo thứ tự của học sinh Lớp 3]",
        gradingRubric:
          "- Nêu đúng và đủ thứ tự từng bước thực hiện công việc: 50% số điểm\n- Viết đúng câu điều kiện 'Nếu... thì...' phù hợp lứa tuổi Lớp 3: 30% số điểm\n- Lưu tệp bài làm đúng tên quy định: 20% số điểm",
      };
    }
  } else if (grade === "Lớp 4") {
    if (topicObj.id === "k4-cd1") {
      mcqs = [
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Trong các thiết bị và chương trình dưới đây, nhóm nào chỉ gồm các thiết bị PHẦN CỨNG (Hardware) của máy tính?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Các thiết bị phần cứng máy tính gồm Màn hình, Thân máy (CPU, ổ cứng), Bàn phím, Chuột, Máy in]",
          options: [
            "A. Màn hình, thân máy, bàn phím, chuột, loa và máy in",
            "B. Hệ điều hành Windows, phần mềm Word và phần mềm Paint",
            "C. Trình duyệt Google Chrome và phần mềm Scratch",
            "D. Phần mềm PowerPoint và tệp văn bản",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 4 (Bài 1: Phần cứng và phần mềm), phần cứng là các thiết bị vật lý có thể nhìn thấy và chạm tay vào được.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Trong các phương án dưới đây, nhóm nào chỉ gồm các PHẦN MỀM (Software) máy tính?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Biểu tượng Windows, Microsoft Word, PowerPoint và Scratch]",
          options: [
            "A. Hệ điều hành Windows, phần mềm soạn thảo Word, phần mềm trình chiếu PowerPoint và phần mềm Scratch",
            "B. Bàn phím, chuột và dây cáp nguồn",
            "C. Màn hình máy tính và loa nghe nhạc",
            "D. Thân máy tính và ổ đĩa cứng",
          ],
          correctIndex: 0,
          explanation:
            "Phần mềm là các chương trình máy tính không chạm tay vào được, giúp điều khiển phần cứng thực hiện công việc.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Phát biểu nào sau đây nêu ĐÚNG mối quan hệ giữa phần cứng và phần mềm máy tính (SGK Tin học 4)?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Phần mềm chạy trên phần cứng; nếu chỉ có phần cứng mà không có phần mềm thì máy tính không thể hoạt động được",
            "B. Máy tính chỉ cần bàn phím và màn hình là tự hoạt động không cần phần mềm",
            "C. Phần cứng là các chương trình cài đặt bên trong phần mềm",
            "D. Phần mềm có thể hoạt động bình thường mà không cần bất kỳ thiết bị phần cứng nào",
          ],
          correctIndex: 0,
          explanation:
            "Phần cứng và phần mềm gắn bó chặt chẽ: phần cứng là nền tảng vật lý, còn phần mềm điều khiển phần cứng làm việc.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Khi luyện gõ bàn phím bằng 10 ngón tay (SGK Tin học 4 Bài 2), ngón cái của hai bàn tay được đặt ở phím nào và có nhiệm vụ gì?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Sơ đồ phân công 10 ngón tay trên bàn phím máy tính trong SGK Tin học 4]",
          options: [
            "A. Đặt ở phím Cách (Spacebar) và dùng để gõ dấu cách giữa các từ",
            "B. Đặt ở phím Enter",
            "C. Đặt ở hai phím F và J",
            "D. Không dùng ngón cái khi gõ phím",
          ],
          correctIndex: 0,
          explanation:
            "Hai ngón cái luôn đặt nhẹ trên phím Cách (Spacebar) để gõ khoảng trắng giữa các chữ.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Việc rèn luyện thói quen gõ bàn phím đúng cách bằng 10 ngón tay mang lại lợi ích gì cho học sinh Lớp 4?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Giúp gõ nhanh hơn, chính xác hơn, không phải cúi nhìn bàn phím liên tục nên đỡ mỏi mắt, mỏi cổ và tăng hiệu quả học tập",
            "B. Làm cho các phím trên bàn phím nhanh hỏng hơn",
            "C. Chỉ gõ được chữ không dấu",
            "D. Gõ chậm hơn so với việc dùng 1 ngón trỏ",
          ],
          correctIndex: 0,
          explanation:
            "Gõ 10 ngón đúng cách giúp tăng tốc độ soạn thảo, giảm lỗi sai và bảo vệ thị lực, cột sống.",
        },
      ];
      essays = [
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Em hãy phân biệt Phần cứng và Phần mềm máy tính, đồng thời nêu 3 ví dụ về phần cứng và 3 ví dụ về phần mềm?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Phần cứng là các thiết bị vật lý bên trong và bên ngoài máy tính mà em có thể nhìn thấy, chạm tay vào được (ví dụ: màn hình, bàn phím, chuột). Phần mềm là các chương trình hướng dẫn máy tính làm việc, không chạm tay vào được (ví dụ: hệ điều hành Windows, phần mềm Word, phần mềm Scratch).",
          gradingGuide:
            "Nêu đúng khái niệm phân biệt phần cứng và phần mềm (50% điểm); lấy đúng 3 ví dụ mỗi loại (50% điểm).",
          semanticKeywords: [
            "phần cứng là thiết bị chạm vào được",
            "màn hình bàn phím chuột thân máy",
            "phần mềm là chương trình máy tính",
            "Windows Word PowerPoint Scratch",
          ],
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Bạn Minh nói sai. Vì màn hình, thân máy, bàn phím, chuột chỉ là phần cứng; muốn máy tính hoạt động và soạn thảo văn bản được thì bắt buộc phải có phần mềm hệ điều hành (như Windows) và phần mềm soạn thảo văn bản (như Microsoft Word) chạy trên phần cứng đó.",
          gradingGuide:
            "Khẳng định bạn Minh nói sai (30% điểm); giải thích đúng vai trò phần mềm điều khiển phần cứng và nêu tên phần mềm soạn thảo (70% điểm).",
          semanticKeywords: [
            "bạn Minh nói sai",
            "phần mềm điều khiển phần cứng",
            "cần hệ điều hành và phần mềm soạn thảo Word",
          ],
        },
      ];
    } else if (topicObj.id === "k4-cd2") {
      mcqs = [
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Trên một trang web thông tin điện tử (SGK Tin học 4 Bài 3), thường có những loại thông tin chính nào?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Trang web giáo dục gồm tiêu đề văn bản, bức ảnh minh họa, khung phát video/âm thanh và dòng chữ siêu liên kết]",
          options: [
            "A. Văn bản, hình ảnh, âm thanh, video và siêu liên kết (Hyperlink)",
            "B. Chỉ có duy nhất văn bản chữ đen trắng",
            "C. Chỉ có thiết bị phần cứng bàn phím và chuột",
            "D. Không thể chứa video hay âm thanh",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 4 (Bài 3: Thông tin trên trang web), trang web chứa văn bản, hình ảnh, âm thanh, video và siêu liên kết.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Khi em di chuyển con trỏ chuột vào một vị trí trên trang web (dòng chữ gạch chân hoặc bức ảnh) mà con trỏ chuột chuyển thành hình bàn tay, vị trí đó được gọi là gì?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Con trỏ chuột biến thành hình bàn tay chỉ vào mục bài học trên trang web]",
          options: [
            "A. Siêu liên kết (Hyperlink) dẫn tới một trang web hoặc nội dung khác",
            "B. Lỗi hỏng chuột máy tính",
            "C. Nút tắt nguồn máy tính",
            "D. Phông chữ in đậm",
          ],
          correctIndex: 0,
          explanation:
            "Siêu liên kết (Hyperlink) là thành phần đặc biệt trên trang web giúp chuyển tiếp sang trang web khác khi nháy chuột vào.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Việc cố tình hoặc vô tình xem các trang web có nội dung bạo lực, độc hại, không phù hợp với lứa tuổi học sinh Lớp 4 sẽ gây ra tác hại gì?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Ảnh hưởng xấu đến suy nghĩ, tâm lý, sức khỏe học tập và dễ bị kẻ xấu lợi dụng hoặc nhiễm phần mềm độc hại",
            "B. Giúp học giỏi môn Tin học hơn",
            "C. Giúp máy tính chạy nhanh hơn",
            "D. Không gây ảnh hưởng gì",
          ],
          correctIndex: 0,
          explanation:
            "Nội dung xấu trên mạng gây ảnh hưởng tiêu cực đến tâm lý lứa tuổi tiểu học và tiềm ẩn nguy cơ mất an toàn thông tin.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Khi đang đọc tài liệu trên Internet mà vô tình nháy vào một siêu liên kết mở ra trang web có nội dung không phù hợp với lứa tuổi, em cần làm gì?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Đóng ngay trang web đó lại và thông báo cho bố mẹ hoặc thầy cô giáo biết",
            "B. Tiếp tục xem và chia sẻ đường dẫn đó cho các bạn trong lớp",
            "C. Tải các tệp lạ từ trang web đó về máy tính",
            "D. Nhập thông tin cá nhân vào trang web đó",
          ],
          correctIndex: 0,
          explanation:
            "Đóng ngay trang web không phù hợp và báo cho người lớn (bố mẹ, thầy cô) là cách xử lý đúng đắn và an toàn.",
        },
      ];
      essays = [
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Em hãy kể tên các loại thông tin chính trên trang web và nêu dấu hiệu nhận biết một Siêu liên kết (Hyperlink)?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Các loại thông tin chính trên trang web gồm: văn bản, hình ảnh, âm thanh, video và siêu liên kết. Dấu hiệu nhận biết siêu liên kết là khi di chuyển con trỏ chuột vào đó, con trỏ chuột sẽ biến thành hình bàn tay; khi nháy chuột vào sẽ chuyển sang trang web khác.",
          gradingGuide:
            "Kể đúng các dạng thông tin trên trang web (50% điểm); nêu đúng dấu hiệu con trỏ chuột hình bàn tay của siêu liên kết (50% điểm).",
          semanticKeywords: [
            "văn bản hình ảnh âm thanh video siêu liên kết",
            "con trỏ chuột hình bàn tay",
            "chuyển sang trang web khác",
          ],
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Dòng chữ màu xanh làm con trỏ chuột biến thành hình bàn tay chính là Siêu liên kết (Hyperlink). Đối với quảng cáo có nội dung không phù hợp lứa tuổi, em tuyệt đối không nháy chuột vào, đóng ngay trang quảng cáo đó lại và báo cho bố mẹ hoặc thầy giáo biết.",
          gradingGuide:
            "Giải thích đúng siêu liên kết (50% điểm); nêu đúng cách đóng quảng cáo xấu và báo cho người lớn (50% điểm).",
          semanticKeywords: [
            "siêu liên kết Hyperlink",
            "không nháy chuột vào quảng cáo xấu",
            "đóng trang web báo cho bố mẹ thầy giáo",
          ],
        },
      ];
    } else if (topicObj.id === "k4-cd3") {
      mcqs = [
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Để tìm kiếm thông tin và hình ảnh về "Danh lam thắng cảnh Việt Nam" trên Internet (SGK Tin học 4 Bài 4), em sử dụng công cụ nào và thực hiện ra sao?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Giao diện máy tìm kiếm Google với ô nhập từ khóa 'Danh lam thắng cảnh Việt Nam']",
          options: [
            "A. Mở trình duyệt web, truy cập máy tìm kiếm (như Google, Bing), gõ từ khóa 'Danh lam thắng cảnh Việt Nam' vào ô tìm kiếm rồi nhấn Enter",
            "B. Mở phần mềm Paint rồi gõ từ khóa",
            "C. Nháy chuột vào thùng rác Recycle Bin",
            "D. Tắt kết nối mạng Internet",
          ],
          correctIndex: 0,
          explanation:
            "Máy tìm kiếm (Google, Bing) nhận từ khóa do người dùng nhập vào để trả về danh sách các trang web và hình ảnh phù hợp.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Trong cửa sổ quản lý tệp và thư mục (File Explorer) của Lớp 4, cặp lệnh nào dùng để SAO CHÉP (tạo thêm một bản sao) tệp tin sang thư mục khác?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Bảng chọn chuột phải hiển thị lệnh Copy (Ctrl + C) và lệnh Paste (Ctrl + V)]",
          options: [
            "A. Chọn tệp -> chọn lệnh Copy (Ctrl + C) -> mở thư mục đích -> chọn lệnh Paste (Ctrl + V)",
            "B. Chọn tệp -> nhấn phím Delete",
            "C. Chọn tệp -> chọn Rename",
            "D. Nháy nút Close (X) đóng cửa sổ",
          ],
          correctIndex: 0,
          explanation:
            "Lệnh Copy kết hợp Paste giúp sao chép tệp sang vị trí mới mà vẫn giữ nguyên tệp gốc ở vị trí cũ.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Cặp lệnh nào dưới đây dùng để DI CHUYỂN một tệp hoặc thư mục từ vị trí cũ sang vị trí mới (không còn ở vị trí cũ)?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Lệnh Cut (biểu tượng cái kéo - Ctrl + X) và lệnh Paste (Ctrl + V) trên dải lệnh Home]",
          options: [
            "A. Chọn tệp/thư mục -> chọn lệnh Cut (Ctrl + X) -> mở thư mục đích -> chọn lệnh Paste (Ctrl + V)",
            "B. Chọn lệnh Copy (Ctrl + C) rồi nhấn phím Esc",
            "C. Chọn lệnh Rename (F2)",
            "D. Khởi động lại máy tính",
          ],
          correctIndex: 0,
          explanation:
            "Thao tác Cut (Ctrl + X) kết hợp Paste (Ctrl + V) giúp di chuyển tệp hoặc thư mục sang thư mục đích.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Để đổi tên một thư mục hoặc tệp tin bị đặt tên sai trên máy tính, em nháy nút phải chuột vào tệp/thư mục đó rồi chọn lệnh nào?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote: "",
          options: [
            "A. Chọn lệnh Rename, gõ tên mới đúng quy tắc rồi nhấn phím Enter",
            "B. Chọn lệnh Delete để xóa mất tệp",
            "C. Chọn lệnh Shut down",
            "D. Mở trình duyệt web",
          ],
          correctIndex: 0,
          explanation:
            "Lệnh Rename (hoặc phím F2) cho phép đổi lại tên thư mục hoặc tệp tin.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Điều gì sẽ xảy ra nếu em thực hiện nhầm thao tác Xóa (Delete) hoặc Di chuyển (Cut) đối với thư mục chứa bài tập của người khác hoặc tệp hệ thống?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Có thể làm thất lạc, mất dữ liệu học tập quan trọng hoặc làm phần mềm máy tính bị lỗi không chạy được",
            "B. Giúp máy tính tự động tạo thêm bài tập mới",
            "C. Không ảnh hưởng gì đến dữ liệu trong máy",
            "D. Làm màn hình sáng hơn",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 4 (Bài 5), thao tác nhầm với tệp/thư mục có thể gây mất dữ liệu, nên chỉ thao tác trên thư mục cá nhân của mình.",
        },
      ];
      essays = [
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Em hãy nêu sự khác nhau giữa thao tác Sao chép (Copy -> Paste) và Di chuyển (Cut -> Paste) một tệp tin sang thư mục khác?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Sao chép (Copy -> Paste) tạo thêm một bản sao của tệp ở thư mục đích và tệp gốc vẫn còn ở thư mục cũ. Còn Di chuyển (Cut -> Paste) chuyển hẳn tệp đó sang thư mục đích và tệp không còn ở thư mục cũ nữa.",
          gradingGuide:
            "Nêu đúng kết quả của Sao chép Copy -> Paste (50% điểm); nêu đúng kết quả của Di chuyển Cut -> Paste (50% điểm).",
          semanticKeywords: [
            "Copy Paste giữ nguyên tệp ở thư mục cũ",
            "Cut Paste chuyển hẳn sang thư mục mới",
            "sao chép tạo bản sao",
            "di chuyển tệp",
          ],
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Em hướng dẫn bạn An: Bước 1: Nháy nút phải chuột vào tệp lưu nhầm ngoài màn hình Desktop và chọn lệnh Cut (hoặc nhấn Ctrl + X). Bước 2: Mở ổ đĩa D: và mở đúng thư mục cá nhân của bạn An. Bước 3: Nháy nút phải chuột chọn Paste (hoặc nhấn Ctrl + V) để đưa tệp về đúng thư mục.",
          gradingGuide:
            "Nêu đúng thao tác chọn tệp ngoài Desktop và lệnh Cut / Ctrl + X (50% điểm); nêu đúng bước mở thư mục cá nhân trong ổ D: và Paste / Ctrl + V (50% điểm).",
          semanticKeywords: [
            "nháy phải chuột chọn Cut hoặc Ctrl + X",
            "mở thư mục cá nhân trong ổ D",
            "chọn Paste hoặc Ctrl + V",
          ],
        },
      ];
    } else if (topicObj.id === "k4-cd4") {
      mcqs = [
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Theo SGK Tin học 4 (Bài 6: Sử dụng phần mềm khi được phép), phần mềm máy tính được chia thành hai loại nào theo quyền sử dụng?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Sơ đồ phân loại Phần mềm miễn phí (Free Software) và Phần mềm không miễn phí / có bản quyền]",
          options: [
            "A. Phần mềm miễn phí và phần mềm không miễn phí (phải mua bản quyền hoặc được tác giả cấp phép)",
            "B. Phần mềm bàn phím và phần mềm chuột",
            "C. Phần mềm màn hình và phần mềm máy in",
            "D. Không có phần mềm nào có tác giả",
          ],
          correctIndex: 0,
          explanation:
            "Có những phần mềm tác giả cho phép mọi người dùng miễn phí, và có những phần mềm phải trả phí mua bản quyền mới được phép dùng.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Đâu là ví dụ về phần mềm MIỄN PHÍ mà học sinh Lớp 4 có thể tải về và sử dụng hợp pháp không phải trả tiền?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote: "",
          options: [
            "A. Phần mềm lập trình Scratch, trình duyệt Google Chrome, phần mềm gõ tiếng Việt UniKey",
            "B. Phần mềm trả phí bị bẻ khóa (crack) trái phép",
            "C. Phần mềm lấy trộm mật khẩu",
            "D. Sao chép lậu phần mềm thương mại",
          ],
          correctIndex: 0,
          explanation:
            "Scratch, Google Chrome, UniKey là các phần mềm miễn phí được cung cấp hợp pháp cho người dùng.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Vì sao chúng ta CHỈ NÊN sử dụng phần mềm khi được phép của tác giả hoặc nhà sản xuất?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Vì phần mềm là sản phẩm trí tuệ, công sức của người làm ra nên cần tôn trọng pháp luật, bản quyền và tránh nhiễm virus từ phần mềm lậu",
            "B. Vì dùng phần mềm lậu giúp máy tính an toàn hơn",
            "C. Vì mọi phần mềm đều tự sinh ra không ai viết",
            "D. Không cần xin phép hay mua bản quyền",
          ],
          correctIndex: 0,
          explanation:
            "Sử dụng phần mềm hợp pháp thể hiện sự tôn trọng công sức của tác giả, tuân thủ pháp luật và bảo vệ máy tính khỏi mã độc.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Hành động nào dưới đây là VI PHẠM quy định sử dụng phần mềm khi được phép?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Tự ý bẻ khóa (crack) hoặc sao chép phần mềm không miễn phí để dùng chùa khi chưa được phép",
            "B. Cài đặt và sử dụng phần mềm học tập miễn phí Scratch",
            "C. Sử dụng phần mềm có bản quyền hợp lệ do nhà trường cài đặt",
            "D. Nhờ bố mẹ mua bản quyền phần mềm học tập chính hãng",
          ],
          correctIndex: 0,
          explanation:
            "Bẻ khóa hoặc sao chép trái phép phần mềm không miễn phí là hành vi vi phạm bản quyền phần mềm.",
        },
      ];
      essays = [
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Em hãy phân biệt Phần mềm miễn phí và Phần mềm không miễn phí, đồng thời nêu lý do vì sao không nên dùng phần mềm bẻ khóa (lậu)?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Phần mềm miễn phí là phần mềm tác giả cho phép mọi người sử dụng tự do không phải trả tiền (như Scratch, UniKey). Phần mềm không miễn phí là phần mềm chỉ được dùng khi đã mua bản quyền hoặc được cấp phép. Không nên dùng phần mềm bẻ khóa vì đó là hành vi vi phạm bản quyền và dễ làm máy tính bị nhiễm virus, mất dữ liệu.",
          gradingGuide:
            "Phân biệt đúng phần mềm miễn phí và không miễn phí (50% điểm); giải thích đúng lý do tôn trọng bản quyền và phòng tránh virus (50% điểm).",
          semanticKeywords: [
            "phần mềm miễn phí không phải trả tiền",
            "phần mềm không miễn phí cần mua bản quyền",
            "tôn trọng công sức tác giả",
            "tránh nhiễm virus mã độc",
          ],
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Em sẽ khuyên bạn Hùng không nên tải và cài đặt phần mềm bẻ khóa (crack) đó. Vì sử dụng phần mềm không miễn phí khi chưa được phép là vi phạm bản quyền, không tôn trọng công sức của người tạo ra phần mềm và rất dễ làm máy tính bị nhiễm virus độc hại.",
          gradingGuide:
            "Khuyên bạn không cài phần mềm crack (40% điểm); giải thích đúng về tôn trọng bản quyền và an toàn máy tính (60% điểm).",
          semanticKeywords: [
            "khuyên bạn không tải phần mềm bẻ khóa crack",
            "vi phạm bản quyền phần mềm",
            "chỉ dùng phần mềm khi được phép",
            "tránh virus hại máy tính",
          ],
        },
      ];
    } else if (topicObj.id === "k4-cd5") {
      mcqs = [
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Khi soạn thảo văn bản tiếng Việt theo kiểu gõ Telex (SGK Tin học 4), để gõ được chữ "Quê hương", em cần gõ các phím chữ có dấu và dấu thanh như thế nào?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Bảng quy tắc gõ chữ tiếng Việt kiểu Telex trong SGK Tin học 4: ee = ê, uw = ư, ow = ơ, s = sắc, f = huyền, r = hỏi, x = ngã, j = nặng]",
          options: [
            "A. Gõ Quee (ee -> ê) và huwowng (uw -> ư, ow -> ơ)",
            "B. Nhấn các phím F1, F2, F3 trên bàn phím",
            "C. Tắt phần mềm gõ tiếng Việt UniKey",
            "D. Chỉ gõ phím Space",
          ],
          correctIndex: 0,
          explanation:
            "Theo quy tắc gõ Telex ở Lớp 4: ee được chữ ê, uw được chữ ư, ow được chữ ơ; các dấu thanh s (sắc), f (huyền), r (hỏi), x (ngã), j (nặng).",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Quan sát thanh công cụ định dạng văn bản trong phần mềm Word dưới đây, ba nút lệnh B, I, U lần lượt dùng để làm gì?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Nhóm lệnh Font trên thẻ Home của Word với 3 nút B (Bold), I (Italic), U (Underline)]",
          options: [
            "A. Nút B tạo chữ in đậm, nút I tạo chữ in nghiêng, nút U tạo chữ gạch chân",
            "B. Nút B để xóa chữ, nút I để lưu tệp, nút U để tắt máy",
            "C. Dùng để đổi tên thư mục trong ổ đĩa",
            "D. Dùng để khởi động trình duyệt web",
          ],
          correctIndex: 0,
          explanation:
            "B (Bold) là chữ đậm, I (Italic) là chữ nghiêng, U (Underline) là chữ gạch chân.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Trong phần mềm trình chiếu PowerPoint Lớp 4 (Bài 8: Tạo hiệu ứng chuyển trang chiếu), để tạo hiệu ứng chuyển động đẹp mắt khi chuyển từ trang chiếu này sang trang chiếu tiếp theo, em chọn thẻ nào?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Thẻ Transitions trong PowerPoint với các kiểu hiệu ứng chuyển trang Fade, Push, Wipe, Split]",
          options: [
            "A. Chọn thẻ Transitions trên thanh công cụ rồi chọn một kiểu hiệu ứng chuyển trang phù hợp",
            "B. Chọn thẻ File -> Exit",
            "C. Nhấn phím Delete để xóa trang chiếu",
            "D. Mở phần mềm Paint",
          ],
          correctIndex: 0,
          explanation:
            "Thẻ Transitions trong PowerPoint cung cấp các hiệu ứng chuyển trang chiếu sinh động.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Để chèn một bức ảnh cảnh đẹp quê hương có sẵn trong máy tính vào trang văn bản Word (SGK Tin học 4 Bài 11), em thực hiện thao tác nào?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Thẻ Insert -> Pictures trong phần mềm soạn thảo Microsoft Word]",
          options: [
            "A. Đặt con trỏ tại vị trí cần chèn -> chọn thẻ Insert -> chọn Pictures -> chọn tệp ảnh -> nháy Insert",
            "B. Nhấn tổ hợp phím Ctrl + A rồi nhấn Delete",
            "C. Chọn thẻ View -> Zoom",
            "D. Đóng phần mềm Word không lưu",
          ],
          correctIndex: 0,
          explanation:
            "Chọn Insert -> Pictures giúp chèn hình ảnh minh họa từ máy tính vào trang văn bản Word.",
        },
      ];
      essays = [
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Em hãy nêu quy tắc gõ 5 dấu thanh tiếng Việt (sắc, huyền, hỏi, ngã, nặng) theo kiểu Telex và cách lưu tệp văn bản Word vào máy tính?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Quy tắc gõ 5 dấu thanh kiểu Telex: phím s là dấu sắc, phím f là dấu huyền, phím r là dấu hỏi, phím x là dấu ngã, phím j là dấu nặng (gõ chữ cái trước rồi gõ dấu thanh sau). Để lưu tệp Word: chọn File -> Save (hoặc nhấn Ctrl + S), chọn thư mục lưu, đặt tên tệp rồi nháy nút Save.",
          gradingGuide:
            "Nêu đúng 5 phím dấu thanh s, f, r, x, j kiểu Telex (50% điểm); nêu đúng các bước lưu tệp File -> Save / Ctrl + S (50% điểm).",
          semanticKeywords: [
            "s sắc f huyền r hỏi x ngã j nặng",
            "kiểu gõ Telex",
            "File Save hoặc Ctrl + S lưu tệp",
          ],
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Khi gõ kiểu Telex: chữ â gõ aa, ă gõ aw, ê gõ ee, ô gõ oo, ơ gõ ow, ư gõ uw, đ gõ dd và gõ các dấu s, f, r, x, j. Để định dạng dòng tiêu đề: Bước 1: Kéo thả chuột bôi đen dòng tiêu đề 'Cảnh đẹp quê hương em'; Bước 2: Trên thẻ Home, nháy nút B (in đậm), chọn cỡ chữ 18, chọn màu chữ Đỏ (Font Color) và nháy nút Center (căn giữa).",
          gradingGuide:
            "Nêu đúng quy tắc gõ Telex tiếng Việt có dấu (40% điểm); nêu đúng bước bôi đen và chọn B, cỡ 18, màu đỏ, căn giữa (60% điểm).",
          semanticKeywords: [
            "bôi đen chọn dòng tiêu đề",
            "nút B in đậm cỡ chữ 18 màu đỏ căn giữa",
            "gõ tiếng Việt có dấu Telex",
          ],
        },
      ];
    } else {
      // k4-cd6: Làm quen với môi trường lập trình trực quan Scratch (Lớp 4)
      mcqs = [
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Quan sát màn hình phần mềm Scratch (SGK Tin học 4 Chủ đề 6), khu vực hiển thị nhân vật chú Mèo và phông nền biểu diễn hoạt động của chương trình được gọi là gì?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Giao diện phần mềm Scratch Lớp 4 với khu vực Sân khấu (Stage) có nhân vật chú Mèo ở góc phải]",
          options: [
            "A. Khu vực Sân khấu (Stage)",
            "B. Thanh công cụ định dạng phông chữ Word",
            "C. Cửa sổ trình duyệt web",
            "D. Thùng rác máy tính",
          ],
          correctIndex: 0,
          explanation:
            "Trong Scratch, khu vực Sân khấu (Stage) là nơi nhân vật di chuyển, nói lời thoại và thực hiện kịch bản.",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Trong phần mềm Scratch Lớp 4, khối lệnh "Khi bấm vào Lá cờ xanh" dùng để bắt đầu chạy chương trình nằm trong nhóm lệnh nào (có màu vàng)?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Khối lệnh 'Khi bấm vào lá cờ xanh' màu vàng thuộc nhóm Sự kiện (Events) trong Scratch]",
          options: [
            "A. Nhóm lệnh Sự kiện (Events)",
            "B. Nhóm lệnh Âm thanh (Sound)",
            "C. Nhóm lệnh Hiển thị (Looks)",
            "D. Nhóm lệnh Chuyển động (Motion)",
          ],
          correctIndex: 0,
          explanation:
            "Khối lệnh 'Khi bấm vào lá cờ xanh' thuộc nhóm lệnh Sự kiện (Events - màu vàng).",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Muốn điều khiển nhân vật chú Mèo hiển thị bóng hội thoại "Xin chào các bạn!" trong 2 giây trên sân khấu Scratch, em chọn khối lệnh thuộc nhóm lệnh nào?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Khối lệnh màu tím 'nói Xin chào! trong 2 giây' thuộc nhóm Hiển thị (Looks)]",
          options: [
            "A. Nhóm lệnh Hiển thị (Looks — màu tím) với khối lệnh 'nói ... trong ... giây'",
            "B. Nhóm lệnh Chuyển động (Motion — màu xanh dương)",
            "C. Nhóm lệnh Sự kiện (Events — màu vàng)",
            "D. Nút tắt phần mềm Scratch",
          ],
          correctIndex: 0,
          explanation:
            "Các khối lệnh 'nói ... trong ... giây', 'nghĩ ...', 'đổi phông nền thành ...' nằm trong nhóm lệnh Hiển thị (Looks - màu tím).",
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Khi em ghép các khối lệnh từ trên xuống dưới trong vùng kịch bản Scratch, chương trình máy tính sẽ thực hiện các khối lệnh đó theo thứ tự nào?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Khối lệnh 'Khi bấm vào lá cờ xanh' -> 'di chuyển 50 bước' -> 'nói Xin chào! trong 2 giây' ghép nối tiếp từ trên xuống dưới]",
          options: [
            "A. Thực hiện lần lượt từng khối lệnh theo đúng thứ tự ghép từ trên xuống dưới",
            "B. Thực hiện khối lệnh dưới cùng trước rồi mới lên trên",
            "C. Bỏ qua các khối lệnh ở giữa",
            "D. Không thực hiện khối lệnh nào",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 4 (Bài 15, 16), chương trình Scratch thực hiện tuần tự từng khối lệnh từ trên xuống dưới theo kịch bản đã ghép.",
        },
      ];
      essays = [
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] Em hãy kể tên 4 nhóm lệnh cơ bản trong Scratch mà em đã học ở Lớp 4 và nêu 1 khối lệnh tiêu biểu trong mỗi nhóm?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "4 nhóm lệnh cơ bản ở Lớp 4 là: 1. Nhóm Sự kiện (khối 'Khi bấm vào lá cờ xanh'); 2. Nhóm Chuyển động (khối 'di chuyển 10 bước', 'xoay 15 độ'); 3. Nhóm Hiển thị (khối 'nói Xin chào trong 2 giây', 'đổi phông nền'); 4. Nhóm Âm thanh (khối 'phát âm thanh Meow đến hết').",
          gradingGuide:
            "Kể đúng tên 4 nhóm lệnh Sự kiện, Chuyển động, Hiển thị, Âm thanh (50% điểm); nêu đúng ví dụ khối lệnh mỗi nhóm (50% điểm).",
          semanticKeywords: [
            "nhóm Sự kiện khi bấm vào lá cờ xanh",
            "nhóm Chuyển động di chuyển bước",
            "nhóm Hiển thị nói trong 2 giây",
            "nhóm Âm thanh phát âm thanh",
          ],
        },
        {
          question: `[Tin học 4 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Thứ tự ghép khối lệnh từ trên xuống dưới là: Bước 1: Kéo khối 'Khi bấm vào lá cờ xanh' (nhóm Sự kiện). Bước 2: Ghép khối 'di chuyển 50 bước' (nhóm Chuyển động) ngay bên dưới. Bước 3: Ghép khối 'bắt đầu âm thanh Meow' (nhóm Âm thanh). Bước 4: Ghép khối 'nói Xin chào các bạn Lớp 4! trong 2 giây' (nhóm Hiển thị).",
          gradingGuide:
            "Nêu đúng khối sự kiện Lá cờ xanh ở đầu (30% điểm); ghép đúng thứ tự khối di chuyển 50 bước, phát âm thanh và nói lời thoại (70% điểm).",
          semanticKeywords: [
            "khi bấm vào lá cờ xanh",
            "di chuyển 50 bước",
            "phát âm thanh Meow",
            "nói Xin chào các bạn Lớp 4 trong 2 giây",
          ],
        },
      ];
      practiceTask = {
        title: `Thực hành Scratch Lớp 4 - ${topicObj.title}${docTag}`,
        cognitiveLevel: "Vận dụng",
        softwareType: "Scratch (.sb3)",
        instructions:
          "Thực hành lập trình Scratch Lớp 4 (SGK Tin học 4 Chủ đề 6): Em hãy chọn phông nền sân khấu phù hợp và ghép các khối lệnh tuần tự để khi bấm vào Lá cờ xanh, nhân vật di chuyển về phía trước 50 bước, phát âm thanh và hiển thị lời thoại giới thiệu bản thân.",
        illustrationNote:
          "[HÌNH ẢNH MINH HỌA: Sân khấu Scratch Lớp 4 với nhân vật chú Mèo trên phông nền trường học và kịch bản 4 khối lệnh tuần tự]",
        gradingRubric:
          "- Chọn được phông nền sân khấu và nhân vật phù hợp, có khối lệnh 'Khi bấm vào lá cờ xanh': 40% số điểm\n- Ghép đúng thứ tự các khối lệnh Chuyển động, Âm thanh và Hiển thị lời thoại: 40% số điểm\n- Lưu tệp dự án Scratch (.sb3) đúng tên quy định của Lớp 4: 20% số điểm",
      };
    }
  } else {
    // KHỐI LỚP 5
    if (topicObj.id === "k5-cd1") {
      mcqs = [
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Theo SGK Tin học 5 (Bài 1: Máy tính giúp em làm công việc gì?), máy tính giúp con người thực hiện những nhóm công việc chính nào trong đời sống?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Sơ đồ ứng dụng máy tính trong Học tập, Giải trí, Liên lạc trao đổi thông tin và Tạo sản phẩm số]",
          options: [
            "A. Học tập, làm việc, giải trí, tìm kiếm - trao đổi thông tin và tạo ra các sản phẩm số",
            "B. Chỉ dùng để bật và tắt màn hình",
            "C. Chỉ dùng để gõ hàng phím cơ sở không làm được việc khác",
            "D. Không thể tạo ra sản phẩm số",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 5 (Bài 1), máy tính là công cụ đắc lực giúp học tập, giải trí, liên lạc và sáng tạo các sản phẩm số.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Đâu là các "Sản phẩm số" mà học sinh Lớp 5 có thể tự tạo ra với sự trợ giúp của máy tính?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Các sản phẩm số của học sinh Lớp 5: Tờ báo tường Word, Bài trình chiếu PowerPoint, Bức vẽ đồ họa và Chương trình Scratch]",
          options: [
            "A. Tài liệu văn bản, bài trình chiếu, bức tranh vẽ trên phần mềm đồ họa, video đa phương tiện và chương trình trò chơi Scratch",
            "B. Chiếc cặp sách bằng vải và quyển vở giấy",
            "C. Bàn phím và chuột máy tính",
            "D. Chiếc bàn học bằng gỗ",
          ],
          correctIndex: 0,
          explanation:
            "Sản phẩm số là các sản phẩm được tạo ra, lưu trữ dưới dạng tệp trong máy tính bằng các phần mềm ứng dụng.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Khi muốn tạo một tấm thiệp điện tử hoặc bức tranh minh họa trên máy tính để tặng cô giáo, học sinh Lớp 5 nên chọn loại phần mềm nào?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Phần mềm đồ họa hoặc phần mềm trình chiếu / soạn thảo văn bản có chèn hình ảnh",
            "B. Thùng rác Recycle Bin",
            "C. Trình quản lý tắt máy Shut down",
            "D. Máy tính bỏ túi Calculator",
          ],
          correctIndex: 0,
          explanation:
            "Phần mềm đồ họa và trình chiếu giúp thiết kế thiệp điện tử, tranh vẽ số sinh động.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] So với các sản phẩm viết hoặc vẽ trên giấy thông thường, sản phẩm số tạo ra trên máy tính có ưu điểm nổi bật gì?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Dễ dàng chỉnh sửa, lưu trữ lâu dài, sao chép nhiều bản và gửi chia sẻ nhanh chóng qua Internet",
            "B. Không bao giờ sửa lại được khi viết sai",
            "C. Không thể chèn thêm hình ảnh hay âm thanh",
            "D. Chỉ xem được một lần duy nhất",
          ],
          correctIndex: 0,
          explanation:
            "Sản phẩm số dễ chỉnh sửa, định dạng, kết hợp đa phương tiện và chia sẻ nhanh qua môi trường mạng.",
        },
      ];
      essays = [
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Em hãy nêu vai trò của máy tính trong học tập và kể tên các ưu điểm của sản phẩm số so với sản phẩm trên giấy?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Máy tính giúp em tra cứu kiến thức, luyện tập các môn học, học lập trình và tạo ra các sản phẩm số. Ưu điểm của sản phẩm số là dễ dàng chỉnh sửa khi sai, lưu trữ gọn gàng lâu dài, kết hợp được cả chữ, ảnh, âm thanh và chia sẻ nhanh qua Internet.",
          gradingGuide:
            "Nêu đúng vai trò của máy tính trong học tập (50% điểm); nêu đúng ưu điểm dễ chỉnh sửa, lưu trữ và chia sẻ của sản phẩm số (50% điểm).",
          semanticKeywords: [
            "học tập tra cứu kiến thức tạo sản phẩm số",
            "dễ dàng chỉnh sửa lưu trữ lâu dài",
            "chia sẻ nhanh qua Internet",
          ],
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Ba sản phẩm số em có thể tự tạo trên máy tính để chúc mừng thầy cô 20/11 là: 1. Tờ báo tường điện tử hoặc thư tri ân thầy cô (tạo bằng phần mềm soạn thảo Word); 2. Bài trình chiếu giới thiệu kỷ niệm lớp học (tạo bằng phần mềm PowerPoint); 3. Bức tranh hoặc thiệp chúc mừng 20/11 (tạo bằng phần mềm đồ họa / chương trình thiệp động Scratch).",
          gradingGuide:
            "Kể đúng ít nhất 3 sản phẩm số (50% điểm); nêu đúng tên phần mềm tương ứng để tạo từng sản phẩm (50% điểm).",
          semanticKeywords: [
            "báo tường văn bản bằng Word",
            "bài trình chiếu bằng PowerPoint",
            "thiệp chúc mừng tranh vẽ đồ họa hoặc Scratch",
          ],
        },
      ];
    } else if (topicObj.id === "k5-cd2") {
      mcqs = [
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Theo SGK Tin học 5 (Bài 2: Tìm kiếm thông tin trên website), ngoài việc dùng máy tìm kiếm Google, khi đang ở trong một website tin tức hoặc giáo dục, em có thể tìm nhanh nội dung cần thiết bằng cách nào?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Thanh menu chuyên mục và ô Tìm kiếm (biểu tượng kính lúp) ngay bên trong một website giáo dục]",
          options: [
            "A. Gõ từ khóa vào ô tìm kiếm (biểu tượng kính lúp) của chính website đó hoặc chọn theo các danh mục chủ đề trên website",
            "B. Tắt trình duyệt web rồi khởi động lại máy tính",
            "C. Mở phần mềm vẽ hình Paint",
            "D. Rút dây mạng Internet",
          ],
          correctIndex: 0,
          explanation:
            "Hầu hết các website đều có ô tìm kiếm nội bộ (biểu tượng kính lúp) và hệ thống danh mục giúp tìm thông tin trực tiếp trên website đó.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Khi tìm kiếm thông tin trên Internet để làm bài tập dự án Lớp 5, cách chọn từ khóa nào dưới đây giúp thu hẹp phạm vi và cho kết quả chính xác nhất?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Sử dụng từ khóa cụ thể, nêu rõ chủ đề và đối tượng cần tìm (ví dụ: 'Lịch sử Vịnh Hạ Long Quảng Ninh' thay vì chỉ gõ 'Biển')",
            "B. Chỉ gõ một chữ cái bất kỳ vào ô tìm kiếm",
            "C. Gõ một đoạn văn dài 10 dòng không rõ ý chính",
            "D. Không nhập từ khóa nào",
          ],
          correctIndex: 0,
          explanation:
            "Từ khóa càng cụ thể, sát nội dung trọng tâm thì kết quả tìm kiếm càng chính xác và tiết kiệm thời gian chọn lọc.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Sau khi tìm được nhiều trang web viết về cùng một chủ đề, học sinh Lớp 5 cần đánh giá và chọn lọc thông tin như thế nào để phục vụ giải quyết vấn đề?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Chọn thông tin từ các website chính thống, uy tín, kiểm tra xem nội dung có đúng chủ đề đang cần giải quyết hay không",
            "B. Sao chép bừa trang web đầu tiên mà không cần đọc nội dung",
            "C. Lấy thông tin từ các trang quảng cáo không rõ nguồn gốc",
            "D. Xóa hết thông tin vừa tìm được",
          ],
          correctIndex: 0,
          explanation:
            "Cần đọc hiểu, đối chiếu và chọn lọc thông tin phù hợp, đáng tin cậy từ các website uy tín để giải quyết nhiệm vụ học tập.",
        },
      ];
      essays = [
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Em hãy nêu các cách tìm kiếm thông tin trên một website và vì sao cần phải chọn lọc thông tin sau khi tìm kiếm?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Trên một website, em có thể tìm thông tin bằng cách nháy chọn các mục phân loại trên thanh danh mục hoặc gõ từ khóa vào ô tìm kiếm (hình kính lúp) của website. Cần chọn lọc thông tin vì trên mạng có rất nhiều thông tin khác nhau, chọn lọc giúp lấy được thông tin chính xác, phù hợp nhất với yêu cầu bài học.",
          gradingGuide:
            "Nêu đúng 2 cách tìm thông tin trên website (50% điểm); giải thích đúng lý do cần chọn lọc thông tin (50% điểm).",
          semanticKeywords: [
            "ô tìm kiếm kính lúp hoặc thanh danh mục website",
            "chọn lọc thông tin chính xác phù hợp",
            "website uy tín đáng tin cậy",
          ],
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Bước 1: Xác định từ khóa cụ thể (như tên di tích lịch sử + tên địa phương) để tìm trên các website văn hóa, lịch sử chính thống. Bước 2: Đọc và chọn lọc các thông tin, hình ảnh chính xác, ghi rõ nguồn trích dẫn. Bước 3: Lưu tư liệu vào thư mục dự án và trao đổi, chia sẻ với các bạn trong nhóm để cùng hoàn thành bài giới thiệu.",
          gradingGuide:
            "Nêu đúng cách xác định từ khóa cụ thể (35% điểm); cách chọn lọc thông tin từ website uy tín (35% điểm); cách lưu và hợp tác chia sẻ với nhóm (30% điểm).",
          semanticKeywords: [
            "từ khóa cụ thể chính xác",
            "chọn lọc thông tin từ website uy tín",
            "lưu tư liệu và chia sẻ hợp tác nhóm",
          ],
        },
      ];
    } else if (topicObj.id === "k5-cd3") {
      mcqs = [
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Theo SGK Tin học 5 (Bài 4: Cây thư mục và tìm kiếm tệp trên máy tính), thế nào là một cấu trúc cây thư mục hợp lý, khoa học?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Cây thư mục Lớp 5A -> Học tập -> từng môn (Tin học, Toán, Tiếng Việt) -> từng loại tệp (Soạn thảo, Trình chiếu, Scratch)]",
          options: [
            "A. Các thư mục được phân chia theo từng cấp rõ ràng (theo năm học, môn học hoặc chủ đề), tên thư mục và tệp ngắn gọn, dễ hiểu",
            "B. Lưu tất cả hàng trăm tệp của mọi môn học lộn xộn ngoài màn hình Desktop",
            "C. Đặt tên tất cả các thư mục là New Folder 1, New Folder 2, New Folder 3",
            "D. Không tạo thư mục nào trên ổ đĩa",
          ],
          correctIndex: 0,
          explanation:
            "Cây thư mục hợp lý được phân cấp khoa học theo chủ đề/môn học và đặt tên rõ nghĩa giúp lưu trữ và tra cứu hiệu quả.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Khi em nhớ tên tệp bài làm (hoặc một phần tên tệp) nhưng quên mất đã lưu tệp đó ở thư mục nào trong máy tính, công cụ nào trong cửa sổ File Explorer giúp em tìm lại tệp nhanh nhất?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Ô công cụ Search (Tìm kiếm) ở góc trên bên phải cửa sổ File Explorer trong Windows]",
          options: [
            "A. Ô công cụ Tìm kiếm (Search) ở góc trên bên phải cửa sổ File Explorer",
            "B. Nút lệnh xóa Delete",
            "C. Phần mềm vẽ hình Paint",
            "D. Nút tắt nguồn máy tính",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 5 (Bài 4), công cụ Search trong File Explorer giúp tìm nhanh tệp và thư mục theo tên.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Để việc tìm kiếm tệp bằng công cụ Search trong File Explorer diễn ra nhanh hơn và không phải quét toàn bộ máy tính, em nên làm gì trước khi gõ từ khóa vào ô Search?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Mở ổ đĩa hoặc thư mục lớn có khả năng chứa tệp đó (ví dụ ổ đĩa D: hoặc thư mục Học tập) rồi mới gõ tên tệp vào ô Search",
            "B. Đóng cửa sổ File Explorer lại",
            "C. Đổi tên ổ đĩa D:",
            "D. Xóa các thư mục đang có",
          ],
          correctIndex: 0,
          explanation:
            "Chọn phạm vi ổ đĩa hoặc thư mục mẹ trước khi tìm kiếm giúp máy tính thu hẹp phạm vi và trả kết quả nhanh hơn.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Vì sao việc đặt tên tệp đúng quy tắc (ví dụ: "ThuyetTrinh_LichSu_Lop5A.pptx") lại giúp ích rất nhiều khi sử dụng công cụ Search trên máy tính?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Vì chỉ cần gõ từ khóa liên quan đến nội dung như 'LichSu' hoặc 'Lop5A' vào ô Search là máy tính tìm ra ngay tệp cần tìm",
            "B. Vì đặt tên rõ nghĩa làm máy tính không tìm được",
            "C. Vì tên tệp không liên quan gì đến công cụ Search",
            "D. Để làm đầy bộ nhớ máy tính",
          ],
          correctIndex: 0,
          explanation:
            "Đặt tên tệp gợi nhớ đúng nội dung kết hợp cây thư mục khoa học giúp công cụ Search phát huy tối đa hiệu quả.",
        },
      ];
      essays = [
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Em hãy nêu các nguyên tắc để tạo một cấu trúc cây thư mục hợp lý trên máy tính của học sinh Lớp 5?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Để tạo cây thư mục hợp lý: 1. Phân loại tài liệu thành các thư mục theo cấp từ lớn đến nhỏ (ví dụ: Thư mục Lớp 5 -> Thư mục từng môn học -> Thư mục từng chủ đề); 2. Đặt tên thư mục và tệp tin ngắn gọn, rõ nghĩa, phản ánh đúng nội dung bên trong; 3. Lưu đúng tệp vào thư mục tương ứng.",
          gradingGuide:
            "Nêu đúng nguyên tắc phân cấp thư mục theo môn/chủ đề (50% điểm); nêu đúng quy tắc đặt tên rõ nghĩa và lưu đúng chỗ (50% điểm).",
          semanticKeywords: [
            "phân cấp thư mục theo môn học chủ đề",
            "đặt tên thư mục tệp tin ngắn gọn rõ nghĩa",
            "lưu đúng vị trí ngăn nắp",
          ],
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Em hướng dẫn bạn Lan: Bước 1: Mở cửa sổ File Explorer và chọn ổ đĩa D:. Bước 2: Nháy chuột vào ô Tìm kiếm (Search D:) ở góc trên bên phải cửa sổ. Bước 3: Gõ từ khóa 'BaoVeMoiTruong' rồi nhấn Enter, máy tính sẽ hiển thị tệp cần tìm cùng đường dẫn vị trí lưu. Để không bị quên lần sau, bạn nên tạo cây thư mục phân loại rõ theo từng môn học.",
          gradingGuide:
            "Nêu đúng các bước mở ổ D: và gõ tên tệp vào ô Search (60% điểm); nêu đúng lời khuyên tạo cây thư mục hợp lý (40% điểm).",
          semanticKeywords: [
            "mở File Explorer chọn ổ đĩa D",
            "gõ tên tệp vào ô Search tìm kiếm",
            "tạo cây thư mục phân loại khoa học",
          ],
        },
      ];
    } else if (topicObj.id === "k5-cd4") {
      mcqs = [
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Theo SGK Tin học 5 (Bài 5: Bản quyền nội dung thông tin), "Bản quyền nội dung thông tin" là quyền của ai đối với tác phẩm (bài viết, bức ảnh, bản nhạc, video)?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Biểu tượng Bản quyền © (Copyright) gắn với tác phẩm bài viết, hình ảnh, âm thanh, video]",
          options: [
            "A. Quyền của tác giả (người sáng tạo ra tác phẩm) hoặc chủ sở hữu hợp pháp đối với nội dung thông tin đó",
            "B. Quyền của bất kỳ ai nhìn thấy bức ảnh đó trên mạng",
            "C. Chỉ áp dụng cho thiết bị phần cứng máy tính",
            "D. Mọi thông tin trên Internet đều không có tác giả",
          ],
          correctIndex: 0,
          explanation:
            "Tác giả sáng tạo ra bài viết, hình ảnh, video có quyền tác giả (bản quyền) đối với nội dung thông tin đó.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Khi học sinh Lớp 5 sử dụng một đoạn văn bản hoặc bức ảnh tìm được trên Internet để đưa vào bài trình chiếu học tập của mình, việc làm nào sau đây thể hiện sự TÔN TRỌNG bản quyền nội dung thông tin?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Ghi rõ tên tác giả và nguồn trang web trích dẫn ngay dưới bức ảnh hoặc đoạn văn bản đó",
            "B. Xóa chữ ký của tác giả trên bức ảnh rồi ghi tên mình vào",
            "C. Nhận trước lớp rằng bức ảnh và bài viết đó do chính mình tự sáng tác",
            "D. Tự ý chỉnh sửa làm sai lệch nội dung bài viết của tác giả",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 5 (Bài 5), ghi rõ tên tác giả và nguồn thông tin khi trích dẫn là hành động tôn trọng bản quyền.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Hành vi nào dưới đây là VI PHẠM bản quyền nội dung thông tin trong môi trường số?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Sao chép bài viết, tranh vẽ số của người khác rồi đăng lên mạng hoặc nộp bài dưới tên của mình mà không xin phép hay ghi nguồn",
            "B. Xin phép tác giả trước khi sử dụng tác phẩm",
            "C. Ghi đầy đủ nguồn trích dẫn và tên tác giả trong bài thuyết trình",
            "D. Tự tay vẽ bức tranh hoặc tự chụp ảnh để đưa vào bài làm",
          ],
          correctIndex: 0,
          explanation:
            "Sao chép tác phẩm của người khác và mạo nhận là của mình (đạo văn/vi phạm bản quyền) là việc không được làm.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Vì sao pháp luật và văn hóa trong môi trường số yêu cầu mọi người phải tôn trọng bản quyền nội dung thông tin?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          options: [
            "A. Để bảo vệ công sức lao động sáng tạo của tác giả, khuyến khích mọi người tạo ra nhiều sản phẩm thông tin có ích và xây dựng môi trường số văn minh",
            "B. Để cấm mọi người đọc tin tức trên Internet",
            "C. Để làm cho máy tính chạy nhanh hơn",
            "D. Không có ý nghĩa gì",
          ],
          correctIndex: 0,
          explanation:
            "Tôn trọng bản quyền giúp bảo vệ quyền lợi chính đáng của người sáng tạo và xây dựng văn hóa số lành mạnh.",
        },
      ];
      essays = [
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Em hãy nêu những việc NÊN làm và KHÔNG NÊN làm để tôn trọng bản quyền nội dung thông tin (văn bản, hình ảnh, video) trên môi trường số?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Những việc NÊN làm: Xin phép tác giả khi sử dụng tác phẩm; ghi rõ tên tác giả và nguồn trích dẫn khi đưa thông tin, hình ảnh của người khác vào bài làm. Những việc KHÔNG NÊN làm: Tự ý sao chép tác phẩm của người khác rồi nhận là của mình, xóa tên tác giả hoặc chỉnh sửa xuyên tạc nội dung của tác giả.",
          gradingGuide:
            "Nêu đúng các việc nên làm (50% điểm); nêu đúng các việc không nên làm đối với bản quyền thông tin (50% điểm).",
          semanticKeywords: [
            "xin phép tác giả ghi rõ nguồn trích dẫn",
            "tôn trọng bản quyền nội dung thông tin",
            "không tự ý sao chép nhận là của mình",
          ],
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Việc bạn Khoa lấy ảnh và bài viết của người khác trên mạng rồi ghi tên mình là sai, vi phạm bản quyền nội dung thông tin. Em hướng dẫn bạn Khoa sửa lại bằng cách ghi rõ dòng chú thích ở dưới bức ảnh và đoạn văn theo mẫu: 'Nguồn ảnh/bài viết: [Tên tác giả] — Trích từ trang web [Tên website]'.",
          gradingGuide:
            "Nhận xét đúng hành vi vi phạm bản quyền của bạn Khoa (40% điểm); hướng dẫn đúng cách ghi tên tác giả và nguồn trang web trích dẫn (60% điểm).",
          semanticKeywords: [
            "vi phạm bản quyền nội dung thông tin",
            "không được nhận tác phẩm của người khác là của mình",
            "ghi rõ tên tác giả và nguồn trang web trích dẫn",
          ],
        },
      ];
    } else if (topicObj.id === "k5-cd5") {
      if (subtrackId === "5A-graphic") {
        mcqs = [
          {
            question: `[Tin học 5 - Chủ đề 5A: Sử dụng phần mềm đồ họa${docTag}] Trong phần mềm đồ họa ở Lớp 5, các công cụ hình học cơ bản (Hình chữ nhật, Hình elip/hình tròn, Đường thẳng, Đa giác) dùng để làm gì?`,
            cognitiveLevel: "Nhận biết",
            illustrationNote:
              "[HÌNH ẢNH MINH HỌA: Thanh công cụ Shapes và bảng màu trong phần mềm đồ họa Lớp 5]",
            options: [
              "A. Vẽ các nét và hình cơ bản để kết hợp tạo nên các chi tiết đồ họa hoàn chỉnh",
              "B. Dùng để tính toán bảng số liệu",
              "C. Dùng để thu âm giọng nói",
              "D. Dùng để tắt máy tính",
            ],
            correctIndex: 0,
            explanation:
              "Các công cụ hình cơ bản giúp vẽ khung và các bộ phận chi tiết của sản phẩm đồ họa.",
          },
          {
            question: `[Tin học 5 - Chủ đề 5A: Sử dụng phần mềm đồ họa${docTag}] Khi vẽ một bức tranh đồ họa có nhiều chi tiết giống nhau (như những cánh hoa, ngôi sao hoặc cửa sổ), thao tác nào giúp em tạo nhanh các chi tiết giống hệt nhau mà không phải vẽ lại từ đầu?`,
            cognitiveLevel: "Thông hiểu",
            illustrationNote: "",
            options: [
              "A. Chọn chi tiết đã vẽ rồi thực hiện lệnh Sao chép (Copy) và Dán (Paste), sau đó di chuyển và xoay/lật tới vị trí phù hợp",
              "B. Xóa chi tiết cũ đi vẽ lại từng nét",
              "C. Đóng phần mềm đồ họa",
              "D. Đổi tên tệp",
            ],
            correctIndex: 0,
            explanation:
              "Kết hợp Copy, Paste, Xoay (Rotate) và Lật hình (Flip) giúp tạo nhanh các chi tiết đối xứng, đồng đều trong thiết kế đồ họa.",
          },
          {
            question: `[Tin học 5 - Chủ đề 5A: Sử dụng phần mềm đồ họa${docTag}] Khi dùng công cụ Tô màu (Fill with color - hình chiếc xô đổ màu), nếu màu bị tràn ra ngoài toàn bộ trang vẽ thì nguyên nhân là gì và cách khắc phục ra sao?`,
            cognitiveLevel: "Vận dụng",
            illustrationNote:
              "[HÌNH ẢNH MINH HỌA: Công cụ Fill with color (chiếc xô màu) và một hình vẽ bị hở nét viền]",
            options: [
              "A. Do đường viền của hình vẽ bị hở; cần nhấn Ctrl + Z (Undo) hoàn tác rồi nối kín nét viền trước khi tô màu lại",
              "B. Do màn hình máy tính bị hỏng",
              "C. Do chưa bật loa máy tính",
              "D. Không thể khắc phục được",
            ],
            correctIndex: 0,
            explanation:
              "Công cụ tô màu chỉ tô gọn trong vùng khép kín; nếu nét vẽ bị hở màu sẽ tràn ra ngoài nên cần hoàn tác Ctrl + Z và vẽ kín nét.",
          },
          {
            question: `[Tin học 5 - Chủ đề 5A: Sử dụng phần mềm đồ họa${docTag}] Để thêm dòng khẩu hiệu hoặc tiêu đề chữ nghệ thuật vào tấm thiệp đồ họa của em, em sử dụng công cụ nào?`,
            cognitiveLevel: "Nhận biết",
            illustrationNote: "",
            options: [
              "A. Công cụ viết chữ Text (biểu tượng chữ A)",
              "B. Công cụ cục tẩy Eraser",
              "C. Công cụ kính lúp Magnifier",
              "D. Nút lệnh Shut down",
            ],
            correctIndex: 0,
            explanation:
              "Công cụ Text (chữ A) cho phép chèn khung chữ và định dạng phông chữ, màu chữ trên bức vẽ đồ họa.",
          },
        ];
        essays = [
          {
            question: `[Tin học 5 - Chủ đề 5A: Sử dụng phần mềm đồ họa${docTag}] Em hãy nêu các bước cơ bản để vẽ, tô màu và ghép các chi tiết tạo thành một sản phẩm đồ họa trên máy tính?`,
            cognitiveLevel: "Thông hiểu",
            illustrationNote: "",
            sampleAnswer:
              "Bước 1: Lên ý tưởng bố cục sản phẩm đồ họa. Bước 2: Dùng các công cụ vẽ hình cơ bản, đường cong và cọ vẽ để vẽ từng chi tiết khép kín. Bước 3: Dùng công cụ Tô màu để tô màu hài hòa và công cụ Chọn (Select), Sao chép, Xoay để ghép các chi tiết lại, thêm chữ bằng công cụ A rồi lưu tệp.",
            gradingGuide:
              "Nêu đúng các bước vẽ hình cơ bản và tô màu (50% điểm); nêu đúng bước chọn, ghép chi tiết, thêm chữ và lưu tệp (50% điểm).",
            semanticKeywords: [
              "công cụ vẽ hình cơ bản đường cong",
              "tô màu Fill with color vùng khép kín",
              "chọn Select sao chép ghép chi tiết thêm chữ",
            ],
          },
          {
            question: `[Tin học 5 - Chủ đề 5A: Sử dụng phần mềm đồ họa${docTag}] ${customIdeaText}`,
            cognitiveLevel: "Vận dụng",
            illustrationNote: "",
            sampleAnswer:
              "Bước 1: Dùng công cụ hình tròn/hình chữ nhật vẽ khung biển báo. Bước 2: Vẽ hình minh họa bỏ rác đúng nơi quy định và dùng công cụ Tô màu (tô nền xanh lá hoặc xanh dương). Bước 3: Dùng công cụ chữ A gõ dòng chữ 'Giữ gìn vệ sinh trường học' nổi bật, căn chỉnh bố cục cân đối rồi lưu tệp sản phẩm.",
            gradingGuide:
              "Nêu đúng bước vẽ khung biển báo và hình minh họa (40% điểm); tô màu và chèn chữ khẩu hiệu bằng công cụ A (40% điểm); lưu tệp (20% điểm).",
            semanticKeywords: [
              "vẽ khung biển báo bằng công cụ hình học",
              "tô màu và vẽ chi tiết minh họa",
              "dùng công cụ chữ A gõ khẩu hiệu lưu tệp",
            ],
          },
        ];
      } else if (subtrackId === "5B-multimedia") {
        mcqs = [
          {
            question: `[Tin học 5 - Chủ đề 5B: Sử dụng công cụ đa phương tiện${docTag}] Một sản phẩm đa phương tiện (như đoạn phim giới thiệu hoặc trình chiếu đa phương tiện) thường kết hợp những loại tư liệu nào?`,
            cognitiveLevel: "Nhận biết",
            illustrationNote:
              "[HÌNH ẢNH MINH HỌA: Giao diện biên tập đa phương tiện gồm thanh chuỗi hình ảnh (Storyboard/Timeline), bản nhạc nền và hiệu ứng chuyển cảnh]",
            options: [
              "A. Kết hợp chuỗi hình ảnh, văn bản phụ đề, âm thanh (nhạc nền/lời thuyết minh) và hiệu ứng chuyển cảnh",
              "B. Chỉ có duy nhất văn bản đen trắng không có hình ảnh hay âm thanh",
              "C. Chỉ có thiết bị phần cứng bàn phím",
              "D. Không thể phát được âm thanh",
            ],
            correctIndex: 0,
            explanation:
              "Sản phẩm đa phương tiện kết hợp sinh động hình ảnh, chữ viết, âm thanh và hiệu ứng chuyển động.",
          },
          {
            question: `[Tin học 5 - Chủ đề 5B: Sử dụng công cụ đa phương tiện${docTag}] Trong công cụ tạo sản phẩm đa phương tiện, bước sắp xếp các bức ảnh theo đúng trình tự câu chuyện trên thanh kịch bản (Storyboard / Timeline) có tác dụng gì?`,
            cognitiveLevel: "Thông hiểu",
            illustrationNote: "",
            options: [
              "A. Giúp nội dung sản phẩm diễn ra mạch lạc theo đúng kịch bản từ mở đầu, nội dung chính đến kết thúc",
              "B. Làm xóa hết các bức ảnh trong máy tính",
              "C. Làm mất âm thanh của máy tính",
              "D. Không ảnh hưởng đến thứ tự xuất hiện của ảnh",
            ],
            correctIndex: 0,
            explanation:
              "Sắp xếp chuỗi hình ảnh theo kịch bản giúp người xem hiểu rõ mạch nội dung câu chuyện.",
          },
          {
            question: `[Tin học 5 - Chủ đề 5B: Sử dụng công cụ đa phương tiện${docTag}] Để sản phẩm đa phương tiện thêm hấp dẫn và truyền cảm, em có thể thực hiện những thao tác chỉnh sửa nào?`,
            cognitiveLevel: "Vận dụng",
            illustrationNote: "",
            options: [
              "A. Chèn thêm nhạc nền phù hợp, điều chỉnh thời gian hiển thị của từng ảnh, thêm chữ chú thích và hiệu ứng chuyển cảnh mượt mà",
              "B. Xóa toàn bộ hình ảnh khỏi dự án",
              "C. Tắt màn hình khi đang trình chiếu",
              "D. Đặt thời gian hiển thị mỗi ảnh là 0 giây",
            ],
            correctIndex: 0,
            explanation:
              "Kết hợp nhạc nền, thời lượng hợp lý, phụ đề chữ và hiệu ứng chuyển cảnh giúp sản phẩm đa phương tiện sinh động, hoàn chỉnh.",
          },
        ];
        essays = [
          {
            question: `[Tin học 5 - Chủ đề 5B: Sử dụng công cụ đa phương tiện${docTag}] Em hãy nêu các bước cơ bản để tạo một sản phẩm đa phương tiện từ các tệp ảnh và âm thanh có sẵn trên máy tính?`,
            cognitiveLevel: "Thông hiểu",
            illustrationNote: "",
            sampleAnswer:
              "Bước 1: Chuẩn bị và đưa các tệp hình ảnh, âm thanh vào phần mềm đa phương tiện. Bước 2: Sắp xếp thứ tự các bức ảnh theo kịch bản và chỉnh thời gian hiển thị. Bước 3: Thêm chữ tiêu đề/chú thích, hiệu ứng chuyển cảnh và chèn nhạc nền. Bước 4: Xem thử (Preview) và xuất/lưu sản phẩm.",
            gradingGuide:
              "Nêu đúng bước đưa tư liệu ảnh/âm thanh và sắp xếp thứ tự (50% điểm); nêu đúng bước thêm chữ, hiệu ứng, nhạc nền và xuất tệp (50% điểm).",
            semanticKeywords: [
              "đưa hình ảnh âm thanh vào phần mềm",
              "sắp xếp chuỗi hình ảnh theo kịch bản",
              "thêm chữ hiệu ứng chuyển cảnh nhạc nền",
            ],
          },
          {
            question: `[Tin học 5 - Chủ đề 5B: Sử dụng công cụ đa phương tiện${docTag}] ${customIdeaText}`,
            cognitiveLevel: "Vận dụng",
            illustrationNote: "",
            sampleAnswer:
              "Bước 1: Thu thập các bức ảnh đẹp về cổng trường, lớp học, sân trường và một bản nhạc thiếu nhi vui tươi. Bước 2: Đưa ảnh vào phần mềm, sắp xếp theo trình tự giới thiệu từ cổng trường vào lớp học. Bước 3: Thêm tiêu đề giới thiệu tên trường, gán hiệu ứng chuyển cảnh giữa các ảnh, chèn nhạc nền vừa phải rồi xuất thành sản phẩm hoàn chỉnh.",
            gradingGuide:
              "Nêu đúng bước thu thập và sắp xếp chuỗi ảnh trường học (50% điểm); thêm tiêu đề, nhạc nền, hiệu ứng chuyển cảnh và lưu sản phẩm (50% điểm).",
            semanticKeywords: [
              "thu thập ảnh trường học và nhạc nền",
              "sắp xếp thứ tự chuỗi hình ảnh",
              "thêm tiêu đề hiệu ứng chuyển cảnh",
            ],
          },
        ];
      } else {
        // 5-common: Soạn thảo và định dạng văn bản nâng cao Lớp 5
        mcqs = [
          {
            question: `[Tin học 5 - ${topicObj.code}: Soạn thảo văn bản nâng cao${docTag}] Trong phần mềm soạn thảo Word ở Lớp 5, nút lệnh Căn đều hai bên (Justify — tổ hợp phím Ctrl + J) có tác dụng gì đối với đoạn văn bản?`,
            cognitiveLevel: "Nhận biết",
            illustrationNote:
              "[HÌNH ẢNH MINH HỌA: 4 nút căn lề đoạn văn trong Word (Left, Center, Right, Justify) với nút Justify được khoanh tròn]",
            options: [
              "A. Giúp cả lề trái và lề phải của đoạn văn bản đều thẳng hàng đẹp mắt như trang sách in",
              "B. Đưa toàn bộ văn bản sang lề phải",
              "C. Xóa đoạn văn bản đang chọn",
              "D. Đổi màu chữ thành màu xanh",
            ],
            correctIndex: 0,
            explanation:
              "Nút lệnh Justify (Ctrl + J) căn thẳng cả hai mép lề trái và lề phải của đoạn văn bản.",
          },
          {
            question: `[Tin học 5 - ${topicObj.code}: Soạn thảo văn bản nâng cao${docTag}] Khi chèn một bức ảnh vào trang văn bản nhiều đoạn ở Lớp 5, công cụ Wrap Text (Bố trí ảnh so với văn bản) giúp em thực hiện điều gì?`,
            cognitiveLevel: "Thông hiểu",
            illustrationNote:
              "[HÌNH ẢNH MINH HỌA: Biểu tượng Wrap Text (Square, Tight, Top and Bottom, In Line with Text) bên cạnh bức ảnh trong Word]",
            options: [
              "A. Giúp di chuyển bức ảnh linh hoạt và sắp xếp các dòng chữ bao quanh hoặc nằm trên/dưới bức ảnh một cách hài hòa",
              "B. Dùng để xóa bức ảnh khỏi máy tính",
              "C. Dùng để kiểm tra chính tả tiếng Anh",
              "D. Dùng để tắt phần mềm Word",
            ],
            correctIndex: 0,
            explanation:
              "Wrap Text cho phép chọn kiểu bố trí ảnh (như Square, Top and Bottom) để trình bày trang văn bản có ảnh đẹp mắt.",
          },
          {
            question: `[Tin học 5 - ${topicObj.code}: Soạn thảo văn bản nâng cao${docTag}] Để các dòng trong đoạn văn bản thông thoáng, dễ đọc hơn, em sử dụng nút lệnh nào trong nhóm Paragraph của thẻ Home?`,
            cognitiveLevel: "Thông hiểu",
            illustrationNote:
              "[HÌNH ẢNH MINH HỌA: Nút lệnh Line and Paragraph Spacing (biểu tượng mũi tên hai chiều lên xuống cạnh các dòng kẻ)]",
            options: [
              "A. Nút lệnh Line and Paragraph Spacing (chỉnh khoảng cách giữa các dòng và các đoạn văn)",
              "B. Nút lệnh Bold (chữ đậm)",
              "C. Nút lệnh Font Color (màu chữ)",
              "D. Nút lệnh Undo",
            ],
            correctIndex: 0,
            explanation:
              "Line and Paragraph Spacing dùng để điều chỉnh độ giãn dòng (1.15, 1.5 lines...) và khoảng cách giữa các đoạn văn.",
          },
          {
            question: `[Tin học 5 - ${topicObj.code}: Soạn thảo văn bản nâng cao${docTag}] Trước khi lưu hoàn thiện hoặc in một trang văn bản nhiều đoạn ở Lớp 5, em cần rà soát những yếu tố nào để trang văn bản đạt thẩm mỹ cao?`,
            cognitiveLevel: "Vận dụng",
            illustrationNote: "",
            options: [
              "A. Kiểm tra và sửa hết lỗi chính tả, quy tắc gõ dấu câu, thống nhất phông chữ/cỡ chữ, căn lề đoạn văn đều đặn và bố trí ảnh cân đối",
              "B. Để mỗi dòng một phông chữ và cỡ chữ khác nhau",
              "C. Không cần đọc lại kiểm tra lỗi chính tả",
              "D. Xóa tiêu đề của bài viết",
            ],
            correctIndex: 0,
            explanation:
              "Một văn bản hoàn chỉnh ở Lớp 5 cần đúng chính tả, dấu câu, định dạng đoạn văn thống nhất và bố cục hình ảnh cân đối.",
          },
        ];
        essays = [
          {
            question: `[Tin học 5 - ${topicObj.code}: Soạn thảo văn bản nâng cao${docTag}] Em hãy nêu 4 kiểu căn lề đoạn văn bản trong Word và cho biết khi nào nên dùng kiểu Căn giữa (Center), khi nào nên dùng kiểu Căn đều hai bên (Justify)?`,
            cognitiveLevel: "Thông hiểu",
            illustrationNote: "",
            sampleAnswer:
              "4 kiểu căn lề đoạn văn là: Căn lề trái (Align Left), Căn giữa (Center), Căn lề phải (Align Right) và Căn đều hai bên (Justify). Kiểu Căn giữa thường dùng cho dòng tiêu đề bài viết; còn kiểu Căn đều hai bên dùng cho các đoạn văn nội dung dài để hai mép lề trái, phải thẳng hàng đẹp mắt.",
            gradingGuide:
              "Kể đúng 4 kiểu căn lề đoạn văn (50% điểm); giải thích đúng trường hợp dùng Căn giữa và Căn đều hai bên (50% điểm).",
            semanticKeywords: [
              "căn trái căn giữa căn phải căn đều hai bên",
              "căn giữa dùng cho tiêu đề",
              "căn đều hai bên Justify cho đoạn văn nội dung",
            ],
          },
          {
            question: `[Tin học 5 - ${topicObj.code}: Soạn thảo văn bản nâng cao${docTag}] ${customIdeaText}`,
            cognitiveLevel: "Vận dụng",
            illustrationNote: "",
            sampleAnswer:
              "Bước 1: Kéo thả chuột chọn các đoạn văn nội dung rồi nháy nút Justify (hoặc nhấn Ctrl + J) để căn đều hai bên lề trái và phải. Bước 2: Nháy nút Line and Paragraph Spacing chọn độ giãn dòng 1.15 hoặc 1.5 để đoạn văn thông thoáng. Bước 3: Nháy chuột chọn bức ảnh, dùng nút Center để căn giữa ảnh hoặc chọn Wrap Text -> Square để bố trí ảnh hài hòa với chữ.",
            gradingGuide:
              "Nêu đúng thao tác chọn đoạn văn và bấm Justify / Ctrl + J (40% điểm); chỉnh khoảng cách dòng Line Spacing (30% điểm); căn chỉnh ảnh bằng Center / Wrap Text (30% điểm).",
            semanticKeywords: [
              "bôi đen đoạn văn chọn Justify hoặc Ctrl + J",
              "Line and Paragraph Spacing khoảng cách dòng",
              "căn chỉnh ảnh Center hoặc Wrap Text",
            ],
          },
        ];
      }
    } else {
      // k5-cd6: Scratch nâng cao Lớp 5
      mcqs = [
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Trong lập trình Scratch Lớp 5 (Bài 14: Cấu trúc lặp), muốn điều khiển bút vẽ lặp lại đúng 4 lần cặp lệnh "di chuyển 100 bước, xoay phải 90 độ" để vẽ một hình vuông, em sử dụng khối lệnh nào?`,
          cognitiveLevel: "Nhận biết",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Khối lệnh 'Lặp lại 4' (repeat 4) bọc ngoài khối 'di chuyển 100 bước' và 'xoay phải 90 độ' trong Scratch Lớp 5]",
          options: [
            "A. Khối lệnh lặp với số lần biết trước 'Lặp lại 4' (repeat 4) trong nhóm lệnh Điều khiển",
            "B. Khối lệnh 'Ẩn' (hide) trong nhóm Hiển thị",
            "C. Khối lệnh 'Đổi phông nền' trong nhóm Hiển thị",
            "D. Khối lệnh 'Dừng lại tất cả'",
          ],
          correctIndex: 0,
          explanation:
            "Khối lệnh 'Lặp lại 4' (repeat 4) thực hiện lặp lại đúng 4 lần các lệnh bên trong để vẽ 4 cạnh của hình vuông.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Sự khác nhau cơ bản giữa hai khối lệnh lặp "Lặp lại ... (repeat)" và "Liên tục (forever)" trong Scratch Lớp 5 là gì?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          options: [
            "A. Khối 'Lặp lại ...' thực hiện một số lần nhất định rồi dừng; còn khối 'Liên tục' lặp mãi các lệnh bên trong cho đến khi dừng chương trình",
            "B. Hai khối lệnh hoàn toàn giống nhau",
            "C. Khối 'Liên tục' chỉ thực hiện đúng 1 lần duy nhất",
            "D. Cả hai khối đều thuộc nhóm lệnh Âm thanh",
          ],
          correctIndex: 0,
          explanation:
            "Theo SGK Tin học 5 (Bài 14), repeat dùng khi biết trước số lần lặp, còn forever dùng cho các hoạt động lặp không ngừng suốt thời gian chạy chương trình.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Trong Scratch Lớp 5 (Bài 15: Cấu trúc rẽ nhánh), khối lệnh "Nếu <điều kiện> thì <hành động 1> Nếu không thì <hành động 2>" (if ... then ... else ...) hoạt động như thế nào?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Khối lệnh rẽ nhánh dạng đủ 'Nếu ... thì ... Nếu không thì ...' trong nhóm Điều khiển của Scratch]",
          options: [
            "A. Nếu điều kiện đúng thì thực hiện <hành động 1>; ngược lại nếu điều kiện sai thì thực hiện <hành động 2>",
            "B. Luôn thực hiện đồng thời cả <hành động 1> và <hành động 2>",
            "C. Không kiểm tra điều kiện mà bỏ qua cả hai hành động",
            "D. Xóa nhân vật khỏi sân khấu",
          ],
          correctIndex: 0,
          explanation:
            "Cấu trúc rẽ nhánh dạng đủ giúp chương trình chọn 1 trong 2 nhánh công việc tùy thuộc điều kiện đúng hay sai.",
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Trong Scratch Lớp 5 (Bài 16: Biến và biểu thức), để lưu trữ và cập nhật số "Điểm" của người chơi mỗi khi trả lời đúng câu hỏi hoặc hứng được quả táo, em cần tạo đối tượng nào trong nhóm lệnh Các biến số (Variables)?`,
          cognitiveLevel: "Vận dụng",
          illustrationNote:
            "[HÌNH ẢNH MINH HỌA: Nhóm lệnh Các biến số (Variables) màu cam đậm với khối 'Đặt Điểm thành 0' và 'Thay đổi Điểm một lượng 1']",
          options: [
            "A. Tạo một Biến nhớ tên là 'Điểm', dùng khối 'Đặt Điểm thành 0' lúc bắt đầu và 'Thay đổi Điểm một lượng 1' khi ghi điểm",
            "B. Tạo thêm một phông nền mới mỗi lần ghi điểm",
            "C. Dùng khối lệnh 'Xoay 15 độ'",
            "D. Đổi tên tệp chương trình",
          ],
          correctIndex: 0,
          explanation:
            "Biến nhớ (Variable) dùng để lưu giá trị có thể thay đổi trong quá trình chương trình Scratch hoạt động.",
        },
      ];
      essays = [
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] Em hãy giải thích ý nghĩa của Cấu trúc lặp và Cấu trúc rẽ nhánh trong Scratch Lớp 5, đồng thời nêu ví dụ khối lệnh tương ứng?`,
          cognitiveLevel: "Thông hiểu",
          illustrationNote: "",
          sampleAnswer:
            "Cấu trúc lặp dùng để thực hiện lặp đi lặp lại một nhóm lệnh nhiều lần mà không phải ghép khối thủ công (ví dụ: khối 'Lặp lại 4 lần', khối 'Liên tục'). Cấu trúc rẽ nhánh dùng để kiểm tra điều kiện trước khi quyết định thực hiện lệnh (ví dụ: khối 'Nếu ... thì ...' và 'Nếu ... thì ... Nếu không thì ...').",
          gradingGuide:
            "Giải thích đúng cấu trúc lặp và nêu ví dụ repeat/forever (50% điểm); giải thích đúng cấu trúc rẽ nhánh và nêu ví dụ if-then (50% điểm).",
          semanticKeywords: [
            "cấu trúc lặp repeat lặp lại hoặc forever liên tục",
            "cấu trúc rẽ nhánh nếu thì if then",
            "kiểm tra điều kiện",
          ],
        },
        {
          question: `[Tin học 5 - ${topicObj.code}${docTag}] ${customIdeaText}`,
          cognitiveLevel: "Vận dụng",
          illustrationNote: "",
          sampleAnswer:
            "Bước 1: Vào nhóm lệnh 'Các biến số' (Variables), nháy nút 'Tạo một biến' và đặt tên biến là 'Điểm'. Bước 2: Ngay dưới khối 'Khi bấm vào lá cờ xanh', gắn khối 'Đặt Điểm thành 0'. Bước 3: Đặt khối 'Nếu <đang chạm vào Táo?> thì' vào bên trong vòng lặp 'Liên tục', ở nhánh bên trong gắn khối 'Thay đổi Điểm một lượng 1' và 'Bắt đầu âm thanh Pop'.",
          gradingGuide:
            "Nêu đúng bước tạo biến Điểm và khởi tạo bằng 0 (35% điểm); đặt đúng khối Nếu chạm Táo trong vòng lặp Liên tục (35% điểm); dùng đúng khối Thay đổi Điểm một lượng 1 và phát âm thanh (30% điểm).",
          semanticKeywords: [
            "tạo biến Điểm trong nhóm Các biến số",
            "đặt Điểm thành 0",
            "vòng lặp Liên tục và khối Nếu đang chạm Táo",
            "thay đổi Điểm một lượng 1",
          ],
        },
      ];
    }
  }

  const uploadedMcqs = parseMcqsFromUploadedText(referenceDocText, grade, topicObj.code);
  if (uploadedMcqs.length > 0) {
    mcqs = [...uploadedMcqs, ...mcqs];
  }

  return { mcqs, essays, practiceTask };
}
