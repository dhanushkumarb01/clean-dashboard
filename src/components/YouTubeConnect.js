import React, { useState } from 'react';

const YouTubeConnect = () => {
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Start OAuth flow
  const handleConnect = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/youtube/auth');
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      setError('Failed to start YouTube OAuth flow.');
      setLoading(false);
    }
  };

  // Step 2: After redirect, fetch channel and videos
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('youtube_auth') === 'success') {
      setLoading(true);
      Promise.all([
        fetch('/api/youtube/channel').then(r => r.json()),
        fetch('/api/youtube/videos').then(r => r.json())
      ]).then(([ch, vids]) => {
        setChannel(ch);
        setVideos(Array.isArray(vids) ? vids : []);
        setLoading(false);
      }).catch(() => {
        setError('Failed to fetch YouTube data.');
        setLoading(false);
      });
    }
  }, []);

  return (
    <div>
      {!channel && (
        <button
          onClick={handleConnect}
          disabled={loading}
          style={{
            background: '#ff0000', color: '#fff', border: 'none', borderRadius: 4, padding: '12px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginBottom: 24
          }}
        >
          {loading ? 'Connecting...' : 'Connect YouTube'}
        </button>
      )}
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {channel && (
        <div style={{ marginBottom: 32 }}>
          <img src={channel.thumbnail} alt="Channel Icon" style={{ borderRadius: '50%', width: 80, height: 80 }} />
          <h2 style={{ fontSize: 24, margin: '12px 0 4px' }}>{channel.title}</h2>
          <div style={{ color: '#666' }}>{channel.subscribers} subscribers</div>
        </div>
      )}
      {videos.length > 0 && (
        <div>
          <h3 style={{ fontSize: 20, marginBottom: 12 }}>Recent Uploads</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {videos.map(video => (
              <div key={video.id} style={{ width: 240, background: '#fafafa', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 12 }}>
                <img src={video.thumbnail} alt={video.title} style={{ width: '100%', borderRadius: 6 }} />
                <div style={{ fontWeight: 600, margin: '8px 0 4px' }}>{video.title}</div>
                <div style={{ color: '#888', fontSize: 13 }}>{new Date(video.publishedAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeConnect;
