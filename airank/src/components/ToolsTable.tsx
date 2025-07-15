import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSort, FaSortUp, FaSortDown, FaExternalLinkAlt, FaFilter } from 'react-icons/fa';
import { useAppContext } from '../contexts/AppContext';
import type { AITool } from '../utils/dataUtils';
import { formatNumber } from '../utils/dataUtils';
import ReactDOM from 'react-dom';

interface ToolsTableProps {
  tools: AITool[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

type SortField = 'rank' | 'name' | 'monthly_visits' | 'growth' | 'growth_rate' | 'top_region' | 'estimated_income' | 'payment_platform' | 'top_region_value' | 'region_monthly_visits';
type SortDirection = 'asc' | 'desc';

const ToolsTable: React.FC<ToolsTableProps> = ({ tools, loading, onLoadMore, hasMore }) => {
  const { t } = useTranslation();
  const { rankingType, language, selectedRegion, setSelectedRegion } = useAppContext();
  
  // 确保初始化时，如果是地区分布tab，selectedRegion设置为'US'
  const initialRegion = rankingType === 'region_rank' ? 'US' : '';
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  // 移除本地的selectedRegion状态，使用AppContext中的
  const [showRegionFilter, setShowRegionFilter] = useState<boolean>(false);
  
  // 记录所有可用的地区（不随滚动变化）
  const [allAvailableRegions] = useState<string[]>([
    'US', 'CN', 'JP', 'IN', 'GB', 'DE', 'FR', 'CA', 'BR', 'RU', 
    'AU', 'IT', 'ES', 'KR', 'MX', 'HK', 'ID', 'VN', 'TW', 'PH', 
    'PK', 'TH', 'TR', 'NG', 'MA', 'PE', 'CO', 'NL', 'PL', 'UA'
  ]);
  
  // 获取所有可用的地区（随数据加载变化）
  const availableRegions = useMemo(() => {
    if (!tools || tools.length === 0 || rankingType !== 'region_rank') return [];
    
    const regions = new Set<string>();
    tools.forEach(tool => {
      // 优先使用 region 字段，如果没有则使用 top_region 字段
      if (tool.region) {
        regions.add(tool.region);
      } else if (tool.top_region) {
        regions.add(tool.top_region);
      }
    });
    
    return Array.from(regions).sort();
  }, [tools, rankingType]);

  // 重要：在rankingType变化时重置排序状态
  useEffect(() => {
    // 重置为默认排序
    setSortField('rank');
    setSortDirection('asc');
    // 关闭地区筛选器
    setShowRegionFilter(false);
    // 重置加载标记
    loadedBatchesRef.current = false;
    setHasLoadedMore(false);
  }, [rankingType]);
  
  // 记录上一次选择的地区，防止滚动时重置
  const selectedRegionRef = useRef<string>(initialRegion);
  
  // 增加一个状态跟踪是否已经加载了更多数据
  const [hasLoadedMore, setHasLoadedMore] = useState<boolean>(false);
  
  // 添加一个引用，用于跟踪是否已加载所有数据
  const loadedBatchesRef = useRef<boolean>(false);
  
  // 修改根据选择的地区筛选数据的逻辑
  const filteredByRegionTools = useMemo(() => {
    if (!tools || tools.length === 0) return [];
    
    // 只在地区分布tab页下进行地区筛选
    if (rankingType === 'region_rank') {
      // 确保有选择地区，优先使用已选择的地区，其次使用引用中的地区，最后使用'US'
      const regionToFilter = selectedRegion || selectedRegionRef.current || 'US';
      
      if (!regionToFilter) {
        return [];
      }
      
      // 直接筛选出所有匹配该区域的数据，不做复杂的逻辑判断
      return tools.filter(tool => 
        tool.region === regionToFilter || tool.top_region === regionToFilter
      );
    }
    
    return tools;
  }, [tools, rankingType, selectedRegion, selectedRegionRef]);
  
  // 初始化时确保正确设置默认区域，并加载所有数据
  useEffect(() => {
    // 确保在地区分布tab下默认选择美国或者保持用户的选择
    if (rankingType === 'region_rank') {
      // 检查数据是否已加载
      if (tools && tools.length > 0) {
        // 如果已经有选择的地区，并且该地区在可用地区中，则保持选择
        if (selectedRegion && allAvailableRegions.includes(selectedRegion)) {
          // 已经设置好了，不需要再次设置
          selectedRegionRef.current = selectedRegion;
        } else {
          // 检查是否有美国数据
          const hasUSData = tools.some(tool => (tool.region === 'US' || tool.top_region === 'US'));
          
          if (hasUSData) {
            // 如果有美国数据，设置为美国
            setSelectedRegion('US');
            selectedRegionRef.current = 'US';
          } else if (availableRegions.length > 0) {
            // 如果没有美国数据但有其他地区的数据，则选择第一个可用地区
            setSelectedRegion(availableRegions[0]);
            selectedRegionRef.current = availableRegions[0];
          }
        }
      } else if (!selectedRegion) {
        // 如果没有选择区域，默认设置为US
        setSelectedRegion('US');
        selectedRegionRef.current = 'US';
      }
      
      // 确保所有数据都已加载
      if (hasMore && !loading && !loadedBatchesRef.current) {
        loadedBatchesRef.current = true;
        console.log('初始化时加载所有数据...');
        onLoadMore(); // 修改后的loadMore函数会加载所有数据
      }
    } else {
      // 其他tab页不需要地区筛选
      // 不再需要重置selectedRegion，因为它现在是全局状态
      // 切换tab时重置加载标记
      loadedBatchesRef.current = false;
    }
  }, [rankingType, tools, availableRegions, allAvailableRegions, selectedRegion, hasMore, loading, onLoadMore, setSelectedRegion]);
  
  // 改进数据加载逻辑，确保数据能被正确加载
  useEffect(() => {
    // 如果当前选择的是地区分布标签页，并且有工具数据
    if (rankingType === 'region_rank' && tools.length > 0) {
      // 获取当前选择的区域
      const currentRegion = selectedRegion || selectedRegionRef.current;
      if (currentRegion) {
        // 查找是否有该区域的数据
        const regionTools = tools.filter(tool => 
          tool.region === currentRegion || tool.top_region === currentRegion
        );
        
        // 如果当前筛选后无数据，但实际有该区域的数据，则重新触发筛选
        if (filteredByRegionTools.length === 0 && regionTools.length > 0) {
          // 使用setTimeout避免状态更新冲突
          setTimeout(() => {
            setSelectedRegion(currentRegion);
          }, 0);
        }
      }
    }
  }, [rankingType, tools, selectedRegion, filteredByRegionTools]);
  
  // 中文状态下表头样式
  const getHeaderStyle = useCallback(() => {
    return language === 'zh' 
      ? { whiteSpace: 'nowrap' as const, minWidth: '80px' } 
      : { whiteSpace: 'nowrap' as const };
  }, [language]);
  
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
        // For numbers and other types
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
    
    console.log(`切换到区域: ${region}`);
    
    // 立即更新选中的地区
    setSelectedRegion(region);
    selectedRegionRef.current = region; // 更新引用值
    
    // 关闭筛选器
    setShowRegionFilter(false);
  }, [setSelectedRegion]);
  
  // 切换地区筛选器的显示/隐藏
  const toggleRegionFilter = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('切换区域筛选器显示状态');
    setShowRegionFilter(prev => !prev);
  }, []);
  
  // 添加点击事件监听器，用于在点击页面其他区域时关闭地区筛选器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查是否点击了筛选器内部
      const isClickInsideFilter = (event.target as Element).closest('.region-filter-dropdown');
      
      // 如果点击了筛选器外部，则关闭筛选器
      if (!isClickInsideFilter && showRegionFilter) {
        console.log('点击了筛选器外部，关闭筛选器');
        setShowRegionFilter(false);
      }
    };

    // 添加全局点击事件监听器
    document.addEventListener('mousedown', handleClickOutside, true); // 使用捕获阶段

    // 清理函数
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [showRegionFilter]);

  // 优化handleScroll，移除不必要的延迟
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    
    if (scrollHeight - scrollTop <= clientHeight * 1.2) {
      if (hasMore && !loading) {
        onLoadMore();
        setHasLoadedMore(true);
      }
    }
  }, [hasMore, loading, onLoadMore]);
  
  // 监听hasLoadedMore变化，检查新加载的数据，优化响应速度
  useEffect(() => {
    if (hasLoadedMore && rankingType === 'region_rank' && !loading) {
      // 重置标记
      setHasLoadedMore(false);
      
      // 获取当前选择的区域
      const currentRegion = selectedRegion || selectedRegionRef.current || 'US';
      
      // 查找新加载的数据中是否有当前区域的数据
      const hasCurrentRegionData = tools.some(tool => 
        tool.region === currentRegion || tool.top_region === currentRegion
      );
      
      console.log(`检测到加载了更多数据，当前区域: ${currentRegion}，是否有数据: ${hasCurrentRegionData}`);
      
      // 如果有数据但当前筛选结果为空，立即刷新
      if (hasCurrentRegionData && filteredByRegionTools.length === 0) {
        console.log(`区域 ${currentRegion} 有数据但未显示，尝试强制刷新`);
        // 直接更新，不使用延迟
        setSelectedRegion(currentRegion);
      }
    }
  }, [hasLoadedMore, rankingType, loading, tools, selectedRegion, selectedRegionRef, filteredByRegionTools]);
  
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
            {allAvailableRegions.map(region => {
              // 检查当前region是否与选中的region匹配
              const isSelected = region === currentRegion;
              
              return (
                <div 
                  key={region}
                  className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 
                    ${isSelected ? 'bg-blue-500 text-white font-medium' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`点击了地区: ${region}`);
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
              {tool.region_monthly_visits !== undefined ? 
                formatNumber(Math.round(tool.region_monthly_visits), language) : 
                '-'}
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
      className="bg-white border border-gray-200 rounded-lg overflow-hidden relative"
      onScroll={handleScroll}
      style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}
    >
      
      <table className="min-w-full border-collapse">
        {renderTable()}
      </table>
      
      {/* 地区筛选器Portal */}
      <RegionFilterPortal />
      
      {/* Loading indicator */}
      {loading && (
        <div className="py-4 text-center text-gray-500">
          <div className="loader mx-auto w-6 h-6 border-2 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-2">{t('table.loading')}</p>
        </div>
      )}
      
      {/* 无数据提示 */}
      {!loading && filteredByRegionTools.length === 0 && (
        <div className="py-10 text-center text-gray-500">
          <p className="text-lg">{t('table.no_data_found')}</p>
          <p className="mt-2">{t('table.try_another_region')}</p>
        </div>
      )}
      
      {/* End of list indicator */}
      {!loading && !hasMore && filteredByRegionTools.length > 0 && (
        <div className="py-4 text-center text-gray-500">
          <p>{t('table.end_of_list')}</p>
        </div>
      )}
    </div>
  );
};

// 使用React.memo包装组件，避免不必要的重新渲染
export default React.memo(ToolsTable);