import type { ApiResponse, RankingType } from './dataUtils';

// 内联数据
const enMonthlyRank: ApiResponse = {
  "metadata": {
    "last_updated": new Date().toISOString(),
    "ranking_type": "monthly_rank",
    "language": "en",
    "total_items": 10
  },
  "data": [
    {
      "id": "claude",
      "rank": 1,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://cdn.toolify.ai/logos/claude.webp",
      "description": "Claude is an AI assistant from Anthropic that helps with tasks via natural language.",
      "monthly_visits": 75000000,
      "top_visits": 150000000,
      "top_region": "United States",
      "top_region_value": 0.65,
      "tags": ["AI assistant", "Conversational AI", "Writing assistant"],
      "growth": 1.5,
      "growth_rate": 0.5,
      "estimated_income": 5000000
    },
    {
      "id": "gemini",
      "rank": 2,
      "name": "Gemini",
      "url": "https://gemini.google.com",
      "logo": "https://cdn.toolify.ai/logos/gemini.webp",
      "description": "Platform for building with Google's Gemini AI models.",
      "monthly_visits": 65000000,
      "top_visits": 130000000,
      "top_region": "United States",
      "top_region_value": 0.58,
      "tags": ["AI assistant", "Google AI", "Productivity tool"],
      "growth": 2.0,
      "growth_rate": 1.0,
      "estimated_income": 4500000
    },
    {
      "id": "chatgpt",
      "rank": 3,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://cdn.toolify.ai/logos/chatgpt.webp",
      "description": "ChatGPT is a large language model chatbot developed by OpenAI.",
      "monthly_visits": 60000000,
      "top_visits": 120000000,
      "top_region": "United States",
      "top_region_value": 0.6,
      "tags": ["AI assistant", "Conversational AI", "OpenAI"],
      "growth": 1.2,
      "growth_rate": 0.2,
      "estimated_income": 6000000
    }
  ]
};

const enTotalRank: ApiResponse = {
  "metadata": {
    "last_updated": new Date().toISOString(),
    "ranking_type": "total_rank",
    "language": "en",
    "total_items": 10
  },
  "data": [
    {
      "id": "chatgpt",
      "rank": 1,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://cdn.toolify.ai/logos/chatgpt.webp",
      "description": "ChatGPT is a large language model chatbot developed by OpenAI.",
      "monthly_visits": 150000000,
      "top_visits": 300000000,
      "top_region": "United States",
      "top_region_value": 0.6,
      "tags": ["AI assistant", "Conversational AI", "OpenAI"],
      "growth": 1.1,
      "growth_rate": 0.1,
      "estimated_income": 8000000
    },
    {
      "id": "claude",
      "rank": 2,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://cdn.toolify.ai/logos/claude.webp",
      "description": "Claude is an AI assistant from Anthropic that helps with tasks via natural language.",
      "monthly_visits": 120000000,
      "top_visits": 240000000,
      "top_region": "United States",
      "top_region_value": 0.65,
      "tags": ["AI assistant", "Conversational AI", "Writing assistant"],
      "growth": 1.3,
      "growth_rate": 0.3,
      "estimated_income": 6000000
    },
    {
      "id": "gemini",
      "rank": 3,
      "name": "Gemini",
      "url": "https://gemini.google.com",
      "logo": "https://cdn.toolify.ai/logos/gemini.webp",
      "description": "Platform for building with Google's Gemini AI models.",
      "monthly_visits": 100000000,
      "top_visits": 200000000,
      "top_region": "United States",
      "top_region_value": 0.58,
      "tags": ["AI assistant", "Google AI", "Productivity tool"],
      "growth": 1.8,
      "growth_rate": 0.8,
      "estimated_income": 5500000
    }
  ]
};

const enIncomeRank: ApiResponse = {
  "metadata": {
    "last_updated": new Date().toISOString(),
    "ranking_type": "income_rank",
    "language": "en",
    "total_items": 10
  },
  "data": [
    {
      "id": "chatgpt",
      "rank": 1,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://cdn.toolify.ai/logos/chatgpt.webp",
      "description": "ChatGPT is a large language model chatbot developed by OpenAI.",
      "monthly_visits": 60000000,
      "top_visits": 120000000,
      "top_region": "United States",
      "top_region_value": 0.6,
      "tags": ["AI assistant", "Conversational AI", "OpenAI"],
      "growth": 1.2,
      "growth_rate": 0.2,
      "estimated_income": 8000000,
      "payment_platform": "Stripe"
    },
    {
      "id": "claude",
      "rank": 2,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://cdn.toolify.ai/logos/claude.webp",
      "description": "Claude is an AI assistant from Anthropic that helps with tasks via natural language.",
      "monthly_visits": 75000000,
      "top_visits": 150000000,
      "top_region": "United States",
      "top_region_value": 0.65,
      "tags": ["AI assistant", "Conversational AI", "Writing assistant"],
      "growth": 1.5,
      "growth_rate": 0.5,
      "estimated_income": 6000000,
      "payment_platform": "Stripe, PayPal"
    },
    {
      "id": "gemini",
      "rank": 3,
      "name": "Gemini",
      "url": "https://gemini.google.com",
      "logo": "https://cdn.toolify.ai/logos/gemini.webp",
      "description": "Platform for building with Google's Gemini AI models.",
      "monthly_visits": 65000000,
      "top_visits": 130000000,
      "top_region": "United States",
      "top_region_value": 0.58,
      "tags": ["AI assistant", "Google AI", "Productivity tool"],
      "growth": 2.0,
      "growth_rate": 1.0,
      "estimated_income": 5500000,
      "payment_platform": "Google Pay"
    }
  ]
};

const enRegionRank: ApiResponse = {
  "metadata": {
    "last_updated": new Date().toISOString(),
    "ranking_type": "region_rank",
    "language": "en",
    "total_items": 10
  },
  "data": [
    {
      "id": "claude_us",
      "rank": 1,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://cdn.toolify.ai/logos/claude.webp",
      "description": "Claude is an AI assistant from Anthropic that helps with tasks via natural language.",
      "monthly_visits": 75000000,
      "top_visits": 150000000,
      "top_region": "United States",
      "top_region_value": 0.65,
      "region_monthly_visits": 48750000,
      "region": "US",
      "tags": ["AI assistant", "Conversational AI", "Writing assistant"],
      "growth": 1.5,
      "growth_rate": 0.5,
      "estimated_income": 5000000
    },
    {
      "id": "gemini_us",
      "rank": 2,
      "name": "Gemini",
      "url": "https://gemini.google.com",
      "logo": "https://cdn.toolify.ai/logos/gemini.webp",
      "description": "Platform for building with Google's Gemini AI models.",
      "monthly_visits": 65000000,
      "top_visits": 130000000,
      "top_region": "United States",
      "top_region_value": 0.58,
      "region_monthly_visits": 37700000,
      "region": "US",
      "tags": ["AI assistant", "Google AI", "Productivity tool"],
      "growth": 2.0,
      "growth_rate": 1.0,
      "estimated_income": 4500000
    },
    {
      "id": "chatgpt_us",
      "rank": 3,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://cdn.toolify.ai/logos/chatgpt.webp",
      "description": "ChatGPT is a large language model chatbot developed by OpenAI.",
      "monthly_visits": 60000000,
      "top_visits": 120000000,
      "top_region": "United States",
      "top_region_value": 0.6,
      "region_monthly_visits": 36000000,
      "region": "US",
      "tags": ["AI assistant", "Conversational AI", "OpenAI"],
      "growth": 1.2,
      "growth_rate": 0.2,
      "estimated_income": 6000000
    },
    {
      "id": "claude_cn",
      "rank": 1,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://cdn.toolify.ai/logos/claude.webp",
      "description": "Claude is an AI assistant from Anthropic that helps with tasks via natural language.",
      "monthly_visits": 75000000,
      "top_visits": 150000000,
      "top_region": "China",
      "top_region_value": 0.15,
      "region_monthly_visits": 11250000,
      "region": "CN",
      "tags": ["AI assistant", "Conversational AI", "Writing assistant"],
      "growth": 2.5,
      "growth_rate": 1.5,
      "estimated_income": 3000000
    },
    {
      "id": "gemini_cn",
      "rank": 2,
      "name": "Gemini",
      "url": "https://gemini.google.com",
      "logo": "https://cdn.toolify.ai/logos/gemini.webp",
      "description": "Platform for building with Google's Gemini AI models.",
      "monthly_visits": 65000000,
      "top_visits": 130000000,
      "top_region": "China",
      "top_region_value": 0.12,
      "region_monthly_visits": 7800000,
      "region": "CN",
      "tags": ["AI assistant", "Google AI", "Productivity tool"],
      "growth": 3.0,
      "growth_rate": 2.0,
      "estimated_income": 2500000
    },
    {
      "id": "chatgpt_jp",
      "rank": 1,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://cdn.toolify.ai/logos/chatgpt.webp",
      "description": "ChatGPT is a large language model chatbot developed by OpenAI.",
      "monthly_visits": 60000000,
      "top_visits": 120000000,
      "top_region": "Japan",
      "top_region_value": 0.2,
      "region_monthly_visits": 12000000,
      "region": "JP",
      "tags": ["AI assistant", "Conversational AI", "OpenAI"],
      "growth": 1.8,
      "growth_rate": 0.8,
      "estimated_income": 3500000
    }
  ]
};

// 中文数据
const zhMonthlyRank: ApiResponse = {
  "metadata": {
    "last_updated": new Date().toISOString(),
    "ranking_type": "monthly_rank",
    "language": "zh",
    "total_items": 10
  },
  "data": [
    {
      "id": "claude",
      "rank": 1,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://cdn.toolify.ai/logos/claude.webp",
      "description": "Claude 是来自 Anthropic 的人工智能助手，通过自然语言帮助完成任务。",
      "monthly_visits": 75000000,
      "top_visits": 150000000,
      "top_region": "美国",
      "top_region_value": 0.65,
      "tags": ["AI助手", "对话AI", "写作助手"],
      "growth": 1.5,
      "growth_rate": 0.5,
      "estimated_income": 5000000
    },
    {
      "id": "gemini",
      "rank": 2,
      "name": "Gemini",
      "url": "https://gemini.google.com",
      "logo": "https://cdn.toolify.ai/logos/gemini.webp",
      "description": "构建Google的Gemini AI模型的平台。",
      "monthly_visits": 65000000,
      "top_visits": 130000000,
      "top_region": "美国",
      "top_region_value": 0.58,
      "tags": ["AI助手", "谷歌AI", "生产力工具"],
      "growth": 2.0,
      "growth_rate": 1.0,
      "estimated_income": 4500000
    },
    {
      "id": "chatgpt",
      "rank": 3,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://cdn.toolify.ai/logos/chatgpt.webp",
      "description": "ChatGPT 是由 OpenAI 开发的大型语言模型聊天机器人。",
      "monthly_visits": 60000000,
      "top_visits": 120000000,
      "top_region": "美国",
      "top_region_value": 0.6,
      "tags": ["AI助手", "对话AI", "OpenAI"],
      "growth": 1.2,
      "growth_rate": 0.2,
      "estimated_income": 6000000
    }
  ]
};

const zhTotalRank: ApiResponse = {
  "metadata": {
    "last_updated": new Date().toISOString(),
    "ranking_type": "total_rank",
    "language": "zh",
    "total_items": 10
  },
  "data": [
    {
      "id": "chatgpt",
      "rank": 1,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://cdn.toolify.ai/logos/chatgpt.webp",
      "description": "ChatGPT 是由 OpenAI 开发的大型语言模型聊天机器人。",
      "monthly_visits": 150000000,
      "top_visits": 300000000,
      "top_region": "美国",
      "top_region_value": 0.6,
      "tags": ["AI助手", "对话AI", "OpenAI"],
      "growth": 1.1,
      "growth_rate": 0.1,
      "estimated_income": 8000000
    },
    {
      "id": "claude",
      "rank": 2,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://cdn.toolify.ai/logos/claude.webp",
      "description": "Claude 是来自 Anthropic 的人工智能助手，通过自然语言帮助完成任务。",
      "monthly_visits": 120000000,
      "top_visits": 240000000,
      "top_region": "美国",
      "top_region_value": 0.65,
      "tags": ["AI助手", "对话AI", "写作助手"],
      "growth": 1.3,
      "growth_rate": 0.3,
      "estimated_income": 6000000
    },
    {
      "id": "gemini",
      "rank": 3,
      "name": "Gemini",
      "url": "https://gemini.google.com",
      "logo": "https://cdn.toolify.ai/logos/gemini.webp",
      "description": "构建Google的Gemini AI模型的平台。",
      "monthly_visits": 100000000,
      "top_visits": 200000000,
      "top_region": "美国",
      "top_region_value": 0.58,
      "tags": ["AI助手", "谷歌AI", "生产力工具"],
      "growth": 1.8,
      "growth_rate": 0.8,
      "estimated_income": 5500000
    }
  ]
};

const zhIncomeRank: ApiResponse = {
  "metadata": {
    "last_updated": new Date().toISOString(),
    "ranking_type": "income_rank",
    "language": "zh",
    "total_items": 10
  },
  "data": [
    {
      "id": "chatgpt",
      "rank": 1,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://cdn.toolify.ai/logos/chatgpt.webp",
      "description": "ChatGPT 是由 OpenAI 开发的大型语言模型聊天机器人。",
      "monthly_visits": 60000000,
      "top_visits": 120000000,
      "top_region": "美国",
      "top_region_value": 0.6,
      "tags": ["AI助手", "对话AI", "OpenAI"],
      "growth": 1.2,
      "growth_rate": 0.2,
      "estimated_income": 8000000,
      "payment_platform": "Stripe"
    },
    {
      "id": "claude",
      "rank": 2,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://cdn.toolify.ai/logos/claude.webp",
      "description": "Claude 是来自 Anthropic 的人工智能助手，通过自然语言帮助完成任务。",
      "monthly_visits": 75000000,
      "top_visits": 150000000,
      "top_region": "美国",
      "top_region_value": 0.65,
      "tags": ["AI助手", "对话AI", "写作助手"],
      "growth": 1.5,
      "growth_rate": 0.5,
      "estimated_income": 6000000,
      "payment_platform": "Stripe, PayPal"
    },
    {
      "id": "gemini",
      "rank": 3,
      "name": "Gemini",
      "url": "https://gemini.google.com",
      "logo": "https://cdn.toolify.ai/logos/gemini.webp",
      "description": "构建Google的Gemini AI模型的平台。",
      "monthly_visits": 65000000,
      "top_visits": 130000000,
      "top_region": "美国",
      "top_region_value": 0.58,
      "tags": ["AI助手", "谷歌AI", "生产力工具"],
      "growth": 2.0,
      "growth_rate": 1.0,
      "estimated_income": 5500000,
      "payment_platform": "Google Pay"
    }
  ]
};

const zhRegionRank: ApiResponse = {
  "metadata": {
    "last_updated": new Date().toISOString(),
    "ranking_type": "region_rank",
    "language": "zh",
    "total_items": 10
  },
  "data": [
    {
      "id": "claude_us",
      "rank": 1,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://cdn.toolify.ai/logos/claude.webp",
      "description": "Claude 是来自 Anthropic 的人工智能助手，通过自然语言帮助完成任务。",
      "monthly_visits": 75000000,
      "top_visits": 150000000,
      "top_region": "美国",
      "top_region_value": 0.65,
      "region_monthly_visits": 48750000,
      "region": "US",
      "tags": ["AI助手", "对话AI", "写作助手"],
      "growth": 1.5,
      "growth_rate": 0.5,
      "estimated_income": 5000000
    },
    {
      "id": "gemini_us",
      "rank": 2,
      "name": "Gemini",
      "url": "https://gemini.google.com",
      "logo": "https://cdn.toolify.ai/logos/gemini.webp",
      "description": "构建Google的Gemini AI模型的平台。",
      "monthly_visits": 65000000,
      "top_visits": 130000000,
      "top_region": "美国",
      "top_region_value": 0.58,
      "region_monthly_visits": 37700000,
      "region": "US",
      "tags": ["AI助手", "谷歌AI", "生产力工具"],
      "growth": 2.0,
      "growth_rate": 1.0,
      "estimated_income": 4500000
    },
    {
      "id": "chatgpt_us",
      "rank": 3,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://cdn.toolify.ai/logos/chatgpt.webp",
      "description": "ChatGPT 是由 OpenAI 开发的大型语言模型聊天机器人。",
      "monthly_visits": 60000000,
      "top_visits": 120000000,
      "top_region": "美国",
      "top_region_value": 0.6,
      "region_monthly_visits": 36000000,
      "region": "US",
      "tags": ["AI助手", "对话AI", "OpenAI"],
      "growth": 1.2,
      "growth_rate": 0.2,
      "estimated_income": 6000000
    },
    {
      "id": "claude_cn",
      "rank": 1,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://cdn.toolify.ai/logos/claude.webp",
      "description": "Claude 是来自 Anthropic 的人工智能助手，通过自然语言帮助完成任务。",
      "monthly_visits": 75000000,
      "top_visits": 150000000,
      "top_region": "中国",
      "top_region_value": 0.15,
      "region_monthly_visits": 11250000,
      "region": "CN",
      "tags": ["AI助手", "对话AI", "写作助手"],
      "growth": 2.5,
      "growth_rate": 1.5,
      "estimated_income": 3000000
    },
    {
      "id": "gemini_cn",
      "rank": 2,
      "name": "Gemini",
      "url": "https://gemini.google.com",
      "logo": "https://cdn.toolify.ai/logos/gemini.webp",
      "description": "构建Google的Gemini AI模型的平台。",
      "monthly_visits": 65000000,
      "top_visits": 130000000,
      "top_region": "中国",
      "top_region_value": 0.12,
      "region_monthly_visits": 7800000,
      "region": "CN",
      "tags": ["AI助手", "谷歌AI", "生产力工具"],
      "growth": 3.0,
      "growth_rate": 2.0,
      "estimated_income": 2500000
    },
    {
      "id": "chatgpt_jp",
      "rank": 1,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://cdn.toolify.ai/logos/chatgpt.webp",
      "description": "ChatGPT 是由 OpenAI 开发的大型语言模型聊天机器人。",
      "monthly_visits": 60000000,
      "top_visits": 120000000,
      "top_region": "日本",
      "top_region_value": 0.2,
      "region_monthly_visits": 12000000,
      "region": "JP",
      "tags": ["AI助手", "对话AI", "OpenAI"],
      "growth": 1.8,
      "growth_rate": 0.8,
      "estimated_income": 3500000
    }
  ]
};

// 内联数据映射
const inlineData: Record<string, Record<string, ApiResponse>> = {
  'en': {
    'monthly_rank': enMonthlyRank,
    'total_rank': enTotalRank,
    'income_rank': enIncomeRank,
    'region_rank': enRegionRank
  },
  'zh': {
    'monthly_rank': zhMonthlyRank,
    'total_rank': zhTotalRank,
    'income_rank': zhIncomeRank,
    'region_rank': zhRegionRank
  }
};

/**
 * 获取内联数据
 * @param language 语言
 * @param rankingType 排名类型
 * @returns 内联数据
 */
export const getInlineData = (language: string, rankingType: RankingType): ApiResponse => {
  if (
    !inlineData[language] || 
    !inlineData[language][rankingType]
  ) {
    // 如果没有找到对应语言和排名类型的数据，则使用英文数据作为备用
    return inlineData['en']['monthly_rank'];
  }
  
  return inlineData[language][rankingType];
}; 