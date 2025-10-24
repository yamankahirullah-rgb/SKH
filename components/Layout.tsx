

import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
       <BottomNavBar />
    </div>
  );
};

export default Layout;