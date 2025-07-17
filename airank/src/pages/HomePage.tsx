import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import { useAIToolsData, filterTools } from '../utils/dataUtils';
import type { RankingType } from '../utils/dataUtils';

import ToolsTable from '../components/ToolsTable';
import RankingTabs from '../components/RankingTabs';
import ShareButton from '../components/ShareButton';
import ShareModal from '../components/ShareModal';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { language, rankingType, setRankingType, selectedRegion } = useAppContext();
  const initialRenderRef = useRef(true);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // 确保首次加载时有默认的排名类型
  useEffect(() => {
    // 只在组件初始化时检查一次
    if (initialRenderRef.current && (rankingType === undefined || rankingType === null)) {
      setRankingType('total_rank' as RankingType);
      initialRenderRef.current = false;
    }
  }, [rankingType, setRankingType]);
  
  // Get data from custom hook
  const { data, loading, error, loadMore, hasMore, attemptedPaths, regionGroupedData } = useAIToolsData(rankingType, language, selectedRegion);
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 使用useMemo优化过滤逻辑
  const filteredTools = useMemo(() => {
    if (!data) return [];
    return filterTools(data, searchTerm, selectedTags);
  }, [data, searchTerm, selectedTags]);
  
  // Handle filter changes - 优化为useCallback
  const handleFilterChange = React.useCallback((newSearchTerm: string, newSelectedTags: string[]) => {
    setSearchTerm(newSearchTerm);
    setSelectedTags(newSelectedTags);
  }, []);

  // 处理分享按钮点击
  const handleShareClick = React.useCallback(() => {
    setShowShareModal(true);
  }, []);

  // 关闭分享模态框
  const handleCloseShareModal = React.useCallback(() => {
    setShowShareModal(false);
  }, []);
  
  // 预加载其他排名类型的数据
  useEffect(() => {
    const otherRankTypes: RankingType[] = ['total_rank', 'monthly_rank', 'income_rank', 'region_rank']
      .filter(type => type !== rankingType) as RankingType[];
    
    // 使用setTimeout避免阻塞主线程
    setTimeout(() => {
      // 预加载当前语言下的所有排名类型数据
      otherRankTypes.forEach(type => {
        // 使用fetch API直接预加载数据
        fetch(`src/data/${language}/${type}.json`, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          credentials: 'same-origin'
        })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error(`预加载失败: ${response.status}`);
        })
        .catch(() => {
          // 预加载失败，静默处理
        });
      });
    }, 1000); // 页面加载1秒后开始预加载，提高响应速度
  }, [rankingType, language]);
  
  // 错误显示组件 - 使用useMemo优化
  const errorDisplay = useMemo(() => {
    if (!error) return null;
    
    return (
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
    );
  }, [error, attemptedPaths, t, language, rankingType]);
  
  // 活跃过滤器显示 - 使用useMemo优化
  const activeFiltersDisplay = useMemo(() => {
    if (!searchTerm && selectedTags.length === 0) return null;
    
    return (
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
    );
  }, [searchTerm, selectedTags, t]);
  
  // 首次加载数据检查
  const dataLoadedRef = useRef(false);
  useEffect(() => {
    // 如果数据为空且不在加载中，尝试加载数据
    if (filteredTools.length === 0 && !loading && !dataLoadedRef.current && hasMore) {
      dataLoadedRef.current = true; // 标记已尝试加载，避免重复触发
      
      // 延迟执行，确保组件已经完全挂载
      setTimeout(() => {
        loadMore();
      }, 300);
    }
    
    // 如果已有数据，标记为已加载
    if (filteredTools.length > 0) {
      dataLoadedRef.current = true;
    }
  }, [filteredTools.length, loading, hasMore, loadMore, rankingType]);
  
  // 监听rankingType变化，重置数据加载标志
  useEffect(() => {
    dataLoadedRef.current = false;
  }, [rankingType]);
  
  // 手动触发加载数据的函数
  const handleManualLoad = React.useCallback(() => {
    loadMore();
  }, [loadMore]);
  
  return (
    <div className="container mx-auto px-4 py-4 flex flex-col" style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      {/* Ranking tabs with filter controls on the right */}
      <RankingTabs 
        tools={data}
        onFilterChange={handleFilterChange}
      />
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {error ? errorDisplay : (
          <>
            {/* Active filters display */}
            {activeFiltersDisplay}
            
            {/* Tools table */}
            <ToolsTable 
              tools={filteredTools}
              loading={loading}
              onLoadMore={loadMore}
              hasMore={hasMore}
              regionGroupedData={regionGroupedData} // 传递按地区分组的数据
            />
            
            {/* 如果没有数据且不在加载中，显示手动加载按钮 */}
            {filteredTools.length === 0 && !loading && hasMore && (
              <div className="py-4 text-center">
                <button 
                  onClick={handleManualLoad}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  {t('app.load_data')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 分享按钮 */}
      <ShareButton onClick={handleShareClick} />

      {/* 分享模态框 */}
      <ShareModal
        isOpen={showShareModal}
        onClose={handleCloseShareModal}
        tools={filteredTools}
      />
    </div>
  );
};

export default HomePage; 