import React, { useState, useEffect } from 'react';

interface ShareButtonProps {
  onClick: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({ onClick }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;
    let lastScrollTop = 0;
    
    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // 向下滚动时隐藏，向上滚动时显示
      if (currentScrollTop > lastScrollTop && currentScrollTop > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollTop = currentScrollTop;
      
      // 清除之前的定时器
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      
      // 滚动停止1秒后始终显示按钮
      scrollTimer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
    };
    
    // 添加滚动事件监听
    window.addEventListener('scroll', handleScroll);
    
    // 组件卸载时清理
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, []);
  
  const buttonStyle = {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'fixed',
    bottom: '40px',
    right: '40px',
    backgroundColor: 'white',
    borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    zIndex: 9999,
    transition: 'all 0.3s ease',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(10px)'
  } as React.CSSProperties;
  
  const handleClick = (e: React.MouseEvent) => {
    console.log('分享按钮被点击');
    e.stopPropagation(); // 阻止事件冒泡
    onClick();
  };
  
  return (
    <div 
      style={buttonStyle}
      onClick={handleClick}
      title="分享排行榜"
    >
      <img src="/fly.svg" alt="分享" width="20" height="20" />
    </div>
  );
};

export default ShareButton; 