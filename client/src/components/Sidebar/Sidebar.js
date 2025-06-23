import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const dashboardItems = [
  { label: "YouTube Analytics", icon: "🎥", path: "/" },
  { label: "Telegram Analytics", icon: "📱", path: "/telegram" },
  { label: "WhatsApp Business", icon: "💚", path: "/whatsapp" },
  { label: "Instagram Analytics", icon: "📸", path: "/instagram" },
];

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDashboardOpen, setIsDashboardOpen] = useState(true); // Default to open for initial display

  const handleNavigation = (path) => {
    navigate(path);
    // Optionally close the dropdown after navigation if desired
    // setIsDashboardOpen(false);
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
        <ul className="space-y-1 mb-6">
          {/* Dashboard Toggle */}
          <li
            className={`flex items-center px-6 py-2 cursor-pointer transition-colors duration-150 ${
              isDashboardOpen || isActivePath("/") || isActivePath("/telegram") || isActivePath("/whatsapp")
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setIsDashboardOpen(!isDashboardOpen)}
          >
            <span className="mr-3 text-lg">📊</span>
            <span>Dashboard</span>
            {/* Optional arrow icon to indicate dropdown */}
            <svg
              className={`ml-auto h-4 w-4 transform transition-transform duration-200 ${
                isDashboardOpen ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </li>

          {/* Nested Dashboard Items */}
          {isDashboardOpen && (
            <ul className="ml-8 space-y-1"> {/* Indent the nested items */}
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
          )}
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
