import React from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';

const EmptyState = () => (
  <div className="text-center py-4">
    <div className="text-gray-500">No channels available yet</div>
  </div>
);

const ChannelList = ({ channels = [], title = "Most Active Channels" }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl shadow p-6 flex-1 min-w-[260px]">
      <div className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
        <span className="mr-2">💬</span> {title}
      </div>      {!channels?.length ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {channels?.map((ch) => (
            <li
              key={ch?.id || ch?.name || Math.random()}
              className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition"
              onClick={() => navigate(`/youtube/channel/${ch.channelId || ch.id || ch.name}`)}
            >
              <div className="font-semibold text-gray-800">{ch?.name || 'Unnamed Channel'}</div>
              <div className="text-gray-500 text-sm">{ch?.comments || 0} comments</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

ChannelList.propTypes = {
  channels: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      comments: PropTypes.number,
    })
  ),
  title: PropTypes.string
};

export default ChannelList;