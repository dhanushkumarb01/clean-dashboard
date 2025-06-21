import React from "react";
import { useNavigate } from "react-router-dom";

const MostActiveChannels = ({ channels, title = "Most Active Channels" }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl shadow p-6 flex-1 min-w-[260px]">
      <div className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
        <span className="mr-2">💬</span> {title}
      </div>
      <ul className="space-y-3">
        {channels.map((ch) => (
          <li
            key={ch.id || ch.name}
            className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition"
            onClick={() => navigate(`/channel/${ch.id || ch.name}`)}
          >
            <div className="font-semibold text-gray-800">{ch.name}</div>
            <div className="text-gray-500 text-sm">{ch.comments} comments</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MostActiveChannels; 