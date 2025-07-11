import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import type { RankingType } from '../utils/dataUtils';
import Filters from './Filters';
import type { AITool } from '../utils/dataUtils';

interface RankingTabsProps {
  tools: AITool[];
  onFilterChange: (searchTerm: string, selectedTags: string[]) => void;
}

const RankingTabs: React.FC<RankingTabsProps> = ({ 
  tools,
  onFilterChange
}) => {
  const { t } = useTranslation();
  const { rankingType, setRankingType, language } = useAppContext();
  const isEnglish = language === 'en';
  
  const tabs: { id: RankingType; label: string }[] = [
    { id: 'total_rank', label: t('app.tabs.total') },
    { id: 'monthly_rank', label: t('app.tabs.monthly') },
    { id: 'income_rank', label: t('app.tabs.income') },
    { id: 'region_rank', label: t('app.tabs.region') }
  ];
  
  // 提取所有工具的标签作为分类
  const extractCategories = () => {
    const uniqueCategories = new Set<string>();
    tools.forEach(tool => {
      if (tool.tags && tool.tags.length > 0) {
        tool.tags.forEach(tag => uniqueCategories.add(tag));
      }
    });
    return Array.from(uniqueCategories).sort();
  };

  // 适配新的过滤器接口
  const handleFilterChange = (filters: { searchTerm: string; selectedCategory: string }) => {
    const { searchTerm, selectedCategory } = filters;
    const selectedTags = selectedCategory ? [selectedCategory] : [];
    onFilterChange(searchTerm, selectedTags);
  };
  
  return (
    <div className="mb-4 border-b border-gray-200">
      <div className="flex items-center justify-between flex-wrap">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setRankingType(tab.id)}
              className={`
                py-3 whitespace-nowrap
                transition-colors focus:outline-none text-sm font-medium border-b-2
                ${rankingType === tab.id 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
              style={{ 
                paddingLeft: isEnglish ? '10px' : '20px',
                paddingRight: isEnglish ? '10px' : '20px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Filter controls - only shown on desktop */}
        <div className="hidden md:flex items-center pr-2 py-1.5">
          <Filters 
            categories={extractCategories()} 
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>
    </div>
  );
};

export default RankingTabs; 