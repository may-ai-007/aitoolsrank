import React, { useState, useEffect } from 'react';
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
  
  useEffect(() => {
    onFilterChange({ searchTerm, selectedCategory });
  }, [searchTerm, selectedCategory, onFilterChange]);
  
  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('');
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
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Category Filter */}
      <div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
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