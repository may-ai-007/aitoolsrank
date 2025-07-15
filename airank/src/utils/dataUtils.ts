import { useState, useEffect, useMemo } from 'react';
import { getInlineData } from './inlineData';

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
  top_region_value: number;
  region_monthly_visits?: number; // Added for region_rank type
  tags: string[];
  growth: number;
  growth_rate: number;
  estimated_income: number;
  payment_platform?: string[] | string; // 支持数组或字符串格式的支付平台
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
  'data/{lang}/{type}.json',
  '../data/{lang}/{type}.json',
  '../../data/{lang}/{type}.json',
  './src/data/{lang}/{type}.json',
  '/src/data/{lang}/{type}.json',
  'src/data/{lang}/{type}.json',
  './{lang}/{type}.json',
  '/{lang}/{type}.json',
  '{lang}/{type}.json'
];

// 数据缓存对象
const dataCache: Record<string, {
  data: AITool[];
  metadata: any;
  timestamp: number;
}> = {};

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟

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
  const [isUsingInlineData, setIsUsingInlineData] = useState<boolean>(false);

  // 生成缓存键
  const cacheKey = useMemo(() => `${language}_${rankingType}`, [language, rankingType]);

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
      
      // 检查缓存
      const now = Date.now();
      const cachedData = dataCache[cacheKey];
      if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRY)) {
        console.log(`使用缓存数据: ${cacheKey}`);
        setAllData(cachedData.data);
        setData(cachedData.data.slice(0, PAGE_SIZE));
        setHasMore(cachedData.data.length > PAGE_SIZE);
        setMetadata(cachedData.metadata);
        setLoading(false);
        return;
      }
      
      setPage(1);
      setAttemptedPaths([]);
      setIsUsingInlineData(false);
      
      // 尝试不同的数据路径
      let loaded = false;
      const paths = DATA_PATHS.map(p => 
        p.replace('{lang}', language).replace('{type}', rankingType)
      );
      
      console.log(`开始尝试加载数据，排名类型: ${rankingType}, 语言: ${language}`);
      
      // 首先尝试使用内联数据（提高速度）
      try {
        console.log('优先尝试使用内联数据');
        const inlineResult = getInlineData(language, rankingType);
        
        // 保存元数据
        setMetadata(inlineResult.metadata);
        
        // 保存所有数据
        setAllData(inlineResult.data);
        
        // 只显示第一页数据
        setData(inlineResult.data.slice(0, PAGE_SIZE));
        
        // 判断是否有更多数据
        setHasMore(inlineResult.data.length > PAGE_SIZE);
        
        setIsUsingInlineData(true);
        loaded = true;
        
        // 缓存数据
        dataCache[cacheKey] = {
          data: inlineResult.data,
          metadata: inlineResult.metadata,
          timestamp: now
        };
        
        console.log('成功加载内联数据');
        
        // 在后台继续尝试加载外部数据
        setTimeout(() => {
          loadExternalData(paths, cacheKey);
        }, 100);
        
      } catch (inlineError) {
        console.error('加载内联数据时出错:', inlineError);
        // 继续尝试加载外部数据
      }
      
      // 如果内联数据加载失败，尝试加载外部数据
      if (!loaded) {
        await loadExternalData(paths, cacheKey);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };
    
    // 加载外部数据的函数
    const loadExternalData = async (paths: string[], cacheKey: string) => {
      let loaded = false;
      
      // 首先尝试加载本地JSON文件（如果存在）
      try {
        console.log(`尝试直接加载本地JSON文件: src/data/${language}/${rankingType}.json`);
        const localPath = `src/data/${language}/${rankingType}.json`;
        setAttemptedPaths(prev => [...prev, localPath]);
        
        const response = await fetch(localPath, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log(`本地路径 ${localPath} 的状态码: ${response.status}`);
        
        if (response.ok) {
          const text = await response.text();
          const result: ApiResponse = JSON.parse(text);
          
          if (!isMounted) return;
          
          console.log(`成功从本地路径 ${localPath} 加载数据`);
          
          setMetadata(result.metadata);
          setAllData(result.data);
          setData(result.data.slice(0, PAGE_SIZE));
          setHasMore(result.data.length > PAGE_SIZE);
          
          // 缓存数据
          dataCache[cacheKey] = {
            data: result.data,
            metadata: result.metadata,
            timestamp: Date.now()
          };
          
          loaded = true;
        } else {
          console.warn(`本地路径 ${localPath} 加载失败: ${response.status}`);
        }
      } catch (localErr) {
        console.warn(`尝试加载本地JSON文件时出错:`, localErr);
      }
      
      // 如果本地加载失败，尝试其他路径
      if (!loaded) {
        for (const path of paths) {
          if (loaded) break;
          
          try {
            console.log(`尝试加载数据: ${path}`);
            setAttemptedPaths(prev => [...prev, path]);
            
            // 获取数据
            const response = await fetch(path, {
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
              }
            });
            
            console.log(`路径 ${path} 的状态码: ${response.status}`);
            
            if (!response.ok) {
              console.warn(`路径 ${path} 加载失败: ${response.status} ${response.statusText}`);
              continue;
            }
            
            // 记录响应的内容类型
            const contentType = response.headers.get('content-type');
            console.log(`路径 ${path} 的内容类型: ${contentType}`);
            
            // 获取响应文本
            const text = await response.text();
            
            // 记录响应的前100个字符，用于调试
            console.log(`路径 ${path} 的响应前100个字符: ${text.substring(0, 100)}`);
            
            try {
              // 尝试解析JSON
              const result: ApiResponse = JSON.parse(text);
              
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
              
              // 缓存数据
              dataCache[cacheKey] = {
                data: result.data,
                metadata: result.metadata,
                timestamp: Date.now()
              };
              
              loaded = true;
              break;
            } catch (parseError) {
              console.error(`解析路径 ${path} 的JSON时出错:`, parseError);
              console.error(`响应文本: ${text}`);
              continue;
            }
          } catch (err) {
            console.warn(`尝试路径 ${path} 时出错:`, err);
          }
        }
      }
      
      if (!loaded && isMounted) {
        setError(`无法加载数据。尝试了以下路径: ${paths.join(', ')}`);
      }
    };
    
    fetchData();
    
    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [rankingType, language, cacheKey]);

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

  return { 
    data, 
    loading, 
    error, 
    loadMore, 
    hasMore, 
    metadata, 
    attemptedPaths, 
    isUsingInlineData 
  };
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
 * 格式化数字，根据语言添加单位（百万、亿或M、B）
 * @param value 数值
 * @param language 当前语言
 * @returns 格式化后的字符串
 */
export const formatNumber = (value: number, language: string = 'en'): string => {
  if (value === undefined || value === null) {
    return '0';
  }
  
  try {
    const isZh = language === 'zh';
    const absValue = Math.abs(value);
    
    // 中文单位换算
    if (isZh) {
      if (absValue >= 100000000) { // 亿
        return `${(absValue / 100000000).toFixed(1)}亿`;
      } else if (absValue >= 10000) { // 万
        return `${(absValue / 10000).toFixed(1)}万`;
      } else {
        return new Intl.NumberFormat('zh-CN').format(absValue);
      }
    } 
    // 英文单位换算
    else {
      if (absValue >= 1000000000) { // Billion
        return `${(absValue / 1000000000).toFixed(1)}B`;
      } else if (absValue >= 1000000) { // Million
        return `${(absValue / 1000000).toFixed(1)}M`;
      } else if (absValue >= 1000) { // Thousand
        return `${(absValue / 1000).toFixed(1)}K`;
      } else {
        return new Intl.NumberFormat('en-US').format(absValue);
      }
    }
  } catch (error) {
    console.error('格式化数字时出错:', error);
    return value.toString();
  }
};

/**
 * 格式化增长率
 * @param rate 增长率
 * @returns 格式化后的字符串
 */
export const formatGrowthRate = (rate: number): string => {
  if (rate === undefined || rate === null) {
    return '0%';
  }
  
  const formattedRate = (rate * 100).toFixed(1);
  return `${formattedRate}%`;
};

/**
 * 格式化收入
 * @param income 收入
 * @returns 格式化后的字符串
 */
export const formatIncome = (income: number): string => {
  if (income === undefined || income === null) {
    return '$0';
  }
  
  if (income >= 1000000) {
    return `$${(income / 1000000).toFixed(1)}M`;
  } else if (income >= 1000) {
    return `$${(income / 1000).toFixed(1)}K`;
  } else {
    return `$${income}`;
  }
}; 

// 将transformRawData标记为导出函数，避免未使用警告
export const transformRawData = (rawData: any[]): AITool[] => {
  return rawData.map(item => {
    return {
      id: item.id?.toString() || '',
      rank: item.rank || 0,
      name: item.name || '',
      url: item.website || item.url || '',
      logo: item.logo || '', // 数据中已经有正确的logo字段
      description: item.description || '',
      monthly_visits: item.monthly_visits || 0,
      top_visits: item.top_visits || item.monthly_visits || 0,
      top_region: item.top_region || '',
      top_region_value: item.top_region_value || 0,
      region_monthly_visits: item.region_monthly_visits || 0, // Added for region_rank type
      tags: item.tags || item.categories || [],
      growth: typeof item.growth === 'number' ? item.growth : 0,
      growth_rate: typeof item.growth_rate === 'number' ? item.growth_rate : 0,
      estimated_income: item.estimated_income || 0,
      payment_platform: item.payment_platform || ''
    };
  });
};