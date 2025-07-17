import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSort, FaSortUp, FaSortDown, FaExternalLinkAlt, FaFilter } from 'react-icons/fa';
import { useAppContext } from '../contexts/AppContext';
import type { AITool } from '../utils/dataUtils';
import { formatNumber, useAIToolsData } from '../utils/dataUtils';
import ReactDOM from 'react-dom';

interface ToolsTableProps {
  tools: AITool[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  regionGroupedData?: Record<string, AITool[]>; // 添加按地区分组的数据
}

type SortField = 'rank' | 'name' | 'monthly_visits' | 'growth' | 'growth_rate' | 'top_region' | 'estimated_income' | 'payment_platform' | 'top_region_value' | 'region_monthly_visits';
type SortDirection = 'asc' | 'desc';

const ToolsTable: React.FC<ToolsTableProps> = ({ 
  tools, 
  loading, 
  onLoadMore, 
  hasMore,
  regionGroupedData = {} // 默认为空对象
}) => {
  const { t } = useTranslation();
  const { rankingType, language, selectedRegion, setSelectedRegion } = useAppContext();
  
  // 确保初始化时，如果是地区分布tab，selectedRegion设置为'US'
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showRegionFilter, setShowRegionFilter] = useState<boolean>(false);
  
  // 记录所有可用的地区（不随滚动变化）
  const [allAvailableRegions] = useState<string[]>([
    'US', 'CN', 'JP', 'IN', 'GB', 'DE', 'FR', 'CA', 'BR', 'RU', 
    'AU', 'IT', 'ES', 'KR', 'MX', 'HK', 'ID', 'VN', 'TW', 'PH', 
    'PK', 'TH', 'TR', 'NG', 'MA', 'PE', 'CO', 'NL', 'PL', 'UA'
  ]);
  
  // 存储每个地区的数据，避免重复筛选
  const regionDataMapRef = useRef<Record<string, AITool[]>>(regionGroupedData || {});
  
  // 记录当前选择的地区
  const selectedRegionRef = useRef<string>(selectedRegion || 'US');
  
  // 防止重复加载的标志
  const isLoadingRef = useRef<boolean>(false);
  
  // 记录当前rankingType以便在改变时重置状态
  const prevRankingTypeRef = useRef<string | null>(null);
  
  // 首次渲染标志
  const firstRenderRef = useRef<boolean>(true);
  
  // 首次加载数据
  useEffect(() => {
    if (firstRenderRef.current && tools.length > 0) {
      firstRenderRef.current = false;
      
      // 如果已经有数据，确保不在loading状态
      isLoadingRef.current = false;
    }
  }, [tools.length, rankingType]);
  
  // 重要：在rankingType变化时重置排序状态和加载状态
  useEffect(() => {
    // 检测rankingType是否改变
    if (prevRankingTypeRef.current !== rankingType) {
      
      // 重置为默认排序
      setSortField('rank');
      setSortDirection('asc');
      
      // 关闭地区筛选器
      setShowRegionFilter(false);
      
      // 重要：重置加载状态，避免从地区分布tab切换回来后状态错误
      isLoadingRef.current = false;
      
      // 更新当前rankingType记录
      prevRankingTypeRef.current = rankingType;
      
      // 清除所有可能的定时器
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      
      if (scrollDebounceTimerRef.current) {
        clearTimeout(scrollDebounceTimerRef.current);
        scrollDebounceTimerRef.current = null;
      }
      
      // 重置hasRecentlyLoaded状态
      hasRecentlyLoaded.current = false;
    }
  }, [rankingType]);
  
  // 更新引用值以保持同步
  useEffect(() => {
    if (selectedRegion) {
      selectedRegionRef.current = selectedRegion;
    }
  }, [selectedRegion]);
  
  // 更新regionDataMapRef
  useEffect(() => {
    if (Object.keys(regionGroupedData).length > 0) {
      regionDataMapRef.current = regionGroupedData;
    }
  }, [regionGroupedData]);
  
  // 根据选择的地区筛选数据
  const filteredByRegionTools = useMemo(() => {
    if (!tools || tools.length === 0) return [];
    
    // 只在地区分布tab页下进行地区筛选
    if (rankingType === 'region_rank') {
      const currentRegion = selectedRegion || selectedRegionRef.current || 'US';
      
      // 优先使用regionGroupedData中的数据
      if (regionDataMapRef.current[currentRegion] && regionDataMapRef.current[currentRegion].length > 0) {
        return regionDataMapRef.current[currentRegion];
      }
      
      // 如果缓存中没有，则从tools中筛选
      const filtered = tools.filter(tool => {
        // 检查region或top_region是否匹配当前地区
        const isCurrentRegion = tool.region === currentRegion || tool.top_region === currentRegion;
        
        // 如果匹配，确保region_monthly_visits字段存在
        if (isCurrentRegion) {
          // 如果region_monthly_visits缺失，尝试计算
          if ((tool.region_monthly_visits === undefined || tool.region_monthly_visits === null) && 
              tool.monthly_visits && tool.top_region_value) {
            tool.region_monthly_visits = Math.round(tool.monthly_visits * tool.top_region_value);
          }
        }
        
        return isCurrentRegion;
      });
      
      // 检查数据中是否有region_monthly_visits字段
      const hasVisitsData = filtered.some(tool => 
        tool.region_monthly_visits !== undefined && tool.region_monthly_visits !== null
      );
      
      if (!hasVisitsData) {
        
      }
      
      // 更新缓存
      if (filtered.length > 0) {
        regionDataMapRef.current[currentRegion] = filtered;
      }
      
      return filtered;
    }
    
    return tools;
  }, [tools, rankingType, selectedRegion, regionGroupedData]);
  
  // 初始化时确保正确设置默认区域
  useEffect(() => {
    // 只在首次加载时执行一次
    if (rankingType === 'region_rank' && !selectedRegionRef.current) {
      // 设置默认区域为US
      
      selectedRegionRef.current = 'US';
      
      // 只有当当前值不是US时才更新，避免不必要的重渲染
      if (selectedRegion !== 'US') {
        setSelectedRegion('US');
      }
    }
  }, [rankingType, selectedRegion, setSelectedRegion]);
  
  // 中文状态下表头样式
  const getHeaderStyle = useCallback(() => {
    return language === 'zh' 
      ? { whiteSpace: 'nowrap' as const, minWidth: '80px' } 
      : { whiteSpace: 'nowrap' as const };
  }, [language]);
  
  // 预加载所有地区数据
  useEffect(() => {
    if (rankingType === 'region_rank' && tools.length > 0) {
      
      // 获取所有可用的地区
      const availableRegions = new Set<string>();
      tools.forEach(tool => {
        if (tool.region) availableRegions.add(tool.region);
        if (tool.top_region) availableRegions.add(tool.top_region);
      });
      
      
      // 预处理每个地区的数据
      Array.from(availableRegions).forEach(region => {
        // 如果缓存中已有该地区数据，跳过
        if (regionDataMapRef.current[region] && regionDataMapRef.current[region].length > 0) {
          return;
        }
        
        // 筛选该地区的数据
        const regionTools = tools.filter(tool => 
          tool.region === region || tool.top_region === region
        );
        
        if (regionTools.length > 0) {
          
          // 确保region_monthly_visits字段存在
          regionTools.forEach(tool => {
            if ((tool.region_monthly_visits === undefined || tool.region_monthly_visits === null) && 
                tool.monthly_visits && tool.top_region_value) {
              tool.region_monthly_visits = Math.round(tool.monthly_visits * tool.top_region_value);
            }
          });
          
          // 缓存该地区的数据
          regionDataMapRef.current[region] = regionTools;
        }
      });
    }
  }, [rankingType, tools]);
  
  // Handle sorting
  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);
  
  // Get sort icon based on current sort state
  const getSortIcon = useCallback((field: SortField) => {
    if (field !== sortField) return <FaSort className="text-gray-400" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  }, [sortField, sortDirection]);
  
  // Sort the tools - 使用useMemo优化
  const sortedTools = useMemo(() => {
    if (!filteredByRegionTools || filteredByRegionTools.length === 0) return [];
    
    return [...filteredByRegionTools].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        // 特殊处理region_monthly_visits字段，保持undefined值
        if (sortField === 'region_monthly_visits') {
          // 如果值是undefined，在升序排序时将其放在最后，降序排序时放在最前
          if (valA === undefined && valB === undefined) return 0;
          if (valA === undefined) return sortDirection === 'asc' ? 1 : -1;
          if (valB === undefined) return sortDirection === 'asc' ? -1 : 1;
          
          // 都有值时正常比较
          return sortDirection === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        }
        
        // 其他数字字段的处理
        valA = Number(valA || 0);
        valB = Number(valB || 0);
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
    }).map((tool, index) => ({
      ...tool,
      rank: index + 1 // 确保排序后的rank从1开始连续
    }));
  }, [filteredByRegionTools, sortField, sortDirection]);
  
  // 处理地区切换，优化响应速度
  const handleRegionChange = useCallback((region: string, e: React.MouseEvent) => {
    // 阻止事件冒泡，避免触发其他点击事件
    e.preventDefault();
    e.stopPropagation();
    
    const oldRegion = selectedRegion || selectedRegionRef.current;
    
    // 检查是否与当前地区相同，如果相同则不做任何操作
    if (region === selectedRegion || region === selectedRegionRef.current) {
      
      setShowRegionFilter(false);
      return;
    }
    
    // 预先检查是否有该地区的数据
    const hasRegionData = regionDataMapRef.current[region] && regionDataMapRef.current[region].length > 0;
    if (!hasRegionData) {
      
    } else {
      
    }
    
    // 立即更新选中的地区
    selectedRegionRef.current = region; // 先更新引用值，确保其他地方能立即读取到新值
    setSelectedRegion(region);
    
    // 强制刷新一次数据过滤逻辑
    
    // 关闭筛选器
    setShowRegionFilter(false);
  }, [setSelectedRegion, selectedRegion]);
  
  // 切换地区筛选器的显示/隐藏
  const toggleRegionFilter = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRegionFilter(prev => !prev);
  }, []);
  
  // 添加点击事件监听器，用于在点击页面其他区域时关闭地区筛选器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查是否点击了筛选器内部
      const isClickInsideFilter = (event.target as Element).closest('.region-filter-dropdown');
      
      // 如果点击了筛选器外部，则关闭筛选器
      if (!isClickInsideFilter && showRegionFilter) {
        setShowRegionFilter(false);
      }
    };

    // 添加全局点击事件监听器
    document.addEventListener('mousedown', handleClickOutside, true);

    // 清理函数
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [showRegionFilter]);
  
  // 使用useRef跟踪上次滚动时间和滚动容器
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRecentlyLoaded = useRef<boolean>(false);
  
  // 检查是否需要加载更多数据
  const checkAndLoadMore = useCallback(() => {
    if (tools.length === 0 && !loading && !isLoadingRef.current && hasMore) {
      
      onLoadMore();
    }
  }, [tools.length, loading, hasMore, onLoadMore, rankingType]);
  
  // 首次加载时检查是否需要加载数据
  useEffect(() => {
    // 如果没有数据且不在加载中，尝试加载
    if (tools.length === 0 && !loading && !isLoadingRef.current && hasMore) {
      
      // 设置延迟，避免多次触发
      const timer = setTimeout(() => {
        checkAndLoadMore();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [tools.length, loading, hasMore, checkAndLoadMore, rankingType]);

  // 优化handleScroll函数，使用防抖技术
  const handleScroll = useCallback(() => {
    // 如果正在加载或没有更多数据或最近刚加载过数据，直接返回
    if (loading || !hasMore || isLoadingRef.current || hasRecentlyLoaded.current) {
      return;
    }
    
    // 清除之前的定时器，实现防抖
    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }
    
    // 延迟执行滚动处理，防止频繁触发
    scrollDebounceTimerRef.current = setTimeout(() => {
      const container = tableContainerRef.current;
      if (!container) return;
      
      const { scrollTop, clientHeight, scrollHeight } = container;
      
      // 调整触发条件：当滚动到距离底部500px时触发加载更多
      if (scrollHeight - scrollTop - clientHeight < 500) {
        
        // 避免重复加载
        if (!isLoadingRef.current) {
          isLoadingRef.current = true;
          hasRecentlyLoaded.current = true;
          
          // 清除之前的加载定时器
          if (loadingTimerRef.current) {
            clearTimeout(loadingTimerRef.current);
          }
          
          // 调用loadMore加载更多数据
          onLoadMore();
          
          // 设置两个定时器
          // 1. 10秒后重置加载标志，避免卡死
          loadingTimerRef.current = setTimeout(() => {
            isLoadingRef.current = false;
            loadingTimerRef.current = null;
          }, 10000);
          
          // 2. 1秒后允许再次触发加载，避免滚动抖动导致连续加载
          setTimeout(() => {
            hasRecentlyLoaded.current = false;
          }, 1000);
        }
      }
      
      scrollDebounceTimerRef.current = null;
    }, 300); // 延长防抖延迟到300ms，减少误触发
  }, [hasMore, loading, onLoadMore, rankingType]);

  // 使用useEffect设置滚动事件监听
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    
    // 重置滚动状态标志
    isLoadingRef.current = false;
    hasRecentlyLoaded.current = false;
    
    // 添加滚动事件监听
    container.addEventListener('scroll', handleScroll);
    
    // 清理函数
    return () => {
      container.removeEventListener('scroll', handleScroll);
      
      // 清除所有定时器
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      
      if (scrollDebounceTimerRef.current) {
        clearTimeout(scrollDebounceTimerRef.current);
        scrollDebounceTimerRef.current = null;
      }
    };
  }, [handleScroll]);
  
  // 监听tools变化，在数据加载后重置加载状态
  useEffect(() => {
    if (tools.length > 0 && isLoadingRef.current) {
      
      // 延迟重置加载状态，避免UI闪烁
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 300);
    }
  }, [tools.length]);
  
  // 渲染地区名称，根据语言显示不同内容
  const renderRegionName = useCallback((region: string) => {
    if (!region) return '-';
    
    // 地区名称映射表
    const regionMap: Record<string, Record<string, string>> = {
      'zh': {
        'United States': '美国',
        'China': '中国',
        'India': '印度',
        'United Kingdom': '英国',
        'Germany': '德国',
        'Japan': '日本',
        'Canada': '加拿大',
        'Australia': '澳大利亚',
        'France': '法国',
        'Brazil': '巴西',
        'Russia': '俄罗斯',
        'South Korea': '韩国',
        'Spain': '西班牙',
        'Italy': '意大利',
        'Mexico': '墨西哥',
        'US': '美国',
        'UK': '英国',
        'EU': '欧盟',
        'IN': '印度',
        'CN': '中国',
        'JP': '日本',
        'DE': '德国',
        'BR': '巴西',
        'GB': '英国',
        'FR': '法国',
        'HK': '香港',
        'KR': '韩国',
        'RU': '俄罗斯',
        'CA': '加拿大',
        'PH': '菲律宾',
        'ID': '印度尼西亚',
        'MX': '墨西哥',
        'AU': '澳大利亚',
        'PE': '秘鲁',
        'ES': '西班牙',
        'VN': '越南',
        'UA': '乌克兰',
        'TR': '土耳其',
        'CO': '哥伦比亚',
        'PK': '巴基斯坦',
        'TW': '台湾',
        'IT': '意大利',
        'MA': '摩洛哥',
        'PL': '波兰',
        'NL': '荷兰',
        'TH': '泰国',
        'NG': '尼日利亚',
        'SG': '新加坡',
        'AR': '阿根廷',
        'ZA': '南非',
        'CH': '瑞士',
        'SE': '瑞典',
        'AT': '奥地利',
        'BE': '比利时',
        'IL': '以色列',
        'DK': '丹麦',
        'PT': '葡萄牙',
        'MY': '马来西亚',
        'FI': '芬兰',
        'GR': '希腊',
        'CL': '智利',
        'NO': '挪威',
        'NZ': '新西兰',
        'IE': '爱尔兰',
        'CZ': '捷克',
        'RO': '罗马尼亚',
        'SA': '沙特阿拉伯',
        'AE': '阿联酋',
        'BD': '孟加拉国',
        'EG': '埃及',
        'HU': '匈牙利',
        'SK': '斯洛伐克',
        'KZ': '哈萨克斯坦',
        'LK': '斯里兰卡',
        'HR': '克罗地亚',
        'SI': '斯洛文尼亚',
        'BG': '保加利亚',
        'RS': '塞尔维亚',
        'LT': '立陶宛',
        'LV': '拉脱维亚',
        'EE': '爱沙尼亚',
        'BY': '白俄罗斯',
        'MD': '摩尔多瓦',
        'GE': '格鲁吉亚',
        'AM': '亚美尼亚',
        'AZ': '阿塞拜疆'
      },
      'en': {
        '美国': 'United States',
        '中国': 'China',
        '印度': 'India',
        '英国': 'United Kingdom',
        '德国': 'Germany',
        '日本': 'Japan',
        '加拿大': 'Canada',
        '澳大利亚': 'Australia',
        '法国': 'France',
        '巴西': 'Brazil',
        '俄罗斯': 'Russia',
        '韩国': 'South Korea',
        '西班牙': 'Spain',
        '意大利': 'Italy',
        '墨西哥': 'Mexico',
        '香港': 'Hong Kong',
        '菲律宾': 'Philippines',
        '印度尼西亚': 'Indonesia',
        '秘鲁': 'Peru',
        '越南': 'Vietnam',
        '乌克兰': 'Ukraine',
        '土耳其': 'Turkey',
        '哥伦比亚': 'Colombia',
        '巴基斯坦': 'Pakistan',
        '台湾': 'Taiwan',
        '摩洛哥': 'Morocco',
        '波兰': 'Poland',
        '荷兰': 'Netherlands',
        '泰国': 'Thailand',
        '尼日利亚': 'Nigeria',
        '新加坡': 'Singapore',
        '阿根廷': 'Argentina',
        '南非': 'South Africa',
        '瑞士': 'Switzerland',
        '瑞典': 'Sweden',
        '奥地利': 'Austria',
        '比利时': 'Belgium',
        '以色列': 'Israel',
        '丹麦': 'Denmark',
        '葡萄牙': 'Portugal',
        '马来西亚': 'Malaysia',
        '芬兰': 'Finland',
        '希腊': 'Greece',
        '智利': 'Chile',
        '挪威': 'Norway',
        '新西兰': 'New Zealand',
        '爱尔兰': 'Ireland',
        '捷克': 'Czech Republic',
        '罗马尼亚': 'Romania',
        '沙特阿拉伯': 'Saudi Arabia',
        '阿联酋': 'United Arab Emirates',
        '孟加拉国': 'Bangladesh',
        '埃及': 'Egypt',
        '匈牙利': 'Hungary',
        '斯洛伐克': 'Slovakia',
        '哈萨克斯坦': 'Kazakhstan',
        '斯里兰卡': 'Sri Lanka',
        '克罗地亚': 'Croatia',
        '斯洛文尼亚': 'Slovenia',
        '保加利亚': 'Bulgaria',
        '塞尔维亚': 'Serbia',
        '立陶宛': 'Lithuania',
        '拉脱维亚': 'Latvia',
        '爱沙尼亚': 'Estonia',
        '白俄罗斯': 'Belarus',
        '摩尔多瓦': 'Moldova',
        '格鲁吉亚': 'Georgia',
        '亚美尼亚': 'Armenia',
        '阿塞拜疆': 'Azerbaijan'
      }
    };
    
    // 根据当前语言选择映射表
    const map = regionMap[language] || {};
    
    // 如果有对应的翻译，则返回翻译
    if (map[region]) {
      return map[region];
    }
    
    // 如果没有找到对应的翻译，直接返回原始值
    return region;
  }, [language]);
  
  // 地区筛选器Portal组件
  const RegionFilterPortal = useCallback(() => {
    if (!showRegionFilter || rankingType !== 'region_rank') return null;
    
    // 获取主要地区列的位置
    const mainRegionHeader = document.querySelector('[data-column="main_region"]');
    if (!mainRegionHeader) return null;
    
    const rect = mainRegionHeader.getBoundingClientRect();
    
    // 创建筛选器样式 - 使用固定定位和更高的z-index
    const style: React.CSSProperties = {
      position: 'fixed',
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      width: '180px', // 恢复原始宽度
      maxHeight: '400px',
      overflowY: 'auto',
      backgroundColor: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      borderRadius: '0.375rem',
      border: '1px solid #e5e7eb',
      zIndex: 9999 // 极高的z-index确保显示在最上层
    };
    
    // 确保有选中的地区，使用引用中的值或默认为'US'
    const currentRegion = selectedRegion || selectedRegionRef.current || 'US';
    
    // 获取所有有数据的地区
    const availableRegions = Object.keys(regionDataMapRef.current).length > 0 
      ? Object.keys(regionDataMapRef.current) 
      : allAvailableRegions;
    
    // 使用Portal将筛选器渲染到body中
    return ReactDOM.createPortal(
      <div 
        style={style}
        className="region-filter-dropdown"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="px-3 py-2 border-b border-gray-200 font-medium text-sm text-gray-700">{t('filters.select_region')}</div>
          <div className="py-1">
            {availableRegions.map(region => {
              // 检查当前region是否与选中的region匹配
              const isSelected = region === currentRegion;
              
              // 检查该地区是否有数据
              const hasData = regionDataMapRef.current[region] && regionDataMapRef.current[region].length > 0;
              const dataCount = hasData ? regionDataMapRef.current[region].length : 0;
              
              return (
                <div 
                  key={region}
                  className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 
                    ${isSelected ? 'bg-blue-500 text-white font-medium' : ''}
                    ${!hasData ? 'opacity-50' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRegionChange(region, e);
                  }}
                >
                  {renderRegionName(region)}
                </div>
              );
            })}
          </div>
        </div>
      </div>,
      document.body
    );
  }, [showRegionFilter, rankingType, allAvailableRegions, selectedRegion, selectedRegionRef, handleRegionChange, t, renderRegionName]);
  
  // Render growth indicator with color - 使用useCallback优化
  const renderGrowth = useCallback((growth: number, rate: number) => {
    // 确保增长值和增长率都有默认值
    const growthValue = growth !== undefined && growth !== null ? growth : 0;
    const rateValue = rate !== undefined && rate !== null ? rate : 0;
    
    const color = growthValue > 0 ? 'text-green-500' : growthValue < 0 ? 'text-red-500' : 'text-gray-500';
    const sign = growthValue > 0 ? '+' : growthValue < 0 ? '-' : '';
    
    // 格式化增长率为百分比
    const formattedRate = `${rateValue >= 0 ? '+' : ''}${(rateValue * 100).toFixed(1)}%`;
    
    return (
      <div className={color}>
        {sign}{formatNumber(Math.abs(growthValue), language)} ({formattedRate})
      </div>
    );
  }, [language]);
  
  // Render tags - 使用useCallback优化
  const renderTags = useCallback((tags: string[]) => {
    const { language } = useAppContext();
    const isEnglish = language === 'en';
    
    return (
      <div className={`flex flex-wrap ${isEnglish ? 'gap-y-1' : 'gap-y-2'} gap-x-1 ${isEnglish ? 'max-w-[100px]' : 'max-w-[120px]'}`}>
        {tags.slice(0, 3).map((tag, index) => (
          <span 
            key={index} 
            className="inline-block px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700 whitespace-nowrap"
          >
            {tag}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-500 whitespace-nowrap">
            +{tags.length - 3}
          </span>
        )}
      </div>
    );
  }, []);
  
  // Render logo - 使用useCallback优化
  const renderLogo = useCallback((logo: string, name: string) => {
    return (
      <div className="flex items-center justify-center">
        <img 
          src={logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`} 
          alt={`${name} logo`}
          className="w-10 h-10 rounded-sm object-cover"
          style={{ maxWidth: '36px', maxHeight: '36px' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
          }}
          loading="lazy" // 添加懒加载
        />
      </div>
    );
  }, []);
  
  // 根据rankingType生成表头和表格内容
  const renderTable = () => {
    // 渲染表头
    const renderTableHeader = () => {
      // 基础列（所有tab都显示）
      const baseColumns = [
        <th 
          key="rank"
          scope="col" 
          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-16"
          onClick={() => handleSort('rank')}
          style={getHeaderStyle()}
        >
          <div className="flex items-center justify-center">
            <span>{t('table.columns.rank')}</span>
            {getSortIcon('rank')}
          </div>
        </th>
      ];
      
      // Logo列（除月度榜外都显示）
      if (rankingType !== 'monthly_rank') {
        baseColumns.push(
          <th 
            key="logo"
            scope="col" 
            className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10"
            style={getHeaderStyle()}
          >
            <span className="flex justify-center">Logo</span>
          </th>
        );
      }
      
      // 名称列（所有tab都显示）
      baseColumns.push(
        <th 
          key="name"
          scope="col" 
          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
          onClick={() => handleSort('name')}
          style={getHeaderStyle()}
        >
          <div className="flex items-center space-x-1">
            <span>{t('table.columns.name')}</span>
            {getSortIcon('name')}
          </div>
        </th>
      );
      
      // 根据不同的排名类型添加特定列
      if (rankingType === 'total_rank' || rankingType === 'monthly_rank') {
        // 总排行榜和月度热门：先显示总访问量，再显示增长
        baseColumns.push(
          <th 
            key="traffic"
            scope="col" 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSort('monthly_visits')}
            style={getHeaderStyle()}
          >
            <div className="flex items-center space-x-1">
              <span>{t('table.columns.traffic')}</span>
              {getSortIcon('monthly_visits')}
            </div>
          </th>
        );
        
        baseColumns.push(
          <th 
            key="growth"
            scope="col" 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSort('growth_rate')}
            style={getHeaderStyle()}
          >
            <div className="flex items-center space-x-1">
              <span>{t('table.columns.growth')}</span>
              {getSortIcon('growth_rate')}
            </div>
          </th>
        );
      } else if (rankingType === 'region_rank') {
        // 地区分布榜：显示地区访问量、增长和主要地区
        baseColumns.push(
          <th 
            key="region_traffic"
            scope="col" 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSort('region_monthly_visits')}
            style={getHeaderStyle()}
          >
            <div className="flex items-center space-x-1">
              <span>{t('table.columns.region_traffic')}</span>
              {getSortIcon('region_monthly_visits')}
            </div>
          </th>
        );
        
        baseColumns.push(
          <th 
            key="growth"
            scope="col" 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSort('growth_rate')}
            style={getHeaderStyle()}
          >
            <div className="flex items-center space-x-1">
              <span>{t('table.columns.growth')}</span>
              {getSortIcon('growth_rate')}
            </div>
          </th>
        );
        
        // 修改主要地区列，添加筛选功能
        baseColumns.push(
          <th 
            key="main_region"
            scope="col" 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer relative"
            style={getHeaderStyle()} // 添加样式以防止换行
            data-column="main_region" // 添加data属性用于Portal定位
          >
            <div 
              className="flex items-center space-x-1"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleRegionFilter(e);
              }}
            >
              <span>{t('table.columns.main_region')}</span>
              <FaFilter className={`text-xs ${selectedRegion ? 'text-blue-500' : 'text-gray-400'}`} />
              {rankingType === 'region_rank' && (
                <span className="text-xs text-blue-600 font-normal ml-1">
                  ({renderRegionName(selectedRegion || selectedRegionRef.current || 'US')})
                </span>
              )}
            </div>
          </th>
        );
      } else if (rankingType === 'income_rank') {
        // 收入榜：显示总访问量，再显示支付平台
        baseColumns.push(
          <th 
            key="traffic"
            scope="col" 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSort('monthly_visits')}
            style={getHeaderStyle()}
          >
            <div className="flex items-center space-x-1">
              <span>{t('table.columns.traffic')}</span>
              {getSortIcon('monthly_visits')}
            </div>
          </th>
        );
        
        baseColumns.push(
          <th 
            key="payment_platform"
            scope="col" 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSort('payment_platform')}
            style={getHeaderStyle()}
          >
            <div className="flex items-center space-x-1">
              <span>{t('table.columns.payment')}</span>
              {getSortIcon('payment_platform')}
            </div>
          </th>
        );
      }
      
      // 标签列（所有tab都显示）
      baseColumns.push(
        <th 
          key="tags"
          scope="col" 
          className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'en' ? 'w-28' : 'w-32'}`}
          style={getHeaderStyle()}
        >
          <span>{t('table.columns.tags')}</span>
        </th>
      );
      
      return (
        <tr className="border-b border-gray-200">
          {baseColumns}
        </tr>
      );
    };
    
    // 渲染表格行
    const renderTableRows = () => {
      return sortedTools.map((tool, index) => {
        // 基础单元格（所有tab都显示）
        const baseCells = [
          <td key="rank" className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
            {tool.rank}
          </td>
        ];
        
        // Logo单元格（除月度榜外都显示）
        if (rankingType !== 'monthly_rank') {
          baseCells.push(
            <td key="logo" className="px-2 py-4 whitespace-nowrap text-center">
              {renderLogo(tool.logo, tool.name)}
            </td>
          );
        }
        
        // 名称单元格（所有tab都显示）
        baseCells.push(
          <td key="name" className="px-4 py-4 whitespace-normal">
            <div className="flex flex-col">
              <a 
                href={tool.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
              >
                <span>{tool.name}</span>
                <FaExternalLinkAlt className="ml-1 text-xs" />
              </a>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {tool.description}
              </p>
            </div>
          </td>
        );
        
        // 根据不同的排名类型添加特定单元格
        if (rankingType === 'total_rank' || rankingType === 'monthly_rank') {
          // 总排行榜和月度热门：先显示总访问量，再显示增长
          baseCells.push(
            <td key="traffic" className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
              {formatNumber(tool.monthly_visits, language)}
            </td>
          );
          
          baseCells.push(
            <td key="growth" className="px-4 py-4 whitespace-nowrap text-sm">
              {renderGrowth(tool.growth, tool.growth_rate)}
            </td>
          );
        } else if (rankingType === 'region_rank') {
          // 地区分布榜：显示地区访问量、增长和主要地区
          
          baseCells.push(
            <td key="region_traffic" className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
              {(() => {
                // 确保region_monthly_visits是有效数字
                if (tool.region_monthly_visits === undefined || 
                    tool.region_monthly_visits === null || 
                    isNaN(Number(tool.region_monthly_visits))) {
                  // 尝试计算region_monthly_visits
                  if (tool.monthly_visits && tool.top_region_value) {
                    const calculatedValue = Math.round(tool.monthly_visits * tool.top_region_value);
                    return formatNumber(calculatedValue, language);
                  }
                  return '-';
                }
                
                // 直接使用region_monthly_visits值
                const value = Number(tool.region_monthly_visits);
                return formatNumber(Math.round(value), language);
              })()}
            </td>
          );
          
          baseCells.push(
            <td key="growth" className="px-4 py-4 whitespace-nowrap text-sm">
              {renderGrowth(tool.growth, tool.growth_rate)}
            </td>
          );
          
          baseCells.push(
            <td key="main_region" className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
              {renderRegionName(tool.top_region) || '-'}
            </td>
          );
        } else if (rankingType === 'income_rank') {
          // 收入榜：显示总访问量，再显示支付平台
          baseCells.push(
            <td key="traffic" className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
              {formatNumber(tool.monthly_visits, language)}
            </td>
          );
          
          baseCells.push(
            <td key="payment_platform" className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
              {tool.payment_platform ? (
                Array.isArray(tool.payment_platform) 
                  ? tool.payment_platform.join(', ')
                  : typeof tool.payment_platform === 'string'
                    ? tool.payment_platform
                    : String(tool.payment_platform)
              ) : '-'}
            </td>
          );
        }
        
        // 标签单元格（所有tab都显示）
        baseCells.push(
          <td key="tags" className="px-4 py-4 text-sm text-gray-700 w-32">
            {renderTags(tool.tags)}
          </td>
        );
        
        return (
          <tr 
            key={tool.id} 
            className={`hover:bg-gray-50 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
          >
            {baseCells}
          </tr>
        );
      });
    };
    
    return (
      <>
        <thead className="bg-gray-50 sticky top-0 z-10">
          {renderTableHeader()}
        </thead>
        <tbody>
          {renderTableRows()}
        </tbody>
      </>
    );
  };
  
  // 渲染表格和筛选器
  return (
    <div 
      ref={tableContainerRef}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden relative"
      style={{ 
        height: 'calc(100vh - 180px)', 
        overflowY: 'auto',
        minHeight: '500px',
        overflowX: 'hidden',
        position: 'relative',
        willChange: 'transform', // 优化滚动性能
        scrollBehavior: 'smooth', // 平滑滚动
        // 添加一个小的内边距，避免浏览器边缘滚动触发问题
        paddingBottom: '2px'
      }}
    >
      
      <table className="min-w-full border-collapse table-fixed">
        {renderTable()}
      </table>
      
      {/* 地区筛选器Portal */}
      <RegionFilterPortal />
      
      {/* Loading indicator - 修改条件，避免闪烁 */}
      {(loading || isLoadingRef.current) && (
        <div className="py-4 text-center text-gray-500">
          <div className="loader mx-auto w-6 h-6 border-2 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-2">{t('table.loading')}</p>
        </div>
      )}
      
      {/* 无数据提示 - 修改条件，避免闪烁 */}
      {!loading && !isLoadingRef.current && filteredByRegionTools.length === 0 && (
        <div className="py-10 text-center text-gray-500">
          <p className="text-lg">{t('table.no_data_found')}</p>
          <p className="mt-2">{t('table.try_another_region')}</p>
          
          {/* 添加重试按钮 */}
          {hasMore && (
            <button 
              onClick={() => {
                onLoadMore();
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {t('table.retry')}
            </button>
          )}
        </div>
      )}
      
      {/* End of list indicator */}
      {!loading && !isLoadingRef.current && !hasMore && filteredByRegionTools.length > 0 && (
        <div className="py-4 text-center text-gray-500">
          <p>{t('table.end_of_list')}</p>
        </div>
      )}
    </div>
  );
};

// 使用React.memo包装组件，避免不必要的重新渲染
export default React.memo(ToolsTable);