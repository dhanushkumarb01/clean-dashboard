import React from "react";
import { useNavigate } from "react-router-dom";

const MostActiveGroups = ({ groups, title = "Most Active Groups And Channels" }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl shadow p-6 flex-1 min-w-[260px]">
      <div className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
        <span className="mr-2">💬</span> {title}
      </div>
      <ul className="space-y-3">
        {groups.map((g) => (
          <li
            key={g.id || g.name}
            className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition"
            onClick={() => navigate(`/telegram/group/${g.groupId || g.id || g.name}`)}
          >
            <div className="font-semibold text-gray-800">{g.name}</div>
            <div className="text-gray-500 text-sm">{g.messages} messages</div>
            {g.id && <div className="text-xs text-gray-400">ID: {g.id}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MostActiveGroups; 