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
  const { language, rankingType, setRankingType } = useAppContext();
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
  const { data, loading, error, loadMore, hasMore, attemptedPaths } = useAIToolsData(rankingType, language);
  
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
    console.log('HomePage: 分享按钮被点击');
    setShowShareModal(true);
    console.log('HomePage: 模态框状态已设置为:', true);
  }, []);

  // 关闭分享模态框
  const handleCloseShareModal = React.useCallback(() => {
    console.log('HomePage: 关闭模态框');
    setShowShareModal(false);
  }, []);
  
  // 监控模态框状态变化
  useEffect(() => {
    console.log('HomePage: 模态框状态变化:', showShareModal);
  }, [showShareModal]);
  
  // 预加载其他排名类型的数据
  useEffect(() => {
    const otherRankTypes: RankingType[] = ['total_rank', 'monthly_rank', 'income_rank', 'region_rank']
      .filter(type => type !== rankingType) as RankingType[];
    
    // 使用setTimeout避免阻塞主线程
    setTimeout(() => {
      otherRankTypes.forEach(type => {
        // 创建一个隐藏的iframe来预加载数据
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `data:text/html,<script>fetch('src/data/${language}/${type}.json').catch(e => console.log('预加载数据失败:', e))</script>`;
        document.body.appendChild(iframe);
        
        // 5秒后移除iframe
        setTimeout(() => {
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 5000);
      });
    }, 2000); // 页面加载2秒后开始预加载
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
  
  console.log('HomePage渲染，showShareModal:', showShareModal);
  
  return (
    <div className="container mx-auto px-4 py-4">
      {/* Ranking tabs with filter controls on the right */}
      <RankingTabs 
        tools={data}
        onFilterChange={handleFilterChange}
      />
      
      {/* Main content */}
      <div className="flex-1">
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
            />
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