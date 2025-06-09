import React from 'react';

const MostActiveUsersList = ({ users }) => {
  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center h-full">
        <p className="text-gray-500">No active users to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2 text-xl">🧑</span> Most Active Users
      </h2>
      <ul className="space-y-3">
        {users.map((user, index) => (
          <li key={user._id || index} className="flex items-center justify-between py-2 border-b last:border-b-0 border-gray-100">
            <span className="text-gray-800 font-medium">{user.authorDisplayName || 'Unknown Author'}</span>
            <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
              {user.totalComments} Comments
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MostActiveUsersList; 