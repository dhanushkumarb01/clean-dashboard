import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, User, Users, MessageSquare, BarChart2, Heart, Eye, ArrowLeft, Target, Crown, Camera, Video, X, Globe, RefreshCw, Instagram } from 'lucide-react';
import StatCard from '../components/Instagram/StatCard';
import MediaCard from '../components/Instagram/MediaCard';
import ListCard from '../components/Instagram/ListCard';
import EngagementChart from '../components/Instagram/EngagementChart';

// Demo data for dashboard
const demoData = {
  userProfile: {
    username: 'demo_business',
    account_type: 'Business',
    followers_count: 12345,
    follows_count: 321,
    media_count: 87,
    biography: 'This is a demo Instagram business account.',
    website: 'https://example.com',
    profile_picture_url: '',
  },
  followersCount: 12345,
  followingCount: 321,
  mediaCount: 87,
  totalLikes: 45678,
  totalComments: 2345,
  totalReach: 98765,
  totalImpressions: 123456,
  engagementRate: 8.7,
  uniqueAccountsReached: 87654,
  media: [
    {
      id: '1',
      media_type: 'IMAGE',
      caption: 'Our best-selling product! #demo',
      timestamp: '2024-06-01T12:00:00Z',
      like_count: 1200,
      comments_count: 45,
      insights: { reach: 5000, impressions: 6000, engagement: 1245 },
    },
    {
      id: '2',
      media_type: 'REEL',
      caption: 'Check out our latest reel!',
      timestamp: '2024-06-03T15:30:00Z',
      like_count: 900,
      comments_count: 30,
      insights: { reach: 4000, impressions: 5000, engagement: 930 },
    },
    {
      id: '3',
      media_type: 'CAROUSEL_ALBUM',
      caption: 'Swipe to see more! #carousel',
      timestamp: '2024-06-05T10:00:00Z',
      like_count: 800,
      comments_count: 25,
      insights: { reach: 3500, impressions: 4200, engagement: 825 },
    },
  ],
  topPosts: [
    {
      id: '1',
      media_type: 'IMAGE',
      caption: 'Our best-selling product! #demo',
      timestamp: '2024-06-01T12:00:00Z',
      like_count: 1200,
      comments_count: 45,
      insights: { reach: 5000, impressions: 6000, engagement: 1245 },
      engagementRate: 24.9,
    },
    {
      id: '2',
      media_type: 'REEL',
      caption: 'Check out our latest reel!',
      timestamp: '2024-06-03T15:30:00Z',
      like_count: 900,
      comments_count: 30,
      insights: { reach: 4000, impressions: 5000, engagement: 930 },
      engagementRate: 23.2,
    },
  ],
  recentStories: [
    { id: 's1', media_type: 'STORY', insights: { impressions: 1200, reach: 1100, replies: 10 } },
    { id: 's2', media_type: 'STORY', insights: { impressions: 900, reach: 850, replies: 5 } },
  ],
  engagementData: [
    { date: '2024-05-10', engagement_rate: 7.2, total_posts: 2, total_engagement: 300 },
    { date: '2024-05-11', engagement_rate: 8.1, total_posts: 3, total_engagement: 400 },
    { date: '2024-05-12', engagement_rate: 9.0, total_posts: 1, total_engagement: 150 },
    { date: '2024-05-13', engagement_rate: 8.7, total_posts: 2, total_engagement: 320 },
    { date: '2024-05-14', engagement_rate: 8.9, total_posts: 2, total_engagement: 350 },
  ],
  activeUsers: [
    { 
      username: 'topfan1', 
      fullName: 'Alex Johnson',
      isVerified: true,
      followers: 2450,
      following: 1234,
      posts: 567,
      bio: 'Digital creator | Photography enthusiast | Travel lover',
      commentCount: 12, 
      recentComments: [
        { text: 'Love your content!', post: 'Our best-selling product! #demo', date: '2024-06-01' },
        { text: 'Amazing reel!', post: 'Check out our latest reel!', date: '2024-06-03' },
      ] 
    },
    { 
      username: 'superuser2', 
      fullName: 'Sam Wilson',
      isVerified: false,
      followers: 1890,
      following: 876,
      posts: 234,
      bio: 'Fitness coach | Nutrition expert',
      commentCount: 9, 
      recentComments: [
        { text: 'Great carousel!', post: 'Swipe to see more! #carousel', date: '2024-06-05' },
        { text: 'Keep it up!', post: 'Our best-selling product! #demo', date: '2024-06-01' },
      ] 
    },
    { 
      username: 'engaged_follower', 
      fullName: 'Taylor Swift',
      isVerified: true,
      followers: 5000000,
      following: 42,
      posts: 1234,
      bio: 'Official account | Music | Lifestyle',
      commentCount: 7, 
      recentComments: [
        { text: 'Very informative.', post: 'Check out our latest reel!', date: '2024-06-03' },
      ] 
    },
  ],
};

function InstagramDashboard() {
  const navigate = useNavigate();
  const [selectedActiveUser, setSelectedActiveUser] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Demo Mode Banner */}
        <div className="mb-6">
          <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-xl flex items-center space-x-3">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">Demo Mode:</span>
            <span>This is a preview of the Instagram Analytics Dashboard with sample data. Connect your Instagram account to see real analytics.</span>
          </div>
        </div>
        {/* User Profile */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{demoData.userProfile.username}</h2>
              <p className="text-gray-600">{demoData.userProfile.account_type} Account</p>
            </div>
          </div>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Followers" value={demoData.followersCount.toLocaleString()} change={5.2} icon={<Users />} color="from-pink-500 to-purple-600" />
          <StatCard title="Following" value={demoData.followingCount.toLocaleString()} change={-1.8} icon={<User />} color="from-purple-500 to-indigo-600" />
          <StatCard title="Total Posts" value={demoData.mediaCount.toLocaleString()} change={12.5} icon={<Camera />} color="from-indigo-500 to-blue-600" />
          <StatCard title="Engagement Rate" value={`${demoData.engagementRate.toFixed(2)}%`} change={8.3} icon={<Target />} color="from-blue-500 to-cyan-600" />
        </div>
        {/* Engagement Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Likes" value={demoData.totalLikes.toLocaleString()} change={15.7} icon={<Heart />} color="from-red-500 to-pink-600" />
          <StatCard title="Total Comments" value={demoData.totalComments.toLocaleString()} change={22.1} icon={<MessageSquare />} color="from-green-500 to-emerald-600" />
          <StatCard title="Total Reach" value={demoData.totalReach.toLocaleString()} change={18.9} icon={<Globe />} color="from-yellow-500 to-orange-600" />
          <StatCard title="Total Impressions" value={demoData.totalImpressions.toLocaleString()} change={25.4} icon={<Eye />} color="from-cyan-500 to-blue-600" />
        </div>
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Posts */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-lg">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-xl text-gray-800">Top Performing Posts</h3>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {demoData.topPosts.length > 0 ? (
                  demoData.topPosts.map((post, index) => (
                    <MediaCard key={index} media={post} insights={post.insights} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No posts available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Recent Stories */}
          <div>
            <ListCard
              title="Recent Stories"
              items={demoData.recentStories.map(story => `${story.media_type} - ${story.insights?.impressions || 0} views`)}
              icon={<Video />}
              emptyMessage="No recent stories"
              color="from-purple-500 to-indigo-600"
            />
          </div>
        </div>
        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <EngagementChart data={demoData.engagementData} />
          <ListCard
            title="Most Active Users"
            items={demoData.activeUsers.map(user => (
              <button
                key={user.username}
                className={`w-full text-left px-0 py-0 bg-transparent border-none hover:underline ${selectedActiveUser?.username === user.username ? 'font-bold text-pink-600' : ''}`}
                onClick={() => setSelectedActiveUser(user)}
              >
                {user.username} - {user.commentCount} comments
              </button>
            ))}
            icon={<Users />}
            emptyMessage="No active users data"
            color="from-green-500 to-emerald-600"
          />
        </div>
        {/* User Details Side Panel (Demo Mode) */}
        {selectedActiveUser && (
          <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
            <div className="w-full max-w-md bg-white shadow-2xl h-full p-8 relative flex flex-col overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                onClick={() => setSelectedActiveUser(null)}
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex flex-col space-y-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-3 rounded-full">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-2xl font-bold text-gray-800">{selectedActiveUser.username}</h2>
                      {selectedActiveUser.isVerified && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.332-.115 0-.23-.029-.332-.088l-3-2c-.298-.198-.39-.6-.21-.906.182-.31.6-.39.9-.21l2.663 1.775 3.825-5.738c.16-.24.472-.3.71-.14.238.16.3.47.14.71z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-gray-600">{selectedActiveUser.fullName || selectedActiveUser.username}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl">
                  <div className="text-center">
                    <div className="font-bold text-gray-800">{selectedActiveUser.posts?.toLocaleString() || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-800">{selectedActiveUser.followers?.toLocaleString() || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-800">{selectedActiveUser.following?.toLocaleString() || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Following</div>
                  </div>
                </div>
                {selectedActiveUser.bio && (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">
                    {selectedActiveUser.bio}
                  </p>
                )}
                <div className="pt-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Total Comments:</span> {selectedActiveUser.commentCount}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Recent Comments</h3>
                <ul className="space-y-3">
                  {selectedActiveUser.recentComments && selectedActiveUser.recentComments.length > 0 ? (
                    selectedActiveUser.recentComments.map((comment, idx) => (
                      <li key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="text-gray-700 mb-1">"{comment.text}"</div>
                        <div className="text-xs text-gray-500">On post: <span className="italic">{comment.post}</span></div>
                        <div className="text-xs text-gray-400">{comment.date}</div>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400">No recent comments</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
        {/* Additional Metrics */}
        <div className="mt-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-xl text-gray-800">Reach Analytics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{demoData.uniqueAccountsReached.toLocaleString()}</div>
                <div className="text-gray-600">Unique Accounts Reached</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{(demoData.totalReach / Math.max(demoData.mediaCount, 1)).toFixed(0)}</div>
                <div className="text-gray-600">Avg. Reach per Post</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{((demoData.totalReach / Math.max(demoData.followersCount, 1)) * 100).toFixed(1)}%</div>
                <div className="text-gray-600">Reach Rate</div>
              </div>
            </div>
          </div>
        </div>
        {/* Connect Button */}
        <div className="mt-10 flex justify-center">
          <button
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            disabled
          >
            <Instagram className="w-5 h-5 inline mr-2" />
            Connect Instagram Account (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstagramDashboard; 