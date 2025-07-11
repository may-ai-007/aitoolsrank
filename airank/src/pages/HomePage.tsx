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
  const { data, loading, error, loadMore, hasMore, attemptedPaths } = useAIToolsData(rankingType, language);
  
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
            <h3 className="text-lg font-medium mb-2">{t('errors.loading')}</h3>
            <p className="mb-2">{error}</p>
            {attemptedPaths && attemptedPaths.length > 0 && (
              <div className="mt-2 text-sm">
                <p className="font-medium">尝试过的路径:</p>
                <ul className="list-disc pl-5 mt-1">
                  {attemptedPaths.map((path, index) => (
                    <li key={index}>{path}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 text-sm">
              <p>当前环境信息:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>语言: {language}</li>
                <li>排名类型: {rankingType}</li>
                <li>当前URL: {window.location.href}</li>
              </ul>
            </div>
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