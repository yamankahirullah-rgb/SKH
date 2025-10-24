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

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAppContext();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(0); // Reload the page to redirect to login
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white text-black border-e">
      <div className="p-4 border-b">
        <img src="https://i.imgur.com/5n343kC.png" alt="Company Logo" className="h-12 mx-auto" />
      </div>
      <nav className="flex-1 p-4">
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
