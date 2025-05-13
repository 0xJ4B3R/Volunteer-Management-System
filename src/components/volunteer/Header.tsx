import React from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
      <button 
        onClick={toggleSidebar}
        className="p-2 hover:bg-gray-100 rounded md:hidden"
        aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>
      {/* Add any additional header content here */}
    </header>
  );
}