import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const sidebarItems = [
  { label: "Dashboard", icon: "📊", path: "/" },
  { label: "User Management", icon: "👤", path: "/users" },
  { label: "Role Management", icon: "🔑", path: "/roles" },
  { label: "Departments", icon: "🏢", path: "/departments" },
  { label: "Messages", icon: "💬", path: "/messages" },
  { label: "Watch List", icon: "👀", path: "/watchlist" },
  { label: "Sources", icon: "🔗", path: "/sources" },
  { label: "Settings", icon: "⚙️", path: "/settings" },
];

const dashboardItems = [
  { label: "YouTube Analytics", icon: "🎥", path: "/" },
  { label: "Telegram Analytics", icon: "📱", path: "/telegram" },
  { label: "WhatsApp Business", icon: "💚", path: "/whatsapp" },
];

const reportItems = [
  { label: "User Profile Analysis", icon: "📋", path: "/reports/users" },
  { label: "Group Summary Telegram", icon: "📋", path: "/reports/telegram" },
  { label: "Sentimental Analysis", icon: "📋", path: "/reports/sentiment" },
];

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActivePath = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
      <div className="p-6 text-lg font-bold text-gray-700">Dashboard Admin</div>
      
      <nav className="flex-1">
        {/* Analytics Dashboards */}
        <div className="px-6 text-xs text-gray-400 uppercase tracking-wider mb-2">Analytics</div>
        <ul className="space-y-1 mb-6">
          {dashboardItems.map((item) => (
            <li 
              key={item.label} 
              className={`flex items-center px-6 py-2 cursor-pointer transition-colors duration-150 ${
                isActivePath(item.path) 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>

        {/* Main Navigation */}
        <div className="px-6 text-xs text-gray-400 uppercase tracking-wider mb-2">Management</div>
        <ul className="space-y-1 mb-6">
          {sidebarItems.map((item) => (
            <li 
              key={item.label} 
              className={`flex items-center px-6 py-2 cursor-pointer transition-colors duration-150 ${
                isActivePath(item.path) 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>

        {/* Reports */}
        <div className="px-6 text-xs text-gray-400 uppercase tracking-wider mb-2">Reports</div>
        <ul className="space-y-1">
          {reportItems.map((item) => (
            <li 
              key={item.label} 
              className={`flex items-center px-6 py-2 cursor-pointer transition-colors duration-150 ${
                isActivePath(item.path) 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
