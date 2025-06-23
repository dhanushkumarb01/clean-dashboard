const axios = require('axios');
const mongoose = require('mongoose');
const InstagramUser = require('../models/InstagramUser');
const InstagramMedia = require('../models/InstagramMedia');
const InstagramAnalytics = require('../models/InstagramAnalytics');

// In-memory cache
const instagramAnalyticsCache = {};

// --- Helper Functions ---

function getAccessToken(req) {
  // Try query param, then Authorization header
  return (
    req.query.access_token ||
    (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null)
  );
}

function cacheInstagramData(key, data, ttl = 300) {
  instagramAnalyticsCache[key] = {
    data,
    timestamp: new Date(),
    ttl
  };
}

function getCachedInstagramData(key) {
  const entry = instagramAnalyticsCache[key];
  if (entry && (new Date() - entry.timestamp) / 1000 < entry.ttl) {
    return entry.data;
  } else if (entry) {
    delete instagramAnalyticsCache[key];
  }
  return null;
}

// --- Endpoints ---

// Health check
exports.healthCheck = async (req, res) => {
  res.json({
    status: 'healthy',
    service: 'instagram-backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};

// Get Instagram profile
exports.getProfile = async (req, res) => {
  try {
    const access_token = getAccessToken(req);
    if (!access_token) return res.status(401).json({ error: 'Access token required' });

    // Get Instagram Business Account ID
    const accountsResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token,
        fields: 'instagram_business_account'
      }
    });
    const page = (accountsResponse.data.data || []).find(p => p.instagram_business_account);
    if (!page) {
      return res.status(400).json({ error: 'No Instagram Business Account found. Please ensure your Instagram account is linked to a Facebook Page.' });
    }
    const instagram_account_id = page.instagram_business_account.id;

    // Fetch profile data
    const profileResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagram_account_id}`, {
      params: {
        access_token,
        fields: 'id,username,account_type,followers_count,follows_count,media_count,biography,website,profile_picture_url'
      }
    });
    const profileData = profileResponse.data;

    // Store in DB
    try {
      await InstagramUser.updateOne(
        { instagram_id: profileData.id },
        {
          $set: {
            ...profileData,
            last_updated: new Date(),
            access_token // In production, encrypt this
          }
        },
        { upsert: true }
      );
    } catch (e) {
      console.error('Error storing Instagram user profile:', e);
    }

    res.json(profileData);
  } catch (e) {
    console.error('Error in getProfile:', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.error?.message || e.message });
  }
};

// Get Instagram media
exports.getMedia = async (req, res) => {
  try {
    const access_token = getAccessToken(req);
    if (!access_token) return res.status(401).json({ error: 'Access token required' });
    const limit = parseInt(req.query.limit) || 25;
    const cache_key = `media_${access_token.slice(0, 20)}_${limit}`;
    const cached = getCachedInstagramData(cache_key);
    if (cached) return res.json(cached);

    // Get Instagram Business Account ID
    const accountsResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token,
        fields: 'instagram_business_account'
      }
    });
    const page = (accountsResponse.data.data || []).find(p => p.instagram_business_account);
    if (!page) {
      return res.status(400).json({ error: 'No Instagram Business Account found.' });
    }
    const instagram_account_id = page.instagram_business_account.id;

    // Fetch media
    const mediaResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagram_account_id}/media`, {
      params: {
        access_token,
        fields: 'id,media_type,media_url,thumbnail_url,caption,permalink,timestamp,like_count,comments_count,owner',
        limit
      }
    });
    const mediaData = mediaResponse.data.data || [];
    const enrichedMedia = [];
    for (const item of mediaData) {
      try {
        // Get insights for each media item
        const insightsResponse = await axios.get(`https://graph.facebook.com/v18.0/${item.id}/insights`, {
          params: {
            access_token,
            metric: 'impressions,reach,engagement,saved'
          }
        });
        const insightsData = insightsResponse.data.data || [];
        const insights = {};
        for (const metric of insightsData) {
          insights[metric.name] = metric.values[0]?.value;
        }
        item.insights = insights;
      } catch (e) {
        item.insights = {};
      }
      enrichedMedia.push(item);
    }

    // Calculate metrics
    const total_likes = enrichedMedia.reduce((sum, m) => sum + (m.like_count || 0), 0);
    const total_comments = enrichedMedia.reduce((sum, m) => sum + (m.comments_count || 0), 0);
    const total_reach = enrichedMedia.reduce((sum, m) => sum + (m.insights?.reach || 0), 0);
    const total_impressions = enrichedMedia.reduce((sum, m) => sum + (m.insights?.impressions || 0), 0);
    const total_saved = enrichedMedia.reduce((sum, m) => sum + (m.insights?.saved || 0), 0);
    const total_engagement = total_likes + total_comments;
    const engagement_rate = total_reach > 0 ? (total_engagement / total_reach) * 100 : 0;
    // Top posts by engagement rate
    const top_posts = enrichedMedia.map(item => {
      const engagement = (item.like_count || 0) + (item.comments_count || 0);
      const reach = item.insights?.reach || 1;
      const engagement_rate = reach > 0 ? (engagement / reach) * 100 : 0;
      return { ...item, engagementRate: engagement_rate, total_engagement: engagement };
    }).sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 10);

    const response_data = {
      media: enrichedMedia,
      topPosts: top_posts,
      totalLikes: total_likes,
      totalComments: total_comments,
      totalReach: total_reach,
      totalImpressions: total_impressions,
      totalSaved: total_saved,
      engagementRate: engagement_rate,
      uniqueAccountsReached: total_reach
    };

    cacheInstagramData(cache_key, response_data, 300);

    // Store in DB
    try {
      for (const item of enrichedMedia) {
        await InstagramMedia.updateOne(
          { media_id: item.id },
          {
            $set: {
              ...item,
              media_id: item.id,
              instagram_account_id,
              last_updated: new Date()
            }
          },
          { upsert: true }
        );
      }
    } catch (e) {
      console.error('Error storing Instagram media:', e);
    }

    res.json(response_data);
  } catch (e) {
    console.error('Error in getMedia:', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.error?.message || e.message });
  }
};

// Get Instagram stories
exports.getStories = async (req, res) => {
  try {
    const access_token = getAccessToken(req);
    if (!access_token) return res.status(401).json({ error: 'Access token required' });
    const cache_key = `stories_${access_token.slice(0, 20)}`;
    const cached = getCachedInstagramData(cache_key);
    if (cached) return res.json(cached);

    // Get Instagram Business Account ID
    const accountsResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token,
        fields: 'instagram_business_account'
      }
    });
    const page = (accountsResponse.data.data || []).find(p => p.instagram_business_account);
    if (!page) {
      return res.status(400).json({ error: 'No Instagram Business Account found.' });
    }
    const instagram_account_id = page.instagram_business_account.id;

    // Fetch stories
    const storiesResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagram_account_id}/stories`, {
      params: {
        access_token,
        fields: 'id,media_type,media_url,permalink,timestamp'
      }
    });
    const storiesData = storiesResponse.data.data || [];
    const enrichedStories = [];
    for (const story of storiesData) {
      try {
        const insightsResponse = await axios.get(`https://graph.facebook.com/v18.0/${story.id}/insights`, {
          params: {
            access_token,
            metric: 'impressions,reach,replies,exits,taps_forward,taps_back'
          }
        });
        const insightsData = insightsResponse.data.data || [];
        const insights = {};
        for (const metric of insightsData) {
          insights[metric.name] = metric.values[0]?.value;
        }
        story.insights = insights;
      } catch (e) {
        story.insights = {};
      }
      enrichedStories.push(story);
    }
    const response_data = { stories: enrichedStories };
    cacheInstagramData(cache_key, response_data, 180);
    res.json(response_data);
  } catch (e) {
    console.error('Error in getStories:', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.error?.message || e.message });
  }
};

// Get Instagram analytics
exports.getAnalytics = async (req, res) => {
  try {
    const access_token = getAccessToken(req);
    if (!access_token) return res.status(401).json({ error: 'Access token required' });
    const cache_key = `analytics_${access_token.slice(0, 20)}`;
    const cached = getCachedInstagramData(cache_key);
    if (cached) return res.json(cached);

    // Get Instagram Business Account ID
    const accountsResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token,
        fields: 'instagram_business_account'
      }
    });
    const page = (accountsResponse.data.data || []).find(p => p.instagram_business_account);
    if (!page) {
      return res.status(400).json({ error: 'No Instagram Business Account found.' });
    }
    const instagram_account_id = page.instagram_business_account.id;

    // Fetch media for analytics
    const mediaResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagram_account_id}/media`, {
      params: {
        access_token,
        fields: 'id,media_type,media_url,thumbnail_url,caption,permalink,timestamp,like_count,comments_count,owner',
        limit: 50
      }
    });
    const mediaData = mediaResponse.data.data || [];
    // Generate engagement timeline
    const days = 30;
    const end_date = new Date();
    const start_date = new Date(end_date.getTime() - days * 24 * 60 * 60 * 1000);
    const media_by_date = {};
    for (const item of mediaData) {
      try {
        const item_date = new Date(item.timestamp);
        if (item_date >= start_date && item_date <= end_date) {
          const date_key = item_date.toISOString().slice(0, 10);
          if (!media_by_date[date_key]) media_by_date[date_key] = [];
          media_by_date[date_key].push(item);
        }
      } catch (e) {}
    }
    const timeline_data = [];
    let current_date = new Date(start_date);
    while (current_date <= end_date) {
      const date_key = current_date.toISOString().slice(0, 10);
      const day_media = media_by_date[date_key] || [];
      const total_likes = day_media.reduce((sum, m) => sum + (m.like_count || 0), 0);
      const total_comments = day_media.reduce((sum, m) => sum + (m.comments_count || 0), 0);
      const total_engagement = total_likes + total_comments;
      const total_posts = day_media.length;
      timeline_data.push({
        date: date_key,
        engagement_rate: total_posts > 0 ? (total_engagement / total_posts) : 0,
        total_posts,
        total_engagement,
        total_likes,
        total_comments
      });
      current_date.setDate(current_date.getDate() + 1);
    }
    // Get active users (by comments)
    const active_users = [];
    const user_comment_counts = {};
    for (const item of mediaData.slice(0, 10)) {
      try {
        const commentsResponse = await axios.get(`https://graph.facebook.com/v18.0/${item.id}/comments`, {
          params: {
            access_token,
            fields: 'from,text,timestamp',
            limit: 100
          }
        });
        const comments = commentsResponse.data.data || [];
        for (const comment of comments) {
          const username = comment.from?.username;
          if (username) {
            user_comment_counts[username] = (user_comment_counts[username] || 0) + 1;
          }
        }
      } catch (e) {}
    }
    for (const [username, count] of Object.entries(user_comment_counts)) {
      active_users.push({ username, comment_count: count });
    }
    active_users.sort((a, b) => b.comment_count - a.comment_count);
    const response_data = {
      engagementData: timeline_data,
      activeUsers: active_users.slice(0, 10)
    };
    cacheInstagramData(cache_key, response_data, 600);
    // Store in DB
    try {
      await InstagramAnalytics.updateOne(
        { instagram_account_id },
        {
          $set: {
            engagement_data: timeline_data,
            active_users: active_users,
            last_updated: new Date()
          }
        },
        { upsert: true }
      );
    } catch (e) {
      console.error('Error storing Instagram analytics:', e);
    }
    res.json(response_data);
  } catch (e) {
    console.error('Error in getAnalytics:', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.error?.message || e.message });
  }
};

// Get media insights
exports.getMediaInsights = async (req, res) => {
  try {
    const access_token = getAccessToken(req);
    if (!access_token) return res.status(401).json({ error: 'Access token required' });
    const { mediaId } = req.params;
    const insightsResponse = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}/insights`, {
      params: {
        access_token,
        metric: 'impressions,reach,engagement,saved,video_views,video_view_time'
      }
    });
    const insightsData = insightsResponse.data.data || [];
    const insights = {};
    for (const metric of insightsData) {
      insights[metric.name] = metric.values[0]?.value;
    }
    res.json({ insights });
  } catch (e) {
    console.error('Error in getMediaInsights:', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.error?.message || e.message });
  }
};

// Get media comments
exports.getMediaComments = async (req, res) => {
  try {
    const access_token = getAccessToken(req);
    if (!access_token) return res.status(401).json({ error: 'Access token required' });
    const { mediaId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const commentsResponse = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}/comments`, {
      params: {
        access_token,
        fields: 'from,text,timestamp,like_count',
        limit
      }
    });
    const commentsData = commentsResponse.data.data || [];
    res.json({ comments: commentsData });
  } catch (e) {
    console.error('Error in getMediaComments:', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.error?.message || e.message });
  }
};

// Clear cache
exports.clearCache = async (req, res) => {
  Object.keys(instagramAnalyticsCache).forEach(key => delete instagramAnalyticsCache[key]);
  res.json({ message: 'Cache cleared successfully' });
};

// Get cache status
exports.getCacheStatus = async (req, res) => {
  res.json({
    cache_size: Object.keys(instagramAnalyticsCache).length,
    cache_keys: Object.keys(instagramAnalyticsCache),
    timestamp: new Date().toISOString()
  });
}; 