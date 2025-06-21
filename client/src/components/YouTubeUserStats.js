import React, { useState, useEffect } from 'react';
import { user } from '../utils/api';

const YouTubeUserStats = () => {
  const [userStats, setUserStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        // This will fetch user data from the users collection
        const response = await fetch('/api/users/youtube-stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserStats(data || []);
        } else {
          console.error('Failed to fetch user stats:', response.status);
          setUserStats([]);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setUserStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">YouTube Channel Statistics</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">YouTube Channel Statistics</h3>
      <div className="space-y-4">
        {userStats.length > 0 ? (
          userStats.map((userStat, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center mb-3">
                {userStat.profilePicture && (
                  <img 
                    src={userStat.profilePicture} 
                    alt={userStat.channelTitle}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{userStat.channelTitle || 'YouTube Channel'}</h4>
                  <p className="text-sm text-gray-500">{userStat.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{(userStat.subscriberCount || 0).toLocaleString()}</div>
                  <div className="text-gray-500">Subscribers</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{(userStat.viewCount || 0).toLocaleString()}</div>
                  <div className="text-gray-500">Views</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{(userStat.videoCount || 0).toLocaleString()}</div>
                  <div className="text-gray-500">Videos</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{(userStat.commentCount || 0).toLocaleString()}</div>
                  <div className="text-gray-500">Comments</div>
                </div>
              </div>
              {userStat.lastUpdated && (
                <div className="mt-2 text-xs text-gray-400">
                  Last updated: {new Date(userStat.lastUpdated).toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-500">No YouTube channel data available</div>
            <div className="text-sm text-gray-400 mt-1">User statistics will appear here when available</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeUserStats;
