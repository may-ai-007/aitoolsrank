import { useState, useEffect } from 'react';

// 定义AI工具的数据结构
export interface AITool {
  id: string;
  rank: number;
  name: string;
  url: string;
  logo: string;
  description: string;
  monthly_visits: number;
  top_visits: number;
  top_region: string;
  tags: string[];
  growth: number;
  growth_rate: number;
  estimated_income: number;
  payment_platform?: string; // 添加支付平台字段
}

// 定义元数据结构
export interface Metadata {
  last_updated: string;
  ranking_type: string;
  language: string;
  total_items: number;
}

// 定义API响应的数据结构
export interface ApiResponse {
  metadata: Metadata;
  data: AITool[];
}

// 定义排名类型
export type RankingType = 'monthly_rank' | 'total_rank' | 'income_rank' | 'region_rank';

// 每次加载的数据条数
const PAGE_SIZE = 20;

// 尝试不同的数据路径
const DATA_PATHS = [
  './assets/data/{lang}/{type}.json',
  '/assets/data/{lang}/{type}.json',
  'assets/data/{lang}/{type}.json',
  './data/{lang}/{type}.json',
  '/data/{lang}/{type}.json',
  'data/{lang}/{type}.json'
];

/**
 * 加载AI工具排名数据的自定义Hook
 * @param rankingType 排名类型
 * @param language 语言
 * @returns 数据、加载状态、错误信息、加载更多函数和是否有更多数据
 */
export const useAIToolsData = (rankingType: RankingType, language: string) => {
  const [data, setData] = useState<AITool[]>([]);
  const [allData, setAllData] = useState<AITool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [dataPath, setDataPath] = useState<string>(`./assets/data/${language}/${rankingType}.json`);
  const [attemptedPaths, setAttemptedPaths] = useState<string[]>([]);

  // 加载数据
  useEffect(() => {
    let isMounted = true; // 添加一个标志来跟踪组件是否仍然挂载
    
    // 更新数据路径
    const newDataPath = `./assets/data/${language}/${rankingType}.json`;
    if (dataPath !== newDataPath) {
      setDataPath(newDataPath);
    }
    
    const fetchData = async () => {
      // 如果组件已卸载或者没有有效的排名类型或语言，则不执行任何操作
      if (!isMounted || !rankingType || !language) {
        return;
      }
      
      setLoading(true);
      setError(null);
      setPage(1);
      setAttemptedPaths([]);
      
      // 尝试不同的数据路径
      let loaded = false;
      const paths = DATA_PATHS.map(p => 
        p.replace('{lang}', language).replace('{type}', rankingType)
      );
      
      for (const path of paths) {
        if (loaded) break;
        
        try {
          console.log(`尝试加载数据: ${path}`);
          setAttemptedPaths(prev => [...prev, path]);
          
          // 获取数据
          const response = await fetch(path);
          if (!response.ok) {
            console.warn(`路径 ${path} 加载失败: ${response.status} ${response.statusText}`);
            continue;
          }
          
          const result: ApiResponse = await response.json();
          
          // 确保组件仍然挂载
          if (!isMounted) return;
          
          console.log(`成功从 ${path} 加载数据`);
          
          // 保存元数据
          setMetadata(result.metadata);
          
          // 保存所有数据
          setAllData(result.data);
          
          // 只显示第一页数据
          setData(result.data.slice(0, PAGE_SIZE));
          
          // 判断是否有更多数据
          setHasMore(result.data.length > PAGE_SIZE);
          
          loaded = true;
        } catch (err) {
          console.warn(`尝试路径 ${path} 时出错:`, err);
        }
      }
      
      if (!loaded && isMounted) {
        setError(`无法加载数据。尝试了以下路径: ${paths.join(', ')}`);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [rankingType, language]);

  // 加载更多数据
  const loadMore = () => {
    if (loading || !hasMore) return;
    
    const nextPage = page + 1;
    const start = page * PAGE_SIZE;
    const end = nextPage * PAGE_SIZE;
    
    // 从已加载的所有数据中获取下一页
    const nextPageData = allData.slice(start, end);
    
    if (nextPageData.length > 0) {
      setData(prevData => [...prevData, ...nextPageData]);
      setPage(nextPage);
      setHasMore(end < allData.length);
    } else {
      setHasMore(false);
    }
  };

  return { data, loading, error, loadMore, hasMore, metadata, attemptedPaths };
};

/**
 * 过滤工具数据
 * @param tools 工具数据
 * @param searchTerm 搜索词
 * @param selectedTags 选择的标签
 * @returns 过滤后的工具数据
 */
export const filterTools = (tools: AITool[], searchTerm: string, selectedTags: string[]): AITool[] => {
  if (!searchTerm && selectedTags.length === 0) {
    return tools;
  }
  
  return tools.filter(tool => {
    // 搜索词过滤
    const matchesSearch = !searchTerm || 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 标签过滤
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => tool.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });
};

/**
 * 格式化数字，添加千位分隔符
 * @param value 数值
 * @param language 当前语言
 * @returns 格式化后的字符串
 */
export const formatNumber = (value: number, language: string = 'en'): string => {
  const isChinese = language === 'zh';
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 100000000) { // 1亿/1B
    return isChinese 
      ? `${sign}${(absValue / 100000000).toFixed(1)}亿`
      : `${sign}${(absValue / 1000000000).toFixed(1)}B`;
  } else if (absValue >= 1000000) { // 1百万/1M
    return isChinese 
      ? `${sign}${(absValue / 1000000).toFixed(1)}百万`
      : `${sign}${(absValue / 1000000).toFixed(1)}M`;
  } else {
    return new Intl.NumberFormat().format(value);
  }
};

/**
 * 格式化增长率
 * @param rate 增长率
 * @returns 格式化后的字符串
 */
export const formatGrowthRate = (rate: number): string => {
  return `${(rate * 100).toFixed(1)}%`;
};

/**
 * 格式化收入
 * @param income 收入
 * @returns 格式化后的字符串
 */
export const formatIncome = (income: number): string => {
  if (income >= 1000000) {
    return `$${(income / 1000000).toFixed(1)}M`;
  } else if (income >= 1000) {
    return `$${(income / 1000).toFixed(1)}K`;
  } else {
    return `$${income}`;
  }
}; 