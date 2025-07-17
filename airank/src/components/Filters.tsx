import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';

interface FiltersProps {
  categories: string[];
  onFilterChange: (filters: {
    searchTerm: string;
    selectedCategory: string;
  }) => void;
}

const Filters: React.FC<FiltersProps> = ({ categories, onFilterChange }) => {
  const { t } = useTranslation();
  const { language } = useAppContext();
  const isEnglish = language === 'en';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // 移除自动触发的useEffect，避免循环更新
  
  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    onFilterChange({ searchTerm: newSearchTerm, selectedCategory });
  };
  
  // 处理分类选择变化
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    onFilterChange({ searchTerm, selectedCategory: newCategory });
  };
  
  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('');
    onFilterChange({ searchTerm: '', selectedCategory: '' });
  };
  
  return (
    <div className="flex flex-row items-center space-x-2">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          className="pl-3 pr-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-center truncate"
          style={{ 
            height: '40px',
            width: isEnglish ? '80px' : '100px'
          }}
          placeholder={`${t('filters.search')}🔍`}
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      
      {/* Category Filter */}
      <div>
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="pl-3 pr-8 py-2 border border-gray-300 rounded-md bg-white text-sm appearance-none text-center truncate"
          style={{ 
            height: '40px',
            width: isEnglish ? '120px' : '150px',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em'
          }}
          title={selectedCategory || t('filters.category.title')}
        >
          <option value="">{t('filters.showAll')}</option>
          {categories.map((category) => (
            <option key={category} value={category} title={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      
      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm text-center truncate"
        style={{ 
          height: '40px',
          width: isEnglish ? '70px' : '80px'
        }}
      >
        {t('filters.reset')}
      </button>
    </div>
  );
};

export default Filters; 