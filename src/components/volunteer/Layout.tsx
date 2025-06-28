import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [directionKey, setDirectionKey] = useState(0);

  // Check if device is mobile and set initial sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      const wasMobile = isMobile;
      setIsMobile(mobile);
      
      // On initial load, set sidebar state based on device type
      if (wasMobile === mobile) return; // No change in mobile state
      
      if (!mobile && wasMobile) {
        // Switching from mobile to desktop - open sidebar
        setIsSidebarOpen(true);
      } else if (mobile && !wasMobile) {
        // Switching from desktop to mobile - close sidebar
        setIsSidebarOpen(false);
      }
    };
    
    // Initial check
    const initialMobile = window.innerWidth <= 768;
    setIsMobile(initialMobile);
    setIsSidebarOpen(!initialMobile); // Open on desktop, closed on mobile
    
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Calculate margin based on sidebar state and direction
  const getMainContentMargin = () => {
    if (isMobile) {
      return '0'; // No margin on mobile - sidebar slides over content
    }
    
    const isRTL = document.documentElement.dir === 'rtl';
    const sidebarWidth = isSidebarOpen ? '16rem' : '5rem'; // 256px open, 80px closed
    
    if (isRTL) {
      return `0 ${sidebarWidth} 0 0`; // margin: top right bottom left
    } else {
      return `0 0 0 ${sidebarWidth}`; // margin: top right bottom left
    }
  };

  // Force re-render when language direction might change
  useEffect(() => {
    const handleDirectionChange = () => {
      setDirectionKey(prev => prev + 1);
    };
    
    // Listen for potential direction changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'dir') {
          handleDirectionChange();
        }
      });
    });
    
    if (document.documentElement) {
      observer.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['dir'] 
      });
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f2f4f6' }}>
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
      />

      <div 
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
        style={{ 
          margin: getMainContentMargin()
        }}
      >
        <main className={`flex-1 overflow-x-hidden p-4 ${isMobile ? 'pt-[68px]' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}