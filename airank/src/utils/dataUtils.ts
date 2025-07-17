import { useState, useEffect, useMemo, useRef } from 'react';
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
  region?: string; // 添加 region 字段，用于标识数据所属的地区
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
  '/data/{lang}/{type}.json',  // 添加以根目录开始的路径
  './assets/data/{lang}/{type}.json',
  '/assets/data/{lang}/{type}.json',
  'assets/data/{lang}/{type}.json',
  './data/{lang}/{type}.json',
  'data/{lang}/{type}.json',
  '../data/{lang}/{type}.json',
  '../../data/{lang}/{type}.json',
  './src/data/{lang}/{type}.json',
  '/src/data/{lang}/{type}.json',
  'src/data/{lang}/{type}.json',
  './{lang}/{type}.json?t=' + Date.now(),  // 添加时间戳避免缓存问题
  '/{lang}/{type}.json?t=' + Date.now(),
  '{lang}/{type}.json?t=' + Date.now(),
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
export const useAIToolsData = (rankingType: RankingType, language: string, selectedRegion?: string) => {
  const [data, setData] = useState<AITool[]>([]);
  const [allData, setAllData] = useState<AITool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [dataPath, setDataPath] = useState<string>(`./assets/data/${language}/${rankingType}.json`);
  const [attemptedPaths, setAttemptedPaths] = useState<string[]>([]);
  const [isUsingInlineData, setIsUsingInlineData] = useState<boolean>(false);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  
  // 保存按地区分组的数据
  const [regionGroupedData, setRegionGroupedData] = useState<Record<string, AITool[]>>({});
  
  // 添加初始化完成标志
  const initializedRef = useRef<boolean>(false);
  const loadingRef = useRef<boolean>(false);

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
    
    // 切换rankingType时，重置数据状态
    setData([]);
    setAllData([]);
    setLoading(true);
    setError(null);
    setAttemptedPaths([]);
    setIsUsingInlineData(false);
    setHasMore(true);
    setDataLoaded(false);
    setRegionGroupedData({});
    initializedRef.current = false; // 重置初始化标志
    loadingRef.current = false; // 重置加载标志
    
    // 确保在组件挂载时设置初始化标志
    const initializeComponent = () => {
      if (isMounted) {
        initializedRef.current = true;
      }
    };
    
    const fetchData = async () => {
      // 如果组件已卸载或者没有有效的排名类型或语言，则不执行任何操作
      if (!isMounted || !rankingType || !language) {
        return;
      }
      
      // 检查缓存
      const now = Date.now();
      const cachedData = dataCache[cacheKey];
      if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRY)) {
        // 转换数据，确保region_monthly_visits字段正确处理
        const transformedData = transformRawData(cachedData.data);
        
        // 如果是地区分布榜，按地区分组数据
        if (rankingType === 'region_rank') {
          const groupedData = groupDataByRegion(transformedData);
          setRegionGroupedData(groupedData);
          
          // 如果有选中的地区，显示该地区的数据
          if (selectedRegion && groupedData[selectedRegion]) {
            setData(groupedData[selectedRegion].slice(0, PAGE_SIZE));
            setHasMore(groupedData[selectedRegion].length > PAGE_SIZE);
          } else {
            // 默认显示美国数据
            const defaultRegion = 'US';
            setData(groupedData[defaultRegion] ? groupedData[defaultRegion].slice(0, PAGE_SIZE) : []);
            setHasMore(groupedData[defaultRegion] ? groupedData[defaultRegion].length > PAGE_SIZE : false);
          }
        } else {
          // 其他榜单正常显示
          setData(transformedData.slice(0, PAGE_SIZE));
          setHasMore(transformedData.length > PAGE_SIZE);
        }
        
        setAllData(transformedData);
        setMetadata(cachedData.metadata);
        setLoading(false);
        setDataLoaded(true);
        
        // 设置初始化标志
        setTimeout(initializeComponent, 300);
        return;
      }
      
      setHasMore(true);
      
      // 尝试不同的数据路径
      let loaded = false;
      const paths = DATA_PATHS.map(p => 
        p.replace('{lang}', language).replace('{type}', rankingType)
      );
      
      // 首先尝试加载本地JSON文件（如果存在）
      try {
        const localPath = `src/data/${language}/${rankingType}.json`;
        setAttemptedPaths(prev => [...prev, localPath]);
        
        // 使用fetch API加载数据，添加更多选项
        const response = await fetch(localPath, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          credentials: 'same-origin',
          mode: 'cors'
        });
        
        if (response.ok) {
          const text = await response.text();
          
          // 检查文本是否为空
          if (!text || text.trim() === '') {
            throw new Error('Empty response');
          }
          
          // 尝试解析JSON，添加错误处理
          let result: ApiResponse;
          try {
            result = JSON.parse(text);
          } catch (parseError) {
            throw parseError;
          }
          
          if (!isMounted) return;
          
          // 保存元数据
          setMetadata(result.metadata);
          
          // 转换数据，确保region_monthly_visits字段正确处理
          const transformedData = transformRawData(result.data);
          
          // 如果是地区分布榜，按地区分组数据
          if (rankingType === 'region_rank') {
            const groupedData = groupDataByRegion(transformedData);
            setRegionGroupedData(groupedData);
            
            // 如果有选中的地区，显示该地区的数据
            if (selectedRegion && groupedData[selectedRegion]) {
              setData(groupedData[selectedRegion].slice(0, PAGE_SIZE));
              setHasMore(groupedData[selectedRegion].length > PAGE_SIZE);
            } else {
              // 默认显示美国数据
              const defaultRegion = 'US';
              setData(groupedData[defaultRegion] ? groupedData[defaultRegion].slice(0, PAGE_SIZE) : []);
              setHasMore(groupedData[defaultRegion] ? groupedData[defaultRegion].length > PAGE_SIZE : false);
            }
          } else {
            // 其他榜单正常显示
            setData(transformedData.slice(0, PAGE_SIZE));
            setHasMore(transformedData.length > PAGE_SIZE);
          }
          
          // 保存所有数据
          setAllData(transformedData);
          
          // 缓存数据
          dataCache[cacheKey] = {
            data: result.data, // 缓存原始数据
            metadata: result.metadata,
            timestamp: Date.now()
          };
          
          loaded = true;
          setDataLoaded(true);
          setLoading(false); // 确保设置loading为false
        } else {
          // 加载失败
        }
      } catch (localErr) {
        // 处理错误
      }
      
      // 如果本地加载失败，尝试其他路径
      if (!loaded) {
        for (const path of paths) {
          if (loaded) break;
          
          try {
            setAttemptedPaths(prev => [...prev, path]);
            
            // 获取数据
            const response = await fetch(path, {
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
              }
            });
            
            if (!response.ok) {
              continue;
            }
            
            // 获取响应文本
            const text = await response.text();
            
            try {
              // 尝试解析JSON
              const result: ApiResponse = JSON.parse(text);
              
              // 确保组件仍然挂载
              if (!isMounted) return;
              
              // 保存元数据
              setMetadata(result.metadata);
              
              // 转换数据，确保region_monthly_visits字段正确处理
              const transformedData = transformRawData(result.data);
              
              // 如果是地区分布榜，按地区分组数据
              if (rankingType === 'region_rank') {
                const groupedData = groupDataByRegion(transformedData);
                setRegionGroupedData(groupedData);
                
                // 如果有选中的地区，显示该地区的数据
                if (selectedRegion && groupedData[selectedRegion]) {
                  setData(groupedData[selectedRegion].slice(0, PAGE_SIZE));
                  setHasMore(groupedData[selectedRegion].length > PAGE_SIZE);
                } else {
                  // 默认显示美国数据
                  const defaultRegion = 'US';
                  setData(groupedData[defaultRegion] ? groupedData[defaultRegion].slice(0, PAGE_SIZE) : []);
                  setHasMore(groupedData[defaultRegion] ? groupedData[defaultRegion].length > PAGE_SIZE : false);
                }
              } else {
                // 其他榜单正常显示
                setData(transformedData.slice(0, PAGE_SIZE));
                setHasMore(transformedData.length > PAGE_SIZE);
              }
              
              // 保存所有数据
              setAllData(transformedData);
              
              // 缓存数据
              dataCache[cacheKey] = {
                data: result.data,
                metadata: result.metadata,
                timestamp: Date.now()
              };
              
              loaded = true;
              setDataLoaded(true);
              setLoading(false); // 确保设置loading为false
              break;
            } catch (parseErr) {
              // 处理解析错误
            }
          } catch (fetchErr) {
            // 处理获取错误
          }
        }
      }
      
      // 如果所有外部数据加载都失败，才尝试使用内联数据
      if (!loaded) {
        try {
          const inlineResult = getInlineData(language, rankingType);
          
          // 保存元数据
          setMetadata(inlineResult.metadata);
          
          // 保存所有数据
          setAllData(inlineResult.data);
          
          // 只显示第一页数据，并确保rank连续
          const firstPageData = inlineResult.data.slice(0, PAGE_SIZE).map((tool, index) => ({
            ...tool,
            rank: index + 1 // 确保rank从1开始连续
          }));
          setData(firstPageData);
          
          // 判断是否有更多数据
          setHasMore(inlineResult.data.length > PAGE_SIZE);
          
          setIsUsingInlineData(true);
          loaded = true;
          setDataLoaded(true);
          setLoading(false); // 确保设置loading为false
          
          // 缓存数据
          dataCache[cacheKey] = {
            data: inlineResult.data,
            metadata: inlineResult.metadata,
            timestamp: now
          };
        } catch (inlineError) {
          // 即使内联数据加载失败，也要重置loading状态
          setLoading(false);
        }
      }
      
      // 如果仍然没有加载到数据，设置错误状态
      if (!loaded) {
        setLoading(false);
        setError(`无法加载数据，所有尝试都失败了。`);
      }
      
      // 无论成功与否，都设置初始化标志
      setTimeout(initializeComponent, 300);
    };
    
    fetchData();
    
    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [rankingType, language, dataPath, cacheKey, selectedRegion]);

  // 当选中的地区变化时，更新显示的数据
  useEffect(() => {
    // 只有在地区分布榜且数据已加载的情况下才处理
    if (rankingType === 'region_rank' && dataLoaded && Object.keys(regionGroupedData).length > 0) {
      
      if (selectedRegion && regionGroupedData[selectedRegion]) {
        
        // 显示该地区的数据
        setData(regionGroupedData[selectedRegion].slice(0, PAGE_SIZE));
        setHasMore(regionGroupedData[selectedRegion].length > PAGE_SIZE);
      } else {
        // 默认显示美国数据
        const defaultRegion = 'US';
        
        if (regionGroupedData[defaultRegion]) {
          setData(regionGroupedData[defaultRegion].slice(0, PAGE_SIZE));
          setHasMore(regionGroupedData[defaultRegion].length > PAGE_SIZE);
        } else {
          setData([]);
          setHasMore(false);
        }
      }
    }
  }, [selectedRegion, rankingType, dataLoaded, regionGroupedData]);

  // 加载更多数据
  const loadMore = () => {
    // 如果正在加载或没有更多数据，直接返回
    if (loading || loadingRef.current || !hasMore) {
      return;
    }
    
    // 设置加载状态
    setLoading(true);
    loadingRef.current = true;
    
    try {
      const currentLength = data.length;
      
      // 如果是地区分布榜，从分组数据中加载
      if (rankingType === 'region_rank') {
        const currentRegion = selectedRegion || 'US';
        
        const regionData = regionGroupedData[currentRegion] || [];
        
        if (regionData.length === 0) {
          setHasMore(false);
          setLoading(false);
          loadingRef.current = false;
          initializedRef.current = true; // 确保初始化标志设置为true
          return;
        }
        
        // 计算下一页数据
        const nextPageData = regionData.slice(currentLength, currentLength + PAGE_SIZE);
        
        if (nextPageData.length > 0) {
          // 添加下一页数据并确保rank字段连续
          const updatedData = [...data, ...nextPageData].map((tool, index) => ({
            ...tool,
            rank: index + 1 // 确保rank从1开始连续
          }));
          
          // 延迟更新状态，避免UI闪烁
          setTimeout(() => {
            setData(updatedData);
            const hasMoreData = currentLength + nextPageData.length < regionData.length;
            setHasMore(hasMoreData);
            setLoading(false);
            // 延迟重置loadingRef，给UI时间渲染
            setTimeout(() => {
              loadingRef.current = false;
              // 确保初始化标志设置为true
              initializedRef.current = true;
            }, 300);
          }, 200);
        } else {
          setHasMore(false);
          setLoading(false);
          setTimeout(() => {
            loadingRef.current = false;
            initializedRef.current = true;
          }, 300);
        }
      } else {
        // 其他tab使用原有逻辑
        
        if (allData.length === 0) {
          setHasMore(false);
          setLoading(false);
          loadingRef.current = false;
          initializedRef.current = true; // 确保初始化标志设置为true
          return;
        }
        
        // 对于首次加载，可能需要重新从allData中获取数据
        if (currentLength === 0 && allData.length > 0) {
          const firstPageData = allData.slice(0, PAGE_SIZE).map((tool, index) => ({
            ...tool,
            rank: index + 1
          }));
          
          setTimeout(() => {
            setData(firstPageData);
            setHasMore(allData.length > PAGE_SIZE);
            setLoading(false);
            loadingRef.current = false;
            initializedRef.current = true;
          }, 200);
          return;
        }
        
        const nextPageData = allData.slice(currentLength, currentLength + PAGE_SIZE);
        
        if (nextPageData.length > 0) {
          // 添加下一页数据并确保rank字段连续
          const updatedData = [...data, ...nextPageData].map((tool, index) => ({
            ...tool,
            rank: index + 1 // 确保rank从1开始连续
          }));
          
          // 延迟更新状态，避免UI闪烁
          setTimeout(() => {
            setData(updatedData);
            const hasMoreData = currentLength + nextPageData.length < allData.length;
            setHasMore(hasMoreData);
            setLoading(false);
            // 延迟重置loadingRef，给UI时间渲染
            setTimeout(() => {
              loadingRef.current = false;
              // 确保初始化标志设置为true
              initializedRef.current = true;
            }, 300);
          }, 200);
        } else {
          setHasMore(false);
          setLoading(false);
          setTimeout(() => {
            loadingRef.current = false;
            initializedRef.current = true;
          }, 300);
        }
      }
    } catch (error) {
      setHasMore(false);
      setLoading(false);
      loadingRef.current = false;
      // 确保初始化标志设置为true，即使出错也能继续尝试加载
      initializedRef.current = true;
    }
  };

  // 当rankingType变化时，需要重置加载状态
  useEffect(() => {
    // 重置加载状态
    loadingRef.current = false;
    
    // 延迟执行，确保在状态更新后执行
    setTimeout(() => {
      // 如果有数据但未加载第一页，尝试加载
      if (allData.length > 0 && data.length === 0) {
        loadMore();
      }
    }, 100);
  }, [rankingType]);

  // 确保数据加载时rank字段连续并设置初始化标志
  useEffect(() => {
    if (data.length > 0 && !loading) {
      // 确保初始化标志设置为true
      setTimeout(() => {
        initializedRef.current = true;
      }, 300);
    }
  }, [data.length, loading]);

  // 为非地区分布tab页添加特殊处理，确保数据正确加载
  useEffect(() => {
    // 只处理非地区分布tab页
    if (rankingType !== 'region_rank' && dataLoaded && allData.length > 0 && data.length === 0) {
      // 加载第一页数据
      const firstPageData = allData.slice(0, PAGE_SIZE).map((tool, index) => ({
        ...tool,
        rank: index + 1
      }));
      
      setData(firstPageData);
      setHasMore(allData.length > PAGE_SIZE);
      initializedRef.current = true;
    }
  }, [rankingType, dataLoaded, allData.length, data.length]);
  
  // 重要：添加首次加载数据的处理
  useEffect(() => {
    // 如果数据已加载但未显示，且不在加载中，则尝试显示第一页
    if (allData.length > 0 && data.length === 0 && !loading && !loadingRef.current) {
      loadMore();
    }
  }, [allData.length, data.length, loading, rankingType]);
  
  // 添加首次渲染时的强制数据加载
  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      
      // 延迟执行，确保组件已经完全挂载
      setTimeout(() => {
        if (allData.length > 0 && data.length === 0 && !loading) {
          // 直接设置第一页数据，不通过loadMore
          const firstPageData = allData.slice(0, PAGE_SIZE).map((tool, index) => ({
            ...tool,
            rank: index + 1
          }));
          
          setData(firstPageData);
          setHasMore(allData.length > PAGE_SIZE);
          setLoading(false);
          loadingRef.current = false;
        }
      }, 500);
    }
  }, []);

  return { 
    data, 
    loading, 
    error, 
    loadMore, 
    hasMore, 
    metadata, 
    attemptedPaths, 
    isUsingInlineData,
    regionGroupedData // 添加按地区分组的数据
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
  
  // 检查是否有缺失的region_monthly_visits字段
  const missingVisits = rawData.filter(item => 
    (item.region_monthly_visits === undefined || item.region_monthly_visits === null) &&
    item.monthly_visits && item.top_region_value
  ).length;
  
  if (missingVisits > 0) {
  }
  
  return rawData.map(item => {
    // 直接使用API返回的region_monthly_visits，不进行计算替代
    // 确保region_monthly_visits是有效的数值
    let regionMonthlyVisits = item.region_monthly_visits;
    
    // 如果region_monthly_visits未定义，但有monthly_visits和top_region_value，则计算它
    if ((regionMonthlyVisits === undefined || regionMonthlyVisits === null) && 
        item.monthly_visits && item.top_region_value) {
      regionMonthlyVisits = Math.round(item.monthly_visits * item.top_region_value);
    }
    
    // 确保region字段存在
    const region = item.region || item.top_region || '';
    
    // 记录所有地区的region_monthly_visits值
    if (regionMonthlyVisits !== undefined && regionMonthlyVisits !== null) {
    }
    
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
      region_monthly_visits: regionMonthlyVisits, // 使用计算后的值
      region: region, // 确保region字段存在
      tags: item.tags || item.categories || [],
      growth: typeof item.growth === 'number' ? item.growth : 0,
      growth_rate: typeof item.growth_rate === 'number' ? item.growth_rate : 0,
      estimated_income: item.estimated_income || 0,
      payment_platform: item.payment_platform || ''
    };
  });
};

// 按地区分组数据
const groupDataByRegion = (data: AITool[]): Record<string, AITool[]> => {
  const groupedData: Record<string, AITool[]> = {};
  
  data.forEach(tool => {
    // 确定工具所属的地区
    const region = tool.region || tool.top_region;
    if (region) {
      if (!groupedData[region]) {
        groupedData[region] = [];
      }
      
      // 确保region_monthly_visits字段存在
      if ((tool.region_monthly_visits === undefined || tool.region_monthly_visits === null) && 
          tool.monthly_visits && tool.top_region_value) {
        tool.region_monthly_visits = Math.round(tool.monthly_visits * tool.top_region_value);
      }
      
      // 检查是否已经存在相同ID的工具，避免重复添加
      const existingToolIndex = groupedData[region].findIndex(t => t.id === tool.id);
      if (existingToolIndex === -1) {
        groupedData[region].push({
          ...tool,
          region // 确保region字段存在
        });
      }
    }
  });
  
  // 对每个地区的数据按照region_monthly_visits排序
  Object.keys(groupedData).forEach(region => {
    groupedData[region].sort((a, b) => {
      const valueA = a.region_monthly_visits !== undefined ? Number(a.region_monthly_visits) : 0;
      const valueB = b.region_monthly_visits !== undefined ? Number(b.region_monthly_visits) : 0;
      return valueB - valueA; // 降序排序
    });
    
    // 重新设置rank
    groupedData[region] = groupedData[region].map((tool, index) => ({
      ...tool,
      rank: index + 1
    }));
  });
  
  return groupedData;
};