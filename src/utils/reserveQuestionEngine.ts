import {
  CognitiveLevel,
  GradeLevel,
  MultipleChoiceQuestion,
  ShortAnswerQuestion,
  TheoryExam,
} from "../types/grading";
import {
  cleanIllustrationCaption,
  cleanQuestionText,
  generateIllustrationDataUrl,
} from "./examIllustrationEngine";
import {
  getGradeAndTopicPureBank,
  KnttTopicConfigMinimal,
  TopicPureEssayItem,
  TopicPureQuestionItem,
} from "./gradeCurriculumBank";

// 6 Chủ đề chuẩn SGK Tin học Kết nối tri thức cho từng Khối lớp
export const GRADE_TOPICS_CATALOG: Record<
  GradeLevel,
  Array<{ id: string; code: string; title: string; lessonsSummary: string }>
> = {
  "Lớp 3": [
    {
      id: "k3-cd1",
      code: "Chủ đề 1",
      title: "Chủ đề 1: Máy tính và em",
      lessonsSummary:
        "Thông tin và quyết định, các bộ phận của máy tính, tư thế ngồi và hàng phím cơ sở.",
    },
    {
      id: "k3-cd2",
      code: "Chủ đề 2",
      title: "Chủ đề 2: Mạng máy tính và Internet",
      lessonsSummary:
        "Xem tin tức và giải trí trên trang web, biểu tượng trình duyệt web, thông tin trên Internet.",
    },
    {
      id: "k3-cd3",
      code: "Chủ đề 3",
      title: "Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin",
      lessonsSummary:
        "Sắp xếp để dễ tìm, sơ đồ hình cây, làm quen với thư mục và tệp tin trên máy tính.",
    },
    {
      id: "k3-cd4",
      code: "Chủ đề 4",
      title: "Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số",
      lessonsSummary:
        "Bảo vệ thông tin cá nhân và gia đình khi sử dụng máy tính, Internet.",
    },
    {
      id: "k3-cd5",
      code: "Chủ đề 5",
      title: "Chủ đề 5: Ứng dụng tin học",
      lessonsSummary:
        "Làm quen với phần mềm trình chiếu, tạo trang trình chiếu có văn bản và hình ảnh minh họa.",
    },
    {
      id: "k3-cd6",
      code: "Chủ đề 6",
      title: "Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính",
      lessonsSummary:
        "Thực hiện công việc theo từng bước, chia việc lớn thành việc nhỏ, câu lệnh điều kiện (Nếu... thì...).",
    },
  ],
  "Lớp 4": [
    {
      id: "k4-cd1",
      code: "Chủ đề 1",
      title: "Chủ đề 1: Máy tính và em",
      lessonsSummary:
        "Phần cứng và phần mềm máy tính, gõ bàn phím đúng cách 10 ngón.",
    },
    {
      id: "k4-cd2",
      code: "Chủ đề 2",
      title: "Chủ đề 2: Mạng máy tính và Internet",
      lessonsSummary:
        "Các loại thông tin trên trang web, siêu liên kết và phòng tránh trang web xấu.",
    },
    {
      id: "k4-cd3",
      code: "Chủ đề 3",
      title: "Chủ đề 3: Lưu trữ, tìm kiếm, trao đổi thông tin",
      lessonsSummary:
        "Tìm kiếm thông tin trên Internet bằng từ khóa, sao chép, di chuyển, đổi tên và xóa thư mục/tệp.",
    },
    {
      id: "k4-cd4",
      code: "Chủ đề 4",
      title: "Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số",
      lessonsSummary:
        "Tôn trọng bản quyền phần mềm, phần mềm miễn phí và phần mềm có bản quyền.",
    },
    {
      id: "k4-cd5",
      code: "Chủ đề 5",
      title: "Chủ đề 5: Ứng dụng tin học (Word & PowerPoint)",
      lessonsSummary:
        "Soạn thảo văn bản tiếng Việt có dấu, định dạng chữ và hiệu ứng chuyển trang chiếu.",
    },
    {
      id: "k4-cd6",
      code: "Chủ đề 6",
      title: "Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính (Scratch)",
      lessonsSummary:
        "Làm quen môi trường Scratch, ghép khối lệnh điều khiển nhân vật di chuyển và âm thanh.",
    },
  ],
  "Lớp 5": [
    {
      id: "k5-cd1",
      code: "Chủ đề 1",
      title: "Chủ đề 1: Máy tính và em",
      lessonsSummary:
        "Máy tính giúp con người học tập, giải trí, liên lạc và tạo ra các sản phẩm số.",
    },
    {
      id: "k5-cd2",
      code: "Chủ đề 2",
      title: "Chủ đề 2: Mạng máy tính và Internet",
      lessonsSummary:
        "Tìm kiếm thông tin nâng cao bằng từ khóa, chọn lọc và hợp tác trao đổi thông tin.",
    },
    {
      id: "k5-cd3",
      code: "Chủ đề 3",
      title: "Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin",
      lessonsSummary:
        "Cấu trúc cây thư mục phân cấp nhiều mức, quản lý tệp tin và tìm kiếm tệp nhanh.",
    },
    {
      id: "k5-cd4",
      code: "Chủ đề 4",
      title: "Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số",
      lessonsSummary:
        "Bản quyền nội dung số, trích dẫn nguồn thông tin và văn hóa ứng xử trên mạng.",
    },
    {
      id: "k5-cd5",
      code: "Chủ đề 5",
      title: "Chủ đề 5: Ứng dụng tin học (Đồ họa & Đa phương tiện)",
      lessonsSummary:
        "Soạn thảo văn bản nâng cao, thiết kế bài trình chiếu chuyên đề đa phương tiện.",
    },
    {
      id: "k5-cd6",
      code: "Chủ đề 6",
      title: "Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính (Scratch nâng cao)",
      lessonsSummary:
        "Sử dụng biến số, câu lệnh lặp có điều kiện và xử lý sự kiện tương tác trong Scratch.",
    },
  ],
};

/**
 * Chuẩn hóa chuỗi văn bản câu hỏi để so sánh trùng lặp
 */
export function normalizeQuestionText(raw: string): string {
  return cleanQuestionText(raw || "")
    .toLowerCase()
    .replace(/^câu\s*\d+\s*[:.-]\s*/i, "")
    .replace(/^câu\s*hỏi\s*tự\s*luận\s*\d*\s*[:.-]\s*/i, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Kiểm tra xem 2 câu hỏi có bị trùng lặp nội dung hay không
 */
export function areQuestionsDuplicate(q1: string, q2: string): boolean {
  const n1 = normalizeQuestionText(q1);
  const n2 = normalizeQuestionText(q2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;

  // Nếu độ dài > 24 ký tự và một câu chứa hoàn toàn câu kia
  if (n1.length > 24 && n2.length > 24) {
    if (n1.includes(n2) || n2.includes(n1)) return true;
  }

  // So sánh độ tương đồng từ khóa
  const words1 = new Set(n1.split(" ").filter((w) => w.length > 2));
  const words2 = new Set(n2.split(" ").filter((w) => w.length > 2));
  if (words1.size >= 5 && words2.size >= 5) {
    let common = 0;
    words1.forEach((w) => {
      if (words2.has(w)) common++;
    });
    const overlap = common / Math.min(words1.size, words2.size);
    if (overlap >= 0.85) return true;
  }

  return false;
}

/**
 * Lấy toàn bộ ngân hàng câu hỏi trắc nghiệm của Khối lớp (ưu tiên các chủ đề được chọn)
 */
export function getCurriculumMcqPool(
  grade: GradeLevel,
  activeTopicIds?: string[]
): TopicPureQuestionItem[] {
  const topics = GRADE_TOPICS_CATALOG[grade] || GRADE_TOPICS_CATALOG["Lớp 4"];
  const prioritized = [
    ...topics.filter((t) => activeTopicIds?.includes(t.id)),
    ...topics.filter((t) => !activeTopicIds?.includes(t.id)),
  ];

  const pool: TopicPureQuestionItem[] = [];
  const seen = new Set<string>();

  for (const t of prioritized) {
    const minimal: KnttTopicConfigMinimal = {
      id: t.id,
      code: t.code,
      title: t.title,
      lessonsSummary: t.lessonsSummary,
      theoryPrompt: "",
      practicePrompt: "",
      recommendedFileType: "docx",
    };
    const bank = getGradeAndTopicPureBank(grade, minimal, "", "", "");
    for (const item of bank.mcqs || []) {
      const norm = normalizeQuestionText(item.question);
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        pool.push(item);
      }
    }
  }

  return pool;
}

/**
 * Lấy toàn bộ ngân hàng câu hỏi tự luận của Khối lớp (ưu tiên các chủ đề được chọn)
 */
export function getCurriculumEssayPool(
  grade: GradeLevel,
  activeTopicIds?: string[]
): TopicPureEssayItem[] {
  const topics = GRADE_TOPICS_CATALOG[grade] || GRADE_TOPICS_CATALOG["Lớp 4"];
  const prioritized = [
    ...topics.filter((t) => activeTopicIds?.includes(t.id)),
    ...topics.filter((t) => !activeTopicIds?.includes(t.id)),
  ];

  const pool: TopicPureEssayItem[] = [];
  const seen = new Set<string>();

  for (const t of prioritized) {
    const minimal: KnttTopicConfigMinimal = {
      id: t.id,
      code: t.code,
      title: t.title,
      lessonsSummary: t.lessonsSummary,
      theoryPrompt: "",
      practicePrompt: "",
      recommendedFileType: "docx",
    };
    const bank = getGradeAndTopicPureBank(grade, minimal, "", "", "");
    for (const item of bank.essays || []) {
      const norm = normalizeQuestionText(item.question);
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        pool.push(item);
      }
    }
  }

  return pool;
}

/**
 * Loại bỏ câu hỏi trùng lặp trong danh sách trắc nghiệm của cùng 1 đề kiểm tra
 */
export function deduplicateMcqs(
  mcqs: MultipleChoiceQuestion[],
  grade: GradeLevel,
  activeTopicIds?: string[]
): MultipleChoiceQuestion[] {
  const pool = getCurriculumMcqPool(grade, activeTopicIds);
  const seen = new Set<string>();
  const poolQueue = [...pool];

  return mcqs.map((q, idx) => {
    const norm = normalizeQuestionText(q.question);
    if (!norm || seen.has(norm)) {
      // Câu hỏi bị trùng -> lấy câu thay thế không trùng từ ngân hàng
      const replacementIdx = poolQueue.findIndex((p) => {
        const pNorm = normalizeQuestionText(p.question);
        return pNorm && !seen.has(pNorm) && !areQuestionsDuplicate(p.question, q.question);
      });

      if (replacementIdx !== -1) {
        const rep = poolQueue.splice(replacementIdx, 1)[0];
        const cleanQ = cleanQuestionText(rep.question);
        const repNorm = normalizeQuestionText(cleanQ);
        seen.add(repNorm);
        const note = cleanIllustrationCaption(rep.illustrationNote) || cleanQ;
        return {
          ...q,
          id: q.id || `mcq-${idx + 1}-${Date.now()}`,
          question: cleanQ,
          cognitiveLevel: rep.cognitiveLevel || q.cognitiveLevel,
          illustrationNote: note,
          illustrationImageDataUrl: generateIllustrationDataUrl(cleanQ, note, idx, grade),
          illustrationVariant: idx % 5,
          hasNoIllustration: false,
          options: rep.options,
          correctIndex: rep.correctIndex,
          explanation: rep.explanation,
        };
      }
    }

    seen.add(norm);
    return q;
  });
}

/**
 * Loại bỏ câu hỏi trùng lặp trong danh sách tự luận của cùng 1 đề kiểm tra
 */
export function deduplicateEssays(
  essays: ShortAnswerQuestion[],
  grade: GradeLevel,
  activeTopicIds?: string[]
): ShortAnswerQuestion[] {
  const pool = getCurriculumEssayPool(grade, activeTopicIds);
  const seen = new Set<string>();
  const poolQueue = [...pool];

  return essays.map((sa, idx) => {
    const norm = normalizeQuestionText(sa.question);
    if (!norm || seen.has(norm)) {
      const replacementIdx = poolQueue.findIndex((p) => {
        const pNorm = normalizeQuestionText(p.question);
        return pNorm && !seen.has(pNorm) && !areQuestionsDuplicate(p.question, sa.question);
      });

      if (replacementIdx !== -1) {
        const rep = poolQueue.splice(replacementIdx, 1)[0];
        const cleanQ = cleanQuestionText(rep.question);
        const repNorm = normalizeQuestionText(cleanQ);
        seen.add(repNorm);
        const note = cleanIllustrationCaption(rep.illustrationNote) || cleanQ;
        return {
          ...sa,
          id: sa.id || `sa-${idx + 1}-${Date.now()}`,
          question: cleanQ,
          cognitiveLevel: rep.cognitiveLevel || sa.cognitiveLevel,
          illustrationNote: note,
          illustrationImageDataUrl: generateIllustrationDataUrl(cleanQ, note, idx, grade),
          illustrationVariant: idx % 5,
          hasNoIllustration: false,
          sampleAnswer: rep.sampleAnswer,
          gradingGuide: rep.gradingGuide,
          semanticKeywords: rep.semanticKeywords,
        };
      }
    }

    seen.add(norm);
    return sa;
  });
}

/**
 * Đảm bảo mỗi câu hỏi chính thức trong bài kiểm tra đều được nạp sẵn đúng 5 câu dự trù
 * không bị trùng lặp với câu chính thức và không bị trùng với các câu khác trong đề.
 */
export function ensureExamReserveQuestions(
  exam: TheoryExam,
  grade: GradeLevel,
  activeTopicIds?: string[]
): TheoryExam {
  // 1. Khử trùng lặp nội dung giữa các câu chính thức trong đề
  const uniqueMcqs = deduplicateMcqs(exam.multipleChoice || [], grade, activeTopicIds);
  const rawEssays =
    exam.shortAnswers && exam.shortAnswers.length > 0
      ? exam.shortAnswers
      : exam.shortAnswer && exam.shortAnswer.points > 0
      ? [exam.shortAnswer]
      : [];
  const uniqueEssays = deduplicateEssays(rawEssays, grade, activeTopicIds);

  // Tập hợp các câu hỏi đã được dùng làm câu chính thức để không trùng với dự trù
  const usedOfficialMcqTexts = new Set<string>(
    uniqueMcqs.map((q) => normalizeQuestionText(q.question))
  );
  const usedOfficialEssayTexts = new Set<string>(
    uniqueEssays.map((sa) => normalizeQuestionText(sa.question))
  );

  const fullMcqPool = getCurriculumMcqPool(grade, activeTopicIds);
  const fullEssayPool = getCurriculumEssayPool(grade, activeTopicIds);

  // 2. Chuẩn bị 5 câu dự trù cho từng câu trắc nghiệm
  const enrichedMcqs: MultipleChoiceQuestion[] = uniqueMcqs.map((q, qIdx) => {
    const currentReserves = Array.isArray(q.reserveQuestions) ? [...q.reserveQuestions] : [];
    const usedInSlot = new Set<string>();
    usedInSlot.add(normalizeQuestionText(q.question));
    currentReserves.forEach((r) => usedInSlot.add(normalizeQuestionText(r.question)));

    // Lọc các câu dự trù hợp lệ đã có sẵn
    const validExistingReserves = currentReserves.filter(
      (r) =>
        r &&
        r.question &&
        !areQuestionsDuplicate(r.question, q.question) &&
        !usedOfficialMcqTexts.has(normalizeQuestionText(r.question))
    );

    // Cần thêm bao nhiêu câu nữa để đủ đúng 5 câu dự trù
    const neededCount = Math.max(0, 5 - validExistingReserves.length);
    const addedReserves: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
      cognitiveLevel?: CognitiveLevel;
      illustrationNote?: string;
      illustrationImageDataUrl?: string;
      illustrationVariant?: number;
      hasNoIllustration?: boolean;
    }> = [];

    if (neededCount > 0) {
      // Tìm trong fullMcqPool những câu chưa từng dùng
      for (const item of fullMcqPool) {
        if (addedReserves.length >= neededCount) break;
        const norm = normalizeQuestionText(item.question);
        if (
          norm &&
          !usedInSlot.has(norm) &&
          !usedOfficialMcqTexts.has(norm) &&
          !areQuestionsDuplicate(item.question, q.question)
        ) {
          usedInSlot.add(norm);
          const cleanQ = cleanQuestionText(item.question);
          const note = cleanIllustrationCaption(item.illustrationNote) || cleanQ;
          const varIdx = (qIdx + addedReserves.length + 1) % 5;
          addedReserves.push({
            question: cleanQ,
            options: [...item.options],
            correctIndex: item.correctIndex,
            explanation: item.explanation,
            cognitiveLevel: item.cognitiveLevel || q.cognitiveLevel,
            illustrationNote: note,
            illustrationImageDataUrl: generateIllustrationDataUrl(cleanQ, note, varIdx, grade),
            illustrationVariant: varIdx,
            hasNoIllustration: false,
          });
        }
      }

      // Nếu ngân hàng chưa đủ câu, tạo thêm biến thể kiểm tra chuyên sâu cùng chủ đề
      let variantCounter = 1;
      while (addedReserves.length < neededCount && variantCounter <= 10) {
        const varIdx = (qIdx + addedReserves.length + 1) % 5;
        const baseQuestion = q.question.replace(/\?$/, "");
        const altQuestion = `Em hãy cho biết ý nghĩa và thao tác đúng đối với nội dung sau: ${baseQuestion} (Phương án bổ sung ${variantCounter})?`;
        const altNorm = normalizeQuestionText(altQuestion);
        if (!usedInSlot.has(altNorm)) {
          usedInSlot.add(altNorm);
          addedReserves.push({
            question: altQuestion,
            options: [
              `A. Thực hiện theo đúng chỉ dẫn của giáo viên và SGK Tin học ${grade}`,
              `B. Bỏ qua không cần kiểm tra lại kết quả`,
              `C. Tắt máy tính ngay khi chưa lưu dữ liệu`,
              `D. Chỉ sử dụng chuột mà không dùng bàn phím`,
            ],
            correctIndex: 0,
            explanation: `Thao tác đúng theo chuẩn chương trình Tin học ${grade} nhằm rèn luyện kỹ năng thực hành chuẩn xác.`,
            cognitiveLevel: q.cognitiveLevel,
            illustrationNote: q.illustrationNote || altQuestion,
            illustrationImageDataUrl: generateIllustrationDataUrl(
              altQuestion,
              q.illustrationNote || altQuestion,
              varIdx,
              grade
            ),
            illustrationVariant: varIdx,
            hasNoIllustration: false,
          });
        }
        variantCounter++;
      }
    }

    const finalReserves = [...validExistingReserves, ...addedReserves].slice(0, 5);

    return {
      ...q,
      reserveQuestions: finalReserves,
      reserveIndex: typeof q.reserveIndex === "number" ? q.reserveIndex : 0,
    };
  });

  // 3. Chuẩn bị 5 câu dự trù cho từng câu tự luận ngắn
  const enrichedEssays: ShortAnswerQuestion[] = uniqueEssays.map((sa, sIdx) => {
    const currentReserves = Array.isArray(sa.reserveQuestions) ? [...sa.reserveQuestions] : [];
    const usedInSlot = new Set<string>();
    usedInSlot.add(normalizeQuestionText(sa.question));
    currentReserves.forEach((r) => usedInSlot.add(normalizeQuestionText(r.question)));

    const validExistingReserves = currentReserves.filter(
      (r) =>
        r &&
        r.question &&
        !areQuestionsDuplicate(r.question, sa.question) &&
        !usedOfficialEssayTexts.has(normalizeQuestionText(r.question))
    );

    const neededCount = Math.max(0, 5 - validExistingReserves.length);
    const addedReserves: Array<{
      question: string;
      sampleAnswer: string;
      semanticKeywords: string[];
      cognitiveLevel?: CognitiveLevel;
      illustrationNote?: string;
      illustrationImageDataUrl?: string;
      illustrationVariant?: number;
      gradingGuide?: string;
      hasNoIllustration?: boolean;
    }> = [];

    if (neededCount > 0) {
      for (const item of fullEssayPool) {
        if (addedReserves.length >= neededCount) break;
        const norm = normalizeQuestionText(item.question);
        if (
          norm &&
          !usedInSlot.has(norm) &&
          !usedOfficialEssayTexts.has(norm) &&
          !areQuestionsDuplicate(item.question, sa.question)
        ) {
          usedInSlot.add(norm);
          const cleanQ = cleanQuestionText(item.question);
          const note = cleanIllustrationCaption(item.illustrationNote) || cleanQ;
          const varIdx = (sIdx + addedReserves.length + 1) % 5;
          addedReserves.push({
            question: cleanQ,
            sampleAnswer: item.sampleAnswer,
            gradingGuide: item.gradingGuide,
            semanticKeywords: [...item.semanticKeywords],
            cognitiveLevel: item.cognitiveLevel || sa.cognitiveLevel,
            illustrationNote: note,
            illustrationImageDataUrl: generateIllustrationDataUrl(cleanQ, note, varIdx, grade),
            illustrationVariant: varIdx,
            hasNoIllustration: false,
          });
        }
      }

      let variantCounter = 1;
      while (addedReserves.length < neededCount && variantCounter <= 10) {
        const varIdx = (sIdx + addedReserves.length + 1) % 5;
        const altQuestion = `Tình huống thực tế Tin học ${grade} (Dự trù ${variantCounter}): Khi gặp tình huống trong bài học "${sa.question.slice(
          0,
          80
        )}", em sẽ xử lý như thế nào để đảm bảo an toàn và đạt kết quả tốt?`;
        const altNorm = normalizeQuestionText(altQuestion);
        if (!usedInSlot.has(altNorm)) {
          usedInSlot.add(altNorm);
          addedReserves.push({
            question: altQuestion,
            sampleAnswer: `Em thực hiện theo đúng các bước hướng dẫn trong SGK Tin học ${grade}, thao tác cẩn thận và hỏi ý kiến thầy giáo khi gặp khó khăn.`,
            gradingGuide:
              "Học sinh nêu được thái độ học tập nghiêm túc, thao tác đúng quy trình và xử lý tình huống an toàn.",
            semanticKeywords: [
              "thực hiện đúng",
              "thao tác cẩn thận",
              "hỏi thầy",
              "an toàn",
              "đúng quy trình",
            ],
            cognitiveLevel: sa.cognitiveLevel,
            illustrationNote: sa.illustrationNote || altQuestion,
            illustrationImageDataUrl: generateIllustrationDataUrl(
              altQuestion,
              sa.illustrationNote || altQuestion,
              varIdx,
              grade
            ),
            illustrationVariant: varIdx,
            hasNoIllustration: false,
          });
        }
        variantCounter++;
      }
    }

    const finalReserves = [...validExistingReserves, ...addedReserves].slice(0, 5);

    return {
      ...sa,
      reserveQuestions: finalReserves,
      reserveIndex: typeof sa.reserveIndex === "number" ? sa.reserveIndex : 0,
    };
  });

  return {
    ...exam,
    multipleChoice: enrichedMcqs,
    shortAnswers: enrichedEssays,
    shortAnswer: enrichedEssays[0] || exam.shortAnswer,
  };
}
