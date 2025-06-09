import React from "react";
import PropTypes from "prop-types";
import "../styles/ActivitySummaryCard.css";

// Card for YouTube channel activity summary: total views, subscribers, videos, comments
const ActivitySummaryCard = ({ views, subscribers, videos, comments, lastUpdated }) => (
  <div className="card activity-summary-card">
    <div className="card-title">Channel Activity Summary</div>
    <div className="card-content">
      <div>
        <span className="label">Total Views:</span>
        <span className="value">{views?.toLocaleString() ?? 'N/A'}</span>
      </div>
      <div>
        <span className="label">Subscribers:</span>
        <span className="value">{subscribers?.toLocaleString() ?? 'N/A'}</span>
      </div>
      <div>
        <span className="label">Total Videos:</span>
        <span className="value">{videos?.toLocaleString() ?? 'N/A'}</span>
      </div>
      <div>
        <span className="label">Total Comments:</span>
        <span className="value">{comments?.toLocaleString() ?? 'N/A'}</span>
      </div>
      <div className="last-updated">
        <span className="text-sm text-gray-500">
          Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'N/A'}
        </span>
      </div>
    </div>
  </div>
);

ActivitySummaryCard.propTypes = {
  views: PropTypes.number,
  subscribers: PropTypes.number,
  videos: PropTypes.number,
  comments: PropTypes.number,
  lastUpdated: PropTypes.string
};

export default ActivitySummaryCard;