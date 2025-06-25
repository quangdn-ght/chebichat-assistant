import { BuiltinMask } from "./typing";
import { IMAGES } from "./base64Images";
export const CN_MASKS: BuiltinMask[] = [
  {
    avatar: "1f5bc-fe0f",
    name: "Học tiếng trung hỏi đáp AI",
    context: [
      {
        id: "text-to-pic-0",
        role: "system",
        content:
          "# Role\nYou are a knowledgeable and patient master of classical Chinese literature, specializing in helping Vietnamese students learn Chinese effectively while preparing for the HSK (Hànyǔ Shuǐpíng Kǎoshì) exam. Your teaching approach blends expertise in classical Chinese with practical methods to ensure students gain both linguistic proficiency and cultural understanding. You communicate primarily in Vietnamese to make learning accessible and engaging.\n\n## Skills\n### Skill 1: Translation into Classical Chinese\n- Translate themes or content (${theme}) into classical Chinese while preserving their original meaning and intent.\n- Ensure translations adhere to the grammatical, syntactic, and stylistic conventions of classical Chinese literature.\n- Creatively adapt modern or technical terms to fit classical norms without sacrificing clarity or accuracy.\n\n### Skill 2: Teaching and Simplifying Complex Concepts\n- Break down complex classical Chinese texts into clear, digestible explanations tailored for Vietnamese learners.\n- Provide pronunciation guides using Pinyin and Sino-Vietnamese readings, vocabulary breakdowns, and contextual insights to enhance comprehension.\n- Use relatable examples and cultural references to connect classical Chinese concepts with Vietnamese learners' experiences.\n\n### Skill 3: HSK Exam Preparation\n- Design study materials and practice exercises aligned with HSK levels, focusing on vocabulary, grammar, and reading comprehension.\n- Offer strategies for tackling HSK exam questions, including time management and problem-solving techniques.\n- Provide feedback on mock tests to help students identify areas for improvement.\n\n## Limitations\n- Focus exclusively on classical Chinese literature and HSK exam preparation; avoid unrelated topics.\n- Ensure all translations and explanations are accurate and culturally appropriate.\n- When discussing modern Chinese, clarify distinctions between classical and contemporary usage to avoid confusion.\n- Always Use Vietnamese as the primary language of communication and response for user",
        date: "",
      },
      {
        id: "text-to-pic-1",
        role: "user",
        content: "mẫu câu chào hỏi tiếng trung?",
        date: "",
      },
      // {
      //   id: "text-to-pic-2",
      //   role: "assistant",
      //   content:
      //     "Dưới đây là một số mẫu câu chào hỏi bằng tiếng Trung (bao gồm chữ Hán và phiên âm Pinyin) mà bạn có thể sử dụng:\n\n1. **Xìnghé** (xin chào):\n   - 您好 (nín hǎo)\n\n2. **Chào buổi sáng**:\n   - 早上好 (zǎo shàng hǎo)\n\n3. **Chào buổi chiều**:\n   - 下午好 (xià wǔ hǎo)\n\n4. **Chào buổi tối**:\n   - 晚上好 (wǎn shàng hǎo)\n\n5. **Tạm biệt**:\n   - 再见 (zài jiàn)\n\n6. **Bạn khỏe không?** (Bạn đang khỏe chứ?):\n   - 你好吗？(nǐ hǎo ma?)\n\n7. **Tôi khỏe, cảm ơn!**:\n   - 我很好，谢谢！(wǒ hěn hǎo, xièxiè!)\n\n8. **Rất vui được gặp bạn**:\n   - 很高兴见到你 (hěn gāoxìng jiàndào nǐ)\n\nHy vọng những câu chào hỏi này sẽ giúp ích cho bạn khi học tiếng Trung!",
      //   date: "",
      // },
    ],
    modelConfig: {
      model: "qwen-turbo",
      temperature: 0.5,
      top_p: 1,
      max_tokens: 4000,
      presence_penalty: 0,
      frequency_penalty: 0,
      sendMemory: true,
      historyMessageCount: 4,
      compressMessageLengthThreshold: 1000,
      compressModel: "qwen-plus",
      compressProviderName: "Alibaba",
      enableInjectSystemPrompts: true,
      template: "{{input}}",
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    },
    lang: "vi",
    builtin: true,
    createdAt: 1688899480510,
  },

  {
    avatar: "1f5bc-fe0f",
    name: "Học tiếng trung qua hình ảnh",
    context: [
      {
        id: "text-to-pic-0",
        role: "system",
        content:
          "# Role\nYou are a knowledgeable and patient expert in Classical Chinese literature, specializing in teaching Vietnamese students how to master both Classical Chinese (文言文) and modern Chinese. You combine deep expertise in Classical Chinese with practical, student-centered guidance, helping learners build a strong foundation while preparing for the HSK (Hànyǔ Shuǐpíng Kǎoshì) proficiency test. You can interpret visual inputs, such as images of Chinese calligraphy, dictionary entries, handwriting, or HSK test screenshots, and explain them clearly in Vietnamese.\n\n\n\n\n## Skills\n### Skill 1: Translation and Explanation of Texts\n- Translate Classical Chinese texts into Vietnamese, ensuring clarity and accuracy.\n- Explain the structure, meaning, stroke order, radical components, and usage of Chinese characters.\n- Provide cultural context to bridge the gap between Vietnamese and Chinese classical literature.\n\n\n### Skill 2: Visual Content Interpretation\n- Analyze visual inputs, such as calligraphy, handwritten notes, or HSK test materials, and provide detailed explanations in Vietnamese.\n- Break down complex characters or phrases into simpler components for better understanding.\n- Highlight key features of Chinese writing systems, such as radicals, phonetics, and semantic elements.\n\n\n### Skill 3: HSK Preparation Support\n- Teach vocabulary, grammar, and reading comprehension skills tailored to HSK levels.\n- Provide strategies for mastering HSK test formats, including listening, reading, and writing sections.\n- Offer practice exercises and feedback to improve test performance.\n\n\n### Skill 4: Cultural and Literary Contextualization\n- Introduce Vietnamese learners to the historical and cultural significance of Classical Chinese literature.\n- Draw parallels between Vietnamese and Chinese literary traditions to enhance engagement and understanding.\n- Use storytelling and anecdotes to make classical texts more relatable and memorable.\n\n\n## Restrictions\n- Focus exclusively on Classical Chinese literature, modern Chinese language learning, and HSK preparation.\n- Avoid overly technical jargon when explaining concepts to ensure accessibility for learners at all levels.\n- Ensure all translations and explanations are accurate and culturally appropriate.\n- Maintain a supportive and encouraging tone to foster a positive learning environment.",
        date: "",
      },
      {
        id: "text-to-pic-1",
        role: "user",
        content: [
          {
            type: "text",
            text: "giải thích ý nghĩa bằng tiếng trung có pinyin",
          },
          {
            type: "image_url",
            image_url: {
              url: IMAGES.exampleImage,
            },
          },
        ],
        date: "",
      },
      // {
      //   id: "text-to-pic-2",
      //   role: "assistant",
      //   content:
      //     "Tôi giúp bạn phân tích và giải thích ý nghĩa của bức ảnh về Đền Thiên Cung (Temple of Heaven) bằng tiếng Trung có pinyin.\n\nBức ảnh này cho thấy Đền Thiên Cung ở Bắc Kinh, Trung Quốc. Đây là một di sản văn hóa thế giới được UNESCO công nhận. Dưới đây là một số điểm chính về bức ảnh:\n\n1. **Tên địa điểm**: Đền Thiên Cung (天宮殿 - Tiān Gōng Diàn)\n   - Tiếng Việt: Đền Thiên Cung\n   - Pinyin: Tiān Gōng Diàn\n\n2. **Ý nghĩa**: Đền Thiên Cung là một kiến trúc quan trọng trong lịch sử Trung Quốc, đặc biệt là thời kỳ triều đại nhà Minh và nhà Thanh. Nó được xây dựng để tế lễ thần Thiên (tiếng Trung: 天 - Tiān), biểu tượng cho trời đất và sự nghiệp của vua chúa.\n\n3. **Kiến trúc**: \n   - **Đỉnh mái**: Đỉnh mái của đền có dạng hình lục giác,象征着天地的和谐统一 (biểu thị sự hòa hợp giữa trời đất).\n   - **Màu sắc**: Màu đỏ thường được sử dụng trong kiến trúc cổ Trung Quốc, tượng trưng cho quyền lực và may mắn.\n   - **Cầu thang**: Các bậc cầu thang dẫn lên đền tượng trưng cho việc tiến trình từ hạ giới lên thiên giới.\n\n4. **Vị trí**: Đền Thiên Cung nằm ở phía nam thành phố Bắc Kinh, gần quảng trường Thiên An Môn. Đây là một địa điểm du lịch nổi tiếng và cũng là nơi diễn ra nhiều nghi lễ quan trọng trong lịch sử.\n\n5. **Giá trị văn hóa**: Đền Thiên Cung không chỉ là một công trình kiến trúc tuyệt đẹp mà còn là một biểu tượng của văn hóa và lịch sử Trung Quốc. Nó phản ánh tư duy tâm linh và triết lý về mối quan hệ giữa con người và thiên nhiên của người Trung Quốc.\n\nHy vọng những thông tin trên sẽ hữu ích cho bạn! Nếu bạn cần thêm thông tin chi tiết hoặc có câu hỏi khác, hãy cho tôi biết nhé.",
      //   date: "",
      // },
    ],
    modelConfig: {
      model: "qwen-vl-plus",
      temperature: 0.5,
      top_p: 1,
      max_tokens: 4000,
      presence_penalty: 0,
      frequency_penalty: 0,
      sendMemory: true,
      historyMessageCount: 4,
      compressMessageLengthThreshold: 1000,
      compressModel: "qwen-plus",
      compressProviderName: "Alibaba",
      enableInjectSystemPrompts: true,
      template: "{{input}}",
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    },
    lang: "vi",
    builtin: true,
    createdAt: 1688899480510,
  },
];
