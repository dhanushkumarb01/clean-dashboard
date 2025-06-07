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

const Sidebar = () => (
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
  </aside>
);

export default Sidebar; 