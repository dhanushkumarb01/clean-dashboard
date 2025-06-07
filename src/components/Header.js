import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";

// Header component: Black bar, title, subtitle, input, and button
const Header = () => {
  const [authorInput, setAuthorInput] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authorInput.trim()) {
      navigate(`/user/${authorInput.trim()}`);
    }
  };

  return (
    <header className="header">
      <div className="header-title">YouTube Report</div>
      <div className="header-subtitle">
        Enter a YouTube author to generate a report
      </div>
      <form onSubmit={handleSubmit} className="author-input-row">
        <input
          className="author-input"
          type="text"
          value={authorInput}
          onChange={(e) => setAuthorInput(e.target.value)}
          placeholder="Enter username (e.g. @username)"
        />
        <button
          type="submit"
          className="generate-btn"
          disabled={!authorInput.trim()}
        >
          Generate Report
        </button>
      </form>
    </header>
  );
};

export default Header;