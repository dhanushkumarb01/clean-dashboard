import React from 'react';
import { Camera, Video, Image } from 'lucide-react';

const MediaCard = ({ media, insights }) => {
  const getMediaIcon = (mediaType) => {
    switch (mediaType) {
      case 'REEL': return <Video className="w-4 h-4" />;
      case 'CAROUSEL_ALBUM': return <Image className="w-4 h-4" />;
      default: return <Camera className="w-4 h-4" />;
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            {getMediaIcon(media.media_type)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-900">{media.media_type}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">
              {new Date(media.timestamp).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {media.caption || "No caption"}
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{formatNumber(media.like_count || 0)}</div>
              <div className="text-gray-500">Likes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{formatNumber(media.comments_count || 0)}</div>
              <div className="text-gray-500">Comments</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{formatNumber(insights?.reach || 0)}</div>
              <div className="text-gray-500">Reach</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaCard; 