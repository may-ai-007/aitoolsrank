import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import { useAIToolsData, filterTools } from '../utils/dataUtils';
import type { AITool, RankingType } from '../utils/dataUtils';

import ToolsTable from '../components/ToolsTable';
import RankingTabs from '../components/RankingTabs';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { language, rankingType, setRankingType } = useAppContext();
  const initialRenderRef = useRef(true);
  
  // 确保首次加载时有默认的排名类型
  useEffect(() => {
    // 只在组件初始化时检查一次
    if (initialRenderRef.current && (rankingType === undefined || rankingType === null)) {
      setRankingType('total_rank' as RankingType);
      initialRenderRef.current = false;
    }
  }, [rankingType, setRankingType]);
  
  // Get data from custom hook
  const { data, loading, error, loadMore, hasMore } = useAIToolsData(rankingType, language);
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredTools, setFilteredTools] = useState<AITool[]>([]);
  
  // Handle filter changes
  const handleFilterChange = (newSearchTerm: string, newSelectedTags: string[]) => {
    setSearchTerm(newSearchTerm);
    setSelectedTags(newSelectedTags);
  };
  
  // Apply filters whenever data or filters change
  useEffect(() => {
    if (data) {
      const filtered = filterTools(data, searchTerm, selectedTags);
      setFilteredTools(filtered);
    }
  }, [data, searchTerm, selectedTags]);
  
  return (
    <div className="container mx-auto px-4 py-4">
      {/* Ranking tabs with filter controls on the right */}
      <RankingTabs 
        tools={data}
        onFilterChange={handleFilterChange}
      />
      
      {/* Main content */}
      <div className="flex-1">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {t('errors.loading')}
          </div>
        ) : (
          <>
            {/* Active filters display */}
            {(searchTerm || selectedTags.length > 0) && (
              <div className="mb-3 text-sm text-gray-500">
                {searchTerm && (
                  <span className="mr-2">
                    {t('filters.search_term')}: "{searchTerm}"
                  </span>
                )}
                {selectedTags.length > 0 && (
                  <span>
                    {t('filters.tags')}: {selectedTags.join(', ')}
                  </span>
                )}
              </div>
            )}
            
            {/* Tools table */}
            <ToolsTable 
              tools={filteredTools}
              loading={loading}
              onLoadMore={loadMore}
              hasMore={hasMore}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage; 