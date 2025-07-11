import React, { useState } from 'react';
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

type SortField = 'rank' | 'name' | 'monthly_visits' | 'growth' | 'growth_rate' | 'top_region' | 'estimated_income' | 'payment_platform';
type SortDirection = 'asc' | 'desc';

const ToolsTable: React.FC<ToolsTableProps> = ({ tools, loading, onLoadMore, hasMore }) => {
  const { t } = useTranslation();
  const { rankingType, language } = useAppContext();
  
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // 中文状态下表头样式
  const getHeaderStyle = () => {
    return language === 'zh' 
      ? { whiteSpace: 'nowrap' as const } 
      : {};
  };
  
  // Handle sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get sort icon based on current sort state
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <FaSort className="text-gray-400" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };
  
  // Sort the tools
  const sortedTools = [...tools].sort((a, b) => {
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
  
  // Handle scroll event for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    
    if (scrollHeight - scrollTop <= clientHeight * 1.2) {
      if (hasMore && !loading) {
        onLoadMore();
      }
    }
  };
  
  // Render growth indicator with color
  const renderGrowth = (growth: number, rate: number) => {
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
  };
  
  // Render tags
  const renderTags = (tags: string[]) => {
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
  };
  
  // Render logo
  const renderLogo = (logo: string, name: string) => {
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
        />
      </div>
    );
  };
  
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
      onScroll={handleScroll}
      style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}
    >
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr className="border-b border-gray-200">
            {/* Rank column */}
            <th 
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
            
            {/* Logo column - 只在非月度榜时显示 */}
            {rankingType !== 'monthly_rank' && (
              <th 
                scope="col" 
                className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10"
                style={getHeaderStyle()}
              >
                <span className="flex justify-center">Logo</span>
              </th>
            )}
            
            {/* Name column */}
            <th 
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
            
            {/* Visits column */}
            <th 
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
            
            {/* Growth column - 在所有排行榜中显示，除了收入榜 */}
            {rankingType !== 'income_rank' && (
              <th 
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
            )}
            
            {/* Payment Platform column (only show for income ranking) */}
            {rankingType === 'income_rank' && (
              <th 
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
            )}
            
            {/* Top region column (only show for region ranking) */}
            {rankingType === 'region_rank' && (
              <th 
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
            )}
            
            {/* Tags column */}
            <th 
              scope="col" 
              className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'en' ? 'w-28' : 'w-32'}`}
              style={getHeaderStyle()}
            >
              <span>{t('table.columns.tags')}</span>
            </th>
          </tr>
        </thead>
        
        <tbody>
          {sortedTools.map((tool, index) => (
            <tr 
              key={tool.id} 
              className={`hover:bg-gray-50 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            >
              {/* Rank */}
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                {tool.rank}
              </td>
              
              {/* Logo - 只在非月度榜时显示 */}
              {rankingType !== 'monthly_rank' && (
                <td className="px-2 py-4 whitespace-nowrap text-center">
                  {renderLogo(tool.logo, tool.name)}
                </td>
              )}
              
              {/* Name and description */}
              <td className="px-4 py-4 whitespace-normal">
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
              
              {/* Visits */}
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatNumber(tool.monthly_visits, language)}
              </td>
              
              {/* Growth - 在所有排行榜中显示，除了收入榜 */}
              {rankingType !== 'income_rank' && (
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {renderGrowth(tool.growth, tool.growth_rate)}
                </td>
              )}
              
              {/* Payment Platform (conditional) */}
              {rankingType === 'income_rank' && (
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                  {tool.payment_platform ? (
                    Array.isArray(tool.payment_platform) 
                      ? tool.payment_platform.join(', ')
                      : typeof tool.payment_platform === 'string'
                        ? tool.payment_platform
                        : String(tool.payment_platform)
                  ) : '-'}
                </td>
              )}
              
              {/* Top region (conditional) */}
              {rankingType === 'region_rank' && (
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                  {tool.top_region || '-'}
                </td>
              )}
              
              {/* Tags */}
              <td className="px-4 py-4 text-sm text-gray-700 w-32">
                {renderTags(tool.tags)}
              </td>
            </tr>
          ))}
        </tbody>
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

export default ToolsTable;