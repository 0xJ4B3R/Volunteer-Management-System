import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // Initialize sidebar state from localStorage to preserve state across navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Default to closed on mobile, open on desktop
    return window.innerWidth > 768;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [directionKey, setDirectionKey] = useState(0);
  const [isPageLoading, setIsPageLoading] = useState(true);

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
        localStorage.setItem('sidebarOpen', 'true');
      } else if (mobile && !wasMobile) {
        // Switching from desktop to mobile - close sidebar
        setIsSidebarOpen(false);
        localStorage.setItem('sidebarOpen', 'false');
      }
    };
    
    // Initial check
    const initialMobile = window.innerWidth <= 768;
    setIsMobile(initialMobile);
    
    // Only set sidebar state if not already saved in localStorage
    const saved = localStorage.getItem('sidebarOpen');
    if (saved === null) {
      setIsSidebarOpen(!initialMobile); // Open on desktop, closed on mobile
      localStorage.setItem('sidebarOpen', (!initialMobile).toString());
    }
    
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  // Add minimal loading time to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 150); // Minimal 150ms loading time

    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', newState.toString());
  };

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
          margin: getMainContentMargin(),
          opacity: isPageLoading ? 0 : 1,
          transition: 'opacity 0.2s ease-in-out',
          zIndex: isMobile ? 1 : undefined,
          position: isMobile ? 'relative' : undefined,
          /* Ensure mobile layout doesn't cause horizontal overflow */
          overflowX: isMobile ? 'hidden' : undefined,
          width: isMobile ? '100%' : undefined,
          maxWidth: isMobile ? '100vw' : undefined
        }}
      >
        <main className={`flex-1 overflow-x-hidden p-4 ${isMobile ? 'pt-[70px]' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}