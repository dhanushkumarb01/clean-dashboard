import React, { useState } from "react";
import StatCard from "../StatCard/StatCard";

const stats = [
  { label: "Total Groups", value: 1000 },
  { label: "Active Users", value: 12025 },
  { label: "Total Users", value: 15000 },
  { label: "Total Messages", value: 45200 },
  { label: "Message Rate", value: "0/min" },
  { label: "Message Rate Change", value: <span>0% <span className="text-green-600">Increase</span></span> },
  { label: "Group Propagation", value: "24.5%" },
  { label: "Total Media Files", value: 1250 },
];

const mostActiveUsers = [
  { id: "7794048988", name: "little", messages: 16738 },
  { id: "1234567890", name: "john_doe", messages: 12000 },
];

const mostActiveGroups = [
  { id: "1000258722", name: "Trusted Bank's", messages: 60744 },
  { id: "1000258723", name: "Crypto News", messages: 40200 },
];

const topUsersByGroups = [
  { id: "7794048988", name: "little", groups: 7 },
  { id: "1234567890", name: "john_doe", groups: 5 },
];

const FilterDropdown = ({ value, onChange }) => (
  <select
    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={value}
    onChange={e => onChange(e.target.value)}
  >
    <option value="all">All Time</option>
    <option value="month">This Month</option>
    <option value="week">This Week</option>
  </select>
);

const Avatar = ({ name }) => (
  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-lg mr-2">
    {name[0]?.toUpperCase()}
  </span>
);

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[260px]">
    <div className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
      {title}
    </div>
    {children}
  </div>
);

const TelegramDashboardSection = () => {
  const [filter, setFilter] = useState("all");
  return (
    <>
      <div className="flex items-center mb-6">
        <FilterDropdown value={filter} onChange={setFilter} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SectionCard title={<><span className="mr-2">👤</span> Most Active Users</>}>
          <ul className="space-y-3">
            {mostActiveUsers.map((user) => (
              <li key={user.id} className="flex items-center">
                <Avatar name={user.name} />
                <div>
                  <div className="font-semibold text-gray-800 flex items-center">
                    {user.name}
                    <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">{user.messages} messages</span>
                  </div>
                  <div className="text-xs text-gray-400">ID: {user.id}</div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title={<><span className="mr-2">💬</span> Most Active Groups And Channels</>}>
          <ul className="space-y-3">
            {mostActiveGroups.map((grp) => (
              <li key={grp.id} className="flex items-center">
                <Avatar name={grp.name} />
                <div>
                  <div className="font-semibold text-gray-800 flex items-center">
                    {grp.name}
                    <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">{grp.messages} messages</span>
                  </div>
                  <div className="text-xs text-gray-400">ID: {grp.id}</div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title={<><span className="mr-2">👥</span> Top Users by Groups Joined</>}>
          <ul className="space-y-3">
            {topUsersByGroups.map((user) => (
              <li key={user.id} className="flex items-center">
                <Avatar name={user.name} />
                <div>
                  <div className="font-semibold text-gray-800 flex items-center">
                    {user.name}
                    <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">{user.groups} groups</span>
                  </div>
                  <div className="text-xs text-gray-400">ID: {user.id}</div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </>
  );
};

export default TelegramDashboardSection; 