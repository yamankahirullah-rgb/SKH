import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Scissors, Boxes, ArrowRightLeft, Settings, FileText } from 'lucide-react';

const navItems = [
  { to: '/', label: 'الرئيسية', icon: <Home size={24} /> },
  { to: '/operations', label: 'العمليات', icon: <Scissors size={24} /> },
  { to: '/inventory', label: 'المخزون', icon: <Boxes size={24} /> },
  { to: '/transfers', label: 'التحويلات', icon: <ArrowRightLeft size={24} /> },
  { to: '/reports', label: 'التقارير', icon: <FileText size={24} /> },
  { to: '/settings', label: 'الإعدادات', icon: <Settings size={24} /> },
];

const BottomNavBar: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t z-50">
      <nav className="flex justify-around">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full p-2 text-center transition-colors duration-200 ${
                isActive ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:bg-gray-100'
              }`
            }
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default BottomNavBar;