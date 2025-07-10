// 内联测试数据，用于在无法加载外部数据文件时使用
import type { ApiResponse } from './dataUtils';

// 创建基础测试数据模板
function createBaseData(rankingType: string, language: string): ApiResponse {
  const isZh = language === 'zh';
  
  return {
    "metadata": {
      "last_updated": new Date().toISOString(),
      "ranking_type": rankingType,
      "language": language,
      "total_items": 10
    },
    "data": [
      {
        "id": "1",
        "rank": 1,
        "name": "ChatGPT",
        "url": "https://chat.openai.com",
        "logo": "https://example.com/chatgpt.png",
        "description": isZh ? "ChatGPT 是由 OpenAI 开发的大型语言模型。" : "ChatGPT is a large language model developed by OpenAI.",
        "monthly_visits": 1500000000,
        "top_visits": 2000000000,
        "top_region": isZh ? "美国" : "United States",
        "tags": isZh ? ["AI", "聊天机器人", "语言模型"] : ["AI", "Chatbot", "Language Model"],
        "growth": 0.15,
        "growth_rate": 0.15,
        "estimated_income": 100000000
      },
      {
        "id": "2",
        "rank": 2,
        "name": "Claude",
        "url": "https://claude.ai",
        "logo": "https://example.com/claude.png",
        "description": isZh ? "Claude 是 Anthropic 开发的下一代 AI 助手。" : "Claude is a next-generation AI assistant from Anthropic.",
        "monthly_visits": 800000000,
        "top_visits": 1000000000,
        "top_region": isZh ? "美国" : "United States",
        "tags": isZh ? ["AI", "聊天机器人", "语言模型"] : ["AI", "Chatbot", "Language Model"],
        "growth": 0.25,
        "growth_rate": 0.25,
        "estimated_income": 50000000
      },
      {
        "id": "3",
        "rank": 3,
        "name": isZh ? "文心一言" : "Gemini",
        "url": isZh ? "https://yiyan.baidu.com" : "https://gemini.google.com",
        "logo": isZh ? "https://example.com/wenxin.png" : "https://example.com/gemini.png",
        "description": isZh ? "文心一言是百度开发的人工智能语言模型。" : "Gemini is Google's most capable and general AI model.",
        "monthly_visits": 700000000,
        "top_visits": 900000000,
        "top_region": isZh ? "中国" : "United States",
        "tags": isZh ? ["AI", "聊天机器人", "语言模型"] : ["AI", "Chatbot", "Language Model"],
        "growth": 0.3,
        "growth_rate": 0.3,
        "estimated_income": 40000000
      },
      {
        "id": "4",
        "rank": 4,
        "name": isZh ? "通义千问" : "Midjourney",
        "url": isZh ? "https://tongyi.aliyun.com" : "https://midjourney.com",
        "logo": isZh ? "https://example.com/tongyi.png" : "https://example.com/midjourney.png",
        "description": isZh ? "通义千问是阿里巴巴开发的大型语言模型。" : "Midjourney is an AI image generation tool.",
        "monthly_visits": 500000000,
        "top_visits": 700000000,
        "top_region": isZh ? "中国" : "United States",
        "tags": isZh ? ["AI", "聊天机器人", "语言模型"] : ["AI", "Image Generation", "Art"],
        "growth": 0.2,
        "growth_rate": 0.2,
        "estimated_income": 30000000
      },
      {
        "id": "5",
        "rank": 5,
        "name": "DALL-E",
        "url": "https://openai.com/dall-e",
        "logo": "https://example.com/dalle.png",
        "description": isZh ? "DALL-E 是 OpenAI 开发的 AI 图像生成系统。" : "DALL-E is an AI system by OpenAI that creates images from text descriptions.",
        "monthly_visits": 400000000,
        "top_visits": 600000000,
        "top_region": isZh ? "美国" : "United States",
        "tags": isZh ? ["AI", "图像生成", "艺术"] : ["AI", "Image Generation", "Art"],
        "growth": 0.18,
        "growth_rate": 0.18,
        "estimated_income": 25000000
      },
      {
        "id": "6",
        "rank": 6,
        "name": isZh ? "讯飞星火" : "Copilot",
        "url": isZh ? "https://xinghuo.xfyun.cn" : "https://github.com/features/copilot",
        "logo": isZh ? "https://example.com/xinghuo.png" : "https://example.com/copilot.png",
        "description": isZh ? "讯飞星火是科大讯飞开发的认知大模型。" : "GitHub Copilot is an AI pair programmer that helps you write better code.",
        "monthly_visits": 350000000,
        "top_visits": 500000000,
        "top_region": isZh ? "中国" : "United States",
        "tags": isZh ? ["AI", "聊天机器人", "语言模型"] : ["AI", "Code Generation", "Developer Tool"],
        "growth": 0.22,
        "growth_rate": 0.22,
        "estimated_income": 20000000
      },
      {
        "id": "7",
        "rank": 7,
        "name": isZh ? "Stable Diffusion" : "Stable Diffusion",
        "url": "https://stability.ai",
        "logo": "https://example.com/stablediffusion.png",
        "description": isZh ? "Stable Diffusion 是一个 AI 艺术生成模型。" : "Stable Diffusion is an AI art generation model.",
        "monthly_visits": 300000000,
        "top_visits": 450000000,
        "top_region": isZh ? "美国" : "United States",
        "tags": isZh ? ["AI", "图像生成", "艺术"] : ["AI", "Image Generation", "Art"],
        "growth": 0.15,
        "growth_rate": 0.15,
        "estimated_income": 15000000
      },
      {
        "id": "8",
        "rank": 8,
        "name": isZh ? "智谱 ChatGLM" : "Jasper",
        "url": isZh ? "https://chatglm.cn" : "https://jasper.ai",
        "logo": isZh ? "https://example.com/chatglm.png" : "https://example.com/jasper.png",
        "description": isZh ? "ChatGLM 是智谱 AI 开发的对话语言模型。" : "Jasper is an AI content platform for marketing teams.",
        "monthly_visits": 250000000,
        "top_visits": 350000000,
        "top_region": isZh ? "中国" : "United States",
        "tags": isZh ? ["AI", "聊天机器人", "语言模型"] : ["AI", "Content Generation", "Marketing"],
        "growth": 0.12,
        "growth_rate": 0.12,
        "estimated_income": 12000000
      },
      {
        "id": "9",
        "rank": 9,
        "name": isZh ? "MidJourney" : "Grammarly",
        "url": isZh ? "https://midjourney.com" : "https://grammarly.com",
        "logo": isZh ? "https://example.com/midjourney.png" : "https://example.com/grammarly.png",
        "description": isZh ? "MidJourney 是一个 AI 图像生成工具。" : "Grammarly is an AI writing assistant.",
        "monthly_visits": 200000000,
        "top_visits": 300000000,
        "top_region": isZh ? "美国" : "United States",
        "tags": isZh ? ["AI", "图像生成", "艺术"] : ["AI", "Writing Assistant", "Grammar"],
        "growth": 0.08,
        "growth_rate": 0.08,
        "estimated_income": 10000000
      },
      {
        "id": "10",
        "rank": 10,
        "name": isZh ? "Copilot" : "Notion AI",
        "url": isZh ? "https://github.com/features/copilot" : "https://notion.so",
        "logo": isZh ? "https://example.com/copilot.png" : "https://example.com/notion.png",
        "description": isZh ? "GitHub Copilot 是一个 AI 编程助手。" : "Notion AI helps you write, edit, summarize, and more.",
        "monthly_visits": 180000000,
        "top_visits": 250000000,
        "top_region": isZh ? "美国" : "United States",
        "tags": isZh ? ["AI", "代码生成", "开发工具"] : ["AI", "Productivity", "Writing Assistant"],
        "growth": 0.1,
        "growth_rate": 0.1,
        "estimated_income": 9000000
      }
    ]
  };
}

// 创建一个映射，根据语言和排名类型返回相应的数据
export const getInlineData = (language: string, rankingType: string): ApiResponse => {
  console.log(`获取内联数据: 语言=${language}, 排名类型=${rankingType}`);
  
  // 为所有排名类型提供内联数据
  return createBaseData(rankingType, language);
}; 