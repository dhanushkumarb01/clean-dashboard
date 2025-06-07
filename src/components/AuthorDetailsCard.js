import React from "react";
import PropTypes from "prop-types";
import "../styles/AuthorDetailsCard.css";

// Card for author details: username and total comments
const AuthorDetailsCard = ({ username, totalComments }) => (
  <div className="card author-details-card">
    <div className="card-title">Author Details</div>
    <div className="card-content">
      <div>
        <span className="label">Username:</span>
        <span className="value">{username}</span>
      </div>
      <div>
        <span className="label">Total Comments:</span>
        <span className="value">{totalComments}</span>
      </div>
    </div>
  </div>
);

AuthorDetailsCard.propTypes = {
  username: PropTypes.string.isRequired,
  totalComments: PropTypes.number.isRequired
};

export default AuthorDetailsCard;