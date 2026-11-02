// app/api/chat/route.ts
import { siteConfig } from '../../../siteConfig'; // 确保这里的路径指向你的 siteConfig

export const runtime = 'edge';

export async function POST(req: Request) {
  console.log("🚀 [1/5] 路由进入：开始对接 Gemini 3 脑回路");

  try {
    const { message, systemPrompt, history } = await req.json();
    const text = String(message ?? '').trim();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400 });
    }

    // 允许宠物传入自己的人设；没传就继续用全站默认的煤球人设。
    const systemText =
      typeof systemPrompt === 'string' && systemPrompt.trim()
        ? systemPrompt.trim()
        : siteConfig.geminiConfig.systemPrompt;

    // 把最近几轮对话转成 Gemini 的 contents；旧客户端不传 history，行为不变。
    const pastMessages = Array.isArray(history)
      ? history
          .filter((item: any) => item && typeof item.content === 'string' && item.content.trim())
          .slice(-10)
          .map((item: any) => ({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: item.content }],
          }))
      : [];

    const contents = [...pastMessages, { role: 'user', parts: [{ text }] }];

    // 🌟 纯粹靠环境变量读取 API Key
    const apiKey = (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '').trim();

    if (!apiKey) {
      console.error("❌ 找不到 API Key");
      return new Response(JSON.stringify({ error: "Key missing" }), { status: 500 });
    }

    // 调用 siteConfig 的参数
    const modelId = siteConfig.geminiConfig.modelId;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    console.log(`📡 [2/5] 正在呼叫模型: ${modelId}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: systemText
          }]
        },
        contents,
        generationConfig: {
          maxOutputTokens: siteConfig.geminiConfig.maxOutputTokens,
          temperature: siteConfig.geminiConfig.temperature,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("🚨 Gemini 3 拒绝了请求:", JSON.stringify(data));
      return new Response(JSON.stringify({
        error: `模型拒绝访问: ${response.status}`,
        details: data.error?.message || "未知错误"
      }), { status: response.status });
    }

    console.log("✅ [3/5] Google 成功响应");
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "本喵现在不想理你喵...";

    console.log("🎉 [4/5] 回复已生成，准备传回前端");

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("🔥 [5/5] 运行时崩溃:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: "Ready", model: "Gemini 3 Flash Preview" }), { status: 200 });
}