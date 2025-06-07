import React from "react";
import PropTypes from "prop-types";
import BarChart from "./BarChart";
import PieChart from "./PieChart";
import "../styles/CommentStatistics.css";

// Section for comment statistics with bar and pie charts
const CommentStatistics = ({ timeline, distribution }) => (
  <div className="comment-statistics-section">
    <div className="section-title">Comment Statistics</div>
    <div className="charts-row">
      <BarChart data={timeline} />
      <PieChart data={distribution} />
    </div>
  </div>
);

CommentStatistics.propTypes = {
  timeline: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ).isRequired,
  distribution: PropTypes.arrayOf(
    PropTypes.shape({
      channelId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default CommentStatistics;