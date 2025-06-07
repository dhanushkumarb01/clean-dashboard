const { getAuthUrl, getTokensAndUserData, fetchAndStoreYouTubeData, getDashboardStatsFromDB, getMostActiveUsersFromDB, getUserDetailsFromDB } = require('../utils/youtubeApi');

exports.login = async (req, res) => {
  try {
    const url = getAuthUrl();
    res.redirect(url);
  } catch (err) {
    res.status(500).json({ error: 'Failed to start OAuth login' });
  }
};

exports.oauth2callback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: 'No code provided' });
    const { tokens } = await getTokensAndUserData(code);
    await fetchAndStoreYouTubeData(tokens, req.user.email);
    res.redirect('/');
  } catch (err) {
    res.status(500).json({ error: 'OAuth callback failed', details: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await getDashboardStatsFromDB(req.user.email);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

exports.getMostActiveUsers = async (req, res) => {
  try {
    const users = await getMostActiveUsersFromDB(req.user.email);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    const details = await getUserDetailsFromDB(userId, req.user.email);
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
}; 