import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Scissors, Boxes, ArrowRightLeft, Settings, FileText, History, LogOut } from 'lucide-react';
import { supabase } from '../supabase/client';
import { useAppContext } from '../context/AppContext';

const navItems = [
  { to: '/', label: 'لوحة التحكم', icon: <Home size={20} /> },
  { to: '/operations', label: 'العمليات', icon: <Scissors size={20} /> },
  { to: '/inventory', label: 'المخزون', icon: <Boxes size={20} /> },
  { to: '/transfers', label: 'سجل التحويلات', icon: <ArrowRightLeft size={20} /> },
  { to: '/reports', label: 'التقارير', icon: <FileText size={20} /> },
  { to: '/audit-log', label: 'سجل التدقيق', icon: <History size={20} /> },
  { to: '/settings', label: 'الإعدادات', icon: <Settings size={20} /> },
];

interface SidebarProps {
  showInstallButton: boolean;
  handleInstallPrompt: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ showInstallButton, handleInstallPrompt }) => {
  const navigate = useNavigate();
  const { session } = useAppContext();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(0); // Reload the page to redirect to login
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white text-black border-e">
      <nav className="flex-1 p-4 pt-6">
        <ul>
          {navItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:bg-red-100 hover:text-red-600'
                  }`
                }
              >
                {item.icon}
                <span className="ms-3">{item.label}</span>
              </NavLink>
            </li>
          ))}
          {showInstallButton && (
             <li>
              <button
                onClick={handleInstallPrompt}
                className="flex items-center p-3 my-1 rounded-lg transition-colors duration-200 text-gray-600 hover:bg-red-100 hover:text-red-600 w-full"
              >
                <img src="https://i.imgur.com/8Q1z9gq.png" alt="Install Icon" className="w-5 h-5" />
                <span className="ms-3">تثبيت التطبيق</span>
              </button>
            </li>
          )}
        </ul>
      </nav>
      <div className="p-4 border-t">
         <div className="text-sm text-gray-500 mb-2 truncate" title={session.user.email}>{session.user.email}</div>
         <button 
           onClick={handleLogout}
           className="flex items-center p-3 my-1 rounded-lg transition-colors duration-200 text-gray-600 hover:bg-red-100 hover:text-red-600 w-full"
         >
           <LogOut size={20} />
           <span className="ms-3">تسجيل الخروج</span>
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;