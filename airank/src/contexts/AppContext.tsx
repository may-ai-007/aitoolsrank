import React, { createContext, useState, useContext, useRef } from 'react';
import type { ReactNode } from 'react';
import type { RankingType } from '../utils/dataUtils';

interface AppContextType {
  language: string;
  setLanguage: (lang: string) => void;
  rankingType: RankingType;
  setRankingType: (type: RankingType) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  lastUpdated: string | null;
  setLastUpdated: (date: string) => void;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
}

const defaultContext: AppContextType = {
  language: 'en', // 默认语言改为英文
  setLanguage: () => {},
  rankingType: 'total_rank', // 修改为正确的类型
  setRankingType: () => {},
  isDarkMode: false,
  toggleDarkMode: () => {},
  lastUpdated: null,
  setLastUpdated: () => {},
  selectedRegion: 'US',
  setSelectedRegion: () => {}
};

const AppContext = createContext<AppContextType>(defaultContext);

export const useAppContext = () => useContext(AppContext);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // 从localStorage获取初始值，如果有的话
  const getInitialLanguage = () => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en'; // 默认返回英文
  };

  const getInitialRankingType = () => {
    const savedRankingType = localStorage.getItem('rankingType');
    return (savedRankingType as RankingType) || 'total_rank';
  };

  const getInitialDarkMode = () => {
    const savedDarkMode = localStorage.getItem('darkMode');
    return savedDarkMode === 'true';
  };

  const getInitialSelectedRegion = () => {
    const savedRegion = localStorage.getItem('selectedRegion');
    return savedRegion || 'US';
  };

  const [language, setLanguageState] = useState<string>(getInitialLanguage());
  const [rankingType, setRankingTypeState] = useState<RankingType>(getInitialRankingType());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode());
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegionState] = useState<string>(getInitialSelectedRegion());

  // 设置语言并保存到localStorage
  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // 设置排名类型并保存到localStorage
  const setRankingType = (type: RankingType) => {
    setRankingTypeState(type);
    localStorage.setItem('rankingType', type);
  };

  // 切换暗黑模式并保存到localStorage
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    
    // 更新document的class
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 设置选中的区域并保存到localStorage
  const setSelectedRegion = (region: string) => {
    setSelectedRegionState(region);
    localStorage.setItem('selectedRegion', region);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        rankingType,
        setRankingType,
        isDarkMode,
        toggleDarkMode,
        lastUpdated,
        setLastUpdated,
        selectedRegion,
        setSelectedRegion
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext; 