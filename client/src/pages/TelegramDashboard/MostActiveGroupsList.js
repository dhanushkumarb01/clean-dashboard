import React from "react";
import { useNavigate } from "react-router-dom";

const MostActiveGroupsList = ({ groups }) => {
  const navigate = useNavigate();

  if (!groups || groups.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Most Active Groups</h3>
          <span className="text-sm text-gray-500">📱</span>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📱</div>
          <p className="text-gray-500 text-sm">No group data available</p>
        </div>
      </div>
    );
  }

  const handleGroupClick = (groupId) => {
    navigate(`/telegram/group/${groupId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Most Active Groups</h3>
        <span className="text-sm text-gray-500">📱</span>
      </div>
      
      <div className="space-y-3">
        {groups.slice(0, 10).map((group, index) => (
          <div 
            key={group.groupId} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => handleGroupClick(group.groupId)}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  group.isChannel ? 'bg-purple-100' : 'bg-green-100'
                }`}>
                  <span className={`text-sm font-medium ${
                    group.isChannel ? 'text-purple-600' : 'text-green-600'
                  }`}>
                    {index + 1}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {group.title || 'Unknown Group'}
                  </p>
                  {group.isChannel && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                      Channel
                    </span>
                  )}
                  {!group.isChannel && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                      Group
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {group.username && (
                    <>
                      <span>@{group.username}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{group.memberCount} members</span>
                  <span>•</span>
                  <span>{group.messageCount} messages</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-semibold text-blue-600">
                  {group.messageCount}
                </span>
                <span className="text-xs text-gray-400">msgs</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {groups.length > 10 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Showing top 10 of {groups.length} active groups
          </p>
        </div>
      )}
    </div>
  );
};

export default MostActiveGroupsList; 