import React from "react";
import { useNavigate } from "react-router-dom";

const MostActiveUsers = ({ users, title = "Most Active Users" }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl shadow p-6 flex-1 min-w-[260px]">
      <div className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
        <span className="mr-2">👤</span> {title}
      </div>
      <ul className="space-y-3">
        {users.map((user) => (
          <li
            key={user.id || user.username}
            className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition"
            onClick={() => navigate(`/user/${user.id || user.username}`)}
          >
            <div className="font-semibold text-gray-800">{user.username}</div>
            <div className="text-gray-500 text-sm">
              {user.comments ? `${user.comments} comments` : `${user.messages} messages`}
              {user.id && <span className="ml-2 text-xs text-gray-400">ID: {user.id}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MostActiveUsers; 