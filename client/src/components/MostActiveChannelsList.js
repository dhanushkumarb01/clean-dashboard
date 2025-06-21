import React from 'react';
import { useNavigate } from 'react-router-dom';

const MostActiveChannelsList = ({ channels }) => {
  const navigate = useNavigate();

  const handleChannelClick = (channel) => {
    // Navigate to channel statistics page using channelId or _id
    const channelId = channel.channelId || channel._id;
    if (channelId) {
      navigate(`/youtube/channel/${channelId}`);
    }
  };
  if (!channels || channels.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center h-full">
        <p className="text-gray-500">No active channels to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2 text-xl">📺</span> Most Active Channels
      </h2>
      <ul className="space-y-3">
        {channels.map((channel, index) => (
          <li 
            key={channel._id || index} 
            className="flex items-center justify-between py-2 border-b last:border-b-0 border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-md px-2"
            onClick={() => handleChannelClick(channel)}
          >
            <span className="text-gray-800 font-medium hover:text-blue-600 transition-colors duration-200">
              {channel.channelTitle || 'Unknown Channel'}
            </span>
            <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
              {channel.totalComments} Comments
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MostActiveChannelsList;
