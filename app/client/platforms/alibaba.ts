"use client";
import { ApiPath, Alibaba, ALIBABA_BASE_URL } from "@/app/constant";
import {
  useAccessStore,
  useAppConfig,
  useChatStore,
  ChatMessageTool,
  usePluginStore,
} from "@/app/store";
import {
  preProcessImageContentForAlibabaDashScope,
  streamWithThink,
} from "@/app/utils/chat";
import {
  ChatOptions,
  getHeaders,
  LLMApi,
  LLMModel,
  SpeechOptions,
  MultimodalContent,
} from "../api";
import { getClientConfig } from "@/app/config/client";
import {
  getMessageTextContent,
  getMessageTextContentWithoutThinking,
  getTimeoutMSByModel,
  isVisionModel,
} from "@/app/utils";
import { fetch } from "@/app/utils/stream";

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

interface RequestInput {
  messages: {
    role: "system" | "user" | "assistant";
    content: string | MultimodalContent[];
  }[];
}
interface RequestParam {
  result_format: string;
  incremental_output?: boolean;
  temperature: number;
  repetition_penalty?: number;
  top_p: number;
  max_tokens?: number;
}
interface RequestPayload {
  model: string;
  input: RequestInput;
  parameters: RequestParam;
}

export class QwenApi implements LLMApi {
  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";

    if (accessStore.useCustomConfig) {
      baseUrl = accessStore.alibabaUrl;
    }

    if (baseUrl.length === 0) {
      const isApp = !!getClientConfig()?.isApp;
      baseUrl = isApp ? ALIBABA_BASE_URL : ApiPath.Alibaba;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (!baseUrl.startsWith("http") && !baseUrl.startsWith(ApiPath.Alibaba)) {
      baseUrl = "https://" + baseUrl;
    }

    // console.log("[Proxy Endpoint] ", baseUrl, path);

    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    return res?.output?.choices?.at(0)?.message?.content ?? "";
  }

  speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }

  async chat(options: ChatOptions) {
    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
      },
    };

    const visionModel = isVisionModel(options.config.model);

    const messages: ChatOptions["messages"] = [];
    for (const v of options.messages) {
      const content = (
        visionModel
          ? await preProcessImageContentForAlibabaDashScope(v.content)
          : v.role === "assistant"
          ? getMessageTextContentWithoutThinking(v)
          : getMessageTextContent(v)
      ) as any;

      messages.push({ role: v.role, content });
    }

    const shouldStream = !!options.config.stream;
    const requestPayload: RequestPayload = {
      model: modelConfig.model,
      input: {
        messages,
      },
      parameters: {
        result_format: "message",
        incremental_output: shouldStream,
        temperature: modelConfig.temperature,
        // max_tokens: modelConfig.max_tokens,
        top_p: modelConfig.top_p === 1 ? 0.99 : modelConfig.top_p, // qwen top_p is should be < 1
      },
    };

    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const headers = {
        ...getHeaders(),
        "X-DashScope-SSE": shouldStream ? "enable" : "disable",
      };

      const chatPath = this.path(Alibaba.ChatPath(modelConfig.model));
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: headers,
      };

      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        getTimeoutMSByModel(options.config.model),
      );

      if (shouldStream) {
        // Lấy danh sách các công cụ (tools) và hàm (funcs) từ plugin hiện tại của phiên chat
        const [tools, funcs] = usePluginStore
          .getState()
          .getAsTools(
            useChatStore.getState().currentSession().mask?.plugin || [],
          );

        // Gọi hàm streamWithThink để xử lý chat dạng stream (dòng sự kiện server-sent events)
        // Hàm này hỗ trợ tính năng "thinking" (suy nghĩ) và tool calling cho AI
        return streamWithThink(
          chatPath, // Đường dẫn API endpoint
          requestPayload, // Dữ liệu request gửi đến server
          headers, // Headers cho request
          tools as any, // Danh sách các tools/plugins có thể sử dụng
          funcs, // Các hàm callback cho tools
          controller, // AbortController để hủy request nếu cần

          // ===== CALLBACK 1: SSE Parser =====
          // Hàm này xử lý từng dòng dữ liệu thô từ Server-Sent Events
          (text: string, runTools: ChatMessageTool[]) => {
            // text: Là một dòng dữ liệu thô từ SSE stream, thường có dạng "data: {...}"
            // runTools: Danh sách các tools đang được thực thi (nếu có)

            let json: any;
            try {
              // Parse dòng JSON từ SSE stream
              json = JSON.parse(text);
            } catch {
              // Nếu không parse được, trả về nội dung rỗng
              return { isThinking: false, content: "" };
            }

            // Trích xuất nội dung từ response format của Alibaba/Qwen
            const delta = json.choices?.[0]?.delta;
            const content = delta?.content ?? "";

            // Trả về object với:
            // - isThinking: false (không phải đang suy nghĩ)
            // - content: Nội dung text đã được parse
            return {
              isThinking: false,
              content,
            };
          },

          // ===== CALLBACK 2: Tool Call Handler =====
          // Hàm này xử lý khi AI muốn gọi tool/function
          (
            requestPayload: RequestPayload,
            toolCallMessage: any,
            toolCallResult: any[],
          ) => {
            // Thêm tool call message và kết quả vào payload để gửi lại server
            requestPayload?.input?.messages?.splice(
              requestPayload?.input?.messages?.length,
              0,
              toolCallMessage,
              ...toolCallResult,
            );
          },

          // ===== OPTIONS OBJECT =====
          {
            ...options,

            // ===== CALLBACK 3: onUpdate Handler =====
            // Hàm này được gọi mỗi khi có nội dung mới được xử lý
            onUpdate: (() => {
              // Closure để tạo accumulator nếu cần
              // let accumulated = "";

              // Trả về hàm xử lý thực tế
              return (chunk: string, fetchText?: string) => {
                // ========== GIẢI THÍCH CHI TIẾT chunk và fetchText ==========

                // CHUNK:
                // - Là phần nội dung TEXT ĐÃ ĐƯỢC XỬ LÝ từ SSE parser callback ở trên
                // - Đây là nội dung "sạch" đã được parse và extract từ JSON
                // - Ví dụ: "Xin chào", "Tôi có thể giúp gì", "..." (từng phần của câu trả lời)
                // - Chunk sẽ được tích lũy để tạo thành câu trả lời hoàn chỉnh
                // - Được sử dụng để hiển thị nội dung cho người dùng

                // FETCHTEXT:
                // - Là dữ liệu RAW/THÔNG TIN BỔ SUNG từ quá trình streaming
                // - Có thể chứa metadata, trạng thái, hoặc thông tin debug
                // - Thường không được hiển thị trực tiếp cho user
                // - Có thể là undefined hoặc empty string
                // - Được sử dụng cho logging, debugging, hoặc xử lý nâng cao

                // SO SÁNH:
                // chunk = Nội dung chính để hiển thị
                // fetchText = Thông tin phụ/metadata (thường cho debug)

                // console.log("CHUNK (nội dung chính):", chunk);
                // console.log("FETCHTEXT (metadata/debug):", fetchText);

                // Gọi callback gốc với chunk (nội dung chính) và fetchText (metadata)
                options.onUpdate?.(chunk, fetchText ?? "");
              };
            })(),

            // ===== CALLBACK 4: onFinish Handler =====
            // Được gọi khi stream hoàn thành
            onFinish: (final: string, res: any) => {
              // final: Toàn bộ nội dung đã được tích lũy
              // res: Response object từ server
              options.onFinish?.(final, res);
            },
          },
        );
      } else {
        const res = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        const message = this.extractMessage(resJson);
        options.onFinish(message, res);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }
  }
  async usage() {
    return {
      used: 0,
      total: 0,
    };
  }

  async models(): Promise<LLMModel[]> {
    return [];
  }
}
export { Alibaba };
