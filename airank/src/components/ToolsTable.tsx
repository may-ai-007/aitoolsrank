import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSort, FaSortUp, FaSortDown, FaExternalLinkAlt } from 'react-icons/fa';
import { useAppContext } from '../contexts/AppContext';
import type { AITool } from '../utils/dataUtils';
import { formatNumber } from '../utils/dataUtils';

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
  const { rankingType, language } = useAppContext();
  
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // 中文状态下表头样式
  const getHeaderStyle = useCallback(() => {
    return language === 'zh' 
      ? { whiteSpace: 'nowrap' as const } 
      : {};
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
    if (!tools || tools.length === 0) return [];
    
    return [...tools].sort((a, b) => {
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
    });
  }, [tools, sortField, sortDirection]);
  
  // Handle scroll event for infinite loading - 使用useCallback优化
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    
    if (scrollHeight - scrollTop <= clientHeight * 1.2) {
      if (hasMore && !loading) {
        onLoadMore();
      }
    }
  }, [hasMore, loading, onLoadMore]);
  
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
  
  // 渲染地区名称，根据语言显示不同内容
  const renderRegionName = useCallback((region: string) => {
    if (!region) return '-';
    
    // 如果当前是中文，且地区名是英文，则转换为中文
    if (language === 'zh') {
      // 地区名称映射表
      const regionMap: Record<string, string> = {
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
      };
      
      return regionMap[region] || region;
    }
    
    // 如果当前是英文，且地区名是中文，则转换为英文
    if (language === 'en') {
      // 地区名称映射表
      const regionMap: Record<string, string> = {
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
      };
      
      return regionMap[region] || region;
    }
    
    return region;
  }, [language]);

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
        
        baseColumns.push(
          <th 
            key="main_region"
            scope="col" 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSort('top_region')}
            style={getHeaderStyle()}
          >
            <div className="flex items-center space-x-1">
              <span>{t('table.columns.main_region')}</span>
              {getSortIcon('top_region')}
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
  
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
      onScroll={handleScroll}
      style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}
    >
      <table className="min-w-full border-collapse">
        {renderTable()}
      </table>
      
      {/* Loading indicator */}
      {loading && (
        <div className="py-4 text-center text-gray-500">
          <div className="loader mx-auto w-6 h-6 border-2 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-2">{t('table.loading')}</p>
        </div>
      )}
      
      {/* End of list indicator */}
      {!loading && !hasMore && (
        <div className="py-4 text-center text-gray-500">
          <p>{t('table.end_of_list')}</p>
        </div>
      )}
    </div>
  );
};

// 使用React.memo包装组件，避免不必要的重新渲染
export default React.memo(ToolsTable);