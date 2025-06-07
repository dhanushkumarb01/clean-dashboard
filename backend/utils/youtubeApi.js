const { google } = require('googleapis');
const Channel = require('../models/Channel');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const Author = require('../models/Author');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

exports.getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
};

exports.getTokensAndUserData = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userinfo = await oauth2.userinfo.get();
  return { tokens, userId: userinfo.data.id };
};

// Helper: fetch all pages
async function fetchAllPages(apiFn, params, itemsKey) {
  let results = [];
  let nextPageToken = null;
  do {
    const res = await apiFn({ ...params, pageToken: nextPageToken });
    results = results.concat(res.data[itemsKey] || []);
    nextPageToken = res.data.nextPageToken;
  } while (nextPageToken);
  return results;
}

exports.fetchAndStoreYouTubeData = async (tokens, userId) => {
  oauth2Client.setCredentials(tokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  // 1. Fetch channels owned by the user
  const channels = await fetchAllPages(
    youtube.channels.list,
    { part: 'id,snippet,statistics', mine: true, maxResults: 50 },
    'items'
  );

  for (const channel of channels) {
    // Upsert channel
    await Channel.findOneAndUpdate(
      { channelId: channel.id },
      {
        channelId: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        publishedAt: channel.snippet.publishedAt,
        thumbnails: channel.snippet.thumbnails,
        stats: channel.statistics,
        owner: userId,
      },
      { upsert: true, new: true }
    );

    // 2. Fetch all videos for this channel
    const videos = await fetchAllPages(
      youtube.search.list,
      { part: 'id,snippet', channelId: channel.id, maxResults: 50, type: 'video', order: 'date' },
      'items'
    );

    for (const video of videos) {
      const videoId = video.id.videoId;
      if (!videoId) continue;
      // Fetch video details
      const videoDetailsRes = await youtube.videos.list({ part: 'snippet,statistics', id: videoId });
      const videoDetails = videoDetailsRes.data.items[0];
      if (!videoDetails) continue;
      // Upsert video
      await Video.findOneAndUpdate(
        { videoId },
        {
          videoId,
          channelId: channel.id,
          title: videoDetails.snippet.title,
          description: videoDetails.snippet.description,
          publishedAt: videoDetails.snippet.publishedAt,
          thumbnails: videoDetails.snippet.thumbnails,
          stats: videoDetails.statistics,
        },
        { upsert: true, new: true }
      );

      // 3. Fetch all comments for this video
      const comments = await fetchAllPages(
        youtube.commentThreads.list,
        { part: 'id,snippet', videoId, maxResults: 100, textFormat: 'plainText' },
        'items'
      );

      for (const commentThread of comments) {
        const c = commentThread.snippet.topLevelComment.snippet;
        // Upsert author
        await Author.findOneAndUpdate(
          { authorId: c.authorChannelId.value },
          {
            authorId: c.authorChannelId.value,
            displayName: c.authorDisplayName,
            profileImage: c.authorProfileImageUrl,
            channelUrl: c.authorChannelUrl,
          },
          { upsert: true, new: true }
        );
        // Upsert comment
        await Comment.findOneAndUpdate(
          { commentId: commentThread.id },
          {
            commentId: commentThread.id,
            videoId,
            authorId: c.authorChannelId.value,
            text: c.textDisplay,
            publishedAt: c.publishedAt,
            likeCount: c.likeCount,
          },
          { upsert: true, new: true }
        );
      }
    }
  }
};

// Dashboard stats aggregation
exports.getDashboardStatsFromDB = async () => {
  const totalChannels = await Channel.countDocuments();
  const totalComments = await Comment.countDocuments();
  const uniqueAuthors = await Author.countDocuments();
  const avgCommentsPerDayAgg = await Comment.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' } },
        count: { $sum: 1 },
      },
    },
    { $group: { _id: null, avg: { $avg: '$count' } } },
  ]);
  const avgCommentsPerDay = avgCommentsPerDayAgg[0]?.avg || 0;
  // Most active users
  const mostActiveUsers = await Comment.aggregate([
    { $group: { _id: '$authorId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'authors',
        localField: '_id',
        foreignField: 'authorId',
        as: 'author',
      },
    },
    { $unwind: '$author' },
    {
      $project: {
        _id: 0,
        authorId: '$_id',
        displayName: '$author.displayName',
        profileImage: '$author.profileImage',
        comments: '$count',
      },
    },
  ]);
  // Most active channels
  const mostActiveChannels = await Comment.aggregate([
    {
      $lookup: {
        from: 'videos',
        localField: 'videoId',
        foreignField: 'videoId',
        as: 'video',
      },
    },
    { $unwind: '$video' },
    {
      $group: { _id: '$video.channelId', count: { $sum: 1 } },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'channels',
        localField: '_id',
        foreignField: 'channelId',
        as: 'channel',
      },
    },
    { $unwind: '$channel' },
    {
      $project: {
        _id: 0,
        channelId: '$_id',
        title: '$channel.title',
        comments: '$count',
      },
    },
  ]);
  return {
    totalChannels,
    totalComments,
    uniqueAuthors,
    avgCommentsPerDay,
    mostActiveUsers,
    mostActiveChannels,
  };
};

exports.getMostActiveUsersFromDB = async () => {
  return await Comment.aggregate([
    { $group: { _id: '$authorId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: 'authors',
        localField: '_id',
        foreignField: 'authorId',
        as: 'author',
      },
    },
    { $unwind: '$author' },
    {
      $project: {
        _id: 0,
        authorId: '$_id',
        displayName: '$author.displayName',
        profileImage: '$author.profileImage',
        comments: '$count',
      },
    },
  ]);
};

exports.getUserDetailsFromDB = async (userId) => {
  const author = await Author.findOne({ authorId: userId });
  if (!author) return null;
  const comments = await Comment.find({ authorId: userId });
  const totalComments = comments.length;
  const commentsByDay = {};
  comments.forEach((c) => {
    const day = c.publishedAt.toISOString().slice(0, 10);
    commentsByDay[day] = (commentsByDay[day] || 0) + 1;
  });
  return {
    authorId: author.authorId,
    displayName: author.displayName,
    profileImage: author.profileImage,
    totalComments,
    commentsByDay,
    comments,
  };
}; 