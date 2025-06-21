import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AuthorDetailsCard from "../components/AuthorDetailsCard";
import ActivitySummaryCard from "../components/ActivitySummaryCard";
import CommentStatistics from "../components/CommentStatistics";
import { user, youtube } from "../utils/api";

const LoadingState = () => (
  <div className="min-h-screen bg-gray-100">
    <Header />
    <div className="flex items-center justify-center h-64 mt-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading User Data</p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-4 h-4 mr-2 rounded-full bg-blue-200 animate-pulse"></div>
            Fetching user details...
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-4 h-4 mr-2 rounded-full bg-blue-200 animate-pulse"></div>
            Analyzing comments...
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gray-100">
    <Header />
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading User Data</h3>
        </div>
        
        <div className="text-red-700 mb-4">{error}</div>
        
        <div className="flex space-x-4">
          <button 
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Again
          </button>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  </div>
);

const UserDashboardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [youtubeStats, setYoutubeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user data and YouTube stats in parallel
        const [userResponse, statsResponse] = await Promise.all([
          user.fetchUser(id),
          youtube.getStats()
        ]);

        setUserData(userResponse.data);
        setYoutubeStats(statsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={handleRetry} />;
  if (!userData) return <ErrorState error="User not found" />;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Profile Section */}
          <AuthorDetailsCard
            name={userData.youtube?.channel_title || 'No YouTube Channel'}
            avatar={userData.youtube?.profile_picture}
            email={userData.email}
            joinDate={userData.createdAt}
            channelId={userData.youtube?.channel_id}
          />

          {/* Activity Summary */}
          {youtubeStats && (
            <ActivitySummaryCard
              views={youtubeStats.viewCount}
              subscribers={youtubeStats.subscriberCount}
              videos={youtubeStats.videoCount}
              comments={youtubeStats.commentCount}
              lastUpdated={youtubeStats.lastUpdated}
            />
          )}
        </div>

        {/* Statistics Section */}
        {userData.youtube && (
          <div className="mt-8">
            <CommentStatistics channelId={userData.youtube.channel_id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboardPage;