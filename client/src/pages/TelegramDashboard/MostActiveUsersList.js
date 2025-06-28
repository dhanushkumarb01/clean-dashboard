import React from "react";
import { useNavigate } from "react-router-dom";

// Helper to extract number from MongoDB extended JSON or plain number
function getNumber(val) {
  if (typeof val === 'object' && val !== null) {
    if ('$numberInt' in val) return parseInt(val['$numberInt'], 10);
    if ('$numberDouble' in val) return parseFloat(val['$numberDouble']);
    if ('$numberLong' in val) return parseInt(val['$numberLong'], 10);
  }
  return typeof val === 'number' ? val : 0;
}

const MostActiveUsersList = ({ users }) => {
  const navigate = useNavigate();

  // Debug logging
  console.log('MostActiveUsersList received users:', users);
  console.log('Users type:', typeof users);
  console.log('Users length:', users ? users.length : 'null/undefined');

  if (!users || users.length === 0) {
    console.log('MostActiveUsersList: No users data, showing empty state');
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Most Active Users</h3>
          <span className="text-sm text-gray-500">📊</span>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">👤</div>
          <p className="text-gray-500 text-sm">No user data available</p>
        </div>
      </div>
    );
  }

  console.log('MostActiveUsersList: Rendering users list with', users.length, 'users');

  const handleUserClick = (userId) => {
    navigate(`/telegram/user/${userId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Most Active Users</h3>
        <span className="text-sm text-gray-500">📊</span>
      </div>
      
      <div className="space-y-3">
        {users.slice(0, 10).map((user, index) => (
          <div 
            key={user.userId || user._id || index} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => handleUserClick(user.userId || user._id)}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {index + 1}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.username 
                      ? `@${user.username}`
                      : `User ${String(user.userId || user._id || '').slice(-4)}`
                    }
                  </p>
                  {user.username && (
                    <span className="text-xs text-gray-500">@{user.username}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>ID: {user.telegramId || user.userId || user._id}</span>
                  <span>•</span>
                  <span>{getNumber(user.messageCount) || getNumber(user.messages)} messages</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-semibold text-blue-600">
                  {getNumber(user.messageCount) || getNumber(user.messages)}
                </span>
                <span className="text-xs text-gray-400">msgs</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {users.length > 10 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Showing top 10 of {users.length} active users
          </p>
        </div>
      )}
    </div>
  );
};

export default MostActiveUsersList; 