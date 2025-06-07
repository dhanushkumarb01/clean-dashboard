import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/youtube";

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Error handler helper
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.message || error.response.data?.error || error.message;
    
    if (error.response.status === 429) {
      throw new Error('YouTube API quota exceeded. Please try again tomorrow.');
    }
    
    if (error.response.status === 404) {
      throw new Error('No data found. Try adjusting your search criteria.');
    }
    
    throw new Error(message);
  } else if (error.code === 'ECONNABORTED') {
    throw new Error('Request timed out. Please try again.');
  } else if (!error.response) {
    throw new Error('Network error. Please check your connection.');
  }
  
  throw error;
};

// Fetch dashboard data (total channels, comments, unique authors, etc.)
export async function fetchDashboard() {
  try {
    const res = await api.get('/dashboard');
    return res.data;
  } catch (err) {
    console.error('Error fetching dashboard:', err);
    throw handleApiError(err);
  }
}

// Fetch detailed user data by userId
export async function fetchUser(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const res = await api.get(`/user/${encodeURIComponent(userId)}`);
    return res.data;
  } catch (err) {
    console.error('Error fetching user data:', err);
    throw handleApiError(err);
  }
}

// Fetch most active users
export async function fetchMostActiveUsers() {
  try {
    const res = await api.get('/users');
    return res.data;
  } catch (err) {
    console.error('Error fetching most active users:', err);
    throw handleApiError(err);
  }
}