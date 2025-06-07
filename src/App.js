import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import Header from "./components/Header";
import AuthorDetailsCard from "./components/AuthorDetailsCard";
import ActivitySummaryCard from "./components/ActivitySummaryCard";
import CommentStatistics from "./components/CommentStatistics";
import "./App.css";

// Main App layout for the dashboard
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/user/:id" element={<UserDashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
