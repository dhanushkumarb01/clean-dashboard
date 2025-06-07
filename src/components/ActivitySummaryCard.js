import React from "react";
import PropTypes from "prop-types";
import "../styles/ActivitySummaryCard.css";

// Card for activity summary: total likes, average likes, max likes
const ActivitySummaryCard = ({ totalLikes, avgLikes, maxLikes }) => (
  <div className="card activity-summary-card">
    <div className="card-title">Activity Summary</div>
    <div className="card-content">
      <div>
        <span className="label">Total Likes:</span>
        <span className="value">{totalLikes}</span>
      </div>
      <div>
        <span className="label">Average Likes:</span>
        <span className="value">{avgLikes}</span>
      </div>
      <div>
        <span className="label">Max Likes:</span>
        <span className="value">{maxLikes}</span>
      </div>
    </div>
  </div>
);

ActivitySummaryCard.propTypes = {
  totalLikes: PropTypes.number.isRequired,
  avgLikes: PropTypes.number.isRequired,
  maxLikes: PropTypes.number.isRequired
};

export default ActivitySummaryCard;