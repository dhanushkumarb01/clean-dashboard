import React from "react";

const sidebarItems = [
  { label: "Dashboard", icon: "📊" },
  { label: "User Management", icon: "👤" },
  { label: "Role Management", icon: "🔑" },
  { label: "Departments", icon: "🏢" },
  { label: "Messages", icon: "💬" },
  { label: "Watch List", icon: "👀" },
  { label: "Sources", icon: "🔗" },
  { label: "Settings", icon: "⚙️" },
];

const reportItems = [
  "User Profile Analysis",
  "Group Summary Telegram",
  "Sentimental Analysis",
];

const Sidebar = ({ onLogout }) => (
  <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
    <div className="p-6 text-lg font-bold text-gray-700">Admin</div>
    <nav className="flex-1">
      <ul className="space-y-1">
        {sidebarItems.map((item) => (
          <li key={item.label} className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
            <span className="mr-3 text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 px-6 text-xs text-gray-400 uppercase tracking-wider">Reports</div>
      <ul className="mt-2 space-y-1">
        {reportItems.map((item) => (
          <li key={item} className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
            <span className="mr-3 text-lg">📋</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </nav>
    <div className="p-6 border-t border-gray-200">
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Logout
      </button>
    </div>
  </aside>
);

export default Sidebar; 